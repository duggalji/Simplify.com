import { z } from 'zod';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Email validation schema
const newsletterSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email is too short')
    .max(100, 'Email is too long'),
});

// Helper function to read/write subscribers
const SUBSCRIBERS_FILE = path.join(process.cwd(), 'data', 'subscribers.json');

async function getSubscribers(): Promise<string[]> {
  try {
    // Ensure the directory exists
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    
    try {
      const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, return empty array
      await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify([]));
      return [];
    }
  } catch (error) {
    console.error('Error reading subscribers:', error);
    return [];
  }
}

async function addSubscriber(email: string): Promise<void> {
  const subscribers = await getSubscribers();
  subscribers.push(email);
  await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(req: Request) {
  try {
    // Add CORS headers
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Parse request body
    const body = await req.json();
    
    // Validate the request body
    const { email } = newsletterSchema.parse(body);
    
    // Check for existing email
    const existingSubscribers = await getSubscribers();
    
    if (existingSubscribers.includes(email)) {
      return NextResponse.json(
        { message: 'Email already subscribed' },
        { status: 400, headers }
      );
    }

    // Store email
    await addSubscriber(email);

    // Success response
    return NextResponse.json(
      { 
        message: 'Successfully subscribed to newsletter',
        email 
      },
      { status: 201, headers }
    );

  } catch (error) {
    console.error('Newsletter subscription error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 