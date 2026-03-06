import { supabase } from './supabase';

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'govpass://auth/callback',
    },
  });
  return { data, error };
}

export async function signInWithApple() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'govpass://auth/callback',
      },
    });
    return { data, error };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return { data: null, error: null };
    }
    return { data: null, error: e };
  }
}

export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'govpass://auth/callback' },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
