import React from 'react';
import { Compass, HeartPulse, Activity, BrainCircuit, Award, User } from 'lucide-react';

interface AndroidBottomNavProps {
  activeTab: 'exercises' | 'emotional-regulation' | 'diagnostic' | 'muse' | 'progress';
  onSelectTab: (tab: 'exercises' | 'emotional-regulation' | 'diagnostic' | 'muse' | 'progress') => void;
  onOpenProfile: () => void;
  unreadCount?: number;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenProfile
}) => {
  const handleTabClick = (tab: 'exercises' | 'emotional-regulation' | 'diagnostic' | 'muse' | 'progress') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // safely ignore
      }
    }
    onSelectTab(tab);
  };

  return (
    <nav className="android-bottom-bar" aria-label="Android Mobile Navigation">
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'emotional-regulation' ? 'active' : ''}`}
        onClick={() => handleTabClick('emotional-regulation')}
      >
        <div className="android-icon-wrapper">
          <HeartPulse size={20} />
          <span className="android-ripple" />
        </div>
        <span className="android-nav-label">Sanctuary</span>
      </button>

      <button
        type="button"
        className={`android-nav-item ${activeTab === 'exercises' ? 'active' : ''}`}
        onClick={() => handleTabClick('exercises')}
      >
        <div className="android-icon-wrapper">
          <Compass size={20} />
          <span className="android-ripple" />
        </div>
        <span className="android-nav-label">Drills</span>
      </button>

      <button
        type="button"
        className={`android-nav-item ${activeTab === 'diagnostic' ? 'active' : ''}`}
        onClick={() => handleTabClick('diagnostic')}
      >
        <div className="android-icon-wrapper">
          <Activity size={20} />
          <span className="android-ripple" />
        </div>
        <span className="android-nav-label">Diagnostics</span>
      </button>

      <button
        type="button"
        className={`android-nav-item ${activeTab === 'muse' ? 'active' : ''}`}
        onClick={() => handleTabClick('muse')}
      >
        <div className="android-icon-wrapper">
          <BrainCircuit size={20} />
          <span className="android-ripple" />
        </div>
        <span className="android-nav-label">Muse</span>
      </button>

      <button
        type="button"
        className={`android-nav-item ${activeTab === 'progress' ? 'active' : ''}`}
        onClick={() => handleTabClick('progress')}
      >
        <div className="android-icon-wrapper">
          <Award size={20} />
          <span className="android-ripple" />
        </div>
        <span className="android-nav-label">Ledger</span>
      </button>

      <button
        type="button"
        className="android-nav-item"
        onClick={onOpenProfile}
      >
        <div className="android-icon-wrapper">
          <User size={20} />
          <span className="android-ripple" />
        </div>
        <span className="android-nav-label">Profile</span>
      </button>
    </nav>
  );
};
