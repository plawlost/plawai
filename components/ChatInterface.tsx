import MessageBubble from './MessageBubble'
import SearchResult from './SearchResult'

export default function ChatInterface({ messages, isLoading, isSearching }) {
  return (
    <div className="flex flex-col space-y-4 p-4 overflow-y-auto h-full">
      {messages.map((message, index) => (
        message.type === 'search' ? (
          <SearchResult key={index} {...message} />
        ) : (
          <MessageBubble key={index} {...message} />
        )
      ))}
      {isLoading && <div className="typing-indicator"><span></span><span></span><span></span></div>}
      {isSearching && <div className="text-center text-muted-foreground">Searching...</div>}
    </div>
  )
}

