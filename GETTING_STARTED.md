# Getting Started with SAM4 Vision API

Welcome! Your SAM4 Vision API is ready to use. This guide will get you up and running in **5 minutes**.

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages including the official Gradio client.

### Step 2: Start the Server

```bash
npm run dev
```

Wait for the message: `Ready on http://localhost:3000`

### Step 3: Open Your Browser

Visit: **http://localhost:3000**

That's it! You're ready to process images and videos.

## 🎯 Your First Image Segmentation

1. **Go to**: http://localhost:3000
2. **Upload**: Click or drag an image file
3. **Prompt**: Type "segment the person" (or describe what you want)
4. **Process**: Click the "Process Image" button
5. **Result**: See your segmented image!

### Example Prompts
- "segment the dog"
- "the red car"
- "person in the center"
- "all the trees"
- "the building"

## 🎥 Your First Video Processing

1. **Go to**: http://localhost:3000/video
2. **Upload**: Select a video file
3. **Prompt**: Type "track the car" (or what to track)
4. **Configure**: Set frames and timeout
5. **Process**: Click "Process Video"
6. **Result**: Watch the tracked video!

### Example Prompts
- "track the ball"
- "follow the person"
- "the moving car"
- "the bird flying"

## 🔍 Check Your Connection

Visit: **http://localhost:3000/test**

This page shows:
- ✅ Connection status to your HF Space
- 📡 Available API endpoints
- 🔗 Space information
- 📊 Architecture diagram

## 📱 Pages Available

| Page | URL | Purpose |
|------|-----|---------|
| **Images** | http://localhost:3000 | Segment objects in images |
| **Videos** | http://localhost:3000/video | Track objects in videos |
| **Test** | http://localhost:3000/test | Connection diagnostics |
| **API Info** | http://localhost:3000/api/info | API endpoint information |

## 🎨 UI Controls

### Image Processing

- **Upload Area**: Click or drag-and-drop images
- **Text Prompt**: Describe what to segment
- **Confidence Slider**: How sure the model should be (0-1)
  - Lower = More detections
  - Higher = Only confident detections
- **Mask Slider**: Quality of segmentation (0-1)
  - Lower = More detailed
  - Higher = Cleaner masks

### Video Processing

- **Upload Area**: Select video files
- **Text Prompt**: Describe what to track
- **Max Frames**: How many frames to process (10-200)
  - More = Better tracking, slower
  - Less = Faster, might miss details
- **Timeout**: Maximum processing time
  - 60s = Quick processing
  - 120s = For longer/complex videos

## 🧪 Test with cURL

### Test Image API

```bash
curl -X POST http://localhost:3000/api/sam4 \
  -F "image=@./path/to/image.jpg" \
  -F "prompt=segment the main object" \
  -F "threshold=0.5" \
  -F "maskThreshold=0.5"
```

### Test Video API

```bash
curl -X POST http://localhost:3000/api/sam4/video \
  -F "video=@./path/to/video.mp4" \
  -F "prompt=track the person" \
  -F "maxFrames=50" \
  -F "timeoutSeconds=60"
```

### Get API Information

```bash
curl http://localhost:3000/api/info | jq '.'
```

## 📚 Documentation

We've created comprehensive documentation for you:

| Document | What's Inside |
|----------|---------------|
| **README.md** | Project overview and setup |
| **QUICKSTART.md** | 5-minute quick start guide |
| **API_REFERENCE.md** | Complete API documentation |
| **EXAMPLES.md** | Code examples (JS, Python, cURL) |
| **IMPLEMENTATION_GUIDE.md** | Architecture and implementation details |
| **PROJECT_SUMMARY.md** | High-level project summary |

## 🎓 Learning Path

### Beginner
1. Read this file (you're here!)
2. Try processing an image
3. Try processing a video
4. Check the test page

### Intermediate
1. Read **API_REFERENCE.md**
2. Try different prompts and thresholds
3. Test with cURL commands
4. Explore the code in `src/`

### Advanced
1. Read **IMPLEMENTATION_GUIDE.md**
2. Study **EXAMPLES.md** for integration patterns
3. Customize the UI components
4. Add new features or endpoints

## 💡 Pro Tips

### For Best Results

**Images:**
- Use clear, high-quality images
- Be specific in prompts ("red sports car" not just "car")
- Start with default thresholds (0.5), then adjust
- Resize very large images before uploading

**Videos:**
- Keep videos under 30 seconds
- Use simple, clear prompts
- Start with 50 frames, adjust based on results
- Use 120s timeout for complex scenes

### Common Issues

**"Space is sleeping"**
- First request might take 30-60s to wake the Space
- Subsequent requests will be faster

**"Processing too slow"**
- Reduce max_frames for videos
- Use smaller images
- Check if Space has GPU access

**"Poor segmentation quality"**
- Try different prompts (be more specific)
- Adjust confidence threshold
- Adjust mask threshold

## 🔧 Configuration

### Environment Variables

The Space URL is configured in `.env.local`:

```env
NEXT_PUBLIC_HF_SPACE_URL=https://daveyRI-SAM4.hf.space
```

You don't need to change this unless you want to use a different Space.

### Customization

Want to customize? Check these files:

- **UI Styling**: `src/app/globals.css` and `tailwind.config.ts`
- **Components**: `src/components/vision-interface.tsx` and `video-interface.tsx`
- **API Logic**: `src/app/api/sam4/route.ts` and `video/route.ts`

## 🚀 What's Next?

### Try These:
1. ✅ Process your first image
2. ✅ Process your first video
3. ✅ Check the test page
4. ✅ Try different prompts
5. ✅ Adjust thresholds
6. ✅ Test with cURL

### Then Explore:
- Read the full API reference
- Try the Python examples
- Customize the UI
- Add new features
- Deploy to production

## 🆘 Need Help?

### Quick Checks
1. Is the dev server running? (`npm run dev`)
2. Is the Space awake? (Visit http://localhost:3000/test)
3. Are you using the right file format? (Images: JPG/PNG, Videos: MP4/MOV)

### Resources
- **Test Page**: http://localhost:3000/test (connection diagnostics)
- **API Info**: http://localhost:3000/api/info (endpoint details)
- **Your Space**: https://huggingface.co/spaces/daveyRI/SAM4
- **Gradio Docs**: https://www.gradio.app/guides/getting-started-with-the-js-client

### Check the Docs
- **API_REFERENCE.md** - Complete API documentation
- **EXAMPLES.md** - Code examples
- **IMPLEMENTATION_GUIDE.md** - Architecture details

## ✨ Features Summary

Your SAM4 Vision API includes:

- ✅ **Image Segmentation** - Segment objects with text prompts
- ✅ **Video Tracking** - Track objects across video frames
- ✅ **Adjustable Thresholds** - Control confidence and quality
- ✅ **Beautiful UI** - Modern, responsive design
- ✅ **Direct Integration** - Official Gradio client
- ✅ **Full Documentation** - Multiple guides and references
- ✅ **Testing Tools** - Built-in diagnostics
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Production Ready** - Error handling, validation, security

## 🎉 You're Ready!

Everything is set up and ready to go. Just run:

```bash
npm install
npm run dev
```

Then visit **http://localhost:3000** and start processing!

---

**Happy segmenting! 🎨**

