# ตั้งค่า Apps Script สำหรับระบบลางาน (/leave)

หน้า `/leave` เก็บข้อมูลผ่าน `/api/gas` ซึ่งวิ่งไปที่ Google Apps Script เดิม
(Sheet เดียวกับระบบสั่งงาน) — ต้องเพิ่มโค้ดด้านล่างนี้เข้าไปใน Apps Script
project เดิม (script.google.com) แล้วกด **Deploy > Manage deployments > Edit > New version**

## 1. เพิ่มฟังก์ชันเหล่านี้ที่ไหนก็ได้ในไฟล์ Code.gs

```javascript
// ============ LEAVE SYSTEM ============

const LEAVE_SHEET_NAME = "Leave";
const LEAVE_HEADERS = ["Timestamp", "ID", "Name", "LeaveType", "StartDate", "EndDate", "Days", "Reason", "Status"];

function getLeaveSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(LEAVE_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LEAVE_SHEET_NAME);
    sheet.appendRow(LEAVE_HEADERS);
    sheet.getRange(1, 1, 1, LEAVE_HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function calcLeaveDays_(start, end) {
  if (!start) return 0;
  const s = new Date(start);
  const e = new Date(end || start);
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : 1;
}

function handleLeaveCreate_(data) {
  const sheet = getLeaveSheet_();
  const id = "LV" + new Date().getTime();
  sheet.appendRow([
    new Date(),
    id,
    data.name || "",
    data.leaveType || "",
    data.startDate || "",
    data.endDate || data.startDate || "",
    calcLeaveDays_(data.startDate, data.endDate),
    data.reason || "",
    "บันทึกแล้ว",
  ]);
  return { success: true, id: id };
}

function handleLeaveList_() {
  const sheet = getLeaveSheet_();
  const rows = sheet.getDataRange().getValues();
  const leaves = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[1]) continue; // skip empty rows
    leaves.push({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : row[0],
      id: row[1],
      name: row[2],
      leaveType: row[3],
      startDate: row[4] instanceof Date ? Utilities.formatDate(row[4], "Asia/Bangkok", "yyyy-MM-dd") : row[4],
      endDate: row[5] instanceof Date ? Utilities.formatDate(row[5], "Asia/Bangkok", "yyyy-MM-dd") : row[5],
      days: row[6],
      reason: row[7],
      status: row[8],
    });
  }
  return { leaves: leaves };
}

function handleLeaveDelete_(id) {
  const sheet = getLeaveSheet_();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: "ไม่พบรายการ" };
}
```

## 2. Hook เข้ากับ `doPost(e)` เดิม

หาจุดที่ `doPost` อ่านค่า `data.type` (เช่น `if (data.type === "create") { ... }`)
แล้วเพิ่ม **ก่อน** เงื่อนไขเดิม:

```javascript
if (data.type === "leave_create") {
  return ContentService.createTextOutput(JSON.stringify(handleLeaveCreate_(data)))
    .setMimeType(ContentService.MimeType.JSON);
}
if (data.type === "leave_delete") {
  return ContentService.createTextOutput(JSON.stringify(handleLeaveDelete_(data.id)))
    .setMimeType(ContentService.MimeType.JSON);
}
```

> ถ้า doPost เดิมมีฟังก์ชัน helper สำหรับ return JSON อยู่แล้ว (เช่น `jsonResponse(obj)`)
> ใช้ฟังก์ชันนั้นแทน `ContentService.createTextOutput(...)` ได้เลย เพื่อความสอดคล้อง

## 3. Hook เข้ากับ `doGet(e)` เดิม

หาจุดเริ่มต้นของ `doGet(e)` แล้วเพิ่ม **ก่อน** logic เดิม:

```javascript
if (e.parameter.action === "leave_list") {
  return ContentService.createTextOutput(JSON.stringify(handleLeaveList_()))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 4. Deploy ใหม่

`Deploy` → `Manage deployments` → กดไอคอนแก้ไข (✏️) ที่ deployment ปัจจุบัน →
เปลี่ยน **Version** เป็น `New version` → `Deploy`

(ไม่ต้องสร้าง deployment ใหม่ — URL ใน `/api/gas` จะยังใช้ได้เหมือนเดิม)

## ผลลัพธ์

- ระบบจะสร้าง Sheet ชื่อ **"Leave"** อัตโนมัติในไฟล์ Google Sheet เดิม ตอนมีคนกดบันทึกการลาครั้งแรก
- คอลัมน์: Timestamp, ID, Name, LeaveType, StartDate, EndDate, Days, Reason, Status
- หน้าเว็บ `/leave` จะอ่าน/เขียนข้อมูลจาก Sheet นี้โดยตรง — ไม่ต้องมีการอนุมัติ แค่บันทึกไว้ให้ทุกคนเห็น
