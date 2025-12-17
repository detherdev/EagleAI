import { Client } from "@gradio/client"

interface HuggingFaceResponse {
  data: unknown[]
  duration?: number
}

interface SAM4Request {
  image: string | File | Blob
  prompt?: string
  [key: string]: unknown
}

const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || "https://daveyRI-SAM4.hf.space"

export async function callSAM4API(request: SAM4Request): Promise<HuggingFaceResponse> {
  try {
    // Connect to the Gradio Space using the official client
    const client = await Client.connect(HF_SPACE_URL)
    
    // Call the predict function with the image and optional prompt
    // The exact API endpoint name might vary - common names are "predict", "inference", etc.
    const result = await client.predict("/predict", {
      image: request.image,
      prompt: request.prompt || "",
    })

    return {
      data: result.data as unknown[],
      duration: result.duration,
    }
  } catch (error) {
    console.error('Error calling SAM4 API:', error)
    
    // Fallback to direct HTTP request if Gradio client fails
    try {
      const formData = new FormData()
      
      if (request.image instanceof File || request.image instanceof Blob) {
        formData.append('file', request.image)
      }
      
      const response = await fetch(`${HF_SPACE_URL}/api/predict`, {
        method: 'POST',
        body: JSON.stringify({
          data: [request.image, request.prompt || ""]
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (fallbackError) {
      console.error('Fallback API call also failed:', fallbackError)
      throw fallbackError
    }
  }
}

export async function uploadImageToAPI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(file.type)
}

