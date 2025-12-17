"use client"

import VideoInterface from "@/components/video-interface-v0"
import { Navigation } from "@/components/navigation"
import { motion } from "framer-motion"

export default function VideoPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background flex justify-center pt-8">
        <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <VideoInterface />
        </div>
      </main>
    </>
  )
}

