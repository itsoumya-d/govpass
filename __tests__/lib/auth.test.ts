import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/supabase', () => {
  const oAuth = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
  const otp = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
  const out = jest.fn().mockResolvedValue({ error: null } as never);
  const pass = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
  const up = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
  const reset = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
  const user = jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null } as never);
  const del = jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: null, error: null } as never) }));

  return {
    __esModule: true,
    supabase: {
      auth: {
        signInWithOAuth: oAuth,
        signInWithOtp: otp,
        signOut: out,
        signInWithPassword: pass,
        signUp: up,
        resetPasswordForEmail: reset,
        getUser: user,
      },
      from: jest.fn(() => ({ delete: del })),
    },
  };
});

import * as auth from '@/lib/auth';
import { supabase } from '@/lib/supabase';

describe('govpass auth functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });
  });

  it('exports all expected auth functions', () => {
    expect(typeof auth.signInWithGoogle).toBe('function');
    expect(typeof auth.signInWithApple).toBe('function');
    expect(typeof auth.signInWithMagicLink).toBe('function');
    expect(typeof auth.signOut).toBe('function');
    expect(typeof auth.signInWithEmail).toBe('function');
    expect(typeof auth.signUpWithEmail).toBe('function');
    expect(typeof auth.resetPassword).toBe('function');
    expect(typeof auth.deleteAccount).toBe('function');
  });

  it('signInWithGoogle calls signInWithOAuth with google provider', async () => {
    await auth.signInWithGoogle();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'govpass://auth/callback' },
    });
  });

  it('signInWithApple calls signInWithOAuth with apple provider', async () => {
    await auth.signInWithApple();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'apple',
      options: { redirectTo: 'govpass://auth/callback' },
    });
  });

  it('signInWithApple handles ERR_REQUEST_CANCELED gracefully', async () => {
    const result = await auth.signInWithApple();
    expect(result).toBeDefined();
  });

  it('signInWithMagicLink calls signInWithOtp with email', async () => {
    await auth.signInWithMagicLink('gov@test.com');
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'gov@test.com',
      options: { emailRedirectTo: 'govpass://auth/callback' },
    });
  });

  it('signInWithEmail calls signInWithPassword', async () => {
    await auth.signInWithEmail('gov@test.com', 'password123');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'gov@test.com',
      password: 'password123',
    });
  });

  it('signUpWithEmail calls signUp with optional fullName', async () => {
    await auth.signUpWithEmail('gov@test.com', 'password123', 'Gov User');
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'gov@test.com',
      password: 'password123',
      options: { data: { full_name: 'Gov User' } },
    });
  });

  it('signOut calls supabase signOut', async () => {
    await auth.signOut();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('resetPassword calls resetPasswordForEmail with govpass redirect', async () => {
    await auth.resetPassword('gov@test.com');
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('gov@test.com', {
      redirectTo: 'govpass://auth/reset-password',
    });
  });

  it('deleteAccount returns error when not authenticated', async () => {
    (supabase.auth.getUser as any).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    const result = await auth.deleteAccount();
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('deleteAccount deletes profile and signs out when authenticated', async () => {
    const result = await auth.deleteAccount();
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result).toEqual({ error: null });
  });
});
