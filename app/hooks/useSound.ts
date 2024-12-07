import { useEffect, useRef } from 'react'

export function useSound(src: string) {
  const sound = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    sound.current = new Audio(src)
    return () => {
      if (sound.current) {
        sound.current.pause()
        sound.current = null
      }
    }
  }, [src])

  const play = () => {
    if (sound.current) {
      sound.current.currentTime = 0
      sound.current.play()
    }
  }

  return play
}

