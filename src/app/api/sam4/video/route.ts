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
    const video = formData.get("video") as File
    const textPrompt = formData.get("prompt") as string || ""
    const maxFrames = parseFloat(formData.get("maxFrames") as string || "50")
    const timeoutSecondsStr = formData.get("timeoutSeconds") as string || "60"
    const timeoutSeconds = parseInt(timeoutSecondsStr) as 60 | 120

    if (!video) {
      return NextResponse.json(
        { error: "No video provided" },
        { status: 400 }
      )
    }

    // Save video to temporary file for Gradio client
    const bytes = await video.arrayBuffer()
    const buffer = Buffer.from(bytes)
    tempFilePath = join(tmpdir(), `sam4-video-${Date.now()}-${video.name}`)
    await writeFile(tempFilePath, buffer)

    // Connect to the Gradio Space using official client with HF token for private spaces
    const client = await Client.connect(HF_SPACE_URL, {
      hf_token: process.env.HF_TOKEN as `hf_${string}` | undefined,
    })
    
    // Call the /process_video_text endpoint
    const result = await client.predict("/process_video_text", {
      video_path: handle_file(tempFilePath),
      text_prompt: textPrompt,
      max_frames: maxFrames,
      timeout_seconds: timeoutSeconds,
    })

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      duration: (result as any).duration,
      result_video: (result.data as any[])[0], // First element is the result video
      status: (result.data as any[])[1], // Second element is the status text
    })
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }
    
    console.error("Error processing SAM4 video request:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to process video",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

