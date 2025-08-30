import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PATCH');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Build the backend URL
    const path = pathSegments.join('/');
    const url = new URL(request.url);
    const backendUrl = `${BACKEND_URL}/${path}${url.search}`;

    // Get the request body for non-GET requests
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch (error) {
        // No body to read
      }
    }

    // Forward headers (excluding some that shouldn't be forwarded)
    const headers: HeadersInit = {};
    const excludedHeaders = [
      'host',
      'connection',
      'x-forwarded-for',
      'x-forwarded-proto',
      'x-forwarded-host',
      'content-length'
    ];

    for (const [key, value] of request.headers.entries()) {
      if (!excludedHeaders.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    }

    // Make the request to the backend
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    });

    // Get response data
    const responseData = await response.text();

    // Create response with same status and headers
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy response headers (excluding some that shouldn't be forwarded)
    const excludedResponseHeaders = [
      'connection',
      'transfer-encoding',
      'content-encoding'
    ];

    for (const [key, value] of response.headers.entries()) {
      if (!excludedResponseHeaders.includes(key.toLowerCase())) {
        nextResponse.headers.set(key, value);
      }
    }

    return nextResponse;

  } catch (error) {
    console.error('API Proxy Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
