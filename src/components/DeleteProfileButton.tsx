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
    if (!window.confirm('Are you sure you want to permanently delete this profile?')) return;
    setLoading(true);
    const { error } = await supabase.from(table).delete().eq('id', recordId);
    setLoading(false);
    if (error) {
      alert(`Could not delete: ${error.message}`);
    } else {
      alert('Profile has been permanently deleted.');
      router.push(redirectPath);
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
    >
      <span>🗑️</span>
      <span>{loading ? 'Deleting...' : 'Delete Profile'}</span>
    </button>
  );
}

export { DeleteProfileButton };
