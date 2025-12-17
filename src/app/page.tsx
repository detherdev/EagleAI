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
      <main className="min-h-screen bg-background flex items-start justify-center pt-8">
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* @ts-ignore - Radix UI type compatibility issue with React 18 */}
          <Tabs defaultValue="text" className="w-full">
            <TabsContent value="text" className="mt-0">
              <VisionInterface 
                tabsList={
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Search className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Text Prompt</span>
                      <span className="sm:hidden">Text</span>
                    </TabsTrigger>
                    <TabsTrigger value="box" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Box className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Bounding Box</span>
                      <span className="sm:hidden">Box</span>
                    </TabsTrigger>
                    <TabsTrigger value="tracker" className="flex items-center gap-2 text-xs sm:text-sm">
                      <MousePointer className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Auto Detect</span>
                      <span className="sm:hidden">Auto</span>
                    </TabsTrigger>
                  </TabsList>
                }
              />
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
              <TrackerInterface 
                tabsList={
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Search className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Text Prompt</span>
                      <span className="sm:hidden">Text</span>
                    </TabsTrigger>
                    <TabsTrigger value="box" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Box className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Bounding Box</span>
                      <span className="sm:hidden">Box</span>
                    </TabsTrigger>
                    <TabsTrigger value="tracker" className="flex items-center gap-2 text-xs sm:text-sm">
                      <MousePointer className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Auto Detect</span>
                      <span className="sm:hidden">Auto</span>
                    </TabsTrigger>
                  </TabsList>
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}

