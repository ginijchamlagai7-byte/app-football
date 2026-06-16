/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BroadcastControlRoom } from "./components/BroadcastControlRoom";
import { LiveGraphicsOverlay } from "./components/LiveGraphicsOverlay";
import React, { useState, useEffect } from "react";
import { AppState } from "./types";

export default function App() {
  const [isOverlayOnly, setIsOverlayOnly] = useState(false);
  const [syncedState, setSyncedState] = useState<AppState | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("overlay") === "true") {
      setIsOverlayOnly(true);
      
      // Force base documents to default transparent for OBS Studio browser source
      document.body.style.backgroundColor = "transparent";
      document.documentElement.style.backgroundColor = "transparent";
      
      // Load initially from localStorage
      const loadState = () => {
        const saved = localStorage.getItem("match_broadcast_state");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === "object") {
              setSyncedState(parsed);
            }
          } catch (e) {
            console.error("Error parsing sync state", e);
          }
        }
      };

      loadState();

      // Listen to cross-window storage change events
      const handleStorage = (e: StorageEvent) => {
        if (e.key === "match_broadcast_state" && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && typeof parsed === "object") {
              setSyncedState(parsed);
            }
          } catch (err) {
            console.error("Error syncing storage event state", err);
          }
        }
      };

      window.addEventListener("storage", handleStorage);

      // Safe continuous polling backup for isolated CEF browser instances inside OBS Studio
      const interval = setInterval(loadState, 500);

      return () => {
        window.removeEventListener("storage", handleStorage);
        clearInterval(interval);
      };
    }
  }, []);

  if (isOverlayOnly) {
    if (!syncedState) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#07090e] text-amber-500 font-sans p-8 text-center uppercase tracking-widest gap-3 select-none">
          <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-amber-500 animate-spin" />
          <span className="text-xs font-black">Syncing OBS Browser Feed...</span>
          <p className="text-[10px] text-neutral-500 max-w-xs lowercase mt-2 font-mono leading-relaxed">
            Please open the Broadcast Control Room in another workspace tab to stream live graphic feeds here.
          </p>
        </div>
      );
    }

    return (
      <div className="w-screen h-screen overflow-hidden bg-transparent">
        <LiveGraphicsOverlay appState={syncedState} showTransparentBackground={true} />
      </div>
    );
  }

  return (
    <div id="app-viewport-wrapper" className="w-screen min-h-screen overflow-x-hidden bg-[#07090e]">
      <BroadcastControlRoom />
    </div>
  );
}
