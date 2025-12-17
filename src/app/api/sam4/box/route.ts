import { NextRequest, NextResponse } from "next/server"
import { Client, handle_file } from "@gradio/client"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || "https://daveyRI-SAM4.hf.space"

/**
 * POST endpoint for bounding box-based image segmentation
 * Accepts: image file, bounding box coordinates [x1, y1, x2, y2], multimask flag
 * Returns: segmented image with mask overlay
 */
export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null

  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const boxStr = formData.get('box') as string
    const multimask = formData.get('multimask') === 'true'

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    if (!boxStr) {
      return NextResponse.json(
        { error: 'No bounding box provided' },
        { status: 400 }
      )
    }

    // Parse box coordinates
    const box = JSON.parse(boxStr)
    if (!Array.isArray(box) || box.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid box format. Expected [x1, y1, x2, y2]' },
        { status: 400 }
      )
    }

    // Save uploaded file to temp location
    const buffer = Buffer.from(await image.arrayBuffer())
    tempFilePath = join(tmpdir(), `sam4-box-${Date.now()}-${image.name}`)
    await writeFile(tempFilePath, buffer)

    // Connect to the Gradio Space
    const client = await Client.connect(HF_SPACE_URL, {
      hf_token: process.env.HF_TOKEN as `hf_${string}` | undefined,
    })
    
    // Call the /process_image_box endpoint
    const result = await client.predict("/process_image_box", {
      image: handle_file(tempFilePath),
      box: box,
      multimask: multimask,
    })

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }

    // Extract the result
    const resultImage = (result.data as any[])[0]
    const mask = (result.data as any[])[1]

    return NextResponse.json({
      success: true,
      data: result.data,
      duration: (result as any).duration,
      result_image: {
        url: resultImage?.url || resultImage?.path,
        path: resultImage?.path,
      },
      mask: mask,
    })
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }
    
    console.error("Error processing SAM4 box request:", error)
    
    let errorMessage = "Failed to process image"
    let errorDetails = error instanceof Error ? error.message : "Unknown error"

    // Check for ZeroGPU quota error
    if (errorDetails.includes("ZeroGPU") || errorDetails.includes("quota")) {
      errorMessage = "GPU quota exceeded"
      errorDetails = "The Hugging Face ZeroGPU quota has been exceeded. Please try again later."
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

