# Quick Start Guide

Get your SAM4 Vision API up and running in minutes!

## 🚀 Installation

```bash
# Install dependencies
npm install
```

## 🏃 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔍 Test the Connection

### 1. Check API Status

Visit the info button in the bottom-right corner of the app, or directly access:

```bash
curl http://localhost:3000/api/info
```

This will show:
- ✅ Connection status to your Hugging Face Space
- 📡 Available API endpoints
- 🔗 Space URL

### 2. Process an Image

1. Click or drag-and-drop an image into the upload area
2. (Optional) Add a text prompt
3. Click "Process Image"
4. View the results from SAM4

### 3. API Testing with cURL

```bash
# Test with a local image file
curl -X POST http://localhost:3000/api/sam4 \
  -F "image=@/path/to/your/image.jpg" \
  -F "prompt=segment the main object"
```

## 🔧 Configuration

The Hugging Face Space URL is configured in `.env.local`:

```env
NEXT_PUBLIC_HF_SPACE_URL=https://daveyRI-SAM4.hf.space
```

To use a different Space, simply update this URL.

## 📦 How It Works

```
User Upload → Next.js API Route → Gradio Client → Hugging Face Space → SAM4 Model
                                        ↓
                                  Results Return
```

### Architecture:

1. **Frontend** (`src/components/vision-interface.tsx`): React component with file upload
2. **API Route** (`src/app/api/sam4/route.ts`): Server-side endpoint using `@gradio/client`
3. **Gradio Client**: Official npm package that connects directly to your HF Space
4. **SAM4 Space**: Your Hugging Face Space running the SAM4 model

## 🐛 Troubleshooting

### Connection Issues

If you see connection errors:

1. **Check Space Status**: Visit [https://huggingface.co/spaces/daveyRI/SAM4](https://huggingface.co/spaces/daveyRI/SAM4)
2. **Verify Space is Running**: The Space must be active (not sleeping)
3. **Check API Info**: Visit `/api/info` to see detailed error messages

### API Endpoint Errors

The Gradio client automatically discovers endpoints. If you get endpoint errors:

1. Check the API info panel for available endpoints
2. The endpoint name in `route.ts` might need adjustment based on your Space's API
3. Common endpoint names: `/predict`, `/inference`, `/run`

### CORS Issues

If running into CORS problems:
- The API routes run server-side, avoiding CORS issues
- Make sure you're using the `/api/sam4` endpoint, not calling the HF Space directly from the client

## 🎯 Next Steps

- Customize the UI in `src/components/vision-interface.tsx`
- Add authentication if needed
- Deploy to Vercel or your preferred platform
- Explore other Hugging Face Spaces to integrate

## 📚 Learn More

- [Gradio Client Docs](https://www.gradio.app/guides/getting-started-with-the-js-client)
- [Hugging Face Spaces](https://huggingface.co/docs/hub/spaces)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

