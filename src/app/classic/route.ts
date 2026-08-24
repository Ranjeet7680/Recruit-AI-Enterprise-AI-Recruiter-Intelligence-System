import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const htmlPath = path.join(process.cwd(), 'frontend', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error reading classic HTML:', error);
    return new NextResponse('<h1>Failed to load TalentMind AI</h1>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
