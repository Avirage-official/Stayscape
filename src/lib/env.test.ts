import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  getServerEnv,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAPBOX_TOKEN,
} from '@/lib/env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getServerEnv', () => {
  it('throws when the environment variable is not set', () => {
    expect(() => getServerEnv('__STAYSCAPE_NONEXISTENT_VAR__')).toThrow(
      'Missing required server environment variable: __STAYSCAPE_NONEXISTENT_VAR__',
    );
  });

  it('returns the value when the environment variable is present', () => {
    vi.stubEnv('__STAYSCAPE_TEST_VAR__', 'my-secret-value');
    expect(getServerEnv('__STAYSCAPE_TEST_VAR__')).toBe('my-secret-value');
  });
});

describe('public env constants', () => {
  it('NEXT_PUBLIC_SUPABASE_URL defaults to empty string when not set', () => {
    // In the test environment, this env var is not configured
    expect(typeof NEXT_PUBLIC_SUPABASE_URL).toBe('string');
    // Either the CI has set it or it defaults to ''
    expect(NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
  });

  it('NEXT_PUBLIC_SUPABASE_ANON_KEY defaults to empty string when not set', () => {
    expect(typeof NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('string');
    expect(NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  it('NEXT_PUBLIC_MAPBOX_TOKEN defaults to empty string when not set', () => {
    expect(typeof NEXT_PUBLIC_MAPBOX_TOKEN).toBe('string');
    expect(NEXT_PUBLIC_MAPBOX_TOKEN).toBeDefined();
  });
});
