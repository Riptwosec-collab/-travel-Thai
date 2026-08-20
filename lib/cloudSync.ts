import { supabase } from '@/lib/supabase';
import { requireTravelSession } from '@/lib/travelAuth';
import { useTravelStore } from '@/store/useTravelStore';

interface TravelCloudState {
  version: number;
  visitedPlaceIds: string[];
  wishlistPlaceIds: string[];
  visitedProvinceIds: string[];
  wishlistProvinceIds: string[];
  trips: ReturnType<typeof useTravelStore.getState>['trips'];
  journals: ReturnType<typeof useTravelStore.getState>['journals'];
  preferences: ReturnType<typeof useTravelStore.getState>['preferences'];
}

export async function syncToCloud(){
  if (!supabase) throw new Error('ยังไม่ได้เชื่อม Supabase');
  const session = await requireTravelSession();
  const s = useTravelStore.getState();
  const state: TravelCloudState = {
    version: 1,
    visitedPlaceIds: s.visitedPlaceIds,
    wishlistPlaceIds: s.wishlistPlaceIds,
    visitedProvinceIds: s.visitedProvinceIds,
    wishlistProvinceIds: s.wishlistProvinceIds,
    trips: s.trips,
    journals: s.journals,
    preferences: s.preferences,
  };

  const { data, error } = await supabase.rpc('travel_state_put', {
    p_token: session.token,
    p_state: state,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.updated_at) throw new Error('ไม่สามารถบันทึกข้อมูลขึ้น Cloud ได้');
}

export async function restoreFromCloud(){
  if (!supabase) throw new Error('ยังไม่ได้เชื่อม Supabase');
  const session = await requireTravelSession();
  const { data, error } = await supabase.rpc('travel_state_get', { p_token: session.token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  const state = row?.state as Partial<TravelCloudState> | undefined;
  if (!state || !Object.keys(state).length) throw new Error('ยังไม่มีข้อมูลสำรองบน Cloud');

  useTravelStore.setState({
    ...(Array.isArray(state.visitedPlaceIds) ? { visitedPlaceIds:state.visitedPlaceIds } : {}),
    ...(Array.isArray(state.wishlistPlaceIds) ? { wishlistPlaceIds:state.wishlistPlaceIds } : {}),
    ...(Array.isArray(state.visitedProvinceIds) ? { visitedProvinceIds:state.visitedProvinceIds } : {}),
    ...(Array.isArray(state.wishlistProvinceIds) ? { wishlistProvinceIds:state.wishlistProvinceIds } : {}),
    ...(Array.isArray(state.trips) ? { trips:state.trips } : {}),
    ...(Array.isArray(state.journals) ? { journals:state.journals } : {}),
    ...(state.preferences ? { preferences:state.preferences } : {}),
  });
}
