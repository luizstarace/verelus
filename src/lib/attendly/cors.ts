import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function corsHeaders() {
  return CORS_HEADERS;
}

export function corsResponse() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
