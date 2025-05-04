import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

    const response = await fetch(`${backendUrl}/api/procurements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new NextResponse(
        JSON.stringify({
          error: errorData.error || 'Failed to create procurement',
        }),
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in procurement POST route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/procurements?search=${query}&page=${page}&limit=${limit}`, {
      headers: {
        Cookie: `token=${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch procurement data');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in procurement API route:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch procurement data' }), { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

    const response = await fetch(`${backendUrl}/api/procurements/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new NextResponse(
        JSON.stringify({
          error: errorData.error || 'Failed to update procurement',
        }),
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in procurement PUT route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

    const response = await fetch(`${backendUrl}/api/procurements/${params.id}`, {
      method: 'DELETE',
      headers: {
        Cookie: `token=${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new NextResponse(
        JSON.stringify({
          error: errorData.error || 'Failed to delete procurement',
        }),
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in procurement DELETE route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
