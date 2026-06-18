/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BroadcastControlRoom, createDefaultState } from "./components/BroadcastControlRoom";
import { LiveGraphicsOverlay } from "./components/LiveGraphicsOverlay";
import React, { useState, useEffect } from "react";
import { AppState } from "./types";
import { getBroadcastStorageKey, loadBroadcastState, normalizeBroadcastUser, sanitizeState } from "./lib/broadcastStateService";

export default function App() {
  const [isOverlayOnly] = useState(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return params.get("overlay") === "true";
  });
  const [syncedState, setSyncedState] = useState<AppState | null>(null);

  useEffect(() => {
    if (isOverlayOnly) {
      const params = new URLSearchParams(window.location.search);
      const overlayUser = normalizeBroadcastUser(params.get("user"));
      
      // Force base documents to default transparent for OBS Studio browser source
      document.body.style.backgroundColor = "transparent";
      document.documentElement.style.backgroundColor = "transparent";
      
      // Load from the shared Vite database first, then fall back to browser storage.
      const loadState = async () => {
        try {
          const remoteRecord = await loadBroadcastState(overlayUser);
          if (remoteRecord?.state) {
            const sanitized = sanitizeState(remoteRecord.state, createDefaultState());
            setSyncedState(sanitized);
            localStorage.setItem(getBroadcastStorageKey(overlayUser), JSON.stringify(sanitized));
            localStorage.setItem("match_broadcast_state", JSON.stringify(sanitized));
            return;
          }
        } catch (err) {
          console.warn("Broadcast database unavailable, using local overlay cache", err);
        }

        const saved = localStorage.getItem(getBroadcastStorageKey(overlayUser)) || localStorage.getItem("match_broadcast_state");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === "object") {
              const sanitized = sanitizeState(parsed, createDefaultState());
              setSyncedState(sanitized);
            }
          } catch (e) {
            console.error("Error parsing sync state", e);
          }
        }
      };

      loadState();

      // Listen to cross-window storage change events
      const handleStorage = (e: StorageEvent) => {
        if ((e.key === "match_broadcast_state" || e.key === getBroadcastStorageKey(overlayUser)) && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && typeof parsed === "object") {
              const sanitized = sanitizeState(parsed, createDefaultState());
              setSyncedState(sanitized);
            }
          } catch (err) {
            console.error("Error syncing storage event state", err);
          }
        }
      };

      window.addEventListener("storage", handleStorage);

      // Safe continuous polling backup for isolated CEF browser instances inside OBS Studio
      const interval = setInterval(loadState, 750);

      return () => {
        window.removeEventListener("storage", handleStorage);
        clearInterval(interval);
      };
    }
  }, [isOverlayOnly]);

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
