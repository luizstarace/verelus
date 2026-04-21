import { SupabaseClient } from '@supabase/supabase-js';
import { getCurrentPeriod } from './chat';
import { AttendlyPlan } from '@/lib/types/attendly';
import { getPlanLimits } from './plans';

export async function incrementUsage(
  supabase: SupabaseClient,
  businessId: string,
  tokensUsed: number
) {
  const period = getCurrentPeriod();

  const { data: existing } = await supabase
    .from('attendly_usage')
    .select('id, text_messages, tokens_total')
    .eq('business_id', businessId)
    .eq('period', period)
    .single();

  if (existing) {
    await supabase
      .from('attendly_usage')
      .update({
        text_messages: existing.text_messages + 1,
        tokens_total: existing.tokens_total + tokensUsed,
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('attendly_usage')
      .insert({
        business_id: businessId,
        period,
        text_messages: 1,
        tokens_total: tokensUsed,
      });
  }
}

export async function checkUsageLimit(
  supabase: SupabaseClient,
  businessId: string,
  plan: AttendlyPlan
): Promise<{ withinLimit: boolean; percentage: number }> {
  const period = getCurrentPeriod();
  const limits = getPlanLimits(plan);

  const { data } = await supabase
    .from('attendly_usage')
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
