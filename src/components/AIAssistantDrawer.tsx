import React, { useState } from 'react';
import { Sparkles, Lightbulb, Compass, AlertCircle, RefreshCw, Send, HelpCircle } from 'lucide-react';
import type { AIAssistResponse, CreativityExercise, UserCreativeIdea } from '../creativity-types';

interface AIAssistantDrawerProps {
  exercise: CreativityExercise;
  ideas: UserCreativeIdea[];
  sessionId: string;
  onRequestAssist: (mode: 'provocation' | 'pivot' | 'steep_challenge' | 'elaboration') => Promise<AIAssistResponse | null>;
  loading: boolean;
  latestAssist?: AIAssistResponse;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  exercise,
  ideas,
  onRequestAssist,
  loading,
  latestAssist
}) => {
  const [activeMode, setActiveMode] = useState<'provocation' | 'pivot' | 'steep_challenge' | 'elaboration'>('provocation');
  const [customQuestion, setCustomQuestion] = useState('');
  const [customResponses, setCustomResponses] = useState<Array<{ q: string; a: string; time: string }>>([]);
  const [customLoading, setCustomLoading] = useState(false);

  const handleTriggerMode = async (mode: 'provocation' | 'pivot' | 'steep_challenge' | 'elaboration') => {
    setActiveMode(mode);
    await onRequestAssist(mode);
  };

  const handleAskCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || customLoading) return;

    const q = customQuestion.trim();
    setCustomQuestion('');
    setCustomLoading(true);

    try {
      // Trigger assistance with query context
      const res = await onRequestAssist('provocation');
      if (res) {
        setCustomResponses(prev => [
          {
            q,
            a: res.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error('Custom assistance error:', err);
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <div className="ai-muse-drawer">
      <div className="muse-header">
        <div className="muse-title-group">
          <div className="muse-icon-wrap">
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <div>
            <h3 className="muse-title">AI Co-Creative Muse</h3>
            <span className="muse-subtitle">Socratic catalyst & lateral provocateur</span>
          </div>
        </div>
      </div>

      {/* Trigger Modes */}
      <div className="muse-mode-buttons">
        <button
          type="button"
          className={`mode-btn ${activeMode === 'provocation' ? 'active' : ''}`}
          onClick={() => handleTriggerMode('provocation')}
          disabled={loading}
        >
          <Lightbulb size={14} />
          <span>Oblique Spark</span>
        </button>

        <button
          type="button"
          className={`mode-btn ${activeMode === 'pivot' ? 'active' : ''}`}
          onClick={() => handleTriggerMode('pivot')}
          disabled={loading}
        >
          <Compass size={14} />
          <span>Domain Pivot</span>
        </button>

        <button
          type="button"
          className={`mode-btn ${activeMode === 'steep_challenge' ? 'active' : ''}`}
          onClick={() => handleTriggerMode('steep_challenge')}
          disabled={loading}
        >
          <AlertCircle size={14} />
          <span>Extreme Limit</span>
        </button>

        <button
          type="button"
          className={`mode-btn ${activeMode === 'elaboration' ? 'active' : ''}`}
          onClick={() => handleTriggerMode('elaboration')}
          disabled={loading}
        >
          <HelpCircle size={14} />
          <span>Deep Mechanism</span>
        </button>
      </div>

      {/* Latest AI Catalyst Card */}
      <div className="muse-card">
        {loading ? (
          <div className="muse-loading-box">
            <RefreshCw size={20} className="spinning-icon" />
            <span>Consulting lateral cognitive vectors...</span>
          </div>
        ) : latestAssist ? (
          <div className="muse-content">
            <div className="muse-angle-badge">
              <span>{latestAssist.suggestedAngle || 'Creative Catalyst'}</span>
            </div>
            <p className="muse-text">"{latestAssist.text}"</p>
            <div className="muse-tip-footer">
              <span>💡 Bounce an idea off this or use it as a stepping stone.</span>
            </div>
          </div>
        ) : (
          <div className="muse-empty-box">
            <p>Click any spark above to provoke an unconventional angle or break through cognitive friction.</p>
          </div>
        )}
      </div>

      {/* Custom Inquiry Box */}
      <form onSubmit={handleAskCustom} className="muse-custom-form">
        <input
          type="text"
          placeholder="Ask muse (e.g., 'What would a biologist do here?')"
          value={customQuestion}
          onChange={e => setCustomQuestion(e.target.value)}
          disabled={customLoading || loading}
        />
        <button
          type="submit"
          className="muse-send-btn"
          disabled={!customQuestion.trim() || customLoading || loading}
          title="Send query to AI Muse"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Past exchanges */}
      {customResponses.length > 0 && (
        <div className="muse-history-feed">
          <div className="history-feed-title">Dialogue Sparks</div>
          {customResponses.slice(0, 3).map((item, idx) => (
            <div key={idx} className="dialogue-exchange-card">
              <div className="user-inquiry">You: "{item.q}"</div>
              <div className="ai-provocation">Muse: {item.a}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
