# 🦅 EagleAI

AI-powered object detection and segmentation application built with Next.js 14 and the SAM4 vision model.

## Features

- **Text Detection**: Detect and segment objects using natural language prompts
- **Interactive Tracker**: Automatic object segmentation without text prompts
- **Video Analysis**: Track and segment objects in videos with customizable frame processing
- **Real-time Analysis**: Track processing time for each analysis
- **Beautiful UI**: Modern, responsive interface with smooth animations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Animations**: Framer Motion
- **AI Model**: SAM4 (Segment Anything Model 4) via Hugging Face Spaces
- **API Client**: Gradio Client

## Getting Started

### Prerequisites

- Node.js 18+ or npm/pnpm
- Hugging Face account with API token (for private spaces)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/EagleAI.git
cd EagleAI
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_HF_SPACE_URL=https://daveyRI-SAM4.hf.space
HF_TOKEN=your_hugging_face_token_here
```

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Text Detection
1. Upload an image
2. Enter a text prompt describing what to detect (e.g., "person, car, dog")
3. Adjust confidence thresholds if needed
4. Click "Analyze" to see results with detection bar graph

### Interactive Tracker
1. Upload an image
2. Click "Segment Object" for automatic detection of all objects
3. View segmented results instantly

### Video Analysis
1. Upload a video file
2. Optionally trim the video to analyze specific segments
3. Enter a text prompt for what to track
4. Adjust max frames and processing settings
5. Click "Analyze" to process the video

## Project Structure

```
EagleAI/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   │   ├── sam4/         # Image detection API
│   │   │   ├── sam4/video/   # Video processing API
│   │   │   └── proxy-image/  # Image proxy for CORS
│   │   ├── video/            # Video analysis page
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn UI components
│   │   ├── vision-interface-v0.tsx
│   │   ├── video-interface-v0.tsx
│   │   ├── tracker-interface.tsx
│   │   ├── navigation.tsx
│   │   └── detection-bar-graph.tsx
│   └── lib/                   # Utility functions
├── public/                    # Static assets
└── package.json
```

## API Endpoints

### POST /api/sam4
Process images with text prompts for object detection.

**Parameters:**
- `image`: Image file
- `prompt`: Text description of objects to detect
- `threshold`: Confidence threshold (0-1)
- `maskThreshold`: Mask threshold (0-1)

### POST /api/sam4/video
Process videos with text prompts for object tracking.

**Parameters:**
- `video`: Video file
- `prompt`: Text description of objects to track
- `maxFrames`: Maximum frames to process
- `timeoutSeconds`: Processing timeout (60 or 120)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_HF_SPACE_URL` | Hugging Face Space URL | Yes |
| `HF_TOKEN` | Hugging Face API token | Yes (for private spaces) |

## Performance

- **Image Analysis**: ~1-3 seconds per image
- **Video Analysis**: Depends on video length and max frames setting
- **Real-time Tracking**: All analysis times are displayed to users

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Built with [SAM4](https://huggingface.co/spaces/daveyRI/SAM4) vision model
- UI inspired by modern design principles
- Powered by [Hugging Face](https://huggingface.co/) infrastructure

## Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ by the EagleAI team
