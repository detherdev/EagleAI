"use client"

import VideoInterface from "@/components/video-interface-v0"
import { Navigation } from "@/components/navigation"
import { motion } from "framer-motion"

export default function VideoPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <VideoInterface />
        </div>
      </main>
    </>
  )
}

