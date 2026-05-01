import { getTwilioClient } from './client';

/**
 * WhatsApp Sender lifecycle on Twilio.
 *
 * Each Twilio phone number that wants to receive WhatsApp messages has to be
 * registered as a "Sender" with the WhatsApp Business profile of the end
 * customer (the PME using Atalaia). Twilio submits this to Meta on our
 * behalf — approval typically takes 3-5 business days.
 *
 * Endpoint base: https://messaging.twilio.com/v2/Channels/Senders
 *
 * NOTE: the exact field names in the Senders payload (especially around
 * profile/business name) may vary by Twilio API version. The defaults below
 * mirror the public docs as of 2026-Q2; verify against the contract during
 * the first manual provision before depending on automation.
 */

export interface SubmitSenderInput {
  phone_sid: string;          // Twilio PN SID from numbers.rentBrazilianNumber
  phone_number: string;        // E.164, used as the Sender ID
  display_name: string;        // public name shown on WhatsApp (subject to Meta)
  business_name: string;       // legal/brand name of the end customer (PME)
  webhook_url: string;         // where Twilio will POST inbound messages
}

export interface SubmitSenderResult {
  ok: boolean;
  sender_sid: string | null;
  status: SenderStatus | null;
  error?: string;
  raw?: unknown;
}

export type SenderStatus =
  | 'CREATING'
  | 'REGISTERING'
  | 'VERIFYING'
  | 'ONLINE'        // Approved, ready to send
  | 'OFFLINE'       // Suspended
  | 'FAILED'        // Rejected
  | 'DELETED';

interface SenderResource {
  sid?: string;
  status?: string;
  status_reason?: string;
}

export async function requestSenderApproval(input: SubmitSenderInput): Promise<SubmitSenderResult> {
  const client = getTwilioClient();
  if (!client.configured) {
    return { ok: false, sender_sid: null, status: null, error: 'twilio not configured' };
  }

  // Twilio Senders API expects JSON body for v2 endpoints. Our `request` helper
  // currently sends form-encoded bodies — the Messaging Senders API accepts
  // form-encoded input as well for the simplified fields we use here.
  const res = await client.request<SenderResource>('POST', 'messaging', '/v2/Channels/Senders', {
    SenderId: `whatsapp:${input.phone_number}`,
    'Profile.Name': input.display_name.slice(0, 25), // WhatsApp display name limit
    'Profile.About': `${input.business_name} - atendimento via Atalaia`,
    Webhook: input.webhook_url,
  });

  if (!res.ok || !res.data?.sid) {
    return { ok: false, sender_sid: null, status: null, error: res.error, raw: res.data };
  }

  return {
    ok: true,
    sender_sid: res.data.sid,
    status: (res.data.status as SenderStatus) || 'CREATING',
    raw: res.data,
  };
}

export interface SenderStatusResult {
  ok: boolean;
  status: SenderStatus | null;
  status_reason?: string;
  error?: string;
  raw?: unknown;
}

export async function fetchSenderStatus(senderSid: string): Promise<SenderStatusResult> {
  const client = getTwilioClient();
  if (!client.configured) {
    return { ok: false, status: null, error: 'twilio not configured' };
  }

  const res = await client.request<SenderResource>(
    'GET',
    'messaging',
    `/v2/Channels/Senders/${senderSid}`
  );
  if (!res.ok || !res.data) {
    return { ok: false, status: null, error: res.error, raw: res.data };
  }
  return {
    ok: true,
    status: (res.data.status as SenderStatus) || null,
    status_reason: res.data.status_reason,
    raw: res.data,
  };
}

/**
 * Deregister a Sender — idempotent. Treats 404 as success (already gone).
 */
export async function deregisterSender(senderSid: string): Promise<{ ok: boolean; error?: string }> {
  const client = getTwilioClient();
  if (!client.configured) {
    return { ok: false, error: 'twilio not configured' };
  }
  const res = await client.request('DELETE', 'messaging', `/v2/Channels/Senders/${senderSid}`);
  if (res.ok || res.status === 404) {
    return { ok: true };
  }
  return { ok: false, error: res.error };
}

/**
 * Map Twilio's status to our internal kyc_status enum
 * ('pending', 'approved', 'rejected').
 */
export function mapSenderStatusToKyc(status: SenderStatus | null): 'pending' | 'approved' | 'rejected' {
  if (status === 'ONLINE') return 'approved';
  if (status === 'FAILED' || status === 'DELETED') return 'rejected';
  return 'pending';
}
