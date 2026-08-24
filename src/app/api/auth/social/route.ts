import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || 'user@nexora.ai';
    const role = email.toLowerCase().includes('ranjeet') ? 'admin' : 'recruiter';
    
    return NextResponse.json({
      access_token: 'mock-jwt-token-nexora-' + Date.now(),
      token_type: 'bearer',
      expires_in: 86400,
      role: role
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
