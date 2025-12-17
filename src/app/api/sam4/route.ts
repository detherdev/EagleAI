import { NextRequest, NextResponse } from "next/server"
import { Client, handle_file } from "@gradio/client"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || "https://daveyRI-SAM4.hf.space"

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const textPrompt = formData.get("prompt") as string || ""
    const threshold = parseFloat(formData.get("threshold") as string || "0.5")
    const maskThreshold = parseFloat(formData.get("maskThreshold") as string || "0.5")

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    // Save image to temporary file for Gradio client
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    tempFilePath = join(tmpdir(), `sam4-${Date.now()}-${image.name}`)
    await writeFile(tempFilePath, buffer)

    // Connect to the Gradio Space using official client with HF token for private spaces
    const client = await Client.connect(HF_SPACE_URL, {
      hf_token: process.env.HF_TOKEN as `hf_${string}` | undefined,
    })
    
    // Call the /process_image_text endpoint with correct parameters
    const result = await client.predict("/process_image_text", {
      image: handle_file(tempFilePath),
      text_prompt: textPrompt,
      threshold: threshold,
      mask_threshold: maskThreshold,
    })

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }

    // Extract the result properly
    const resultImage = (result.data as any[])[0] // First element is the result image object
    const details = (result.data as any[])[1] // Second element is the details text
    
    // Log for debugging
    console.log('API Result:', JSON.stringify(result.data, null, 2))
    console.log('Result Image:', resultImage)
    console.log('Result Image URL:', resultImage?.url)

    return NextResponse.json({
      success: true,
      data: result.data,
      duration: (result as any).duration,
      result_image: {
        url: resultImage?.url || resultImage?.path,
        path: resultImage?.path,
        orig_name: resultImage?.orig_name,
        size: resultImage?.size,
      },
      details: details,
    })
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }
    
    console.error("Error processing SAM4 request:", error)
    
    // Check if it's a GPU quota error
    let errorMessage = "Failed to process image"
    let errorDetails = "Unknown error"
    
    if (typeof error === 'object' && error !== null) {
      const err = error as any
      if (err.title === 'ZeroGPU quota exceeded' || err.message?.includes('quota exceeded')) {
        errorMessage = "GPU Quota Exceeded"
        errorDetails = err.message || "You have exceeded your GPU quota. Please try again later."
      } else if (error instanceof Error) {
        errorDetails = error.message
      } else {
        errorDetails = JSON.stringify(error)
      }
    } else if (error instanceof Error) {
      errorDetails = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve API information
export async function GET() {
  try {
    const client = await Client.connect(HF_SPACE_URL)
    const apiInfo = await client.view_api()
    
    return NextResponse.json({
      success: true,
      spaceUrl: HF_SPACE_URL,
      apiInfo: apiInfo,
    })
  } catch (error) {
    console.error("Error getting API info:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to connect to SAM4 Space",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

