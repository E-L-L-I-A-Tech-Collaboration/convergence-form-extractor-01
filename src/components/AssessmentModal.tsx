import React from 'react';
import { Award, ShieldCheck, Zap, Sparkles, CheckCircle2, TrendingUp, Compass, ArrowRight } from 'lucide-react';
import type { CreativeAssessmentResult } from '../creativity-types';

interface AssessmentModalProps {
  result: CreativeAssessmentResult;
  onClose: () => void;
  onContinueExercises: () => void;
  onViewProgress: () => void;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  result,
  onClose,
  onContinueExercises,
  onViewProgress
}) => {
  const {
    exerciseTitle,
    overallScore,
    creativeArchetype,
    dimensionScores,
    ideaFeedback,
    qualitativeReview,
    verificationProof,
    totalIdeas,
    durationSeconds
  } = result;

  const getDimensionColor = (score: number) => {
    if (score >= 85) return 'score-high';
    if (score >= 65) return 'score-mid';
    return 'score-low';
  };

  return (
    <div className="modal-backdrop">
      <div className="assessment-modal-card">
        {/* Header */}
        <div className="assessment-modal-header">
          <div className="eval-badge-row">
            <span className="eval-tag">Generative Assessment Complete</span>
            <div className="proof-seal-chip" title="Cryptographically anchored on ledger">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Verified Session</span>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="assessment-modal-body">
          {/* Hero Score Section */}
          <div className="assessment-hero-grid">
            <div className="score-dial-card">
              <div className="score-circle-wrap">
                <svg viewBox="0 0 100 100" className="score-svg-circle">
                  <circle cx="50" cy="50" r="42" className="score-circle-bg" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="score-circle-stroke"
                    style={{
                      strokeDasharray: '264',
                      strokeDashoffset: `${264 - (264 * overallScore) / 100}`
                    }}
                  />
                </svg>
                <div className="score-number-box">
                  <span className="score-big">{overallScore}</span>
                  <span className="score-max">/ 100</span>
                </div>
              </div>
              <div className="archetype-badge">
                <Sparkles size={13} className="text-amber-300" />
                <span>{creativeArchetype}</span>
              </div>
              <div className="exercise-meta-text">
                {exerciseTitle} • {totalIdeas} concepts • {Math.round(durationSeconds)}s
              </div>
            </div>

            {/* 5 Dimensions Breakdown */}
            <div className="dimensions-card">
              <h4 className="dimensions-card-title">Cognitive Trait Matrix</h4>
              <div className="dimension-row">
                <div className="dim-info">
                  <span className="dim-name">Fluency</span>
                  <span className="dim-desc">Volume & pace of unblocked flow</span>
                </div>
                <div className="dim-meter">
                  <div className="dim-bar-bg">
                    <div
                      className={`dim-bar-fill ${getDimensionColor(dimensionScores.fluency)}`}
                      style={{ width: `${dimensionScores.fluency}%` }}
                    />
                  </div>
                  <span className="dim-score">{dimensionScores.fluency}</span>
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-info">
                  <span className="dim-name">Flexibility</span>
                  <span className="dim-desc">Domain divergence & category mobility</span>
                </div>
                <div className="dim-meter">
                  <div className="dim-bar-bg">
                    <div
                      className={`dim-bar-fill ${getDimensionColor(dimensionScores.flexibility)}`}
                      style={{ width: `${dimensionScores.flexibility}%` }}
                    />
                  </div>
                  <span className="dim-score">{dimensionScores.flexibility}</span>
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-info">
                  <span className="dim-name">Originality</span>
                  <span className="dim-desc">Statistical rarity & non-linear leaps</span>
                </div>
                <div className="dim-meter">
                  <div className="dim-bar-bg">
                    <div
                      className={`dim-bar-fill ${getDimensionColor(dimensionScores.originality)}`}
                      style={{ width: `${dimensionScores.originality}%` }}
                    />
                  </div>
                  <span className="dim-score">{dimensionScores.originality}</span>
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-info">
                  <span className="dim-name">Elaboration</span>
                  <span className="dim-desc">Mechanistic depth, detail & vividness</span>
                </div>
                <div className="dim-meter">
                  <div className="dim-bar-bg">
                    <div
                      className={`dim-bar-fill ${getDimensionColor(dimensionScores.elaboration)}`}
                      style={{ width: `${dimensionScores.elaboration}%` }}
                    />
                  </div>
                  <span className="dim-score">{dimensionScores.elaboration}</span>
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-info">
                  <span className="dim-name">Synthesis</span>
                  <span className="dim-desc">Cross-domain bridge building</span>
                </div>
                <div className="dim-meter">
                  <div className="dim-bar-bg">
                    <div
                      className={`dim-bar-fill ${getDimensionColor(dimensionScores.synthesis)}`}
                      style={{ width: `${dimensionScores.synthesis}%` }}
                    />
                  </div>
                  <span className="dim-score">{dimensionScores.synthesis}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Qualitative Highlights */}
          <div className="qualitative-grid">
            <div className="spark-highlight-card">
              <div className="spark-card-label">
                <Zap size={14} className="text-amber-400" />
                <span>Standout Creative Breakthrough</span>
              </div>
              <blockquote className="spark-quote">
                "{qualitativeReview.standoutSpark}"
              </blockquote>
            </div>

            <div className="coaching-card">
              <div className="spark-card-label">
                <TrendingUp size={14} className="text-cyan-400" />
                <span>Target Coaching Nudge</span>
              </div>
              <p className="coaching-text">{qualitativeReview.coachingNudge}</p>
            </div>
          </div>

          {/* Strengths and Blindspots */}
          <div className="review-columns-grid">
            <div className="review-box strengths">
              <h5>Cognitive Strengths</h5>
              <ul>
                {qualitativeReview.keyStrengths.map((str, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={14} className="check-icon" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="review-box expansion">
              <h5>Expansion Opportunities</h5>
              <ul>
                {qualitativeReview.creativeBlindspots.map((spot, idx) => (
                  <li key={idx}>
                    <Compass size={14} className="compass-icon" />
                    <span>{spot}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Idea breakdown list */}
          {ideaFeedback.length > 0 && (
            <div className="ideas-evaluation-list">
              <h5>Itemized Concept Evaluations</h5>
              <div className="evaluation-cards-feed">
                {ideaFeedback.map((item, idx) => (
                  <div key={idx} className="eval-idea-row">
                    <div className="eval-idea-top">
                      <span className="idea-domain-badge">{item.flexibilityCategory}</span>
                      <div className="idea-score-tag">
                        <span>Originality: {item.originalityScore}%</span>
                      </div>
                    </div>
                    <div className="eval-idea-body">"{item.ideaText}"</div>
                    <div className="eval-idea-notes">{item.highlights}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof Certificate Footer */}
          <div className="verification-proof-box">
            <div className="proof-head-row">
              <div className="proof-title-wrap">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="proof-title">Cryptographic Assessment Proof</span>
              </div>
              <code className="proof-token">{verificationProof.proofToken}</code>
            </div>
            <div className="proof-subtext">
              Tamper-evident verification head: <code>{verificationProof.ledgerHead}</code> • Events verified: {verificationProof.eventCount}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="assessment-modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onViewProgress}
          >
            <Award size={15} />
            <span>View All Milestones</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onContinueExercises}
          >
            <span>Continue Workouts</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
