# SAM4 API Reference

Complete API reference for the daveyRI/SAM4 Hugging Face Space integration.

## Overview

Your SAM4 Space provides **8 API endpoints** for various vision and video processing tasks:

1. `/process_image_text` - Image segmentation with text prompts
2. `/process_image_tracker_wrapper` - Interactive image segmentation
3. `/process_video_text` - Video segmentation with text prompts
4. `/process_video_tracker_gpu` - GPU-accelerated video tracking
5. `/on_video_upload` - Extract first frame from video
6. `/add_point_video_preview` - Add tracking points to video
7. `/reset_tracking_view` - Reset video tracking state
8. `/lambda` - Get current tracking state

## Image Processing

### 1. Process Image with Text Prompt

**Endpoint**: `/process_image_text`

Segments objects in images based on text descriptions.

#### Parameters

```typescript
{
  image: File,              // Required - Image file to process
  text_prompt: string,      // Required - Text description of what to segment
  threshold: number,        // Optional - Confidence threshold (0-1, default: 0.5)
  mask_threshold: number    // Optional - Mask quality threshold (0-1, default: 0.5)
}
```

#### Returns

```typescript
[
  {
    path: string,          // Path to result image with segmentation
    url: string,           // URL to access the result
    size: number,          // File size in bytes
    orig_name: string,     // Original filename
    mime_type: string      // Image MIME type
  },
  string                   // Details text about the segmentation
]
```

#### Example (JavaScript/TypeScript)

```typescript
const formData = new FormData()
formData.append('image', imageFile)
formData.append('prompt', 'segment the person')
formData.append('threshold', '0.5')
formData.append('maskThreshold', '0.5')

const response = await fetch('/api/sam4', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
console.log(result.result_image.url) // Segmented image URL
console.log(result.details)          // Segmentation details
```

#### Example (Python)

```python
from gradio_client import Client, handle_file

client = Client("daveyRI/SAM4")
result = client.predict(
    image=handle_file('path/to/image.jpg'),
    text_prompt="segment the main object",
    threshold=0.5,
    mask_threshold=0.5,
    api_name="/process_image_text"
)

result_image = result[0]  # Segmented image
details = result[1]        # Details text
print(f"Result image: {result_image['url']}")
print(f"Details: {details}")
```

### 2. Interactive Image Segmentation

**Endpoint**: `/process_image_tracker_wrapper`

Interactive segmentation where users can click to add points.

#### Parameters

```typescript
{
  image: File,           // Required - Image file to process
  multimask: boolean     // Optional - Return multiple masks for ambiguity (default: false)
}
```

#### Returns

```typescript
{
  path: string,
  url: string,
  size: number,
  orig_name: string,
  mime_type: string
}
```

## Video Processing

### 3. Process Video with Text Prompt

**Endpoint**: `/process_video_text`

Tracks and segments objects in videos based on text prompts.

#### Parameters

```typescript
{
  video_path: File,           // Required - Video file to process
  text_prompt: string,        // Required - Text description of what to track
  max_frames: number,         // Optional - Maximum frames to process (default: 50)
  timeout_seconds: "60"|"120" // Optional - Processing timeout (default: "60")
}
```

#### Returns

```typescript
[
  string,    // Path to result video
  string     // Status message
]
```

#### Example (TypeScript)

```typescript
const formData = new FormData()
formData.append('video', videoFile)
formData.append('prompt', 'track the car')
formData.append('maxFrames', '100')
formData.append('timeoutSeconds', '120')

const response = await fetch('/api/sam4/video', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
console.log(result.result_video.url) // Processed video URL
console.log(result.status)            // Processing status
```

#### Example (Python)

```python
from gradio_client import Client, handle_file

client = Client("daveyRI/SAM4")
result = client.predict(
    video_path=handle_file('path/to/video.mp4'),
    text_prompt="track the person",
    max_frames=100,
    timeout_seconds="120",
    api_name="/process_video_text"
)

result_video = result[0]  # Processed video path
status = result[1]         # Status message
print(f"Result: {result_video}")
print(f"Status: {status}")
```

### 4. GPU-Accelerated Video Tracking

**Endpoint**: `/process_video_tracker_gpu`

High-performance video tracking using GPU acceleration.

#### Parameters

```typescript
{
  video_path: File,           // Required - Video file
  max_frames: number,         // Optional - Max frames (default: 50)
  timeout_seconds: "60"|"120" // Optional - Timeout (default: "60")
}
```

## Helper Endpoints

### 5. Extract First Frame

**Endpoint**: `/on_video_upload`

Extracts the first frame from a video for preview or point selection.

```python
client.predict(
    video_path=handle_file('video.mp4'),
    api_name="/on_video_upload"
)
```

### 6. Add Tracking Point

**Endpoint**: `/add_point_video_preview`

Adds a tracking point to the video preview.

### 7. Reset Tracking

**Endpoint**: `/reset_tracking_view`

Resets the video tracking state.

### 8. Get Current State

**Endpoint**: `/lambda`

Returns the current tracking state.

## Our API Routes

We've wrapped these Gradio endpoints in Next.js API routes for easier use:

### Image Processing

**POST /api/sam4**

```typescript
// Request
POST /api/sam4
Content-Type: multipart/form-data

{
  image: File,
  prompt: string,
  threshold: string,      // "0.5"
  maskThreshold: string   // "0.5"
}

// Response
{
  success: true,
  data: [...],
  duration: number,
  result_image: {
    url: string,
    path: string,
    size: number
  },
  details: string
}
```

### Video Processing

**POST /api/sam4/video**

```typescript
// Request
POST /api/sam4/video
Content-Type: multipart/form-data

{
  video: File,
  prompt: string,
  maxFrames: string,      // "50"
  timeoutSeconds: string  // "60" or "120"
}

// Response
{
  success: true,
  data: [...],
  duration: number,
  result_video: {
    url: string,
    path: string
  },
  status: string
}
```

### API Information

**GET /api/info**

```typescript
// Response
{
  success: true,
  spaceUrl: string,
  spaceName: string,
  apiInfo: object,
  endpoints: array
}
```

## Parameter Details

### Thresholds

- **threshold** (0-1): Confidence threshold for object detection
  - Higher = More confident detections only
  - Lower = More detections, possibly less accurate
  - Recommended: 0.3-0.7

- **mask_threshold** (0-1): Quality threshold for segmentation masks
  - Higher = Cleaner masks, might miss details
  - Lower = More detailed masks, might include noise
  - Recommended: 0.4-0.6

### Video Processing

- **max_frames**: Number of frames to process
  - More frames = Better tracking, longer processing time
  - Recommended: 30-100 for short clips

- **timeout_seconds**: Maximum processing time
  - "60": Good for short videos or quick tests
  - "120": For longer videos or complex scenes

## Error Handling

All endpoints return errors in this format:

```typescript
{
  success: false,
  error: string,
  details: string
}
```

Common errors:
- "No image/video provided" - Missing file in request
- "Failed to connect to SAM4 Space" - Space is down or sleeping
- "Processing timeout" - Video took too long to process
- "Invalid file format" - Unsupported file type

## Rate Limits

Hugging Face Spaces have rate limits:
- Free tier: Limited concurrent requests
- Consider implementing queue for batch processing
- Add delays between requests (500ms-1s recommended)

## Best Practices

1. **Image Size**: Resize large images before uploading (recommended max: 1920x1080)
2. **Video Length**: Keep videos under 30 seconds for faster processing
3. **Text Prompts**: Be specific ("red car" vs "car")
4. **Error Handling**: Always implement retry logic
5. **Timeouts**: Set appropriate request timeouts (90s for images, 150s for videos)

## Testing

Use our built-in test page:
```
http://localhost:3000/test
```

Or test endpoints directly:
```bash
# Test image processing
curl -X POST http://localhost:3000/api/sam4 \
  -F "image=@image.jpg" \
  -F "prompt=segment the dog" \
  -F "threshold=0.5" \
  -F "maskThreshold=0.5"

# Test video processing
curl -X POST http://localhost:3000/api/sam4/video \
  -F "video=@video.mp4" \
  -F "prompt=track the ball" \
  -F "maxFrames=50" \
  -F "timeoutSeconds=60"
```

## Need Help?

- Check `/test` page for connection diagnostics
- View API info at `/api/info`
- See examples in `EXAMPLES.md`
- Visit the [HF Space](https://huggingface.co/spaces/daveyRI/SAM4)

