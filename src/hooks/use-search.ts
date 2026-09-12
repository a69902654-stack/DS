import { useState, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { User } from '@/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useSearchUsers(currentUserId: string) {
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (query: string) => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        return;
      }

      setLoading(true);

      // Escape PostgREST special characters so user input can't break the filter
      const safe = q.replace(/[,()]/g, ' ').trim();
      let data: User[] | null = null;
      let error: { message: string } | null = null;

      if (UUID_RE.test(q)) {
        // Only filter by id when the input actually looks like a UUID
        ({ data, error } = await supabase.from('users').select('*').eq('id', q).limit(20));
      } else {
        ({ data, error } = await supabase
          .from('users')
          .select('*')
          .or(`username.ilike.%${safe}%,name.ilike.%${safe}%`)
          .neq('id', currentUserId || '00000000-0000-0000-0000-000000000000')
          .limit(20));
      }

      if (error) {
        console.warn('[DS] search error:', error.message);
        setResults([]);
      } else {
        setResults((data as User[]) ?? []);
      }
      setLoading(false);
    },
    [currentUserId]
  );

  return { results, loading, search };
}
