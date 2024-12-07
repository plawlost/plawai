import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import * as schema from "../db/schema";
import { Groq } from "groq-sdk";
import type { ChatCompletion } from "groq-sdk/resources/chat/completions";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required API keys
if (!process.env.GROQ_API_KEY || !process.env.BRAVE_API_KEY) {
  throw new Error("GROQ_API_KEY and BRAVE_API_KEY must be set in .env file");
}

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize SQLite database
const sqlite = new Database(path.join(__dirname, "../database.db"));
const db = drizzle(sqlite);

// Types
interface SearchResult {
  title: string;
  description: string;
  url: string;
}

interface BraveSearchResult extends SearchResult {}

interface BraveSearchResponse {
  web?: {
    results?: BraveSearchResult[];
  };
}

type Role = "system" | "user" | "assistant";

interface ChatMessage {
  role: Role;
  content: string;
}

interface ProcessedSearchResult {
  summary: string;
  sources: Array<{
    title: string;
    url: string;
  }>;
}

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatCompletionMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Logging utility
function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}

// Search function
async function performSearch(query: string, webAccessEnabled: boolean): Promise<SearchResult[] | null> {
  if (!query.trim() || !webAccessEnabled) return null;

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": process.env.BRAVE_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      console.error("Search error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json() as BraveSearchResponse;
    if (!data.web?.results) return null;

    return data.web.results
      .filter(
        (result) =>
          result.title &&
          result.description &&
          result.url &&
          !result.url.includes("/ads/")
      )
      .map((result) => ({
        title: result.title,
        description: result.description,
        url: result.url,
      }));
  } catch (error) {
    console.error("Search error:", error);
    return null;
  }
}

// Process search results
async function processSearchResults(query: string, webAccessEnabled: boolean): Promise<ProcessedSearchResult | null> {
  const results = await performSearch(query, webAccessEnabled);
  if (!results || results.length === 0) return null;

  const filteredResults = results.slice(0, 3);
  return {
    summary: filteredResults.map((r) => r.description).join("\n\n"),
    sources: filteredResults.map((r) => ({
      title: r.title,
      url: r.url,
    })),
  };
}

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Chat endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "text/plain");

    const { message, history, webAccessEnabled, mood } = req.body as { 
      message?: string; 
      history?: ChatMessage[]; 
      webAccessEnabled?: boolean;
      mood?: 'casual' | 'technical' | 'creative';
    };

    if (!message?.trim()) {
      res.write("Error: Message is required");
      res.end();
      return;
    }

    const chatHistory = (history || []) as ChatMessage[];
    const systemMessage: ChatMessage = {
      role: "system",
      content: `You are PlawAI, an advanced AI assistant created by PlawLabs, a software company based in Covent Garden, London, UK, led by CEO Yaz Celebi.

${webAccessEnabled ? `
- Decide when to search; if not needed, don't search.
- If you need more info, use: 🔍 SEARCH: "your query"
- After receiving search results, integrate them into your final answer.
- When using search results, provide citations with their URLs.
- Make it clear if the information is from web search.
` : `
- Web access is currently disabled. You cannot perform web searches or access external information.
- Respond based on your existing knowledge and the conversation history only.
`}
- Use markdown for formatting.
- Only include Sources section when using web search results.
${mood ? `- Adjust your responses to be more ${mood} in tone and content.` : ''}`,
    };

    // Create chat completion with streaming
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage.content },
        ...chatHistory,
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.9,
      max_tokens: 2048,
      stream: true,
    }) as AsyncIterable<ChatCompletion>;

    // Handle streaming response
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.message?.content;
      if (content) {
        // Send chunk to client
        res.write(content);
      }
    }

    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.write(`Error: ${error instanceof Error ? error.message : "Failed to process chat message"}`);
    res.end();
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// Static file serving setup
if (app.get("env") === "development") {
  const { setupVite } = await import("./vite");
  await setupVite(app, server);
} else {
  const { serveStatic } = await import("./vite");
  serveStatic(app);
}

// Start server
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// Graceful shutdown
function shutdown() {
  server.close(() => {
    sqlite.close();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(Number(PORT), "0.0.0.0", () => {
  log(`Server running on port ${PORT}`);
  log(`Database initialized at ${path.join(__dirname, "../database.db")}`);
});

