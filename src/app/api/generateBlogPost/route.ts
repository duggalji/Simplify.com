import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fetchYouTubeTranscript from '@/utils/fetchYouTubeTranscript';
import { summarizeWithGemini} from '@/services/gemini';
import { fetchYouTubeMetadata } from '@/utils/fetchYouTubeMetadata';

interface YouTubeMetadata {
  thumbnail: string;
  views: string;
  likes: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
}

// Update success response to include metadata
interface SuccessResponse {
  blogPost: string;
  metadata: YouTubeMetadata;
}

interface ErrorResponse {
  error: string;
}

// More flexible URL validation
const RequestSchema = z.object({
  videoUrl: z.string()
    .url('Must be a valid URL')
    .refine(
      (url) => {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return pattern.test(url);
      },
      'Must be a valid YouTube URL'
    )
});

// Update these exports for better serverless compatibility
export const runtime = 'edge';  // Edge runtime is faster for serverless
export const maxDuration = 60;  // Increased to 60 seconds for long videos
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  const startTime = Date.now();
  
  try {
    const body = await req.json().catch(() => ({}));
    const result = RequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        error: `Invalid request: ${result.error.errors[0].message}`
      }, { status: 400 });
    }

    const videoId = extractVideoId(result.data.videoUrl);
    if (!videoId) {
      return NextResponse.json({
        error: 'Could not extract valid video ID from URL'
      }, { status: 400 });
    }

    // Parallel fetching with individual timeouts
    const [transcript, metadata] = await Promise.all([
      fetchYouTubeTranscript(videoId).catch(error => {
        console.error('Transcript fetch failed:', error);
        throw new Error('Could not fetch video transcript');
      }),
      fetchYouTubeMetadata(videoId).catch(() => null)
    ]);

    if (!transcript) {
      return NextResponse.json({
        error: 'Failed to get video transcript'
      }, { status: 500 });
    }

    // Check remaining time for Gemini processing
    const remainingTime = 58000 - (Date.now() - startTime);
    if (remainingTime < 10000) {
      throw new Error('Insufficient time remaining for processing');
    }

    const blogPost = await summarizeWithGemini(transcript);

    return NextResponse.json({
      blogPost,
      metadata: metadata || {
        thumbnail: '',
        views: '0',
        likes: '0',
        title: 'Title unavailable',
        channelTitle: 'Unknown Channel',
        publishedAt: new Date().toLocaleDateString()
      }
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, private',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('API Error:', {
      error,
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      url: req.url
    });

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    let videoId: string | null = null;

    // Handle different YouTube URL formats
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      videoId = urlObj.searchParams.get('v');
    }

    // Validate video ID format (11 characters)
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return videoId;
    }

    return null;
  } catch {
    return null;
  }
}


function isError(error: unknown): error is Error {
  return error instanceof Error;
}