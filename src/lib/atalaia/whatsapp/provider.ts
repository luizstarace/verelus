import type { AtalaiaBusiness, WhatsAppProvider } from '@/lib/types/atalaia';

export interface BusinessProviderContext {
  business_id: string;
  provider: WhatsAppProvider;
  // Evolution: instance name pattern `atalaia_<business_id>`
  evolution_instance: string;
  // Zenvia: BSP identifiers (null when provider is 'evolution' and no provisioning has happened)
  zenvia_phone_number_id: string | null;
  zenvia_subaccount_id: string | null;
  // Zenvia: actual E.164 phone displayed to customers (mirrors business.whatsapp_number after migration)
  zenvia_phone: string | null;
  // True when Evolution should still be honored as a fallback path
  // (e.g., during the 7d grace window after migrating to Zenvia, or during KYC pending).
  bridge_active: boolean;
}

type BusinessSubset = Pick<
  AtalaiaBusiness,
  | 'id'
  | 'whatsapp_provider'
  | 'whatsapp_byo'
  | 'whatsapp_number'
  | 'bsp_phone_number_id'
  | 'bsp_subaccount_id'
  | 'bsp_evolution_bridge_until'
>;

export function resolveProvider(business: BusinessSubset, now: Date = new Date()): BusinessProviderContext {
  const bridgeUntil = business.bsp_evolution_bridge_until
    ? new Date(business.bsp_evolution_bridge_until)
    : null;
  const bridgeActive = bridgeUntil !== null && bridgeUntil > now;

  return {
    business_id: business.id,
    provider: business.whatsapp_provider,
    evolution_instance: `atalaia_${business.id}`,
    zenvia_phone_number_id: business.bsp_phone_number_id,
    zenvia_subaccount_id: business.bsp_subaccount_id,
    zenvia_phone: business.whatsapp_provider === 'zenvia' ? business.whatsapp_number : null,
    bridge_active: bridgeActive,
  };
}
