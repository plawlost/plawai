import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function MessageBubble({ type, content }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3/4 p-4 rounded-lg ${
        type === 'user' 
          ? 'gradient-bg text-white' 
          : 'bg-accent neon-border'
      }`}>
        <ReactMarkdown 
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          className="prose prose-invert max-w-none"
        >
          {content}
        </ReactMarkdown>
        {type === 'ai' && (
          <button 
            onClick={copyToClipboard} 
            className="mt-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

