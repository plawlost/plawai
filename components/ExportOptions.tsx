import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  mood: 'casual' | 'technical' | 'creative';
}

interface ExportOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat | undefined;
}

export function ExportOptions({ isOpen, onClose, chat }: ExportOptionsProps) {
  const exportAsText = () => {
    if (!chat) return;
    const content = chat.messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title}.txt`;
    a.click();
  }

  const exportAsMarkdown = () => {
    if (!chat) return;
    const content = chat.messages.map(m => `**${m.role}**: ${m.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title}.md`;
    a.click();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Chat</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <Button onClick={exportAsText}>Export as Text</Button>
          <Button onClick={exportAsMarkdown}>Export as Markdown</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

