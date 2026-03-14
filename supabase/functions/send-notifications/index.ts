/**
 * send-notifications — Expo Push Notification sender for GovPass
 *
 * POST body options:
 *   { userId?: string, type: string, data?: Record<string,string> }  — standard
 *   { userId: string, type: 'lifecycle', day: number }               — lifecycle sequence
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BRAND = 'GovPass';

interface NotificationTemplate {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

// ─── D1–D30 Lifecycle Templates ───────────────────────────────────────────────
const LIFECYCLE_TEMPLATES: Record<string, NotificationTemplate> = {
  d1_welcome: {
    title: 'What benefits are you owed?',
    body: 'GovPass AI checks 200+ federal and state programs to find benefits you qualify for right now.',
    data: { type: 'lifecycle', day: 1, screen: '/(tabs)/eligibility' },
    sound: 'default',
  },
  d3_reengagement: {
    title: 'Reminder: Benefits check',
    body: "You haven't checked your benefits yet. The average person qualifies for 3+ programs they don't use.",
    data: { type: 'lifecycle', day: 3, screen: '/(tabs)/eligibility' },
    sound: 'default',
  },
  d7_achievement: {
    title: '💡 Form help available',
    body: 'GovPass can fill out government forms in plain language. Tap to try it on any document.',
    data: { type: 'lifecycle', day: 7, screen: '/(tabs)/documents', action: 'fill-form' },
    sound: 'default',
  },
  d14_upgrade: {
    title: 'Upgrade for full access',
    body: 'Unlock unlimited benefit checks and form assistance for $4.99/mo. Cancel anytime.',
    data: { type: 'lifecycle', day: 14, screen: '/(auth)/paywall' },
    sound: 'default',
    badge: 1,
  },
  d21_feature_discovery: {
    title: 'Tax credit season',
    body: 'You may qualify for EITC, Child Tax Credit, or state credits. GovPass can check in 2 minutes.',
    data: { type: 'lifecycle', day: 21, screen: '/(tabs)/eligibility', action: 'tax-credits' },
    sound: 'default',
  },
  d30_winback: {
    title: 'Benefits summary for March',
    body: 'GovPass found [X] programs you qualify for. You\'ve saved [X] hours on government paperwork.',
    data: { type: 'lifecycle', day: 30, screen: '/(tabs)/dashboard' },
    sound: 'default',
  },
};

const NOTIFICATIONS: Record<string, (d?: Record<string, string>) => NotificationTemplate> = {
  'new-benefit-found': (d) => ({
    title: `${BRAND}: New benefit found!`,
    body: d?.program ? `You may qualify for ${d.program}. Tap to see details.` : 'A new government benefit matches your profile.',
    data: { screen: '/(tabs)/eligibility', ...d },
    sound: 'default',
    badge: 1,
  }),
  'application-status': (d) => ({
    title: `${BRAND}: Application update`,
    body: d?.status ? `Your ${d.program ?? 'benefit'} application: ${d.status}` : 'Your benefit application has been updated.',
    data: { screen: '/(tabs)/applications', ...d },
    sound: 'default',
  }),
  'document-expiring': (d) => ({
    title: `${BRAND}: Document expiring`,
    body: d?.docName ? `"${d.docName}" expires in 30 days.` : 'A document is expiring soon. Renew to maintain eligibility.',
    data: { screen: '/(tabs)/documents', ...d },
    sound: 'default',
  }),
  'deadline-reminder': (d) => ({
    title: `${BRAND}: Application deadline`,
    body: d?.program ? `${d.program} application deadline: ${d.deadline ?? 'soon'}.` : 'An application deadline is approaching.',
    data: { screen: '/(tabs)/applications', ...d },
    sound: 'default',
    badge: 1,
  }),
  'subscription-expiring': (d) => ({
    title: `${BRAND}: Subscription expiring`,
    body: 'Your GovPass Pro subscription expires in 3 days.',
    data: { screen: '/(auth)/paywall', ...d },
    sound: 'default',
  }),
};

async function sendExpoPush(pushToken: string, n: NotificationTemplate) {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ to: pushToken, title: n.title, body: n.body, data: n.data ?? {}, sound: n.sound ?? 'default', badge: n.badge }),
  });
  const json = await res.json();
  const result = json.data ?? json;
  return { status: result.status ?? 'error', id: result.id };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let body: { userId?: string; type: string; day?: number; data?: Record<string, string> };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }

  const { userId, type, day, data: extraData } = body;

  // ── Lifecycle notification routing ──────────────────────────────────────────
  if (type === 'lifecycle') {
    const dayKey = `d${day}_${
      day === 1 ? 'welcome' :
      day === 3 ? 'reengagement' :
      day === 7 ? 'achievement' :
      day === 14 ? 'upgrade' :
      day === 21 ? 'feature_discovery' :
      day === 30 ? 'winback' : ''
    }`;
    const template = LIFECYCLE_TEMPLATES[dayKey];
    if (!template) return new Response(JSON.stringify({ error: `No lifecycle template for day ${day}` }), { status: 400 });

    let lcTokens: { push_token: string }[] = [];
    if (userId) {
      const { data } = await supabase.from('profiles').select('expo_push_token').eq('id', userId).not('expo_push_token', 'is', null).single();
      if (data?.expo_push_token) lcTokens = [{ push_token: data.expo_push_token }];
    } else {
      const { data } = await supabase.from('profiles').select('expo_push_token').not('expo_push_token', 'is', null);
      if (data) lcTokens = data.filter((p: { expo_push_token: string | null }) => p.expo_push_token).map((p: { expo_push_token: string }) => ({ push_token: p.expo_push_token }));
    }

    if (lcTokens.length === 0) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    const lcResults = await Promise.allSettled(lcTokens.map(({ push_token }) => sendExpoPush(push_token, template)));
    const lcSent = lcResults.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{ status: string }>).value.status === 'ok').length;
    console.log(`[govpass:send-notifications] lifecycle day=${day} sent=${lcSent} failed=${lcResults.length - lcSent}`);
    return new Response(JSON.stringify({ sent: lcSent, failed: lcResults.length - lcSent, total: lcResults.length }), { status: 200 });
  }

  // ── Standard notification routing ───────────────────────────────────────────
  const templateFn = NOTIFICATIONS[type];
  if (!templateFn) return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), { status: 400 });
  const notification = templateFn(extraData);

  let tokens: { push_token: string }[] = [];
  if (userId) {
    const { data } = await supabase.from('profiles').select('expo_push_token').eq('id', userId).not('expo_push_token', 'is', null).single();
    if (data?.expo_push_token) tokens = [{ push_token: data.expo_push_token }];
  } else {
    const { data } = await supabase.from('profiles').select('expo_push_token').not('expo_push_token', 'is', null);
    if (data) tokens = data.filter((p: { expo_push_token: string | null }) => p.expo_push_token).map((p: { expo_push_token: string }) => ({ push_token: p.expo_push_token }));
  }

  if (tokens.length === 0) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  const results = await Promise.allSettled(tokens.map(({ push_token }) => sendExpoPush(push_token, notification)));
  const sent = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{ status: string }>).value.status === 'ok').length;
  console.log(`[govpass:send-notifications] type=${type} sent=${sent}`);
  return new Response(JSON.stringify({ sent, failed: results.length - sent, total: results.length }), { status: 200 });
});
