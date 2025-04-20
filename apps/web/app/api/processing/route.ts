import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = process.env.API_URL || "http://localhost:5000";

    const response = await fetch(`${backendUrl}/api/processing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new NextResponse(
        JSON.stringify({
          error: errorData.error || "Failed to create processing",
        }),
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in processing POST route:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    const backendUrl = process.env.API_URL || "http://localhost:5000";
    const response = await fetch(
      `${backendUrl}/api/processing?query=${query}&page=${page}&limit=${limit}`,
      {
        headers: {
          Cookie: `token=${token}`,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in processing API route:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch processing data" }),
      { status: 500 }
    );
  }
}
