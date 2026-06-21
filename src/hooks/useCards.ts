import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { useCardsStore, Card } from '../store/cardsStore';

const PAGE_SIZE = 10;

export function useCards() {
  const currentCategory = useCardsStore((s) => s.currentCategory);
  const setCards = useCardsStore((s) => s.setCards);
  const appendCards = useCardsStore((s) => s.appendCards);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offset = useRef(0);
  const loadingRef = useRef(false);

  const mapRow = (row: Record<string, unknown>): Card => ({
    id: row.id as string,
    imageUrl: row.image_url as string,
    category: row.category as string,
    isPremium: row.is_premium as boolean,
    createdAt: new Date(row.created_at as string).getTime(),
    supportsPersonalization: (row.supports_personalization as boolean) ?? true,
    photoSlot: (row.photo_slot as Card['photoSlot']) ?? null,
    nameSlot: (row.name_slot as Card['nameSlot']) ?? null,
  });

  const fetchPage = async (reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const from = reset ? 0 : offset.current;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (currentCategory !== 'all') {
      query = query.eq('category', currentCategory);
    }

    const { data, error } = await query;
    loadingRef.current = false;
    setLoading(false);

    if (error || !data) return;

    const cards = data.map(mapRow);

    if (reset) {
      setCards(cards);
      offset.current = cards.length;
    } else {
      appendCards(cards);
      offset.current += cards.length;
    }

    setHasMore(data.length === PAGE_SIZE);
  };

  useEffect(() => {
    offset.current = 0;
    setHasMore(true);
    fetchPage(true);
  }, [currentCategory]);

  return {
    loading,
    hasMore,
    fetchMore: () => fetchPage(false),
  };
}
