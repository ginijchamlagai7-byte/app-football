import { AppState } from "../types";

const BROADCAST_STATE_API = import.meta.env.VITE_BROADCAST_STATE_API || "/api/broadcast-state";

export interface BroadcastStateRecord {
  user: string;
  state: AppState;
  updatedAt: string;
}

export const normalizeBroadcastUser = (username?: string | null) => {
  return (username || "default").trim().toLowerCase() || "default";
};

export const getBroadcastStorageKey = (username?: string | null) => {
  const user = normalizeBroadcastUser(username);
  return user === "default" ? "match_broadcast_state" : `match_broadcast_state_${user}`;
};

export const getActiveEndpoint = () => {
  // Check URL params first (critical for isolated OBS CEF rendering)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("scriptUrl");
    if (urlParam) return urlParam;

    // Fallback to local storage configuration
    const localUrl = localStorage.getItem("google_apps_script_url");
    if (localUrl) return localUrl;
  }
  return BROADCAST_STATE_API;
};

export const loadBroadcastState = async (username?: string | null): Promise<BroadcastStateRecord | null> => {
  const user = normalizeBroadcastUser(username);
  const endpoint = getActiveEndpoint();
  const isGAS = endpoint.includes("script.google.com");

  const url = isGAS 
    ? `${endpoint}?action=getState&user=${encodeURIComponent(user)}`
    : `${endpoint}?user=${encodeURIComponent(user)}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Broadcast database read failed: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Broadcast database read failed");
  }

  return result.data || null;
};

export const saveBroadcastState = async (username: string | null | undefined, state: AppState) => {
  const user = normalizeBroadcastUser(username);
  const endpoint = getActiveEndpoint();
  const isGAS = endpoint.includes("script.google.com");

  const payload = isGAS 
    ? { action: "saveState", user, state }
    : { user, state };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Broadcast database write failed: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Broadcast database write failed");
  }

  return result.data as BroadcastStateRecord;
};

export const sanitizeState = (incoming: any, defaultState: AppState): AppState => {
  if (!incoming || typeof incoming !== "object") return defaultState;
  
  return {
    ...defaultState,
    ...incoming,
    matchInfo: incoming.matchInfo ? {
      ...defaultState.matchInfo,
      ...incoming.matchInfo,
      homeTeam: incoming.matchInfo.homeTeam ? {
        ...defaultState.matchInfo.homeTeam,
        ...incoming.matchInfo.homeTeam,
        players: Array.isArray(incoming.matchInfo.homeTeam.players)
          ? incoming.matchInfo.homeTeam.players
          : (defaultState.matchInfo.homeTeam?.players || [])
      } : defaultState.matchInfo.homeTeam,
      awayTeam: incoming.matchInfo.awayTeam ? {
        ...defaultState.matchInfo.awayTeam,
        ...incoming.matchInfo.awayTeam,
        players: Array.isArray(incoming.matchInfo.awayTeam.players)
          ? incoming.matchInfo.awayTeam.players
          : (defaultState.matchInfo.awayTeam?.players || [])
      } : defaultState.matchInfo.awayTeam
    } : defaultState.matchInfo,
    stats: incoming.stats ? {
      ...defaultState.stats,
      ...incoming.stats
    } : defaultState.stats,
    graphics: incoming.graphics ? {
      ...defaultState.graphics,
      ...incoming.graphics
    } : defaultState.graphics,
    activeGraphicSettings: incoming.activeGraphicSettings ? {
      ...defaultState.activeGraphicSettings,
      ...incoming.activeGraphicSettings
    } : defaultState.activeGraphicSettings,
    tournamentTeams: Array.isArray(incoming.tournamentTeams) ? incoming.tournamentTeams : (defaultState.tournamentTeams || []),
    fixtures: Array.isArray(incoming.fixtures) ? incoming.fixtures : (defaultState.fixtures || []),
    tournaments: Array.isArray(incoming.tournaments) ? incoming.tournaments : (defaultState.tournaments || []),
    venues: Array.isArray(incoming.venues) ? incoming.venues : (defaultState.venues || []),
    timeline: Array.isArray(incoming.timeline) ? incoming.timeline : (defaultState.timeline || []),
    penaltyShootout: incoming.penaltyShootout ? {
      ...defaultState.penaltyShootout,
      ...incoming.penaltyShootout
    } : defaultState.penaltyShootout
  };
};

