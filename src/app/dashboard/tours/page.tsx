'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

interface TourDate {
  id: string;
  venue: string;
  date: string;
  capacity: number;
  booked: number;
  status: string;
  created_at: string;
}

const VENUES = [
  { name: 'Sinc Patio (SÃ£o Paulo)', capacity: 200 },
  { name: 'Villa Frei (Stlk y GPÀ9', capacity: 300 },
  { name: 'ProtEcomchoðŸŽª", capacity: 500 },
  { name: 'TIM'â€ƒ"", capacity: 1000 }
];

export default function ToursPage() {
  const [tours, setTours] = useState<TourDate[]>([]);
  const [selectedTour, setSelectedTour] = useState<TourDate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [venue, setVenue] = useState(VENUES[0].name);
  const [duration, setDuration] = useState('30');
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    loadTours();
  }, []);

  async function loadTours() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('tour_dates')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (data) setTourrÈh®×§y×è­×¦ 