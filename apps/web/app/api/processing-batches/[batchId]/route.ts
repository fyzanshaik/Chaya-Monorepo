import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';

interface BatchIdParams {
  batchId: string;
}

export async function GET(request: NextRequest, { params }: { params: BatchIdParams }) {
  const { batchId } = params;

  if (!batchId || typeof batchId !== 'string') {
    return new NextResponse(JSON.stringify({ error: 'Batch ID is missing or invalid.' }), { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const fetchURL = `${BACKEND_URL}/api/processing-batches/${batchId}`;

    const response = await fetch(fetchURL, {
      method: 'GET',
      headers: {
        Cookie: `token=${token}`,
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({
          error: data.error || `Failed to fetch processing batch ${batchId} from backend. Status: ${response.status}`,
        }),
        { status: response.status }
      );
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(
      `[Next.js API Catch block error] GET /api/processing-batches/${batchId}:`,
      error.message,
      error.stack
    );
    return new NextResponse(JSON.stringify({ error: 'Internal server error in Next.js API proxy.' }), { status: 500 });
  }
}
