import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  BrainCircuit,
  Award,
  Activity,
  HeartPulse,
  Palette,
  User,
  UserPlus
} from 'lucide-react';
import type { CognitiveMonitorMetrics } from '../creativity-types';
import { GuiThemeModal } from './GuiThemeModal';
import { getStoredGuiTheme, type GuiColorPalette } from '../gui-theme';
import { getLocalCachedProfile, subscribeToProfileSync, type CloudUserProfile } from '../storage';

interface HeaderProps {
  activeTab: 'exercises' | 'emotional-regulation' | 'diagnostic' | 'muse' | 'progress';
  onSelectTab: (tab: 'exercises' | 'emotional-regulation' | 'diagnostic' | 'muse' | 'progress') => void;
  liveMetrics?: CognitiveMonitorMetrics;
  onOpenProfile?: () => void;
  onOpenCreateProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  liveMetrics,
  onOpenProfile,
  onOpenCreateProfile
}) => {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<GuiColorPalette>(() => getStoredGuiTheme());
  const [activeProfile, setActiveProfile] = useState<CloudUserProfile>(() => getLocalCachedProfile());

  useEffect(() => {
    const unsub = subscribeToProfileSync((updated) => {
      setActiveProfile(updated);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<GuiColorPalette>;
      if (custom.detail) setCurrentTheme(custom.detail);
    };
    const openHandler = () => {
      setIsThemeModalOpen(true);
    };

    window.addEventListener('gui-theme-changed', handler);
    window.addEventListener('open-gui-theme-modal', openHandler);
    return () => {
      window.removeEventListener('gui-theme-changed', handler);
      window.removeEventListener('open-gui-theme-modal', openHandler);
    };
  }, []);

  const getFlowBadge = () => {
    if (!liveMetrics) return null;
    const { flowState, flowScore, divergenceIndex } = liveMetrics;
    let label = 'Convergent Focus';
    let colorClass = 'flow-convergent';

    if (flowState === 'generative_flow') {
      label = `Generative Flow (${flowScore}%)`;
      colorClass = 'flow-peak';
    } else if (flowState === 'divergent_expansion') {
      label = `Divergent Flux (${divergenceIndex}%)`;
      colorClass = 'flow-divergent';
    } else if (flowState === 'bisociative_incubation') {
      label = 'Bisociative Cross-Linking';
      colorClass = 'flow-incubation';
    }

    return (
      <div className={`live-flow-indicator ${colorClass}`} title={liveMetrics.phaseDescription}>
        <div className="flow-pulse-dot" />
        <span className="flow-label">{label}</span>
      </div>
    );
  };

  return (
    <>
      <header className="studio-header">
        <div className="header-brand-row">
          <div className="brand-group">
            <div className="brand-icon-wrap">
              <Sparkles className="brand-icon" size={24} />
            </div>
            <div>
              <div className="brand-eyebrow">A.I. Augmented Ideation & Assessment</div>
              <h1 className="brand-title">Convergence Form Extractor</h1>
            </div>
          </div>

          <div className="header-status-group">
            {getFlowBadge()}

            <button
              type="button"
              className="btn-gui-theme-trigger"
              onClick={() => setIsThemeModalOpen(true)}
              title="Customize Global GUI Colors & Theme"
            >
              <Palette size={15} style={{ color: currentTheme.accent }} />
              <span>Customize GUI</span>
              <span
                className="header-theme-dot"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`
                }}
              />
            </button>

            {onOpenCreateProfile && (
              <button
                type="button"
                className="btn-gui-theme-trigger btn-create-profile-badge"
                onClick={onOpenCreateProfile}
                title="Create a new user persona / profile"
              >
                <UserPlus size={15} style={{ color: '#10b981' }} />
                <span>+ Create Profile</span>
              </button>
            )}

            {onOpenProfile && (
              <button
                type="button"
                className="btn-gui-theme-trigger btn-profile-trigger"
                onClick={onOpenProfile}
                title={`Active Profile: ${activeProfile.displayName} (${activeProfile.archetype || 'Persona'})`}
              >
                <span
                  className="header-avatar-mini"
                  style={{
                    color: activeProfile.avatarColor || '#f59e0b',
                    borderColor: `${activeProfile.avatarColor || '#f59e0b'}55`
                  }}
                >
                  {activeProfile.avatarIcon || 'ॐ'}
                </span>
                <span>{activeProfile.displayName || 'Profile'}</span>
              </button>
            )}
          </div>
        </div>

        <nav className="studio-nav" aria-label="Studio Navigation">
          <button
            type="button"
            className={`nav-tab ${activeTab === 'exercises' ? 'active' : ''}`}
            onClick={() => onSelectTab('exercises')}
          >
            <Compass size={16} />
            <span>Numinous Cognizance Trainer (NCT)</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'emotional-regulation' ? 'active' : ''}`}
            onClick={() => onSelectTab('emotional-regulation')}
          >
            <HeartPulse size={16} />
            <span>Emotional Regulation</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'diagnostic' ? 'active' : ''}`}
            onClick={() => onSelectTab('diagnostic')}
          >
            <Activity size={16} />
            <span>Diagnostic Assessment</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'muse' ? 'active' : ''}`}
            onClick={() => onSelectTab('muse')}
          >
            <BrainCircuit size={16} />
            <span>Co-Creative Muse</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => onSelectTab('progress')}
          >
            <Award size={16} />
            <span>Growth & Milestones</span>
          </button>
        </nav>
      </header>

      {/* Global GUI Theme & Color Studio Modal */}
      <GuiThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </>
  );
};
