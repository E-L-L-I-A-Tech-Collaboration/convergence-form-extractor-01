import React from 'react';
import { Gauge, Zap, GitBranch, Layers, Radio } from 'lucide-react';
import type { CognitiveMonitorMetrics } from '../creativity-types';

interface CognitiveMonitorBarProps {
  metrics: CognitiveMonitorMetrics;
  ideaCount: number;
  timeRemaining?: number;
}

export const CognitiveMonitorBar: React.FC<CognitiveMonitorBarProps> = ({
  metrics,
  ideaCount,
  timeRemaining
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="cognitive-monitor-bar">
      <div className="monitor-heading">
        <div className="monitor-title-group">
          <Radio size={14} className="pulse-icon text-cyan-400" />
          <span className="monitor-title">Live Cognitive Monitor</span>
        </div>
        <span className="phase-text">{metrics.phaseDescription}</span>
      </div>

      <div className="monitor-metrics-grid">
        <div className="monitor-stat-card">
          <div className="stat-label">
            <Gauge size={13} />
            <span>Ideation Velocity</span>
          </div>
          <div className="stat-value-row">
            <span className="stat-num">{metrics.ideationVelocity}</span>
            <span className="stat-unit">ideas/min</span>
          </div>
          <div className="stat-sub">{ideaCount} total captured</div>
        </div>

        <div className="monitor-stat-card">
          <div className="stat-label">
            <Zap size={13} />
            <span>Divergence Index</span>
          </div>
          <div className="stat-value-row">
            <span className="stat-num">{metrics.divergenceIndex}</span>
            <span className="stat-unit">/ 100</span>
          </div>
          <div className="progress-mini-bar">
            <div
              className="progress-mini-fill divergence"
              style={{ width: `${Math.min(100, metrics.divergenceIndex)}%` }}
            />
          </div>
        </div>

        <div className="monitor-stat-card">
          <div className="stat-label">
            <GitBranch size={13} />
            <span>Flexibility Span</span>
          </div>
          <div className="stat-value-row">
            <span className="stat-num">{metrics.conceptualFlexibility}</span>
            <span className="stat-unit">/ 100</span>
          </div>
          <div className="progress-mini-bar">
            <div
              className="progress-mini-fill flexibility"
              style={{ width: `${Math.min(100, metrics.conceptualFlexibility)}%` }}
            />
          </div>
        </div>

        <div className="monitor-stat-card">
          <div className="stat-label">
            <Layers size={13} />
            <span>Cognitive Entropy</span>
          </div>
          <div className="stat-value-row">
            <span className="stat-num">{metrics.cognitiveEntropy.toFixed(2)}</span>
            <span className="stat-unit">bits</span>
          </div>
          <div className="stat-sub">Semantic dispersion rate</div>
        </div>

        {timeRemaining !== undefined && (
          <div className="monitor-stat-card timer-card">
            <div className="stat-label">
              <span>Time Remaining</span>
            </div>
            <div className={`timer-num ${timeRemaining <= 30 ? 'urgent' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="stat-sub">Active session sprint</div>
          </div>
        )}
      </div>

      {/* Under-the-hood subtle cognitive resonance channel pulse */}
      <div className="channel-pulse-track" title="Dynamic 12-channel cognitive resonance profile">
        {metrics.channelDistribution.map((v, i) => {
          const heightPct = Math.max(10, Math.min(100, Math.abs(v) * 90));
          return (
            <div key={i} className="channel-bar-col">
              <div
                className={`channel-bar-fill ${v >= 0 ? 'positive' : 'negative'}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
