export type Region = 'ภาคเหนือ' | 'ภาคอีสาน' | 'ภาคกลาง' | 'ภาคตะวันออก' | 'ภาคตะวันตก' | 'ภาคใต้';

export interface Province {
  id: string;
  nameTh: string;
  nameEn: string;
  region: Region;
  description: string;
  coverImage: string;
  bestMonths: string[];
}

export interface Place {
  id: string;
  name: string;
  provinceId: string;
  province: string;
  description: string;
  rating: number;
  reviewCount: number;
  category: string;
  image: string;
  images: string[];
  lat: number;
  lng: number;
  address: string;
  openingHours: string;
  ticketPrice: string;
  bestTime: string;
  duration: string;
  facilities: string[];
  tags: string[];
}

export interface TripDay { day: number; placeIds: string[]; note?: string; }
export interface Trip {
  id: string; title: string; startDate: string; endDate: string;
  budget: number; provinceIds: string[]; days: TripDay[]; note?: string;
}

export interface JournalEntry {
  id: string; placeId?: string; provinceId?: string; date: string;
  title: string; note: string; mood: string; rating: number; expense: number;
}

export interface TravelPreferences {
  interests: string[]; budget: 'ประหยัด' | 'กลาง' | 'พรีเมียม';
  travelStyle: 'คนเดียว' | 'คู่' | 'เพื่อน' | 'ครอบครัว';
  favoriteRegions: Region[]; onboardingDone: boolean;
}
