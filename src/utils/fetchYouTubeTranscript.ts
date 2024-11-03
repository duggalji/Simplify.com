import { YoutubeTranscript } from 'youtube-transcript';

export default async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  if (!videoId) {
    throw new Error('Video ID is required');
  }

  try {
    const cleanVideoId = videoId.trim();
    
    // Single attempt with timeout for serverless
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Transcript fetch timeout')), 8000);
    });

    const transcriptPromise = YoutubeTranscript.fetchTranscript(cleanVideoId);
    
    const transcriptResponse = await Promise.race([
      transcriptPromise,
      timeoutPromise
    ]) as any[];

    if (!transcriptResponse || !Array.isArray(transcriptResponse) || transcriptResponse.length === 0) {
      throw new Error('No transcript available');
    }

    const fullTranscript = transcriptResponse
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!fullTranscript) {
      throw new Error('Empty transcript received');
    }

    return fullTranscript;

  } catch (error) {
    console.error('Transcript fetch error:', error);
    throw new Error('Failed to fetch video transcript');
  }
} 