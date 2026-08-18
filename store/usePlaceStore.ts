import { create } from 'zustand';

export interface Place {
  id: string; name: string; province: string; description: string;
  rating: number; reviewCount: number; category: string; image: string;
  isWishlist?: boolean; isVisited?: boolean;
}

const MOCK_DATA: Place[] = [
  { id: '1', name: 'เกาะพีพี', province: 'กระบี่', description: 'เกาะพีพี โดดเด่นด้วยน้ำทะเลสีฟ้าใส หาดทรายขาว และหน้าผาหินปูนอันสวยงาม เป็นสวรรค์ของคนรักทะเล', rating: 4.8, reviewCount: 1200, category: 'ทะเล', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a' },
  { id: '2', name: 'วัดอรุณราชวราราม', province: 'กรุงเทพมหานคร', description: 'สถาปัตยกรรมที่สวยงามริมฝั่งแม่น้ำเจ้าพระยา', rating: 4.9, reviewCount: 5400, category: 'วัด', image: 'https://images.unsplash.com/photo-1582239460228-56fb060136fa' },
  { id: '3', name: 'มัลดีฟส์เมืองไทย', province: 'สตูล', description: 'เกาะหลีเป๊ะ น้ำใสมาก', rating: 4.8, reviewCount: 890, category: 'ทะเล', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' },
  { id: '4', name: 'ดอยอินทนนท์', province: 'เชียงใหม่', description: 'จุดสูงสุดของประเทศไทย อากาศหนาวเย็นตลอดปี', rating: 4.7, reviewCount: 3200, category: 'ธรรมชาติ', image: 'https://images.unsplash.com/photo-1621272036047-b79a415ff68d' }
];

interface PlaceStore {
  places: Place[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toggleWishlist: (id: string) => void;
  toggleVisited: (id: string) => void;
}

export const usePlaceStore = create<PlaceStore>((set) => ({
  places: MOCK_DATA,
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleWishlist: (id) => set((state) => ({
    places: state.places.map(p => p.id === id ? { ...p, isWishlist: !p.isWishlist } : p)
  })),
  toggleVisited: (id) => set((state) => ({
    places: state.places.map(p => p.id === id ? { ...p, isVisited: !p.isVisited } : p)
  })),
}));