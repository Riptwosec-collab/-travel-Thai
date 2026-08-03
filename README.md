# Luxury Thailand Travel Map Dashboard

เว็บ Dashboard หน้าเดียวสำหรับ “แผนที่เที่ยวไทย” โทน Luxury Emerald & Gold ตามภาพอ้างอิง

## ไฟล์หลัก
- `index.html` — เว็บตัวจริงแบบ HTML/CSS/JS เปิดได้ทันที
- `native-dashboard.html` — สำเนาโค้ดแก้ไข component ได้

## ฟีเจอร์
- Layout แบบ Dashboard เต็มจอ 16:9
- Header / Sidebar / Analytics cards / Donut chart / Activity progress
- แผนที่ประเทศไทยแบบ SVG interactive
- พยายามโหลด GeoJSON จังหวัดจริงจาก ArcGIS FeatureServer เมื่อเปิดออนไลน์
- ถ้าโหลด GeoJSON ไม่ได้ จะใช้แผนที่สำรองพร้อมตำแหน่งจังหวัด
- คลิกจังหวัดเพื่อเปลี่ยน Detail Panel
- ปุ่มสถานะ “ไปแล้ว” และ “อยากไป”
- Floating AI Travel Assistant

## หมายเหตุ
การแสดงผลแผนที่จังหวัดจริงต้องเปิดบนเครื่องที่เชื่อมอินเทอร์เน็ตได้ เพื่อให้เบราว์เซอร์ fetch ข้อมูล GeoJSON จาก ArcGIS ได้ ถ้าไม่มีอินเทอร์เน็ต ระบบจะ fallback เป็นแผนที่สำรอง
