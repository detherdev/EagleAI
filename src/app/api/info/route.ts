import { NextResponse } from "next/server"
import { Client } from "@gradio/client"

const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || "https://daveyRI-SAM4.hf.space"

/**
 * GET endpoint to retrieve detailed information about the SAM4 Space
 * This helps developers understand the API structure
 */
export async function GET() {
  try {
    const client = await Client.connect(HF_SPACE_URL, {
      hf_token: process.env.HF_TOKEN as `hf_${string}` | undefined,
    })
    const apiInfo = await client.view_api()
    
    return NextResponse.json({
      success: true,
      spaceUrl: HF_SPACE_URL,
      spaceName: "daveyRI/SAM4",
      apiInfo: apiInfo,
      endpoints: apiInfo.named_endpoints || [],
      description: "SAM4 Vision API - Segment Anything Model",
    })
  } catch (error) {
    console.error("Error getting API info:", error)
    
    // Return helpful info even if connection fails
    return NextResponse.json({
      success: false,
      error: "Space not found or not accessible",
      details: error instanceof Error ? error.message : "Unknown error",
      spaceUrl: HF_SPACE_URL,
      message: "The Space 'daveyRI/SAM4' does not exist. Please update NEXT_PUBLIC_HF_SPACE_URL in .env.local with your actual Space URL.",
      availableSpaces: [
        "daveyRI/anycoder-d7773a6b (found in your HF account)"
      ],
      instructions: "To use this app:\n1. Create a SAM4 Space on Hugging Face, OR\n2. Update the Space URL to an existing SAM Space, OR\n3. Use a public SAM Space like 'facebook/sam-vit-huge'"
    })
  }
}

