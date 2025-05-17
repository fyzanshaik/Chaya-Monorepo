import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';

// POST for adding a new drying entry
export async function POST(request: Request, { params }: { params: { stageId: string } }) {
  const { stageId } = params;
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
    const data = await response.json();
    return new NextResponse(JSON.stringify(data), { status: response.status });
  } catch (error) {
    console.error(`Error in Next.js POST /api/processing-stages/${stageId}/drying:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// GET for fetching drying entries for a stage
export async function GET(request: Request, { params }: { params: { stageId: string } }) {
  const { stageId } = params;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/processing-stages/${stageId}/drying`, {
      method: 'GET',
      headers: { Cookie: `token=${token}` },
    });
    const data = await response.json();
    return new NextResponse(JSON.stringify(data), { status: response.status });
  } catch (error) {
    console.error(`Error in Next.js GET /api/processing-stages/${stageId}/drying:`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
