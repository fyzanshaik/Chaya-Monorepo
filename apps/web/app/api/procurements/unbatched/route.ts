import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // crop and lotNo are expected query parameters by the backend
    // searchParams will already contain them from the frontend request.

    const response = await fetch(`${BACKEND_URL}/api/procurements/unbatched?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        Cookie: `token=${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({ error: data.error || 'Failed to fetch unbatched procurements from backend' }),
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in Next.js GET /api/procurements/unbatched route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error in Next.js API' }), { status: 500 });
  }
}
