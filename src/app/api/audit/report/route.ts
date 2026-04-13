export const runtime = "edge";
import { NextRequest, NextResponse } from 'next/server';

interface AuditCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration?: number;
}

interface AuditReport {
  timestamp: string;
  overall: 'pass' | 'fail' | 'warn';
  checks: AuditCheck[];
}

const PAGES_TO_CHECK = ['/', '/login'];

async function checkPage(
  baseUrl: string,
  path: string
): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const url = `${baseUrl}${path}`;

  // Check response status and time
  try {
    const start = Date.now();
    const res = await fetch(url, { cache: 'no-store' });
    const duration = Date.now() - start;

    checks.push({
      name: `${path} - HTTP Status`,
      status: res.ok ? 'pass' : 'fail',
      message: res.ok ? `Returned ${res.status}` : `Returned ${res.status}`,
      duration,
    });

    checks.push({
      name: `${path} - Response Time`,
      status: duration < 2000 ? 'pass' : duration < 5000 ? 'warn' : 'fail',
      message: `${duration}ms`,
      duration,
    });

    // Check HTML content for meta tags
    const html = await res.text();

    const hasViewport = html.includes('name="viewport"');
    checks.push({
      name: `${path} - Viewport Meta`,
      status: hasViewport ? 'pass' : 'fail',
      message: hasViewport ? 'Present' : 'Missing viewport meta tag',
    });

    const hasDescription = html.includes('name="description"');
    checks.push({
      name: `${path} - Description Meta`,
      status: hasDescription ? 'pass' : 'warn',
      message: hasDescription ? 'Present' : 'Missing description meta tag',
    });

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    checks.push({
      name: `${path} - Title Tag`,
      status: titleMatch && titleMatch[1].trim().length > 0 ? 'pass' : 'fail',
      message: titleMatch ? `"${titleMatch[1].trim()}"` : 'Missing title tag',
    });

    // Check for images without alt
    const imgWithoutAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
    checks.push({
      name: `${path} - Image Alt Text`,
      status: imgWithoutAlt === 0 ? 'pass' : 'warn',
      message:
        imgWithoutAlt === 0
          ? 'All images have alt text'
          : `${imgWithoutAlt} image(s) missing alt text`,
    });
  } catch (error) {
    checks.push({
      name: `${path} - Availability`,
      status: 'fail',
      message: `Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return checks;
}

export async function GET(request: NextRequest) {
  // Protect by service role key
  const authHeader = request.headers.get('authorization');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BASE_URL ||
    'http://localhost:3000';

  const allChecks: AuditCheck[] = [];

  for (const path of PAGES_TO_CHECK) {
    const pageChecks = await checkPage(baseUrl, path);
    allChecks.push(...pageChecks);
  }

  const hasFail = allChecks.some((c) => c.status === 'fail');
  const hasWarn = allChecks.some((c) => c.status === 'warn');

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    overall: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass',
    checks: allChecks,
  };

  return NextResponse.json(report);
}
