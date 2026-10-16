import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Shuffle, RefreshCw, Lightbulb, Compass, Zap } from 'lucide-react';
import type { AIAssistResponse } from '../creativity-types';
import { safeFetchJson } from '../api-client';

const OBLIQUE_STRATEGIES = [
  'Honor thy error as a hidden intention.',
  'What would you do if there were zero consequence?',
  'Discard the most cherished and central component.',
  'Work at a different speed (10x faster or 100x slower).',
  'What is the reality of the situation that everyone is ignoring?',
  'Reverse the direction of causality.',
  'Make the most boring aspect the centerpiece.',
  'Look closely at the most embarrassing detail.',
  'What would nature do if it had 10 million years?',
  'Translate the problem into a physical culinary recipe.',
  'Listen to the quietest voice in the room.',
  'Convert a defect into the defining feature.'
];

const MUSE_INPUT_DRAFT_KEY = 'convergence_muse_input_draft';
const MUSE_TOPIC_DRAFT_KEY = 'convergence_muse_topic_draft';

interface ChatMessage {
  id: string;
  sender: 'user' | 'muse';
  text: string;
  timestamp: string;
  angleTag?: string;
}

export const CreativeMusePlayground: React.FC = () => {
  const [topic, setTopic] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem(MUSE_TOPIC_DRAFT_KEY) || '';
      } catch {
        return '';
      }
    }
    return '';
  });

  const [inputQuery, setInputQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem(MUSE_INPUT_DRAFT_KEY) || '';
      } catch {
        return '';
      }
    }
    return '';
  });

  const [activeCard, setActiveCard] = useState<string>(OBLIQUE_STRATEGIES[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'muse',
      text: 'Welcome to the Co-Creative Muse Laboratory. Name any challenge, story dilemma, product invention, or artistic inquiry you want to crack open.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      angleTag: 'Lateral Partner'
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Auto-save input query and topic to sessionStorage every 5 seconds to prevent data loss
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(MUSE_INPUT_DRAFT_KEY, inputQuery);
          sessionStorage.setItem(MUSE_TOPIC_DRAFT_KEY, topic);
        }
      } catch {
        // ignore storage errors
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [inputQuery, topic]);

  const drawObliqueCard = () => {
    const randomIndex = Math.floor(Math.random() * OBLIQUE_STRATEGIES.length);
    setActiveCard(OBLIQUE_STRATEGIES[randomIndex]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(MUSE_INPUT_DRAFT_KEY);
      }
    } catch {
      // ignore
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Mock an exercise format to pass to our server assistant
      const dummyExercise = {
        id: 'muse-freeform',
        category: 'concept_collision' as const,
        title: topic || 'Open Brainstorm',
        subtitle: 'Co-Creative Exploration',
        prompt: topic || userText,
        sparkQuestion: activeCard,
        difficulty: 'medium' as const,
        suggestedDurationSeconds: 300,
        evaluationFocus: 'Lateral breakthroughs and synthesis'
      };

      const res = await safeFetchJson<AIAssistResponse>('/api/creativity/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `muse-${Date.now()}`,
          exercise: dummyExercise,
          ideas: [{ id: '1', text: userText, timestamp: Date.now() }],
          mode: 'provocation'
        })
      });

      if (res.ok && res.data) {
        const museMsg: ChatMessage = {
          id: `m-${Date.now()}`,
          sender: 'muse',
          text: res.data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          angleTag: res.data.suggestedAngle || 'Provocation'
        };
        setMessages(prev => [...prev, museMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            sender: 'muse',
            text: `Here is a lateral catalyst: "${activeCard}". How would applying this directly to "${userText}" transform your initial premise?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            angleTag: 'Oblique Strategy'
          }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          sender: 'muse',
          text: `Here is a lateral catalyst: "${activeCard}". How would applying this directly to "${userText}" transform your initial premise?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          angleTag: 'Oblique Strategy'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="muse-playground-layout">
      {/* Oblique Strategy Sidebar / Banner */}
      <div className="oblique-strategy-banner">
        <div className="oblique-card">
          <div className="oblique-card-header">
            <Sparkles size={14} className="text-amber-300" />
            <span>Oblique Strategy Provocation</span>
            <button
              type="button"
              className="btn-draw-card"
              onClick={drawObliqueCard}
              title="Draw a new lateral thinking card"
            >
              <Shuffle size={13} />
              <span>Draw Another</span>
            </button>
          </div>
          <div className="oblique-card-body">
            <p>"{activeCard}"</p>
          </div>
        </div>
      </div>

      {/* Main Dialogue Panel */}
      <div className="muse-dialogue-panel">
        <div className="dialogue-panel-header">
          <div className="topic-input-wrap">
            <label>Current Creative Focus / Topic:</label>
            <input
              type="text"
              placeholder="e.g., Designing a home that changes shape with lunar cycles"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
        </div>

        <div className="dialogue-messages-stream">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
              <div className="bubble-content">
                {msg.angleTag && (
                  <div className="bubble-angle-tag">
                    <Zap size={11} />
                    <span>{msg.angleTag}</span>
                  </div>
                )}
                <div className="bubble-text">{msg.text}</div>
                <div className="bubble-time">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble-row muse">
              <div className="bubble-content loading">
                <RefreshCw size={15} className="spinning-icon" />
                <span>The Muse is weaving lateral pathways...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="muse-chat-input-bar">
          <input
            type="text"
            placeholder="Share an idea, ask for a metaphor, or present a creative impasse..."
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-chat-send" disabled={!inputQuery.trim() || loading}>
            <span>Provoke</span>
            <Send size={14} />
          </button>
        </form>

        {(inputQuery.trim().length > 0 || topic.trim().length > 0) && (
          <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] text-emerald-400/90 font-mono select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Draft auto-saved to session storage (every 5s)</span>
          </div>
        )}
      </div>
    </div>
  );
};
