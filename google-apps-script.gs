/**
 * Championship Studio - Google Sheets Database Sync Script
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any code in the editor and paste this code.
 * 4. Click the Save icon.
 * 5. Click "Deploy" (top right) > "New deployment".
 * 6. Select type: "Web app".
 * 7. Set:
 *    - Description: "Championship Studio Database Connection"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 8. Click "Deploy", authorize permissions, and copy the "Web app URL".
 * 9. Paste the URL into your Championship Studio "Account Auth Admin" tab under "Cloud Database Sync Settings".
 */

function doGet(e) {
  const action = e.parameter.action;
  const user = e.parameter.user || "default";
  
  if (action === "getUsers") {
    try {
      const users = getUsersList();
      return jsonResponse({ success: true, data: users });
    } catch (err) {
      return jsonResponse({ success: false, error: err.message });
    }
  }
  
  if (action === "getState") {
    try {
      const state = getBroadcastState(user);
      return jsonResponse({ success: true, data: state });
    } catch (err) {
      return jsonResponse({ success: false, error: err.message });
    }
  }
  
  return jsonResponse({ success: false, error: "Invalid action parameter" });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    if (action === "init") {
      initializeSheets();
      return jsonResponse({ success: true, message: "Database sheets initialized successfully" });
    }
    
    if (action === "saveState") {
      const user = payload.user || "default";
      saveBroadcastState(user, payload.state);
      return jsonResponse({ success: true, data: { user, state: payload.state, updatedAt: new Date().toISOString() } });
    }
    
    if (action === "saveUser") {
      saveUserAccount(payload.user);
      return jsonResponse({ success: true });
    }
    
    if (action === "deleteUser") {
      deleteUserAccount(payload.username);
      return jsonResponse({ success: true });
    }
    
    return jsonResponse({ success: false, error: "Invalid POST action" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Create Users Sheet
  let usersSheet = ss.getSheetByName("Users");
  if (!usersSheet) {
    usersSheet = ss.insertSheet("Users");
  }
  usersSheet.clear();
  usersSheet.appendRow(["Username", "Password", "Email", "StartDate", "ExpirationDate", "Notes", "LastLogin"]);
  usersSheet.appendRow(["admin", "admin123", "admin@tournament.com", "2026-01-01", "2036-12-31", "Default Admin with full access", ""]);
  usersSheet.appendRow(["operator", "operator456", "operator@tournament.com", "2026-01-01", "2036-12-31", "Standard Operator with full access", ""]);
  usersSheet.appendRow(["operator_1", "p@ssword", "operator1@tournament.com", "2026-01-01", "2028-12-31", "Secondary Operator License", ""]);
  
  // 2. Create BroadcastState Sheet
  let stateSheet = ss.getSheetByName("BroadcastState");
  if (!stateSheet) {
    stateSheet = ss.insertSheet("BroadcastState");
  }
  stateSheet.clear();
  stateSheet.appendRow(["User", "StateJSON", "UpdatedAt"]);
}

function getUsersList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  if (!sheet) throw new Error("Users sheet not initialized. Please click Initialize Database.");
  
  const data = sheet.getDataRange().getValues();
  const users = [];
  
  // Start from row 1 (0-indexed header row skipped)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    
    // Convert Dates to YYYY-MM-DD
    const startStr = row[3] instanceof Date ? formatDate(row[3]) : String(row[3]);
    const expStr = row[4] instanceof Date ? formatDate(row[4]) : String(row[4]);
    
    users.push({
      username: String(row[0]).toLowerCase().trim(),
      pass: String(row[1]),
      email: String(row[2]),
      start: startStr,
      exp: expStr,
      note: String(row[5]),
      lastLogin: String(row[6])
    });
  }
  return users;
}

function saveUserAccount(userObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  if (!sheet) throw new Error("Users sheet not initialized.");
  
  const data = sheet.getDataRange().getValues();
  const username = userObj.username.toLowerCase().trim();
  let foundRowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === username) {
      foundRowIndex = i + 1; // 1-based index
      break;
    }
  }
  
  const rowValues = [
    username,
    userObj.pass,
    userObj.email || "",
    userObj.start || "2026-01-01",
    userObj.exp || "2036-12-31",
    userObj.note || "",
    userObj.lastLogin || ""
  ];
  
  if (foundRowIndex > -1) {
    sheet.getRange(foundRowIndex, 1, 1, 7).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteUserAccount(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  if (!sheet) throw new Error("Users sheet not initialized.");
  
  const data = sheet.getDataRange().getValues();
  const userKey = username.toLowerCase().trim();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === userKey) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function getBroadcastState(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("BroadcastState");
  if (!sheet) throw new Error("BroadcastState sheet not initialized.");
  
  const data = sheet.getDataRange().getValues();
  const userKey = user.toLowerCase().trim();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === userKey) {
      try {
        return JSON.parse(data[i][1]);
      } catch (err) {
        return null;
      }
    }
  }
  return null;
}

function saveBroadcastState(user, stateObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("BroadcastState");
  if (!sheet) {
    sheet = ss.insertSheet("BroadcastState");
    sheet.appendRow(["User", "StateJSON", "UpdatedAt"]);
  }
  
  const data = sheet.getDataRange().getValues();
  const userKey = user.toLowerCase().trim();
  let foundRowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === userKey) {
      foundRowIndex = i + 1;
      break;
    }
  }
  
  const stateJSON = JSON.stringify(stateObj);
  const nowStr = new Date().toISOString();
  
  if (foundRowIndex > -1) {
    sheet.getRange(foundRowIndex, 2).setValue(stateJSON);
    sheet.getRange(foundRowIndex, 3).setValue(nowStr);
  } else {
    sheet.appendRow([userKey, stateJSON, nowStr]);
  }
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
