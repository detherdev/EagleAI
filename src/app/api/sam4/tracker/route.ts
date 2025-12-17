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
    const multimask = formData.get("multimask") === "true"

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    tempFilePath = join(tmpdir(), `sam4-tracker-${Date.now()}-${image.name}`)
    await writeFile(tempFilePath, buffer)

    const client = await Client.connect(HF_SPACE_URL, {
      hf_token: process.env.HF_TOKEN as `hf_${string}` | undefined,
    })

    console.log("Calling tracker API with multimask:", multimask)
    
    const result = await client.predict("/process_image_tracker_wrapper", {
      image: handle_file(tempFilePath),
      multimask: multimask,
    })

    console.log("Tracker API result:", JSON.stringify(result, null, 2))

    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }

    // The result should be a single image (dict with url/path)
    // Check if result.data is directly the image object or wrapped
    let resultImage: { url?: string; path?: string } | null = null
    
    if (result.data && typeof result.data === 'object') {
      // If it's already an object with url/path
      if ('url' in result.data || 'path' in result.data) {
        resultImage = result.data as { url?: string; path?: string }
      }
      // If it's an array, take the first element
      else if (Array.isArray(result.data) && result.data.length > 0) {
        resultImage = (result.data as any[])[0] as { url?: string; path?: string }
      }
    }

    return NextResponse.json({
      success: true,
      result_image_url: resultImage?.url || resultImage?.path || null,
      full_response: result.data,
    })
  } catch (error) {
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }
    console.error("Error processing SAM4 tracker request:", error)
    
    // Log more details about the error
    if (typeof error === 'object' && error !== null) {
      console.error("Error details:", JSON.stringify(error, null, 2))
    }
    
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error instanceof Error ? error.message : typeof error === 'object' && error !== null ? JSON.stringify(error) : "Unknown error",
      },
      { status: 500 }
    )
  }
}

