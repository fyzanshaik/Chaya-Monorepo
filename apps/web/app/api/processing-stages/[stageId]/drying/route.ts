/*eslint-disable */
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.PROD_BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest, context: any) {
  const { stageId } = context.params;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/processing-stages/${stageId}/drying`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error for /api/processing-stages/${stageId}/drying: ${response.status} - ${errorText}`);
      return new NextResponse(JSON.stringify({ error: `Backend error: ${response.statusText}`, details: errorText }), {
        status: response.status,
      });
    }

    const data = await response.json();
    return new NextResponse(JSON.stringify(data), { status: response.status });
  } catch (error: unknown) {
    console.error(`Error in Next.js POST /api/processing-stages/${stageId}/drying:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
