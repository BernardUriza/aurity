"use client";

/**
 * Onboarding Flow Component
 *
 * Card: FI-UX-STR-001
 * 3-phase onboarding: Identity → First Session → Export Test
 */

import { useState, useEffect } from "react";
import { MICROCOPYS } from "@/lib/microcopys";

type Phase = "welcome" | "identity" | "first_session" | "export_test" | "complete";

const STORAGE_KEY = "fi_onboarding_progress";

interface OnboardingState {
  phase: Phase;
  identity: string;
  sessionName: string;
  firstThought: string;
}

export function OnboardingFlow() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [identity, setIdentity] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [firstThought, setFirstThought] = useState("");

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: OnboardingState = JSON.parse(saved);
        setPhase(state.phase);
        setIdentity(state.identity || "");
        setSessionName(state.sessionName || "");
        setFirstThought(state.firstThought || "");
      }
    } catch (error) {
      console.error("Failed to load onboarding progress:", error);
    }
  }, []);

  // Save progress to localStorage whenever state changes
  useEffect(() => {
    try {
      const state: OnboardingState = {
        phase,
        identity,
        sessionName,
        firstThought,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save onboarding progress:", error);
      // Handle quota exceeded or other localStorage errors
    }
  }, [phase, identity, sessionName, firstThought]);

  const renderPhase = () => {
    switch (phase) {
      case "welcome":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-50">
              {MICROCOPYS.onboarding.welcome.title}
            </h1>
            <p className="text-slate-300 whitespace-pre-line">
              {MICROCOPYS.onboarding.welcome.subtitle}
            </p>
            <button
              onClick={() => setPhase("identity")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              {MICROCOPYS.onboarding.welcome.cta}
            </button>
          </div>
        );

      case "identity":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-50">
              {MICROCOPYS.onboarding.identity.title}
            </h2>
            <div className="space-y-2">
              <input
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder={MICROCOPYS.onboarding.identity.placeholder}
                className="w-full px-4 py-3 bg-slate-800 text-slate-50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-slate-400">
                {MICROCOPYS.onboarding.identity.helper}
              </p>
            </div>
            <button
              onClick={() => setPhase("first_session")}
              disabled={!identity}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {MICROCOPYS.onboarding.identity.cta}
            </button>
          </div>
        );

      case "first_session":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-50">
              {MICROCOPYS.onboarding.firstSession.title}
            </h2>
            <p className="text-slate-300 whitespace-pre-line">
              {MICROCOPYS.onboarding.firstSession.description}
            </p>
            <div className="space-y-4">
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder={MICROCOPYS.onboarding.firstSession.namePlaceholder}
                className="w-full px-4 py-3 bg-slate-800 text-slate-50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={firstThought}
                onChange={(e) => setFirstThought(e.target.value)}
                placeholder={MICROCOPYS.onboarding.firstSession.promptPlaceholder}
                rows={4}
                className="w-full px-4 py-3 bg-slate-800 text-slate-50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setPhase("export_test")}
              disabled={!sessionName || !firstThought}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {MICROCOPYS.onboarding.firstSession.cta}
            </button>
          </div>
        );

      case "export_test":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-50">
              {MICROCOPYS.onboarding.exportTest.title}
            </h2>
            <p className="text-slate-300 whitespace-pre-line">
              {MICROCOPYS.onboarding.exportTest.description}
            </p>
            <div className="space-y-3">
              {Object.entries(MICROCOPYS.onboarding.exportTest.formats).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition"
                >
                  <input
                    type="radio"
                    name="format"
                    value={key}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-slate-50">{label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setPhase("complete")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              {MICROCOPYS.onboarding.exportTest.cta}
            </button>
          </div>
        );

      case "complete":
        const clearProgress = () => {
          try {
            localStorage.removeItem(STORAGE_KEY);
            // Reset to initial state
            setPhase("welcome");
            setIdentity("");
            setSessionName("");
            setFirstThought("");
          } catch (error) {
            console.error("Failed to clear onboarding progress:", error);
          }
        };

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-400">
              {MICROCOPYS.onboarding.complete.title}
            </h2>
            <p className="text-slate-300 whitespace-pre-line">
              {MICROCOPYS.onboarding.complete.description}
            </p>
            <div className="flex space-x-4">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                {MICROCOPYS.onboarding.complete.ctaPrimary}
              </button>
              <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">
                {MICROCOPYS.onboarding.complete.ctaSecondary}
              </button>
              <button
                onClick={clearProgress}
                className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                Clear Progress & Restart
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900/50 p-8 rounded-xl border border-slate-800">
        {renderPhase()}

        {/* Progress indicator */}
        <div className="mt-8 flex justify-center space-x-2">
          {["welcome", "identity", "first_session", "export_test", "complete"].map((p, i) => (
            <div
              key={p}
              className={`h-2 w-12 rounded-full transition ${
                phase === p
                  ? "bg-blue-500"
                  : i < ["welcome", "identity", "first_session", "export_test", "complete"].indexOf(phase)
                  ? "bg-blue-700"
                  : "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
