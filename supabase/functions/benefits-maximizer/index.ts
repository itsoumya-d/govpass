// Supabase Edge Function: benefits-maximizer
// AI analysis to maximize government benefits eligibility for a user profile

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { profile, eligiblePrograms, nearMissPrograms } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({
        priorityActions: ['Apply for SNAP first — fastest approval', 'Check Medicaid enrollment during open period'],
        hiddenOpportunities: ['Local utility assistance programs may be available in your area'],
        nearMissStrategy: 'You are close to qualifying for additional programs with minor income changes',
        estimatedUnclaimedValue: 0,
        applicationOrder: eligiblePrograms?.slice(0, 3) ?? [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const profileSummary = [
      `Household: ${profile?.householdSize ?? 1} people`,
      `Annual income: $${(profile?.annualIncome ?? 0).toLocaleString()}`,
      `State: ${profile?.state ?? 'CA'}`,
      `Age: ${profile?.age ?? 30}`,
      profile?.hasChildren ? `Children under 18: ${profile.childrenUnder18}` : '',
      profile?.veteran ? 'Veteran' : '',
      profile?.disabled ? 'Has disability' : '',
      profile?.elderly ? 'Age 65+' : '',
      profile?.unemployed ? 'Currently unemployed' : '',
      profile?.housingType ? `Housing: ${profile.housingType}` : '',
    ].filter(Boolean).join(', ');

    const eligibleList = (eligiblePrograms ?? []).map((p: any) => p.name ?? p).join(', ');
    const nearMissList = (nearMissPrograms ?? []).map((p: any) => p.name ?? p).join(', ');

    const prompt = `You are a government benefits counselor helping low-income Americans maximize their benefits.

User profile: ${profileSummary}
Already qualified for: ${eligibleList || 'none yet'}
Near-miss programs (close but not qualified): ${nearMissList || 'none'}

Provide strategic advice to maximize their benefits. Respond ONLY with this JSON:
{
  "priorityActions": ["Specific action 1 with program name", "Specific action 2", "Specific action 3"],
  "hiddenOpportunities": ["Lesser-known program they should check", "Local/state program", "One-time benefit they may have missed"],
  "nearMissStrategy": "Specific advice on how they could qualify for near-miss programs (1-2 sentences)",
  "applicationTip": "Single most important tip for successful applications (1 sentence)",
  "estimatedUnclaimedValue": number (estimated monthly value in dollars of unclaimed benefits they may still qualify for),
  "urgentDeadline": "Any time-sensitive enrollment period they should know about, or null"
}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!openaiRes.ok) {
      return new Response(JSON.stringify({ error: 'OpenAI error' }), { status: 502, headers: corsHeaders });
    }

    const data = await openaiRes.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        priorityActions: ['Apply for your highest-value program first', 'Gather income documentation', 'Check local food bank programs'],
        hiddenOpportunities: ['LIHEAP energy assistance', 'WIC if children under 5', 'Local emergency rental assistance'],
        nearMissStrategy: 'Review income calculation carefully — some income types are excluded from benefit calculations.',
        applicationTip: 'Apply online during off-peak hours (early morning) for faster processing.',
        estimatedUnclaimedValue: 0,
        urgentDeadline: null,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
