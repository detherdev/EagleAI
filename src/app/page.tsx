"use client"

import UnifiedVisionInterface from "@/components/unified-vision-interface"
import { Navigation } from "@/components/navigation"
import { Tabs, TabsContent } from "@/components/ui/tabs"

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background flex justify-center pt-8">
        <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* @ts-ignore - Radix UI type compatibility issue with React 18 */}
          <Tabs defaultValue="text" className="w-full">
            <TabsContent value="text" className="mt-0">
              <UnifiedVisionInterface mode="text" />
            </TabsContent>
            
            <TabsContent value="box" className="mt-0">
              <UnifiedVisionInterface mode="box" />
            </TabsContent>
            
            <TabsContent value="tracker" className="mt-0">
              <UnifiedVisionInterface mode="tracker" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}

