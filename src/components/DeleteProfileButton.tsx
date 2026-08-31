'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function DeleteProfileButton({
  recordId,
  table,
  redirectPath = '/',
}: {
  recordId: string;
  table: 'players' | 'club_ads';
  redirectPath?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Är du säker på att du vill ta bort denna profil permanent?')) return;
    setLoading(true);
    const { error } = await supabase.from(table).delete().eq('id', recordId);
    setLoading(false);
    if (error) {
      alert(`Kunde inte radera: ${error.message}`);
    } else {
      alert('Profilen har raderats.');
      router.push(redirectPath);
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
    >
      <span>🗑️</span>
      <span>{loading ? 'Raderar...' : 'Ta bort profil'}</span>
    </button>
  );
}

export { DeleteProfileButton };
