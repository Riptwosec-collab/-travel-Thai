import { supabase } from '@/lib/supabase';
import { useTravelStore } from '@/store/useTravelStore';

const TABLES = {
  profile: 'travel_profiles',
  visitedPlaces: 'travel_visited_places',
  wishlistPlaces: 'travel_wishlist_places',
  visitedProvinces: 'travel_visited_provinces',
  wishlistProvinces: 'travel_wishlist_provinces',
  trips: 'travel_trips',
  journals: 'travel_journals',
} as const;

const requireUser = async () => {
  if (!supabase) throw new Error('ยังไม่ได้ตั้งค่า Supabase');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อน');
  return user;
};

const replaceIds = async (table:string, userId:string, field:string, ids:string[]) => {
  const { error: deleteError } = await supabase!.from(table).delete().eq('user_id', userId);
  if (deleteError) throw deleteError;
  if (!ids.length) return;
  const { error } = await supabase!.from(table).insert(ids.map(id => ({ user_id:userId, [field]:id })));
  if (error) throw error;
};

export async function syncToCloud(){
  const user = await requireUser();
  const s = useTravelStore.getState();
  const updatedAt = new Date().toISOString();

  const { error: profileError } = await supabase!.from(TABLES.profile).upsert({
    user_id:user.id,
    preferences:s.preferences,
    updated_at:updatedAt,
  });
  if (profileError) throw profileError;

  await Promise.all([
    replaceIds(TABLES.visitedPlaces,user.id,'place_id',s.visitedPlaceIds),
    replaceIds(TABLES.wishlistPlaces,user.id,'place_id',s.wishlistPlaceIds),
    replaceIds(TABLES.visitedProvinces,user.id,'province_id',s.visitedProvinceIds),
    replaceIds(TABLES.wishlistProvinces,user.id,'province_id',s.wishlistProvinceIds),
  ]);

  const { error: tripDeleteError } = await supabase!.from(TABLES.trips).delete().eq('user_id',user.id);
  if (tripDeleteError) throw tripDeleteError;
  if (s.trips.length) {
    const { error } = await supabase!.from(TABLES.trips).insert(
      s.trips.map(t => ({ id:t.id, user_id:user.id, data:t, updated_at:updatedAt }))
    );
    if (error) throw error;
  }

  const { error: journalDeleteError } = await supabase!.from(TABLES.journals).delete().eq('user_id',user.id);
  if (journalDeleteError) throw journalDeleteError;
  if (s.journals.length) {
    const { error } = await supabase!.from(TABLES.journals).insert(
      s.journals.map(j => ({ id:j.id, user_id:user.id, data:j, updated_at:updatedAt }))
    );
    if (error) throw error;
  }
}

export async function restoreFromCloud(){
  const user = await requireUser();
  const [vp,wp,vpr,wpr,tr,jr,pr] = await Promise.all([
    supabase!.from(TABLES.visitedPlaces).select('place_id').eq('user_id',user.id),
    supabase!.from(TABLES.wishlistPlaces).select('place_id').eq('user_id',user.id),
    supabase!.from(TABLES.visitedProvinces).select('province_id').eq('user_id',user.id),
    supabase!.from(TABLES.wishlistProvinces).select('province_id').eq('user_id',user.id),
    supabase!.from(TABLES.trips).select('data').eq('user_id',user.id),
    supabase!.from(TABLES.journals).select('data').eq('user_id',user.id),
    supabase!.from(TABLES.profile).select('preferences').eq('user_id',user.id).maybeSingle(),
  ]);

  for (const result of [vp,wp,vpr,wpr,tr,jr,pr]) {
    if (result.error) throw result.error;
  }

  useTravelStore.setState({
    visitedPlaceIds:(vp.data||[]).map(x=>x.place_id),
    wishlistPlaceIds:(wp.data||[]).map(x=>x.place_id),
    visitedProvinceIds:(vpr.data||[]).map(x=>x.province_id),
    wishlistProvinceIds:(wpr.data||[]).map(x=>x.province_id),
    trips:(tr.data||[]).map(x=>x.data),
    journals:(jr.data||[]).map(x=>x.data),
    ...(pr.data?.preferences ? {preferences:pr.data.preferences} : {}),
  });
}
