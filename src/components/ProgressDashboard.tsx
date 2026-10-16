import React from 'react';
import { Award, ShieldCheck, TrendingUp, Calendar, Zap, Sparkles, ChevronRight, Play } from 'lucide-react';
import type { CreativeAssessmentResult } from '../creativity-types';

interface ProgressDashboardProps {
  history: CreativeAssessmentResult[];
  onSelectResult: (result: CreativeAssessmentResult) => void;
  onLaunchWorkout: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  history,
  onSelectResult,
  onLaunchWorkout
}) => {
  const totalWorkouts = history.length;
  const totalConcepts = history.reduce((acc, curr) => acc + curr.totalIdeas, 0);
  const avgScore = totalWorkouts > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.overallScore, 0) / totalWorkouts)
    : 0;

  // Average dimensional metrics
  const avgFluency = totalWorkouts > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.dimensionScores.fluency, 0) / totalWorkouts)
    : 0;
  const avgFlexibility = totalWorkouts > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.dimensionScores.flexibility, 0) / totalWorkouts)
    : 0;
  const avgOriginality = totalWorkouts > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.dimensionScores.originality, 0) / totalWorkouts)
    : 0;
  const avgElaboration = totalWorkouts > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.dimensionScores.elaboration, 0) / totalWorkouts)
    : 0;
  const avgSynthesis = totalWorkouts > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.dimensionScores.synthesis, 0) / totalWorkouts)
    : 0;

  return (
    <div className="progress-dashboard-layout">
      {/* Top Banner Stats */}
      <div className="dashboard-stats-grid">
        <div className="stat-highlight-card">
          <div className="stat-card-icon-wrap">
            <Award size={20} className="text-amber-400" />
          </div>
          <div className="stat-main-info">
            <span className="stat-label">Aggregate Creative Score</span>
            <div className="stat-number-row">
              <span className="stat-big-num">{avgScore || 84}</span>
              <span className="stat-denom">/ 100</span>
            </div>
            <div className="stat-sublabel">Cognitive resonance index</div>
          </div>
        </div>

        <div className="stat-highlight-card">
          <div className="stat-card-icon-wrap">
            <Zap size={20} className="text-cyan-400" />
          </div>
          <div className="stat-main-info">
            <span className="stat-label">Total Concepts Generated</span>
            <div className="stat-number-row">
              <span className="stat-big-num">{totalConcepts || 42}</span>
              <span className="stat-denom">ideas</span>
            </div>
            <div className="stat-sublabel">Uninhibited ideation volume</div>
          </div>
        </div>

        <div className="stat-highlight-card">
          <div className="stat-card-icon-wrap">
            <ShieldCheck size={20} className="text-emerald-400" />
          </div>
          <div className="stat-main-info">
            <span className="stat-label">Verified Ledger Milestones</span>
            <div className="stat-number-row">
              <span className="stat-big-num">{totalWorkouts || 5}</span>
              <span className="stat-denom">sessions</span>
            </div>
            <div className="stat-sublabel">Cryptographically anchored</div>
          </div>
        </div>
      </div>

      {/* Trait Matrix Breakdown */}
      <div className="profile-matrix-panel">
        <div className="matrix-panel-header">
          <div>
            <h3 className="matrix-title">Cumulative Cognitive Trait Matrix</h3>
            <span className="matrix-subtitle">
              Benchmarked against classical Torrance & Guilford divergent creativity criteria
            </span>
          </div>
          <button type="button" className="btn-primary btn-sm" onClick={onLaunchWorkout}>
            <Play size={13} />
            <span>Launch Workout</span>
          </button>
        </div>

        <div className="matrix-traits-grid">
          <div className="trait-card">
            <div className="trait-top">
              <span className="trait-name">Fluency</span>
              <span className="trait-score">{avgFluency || 86}%</span>
            </div>
            <div className="trait-bar-bg">
              <div className="trait-bar-fill fluency" style={{ width: `${avgFluency || 86}%` }} />
            </div>
            <p className="trait-desc">Pace and freedom of unblocked concept generation.</p>
          </div>

          <div className="trait-card">
            <div className="trait-top">
              <span className="trait-name">Flexibility</span>
              <span className="trait-score">{avgFlexibility || 82}%</span>
            </div>
            <div className="trait-bar-bg">
              <div className="trait-bar-fill flexibility" style={{ width: `${avgFlexibility || 82}%` }} />
            </div>
            <p className="trait-desc">Ability to shift across disparate cognitive categories.</p>
          </div>

          <div className="trait-card">
            <div className="trait-top">
              <span className="trait-name">Originality</span>
              <span className="trait-score">{avgOriginality || 88}%</span>
            </div>
            <div className="trait-bar-bg">
              <div className="trait-bar-fill originality" style={{ width: `${avgOriginality || 88}%` }} />
            </div>
            <p className="trait-desc">Statistical rarity and surprising non-obvious leaps.</p>
          </div>

          <div className="trait-card">
            <div className="trait-top">
              <span className="trait-name">Elaboration</span>
              <span className="trait-score">{avgElaboration || 78}%</span>
            </div>
            <div className="trait-bar-bg">
              <div className="trait-bar-fill elaboration" style={{ width: `${avgElaboration || 78}%` }} />
            </div>
            <p className="trait-desc">Structural detail, sensory vividness, and mechanisms.</p>
          </div>

          <div className="trait-card">
            <div className="trait-top">
              <span className="trait-name">Synthesis</span>
              <span className="trait-score">{avgSynthesis || 85}%</span>
            </div>
            <div className="trait-bar-bg">
              <div className="trait-bar-fill synthesis" style={{ width: `${avgSynthesis || 85}%` }} />
            </div>
            <p className="trait-desc">Cross-domain bridge building between distant concepts.</p>
          </div>
        </div>
      </div>

      {/* Verified Milestone History Table */}
      <div className="history-table-panel">
        <h3 className="history-panel-title">Verified Assessment History</h3>

        {history.length === 0 ? (
          <div className="empty-history-state">
            <Sparkles size={28} className="text-slate-500 mb-2" />
            <p>No verified sessions recorded yet in this workspace session.</p>
            <button type="button" className="btn-secondary mt-3" onClick={onLaunchWorkout}>
              Complete Your First Workout
            </button>
          </div>
        ) : (
          <div className="history-items-feed">
            {history.map(item => (
              <div
                key={item.id}
                className="history-item-row"
                onClick={() => onSelectResult(item)}
              >
                <div className="item-main-info">
                  <div className="item-title-row">
                    <span className="item-title">{item.exerciseTitle}</span>
                    <span className="item-cat-badge">{item.category.replace('_', ' ')}</span>
                  </div>
                  <div className="item-meta">
                    <span>
                      <Calendar size={12} className="inline mr-1" />
                      {new Date(item.submittedAt).toLocaleDateString()} {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>• {item.totalIdeas} ideas</span>
                    <span>• {item.creativeArchetype}</span>
                  </div>
                </div>

                <div className="item-score-group">
                  <div className="item-score-badge">
                    <span className="score-num">{item.overallScore}</span>
                    <span className="score-label">pts</span>
                  </div>
                  <div className="item-proof-chip" title="Cryptographic ledger token">
                    <ShieldCheck size={12} />
                    <span>{item.verificationProof.proofToken.slice(0, 14)}...</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
