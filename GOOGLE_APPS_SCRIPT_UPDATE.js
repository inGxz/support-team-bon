/**
 * ============================================================
 *  UPDATED GOOGLE APPS SCRIPT  — SUPPORT TEAMBON VT MARKET
 *  Version: LINE Login Integration
 *
 *  สิ่งที่เปลี่ยนแปลง:
 *  1. doPost()  — บันทึก lineUserId ไว้ใน column ใหม่
 *  2. doGet()   — ตรวจสอบ lineUserId ก่อนคืนข้อมูล (privacy)
 *  3. onStatusChange() — ส่ง LINE Push เมื่อสถานะเปลี่ยนเป็น Done
 *  4. sendLinePush()  — ฟังก์ชันส่ง LINE Messaging API
 *
 *  วิธีอัปเดต:
 *  1. เปิด Google Apps Script ของคุณ
 *  2. แทนที่โค้ดเดิมทั้งหมดด้วยโค้ดนี้
 *  3. ตั้ง LINE_CHANNEL_ACCESS_TOKEN ใน Script Properties
 *     (Project Settings → Script Properties → Add property)
 *  4. ตั้ง Trigger สำหรับ onStatusChange:
 *     Triggers → Add Trigger → onStatusChange → From spreadsheet → On edit
 *  5. Deploy ใหม่เป็น Web App
 * ============================================================
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SHEET_NAME = "Sheet1"; // ชื่อ sheet ที่เก็บข้อมูลงาน

// Column index (1-based) — ตรงกับ sheet จริง:
// A=Date  B=Job ID  C=customerName  D=agent  E=Task  F=Reference  G=Detail  H=Deadline  I=Status  J=lineUserId
const COL = {
  TIMESTAMP:     1,   // A - Date
  JOB_ID:        2,   // B - Job ID
  CUSTOMER_NAME: 3,   // C - customerName
  AGENT:         4,   // D - agent
  TASK:          5,   // E - Task
  REFERENCE:     6,   // F - Reference
  DETAIL:        7,   // G - Detail
  DEADLINE:      8,   // H - Deadline
  STATUS:        9,   // I - Status  ← สถานะงาน (Pending / In Progress / Done)
  LINE_USER_ID:  10,  // J - lineUserId
};

// ─── LINE Channel Access Token ────────────────────────────────────────────────
function getLineToken() {
  // วิธีที่แนะนำ: เก็บใน Script Properties (ปลอดภัยกว่า)
  const props = PropertiesService.getScriptProperties();
  return props.getProperty("LINE_CHANNEL_ACCESS_TOKEN") ||
    "DqSGNqsocKnqKCaEcExvPg/onN3k71xJloz7em5Be5AcBN2/x4jE0+uie6o8EAq410shTOdM7CW0UWVd2Zcowv+kOZ4NUS/D+MpaonJOBxCEiqmO/LCg5NkXkJlitv6Pj/mR/3PAnv/T6/BZTmo+hwdB04t89/1O/w1cDnyilFU=";
}

// ─── doGet: ดึงข้อมูล Job (พร้อม privacy check) ──────────────────────────────
function doGet(e) {
  const jobId      = e.parameter.jobId      || "";
  const lineUserId = e.parameter.lineUserId || "";

  if (!jobId) {
    return jsonResponse({ error: "jobId is required" });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[COL.JOB_ID - 1]) === jobId) {

      const storedUserId = String(row[COL.LINE_USER_ID - 1] || "");

      // ถ้า job นี้ผูก lineUserId ไว้ → ต้องส่ง userId มาตรงกัน
      if (storedUserId && storedUserId !== lineUserId) {
        return jsonResponse({ error: "FORBIDDEN" });
      }

      return jsonResponse({
        jobId:        row[COL.JOB_ID        - 1],
        customerName: row[COL.CUSTOMER_NAME - 1],
        agent:        row[COL.AGENT         - 1],
        task:         row[COL.TASK          - 1],
        reference:    row[COL.REFERENCE     - 1],
        detail:       row[COL.DETAIL        - 1],
        deadline:     row[COL.DEADLINE      - 1],
        status:       row[COL.STATUS        - 1],
      });
    }
  }

  return jsonResponse({ error: "NOT_FOUND", message: "ไม่พบ Job ID นี้" });
}

// ─── doPost: สร้าง Job ใหม่ ────────────────────────────────────────────────────
function doPost(e) {
  try {
    const body       = JSON.parse(e.postData.contents);
    const sheet      = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const jobId      = generateJobId();
    const timestamp  = new Date().toLocaleString("th-TH");

    // ลำดับ column ตรงกับ sheet: A=Date B=JobID C=customerName D=agent E=Task F=Reference G=Detail H=Deadline I=Status J=lineUserId
    sheet.appendRow([
      timestamp,                // A: Date
      jobId,                    // B: Job ID
      body.customerName || "",  // C: customerName
      body.agent        || "",  // D: agent
      body.task         || "",  // E: Task
      body.reference    || "",  // F: Reference
      body.detail       || "",  // G: Detail
      body.deadline     || "",  // H: Deadline
      "Pending",                // I: Status
      body.lineUserId   || "",  // J: lineUserId
    ]);

    return jsonResponse({ success: true, jobId });
  } catch (err) {
    return jsonResponse({ error: "CREATE_FAILED", message: String(err) });
  }
}

// ─── onStatusChange: Trigger เมื่อแก้ไข Sheet ────────────────────────────────
// ตั้ง Trigger: Triggers → Add Trigger → onStatusChange → From spreadsheet → On edit
function onStatusChange(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return;
    if (e.source.getActiveSheet().getName() !== SHEET_NAME) return;

    const range = e.range;
    // ตรวจว่าแก้ใน column STATUS (J = column 10)
    if (range.getColumn() !== COL.STATUS) return;

    const newStatus = String(e.value || "").trim();
    if (newStatus !== "Done" && newStatus !== "เสร็จแล้ว") return;

    const row         = range.getRow();
    const jobId       = sheet.getRange(row, COL.JOB_ID).getValue();
    const lineUserId  = sheet.getRange(row, COL.LINE_USER_ID).getValue();
    const customerName = sheet.getRange(row, COL.CUSTOMER_NAME).getValue();
    const task        = sheet.getRange(row, COL.TASK).getValue();

    if (!lineUserId) return; // ไม่มี userId → ไม่ส่ง push

    sendLinePush(lineUserId, jobId, customerName, task);
  } catch (err) {
    console.error("onStatusChange error:", err);
  }
}

// ─── sendLinePush: ส่ง LINE Push Message ──────────────────────────────────────
function sendLinePush(lineUserId, jobId, customerName, task) {
  const token = getLineToken();
  const message =
    "✅ งานของคุณเสร็จแล้ว!\n\n" +
    "📋 Job ID: " + jobId + "\n" +
    "👤 ลูกค้า: " + customerName + "\n" +
    (task ? "📦 งาน: " + task + "\n" : "") +
    "\nกรุณาติดต่อทีมงานเพื่อรับงาน\nระบบ SUPPORT TEAMBON VT MARKET";

  const payload = JSON.stringify({
    to: lineUserId,
    messages: [{ type: "text", text: message }],
  });

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    payload: payload,
    muteHttpExceptions: true,
  };

  const res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
  console.log("LINE push response:", res.getContentText());
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateJobId() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  // นับจากแถวที่มีข้อมูล (ลบ header 1 แถว) แล้ว +1
  const nextNumber = Math.max(lastRow, 1); // ป้องกัน 0
  const padded = String(nextNumber).padStart(3, "0");
  return "STM-" + padded;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
