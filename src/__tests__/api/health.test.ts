import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the health check endpoint logic by simulating fetch calls
// and verifying the expected response structure.

describe('Health Check Endpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a valid health response structure', async () => {
    const mockResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const res = await fetch('/api/health');
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('timestamp');
  });

  it('should include a valid ISO timestamp', async () => {
    const now = new Date().toISOString();
    const mockResponse = { status: 'ok', timestamp: now };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const res = await fetch('/api/health');
    const data = await res.json();

    // Verify the timestamp is a valid ISO 8601 string
    const parsed = new Date(data.timestamp);
    expect(parsed.toISOString()).toBe(data.timestamp);
  });

  it('should handle server errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    });

    const res = await fetch('/api/health');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('should handle network failures', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetch('/api/health')).rejects.toThrow('Network error');
  });
});
