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
  DELIVERY_LINK: 11,  // K - delivery link (admin ใส่ลิ้งไฟล์ก่อน mark Done)
};

// ─── LINE Channel Access Token ────────────────────────────────────────────────
function getLineToken() {
  // เก็บ token ใน Script Properties เท่านั้น
  // GAS → Project Settings → Script Properties → LINE_CHANNEL_ACCESS_TOKEN
  const props = PropertiesService.getScriptProperties();
  return props.getProperty("LINE_CHANNEL_ACCESS_TOKEN") || "";
}

// ─── doGet ───────────────────────────────────────────────────────────────────
function doGet(e) {
  const action     = e.parameter.action     || "";
  const jobId      = e.parameter.jobId      || "";
  const lineUserId = e.parameter.lineUserId || "";

  // Admin: ดึงงานทั้งหมด
  if (action === "admin") {
    const adminSecret = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET") || "";
    if (!adminSecret || e.parameter.adminSecret !== adminSecret) {
      return jsonResponse({ error: "FORBIDDEN" });
    }
    return getAllJobs();
  }

  // ถ้าไม่มี jobId แต่มี lineUserId → ดึงงานทั้งหมดของ user นี้
  if (!jobId && lineUserId) {
    return getMyJobs(lineUserId);
  }

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

// ─── getMyJobs: ดึงงานทั้งหมดของ lineUserId ──────────────────────────────────
function getMyJobs(lineUserId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();
  const jobs  = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[COL.LINE_USER_ID - 1]) === lineUserId) {
      jobs.push({
        jobId:        row[COL.JOB_ID        - 1],
        customerName: row[COL.CUSTOMER_NAME - 1],
        task:         row[COL.TASK          - 1],
        deadline:     row[COL.DEADLINE      - 1],
        status:       row[COL.STATUS        - 1],
        timestamp:    row[COL.TIMESTAMP     - 1],
      });
    }
  }

  // เรียงล่าสุดก่อน
  jobs.reverse();

  return jsonResponse({ jobs });
}

// ─── doPost ───────────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === "update") {
      return updateJob(body);
    }

    return createJob(body);
  } catch (err) {
    return jsonResponse({ error: "FAILED", message: String(err) });
  }
}

// ─── createJob: สร้าง Job ใหม่ ────────────────────────────────────────────────
function createJob(body) {
  try {
    const sheet     = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const jobId     = generateJobId();
    const timestamp = new Date().toLocaleString("th-TH");

    sheet.appendRow([
      timestamp,
      jobId,
      body.customerName || "",
      body.agent        || "",
      body.task         || "",
      body.reference    || "",
      body.detail       || "",
      body.deadline     || "",
      "Pending",
      body.lineUserId   || "",
      "",                        // K: deliveryLink (ว่างไว้ก่อน)
    ]);

    return jsonResponse({ success: true, jobId });
  } catch (err) {
    return jsonResponse({ error: "CREATE_FAILED", message: String(err) });
  }
}

// ─── updateJob: Admin อัปเดตสถานะ / delivery link ────────────────────────────
function updateJob(body) {
  const adminSecret = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET") || "";
  if (!adminSecret || body.adminSecret !== adminSecret) {
    return jsonResponse({ error: "FORBIDDEN" });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][COL.JOB_ID - 1]) === String(body.jobId)) {
      var rowNum    = i + 1;
      var oldStatus = String(data[i][COL.STATUS - 1] || "");

      if (body.status !== undefined) {
        sheet.getRange(rowNum, COL.STATUS).setValue(body.status);
      }
      if (body.deliveryLink !== undefined) {
        sheet.getRange(rowNum, COL.DELIVERY_LINK).setValue(body.deliveryLink);
      }

      // ส่ง LINE push ถ้าเพิ่งเปลี่ยนเป็น Done
      var newStatus = body.status !== undefined ? body.status : oldStatus;
      var isDone    = newStatus === "Done" || newStatus === "เสร็จแล้ว";
      var wasNotDone = oldStatus !== "Done" && oldStatus !== "เสร็จแล้ว";

      if (isDone && wasNotDone) {
        var lineUserId    = String(data[i][COL.LINE_USER_ID  - 1] || "");
        var customerName  = String(data[i][COL.CUSTOMER_NAME - 1] || "");
        var task          = String(data[i][COL.TASK          - 1] || "");
        var deliveryLink  = body.deliveryLink !== undefined
          ? String(body.deliveryLink)
          : String(data[i][COL.DELIVERY_LINK - 1] || "");

        if (lineUserId) {
          sendLinePush(lineUserId, body.jobId, customerName, task, deliveryLink);
        }
      }

      return jsonResponse({ success: true });
    }
  }

  return jsonResponse({ error: "NOT_FOUND" });
}

// ─── getAllJobs: Admin ดึงงานทั้งหมด ──────────────────────────────────────────
function getAllJobs() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data  = sheet.getDataRange().getValues();
  var jobs  = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[COL.JOB_ID - 1]) continue; // ข้ามแถวว่าง
    jobs.push({
      jobId:        String(row[COL.JOB_ID        - 1]),
      customerName: String(row[COL.CUSTOMER_NAME - 1] || ""),
      agent:        String(row[COL.AGENT         - 1] || ""),
      task:         String(row[COL.TASK          - 1] || ""),
      reference:    String(row[COL.REFERENCE     - 1] || ""),
      detail:       String(row[COL.DETAIL        - 1] || ""),
      deadline:     String(row[COL.DEADLINE      - 1] || ""),
      status:       String(row[COL.STATUS        - 1] || "Pending"),
      lineUserId:   String(row[COL.LINE_USER_ID  - 1] || ""),
      deliveryLink: String(row[COL.DELIVERY_LINK - 1] || ""),
      timestamp:    String(row[COL.TIMESTAMP     - 1] || ""),
    });
  }

  jobs.reverse(); // ล่าสุดก่อน
  return jsonResponse({ jobs });
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

    const row          = range.getRow();
    const jobId        = sheet.getRange(row, COL.JOB_ID).getValue();
    const lineUserId   = sheet.getRange(row, COL.LINE_USER_ID).getValue();
    const customerName = sheet.getRange(row, COL.CUSTOMER_NAME).getValue();
    const task         = sheet.getRange(row, COL.TASK).getValue();
    const deliveryLink = COL.DELIVERY_LINK
      ? String(sheet.getRange(row, COL.DELIVERY_LINK).getValue() || "")
      : "";

    if (!lineUserId) return; // ไม่มี userId → ไม่ส่ง push

    sendLinePush(lineUserId, jobId, customerName, task, deliveryLink);
  } catch (err) {
    console.error("onStatusChange error:", err);
  }
}

// ─── sendLinePush: ส่ง LINE Flex Message เมื่องาน Done ───────────────────────
function sendLinePush(lineUserId, jobId, customerName, task, deliveryLink) {
  const token = getLineToken();

  // สร้าง body contents
  var bodyContents = [
    {
      type: "text",
      text: "📋 Job ID: " + jobId,
      size: "sm",
      color: "#333333",
      weight: "bold"
    }
  ];

  if (customerName) {
    bodyContents.push({
      type: "text",
      text: "👤 ลูกค้า: " + customerName,
      size: "sm",
      color: "#555555"
    });
  }

  if (task) {
    bodyContents.push({
      type: "text",
      text: "📦 งาน: " + task,
      size: "sm",
      color: "#555555",
      wrap: true
    });
  }

  bodyContents.push({ type: "separator", margin: "md" });
  bodyContents.push({
    type: "text",
    text: deliveryLink ? "กดปุ่มด้านล่างเพื่อรับไฟล์งาน" : "กรุณาติดต่อทีมงานเพื่อรับงาน",
    size: "xs",
    color: "#aaaaaa",
    margin: "md",
    wrap: true
  });
  bodyContents.push({
    type: "text",
    text: "ระบบ SUPPORT TEAMBON VT MARKET",
    size: "xs",
    color: "#aaaaaa",
    wrap: true
  });

  // สร้าง footer (ปุ่ม) ถ้ามี deliveryLink
  var footer = deliveryLink ? {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "button",
        action: {
          type: "uri",
          label: "📂 เปิดไฟล์งาน",
          uri: deliveryLink
        },
        style: "primary",
        color: "#22c55e",
        height: "sm"
      }
    ]
  } : null;

  var bubble = {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#22c55e",
      contents: [
        {
          type: "text",
          text: "✅ งานของคุณเสร็จแล้ว!",
          weight: "bold",
          size: "xl",
          color: "#ffffff"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: bodyContents
    }
  };

  if (footer) bubble.footer = footer;

  const payload = JSON.stringify({
    to: lineUserId,
    messages: [
      {
        type: "flex",
        altText: "✅ งานของคุณเสร็จแล้ว! Job ID: " + jobId,
        contents: bubble
      }
    ]
  });

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    payload: payload,
    muteHttpExceptions: true
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
