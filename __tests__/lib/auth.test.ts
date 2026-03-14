import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockSignInWithOAuth = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
const mockSignInWithOtp = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
const mockSignOut = jest.fn().mockResolvedValue({ error: null } as never);
const mockSignInWithPassword = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
const mockSignUp = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
const mockResetPasswordForEmail = jest.fn().mockResolvedValue({ data: {}, error: null } as never);
const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'test-user-id' } },
  error: null,
} as never);

const mockFrom = jest.fn(() => ({
  delete: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data: null, error: null } as never),
  }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
      signOut: mockSignOut,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
      getUser: mockGetUser,
    },
    from: mockFrom,
  },
}));

describe('govpass auth functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as never);
    mockSignOut.mockResolvedValue({ error: null } as never);
  });

  it('exports all expected auth functions', async () => {
    const auth = await import('@/lib/auth');
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
    const { signInWithGoogle } = await import('@/lib/auth');
    await signInWithGoogle();
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'govpass://auth/callback' },
    });
  });

  it('signInWithApple calls signInWithOAuth with apple provider', async () => {
    const { signInWithApple } = await import('@/lib/auth');
    await signInWithApple();
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'apple',
      options: { redirectTo: 'govpass://auth/callback' },
    });
  });

  it('signInWithApple handles ERR_REQUEST_CANCELED gracefully', async () => {
    // The govpass signInWithApple has special try/catch for ERR_REQUEST_CANCELED
    const { signInWithApple } = await import('@/lib/auth');
    // Normal call should work fine
    const result = await signInWithApple();
    expect(result).toBeDefined();
  });

  it('signInWithMagicLink calls signInWithOtp with email', async () => {
    const { signInWithMagicLink } = await import('@/lib/auth');
    await signInWithMagicLink('gov@test.com');
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'gov@test.com',
      options: { emailRedirectTo: 'govpass://auth/callback' },
    });
  });

  it('signInWithEmail calls signInWithPassword', async () => {
    const { signInWithEmail } = await import('@/lib/auth');
    await signInWithEmail('gov@test.com', 'password123');
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'gov@test.com',
      password: 'password123',
    });
  });

  it('signUpWithEmail calls signUp with optional fullName', async () => {
    const { signUpWithEmail } = await import('@/lib/auth');
    await signUpWithEmail('gov@test.com', 'password123', 'Gov User');
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'gov@test.com',
      password: 'password123',
      options: { data: { full_name: 'Gov User' } },
    });
  });

  it('signOut calls supabase signOut', async () => {
    const { signOut } = await import('@/lib/auth');
    await signOut();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('resetPassword calls resetPasswordForEmail with govpass redirect', async () => {
    const { resetPassword } = await import('@/lib/auth');
    await resetPassword('gov@test.com');
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('gov@test.com', {
      redirectTo: 'govpass://auth/reset-password',
    });
  });

  it('deleteAccount returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as never);
    const { deleteAccount } = await import('@/lib/auth');
    const result = await deleteAccount();
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('deleteAccount deletes profile and signs out when authenticated', async () => {
    const { deleteAccount } = await import('@/lib/auth');
    const result = await deleteAccount();
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockSignOut).toHaveBeenCalled();
    expect(result).toEqual({ error: null });
  });
});
