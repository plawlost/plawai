import { useState, useRef, useEffect } from 'react'
import { Send, Mic, Bold, Italic, Code } from 'lucide-react'

export default function InputArea({ onSendMessage }) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertMarkdown = (tag) => {
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const newMessage = message.substring(0, start) + `${tag}${message.substring(start, end)}${tag}` + message.substring(end)
    setMessage(newMessage)
  }

  return (
    <div className="p-4 bg-accent">
      <div className="flex space-x-2 mb-2">
        <button onClick={() => insertMarkdown('**')} className="p-2 rounded-full hover:bg-muted transition-colors duration-200">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown('*')} className="p-2 rounded-full hover:bg-muted transition-colors duration-200">
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown('`')} className="p-2 rounded-full hover:bg-muted transition-colors duration-200">
          <Code className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-end space-x-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow p-2 bg-muted text-foreground rounded-lg resize-none overflow-hidden"
          rows={1}
        />
        <button 
          onClick={handleSend}
          className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors duration-200"
        >
          <Send className="w-6 h-6" />
        </button>
        <button className="p-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90 transition-colors duration-200">
          <Mic className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

