import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeCustomizer({ isOpen, onClose }: ThemeCustomizerProps) {
  const [hue, setHue] = useState(252)
  const [saturation, setSaturation] = useState(100)
  const [lightness, setLightness] = useState(67)

  const applyTheme = () => {
    document.documentElement.style.setProperty('--primary-hue', hue.toString());
    document.documentElement.style.setProperty('--primary-saturation', `${saturation}%`);
    document.documentElement.style.setProperty('--primary-lightness', `${lightness}%`);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Customize Theme</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Hue</Label>
            <Slider
              min={0}
              max={360}
              step={1}
              value={[hue]}
              onValueChange={(value) => setHue(value[0])}
            />
          </div>
          <div>
            <Label>Saturation</Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[saturation]}
              onValueChange={(value) => setSaturation(value[0])}
            />
          </div>
          <div>
            <Label>Lightness</Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[lightness]}
              onValueChange={(value) => setLightness(value[0])}
            />
          </div>
          <Button onClick={applyTheme}>Apply Theme</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

