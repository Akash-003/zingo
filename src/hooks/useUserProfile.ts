import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useUserStore } from '../store/userStore';

export function useUserProfile() {
  const [loading, setLoading] = useState(false);
  const setName = useUserStore((s) => s.setName);
  const setPrimaryPhotoUrl = useUserStore((s) => s.setPrimaryPhotoUrl);
  const setPhotos = useUserStore((s) => s.setPhotos);
  const setIsPremium = useUserStore((s) => s.setIsPremium);
  const reset = useUserStore((s) => s.reset);
  const uid = useUserStore((s) => s.uid);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name, primary_photo_url, photos, is_premium')
        .eq('id', userId)
        .single();
      if (data?.name) setName(data.name);
      if (data?.primary_photo_url) setPrimaryPhotoUrl(data.primary_photo_url);
      if (data?.photos) setPhotos(data.photos);
      if (data?.is_premium != null) setIsPremium(data.is_premium);
    } finally {
      setLoading(false);
    }
  };

  const updateName = async (name: string) => {
    if (!uid) return;
    setLoading(true);
    try {
      await supabase.from('profiles').upsert({ id: uid, name });
      setName(name);
    } finally {
      setLoading(false);
    }
  };

  const setPrimaryPhoto = async (url: string) => {
    if (!uid) return;
    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ primary_photo_url: url })
        .eq('id', uid);
      setPrimaryPhotoUrl(url);
    } finally {
      setLoading(false);
    }
  };

  const addPhoto = async (url: string) => {
    if (!uid) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('photos, primary_photo_url')
        .eq('id', uid)
        .single();
      const current: string[] = data?.photos ?? [];
      const updated = [...current, url];
      await supabase.from('profiles').update({ photos: updated }).eq('id', uid);
      setPhotos(updated);
      if (!data?.primary_photo_url) {
        await setPrimaryPhoto(url);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    reset();
  };

  return { loading, fetchProfile, updateName, addPhoto, setPrimaryPhoto, signOut };
}
