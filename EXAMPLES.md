# API Usage Examples

This document provides examples of how to use the SAM4 Vision API in different scenarios.

## Table of Contents

- [Frontend Usage (React/Next.js)](#frontend-usage-reactnextjs)
- [Backend Usage (Node.js)](#backend-usage-nodejs)
- [cURL Examples](#curl-examples)
- [Python Examples](#python-examples)

## Frontend Usage (React/Next.js)

### Basic Image Upload and Processing

```typescript
async function processImage(file: File, prompt?: string) {
  const formData = new FormData()
  formData.append('image', file)
  if (prompt) formData.append('prompt', prompt)

  const response = await fetch('/api/sam4', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to process image')
  }

  return await response.json()
}

// Usage
const result = await processImage(myImageFile, "segment the main object")
console.log(result.data)
```

### With Error Handling and Loading States

```typescript
import { useState } from 'react'

function ImageProcessor() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(file: File) {
    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/sam4', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.details || 'Processing failed')
      }
      
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {isLoading && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}
```

## Backend Usage (Node.js)

### Direct Gradio Client Usage

```typescript
import { Client } from "@gradio/client"

async function processSAM4Image(imagePath: string, prompt?: string) {
  const client = await Client.connect("https://daveyRI-SAM4.hf.space")
  
  // Get API information
  const apiInfo = await client.view_api()
  console.log("Available endpoints:", apiInfo)
  
  // Process image
  const result = await client.predict("/predict", {
    image: imagePath,
    text: prompt || "",
  })
  
  return result
}

// Usage
const result = await processSAM4Image("./my-image.jpg", "segment objects")
console.log(result.data)
```

### Next.js API Route (Server-Side)

```typescript
// app/api/custom-sam4/route.ts
import { NextRequest, NextResponse } from "next/server"
import { Client } from "@gradio/client"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    
    const client = await Client.connect("https://daveyRI-SAM4.hf.space")
    const result = await client.predict("/predict", {
      image: await image.arrayBuffer(),
    })
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

## cURL Examples

### Basic Image Upload

```bash
curl -X POST http://localhost:3000/api/sam4 \
  -F "image=@/path/to/image.jpg"
```

### With Prompt

```bash
curl -X POST http://localhost:3000/api/sam4 \
  -F "image=@/path/to/image.jpg" \
  -F "prompt=segment the main object in the image"
```

### Get API Information

```bash
curl http://localhost:3000/api/info
```

### Pretty Print JSON Response

```bash
curl -X POST http://localhost:3000/api/sam4 \
  -F "image=@/path/to/image.jpg" \
  | jq '.'
```

## Python Examples

### Using Requests Library

```python
import requests

def process_image(image_path, prompt=None):
    url = "http://localhost:3000/api/sam4"
    
    with open(image_path, 'rb') as f:
        files = {'image': f}
        data = {'prompt': prompt} if prompt else {}
        
        response = requests.post(url, files=files, data=data)
        response.raise_for_status()
        
        return response.json()

# Usage
result = process_image("./my-image.jpg", "segment objects")
print(result)
```

### Direct Gradio Client (Python)

```python
from gradio_client import Client

client = Client("https://daveyRI-SAM4.hf.space")

# Get API info
api_info = client.view_api()
print(api_info)

# Process image
result = client.predict(
    "/predict",
    image="./my-image.jpg",
    text="segment the main object"
)

print(result)
```

### Async Python Example

```python
import aiohttp
import asyncio

async def process_image_async(image_path, prompt=None):
    url = "http://localhost:3000/api/sam4"
    
    async with aiohttp.ClientSession() as session:
        with open(image_path, 'rb') as f:
            data = aiohttp.FormData()
            data.add_field('image', f, filename='image.jpg')
            if prompt:
                data.add_field('prompt', prompt)
            
            async with session.post(url, data=data) as response:
                return await response.json()

# Usage
result = asyncio.run(process_image_async("./my-image.jpg"))
print(result)
```

## Advanced Examples

### Batch Processing Multiple Images

```typescript
async function processBatch(files: File[]) {
  const results = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/sam4', {
        method: 'POST',
        body: formData,
      })
      
      return {
        filename: file.name,
        result: await response.json(),
      }
    })
  )
  
  return results
}
```

### With Retry Logic

```typescript
async function processWithRetry(
  file: File, 
  maxRetries = 3,
  delay = 1000
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/sam4', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        return await response.json()
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
  }
  
  throw new Error('Max retries reached')
}
```

### Custom Hook (React)

```typescript
import { useState, useCallback } from 'react'

interface UseSAM4Options {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

function useSAM4(options?: UseSAM4Options) {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState<Error | null>(null)

  const process = useCallback(async (file: File, prompt?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      if (prompt) formData.append('prompt', prompt)
      
      const response = await fetch('/api/sam4', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.details || 'Processing failed')
      }
      
      setData(result)
      options?.onSuccess?.(result)
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options?.onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [options])

  return { process, isLoading, data, error }
}

// Usage
function MyComponent() {
  const { process, isLoading, data, error } = useSAM4({
    onSuccess: (data) => console.log('Success!', data),
    onError: (error) => console.error('Error!', error),
  })

  const handleUpload = async (file: File) => {
    await process(file, "segment objects")
  }

  return (
    <div>
      {isLoading && <p>Processing...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
```

## Response Format

All API responses follow this structure:

```typescript
interface SAM4Response {
  success: boolean
  data: any[]           // Model output
  duration?: number     // Processing time in seconds
  error?: string        // Error message if failed
  details?: string      // Additional error details
}
```

## Error Handling

Common error scenarios:

```typescript
try {
  const result = await processImage(file)
} catch (error) {
  if (error.message.includes('Failed to connect')) {
    // Hugging Face Space is down or unreachable
    console.error('Space connection failed')
  } else if (error.message.includes('timeout')) {
    // Request took too long
    console.error('Request timeout')
  } else {
    // Other errors
    console.error('Processing error:', error.message)
  }
}
```

## Best Practices

1. **Always validate file types** before uploading
2. **Implement retry logic** for production use
3. **Add timeout handling** for long-running requests
4. **Cache results** when appropriate
5. **Handle errors gracefully** with user-friendly messages
6. **Monitor API usage** to stay within rate limits
7. **Use loading states** for better UX

## Rate Limiting

Be mindful of Hugging Face Spaces rate limits:
- Free tier: Limited concurrent requests
- Consider implementing request queuing for batch processing
- Add delays between requests if processing multiple images

## Need Help?

- Check the [README](./README.md) for setup instructions
- Visit the [Quick Start Guide](./QUICKSTART.md) for getting started
- View the [test page](http://localhost:3000/test) for connection diagnostics

