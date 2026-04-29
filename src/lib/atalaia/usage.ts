import { SupabaseClient } from '@supabase/supabase-js';
import { getCurrentPeriod } from './chat';
import { AtalaiaPlan } from '@/lib/types/atalaia';
import { getPlanLimits } from './plans';

export async function incrementUsage(
  supabase: SupabaseClient,
  businessId: string,
  tokensUsed: number
) {
  await supabase.rpc('increment_usage', {
    p_business_id: businessId,
    p_tokens: tokensUsed,
  });
}

export async function checkUsageLimit(
  supabase: SupabaseClient,
  businessId: string,
  plan: AtalaiaPlan
): Promise<{ withinLimit: boolean; percentage: number }> {
  const period = getCurrentPeriod();
  const limits = getPlanLimits(plan);

  const { data } = await supabase
    .from('atalaia_usage')
    .select('text_messages')
    .eq('business_id', businessId)
    .eq('period', period)
    .single();

  const used = data?.text_messages || 0;
  const percentage = Math.round((used / limits.text_messages) * 100);

  return {
    withinLimit: used < limits.text_messages,
    percentage,
  };
}
