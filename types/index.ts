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

export interface TripMoneyRange {
  min?: number;
  max?: number;
  label?: string;
}

export interface TripScheduleItem {
  id: string;
  time?: string;
  title: string;
  detail?: string;
  activities?: string[];
  notes?: string[];
  completed?: boolean;
}

export interface TripDayBudgetItem {
  label: string;
  min?: number;
  max?: number;
  text?: string;
}

export interface TripDay {
  day: number;
  placeIds: string[];
  note?: string;
  title?: string;
  date?: string;
  route?: string;
  schedule?: TripScheduleItem[];
  accommodation?: string;
  budgetRange?: TripMoneyRange;
  budgetItems?: TripDayBudgetItem[];
}

export interface TripBudgetBreakdown {
  transport?: number;
  accommodation?: number;
  food?: number;
  activities?: number;
  other?: number;
}

export interface TripAccommodationNight {
  night: number;
  location: string;
}

export interface TripBudgetTier {
  label: string;
  min?: number;
  max?: number;
  perPerson?: boolean;
  text?: string;
}

export interface TripActualExpense {
  id: string;
  category: 'เดินทาง' | 'ที่พัก' | 'อาหาร' | 'กิจกรรม' | 'อื่น ๆ';
  amount: number;
  note?: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  budget: number;
  provinceIds: string[];
  days: TripDay[];
  note?: string;
  travelers?: number;
  transport?: string;
  accommodation?: string;
  tripStyle?: string;
  budgetBreakdown?: TripBudgetBreakdown;
  status?: 'วางแผน' | 'พร้อมเดินทาง' | 'จบทริป';
  origin?: string;
  destinationSummary?: string;
  autoFilled?: boolean;
  autoFillSource?: string;

  // Detailed itinerary fields. Optional to preserve compatibility with older saved trips.
  routeText?: string;
  routeStops?: string[];
  overviewBudgetRange?: TripMoneyRange;
  attractionsSummary?: string[];
  accommodationPlan?: TripAccommodationNight[];
  budgetSummaryLines?: string[];
  budgetTiers?: TripBudgetTier[];
  packingList?: string[];
  checklistDone?: string[];
  actualExpenses?: TripActualExpense[];
  importantNotes?: string[];
  sourceText?: string;
  importMode?: 'manual' | 'autofill' | 'text-import';
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
