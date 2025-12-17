import { Client } from "@gradio/client"

interface SAM4Response {
  data: unknown[]
  duration?: number
}

const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || "https://daveyRI-SAM4.hf.space"

/**
 * Server-side API call to SAM4 Hugging Face Space
 * This uses the official Gradio client for direct connection
 */
export async function callSAM4Server(
  image: Blob | File,
  prompt?: string
): Promise<SAM4Response> {
  try {
    // Connect to the Gradio Space
    const client = await Client.connect(HF_SPACE_URL)
    
    // Get API info to understand available endpoints
    const apiInfo = await client.view_api()
    console.log("Available API endpoints:", apiInfo)
    
    // Call the predict function
    // Note: The endpoint name might need adjustment based on your Space's API
    const result = await client.predict("/predict", {
      image: image,
      text: prompt || "",
    })

    return {
      data: result.data as unknown[],
      duration: result.duration,
    }
  } catch (error) {
    console.error('Error calling SAM4 API:', error)
    throw new Error(`Failed to connect to SAM4 Space: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get information about the SAM4 Space API
 */
export async function getSAM4APIInfo() {
  try {
    const client = await Client.connect(HF_SPACE_URL)
    return await client.view_api()
  } catch (error) {
    console.error('Error getting API info:', error)
    throw error
  }
}

