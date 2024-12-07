import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SearchWithinChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

export function SearchWithinChat({ isOpen, onClose, messages }: SearchWithinChatProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Message[]>([])

  const handleSearch = () => {
    const results = messages.filter(message => 
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setSearchResults(results)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search Within Chat</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Enter search query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
        <ScrollArea className="mt-4 h-[300px]">
          {searchResults.map((message, index) => (
            <div key={index} className="mb-4">
              <div className={`p-2 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

