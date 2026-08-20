import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'travel-thai-single-account-session-v1';
export const TRAVEL_USERNAME = 'Mekaid';

export interface TravelSession {
  token: string;
  displayName: string;
  expiresAt: string;
}

const normalizePassword = (value: string) => value.normalize('NFKC').trim();

const readLocalSession = async (): Promise<TravelSession | null> => {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as TravelSession;
    if (!session?.token || !session?.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export async function loginTravelAccount(password: string): Promise<TravelSession> {
  if (!supabase) throw new Error('ยังไม่ได้เชื่อม Supabase');
  const normalizedPassword = normalizePassword(password);
  if (!normalizedPassword) throw new Error('กรุณากรอกรหัสผ่าน');

  const { data, error } = await supabase.rpc('travel_login', {
    p_username: TRAVEL_USERNAME,
    p_password: normalizedPassword,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.error_code || !row.session_token) {
    if (row?.error_code === 'try_later') throw new Error('ลองผิดหลายครั้ง ระบบล็อกชั่วคราว 10 นาที');
    throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบตัวพิมพ์ใหญ่/เล็กแล้วลองใหม่');
  }
  const session: TravelSession = {
    token: row.session_token,
    displayName: row.display_name || TRAVEL_USERNAME,
    expiresAt: row.expires_at,
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getTravelSession(): Promise<TravelSession | null> {
  if (!supabase) return null;
  const local = await readLocalSession();
  if (!local) return null;
  const { data, error } = await supabase.rpc('travel_session', { p_token: local.token });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.display_name) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
  const refreshed: TravelSession = {
    ...local,
    displayName: row.display_name,
    expiresAt: row.expires_at || local.expiresAt,
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
  return refreshed;
}

export async function requireTravelSession(): Promise<TravelSession> {
  const session = await getTravelSession();
  if (!session) throw new Error('กรุณาเข้าสู่ระบบก่อน');
  return session;
}

export async function logoutTravelAccount(): Promise<void> {
  const session = await readLocalSession();
  if (session && supabase) {
    await supabase.rpc('travel_logout', { p_token: session.token });
  }
  await AsyncStorage.removeItem(SESSION_KEY);
}
