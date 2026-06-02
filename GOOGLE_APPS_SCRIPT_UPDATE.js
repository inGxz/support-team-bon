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
const SHEET_NAME      = "Sheet1";      // ชื่อ sheet ที่เก็บข้อมูลงาน
const LOG_SHEET_NAME  = "ActivityLog"; // ชื่อ sheet ที่เก็บ activity log

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
  STATUS:          9,   // I - Status
  LINE_USER_ID:   10,  // J - lineUserId
  DELIVERY_LINK:  11,  // K - delivery link
  SUB_TYPE:       12,  // L - subType
  WORKFLOW_PARAMS:13,  // M - workflowParams
  IMAGE_URL:      14,  // N - imageUrl (Google Drive link)
  REVISION_NOTE:  15,  // O - revisionNote
  REVISION_COUNT: 16,  // P - revisionCount
  PRIORITY:       17,  // Q - priority flag ("urgent" หรือ "")
  INTERNAL_NOTE:  18,  // R - internalNote (Admin only, ไม่แสดงให้ลูกค้า)
};

// ─── formatTs: แปลง Date cell → "D/M/YYYY HH:mm:ss" (พ.ศ. เหมือน Sheets) ─────
function formatTs(val) {
  try {
    if (!val) return "";
    if (val instanceof Date) {
      var d    = val;
      var pad  = function(n) { return n < 10 ? "0" + n : String(n); };
      var day  = d.getDate();               // ไม่ใส่ 0 นำหน้า เหมือน Sheets
      var mon  = d.getMonth() + 1;
      var yearBE = d.getFullYear() + 543;   // CE → พ.ศ. เหมือนที่ Sheets แสดง
      var hh   = pad(d.getHours());
      var mm   = pad(d.getMinutes());
      var ss   = pad(d.getSeconds());
      return day + "/" + mon + "/" + yearBE + " " + hh + ":" + mm + ":" + ss;
    }
    return String(val);
  } catch(e) { return String(val || ""); }
}

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

  // Admin: ดึง Activity Log
  if (action === "activityLog") {
    const adminSecret = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET") || "";
    if (!adminSecret || e.parameter.adminSecret !== adminSecret) {
      return jsonResponse({ error: "FORBIDDEN" });
    }
    return getActivityLog(e.parameter.jobId || "", parseInt(e.parameter.limit || "200"));
  }

  // Customer: ดึง activity log ของ job ตัวเอง
  if (action === "jobLog") {
    return getJobLogForCustomer(jobId, lineUserId, e.parameter.source || "");
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
      const source       = e.parameter.source || "";

      // ถ้า job นี้ผูก lineUserId ไว้ → ต้องส่ง userId มาตรงกัน
      // ยกเว้น source=revision (หน้าขอแก้ไขงาน ไม่มี LIFF จึงไม่รู้ userId)
      if (storedUserId && storedUserId !== lineUserId && source !== "revision" && source !== "brief" && source !== "customer") {
        return jsonResponse({ error: "FORBIDDEN" });
      }

      return jsonResponse({
        jobId:          row[COL.JOB_ID          - 1],
        customerName:   row[COL.CUSTOMER_NAME   - 1],
        agent:          row[COL.AGENT           - 1],
        task:           row[COL.TASK            - 1],
        reference:      row[COL.REFERENCE       - 1],
        detail:         row[COL.DETAIL          - 1],
        deadline:       row[COL.DEADLINE        - 1],
        status:         row[COL.STATUS          - 1],
        subType:        String(row[COL.SUB_TYPE        - 1] || ""),
        workflowParams: String(row[COL.WORKFLOW_PARAMS - 1] || ""),
        imageUrl:       String(row[COL.IMAGE_URL       - 1] || ""),
        revisionNote:   String(row[COL.REVISION_NOTE   - 1] || ""),
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
        jobId:          row[COL.JOB_ID          - 1],
        customerName:   row[COL.CUSTOMER_NAME   - 1],
        task:           row[COL.TASK            - 1],
        deadline:       row[COL.DEADLINE        - 1],
        status:         row[COL.STATUS          - 1],
        timestamp:      formatTs(row[COL.TIMESTAMP - 1]),
        revisionCount:  String(row[COL.REVISION_COUNT  - 1] || "0"),
        subType:        String(row[COL.SUB_TYPE        - 1] || ""),
        workflowParams: String(row[COL.WORKFLOW_PARAMS - 1] || ""),
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

    if (body.action === "update")    return updateJob(body);
    if (body.action === "revision")  return submitRevision(body);
    if (body.action === "approveJob") return approveJob(body);
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
    const timestamp = formatTs(new Date());

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

    var nextRow = sheet.getLastRow() + 1;
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
      "",                          // O: revisionNote
      "0",                         // P: revisionCount
      "",                          // Q: priority
      "",                          // R: internalNote
    ]);
    // บังคับ column A เป็น plain text ไม่ให้ Sheets แปลงเป็น Date cell
    sheet.getRange(nextRow, 1).setNumberFormat("@");

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

        // ป้องกัน: ถ้างาน Approved แล้ว ไม่อนุญาตให้ขอแก้ไข
        if (currentStatus === "Approved") {
          return jsonResponse({ error: "JOB_ALREADY_APPROVED", message: "งานนี้ได้รับการ Approve ไปแล้ว ไม่สามารถขอแก้ไขได้" });
        }

        // เปลี่ยนสถานะเป็น Revision
        sheet.getRange(rowNum, COL.STATUS).setValue("Revision");
        sheet.getRange(rowNum, COL.REVISION_NOTE).setValue(body.revisionNote || "");
        sheet.getRange(rowNum, COL.REVISION_COUNT).setValue(currentCount + 1);

        // แจ้ง admin group + ส่งยืนยันกลับหาลูกค้า
        var customerName = String(data[i][COL.CUSTOMER_NAME - 1] || "");
        var task         = String(data[i][COL.TASK          - 1] || "");
        var agent        = String(data[i][COL.AGENT         - 1] || "");
        var lineUserId   = String(data[i][COL.LINE_USER_ID  - 1] || "");
        notifyRevisionToAdmin(body.jobId, customerName, task, agent, body.revisionNote || "", currentCount + 1, lineUserId);
        notifyRevisionToCustomer(lineUserId, body.jobId, task, body.revisionNote || "", currentCount + 1);

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

// ─── writeActivityLog: บันทึก log การเปลี่ยนแปลง ────────────────────────────
function writeActivityLog(jobId, actor, field, oldValue, newValue) {
  try {
    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!logSheet) {
      logSheet = ss.insertSheet(LOG_SHEET_NAME);
      logSheet.appendRow(["Timestamp", "Job ID", "Actor", "Field", "Old Value", "New Value"]);
      logSheet.setFrozenRows(1);
      // ตั้งความกว้าง column
      logSheet.setColumnWidth(1, 160);
      logSheet.setColumnWidth(2, 100);
      logSheet.setColumnWidth(3, 80);
      logSheet.setColumnWidth(4, 120);
      logSheet.setColumnWidth(5, 180);
      logSheet.setColumnWidth(6, 180);
    }
    logSheet.appendRow([
      new Date().toLocaleString("th-TH"),
      jobId,
      actor || "Admin",
      field,
      oldValue !== undefined && oldValue !== null ? String(oldValue) : "",
      newValue !== undefined && newValue !== null ? String(newValue) : "",
    ]);
  } catch (err) {
    console.error("writeActivityLog error:", err);
  }
}

// ─── getActivityLog: ดึง activity log ────────────────────────────────────────
function getActivityLog(filterJobId, limit) {
  try {
    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!logSheet) return jsonResponse({ logs: [] });

    var data = logSheet.getDataRange().getValues();
    var logs = [];

    // วนจากท้ายสุด (ล่าสุดก่อน) ข้าม header แถวแรก
    for (var i = data.length - 1; i >= 1; i--) {
      var row = data[i];
      var jId = String(row[1] || "");
      if (filterJobId && jId !== filterJobId) continue;
      logs.push({
        timestamp: String(row[0] || ""),
        jobId:     jId,
        actor:     String(row[2] || "Admin"),
        field:     String(row[3] || ""),
        oldValue:  String(row[4] || ""),
        newValue:  String(row[5] || ""),
      });
      if (limit && logs.length >= limit) break;
    }

    return jsonResponse({ logs });
  } catch (err) {
    return jsonResponse({ error: String(err), logs: [] });
  }
}

// ─── getJobLogForCustomer: ลูกค้าดู activity log ของงานตัวเอง ────────────────
function getJobLogForCustomer(jobId, lineUserId, source) {
  if (!jobId) return jsonResponse({ error: "jobId is required" });

  // ตรวจสอบ lineUserId กับ job นี้
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data  = sheet.getDataRange().getValues();
  var found = false;
  var deliveryLink = "";
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][COL.JOB_ID - 1]) === jobId) {
      var storedUserId = String(data[i][COL.LINE_USER_ID - 1] || "");
      // source=customer ข้าม userId check ได้
      if (storedUserId && storedUserId !== lineUserId && source !== "customer") {
        return jsonResponse({ error: "FORBIDDEN" });
      }
      deliveryLink = String(data[i][COL.DELIVERY_LINK - 1] || "");
      found = true;
      break;
    }
  }
  if (!found) return jsonResponse({ error: "NOT_FOUND" });

  // ดึง log ของ job นี้
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
  var logs = [];
  if (logSheet) {
    var logData = logSheet.getDataRange().getValues();
    for (var j = logData.length - 1; j >= 1; j--) {
      var row = logData[j];
      if (String(row[1] || "") !== jobId) continue;
      var field = String(row[3] || "");
      // ซ่อน internalNote จากลูกค้า
      if (field === "internalNote") continue;
      logs.push({
        timestamp: String(row[0] || ""),
        actor:     String(row[2] || "Admin"),
        field:     field,
        oldValue:  String(row[4] || ""),
        newValue:  String(row[5] || ""),
      });
      if (logs.length >= 50) break;
    }
  }

  return jsonResponse({ logs, deliveryLink });
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
      var oldStatus       = String(data[i][COL.STATUS        - 1] || "");
      var oldDelivery     = String(data[i][COL.DELIVERY_LINK - 1] || "");
      var oldPriority     = String(data[i][COL.PRIORITY      - 1] || "");
      var oldInternalNote = String(data[i][COL.INTERNAL_NOTE - 1] || "");

      if (body.status !== undefined && body.status !== oldStatus) {
        sheet.getRange(rowNum, COL.STATUS).setValue(body.status);
        writeActivityLog(body.jobId, "Admin", "status", oldStatus, body.status);
      }
      if (body.deliveryLink !== undefined && body.deliveryLink !== oldDelivery) {
        sheet.getRange(rowNum, COL.DELIVERY_LINK).setValue(body.deliveryLink);
        writeActivityLog(body.jobId, "Admin", "deliveryLink", oldDelivery, body.deliveryLink);
      }
      if (body.priority !== undefined && body.priority !== oldPriority) {
        sheet.getRange(rowNum, COL.PRIORITY).setValue(body.priority);
        writeActivityLog(body.jobId, "Admin", "priority", oldPriority, body.priority);
      }
      if (body.internalNote !== undefined && body.internalNote !== oldInternalNote) {
        sheet.getRange(rowNum, COL.INTERNAL_NOTE).setValue(body.internalNote);
        writeActivityLog(body.jobId, "Admin", "internalNote", oldInternalNote, body.internalNote);
      }

      // ส่ง LINE push ตามสถานะที่เปลี่ยน
      var newStatus  = body.status !== undefined ? body.status : oldStatus;
      var isDone        = newStatus === "Done" || newStatus === "เสร็จแล้ว";
      var wasNotDone    = oldStatus !== "Done" && oldStatus !== "เสร็จแล้ว";
      var isInProgress  = newStatus === "In Progress";
      var wasNotInProg  = oldStatus !== "In Progress";

      var lineUserId   = String(data[i][COL.LINE_USER_ID  - 1] || "");
      var customerName = String(data[i][COL.CUSTOMER_NAME - 1] || "");
      var task         = String(data[i][COL.TASK          - 1] || "");

      if (isDone && wasNotDone) {
        var deliveryLink = body.deliveryLink !== undefined
          ? String(body.deliveryLink)
          : String(data[i][COL.DELIVERY_LINK - 1] || "");

        if (lineUserId) {
          var revCount = parseInt(data[i][COL.REVISION_COUNT - 1] || "0") || 0;
          sendLinePush(lineUserId, body.jobId, customerName, task, deliveryLink, revCount);
        }
      }

      if (isInProgress && wasNotInProg) {
        if (lineUserId) {
          sendInProgressPush(lineUserId, body.jobId, customerName, task);
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
      timestamp:      formatTs(row[COL.TIMESTAMP        - 1]),
      priority:       String(row[COL.PRIORITY         - 1] || ""),
      internalNote:   String(row[COL.INTERNAL_NOTE    - 1] || ""),
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
    var isDone       = newStatus === "Done" || newStatus === "เสร็จแล้ว";
    var isInProgress = newStatus === "In Progress";
    if (!isDone && !isInProgress) return;

    const row          = range.getRow();
    const jobId        = sheet.getRange(row, COL.JOB_ID).getValue();
    const lineUserId   = sheet.getRange(row, COL.LINE_USER_ID).getValue();
    const customerName = sheet.getRange(row, COL.CUSTOMER_NAME).getValue();
    const task         = sheet.getRange(row, COL.TASK).getValue();

    if (!lineUserId) return; // ไม่มี userId → ไม่ส่ง push

    if (isDone) {
      const deliveryLink = String(sheet.getRange(row, COL.DELIVERY_LINK).getValue() || "");
      const revCount = parseInt(sheet.getRange(row, COL.REVISION_COUNT).getValue() || "0") || 0;
      sendLinePush(lineUserId, jobId, customerName, task, deliveryLink, revCount);
    }

    if (isInProgress) {
      sendInProgressPush(lineUserId, jobId, customerName, task);
    }
  } catch (err) {
    console.error("onStatusChange error:", err);
  }
}

// ─── notifyRevisionToCustomer: ยืนยันรับคำขอแก้ไขกลับหาลูกค้า ────────────────
function notifyRevisionToCustomer(lineUserId, jobId, task, note, count) {
  try {
    const token = getLineToken();
    if (!token || !lineUserId) return;

    const noteShort = note ? (note.length > 100 ? note.substring(0, 100) + "..." : note) : "-";
    const remaining = Math.max(0, 3 - count);

    var bubble = {
      type: "bubble", size: "kilo",
      header: {
        type: "box", layout: "vertical", paddingAll: "md",
        backgroundColor: "#7C3AED",
        contents: [
          { type: "text", text: "✅ รับทราบคำขอแก้ไขแล้ว", color: "#FFFFFF", weight: "bold", size: "md" },
          { type: "text", text: "SUPPORT TEAMBON VT MARKET", color: "#DDD6FE", size: "xs" }
        ]
      },
      body: {
        type: "box", layout: "vertical", spacing: "sm", paddingAll: "md",
        contents: [
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "Job ID",   size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: String(jobId || "-"), size: "xs", color: "#111827", weight: "bold", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "งาน",      size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: String(task || "-"), size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "separator", margin: "sm" },
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "รายละเอียด", size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: noteShort, size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "separator", margin: "sm" },
          { type: "text",
            text: "ทีมงานได้รับคำขอแก้ไขของคุณแล้ว และจะดำเนินการให้เร็วที่สุด 🙏",
            size: "xs", color: "#4B5563", wrap: true, margin: "sm"
          },
          { type: "text",
            text: "สิทธิ์แก้ไขคงเหลือ: " + remaining + " ครั้ง",
            size: "xs", color: remaining > 0 ? "#059669" : "#DC2626", wrap: true, margin: "xs"
          }
        ]
      }
    };

    var payload = {
      to: lineUserId,
      messages: [{ type: "flex", altText: "✅ รับทราบคำขอแก้ไข Job " + jobId + " แล้ว ทีมงานจะดำเนินการให้เร็วที่สุด", contents: bubble }]
    };

    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + token },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    console.error("notifyRevisionToCustomer error:", err);
  }
}

// ─── sendLinePush: ส่ง LINE Flex Message เมื่องาน Done ───────────────────────
function sendLinePush(lineUserId, jobId, customerName, task, deliveryLink, revisionCount) {
  revisionCount = revisionCount || 0;
  const token = getLineToken();
  if (!token || !lineUserId) return;

  var approveUrl  = "https://support-team-bon.vercel.app/approve?jobId=" + jobId + "&lineUserId=" + lineUserId;
  var revisionUrl = "https://support-team-bon.vercel.app/revision?jobId=" + jobId;

  var bodyContents = [
    { type: "box", layout: "horizontal", contents: [
      { type: "text", text: "Job ID",  size: "xs", color: "#6B7280", flex: 2 },
      { type: "text", text: jobId || "-", size: "xs", color: "#111827", weight: "bold", flex: 3, wrap: true }
    ]},
    { type: "box", layout: "horizontal", contents: [
      { type: "text", text: "ลูกค้า",  size: "xs", color: "#6B7280", flex: 2 },
      { type: "text", text: customerName || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
    ]},
    { type: "box", layout: "horizontal", contents: [
      { type: "text", text: "งาน",     size: "xs", color: "#6B7280", flex: 2 },
      { type: "text", text: task || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
    ]},
    { type: "separator", margin: "sm" },
    { type: "box", layout: "vertical", margin: "sm", paddingAll: "sm",
      backgroundColor: "#F0FDF4", cornerRadius: "md",
      contents: [{
        type: "text",
        text: "ตรวจสอบงานแล้ว ถ้าผ่านให้กด Approve หากต้องการแก้ไขกดขอแก้ไขงาน",
        size: "xs", color: "#166534", wrap: true
      }]
    },
    { type: "text", text: "ระบบ SUPPORT TEAMBON VT MARKET",
      size: "xxs", color: "#9CA3AF", margin: "md", align: "center" }
  ];

  var footerContents = [];
  if (deliveryLink) {
    footerContents.push({
      type: "button",
      action: { type: "uri", label: "📂 เปิดไฟล์งาน", uri: deliveryLink },
      style: "primary", color: "#F59E0B", height: "sm"
    });
  }

  var bottomButtons = [{
    type: "button", flex: 1,
    action: { type: "uri", label: "✅ Approve", uri: approveUrl },
    style: "primary", color: "#22C55E", height: "sm"
  }];
  if (revisionCount < 3) {
    bottomButtons.push({
      type: "button", flex: 1,
      action: { type: "uri", label: "🔄 ขอแก้ไขงาน", uri: revisionUrl },
      style: "secondary", height: "sm"
    });
  }
  footerContents.push({
    type: "box", layout: "horizontal", spacing: "sm",
    margin: deliveryLink ? "sm" : "none",
    contents: bottomButtons
  });

  var bubble = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", paddingAll: "md",
      backgroundColor: "#22C55E",
      contents: [{ type: "text", text: "✅ งานของคุณเสร็จแล้ว!", color: "#FFFFFF", weight: "bold", size: "xl" }]
    },
    body:   { type: "box", layout: "vertical", spacing: "sm", paddingAll: "md", contents: bodyContents },
    footer: { type: "box", layout: "vertical", paddingAll: "md", contents: footerContents }
  };

  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    payload: JSON.stringify({ to: lineUserId, messages: [{ type: "flex", altText: "✅ งานของคุณเสร็จแล้ว! Job ID: " + jobId, contents: bubble }] }),
    muteHttpExceptions: true
  });
}

// ─── sendInProgressPush: ส่ง LINE Flex Message เมื่องาน In Progress ────────────
function sendInProgressPush(lineUserId, jobId, customerName, task) {
  try {
    const token = getLineToken();
    if (!token || !lineUserId) return;

    var bubble = {
      type: "bubble",
      header: {
        type: "box", layout: "vertical", paddingAll: "md",
        backgroundColor: "#3B82F6",
        contents: [
          { type: "text", text: "⏳ เริ่มดำเนินการงานของคุณแล้ว!", color: "#FFFFFF", weight: "bold", size: "lg" },
          { type: "text", text: "SUPPORT TEAMBON VT MARKET", color: "#BFDBFE", size: "xs" }
        ]
      },
      body: {
        type: "box", layout: "vertical", spacing: "sm", paddingAll: "md",
        contents: [
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "Job ID",  size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: jobId || "-", size: "xs", color: "#111827", weight: "bold", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "ลูกค้า",  size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: customerName || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "งาน",     size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: task || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "separator", margin: "sm" },
          { type: "box", layout: "vertical", margin: "sm", paddingAll: "sm",
            backgroundColor: "#EFF6FF", cornerRadius: "md",
            contents: [{
              type: "text",
              text: "ทีมงานกำลังดำเนินการงานของคุณอยู่นะคะ เมื่อเสร็จแล้วจะแจ้งให้ทราบอีกครั้ง \u{1F44D}",
              size: "xs", color: "#1D4ED8", wrap: true
            }]
          },
          { type: "text", text: "ระบบ SUPPORT TEAMBON VT MARKET",
            size: "xxs", color: "#9CA3AF", margin: "md", align: "center" }
        ]
      }
    };

    var resp = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      payload: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "flex", altText: "⏳ ทีมงานเริ่มดำเนินการงาน " + jobId + " แล้ว!", contents: bubble }]
      }),
      muteHttpExceptions: true
    });
    console.log("sendInProgressPush [" + jobId + "] HTTP " + resp.getResponseCode() + " → " + resp.getContentText().substring(0, 200));
  } catch(err) { console.error("sendInProgressPush error:", String(err)); }
}

// ─── approveJob: ลูกค้า Approve งาน ──────────────────────────────────────────
function approveJob(body) {
  try {
    var jobId      = String(body.jobId      || "");
    var lineUserId = String(body.lineUserId || "");
    if (!jobId) return jsonResponse({ error: "MISSING_JOB_ID" });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data  = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.JOB_ID - 1]) !== jobId) continue;

      var rowNum        = i + 1;
      var currentStatus = String(data[i][COL.STATUS      - 1] || "");
      var storedUserId  = String(data[i][COL.LINE_USER_ID - 1] || "");

      // ตรวจสอบสิทธิ์
      if (storedUserId && lineUserId && storedUserId !== lineUserId) {
        return jsonResponse({ error: "FORBIDDEN" });
      }
      // Approved ไปแล้ว → return success ปกติ (idempotent)
      if (currentStatus === "Approved") {
        return jsonResponse({ success: true, alreadyApproved: true });
      }

      // เปลี่ยนสถานะ
      sheet.getRange(rowNum, COL.STATUS).setValue("Approved");
      writeActivityLog(jobId, "Customer", "status", currentStatus, "Approved");

      var customerName = String(data[i][COL.CUSTOMER_NAME - 1] || "");
      var task         = String(data[i][COL.TASK          - 1] || "");
      var agent        = String(data[i][COL.AGENT         - 1] || "");

      if (storedUserId) notifyApproveToCustomer(storedUserId, jobId, task);
      notifyApproveToAdmin(jobId, customerName, task, agent, storedUserId);

      return jsonResponse({ success: true });
    }
    return jsonResponse({ error: "NOT_FOUND" });
  } catch(err) {
    return jsonResponse({ error: "APPROVE_FAILED", message: String(err) });
  }
}

// ─── notifyApproveToCustomer: ยืนยัน Approve กลับหาลูกค้า ────────────────────
function notifyApproveToCustomer(lineUserId, jobId, task) {
  try {
    const token = getLineToken();
    if (!token || !lineUserId) return;
    var bubble = {
      type: "bubble", size: "kilo",
      header: {
        type: "box", layout: "vertical", paddingAll: "md",
        backgroundColor: "#22C55E",
        contents: [
          { type: "text", text: "🎉 Approved เรียบร้อย!", color: "#FFFFFF", weight: "bold", size: "md" },
          { type: "text", text: "SUPPORT TEAMBON VT MARKET", color: "#DCFCE7", size: "xs" }
        ]
      },
      body: {
        type: "box", layout: "vertical", spacing: "sm", paddingAll: "md",
        contents: [
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "Job ID", size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: jobId || "-", size: "xs", color: "#111827", weight: "bold", flex: 3 }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "งาน",   size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: task || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "separator", margin: "sm" },
          { type: "text", text: "ขอบคุณที่ใช้บริการ TEAMBON นะคะ ยินดีให้บริการเสมอ 🙏",
            size: "xs", color: "#4B5563", wrap: true, margin: "sm" }
        ]
      }
    };
    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      payload: JSON.stringify({ to: lineUserId, messages: [{ type: "flex", altText: "Approved Job " + jobId + " เรียบร้อยแล้ว ขอบคุณที่ใช้บริการ", contents: bubble }] }),
      muteHttpExceptions: true
    });
  } catch(err) { console.error("notifyApproveToCustomer error:", err); }
}

// ─── notifyApproveToAdmin: แจ้ง admin group เมื่อลูกค้า Approve ──────────────
function notifyApproveToAdmin(jobId, customerName, task, agent, lineUserId) {
  try {
    const token   = getLineToken();
    const groupId = PropertiesService.getScriptProperties().getProperty("ADMIN_GROUP_ID");
    if (!token || !groupId) return;
    var bubble = {
      type: "bubble", size: "kilo",
      header: {
        type: "box", layout: "vertical", paddingAll: "md",
        backgroundColor: "#22C55E",
        contents: [
          { type: "text", text: "✅ ลูกค้า Approve งานแล้ว!", color: "#FFFFFF", weight: "bold", size: "md" },
          { type: "text", text: customerName || "-", color: "#DCFCE7", size: "sm" }
        ]
      },
      body: {
        type: "box", layout: "vertical", spacing: "sm", paddingAll: "md",
        contents: [
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "Job ID",  size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: jobId || "-", size: "xs", color: "#111827", weight: "bold", flex: 3 }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "งาน",    size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: task || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "เซลล์",  size: "xs", color: "#6B7280", flex: 2 },
            { type: "text", text: agent || "-", size: "xs", color: "#111827", flex: 3 }
          ]},
          { type: "separator", margin: "sm" },
          { type: "text", text: "งานนี้ปิดเรียบร้อยแล้ว ✅",
            size: "xs", color: "#059669", wrap: true, margin: "sm" }
        ]
      }
    };
    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      payload: JSON.stringify({ to: groupId, messages: [{ type: "flex", altText: "✅ " + customerName + " Approve งาน " + jobId + " แล้ว", contents: bubble }] }),
      muteHttpExceptions: true
    });
  } catch(err) { console.error("notifyApproveToAdmin error:", err); }
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

// ─── debugDiagnose: รันใน GAS editor เพื่อเช็คปัญหาการส่ง LINE ──────────────
// วิธีใช้: เลือก debugDiagnose ใน dropdown แล้วกด Run → ดู Logs
// ─── testPushNow: รันตรงจาก editor เพื่อทดสอบส่ง push ──────────────────────
// วิธีใช้: เลือก testPushNow → Run → ดู Execution log
function testPushNow() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data  = sheet.getDataRange().getValues();

  // หา row แรกที่มี lineUserId
  var testRow = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][COL.LINE_USER_ID - 1]) { testRow = data[i]; break; }
  }
  if (!testRow) { Logger.log("❌ ไม่พบแถวที่มี lineUserId"); return; }

  var userId       = String(testRow[COL.LINE_USER_ID  - 1]);
  var jobId        = String(testRow[COL.JOB_ID        - 1]);
  var customerName = String(testRow[COL.CUSTOMER_NAME - 1] || "");
  var task         = String(testRow[COL.TASK          - 1] || "");

  Logger.log("🧪 ทดสอบส่ง In Progress push → " + userId + " (Job: " + jobId + ")");

  var token = getLineToken();
  var bubble = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", paddingAll: "md",
      backgroundColor: "#3B82F6",
      contents: [
        { type: "text", text: "⏳ ทดสอบ: เริ่มดำเนินการงานแล้ว!", color: "#FFFFFF", weight: "bold", size: "lg" },
        { type: "text", text: "SUPPORT TEAMBON VT MARKET", color: "#BFDBFE", size: "xs" }
      ]
    },
    body: {
      type: "box", layout: "vertical", spacing: "sm", paddingAll: "md",
      contents: [
        { type: "box", layout: "horizontal", contents: [
          { type: "text", text: "Job ID", size: "xs", color: "#6B7280", flex: 2 },
          { type: "text", text: jobId, size: "xs", color: "#111827", weight: "bold", flex: 3 }
        ]},
        { type: "box", layout: "horizontal", contents: [
          { type: "text", text: "งาน", size: "xs", color: "#6B7280", flex: 2 },
          { type: "text", text: task || "-", size: "xs", color: "#111827", flex: 3, wrap: true }
        ]},
        { type: "separator", margin: "sm" },
        { type: "box", layout: "vertical", margin: "sm", paddingAll: "sm",
          backgroundColor: "#EFF6FF", cornerRadius: "md",
          contents: [{ type: "text",
            text: "ทีมงานกำลังดำเนินการงานของคุณอยู่นะคะ เมื่อเสร็จแล้วจะแจ้งให้ทราบอีกครั้ง",
            size: "xs", color: "#1D4ED8", wrap: true }]
        }
      ]
    }
  };

  var resp = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    payload: JSON.stringify({ to: userId, messages: [{ type: "flex", altText: "⏳ ทดสอบ In Progress push", contents: bubble }] }),
    muteHttpExceptions: true
  });

  Logger.log("HTTP Status: " + resp.getResponseCode());
  Logger.log("Response: " + resp.getContentText());

  if (resp.getResponseCode() === 200) {
    Logger.log("✅ ส่งสำเร็จ! เช็ค LINE ได้เลย");
  } else {
    Logger.log("❌ LINE API ปฏิเสธ — ดู Response ด้านบน");
  }
}

function debugDiagnose() {
  var results = [];

  // 1. ตรวจ LINE token
  var token = getLineToken();
  results.push("1. LINE Token: " + (token ? "✅ มี (" + token.substring(0, 20) + "...)" : "❌ ไม่มี! ต้องตั้งใน Script Properties"));

  // 2. ตรวจ ADMIN_SECRET
  var secret = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET");
  results.push("2. ADMIN_SECRET: " + (secret ? "✅ มี" : "❌ ไม่มี!"));

  // 3. ตรวจ ADMIN_GROUP_ID
  var groupId = PropertiesService.getScriptProperties().getProperty("ADMIN_GROUP_ID");
  results.push("3. ADMIN_GROUP_ID: " + (groupId ? "✅ มี (" + groupId + ")" : "❌ ไม่มี!"));

  // 4. ตรวจ Sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  results.push("4. Sheet '" + SHEET_NAME + "': " + (sheet ? "✅ พบ" : "❌ ไม่พบ!"));

  // 5. ตรวจ column J (lineUserId) ใน 5 แถวแรก
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    var filled = 0, empty = 0;
    for (var i = 1; i < Math.min(data.length, 20); i++) {
      if (data[i][COL.LINE_USER_ID - 1]) filled++;
      else empty++;
    }
    results.push("5. lineUserId (col J) ใน 19 แถวแรก: " + filled + " มีค่า / " + empty + " ว่าง" +
      (empty > 0 ? " ⚠️ แถวว่างจะไม่ได้รับ push" : " ✅"));
  }

  // 6. ทดสอบส่ง LINE push ไปหาตัวเอง (ต้องใส่ userId ของตัวเองก่อน)
  // แก้บรรทัดข้างล่างนี้เป็น lineUserId ของตัวเอง แล้ว uncomment
  // var testUserId = "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  // if (testUserId && token) {
  //   var res = sendInProgressPush(testUserId, "STM-TEST", "ทดสอบ", "Debug Test");
  //   results.push("6. Test push ส่งแล้ว — ตรวจใน LINE");
  // }

  Logger.log("=== DEBUG DIAGNOSE ===");
  results.forEach(function(r) { Logger.log(r); });
  Logger.log("=====================");
}

// ─── checkDeadlines: รันทุกวันเวลา 9:00 น. ผ่าน Time trigger ────────────────
// วิธีตั้ง Trigger:
//   GAS → Triggers (นาฬิกา) → + Add Trigger
//   Function: checkDeadlines | Event source: Time-driven
//   Type: Day timer | Time: 9am to 10am → Save
function checkDeadlines() {
  try {
    var token   = getLineToken();
    var groupId = PropertiesService.getScriptProperties().getProperty("ADMIN_GROUP_ID");
    if (!token || !groupId) {
      console.log("checkDeadlines: ไม่มี token หรือ groupId");
      return;
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var data  = sheet.getDataRange().getValues();

    // หางานที่ deadline = พรุ่งนี้ และยังไม่เสร็จ
    var today    = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    var dueJobs = [];
    for (var i = 1; i < data.length; i++) {
      var row    = data[i];
      var jobId  = String(row[COL.JOB_ID - 1] || "");
      if (!jobId) continue;

      var status = String(row[COL.STATUS - 1] || "");
      // ข้ามงานที่เสร็จแล้ว
      if (status === "Done" || status === "เสร็จแล้ว" || status === "Approved") continue;

      var deadlineRaw = row[COL.DEADLINE - 1];
      if (!deadlineRaw) continue;
      var deadline = new Date(deadlineRaw);
      deadline.setHours(0, 0, 0, 0);

      // ตรวจว่า deadline ตรงกับพรุ่งนี้พอดี
      if (deadline.getTime() !== tomorrow.getTime()) continue;

      dueJobs.push({
        jobId:        jobId,
        customerName: String(row[COL.CUSTOMER_NAME - 1] || "-"),
        agent:        String(row[COL.AGENT         - 1] || "-"),
        task:         String(row[COL.TASK          - 1] || "-"),
        status:       status,
        priority:     String(row[COL.PRIORITY      - 1] || ""),
      });
    }

    if (dueJobs.length === 0) {
      console.log("checkDeadlines: ไม่มีงานที่ครบ deadline พรุ่งนี้");
      return;
    }

    // สร้าง body contents แสดงทุกงาน
    var bodyContents = [
      { type: "text",
        text: "มีงาน " + dueJobs.length + " รายการที่ครบกำหนดพรุ่งนี้",
        size: "sm", color: "#374151", weight: "bold", wrap: true
      },
      { type: "separator", margin: "md" }
    ];

    dueJobs.forEach(function(j, idx) {
      var priorityTag = j.priority === "urgent" ? " 🚨" : "";
      bodyContents.push({
        type: "box", layout: "vertical", margin: "md",
        paddingAll: "sm", backgroundColor: "#FFF7ED",
        cornerRadius: "md",
        contents: [
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: j.jobId + priorityTag, size: "xs", color: "#C2410C", weight: "bold", flex: 3 },
            { type: "text", text: j.status, size: "xs", color: "#6B7280", flex: 2, align: "end" }
          ]},
          { type: "text", text: j.task, size: "xs", color: "#111827", wrap: true, margin: "xs" },
          { type: "box", layout: "horizontal", margin: "xs", contents: [
            { type: "text", text: "ลูกค้า: " + j.customerName, size: "xxs", color: "#6B7280", flex: 3 },
            { type: "text", text: "เซลล์: " + j.agent, size: "xxs", color: "#6B7280", flex: 2, align: "end" }
          ]}
        ]
      });
    });

    bodyContents.push({
      type: "text",
      text: "กรุณาดำเนินการให้เสร็จก่อนหมดเวลา",
      size: "xs", color: "#9CA3AF", margin: "md", wrap: true, align: "center"
    });

    var bubble = {
      type: "bubble",
      header: {
        type: "box", layout: "vertical", paddingAll: "md",
        backgroundColor: "#F59E0B",
        contents: [
          { type: "text", text: "⏰ แจ้งเตือน Deadline พรุ่งนี้!", color: "#FFFFFF", weight: "bold", size: "md" },
          { type: "text", text: "SUPPORT TEAMBON VT MARKET", color: "#FEF3C7", size: "xs" }
        ]
      },
      body: {
        type: "box", layout: "vertical", spacing: "none",
        paddingAll: "md", contents: bodyContents
      }
    };

    var resp = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      payload: JSON.stringify({
        to: groupId,
        messages: [{ type: "flex", altText: "⏰ มีงาน " + dueJobs.length + " รายการครบ deadline พรุ่งนี้!", contents: bubble }]
      }),
      muteHttpExceptions: true
    });

    console.log("checkDeadlines: ส่งแจ้งเตือน " + dueJobs.length + " งาน → HTTP " + resp.getResponseCode());
  } catch(err) {
    console.error("checkDeadlines error:", String(err));
  }
}

// ─── testCheckDeadlines: ทดสอบ checkDeadlines โดยไม่ต้องรอ trigger ───────────
// แก้ FORCE_DATE เป็นวันพรุ่งนี้ของงานที่อยากเทสก่อน แล้วกด Run
function testCheckDeadlines() {
  console.log("=== testCheckDeadlines ===");
  checkDeadlines();
  console.log("=== done ===");
}

function generateJobId() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  // นับแถวข้อมูลจริง (ลบ header 1 แถว)
  const nextNumber = Math.max(lastRow, 1);
  return "STM-" + String(nextNumber).padStart(4, "0");
}
