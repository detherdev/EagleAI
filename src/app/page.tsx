"use client"

import VisionInterface from "@/components/vision-interface-v0"
import TrackerInterface from "@/components/tracker-interface"
import { Navigation } from "@/components/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MousePointer } from "lucide-react"

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* @ts-ignore - Radix UI type compatibility issue with React 18 */}
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Search className="size-4" />
                Text Detection
              </TabsTrigger>
              <TabsTrigger value="tracker" className="flex items-center gap-2">
                <MousePointer className="size-4" />
                Interactive Tracker
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="mt-0">
              <VisionInterface />
            </TabsContent>
            
            <TabsContent value="tracker" className="mt-0">
              <TrackerInterface />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}

