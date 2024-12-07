'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Paperclip, Send, RefreshCw, Minus, Trash, Globe, Plus, Menu, Search, Sun, Moon, Download, Palette } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from 'react-markdown'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { SearchWithinChat } from '@/components/SearchWithinChat'
import { ExportOptions } from '@/components/ExportOptions'
import { ThemeCustomizer } from '@/components/ThemeCustomizer'

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

export default function PlawAIInterface() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isHovering, setIsHovering] = useState(false)
  const [webAccessEnabled, setWebAccessEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [newChatMood, setNewChatMood] = useState<'casual' | 'technical' | 'creative'>('casual')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedChats = localStorage.getItem('plawai-chats')
    if (savedChats) {
      setChats(JSON.parse(savedChats))
    }
    const savedTheme = localStorage.getItem('plawai-theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('plawai-chats', JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    if (chats.length > 0 && !currentChatId) {
      setCurrentChatId(chats[0].id)
    }
  }, [chats, currentChatId])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('plawai-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [currentChatId, chats])

  const handleSendMessage = async () => {
    if (inputMessage.trim() && currentChatId) {
      const newMessage: Message = { role: 'user', content: inputMessage }
      setChats(prevChats => prevChats.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      ))
      setInputMessage('')
      setIsLoading(true)

      try {
        const currentChat = chats.find(chat => chat.id === currentChatId)
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage,
            history: currentChat?.messages,
            webAccessEnabled: webAccessEnabled,
            mood: currentChat?.mood,
          }),
        })

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Failed to get response reader')
        }

        let assistantMessage = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = new TextDecoder().decode(value)
          assistantMessage += chunk
          setChats(prevChats => prevChats.map(chat => 
            chat.id === currentChatId 
              ? { ...chat, messages: [...chat.messages.slice(0, -1), { role: 'assistant', content: assistantMessage }] }
              : chat
          ))
        }
      } catch (error) {
        console.error('Error:', error)
        setChats(prevChats => prevChats.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }] }
            : chat
        ))
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleClearChat = () => {
    if (currentChatId) {
      setChats(prevChats => prevChats.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: [] }
          : chat
      ))
    }
  }

  const toggleWebAccess = () => {
    setWebAccessEnabled(prev => !prev)
    const status = !webAccessEnabled ? 'enabled' : 'disabled'
    if (currentChatId) {
      setChats(prevChats => prevChats.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: `Web access ${status}.` }] }
          : chat
      ))
    }
  }

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: newChatTitle || `New Chat ${chats.length + 1}`,
      messages: [],
      mood: newChatMood,
    }
    setChats(prevChats => [...prevChats, newChat])
    setCurrentChatId(newChat.id)
    setIsNewChatDialogOpen(false)
    setNewChatTitle('')
    setNewChatMood('casual')
  }

  const deleteChat = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(chats[0]?.id || null)
    }
  }

  const renameChat = (chatId: string, newTitle: string) => {
    setChats(prevChats => prevChats.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: newTitle }
        : chat
    ))
  }

  const currentChat = chats.find(chat => chat.id === currentChatId)

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Chats</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="h-[calc(100vh-5rem)] p-4">
            {chats.map(chat => (
              <div key={chat.id} className="flex items-center justify-between mb-2">
                <Button
                  variant={chat.id === currentChatId ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setCurrentChatId(chat.id)}
                >
                  {chat.title}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteChat(chat.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      <div className="hidden md:flex flex-col w-64 p-4 border-r border-border">
        <Button onClick={() => setIsNewChatDialogOpen(true)} className="mb-4">
          <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
        <ScrollArea className="flex-grow">
          {chats.map(chat => (
            <div key={chat.id} className="flex items-center justify-between mb-2">
              <Button
                variant={chat.id === currentChatId ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentChatId(chat.id)}
              >
                {chat.title}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteChat(chat.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </ScrollArea>
      </div>

      <div className="flex-grow flex flex-col">
        <Card className="flex flex-col h-full border-none rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-5 border-b border-border">
            <CardTitle className="text-base font-medium">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-lg font-semibold">PlawAI</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs font-normal">
                    Llama 3.3 70B-Versatile
                  </Badge>
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1 py-0.5 rounded">
                    NEW
                  </span>
                </div>
              </div>
            </CardTitle>
            <div className="flex space-x-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-9 w-9 ${webAccessEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                      onClick={toggleWebAccess}
                    >
                      <Globe className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{webAccessEnabled ? 'Disable' : 'Enable'} web access</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setIsSearchOpen(true)}
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search within chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setIsDarkMode(!isDarkMode)}
                    >
                      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle {isDarkMode ? 'light' : 'dark'} mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setIsExportOpen(true)}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setIsThemeCustomizerOpen(true)}
                    >
                      <Palette className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Customize theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 transition-all duration-300 ease-in-out ${
                        isHovering ? 'rotate-12 scale-110' : ''
                      }`}
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                      onClick={handleClearChat}
                    >
                      <Trash className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-auto p-4">
            <ScrollArea className="h-full">
              {currentChat?.messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`rounded-lg p-2 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t border-border">
            <div className="flex w-full items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Message PlawAI..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-grow"
                disabled={isLoading}
              />
              <Button size="icon" onClick={handleSendMessage} className="h-10 w-10" disabled={isLoading}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Chat Title"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            className="mb-4"
          />
          <Select value={newChatMood} onValueChange={(value: 'casual' | 'technical' | 'creative') => setNewChatMood(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={createNewChat}>Create Chat</Button>
        </DialogContent>
      </Dialog>

      <SearchWithinChat
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        messages={currentChat?.messages || []}
      />

      <ExportOptions
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        chat={currentChat}
      />

      <ThemeCustomizer
        isOpen={isThemeCustomizerOpen}
        onClose={() => setIsThemeCustomizerOpen(false)}
      />
    </div>
  )
}

