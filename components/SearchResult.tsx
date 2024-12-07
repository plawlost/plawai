import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

export default function SearchResult({ content, source, url }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-muted rounded-lg p-4 neon-border">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{source}</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">{content}</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            Visit source <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        </div>
      )}
    </div>
  )
}

