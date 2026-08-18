import { supabase } from '@/lib/supabase';
import { useTravelStore } from '@/store/useTravelStore';

const requireUser=async()=>{if(!supabase)throw new Error('ยังไม่ได้ตั้งค่า Supabase');const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('กรุณาเข้าสู่ระบบก่อน');return user;};
const replaceIds=async(table:string,userId:string,field:string,ids:string[])=>{await supabase!.from(table).delete().eq('user_id',userId);if(ids.length){const {error}=await supabase!.from(table).insert(ids.map(id=>({user_id:userId,[field]:id})));if(error)throw error;}};

export async function syncToCloud(){
 const user=await requireUser();const s=useTravelStore.getState();
 await Promise.all([
  replaceIds('visited_places',user.id,'place_id',s.visitedPlaceIds),replaceIds('wishlist_places',user.id,'place_id',s.wishlistPlaceIds),replaceIds('visited_provinces',user.id,'province_id',s.visitedProvinceIds),replaceIds('wishlist_provinces',user.id,'province_id',s.wishlistProvinceIds),
  supabase!.from('profiles').upsert({user_id:user.id,preferences:s.preferences,updated_at:new Date().toISOString()}),
 ]);
 await supabase!.from('trips').delete().eq('user_id',user.id);if(s.trips.length)await supabase!.from('trips').insert(s.trips.map(t=>({id:t.id,user_id:user.id,data:t,updated_at:new Date().toISOString()})));
 await supabase!.from('journals').delete().eq('user_id',user.id);if(s.journals.length)await supabase!.from('journals').insert(s.journals.map(j=>({id:j.id,user_id:user.id,data:j,updated_at:new Date().toISOString()})));
}

export async function restoreFromCloud(){
 const user=await requireUser();
 const [vp,wp,vpr,wpr,tr,jr,pr]=await Promise.all([
  supabase!.from('visited_places').select('place_id').eq('user_id',user.id),supabase!.from('wishlist_places').select('place_id').eq('user_id',user.id),supabase!.from('visited_provinces').select('province_id').eq('user_id',user.id),supabase!.from('wishlist_provinces').select('province_id').eq('user_id',user.id),supabase!.from('trips').select('data').eq('user_id',user.id),supabase!.from('journals').select('data').eq('user_id',user.id),supabase!.from('profiles').select('preferences').eq('user_id',user.id).maybeSingle(),
 ]);
 useTravelStore.setState({visitedPlaceIds:(vp.data||[]).map(x=>x.place_id),wishlistPlaceIds:(wp.data||[]).map(x=>x.place_id),visitedProvinceIds:(vpr.data||[]).map(x=>x.province_id),wishlistProvinceIds:(wpr.data||[]).map(x=>x.province_id),trips:(tr.data||[]).map(x=>x.data),journals:(jr.data||[]).map(x=>x.data),...(pr.data?.preferences?{preferences:pr.data.preferences}:{})});
}
