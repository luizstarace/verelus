import { useState, useEffect, createContext, useContext } from "react";

export type PlanTier = "free" | "pro";

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
        const t = data.tier || "free";
        setTier(t === "business" ? "pro" : t);
        setLoading(false);
      })
      .catch(() => {
        setTier("free");
        setLoading(false);
      });
  }, []);

  return { tier, loading };
}

export function isPro(tier: PlanTier): boolean {
  return tier === "pro";
}
