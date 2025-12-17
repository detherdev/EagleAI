"use client"

import Link from "next/link"

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-bold text-lg text-gray-900">
              EagleAI
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              AI-Powered Vision Analysis
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

