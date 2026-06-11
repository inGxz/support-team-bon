# Showcase images

หน้า `/showcase` จะโหลดรูปจากโฟลเดอร์นี้ตามชื่อไฟล์ด้านล่าง ถ้ายังไม่มีไฟล์ ระบบจะ
แสดง placeholder สีไล่เฉด (gradient) แทนโดยอัตโนมัติ — ไม่พัง ไม่ error

วิธีเพิ่มรูปจริง: ดาวน์โหลดไฟล์จาก Google Drive โฟลเดอร์ "ตัวอย่างงานกราฟฟิก"
แล้ว **เปลี่ยนชื่อไฟล์** ให้ตรงกับชื่อด้านล่าง จากนั้นวางไฟล์ไว้ในโฟลเดอร์นี้
(`public/showcase/`)

| ชื่อไฟล์ที่ต้องใช้ | ไฟล์ต้นทางใน Drive | โฟลเดอร์ใน Drive |
|---|---|---|
| ea-shadow-hedge.png | 22 EA.png (EA SHADOW HEDGE) | กล่อง EA |
| ea-super-grid.png | 19.png (กลยุทธ์ SUPER GRID) | กล่อง EA |
| ea-shadow-grid-ultimate.png | 26 EA.png (SHADOW GRID ULTIMATE) | กล่อง EA |
| promo-copy-trading.png | 13 Copy trading.png | Promotion |
| promo-kru-mam.png | โปรโมชั่น ครูแหม่ม.png | Promotion |
| promo-trade.png | Promotion trade.png | Promotion |
| seminar-demand-supply.png | 32.png (เข้าห้าม...จบในโน้ต) | Seminar |
| seminar-pro-trader.png | 36.png (เริ่มเทรดแบบมือโปร) | Seminar |
| seminar-vt-life.png | 37.png (ชีวิตติดเทรด VT MARKETS) | Seminar |
| concept-mindset.png | 02.png (Mindset) | Others |
| concept-money-management.png | 03.png (Money Management) | Others |
| concept-3m.png | 01.png (3M คืออะไร) | Others |

หมายเหตุ: รองรับเฉพาะนามสกุล .png ตามที่กำหนดไว้ในโค้ด (`app/showcase/page.tsx`)
ถ้าต้องการเปลี่ยนรายการผลงาน/หมวดหมู่ แก้ไขที่ array `ITEMS` ในไฟล์เดียวกัน
