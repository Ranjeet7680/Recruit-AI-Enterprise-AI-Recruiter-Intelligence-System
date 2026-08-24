import fs from 'fs';
import path from 'path';

export async function GET() {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'specification.pdf'),
    path.join(process.cwd(), 'NEXORA_Enterprise_AI_Recruiter_Specification.pdf'),
  ];

  let fileBuffer: Buffer | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      fileBuffer = fs.readFileSync(p);
      break;
    }
  }

  if (!fileBuffer) {
    return new Response('PDF specification not found on server', { status: 404 });
  }

  return new Response(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="NEXORA_Enterprise_AI_Recruiter_Specification.pdf"',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
