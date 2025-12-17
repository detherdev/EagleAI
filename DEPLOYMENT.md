# Deployment Guide for EagleAI

## System Requirements

### FFmpeg.wasm (Client-Side Video Processing)

**Good News!** Video trimming now happens entirely in the browser using FFmpeg.wasm. No server-side FFmpeg installation required!

#### How It Works

1. User uploads a video
2. FFmpeg.wasm loads in the browser (~30MB, cached after first load)
3. Video is trimmed client-side before upload
4. Only the trimmed segment is sent to the server
5. No 50MB file size limits!

#### Benefits

- ✅ **No server dependencies** - Works on any platform
- ✅ **Perfect for Vercel** - No FFmpeg installation needed
- ✅ **Faster processing** - Only upload what you need
- ✅ **Better privacy** - Video trimming happens locally
- ✅ **No file size limits** - Trim large videos before upload

## Environment Variables

Create a `.env.local` file with:

```env
HF_TOKEN=your_hugging_face_token_here
NEXT_PUBLIC_HF_SPACE_URL=https://daveyRI-SAM4.hf.space
```

## Deployment Steps

### Vercel

1. Install FFmpeg support:
   ```bash
   npm install ffmpeg-static @types/ffmpeg-static
   ```

2. Update `src/app/api/sam4/video/route.ts` to use ffmpeg-static:
   ```typescript
   import ffmpegPath from 'ffmpeg-static'
   
   // Replace ffmpeg command with:
   const ffmpegCommand = `"${ffmpegPath}" -i "${tempFilePath}" ...`
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Set environment variables in Vercel dashboard

### Other Platforms

For platforms with native FFmpeg support, no additional configuration needed. Just set environment variables and deploy.

## Features That Require FFmpeg

- **Video Trimming**: If FFmpeg is not available, videos will be processed in full length
- The app gracefully falls back to processing the full video if trimming fails

## File Size Limits

- **Maximum file size**: 50MB per upload
- This applies to both images and videos
- For larger videos:
  1. Compress the video before uploading
  2. Use video trimming to process only a segment
  3. Deploy on a platform with higher limits (Railway, Render, etc.)

### Increasing Limits on Vercel

Vercel Pro and Enterprise plans support larger payloads. For the free tier, 50MB is recommended.

To adjust the limit in `next.config.js`:
```javascript
api: {
  bodyParser: {
    sizeLimit: '50mb', // Adjust as needed
  },
}
```

## Testing

Test video trimming locally:
```bash
npm run dev
```

Upload a video, adjust the trim sliders, and process. Check the console logs for FFmpeg output.

