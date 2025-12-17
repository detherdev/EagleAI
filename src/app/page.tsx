"use client"

import { useState } from "react"
import UnifiedVisionInterface from "@/components/unified-vision-interface"
import { Navigation } from "@/components/navigation"

export default function Home() {
  const [mode, setMode] = useState<'text' | 'box' | 'tracker'>('text')

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background flex justify-center pt-8">
        <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <UnifiedVisionInterface mode={mode} onModeChange={setMode} />
        </div>
      </main>
    </>
  )
}

