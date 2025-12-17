# Deployment Guide for EagleAI

## System Requirements

### FFmpeg Installation

The video trimming feature requires FFmpeg to be installed on the server.

#### For Vercel Deployment

Vercel serverless functions don't include FFmpeg by default. You have two options:

1. **Use ffmpeg-static package** (Recommended for Vercel):
   ```bash
   npm install ffmpeg-static
   ```
   Then update the video API route to use the static binary.

2. **Use a different platform** that supports FFmpeg:
   - **Railway**: FFmpeg available
   - **Render**: FFmpeg available
   - **Fly.io**: FFmpeg available
   - **DigitalOcean App Platform**: FFmpeg available

#### For Local Development

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

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

## Testing

Test video trimming locally:
```bash
npm run dev
```

Upload a video, adjust the trim sliders, and process. Check the console logs for FFmpeg output.

