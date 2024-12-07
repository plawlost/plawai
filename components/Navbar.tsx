import { Settings, HelpCircle } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-accent">
      <div className="text-2xl font-bold neon-text">PlawAI</div>
      <div className="flex space-x-4">
        <button className="p-2 rounded-full hover:bg-muted transition-colors duration-200">
          <Settings className="w-6 h-6" />
        </button>
        <button className="p-2 rounded-full hover:bg-muted transition-colors duration-200">
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>
    </nav>
  )
}

