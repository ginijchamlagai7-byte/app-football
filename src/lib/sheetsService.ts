import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
let app: any = null;
export let auth: any = null;

const isFirebaseConfigured = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
} else {
  console.warn("Firebase Config API Key is missing. Google Sheets integration is disabled.");
}

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets");

let cachedAccessToken: string | null = localStorage.getItem("google_sheets_token");
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem("google_sheets_token");
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Start Google sign-in
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!auth) {
    alert("Google Sheets Authentication is not configured locally. (firebase-applet-config.json is empty)");
    return null;
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google Auth");
    }
    cachedAccessToken = credential.accessToken;
    localStorage.setItem("google_sheets_token", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google login failed:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || localStorage.getItem("google_sheets_token");
};

export const logoutGoogle = async () => {
  if (auth) {
    await auth.signOut();
  }
  cachedAccessToken = null;
  localStorage.removeItem("google_sheets_token");
};

// ------------------------------
// Google Sheets API Operations
// ------------------------------

export interface SheetUser {
  username: string;
  email: string;
  startDate: string;
  expirationDate: string;
  notes: string;
  lastLogin: string;
  rowIndex: number; // 1-based Row number in the Google Sheet (header is row 1)
}

// Check spreadsheet structure and verify columns: Username, Password, Email, StartDate, ExpirationDate, Notes, LastLogin
export const createDefaultUserSheet = async (accessToken: string, title = "Tournament Users Database"): Promise<string> => {
  // 1. Create a new sheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: "Users" } }],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Setup Headers and default standard user accounts
  const headersAndDefaults = [
    ["Username", "Password", "Email", "StartDate", "ExpirationDate", "Notes", "LastLogin"],
    ["admin", "admin123", "admin@tournament.com", "2026-01-01", "2036-12-31", "Default Admin with full access", ""],
    ["operator", "operator456", "operator@tournament.com", "2026-01-01", "2036-12-31", "Standard Operator with full access", ""]
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Users!A1:G3?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: "Users!A1:G3",
        majorDimension: "ROWS",
        values: headersAndDefaults,
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to populate default rows: ${errText}`);
  }

  return spreadsheetId;
};

// Fetch User rows from Google Sheets
export const fetchUsersFromSheet = async (spreadsheetId: string, accessToken: string): Promise<Record<string, { row: any[]; rowIndex: number }>> => {
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Users!A1:G100`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!getRes.ok) {
    const errText = await getRes.text();
    throw new Error(`Failed to fetch sheet values: ${errText}`);
  }

  const data = await getRes.json();
  const rows = data.values || [];
  
  if (rows.length === 0) {
    throw new Error("Google Sheet is empty or lacks headers");
  }

  // Validate headers to ensure they are the requested required fields
  const headers = rows[0].map((h: string) => h.trim().toLowerCase());
  const required = ["username", "password", "email", "startdate", "expirationdate", "notes", "lastlogin"];
  const missing = required.filter(col => !headers.includes(col));
  
  if (missing.length > 0) {
    console.warn(`Spreadsheet headers might not match expectations. Missing: ${missing.join(", ")}`);
  }

  // Map to speed up lookup by username
  // row index starts at 1, so row 2 is array index 1
  const usersMap: Record<string, { row: any[]; rowIndex: number }> = {};
  for (let i = 1; i < rows.length; i++) {
    const username = rows[i][0];
    if (username) {
      usersMap[username.toLowerCase().trim()] = {
        row: rows[i],
        rowIndex: i + 1, // 1-indexed row number
      };
    }
  }

  return usersMap;
};

// Simple CSV parser that handles quotes and line breaks
export const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let col = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          col += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        col += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(col);
        col = "";
      } else if (char === '\n') {
        row.push(col);
        col = "";
        result.push(row);
        row = [];
      } else if (char === '\r') {
        if (next === '\n') {
          row.push(col);
          col = "";
          result.push(row);
          row = [];
          i++;
        }
      } else {
        col += char;
      }
    }
  }
  if (row.length > 0 || col !== "") {
    row.push(col);
    result.push(row);
  }
  // Filter out completely empty rows
  return result.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
};

// Fetch User rows from Google Sheets using public CSV export (without access token)
// Fetch User rows via JSONP to bypass CORS completely without any backend proxy
export const fetchUsersViaJSONP = (spreadsheetId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = `gviz_jsonp_${Math.round(Math.random() * 1000000)}`;
    
    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    const script = document.createElement("script");
    script.src = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=Users`;
    script.async = true;

    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[callbackName];
    };

    script.onerror = (err) => {
      cleanup();
      reject(new Error("Google Sheet JSONP fetch failed. Make sure the spreadsheet is shared publicly."));
    };

    document.head.appendChild(script);
  });
};

const mapGVizDataToUsers = (data: any): Record<string, { row: any[]; rowIndex: number }> => {
  if (!data || !data.table || !data.table.rows) {
    throw new Error("Invalid structure returned from Google Sheets");
  }

  const rows = data.table.rows;
  const usersMap: Record<string, { row: any[]; rowIndex: number }> = {};

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.c) continue;

    const rowValues = r.c.map((cell: any) => {
      if (!cell) return "";
      return cell.v !== null && cell.v !== undefined ? String(cell.v) : "";
    });

    const username = rowValues[0];
    if (username) {
      usersMap[username.toLowerCase().trim()] = {
        row: rowValues,
        rowIndex: i + 2, // Row 1 is header, first data row is row 2
      };
    }
  }

  return usersMap;
};

// Fetch User rows from Google Sheets using public CSV export (with JSONP bypass fallback)
export const fetchUsersFromPublicSheet = async (spreadsheetId: string): Promise<Record<string, { row: any[]; rowIndex: number }>> => {
  const proxyUrl = `/google-sheets/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=Users`;
  
  try {
    const getRes = await fetch(proxyUrl, { method: "GET" });
    if (getRes.ok) {
      const csvText = await getRes.text();
      const rows = parseCSV(csvText);
      
      if (rows.length === 0) {
        throw new Error("Google Sheet is empty or lacks headers");
      }

      const usersMap: Record<string, { row: any[]; rowIndex: number }> = {};
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const username = row[0];
        if (username) {
          usersMap[username.toLowerCase().trim()] = {
            row: row,
            rowIndex: i + 1,
          };
        }
      }
      return usersMap;
    }
  } catch (err) {
    console.warn("Proxy request failed or was blocked, falling back to CORS-free JSONP fetch...", err);
  }

  // Fallback to JSONP which bypasses CORS completely
  try {
    const gvizData = await fetchUsersViaJSONP(spreadsheetId);
    return mapGVizDataToUsers(gvizData);
  } catch (jsonpErr: any) {
    console.error("JSONP fetch fallback also failed:", jsonpErr);
    throw new Error(`Failed to load auth database from Google Sheets: CORS blocked direct access, and JSONP failed. Please verify that the spreadsheet is shared publicly ("Anyone with the link can view") and spreadsheet ID is correct.`);
  }
};

// Log the user login into Google Sheets LastLogin column
export const updateLastLogin = async (spreadsheetId: string, accessToken: string, rowIndex: number): Promise<void> => {
  const nowStr = new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";
  
  // LastLogin is G column (7th column)
  const cellRange = `Users!G${rowIndex}`;
  
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${cellRange}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: cellRange,
        majorDimension: "ROWS",
        values: [[nowStr]],
      }),
    }
  );
};

export const createSheetIfMissing = async (spreadsheetId: string, accessToken: string, title: string) => {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title }
            }
          }
        ]
      }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
};

export const writeSheetValues = async (spreadsheetId: string, accessToken: string, range: string, values: string[][]) => {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to write values to range ${range}: ${err}`);
  }
};

export const clearSheetValues = async (spreadsheetId: string, accessToken: string, range: string) => {
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  } catch (e) {
    // Ignore clear errors
  }
};

export const readSheetValues = async (spreadsheetId: string, accessToken: string, range: string) => {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to read range ${range}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.values || [];
};

export const generateDbTemplates = async (spreadsheetId: string, accessToken: string, defaultData: any) => {
  await createSheetIfMissing(spreadsheetId, accessToken, "TournamentInfo");
  await createSheetIfMissing(spreadsheetId, accessToken, "Teams");
  await createSheetIfMissing(spreadsheetId, accessToken, "Fixtures");
  await createSheetIfMissing(spreadsheetId, accessToken, "Players");

  await exportDbToSheets(spreadsheetId, accessToken, defaultData);
};

export const exportDbToSheets = async (spreadsheetId: string, accessToken: string, dbData: any) => {
  const infoValues = [
    ["Name", "Season", "Venue", "Organizer", "Notes"],
    [
      dbData.matchInfo.tournamentName,
      dbData.matchInfo.season,
      dbData.matchInfo.venue,
      dbData.tournaments?.[0]?.organizer || "Premier Champions Association",
      dbData.tournaments?.[0]?.notes || ""
    ]
  ];
  await writeSheetValues(spreadsheetId, accessToken, "TournamentInfo!A1:E2", infoValues);

  const teamHeaders = ["Id", "Name", "ShortName", "Color", "SecondaryColor", "LogoUrl", "Played", "Won", "Drawn", "Lost", "GoalsFor", "GoalsAgainst", "Points"];
  const teamRows = [teamHeaders];
  dbData.tournamentTeams.forEach((t: any) => {
    teamRows.push([
      t.id, t.name, t.shortName, t.color, t.secondaryColor, t.logoUrl,
      String(t.played), String(t.won), String(t.drawn), String(t.lost),
      String(t.goalsFor), String(t.goalsAgainst), String(t.points)
    ]);
  });
  await clearSheetValues(spreadsheetId, accessToken, "Teams!A1:M100");
  await writeSheetValues(spreadsheetId, accessToken, `Teams!A1:M${teamRows.length}`, teamRows);

  const fixtureHeaders = ["Id", "HomeTeamId", "AwayTeamId", "HomeScore", "AwayScore", "Status", "Venue", "Date", "Time", "MatchNumber"];
  const fixtureRows = [fixtureHeaders];
  dbData.fixtures.forEach((f: any) => {
    fixtureRows.push([
      f.id, f.homeTeamId, f.awayTeamId, String(f.homeScore !== undefined && f.homeScore !== null ? f.homeScore : ""),
      String(f.awayScore !== undefined && f.awayScore !== null ? f.awayScore : ""), f.status, f.venue, f.date, f.time, String(f.matchNumber)
    ]);
  });
  await clearSheetValues(spreadsheetId, accessToken, "Fixtures!A1:J200");
  await writeSheetValues(spreadsheetId, accessToken, `Fixtures!A1:J${fixtureRows.length}`, fixtureRows);

  const playerHeaders = ["Id", "TeamId", "Name", "Number", "Position", "IsCaptain", "IsStarting", "Goals", "Assists", "YellowCards", "RedCards", "Shots", "Passes", "Saves"];
  const playerRows = [playerHeaders];
  
  dbData.matchInfo.homeTeam.players.forEach((p: any) => {
    playerRows.push([
      p.id, "home", p.name, String(p.number), p.position, String(p.isCaptain), String(p.isStarting),
      String(p.goals), String(p.assists), String(p.yellowCards), String(p.redCards),
      String(p.shots), String(p.passes), String(p.saves)
    ]);
  });
  dbData.matchInfo.awayTeam.players.forEach((p: any) => {
    playerRows.push([
      p.id, "away", p.name, String(p.number), p.position, String(p.isCaptain), String(p.isStarting),
      String(p.goals), String(p.assists), String(p.yellowCards), String(p.redCards),
      String(p.shots), String(p.passes), String(p.saves)
    ]);
  });
  await clearSheetValues(spreadsheetId, accessToken, "Players!A1:N500");
  await writeSheetValues(spreadsheetId, accessToken, `Players!A1:N${playerRows.length}`, playerRows);
};

export const importDbFromSheets = async (spreadsheetId: string, accessToken: string) => {
  const infoRows = await readSheetValues(spreadsheetId, accessToken, "TournamentInfo!A1:E5");
  const teamRows = await readSheetValues(spreadsheetId, accessToken, "Teams!A1:M100");
  const fixtureRows = await readSheetValues(spreadsheetId, accessToken, "Fixtures!A1:J200");
  const playerRows = await readSheetValues(spreadsheetId, accessToken, "Players!A1:N500");

  let tournamentName = "Premier Champions Elite Cup";
  let season = "2026/27";
  let venue = "Etihad Stadium, Manchester";
  let organizer = "Premier Champions Association";
  let notes = "";

  if (infoRows.length > 1) {
    const headers = infoRows[0].map(h => h.trim().toLowerCase());
    const dataRow = infoRows[1];
    const getVal = (name: string) => {
      const idx = headers.indexOf(name);
      return idx > -1 && dataRow[idx] !== undefined ? dataRow[idx] : "";
    };
    tournamentName = getVal("name") || tournamentName;
    season = getVal("season") || season;
    venue = getVal("venue") || venue;
    organizer = getVal("organizer") || organizer;
    notes = getVal("notes") || notes;
  }

  const parsedTeams: any[] = [];
  if (teamRows.length > 1) {
    const headers = teamRows[0].map(h => h.trim().toLowerCase());
    for (let i = 1; i < teamRows.length; i++) {
      const row = teamRows[i];
      if (!row[0]) continue;
      const getVal = (name: string) => {
        const idx = headers.indexOf(name);
        return idx > -1 && row[idx] !== undefined ? row[idx] : "";
      };
      parsedTeams.push({
        id: getVal("id"),
        name: getVal("name"),
        shortName: getVal("shortname"),
        color: getVal("color") || "#cccccc",
        secondaryColor: getVal("secondarycolor") || "#333333",
        logoUrl: getVal("logourl") || "",
        played: Number(getVal("played") || 0),
        won: Number(getVal("won") || 0),
        drawn: Number(getVal("drawn") || 0),
        lost: Number(getVal("lost") || 0),
        goalsFor: Number(getVal("goalsfor") || 0),
        goalsAgainst: Number(getVal("goalsagainst") || 0),
        points: Number(getVal("points") || 0),
        fairPlayPoints: 100
      });
    }
  }

  const parsedFixtures: any[] = [];
  if (fixtureRows.length > 1) {
    const headers = fixtureRows[0].map(h => h.trim().toLowerCase());
    for (let i = 1; i < fixtureRows.length; i++) {
      const row = fixtureRows[i];
      if (!row[0]) continue;
      const getVal = (name: string) => {
        const idx = headers.indexOf(name);
        return idx > -1 && row[idx] !== undefined ? row[idx] : "";
      };
      const homeScore = getVal("homescore");
      const awayScore = getVal("awayscore");
      parsedFixtures.push({
        id: getVal("id"),
        homeTeamId: getVal("hometeamid"),
        awayTeamId: getVal("awayteamid"),
        homeScore: homeScore !== "" ? Number(homeScore) : undefined,
        awayScore: awayScore !== "" ? Number(awayScore) : undefined,
        status: getVal("status") || "UPCOMING",
        venue: getVal("venue") || "",
        date: getVal("date") || "",
        time: getVal("time") || "",
        matchNumber: Number(getVal("matchnumber") || 1)
      });
    }
  }

  const homePlayers: any[] = [];
  const awayPlayers: any[] = [];
  if (playerRows.length > 1) {
    const headers = playerRows[0].map(h => h.trim().toLowerCase());
    for (let i = 1; i < playerRows.length; i++) {
      const row = playerRows[i];
      if (!row[0]) continue;
      const getVal = (name: string) => {
        const idx = headers.indexOf(name);
        return idx > -1 && row[idx] !== undefined ? row[idx] : "";
      };
      const pTeam = getVal("teamid").toLowerCase().trim();
      const playerObj = {
        id: getVal("id"),
        teamId: pTeam === "home" ? "home" : "away",
        name: getVal("name"),
        number: Number(getVal("number") || 1),
        position: getVal("position"),
        isCaptain: getVal("iscaptain").toLowerCase() === "true",
        isStarting: getVal("isstarting").toLowerCase() === "true",
        goals: Number(getVal("goals") || 0),
        assists: Number(getVal("assists") || 0),
        yellowCards: Number(getVal("yellowcards") || 0),
        redCards: Number(getVal("redcards") || 0),
        shots: Number(getVal("shots") || 0),
        passes: Number(getVal("passes") || 0),
        saves: Number(getVal("saves") || 0),
        fouls: 0,
        offsides: 0,
        minutesPlayed: 0
      };
      if (pTeam === "home") {
        homePlayers.push(playerObj);
      } else {
        awayPlayers.push(playerObj);
      }
    }
  }

  const homeTeamObj = parsedTeams.find(t => t.id === "home") || {
    id: "home", name: "Manchester Blue", shortName: "MCI", color: "#6cabdd", secondaryColor: "#1c2c5b", logoUrl: ""
  };
  const awayTeamObj = parsedTeams.find(t => t.id === "away") || {
    id: "away", name: "London Red", shortName: "ARS", color: "#ef0107", secondaryColor: "#063672", logoUrl: ""
  };

  return {
    tournamentName,
    season,
    venue,
    homeTeam: {
      ...homeTeamObj,
      players: homePlayers
    },
    awayTeam: {
      ...awayTeamObj,
      players: awayPlayers
    },
    tournamentTeams: parsedTeams,
    fixtures: parsedFixtures,
    organizer,
    notes
  };
};

// ------------------------------
// Google Apps Script (GAS) Web App integrations
// ------------------------------

export const getActiveGASUrl = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("google_apps_script_url");
  }
  return null;
};

export const initializeGASDatabase = async (url: string): Promise<boolean> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "init" })
  });
  if (!res.ok) {
    throw new Error(`GAS Init failed: ${res.statusText}`);
  }
  const data = await res.json();
  return data.success;
};

export const fetchUsersFromGAS = async (url: string): Promise<any[]> => {
  const res = await fetch(`${url}?action=getUsers`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`GAS GetUsers failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "GAS GetUsers failed");
  }
  return data.data || [];
};

export const saveUserToGAS = async (url: string, user: any): Promise<boolean> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveUser", user })
  });
  if (!res.ok) {
    throw new Error(`GAS SaveUser failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "GAS SaveUser failed");
  }
  return data.success;
};

export const deleteUserFromGAS = async (url: string, username: string): Promise<boolean> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteUser", username })
  });
  if (!res.ok) {
    throw new Error(`GAS DeleteUser failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "GAS DeleteUser failed");
  }
  return data.success;
};
