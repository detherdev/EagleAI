"use client"

import VisionInterface from "@/components/vision-interface-v0"
import TrackerInterface from "@/components/tracker-interface"
import { Navigation } from "@/components/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MousePointer, Box } from "lucide-react"

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* @ts-ignore - Radix UI type compatibility issue with React 18 */}
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Search className="size-4" />
                Text Prompt
              </TabsTrigger>
              <TabsTrigger value="box" className="flex items-center gap-2">
                <Box className="size-4" />
                Bounding Box
              </TabsTrigger>
              <TabsTrigger value="tracker" className="flex items-center gap-2">
                <MousePointer className="size-4" />
                Auto Detect
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="mt-0">
              <VisionInterface />
            </TabsContent>
            
            <TabsContent value="box" className="mt-0">
              <div className="flex items-center justify-center p-12 text-center">
                <div className="space-y-4">
                  <Box className="size-16 mx-auto text-muted-foreground" />
                  <h3 className="text-xl font-semibold">Bounding Box Segmentation</h3>
                  <p className="text-muted-foreground max-w-md">
                    Draw a box around the object you want to segment. Coming soon with full drawing interface.
                  </p>
                </div>
              </div>
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

