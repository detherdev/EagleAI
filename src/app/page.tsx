"use client"

import UniversalMediaInterface from "@/components/universal-media-interface"
import { Navigation } from "@/components/navigation"

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background flex justify-center pt-8">
        <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <UniversalMediaInterface />
        </div>
      </main>
    </>
  )
}

