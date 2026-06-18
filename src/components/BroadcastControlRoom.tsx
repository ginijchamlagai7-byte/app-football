import React, { useState, useEffect, useRef } from "react";
import { 
  Trophy, Play, Pause, Square, ChevronRight, Eye, EyeOff, Plus, Edit3, Trash2, 
  RotateCcw, History, Settings, Users, Clipboard, RefreshCw, Layers, Award,
  Globe, Info, FileText, Monitor, HelpCircle, LayoutGrid, CheckSquare, Clock,
  Lock, Mail, LogOut, Check, Sparkles, Copy, FileSpreadsheet, PlayCircle, Loader2,
  ArrowRightLeft, AlertTriangle, Unlock
} from "lucide-react";
import { 
  AppState, MatchInfo, Player, MatchEvent, MatchEventType, Position, 
  ActiveGraphics, TournamentTeam, Fixture, Tournament, Venue
} from "../types";
import { 
  DEFAULT_PLAYERS_HOME, DEFAULT_PLAYERS_AWAY, DEFAULT_REFEREES, 
  DEFAULT_TOURNAMENT_NAME, DEFAULT_SEASON, DEFAULT_TOURNAMENT_TEAMS, 
  DEFAULT_FIXTURES 
} from "../data/defaultData";
import { LiveGraphicsOverlay } from "./LiveGraphicsOverlay";
import { 
  initAuth, googleSignIn, fetchUsersFromSheet, createDefaultUserSheet, 
  updateLastLogin, getAccessToken, logoutGoogle,
  generateDbTemplates, exportDbToSheets, importDbFromSheets,
  fetchUsersFromPublicSheet,
  getActiveGASUrl, initializeGASDatabase, fetchUsersFromGAS, saveUserToGAS, deleteUserFromGAS
} from "../lib/sheetsService";
import { 
  getBroadcastStorageKey, loadBroadcastState, normalizeBroadcastUser, saveBroadcastState, sanitizeState
} from "../lib/broadcastStateService";

export const createDefaultState = (): AppState => ({
  matchInfo: {
    tournamentName: DEFAULT_TOURNAMENT_NAME,
    season: DEFAULT_SEASON,
    matchNumber: 45,
    venue: "Etihad Stadium, Manchester",
    date: new Date().toISOString().split("T")[0],
    time: "19:45",
    referee: DEFAULT_REFEREES.referee,
    assistantReferee1: DEFAULT_REFEREES.assistantReferee1,
    assistantReferee2: DEFAULT_REFEREES.assistantReferee2,
    fourthOfficial: DEFAULT_REFEREES.fourthOfficial,
    sponsorName: "Chronos Airways",
    sponsorLogoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Globe_icon_2.svg",
    homeTeam: {
      id: "home",
      name: "Manchester Blue",
      shortName: "MCI",
      color: "#6cabdd",
      secondaryColor: "#1c2c5b",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
      formation: "4-3-3",
      players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS_HOME))
    },
    awayTeam: {
      id: "away",
      name: "London Red",
      shortName: "ARS",
      color: "#ef0107",
      secondaryColor: "#063672",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
      formation: "4-2-3-1",
      players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS_AWAY))
    }
  },
  period: "PRE",
  matchMinute: 0,
  matchSecond: 0,
  stoppageMinutes: 0,
  isClockRunning: false,
  timeline: [],
  stats: {
    possessionHome: 52,
    xgHome: 0.15,
    xgAway: 0.12,
    shotsHome: 2,
    shotsAway: 1,
    shotsOnTargetHome: 1,
    shotsOnTargetAway: 0,
    cornersHome: 1,
    cornersAway: 1,
    foulsHome: 2,
    foulsAway: 3,
    offsidesHome: 1,
    offsidesAway: 0,
    yellowCardsHome: 0,
    yellowCardsAway: 1,
    redCardsHome: 0,
    redCardsAway: 0,
    savesHome: 0,
    savesAway: 1,
    passAccuracyHome: 88,
    passAccuracyAway: 84
  },
  graphics: {
    scoreBug: true,
    matchIntro: false,
    startingXI: false,
    startingXIAway: false,
    formationGraphic: false,
    teamLineup: false,
    benchGraphic: false,
    goalGraphic: false,
    goalScorerGraphic: false,
    assistGraphic: false,
    yellowCardGraphic: false,
    redCardGraphic: false,
    substitutionGraphic: false,
    matchStatistics: false,
    possessionGraphic: false,
    shotComparison: false,
    cornerComparison: false,
    teamComparison: false,
    playerStatistics: false,
    manOfTheMatch: false,
    halfTimeGraphic: false,
    fullTimeGraphic: false,
    leagueTable: false,
    fixtures: false,
    upcomingMatch: false,
    tournamentBracket: false,
    sponsorGraphic: false,
    lowerThird: false,
    breakingNewsTicker: true,
    varReviewGraphic: false,
    injuryTimeGraphic: false,
    resultGraphic: false
  },
  activeGraphicSettings: {
    scoreBug: {},
    matchIntro: {},
    startingXI: { targetTeamId: "home" },
    startingXIAway: { targetTeamId: "away" },
    formationGraphic: { targetTeamId: "home" },
    teamLineup: {},
    benchGraphic: { targetTeamId: "home" },
    goalGraphic: {},
    goalScorerGraphic: {},
    assistGraphic: {},
    yellowCardGraphic: {},
    redCardGraphic: {},
    substitutionGraphic: {},
    matchStatistics: {},
    possessionGraphic: {},
    shotComparison: {},
    cornerComparison: {},
    teamComparison: {},
    playerStatistics: { targetPlayerId: "h10" },
    manOfTheMatch: { targetPlayerId: "h10" },
    halfTimeGraphic: {},
    fullTimeGraphic: {},
    leagueTable: {},
    fixtures: {},
    upcomingMatch: {},
    tournamentBracket: {},
    sponsorGraphic: {},
    lowerThird: {},
    breakingNewsTicker: {},
    varReviewGraphic: {},
    injuryTimeGraphic: {},
    resultGraphic: {}
  },
  tournamentTeams: DEFAULT_TOURNAMENT_TEAMS,
  fixtures: DEFAULT_FIXTURES,
  newsTickerText: "LIVE FEED: Premier Champions Cup matches broadcasting in digital high definitions. Match score elements auto synchronized.",
  tournaments: [
    {
      id: "t1",
      name: DEFAULT_TOURNAMENT_NAME,
      season: DEFAULT_SEASON,
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Globe_icon_2.svg",
      organizer: "Premier Champions Association",
      venue: "Etihad Stadium, Manchester",
      notes: "Main season division championship."
    }
  ],
  activeTournamentId: "t1",
  venues: [
    { id: "v1", name: "Etihad Stadium, Manchester" },
    { id: "v2", name: "Emirates Stadium, London" },
    { id: "v3", name: "Camp Nou, Barcelona" }
  ],
  playerMode: "A",
  simplifiedGraphicsMode: false,
  matchResultStatus: null,
  activeTheme: "slate_gray",
  themePrimaryBgColor: "",
  themeSecondaryBgColor: "",
  themeTextColor: ""
});

export const BroadcastControlRoom: React.FC = () => {
  const pad = (num: number) => num.toString().padStart(2, "0");

  // Determine initial logged-in user at startup
  const [currentUser, setCurrentUser] = useState<{ username: string; email: string; role: string } | null>(() => {
    const cached = sessionStorage.getItem("current_logged_in_user");
    return cached ? JSON.parse(cached) : null;
  });

  // Track the username for whom state has currently been loaded to avoid overwrites
  const lastLoadedUserRef = useRef<string | null>(
    currentUser ? currentUser.username : null
  );
  const remoteSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyingRemoteStateRef = useRef(false);

  // 1. Unified App State
  const [state, setState] = useState<AppState>(() => {
    const defaultState = createDefaultState();
    const initialUsername = currentUser ? currentUser.username : null;
    const storageKey = getBroadcastStorageKey(initialUsername);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && parsed.matchInfo) {
          return sanitizeState(parsed, defaultState);
        }
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
    return defaultState;
  });

  // Dynamic automatic state synchronization to localStorage
  useEffect(() => {
    const currentUsername = currentUser ? currentUser.username : null;
    if (currentUsername === lastLoadedUserRef.current) {
      if (currentUsername) {
        localStorage.setItem(getBroadcastStorageKey(currentUsername), JSON.stringify(state));
      }
      localStorage.setItem("match_broadcast_state", JSON.stringify(state));

      if (!applyingRemoteStateRef.current) {
        if (remoteSaveTimerRef.current) {
          clearTimeout(remoteSaveTimerRef.current);
        }

        remoteSaveTimerRef.current = setTimeout(() => {
          saveBroadcastState(currentUsername, state)
            .then((record) => {
              setBroadcastDbStatus(`Database synced ${new Date(record.updatedAt).toLocaleTimeString()}`);
            })
            .catch((err) => {
              console.warn("Broadcast database save failed", err);
              setBroadcastDbStatus("Local mode: database endpoint unavailable");
            });
        }, 350);
      }
    }
  }, [state, currentUser]);

  useEffect(() => {
    const currentUsername = currentUser ? currentUser.username : null;
    let cancelled = false;

    loadBroadcastState(currentUsername)
      .then((record) => {
        if (cancelled || !record?.state?.matchInfo) {
          setBroadcastDbStatus("Database ready");
          return;
        }

        applyingRemoteStateRef.current = true;
        lastLoadedUserRef.current = currentUsername;
        setState(prev => ({
          ...prev,
          ...record.state,
          venues: Array.isArray(record.state.venues) ? record.state.venues : (prev.venues || []),
          tournaments: Array.isArray(record.state.tournaments) ? record.state.tournaments : (prev.tournaments || []),
          tournamentTeams: Array.isArray(record.state.tournamentTeams) ? record.state.tournamentTeams : (prev.tournamentTeams || []),
          timeline: Array.isArray(record.state.timeline) ? record.state.timeline : (prev.timeline || []),
          graphics: {
            ...prev.graphics,
            ...record.state.graphics
          },
          activeGraphicSettings: {
            ...prev.activeGraphicSettings,
            ...record.state.activeGraphicSettings
          }
        }));
        localStorage.setItem(getBroadcastStorageKey(currentUsername), JSON.stringify(record.state));
        localStorage.setItem("match_broadcast_state", JSON.stringify(record.state));
        setBroadcastDbStatus(`Loaded database state ${new Date(record.updatedAt).toLocaleTimeString()}`);
        setTimeout(() => {
          applyingRemoteStateRef.current = false;
        }, 0);
      })
      .catch((err) => {
        console.warn("Broadcast database load failed", err);
        setBroadcastDbStatus("Local mode: database endpoint unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // UI Control States
  const [activeTab, setActiveTab] = useState<"control" | "setup" | "squads" | "tournament" | "output">("control");
  const [squadConfigTeam, setSquadConfigTeam] = useState<"home" | "away">("home");

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [broadcastDbStatus, setBroadcastDbStatus] = useState("Database starting...");

  // ==========================================
  // ADVANCED TOURNAMENT STAGES & CONFIGS
  // ==========================================
  const [tournamentTab, setTournamentTab] = useState<"registry" | "groups" | "bracket" | "themes" | "accounts">("registry");

  // Groups and manual/automated assignment states
  const [groupTeams, setGroupTeams] = useState<Record<string, string[]>>(() => {
    const cached = localStorage.getItem("tournament_groups_cache");
    if (cached) return JSON.parse(cached);
    return {
      "Group A": ["Manchester Blue", "London Red", "Merseyside Red", "West London Blue"],
      "Group B": ["Madrid White", "Barcelona Blaugrana", "Munich Red", "Paris Jewel"],
      "Group C": ["Milano Red", "Milano Blue", "Juventus Zebra", "Turin Maroon"],
      "Group D": ["Dortmund Yellow", "Ajax Red", "Benfica Red", "Porto Blue"]
    };
  });

  const [groupOverrides, setGroupOverrides] = useState<Record<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number }>>(() => {
    const cached = localStorage.getItem("group_overrides_cache");
    return cached ? JSON.parse(cached) : {};
  });

  const [tiebreakerPriority, setTiebreakerPriority] = useState<"GD" | "GF" | "H2H" | "FairPlay">("GD");

  // Group Draw system
  const handleRandomizeGroups = () => {
    const allRegisteredTeams = state.tournamentTeams.map(t => t.name);
    if (allRegisteredTeams.length === 0) {
      alert("No registered tournament teams found. Please add teams in the Team Setup section first!");
      return;
    }
    
    // Shuffle
    const shuffled = [...allRegisteredTeams].sort(() => Math.random() - 0.5);
    const names = ["Group A", "Group B", "Group C", "Group D"];
    const nextGroups: Record<string, string[]> = { "Group A": [], "Group B": [], "Group C": [], "Group D": [] };
    
    shuffled.forEach((teamName, index) => {
      const gName = names[index % 4];
      nextGroups[gName].push(teamName);
    });

    setGroupTeams(nextGroups);
    localStorage.setItem("tournament_groups_cache", JSON.stringify(nextGroups));
  };

  const handleUpdateGroupOverrides = (teamName: string, field: string, change: number) => {
    setGroupOverrides(prev => {
      const current = prev[teamName] || { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
      const nextVal = Math.max(0, (current[field as keyof typeof current] || 0) + change);
      const updated = {
        ...prev,
        [teamName]: {
          ...current,
          [field]: nextVal
        }
      };
      localStorage.setItem("group_overrides_cache", JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetGroupOverrides = () => {
    setGroupOverrides({});
    localStorage.removeItem("group_overrides_cache");
  };

  // Bracket slot states
  const [knockoutSlots, setKnockoutSlots] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem("knockout_slots_cache");
    if (cached) return JSON.parse(cached);
    return {
      "QF1_Team1": "Manchester Blue", "QF1_Team2": "London Red",
      "QF2_Team1": "Merseyside Red", "QF2_Team2": "West London Blue",
      "QF3_Team1": "Madrid White", "QF3_Team2": "Barcelona Blaugrana",
      "QF4_Team1": "Munich Red", "QF4_Team2": "Paris Jewel",
      "SF1_Team1": "", "SF1_Team2": "",
      "SF2_Team1": "", "SF2_Team2": "",
      "F_Team1": "", "F_Team2": "",
      "Third_Team1": "", "Third_Team2": "",
      "Winner": "", "ThirdPlaceWinner": ""
    };
  });

  const handleUpdateKnockoutSlot = (slotKey: string, teamName: string) => {
    setKnockoutSlots(prev => {
      const updated = { ...prev, [slotKey]: teamName };
      localStorage.setItem("knockout_slots_cache", JSON.stringify(updated));
      return updated;
    });
  };

  // Pre-load default template codes for Custom Editable Themes HTML/CSS/JS sandbox
  const [customThemes, setCustomThemes] = useState<any[]>(() => {
    const cached = localStorage.getItem("custom_themes_cache");
    if (cached) return JSON.parse(cached);
    return [
      {
        id: "classic",
        name: "Classic Sports Blue",
        primary: "#121829", secondary: "#1a223f", text: "#ffffff",
        files: {
          "scorebug.html": "<!-- SCOREBUG METRIC OVERLAY -->\n<div class='scorebug-frame' style='font-family: sans-serif;'>\n  <div class='team'>{{HOME_TEAM}}</div>\n  <div class='goals'>{{HOME_GOALS}} - {{AWAY_GOALS}}</div>\n  <div class='team'>{{AWAY_TEAM}}</div>\n  <div class='timer'>{{MINUTES}}:{{SECONDS}}</div>\n</div>",
          "goal.html": "<!-- GOAL CELEBRATION BOX -->\n<div class='goal-burst-dialog'>\n  <h1 class='animate-pulse'>{{TEAM_NAME}} GOOOOOAL!</h1>\n  <h3>Scorer: {{PLAYER_NAME}}</h3>\n  <h3>Assist: {{ASSIST_NAME}}</h3>\n</div>",
          "cards.html": "<!-- DISCIPLINE CARD POPUP -->\n<div class='card-popup-view shadow-lg'>\n  <div class='card-type-header {{CARD_COLOR}}'>{{CARD_TYPE}} CARD</div>\n  <p>Player: {{PLAYER_NAME}} ({{PLAYER_NUMBER}})</p>\n</div>",
          "intro.html": "<!-- MATCH INTRO CARD -->\n<div class='intro-backdrop'>\n  <h2>{{TOURNAMENT_NAME}}</h2>\n  <h1>{{HOME_FULL}} vs {{AWAY_FULL}}</h1>\n  <p>Kickoff Match #{{MATCH_NUM}} at {{VENUE}}</p>\n</div>",
          "result.html": "<!-- FINAL RESULT SCORECARD -->\n<div class='result-score-card'>\n  <h2>MATCH COMPLETE</h2>\n  <h1>{{HOME_SHORT}} {{HOME_FINAL}} : {{AWAY_FINAL}} {{AWAY_SHORT}}</h1>\n</div>",
          "style.css": "/* CUSTOM GLOBAL GRAPHICS STYLES */\nbody { margin: 0; overflow: hidden; }\n.scorebug-frame { display: flex; align-items: center; background: rgba(18, 24, 41, 0.95); border-radius: 6px; padding: 10px; border: 2px solid #3b82f6; }\n.goal-burst-dialog { text-align: center; color: #fbbf24; background: rgba(0,0,0,0.85); p: 20px; border-radius: 12px; }",
          "theme.js": "// Custom logic hook\nconsole.log('Championship Theme successfully parsed live on background canvas.')",
          "config.json": "{\n  \"version\": \"1.0.0\",\n  \"author\": \"Operator Studio\",\n  \"enableTranslucency\": true,\n  \"animations\": [\"fade\", \"slide-down\"]\n}"
        }
      },
      {
        id: "slate_gray",
        name: "Slate Gray Metallic",
        primary: "#1f293d", secondary: "#374151", text: "#f9fafb",
        files: {
          "scorebug.html": "<div class='slate-bug'>{{HOME_TEAM}} [{{HOME_GOALS}}] - [{{AWAY_GOALS}}] {{AWAY_TEAM}}</div>",
          "goal.html": "<div class='slate-goal'>GOAL FOR {{TEAM_NAME}}! SCORER: {{PLAYER_NAME}}</div>",
          "cards.html": "<div class='slate-card {{CARD_COLOR}}'>WARNING ISSUE</div>",
          "intro.html": "<h1>{{TOURNAMENT_NAME}}</h1>",
          "result.html": "<div>COMPLETED</div>",
          "style.css": ".slate-bug { background: #1f293d; color: #f9fafb; padding: 8px; border-radius: 4px; }",
          "theme.js": "console.log('Slate Gray Theme setup parsed.');",
          "config.json": "{\"version\": \"1.0\"}"
        }
      },
      {
        id: "cosmic",
        name: "Cosmic Shadow Neon",
        primary: "#0d0e15", secondary: "#1d1e2c", text: "#f3f4f6",
        files: {
          "scorebug.html": "<div class='cosmic-bug'>🌌 {{HOME_TEAM}} {{HOME_GOALS}} : {{AWAY_GOALS}} {{AWAY_TEAM}}</div>",
          "goal.html": "<div>COSMIC EXPLOSION GOAL! scorer: {{PLAYER_NAME}}</div>",
          "cards.html": "<div>COSMIC PENALTY DISMISSAL</div>",
          "intro.html": "<h1>STARDUST ARENA SHOWDOWN</h1>",
          "result.html": "<div>COSMIC ORBIT COMPLETED</div>",
          "style.css": ".cosmic-bug { background: #0d0e15; border: 1px solid #8b5cf6; }",
          "theme.js": "console.log('Cosmic loaded.')",
          "config.json": "{\"version\": \"2.0\"}"
        }
      }
    ];
  });

  const [activeCustomThemeId, setActiveCustomThemeId] = useState("classic");
  const [selectedThemeFileName, setSelectedThemeFileName] = useState("scorebug.html");
  const [themeFileEditorContent, setThemeFileEditorContent] = useState(() => {
    return customThemes[0].files["scorebug.html"];
  });

  // Handle saving of edited code in theme studio files
  const handleSaveThemeFile = () => {
    setCustomThemes(prev => {
      const updated = prev.map(theme => {
        if (theme.id === activeCustomThemeId) {
          return {
            ...theme,
            files: {
              ...theme.files,
              [selectedThemeFileName]: themeFileEditorContent
            }
          };
        }
        return theme;
      });
      localStorage.setItem("custom_themes_cache", JSON.stringify(updated));
      alert(`Success: "${selectedThemeFileName}" updated in "${activeCustomThemeId}" sandbox theme memory!`);
      return updated;
    });
  };

  const handleSelectThemeSandbox = (themeId: string) => {
    setActiveCustomThemeId(themeId);
    const targetTheme = customThemes.find(t => t.id === themeId);
    if (targetTheme) {
      setThemeFileEditorContent(targetTheme.files[selectedThemeFileName] || "");
      // Instantly trigger live preset primary secondary colors!
      handleUpdateThemeColors(targetTheme.primary, targetTheme.secondary, targetTheme.text, themeId);
    }
  };

  const handleUpdateThemeColors = (primary: string, secondary: string, text: string, themeId?: string) => {
    setState(prev => ({
      ...prev,
      activeTheme: themeId || prev.activeTheme,
      themePrimaryBgColor: primary,
      themeSecondaryBgColor: secondary,
      themeTextColor: text
    }));
  };

  const handleDuplicateThemeSandbox = (themeId: string) => {
    const target = customThemes.find(t => t.id === themeId);
    if (!target) return;
    const duplicated = {
      ...JSON.parse(JSON.stringify(target)),
      id: "theme_" + Date.now(),
      name: target.name + " (Copy)"
    };
    setCustomThemes(prev => {
      const updated = [...prev, duplicated];
      localStorage.setItem("custom_themes_cache", JSON.stringify(updated));
      return updated;
    });
    alert(`Theme duplicated as: ${duplicated.name}`);
  };

  const handleDeleteThemeSandbox = (themeId: string) => {
    if (themeId === "classic") {
      alert("Cannot delete the core Classic Sports Blue theme template.");
      return;
    }
    setCustomThemes(prev => {
      const updated = prev.filter(t => t.id !== themeId);
      localStorage.setItem("custom_themes_cache", JSON.stringify(updated));
      return updated;
    });
    handleSelectThemeSandbox("classic");
  };

  const handleCreateCustomTheme = () => {
    const name = prompt("Enter Name for Custom Theme:", "Custom Cyber Punk");
    if (!name) return;
    const newId = "theme_" + Date.now();
    const newTheme = {
      id: newId,
      name: name,
      primary: "#111827", secondary: "#b91c1c", text: "#f9fafb",
      files: {
        "scorebug.html": "<div class='custom-bug'>{{HOME_TEAM}} [{{HOME_GOALS}}] vs [{{AWAY_GOALS}}] {{AWAY_TEAM}}</div>",
        "goal.html": "<div>UNBELIEVABLE GOOOOOOL: {{PLAYER_NAME}}!</div>",
        "cards.html": "<div>WARNING PENALIZATION TRIGGER</div>",
        "intro.html": "<h1>{{TOURNAMENT_NAME}} OVERLAY</h1>",
        "result.html": "<div>CONCLUDED</div>",
        "style.css": ".custom-bug { color: #f9fafb; background: #111827; }",
        "theme.js": "console.log('Custom theme loaded.')",
        "config.json": "{\"version\": \"1.0.0\"}"
      }
    };
    setCustomThemes(prev => {
      const updated = [...prev, newTheme];
      localStorage.setItem("custom_themes_cache", JSON.stringify(updated));
      return updated;
    });
    setActiveCustomThemeId(newId);
    setThemeFileEditorContent(newTheme.files["scorebug.html"]);
    setSelectedThemeFileName("scorebug.html");
    handleUpdateThemeColors(newTheme.primary, newTheme.secondary, newTheme.text, newId);
  };

  // Export current active theme setup
  const handleExportThemeJSON = () => {
    const target = customThemes.find(t => t.id === activeCustomThemeId);
    if (!target) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(target, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `theme-${target.id}.json`);
    dlAnchorElem.click();
  };

  // Import themes
  const handleImportThemeJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.files && parsed.name) {
            const nextId = "theme_imported_" + Date.now();
            const importedTheme = {
              ...parsed,
              id: nextId
            };
            setCustomThemes(prev => {
              const updated = [...prev, importedTheme];
              localStorage.setItem("custom_themes_cache", JSON.stringify(updated));
              return updated;
            });
            handleSelectThemeSandbox(nextId);
            alert(`Theme ${parsed.name} imported successfully as a design sandbox!`);
          } else {
            alert("Error: Selected JSON file has invalid custom theme format (missing 'files' or 'name' nodes).");
          }
        } catch (err) {
          alert("Error: Failed to parse custom theme JSON file.");
        }
      };
    }
  };

  // ==========================================
  // LOCAL USER ACCOUNTS & CREDENTIALS STORAGE
  // ==========================================
  const [userDatabase, setUserDatabase] = useState<any[]>(() => {
    const cached = localStorage.getItem("local_user_accounts");
    if (cached) return JSON.parse(cached);
    const defaults = [
      { username: "admin", email: "admin@tournament.com", pass: "admin123", role: "admin", start: "2026-01-01", exp: "2036-12-31", note: "Default Admin with full access", lastLogin: "" },
      { username: "operator", email: "operator@tournament.com", pass: "operator456", role: "operator", start: "2026-01-01", exp: "2036-12-31", note: "Standard Operator with full access", lastLogin: "" },
      { username: "operator_1", email: "operator1@tournament.com", pass: "p@ssword", role: "operator", start: "2026-01-01", exp: "2028-12-31", note: "Secondary Operator License", lastLogin: "" }
    ];
    localStorage.setItem("local_user_accounts", JSON.stringify(defaults));
    return defaults;
  });

  const [newUserRegUser, setNewUserRegUser] = useState("");
  const [newUserRegEmail, setNewUserRegEmail] = useState("");
  const [newUserRegPass, setNewUserRegPass] = useState("");
  const [newUserRegRole, setNewUserRegRole] = useState("operator");
  const [newUserRegStart, setNewUserRegStart] = useState("2026-01-01");
  const [newUserRegExp, setNewUserRegExp] = useState("2036-12-31");
  const [newUserRegNotes, setNewUserRegNotes] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePassStatus, setChangePassStatus] = useState("");

  const [gasUrlInput, setGasUrlInput] = useState(() => {
    return localStorage.getItem("google_apps_script_url") || "";
  });
  const [initializingGasDb, setInitializingGasDb] = useState(false);

  const handleSaveGasUrl = () => {
    if (gasUrlInput.trim()) {
      localStorage.setItem("google_apps_script_url", gasUrlInput.trim());
      alert("Google Apps Script Web App URL updated successfully!");
      window.location.reload();
    } else {
      localStorage.removeItem("google_apps_script_url");
      alert("Cloud database URL cleared. Switched to local offline storage.");
      window.location.reload();
    }
  };

  const handleInitGasDatabase = async () => {
    if (!gasUrlInput.trim()) return;
    if (!confirm("This will clear and initialize the Google Sheets database with default headers and accounts. Proceed?")) return;
    
    try {
      setInitializingGasDb(true);
      await initializeGASDatabase(gasUrlInput.trim());
      alert("Successfully created and initialized database sheets in your Google Spreadsheet! Default accounts (admin, operator, operator_1) are now ready.");
      window.location.reload();
    } catch (err: any) {
      alert(`Database initialization failed: ${err.message || err}`);
    } finally {
      setInitializingGasDb(false);
    }
  };

  // Load users from GAS Cloud sheet if URL is configured
  useEffect(() => {
    const gasUrl = getActiveGASUrl();
    if (gasUrl) {
      fetchUsersFromGAS(gasUrl)
        .then((usersList) => {
          localStorage.setItem("local_user_accounts", JSON.stringify(usersList));
          setUserDatabase(usersList);
        })
        .catch((err) => {
          console.warn("Failed to fetch users from Google Sheets GAS database, using cached local accounts:", err);
        });
    }
  }, [currentUser]);

  const handleRegisterUserLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") {
      alert("Unauthorized: Only administrators can add or update accounts.");
      return;
    }
    if (!newUserRegUser.trim() || !newUserRegPass.trim()) {
      alert("Please provide at least a username and secure password.");
      return;
    }

    const usernameKey = newUserRegUser.trim().toLowerCase();
    const cached = localStorage.getItem("local_user_accounts");
    const accountsList = cached ? JSON.parse(cached) : [];

    const existingIndex = accountsList.findIndex((u: any) => u.username === usernameKey);
    const updatedUserObj = {
      username: usernameKey,
      pass: newUserRegPass.trim(),
      email: newUserRegEmail.trim() || (existingIndex > -1 ? accountsList[existingIndex].email : `${usernameKey}@tournament.com`),
      role: newUserRegRole,
      start: newUserRegStart,
      exp: newUserRegExp,
      note: newUserRegNotes.trim() || (existingIndex > -1 ? accountsList[existingIndex].note : "Virtual Operator License"),
      lastLogin: existingIndex > -1 ? accountsList[existingIndex].lastLogin : "Never Logged"
    };

    if (existingIndex > -1) {
      accountsList[existingIndex] = updatedUserObj;
      alert(`User "${usernameKey}" details updated successfully.`);
    } else {
      accountsList.push(updatedUserObj);
      alert(`User "${usernameKey}" created successfully.`);
    }

    localStorage.setItem("local_user_accounts", JSON.stringify(accountsList));
    setUserDatabase(accountsList);

    const gasUrl = getActiveGASUrl();
    if (gasUrl) {
      saveUserToGAS(gasUrl, updatedUserObj).catch(err => {
        console.warn("GAS save user failed", err);
      });
    }

    setNewUserRegUser("");
    setNewUserRegEmail("");
    setNewUserRegPass("");
    setNewUserRegNotes("");
    setNewUserRegRole("operator");
  };

  const handleDeleteUserLocal = (usernameToDelete: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      alert("Unauthorized: Only administrators can delete accounts.");
      return;
    }
    if (usernameToDelete === currentUser.username) {
      alert("You cannot delete your own logged-in admin account!");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the user "${usernameToDelete}"?`)) {
      return;
    }

    const cached = localStorage.getItem("local_user_accounts");
    if (!cached) return;
    const accountsList = JSON.parse(cached);
    const filtered = accountsList.filter((u: any) => u.username !== usernameToDelete);
    
    localStorage.setItem("local_user_accounts", JSON.stringify(filtered));
    setUserDatabase(filtered);
    alert(`User "${usernameToDelete}" has been deleted.`);

    const gasUrl = getActiveGASUrl();
    if (gasUrl) {
      deleteUserFromGAS(gasUrl, usernameToDelete).catch(err => {
        console.warn("GAS delete user failed", err);
      });
    }
  };

  const handleChangeOwnPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword.trim()) {
      setChangePassStatus("Please enter both current and new password.");
      return;
    }
    
    const cached = localStorage.getItem("local_user_accounts");
    if (!cached || !currentUser) return;
    const accountsList = JSON.parse(cached);
    const matched = accountsList.find((u: any) => u.username === currentUser.username);
    
    if (matched) {
      if (matched.pass === oldPassword.trim()) {
        matched.pass = newPassword.trim();
        localStorage.setItem("local_user_accounts", JSON.stringify(accountsList));
        setUserDatabase(accountsList);
        setOldPassword("");
        setNewPassword("");
        setChangePassStatus("Password successfully changed!");
        setTimeout(() => setChangePassStatus(""), 4000);

        const gasUrl = getActiveGASUrl();
        if (gasUrl) {
          saveUserToGAS(gasUrl, matched).catch(err => {
            console.warn("GAS update password failed", err);
          });
        }
      } else {
        setChangePassStatus("Incorrect current password.");
      }
    }
  };

  // Multi-Match State Switching Handler
  const handleSwitchMatch = (targetId: string) => {
    setState(prev => {
      // 1. Pack current active match properties
      const currentMatchState = {
        id: prev.activeMatchId || "match-1",
        name: prev.activeMatchId === "match-2" ? "Match 2 (LIV vs CHE)" : "Match 1 (MCI vs ARS)",
        matchInfo: prev.matchInfo,
        period: prev.period,
        matchMinute: prev.matchMinute,
        matchSecond: prev.matchSecond,
        stoppageMinutes: prev.stoppageMinutes,
        isClockRunning: prev.isClockRunning,
        timeline: prev.timeline,
        stats: prev.stats,
        graphics: prev.graphics,
        activeGraphicSettings: prev.activeGraphicSettings,
        matchResultStatus: prev.matchResultStatus,
        penaltyShootout: prev.penaltyShootout
      };

      const updatedMatches = {
        ...(prev.matches || {}),
        [currentMatchState.id]: currentMatchState
      };

      // 2. Resolve target match state (or seed defaults)
      const targetMatch = updatedMatches[targetId] || {
        id: targetId,
        name: targetId === "match-2" ? "Match 2 (LIV vs CHE)" : targetId.startsWith("match-1") ? "Match 1 (MCI vs ARS)" : `${targetId.toUpperCase()} (Live)`,
        matchInfo: targetId === "match-2" ? {
          tournamentName: prev.matchInfo.tournamentName,
          season: prev.matchInfo.season,
          matchNumber: 46,
          venue: "Anfield, Liverpool",
          date: "2026-06-16",
          time: "19:45",
          referee: "Michael Oliver",
          assistantReferee1: "Stuart Burt",
          assistantReferee2: "Simon Bennett",
          fourthOfficial: "John Brooks",
          sponsorName: "Antigravity Global",
          sponsorLogoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Globe_icon_2.svg",
          homeTeam: {
            id: "home",
            name: "Merseyside Red",
            shortName: "LIV",
            color: "#c8102e",
            secondaryColor: "#f6eb61",
            logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
            formation: "4-3-3",
            players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS_HOME))
          },
          awayTeam: {
            id: "away",
            name: "West London Blue",
            shortName: "CHE",
            color: "#034694",
            secondaryColor: "#ee242c",
            logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
            formation: "4-3-3",
            players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS_AWAY))
          }
        } : {
          ...prev.matchInfo,
          matchNumber: targetId.startsWith("match-") ? parseInt(targetId.replace("match-", "")) || 77 : 82
        },
        period: "PRE",
        matchMinute: 0,
        matchSecond: 0,
        stoppageMinutes: 0,
        isClockRunning: false,
        timeline: [],
        stats: {
          possessionHome: 50,
          xgHome: 0.0, xgAway: 0.0,
          shotsHome: 0, shotsAway: 0,
          shotsOnTargetHome: 0, shotsOnTargetAway: 0,
          cornersHome: 0, cornersAway: 0,
          foulsHome: 0, foulsAway: 0,
          offsidesHome: 0, offsidesAway: 0,
          yellowCardsHome: 0, yellowCardsAway: 0,
          redCardsHome: 0, redCardsAway: 0,
          savesHome: 0, savesAway: 0,
          passAccuracyHome: 80, passAccuracyAway: 80
        },
        graphics: {
          scoreBug: prev.graphics.scoreBug,
          matchIntro: false,
          startingXI: false,
          startingXIAway: false,
          formationGraphic: false,
          teamLineup: false,
          benchGraphic: false,
          goalGraphic: false,
          goalScorerGraphic: false,
          assistGraphic: false,
          yellowCardGraphic: false,
          redCardGraphic: false,
          substitutionGraphic: false,
          matchStatistics: false,
          possessionGraphic: false,
          shotComparison: false,
          cornerComparison: false,
          teamComparison: false,
          playerStatistics: false,
          manOfTheMatch: false,
          halfTimeGraphic: false,
          fullTimeGraphic: false,
          leagueTable: false,
          fixtures: false,
          upcomingMatch: false,
          tournamentBracket: false,
          sponsorGraphic: false,
          lowerThird: false,
          breakingNewsTicker: prev.graphics.breakingNewsTicker,
          varReviewGraphic: false,
          injuryTimeGraphic: false,
          resultGraphic: false
        },
        activeGraphicSettings: prev.activeGraphicSettings,
        matchResultStatus: null,
        penaltyShootout: { enabled: false, homeKicks: [], awayKicks: [], homeScore: 0, awayScore: 0, currentKickerIndex: 0, currentTeam: "home" }
      };

      return {
        ...prev,
        matches: updatedMatches,
        activeMatchId: targetId,
        // Swap currently running properties directly on root
        matchInfo: targetMatch.matchInfo,
        period: targetMatch.period,
        matchMinute: targetMatch.matchMinute,
        matchSecond: targetMatch.matchSecond,
        stoppageMinutes: targetMatch.stoppageMinutes,
        isClockRunning: targetMatch.isClockRunning,
        timeline: targetMatch.timeline,
        stats: targetMatch.stats,
        graphics: targetMatch.graphics,
        activeGraphicSettings: targetMatch.activeGraphicSettings,
        matchResultStatus: targetMatch.matchResultStatus,
        penaltyShootout: targetMatch.penaltyShootout
      };
    });
  };

  const [stoppageInputText, setStoppageInputText] = useState("");
  const [copiedObsLink, setCopiedObsLink] = useState(false);

  const handleCopyObsLink = () => {
    const overlayUser = normalizeBroadcastUser(currentUser?.username);
    const gasUrl = getActiveGASUrl();
    let url = `${window.location.origin}${window.location.pathname}?overlay=true&user=${encodeURIComponent(overlayUser)}`;
    if (gasUrl) {
      url += `&scriptUrl=${encodeURIComponent(gasUrl)}`;
    }
    navigator.clipboard.writeText(url).then(() => {
      setCopiedObsLink(true);
      setTimeout(() => setCopiedObsLink(false), 2000);
    });
  };

  const [showTransparent, setShowTransparent] = useState<boolean>(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState<boolean>(false);

  // Goal Selector Modal System
  const [goalScorerTeam, setGoalScorerTeam] = useState<"home" | "away" | null>(null);
  const [selectedGoalScorerId, setSelectedGoalScorerId] = useState<string>("");
  const [selectedGoalAssistId, setSelectedGoalAssistId] = useState<string>("");
  const [autoShowGoalCelebration, setAutoShowGoalCelebration] = useState<boolean>(true);
  
  // Custom editing elements
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerNumber, setNewPlayerNumber] = useState(12);
  const [newPlayerPos, setNewPlayerPos] = useState<Position>(Position.MID);
  const [newPlayerTeam, setNewPlayerTeam] = useState<"home" | "away">("home");
  const [subOutPlayerId, setSubOutPlayerId] = useState("");
  const [subInPlayerId, setSubInPlayerId] = useState("");

  // Card Selection System States
  const [yellowCardTeam, setYellowCardTeam] = useState<"home" | "away" | "">("");
  const [yellowCardPlayerId, setYellowCardPlayerId] = useState<string>("");
  const [redCardTeam, setRedCardTeam] = useState<"home" | "away" | "">("");
  const [redCardPlayerId, setRedCardPlayerId] = useState<string>("");
  const [redCardType, setRedCardType] = useState<"direct" | "second_yellow">("direct");

  // Input custom texts states
  const [tickerInputText, setTickerInputText] = useState(state.newsTickerText);
  const [customL3Title, setCustomL3Title] = useState("PEP GUARDIOLA");
  const [customL3Sub, setCustomL3Sub] = useState("Manchester Blue Manager");
  const [varText1, setVarText1] = useState("VAR REVIEW IN PROGRESS");
  const [varText2, setVarText2] = useState("CHECKING POTENTIAL PENALTY HANDBALL");

  // Timer reference
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================
  // LOCAL USER LOGIN & CREDENTIALS FLOW
  // ==========================================
  const loginUserAndLoadState = (loggedUser: { username: string; email: string; role: string }) => {
    // Partitioned State loading
    lastLoadedUserRef.current = loggedUser.username;
    const storageKey = getBroadcastStorageKey(loggedUser.username);
    const saved = localStorage.getItem(storageKey);
    let nextState = createDefaultState();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && parsed.matchInfo) {
          nextState = {
            ...nextState,
            ...parsed,
            venues: Array.isArray(parsed.venues) ? parsed.venues : nextState.venues,
            tournaments: Array.isArray(parsed.tournaments) ? parsed.tournaments : nextState.tournaments,
            tournamentTeams: Array.isArray(parsed.tournamentTeams) ? parsed.tournamentTeams : nextState.tournamentTeams,
            timeline: Array.isArray(parsed.timeline) ? parsed.timeline : nextState.timeline,
            graphics: {
              ...nextState.graphics,
              ...parsed.graphics
            },
            activeGraphicSettings: {
              ...nextState.activeGraphicSettings,
              ...parsed.activeGraphicSettings
            }
          };
        }
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }

    setState(nextState);
    setCurrentUser(loggedUser);
    sessionStorage.setItem("current_logged_in_user", JSON.stringify(loggedUser));
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError("Please enter both Username and Password.");
      return;
    }

    try {
      setLoginLoading(true);
      setLoginError("");

      const cached = localStorage.getItem("local_user_accounts");
      const accountsList = cached ? JSON.parse(cached) : [
        { username: "admin", email: "admin@tournament.com", pass: "admin123", role: "admin", start: "2026-01-01", exp: "2036-12-31", note: "Default Admin with full access", lastLogin: "" },
        { username: "operator", email: "operator@tournament.com", pass: "operator456", role: "operator", start: "2026-01-01", exp: "2036-12-31", note: "Standard Operator with full access", lastLogin: "" },
        { username: "operator_1", email: "operator1@tournament.com", pass: "p@ssword", role: "operator", start: "2026-01-01", exp: "2028-12-31", note: "Secondary Operator License", lastLogin: "" }
      ];

      const userKey = loginUsername.trim().toLowerCase();
      const matched = accountsList.find((u: any) => u.username === userKey);

      if (matched) {
        if (matched.pass === loginPassword.trim()) {
          // Check expiration date
          if (matched.exp) {
            const expDate = new Date(matched.exp);
            const now = new Date();
            if (expDate < now) {
              setLoginError("Your account license has expired. Contact system administrator.");
              return;
            }
          }

          // Update last login timestamp in local database
          const nowStr = new Date().toLocaleString("en-US") + " Local";
          matched.lastLogin = nowStr;
          localStorage.setItem("local_user_accounts", JSON.stringify(accountsList));
          setUserDatabase(accountsList);

          const loggedUser = { 
            username: matched.username, 
            email: matched.email || `${matched.username}@tournament.com`,
            role: matched.role || "operator"
          };
          loginUserAndLoadState(loggedUser);
        } else {
          setLoginError("Invalid Username or Password.");
        }
      } else {
        setLoginError("Invalid Username or Password.");
      }
    } catch (err: any) {
      console.error("Login failure:", err);
      setLoginError("An unexpected error occurred during login.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSystemLogout = async () => {
    lastLoadedUserRef.current = null;
    setState(createDefaultState());
    setCurrentUser(null);
    sessionStorage.removeItem("current_logged_in_user");
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Avoid shortcuts triggering if typing in inputs
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      
      const key = e.key.toLowerCase();
      // s: Start/pause clock
      if (key === "s") {
        toggleClock();
      }
      // g: goal home, a: goal away
      else if (key === "g") {
        triggerGoalQuick("home");
      }
      else if (key === "a") {
        triggerGoalQuick("away");
      }
      // b: toggle score bug
      else if (key === "b") {
        toggleGraphic("scoreBug");
      }
      // n: toggle news ticker
      else if (key === "n") {
        toggleGraphic("breakingNewsTicker");
      }
      // u: undo
      else if (key === "u") {
        undoLastEvent();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [state]);

  // Clock ticks
  useEffect(() => {
    if (state.isClockRunning) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          let sec = prev.matchSecond + 1;
          let min = prev.matchMinute;
          if (sec >= 60) {
            sec = 0;
            min += 1;
          }
          return {
            ...prev,
            matchMinute: min,
            matchSecond: sec
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isClockRunning]);

  // Recalculates stats from timeline logic
  const recomputeStatsAndStandings = (timeline: MatchEvent[], originalTeamsArray: TournamentTeam[]) => {
    const freshStats = {
      possessionHome: 52,
      xgHome: 0.15,
      xgAway: 0.12,
      shotsHome: 2,
      shotsAway: 1,
      shotsOnTargetHome: 1,
      shotsOnTargetAway: 0,
      cornersHome: 1,
      cornersAway: 1,
      foulsHome: 2,
      foulsAway: 3,
      offsidesHome: 1,
      offsidesAway: 0,
      yellowCardsHome: 0,
      yellowCardsAway: 1,
      redCardsHome: 0,
      redCardsAway: 0,
      savesHome: 0,
      savesAway: 1,
      passAccuracyHome: 88,
      passAccuracyAway: 84
    };

    // Calculate score goals count from events
    let homeG = 0;
    let awayG = 0;

    timeline.forEach(event => {
      switch (event.type) {
        case MatchEventType.GOAL:
        case MatchEventType.PENALTY_GOAL:
          if (event.teamId === "home") {
            homeG++;
            freshStats.shotsHome += 1;
            freshStats.shotsOnTargetHome += 1;
            freshStats.xgHome += event.xgValue || 0.12;
          } else if (event.teamId === "away") {
            awayG++;
            freshStats.shotsAway += 1;
            freshStats.shotsOnTargetAway += 1;
            freshStats.xgAway += event.xgValue || 0.12;
          }
          break;
        case MatchEventType.OWN_GOAL:
          // Own goal is registered as goal for opposing team
          if (event.teamId === "home") {
            awayG++;
          } else {
            homeG++;
          }
          break;
        case MatchEventType.SHOT_ON_TARGET:
          if (event.teamId === "home") {
            freshStats.shotsHome++;
            freshStats.shotsOnTargetHome++;
            freshStats.xgHome += 0.08;
          } else {
            freshStats.shotsAway++;
            freshStats.shotsOnTargetAway++;
            freshStats.xgAway += 0.08;
          }
          break;
        case MatchEventType.SHOT_OFF_TARGET:
          if (event.teamId === "home") {
            freshStats.shotsHome++;
            freshStats.xgHome += 0.04;
          } else {
            freshStats.shotsAway++;
            freshStats.xgAway += 0.04;
          }
          break;
        case MatchEventType.CORNER_KICK:
          if (event.teamId === "home") freshStats.cornersHome++;
          else freshStats.cornersAway++;
          break;
        case MatchEventType.FOUL:
          if (event.teamId === "home") freshStats.foulsHome++;
          else freshStats.foulsAway++;
          break;
        case MatchEventType.OFFSIDE:
          if (event.teamId === "home") freshStats.offsidesHome++;
          else freshStats.offsidesAway++;
          break;
        case MatchEventType.YELLOW_CARD:
          if (event.teamId === "home") freshStats.yellowCardsHome++;
          else freshStats.yellowCardsAway++;
          break;
        case MatchEventType.SECOND_YELLOW:
          if (event.teamId === "home") {
            freshStats.yellowCardsHome++;
            freshStats.redCardsHome++;
          } else {
            freshStats.yellowCardsAway++;
            freshStats.redCardsAway++;
          }
          break;
        case MatchEventType.RED_CARD:
          if (event.teamId === "home") freshStats.redCardsHome++;
          else freshStats.redCardsAway++;
          break;
        case MatchEventType.SAVE:
          if (event.teamId === "home") freshStats.savesHome++;
          else freshStats.savesAway++;
          break;
        default:
          break;
      }
    });

    // Update dynamically possession ratio if there is an offside or corner
    const factor = (freshStats.shotsOnTargetHome * 4) - (freshStats.shotsOnTargetAway * 4);
    freshStats.possessionHome = Math.min(85, Math.max(20, 50 + factor));

    // Standings re-calculation
    const updatedStandings = originalTeamsArray.map(team => {
      // Compute specific stats for Manchester Blue and London Red
      if (team.id === "home") {
        const pDiff = homeG - awayG;
        const won = homeG > awayG ? 1 : 0;
        const drawn = homeG === awayG ? 1 : 0;
        const lost = homeG < awayG ? 1 : 0;
        return {
          ...team,
          played: 12 + (state.period === "FT" ? 1 : 0),
          won: team.won + (state.period === "FT" ? won : 0),
          drawn: team.drawn + (state.period === "FT" ? drawn : 0),
          lost: team.lost + (state.period === "FT" ? lost : 0),
          goalsFor: team.goalsFor + homeG,
          goalsAgainst: team.goalsAgainst + awayG,
          points: team.points + (state.period === "FT" ? (won * 3 + drawn) : 0),
          fairPlayPoints: team.fairPlayPoints - (freshStats.yellowCardsHome * 1) - (freshStats.redCardsHome * 3)
        };
      }
      if (team.id === "away") {
        const pDiff = awayG - homeG;
        const won = awayG > homeG ? 1 : 0;
        const drawn = awayG === homeG ? 1 : 0;
        const lost = awayG < homeG ? 1 : 0;
        return {
          ...team,
          played: 12 + (state.period === "FT" ? 1 : 0),
          won: team.won + (state.period === "FT" ? won : 0),
          drawn: team.drawn + (state.period === "FT" ? drawn : 0),
          lost: team.lost + (state.period === "FT" ? lost : 0),
          goalsFor: team.goalsFor + awayG,
          goalsAgainst: team.goalsAgainst + homeG,
          points: team.points + (state.period === "FT" ? (won * 3 + drawn) : 0),
          fairPlayPoints: team.fairPlayPoints - (freshStats.yellowCardsAway * 1) - (freshStats.redCardsAway * 3)
        };
      }
      return team;
    });

    return { freshStats, updatedStandings };
  };

  // Clock Handlers
  const toggleClock = () => {
    setState(prev => ({ ...prev, isClockRunning: !prev.isClockRunning }));
  };

  const adjustClock = (type: "min" | "sec" | "stoppage", delta: number) => {
    setState(prev => {
      if (type === "min") {
        return { ...prev, matchMinute: Math.max(0, prev.matchMinute + delta) };
      } else if (type === "sec") {
        const val = prev.matchSecond + delta;
        const computedSec = val < 0 ? 59 : val >= 60 ? 0 : val;
        return { ...prev, matchSecond: computedSec };
      } else {
        return { ...prev, stoppageMinutes: Math.max(0, prev.stoppageMinutes + delta) };
      }
    });
  };

  const setPeriod = (p: AppState["period"]) => {
    setState(prev => {
      let min = prev.matchMinute;
      if (p === "1H") {
        min = 0;
      } else if (p === "HT") {
        min = 45;
      } else if (p === "2H") {
        min = 45;
      } else if (p === "FT") {
        min = 90;
      } else if (p === "ET1") {
        min = 90;
      } else if (p === "ET_HT") {
        min = 105;
      } else if (p === "ET2") {
        min = 105;
      } else if (p === "ET_FT") {
        min = 120;
      } else if (p === "PEN") {
        min = 120;
      }
      return {
        ...prev,
        period: p,
        matchMinute: min,
        matchSecond: 0,
        isClockRunning: false
      };
    });
  };

  const handleRecordPenaltyKick = (outcome: "scored" | "missed") => {
    setState(prev => {
      const ps = prev.penaltyShootout || {
        enabled: true,
        homeKicks: Array(5).fill("none"),
        awayKicks: Array(5).fill("none"),
        homeScore: 0,
        awayScore: 0,
        currentKickerIndex: 0,
        currentTeam: "home"
      };

      const isHome = ps.currentTeam === "home";
      const kicks = isHome ? [...ps.homeKicks] : [...ps.awayKicks];
      
      const index = ps.currentKickerIndex;
      if (index >= kicks.length) {
        kicks.push(outcome);
      } else {
        kicks[index] = outcome;
      }

      const homeKicksNew = isHome ? kicks : [...ps.homeKicks];
      const awayKicksNew = isHome ? [...ps.awayKicks] : kicks;
      
      const homeScoreNew = homeKicksNew.filter(k => k === "scored").length;
      const awayScoreNew = awayKicksNew.filter(k => k === "scored").length;

      let nextTeam: "home" | "away" = isHome ? "away" : "home";
      let nextIndex = index;
      if (!isHome) {
        nextIndex = index + 1;
      }

      if (nextIndex >= homeKicksNew.length && homeKicksNew.length === awayKicksNew.length && homeScoreNew === awayScoreNew) {
        homeKicksNew.push("none");
        awayKicksNew.push("none");
      }

      return {
        ...prev,
        penaltyShootout: {
          enabled: true,
          homeKicks: homeKicksNew,
          awayKicks: awayKicksNew,
          homeScore: homeScoreNew,
          awayScore: awayScoreNew,
          currentKickerIndex: nextIndex,
          currentTeam: nextTeam
        }
      };
    });
  };

  const handleResetPenalties = () => {
    setState(prev => ({
      ...prev,
      penaltyShootout: {
        enabled: true,
        homeKicks: Array(5).fill("none"),
        awayKicks: Array(5).fill("none"),
        homeScore: 0,
        awayScore: 0,
        currentKickerIndex: 0,
        currentTeam: "home"
      }
    }));
  };

  const handleAdjustPenaltyScore = (team: "home" | "away", delta: number) => {
    setState(prev => {
      if (!prev.penaltyShootout) return prev;
      const scoreKey = team === "home" ? "homeScore" : "awayScore";
      return {
        ...prev,
        penaltyShootout: {
          ...prev.penaltyShootout,
          [scoreKey]: Math.max(0, prev.penaltyShootout[scoreKey] + delta)
        }
      };
    });
  };

  const handleTogglePenaltyGraphic = () => {
    setState(prev => {
      const current = prev.penaltyShootout?.enabled || false;
      return {
        ...prev,
        penaltyShootout: {
          ...(prev.penaltyShootout || {
            homeKicks: Array(5).fill("none"),
            awayKicks: Array(5).fill("none"),
            homeScore: 0,
            awayScore: 0,
            currentKickerIndex: 0,
            currentTeam: "home"
          }),
          enabled: !current
        }
      };
    });
  };

  const [exportingZip, setExportingZip] = useState(false);

  const handleExportOfflinePackage = async () => {
    setExportingZip(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // We'll capture current index.html content and build a portable bundle.
      const response = await fetch("/");
      let htmlText = "";
      if (response.ok) {
        htmlText = await response.text();
      } else {
        htmlText = document.documentElement.outerHTML;
      }

      // Add files to the ZIP
      zip.file("index.html", htmlText);
      zip.file("README_OFFLINE.txt", 
`==================================================
FOOTBALL LIVE GRAPHICS CONTROL SYSTEM (OFFLINE PORTABLE)
==================================================

How to host and run this system offline (locally or in a bus):

OPTION 1: Running directly from the Local Filesystem
1. Extract all files from this ZIP to a local directory on your machine.
2. Open "index.html" in your standard web browser (Chrome, Edge, Firefox, Safari).
3. This is your Broadcast Control Room!
4. To add the overlay feed inside OBS Studio:
   - Add a new "Browser" Source inside OBS.
   - Check the box "Local file".
   - Browse and select your extracted "index.html" file.
   - Append "?overlay=true" to the URL path or in settings, or type:
     file:///C:/path/to/extracted/index.html?overlay=true
   - Set width to 1920 and height to 1080.
5. Any events triggered in your browser tab will instantly sync to the OBS Browser source, 100% offline!

OPTION 2: Running via a Local Web Server (Recommended)
1. If you have NodeJS, Python, or another lightweight server installed on the system:
   - For NodeJS: Run 'npx http-server -p 3000' in the folder.
   - For Python: Run 'python -m http.server 3000' in the folder.
2. Open http://localhost:3000 in your browser, and put http://localhost:3000?overlay=true in OBS.
3. This works perfectly without any internet access!

Enjoy your production graphics! - System Team`);

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `Football_Graphics_Offline_Bundle_${state.matchInfo.homeTeam.shortName}_vs_${state.matchInfo.awayTeam.shortName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error creating offline zip package:", e);
      alert("Failed to export offline bundle: " + e);
    } finally {
      setExportingZip(false);
    }
  };

  // Add Event logs
  const handleRecordEvent = (
    type: MatchEventType, 
    teamId?: "home" | "away", 
    primaryPlayerId?: string, 
    secondaryPlayerId?: string,
    customText?: string
  ) => {
    const newEvt: MatchEvent = {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        matchMinute: state.matchMinute,
        matchSecond: state.matchSecond,
        period: state.period,
        type,
        teamId,
        primaryPlayerId,
        secondaryPlayerId,
        customDetail: customText,
        xgValue: type === MatchEventType.PENALTY_GOAL ? 0.76 : type === MatchEventType.GOAL ? 0.12 : undefined
    };

    setState(prev => {
      const newTimeline = [...prev.timeline, newEvt];
      const { freshStats, updatedStandings } = recomputeStatsAndStandings(newTimeline, prev.tournamentTeams);
      
      // Auto triggers associated graphics to feel smart!
      const finalGraphics = { ...prev.graphics };
      const finalSettings = { ...prev.activeGraphicSettings };

      const primaryPlayer = primaryPlayerId ? prev.matchInfo.homeTeam.players.concat(prev.matchInfo.awayTeam.players).find(p => p.id === primaryPlayerId) : null;
      const secondaryPlayer = secondaryPlayerId ? prev.matchInfo.homeTeam.players.concat(prev.matchInfo.awayTeam.players).find(p => p.id === secondaryPlayerId) : null;

      if (type === MatchEventType.GOAL || type === MatchEventType.PENALTY_GOAL) {
        finalGraphics.goalGraphic = true;
        finalSettings.goalGraphic = {
          targetTeamId: teamId,
          customText1: "G O A L !",
          customText2: `${primaryPlayer ? primaryPlayer.name : "Goalscorer"} (${state.matchMinute}')`
        };
        // Auto display goalscorer lower third
        finalGraphics.goalScorerGraphic = true;
        finalSettings.goalScorerGraphic = {
          targetTeamId: teamId,
          customText1: primaryPlayer ? primaryPlayer.name : "Unregistered"
        };
        if (secondaryPlayer) {
          finalGraphics.assistGraphic = true;
          finalSettings.assistGraphic = {
            customText1: secondaryPlayer.name
          };
        }
      } else if (type === MatchEventType.YELLOW_CARD) {
        finalGraphics.yellowCardGraphic = true;
        finalSettings.yellowCardGraphic = {
          targetTeamId: teamId,
          customText1: primaryPlayer ? primaryPlayer.name : "Unregistered Player",
          customText2: customText || "Foul / Tactical challenge",
          targetPlayerId: primaryPlayerId
        };
      } else if (type === MatchEventType.RED_CARD || type === MatchEventType.SECOND_YELLOW) {
        finalGraphics.redCardGraphic = true;
        finalSettings.redCardGraphic = {
          targetTeamId: teamId,
          customText1: primaryPlayer ? primaryPlayer.name : "Unregistered Player",
          customText2: type === MatchEventType.SECOND_YELLOW ? "Second Yellow Card (Red dismissal)" : (customText || "Serious Foul Conduct"),
          targetPlayerId: primaryPlayerId
        };
      } else if (type === MatchEventType.SUBSTITUTION) {
        finalGraphics.substitutionGraphic = true;
        finalSettings.substitutionGraphic = {
          targetTeamId: teamId,
          customText1: primaryPlayer ? primaryPlayer.name : "Player Out",
          customText2: secondaryPlayer ? secondaryPlayer.name : "Player In"
        };
      }

      return {
        ...prev,
        timeline: newTimeline,
        stats: freshStats,
        graphics: finalGraphics,
        activeGraphicSettings: finalSettings,
        tournamentTeams: updatedStandings
      };
    });
  };

  const triggerGoalQuick = (teamId: "home" | "away") => {
    if (state.playerMode === "B") {
      // In simple mode, do NOT select players or open modal! Immediately log goal.
      const currentTeam = teamId === "home" ? state.matchInfo.homeTeam : state.matchInfo.awayTeam;
      handleRecordEvent(MatchEventType.GOAL, teamId, undefined, undefined);
    } else {
      // In full tracking mode, trigger selector modal options state!
      setGoalScorerTeam(teamId);
      setSelectedGoalScorerId("");
      setSelectedGoalAssistId("");
      setAutoShowGoalCelebration(true); // Default to true, customizable
    }
  };

  const handleConfirmGoalSelection = () => {
    if (!goalScorerTeam) return;
    const teamId = goalScorerTeam;
    const scorerId = selectedGoalScorerId || undefined;
    const assistId = selectedGoalAssistId || undefined;

    // Reset selectors
    setGoalScorerTeam(null);
    setSelectedGoalScorerId("");
    setSelectedGoalAssistId("");

    // Record the goal
    handleRecordEvent(MatchEventType.GOAL, teamId, scorerId, assistId);

    // If celebration animation isn't desired, immediately clear graphic flags!
    if (!autoShowGoalCelebration) {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          graphics: {
            ...prev.graphics,
            goalGraphic: false,
            goalScorerGraphic: false,
            assistGraphic: false
          }
        }));
      }, 50);
    }
  };

  const undoLastEvent = () => {
    if (state.timeline.length === 0) return;
    setState(prev => {
      const newTimeline = prev.timeline.slice(0, -1);
      const { freshStats, updatedStandings } = recomputeStatsAndStandings(newTimeline, prev.tournamentTeams);
      return {
        ...prev,
        timeline: newTimeline,
        stats: freshStats,
        tournamentTeams: updatedStandings
      };
    });
  };

  // Substitution Engine
  const executeSubstitution = (teamId: "home" | "away") => {
    if (!subOutPlayerId || !subInPlayerId) return;

    setState(prev => {
      const updatedMatchInfo = { ...prev.matchInfo };
      const team = teamId === "home" ? updatedMatchInfo.homeTeam : updatedMatchInfo.awayTeam;
      
      const outP = team.players.find(p => p.id === subOutPlayerId);
      const inP = team.players.find(p => p.id === subInPlayerId);

      if (outP && inP) {
        outP.isStarting = false;
        outP.minutesPlayed = state.matchMinute;

        inP.isStarting = true;
        inP.minutesPlayed = 90 - state.matchMinute;
      }

      return {
        ...prev,
        matchInfo: updatedMatchInfo
      };
    });

    handleRecordEvent(
      MatchEventType.SUBSTITUTION, 
      teamId, 
      subOutPlayerId, 
      subInPlayerId
    );

    // Reset selection
    setSubOutPlayerId("");
    setSubInPlayerId("");
  };

  // Player adding
  const createNewPlayer = () => {
    if (!newPlayerName.trim()) return;

    const newId = `custom-${Math.random()}`;
    const newPlayer: Player = {
      id: newId,
      name: newPlayerName,
      number: newPlayerNumber,
      position: newPlayerPos,
      teamId: newPlayerTeam,
      isCaptain: false,
      isStarting: false,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      shots: 0,
      shotsOnTarget: 0,
      passes: 0,
      passesCompleted: 0,
      saves: 0,
      fouls: 0,
      offsides: 0,
      minutesPlayed: 0
    };

    setState(prev => {
      const updatedMatch = { ...prev.matchInfo };
      if (newPlayerTeam === "home") {
        updatedMatch.homeTeam.players.push(newPlayer);
      } else {
        updatedMatch.awayTeam.players.push(newPlayer);
      }
      return {
        ...prev,
        matchInfo: updatedMatch
      };
    });

    setNewPlayerName("");
  };

  // Toggle graphics showing state
  const toggleGraphic = (name: keyof ActiveGraphics) => {
    setState(prev => ({
      ...prev,
      graphics: {
        ...prev.graphics,
        [name]: !prev.graphics[name]
      }
    }));
  };

  const updateGraphicSettings = (name: keyof ActiveGraphics, settings: any) => {
    setState(prev => ({
      ...prev,
      activeGraphicSettings: {
        ...prev.activeGraphicSettings,
        [name]: {
          ...prev.activeGraphicSettings[name],
          ...settings
        }
      }
    }));
  };

  const handleUpdateStarter = (teamId: "home" | "away", slotIndex: number, newPlayerId: string) => {
    setState(prev => {
      const matchInfo = { ...prev.matchInfo };
      const team = teamId === "home" ? { ...matchInfo.homeTeam } : { ...matchInfo.awayTeam };
      
      const currentStarters = team.players.filter(p => p.isStarting);
      const newStarters = [...currentStarters];
      
      const existingIndex = newStarters.findIndex(p => p.id === newPlayerId);
      const oldPlayer = newStarters[slotIndex];
      
      const targetPlayer = team.players.find(p => p.id === newPlayerId);
      if (targetPlayer) {
        if (existingIndex > -1 && oldPlayer) {
          newStarters[existingIndex] = oldPlayer;
        }
        newStarters[slotIndex] = targetPlayer;
      }
      
      const starterIds = newStarters.map(p => p.id);
      team.players = team.players.map(p => ({
        ...p,
        isStarting: starterIds.includes(p.id)
      }));
      
      if (teamId === "home") {
        matchInfo.homeTeam = team;
      } else {
        matchInfo.awayTeam = team;
      }
      
      return { ...prev, matchInfo };
    });
  };

  // Sponsor/News/L3 inputs updates
  const applySettings = (type: "ticker" | "l3" | "var") => {
    setState(prev => {
      const final = { ...prev };
      if (type === "ticker") {
        final.newsTickerText = tickerInputText;
      } else if (type === "l3") {
        final.activeGraphicSettings.lowerThird = {
          customText1: customL3Title,
          customText2: customL3Sub
        };
      } else if (type === "var") {
        final.activeGraphicSettings.varReviewGraphic = {
          customText1: varText1,
          customText2: varText2
        };
      }
      return final;
    });
  };

  // ==========================================
  // TOURNAMENT CRUD ACTIONS (CREATE, EDIT, SEARCH/SELECT, DELETE, DUPLICATE)
  // ==========================================
  const handleCreateTournament = (tour: Omit<Tournament, "id">) => {
    const id = `t-${Date.now()}`;
    const newT: Tournament = { id, ...tour };
    setState(prev => ({
      ...prev,
      tournaments: [...prev.tournaments, newT],
      activeTournamentId: id,
      matchInfo: {
        ...prev.matchInfo,
        tournamentName: newT.name,
        season: newT.season,
        venue: newT.venue || prev.matchInfo.venue
      }
    }));
  };

  const handleUpdateTournament = (id: string, fields: Partial<Tournament>) => {
    setState(prev => {
      const updatedList = prev.tournaments.map(t => t.id === id ? { ...t, ...fields } : t);
      const active = updatedList.find(t => t.id === prev.activeTournamentId);
      return {
        ...prev,
        tournaments: updatedList,
        matchInfo: {
          ...prev.matchInfo,
          tournamentName: active?.name || prev.matchInfo.tournamentName,
          season: active?.season || prev.matchInfo.season,
          venue: active?.venue || prev.matchInfo.venue
        }
      };
    });
  };

  const handleDeleteTournament = (id: string) => {
    setState(prev => {
      const remaining = prev.tournaments.filter(t => t.id !== id);
      const nextActiveId = remaining[0]?.id || "default";
      const active = remaining.find(t => t.id === nextActiveId);
      return {
        ...prev,
        tournaments: remaining,
        activeTournamentId: nextActiveId,
        matchInfo: {
          ...prev.matchInfo,
          tournamentName: active?.name || "Tournament Name",
          season: active?.season || "2026"
        }
      };
    });
  };

  const handleSelectTournament = (id: string) => {
    setState(prev => {
      const active = prev.tournaments.find(t => t.id === id);
      if (!active) return prev;
      return {
        ...prev,
        activeTournamentId: id,
        matchInfo: {
          ...prev.matchInfo,
          tournamentName: active.name,
          season: active.season,
          venue: active.venue || prev.matchInfo.venue
        }
      };
    });
  };

  const handleDuplicateTournament = (id: string) => {
    const orig = state.tournaments.find(t => t.id === id);
    if (!orig) return;
    const newId = `t-${Date.now()}`;
    const duplicated: Tournament = {
      ...orig,
      id: newId,
      name: `${orig.name} (Copy)`
    };
    setState(prev => ({
      ...prev,
      tournaments: [...prev.tournaments, duplicated],
      activeTournamentId: newId,
      matchInfo: {
        ...prev.matchInfo,
        tournamentName: duplicated.name,
        season: duplicated.season,
        venue: duplicated.venue || prev.matchInfo.venue
      }
    }));
  };

  // ==========================================
  // TEAM CRUD ACTIONS (CREATE, EDIT, DELETE)
  // ==========================================
  const handleCreateTeam = (team: Omit<TournamentTeam, "played" | "won" | "drawn" | "lost" | "goalsFor" | "goalsAgainst" | "points" | "fairPlayPoints">) => {
    const newT: TournamentTeam = {
      ...team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      fairPlayPoints: 100
    };
    setState(prev => ({
      ...prev,
      tournamentTeams: [...prev.tournamentTeams, newT]
    }));
  };

  const handleUpdateTeam = (id: string, fields: Partial<TournamentTeam>) => {
    setState(prev => {
      const newList = prev.tournamentTeams.map(t => t.id === id ? { ...t, ...fields } : t);
      const updatedMatchInfo = { ...prev.matchInfo };
      if (updatedMatchInfo.homeTeam.id === id) {
        updatedMatchInfo.homeTeam = { ...updatedMatchInfo.homeTeam, ...fields };
      }
      if (updatedMatchInfo.awayTeam.id === id) {
        updatedMatchInfo.awayTeam = { ...updatedMatchInfo.awayTeam, ...fields };
      }
      return {
        ...prev,
        tournamentTeams: newList,
        matchInfo: updatedMatchInfo
      };
    });
  };

  const handleDeleteTeam = (id: string) => {
    setState(prev => ({
      ...prev,
      tournamentTeams: prev.tournamentTeams.filter(t => t.id !== id)
    }));
  };

  // ==========================================
  // VENUE CRUD ACTIONS (CREATE, EDIT, DELETE)
  // ==========================================
  const handleCreateVenue = (name: string) => {
    if (!name.trim()) return;
    const id = `v-${Date.now()}`;
    const newV: Venue = { id, name: name.trim() };
    setState(prev => ({
      ...prev,
      venues: [...prev.venues, newV]
    }));
  };

  const handleUpdateVenue = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setState(prev => ({
      ...prev,
      venues: prev.venues.map(v => v.id === id ? { ...v, name: newName.trim() } : v)
    }));
  };

  const handleDeleteVenue = (id: string) => {
    setState(prev => ({
      ...prev,
      venues: prev.venues.filter(v => v.id !== id)
    }));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#07090f] text-neutral-200 font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#10131e] border-2 border-amber-500/25 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -ml-36 -mt-36 w-72 h-72 bg-amber-500/5 blur-3xl rounded-full" />

          {/* Icon and Title */}
          <div className="text-center select-none z-10 border-b border-neutral-850 pb-4">
            <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center font-black text-neutral-950 italic text-2xl mx-auto shadow-md mb-3">
              GP
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Football Live Production
            </h2>
            <p className="text-[10px] text-amber-500 tracking-widest font-black uppercase mt-1">
              CHAMPIONSHIP STUDIO LOGIN
            </p>
          </div>

          <form onSubmit={handleCredentialsLogin} className="space-y-4 z-10 flex flex-col">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg text-xs leading-5 uppercase font-bold flex gap-2 items-center">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Application Credentials verification form */}
            <div className="bg-[#10131e] border border-neutral-800 rounded-xl p-4 space-y-3.5 z-10">
              <span className="text-[10px] text-amber-500 font-black tracking-wider uppercase flex items-center gap-1.5 leading-none">
                <Lock className="w-3.5 h-3.5" /> Sign In to Workspace Account
              </span>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-455 text-neutral-400 block mb-1">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="e.g. admin"
                      className="w-full bg-black/60 border border-neutral-800 rounded-lg py-2 pl-3 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-rose-500 block mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/60 border border-neutral-800 rounded-lg py-2 pl-3 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={loginLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 font-black py-2.5 rounded-lg text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 mt-4"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> VERIFYING MEMBERSHIP CELL...
                    </>
                  ) : (
                    <>
                      ACCESS SYSTEM MANAGER <ArrowRightLeft className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Info text */}
          <div className="bg-black/30 border border-neutral-850 p-3 rounded-lg text-[10.5px] text-neutral-400 leading-normal z-10 select-none uppercase font-bold text-center">
            Accounts and active expiration states are monitored directly inside the local software database.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-200 font-sans flex flex-col selection:bg-amber-500 selection:text-neutral-950">
      {/* 1. TOP BRAND MASTERHEADER BAR */}
      <header className="bg-[#10131e] border-b border-neutral-800 px-6 py-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-amber-500 rounded-lg flex items-center justify-center font-black text-neutral-950 italic">
            GP
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white flex items-center gap-1.5 uppercase">
              Championship Live <span className="bg-amber-400 text-neutral-950 text-[9px] font-black tracking-widest px-2 py-0.5 rounded">STUDIO PRO v1.0</span>
            </h1>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest leading-none mt-0.5">Football Broadcast Control Station</p>
          </div>
        </div>

        {/* Live Clock HUD */}
        <div className="flex items-center gap-4 bg-black/40 border border-neutral-850 px-5 py-2 rounded-lg font-bold shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400">STATE:</span>
            <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-black ${
              state.period === "PRE" ? "bg-neutral-800 text-neutral-300" :
              state.period === "HT" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {state.period === "PRE" ? "PRE-MATCH" : state.period === "1H" ? "1ST HALF" : state.period === "HT" ? "HALF TIME" : state.period === "2H" ? "2ND HALF" : "FULL TIME"}
            </span>
          </div>

          <div className="w-[1px] h-6 bg-neutral-800" />

          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="font-mono text-lg text-white font-semibold tracking-wider tabular-nums">
              {pad(state.matchMinute)}:{pad(state.matchSecond)}
            </span>
            {state.isClockRunning && (
              <span className="relative flex h-2.5 w-2.5 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-bounce"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div className="w-[1px] h-6 bg-neutral-800" />

          {/* Quick HUD Score */}
          <div className="flex items-center gap-3">
            <span className="text-white text-xs text-neutral-300">{state.matchInfo.homeTeam.shortName}</span>
            <span className="font-bold text-white bg-neutral-900 border border-neutral-800 px-3 py-1 rounded font-mono text-sm">
              {state.timeline.filter(e => (e.type === MatchEventType.GOAL || e.type === MatchEventType.PENALTY_GOAL) && e.teamId === "home").length + state.timeline.filter(e => e.type === MatchEventType.OWN_GOAL && e.teamId === "away").length}
              <span className="mx-1 text-neutral-450 text-neutral-500">:</span>
              {state.timeline.filter(e => (e.type === MatchEventType.GOAL || e.type === MatchEventType.PENALTY_GOAL) && e.teamId === "away").length + state.timeline.filter(e => e.type === MatchEventType.OWN_GOAL && e.teamId === "home").length}
            </span>
            <span className="text-white text-xs text-neutral-300">{state.matchInfo.awayTeam.shortName}</span>
          </div>
        </div>

        {/* Global actions: Keyboard help & detaches info */}
        <div className="flex items-center gap-2">
          <button 
            id="btn-shortcuts"
            onClick={() => setShowKeyboardHelp(prev => !prev)}
            className="px-3.5 py-1.5 rounded bg-neutral-800 border border-neutral-750 hover:bg-neutral-750 text-xs font-bold text-neutral-300 flex items-center gap-1.5 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Shortcuts
          </button>
          
          <button
            id="btn-transparent"
            onClick={() => setShowTransparent(prev => !prev)}
            className={`px-3.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
              showTransparent 
                ? "bg-amber-500 text-neutral-950 font-black" 
                : "bg-neutral-800 border border-neutral-750 hover:bg-neutral-750 text-neutral-300"
            }`}
          >
            {showTransparent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showTransparent ? "Chroma Trans" : "Faux Studio BG"}
          </button>

          {currentUser && (
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="font-black text-amber-500 text-[10px] tracking-wider uppercase">Active:</span>
              <span className="text-white font-black truncate max-w-[100px] uppercase">{currentUser.username}</span>
              <button
                id="btn-logout"
                onClick={handleSystemLogout}
                className="ml-1 text-red-500 hover:text-red-400 transition"
                title="Log Out Action"
              >
                <LogOut className="w-3.5 h-3.5 animate-pulse" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* LIVE SWITCHER HUD & OBS INTEGRATION PORTABILITY BAR */}
      <div className="bg-[#0b0c15] border-b border-neutral-850 px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 select-none">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] font-black text-amber-500 tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">LIVE SWITCHER HUD:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSwitchMatch("match-1")}
              className={`px-3 py-1 rounded text-xs font-black uppercase transition flex items-center gap-1 border ${
                state.activeMatchId === "match-1" || !state.activeMatchId
                  ? "bg-amber-500 text-neutral-950 border-amber-500 shadow-lg shadow-amber-500/10"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              MATCH 1: {state.matches?.["match-1"]?.matchInfo ? `${state.matches["match-1"].matchInfo.homeTeam.shortName} vs ${state.matches["match-1"].matchInfo.awayTeam.shortName}` : "MCI vs ARS"}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMatch("match-2")}
              className={`px-3 py-1 rounded text-xs font-black uppercase transition flex items-center gap-1 border ${
                state.activeMatchId === "match-2"
                  ? "bg-amber-500 text-neutral-950 border-amber-500 shadow-lg shadow-amber-500/10"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              MATCH 2: {state.matches?.["match-2"]?.matchInfo ? `${state.matches["match-2"].matchInfo.homeTeam.shortName} vs ${state.matches["match-2"].matchInfo.awayTeam.shortName}` : "LIV vs CHE"}
            </button>

            <button
              type="button"
              onClick={() => {
                const name = prompt("Enter Custom Match ID to spawn:", "custom-" + Math.floor(Math.random() * 100));
                if (name) {
                  handleSwitchMatch(name.toLowerCase());
                }
              }}
              className="px-2.5 py-1 rounded bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-[10px] font-black text-amber-500 uppercase transition"
            >
              + Create Match
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-400 flex-wrap">
          <span className="flex items-center gap-1 bg-neutral-900/40 px-2.5 py-1 rounded border border-neutral-800">
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            LOCAL: <span className="text-white font-black">http://localhost:3000?overlay=true&user={normalizeBroadcastUser(currentUser?.username)}</span>
          </span>
          <span className="flex items-center gap-1 bg-neutral-900/40 px-2.5 py-1 rounded border border-neutral-800">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            DB: <span className="text-white font-black">{broadcastDbStatus}</span>
          </span>
          <span className="flex items-center gap-1 bg-neutral-900/40 px-2.5 py-1 rounded border border-neutral-800">
            <Monitor className="w-3.5 h-3.5 text-amber-500" />
            IP: <span className="text-white font-black">192.168.1.50</span>
          </span>
          <button
            type="button"
            onClick={handleCopyObsLink}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded text-[10px] uppercase tracking-wider flex items-center gap-1 transition"
          >
            {copiedObsLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedObsLink ? "Copied" : "Copy OBS Link"}
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT GRAPHIC PRODUCTION SUITE WORKSPACE */}
      <main className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: CONTROL & SETTINGS CONTROLLERS  */}
        {/* ========================================== */}
        <section className="col-span-12 xl:col-span-7 flex flex-col gap-5 overflow-hidden">
          
          {/* Sub Navigation tabs */}
          <nav className="flex bg-[#111422] p-1.5 rounded-lg border border-neutral-800 select-none">
            <button 
              id="tab-control"
              onClick={() => setActiveTab("control")}
              className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 ${
                activeTab === "control" ? "bg-amber-500 text-neutral-950 font-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Live Events & Scoper
            </button>
            <button 
              id="tab-setup"
              onClick={() => setActiveTab("setup")}
              className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 ${
                activeTab === "setup" ? "bg-amber-500 text-neutral-950 font-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              Match Setup
            </button>
            <button 
              id="tab-squads"
              onClick={() => setActiveTab("squads")}
              className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 ${
                activeTab === "squads" ? "bg-amber-500 text-neutral-950 font-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Rosters & Subs
            </button>
            <button 
              id="tab-tournament"
              onClick={() => setActiveTab("tournament")}
              className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5 ${
                activeTab === "tournament" ? "bg-amber-500 text-neutral-950 font-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Tournament Mode
            </button>
            <button 
              id="btn-copy-obs"
              onClick={handleCopyObsLink}
              className={`px-4 py-2 text-center text-xs font-black rounded-md transition-all duration-300 flex items-center justify-center gap-1.5 ml-2 shadow-[0_0_12px_rgba(79,70,229,0.3)] ${
                copiedObsLink ? "bg-emerald-600 text-white font-extrabold" : "bg-indigo-600 hover:bg-indigo-505 text-white"
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedObsLink ? "OBS LINK COPIED!" : "OBS OVERLAY LINK"}
            </button>
          </nav>

          {/* TAB DETAILED CONTENTS */}
          <div className="flex-1 bg-[#10131e] border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
            
            {/* TAB 1: LIVE CONTROL & EVENTS TRIGGERS */}
            {activeTab === "control" && (
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto max-h-[820px]">
                
                {/* PENALTY SHOOTOUT CONTROL UNIT */}
                {state.period === "PEN" && (
                  <div id="panel-penalties" className="bg-indigo-950/20 rounded-xl p-5 border border-indigo-500/40 shadow-lg flex flex-col gap-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Penalty Shootout System</h3>
                          <p className="text-[10px] text-neutral-400 font-mono">Live Broadcast overlays and score controls</p>
                        </div>
                      </div>
                      
                      {/* Toggle Graphics Button */}
                      <button
                        onClick={handleTogglePenaltyGraphic}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                          state.penaltyShootout?.enabled
                            ? "bg-amber-500 text-neutral-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {state.penaltyShootout?.enabled ? "HIDE SHOOTOUT OVERLAY" : "SHOW SHOOTOUT OVERLAY"}
                      </button>
                    </div>

                    {/* Step Assistant Turn row */}
                    <div className="bg-black/40 rounded-lg p-4 border border-dashed border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="text-[9px] text-neutral-400 font-black tracking-widest uppercase block mb-1">Active Shooter Status</span>
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded bg-amber-400 animate-ping shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                          <p className="text-sm text-white font-extrabold capitalize">
                            {(state.penaltyShootout?.currentTeam === "home" ? state.matchInfo.homeTeam.name : state.matchInfo.awayTeam.name)} Turn
                            <span className="text-neutral-400 font-mono text-xs ml-1.5">(Kick {((state.penaltyShootout?.currentKickerIndex || 0) + 1)})</span>
                          </p>
                        </div>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleRecordPenaltyKick("scored")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-1"
                        >
                          ✓ SCORED PENALTY
                        </button>
                        <button
                          onClick={() => handleRecordPenaltyKick("missed")}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] flex items-center gap-1"
                        >
                          ✗ MISSED / SAVED
                        </button>
                      </div>
                    </div>

                    {/* Roster-grid scoreboard with manual overrides */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                      {/* Home Column */}
                      <div className="bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-850">
                        <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                          <span className="font-extrabold text-xs text-neutral-300 uppercase flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: state.matchInfo.homeTeam.color }} />
                            {state.matchInfo.homeTeam.shortName} Shootout
                          </span>
                          
                          {/* Score selector */}
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleAdjustPenaltyScore("home", -1)} className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded font-black">-</button>
                            <span className="text-sm font-mono font-black text-amber-500 px-1">{state.penaltyShootout?.homeScore || 0}</span>
                            <button onClick={() => handleAdjustPenaltyScore("home", 1)} className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded font-black">+</button>
                          </div>
                        </div>

                        {/* Home Kicks Status List */}
                        <div className="flex items-center gap-1.5 h-8">
                          {state.penaltyShootout?.homeKicks.map((kick, idx) => (
                            <span 
                              key={idx}
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                                kick === "scored" ? "bg-emerald-600 text-white" :
                                kick === "missed" ? "bg-red-600 text-white" :
                                "bg-neutral-800 text-neutral-500 border border-neutral-700/65"
                              }`}
                            >
                              {kick === "scored" ? "✓" : kick === "missed" ? "✗" : idx + 1}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Away Column */}
                      <div className="bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-850">
                        <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                          <span className="font-extrabold text-xs text-neutral-300 uppercase flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: state.matchInfo.awayTeam.color }} />
                            {state.matchInfo.awayTeam.shortName} Shootout
                          </span>

                          {/* Score selector */}
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleAdjustPenaltyScore("away", -1)} className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded font-black">-</button>
                            <span className="text-sm font-mono font-black text-amber-500 px-1">{state.penaltyShootout?.awayScore || 0}</span>
                            <button onClick={() => handleAdjustPenaltyScore("away", 1)} className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded font-black">+</button>
                          </div>
                        </div>

                        {/* Away Kicks Status List */}
                        <div className="flex items-center gap-1.5 h-8">
                          {state.penaltyShootout?.awayKicks.map((kick, idx) => (
                            <span 
                              key={idx}
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                                kick === "scored" ? "bg-emerald-600 text-white" :
                                kick === "missed" ? "bg-red-600 text-white" :
                                "bg-neutral-800 text-neutral-500 border border-neutral-700/65"
                              }`}
                            >
                              {kick === "scored" ? "✓" : kick === "missed" ? "✗" : idx + 1}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reset button bar */}
                    <div className="flex items-center justify-end border-t border-indigo-500/10 pt-3">
                      <button
                        onClick={handleResetPenalties}
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-rose-950/30 hover:text-rose-455 hover:border-rose-950 border border-neutral-800 text-neutral-400 text-[10px] font-black rounded-lg transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        RESET PENALTY FEED
                      </button>
                    </div>
                  </div>
                )}

                {/* GOAL CONFIGURATION & ASSIST SELECTION FORM */}
                {goalScorerTeam && (
                  <div id="panel-goal-selector" className="bg-emerald-950/20 rounded-xl p-5 border-2 border-emerald-500/40 shadow-lg flex flex-col gap-4 animate-fade-in text-white">
                    <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚽</span>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">
                            Record Goal: {goalScorerTeam === "home" ? state.matchInfo.homeTeam.name : state.matchInfo.awayTeam.name}
                          </h3>
                          <p className="text-[10px] text-neutral-400 font-mono">Select scorer, assister and celebration rules for live broadcast</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setGoalScorerTeam(null)}
                        className="text-neutral-400 hover:text-white font-black text-[10px] px-2.5 py-1 bg-neutral-850 rounded border border-neutral-700 hover:bg-neutral-800"
                      >
                        CANCEL
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Scorer Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Goal Scorer (Optional)</label>
                        <select
                          value={selectedGoalScorerId}
                          onChange={(e) => {
                            setSelectedGoalScorerId(e.target.value);
                            if (e.target.value === selectedGoalAssistId) {
                              setSelectedGoalAssistId(""); // Clear assist if they conflict
                            }
                          }}
                          className="w-full bg-[#1b1e2c] border border-neutral-800 rounded-lg text-xs p-2.5 text-white font-semibold outline-none focus:border-emerald-500"
                        >
                          <option value="">-- No Player / Leave Blank (None) --</option>
                          {(goalScorerTeam === "home" ? state.matchInfo.homeTeam.players : state.matchInfo.awayTeam.players).map(p => (
                            <option key={p.id} value={p.id}>
                              #{p.number} - {p.name} ({p.position})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Assist Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Goal Assist (Optional)</label>
                        <select
                          value={selectedGoalAssistId}
                          onChange={(e) => setSelectedGoalAssistId(e.target.value)}
                          className="w-full bg-[#1b1e2c] border border-neutral-800 rounded-lg text-xs p-2.5 text-white font-semibold outline-none focus:border-emerald-500"
                        >
                          <option value="">-- No Assist / Leave Blank (None) --</option>
                          {(goalScorerTeam === "home" ? state.matchInfo.homeTeam.players : state.matchInfo.awayTeam.players)
                            .filter(p => !selectedGoalScorerId || p.id !== selectedGoalScorerId) // Scorer cannot assist themselves!
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                #{p.number} - {p.name} ({p.position})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Celebration rules */}
                    <div className="bg-black/30 p-3 rounded-lg border border-neutral-850 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-white block uppercase mb-0.5">Auto Show Celebration Overlay</span>
                        <p className="text-[9px] text-neutral-400 font-sans">Trigger the animated Goal & Scorer banners instantly on overlay</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoShowGoalCelebration(!autoShowGoalCelebration)}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                          autoShowGoalCelebration ? "bg-emerald-500" : "bg-neutral-800"
                        }`}
                      >
                        <span className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${
                          autoShowGoalCelebration ? "translate-x-7" : "translate-x-1"
                        }`} />
                      </button>
                    </div>

                    {/* Confirm Button */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={handleConfirmGoalSelection}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] text-white text-xs font-black rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                        ⚽ CONFIRM GOAL EVENT & UPDATE SCOREBOARD
                      </button>
                    </div>
                  </div>
                )}

                {/* A. Live Clock Control row */}
                <div id="panel-clock-controls" className="bg-[#1b1e2c]/30 rounded-xl p-5 border border-neutral-850/60">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3.5">Clock Management</h3>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Primary toggles */}
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-toggle-clock"
                        onClick={toggleClock}
                        className={`px-5 py-2.5 rounded-lg text-xs font-black flex items-center gap-2 transition ${
                          state.isClockRunning 
                            ? "bg-amber-500 text-neutral-950 hover:bg-amber-600 shadow-md" 
                            : "bg-emerald-500 text-neutral-950 hover:bg-emerald-600 shadow-md"
                        }`}
                      >
                        {state.isClockRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {state.isClockRunning ? "PAUSE MATCH" : "RESUME MATCH"}
                      </button>

                      {state.period === "PRE" && (
                        <button
                          id="btn-start-match"
                          onClick={() => setPeriod("1H")}
                          className="px-5 py-2.5 rounded-lg text-xs font-black bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 transition"
                        >
                          START FIRST HALF
                        </button>
                      )}

                      {state.period === "1H" && (
                        <button
                          id="btn-halftime"
                          onClick={() => setPeriod("HT")}
                          className="px-5 py-2.5 rounded-lg text-xs font-black bg-yellow-500/10 text-yellow-300 border border-yellow-500/35 hover:bg-yellow-500/20 transition"
                        >
                          HALF TIME
                        </button>
                      )}

                      {state.period === "HT" && (
                        <button
                          id="btn-start-2h"
                          onClick={() => setPeriod("2H")}
                          className="px-5 py-2.5 rounded-lg text-xs font-black bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 transition"
                        >
                          START SECOND HALF
                        </button>
                      )}

                      {state.period === "2H" && (
                        <div className="flex items-center gap-2">
                          <button
                            id="btn-fulltime"
                            onClick={() => setPeriod("FT")}
                            className="px-5 py-2.5 rounded-lg text-xs font-black bg-rose-500/10 text-rose-300 border border-rose-500/35 hover:bg-rose-500/20 transition"
                          >
                            FULL TIME (FT)
                          </button>
                          <button
                            id="btn-start-et1"
                            onClick={() => setPeriod("ET1")}
                            className="px-5 py-2.5 rounded-lg text-xs font-black bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 hover:bg-indigo-500/25 transition"
                          >
                            START EXTRA TIME (ET1)
                          </button>
                        </div>
                      )}

                      {state.period === "FT" && (
                        <button
                          id="btn-tot-pen"
                          onClick={() => setPeriod("PEN")}
                          className="px-5 py-2.5 rounded-lg text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 transition"
                        >
                          MOVE TO PENALTIES (PEN)
                        </button>
                      )}

                      {state.period === "ET1" && (
                        <button
                          id="btn-et-ht"
                          onClick={() => setPeriod("ET_HT")}
                          className="px-5 py-2.5 rounded-lg text-xs font-black bg-yellow-500/15 text-yellow-300 border border-yellow-500/35 hover:bg-yellow-500/25 transition"
                        >
                          EXTRA HALF TIME
                        </button>
                      )}

                      {state.period === "ET_HT" && (
                        <button
                          id="btn-start-et2"
                          onClick={() => setPeriod("ET2")}
                          className="px-5 py-2.5 rounded-lg text-xs font-black bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 transition"
                        >
                          START ET 2ND HALF
                        </button>
                      )}

                      {state.period === "ET2" && (
                        <button
                          id="btn-et-ft"
                          onClick={() => setPeriod("ET_FT")}
                          className="px-5 py-2.5 rounded-lg text-xs font-black bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500/25 transition"
                        >
                          EXTRA FULL TIME
                        </button>
                      )}

                      {state.period === "ET_FT" && (
                        <button
                          id="btn-et-pen"
                          onClick={() => setPeriod("PEN")}
                          className="px-5 py-2.5 rounded-lg text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 transition"
                        >
                          MOVE TO PENALTIES (PEN)
                        </button>
                      )}
                    </div>

                    {/* Seconds & Minutes fine-tune */}
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">ST TIME STRETCH</span>
                        <div className="flex items-center bg-black/60 rounded border border-neutral-850 p-1">
                          <button onClick={() => adjustClock("stoppage", -1)} className="px-2 font-black border-r border-neutral-850 hover:bg-neutral-900">-</button>
                          <span className="px-3 text-xs font-mono font-bold text-amber-500">+{state.stoppageMinutes}m</span>
                          <button onClick={() => adjustClock("stoppage", 1)} className="px-2 font-black border-l border-neutral-850 hover:bg-neutral-900">+</button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">MINUTE INC</span>
                        <div className="flex items-center bg-black/60 rounded border border-neutral-850 p-1">
                          <button onClick={() => adjustClock("min", -1)} className="px-2 font-black border-r border-neutral-850 hover:bg-neutral-900">-</button>
                          <span className="px-3.5 text-xs font-mono font-bold text-white">{state.matchMinute}m</span>
                          <button onClick={() => adjustClock("min", 1)} className="px-2 font-black border-l border-neutral-850 hover:bg-neutral-900">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Control Panel (Simplified) */}
                <div id="panel-theme-control" className="bg-[#1b1e2c]/30 rounded-xl p-5 border border-neutral-850/60 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                    <span className="text-xs font-black text-amber-500 tracking-wider flex items-center gap-1.5 uppercase select-none">
                      <Layers className="w-4 h-4 text-amber-500" /> Theme Control Panel
                    </span>
                    <span className="text-[10px] bg-neutral-800/80 px-2.5 py-0.5 rounded font-bold uppercase text-neutral-400 select-none">
                      Styles Overlay
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Theme Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1.5 select-none">
                        Active Theme Style
                      </label>
                      <select
                        id="select-active-theme"
                        value={state.activeTheme || "slate_gray"}
                        onChange={(e) => setState(prev => ({ ...prev, activeTheme: e.target.value }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white"
                      >
                        <option value="slate_gray">Slate Steel Gray (Default)</option>
                        <option value="classic">Classic Sports Blue</option>
                        <option value="cosmic">Cosmic Shadow Dark</option>
                        <option value="emerald_neon">Emerald Neon Cyber</option>
                        <option value="luxury_gold">Luxury Gold Prime</option>
                      </select>
                    </div>

                    {/* Background Color Picker */}
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1.5 select-none">
                        Primary Background
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          title="Choose primary background color"
                          value={state.themePrimaryBgColor || "#2b2b2b"}
                          onChange={(e) => setState(prev => ({ ...prev, themePrimaryBgColor: e.target.value }))}
                          className="w-8 h-8 rounded border border-neutral-800 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={state.themePrimaryBgColor || ""}
                          onChange={(e) => setState(prev => ({ ...prev, themePrimaryBgColor: e.target.value }))}
                          placeholder="#2b2b2b"
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Secondary Background Color Picker */}
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1.5 select-none">
                        Secondary Gradient (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          title="Choose secondary background color"
                          value={state.themeSecondaryBgColor || "#1f1f1f"}
                          onChange={(e) => setState(prev => ({ ...prev, themeSecondaryBgColor: e.target.value }))}
                          className="w-8 h-8 rounded border border-neutral-800 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={state.themeSecondaryBgColor || ""}
                          onChange={(e) => setState(prev => ({ ...prev, themeSecondaryBgColor: e.target.value }))}
                          placeholder="No Gradient"
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono"
                        />
                        {state.themeSecondaryBgColor && (
                          <button
                            onClick={() => setState(prev => ({ ...prev, themeSecondaryBgColor: "" }))}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white px-2 py-1 rounded text-[10px] uppercase font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Text Color Selection Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1.5 select-none font-sans">
                        Text Color Accent
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          title="Choose text color"
                          value={state.themeTextColor || "#ffffff"}
                          onChange={(e) => setState(prev => ({ ...prev, themeTextColor: e.target.value }))}
                          className="w-8 h-8 rounded border border-neutral-800 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={state.themeTextColor || ""}
                          onChange={(e) => setState(prev => ({ ...prev, themeTextColor: e.target.value }))}
                          placeholder="#ffffff"
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 flex items-end">
                      <div className="bg-neutral-950/60 border border-neutral-900 p-2.5 rounded-lg w-full flex items-center justify-between text-[11px] text-neutral-400 select-none">
                        <span>Active Theme Type: <strong className="text-amber-500 uppercase font-bold">{state.activeTheme}</strong></span>
                        <button
                          onClick={() => setState(prev => ({
                            ...prev,
                            themePrimaryBgColor: "",
                            themeSecondaryBgColor: "",
                            themeTextColor: "",
                            activeTheme: "slate_gray"
                          }))}
                          className="text-amber-500 hover:text-amber-400 underline font-black uppercase tracking-wider text-[10px]"
                        >
                          Reset defaults
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. Live Event Action Grid */}
                <div id="panel-event-buttons" className="flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-neutral-850 pb-2">
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">Incident Event Buttons</h3>
                    <button 
                      id="btn-undo"
                      disabled={state.timeline.length === 0}
                      onClick={undoLastEvent}
                      className="px-2.5 py-1 text-[10px] bg-red-650 rounded text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" /> UNDO
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Goals */}
                    <button 
                      id="btn-evt-goal-h"
                      onClick={() => triggerGoalQuick("home")}
                      className="py-3 px-4 rounded-lg bg-[#6cabdd]/10 hover:bg-[#6cabdd]/20 text-neutral-100 border border-[#6cabdd]/35 text-xs font-black text-left flex justify-between items-center transition"
                    >
                      <span>⚽ GOAL HOME</span>
                      <span className="bg-neutral-900/60 px-1.5 py-1 text-[9px] rounded font-mono text-neutral-400">G</span>
                    </button>

                    <button 
                      id="btn-evt-goal-a"
                      onClick={() => triggerGoalQuick("away")}
                      className="py-3 px-4 rounded-lg bg-[#ef0107]/10 hover:bg-[#ef0107]/20 text-neutral-100 border border-[#ef0107]/35 text-xs font-black text-left flex justify-between items-center transition"
                    >
                      <span>⚽ GOAL AWAY</span>
                      <span className="bg-neutral-900/60 px-1.5 py-1 text-[9px] rounded font-mono text-neutral-400">A</span>
                    </button>

                    {/* Own Goals */}
                    <button 
                      id="btn-evt-og-h"
                      onClick={() => handleRecordEvent(MatchEventType.OWN_GOAL, "home")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-left flex justify-between items-center transition text-red-400"
                    >
                      <span>Own Goal Home</span>
                      <span className="text-[10px]">⚽</span>
                    </button>

                    <button 
                      id="btn-evt-og-a"
                      onClick={() => handleRecordEvent(MatchEventType.OWN_GOAL, "away")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-left flex justify-between items-center transition text-red-400"
                    >
                      <span>Own Goal Away</span>
                      <span className="text-[10px]">⚽</span>
                    </button>

                    {/* Other dynamic events */}
                    <button 
                      id="btn-evt-shot-ot-h"
                      onClick={() => handleRecordEvent(MatchEventType.SHOT_ON_TARGET, "home")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-medium text-left flex justify-between items-center transition"
                    >
                      <span>Home Shot On Target</span>
                      <span className="bg-[#111] px-1.5 font-bold rounded">S-OT</span>
                    </button>

                    <button 
                      id="btn-evt-shot-ot-a"
                      onClick={() => handleRecordEvent(MatchEventType.SHOT_ON_TARGET, "away")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-medium text-left flex justify-between items-center transition"
                    >
                      <span>Away Shot On Target</span>
                      <span className="bg-[#111] px-1.5 font-bold rounded">S-OT</span>
                    </button>

                    <button 
                      id="btn-evt-shot-off-h"
                      onClick={() => handleRecordEvent(MatchEventType.SHOT_OFF_TARGET, "home")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Home Shot Off Target
                    </button>

                    <button 
                      id="btn-evt-shot-off-a"
                      onClick={() => handleRecordEvent(MatchEventType.SHOT_OFF_TARGET, "away")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Away Shot Off Target
                    </button>

                    {/* Corner / Offside / Fouls */}
                    <button 
                      id="btn-evt-corner-h"
                      onClick={() => handleRecordEvent(MatchEventType.CORNER_KICK, "home")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Home Corner Won
                    </button>

                    <button 
                      id="btn-evt-corner-a"
                      onClick={() => handleRecordEvent(MatchEventType.CORNER_KICK, "away")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Away Corner Won
                    </button>

                    <button 
                      id="btn-evt-foul-h"
                      onClick={() => handleRecordEvent(MatchEventType.FOUL, "home")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Home Foul Registered
                    </button>

                    <button 
                      id="btn-evt-foul-a"
                      onClick={() => handleRecordEvent(MatchEventType.FOUL, "away")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Away Foul Registered
                    </button>

                    <button 
                      id="btn-evt-offside-h"
                      onClick={() => handleRecordEvent(MatchEventType.OFFSIDE, "home")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Home Offside Call
                    </button>

                    <button 
                      id="btn-evt-offside-a"
                      onClick={() => handleRecordEvent(MatchEventType.OFFSIDE, "away")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Away Offside Call
                    </button>

                    {/* Saves */}
                    <button 
                      id="btn-evt-save-h"
                      onClick={() => handleRecordEvent(MatchEventType.SAVE, "home")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Home Goalkeeper Save
                    </button>

                    <button 
                      id="btn-evt-save-a"
                      onClick={() => handleRecordEvent(MatchEventType.SAVE, "away")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-normal text-left transition"
                    >
                      Away Goalkeeper Save
                    </button>

                    {/* Dedicated traceable card selection system is rendered below */}

                    {/* Auxiliary Match metrics details */}
                    <button 
                      id="btn-evt-injury"
                      onClick={() => handleRecordEvent(MatchEventType.INJURY, undefined, undefined, undefined, "Physio Crew Attending Player")}
                      className="py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-350 font-normal text-left transition"
                    >
                      Physio Attendance
                    </button>

                    <button 
                      id="btn-evt-var"
                      onClick={() => handleRecordEvent(MatchEventType.VAR_REVIEW, undefined, undefined, undefined, "Penalties Review")}
                      className="py-3 px-4 rounded-lg bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-xs text-rose-350 font-semibold text-left transition"
                    >
                      Trigger VAR Incident Review
                    </button>
                  </div>

                  {/* CARDS SELECTION SYSTEM (REQUIRED FIX) */}
                  <div id="disciplinary-cards-hud" className="bg-[#1b1c25]/50 border border-amber-500/10 p-5 rounded-xl space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#eeeeee]">Disciplinary Booking System</h4>
                      </div>
                      <span className="text-[9px] bg-neutral-800 text-neutral-400 font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                        Source Tracked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* YELLOW CARD CONFIG HUD */}
                      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex items-center gap-1.5 border-b border-neutral-800/60 pb-1.5 justify-between">
                          <span className="text-[10px] font-black text-amber-400 block tracking-widest uppercase">
                            ⚠️ Yellow Card Hub
                          </span>
                          <span className="w-3 h-4.5 bg-amber-400 rounded-sm shadow-md" />
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">1. Choose Team First</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setYellowCardTeam("home");
                                  setYellowCardPlayerId("");
                                }}
                                className={`py-1.5 px-3 text-[11px] font-black rounded border transition uppercase ${
                                  yellowCardTeam === "home"
                                    ? "bg-amber-500/20 text-amber-400 border-amber-500"
                                    : "bg-neutral-950/80 text-neutral-450 border-neutral-850 hover:bg-neutral-900"
                                }`}
                              >
                                {state.matchInfo.homeTeam.shortName} (H)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setYellowCardTeam("away");
                                  setYellowCardPlayerId("");
                                }}
                                className={`py-1.5 px-3 text-[11px] font-black rounded border transition uppercase ${
                                  yellowCardTeam === "away"
                                    ? "bg-amber-500/20 text-amber-400 border-amber-500"
                                    : "bg-neutral-950/80 text-neutral-450 border-neutral-850 hover:bg-neutral-900"
                                }`}
                              >
                                {state.matchInfo.awayTeam.shortName} (A)
                              </button>
                            </div>
                          </div>

                          {state.playerMode === "A" ? (
                            <div>
                              <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">2. Assign Carded Player</label>
                              <select
                                value={yellowCardPlayerId}
                                onChange={(e) => setYellowCardPlayerId(e.target.value)}
                                disabled={!yellowCardTeam}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <option value="">-- Choose Player --</option>
                                {yellowCardTeam &&
                                  (yellowCardTeam === "home"
                                    ? state.matchInfo.homeTeam.players
                                    : state.matchInfo.awayTeam.players
                                  ).map((p) => (
                                    <option key={p.id} value={p.id}>
                                      #{p.number} - {p.name} ({p.position})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          ) : (
                            <div className="text-[10px] text-neutral-400 bg-neutral-950/60 p-2.5 rounded border border-neutral-850/60 text-xs italic">
                              Simple Mode active: Player select skipped.
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (!yellowCardTeam) return;
                              if (state.playerMode === "B") {
                                handleRecordEvent(MatchEventType.YELLOW_CARD, yellowCardTeam, undefined);
                              } else {
                                if (!yellowCardPlayerId) return;
                                handleRecordEvent(MatchEventType.YELLOW_CARD, yellowCardTeam, yellowCardPlayerId);
                              }
                              // clear inputs
                              setYellowCardTeam("");
                              setYellowCardPlayerId("");
                            }}
                            disabled={!yellowCardTeam || (state.playerMode === "A" && !yellowCardPlayerId)}
                            className="w-full bg-amber-500 font-extrabold text-[#111] hover:bg-amber-400 transition disabled:opacity-30 disabled:cursor-not-allowed py-2 rounded text-xs uppercase"
                          >
                            Confirm Yellow Card
                          </button>
                        </div>
                      </div>

                      {/* RED CARD CONFIG HUD */}
                      <div className="bg-neutral-900/50 border border-[#b91c1c]/10 p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex items-center gap-1.5 border-b border-neutral-800/60 pb-1.5 justify-between">
                          <span className="text-[10px] font-black text-rose-500 block tracking-widest uppercase">
                            🚨 Red Card Hub
                          </span>
                          <span className="w-3 h-4.5 bg-red-600 rounded-sm shadow-md" />
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">1. Choose Team First</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setRedCardTeam("home");
                                  setRedCardPlayerId("");
                                }}
                                className={`py-1.5 px-3 text-[11px] font-black rounded border transition uppercase ${
                                  redCardTeam === "home"
                                    ? "bg-red-500/20 text-red-400 border-red-500"
                                    : "bg-neutral-950/80 text-neutral-450 border-neutral-850 hover:bg-neutral-900"
                                }`}
                              >
                                {state.matchInfo.homeTeam.shortName} (H)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRedCardTeam("away");
                                  setRedCardPlayerId("");
                                }}
                                className={`py-1.5 px-3 text-[11px] font-black rounded border transition uppercase ${
                                  redCardTeam === "away"
                                    ? "bg-red-500/20 text-red-400 border-red-500"
                                    : "bg-neutral-950/80 text-neutral-450 border-neutral-850 hover:bg-neutral-900"
                                }`}
                              >
                                {state.matchInfo.awayTeam.shortName} (A)
                              </button>
                            </div>
                          </div>

                          {state.playerMode === "A" ? (
                            <div>
                              <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">2. Assign Carded Player</label>
                              <select
                                value={redCardPlayerId}
                                onChange={(e) => setRedCardPlayerId(e.target.value)}
                                disabled={!redCardTeam}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <option value="">-- Choose Player --</option>
                                {redCardTeam &&
                                  (redCardTeam === "home"
                                    ? state.matchInfo.homeTeam.players
                                    : state.matchInfo.awayTeam.players
                                  ).map((p) => (
                                    <option key={p.id} value={p.id}>
                                      #{p.number} - {p.name} ({p.position})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          ) : (
                            <div className="text-[10px] text-neutral-400 bg-neutral-950/60 p-2.5 rounded border border-neutral-850/60 text-xs italic">
                              Simple Mode active: Player select skipped.
                            </div>
                          )}

                          <div>
                            <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">3. Dismissal Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setRedCardType("direct")}
                                className={`py-1 px-2 text-[10px] font-black rounded border transition uppercase ${
                                  redCardType === "direct"
                                    ? "bg-red-600 text-white border-red-500"
                                    : "bg-neutral-950/85 text-neutral-400 border-neutral-850 hover:text-white"
                                }`}
                              >
                                Direct Red
                              </button>
                              <button
                                type="button"
                                onClick={() => setRedCardType("second_yellow")}
                                className={`py-1 px-2 text-[10px] font-black rounded border transition uppercase ${
                                  redCardType === "second_yellow"
                                    ? "bg-amber-500 text-[#111] border-amber-500"
                                    : "bg-neutral-950/85 text-neutral-400 border-neutral-850 hover:text-white"
                                }`}
                              >
                                2nd Yellow
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!redCardTeam) return;
                              const pId = state.playerMode === "A" ? redCardPlayerId : undefined;
                              if (state.playerMode === "A" && !redCardPlayerId) return;

                              if (redCardType === "direct") {
                                handleRecordEvent(MatchEventType.RED_CARD, redCardTeam, pId, undefined, "Direct Sending Off");
                              } else {
                                handleRecordEvent(MatchEventType.SECOND_YELLOW, redCardTeam, pId, undefined, "Second Yellow Booking");
                              }
                              // clear inputs
                              setRedCardTeam("");
                              setRedCardPlayerId("");
                            }}
                            disabled={!redCardTeam || (state.playerMode === "A" && !redCardPlayerId)}
                            className="w-full bg-red-650 font-extrabold text-white hover:bg-neutral-800 transition disabled:opacity-30 disabled:cursor-not-allowed py-2 rounded text-xs uppercase"
                          >
                            Confirm Red Card
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. Historical Match Events List */}
                <div id="panel-matchhistory" className="flex-1 min-h-[160px] bg-black/60 p-4 border border-neutral-850 rounded-lg flex flex-col gap-3">
                  <div className="flex font-bold justify-between text-xs border-b border-neutral-850 pb-2">
                    <span className="text-neutral-400 uppercase tracking-wider flex items-center gap-1"><History className="w-3.5 h-3.5 text-amber-500" /> Match Timeline Event Logs</span>
                    <span>{state.timeline.length} Registered Events</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] text-xs pr-1">
                    {state.timeline.length === 0 ? (
                      <p className="text-neutral-500 text-center py-6">No match incidents registered yet. Trigger score goals or cards to populate timeline.</p>
                    ) : (
                      state.timeline.map((evt, idx) => (
                        <div key={evt.id} className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-md flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="bg-amber-500 text-neutral-950 font-bold px-1.5 py-0.5 rounded font-mono text-[10px]">
                              {evt.matchMinute}&apos; min
                            </span>
                            <span className="font-extrabold text-[#eee] uppercase tracking-tight">{evt.type.replace("_", " ")}</span>
                            {evt.teamId && (
                              <span className="text-[10px] uppercase font-bold" style={{ color: evt.teamId === "home" ? state.matchInfo.homeTeam.color : state.matchInfo.awayTeam.color }}>
                                ({evt.teamId === "home" ? state.matchInfo.homeTeam.shortName : state.matchInfo.awayTeam.shortName})
                              </span>
                            )}
                          </div>
                          <span className="text-neutral-450 text-[10px] font-mono text-neutral-500">{evt.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: MATCH SETUP PANEL */}
            {activeTab === "setup" && (
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto max-h-[820px]">
                {/* 1. BROADCAST OPERATION MODES CARD */}
                <div className="bg-[#111422]/70 border border-amber-500/10 p-5 rounded-xl space-y-4">
                  <h4 className="text-xs font-black text-amber-500 tracking-wider uppercase flex items-center gap-1.5 leading-none">
                    <Settings className="w-4 h-4" /> Production & Operation Modes
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* MODE A vs B */}
                    <div className="bg-black/40 p-3.5 rounded-lg border border-neutral-850 space-y-2">
                      <span className="text-[10px] font-black text-neutral-400 block uppercase">Match Player Tracking Mode</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          id="btn-mode-a"
                          onClick={() => setState(prev => ({ ...prev, playerMode: "A" }))}
                          className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded transition ${
                            state.playerMode === "A" 
                              ? "bg-amber-500 text-neutral-950 font-black" 
                              : "bg-neutral-800 text-neutral-400 hover:text-white"
                          }`}
                        >
                          MODE A (Full Tracking)
                        </button>
                        <button
                          type="button"
                          id="btn-mode-b"
                          onClick={() => setState(prev => ({ ...prev, playerMode: "B" }))}
                          className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded transition ${
                            state.playerMode === "B" 
                              ? "bg-amber-500 text-neutral-950 font-black" 
                              : "bg-neutral-800 text-neutral-400 hover:text-white"
                          }`}
                        >
                          MODE B (Simple Score)
                        </button>
                      </div>
                      <p className="text-[9.5px] text-neutral-400 lowercase leading-normal mt-1 leading-none uppercase">
                        {state.playerMode === "A" 
                          ? "Enables squad rosters, sub tracking, assist selection, individual yellow/red card timelines." 
                          : "Simple match scoring only. Disables squad tracking to facilitate ultra-rapid single operator use."
                        }
                      </p>
                    </div>

                    {/* Simplified Graphics Toggle */}
                    <div className="bg-black/40 p-3.5 rounded-lg border border-neutral-850 space-y-2.5">
                      <span className="text-[10px] font-black text-neutral-400 block uppercase">Simplified Graphics Package</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-300 font-bold uppercase">Enable Simple Overlay Mode</span>
                        <button
                          type="button"
                          id="btn-simplified-graphics"
                          onClick={() => setState(p => ({ ...p, simplifiedGraphicsMode: !p.simplifiedGraphicsMode }))}
                          className={`w-14 h-7 rounded-full transition-colors relative flex items-center ${
                            state.simplifiedGraphicsMode ? "bg-amber-500" : "bg-neutral-800"
                          }`}
                        >
                          <span className={`w-5 h-5 bg-white rounded-full absolute transition-transform ${
                            state.simplifiedGraphicsMode ? "translate-x-8" : "translate-x-1"
                          }`} />
                        </button>
                      </div>
                      <p className="text-[9.5px] text-neutral-400 uppercase leading-normal">
                        Show only: Intro bug, Score board, Goal Banner, Half Time, Full Time, Result screen. Hidden advanced assets.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1B. OFFLINE PACKAGE EXPORTER */}
                <div className="bg-[#111422]/70 border border-indigo-500/15 p-5 rounded-xl space-y-4 shadow-[0_4px_20px_rgba(79,70,229,0.05)]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 leading-none">
                      <Monitor className="w-4 h-4" /> Offline Deployment Exporter
                    </h4>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                      BUS & LAN HOSTING READY
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                    Need to operate this broadcast graphics board offline (e.g., inside an athletic shuttle bus, local sports park LAN, or on isolated stadium production laptops)? Export the entire active HTML controller, CSS, and OBS websocket layers into a single self-contained portable offline package.
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-black/30 p-3.5 rounded-lg border border-neutral-850">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-neutral-400 block uppercase font-mono">Export Package Contents:</span>
                      <ul className="text-[10px] text-neutral-350 space-y-0.5 list-disc list-inside">
                        <li>Stand-alone <strong className="text-white font-semibold">index.html</strong> (Controller + Overlay)</li>
                        <li>Dynamic window storage cross-communication configuration file</li>
                        <li>Offline deployment setup guides (<strong className="text-white font-semibold">README_OFFLINE.txt</strong>)</li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportOfflinePackage}
                      disabled={exportingZip}
                      className={`px-5 py-3 rounded-lg text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.25)] ${
                        exportingZip 
                          ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                          : "bg-indigo-600 hover:bg-indigo-500 text-white font-black"
                      }`}
                    >
                      {exportingZip ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                          COMPILING STANDALONE ZIP...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 text-amber-500" />
                          GENERATE OFFLINE BUS/LOCAL ZIP
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. VENUE MANAGEMENT PANEL */}
                <div className="bg-[#111422]/60 p-5 rounded-xl border border-neutral-850 space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-xs font-black text-amber-500 uppercase flex items-center gap-1.5">
                      <Globe className="w-4 h-4" /> Venue Registry
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setVenueEditId(null);
                        setVenueName("");
                        setShowVenueForm(true);
                      }}
                      className="text-[10px] font-black text-amber-400 hover:underline uppercase"
                    >
                      + Create Venue
                    </button>
                  </div>

                  {showVenueForm && (
                    <div className="bg-black/50 border border-amber-500/20 p-3 rounded-lg flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-amber-500 uppercase">
                        {venueEditId ? "Rename Venue Entry" : "Create New Venue Entry"}
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={venueName}
                          onChange={(e) => setVenueName(e.target.value)}
                          placeholder="e.g. Etihad Stadium, Manchester"
                          className="flex-1 bg-neutral-900 border border-neutral-800 text-xs p-2 rounded text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (venueEditId) {
                              handleUpdateVenue(venueEditId, venueName);
                            } else {
                              handleCreateVenue(venueName);
                            }
                            setShowVenueForm(false);
                            setVenueName("");
                            setVenueEditId(null);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black px-4 py-2 rounded text-xs uppercase"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowVenueForm(false);
                            setVenueName("");
                            setVenueEditId(null);
                          }}
                          className="text-neutral-400 hover:text-white px-2 py-2 text-xs uppercase"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Venues grid list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {state.venues?.map((v) => (
                      <div key={v.id} className="bg-black/20 border border-neutral-850 p-2.5 rounded-lg flex justify-between items-center">
                        <span className="font-bold text-neutral-300 truncate">{v.name}</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setVenueEditId(v.id);
                              setVenueName(v.name);
                              setShowVenueForm(true);
                            }}
                            className="text-[9px] uppercase font-black text-amber-400 hover:underline"
                          >
                            Rename
                          </button>
                          {(state.venues || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVenue(v.id)}
                              className="text-[9px] uppercase font-black text-rose-500 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. ACTIVE MATCH SETUP INFO */}
                <div className="bg-[#111422]/60 p-5 rounded-xl border border-neutral-850 space-y-4">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-neutral-800 pb-2">Active Match Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Tournament Selection</label>
                      <select
                        value={state.activeTournamentId}
                        onChange={(e) => handleSelectTournament(e.target.value)}
                        className="w-full bg-black border border-neutral-850 rounded p-2 text-white font-bold"
                      >
                        {state.tournaments?.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.season})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Venue Selector</label>
                      <select
                        value={state.matchInfo.venue}
                        onChange={(e) => setState(p => ({ ...p, matchInfo: { ...p.matchInfo, venue: e.target.value } }))}
                        className="w-full bg-black border border-neutral-850 rounded p-2 text-white font-bold"
                      >
                        {state.venues?.map((v) => (
                          <option key={v.id} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Match Number</label>
                      <input 
                        type="number" 
                        value={state.matchInfo.matchNumber}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          matchInfo: { ...prev.matchInfo, matchNumber: parseInt(e.target.value) || 1 }
                        }))}
                        className="w-full bg-black border border-neutral-850 rounded p-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Kickoff Date</label>
                      <input 
                        type="date" 
                        value={state.matchInfo.date}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          matchInfo: { ...prev.matchInfo, date: e.target.value }
                        }))}
                        className="w-full bg-black border border-neutral-850 rounded p-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Time (UTC/Local)</label>
                      <input 
                        type="text" 
                        value={state.matchInfo.time}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          matchInfo: { ...prev.matchInfo, time: e.target.value }
                        }))}
                        className="w-full bg-black border border-neutral-850 rounded p-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Sponsor name / brand</label>
                      <input 
                        type="text" 
                        value={state.matchInfo.sponsorName}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          matchInfo: { ...prev.matchInfo, sponsorName: e.target.value }
                        }))}
                        className="w-full bg-black border border-neutral-850 rounded p-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Chief Referee Crew</label>
                      <input 
                        type="text" 
                        value={state.matchInfo.referee}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          matchInfo: { ...prev.matchInfo, referee: e.target.value }
                        }))}
                        className="w-full bg-black border border-neutral-850 rounded p-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Home Team Selector</label>
                      <select
                        value={state.matchInfo.homeTeam.id}
                        onChange={(e) => {
                          const tObj = state.tournamentTeams.find(x => x.id === e.target.value);
                          if (tObj) {
                            setState(p => ({ ...p, matchInfo: { ...p.matchInfo, homeTeam: { ...p.matchInfo.homeTeam, ...tObj } } }));
                          }
                        }}
                        className="w-full bg-black border border-neutral-850 rounded p-2 text-white font-bold"
                      >
                        {state.tournamentTeams?.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Away Team Selector</label>
                      <select
                        value={state.matchInfo.awayTeam.id}
                        onChange={(e) => {
                          const tObj = state.tournamentTeams.find(x => x.id === e.target.value);
                          if (tObj) {
                            setState(p => ({ ...p, matchInfo: { ...p.matchInfo, awayTeam: { ...p.matchInfo.awayTeam, ...tObj } } }));
                          }
                        }}
                        className="w-full bg-black border border-neutral-850 rounded p-2 text-white font-bold"
                      >
                        {state.tournamentTeams?.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. TEAM REGISTRY (CRUD) SECTION */}
                <div className="bg-[#111422]/60 p-5 rounded-xl border border-neutral-850 space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-xs font-black text-amber-500 uppercase flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Team Branding Manager
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTeamEditId(null);
                        setTeamName("");
                        setTeamShortName("");
                        setTeamLogo("https://upload.wikimedia.org/wikipedia/commons/e/e4/Globe_icon_2.svg");
                        setTeamColor("#fbbf24");
                        setShowTeamForm(true);
                      }}
                      className="text-[10.5px] font-black text-amber-400 hover:underline uppercase"
                    >
                      + Create Team Record
                    </button>
                  </div>

                  {showTeamForm && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fields = {
                          name: teamName,
                          shortName: teamShortName.toUpperCase(),
                          logoUrl: teamLogo,
                          color: teamColor
                        };
                        if (teamEditId) {
                          handleUpdateTeam(teamEditId, fields);
                        } else {
                          handleCreateTeam({ id: `team-${Date.now()}`, ...fields, secondaryColor: fields.color });
                        }
                        setShowTeamForm(false);
                        setTeamEditId(null);
                        setTeamName("");
                        setTeamShortName("");
                        setTeamLogo("");
                      }}
                      className="bg-neutral-900 border border-amber-500/20 p-4 rounded-lg space-y-3.5 text-xs"
                    >
                      <span className="text-[10px] font-black text-amber-500 uppercase">
                        {teamEditId ? "EDIT TEAM SETTINGS" : "CREATE NEW TEAM SCHEME"}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase font-bold text-neutral-450 block mb-1">Club Full Name *</label>
                          <input
                            type="text"
                            required
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full bg-black border border-neutral-850 p-1.5 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-neutral-450 block mb-1">Club Short Code *</label>
                          <input
                            type="text"
                            required
                            maxLength={3}
                            value={teamShortName}
                            onChange={(e) => setTeamShortName(e.target.value)}
                            placeholder="e.g. MCB"
                            className="w-full bg-black border border-neutral-850 p-1.5 rounded text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-neutral-450 block mb-1">Color Picker *</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={teamColor}
                              onChange={(e) => setTeamColor(e.target.value)}
                              className="h-8 w-8 bg-transparent border border-neutral-850 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={teamColor}
                              onChange={(e) => setTeamColor(e.target.value)}
                              className="w-full bg-black border border-neutral-850 p-1.5 rounded text-white font-mono text-[11px]"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="text-[10px] uppercase font-bold text-neutral-450 block mb-1">Club Crest Logo (URL or Upload Local Icon)</label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={teamLogo}
                              onChange={(e) => setTeamLogo(e.target.value)}
                              placeholder="Crest URL"
                              className="flex-1 bg-black border border-neutral-850 p-2 rounded text-white font-mono text-[11px]"
                            />
                            <div className="flex items-center gap-2">
                              <label className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-3.5 py-2 rounded text-xs font-bold uppercase cursor-pointer select-none border border-neutral-700">
                                Upload file
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      const r = new FileReader();
                                      r.onload = (ev) => {
                                        if (ev.target?.result) setTeamLogo(ev.target.result as string);
                                      };
                                      r.readAsDataURL(f);
                                    }
                                  }}
                                />
                              </label>
                              {teamLogo && (
                                <img 
                                  src={teamLogo} 
                                  alt="Pre" 
                                  className="h-8 w-8 object-contain bg-white/5 p-1 rounded border border-neutral-800"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1.5 border-t border-neutral-800">
                        <button
                          type="button"
                          onClick={() => {
                            setShowTeamForm(false);
                            setTeamEditId(null);
                          }}
                          className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold px-3 py-1.5 rounded uppercase"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black px-4 py-1.5 rounded uppercase"
                        >
                          Save Team Record
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Registered Teams Rows Display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                    {state.tournamentTeams?.map((t) => (
                      <div key={t.id} className="p-3 bg-black/30 border border-neutral-850 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-2.5 h-6 rounded" style={{ backgroundColor: t.color }} />
                          {t.logoUrl ? (
                            <img 
                              src={t.logoUrl} 
                              alt={t.name} 
                              className="h-7 w-7 object-contain bg-black/40 p-0.5 rounded border border-neutral-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-7 w-7 bg-neutral-800 text-amber-500 text-[10.5px] font-bold flex items-center justify-center rounded">
                              {t.shortName}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <span className="font-bold text-white block truncate text-[11px] uppercase">{t.name}</span>
                            <span className="text-[9.5px] text-neutral-450 uppercase font-mono">{t.shortName} code</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTeamEditId(t.id);
                              setTeamName(t.name);
                              setTeamShortName(t.shortName);
                              setTeamLogo(t.logoUrl || "");
                              setTeamColor(t.color);
                              setShowTeamForm(true);
                            }}
                            className="text-[9.5px] uppercase font-bold text-amber-400 hover:underline"
                          >
                            Edit
                          </button>
                          {(state.tournamentTeams || []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete team ${t.name}?`)) handleDeleteTeam(t.id);
                              }}
                              className="text-[9.5px] uppercase font-bold text-rose-500 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ROSTER & SQUAD BUILDER */}
            {activeTab === "squads" && (
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto max-h-[820px]">
                {state.playerMode === "B" && (
                  <div className="bg-amber-500/10 border-2 border-amber-500/40 p-5 rounded-xl text-center space-y-2 select-none uppercase shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                    <Trophy className="w-8 h-8 text-amber-500 mx-auto animate-bounce" />
                    <span className="text-xs font-black text-amber-500 block">SIMPLE MATCH MODE (MODE B) IS ACTIVE</span>
                    <p className="text-[10px] text-neutral-400 max-w-md mx-auto leading-normal">
                      Advanced squad player rosters, live substitutions, and yellow/red booking logs are currently disabled. Switch the match tracking mode to <strong>MODE A</strong> in the Match Setup panel to fully leverage interactive rosters and assist tracking.
                    </p>
                  </div>
                )}
                
                {/* Visual Sub System Box */}
                <div className="bg-[#1b1c28]/40 border-2 border-emerald-500/20 rounded-xl p-5">
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Execute Substitution Sub
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1.5">Select Club</label>
                      <select 
                        id="select-sub-club"
                        value={newPlayerTeam} 
                        onChange={(e) => setNewPlayerTeam(e.target.value as "home" | "away")}
                        className="w-full bg-black border border-neutral-800 rounded p-2 text-xs font-bold text-white"
                      >
                        <option value="home">Manchester Blue (Home)</option>
                        <option value="away">London Red (Away)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-red-400 uppercase block mb-1.5">Player OUT (Starter)</label>
                      <select 
                        id="select-sub-out"
                        value={subOutPlayerId} 
                        onChange={(e) => setSubOutPlayerId(e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-white"
                      >
                        <option value="">-- Choose Starter --</option>
                        {(newPlayerTeam === "home" ? state.matchInfo.homeTeam : state.matchInfo.awayTeam).players
                          .filter(p => p.isStarting)
                          .map(p => (
                            <option key={p.id} value={p.id}>#{p.number} - {p.name} ({p.position})</option>
                          ))
                        }
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-1.5">Player IN (Bench)</label>
                      <select 
                        id="select-sub-in"
                        value={subInPlayerId} 
                        onChange={(e) => setSubInPlayerId(e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-white"
                      >
                        <option value="">-- Choose Sub --</option>
                        {(newPlayerTeam === "home" ? state.matchInfo.homeTeam : state.matchInfo.awayTeam).players
                          .filter(p => !p.isStarting)
                          .map(p => (
                            <option key={p.id} value={p.id}>#{p.number} - {p.name} ({p.position})</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  <button
                    id="btn-trigger-substitution"
                    disabled={!subOutPlayerId || !subInPlayerId}
                    onClick={() => executeSubstitution(newPlayerTeam)}
                    className="w-full block text-center bg-emerald-500 hover:bg-emerald-600 font-black text-neutral-950 text-xs py-2.5 rounded-lg mt-4 transition disabled:opacity-50"
                  >
                    CONFIRM LIVE SUBSTITUTION
                  </button>
                </div>

                {/* Squad adder form */}
                <div className="bg-black/40 border border-neutral-850 p-5 rounded-lg flex flex-col gap-3.5">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Quick Squad Addition</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1 font-semibold">NAME</label>
                      <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Phil Foden" className="w-full bg-black border border-neutral-800 p-2 text-xs text-white rounded" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1 font-semibold">NUMBER</label>
                      <input type="number" value={newPlayerNumber} onChange={(e) => setNewPlayerNumber(parseInt(e.target.value) || 12)} className="w-full bg-black border border-neutral-800 p-2 text-xs text-white rounded" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1 font-semibold">POSITION</label>
                      <select value={newPlayerPos} onChange={(e) => setNewPlayerPos(e.target.value as Position)} className="w-full bg-black border border-neutral-800 p-2 text-xs text-white rounded">
                        <option value={Position.GK}>Goalkeeper</option>
                        <option value={Position.DEF}>Defender</option>
                        <option value={Position.MID}>Midfielder</option>
                        <option value={Position.FWD}>Forward</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1 font-semibold">TARGET CLUB</label>
                      <select value={newPlayerTeam} onChange={(e) => setNewPlayerTeam(e.target.value as "home" | "away")} className="w-full bg-black border border-neutral-800 p-2 text-xs text-white rounded">
                        <option value="home">Home Club</option>
                        <option value="away">Away Club</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    id="btn-add-player"
                    onClick={createNewPlayer}
                    className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs py-2 px-4 rounded transition self-start flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add to Squad
                  </button>
                </div>

                {/* Formations config selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1b1c26]/20 p-4 border border-neutral-850 rounded">
                    <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Home Formation</label>
                    <select
                      value={state.matchInfo.homeTeam.formation}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        matchInfo: {
                          ...prev.matchInfo,
                          homeTeam: { ...prev.matchInfo.homeTeam, formation: e.target.value }
                        }
                      }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs font-bold text-white"
                    >
                      <option value="4-3-3">4-3-3 Attacking</option>
                      <option value="4-4-2">4-4-2 Classical</option>
                      <option value="4-2-3-1">4-2-3-1 Modern</option>
                      <option value="3-5-2">3-5-2 Wingback</option>
                      <option value="5-3-2">5-3-2 Defensive</option>
                      <option value="3-4-3">3-4-3 Diamond</option>
                    </select>
                  </div>

                  <div className="bg-[#1b1c26]/20 p-4 border border-neutral-850 rounded">
                    <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Away Formation</label>
                    <select
                      value={state.matchInfo.awayTeam.formation}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        matchInfo: {
                          ...prev.matchInfo,
                          awayTeam: { ...prev.matchInfo.awayTeam, formation: e.target.value }
                        }
                      }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs font-bold text-white"
                    >
                      <option value="4-2-3-1">4-2-3-1 Modern</option>
                      <option value="4-3-3">4-3-3 Attacking</option>
                      <option value="4-4-2">4-4-2 Classical</option>
                      <option value="3-5-2">3-5-2 Wingback</option>
                      <option value="5-3-2">5-3-2 Defensive</option>
                      <option value="3-4-3">3-4-3 Diamond</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: TOURNAMENT MODE */}
            {activeTab === "tournament" && (
              <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto max-h-[820px]">
                
                {/* 1. TOURNAMENT BAR - DIRECT TAB SWITCHER */}
                <div className="flex border-b border-neutral-800 pb-2 gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => setTournamentTab("registry")}
                    className={`px-3 py-1.5 rounded text-xs font-black uppercase transition shrink-0 ${
                      tournamentTab === "registry" 
                        ? "bg-amber-500 text-neutral-950" 
                        : "bg-neutral-900 text-neutral-400 hover:text-white"
                    }`}
                  >
                    🏆 Registry
                  </button>
                  <button
                    type="button"
                    onClick={() => setTournamentTab("groups")}
                    className={`px-3 py-1.5 rounded text-xs font-black uppercase transition shrink-0 ${
                      tournamentTab === "groups" 
                        ? "bg-amber-500 text-neutral-950" 
                        : "bg-neutral-900 text-neutral-400 hover:text-white"
                    }`}
                  >
                    📊 Group Standings
                  </button>
                  <button
                    type="button"
                    onClick={() => setTournamentTab("bracket")}
                    className={`px-3 py-1.5 rounded text-xs font-black uppercase transition shrink-0 ${
                      tournamentTab === "bracket" 
                        ? "bg-amber-500 text-neutral-950" 
                        : "bg-neutral-900 text-neutral-400 hover:text-white"
                    }`}
                  >
                    🌿 Knockout Bracket
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTournamentTab("themes");
                      // sync edit content view
                      const currentTheme = customThemes.find(t => t.id === activeCustomThemeId) || customThemes[0];
                      if (currentTheme) {
                        setThemeFileEditorContent(currentTheme.files[selectedThemeFileName] || "");
                      }
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-black uppercase transition shrink-0 ${
                      tournamentTab === "themes" 
                        ? "bg-amber-500 text-neutral-950" 
                        : "bg-neutral-900 text-neutral-400 hover:text-white"
                    }`}
                  >
                    🎨 Theme HTML Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setTournamentTab("accounts")}
                    className={`px-3 py-1.5 rounded text-xs font-black uppercase transition shrink-0 ${
                      tournamentTab === "accounts" 
                        ? "bg-amber-500 text-neutral-950" 
                        : "bg-neutral-900 text-neutral-400 hover:text-white"
                    }`}
                  >
                    🔑 Account Auth Admin
                  </button>
                </div>

                {/* ========================================== */}
                {/* SUB-TAB A: REGISTRY MANAGER               */}
                {/* ========================================== */}
                {tournamentTab === "registry" && (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-850 select-none">
                      <div>
                        <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider">Tournament Database & Registry</h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5">CREATE, REPLICATE, BACKUP AND ASSIGN GLOBAL SEASONS</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTEditId(null);
                          setTName("");
                          setTSeason("2026");
                          setTLogo("https://upload.wikimedia.org/wikipedia/commons/e/e4/Globe_icon_2.svg");
                          setTOrganizer("");
                          setTVenue("");
                          setTNotes("");
                          setShowTForm(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 font-bold text-neutral-950 px-3 py-1.5 rounded text-xs uppercase flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Scheme
                      </button>
                    </div>

                    {showTForm && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const payload = {
                            name: tName,
                            season: tSeason,
                            logoUrl: tLogo,
                            organizer: tOrganizer,
                            venue: tVenue,
                            notes: tNotes
                          };
                          if (tEditId) {
                            handleUpdateTournament(tEditId, payload);
                          } else {
                            handleCreateTournament(payload);
                          }
                          setShowTForm(false);
                          setTEditId(null);
                        }}
                        className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4"
                      >
                        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                          <span className="text-xs font-black text-amber-500">
                            {tEditId ? "EDIT TOURNAMENT SETTING" : "CREATE NEW TOURNAMENT SCHEME"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowTForm(false);
                              setTEditId(null);
                            }}
                            className="text-neutral-400 hover:text-white text-xs font-bold uppercase"
                          >
                            Discard
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Tournament Name *</label>
                            <input
                              type="text"
                              required
                              value={tName}
                              onChange={(e) => setTName(e.target.value)}
                              placeholder="e.g. AFC Champions Cup"
                              className="w-full bg-[#0c0e17] border border-neutral-800 rounded p-2 text-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Season *</label>
                            <input
                              type="text"
                              required
                              value={tSeason}
                              onChange={(e) => setTSeason(e.target.value)}
                              placeholder="e.g. 2026"
                              className="w-full bg-[#0c0e17] border border-neutral-800 rounded p-2 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Organizer</label>
                            <input
                              type="text"
                              value={tOrganizer}
                              onChange={(e) => setTOrganizer(e.target.value)}
                              className="w-full bg-[#0c0e17] border border-neutral-800 rounded p-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Venue Default</label>
                            <input
                              type="text"
                              value={tVenue}
                              onChange={(e) => setTVenue(e.target.value)}
                              className="w-full bg-[#0c0e17] border border-neutral-800 rounded p-2 text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Logo Link (Upload File Support Below)</label>
                            <input
                              type="text"
                              value={tLogo}
                              onChange={(e) => setTLogo(e.target.value)}
                              className="w-full bg-[#0c0e17] border border-neutral-800 rounded p-2 text-white font-mono text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1 font-semibold">Administrative Memo</label>
                            <textarea
                              value={tNotes}
                              onChange={(e) => setTNotes(e.target.value)}
                              rows={2}
                              className="w-full bg-[#0c0e17] border border-neutral-800 rounded p-2 text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setShowTForm(false)}
                            className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-3.5 py-1.5 rounded text-xs font-bold uppercase"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 font-bold text-neutral-950 px-4 py-1.5 rounded text-xs uppercase"
                          >
                            Save Setting
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {state.tournaments?.map((tour) => {
                        const isActive = state.activeTournamentId === tour.id;
                        return (
                          <div
                            key={tour.id}
                            className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition ${
                              isActive 
                                ? "bg-amber-500/5 border-amber-500/40 relative shadow-lg" 
                                : "bg-[#111422]/60 border-neutral-850"
                            }`}
                          >
                            {isActive && (
                              <span className="absolute top-3 right-3 bg-amber-400 text-neutral-950 text-[8.5px] font-black tracking-widest px-2 py-0.5 rounded uppercase">
                                SELECTED LIVE
                              </span>
                            )}

                            <div className="flex gap-3.5 items-start">
                              {tour.logoUrl ? (
                                <img
                                  src={tour.logoUrl}
                                  alt={tour.name}
                                  className="h-10 w-10 object-contain p-1 rounded bg-black/30 border border-neutral-800 flex-shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-[#1f2135] flex items-center justify-center font-black text-amber-500 italic text-md flex-shrink-0">
                                  🏆
                                </div>
                              )}

                              <div className="space-y-1 overflow-hidden">
                                <h4 className="text-white font-black truncate text-sm uppercase">{tour.name}</h4>
                                <div className="flex flex-wrap gap-2 text-[9px] text-neutral-400 font-semibold uppercase">
                                  <span className="bg-black/30 border border-neutral-800 px-2 py-0.5 rounded">Season: {tour.season}</span>
                                  {tour.organizer && (
                                    <span className="bg-black/30 border border-neutral-800 px-2 py-0.5 rounded truncate max-w-[150px]">
                                      Org: {tour.organizer}
                                    </span>
                                  )}
                                </div>
                                {tour.notes && (
                                  <p className="text-[10px] text-neutral-450 leading-normal truncate block pt-1 italic">
                                    "{tour.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-neutral-850/80 pt-3 text-[10px] font-black">
                              <div className="flex gap-1.5">
                                {!isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectTournament(tour.id)}
                                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded border border-amber-500/20 uppercase transition"
                                  >
                                    Activate
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTEditId(tour.id);
                                    setTName(tour.name);
                                    setTSeason(tour.season);
                                    setTLogo(tour.logoUrl || "");
                                    setTOrganizer(tour.organizer || "");
                                    setTVenue(tour.venue || "");
                                    setTNotes(tour.notes || "");
                                    setShowTForm(true);
                                  }}
                                  className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 px-2.5 py-1 rounded border border-neutral-700 uppercase transition flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateTournament(tour.id)}
                                  className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2.5 py-1 rounded border border-neutral-700 uppercase transition flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" /> Replicate
                                </button>
                              </div>

                              {(state.tournaments || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete entire settings list for ${tour.name}?`)) {
                                      handleDeleteTournament(tour.id);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-400 uppercase transition flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Close
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ========================================== */}
                {/* SUB-TAB B: GROUP STAGE CALCULATIONS        */}
                {/* ========================================== */}
                {tournamentTab === "groups" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 select-none">
                      <div>
                        <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Automatic Cup Grouping & Standing calculations</h4>
                        <p className="text-[10px] text-neutral-400 mt-1 uppercase">Draw teams into Groups A-D automatically, or use overrides to adjust stats.</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        {/* Tie-breaker Selection dropdown */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9.5px] uppercase text-neutral-400 font-bold">Tie-Breaker Priority:</span>
                          <select
                            value={tiebreakerPriority}
                            onChange={(e) => setTiebreakerPriority(e.target.value as any)}
                            className="bg-neutral-950 border border-neutral-800 rounded p-1.5 text-white text-[11px] font-bold"
                          >
                            <option value="GD">Goal Difference (GD)</option>
                            <option value="GF">Goals For (GF)</option>
                            <option value="H2H">Head-to-Head Record</option>
                            <option value="FairPlay">Fair Play Discipline</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={handleRandomizeGroups}
                          className="bg-amber-500 hover:bg-amber-600 font-black text-neutral-950 px-3 py-1.5 rounded text-[11px] uppercase transition"
                        >
                          ⚡ Random Group Draw
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleResetGroupOverrides}
                          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-black px-3 py-1.5 rounded text-[11px] uppercase transition border border-neutral-705"
                        >
                          Clear Overrides
                        </button>
                      </div>
                    </div>

                    {/* Display four groups A-D as panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {Object.entries(groupTeams).map(([groupName, teamsList]) => {
                        // Gather stats for sorting
                        const rows = teamsList.map(tName => {
                          const override = groupOverrides[tName] || { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
                          
                          // Auto calculate from actual team events if team shortName is matching
                          const actualTeam = state.tournamentTeams.find(tt => tt.name === tName);
                          let calculatedGD = override.gf - override.ga;
                          let calculatedPts = (override.won * 3) + override.drawn;

                          return {
                            name: tName,
                            logo: actualTeam?.logoUrl || "",
                            played: override.played,
                            won: override.won,
                            drawn: override.drawn,
                            lost: override.lost,
                            gf: override.gf,
                            ga: override.ga,
                            gd: calculatedGD,
                            pts: calculatedPts,
                            fairPlay: actualTeam?.fairPlayPoints || 0
                          };
                        });

                        // Standard Sort algorithm incorporating user tiebreaker select
                        rows.sort((a, b) => {
                          if (b.pts !== a.pts) return b.pts - a.pts; // Rank by Pts first
                          if (tiebreakerPriority === "GD") {
                            if (b.gd !== a.gd) return b.gd - a.gd;
                            return b.gf - a.gf;
                          } else if (tiebreakerPriority === "GF") {
                            if (b.gf !== a.gf) return b.gf - a.gf;
                            return b.gd - a.gd;
                          } else if (tiebreakerPriority === "FairPlay") {
                            return b.fairPlay - a.fairPlay; // more is better
                          }
                          return b.gd - a.gd; // backup GD
                        });

                        return (
                          <div key={groupName} className="bg-[#111422]/60 border border-neutral-850 p-4 rounded-xl flex flex-col gap-3">
                            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                              <span className="text-xs font-black text-amber-500 uppercase flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-amber-500" /> {groupName}
                              </span>
                              <span className="text-[9px] text-neutral-450 uppercase text-neutral-400">Live Computed Standings</span>
                            </div>

                            <table className="w-full text-left border-collapse text-[11px] font-mono">
                              <thead>
                                <tr className="border-b border-neutral-800 text-[10px] text-neutral-400 uppercase select-none font-bold">
                                  <th className="py-1">Team</th>
                                  <th className="py-1 text-center font-bold">P</th>
                                  <th className="py-1 text-center font-bold">W</th>
                                  <th className="py-1 text-center font-bold">D</th>
                                  <th className="py-1 text-center font-bold">L</th>
                                  <th className="py-1 text-center font-bold">GF:GA</th>
                                  <th className="py-1 text-center font-bold text-amber-500">PTS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, idx) => (
                                  <tr key={row.name} className="border-b border-neutral-850/60 hover:bg-neutral-900/10 text-neutral-200">
                                    <td className="py-2 flex items-center gap-1.5 truncate max-w-[120px] font-sans font-bold">
                                      <span className="text-[10px] font-mono text-neutral-500 font-bold">{idx + 1}.</span>
                                      {row.logo && (
                                        <img src={row.logo} className="w-4 h-4 object-contain" alt="" referrerPolicy="no-referrer" />
                                      )}
                                      <span className="truncate">{row.name}</span>
                                    </td>
                                    
                                    {/* Played Adjustment Column */}
                                    <td className="py-2 text-center">
                                      <div className="flex items-center justify-center gap-1 font-bold">
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "played", -1)} className="text-[9px] text-[#777] hover:text-white px-0.5">-</button>
                                        <span className="text-white font-black">{row.played}</span>
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "played", 1)} className="text-[9px] text-[#777] hover:text-white px-0.5">+</button>
                                      </div>
                                    </td>

                                    {/* Won Adjustment Column */}
                                    <td className="py-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "won", -1)} className="text-[9px] text-[#777] hover:text-white px-0.5">-</button>
                                        <span>{row.won}</span>
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "won", 1)} className="text-[9px] text-[#777] hover:text-white px-0.5">+</button>
                                      </div>
                                    </td>

                                    {/* Drawn Adjustment Column */}
                                    <td className="py-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "drawn", -1)} className="text-[9px] text-[#777] hover:text-white px-0.5">-</button>
                                        <span>{row.drawn}</span>
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "drawn", 1)} className="text-[9px] text-[#777] hover:text-white px-0.5">+</button>
                                      </div>
                                    </td>

                                    {/* Lost Adjustment Column */}
                                    <td className="py-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "lost", -1)} className="text-[9px] text-[#777] hover:text-white px-0.5">-</button>
                                        <span>{row.lost}</span>
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "lost", 1)} className="text-[9px] text-[#777] hover:text-white px-0.5">+</button>
                                      </div>
                                    </td>

                                    {/* GF/GA goal adjusts */}
                                    <td className="py-2 text-center">
                                      <div className="inline-flex items-center gap-0.5">
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "gf", -1)} className="text-[9px] text-[#777] select-none hover:text-white">-</button>
                                        <span>{row.gf}</span>
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "gf", 1)} className="text-[9px] text-[#777] select-none hover:text-white">+</button>
                                        <span className="mx-0.5">:</span>
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "ga", -1)} className="text-[9px] text-[#777] select-none hover:text-white">-</button>
                                        <span>{row.ga}</span>
                                        <button type="button" onClick={() => handleUpdateGroupOverrides(row.name, "ga", 1)} className="text-[9px] text-[#777] select-none hover:text-white">+</button>
                                        <span className="ml-1.5 text-neutral-400 font-bold">({row.gd >= 0 ? `+${row.gd}` : row.gd})</span>
                                      </div>
                                    </td>

                                    {/* Points score manually adjusted */}
                                    <td className="py-2 text-center font-bold text-amber-500 text-xs">
                                      <span>{row.pts} Pts</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ========================================== */}
                {/* SUB-TAB C: BRACKETS & DIRECT ADVANCEMENT  */}
                {/* ========================================== */}
                {tournamentTab === "bracket" && (
                  <div className="space-y-4">
                    <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-800 select-none">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Visual Cup Knockout Stage tree & Direct Bypass Advancers</h4>
                      <p className="text-[10px] text-neutral-400 block mt-1 uppercase">Manually force-promote any team straight to the Quarter, Semi or Final stages to bypass games.</p>
                    </div>

                    {/* Bracket visual nodes layout map */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-center font-bold uppercase select-none p-2 bg-[#0c0e17] rounded-xl border border-neutral-850/80">
                      
                      {/* Quarter-Final Column */}
                      <div className="space-y-6">
                        <div className="text-[10px] font-black text-amber-500 border-b border-neutral-800 pb-1 flex justify-center items-center gap-1">
                          ⚔️ Quarter-Finals (QF)
                        </div>

                        {/* Match 1 */}
                        <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850 space-y-2 flex flex-col items-stretch text-left">
                          <span className="text-[9px] text-[#999] tracking-wider font-extrabold uppercase block">QF 1 Match - Direct Slot Placement</span>
                          <select
                            value={knockoutSlots.QF1_Team1}
                            onChange={(e) => handleUpdateKnockoutSlot("QF1_Team1", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-white"
                          >
                            <option value="">-- [Slot Team 1] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <select
                            value={knockoutSlots.QF1_Team2}
                            onChange={(e) => handleUpdateKnockoutSlot("QF1_Team2", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-white"
                          >
                            <option value="">-- [Slot Team 2] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>

                          <button type="button" onClick={() => {
                            if (knockoutSlots.QF1_Team1) handleUpdateKnockoutSlot("SF1_Team1", knockoutSlots.QF1_Team1);
                          }} className="bg-amber-500 text-neutral-950 text-[9px] py-1 font-black rounded uppercase hover:bg-amber-600 transition">Promote Team 1 👉</button>
                        </div>

                        {/* Match 2 */}
                        <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850 space-y-2 flex flex-col items-stretch text-left">
                          <span className="text-[9px] text-[#999] font-extrabold block">QF 2 Match</span>
                          <select
                            value={knockoutSlots.QF2_Team1}
                            onChange={(e) => handleUpdateKnockoutSlot("QF2_Team1", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-white"
                          >
                            <option value="">-- [Slot Team 1] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <select
                            value={knockoutSlots.QF2_Team2}
                            onChange={(e) => handleUpdateKnockoutSlot("QF2_Team2", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-white"
                          >
                            <option value="">-- [Slot Team 2] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <button type="button" onClick={() => {
                            if (knockoutSlots.QF2_Team1) handleUpdateKnockoutSlot("SF1_Team2", knockoutSlots.QF2_Team1);
                          }} className="bg-amber-500 text-neutral-950 text-[9px] py-1 font-black rounded uppercase hover:bg-amber-600 transition">Promote Team 1 👉</button>
                        </div>

                        {/* QF3 & QF4 */}
                        <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850 space-y-2 flex flex-col items-stretch text-left">
                          <span className="text-[9px] text-[#999] font-extrabold block">QF 3 Match</span>
                          <select
                            value={knockoutSlots.QF3_Team1}
                            onChange={(e) => handleUpdateKnockoutSlot("QF3_Team1", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-white"
                          >
                            <option value="">-- [Slot Team 1] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <select
                            value={knockoutSlots.QF3_Team2}
                            onChange={(e) => handleUpdateKnockoutSlot("QF3_Team2", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-white"
                          >
                            <option value="">-- [Slot Team 2] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <button type="button" onClick={() => {
                            if (knockoutSlots.QF3_Team1) handleUpdateKnockoutSlot("SF2_Team1", knockoutSlots.QF3_Team1);
                          }} className="bg-amber-500 text-neutral-950 text-[9px] py-1 font-black rounded uppercase hover:bg-amber-600 transition">Promote Team 1 👉</button>
                        </div>

                        <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850 space-y-2 flex flex-col items-stretch text-left">
                          <span className="text-[9px] text-[#999] font-extrabold block">QF 4 Match</span>
                          <select
                            value={knockoutSlots.QF4_Team1}
                            onChange={(e) => handleUpdateKnockoutSlot("QF4_Team1", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-white"
                          >
                            <option value="">-- [Slot Team 1] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <select
                            value={knockoutSlots.QF4_Team2}
                            onChange={(e) => handleUpdateKnockoutSlot("QF4_Team2", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-white"
                          >
                            <option value="">-- [Slot Team 2] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <button type="button" onClick={() => {
                            if (knockoutSlots.QF4_Team1) handleUpdateKnockoutSlot("SF2_Team2", knockoutSlots.QF4_Team1);
                          }} className="bg-amber-500 text-neutral-950 text-[9px] py-1 font-black rounded uppercase hover:bg-amber-600 transition">Promote Team 1 👉</button>
                        </div>
                      </div>

                      {/* Semi-Finals Column */}
                      <div className="space-y-12 pt-8">
                        <div className="text-[10px] font-black text-amber-500 border-b border-neutral-800 pb-1 flex justify-center items-center gap-1">
                          🌟 Semi-Finals (SF)
                        </div>

                        {/* SF 1 */}
                        <div className="bg-[#1f1a14]/65 p-4 rounded-lg border border-amber-500/20 space-y-2.5 flex flex-col items-stretch text-left">
                          <span className="text-[9px] text-amber-500/80 font-black tracking-widest block uppercase">SEMI FINAL 1 SLOT</span>
                          <select
                            value={knockoutSlots.SF1_Team1}
                            onChange={(e) => handleUpdateKnockoutSlot("SF1_Team1", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10px] p-1.5 rounded text-neutral-200"
                          >
                            <option value="">-- [Team 1 Select] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <select
                            value={knockoutSlots.SF1_Team2}
                            onChange={(e) => handleUpdateKnockoutSlot("SF1_Team2", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10px] p-1.5 rounded text-neutral-200"
                          >
                            <option value="">-- [Team 2 Select] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button type="button" onClick={() => {
                              if (knockoutSlots.SF1_Team1) handleUpdateKnockoutSlot("F_Team1", knockoutSlots.SF1_Team1);
                              if (knockoutSlots.SF1_Team2) handleUpdateKnockoutSlot("Third_Team1", knockoutSlots.SF1_Team2);
                            }} className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-[8px] font-black uppercase py-1 rounded">Pass 1 👉</button>
                            <button type="button" onClick={() => {
                              if (knockoutSlots.SF1_Team2) handleUpdateKnockoutSlot("F_Team1", knockoutSlots.SF1_Team2);
                              if (knockoutSlots.SF1_Team1) handleUpdateKnockoutSlot("Third_Team1", knockoutSlots.SF1_Team1);
                            }} className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-[8px] font-black uppercase py-1 rounded">Pass 2 👉</button>
                          </div>
                        </div>

                        {/* SF 2 */}
                        <div className="bg-[#1f1a14]/65 p-4 rounded-lg border border-amber-500/20 space-y-2.5 flex flex-col items-stretch text-left">
                          <span className="text-[9px] text-amber-500/80 font-black tracking-widest block uppercase">SEMI FINAL 2 SLOT</span>
                          <select
                            value={knockoutSlots.SF2_Team1}
                            onChange={(e) => handleUpdateKnockoutSlot("SF2_Team1", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10px] p-1.5 rounded text-neutral-200"
                          >
                            <option value="">-- [Team 1 Select] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <select
                            value={knockoutSlots.SF2_Team2}
                            onChange={(e) => handleUpdateKnockoutSlot("SF2_Team2", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10px] p-1.5 rounded text-neutral-200"
                          >
                            <option value="">-- [Team 2 Select] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button type="button" onClick={() => {
                              if (knockoutSlots.SF2_Team1) handleUpdateKnockoutSlot("F_Team2", knockoutSlots.SF2_Team1);
                              if (knockoutSlots.SF2_Team2) handleUpdateKnockoutSlot("Third_Team2", knockoutSlots.SF2_Team2);
                            }} className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-[8px] font-black uppercase py-1 rounded">Pass 1 👉</button>
                            <button type="button" onClick={() => {
                              if (knockoutSlots.SF2_Team2) handleUpdateKnockoutSlot("F_Team2", knockoutSlots.SF2_Team2);
                              if (knockoutSlots.SF2_Team1) handleUpdateKnockoutSlot("Third_Team2", knockoutSlots.SF2_Team1);
                            }} className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-[8px] font-black uppercase py-1 rounded">Pass 2 👉</button>
                          </div>
                        </div>
                      </div>

                      {/* Finals & 3rd Place Column */}
                      <div className="space-y-8 pt-8">
                        <div className="text-[10px] font-black text-amber-500 border-b border-neutral-800 pb-1 flex justify-center items-center gap-1">
                          👑 Finals & Third Play
                        </div>

                        {/* Final match */}
                        <div className="bg-neutral-900 border-2 border-red-500/25 p-4 rounded-xl space-y-2.5 flex flex-col items-stretch text-left">
                          <span className="text-[9.5px] text-red-500 font-extrabold block tracking-wider">⚽ GRAND FINAL</span>
                          <select
                            value={knockoutSlots.F_Team1}
                            onChange={(e) => handleUpdateKnockoutSlot("F_Team1", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-red-100 font-bold"
                          >
                            <option value="">-- [Finalist 1] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <select
                            value={knockoutSlots.F_Team2}
                            onChange={(e) => handleUpdateKnockoutSlot("F_Team2", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10.5px] p-1.5 rounded text-red-100 font-bold"
                          >
                            <option value="">-- [Finalist 2] --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          
                          <select
                            value={knockoutSlots.Winner}
                            onChange={(e) => handleUpdateKnockoutSlot("Winner", e.target.value)}
                            className="bg-amber-500 border border-amber-400 text-[11px] p-1.5 rounded text-black font-black"
                          >
                            <option value="">🏆 CHOOSE CHAMPION</option>
                            {knockoutSlots.F_Team1 && <option value={knockoutSlots.F_Team1}>{knockoutSlots.F_Team1}</option>}
                            {knockoutSlots.F_Team2 && <option value={knockoutSlots.F_Team2}>{knockoutSlots.F_Team2}</option>}
                          </select>
                        </div>

                        {/* Third Place Match */}
                        <div className="bg-neutral-900 border border-blue-500/20 p-4 rounded-xl space-y-2 flex flex-col items-stretch text-left">
                          <span className="text-[9px] text-blue-400 font-bold block">🥉 3RD PLACE BRONZE</span>
                          <select
                            value={knockoutSlots.Third_Team1}
                            onChange={(e) => handleUpdateKnockoutSlot("Third_Team1", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10px] p-1.5 rounded text-neutral-300"
                          >
                            <option value="">-- Slot 1 select --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <select
                            value={knockoutSlots.Third_Team2}
                            onChange={(e) => handleUpdateKnockoutSlot("Third_Team2", e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-[10px] p-1.5 rounded text-neutral-300"
                          >
                            <option value="">-- Slot 2 select --</option>
                            {state.tournamentTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <select
                            value={knockoutSlots.ThirdPlaceWinner}
                            onChange={(e) => handleUpdateKnockoutSlot("ThirdPlaceWinner", e.target.value)}
                            className="bg-blue-500/20 border border-blue-500/45 text-[10px] p-1 rounded text-blue-400 font-bold"
                          >
                            <option value="">🥉 CHOOSE BRONZE WINNER</option>
                            {knockoutSlots.Third_Team1 && <option value={knockoutSlots.Third_Team1}>{knockoutSlots.Third_Team1}</option>}
                            {knockoutSlots.Third_Team2 && <option value={knockoutSlots.Third_Team2}>{knockoutSlots.Third_Team2}</option>}
                          </select>
                        </div>
                      </div>

                      {/* Winner Announcement Column */}
                      <div className="flex flex-col justify-center items-center py-8 space-y-4">
                        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-6 text-center shadow-[0_0_20px_rgba(245,158,11,0.1)] flex flex-col items-center gap-2 max-w-[200px]">
                          <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
                          <span className="text-[10px] font-black text-amber-500 tracking-widest block uppercase">CROWNED CHAMPION</span>
                          <span className="text-sm font-black text-white block uppercase max-w-[150px] leading-tight select-none">
                            {knockoutSlots.Winner ? knockoutSlots.Winner : "TBD"}
                          </span>
                          {knockoutSlots.ThirdPlaceWinner && (
                            <span className="text-[9px] text-blue-400 font-bold tracking-widest mt-2 block">
                              🥉 3RD: {knockoutSlots.ThirdPlaceWinner}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* ========================================== */}
                {/* SUB-TAB D: THEME HTML & JS SANDBOX        */}
                {/* ========================================== */}
                {tournamentTab === "themes" && (
                  <div className="space-y-4 text-xs font-sans">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-amber-500 font-black text-xs uppercase block tracking-wider">Theme Development Studio</span>
                        <p className="text-[10px] text-neutral-400 uppercase">Write HTML, CSS, Javascript templates directly in the sandboxed editor</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={handleCreateCustomTheme} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded text-[10.5px] uppercase">+ Create Custom Theme</button>
                        <button type="button" onClick={handleExportThemeJSON} className="px-3 py-1.5 bg-[#1f2937] hover:bg-neutral-800 text-white font-black border border-neutral-700 rounded text-[10.5px] uppercase">Export Theme JSON</button>
                        
                        <label className="px-3 py-1.5 bg-[#1f2937] hover:bg-neutral-800 text-white font-black border border-neutral-700 rounded text-[10.5px] uppercase cursor-pointer">
                          Import Theme
                          <input type="file" accept=".json" className="hidden" onChange={handleImportThemeJSON} />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-5">
                      {/* Themes preset list selector */}
                      <div className="col-span-12 md:col-span-3 space-y-2 border-r border-neutral-850/80 pr-2">
                        <span className="text-[10px] font-black tracking-widest text-[#999] block uppercase mb-1">Theme Presets & Custom List</span>
                        {customThemes.map((ct) => {
                          const isSel = ct.id === activeCustomThemeId;
                          return (
                            <div
                              key={ct.id}
                              onClick={() => handleSelectThemeSandbox(ct.id)}
                              className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex justify-between items-center ${
                                isSel 
                                  ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                                  : "bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800 text-neutral-400"
                              }`}
                            >
                              <div className="truncate">
                                <span className="font-bold text-[11px] block">{ct.name}</span>
                                <span className="text-[9px] text-neutral-450 font-mono">ID: {ct.id}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDuplicateThemeSandbox(ct.id); }} className="text-[#888] hover:text-white" title="Duplicate theme"><Copy className="w-3 h-3" /></button>
                                {ct.id !== "classic" && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete theme ${ct.name}?`)) handleDeleteThemeSandbox(ct.id); }} className="text-red-500 hover:text-red-400" title="Delete theme"><Trash2 className="w-3 h-3" /></button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Color Pickers panel inside active theme */}
                        <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 space-y-3 mt-4 text-[10px] text-neutral-400">
                          <span className="font-extrabold text-white block uppercase">Active Color overrides</span>
                          <div>
                            <label className="block mb-1 text-[9px] uppercase">Primary Bg Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={state.themePrimaryBgColor || "#1b2531"}
                                onChange={(e) => handleUpdateThemeColors(e.target.value, state.themeSecondaryBgColor || "", state.themeTextColor || "", activeCustomThemeId)}
                                className="w-10 h-7 border border-neutral-700 bg-transparent rounded"
                              />
                              <input type="text" value={state.themePrimaryBgColor || ""} placeholder="Hex" disabled className="w-full bg-[#0c0e17] text-white p-1 rounded font-mono text-[10px]" />
                            </div>
                          </div>
                          <div>
                            <label className="block mb-1 text-[9px] uppercase">Secondary Bg (Gradient)</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={state.themeSecondaryBgColor || "#0f111a"}
                                onChange={(e) => handleUpdateThemeColors(state.themePrimaryBgColor || "", e.target.value, state.themeTextColor || "", activeCustomThemeId)}
                                className="w-10 h-7 border border-neutral-700 bg-transparent rounded"
                              />
                              <input type="text" value={state.themeSecondaryBgColor || ""} placeholder="Hex" disabled className="w-full bg-[#0c0e17] text-white p-1 rounded font-mono text-[10px]" />
                            </div>
                          </div>
                          <div>
                            <label className="block mb-1 text-[9px] uppercase">Theme Text Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={state.themeTextColor || "#ffffff"}
                                onChange={(e) => handleUpdateThemeColors(state.themePrimaryBgColor || "", state.themeSecondaryBgColor || "", e.target.value, activeCustomThemeId)}
                                className="w-10 h-7 border border-neutral-700 bg-transparent rounded"
                              />
                              <input type="text" value={state.themeTextColor || ""} placeholder="Hex" disabled className="w-full bg-[#0c0e17] text-white p-1 rounded font-mono text-[10px]" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active theme code editor viewport */}
                      <div className="col-span-12 md:col-span-9 flex flex-col gap-3">
                        <div className="flex border-b border-neutral-850 gap-1.5 select-none text-[10.5px]">
                          {["scorebug.html", "goal.html", "cards.html", "intro.html", "result.html", "style.css", "theme.js", "config.json"].map(fileName => {
                            const isAct = fileName === selectedThemeFileName;
                            return (
                              <button
                                key={fileName}
                                type="button"
                                onClick={() => {
                                  setSelectedThemeFileName(fileName);
                                  const curTheme = customThemes.find(t => t.id === activeCustomThemeId) || customThemes[0];
                                  setThemeFileEditorContent(curTheme.files[fileName] || "");
                                }}
                                className={`px-2.5 py-1 rounded-t-md font-mono ${
                                  isAct 
                                    ? "bg-[#1e1e1e] border-t border-x border-neutral-800 text-amber-500 font-bold" 
                                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                                }`}
                              >
                                {fileName}
                              </button>
                            );
                          })}
                        </div>

                        {/* Textarea mimicking IDE editor */}
                        <div className="relative">
                          <textarea
                            value={themeFileEditorContent}
                            onChange={(e) => setThemeFileEditorContent(e.target.value)}
                            spellCheck={false}
                            className="w-full h-[280px] bg-[#1a1a1a] border border-neutral-800 p-4 rounded-xl text-neutral-200 font-mono text-[11.5px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="<!-- Write design tags here -->"
                          />
                          <div className="absolute bottom-3 right-3 text-[9px] font-mono text-[#999] tracking-wider select-none bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded">
                            TAB SPACINGS OVERRIDE: ACTIVE
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = customThemes.find(t => t.id === activeCustomThemeId);
                              if (cur) setThemeFileEditorContent(cur.files[selectedThemeFileName] || "");
                            }}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3.5 py-1.5 rounded uppercase font-black font-sans text-[10.5px] transition"
                          >
                            Reset File Code
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleSaveThemeFile}
                            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-4 py-1.5 rounded uppercase font-black font-sans text-[10.5px] transition shadow-md shadow-amber-500/10"
                          >
                            💾 Save File Code to Sandbox
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================== */}
                {/* SUB-TAB E: USER AUTH SHEETS SIMULATOR     */}
                {/* ========================================== */}
                {tournamentTab === "accounts" && (
                  <div className="space-y-5 text-xs">
                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-850 select-none">
                      <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Local User Access Management
                      </h4>
                      <p className="text-[10px] text-neutral-400 mt-1 uppercase">
                        {currentUser?.role === "admin" 
                          ? "Administrator Control: Create, edit, and remove user accounts and roles."
                          : "User Account Control: Manage your local user session credentials."
                        }
                      </p>
                    </div>

                    {/* Google Sheets Cloud Database Sync Settings (Admin Only) */}
                    {currentUser?.role === "admin" && (
                      <div className="bg-[#111422] p-4 rounded-xl border border-neutral-800 space-y-4">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block border-b border-neutral-850 pb-1.5 flex items-center gap-2">
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Google Sheets Cloud Database Sync Settings
                        </span>
                        <p className="text-[10.5px] text-neutral-400 leading-normal font-medium leading-relaxed">
                          Connect this studio app to a Google Sheets database to sync your users, tournament setups, and matches in real-time. This allows OBS Studio overlays running in different browser profiles or other devices to stay perfectly in sync.
                        </p>
                        <div className="space-y-2">
                          <label className="text-[9px] text-[#999] uppercase font-bold block mb-1">Google Apps Script Web App URL</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={gasUrlInput}
                              onChange={(e) => setGasUrlInput(e.target.value)}
                              placeholder="e.g. https://script.google.com/macros/s/XXXX/exec"
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={handleSaveGasUrl}
                              className="bg-amber-500 hover:bg-amber-600 font-extrabold text-neutral-950 px-4 py-2 rounded uppercase text-[10.5px] transition"
                            >
                              Save URL
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-neutral-850 text-[10.5px]">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-neutral-500 block">Database Status:</span>
                            <span className={gasUrlInput ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                              {gasUrlInput ? "Connected to Cloud Database" : "Using Local Offline Storage Only"}
                            </span>
                          </div>
                          {gasUrlInput && (
                            <button
                              type="button"
                              onClick={handleInitGasDatabase}
                              disabled={initializingGasDb}
                              className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white px-3.5 py-1.5 rounded uppercase text-[9.5px] transition flex items-center gap-1.5"
                            >
                              {initializingGasDb ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Initializing...
                                </>
                              ) : (
                                "Initialize Sheets Structure"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-12 gap-5">
                      {/* ADMIN-ONLY SECTION: USER CREATION & MANAGEMENT LIST */}
                      {currentUser?.role === "admin" ? (
                        <>
                          {/* Create/Edit Form */}
                          <form onSubmit={handleRegisterUserLocal} className="col-span-12 md:col-span-4 bg-[#111422] p-4 rounded-xl border border-neutral-800 space-y-3">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block border-b border-neutral-850 pb-1.5 flex items-center gap-2">
                              <Plus className="w-3.5 h-3.5" /> Add / Edit Account
                            </span>
                            
                            <div>
                              <label className="text-[9px] text-[#999] uppercase font-bold block mb-1">Username *</label>
                              <input
                                type="text"
                                required
                                value={newUserRegUser}
                                onChange={(e) => setNewUserRegUser(e.target.value)}
                                placeholder="e.g. operator_stadium"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] text-[#999] uppercase font-bold block mb-1 font-semibold">Role *</label>
                              <select
                                value={newUserRegRole}
                                onChange={(e) => setNewUserRegRole(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-850 rounded p-2 text-white font-bold"
                              >
                                <option value="operator">Operator (Standard)</option>
                                <option value="admin">Admin (Full Control)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] text-[#999] uppercase font-bold block mb-1">Password *</label>
                              <input
                                type="text"
                                required
                                value={newUserRegPass}
                                onChange={(e) => setNewUserRegPass(e.target.value)}
                                placeholder="e.g. secret123"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] text-[#999] uppercase font-bold block mb-1">Email</label>
                              <input
                                type="email"
                                value={newUserRegEmail}
                                onChange={(e) => setNewUserRegEmail(e.target.value)}
                                placeholder="e.g. user@stadium.co"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-[#999] uppercase font-bold block mb-1 font-semibold">Start Date</label>
                                <input
                                  type="date"
                                  value={newUserRegStart}
                                  onChange={(e) => setNewUserRegStart(e.target.value)}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-[#999] uppercase font-bold block mb-1 font-semibold">Exp End Date</label>
                                <input
                                  type="date"
                                  value={newUserRegExp}
                                  onChange={(e) => setNewUserRegExp(e.target.value)}
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] text-[#999] uppercase font-bold block mb-1 font-semibold">Notes</label>
                              <input
                                type="text"
                                value={newUserRegNotes}
                                onChange={(e) => setNewUserRegNotes(e.target.value)}
                                placeholder="e.g. Arena manager"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-amber-500 hover:bg-amber-600 font-extrabold text-neutral-950 p-2 rounded uppercase text-[10.5px] transition"
                            >
                              Add / Update Account
                            </button>
                          </form>

                          {/* Accounts List Grid */}
                          <div className="col-span-12 md:col-span-8 overflow-x-auto bg-[#10131e] border border-neutral-800 rounded-xl p-4 space-y-3">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block border-b border-neutral-850 pb-1.5">
                              Registered Accounts List
                            </span>
                            <table className="w-full text-left border-collapse text-[10.5px]">
                              <thead>
                                <tr className="border-b border-neutral-850 text-[10px] text-neutral-450 uppercase select-none font-black font-sans bg-neutral-900/40">
                                  <th className="p-2">User details</th>
                                  <th className="p-2">Role</th>
                                  <th className="p-2">Password</th>
                                  <th className="p-2">Validity</th>
                                  <th className="p-2 text-center">Status</th>
                                  <th className="p-2 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {userDatabase.map((acct, idx) => {
                                  const expDateObject = acct.exp ? new Date(acct.exp) : null;
                                  const isExpired = expDateObject ? (new Date() > expDateObject) : false;
                                  return (
                                    <tr key={acct.username + idx} className="border-b border-neutral-850 hover:bg-neutral-900/10 font-mono">
                                      <td className="p-2 flex flex-col">
                                        <span className="font-sans font-black text-amber-500 text-xs uppercase">{acct.username}</span>
                                        <span className="text-[9.5px] text-neutral-450 select-none">{acct.email || "No email"}</span>
                                        <span className="text-[9px] text-[#666] italic select-none">Last login: {acct.lastLogin || "Never"}</span>
                                      </td>
                                      <td className="p-2 font-sans">
                                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase ${
                                          acct.role === "admin" 
                                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                        }`}>
                                          {acct.role || "operator"}
                                        </span>
                                      </td>
                                      <td className="p-2 text-neutral-300 font-semibold select-all">
                                        {acct.pass}
                                      </td>
                                      <td className="p-2 font-mono text-[9.5px] text-neutral-450 flex flex-col">
                                        <span>From: {acct.start || "Unset"}</span>
                                        <span>End: {acct.exp || "Infinity"}</span>
                                      </td>
                                      <td className="p-2 text-center">
                                        {isExpired ? (
                                          <span className="bg-red-500/15 text-red-500 font-black border border-red-500/35 uppercase text-[8px] px-1.5 py-0.5 rounded animate-pulse">EXPIRED</span>
                                        ) : (
                                          <span className="bg-emerald-500/15 text-emerald-400 font-black border border-emerald-500/35 uppercase text-[8px] px-1.5 py-0.5 rounded">ACTIVE</span>
                                        )}
                                      </td>
                                      <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setNewUserRegUser(acct.username);
                                              setNewUserRegPass(acct.pass);
                                              setNewUserRegEmail(acct.email || "");
                                              setNewUserRegRole(acct.role || "operator");
                                              setNewUserRegStart(acct.start || "2026-01-01");
                                              setNewUserRegExp(acct.exp || "2036-12-31");
                                              setNewUserRegNotes(acct.note || "");
                                            }}
                                            className="p-1 hover:bg-amber-500/15 text-neutral-400 hover:text-amber-500 rounded transition"
                                            title="Edit user details"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUserLocal(acct.username)}
                                            className="p-1 hover:bg-red-500/15 text-neutral-400 hover:text-red-500 rounded transition"
                                            title="Delete account"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : null}

                      {/* PASSWORD CHANGE SECTION (Visible to everyone) */}
                      <form 
                        onSubmit={handleChangeOwnPassword} 
                        className={`bg-[#111422] p-4 rounded-xl border border-neutral-850 space-y-3 ${
                          currentUser?.role === "admin" 
                            ? "col-span-12 md:col-span-4" 
                            : "col-span-12 md:col-span-6 md:col-start-4"
                        }`}
                      >
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block border-b border-neutral-850 pb-1.5 flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5" /> Change Your Password
                        </span>

                        {changePassStatus && (
                          <div className={`p-2 rounded text-[10px] font-bold uppercase ${
                            changePassStatus.includes("success") 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}>
                            {changePassStatus}
                          </div>
                        )}

                        <div>
                          <label className="text-[9px] text-[#999] uppercase font-bold block mb-1">Current Password *</label>
                          <input
                            type="password"
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-[#999] uppercase font-bold block mb-1">New Password *</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-600 font-extrabold text-neutral-950 p-2 rounded uppercase text-[10.5px] transition"
                        >
                          Update Password
                        </button>
                      </form>

                      {/* Operator database message */}
                      {currentUser?.role !== "admin" && (
                        <div className="col-span-12 md:col-span-6 md:col-start-4 bg-neutral-900/50 border border-neutral-850 p-4 rounded-xl space-y-2 select-none">
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block border-b border-neutral-850 pb-1.5 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" /> Database Scope
                          </span>
                          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                            You are logged in as <strong className="text-white uppercase font-black font-mono">{currentUser?.username}</strong> with standard operator privileges.
                          </p>
                          <p className="text-[10.5px] text-neutral-450 leading-relaxed">
                            Your workspace data (Match Setup configurations, Tournament matches, squads, live overlay states) is completely isolated under your own local database partition. To configure or add users, contact your system administrator.
                          </p>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </section>

        {/* ========================================== */}
        {/* RIGHT COLUMN: SCREEN MONITOR & TRIGGER HUD */}
        {/* ========================================== */}
        <section className="col-span-12 xl:col-span-5 flex flex-col gap-5 overflow-hidden">
          
          {/* A. LIVE BROADCAST MONITOR (Real-time Video preview frame) */}
          <div id="panel-broadcast-monitor" className="bg-[#10131e] border border-neutral-850 rounded-xl overflow-hidden flex flex-col items-stretch relative">
            <div className="bg-neutral-900 px-4 py-3 flex items-center justify-between border-b border-neutral-850 select-none">
              <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-amber-500" /> LIVE BROADCAST OVERLAY MONITOR
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-black animate-pulse">
                RGB TRANSLUCENT PREVIEW
              </span>
            </div>

            {/* In-Frame Live scaled preview container */}
            <div className="aspect-video w-full bg-[#1b2531]/40 overflow-hidden relative border border-neutral-900/80 shadow-inner">
              <LiveGraphicsOverlay 
                appState={state} 
                showTransparentBackground={showTransparent} 
              />
            </div>
            
            <div className="bg-neutral-950 p-2.5 text-center text-[10.5px] font-bold text-neutral-500 border-t border-neutral-900 flex justify-between select-none">
              <span className="uppercase">OBS Canvas: 1920x1080 (16:9 ratio)</span>
              <span className="text-amber-500 uppercase">STANDALONE GRAPHIC CONTROLLER</span>
            </div>
          </div>

          {/* B. GRAPHICS TRIGGERS PANEL (Grid list for all 30 graphics with customize input keys) */}
          <div id="panel-graphics-triggers" className="flex-1 bg-[#10131e] border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-neutral-900 px-4 py-3 flex items-center justify-between border-b border-neutral-850 select-none">
              <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" /> GRAPHICS SCHEMES TRRIGERS (30 ON-SCREEN MODES)
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#999] font-bold">1-Click Layout</span>
            </div>

            {/* Dual Layout: Left (Inputs variables for selected) | Right (Grid list of 30 triggers) */}
            <div className="flex-1 grid grid-cols-12 overflow-hidden h-[360px] sm:h-auto">
              
              {/* Left Sub column: Variable customizable inputs */}
              <div className="col-span-12 md:col-span-5 border-b md:border-b-0 md:border-r border-neutral-850/80 p-4 overflow-y-auto space-y-4 max-h-[580px]">
                <div className="border-b border-neutral-850 pb-2">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Variable Input</span>
                  <h4 className="text-xs font-bold text-white uppercase">Live Overlay Parameters</h4>
                </div>

                {/* Scorer / Assist input text */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[9px] text-neutral-450 font-bold block mb-1 uppercase text-neutral-400">Selected Player Stats Viz</label>
                    <select
                      id="select-graphic-player-stats"
                      value={state.activeGraphicSettings.playerStatistics?.targetPlayerId}
                      onChange={(e) => updateGraphicSettings("playerStatistics", { targetPlayerId: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-800 rounded p-1.5 text-xs text-white"
                    >
                      {state.matchInfo.homeTeam.players.concat(state.matchInfo.awayTeam.players).map(p => (
                        <option key={p.id} value={p.id}>#{p.number} - {p.name} ({p.teamId === "home" ? "Home" : "Away"})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-neutral-450 font-bold block mb-1 uppercase text-neutral-400">MOTM Awardee</label>
                    <select
                      id="select-graphic-motm"
                      value={state.activeGraphicSettings.manOfTheMatch?.targetPlayerId}
                      onChange={(e) => updateGraphicSettings("manOfTheMatch", { targetPlayerId: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-800 rounded p-1.5 text-xs text-white"
                    >
                      {state.matchInfo.homeTeam.players.concat(state.matchInfo.awayTeam.players).map(p => (
                        <option key={p.id} value={p.id}>#{p.number} - {p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Squad & Lineup Config section */}
                  <div className="border-t border-neutral-850 pt-3 mt-3 space-y-3">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Squad & Lineup Config</span>
                    
                    <div>
                      <label className="text-[9px] font-bold block mb-1 uppercase text-neutral-400">Configure Players of Team</label>
                      <select
                        id="select-config-squad-team"
                        value={squadConfigTeam}
                        onChange={(e) => setSquadConfigTeam(e.target.value as "home" | "away")}
                        className="w-full bg-black/60 border border-neutral-800 rounded p-1.5 text-xs text-white"
                      >
                        <option value="home">Home Team ({state.matchInfo.homeTeam.name})</option>
                        <option value="away">Away Team ({state.matchInfo.awayTeam.name})</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold block mb-1 uppercase text-neutral-400">Formation Graphic Team</label>
                        <select
                          id="select-formation-team"
                          value={state.activeGraphicSettings.formationGraphic?.targetTeamId || "home"}
                          onChange={(e) => updateGraphicSettings("formationGraphic", { targetTeamId: e.target.value })}
                          className="w-full bg-black/60 border border-neutral-800 rounded p-1.5 text-[11px] text-white"
                        >
                          <option value="home">Home</option>
                          <option value="away">Away</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold block mb-1 uppercase text-neutral-400">Bench Graphic Team</label>
                        <select
                          id="select-bench-team"
                          value={state.activeGraphicSettings.benchGraphic?.targetTeamId || "home"}
                          onChange={(e) => updateGraphicSettings("benchGraphic", { targetTeamId: e.target.value })}
                          className="w-full bg-black/60 border border-neutral-800 rounded p-1.5 text-[11px] text-white"
                        >
                          <option value="home">Home</option>
                          <option value="away">Away</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold block uppercase text-neutral-400">Select Starting XI Players</label>
                      <div className="max-h-[220px] overflow-y-auto border border-neutral-800/85 rounded bg-black/40 p-2 space-y-1.5">
                        {(() => {
                          const activeTeam = squadConfigTeam === "home" ? state.matchInfo.homeTeam : state.matchInfo.awayTeam;
                          const starters = activeTeam.players.filter(p => p.isStarting);
                          return Array.from({ length: 11 }).map((_, idx) => {
                            const player = starters[idx];
                            return (
                              <div key={idx} className="flex items-center gap-2 text-[11px]">
                                <span className="w-5 text-neutral-500 font-mono text-[10px]">#{idx + 1}</span>
                                <select
                                  id={`select-starter-${squadConfigTeam}-${idx}`}
                                  value={player?.id || ""}
                                  onChange={(e) => handleUpdateStarter(squadConfigTeam, idx, e.target.value)}
                                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-xs text-white"
                                >
                                  {activeTeam.players.map(p => (
                                    <option key={p.id} value={p.id}>
                                      #{p.number} - {p.name} ({p.position}) {p.isStarting ? "[Starting]" : "[Bench]"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Lower third customize */}
                  <div className="border-t border-neutral-850 pt-2 space-y-2">
                    <span className="text-[9px] font-bold text-neutral-450 uppercase text-neutral-400">Custom Title L3 (Graphic 27)</span>
                    <input 
                      type="text" 
                      value={customL3Title} 
                      onChange={(e) => setCustomL3Title(e.target.value)} 
                      placeholder="PEP GUARDIOLA" 
                      className="w-full bg-black/60 border border-neutral-800 rounded p-1.5 text-xs text-white" 
                    />
                    <input 
                      type="text" 
                      value={customL3Sub} 
                      onChange={(e) => setCustomL3Sub(e.target.value)} 
                      placeholder="Manchester Blue Manager" 
                      className="w-full bg-black/60 border border-neutral-800 rounded p-1.5 text-xs text-white" 
                    />
                    <button onClick={() => applySettings("l3")} className="w-full bg-neutral-800 hover:bg-neutral-700 py-1 rounded text-[10px] uppercase font-black text-amber-500">
                      Apply L3 Settings
                    </button>
                  </div>

                  {/* News Ticker tape adjust */}
                  <div className="border-t border-neutral-850 pt-2 space-y-2">
                    <span className="text-[9px] font-bold text-neutral-450 uppercase text-neutral-400">Ticker Tape crawl (Graphic 28)</span>
                    <textarea 
                      value={tickerInputText} 
                      onChange={(e) => setTickerInputText(e.target.value)} 
                      className="w-full h-14 bg-black/60 border border-neutral-800 rounded p-1.5 text-xs text-white resize-none font-mono" 
                    />
                    <button onClick={() => applySettings("ticker")} className="w-full bg-neutral-800 hover:bg-neutral-700 py-1 rounded text-[10px] uppercase font-black text-amber-500">
                      Apply Ticker News
                    </button>
                  </div>

                  {/* VAR customizable incident */}
                  <div className="border-t border-neutral-850 pt-2 space-y-2">
                    <span className="text-[9px] font-bold text-neutral-455 uppercase text-neutral-400">VAR Alert parameters (Graphic 29)</span>
                    <input 
                      type="text" 
                      value={varText1} 
                      onChange={(e) => setVarText1(e.target.value)} 
                      className="w-full bg-black/60 border border-neutral-800 rounded p-1.5 text-xs text-white" 
                    />
                    <input 
                      type="text" 
                      value={varText2} 
                      onChange={(e) => setVarText2(e.target.value)} 
                      className="w-full bg-black/60 border border-neutral-800 rounded p-1.5 text-xs text-white" 
                    />
                    <button onClick={() => applySettings("var")} className="w-full bg-neutral-800 hover:bg-neutral-700 py-1 rounded text-[10px] uppercase font-black text-amber-500">
                      Apply VAR parameters
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Sub column: Grid showing 30 list keys */}
              <div className="col-span-12 md:col-span-7 p-4 overflow-y-auto max-h-[580px]">
                <div className="border-b border-neutral-855 pb-2 mb-3">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">GRAPHICS SWITCH</span>
                  <h4 className="text-xs font-bold text-white uppercase">Choose Active Graphics</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.keys(state.graphics).map((gKey, idx) => {
                    const typedKey = gKey as keyof ActiveGraphics;
                    const isActive = state.graphics[typedKey];
                    
                    // Human friendly label mapping
                    const labels: Record<keyof ActiveGraphics, string> = {
                      scoreBug: "1. Score Bug Banner",
                      matchIntro: "2. Full Grand Match Intro",
                      startingXI: "3. Starting XI Lineup (Home)",
                      startingXIAway: "4. Starting XI Lineup (Away)",
                      formationGraphic: "5. Tactical Pitch Formation",
                      teamLineup: "6. Active Lineups Comparison",
                      benchGraphic: "7. Squad Substitutes Bench",
                      goalGraphic: "8. Celebrations Goal Popup",
                      goalScorerGraphic: "9. Goal Scorer Lower-Third",
                      assistGraphic: "10. Goal Assist Information",
                      yellowCardGraphic: "11. Yellow Card Incident Card",
                      redCardGraphic: "12. Red Card Booking Card",
                      substitutionGraphic: "13. In / Out Substitutions",
                      matchStatistics: "14. Full Match Statistics",
                      possessionGraphic: "15. Mini Possession HUD Banner",
                      shotComparison: "16. Team Shots Target gauges",
                      cornerComparison: "17. Won Corners comparison",
                      teamComparison: "18. General Team Strength HUD",
                      playerStatistics: "19. Player Personal Metrics",
                      manOfTheMatch: "20. Special Man Of The Match",
                      halfTimeGraphic: "21. HT Scoreboard Score block",
                      fullTimeGraphic: "22. FT Scoreboard and history",
                      leagueTable: "23. Tournament Standings",
                      fixtures: "24. Rounds schedule checklist",
                      upcomingMatch: "25. Pre-game Upcoming promo",
                      tournamentBracket: "26. Knockout Playoff Brackets",
                      sponsorGraphic: "27. Bottom Sponsors Banner",
                      lowerThird: "28. Minimal Nameplate Third",
                      breakingNewsTicker: "29. News Crawler Bottom",
                      varReviewGraphic: "30. VAR Flashing check plate",
                      injuryTimeGraphic: "31. Stoppage Injury HUD banner",
                      resultGraphic: "32. Official Final Result Graphic"
                    };

                    return (
                      <button
                        key={gKey}
                        id={`btn-graphic-${gKey}`}
                        onClick={() => {
                          // For team-based starting lineup templates, force home/away selection
                          if (typedKey === "startingXI") {
                            updateGraphicSettings("startingXI", { targetTeamId: "home" });
                          } else if (typedKey === "startingXIAway") {
                            updateGraphicSettings("startingXIAway", { targetTeamId: "away" });
                          }
                          toggleGraphic(typedKey);
                        }}
                        className={`py-2 px-3 rounded-lg text-left font-semibold flex items-center justify-between transition border ${
                          isActive 
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300" 
                            : "bg-black/35 hover:bg-semibold border-neutral-850 text-neutral-300 hover:text-white"
                        }`}
                      >
                        <span className="truncate max-w-[200px]">{labels[typedKey]}</span>
                        <span className={`w-2 h-2 rounded-full ${isActive ? "bg-amber-400 animate-pulse" : "bg-neutral-700"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* 3. KEYBOARD SHORTCUTS INSTRUCTIONS overlay dialog */}
      {showKeyboardHelp && (
        <div id="dialog-keyboard-help" className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#10131e] border-2 border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter border-b border-neutral-800 pb-2 mb-4">
              Keyboard Shortcuts HUD Panel
            </h3>
            <div className="space-y-3.5 text-sm text-neutral-300 font-mono">
              <div className="flex justify-between items-center bg-black/40 p-2 rounded">
                <span className="font-bold text-amber-500">S (Key)</span>
                <span>Pause / Resume Match Clock</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded">
                <span className="font-bold text-amber-500">G (Key)</span>
                <span>Fast Score GOAL for Home team</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded">
                <span className="font-bold text-amber-500">A (Key)</span>
                <span>Fast Score GOAL for Away team</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded">
                <span className="font-bold text-amber-500">B (Key)</span>
                <span>Toggle Score Bug Overlay</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded">
                <span className="font-bold text-amber-500">N (Key)</span>
                <span>Toggle Bottom News Crawler</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded">
                <span className="font-bold text-amber-500">U (Key)</span>
                <span>Undo Last Recorded Match Incident</span>
              </div>
            </div>
            <button 
              id="dialog-close-keyboard"
              onClick={() => setShowKeyboardHelp(false)} 
              className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black py-2.5 rounded-lg text-xs tracking-wide uppercase transition"
            >
              OK, CLOSE SHORTCUT HUD
            </button>
          </div>
        </div>
      )}

      {/* 4. FOOTER CREDITS */}
      <footer className="bg-[#0b0c13] text-center py-3 text-neutral-500 text-[10.5px] border-t border-neutral-850 uppercase font-semibold">
         standalone premier broadcast television system suite © 2026. no external VM plugins required.
      </footer>
    </div>
  );
};
