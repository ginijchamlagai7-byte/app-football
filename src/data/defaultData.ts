import { Team, Position, Player, TournamentTeam, Fixture } from "../types";

export const DEFAULT_PLAYERS_HOME: Player[] = [
  // Starters
  { id: "h1", name: "Ederson Moraes", number: 31, position: Position.GK, teamId: "home", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 32, passesCompleted: 29, saves: 4, fouls: 0, offsides: 0, minutesPlayed: 90 },
  { id: "h2", name: "Kyle Walker", number: 2, position: Position.DEF, teamId: "home", isCaptain: true, isStarting: true, goals: 0, assists: 0, yellowCards: 1, redCards: 0, shots: 1, shotsOnTarget: 0, passes: 45, passesCompleted: 40, saves: 0, fouls: 1, offsides: 0, minutesPlayed: 90 },
  { id: "h3", name: "Rúben Dias", number: 3, position: Position.DEF, teamId: "home", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 61, passesCompleted: 58, saves: 0, fouls: 1, offsides: 0, minutesPlayed: 90 },
  { id: "h4", name: "Manuel Akanji", number: 25, position: Position.DEF, teamId: "home", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 54, passesCompleted: 50, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 90 },
  { id: "h5", name: "Joško Gvardiol", number: 24, position: Position.DEF, teamId: "home", isCaptain: false, isStarting: true, goals: 1, assists: 0, yellowCards: 0, redCards: 0, shots: 2, shotsOnTarget: 1, passes: 51, passesCompleted: 46, saves: 0, fouls: 2, offsides: 0, minutesPlayed: 90 },
  { id: "h6", name: "Rodri", number: 16, position: Position.MID, teamId: "home", isCaptain: false, isStarting: true, goals: 0, assists: 1, yellowCards: 0, redCards: 0, shots: 1, shotsOnTarget: 0, passes: 87, passesCompleted: 82, saves: 0, fouls: 1, offsides: 0, minutesPlayed: 90 },
  { id: "h7", name: "Kevin De Bruyne", number: 17, position: Position.MID, teamId: "home", isCaptain: false, isStarting: true, goals: 0, assists: 1, yellowCards: 0, redCards: 0, shots: 3, shotsOnTarget: 1, passes: 53, passesCompleted: 45, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 75 },
  { id: "h8", name: "Bernardo Silva", number: 20, position: Position.MID, teamId: "home", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 48, passesCompleted: 44, saves: 0, fouls: 1, offsides: 0, minutesPlayed: 90 },
  { id: "h9", name: "Phil Foden", number: 47, position: Position.FWD, teamId: "home", isCaptain: false, isStarting: true, goals: 1, assists: 0, yellowCards: 0, redCards: 0, shots: 4, shotsOnTarget: 2, passes: 39, passesCompleted: 35, saves: 0, fouls: 0, offsides: 1, minutesPlayed: 80 },
  { id: "h10", name: "Erling Haaland", number: 9, position: Position.FWD, teamId: "home", isCaptain: false, isStarting: true, goals: 2, assists: 0, yellowCards: 1, redCards: 0, shots: 6, shotsOnTarget: 4, passes: 14, passesCompleted: 11, saves: 0, fouls: 2, offsides: 2, minutesPlayed: 90 },
  { id: "h11", name: "Jérémy Doku", number: 11, position: Position.FWD, teamId: "home", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 1, shotsOnTarget: 1, passes: 28, passesCompleted: 24, saves: 0, fouls: 1, offsides: 1, minutesPlayed: 70 },
  
  // Bench
  { id: "h12", name: "Stefan Ortega", number: 18, position: Position.GK, teamId: "home", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 0, passesCompleted: 0, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 0 },
  { id: "h13", name: "John Stones", number: 5, position: Position.DEF, teamId: "home", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 0, passesCompleted: 0, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 0 },
  { id: "h14", name: "Mateo Kovačić", number: 8, position: Position.MID, teamId: "home", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 8, passesCompleted: 8, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 15 },
  { id: "h15", name: "Matheus Nunes", number: 27, position: Position.MID, teamId: "home", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 0, passesCompleted: 0, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 0 },
  { id: "h16", name: "Savinho", number: 26, position: Position.FWD, teamId: "home", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 1, shotsOnTarget: 0, passes: 5, passesCompleted: 4, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 20 },
  { id: "h17", name: "Jack Grealish", number: 10, position: Position.FWD, teamId: "home", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 6, passesCompleted: 5, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 10 }
];

export const DEFAULT_PLAYERS_AWAY: Player[] = [
  // Starters
  { id: "a1", name: "David Raya", number: 22, position: Position.GK, teamId: "away", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 28, passesCompleted: 22, saves: 5, fouls: 0, offsides: 0, minutesPlayed: 90 },
  { id: "a2", name: "Ben White", number: 4, position: Position.DEF, teamId: "away", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 1, shotsOnTarget: 0, passes: 39, passesCompleted: 32, saves: 0, fouls: 1, offsides: 0, minutesPlayed: 90 },
  { id: "a3", name: "William Saliba", number: 2, position: Position.DEF, teamId: "away", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 48, passesCompleted: 45, saves: 0, fouls: 1, offsides: 0, minutesPlayed: 90 },
  { id: "a4", name: "Gabriel Magalhães", number: 6, position: Position.DEF, teamId: "away", isCaptain: false, isStarting: true, goals: 1, assists: 0, yellowCards: 1, redCards: 0, shots: 2, shotsOnTarget: 1, passes: 41, passesCompleted: 38, saves: 0, fouls: 1, offsides: 0, minutesPlayed: 90 },
  { id: "a5", name: "Jurriën Timber", number: 12, position: Position.DEF, teamId: "away", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 29, passesCompleted: 24, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 80 },
  { id: "a6", name: "Thomas Partey", number: 5, position: Position.MID, teamId: "away", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 1, shotsOnTarget: 0, passes: 42, passesCompleted: 37, saves: 0, fouls: 2, offsides: 0, minutesPlayed: 90 },
  { id: "a7", name: "Declan Rice", number: 41, position: Position.MID, teamId: "away", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 1, redCards: 0, shots: 1, shotsOnTarget: 0, passes: 49, passesCompleted: 44, saves: 0, fouls: 3, offsides: 0, minutesPlayed: 90 },
  { id: "a8", name: "Martin Ødegaard", number: 8, position: Position.MID, teamId: "away", isCaptain: true, isStarting: true, goals: 0, assists: 1, yellowCards: 0, redCards: 0, shots: 2, shotsOnTarget: 1, passes: 46, passesCompleted: 39, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 90 },
  { id: "a9", name: "Bukayo Saka", number: 7, position: Position.FWD, teamId: "away", isCaptain: false, isStarting: true, goals: 1, assists: 0, yellowCards: 0, redCards: 0, shots: 4, shotsOnTarget: 2, passes: 31, passesCompleted: 26, saves: 0, fouls: 1, offsides: 1, minutesPlayed: 85 },
  { id: "a10", name: "Kai Havertz", number: 29, position: Position.FWD, teamId: "away", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 2, shotsOnTarget: 1, passes: 19, passesCompleted: 14, saves: 0, fouls: 2, offsides: 2, minutesPlayed: 90 },
  { id: "a11", name: "Gabriel Martinelli", number: 11, position: Position.FWD, teamId: "away", isCaptain: false, isStarting: true, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 2, shotsOnTarget: 1, passes: 22, passesCompleted: 17, saves: 0, fouls: 1, offsides: 0, minutesPlayed: 65 },
  
  // Bench
  { id: "a12", name: "Neto", number: 32, position: Position.GK, teamId: "away", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 0, passesCompleted: 0, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 0 },
  { id: "a13", name: "Riccardo Calafiori", number: 33, position: Position.DEF, teamId: "away", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 3, passesCompleted: 3, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 10 },
  { id: "a14", name: "Jorginho", number: 20, position: Position.MID, teamId: "away", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 0, passesCompleted: 0, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 0 },
  { id: "a15", name: "Raheem Sterling", number: 30, position: Position.FWD, teamId: "away", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 2, passesCompleted: 1, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 5 },
  { id: "a16", name: "Leandro Trossard", number: 19, position: Position.FWD, teamId: "away", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 1, shotsOnTarget: 1, passes: 7, passesCompleted: 5, saves: 0, fouls: 1, offsides: 0, minutesPlayed: 25 },
  { id: "a17", name: "Gabriel Jesus", number: 9, position: Position.FWD, teamId: "away", isCaptain: false, isStarting: false, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passes: 0, passesCompleted: 0, saves: 0, fouls: 0, offsides: 0, minutesPlayed: 0 }
];

export const DEFAULT_REFEREES = {
  referee: "Michael Oliver (ENG)",
  assistantReferee1: "Stuart Burt (ENG)",
  assistantReferee2: "Dan Cook (ENG)",
  fourthOfficial: "John Brooks (ENG)"
};

export const DEFAULT_TOURNAMENT_NAME = "Premier Champions Elite Cup";
export const DEFAULT_SEASON = "2026/27";

export const DEFAULT_TOURNAMENT_TEAMS: TournamentTeam[] = [
  { id: "home", name: "Manchester Blue", shortName: "MCI", color: "#6cabdd", secondaryColor: "#1c2c5b", logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg", played: 12, won: 9, drawn: 2, lost: 1, goalsFor: 32, goalsAgainst: 12, points: 29, fairPlayPoints: 120 },
  { id: "away", name: "London Red", shortName: "ARS", color: "#ef0107", secondaryColor: "#063672", logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg", played: 12, won: 8, drawn: 3, lost: 1, goalsFor: 28, goalsAgainst: 10, points: 27, fairPlayPoints: 115 },
  { id: "merseyside", name: "Merseyside Red", shortName: "LIV", color: "#c8102e", secondaryColor: "#f6eb61", logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg", played: 12, won: 8, drawn: 2, lost: 2, goalsFor: 26, goalsAgainst: 13, points: 26, fairPlayPoints: 108 },
  { id: "chelsea", name: "West London Blue", shortName: "CHE", color: "#034694", secondaryColor: "#ee242c", logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg", played: 12, won: 6, drawn: 4, lost: 2, goalsFor: 23, goalsAgainst: 17, points: 22, fairPlayPoints: 94 },
  { id: "spurs", name: "North London White", shortName: "TOT", color: "#132257", secondaryColor: "#ffffff", logoUrl: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg", played: 12, won: 6, drawn: 2, lost: 4, goalsFor: 21, goalsAgainst: 18, points: 20, fairPlayPoints: 88 },
  { id: "villa", name: "Birmingham Claret", shortName: "AVL", color: "#95bfe5", secondaryColor: "#670e36", logoUrl: "https://upload.wikimedia.org/wikipedia/en/a/a2/Aston_Villa_F.C._crest_2024.svg", played: 12, won: 5, drawn: 4, lost: 3, goalsFor: 19, goalsAgainst: 16, points: 19, fairPlayPoints: 85 },
  { id: "skysports", name: "Newcastle Black/White", shortName: "NEW", color: "#241f20", secondaryColor: "#41b6e6", logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg", played: 12, won: 5, drawn: 3, lost: 4, goalsFor: 18, goalsAgainst: 15, points: 18, fairPlayPoints: 79 },
  { id: "manutd", name: "Manchester Red", shortName: "MUN", color: "#da291c", secondaryColor: "#000000", logoUrl: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg", played: 12, won: 4, drawn: 3, lost: 5, goalsFor: 15, goalsAgainst: 19, points: 15, fairPlayPoints: 72 }
];

export const DEFAULT_FIXTURES: Fixture[] = [
  { id: "fix1", homeTeamId: "home", awayTeamId: "away", status: "LIVE", venue: "Etihad Stadium, Manchester", date: "2026-06-16", time: "19:45", matchNumber: 45 },
  { id: "fix2", homeTeamId: "merseyside", awayTeamId: "chelsea", homeScore: 2, awayScore: 1, status: "COMPLETED", venue: "Anfield, Liverpool", date: "2026-06-15", time: "15:00", matchNumber: 43 },
  { id: "fix3", homeTeamId: "spurs", awayTeamId: "villa", homeScore: 2, awayScore: 2, status: "COMPLETED", venue: "Tottenham Hotspur Stadium, London", date: "2026-06-14", time: "16:30", matchNumber: 42 },
  { id: "fix4", homeTeamId: "skysports", awayTeamId: "manutd", status: "UPCOMING", venue: "St. James' Park, Newcastle", date: "2026-06-17", time: "20:00", matchNumber: 46 },
  { id: "fix5", homeTeamId: "away", awayTeamId: "merseyside", status: "UPCOMING", venue: "Emirates Stadium, London", date: "2026-06-20", time: "12:30", matchNumber: 47 },
  { id: "fix6", homeTeamId: "chelsea", awayTeamId: "home", status: "UPCOMING", venue: "Stamford Bridge, London", date: "2026-06-21", time: "16:00", matchNumber: 48 }
];

// Coordinate layouts for formation pitch viz (measured as percentages center layout [x: 5% - 95%, y: 5% - 95%])
// Team faces UPWARDS for "away" and DOWNWARDS for "home" depending on graphic, or we draw unified formations side by side.
// Let's define the standard formation coordinates (on a standard 100 wide x 100 high layout) which is perfect for rendering.
export interface FormationPos {
  positionName: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export const FORMATIONS_MAP: Record<string, FormationPos[]> = {
  "4-4-2": [
    { positionName: "GK", x: 50, y: 90 },
    { positionName: "LB", x: 15, y: 72 },
    { positionName: "LCB", x: 38, y: 75 },
    { positionName: "RCB", x: 62, y: 75 },
    { positionName: "RB", x: 85, y: 72 },
    { positionName: "LM", x: 15, y: 45 },
    { positionName: "LCM", x: 38, y: 48 },
    { positionName: "RCM", x: 62, y: 48 },
    { positionName: "RM", x: 85, y: 45 },
    { positionName: "LS", x: 35, y: 18 },
    { positionName: "RS", x: 65, y: 18 }
  ],
  "4-3-3": [
    { positionName: "GK", x: 50, y: 90 },
    { positionName: "LB", x: 15, y: 72 },
    { positionName: "LCB", x: 38, y: 75 },
    { positionName: "RCB", x: 62, y: 75 },
    { positionName: "RB", x: 85, y: 72 },
    { positionName: "LCM", x: 28, y: 48 },
    { positionName: "CM", x: 50, y: 52 },
    { positionName: "RCM", x: 72, y: 48 },
    { positionName: "LW", x: 20, y: 20 },
    { positionName: "ST", x: 50, y: 15 },
    { positionName: "RW", x: 80, y: 20 }
  ],
  "3-5-2": [
    { positionName: "GK", x: 50, y: 90 },
    { positionName: "LCB", x: 25, y: 75 },
    { positionName: "CB", x: 50, y: 78 },
    { positionName: "RCB", x: 75, y: 75 },
    { positionName: "LWB", x: 12, y: 52 },
    { positionName: "LCM", x: 32, y: 50 },
    { positionName: "DM", x: 50, y: 58 },
    { positionName: "RCM", x: 68, y: 50 },
    { positionName: "RWB", x: 88, y: 52 },
    { positionName: "LS", x: 35, y: 20 },
    { positionName: "RS", x: 65, y: 20 }
  ],
  "4-2-3-1": [
    { positionName: "GK", x: 50, y: 90 },
    { positionName: "LB", x: 15, y: 72 },
    { positionName: "LCB", x: 38, y: 75 },
    { positionName: "RCB", x: 62, y: 75 },
    { positionName: "RB", x: 85, y: 72 },
    { positionName: "LDM", x: 35, y: 56 },
    { positionName: "RDM", x: 65, y: 56 },
    { positionName: "LAM", x: 22, y: 35 },
    { positionName: "AM", x: 50, y: 32 },
    { positionName: "RAM", x: 78, y: 35 },
    { positionName: "ST", x: 50, y: 15 }
  ],
  "5-3-2": [
    { positionName: "GK", x: 50, y: 90 },
    { positionName: "LWB", x: 12, y: 68 },
    { positionName: "LCB", x: 31, y: 75 },
    { positionName: "CB", x: 50, y: 77 },
    { positionName: "RCB", x: 69, y: 75 },
    { positionName: "RWB", x: 88, y: 68 },
    { positionName: "LCM", x: 30, y: 46 },
    { positionName: "CM", x: 50, y: 50 },
    { positionName: "RCM", x: 70, y: 46 },
    { positionName: "LS", x: 35, y: 20 },
    { positionName: "RS", x: 65, y: 20 }
  ],
  "3-4-3": [
    { positionName: "GK", x: 50, y: 90 },
    { positionName: "LCB", x: 25, y: 75 },
    { positionName: "CB", x: 50, y: 78 },
    { positionName: "RCB", x: 75, y: 75 },
    { positionName: "LM", x: 15, y: 50 },
    { positionName: "LCM", x: 38, y: 52 },
    { positionName: "RCM", x: 62, y: 52 },
    { positionName: "RM", x: 85, y: 50 },
    { positionName: "LW", x: 22, y: 22 },
    { positionName: "ST", x: 50, y: 16 },
    { positionName: "RW", x: 78, y: 22 }
  ],
  "Custom": [
    { positionName: "GK", x: 50, y: 90 },
    { positionName: "D1", x: 20, y: 72 },
    { positionName: "D2", x: 40, y: 75 },
    { positionName: "D3", x: 60, y: 75 },
    { positionName: "D4", x: 80, y: 72 },
    { positionName: "M1", x: 30, y: 48 },
    { positionName: "M2", x: 50, y: 52 },
    { positionName: "M3", x: 70, y: 48 },
    { positionName: "F1", x: 25, y: 20 },
    { positionName: "F2", x: 50, y: 15 },
    { positionName: "F3", x: 75, y: 20 }
  ]
};
