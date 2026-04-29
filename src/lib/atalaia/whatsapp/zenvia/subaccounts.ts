import { getZenviaClient } from './client';

/**
 * Sub-account / KYC operations.
 *
 * IMPORTANT: these are PARTNER-tier endpoints. Verelus needs a partner contract
 * with Zenvia for them to work. The exact paths below mirror Zenvia's public
 * partner docs but MUST be confirmed against the actual contract before relying
 * on them in production. If the partner contract uses different paths, override
 * via env vars or update the constants.
 */

const SUBACCOUNT_BASE = process.env.ZENVIA_SUBACCOUNT_PATH || '/v2/accounts';

export interface CreateSubaccountInput {
  business_id: string;       // our internal id, used as external_id on Zenvia
  business_name: string;
  contact_email: string;
  contact_name?: string;
}

export interface SubaccountResult {
  ok: boolean;
  subaccount_id: string | null;
  error?: string;
  raw?: unknown;
}

export async function createSubaccount(input: CreateSubaccountInput): Promise<SubaccountResult> {
  const client = getZenviaClient();
  const res = await client.request<{ id?: string; account_id?: string }>(
    'POST',
    SUBACCOUNT_BASE,
    {
      external_id: input.business_id,
      name: input.business_name,
      contact: {
        email: input.contact_email,
        name: input.contact_name || input.business_name,
      },
    }
  );
  if (!res.ok || !res.data) {
    return { ok: false, subaccount_id: null, error: res.error, raw: res.data };
  }
  const id = res.data.id || res.data.account_id || null;
  return { ok: Boolean(id), subaccount_id: id, raw: res.data };
}

export interface SubmitKycInput {
  subaccount_id: string;
  business_name: string;
  document: string;          // CNPJ
  display_name: string;      // exibido no WhatsApp
  category?: string;         // BUSINESS / RETAIL / etc — Meta categories
}

export interface SubmitKycResult {
  ok: boolean;
  kyc_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  error?: string;
  raw?: unknown;
}

export async function submitKyc(input: SubmitKycInput): Promise<SubmitKycResult> {
  const client = getZenviaClient();
  const res = await client.request<{ id?: string; status?: string }>(
    'POST',
    `${SUBACCOUNT_BASE}/${input.subaccount_id}/kyc`,
    {
      business_name: input.business_name,
      document: input.document,
      display_name: input.display_name,
      category: input.category || 'BUSINESS',
    }
  );
  if (!res.ok || !res.data) {
    return { ok: false, kyc_id: null, status: null, error: res.error, raw: res.data };
  }
  const status = res.data.status as SubmitKycResult['status'];
  return { ok: true, kyc_id: res.data.id || null, status: status || 'pending', raw: res.data };
}

export interface KycStatusResult {
  ok: boolean;
  status: 'pending' | 'approved' | 'rejected' | null;
  rejection_reason?: string;
  error?: string;
  raw?: unknown;
}

export async function fetchKycStatus(subaccountId: string): Promise<KycStatusResult> {
  const client = getZenviaClient();
  const res = await client.request<{ status?: string; reason?: string }>(
    'GET',
    `${SUBACCOUNT_BASE}/${subaccountId}/kyc`
  );
  if (!res.ok || !res.data) {
    return { ok: false, status: null, error: res.error, raw: res.data };
  }
  return {
    ok: true,
    status: (res.data.status as KycStatusResult['status']) || 'pending',
    rejection_reason: res.data.reason,
    raw: res.data,
  };
}
