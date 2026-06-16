import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets");

let cachedAccessToken: string | null = localStorage.getItem("google_sheets_token");
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
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
  await auth.signOut();
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
