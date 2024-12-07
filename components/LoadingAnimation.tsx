export default function LoadingAnimation({ isVisible }) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background bg-opacity-50 z-50">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

