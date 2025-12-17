import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const imageUrl = request.nextUrl.searchParams.get("url")
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 }
      )
    }

    // Fetch the image from Hugging Face with authentication
    const response = await fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/webp'

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error("Error proxying image:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch image",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

