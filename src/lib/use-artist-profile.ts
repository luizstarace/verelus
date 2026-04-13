import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase-browser";

export interface ArtistProfile {
  band_name: string;
  genre: string;
  bio: string;
  city: string;
  country: string;
  artist_type: string;
}

interface ArtistProfileContext {
  profile: ArtistProfile | null;
  loading: boolean;
}

const ArtistProfileCtx = createContext<ArtistProfileContext>({
  profile: null,
  loading: true,
});

export function useArtistProfile() {
  return useContext(ArtistProfileCtx);
}

export { ArtistProfileCtx };

export function useArtistProfileFetch(): ArtistProfileContext {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("artist_profiles")
          .select("band_name, genre, bio, city, country, artist_type")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setProfile({
            band_name: data.band_name || "",
            genre: data.genre || "",
            bio: data.bio || "",
            city: data.city || "",
            country: data.country || "",
            artist_type: data.artist_type || "",
          });
        }
      } catch {
        // Profile not found — that's ok
      }
      setLoading(false);
    }

    load();
  }, []);

  return { profile, loading };
}
