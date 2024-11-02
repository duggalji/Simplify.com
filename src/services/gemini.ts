import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model: GenerativeModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

interface BlogPostStructure {
  title: string;
  introduction: string;
  mainContent: string;
  conclusion: string;
}

export async function summarizeWithGemini(transcript: string): Promise<string> {
  if (!transcript || typeof transcript !== 'string') {
    throw new Error('Invalid transcript provided?');
  }

  let attempt = 0;
  
  while (attempt < RETRY_ATTEMPTS) {
    try {
      const prompt = `
        Please convert this video transcript into a well-structured blog post.
        
        CRITICAL FORMATTING REQUIREMENTS:
        - Output PURE TEXT ONLY
        - NO special characters (*, #, -, etc.)
        - NO markdown syntax
        - NO bullet points or numbering
        - NO formatting symbols of any kind
        
        Structure Requirements:
        1. Start with a clear title on the first line
        2. Follow with an introduction paragraph
        3. Add main content sections with clear headings (plain text)
        4. End with a conclusion
        
        Style Requirements:
        - Ultra-modern, professional writing style
        - Clear section transitions
        - Engaging, sophisticated tone
        - Clean paragraph breaks
        - Professional formatting
        -make it professional and friendly
        
        Remember: Output should be COMPLETELY FREE of any special characters or formatting symbols.
        Just pure, clean, professional text with natural paragraph breaks.
        
        Transcript:
        ${transcript}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      // Try to parse the response into a structured format
      try {
        const structuredPost = parseIntoStructure(text);
        return formatBlogPost(structuredPost);
      } catch {
        // If parsing fails, return the raw text
        return text;
      }

    } catch (error) {
      attempt++;
      console.error(`Gemini API attempt ${attempt} failed:`, error);
      
      if (attempt === RETRY_ATTEMPTS) {
        throw new Error('Failed to generate blog post after multiple attempts');
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt - 1))
      );
    }
  }

  throw new Error('Failed to generate blog post');
}

function parseIntoStructure(text: string): BlogPostStructure {
  const sections = text.split('\n\n');
  
  // Clean all markdown symbols
  const cleanText = (text: string) => {
    return text
      .replace(/[#*`]/g, '')  // Remove #, *, and ` characters
      .replace(/^\s*[-•]\s*/gm, '') // Remove list markers
      .replace(/\n{3,}/g, '\n\n')  // Normalize multiple line breaks
      .trim();
  };
  
  return {
    title: cleanText(sections[0] || 'Untitled Post'),
    introduction: cleanText(sections[1] || ''),
    mainContent: cleanText(sections.slice(2, -1).join('\n\n')),
    conclusion: cleanText(sections[sections.length - 1] || '')
  };
}

function formatBlogPost(structure: BlogPostStructure): string {
  return `
${structure.title}

${structure.introduction}

${structure.mainContent}

Conclusion
${structure.conclusion}
  `.trim();
}

// Helper function to handle API errors
export function isGeminiError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('Gemini');
} 