import { NextResponse } from 'next/server';
import { generateLocalTravelSuggestions } from '@/ai/flows/generate-local-travel-suggestions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow long execution time

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await generateLocalTravelSuggestions(body);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('API Error in /api/generate-local-suggestions:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate local travel suggestions' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
