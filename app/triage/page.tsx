// =============================================================================
// Triage Intake Page
// =============================================================================
// Main page for triage intake with conversation capture
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

'use client';

import React, { useState } from 'react';
import { TriageIntakeForm } from './components/TriageIntakeForm';
import './styles/triage.css';

export default function TriagePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`triage-page ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="page-container">
        <header className="page-header">
          <div className="header-content">
            <h1 className="page-title">Triage Intake</h1>
            <p className="page-subtitle">
              Free Intelligence - Capture consultation details
            </p>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </header>

        <main className="page-main">
          <TriageIntakeForm darkMode={isDarkMode} />
        </main>

        <footer className="page-footer">
          <p>
            <strong>⚕️ Aurity Framework</strong> - Sprint SPR-2025W44
          </p>
          <p className="footer-note">
            ⚠️ No PHI (Protected Health Information) - Data stored ephemerally
          </p>
        </footer>
      </div>
    </div>
  );
}
