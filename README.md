# เที่ยวไทย ครบทุกจังหวัด — Luxury Thailand Travel Map

Multi-page Web Application สำหรับสำรวจสถานที่ท่องเที่ยว วางแผนการเดินทาง บันทึกจังหวัดที่เคยไป และติดตามสถิติการเที่ยวประเทศไทย

## เวอร์ชันนี้มีอะไร

- Single-file SPA: `index.html`
- Design System เดียวกันทั้งเว็บ: Deep Emerald / Champagne Gold / Premium Glass / Soft Golden Glow
- เมนูหลักครบ: หน้าหลัก, แผนที่, จังหวัด, สถานที่, กิจกรรม, แรงบันดาลใจ, แผนการเดินทาง, บันทึกการเดินทาง, ทริปของฉัน, รายการโปรด, คอมมูนิตี้, โปรไฟล์, สถิติ, แจ้งเตือน, ตั้งค่า, ค้นหา, Login, Onboarding
- Interactive Thailand Map พร้อม GeoJSON loader และ fallback map
- จังหวัด/สถานที่/กิจกรรม/ทริป/สถิติ/Journal/Profile/Community UI
- สถานะจังหวัด: ไปแล้ว, อยากไป, กำลังวางแผน, ยังไม่ไป
- Responsive: Desktop, Tablet, Mobile bottom navigation
- UI States preview: Default, Hover, Active, Disabled, Loading, Skeleton, Empty, Error, Success, Offline

## วิธีเปิด

เปิดไฟล์ `index.html` ใน Browser ได้ทันที หรือ Deploy เป็น static site บน GitHub Pages / Vercel / Netlify

> หมายเหตุ: แผนที่จังหวัดจริงจะโหลดผ่าน GeoJSON เมื่อมีอินเทอร์เน็ตและ CORS เปิดใช้งาน ถ้าโหลดไม่ได้ ระบบใช้ fallback map เพื่อให้หน้าไม่พัง
