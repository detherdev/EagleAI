"use client"

import { useState, useEffect } from "react"
import { Info, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface APIInfo {
  success: boolean
  spaceUrl: string
  spaceName?: string
  apiInfo?: unknown
  endpoints?: unknown[]
  error?: string
}

export function APIInfoPanel() {
  const [apiInfo, setApiInfo] = useState<APIInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  async function fetchAPIInfo() {
    setIsLoading(true)
    try {
      const response = await fetch('/api/info')
      const data = await response.json()
      setApiInfo(data)
    } catch (error) {
      setApiInfo({
        success: false,
        spaceUrl: "https://daveyRI-SAM4.hf.space",
        error: error instanceof Error ? error.message : "Failed to fetch API info",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAPIInfo()
  }, [])

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="h-12 w-12 rounded-full bg-[#d4b5a0] hover:bg-[#c9a890] shadow-lg hover:shadow-xl transition-all"
        >
          <Info className="h-5 w-5 text-gray-900" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <Card className="soft-card shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">API Information</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={fetchAPIInfo}
                variant="ghost"
                size="icon"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
          <CardDescription>
            Hugging Face Space Connection Status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiInfo ? (
            <>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm font-medium">Status</span>
                <span className={`text-sm ${apiInfo.success ? 'text-green-600' : 'text-red-600'}`}>
                  {apiInfo.success ? '✓ Connected' : '✗ Error'}
                </span>
              </div>
              
              <div className="p-2 bg-muted rounded">
                <p className="text-xs font-medium mb-1">Space URL</p>
                <a 
                  href={apiInfo.spaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {apiInfo.spaceUrl}
                </a>
              </div>

              {apiInfo.spaceName && (
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs font-medium mb-1">Space Name</p>
                  <p className="text-xs text-muted-foreground">{apiInfo.spaceName}</p>
                </div>
              )}

              {apiInfo.error && (
                <div className="p-2 border border-destructive bg-destructive/10 rounded">
                  <p className="text-xs font-medium text-destructive mb-1">Error</p>
                  <p className="text-xs text-destructive/80">{apiInfo.error}</p>
                  {apiInfo.message && (
                    <p className="text-xs text-destructive/70 mt-2 whitespace-pre-wrap">{apiInfo.message}</p>
                  )}
                  {apiInfo.instructions && (
                    <p className="text-xs text-destructive/70 mt-2 whitespace-pre-wrap">{apiInfo.instructions}</p>
                  )}
                </div>
              )}

              {apiInfo.endpoints && apiInfo.endpoints.length > 0 && (
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs font-medium mb-1">Available Endpoints</p>
                  <p className="text-xs text-muted-foreground">
                    {apiInfo.endpoints.length} endpoint(s) available
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Loading API information...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

