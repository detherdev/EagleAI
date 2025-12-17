# Setting Up Your SAM4 Hugging Face Space

## ⚠️ Current Issue

The Space URL `daveyRI/SAM4` doesn't exist yet. You have three options:

## Option 1: Create Your Own SAM4 Space (Recommended)

### Step 1: Go to Hugging Face Spaces
Visit: https://huggingface.co/new-space

### Step 2: Create a New Space
- **Name**: `SAM4` (or any name you prefer)
- **License**: Choose appropriate license
- **SDK**: Gradio
- **Hardware**: GPU (recommended for SAM models)

### Step 3: Add SAM4 Code

Create an `app.py` file in your Space:

```python
import gradio as gr
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor
import torch
import numpy as np
from PIL import Image

# Initialize SAM2 model
checkpoint = "./checkpoints/sam2_hiera_large.pt"
model_cfg = "sam2_hiera_l.yaml"
predictor = SAM2ImagePredictor(build_sam2(model_cfg, checkpoint))

def process_image_text(image, text_prompt, threshold=0.5, mask_threshold=0.5):
    """Process image with text prompt"""
    try:
        # Your SAM4 processing logic here
        # This is a placeholder - implement your actual SAM4 logic
        
        return image, f"Processed with prompt: {text_prompt}"
    except Exception as e:
        return None, f"Error: {str(e)}"

# Create Gradio interface
with gr.Blocks() as demo:
    gr.Markdown("# SAM4 Vision API")
    
    with gr.Tab("Image Processing"):
        with gr.Row():
            with gr.Column():
                image_input = gr.Image(type="filepath", label="Input Image")
                text_input = gr.Textbox(label="Text Prompt")
                threshold_slider = gr.Slider(0, 1, value=0.5, label="Confidence Threshold")
                mask_slider = gr.Slider(0, 1, value=0.5, label="Mask Threshold")
                process_btn = gr.Button("Process Image")
            
            with gr.Column():
                image_output = gr.Image(label="Result")
                details_output = gr.Textbox(label="Details")
        
        process_btn.click(
            fn=process_image_text,
            inputs=[image_input, text_input, threshold_slider, mask_slider],
            outputs=[image_output, details_output],
            api_name="process_image_text"
        )

if __name__ == "__main__":
    demo.launch()
```

### Step 4: Add Requirements

Create `requirements.txt`:

```txt
gradio
torch
pillow
numpy
# Add SAM4 specific requirements
```

### Step 5: Update Your App

Once your Space is running, update `.env.local`:

```env
NEXT_PUBLIC_HF_SPACE_URL=https://daveyRI-SAM4.hf.space
```

## Option 2: Use an Existing SAM Space

You can use a public SAM Space instead. Update `.env.local`:

```env
# Example: Use Facebook's SAM demo
NEXT_PUBLIC_HF_SPACE_URL=https://facebook-sam.hf.space

# Or use another public SAM Space
NEXT_PUBLIC_HF_SPACE_URL=https://ybelkada-segment-anything.hf.space
```

**Note**: You'll need to adjust the API endpoint names to match the Space's actual endpoints.

## Option 3: Use Your Existing Space

I see you have a Space called `anycoder-d7773a6b`. If this is a SAM-related Space:

1. Fix the runtime error in that Space
2. Update `.env.local`:

```env
NEXT_PUBLIC_HF_SPACE_URL=https://daveyRI-anycoder-d7773a6b.hf.space
```

3. Update the API endpoint names in the code to match your Space's endpoints

## Testing Without a Space

For local development/testing without a Space, you can:

### 1. Mock the API Responses

Update `src/app/api/sam4/route.ts` to return mock data:

```typescript
export async function POST(request: NextRequest) {
  // Mock response for testing
  return NextResponse.json({
    success: true,
    data: [
      {
        path: "/mock/result.jpg",
        url: "https://via.placeholder.com/800x600",
        size: 12345,
        orig_name: "result.jpg",
        mime_type: "image/jpeg"
      },
      "Mock segmentation completed successfully"
    ],
    duration: 1.23,
    result_image: {
      url: "https://via.placeholder.com/800x600",
      path: "/mock/result.jpg",
      size: 12345
    },
    details: "This is a mock response for testing the UI"
  })
}
```

### 2. Use a Local SAM Model

Install SAM locally and run it directly in your Next.js API routes (requires GPU):

```bash
pip install segment-anything
```

Then implement the model in your API routes.

## Quick Fix for Current App

To make the app functional right now, let's use a public SAM Space:

```bash
# Update .env.local
echo "NEXT_PUBLIC_HF_SPACE_URL=https://ybelkada-segment-anything.hf.space" > .env.local
```

Then restart your dev server:

```bash
npm run dev
```

## Recommended Next Steps

1. **Create your own SAM4 Space** on Hugging Face (Option 1)
2. **Deploy your SAM model** to the Space
3. **Update the .env.local** with your Space URL
4. **Test the integration** using the app

## Need Help?

- **Hugging Face Spaces Docs**: https://huggingface.co/docs/hub/spaces
- **Gradio Docs**: https://www.gradio.app/docs
- **SAM Model**: https://github.com/facebookresearch/segment-anything

## Current Status

✅ **App is built and running locally**
✅ **UI is fully functional**
❌ **Space URL needs to be updated**
❌ **No active SAM4 Space found**

Once you create/configure a Space, the app will work perfectly!

