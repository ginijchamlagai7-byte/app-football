export enum Position {
  GK = "Goalkeeper",
  DEF = "Defender",
  MID = "Midfielder",
  FWD = "Forward"
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: Position;
  teamId: string; // "home" | "away"
  isCaptain: boolean;
  isStarting: boolean;
  
  // Player Stats
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passesCompleted: number;
  saves: number;
  fouls: number;
  offsides: number;
  minutesPlayed: number;
}

export interface Team {
  id: string; // "home" | "away"
  name: string;
  shortName: string;
  color: string;
  secondaryColor: string;
  logoUrl: string;
  formation: string; // e.g. "4-3-3"
  players: Player[];
}

export interface TournamentTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  color: string;
  secondaryColor: string;
  
  // Standings state
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  fairPlayPoints: number; // calculated from yellow (-1) & red (-3) cards
}

export interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  venue: string;
  date: string;
  time: string;
  matchNumber: number;
}

export interface MatchInfo {
  tournamentName: string;
  season: string;
  matchNumber: number;
  venue: string;
  date: string;
  time: string;
  referee: string;
  assistantReferee1: string;
  assistantReferee2: string;
  fourthOfficial: string;
  sponsorName: string;
  sponsorLogoUrl: string;
  homeTeam: Team;
  awayTeam: Team;
}

export enum MatchEventType {
  START_MATCH = "START_MATCH",
  PAUSE_MATCH = "PAUSE_MATCH",
  RESUME_MATCH = "RESUME_MATCH",
  PERIOD_END = "PERIOD_END",
  PERIOD_START = "PERIOD_START",
  GOAL = "GOAL",
  OWN_GOAL = "OWN_GOAL",
  PENALTY_GOAL = "PENALTY_GOAL",
  PENALTY_MISSED = "PENALTY_MISSED",
  YELLOW_CARD = "YELLOW_CARD",
  SECOND_YELLOW = "SECOND_YELLOW",
  RED_CARD = "RED_CARD",
  SUBSTITUTION = "SUBSTITUTION",
  INJURY = "INJURY",
  VAR_REVIEW = "VAR_REVIEW",
  VAR_OVERTURNED = "VAR_OVERTURNED",
  OFFSIDE = "OFFSIDE",
  FREE_KICK = "FREE_KICK",
  CORNER_KICK = "CORNER_KICK",
  PENALTY_AWARDED = "PENALTY_AWARDED",
  SAVE = "SAVE",
  SHOT_ON_TARGET = "SHOT_ON_TARGET",
  SHOT_OFF_TARGET = "SHOT_OFF_TARGET",
  FOUL = "FOUL",
  HANDBALL = "HANDBALL",
  MATCH_INCIDENT = "MATCH_INCIDENT"
}

export interface MatchEvent {
  id: string;
  timestamp: string; // real time
  matchMinute: number;
  matchSecond: number;
  period: "PRE" | "1H" | "HT" | "2H" | "FT" | "ET1" | "ET_HT" | "ET2" | "ET_FT" | "PEN";
  type: MatchEventType;
  teamId?: "home" | "away";
  primaryPlayerId?: string; // e.g. goalscorer, carded player, sub out
  secondaryPlayerId?: string; // e.g. assist, sub in
  customDetail?: string; // description or VAR detail
  xgValue?: number; // expected goals changes
}

export interface MatchStats {
  possessionHome: number;
  xgHome: number;
  xgAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  cornersHome: number;
  cornersAway: number;
  foulsHome: number;
  foulsAway: number;
  offsidesHome: number;
  offsidesAway: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  redCardsHome: number;
  redCardsAway: number;
  savesHome: number;
  savesAway: number;
  passAccuracyHome: number;
  passAccuracyAway: number;
}

export interface GraphicToggle {
  id: string;
  isActive: boolean;
  name: string;
  category: "Match Flow" | "Team Assets" | "In-Match Trigger" | "Match Stats" | "Tournament Info" | "Custom";
  duration?: number; // auto-hide after seconds (optional)
  customText1?: string;
  customText2?: string;
  targetPlayerId?: string;
  targetTeamId?: "home" | "away";
}

export interface ActiveGraphics {
  scoreBug: boolean;
  matchIntro: boolean;
  startingXI: boolean;
  startingXIAway: boolean;
  formationGraphic: boolean;
  teamLineup: boolean;
  benchGraphic: boolean;
  goalGraphic: boolean;
  goalScorerGraphic: boolean;
  assistGraphic: boolean;
  yellowCardGraphic: boolean;
  redCardGraphic: boolean;
  substitutionGraphic: boolean;
  matchStatistics: boolean;
  possessionGraphic: boolean;
  shotComparison: boolean;
  cornerComparison: boolean;
  teamComparison: boolean;
  playerStatistics: boolean;
  manOfTheMatch: boolean;
  halfTimeGraphic: boolean;
  fullTimeGraphic: boolean;
  leagueTable: boolean;
  fixtures: boolean;
  upcomingMatch: boolean;
  tournamentBracket: boolean;
  sponsorGraphic: boolean;
  lowerThird: boolean;
  breakingNewsTicker: boolean;
  varReviewGraphic: boolean;
  injuryTimeGraphic: boolean;
  resultGraphic: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  season: string;
  logoUrl: string;
  organizer: string;
  venue: string;
  notes: string;
}

export interface Venue {
  id: string;
  name: string;
}

export interface PenaltyShootoutState {
  enabled: boolean;
  homeKicks: ("scored" | "missed" | "none")[];
  awayKicks: ("scored" | "missed" | "none")[];
  homeScore: number;
  awayScore: number;
  currentKickerIndex: number;
  currentTeam: "home" | "away";
}

export interface AppState {
  matchInfo: MatchInfo;
  period: "PRE" | "1H" | "HT" | "2H" | "FT" | "ET1" | "ET_HT" | "ET2" | "ET_FT" | "PEN";
  matchMinute: number;
  matchSecond: number;
  stoppageMinutes: number;
  isClockRunning: boolean;
  timeline: MatchEvent[];
  stats: MatchStats;
  graphics: ActiveGraphics;
  activeGraphicSettings: Record<keyof ActiveGraphics, {
    customText1?: string;
    customText2?: string;
    targetPlayerId?: string;
    targetTeamId?: "home" | "away";
  }>;
  tournamentTeams: TournamentTeam[];
  fixtures: Fixture[];
  newsTickerText: string;
  // Extended configuration fields
  tournaments: Tournament[];
  activeTournamentId: string;
  venues: Venue[];
  playerMode: "A" | "B"; // MODE A: Full Player, MODE B: Simple Match
  simplifiedGraphicsMode: boolean; // Hide advanced graphics when true
  matchResultStatus: "HOME_WIN" | "AWAY_WIN" | "DRAW" | "ABANDONED" | "SUSPENDED" | null;
  activeTheme?: string;
  themePrimaryBgColor?: string;
  themeSecondaryBgColor?: string;
  themeTextColor?: string;
  penaltyShootout?: PenaltyShootoutState;
}

