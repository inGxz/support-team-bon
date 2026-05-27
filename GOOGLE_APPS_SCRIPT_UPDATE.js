/**
 * ============================================================
 *  UPDATED GOOGLE APPS SCRIPT  — SUPPORT TEAMBON VT MARKET
 *  Version: Image Upload + SubType/WorkflowParams
 *
 *  สิ่งที่เปลี่ยนแปลง:
 *  1. saveImageToDrive() — อัปโหลดรูปลูกค้าไป Google Drive อัตโนมัติ
 *  2. createJob()  — เก็บ imageUrl (col N), subType (col L), workflowParams (col M)
 *  3. getAllJobs() — คืน imageUrl ด้วย
 *  4. generateJobId() — format STM-XXXX (sequential)
 *
 *  ⚠️ วิธีอัปเดต (สำคัญ — ต้องทำครบทุกขั้น):
 *  1. เปิด Google Apps Script ของคุณ
 *  2. แทนที่โค้ดเดิมทั้งหมดด้วยโค้ดนี้
 *  3. กด "Save" (Ctrl+S)
 *  4. กด "Run" → เลือก function ใดก็ได้ เช่น doGet
 *     → จะมี popup "Authorization required" → คลิก "Review permissions"
 *     → เลือก Google account ของคุณ → Allow (ให้ permission DriveApp ใหม่)
 *  5. Manage deployments → Edit → New version → Deploy
 *  6. เพิ่ม column N ชื่อ "imageUrl" ใน Google Sheet (ถ้ายังไม่มี)
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
  STATUS:          9,   // I - Status  ← สถานะงาน (Pending / In Progress / Done)
  LINE_USER_ID:   10,  // J - lineUserId
  DELIVERY_LINK:  11,  // K - delivery link (admin ใส่ลิ้งไฟล์ก่อน mark Done)
  SUB_TYPE:       12,  // L - subType
  WORKFLOW_PARAMS:13,  // M - workflowParams
  IMAGE_URL:      14,  // N - imageUrl (Google Drive link)
  REVISION_NOTE:  15,  // O - revisionNote
  REVISION_COUNT: 16,  // P - revisionCount
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

    if (body.action === "update")   return updateJob(body);
    if (body.action === "revision") return submitRevision(body);
    return createJob(body);
  } catch (err) {
    return jsonResponse({ error: "FAILED", message: String(err) });
  }
}

// ─── createJob: สร้าง Job ใหม่ ────────────────────────────────────────────────

// ─── saveImageToDrive ─────────────────────────────────────────────────────────
function saveImageToDrive(base64Data, fileName, mimeType) {
  try {
    var folderName = "Support Teambon - Customer Uploads";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType || "image/jpeg", fileName || ("upload_" + Date.now() + ".jpg"));
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch (err) {
    console.error("saveImageToDrive error:", err);
    return "";
  }
}

function createJob(body) {
  try {
    const sheet     = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const jobId     = generateJobId();
    const timestamp = new Date().toLocaleString("th-TH");

    // Upload images to Drive if provided (up to 3)
    var imageUrl = "";
    var imageUrls = [];
    var base64s  = body.imageBase64s || (body.imageBase64 ? [body.imageBase64] : []);
    var names    = body.imageNames   || (body.imageName   ? [body.imageName]   : []);
    var mimes    = body.imageMimes   || (body.imageMime   ? [body.imageMime]   : []);
    for (var i = 0; i < base64s.length && i < 3; i++) {
      if (base64s[i] && base64s[i].length > 0) {
        var url = saveImageToDrive(base64s[i], names[i] || ("image_" + (i+1) + ".jpg"), mimes[i] || "image/jpeg");
        if (url) imageUrls.push(url);
      }
    }
    imageUrl = imageUrls.join(",");

    sheet.appendRow([
      timestamp,
      jobId,
      body.customerName    || "",
      body.agent           || "",
      body.task            || "",
      body.reference       || "",
      body.detail          || "",
      body.deadline        || "",
      "Pending",
      body.lineUserId      || "",
      "",                          // K: deliveryLink
      body.subType         || "",  // L: subType
      body.workflowParams  || "",  // M: workflowParams
      imageUrl,                    // N: imageUrl (Drive)
    ]);

    // แจ้งเตือน admin group
    notifyAdminGroup(jobId, body.customerName, body.task, body.deadline, body.detail, body.agent, body.lineUserId || "");

    return jsonResponse({ success: true, jobId });
  } catch (err) {
    return jsonResponse({ error: "CREATE_FAILED", message: String(err) });
  }
}

// ─── getLineProfilePic: ดึงรูป profile จาก LINE API ─────────────────────────
function getLineProfilePic(lineUserId, token) {
  try {
    if (!lineUserId || !token) return "";
    var res = UrlFetchApp.fetch("https://api.line.me/v2/bot/profile/" + lineUserId, {
      method: "GET",
      headers: { "Authorization": "Bearer " + token },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) return "";
    var profile = JSON.parse(res.getContentText());
    return profile.pictureUrl || "";
  } catch(err) {
    return "";
  }
}

// ─── notifyAdminGroup: แจ้งเตือนกลุ่ม admin เมื่อมีงานใหม่ ──────────────────
function notifyAdminGroup(jobId, customerName, task, deadline, detail, agent, lineUserId) {
  try {
    const token   = getLineToken();
    const groupId = PropertiesService.getScriptProperties().getProperty("ADMIN_GROUP_ID");
    if (!token || !groupId) return;

    const detailText   = detail   ? (detail.length > 80 ? detail.substring(0, 80) + "..." : detail) : "-";
    const deadlineText = deadline || "-";
    const pictureUrl   = getLineProfilePic(lineUserId, token);

    // hero image (รูปโปรไฟล์) — แสดงถ้ามี
    var hero = pictureUrl ? {
      type: "image",
      url: pictureUrl,
      size: "full",
      aspectRatio: "20:9",
      aspectMode: "cover"
    } : null;

    var bubble = {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box", layout: "vertical", paddingAll: "md",
        backgroundColor: "#7C3AED",
        contents: [
          { type: "text", text: "📋 งานใหม่เข้ามา!", color: "#FFFFFF", weight: "bold", size: "md" },
          { type: "text", text: customerName || "-", color: "#E9D5FF", size: "sm" }
        ]
      },
      body: {
        type: "box", layout: "vertical", spacing: "sm", paddingAll: "md",
        contents: [
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "Job ID",   size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: jobId || "-", size: "xs", color: "#111827", weight: "bold", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "งาน",     size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: task || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "เซลล์",   size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: agent || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "Deadline", size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: deadlineText, size: "xs", color: "#DC2626", weight: "bold", flex: 3, wrap: true }
          ]},
          { type: "separator", margin: "sm" },
          { type: "text", text: detailText, size: "xs", color: "#374151", wrap: true, margin: "sm" }
        ]
      }
    };

    if (hero) bubble.hero = hero;

    var res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      payload: JSON.stringify({ to: groupId, messages: [{ type: "flex", altText: "📋 งานใหม่! " + jobId + " — " + (customerName || "-"), contents: bubble }] }),
      muteHttpExceptions: true
    });

    console.log("notifyAdminGroup response:", res.getResponseCode(), res.getContentText());
  } catch(err) {
    console.error("notifyAdminGroup error:", err);
  }
}


// ─── submitRevision: ลูกค้าขอแก้ไขงาน ───────────────────────────────────────
function submitRevision(body) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data  = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.JOB_ID - 1]) === String(body.jobId)) {
        var rowNum = i + 1;
        var currentStatus = String(data[i][COL.STATUS - 1] || "");
        var currentCount  = parseInt(data[i][COL.REVISION_COUNT - 1] || "0") || 0;

        // เปลี่ยนสถานะเป็น Revision
        sheet.getRange(rowNum, COL.STATUS).setValue("Revision");
        sheet.getRange(rowNum, COL.REVISION_NOTE).setValue(body.revisionNote || "");
        sheet.getRange(rowNum, COL.REVISION_COUNT).setValue(currentCount + 1);

        // แจ้ง admin group
        var customerName = String(data[i][COL.CUSTOMER_NAME - 1] || "");
        var task         = String(data[i][COL.TASK          - 1] || "");
        var agent        = String(data[i][COL.AGENT         - 1] || "");
        var lineUserId   = String(data[i][COL.LINE_USER_ID  - 1] || "");
        notifyRevisionToAdmin(body.jobId, customerName, task, agent, body.revisionNote || "", currentCount + 1, lineUserId);

        return jsonResponse({ success: true });
      }
    }
    return jsonResponse({ error: "NOT_FOUND" });
  } catch(err) {
    return jsonResponse({ error: "REVISION_FAILED", message: String(err) });
  }
}

// ─── notifyRevisionToAdmin: แจ้ง admin เมื่อลูกค้าขอ revision ────────────────
function notifyRevisionToAdmin(jobId, customerName, task, agent, note, count, lineUserId) {
  try {
    const token   = getLineToken();
    const groupId = PropertiesService.getScriptProperties().getProperty("ADMIN_GROUP_ID");
    if (!token || !groupId) return;

    const pictureUrl = getLineProfilePic(lineUserId, token);
    const noteText   = note ? (note.length > 80 ? note.substring(0, 80) + "..." : note) : "-";

    var bubble = {
      type: "bubble", size: "kilo",
      header: {
        type: "box", layout: "vertical", paddingAll: "md",
        backgroundColor: "#DC2626",
        contents: [
          { type: "text", text: "🔄 ลูกค้าขอแก้ไขงาน!", color: "#FFFFFF", weight: "bold", size: "md" },
          { type: "text", text: customerName || "-", color: "#FCA5A5", size: "sm" }
        ]
      },
      body: {
        type: "box", layout: "vertical", spacing: "sm", paddingAll: "md",
        contents: [
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "Job ID",    size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: jobId || "-", size: "xs", color: "#111827", weight: "bold", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "งาน",      size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: task || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "เซลล์",    size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: agent || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "ครั้งที่",  size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: String(count), size: "xs", color: "#DC2626", weight: "bold", flex: 3 }
          ]},
          { type: "separator", margin: "sm" },
          { type: "text", text: "📝 สิ่งที่ต้องการแก้:", size: "xs", color: "#6B7280", margin: "sm" },
          { type: "text", text: noteText, size: "xs", color: "#374151", wrap: true }
        ]
      }
    };

    if (pictureUrl) bubble.hero = { type: "image", url: pictureUrl, size: "full", aspectRatio: "20:9", aspectMode: "cover" };

    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      payload: JSON.stringify({ to: groupId, messages: [{ type: "flex", altText: "🔄 " + customerName + " ขอแก้ไขงาน " + jobId, contents: bubble }] }),
      muteHttpExceptions: true
    });
  } catch(err) {
    console.error("notifyRevisionToAdmin error:", err);
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
      jobId:          String(row[COL.JOB_ID          - 1]),
      customerName:   String(row[COL.CUSTOMER_NAME   - 1] || ""),
      agent:          String(row[COL.AGENT            - 1] || ""),
      task:           String(row[COL.TASK             - 1] || ""),
      reference:      String(row[COL.REFERENCE        - 1] || ""),
      detail:         String(row[COL.DETAIL           - 1] || ""),
      deadline:       String(row[COL.DEADLINE         - 1] || ""),
      status:         String(row[COL.STATUS           - 1] || "Pending"),
      lineUserId:     String(row[COL.LINE_USER_ID     - 1] || ""),
      deliveryLink:   String(row[COL.DELIVERY_LINK    - 1] || ""),
      subType:        String(row[COL.SUB_TYPE         - 1] || ""),
      workflowParams: String(row[COL.WORKFLOW_PARAMS  - 1] || ""),
      imageUrl:       String(row[COL.IMAGE_URL        - 1] || ""),
      revisionNote:   String(row[COL.REVISION_NOTE    - 1] || ""),
      revisionCount:  String(row[COL.REVISION_COUNT   - 1] || "0"),
      timestamp:      String(row[COL.TIMESTAMP        - 1] || ""),
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

  // footer: ปุ่มเปิดไฟล์งาน + ปุ่มขอ revision
  var revisionUrl = "https://support-team-bon.vercel.app/revision?jobId=" + jobId;
  var footerContents = [];
  if (deliveryLink) {
    footerContents.push({
      type: "button",
      action: { type: "uri", label: "📂 เปิดไฟล์งาน", uri: deliveryLink },
      style: "primary", color: "#22c55e", height: "sm"
    });
  }
  footerContents.push({
    type: "button",
    action: { type: "uri", label: "🔄 ขอแก้ไขงาน", uri: revisionUrl },
    style: "secondary", height: "sm",
    margin: deliveryLink ? "sm" : "none"
  });
  var footer = { type: "box", layout: "vertical", contents: footerContents };

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

// ─── Helpers ───────────────────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}


// ─── testDriveAuth: รันฟังก์ชันนี้ครั้งเดียวเพื่อ authorize DriveApp ────────────
// วิธีใช้: เลือก testDriveAuth ใน dropdown แล้วกด Run
function testDriveAuth() {
  try {
    var folderName = "Support Teambon - Customer Uploads";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    Logger.log("✅ Drive authorized! Folder: " + folder.getName() + " | ID: " + folder.getId());
  } catch(err) {
    Logger.log("❌ Error: " + err);
  }
}


// ─── testAdminNotify: ทดสอบส่งแจ้งเตือนเข้า group ───────────────────────────
function testAdminNotify() {
  const token   = getLineToken();
  const groupId = PropertiesService.getScriptProperties().getProperty("ADMIN_GROUP_ID");

  Logger.log("Token: " + (token ? token.substring(0, 20) + "..." : "❌ ไม่มี"));
  Logger.log("Group ID: " + (groupId || "❌ ไม่มี"));

  if (!token || !groupId) {
    Logger.log("❌ หยุด — ขาด token หรือ groupId");
    return;
  }

  var res = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    payload: JSON.stringify({
      to: groupId,
      messages: [{ type: "text", text: "🧪 ทดสอบแจ้งเตือน admin group — ระบบทำงานปกติ ✅" }]
    }),
    muteHttpExceptions: true
  });

  Logger.log("Status: " + res.getResponseCode());
  Logger.log("Response: " + res.getContentText());
}

function generateJobId() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  // นับแถวข้อมูลจริง (ลบ header 1 แถว)
  const nextNumber = Math.max(lastRow, 1);
  return "STM-" + String(nextNumber).padStart(4, "0");
}
