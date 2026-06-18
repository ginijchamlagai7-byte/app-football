import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, Users, Play, AlertTriangle, ChevronRight, RefreshCw, BarChart2, Zap, 
  MapPin, Calendar, Clock, Award, ShieldAlert, Newspaper, HelpCircle, AlertCircle
} from "lucide-react";
import { AppState, Position, Player, MatchEvent, MatchEventType } from "../types";
import { FORMATIONS_MAP } from "../data/defaultData";

interface LiveGraphicsOverlayProps {
  appState: AppState;
  showTransparentBackground?: boolean;
  selectedResolution?: "1920x1080" | "2560x1440" | "3840x2160";
}

export const LiveGraphicsOverlay: React.FC<LiveGraphicsOverlayProps> = ({
  appState,
  showTransparentBackground = false,
  selectedResolution = "1920x1080"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Resize listener to fit 1920x1080 canvas in whatever viewport/container is provided
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const parentWidth = parent.clientWidth;
          const parentHeight = parent.clientHeight;
          // Calculate scale to fit while preserving 16:9 ratio
          const scaleX = parentWidth / 1920;
          const scaleY = parentHeight / 1080;
          const newScale = Math.min(scaleX, scaleY);
          setScale(newScale || 1);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    // Extra timeout trigger to ensure calculations are done after fonts are loaded
    const timeout = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, []);

  const { 
    matchInfo, period, matchMinute, matchSecond, stoppageMinutes, 
    isClockRunning, stats, graphics: rawGraphics, activeGraphicSettings, 
    tournamentTeams, fixtures, newsTickerText 
  } = appState;

  const graphics = appState.simplifiedGraphicsMode
    ? {
        scoreBug: !!rawGraphics.scoreBug,
        matchIntro: !!rawGraphics.matchIntro,
        startingXI: false,
        startingXIAway: false,
        formationGraphic: false,
        teamLineup: false,
        benchGraphic: false,
        goalGraphic: !!rawGraphics.goalGraphic,
        goalScorerGraphic: !!rawGraphics.goalScorerGraphic,
        assistGraphic: !!rawGraphics.assistGraphic,
        yellowCardGraphic: !!rawGraphics.yellowCardGraphic,
        redCardGraphic: !!rawGraphics.redCardGraphic,
        substitutionGraphic: false,
        matchStatistics: false,
        possessionGraphic: false,
        shotComparison: false,
        cornerComparison: false,
        teamComparison: false,
        playerStatistics: false,
        manOfTheMatch: false,
        halfTimeGraphic: !!rawGraphics.halfTimeGraphic,
        fullTimeGraphic: !!rawGraphics.fullTimeGraphic,
        leagueTable: false,
        fixtures: false,
        upcomingMatch: false,
        tournamentBracket: false,
        sponsorGraphic: false,
        lowerThird: !!rawGraphics.lowerThird,
        breakingNewsTicker: false,
        varReviewGraphic: false,
        injuryTimeGraphic: !!rawGraphics.injuryTimeGraphic,
        resultGraphic: !!rawGraphics.resultGraphic
      }
    : {
        ...rawGraphics,
        resultGraphic: !!rawGraphics.resultGraphic
      };

  const homeTeam = matchInfo.homeTeam;
  const awayTeam = matchInfo.awayTeam;

  // Real-time Style & Theme Engine Helper
  const getThemedContainerStyle = (defaultBorderColor: string) => {
    const activeTheme = appState.activeTheme || "classic";
    const customPrimaryBg = appState.themePrimaryBgColor;
    const customSecondaryBg = appState.themeSecondaryBgColor;
    const customTextColor = appState.themeTextColor;

    let backgroundValue = "#2b2b2b"; // Fallback default grey background
    let textColorValue = "#ffffff";   // Fallback default white text color
    let borderCol = defaultBorderColor;

    // 1. Resolve custom picker selections
    if (customPrimaryBg) {
      textColorValue = customTextColor || "#ffffff";
      if (customSecondaryBg) {
        backgroundValue = `linear-gradient(135deg, ${customPrimaryBg}, ${customSecondaryBg})`;
      } else {
        backgroundValue = customPrimaryBg;
      }
    } else {
      // 2. Resolve default preset templates
      switch (activeTheme) {
        case "slate_gray":
          backgroundValue = "linear-gradient(135deg, #1f293d, #374151)";
          textColorValue = "#f9fafb";
          borderCol = "#6b7280";
          break;
        case "classic":
          backgroundValue = "linear-gradient(135deg, #121829, #1a223f)";
          textColorValue = "#ffffff";
          borderCol = defaultBorderColor || "#3b82f6";
          break;
        case "cosmic":
          backgroundValue = "linear-gradient(135deg, #0d0e15, #1d1e2c)";
          textColorValue = "#f3f4f6";
          borderCol = "#8b5cf6"; // Cosmic glowing purple
          break;
        case "emerald_neon":
          backgroundValue = "linear-gradient(135deg, #022c22, #064e3b)";
          textColorValue = "#a7f3d0";
          borderCol = "#10b981"; // Neon emerald active borders
          break;
        case "luxury_gold":
          backgroundValue = "linear-gradient(135deg, #1c1917, #292524)";
          textColorValue = "#fbbf24"; // Premium amber gold accentuation
          borderCol = "#fbbf24"; 
          break;
        default:
          backgroundValue = "#2b2b2b";
          textColorValue = "#ffffff";
          borderCol = defaultBorderColor;
          break;
      }
    }

    return {
      background: backgroundValue,
      color: textColorValue,
      borderColor: borderCol
    };
  };

  // Helper to format minutes/seconds
  const pad = (num: number) => num.toString().padStart(2, "0");
  const formattedTime = `${pad(matchMinute)}:${pad(matchSecond)}`;

  // Find goal events specifically for scorers rendering
  const getGoalScorers = (teamId: "home" | "away") => {
    return appState.timeline.filter(
      evt => (evt.type === MatchEventType.GOAL || evt.type === MatchEventType.PENALTY_GOAL || evt.type === MatchEventType.OWN_GOAL) 
      && evt.teamId === teamId
    ).map(evt => {
      const isOG = evt.type === MatchEventType.OWN_GOAL;
      const player = homeTeam.players.concat(awayTeam.players).find(p => p.id === evt.primaryPlayerId);
      const isHomeOwnGoalOnAway = teamId === "home" && isOG; // Wait, own goal credited to opposing team's count
      return {
        name: player ? player.name.split(" ").pop() : "Unknown",
        minute: evt.matchMinute,
        isOG,
        isPenalty: evt.type === MatchEventType.PENALTY_GOAL
      };
    });
  };

  const homeGoals = getGoalScorers("home");
  const awayGoals = getGoalScorers("away");

  // Look up Yellow Card Details for disciplinary graphics display
  const yellowCardTeamId = activeGraphicSettings.yellowCardGraphic?.targetTeamId;
  const yellowCardPlayerId = activeGraphicSettings.yellowCardGraphic?.targetPlayerId;
  const yellowCardTeam = yellowCardTeamId === "home" ? homeTeam : (yellowCardTeamId === "away" ? awayTeam : null);
  const yellowCardPlayer = yellowCardTeam?.players.find(p => p.id === yellowCardPlayerId);

  // Look up Red Card Details for disciplinary graphics display
  const redCardTeamId = activeGraphicSettings.redCardGraphic?.targetTeamId;
  const redCardPlayerId = activeGraphicSettings.redCardGraphic?.targetPlayerId;
  const redCardTeam = redCardTeamId === "home" ? homeTeam : (redCardTeamId === "away" ? awayTeam : null);
  const redCardPlayer = redCardTeam?.players.find(p => p.id === redCardPlayerId);

  // Get player helpers
  const findPlayer = (id?: string) => {
    if (!id) return null;
    return homeTeam.players.concat(awayTeam.players).find(p => p.id === id) || null;
  };

  // Render variables
  const activeSponsor = matchInfo.sponsorName || "Championship Partner";

  return (
    <div 
      id="broadcast-overlay-root"
      className="relative w-full h-full overflow-hidden flex items-center justify-center select-none"
      style={{
        backgroundColor: showTransparentBackground ? "transparent" : "#0d1117",
        backgroundImage: showTransparentBackground 
          ? "none" 
          : "radial-gradient(circle at center, #1b2735 0%, #090a0f 100%)"
      }}
    >
      {/* 1920x1080 Design Canvas scaled accordingly */}
      <div
        ref={containerRef}
        id="resolution-locked-canvas"
        className="absolute origin-top-left"
        style={{
          width: "1920px",
          height: "1080px",
          transform: `scale(${scale})`,
          top: "50%",
          left: "50%",
          transformOrigin: "center center",
          transformBox: "border-box",
          // Re-center scaled content
          marginLeft: "-960px",
          marginTop: "-540px",
        }}
      >
        {/* ========================================================= */}
        {/* 1. SCORE BUG (Top-Left)                                    */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.scoreBug && (
            <motion.div
              id="graphic-scorebug"
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute top-12 left-16 flex items-center font-sans tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-white"
            >
              {/* Tournament Strip Above */}
              <div 
                className="absolute -top-7 left-0 bg-neutral-950/95 text-[10px] uppercase font-bold tracking-widest px-3 py-0.5 border-l-2 rounded-tr shadow-md"
                style={{ borderColor: getThemedContainerStyle("#fbbf24").borderColor }}
              >
                {matchInfo.tournamentName || "Live Match"}
              </div>

              {/* Home Team Code Block */}
              <div 
                className="flex items-center gap-2.5 px-4 h-11 border-l-4 font-extrabold text-[15px]"
                style={{ 
                  background: getThemedContainerStyle("#171a21").background, 
                  color: getThemedContainerStyle("#ffffff").color,
                  borderColor: homeTeam.color || "#000" 
                }}
              >
                {homeTeam.logoUrl ? (
                  <img src={homeTeam.logoUrl} className="w-[18px] h-[18px] object-contain" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full" style={{ backgroundColor: homeTeam.color }} />
                )}
                <span>{homeTeam.shortName || "HOM"}</span>
              </div>

               {/* Score Number Block */}
              <div 
                className="flex items-center justify-center text-white font-black text-xl h-11 px-4 min-w-[70px] border-r"
                style={{ 
                  background: getThemedContainerStyle("#111").background,
                  borderColor: getThemedContainerStyle("#333").borderColor
                }}
              >
                <span className="text-center">{stats.shotsHome >= 0 ? appState.timeline.filter(e => (e.type === MatchEventType.GOAL || e.type === MatchEventType.PENALTY_GOAL) && e.teamId === "home").length + appState.timeline.filter(e => e.type === MatchEventType.OWN_GOAL && e.teamId === "away").length : 0}</span>
                <span className="text-neutral-500 mx-1.5 font-normal text-sm">:</span>
                <span className="text-center">{stats.shotsAway >= 0 ? appState.timeline.filter(e => (e.type === MatchEventType.GOAL || e.type === MatchEventType.PENALTY_GOAL) && e.teamId === "away").length + appState.timeline.filter(e => e.type === MatchEventType.OWN_GOAL && e.teamId === "home").length : 0}</span>
              </div>

              {/* Away Team Code Block */}
              <div 
                className="flex items-center gap-2.5 px-4 h-11 border-r-4 font-extrabold text-[15px]"
                style={{ 
                  background: getThemedContainerStyle("#171a21").background, 
                  color: getThemedContainerStyle("#ffffff").color,
                  borderColor: awayTeam.color || "#000" 
                }}
              >
                <span>{awayTeam.shortName || "AWY"}</span>
                {awayTeam.logoUrl ? (
                  <img src={awayTeam.logoUrl} className="w-[18px] h-[18px] object-contain" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full" style={{ backgroundColor: awayTeam.color }} />
                )}
              </div>

              {/* Time Indicator Block */}
              <div 
                className="flex items-center h-11 px-4 min-w-[100px] border-r-2"
                style={{ 
                  background: getThemedContainerStyle("#121212").background,
                  color: getThemedContainerStyle("#ffffff").color,
                  borderColor: getThemedContainerStyle("#fbbf24").borderColor
                }}
              >
                <span className="font-mono font-bold text-base tracking-widest tabular-nums font-semibold">
                  {formattedTime}
                </span>
                
                {/* Clock indicator pulse */}
                {isClockRunning && (
                  <span className="relative flex h-2 w-2 ml-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              {/* Half / Stoppage Block */}
              <div className="bg-amber-500 text-neutral-950 font-black text-sm h-11 px-3.5 flex items-center justify-center rounded-r">
                <span className="mr-1">
                  {period === "PRE" ? "PRE" : 
                   period === "1H" ? "1ST" : 
                   period === "HT" ? "HT" : 
                   period === "2H" ? "2ND" : 
                   period === "ET1" ? "ET1" : 
                   period === "ET_HT" ? "ETH" : 
                   period === "ET2" ? "ET2" : 
                   period === "ET_FT" ? "ETF" : 
                   period === "PEN" ? "PEN" : "FT"}
                </span>
                {stoppageMinutes > 0 && period !== "HT" && (
                  <span className="bg-neutral-950 text-amber-400 text-xs px-1.5 py-0.5 rounded font-mono font-bold ml-1">+{stoppageMinutes}</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 2. MATCH INTRO (Center Big Fullscreen)                     */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.matchIntro && (
            <motion.div
              id="graphic-matchintro"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center p-20 z-40 bg-black/40 backdrop-blur-md"
            >
              <div className="w-full max-w-4xl border-b-8 border-r-8 rounded-2xl overflow-hidden p-10 flex flex-col justify-between shadow-2xl relative"
                style={{ 
                  background: getThemedContainerStyle(homeTeam.color || "#3b82f6").background,
                  color: getThemedContainerStyle("#ffffff").color,
                  borderColor: getThemedContainerStyle(homeTeam.color || "#3b82f6").borderColor 
                }}>
                
                {/* Background ambient color flares */}
                <div className="absolute top-0 left-0 w-80 h-80 rounded-full blur-[120px]" style={{ backgroundColor: `${homeTeam.color}30` }} />
                <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[120px]" style={{ backgroundColor: `${awayTeam.color}30` }} />

                {/* Header */}
                <div className="flex justify-between items-center border-b border-neutral-850 pb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-amber-500" />
                    <div>
                      <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">
                        {matchInfo.tournamentName || "EPIC CHAMPIONSHIP"}
                      </h1>
                      <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
                        SEASON {matchInfo.season}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="bg-neutral-900 border border-neutral-800 text-amber-500 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                      MATCHDAY {matchInfo.matchNumber}
                    </p>
                  </div>
                </div>

                {/* VS Team Showcase */}
                <div className="grid grid-cols-7 gap-4 items-center my-10 relative z-10">
                  {/* Home Team */}
                  <div className="col-span-3 flex flex-col items-center text-center">
                    <div className="w-36 h-36 rounded-full bg-neutral-900/60 p-5 border-4 flex items-center justify-center shadow-lg"
                      style={{ borderColor: homeTeam.color }}>
                      {homeTeam.logoUrl ? (
                        <img src={homeTeam.logoUrl} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <Trophy className="w-16 h-16" style={{ color: homeTeam.color }} />
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mt-4 leading-tight">
                      {homeTeam.name}
                    </h2>
                    <span className="text-xs font-bold text-neutral-500 tracking-widest mt-1 uppercase" style={{ color: homeTeam.color }}>
                      HOME CLUB
                    </span>
                  </div>

                  {/* VS Indicator */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-neutral-950 font-black italic text-xl shadow-xl border-4 border-[#131722] rotate-12">
                      VS
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="col-span-3 flex flex-col items-center text-center">
                    <div className="w-36 h-36 rounded-full bg-neutral-900/60 p-5 border-4 flex items-center justify-center shadow-lg"
                      style={{ borderColor: awayTeam.color }}>
                      {awayTeam.logoUrl ? (
                        <img src={awayTeam.logoUrl} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <Trophy className="w-16 h-16" style={{ color: awayTeam.color }} />
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mt-4 leading-tight">
                      {awayTeam.name}
                    </h2>
                    <span className="text-xs font-bold text-neutral-500 tracking-widest mt-1 uppercase" style={{ color: awayTeam.color }}>
                      AWAY CLUB
                    </span>
                  </div>
                </div>

                {/* Match Details Panel */}
                <div className="grid grid-cols-3 bg-black/60 rounded-xl p-5 border border-neutral-800 text-center relative z-10 text-white">
                  <div className="flex flex-col items-center border-r border-neutral-800">
                    <MapPin className="w-5 h-5 text-amber-500 mb-1" />
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">VENUE</span>
                    <span className="text-sm font-bold mt-1 max-w-[220px] truncate">{matchInfo.venue || "MUNICIPAL STADIUM"}</span>
                  </div>
                  <div className="flex flex-col items-center border-r border-neutral-800">
                    <Calendar className="w-5 h-5 text-amber-500 mb-1" />
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">DATE / TIME</span>
                    <span className="text-sm font-bold mt-1">{matchInfo.date || "TODAY"} — {matchInfo.time || "KO"}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="w-5 h-5 text-amber-500 mb-1" />
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">CHIEF REFEREE</span>
                    <span className="text-sm font-bold mt-1 text-emerald-400 truncate max-w-[220px]">{matchInfo.referee || "M. OLIVER"}</span>
                  </div>
                </div>

                {/* Sponsor Base Footer */}
                <div className="text-center mt-6 pt-3 border-t border-neutral-850 relative z-10 text-[11px] font-bold text-neutral-500 tracking-widest uppercase">
                  PRESENTED BY <span className="text-white font-black">{activeSponsor}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 3. STARTING XI (Roster Panel)                             */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.startingXI && (
            <motion.div
              id="graphic-startingxi"
              initial={{ x: 600, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 600, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute top-20 right-16 w-[480px] bg-[#111420]/95 border-r-8 border-b-8 shadow-2xl p-8 rounded-xl z-20 text-white"
              style={{ borderColor: activeGraphicSettings.startingXI?.targetTeamId === "away" ? awayTeam.color : homeTeam.color }}
            >
              {/* Heading */}
              <div className="border-b border-neutral-800 pb-4 mb-4">
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest">TEAM LINEUP</span>
                <div className="flex items-center gap-3 mt-1">
                  {((activeGraphicSettings.startingXI?.targetTeamId === "away" ? awayTeam.logoUrl : homeTeam.logoUrl)) ? (
                    <img src={activeGraphicSettings.startingXI?.targetTeamId === "away" ? awayTeam.logoUrl : homeTeam.logoUrl} className="w-8 h-8 object-contain" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <Trophy className="w-8 h-8" style={{ color: activeGraphicSettings.startingXI?.targetTeamId === "away" ? awayTeam.color : homeTeam.color }} />
                  )}
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                    {activeGraphicSettings.startingXI?.targetTeamId === "away" ? awayTeam.name : homeTeam.name}
                  </h2>
                </div>
                <div className="text-xs font-bold text-neutral-400 mt-1">
                  Formation: {activeGraphicSettings.startingXI?.targetTeamId === "away" ? awayTeam.formation : homeTeam.formation}
                </div>
              </div>

              {/* Player list */}
              <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
                {(activeGraphicSettings.startingXI?.targetTeamId === "away" ? awayTeam : homeTeam).players
                  .filter(p => p.isStarting)
                  .map((player, index) => (
                    <div 
                      key={player.id} 
                      className="flex items-center justify-between bg-black/40 hover:bg-black/60 transition px-3.5 py-2.5 rounded border-l-2 border-neutral-800"
                      style={{ 
                        borderLeftColor: index === 0 ? "#eab308" : (activeGraphicSettings.startingXI?.targetTeamId === "away" ? awayTeam.color : homeTeam.color) 
                      }}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="w-6 font-mono font-black text-amber-500 text-sm text-center bg-black/60 py-0.5 rounded border border-neutral-800">
                          {player.number}
                        </span>
                        <span className="font-bold text-sm text-neutral-100">{player.name}</span>
                        {player.isCaptain && (
                          <span className="bg-amber-500 text-neutral-900 text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase scale-90">CAPTAIN</span>
                        )}
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                        {player.position}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Manager footer */}
              <div className="mt-5 pt-3 border-t border-neutral-850 flex justify-between text-xs text-neutral-400 font-bold">
                <span>MANAGER: {activeGraphicSettings.startingXI?.targetTeamId === "away" ? "A. Arteta" : "P. Guardiola"}</span>
                <span className="text-amber-500 uppercase">XI STARTERS</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* 3.5 STARTING XI LINEUP (AWAY TEAM)                       */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.startingXIAway && (
            <motion.div
              id="graphic-startingxi-away"
              initial={{ x: 600, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 600, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute top-20 right-16 w-[480px] bg-[#111420]/95 border-r-8 border-b-8 shadow-2xl p-8 rounded-xl z-20 text-white"
              style={{ borderColor: activeGraphicSettings.startingXIAway?.targetTeamId === "home" ? homeTeam.color : awayTeam.color }}
            >
              {/* Heading */}
              <div className="border-b border-neutral-800 pb-4 mb-4">
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest">TEAM LINEUP</span>
                <div className="flex items-center gap-3 mt-1">
                  {((activeGraphicSettings.startingXIAway?.targetTeamId === "home" ? homeTeam.logoUrl : awayTeam.logoUrl)) ? (
                    <img src={activeGraphicSettings.startingXIAway?.targetTeamId === "home" ? homeTeam.logoUrl : awayTeam.logoUrl} className="w-8 h-8 object-contain" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <Trophy className="w-8 h-8" style={{ color: activeGraphicSettings.startingXIAway?.targetTeamId === "home" ? homeTeam.color : awayTeam.color }} />
                  )}
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                    {activeGraphicSettings.startingXIAway?.targetTeamId === "home" ? homeTeam.name : awayTeam.name}
                  </h2>
                </div>
                <div className="text-xs font-bold text-neutral-400 mt-1">
                  Formation: {activeGraphicSettings.startingXIAway?.targetTeamId === "home" ? homeTeam.formation : awayTeam.formation}
                </div>
              </div>

              {/* Player list */}
              <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
                {(activeGraphicSettings.startingXIAway?.targetTeamId === "home" ? homeTeam : awayTeam).players
                  .filter(p => p.isStarting)
                  .map((player, index) => (
                    <div 
                      key={player.id} 
                      className="flex items-center justify-between bg-black/40 hover:bg-black/60 transition px-3.5 py-2.5 rounded border-l-2 border-neutral-800"
                      style={{ 
                        borderLeftColor: index === 0 ? "#eab308" : (activeGraphicSettings.startingXIAway?.targetTeamId === "home" ? homeTeam.color : awayTeam.color) 
                      }}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="w-6 font-mono font-black text-amber-500 text-sm text-center bg-black/60 py-0.5 rounded border border-neutral-800">
                          {player.number}
                        </span>
                        <span className="font-bold text-sm text-neutral-100">{player.name}</span>
                        {player.isCaptain && (
                          <span className="bg-amber-500 text-neutral-900 text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase scale-90">CAPTAIN</span>
                        )}
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                        {player.position}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Manager footer */}
              <div className="mt-5 pt-3 border-t border-neutral-850 flex justify-between text-xs text-neutral-400 font-bold">
                <span>MANAGER: {activeGraphicSettings.startingXIAway?.targetTeamId === "home" ? "P. Guardiola" : "A. Arteta"}</span>
                <span className="text-amber-500 uppercase">XI STARTERS</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 4. FORMATION GRAPHIC (Interactive Pitch Overlay)          */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.formationGraphic && (
            <motion.div
              id="graphic-formation"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-x-20 top-20 bottom-16 bg-[#001711]/95 border-b-[10px] shadow-2xl rounded-2xl overflow-hidden p-8 z-30 flex flex-col text-white"
              style={{ borderColor: activeGraphicSettings.formationGraphic?.targetTeamId === "away" ? awayTeam.color : homeTeam.color }}
            >
              {/* Top Bar info */}
              <div className="flex justify-between items-center border-b border-emerald-950/60 pb-4 mb-4">
                <div className="flex items-center gap-4">
                  <span className="bg-emerald-500 text-neutral-950 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">Tactical Formation</span>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic text-emerald-400">
                      {activeGraphicSettings.formationGraphic?.targetTeamId === "away" ? awayTeam.name : homeTeam.name}
                    </h2>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                      SYSTEM FORMATION: {activeGraphicSettings.formationGraphic?.targetTeamId === "away" ? awayTeam.formation : homeTeam.formation}
                    </p>
                  </div>
                </div>
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>

              {/* Grid split: Pitch (65%) | Side Team-card Info (35%) */}
              <div className="flex-1 grid grid-cols-10 gap-6 overflow-hidden">
                {/* 3D-effect Football Pitch Display */}
                <div className="col-span-7 bg-emerald-950/40 relative rounded-xl border border-emerald-900/60 overflow-hidden shadow-inner p-4 min-h-[500px]">
                  {/* Styled Green Grass stripes */}
                  <div className="absolute inset-0 flex flex-col opacity-25">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`flex-1 ${i % 2 === 0 ? "bg-emerald-900" : "bg-transparent"}`} />
                    ))}
                  </div>

                  {/* Standard Soccer Field Line Overlay */}
                  <div className="absolute inset-4 border-2 border-emerald-600/50 rounded-lg pointer-events-none">
                    {/* Goal boxes */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-24 border-b-2 border-x-2 border-emerald-605/50" />
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-24 border-t-2 border-x-2 border-emerald-605/50" />
                    {/* Center circle */}
                    <div className="absolute top-1/2 left-1/2 -ml-20 -mt-20 w-40 h-40 border-2 border-emerald-605/50 rounded-full" />
                    {/* Center line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-605/50" />
                    {/* Penalty dots */}
                    <div className="absolute top-18 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 bg-emerald-550/50 rounded-full" />
                    <div className="absolute bottom-18 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 bg-emerald-555/50 rounded-full" />
                  </div>

                  {/* Render mapping dots based on formation */}
                  {(() => {
                    const currentTeam = activeGraphicSettings.formationGraphic?.targetTeamId === "away" ? awayTeam : homeTeam;
                    const fKey = currentTeam.formation as keyof typeof FORMATIONS_MAP;
                    const positions = FORMATIONS_MAP[fKey] || FORMATIONS_MAP["4-4-2"];
                    const starters = currentTeam.players.filter(p => p.isStarting);

                    return positions.map((pos, idx) => {
                      const associatedPlayer = starters[idx] || starters[starters.length - 1];
                      if (!associatedPlayer) return null;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.05, type: "spring" }}
                          className="absolute flex flex-col items-center select-none"
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: "translate(-50%, -50%)"
                          }}
                        >
                          {/* Animated Marker */}
                          <div className="relative group cursor-pointer flex flex-col items-center">
                            <div 
                              className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-black shadow-lg text-sm relative z-10 transition group-hover:scale-110"
                              style={{ 
                                backgroundColor: currentTeam.color || "#047857",
                                borderColor: currentTeam.secondaryColor || "#fff",
                                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                                color: "#fff"
                              }}
                            >
                              {associatedPlayer.number}
                            </div>
                            
                            {/* Position Badge */}
                            <span className="absolute -top-3.5 bg-black text-amber-400 text-[8px] font-black tracking-widest px-1 py-0.5 rounded border border-neutral-800 z-20">
                              {/* If GK show GK otherwise use preset */}
                              {pos.positionName}
                            </span>

                            {/* Player Name Tag */}
                            <span className="bg-neutral-900 border border-neutral-800 text-white font-black text-[11px] tracking-tight hover:text-amber-300 py-0.5 px-2 rounded-md mt-1 shadow shadow-black opacity-90 transition group-hover:opacity-100 max-w-[120px] truncate text-center">
                              {associatedPlayer.name.split(" ").pop() || "Player"}
                            </span>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>

                {/* Team Info Panel Side Card */}
                <div className="col-span-3 bg-black/60 rounded-xl p-6 border border-emerald-950 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block mb-1">Squad Assets & Key Stats</span>
                    <h3 className="text-lg font-black tracking-tight text-white mb-4">TACTICAL SCHEME</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-neutral-900/80 p-3.5 rounded border border-neutral-850">
                        <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">TEAM CAPTAIN</span>
                        <div className="font-extrabold text-sm text-yellow-400 mt-1">
                          {(activeGraphicSettings.formationGraphic?.targetTeamId === "away" ? awayTeam : homeTeam).players.find(p => p.isCaptain)?.name || "Not Designated"}
                        </div>
                      </div>

                      <div className="bg-neutral-900/80 p-3.5 rounded border border-neutral-850">
                        <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">TACTICAL INSTRUCTION</span>
                        <p className="text-xs text-neutral-100 font-medium mt-1 leading-relaxed">
                          {activeGraphicSettings.formationGraphic?.targetTeamId === "away" 
                            ? "High-intensity counter-pressing structure with wingbacks pushing to overlapping zones." 
                            : "Positional fluid sequence play. Maintain possession while creating half-spaces overflows."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Brand signature */}
                  <div className="border-t border-emerald-950 pt-4 text-center">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      CHAMPIONSHIP VIZ SUITE — LIVE
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 5. TEAM LINEUP (Side-by-Side Panel)                       */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.teamLineup && (
            <motion.div
              id="graphic-teamlineup"
              initial={{ y: 600, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 600, opacity: 0 }}
              className="absolute inset-x-20 top-20 bottom-16 bg-[#121622]/95 border-b-[10px] rounded-2xl overflow-hidden p-8 z-30 flex flex-col text-white border-neutral-800"
            >
              <div className="text-center border-b border-neutral-850 pb-5 mb-6">
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest block">MATCHDAY SELECTIONS</span>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">ACTIVE LINEUPS</h2>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-10 overflow-hidden">
                {/* Home Team */}
                <div className="border-r border-neutral-850/60 pr-5 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-3 border-b-2 pb-3 mb-3 border-l-4 pl-3" style={{ borderLeftColor: homeTeam.color }}>
                    <h3 className="text-xl font-black text-white italic">{homeTeam.name}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-2">
                    {homeTeam.players.filter(p => p.isStarting).map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-black/35 py-1.5 px-3 rounded text-sm text-neutral-200">
                        <span className="font-mono font-bold text-amber-500 w-5">{p.number}</span>
                        <span className="font-bold flex-1 ml-2">{p.name} {p.isCaptain ? "(C)" : ""}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 rounded">{p.position}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-3 border-b-2 pb-3 mb-3 border-r-4 pr-3 text-right justify-end" style={{ borderRightColor: awayTeam.color }}>
                    <h3 className="text-xl font-black text-white italic">{awayTeam.name}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-2">
                    {awayTeam.players.filter(p => p.isStarting).map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-black/35 py-1.5 px-3 rounded text-sm text-neutral-200">
                        <span className="font-mono font-bold text-amber-500 w-5">{p.number}</span>
                        <span className="font-bold flex-1 ml-2">{p.name} {p.isCaptain ? "(C)" : ""}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 rounded">{p.position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 6. BENCH GRAPHIC                                          */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.benchGraphic && (
            <motion.div
              id="graphic-bench"
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              className="absolute bottom-28 left-16 w-[420px] bg-[#111422]/95 border-l-8 border-b-8 shadow-2xl p-6 rounded-lg z-20 text-white"
              style={{ borderColor: activeGraphicSettings.benchGraphic?.targetTeamId === "away" ? awayTeam.color : homeTeam.color }}
            >
              <div className="border-b border-neutral-850 pb-3 mb-3">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">SUBSTITUTES BENCH</span>
                <h3 className="text-lg font-black tracking-tight mt-0.5 text-white">
                  {activeGraphicSettings.benchGraphic?.targetTeamId === "away" ? awayTeam.shortName : homeTeam.shortName} BENCH
                </h3>
              </div>

              <div className="space-y-1">
                {(activeGraphicSettings.benchGraphic?.targetTeamId === "away" ? awayTeam : homeTeam).players
                  .filter(p => !p.isStarting)
                  .map(player => (
                    <div key={player.id} className="flex justify-between items-center bg-black/30 px-3 py-2 rounded text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-neutral-400 w-5">{player.number}</span>
                        <span className="font-bold">{player.name}</span>
                      </div>
                      <span className="text-[9px] font-bold text-neutral-500 uppercase">{player.position}</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 7. GOAL GRAPHIC (Huge Celebrate Overlay)                   */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.goalGraphic && (
            <motion.div
              id="graphic-goal-alert"
              initial={{ scale: 0.5, y: -200, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: 200, opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/60 backdrop-blur-sm text-white"
            >
              <motion.div 
                initial={{ rotate: -5 }}
                animate={{ rotate: 0 }}
                className="w-full max-w-2xl bg-amber-500 text-neutral-950 italic p-10 font-black text-center shadow-2xl border-y-[12px] border-neutral-950 rounded-3xl relative overflow-hidden flex flex-col items-center"
              >
                {/* Background soccer ball silhouette spinning */}
                <div className="absolute -right-10 -bottom-10 opacity-15 w-48 h-48 rounded-full border-[10px] border-neutral-950" />

                <motion.h1 
                  animate={{ scale: [1, 1.15, 1] }} 
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="text-7xl font-sans tracking-tighter uppercase font-black"
                >
                  {activeGraphicSettings.goalGraphic?.customText1 || "G O A L !"}
                </motion.h1>

                {/* Team Name badge */}
                <div 
                  className="mt-4 px-6 py-2 rounded text-white font-black text-lg shadow-md tracking-tight inline-block uppercase text-center"
                  style={{ backgroundColor: activeGraphicSettings.goalGraphic?.targetTeamId === "away" ? awayTeam.color : homeTeam.color }}
                >
                  {activeGraphicSettings.goalGraphic?.targetTeamId === "away" ? awayTeam.name : homeTeam.name}
                </div>

                {/* Scorer detail if provided */}
                {activeGraphicSettings.goalGraphic?.customText2 && (
                  <div className="text-neutral-950 font-bold text-2xl uppercase mt-5 border-t border-neutral-950/40 pt-4 w-full text-center">
                    {activeGraphicSettings.goalGraphic.customText2}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 8. GOAL SCORER GRAPHIC & 9. ASSIST GRAPHIC (Lower thirds) */}
        {/* ========================================================= */}
        <AnimatePresence>
          {(graphics.goalScorerGraphic || graphics.assistGraphic) && (
            <motion.div
              id="graphic-goalscorer"
              initial={{ x: -500, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -500, opacity: 0 }}
              className="absolute bottom-28 left-16 w-[450px] bg-[#11131e]/95 border-l-[10px] shadow-2xl p-5 rounded-lg z-20 text-white flex items-center gap-4"
              style={{ borderColor: activeGraphicSettings.goalScorerGraphic?.targetTeamId === "away" ? awayTeam.color : homeTeam.color }}
            >
              <div className="bg-amber-500 rounded-lg p-3 text-neutral-950 flex flex-col items-center justify-center font-black">
                <Trophy className="w-6 h-6" />
                <span className="text-[10px] mt-1 tracking-widest uppercase">SCORE</span>
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">GOAL SCORER</span>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                  {activeGraphicSettings.goalScorerGraphic?.customText1 || "Erling Haaland"}
                </h3>
                
                {/* Assist label if Assist graphic selected */}
                {graphics.assistGraphic && activeGraphicSettings.assistGraphic?.customText1 && (
                  <div className="mt-1 pb-1 border-t border-neutral-850 pt-1 text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Assist: <span className="text-white font-extrabold">{activeGraphicSettings.assistGraphic.customText1}</span></span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 10. YELLOW CARD GRAPHIC                                   */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.yellowCardGraphic && (
            <motion.div
              id="graphic-yellowcard"
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="absolute bottom-28 left-16 w-[450px] border-l-[10px] shadow-2xl p-5 rounded-lg z-20 flex gap-4"
              style={{ 
                background: getThemedContainerStyle("#fbbf24").background,
                color: getThemedContainerStyle("#ffffff").color,
                borderColor: getThemedContainerStyle("#fbbf24").borderColor
              }}
            >
              {/* Yellow Card Animation (Rotating 3D-like Card effect) */}
              <div className="flex items-center justify-center bg-black/40 p-3 rounded-lg flex-shrink-0">
                <motion.div
                  animate={{ 
                    rotateY: [0, 180, 360], 
                    scale: [1, 1.15, 1] 
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-10 h-16 bg-amber-400 rounded-md shadow-[0_0_15px_rgba(251,191,36,0.6)] border-2 border-white flex items-center justify-center font-black text-black text-sm"
                >
                  Y
                </motion.div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: getThemedContainerStyle("#fbbf24").borderColor }}>
                  {yellowCardTeam ? yellowCardTeam.name.toUpperCase() : "TEAM CAUTION"} • #{yellowCardPlayer ? yellowCardPlayer.number : "2"}
                </span>
                <h3 className="text-2xl font-black italic tracking-tight uppercase">
                  {yellowCardPlayer ? yellowCardPlayer.name : (activeGraphicSettings.yellowCardGraphic?.customText1 || "Manuel Akanji")}
                </h3>
                <p className="text-xs font-semibold uppercase mt-1 opacity-80 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-amber-400 animate-pulse" />
                  Reason: {activeGraphicSettings.yellowCardGraphic?.customText2 || "Tactical Foul / Cautionable Offence"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 11. RED CARD GRAPHIC                                      */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.redCardGraphic && (
            <motion.div
              id="graphic-redcard"
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="absolute bottom-28 left-16 w-[450px] border-l-[10px] shadow-2xl p-5 rounded-lg z-20 flex gap-4"
              style={{ 
                background: getThemedContainerStyle("#dc2626").background,
                color: getThemedContainerStyle("#ffffff").color,
                borderColor: getThemedContainerStyle("#dc2626").borderColor
              }}
            >
              {/* Red Card Animation (Pulsing and rotating 3D Send-Off card) */}
              <div className="flex items-center justify-center bg-black/40 p-3 rounded-lg flex-shrink-0">
                <motion.div
                  animate={{ 
                    rotateY: [360, 180, 0], 
                    scale: [1, 1.2, 1],
                    boxShadow: [
                      "0 0 10px rgba(220,38,38,0.5)",
                      "0 0 25px rgba(220,38,38,0.9)",
                      "0 0 10px rgba(220,38,38,0.5)"
                    ]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-10 h-16 bg-red-600 rounded-md border-2 border-white flex items-center justify-center font-black text-white text-sm"
                >
                  R
                </motion.div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: getThemedContainerStyle("#dc2626").borderColor }}>
                  {redCardTeam ? redCardTeam.name.toUpperCase() : "SENDING OFF"} • #{redCardPlayer ? redCardPlayer.number : "4"}
                </span>
                <h3 className="text-2xl font-black italic tracking-tight uppercase">
                  {redCardPlayer ? redCardPlayer.name : (activeGraphicSettings.redCardGraphic?.customText1 || "Declan Rice")}
                </h3>
                <p className="text-xs font-semibold uppercase mt-1 opacity-80 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-red-650 bg-red-600 animate-pulse" />
                  Type: {activeGraphicSettings.redCardGraphic?.customText2 || "Direct Red Card"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 12. SUBSTITUTION GRAPHIC                                  */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.substitutionGraphic && (
            <motion.div
              id="graphic-substitution"
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="absolute bottom-28 left-16 w-[500px] bg-[#111422]/95 border-b-4 border-neutral-800 shadow-2xl rounded-xl z-20 text-white overflow-hidden"
            >
              <div className="bg-neutral-900 border-b border-neutral-850 px-5 py-2.5 flex justify-between items-center">
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">SUBSTITUTION SUB</span>
                <div className="font-extrabold text-xs" style={{ color: activeGraphicSettings.substitutionGraphic?.targetTeamId === "away" ? awayTeam.color : homeTeam.color }}>
                  {activeGraphicSettings.substitutionGraphic?.targetTeamId === "away" ? awayTeam.name : homeTeam.name}
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                {/* Out Player */}
                <div className="bg-red-950/20 border border-red-900/40 p-3 rounded flex items-center gap-3">
                  <div className="bg-red-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-white text-xs">▼</div>
                  <div>
                    <span className="text-[8px] font-bold text-red-400 block uppercase">OUT</span>
                    <span className="text-sm font-bold block text-neutral-200 truncate max-w-[160px]">
                      {activeGraphicSettings.substitutionGraphic?.customText1 || "K. De Bruyne"}
                    </span>
                  </div>
                </div>

                {/* In Player */}
                <div className="bg-emerald-950/20 border border-emerald-950 p-3 rounded flex items-center gap-3">
                  <div className="bg-emerald-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-neutral-950 text-xs">▲</div>
                  <div>
                    <span className="text-[8px] font-bold text-emerald-400 block uppercase">IN</span>
                    <span className="text-sm font-bold block text-white truncate max-w-[160px]">
                      {activeGraphicSettings.substitutionGraphic?.customText2 || "Mateo Kovačić"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 13. MATCH STATISTICS (Full Screen Comparative)           */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.matchStatistics && (
            <motion.div
              id="graphic-matchstats"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="absolute inset-x-20 top-20 bottom-16 bg-[#121625]/95 border-b-[10px] rounded-2xl overflow-hidden p-8 z-30 flex flex-col text-white border-neutral-800"
            >
              <div className="text-center border-b border-neutral-850 pb-5 mb-5 select-none">
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest block">MATCH REVIEW</span>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">MATCH STATISTICS</h2>
              </div>

              {/* Home & Away Titles */}
              <div className="grid grid-cols-12 gap-4 items-center font-black pb-3 select-none text-sm text-neutral-300">
                <div className="col-span-4 text-left uppercase text-lg" style={{ color: homeTeam.color }}>{homeTeam.name}</div>
                <div className="col-span-4 text-center text-amber-500 uppercase tracking-widest">METRICS SUMMARY</div>
                <div className="col-span-4 text-right uppercase text-lg" style={{ color: awayTeam.color }}>{awayTeam.name}</div>
              </div>

              {/* Stats Rows */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm font-sans">
                {/* Score calculated from events */}
                {(() => {
                  const items = [
                    { label: "POSSESSION %", h: stats.possessionHome, a: stats.possessionHome >= 0 ? 100 - stats.possessionHome : 50, isPercentage: true },
                    { label: "EXPECTED GOALS (XG)", h: stats.xgHome, a: stats.xgAway, isDecimal: true },
                    { label: "SHOTS TOTAL", h: stats.shotsHome, a: stats.shotsAway },
                    { label: "SHOTS ON TARGET", h: stats.shotsOnTargetHome, a: stats.shotsOnTargetAway },
                    { label: "CORNERS WON", h: stats.cornersHome, a: stats.cornersAway },
                    { label: "FOULS COMMITTED", h: stats.foulsHome, a: stats.foulsAway },
                    { label: "OFFSIDES CALLED", h: stats.offsidesHome, a: stats.offsidesAway },
                    { label: "SAVES CALLED", h: stats.savesHome, a: stats.savesAway },
                    { label: "YELLOW CARDS", h: stats.yellowCardsHome, a: stats.yellowCardsAway },
                    { label: "RED CARDS", h: stats.redCardsHome, a: stats.redCardsAway },
                    { label: "PASS ACCURACY %", h: stats.passAccuracyHome, a: stats.passAccuracyAway, isPercentage: true }
                  ];

                  return items.map((itm, i) => {
                    const total = itm.h + itm.a || 1;
                    const hPerc = Math.round((itm.h / total) * 100);
                    const aPerc = 100 - hPerc;

                    return (
                      <div key={i} className="bg-black/25 p-3.5 rounded border border-neutral-850 flex flex-col gap-2">
                        <div className="flex justify-between items-center font-bold text-xs">
                          {/* Home value */}
                          <span className="font-mono text-base text-white">
                            {itm.isDecimal ? itm.h.toFixed(2) : itm.isPercentage ? `${itm.h}%` : itm.h}
                          </span>
                          
                          {/* Metric Name */}
                          <span className="text-neutral-400 text-center tracking-wider">{itm.label}</span>
                          
                          {/* Away value */}
                          <span className="font-mono text-base text-white">
                            {itm.isDecimal ? itm.a.toFixed(2) : itm.isPercentage ? `${itm.a}%` : itm.a}
                          </span>
                        </div>

                        {/* Comparative metric bars */}
                        <div className="h-2.5 rounded-full bg-neutral-800 overflow-hidden flex">
                          <div 
                            className="h-full rounded-l transition-all duration-300" 
                            style={{ 
                              width: `${hPerc}%`, 
                              backgroundColor: homeTeam.color || "#3b82f6" 
                            }} 
                          />
                          <div 
                            className="h-full rounded-r transition-all duration-300 ml-auto" 
                            style={{ 
                              width: `${aPerc}%`, 
                              backgroundColor: awayTeam.color || "#ef4444" 
                            }} 
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 14. POSSESSION GRAPHIC (Lower HUD)                        */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.possessionGraphic && (
            <motion.div
              id="graphic-possession"
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="absolute bottom-28 inset-x-24 bg-[#111422]/95 border border-neutral-800 shadow-2xl p-5 rounded-xl z-20 text-white flex flex-col gap-3"
            >
              <div className="flex justify-between items-center text-xs font-bold font-sans">
                <span className="font-extrabold" style={{ color: homeTeam.color }}>{homeTeam.name.toUpperCase()} ({stats.possessionHome}%)</span>
                <span className="text-amber-500 uppercase tracking-widest">LIVE POSSESSION BAR</span>
                <span className="font-extrabold" style={{ color: awayTeam.color }}>({100 - stats.possessionHome}%) {awayTeam.name.toUpperCase()}</span>
              </div>
              <div className="h-4 w-full bg-neutral-900 rounded-lg overflow-hidden flex border border-neutral-800">
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ width: `${stats.possessionHome}%`, backgroundColor: homeTeam.color }} 
                />
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ width: `${100 - stats.possessionHome}%`, backgroundColor: awayTeam.color }} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 15. SHOT COMPARISON / 16. CORNER / 17. TEAM COMPARISON    */}
        {/* ========================================================= */}
        <AnimatePresence>
          {(graphics.shotComparison || graphics.cornerComparison || graphics.teamComparison) && (
            <motion.div
              id="graphic-small-comparison"
              initial={{ x: 500, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 500, opacity: 0 }}
              className="absolute bottom-28 right-16 w-[380px] bg-[#111422]/95 border-b-[6px] shadow-2xl p-5 rounded-lg z-20 text-white"
              style={{ 
                borderColor: graphics.shotComparison ? "#f59e0b" : "#3b82f6" 
              }}
            >
              <div className="border-b border-neutral-850 pb-2 mb-3">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">COMPARATIVE STAT</span>
                <h3 className="text-base font-black uppercase text-white tracking-tight">
                  {graphics.shotComparison ? "SHOTS TARGET RADAR" : graphics.cornerComparison ? "CORNERS STATS" : "TEAM COMPARISON HUD"}
                </h3>
              </div>

              {graphics.shotComparison && (
                <div className="space-y-3.5 text-xs text-neutral-300">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span style={{ color: homeTeam.color }}>{stats.shotsHome}</span>
                    <span className="text-neutral-500 text-[10px] uppercase font-semibold">TOTAL SHOTS</span>
                    <span style={{ color: awayTeam.color }}>{stats.shotsAway}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span style={{ color: homeTeam.color }}>{stats.shotsOnTargetHome}</span>
                    <span className="text-neutral-500 text-[10px] uppercase font-semibold">SHOTS ON TARGET</span>
                    <span style={{ color: awayTeam.color }}>{stats.shotsOnTargetAway}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span style={{ color: homeTeam.color }}>{stats.xgHome.toFixed(2)}</span>
                    <span className="text-neutral-500 text-[10px] uppercase font-semibold">EXPECTED GOALS (XG)</span>
                    <span style={{ color: awayTeam.color }}>{stats.xgAway.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {graphics.cornerComparison && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold text-neutral-300">
                    <span style={{ color: homeTeam.color }}>{stats.cornersHome}</span>
                    <span className="text-neutral-500 text-[10px]">CORNERS WON</span>
                    <span style={{ color: awayTeam.color }}>{stats.cornersAway}</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden flex">
                    <div className="h-full" style={{ width: `${(stats.cornersHome / (stats.cornersHome + stats.cornersAway || 1)) * 100}%`, backgroundColor: homeTeam.color }} />
                    <div className="h-full ml-auto" style={{ width: `${(stats.cornersAway / (stats.cornersHome + stats.cornersAway || 1)) * 100}%`, backgroundColor: awayTeam.color }} />
                  </div>
                </div>
              )}

              {graphics.teamComparison && (
                <div className="space-y-3 text-xs text-neutral-300">
                  <div className="flex justify-between">
                    <span style={{ color: homeTeam.color }}>{stats.foulsHome}</span>
                    <span className="text-neutral-500">FOULS</span>
                    <span style={{ color: awayTeam.color }}>{stats.foulsAway}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: homeTeam.color }}>{stats.savesHome}</span>
                    <span className="text-neutral-500">GK SAVES</span>
                    <span style={{ color: awayTeam.color }}>{stats.savesAway}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: homeTeam.color }}>{stats.passAccuracyHome}%</span>
                    <span className="text-neutral-500">PASS ACCURACY</span>
                    <span style={{ color: awayTeam.color }}>{stats.passAccuracyAway}%</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 18. PLAYER STATISTICS                                     */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.playerStatistics && (
            <motion.div
              id="graphic-playerstats"
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              className="absolute bottom-28 left-16 w-[420px] bg-[#111422]/95 border-l-8 border-b-8 shadow-2xl p-6 rounded-lg z-20 text-white"
              style={{ borderColor: homeTeam.color }}
            >
              {(() => {
                const targetId = activeGraphicSettings.playerStatistics?.targetPlayerId;
                const player = findPlayer(targetId);
                
                if (!player) {
                  return (
                    <div className="text-xs text-neutral-400">
                      No player selected. Please configure a player on the trigger panel.
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center gap-4 border-b border-neutral-850 pb-3 mb-4">
                      <div className="w-14 h-14 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center font-black text-2xl text-amber-500 font-mono">
                        {player.number}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{player.position}</span>
                        <h4 className="text-lg font-black text-white uppercase italic tracking-tight">{player.name}</h4>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                          {player.teamId === "home" ? homeTeam.name : awayTeam.name}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-black/35 p-2.5 rounded border border-neutral-850 flex justify-between">
                        <span className="text-neutral-400">Goals</span>
                        <span className="font-bold text-white text-sm">{player.goals}</span>
                      </div>
                      <div className="bg-black/35 p-2.5 rounded border border-neutral-850 flex justify-between">
                        <span className="text-neutral-400">Assists</span>
                        <span className="font-bold text-white text-sm">{player.assists}</span>
                      </div>
                      <div className="bg-black/35 p-2.5 rounded border border-neutral-850 flex justify-between">
                        <span className="text-neutral-400">Shots</span>
                        <span className="font-bold text-white text-sm">{player.shots}</span>
                      </div>
                      <div className="bg-black/35 p-2.5 rounded border border-neutral-850 flex justify-between">
                        <span className="text-neutral-400">Fouls</span>
                        <span className="font-bold text-white text-sm">{player.fouls}</span>
                      </div>
                      <div className="col-span-2 bg-black/35 p-2.5 rounded border border-neutral-850 flex justify-between text-xs font-mono">
                        <span className="text-neutral-400">Minutes Active</span>
                        <span className="font-bold text-amber-500">{player.minutesPlayed}&apos; mins</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 19. MAN OF THE MATCH                                      */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.manOfTheMatch && (
            <motion.div
              id="graphic-motm"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-x-20 top-20 bottom-16 bg-neutral-950/95 border-b-[10px] rounded-2xl overflow-hidden p-8 z-30 flex flex-col text-white border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.25)]"
            >
              <div className="text-center pb-5 mb-5 select-none relative">
                <div className="absolute top-0 left-1/2 -ml-24 w-48 h-12 bg-amber-500/10 blur-xl rounded-full" />
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest block flex items-center justify-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400 animate-spin" /> PERFORMANCE AWARD
                </span>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">MAN OF THE MATCH</h2>
              </div>

              {(() => {
                const targetId = activeGraphicSettings.manOfTheMatch?.targetPlayerId;
                const player = findPlayer(targetId) || homeTeam.players.find(p => p.goals > 0) || homeTeam.players[6];

                return (
                  <div className="flex-1 grid grid-cols-10 gap-8 items-center overflow-hidden">
                    {/* Visual Gold Crown Card left side */}
                    <div className="col-span-4 bg-gradient-to-br from-amber-600/10 to-transparent border-4 border-amber-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg relative h-full">
                      {/* Radiating background rings */}
                      <div className="absolute w-44 h-44 rounded-full border border-amber-500/10 scale-90" />
                      <div className="absolute w-56 h-56 rounded-full border border-amber-500/5" />
                      
                      <div className="w-24 h-24 rounded-full bg-neutral-900 border-4 border-amber-500 flex items-center justify-center text-white text-3xl font-black mb-4 font-mono shadow-xl relative z-10">
                        {player.number}
                      </div>

                      <h3 className="text-2xl font-black italic uppercase tracking-tight text-amber-400 mt-2">{player.name}</h3>
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                        {player.teamId === "home" ? homeTeam.name : awayTeam.name}
                      </span>
                      <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest border border-amber-500/30 px-3.5 py-1 rounded-full mt-4">
                        VALUED MATCH WINNER
                      </span>
                    </div>

                    {/* Stats details panel right side */}
                    <div className="col-span-6 bg-black/40 rounded-2xl p-6 border border-neutral-850 h-full flex flex-col justify-between">
                      <div>
                        <div className="border-b border-neutral-850 pb-3 mb-5">
                          <h4 className="text-lg font-black tracking-tight text-white uppercase italic">IN-MATCH CONTRIBUTIONS</h4>
                          <span className="text-[9px] text-neutral-500 font-bold block uppercase tracking-wider">OFFICIAL TELEMETRY RATING</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-neutral-900/50 p-4 rounded border border-neutral-850 text-center">
                            <span className="text-2xl font-black font-mono text-emerald-400">{player.goals}</span>
                            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-widest mt-1">GOALS SCORED</span>
                          </div>

                          <div className="bg-neutral-900/50 p-4 rounded border border-neutral-850 text-center">
                            <span className="text-2xl font-black font-mono text-emerald-400">{player.assists}</span>
                            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-widest mt-1">GOAL ASSISTS</span>
                          </div>

                          <div className="bg-neutral-900/50 p-4 rounded border border-neutral-850 text-center">
                            <span className="text-2xl font-black font-mono text-neutral-400">{player.shotsOnTarget} / {player.shots}</span>
                            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-widest mt-1">SHOT ACCURACY</span>
                          </div>

                          <div className="bg-neutral-900/50 p-4 rounded border border-neutral-850 text-center">
                            <span className="text-2xl font-black font-mono text-neutral-400">{player.passesCompleted}</span>
                            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-widest mt-1">SUCCESSFUL PASSES</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-center pt-4 border-t border-neutral-850">
                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                          PRESENTED BY CHRONOS METRICS ENGINE
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 20. HALF TIME GRAPHIC & 21. FULL TIME GRAPHIC             */}
        {/* ========================================================= */}
        <AnimatePresence>
          {(graphics.halfTimeGraphic || graphics.fullTimeGraphic) && (
            <motion.div
              id="graphic-period-scoresummary"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="absolute inset-x-20 top-20 bottom-16 bg-[#111420]/95 border-b-[10px] shadow-2xl p-8 rounded-2xl z-30 flex flex-col text-white"
              style={{ borderColor: "#f59e0b" }}
            >
              <div className="text-center pb-4 mb-4 select-none relative">
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest block">MATCH SUMMARY CARD</span>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                  {graphics.halfTimeGraphic ? "HALF TIME SCORE" : "FULL TIME STANDINGS"}
                </h2>
              </div>

              <div className="flex-1 grid grid-cols-12 gap-8 items-stretch overflow-hidden">
                {/* Score panel (7 cols) */}
                <div className="col-span-7 bg-black/40 rounded-xl p-5 border border-neutral-850 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-center font-bold px-4 py-6">
                    {/* Home code */}
                    <div className="flex flex-col items-center">
                      <div className="w-18 h-18 rounded-full bg-neutral-900 border-2 items-center justify-center p-3 flex" style={{ borderColor: homeTeam.color }}>
                        {homeTeam.logoUrl ? (
                          <img src={homeTeam.logoUrl} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <Trophy className="w-8 h-8" />
                        )}
                      </div>
                      <span className="text-base font-black uppercase mt-2">{homeTeam.shortName}</span>
                    </div>

                    {/* HUGE SCORE NUM */}
                    <div className="flex items-center text-center justify-center">
                      <span className="text-5xl font-black tracking-normal px-4 font-mono">{appState.timeline.filter(e => (e.type === MatchEventType.GOAL || e.type === MatchEventType.PENALTY_GOAL) && e.teamId === "home").length + appState.timeline.filter(e => e.type === MatchEventType.OWN_GOAL && e.teamId === "away").length}</span>
                      <span className="text-neutral-605 text-4xl font-normal">:</span>
                      <span className="text-5xl font-black tracking-normal px-4 font-mono">{appState.timeline.filter(e => (e.type === MatchEventType.GOAL || e.type === MatchEventType.PENALTY_GOAL) && e.teamId === "away").length + appState.timeline.filter(e => e.type === MatchEventType.OWN_GOAL && e.teamId === "home").length}</span>
                    </div>

                    {/* Away code */}
                    <div className="flex flex-col items-center">
                      <div className="w-18 h-18 rounded-full bg-neutral-900 border-2 items-center justify-center p-3 flex" style={{ borderColor: awayTeam.color }}>
                        {awayTeam.logoUrl ? (
                          <img src={awayTeam.logoUrl} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <Trophy className="w-8 h-8" />
                        )}
                      </div>
                      <span className="text-base font-black uppercase mt-2">{awayTeam.shortName}</span>
                    </div>
                  </div>

                  {/* Scorers goals list */}
                  <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4 text-xs font-medium text-neutral-300">
                    <div className="space-y-1 pr-2 border-r border-neutral-800">
                      {homeGoals.map((g, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 p-0.5">
                          <span>⚽</span>
                          <span>{g.name} <span className="text-amber-500 font-bold">{g.minute}&apos;</span> {g.isOG ? "(OG)" : ""}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 pl-2">
                      {awayGoals.map((g, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 p-0.5 justify-end text-right">
                          <span>{g.name} <span className="text-amber-500 font-bold">{g.minute}&apos;</span> {g.isOG ? "(OG)" : ""}</span>
                          <span>⚽</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Brief stats comparison panel (5 cols) */}
                <div className="col-span-5 bg-black/60 rounded-xl p-5 border border-neutral-850 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider mb-3">KEY MATCH STATISTICS</h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-neutral-850 text-neutral-300">
                        <span>{stats.possessionHome}%</span>
                        <span className="text-neutral-500 font-semibold uppercase">POSSESSION</span>
                        <span>{stats.possessionHome >= 0 ? 100 - stats.possessionHome : 50}%</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-neutral-850 text-neutral-300">
                        <span>{stats.shotsHome}</span>
                        <span className="text-neutral-500 font-semibold uppercase">SHOTS TOTAL</span>
                        <span>{stats.shotsAway}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-neutral-850 text-neutral-300">
                        <span>{stats.foulsHome}</span>
                        <span className="text-neutral-500 font-semibold uppercase">FOULS COMMITTED</span>
                        <span>{stats.foulsAway}</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-neutral-300">
                        <span>{stats.yellowCardsHome}</span>
                        <span className="text-neutral-500 font-semibold uppercase">YELLOW CARDS</span>
                        <span>{stats.yellowCardsAway}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-500 tracking-widest text-center mt-3 uppercase font-bold">
                    OFFICIAL BROADCAST PROTOCOLS
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 22. LEAGUE TABLE (Tournament standings)                    */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.leagueTable && (
            <motion.div
              id="graphic-leaguetable"
              initial={{ x: 600, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 600, opacity: 0 }}
              className="absolute top-20 right-16 w-[560px] bg-[#111420]/95 border-r border-b shadow-2xl p-6 rounded-xl z-20 text-white border-neutral-800"
            >
              <div className="border-b border-neutral-850 pb-3 mb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">STANDINGS DIAGRAM</span>
                  <h3 className="text-xl font-black uppercase text-white tracking-tighter mt-0.5">LEAGUE TABLE</h3>
                </div>
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>

              {/* Standing Headers */}
              <div className="grid grid-cols-12 text-center text-[10px] font-black text-neutral-400 py-1 border-b border-neutral-850 uppercase">
                <div className="col-span-1 text-left">#</div>
                <div className="col-span-5 text-left">CLUB TEAM</div>
                <div className="col-span-1">P</div>
                <div className="col-span-1">W</div>
                <div className="col-span-1">GD</div>
                <div className="col-span-1">PTS</div>
                <div className="col-span-2 text-right">FP</div>
              </div>

              {/* Rows */}
              <div className="space-y-1 mt-1.5 max-h-[580px] overflow-y-auto pr-1 text-xs">
                {tournamentTeams
                  .sort((a, b) => b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) || b.fairPlayPoints - a.fairPlayPoints)
                  .map((team, idx) => {
                    const isFocus = team.id === "home" || team.id === "away";
                    return (
                      <div 
                        key={team.id} 
                        className={`grid grid-cols-12 text-center items-center py-2 px-1 rounded transition border border-transparent ${
                          isFocus ? "bg-amber-500/10 border-amber-500/20 text-white font-extrabold" : "bg-black/30 hover:bg-black/50 text-neutral-200"
                        }`}
                      >
                        <div className="col-span-1 font-mono font-bold text-neutral-400 text-left">{idx + 1}</div>
                        <div className="col-span-5 text-left flex items-center gap-2 font-bold max-w-[190px] truncate">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} className="w-[15px] h-[15px] object-contain" alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-[14px] h-[14px] rounded-full" style={{ backgroundColor: team.color }} />
                          )}
                          <span className="truncate">{team.name}</span>
                        </div>
                        <div className="col-span-1 font-semibold">{team.played}</div>
                        <div className="col-span-1">{team.won}</div>
                        <div className="col-span-1 font-mono text-neutral-350">
                          {team.goalsFor - team.goalsAgainst > 0 ? `+${team.goalsFor - team.goalsAgainst}` : team.goalsFor - team.goalsAgainst}
                        </div>
                        <div className="col-span-1 font-mono font-black text-amber-400">{team.points}</div>
                        <div className="col-span-2 text-right pr-1 font-mono text-neutral-400">{team.fairPlayPoints}</div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 23. FIXTURES & 24. UPCOMING MATCH                         */}
        {/* ========================================================= */}
        <AnimatePresence>
          {(graphics.fixtures || graphics.upcomingMatch) && (
            <motion.div
              id="graphic-upcoming-or-fixtures"
              initial={{ x: 600, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 600, opacity: 0 }}
              className="absolute top-20 right-16 w-[485px] bg-[#111422]/95 border-r border-b shadow-2xl p-6 rounded-xl z-20 text-white border-neutral-800"
            >
              <div className="border-b border-neutral-850 pb-3 mb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">MATCH CALENDAR</span>
                  <h3 className="text-xl font-black uppercase text-white tracking-tighter mt-0.5">
                    {graphics.fixtures ? "FIXTURES & SCHEDULE" : "UPCOMING SCHEDULE"}
                  </h3>
                </div>
                <Calendar className="w-6 h-6 text-amber-500" />
              </div>

              {graphics.fixtures && (
                <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {fixtures.map((fix) => {
                    const homeTObj = tournamentTeams.find(t => t.id === fix.homeTeamId);
                    const awayTObj = tournamentTeams.find(t => t.id === fix.awayTeamId);

                    return (
                      <div key={fix.id} className="bg-black/30 p-3 rounded border border-neutral-85 border-neutral-850 flex items-center justify-between text-xs">
                        <div className="w-[140px] truncate font-bold" style={{ color: homeTObj?.color }}>
                          {homeTObj?.name || "Home Team"}
                        </div>
                        
                        {/* Score or schedule time */}
                        <div className="bg-[#1b1c24] px-2.5 py-1 rounded font-black font-mono text-[11px] text-center w-[75px]">
                          {fix.status === "COMPLETED" ? (
                            <span className="text-white">{fix.homeScore} - {fix.awayScore}</span>
                          ) : fix.status === "LIVE" ? (
                            <span className="text-emerald-400 animate-pulse">LIVE</span>
                          ) : (
                            <span className="text-neutral-400">{fix.time}</span>
                          )}
                        </div>

                        <div className="w-[140px] text-right truncate font-bold" style={{ color: awayTObj?.color }}>
                          {awayTObj?.name || "Away Team"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {graphics.upcomingMatch && (
                <div className="p-4 bg-black/40 rounded-xl border border-neutral-850 flex flex-col items-center text-center">
                  <span className="bg-amber-400 text-neutral-950 font-black text-[10px] px-3.5 py-0.5 rounded-full tracking-widest block uppercase mb-4 shadow">
                    BROADCAST TRAILER
                  </span>
                  
                  {(() => {
                    const upcomingFixture = fixtures.find(f => f.status === "UPCOMING") || fixtures[3];
                    const hT = tournamentTeams.find(t => t.id === upcomingFixture.homeTeamId);
                    const aT = tournamentTeams.find(t => t.id === upcomingFixture.awayTeamId);

                    return (
                      <div className="w-full">
                        <div className="grid grid-cols-5 items-center gap-2 mb-6">
                          <div className="col-span-2 text-center flex flex-col items-center">
                            {hT?.logoUrl && <img src={hT.logoUrl} className="w-12 h-12 object-contain mb-2" alt="" referrerPolicy="no-referrer" />}
                            <span className="font-extrabold text-sm uppercase text-neutral-200 line-clamp-2">{hT?.name}</span>
                          </div>
                          <div className="col-span-1 text-center font-bold text-amber-500 text-sm">VS</div>
                          <div className="col-span-2 text-center flex flex-col items-center">
                            {aT?.logoUrl && <img src={aT.logoUrl} className="w-12 h-12 object-contain mb-2" alt="" referrerPolicy="no-referrer" />}
                            <span className="font-extrabold text-sm uppercase text-neutral-200 line-clamp-2">{aT?.name}</span>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-neutral-850 pt-4 text-xs font-semibold text-neutral-400">
                          <div className="flex justify-between">
                            <span>VENUE:</span>
                            <span className="text-white">{upcomingFixture.venue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DATE:</span>
                            <span className="text-white">{upcomingFixture.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>KICKOFF:</span>
                            <span className="text-emerald-400">{upcomingFixture.time} PM</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 25. TOURNAMENT BRACKET (Visual Knockout Tree)             */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.tournamentBracket && (
            <motion.div
              id="graphic-bracket"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="absolute inset-x-20 top-20 bottom-16 bg-[#11131a]/98 border-b-[8px] rounded-2xl overflow-hidden p-8 z-30 flex flex-col text-white border-yellow-500 shadow-2xl"
            >
              <div className="text-center pb-5 mb-5 border-b border-neutral-850">
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest block">CHAMPIONSHIP HUD PATH</span>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">KNOCKOUT PLAYOFF BRACKET</h2>
              </div>

              {/* 3 Columns representing Semifinals (L) | Finals (Middle) | Semifinals (R) */}
              <div className="flex-1 grid grid-cols-3 gap-6 items-center">
                {/* Semifinal A */}
                <div className="space-y-12">
                  <span className="text-[10px] font-black tracking-widest text-neutral-400 block text-center border-b border-neutral-850 pb-2">SEMIFINAL A</span>
                  
                  {/* Match Node */}
                  <div className="bg-black/40 border border-neutral-850 rounded-xl overflow-hidden p-4">
                    <div className="flex justify-between items-center py-1 border-b border-neutral-850 pb-2">
                      <span className="font-bold text-sky-400">Manchester Blue</span>
                      <span className="font-mono bg-neutral-900 border border-neutral-800 text-white text-xs px-2 py-0.5 rounded">3</span>
                    </div>
                    <div className="flex justify-between items-center py-1 pt-2">
                      <span className="font-bold text-orange-450 text-neutral-400">Manchester Red</span>
                      <span className="font-mono bg-neutral-900 border border-neutral-800 text-white text-xs px-2 py-0.5 rounded">1</span>
                    </div>
                  </div>
                </div>

                {/* GRAND FINAL */}
                <div className="space-y-12 bg-neutral-900/40 p-6 rounded-2xl border border-yellow-500/20 relative flex flex-col items-center">
                  <div className="absolute top-3 bg-amber-500 text-neutral-950 font-black text-[9px] px-3.5 py-0.5 rounded-full tracking-widest uppercase">
                    GRAND CHAMPIONSHIP
                  </div>

                  <div className="w-full mt-4">
                    <div className="bg-neutral-950/80 border-2 border-amber-500/40 rounded-xl p-5 shadow-xl text-center">
                      <div className="flex flex-col items-center gap-1.5 border-b border-neutral-850 pb-3 mb-3">
                        <Trophy className="w-8 h-8 text-amber-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-amber-500 tracking-wider uppercase">LIVESTREAM GRAND FINALS</span>
                      </div>

                      <div className="space-y-3 font-black text-sm">
                        <div className="flex justify-between">
                          <span className="text-sky-400">Manchester Blue</span>
                          <span className="font-mono text-amber-400">HOME</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-500">London Red</span>
                          <span className="font-mono text-neutral-400">AWAY</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Semifinal B */}
                <div className="space-y-12">
                  <span className="text-[10px] font-black tracking-widest text-neutral-400 block text-center border-b border-neutral-850 pb-2">SEMIFINAL B</span>
                  
                  {/* Match Node */}
                  <div className="bg-black/40 border border-neutral-850 rounded-xl overflow-hidden p-4">
                    <div className="flex justify-between items-center py-1 border-b border-neutral-850 pb-2">
                      <span className="font-bold text-red-600">London Red</span>
                      <span className="font-mono bg-neutral-900 border border-neutral-800 text-white text-xs px-2 py-0.5 rounded">2</span>
                    </div>
                    <div className="flex justify-between items-center py-1 pt-2">
                      <span className="font-bold text-blue-500">West London Blue</span>
                      <span className="font-mono bg-neutral-900 border border-neutral-800 text-white text-xs px-2 py-0.5 rounded">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 26. SPONSOR GRAPHIC (Bottom Strip overlay)                 */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.sponsorGraphic && (
            <motion.div
              id="graphic-sponsorbar"
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="absolute bottom-12 inset-x-24 bg-neutral-950/95 border-l-8 border-r-8 shadow-2xl px-8 py-3.5 rounded-lg z-20 text-white flex justify-between items-center"
              style={{ borderColor: "#f59e0b" }}
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-black tracking-widest uppercase">MATCH PRESENTATION PARTNER</span>
              </div>
              <div className="font-black italic text-base text-amber-400 flex items-center gap-2">
                <span>{activeSponsor}</span>
                <span className="text-white text-xs font-normal">| ALL RIGHTS RESERVED</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 27. LOWER THIRD                                           */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.lowerThird && (
            <motion.div
              id="graphic-lowerthird"
              initial={{ x: -600, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -600, opacity: 0 }}
              className="absolute bottom-24 left-16 w-[550px] border-l-[12px] shadow-2xl p-6 rounded-r-xl z-20"
              style={{ 
                background: getThemedContainerStyle(homeTeam.color || "#3b82f6").background,
                color: getThemedContainerStyle("#ffffff").color,
                borderColor: getThemedContainerStyle(homeTeam.color || "#3b82f6").borderColor 
              }}
            >
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-80" style={{ color: getThemedContainerStyle("#fbbf24").borderColor }}>
                  {activeGraphicSettings.lowerThird?.customText2 || "LIVE COMMENTARY"}
                </span>
                <h2 className="text-2xl font-black uppercase italic tracking-tight leading-tight">
                  {activeGraphicSettings.lowerThird?.customText1 || "PEP GUARDIOLA"}
                </h2>
                <div className="h-[2px] bg-neutral-800 my-2 w-full" />
                <p className="text-xs text-neutral-400 font-medium">
                  {activeGraphicSettings.lowerThird?.customText2 ? "MATCH INTERVIEW SPECTATIVE" : "MANCHESTER BLUE CLUB MANAGER"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 28. BREAKING NEWS TICKER (Bottom Crawling News Strip)       */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.breakingNewsTicker && (
            <motion.div
              id="graphic-newsticker"
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              className="absolute bottom-0 inset-x-0 bg-[#0c0d12]/95 border-t border-neutral-900 h-10 flex items-center z-40 text-sm overflow-hidden select-none"
            >
              <div className="bg-amber-500 text-neutral-950 font-black px-5 h-full flex items-center uppercase text-xs italic tracking-tight z-10 whitespace-nowrap shadow-md">
                BREAKING UPDATE
              </div>
              
              <div className="flex-1 w-full relative overflow-hidden h-full flex items-center bg-black/60">
                {/* Rolling sliding message */}
                <motion.div
                  initial={{ x: "80%" }}
                  animate={{ x: "-100%" }}
                  transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                  className="font-mono text-neutral-300 font-bold tracking-tight whitespace-nowrap pl-4 pr-10 flex items-center gap-1.5"
                >
                  <Newspaper className="w-4 h-4 text-amber-500 inline mr-2" />
                  <span>{newsTickerText || `Live Match Feed: ${homeTeam.shortName} vs ${awayTeam.shortName}. High intensity play in selected stadiums output.`}</span>
                  <span className="text-neutral-500 mx-5">|</span>
                  <span className="text-emerald-400 font-extrabold uppercase py-0.5 px-2 bg-neutral-900 border border-neutral-800 rounded">CHAMPIONSHIP HUD ACTIVE</span>
                  <span className="text-neutral-500 mx-5">|</span>
                  <span>Referee crew checks VAR overturned timelines periodically. Keep monitor alerts.</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 29. VAR REVIEW GRAPHIC (Crimson Screen alert)              */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.varReviewGraphic && (
            <motion.div
              id="graphic-varreview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/20 backdrop-blur-[3px] border-[16px] border-red-900/60 flex items-center justify-center z-50 text-white"
            >
              <motion.div 
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black/95 border-2 border-red-650 rounded-2xl p-10 max-w-lg w-full text-center flex flex-col items-center justify-center shadow-2xl relative"
              >
                {/* Pulse Glow Light */}
                <div className="absolute top-1/2 left-1/2 -ml-24 -mt-24 w-48 h-48 bg-red-600/10 blur-3xl rounded-full" />

                <ShieldAlert className="w-16 h-16 text-red-500 animate-pulse mb-4 z-10" />
                
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-red-500 z-10">
                  {activeGraphicSettings.varReviewGraphic?.customText1 || "VAR REVIEW IN PROGRESS"}
                </h2>

                <div className="h-[2px] bg-neutral-850 my-4 w-1/2 z-10" />

                <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold z-10">INCIDENT ENQUIRY</p>
                <p className="text-base font-extrabold text-white uppercase italic mt-1 z-10 max-w-sm">
                  {activeGraphicSettings.varReviewGraphic?.customText2 || "CHECKING POTENTIAL HANDBALL / PENALTY AWARD"}
                </p>

                <div className="mt-6 flex gap-2 justify-center z-10">
                  <span className="bg-red-900/40 text-red-400 text-[10px] font-black tracking-widest uppercase border border-red-900/60 px-3.5 py-1 rounded-full">
                    OFFICIAL REVIEW
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 30. INJURY TIME GRAPHIC (Time slide indication)           */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.injuryTimeGraphic && (
            <motion.div
              id="graphic-injury-time-overlay"
              initial={{ y: -180, opacity: 0, x: "-50%" }}
              animate={{ y: 0, opacity: 1, x: "-50%" }}
              exit={{ y: -180, opacity: 0, x: "-50%" }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="absolute top-10 left-1/2 bg-[#121422]/95 border-b-[8px] border-amber-500 shadow-2xl px-12 py-5 rounded-xl z-40 text-center flex flex-col items-center gap-1 min-w-[320px]"
            >
              <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse mb-1" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">OFFICIAL STOPPAGE TIME</span>
              <span className="text-4xl font-black font-mono tracking-tighter text-white">
                {activeGraphicSettings.injuryTimeGraphic?.customText1 || `+${stoppageMinutes}`}
              </span>
              <span className="text-[9px] text-neutral-400 uppercase tracking-wider block mt-0.5">ADDITIONAL MINUTES DECLARED</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* 31. RESULT OVERLAY GRAPHIC GROUP                          */}
        {/* ========================================================= */}
        <AnimatePresence>
          {graphics.resultGraphic && (
            <motion.div
              id="graphic-match-result-overlay"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="absolute inset-x-24 top-24 bottom-20 bg-[#0e111d]/98 border-t-8 border-amber-500 shadow-2xl p-10 rounded-2xl z-40 flex flex-col justify-between text-white"
            >
              <div className="text-center">
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black tracking-widest uppercase border border-amber-500/20 px-3.5 py-1 rounded-full">
                  {matchInfo.tournamentName} • {matchInfo.season}
                </span>
                <h2 className="text-4xl font-black italic tracking-tighter mt-4 uppercase">
                  OFFICIAL MATCH RESULT
                </h2>
              </div>

              {/* Major Team comparison panel */}
              <div className="flex justify-around items-center px-6 my-4 select-none">
                {/* Home */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-black/40 border-4 p-4 flex items-center justify-center shadow-lg" style={{ borderColor: homeTeam.color }}>
                    {homeTeam.logoUrl ? (
                      <img src={homeTeam.logoUrl} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <Trophy className="w-12 h-12 text-[#999]" />
                    )}
                  </div>
                  <span className="text-xl font-black mt-3 uppercase">{homeTeam.name}</span>
                  <span className="text-xs text-neutral-400 font-bold uppercase">{homeTeam.shortName}</span>
                </div>

                {/* Score numbers */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-6xl font-black font-mono tracking-tight gap-6">
                    <span>{appState.timeline.filter(e => (e.type === MatchEventType.GOAL || e.type === MatchEventType.PENALTY_GOAL) && e.teamId === "home").length + appState.timeline.filter(e => e.type === MatchEventType.OWN_GOAL && e.teamId === "away").length}</span>
                    <span className="text-neutral-600 font-normal">:</span>
                    <span>{appState.timeline.filter(e => (e.type === MatchEventType.GOAL || e.type === MatchEventType.PENALTY_GOAL) && e.teamId === "away").length + appState.timeline.filter(e => e.type === MatchEventType.OWN_GOAL && e.teamId === "home").length}</span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-neutral-500 uppercase tracking-widest">FINAL SCORE</div>
                </div>

                {/* Away */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-black/40 border-4 p-4 flex items-center justify-center shadow-lg" style={{ borderColor: awayTeam.color }}>
                    {awayTeam.logoUrl ? (
                      <img src={awayTeam.logoUrl} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <Trophy className="w-12 h-12 text-[#999]" />
                    )}
                  </div>
                  <span className="text-xl font-black mt-3 uppercase">{awayTeam.name}</span>
                  <span className="text-xs text-neutral-400 font-bold uppercase">{awayTeam.shortName}</span>
                </div>
              </div>

              {/* Status Outcome Banner */}
              <div className="text-center bg-black/60 border border-neutral-850 p-4 rounded-xl max-w-xl mx-auto w-full">
                <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase block mb-1">DECISIVE VERDICT</span>
                <span className="text-2xl font-black uppercase text-white">
                  {appState.matchResultStatus === "HOME_WIN" && `${homeTeam.name.toUpperCase()} VICTORIOUS`}
                  {appState.matchResultStatus === "AWAY_WIN" && `${awayTeam.name.toUpperCase()} VICTORIOUS`}
                  {appState.matchResultStatus === "DRAW" && "MATCH CONCLUDED IN A DRAW"}
                  {appState.matchResultStatus === "ABANDONED" && "⚠️ MATCH OFFICIALLY ABANDONED"}
                  {appState.matchResultStatus === "SUSPENDED" && "🚨 MATCH OFFICIALLY SUSPENDED"}
                  {!appState.matchResultStatus && "MATCH CONCLUDED"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ========================================================= */}
        {/* 31. PENALTY SHOOTOUT OVERLAY GRAPHIC                     */}
        {/* ========================================================= */}
        <AnimatePresence>
          {appState.penaltyShootout?.enabled && (
            <motion.div
              id="graphic-penalties"
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[600px] border-t-4 shadow-2xl p-6 rounded-b-xl z-30 flex flex-col gap-4"
              style={{
                background: getThemedContainerStyle("#fbbf24").background,
                color: getThemedContainerStyle("#ffffff").color,
                borderColor: getThemedContainerStyle("#fbbf24").borderColor
              }}
            >
              <div className="text-center mb-1 pb-2 border-b border-neutral-750/30">
                <span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: getThemedContainerStyle("#fbbf24").borderColor }}>
                  Decisive Kicks from the Penalty Mark
                </span>
                <h3 className="text-2xl font-black italic tracking-tight uppercase">
                  Penalty Shootout
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Home Team Shootout Column */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm uppercase flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: homeTeam.color }} />
                      {homeTeam.name}
                    </span>
                    <span className="text-2xl font-black text-white px-2.5 py-0.5 bg-black/40 rounded font-mono">
                      {appState.penaltyShootout.homeScore}
                    </span>
                  </div>
                  
                  {/* Kicks visual indicators */}
                  <div className="flex items-center gap-2 bg-black/20 p-2.5 rounded-lg border border-neutral-850/50 justify-between">
                    {appState.penaltyShootout.homeKicks.map((kick, idx) => (
                      <div 
                        key={idx}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                          kick === "scored" ? "bg-emerald-500 text-neutral-900 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                          kick === "missed" ? "bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.5)]" :
                          "bg-neutral-800 text-neutral-500 border border-neutral-700/60"
                        }`}
                      >
                        {kick === "scored" ? "✓" : kick === "missed" ? "✗" : idx + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Away Team Shootout Column */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm uppercase flex items-center gap-2">
                       <span className="inline-block w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: awayTeam.color }} />
                      {awayTeam.name}
                    </span>
                    <span className="text-2xl font-black text-white px-2.5 py-0.5 bg-black/40 rounded font-mono">
                      {appState.penaltyShootout.awayScore}
                    </span>
                  </div>

                  {/* Kicks visual indicators */}
                  <div className="flex items-center gap-2 bg-black/20 p-2.5 rounded-lg border border-neutral-850/50 justify-between">
                    {appState.penaltyShootout.awayKicks.map((kick, idx) => (
                      <div 
                        key={idx}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                          kick === "scored" ? "bg-emerald-500 text-neutral-900 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                          kick === "missed" ? "bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.5)]" :
                          "bg-neutral-800 text-neutral-500 border border-neutral-700/60"
                        }`}
                      >
                        {kick === "scored" ? "✓" : kick === "missed" ? "✗" : idx + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status turn message */}
              <div className="mt-2 text-center">
                <span className="text-xs uppercase bg-black/40 px-3.5 py-1.5 rounded-lg text-neutral-300 font-extrabold flex items-center justify-center gap-1.5 max-w-sm mx-auto border border-neutral-800/40">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-amber-400 animate-pulse" />
                  KICKER TURN: <span className="text-white font-black uppercase">{(appState.penaltyShootout.currentTeam === "home" ? homeTeam.name : awayTeam.name).toUpperCase()} (KICK {appState.penaltyShootout.currentKickerIndex + 1})</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
