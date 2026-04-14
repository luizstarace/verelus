'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpotifyUrlInput } from '@/components/onboarding/SpotifyUrlInput';
import { SocialUrlsInput } from '@/components/onboarding/SocialUrlsInput';
import { SurveyForm } from '@/components/onboarding/SurveyForm';
import type { SurveyResponse } from '@/lib/types/career';

const DEFAULT_SURVEY: SurveyResponse = {
  years_releasing: 'lt_6m',
  shows_performed: '0',
  lives_from_music: 'no',
  monthly_revenue: 'zero',
  has_management: 'none',
  release_frequency: 'sporadic',
  main_goal_12m: 'discovery',
  primary_genre: '',
  city: '',
  has_press_kit: 'none',
  production_quality: 'home',
  rights_registration: 'none',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [socials, setSocials] = useState<{ instagram?: string; tiktok?: string; youtube?: string }>({});
  const [survey, setSurvey] = useState<SurveyResponse>(DEFAULT_SURVEY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // 1. Fetch do Spotify (salva artist_data)
      const fetchRes = await fetch('/api/spotify/fetch-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotify_url: spotifyUrl, social_urls: socials }),
      });
      if (!fetchRes.ok) {
        const err = await fetchRes.json() as { error: string };
        throw new Error(err.error);
      }

      // 2. Gerar diagnostico
      const diagRes = await fetch('/api/diagnostic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey }),
      });
      if (!diagRes.ok) {
        const err = await diagRes.json() as { error: string };
        throw new Error(err.error);
      }
      const { diagnostic_id } = (await diagRes.json()) as { diagnostic_id: string };

      router.push(`/dashboard/diagnostic/${diagnostic_id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-brand-green' : 'bg-white/10'}`} />
          ))}
        </div>

        {error && (
          <div className="max-w-xl mx-auto bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <SpotifyUrlInput value={spotifyUrl} onChange={setSpotifyUrl} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <SocialUrlsInput value={socials} onChange={setSocials} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <SurveyForm value={survey} onChange={setSurvey} onSubmit={handleSubmit} onBack={() => setStep(2)} submitting={submitting} />
        )}
      </div>
    </div>
  );
}
