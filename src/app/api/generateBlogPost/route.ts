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
export const maxDuration = 30;  // Reduced to 30 seconds which is safer for serverless
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    // Shorter timeout for serverless
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 29000); // 29s timeout
    });

    const responsePromise = handleRequest(req);
    const response = await Promise.race([responsePromise, timeoutPromise]);
    return response as NextResponse<SuccessResponse | ErrorResponse>;
    
  } catch (error) {
    console.error('API Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

async function handleRequest(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
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
        error: 'Could not extract valid video ID from URL.'
      }, { status: 400 });
    }

    // Sequential fetching instead of parallel for better reliability
    console.log('Fetching transcript...');
    const transcript = await fetchYouTubeTranscript(videoId);
    
    console.log('Fetching metadata...');
    const metadata = await fetchYouTubeMetadata(videoId);

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({
        error: 'Empty transcript received'
      }, { status: 500 });
    }

    console.log('Generating blog post...');
    const blogPost = await summarizeWithGemini(transcript);
    if (!blogPost || blogPost.trim().length === 0) {
      return NextResponse.json({
        error: 'Failed to generate blog post'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      blogPost,
      metadata
    }, { status: 200 });

  } catch (error) {
    console.error('Request handling error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process request we are so sorry'
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