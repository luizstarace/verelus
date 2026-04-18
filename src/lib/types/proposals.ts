// src/lib/types/proposals.ts

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  title: string;
  email: string;
  phone: string;
  avatar_url: string;
  website: string;
  created_at: string;
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired';

export interface Proposal {
  id: string;
  user_id: string;
  slug: string;
  client_name: string;
  client_email: string;
  project_title: string;
  scope: string;
  price_cents: number;
  deadline_days: number;
  valid_until: string;
  payment_terms: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
}

export interface ProposalView {
  id: string;
  proposal_id: string;
  viewer_ip: string;
  user_agent: string;
  viewed_at: string;
  duration_seconds: number;
}

export interface ProposalAccept {
  id: string;
  proposal_id: string;
  acceptor_name: string;
  acceptor_ip: string;
  accepted_at: string;
}

export interface ProposalCreateInput {
  client_name: string;
  client_email?: string;
  project_title: string;
  scope: string;
  price_cents: number;
  deadline_days: number;
  valid_until?: string;
  payment_terms?: string;
}

export interface ProposalWithAnalytics extends Proposal {
  view_count: number;
  total_duration_seconds: number;
  last_viewed_at: string | null;
  accepted_at: string | null;
  acceptor_name: string | null;
}

export interface DashboardSummary {
  total_proposals: number;
  open_proposals: number;
  pipeline_cents: number;
  acceptance_rate: number;
}
