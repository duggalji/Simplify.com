import { fetchTranscriptEdge } from './edgeTranscriptFetcher';

const MAX_RETRIES = 1;
const INITIAL_DELAY = 500;
const MAX_TIMEOUT = 8000; // 8 seconds max timeout

export default async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  if (!videoId?.trim()) {
    throw new Error('Valid video ID is required');
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MAX_TIMEOUT);

      try {
        console.log(`Attempting to fetch transcript (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        
        const transcript = await fetchTranscriptEdge(videoId.trim());
        clearTimeout(timeoutId);

        if (!transcript || transcript.length < 100) { // Increased minimum length
          throw new Error('Retrieved transcript is too short or empty');
        }

        console.log('Successfully fetched transcript');
        return transcript;

      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`Transcript fetch attempt ${attempt + 1} failed:`, {
        error: lastError.message,
        videoId,
        attempt: attempt + 1,
        timestamp: new Date().toISOString()
      });

      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`Failed to fetch transcript after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }

      // Exponential backoff with jitter
      const delay = INITIAL_DELAY * Math.pow(2, attempt) * (0.75 + Math.random() * 0.5);
      console.log(`Waiting ${Math.round(delay)}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Failed to fetch transcript after all attempts');
} 