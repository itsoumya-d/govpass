/**
 * send-notifications — Expo Push Notification sender for GovPass
 * POST body: { userId?: string, type: string, data?: Record<string,string> }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BRAND = 'GovPass';

interface NotificationTemplate {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
}

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
  let body: { userId?: string; type: string; data?: Record<string, string> };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }

  const { userId, type, data: extraData } = body;
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
