import { useState, useEffect, createContext, useContext } from "react";

export type PlanTier = "free" | "pro" | "business";

interface TierContext {
  tier: PlanTier;
  loading: boolean;
}

const UserTierContext = createContext<TierContext>({ tier: "free", loading: true });

export function useUserTier() {
  return useContext(UserTierContext);
}

export { UserTierContext };

export function useUserTierFetch(): TierContext {
  const [tier, setTier] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/tier")
      .then((res) => res.json())
      .then((data) => {
        setTier(data.tier || "free");
        setLoading(false);
      })
      .catch(() => {
        setTier("free");
        setLoading(false);
      });
  }, []);

  return { tier, loading };
}

// Module to tier mapping — which modules require which plan
export const MODULE_TIER_REQUIREMENT: Record<string, PlanTier> = {
  // Free modules
  analysis: "free",
  pitching: "free",
  epk: "free",
  // Pro modules
  social: "pro",
  press: "pro",
  setlist: "pro",
  budget: "pro",
  contracts: "pro",
  reports: "pro",
  // Business modules
  tours: "business",
};

export function canAccess(userTier: PlanTier, module: string): boolean {
  const required = MODULE_TIER_REQUIREMENT[module] || "free";
  const tierLevel: Record<PlanTier, number> = { free: 0, pro: 1, business: 2 };
  return tierLevel[userTier] >= tierLevel[required];
}
