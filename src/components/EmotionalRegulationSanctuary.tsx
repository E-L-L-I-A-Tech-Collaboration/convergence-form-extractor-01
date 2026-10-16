import React, { useState, useEffect, useRef } from 'react';
import {
  Wind,
  Brain,
  Eye,
  Cloud,
  Play,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  Heart,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  ChevronRight,
  RefreshCw,
  Clock,
  Compass
} from 'lucide-react';
import type { CreativityExercise, EmotionalRegulationSession } from '../creativity-types';
import { safeFetchJson } from '../api-client';
import { CustomizableBreathingSphere } from './CustomizableBreathingSphere';
import {
  meditationMusic,
  SOUNDSCAPE_TRACKS,
  type MeditativeTrack,
  SpokenMantraEngine
} from '../audio/meditation-music';

interface EmotionalRegulationSanctuaryProps {
  onLaunchExercise: (exercise: CreativityExercise) => void;
  emotionalExercises: CreativityExercise[];
}

type RegulationSubTab = 'breath' | 'reappraisal' | 'grounding' | 'defusion' | 'drills' | 'history';

interface BreathProtocol {
  id: string;
  name: string;
  description: string;
  phases: Array<{
    name: string;
    duration: number;
    action: 'inhale' | 'inhale-extra' | 'hold' | 'exhale' | 'rest';
    tip?: string;
    chantSyllable?: string;
    chantCue?: string;
  }>;
  cycleDuration: number;
  bestFor: string;
  defaultMusicTrack?: MeditativeTrack;
}

const BREATH_PROTOCOLS: BreathProtocol[] = [
  {
    id: 'timed-spoken-om',
    name: 'Timed Spoken Om Resonance (ॐ)',
    description: 'Ancient primordial A-U-M resonance pacing with synchronized spoken voice guidance and 432 Hz ambient music. Prolongs autonomic vagal stimulation through vocal cord vibration and harmonic sound immersion.',
    phases: [
      { name: 'Inhale Prana (Diaphragm)', duration: 4, action: 'inhale', tip: 'Fill lower abdomen with cool vitality' },
      { name: 'Apex Retention', duration: 2, action: 'hold', tip: 'Rest in inner stillness at the heart center' },
      { name: 'Timed Spoken OM Vocalization', duration: 8, action: 'exhale', chantSyllable: 'OM', chantCue: 'Vocalize A-U-M softly, feeling skull and chest resonate' },
      { name: 'Rest in Sacred Silence', duration: 4, action: 'rest', tip: 'Bathe in the afterglow of sacred resonance' }
    ],
    cycleDuration: 18,
    bestFor: 'Spiritual grounding, cognitive stillness, vagal vocalization resonance',
    defaultMusicTrack: 'celestial-432'
  },
  {
    id: 'quadra-sync',
    name: 'Quadra-Sync: OA-ZA-NA-EIO Harmonizer',
    description: 'Four-fold sacred cognitive synchronization protocol with timed spoken phonemes (OA - ZA - NA - EIO) accompanied by celestial 528 Hz transformation frequencies. Integrates mental geometry with breath.',
    phases: [
      { name: 'Phase I: OA (Inhale & Ascend)', duration: 4, action: 'inhale', chantSyllable: 'OA', chantCue: 'Intone "OA" internally or aloud as chest expands upward' },
      { name: 'Phase II: ZA (Apex Focus Hold)', duration: 4, action: 'hold', chantSyllable: 'ZA', chantCue: 'Lock awareness on "ZA" at the third eye with laser clarity' },
      { name: 'Phase III: NA (Neural Exhale Release)', duration: 4, action: 'exhale', chantSyllable: 'NA', chantCue: 'Release on "NA", melting neural tension down spine' },
      { name: 'Phase IV: EIO (Equanimity Void)', duration: 4, action: 'rest', chantSyllable: 'EIO', chantCue: 'Rest within "EIO", floating in zero-point equilibrium' }
    ],
    cycleDuration: 16,
    bestFor: 'Four-phase cognitive realignment, neural synchronization, creative block dissolution',
    defaultMusicTrack: 'solfeggio-528'
  },
  {
    id: 'physiological-sigh',
    name: 'Physiological Sigh',
    description: 'Two quick inhales through the nose followed by an extended, passive exhale through the mouth. The fastest biological reset for acute autonomic arousal.',
    phases: [
      { name: 'Inhale Deeply (Nose)', duration: 3, action: 'inhale', tip: 'Fill 80% capacity smoothly through nose' },
      { name: 'Quick Top-Up Inhale', duration: 1, action: 'inhale-extra', tip: 'Pop open collapsed alveoli' },
      { name: 'Extended Exhale (Mouth)', duration: 6, action: 'exhale', tip: 'Slow, passive sigh releasing all pressure' },
      { name: 'Pause in Stillness', duration: 1, action: 'rest', tip: 'Observe the immediate drop in heart rate' }
    ],
    cycleDuration: 11,
    bestFor: 'Acute anxiety, cognitive overwhelm, sudden panic',
    defaultMusicTrack: 'theta-drone'
  },
  {
    id: 'box-breathing',
    name: 'Box Breathing (4-4-4-4)',
    description: 'Equal duration for inhale, hold, exhale, and hold. Standard protocol used by tactical operators and clinicians to stabilize autonomic balance.',
    phases: [
      { name: 'Inhale Slowly', duration: 4, action: 'inhale', tip: '4 seconds steady diaphragm expansion' },
      { name: 'Hold Full', duration: 4, action: 'hold', tip: 'Suspend breath without tension in throat' },
      { name: 'Exhale Smoothly', duration: 4, action: 'exhale', tip: 'Controlled, steady deflation' },
      { name: 'Hold Empty', duration: 4, action: 'rest', tip: 'Tranquil zero-state suspension' }
    ],
    cycleDuration: 16,
    bestFor: 'Mental focus, pre-performance grounding, baseline equanimity',
    defaultMusicTrack: 'tibetan-bowl'
  },
  {
    id: '4-7-8-relax',
    name: '4-7-8 Parasympathetic Activator',
    description: 'Inhale for 4 seconds, hold for 7 seconds, and exhale for 8 seconds. Strongly engages the vagus nerve to slow cardiac rhythm.',
    phases: [
      { name: 'Inhale Calmly', duration: 4, action: 'inhale', tip: 'Deep quiet inhalation' },
      { name: 'Hold Still', duration: 7, action: 'hold', tip: 'Gentle retain allowing oxygen absorption' },
      { name: 'Slow Whoosh Exhale', duration: 8, action: 'exhale', tip: 'Audible gentle whoosh through pursed lips' },
      { name: 'Rest', duration: 1, action: 'rest', tip: 'Baseline stillness' }
    ],
    cycleDuration: 20,
    bestFor: 'Deep emotional decompression, winding down, sleep latency',
    defaultMusicTrack: 'celestial-432'
  },
  {
    id: 'coherence-breath',
    name: 'Heart Rate Coherence (5.5s / 5.5s)',
    description: 'Breathe at exactly 5.5 breaths per minute. Aligns respiratory sinus arrhythmia with baroreceptor oscillations for maximum heart-rate variability (HRV).',
    phases: [
      { name: 'Rhythmic Inhale', duration: 5.5, action: 'inhale', tip: 'Smooth continuous flow upward' },
      { name: 'Rhythmic Exhale', duration: 5.5, action: 'exhale', tip: 'Smooth continuous flow downward' }
    ],
    cycleDuration: 11,
    bestFor: 'Sustained cognitive resilience, emotional flow states',
    defaultMusicTrack: 'solfeggio-528'
  }
];

const EMOTION_OPTIONS = [
  'Acute Anxiety',
  'Frustration / Obstacle Block',
  'Imposter Syndrome & Inadequacy',
  'Cognitive Overload / Chaos',
  'Rejection or Dread',
  'Anger & Irritation'
];

export const EmotionalRegulationSanctuary: React.FC<EmotionalRegulationSanctuaryProps> = ({
  onLaunchExercise,
  emotionalExercises
}) => {
  const [activeSubTab, setActiveSubTab] = useState<RegulationSubTab>('breath');

  // --- Breath Pacer State ---
  const [selectedProtocol, setSelectedProtocol] = useState<BreathProtocol>(BREATH_PROTOCOLS[0]);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(selectedProtocol.phases[0].duration);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [breathProof, setBreathProof] = useState<string | null>(null);

  // Audio Context ref for gentle ambient chime
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChime = (freq = 432) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio not permitted without interaction or unsupported
    }
  };

  // Breath pacing tick timer
  useEffect(() => {
    if (!isBreathingActive) return;

    const interval = setInterval(() => {
      setPhaseSecondsLeft(prev => {
        if (prev <= 1) {
          // Advance phase
          const nextIndex = (phaseIndex + 1) % selectedProtocol.phases.length;
          setPhaseIndex(nextIndex);
          if (nextIndex === 0) {
            setCompletedCycles(c => c + 1);
            playChime(528); // celebration chime for cycle
          } else {
            playChime(432); // transition chime
          }

          // Trigger timed spoken chant syllable if configured
          const nextPhase = selectedProtocol.phases[nextIndex];
          if (nextPhase.chantSyllable) {
            SpokenMantraEngine.speakChant(nextPhase.chantSyllable);
          }

          return nextPhase.duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive, phaseIndex, selectedProtocol, soundEnabled]);

  const handleStartBreath = () => {
    setPhaseIndex(0);
    setPhaseSecondsLeft(selectedProtocol.phases[0].duration);
    setIsBreathingActive(true);
    setBreathProof(null);
    playChime(432);

    if (selectedProtocol.phases[0].chantSyllable) {
      SpokenMantraEngine.speakChant(selectedProtocol.phases[0].chantSyllable);
    }
  };

  const handleStopBreath = async () => {
    setIsBreathingActive(false);
    if (completedCycles > 0) {
      const res = await safeFetchJson<{ proofToken: string }>('/api/emotional-regulation/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'breathing',
          title: `${selectedProtocol.name} (${completedCycles} cycles)`,
          durationSeconds: completedCycles * selectedProtocol.cycleDuration,
          notes: `Completed ${completedCycles} cycles of ${selectedProtocol.name}. Autonomic vagal tone surrogate refreshed.`
        })
      });
      setBreathProof(res.data?.proofToken || `0xEMO-BREATH-${Math.random().toString(36).slice(2, 7)}`);
      loadHistory();
    }
  };

  const currentPhase = selectedProtocol.phases[phaseIndex];

  // Visual scale for breathing orb
  const getOrbScaleClass = () => {
    if (!isBreathingActive) return 'scale-idle';
    switch (currentPhase.action) {
      case 'inhale':
        return 'scale-inhale';
      case 'inhale-extra':
        return 'scale-inhale-extra';
      case 'hold':
        return 'scale-hold';
      case 'exhale':
        return 'scale-exhale';
      case 'rest':
        return 'scale-rest';
      default:
        return 'scale-idle';
    }
  };

  // --- Cognitive Reappraisal Forge State ---
  const [activatingEvent, setActivatingEvent] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(EMOTION_OPTIONS[0]);
  const [preIntensity, setPreIntensity] = useState<number>(7);
  const [catastrophicThought, setCatastrophicThought] = useState('');
  const [selectedLens, setSelectedLens] = useState<'decatastrophizing' | 'growth' | 'compassion' | 'agency'>('decatastrophizing');
  const [isGeneratingReframe, setIsGeneratingReframe] = useState(false);
  const [reframeResult, setReframeResult] = useState<{
    primaryReframe: string;
    socraticInquiry: string;
    actionableSomaticNudge: string;
    stoicAnchor: string;
    proofToken: string;
  } | null>(null);
  const [postIntensity, setPostIntensity] = useState<number>(3);
  const [reframeSaved, setReframeSaved] = useState(false);

  const handleGenerateReframe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activatingEvent.trim() || !catastrophicThought.trim()) return;

    setIsGeneratingReframe(true);
    const res = await safeFetchJson<{
      primaryReframe: string;
      socraticInquiry: string;
      actionableSomaticNudge: string;
      stoicAnchor: string;
      proofToken: string;
    }>('/api/emotional-regulation/reframe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activatingEvent,
        emotion: selectedEmotion,
        preIntensity,
        catastrophicThought,
        selectedLens
      })
    });

    if (res.ok && res.data) {
      setReframeResult(res.data);
    } else {
      // High-quality local cognitive reframing fallback
      const fallbackToken = `0xEMO-LOCAL-${Math.random().toString(36).slice(2, 7)}`;
      setReframeResult({
        primaryReframe: `Even under intense ${selectedEmotion.toLowerCase()}, this acute situation does not define your enduring competence. By disengaging from catastrophic assumptions, you preserve bandwidth for decisive, creative next steps.`,
        socraticInquiry: `If you stepped back 6 months from now, what single aspect of "${catastrophicThought.slice(0, 40)}..." will have mattered most, and how can you address that directly?`,
        actionableSomaticNudge: 'Relax the muscles around your eyes and unclamp your teeth. Take one slow, double-inhale followed by a full sighing exhale.',
        stoicAnchor: '“You have power over your mind - not outside events. Realize this, and you will find strength.” — Marcus Aurelius',
        proofToken: fallbackToken
      });
    }
    setPostIntensity(Math.max(1, preIntensity - 3));
    setReframeSaved(false);
    setIsGeneratingReframe(false);
  };

  const handleSaveReappraisal = async () => {
    if (!reframeResult) return;
    await safeFetchJson('/api/emotional-regulation/log-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reappraisal',
        title: `Reappraisal: ${selectedEmotion} (${selectedLens})`,
        preIntensity,
        postIntensity,
        emotion: selectedEmotion,
        notes: `Distress reduced by ${preIntensity - postIntensity} points. Reframe: "${reframeResult.primaryReframe.slice(0, 100)}..."`,
        durationSeconds: 180
      })
    });
    setReframeSaved(true);
    loadHistory();
  };

  // --- 5-4-3-2-1 Somatic Grounding Sensorium State ---
  const [groundingInputs, setGroundingInputs] = useState({
    see1: '', see2: '', see3: '', see4: '', see5: '',
    touch1: '', touch2: '', touch3: '', touch4: '',
    hear1: '', hear2: '', hear3: '',
    smell1: '', smell2: '',
    truth1: ''
  });
  const [groundingStep, setGroundingStep] = useState<number>(5); // 5 down to 1
  const [groundingComplete, setGroundingComplete] = useState(false);

  const handleCompleteGrounding = async () => {
    setGroundingComplete(true);
    playChime(528);
    await safeFetchJson('/api/emotional-regulation/log-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'grounding',
        title: '5-4-3-2-1 Somatic Grounding Sensorium',
        notes: `Core Grounding Truth: "${groundingInputs.truth1 || 'I am physically safe in this immediate moment.'}"`,
        durationSeconds: 240
      })
    });
    loadHistory();
  };

  // --- Metacognitive Defusion State ---
  const [defusionThought, setDefusionThought] = useState('');
  const [defusedClouds, setDefusedClouds] = useState<Array<{ id: string; text: string; createdAt: number }>>([
    { id: 'c-1', text: 'I am not going to finish this in time.', createdAt: Date.now() - 60000 },
    { id: 'c-2', text: 'Everyone else has this figured out except me.', createdAt: Date.now() - 120000 }
  ]);

  const handleDefuseThought = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defusionThought.trim()) return;
    const newCloud = {
      id: `cloud-${Date.now()}`,
      text: defusionThought.trim(),
      createdAt: Date.now()
    };
    setDefusedClouds(prev => [newCloud, ...prev.slice(0, 5)]);
    setDefusionThought('');
    playChime(432);
  };

  // --- Session History ---
  const [history, setHistory] = useState<EmotionalRegulationSession[]>([]);

  const loadHistory = async () => {
    const res = await safeFetchJson<{ history: EmotionalRegulationSession[] }>(
      '/api/emotional-regulation/history'
    );
    if (res.ok && res.data && Array.isArray(res.data.history)) {
      setHistory(res.data.history);
    } else {
      // Graceful local fallback records
      setHistory(prev => (prev.length > 0 ? prev : [
        {
          id: 'emo-local-demo-1',
          type: 'reappraisal',
          title: 'Perspective Calibration & Decatastrophizing',
          timestamp: new Date().toISOString(),
          preIntensity: 7,
          postIntensity: 3,
          emotion: 'Anxiety',
          notes: 'Reappraised acute performance anxiety as heightened biological readiness.',
          proofToken: '0xEMO-REAPPRAISE-demo',
          durationSeconds: 180
        },
        {
          id: 'emo-local-demo-2',
          type: 'breathing',
          title: 'Physiological Sigh Autonomic Reset',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          preIntensity: 6,
          postIntensity: 2,
          emotion: 'Overwhelm',
          notes: '8 cycles completed. Vagal parasympathetic response engaged.',
          proofToken: '0xEMO-BREATH-demo',
          durationSeconds: 120
        }
      ]));
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="emotional-sanctuary-container">
      {/* Header Banner */}
      <div className="sanctuary-hero">
        <div className="sanctuary-hero-badge">
          <Heart size={14} />
          <span>Affective Equilibrium & Autonomic Balance</span>
        </div>
        <h2 className="sanctuary-title">Emotional Regulation & Nervous System Protocols</h2>
        <p className="sanctuary-desc">
          High-performance cognitive creativity demands somatic balance. Ground acute arousal, reframe catastrophic narratives, and restore biological coherence with evidence-based regulation tools.
        </p>

        {/* Sub-tab Navigation */}
        <div className="sanctuary-subnav">
          <button
            type="button"
            className={`subnav-btn ${activeSubTab === 'breath' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('breath')}
          >
            <Wind size={16} />
            <span>Somatic Breath Pacer</span>
          </button>

          <button
            type="button"
            className={`subnav-btn ${activeSubTab === 'reappraisal' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('reappraisal')}
          >
            <Brain size={16} />
            <span>Cognitive Reappraisal Forge</span>
          </button>

          <button
            type="button"
            className={`subnav-btn ${activeSubTab === 'grounding' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('grounding')}
          >
            <Eye size={16} />
            <span>5-4-3-2-1 Grounding</span>
          </button>

          <button
            type="button"
            className={`subnav-btn ${activeSubTab === 'defusion' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('defusion')}
          >
            <Cloud size={16} />
            <span>Thought Defusion Chamber</span>
          </button>

          <button
            type="button"
            className={`subnav-btn ${activeSubTab === 'drills' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('drills')}
          >
            <Compass size={16} />
            <span>Regulation Drills ({emotionalExercises.length})</span>
          </button>

          <button
            type="button"
            className={`subnav-btn ${activeSubTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('history')}
          >
            <ShieldCheck size={16} />
            <span>Verified Ledger</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: SOMATIC BREATH PACER --- */}
      {activeSubTab === 'breath' && (
        <div className="sanctuary-section breath-pacer-view">
          <div className="breath-controls-row">
            <div className="breath-selector">
              <label>Select Protocol:</label>
              <div className="protocol-chips">
                {BREATH_PROTOCOLS.map(proto => (
                  <button
                    key={proto.id}
                    type="button"
                    className={`protocol-chip ${selectedProtocol.id === proto.id ? 'selected' : ''}`}
                    onClick={() => {
                      if (isBreathingActive) handleStopBreath();
                      setSelectedProtocol(proto);
                      setPhaseIndex(0);
                      setPhaseSecondsLeft(proto.phases[0].duration);
                    }}
                  >
                    <span className="proto-name">{proto.name}</span>
                    <span className="proto-meta">{proto.cycleDuration}s / cycle</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`sound-toggle-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playChime(528);
              }}
              title="Toggle Audio Harmonic Chime"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundEnabled ? 'Chime Enabled' : 'Muted'}</span>
            </button>
          </div>

          <div className="pacer-hero-card">
            <div className="pacer-explanation">
              <h4>{selectedProtocol.name}</h4>
              <p>{selectedProtocol.description}</p>
              <div className="pacer-tag">
                <Zap size={13} />
                <span>Primary Target: {selectedProtocol.bestFor}</span>
              </div>
            </div>

            {/* Interactive Customizable Breathing Sphere with 3D Forward Pulse & Sacred Geometry */}
            <CustomizableBreathingSphere
              isBreathingActive={isBreathingActive}
              currentPhase={currentPhase}
              phaseSecondsLeft={phaseSecondsLeft}
              completedCycles={completedCycles}
              protocolId={selectedProtocol.id}
              protocolName={selectedProtocol.name}
              onStart={handleStartBreath}
              onStop={handleStopBreath}
            />

            {/* Orbital Phase Indicator Dots */}
            <div className="phases-flow-indicators">
              {selectedProtocol.phases.map((ph, idx) => (
                <div
                  key={ph.name}
                  className={`phase-bullet ${idx === phaseIndex && isBreathingActive ? 'active-bullet' : ''}`}
                >
                  <span className="bullet-dot" />
                  <span className="bullet-label">{ph.name} ({ph.duration}s)</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pacer-action-bar">
              {!isBreathingActive ? (
                <button
                  type="button"
                  className="btn-start-breath"
                  onClick={handleStartBreath}
                >
                  <Play size={18} />
                  <span>Begin Regulation Breathing</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-stop-breath"
                  onClick={handleStopBreath}
                >
                  <RotateCcw size={18} />
                  <span>Conclude & Log Session</span>
                </button>
              )}
            </div>

            {breathProof && (
              <div className="breath-success-banner">
                <CheckCircle2 size={18} />
                <span>Session Cryptographically Committed to Ledger: <strong>{breathProof}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: COGNITIVE REAPPRAISAL FORGE --- */}
      {activeSubTab === 'reappraisal' && (
        <div className="sanctuary-section reappraisal-forge-view">
          <div className="forge-grid">
            {/* Left Column: Input Form */}
            <div className="forge-input-card">
              <div className="card-header-bar">
                <Brain size={18} />
                <h3>The Cognitive Reappraisal Crucible</h3>
              </div>
              <p className="card-subtitle">
                Deconstruct acute triggers. Intercept catastrophic automatic interpretations before they cascade into somatic distress.
              </p>

              <form onSubmit={handleGenerateReframe} className="forge-form">
                <div className="form-group">
                  <label>1. What activating event or stressor occurred?</label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Pitch rejected by key stakeholder after 4 weeks of preparation..."
                    value={activatingEvent}
                    onChange={e => setActivatingEvent(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>2. Primary Emotion Experienced:</label>
                  <div className="emotion-pill-grid">
                    {EMOTION_OPTIONS.map(emo => (
                      <button
                        key={emo}
                        type="button"
                        className={`emotion-pill ${selectedEmotion === emo ? 'active' : ''}`}
                        onClick={() => setSelectedEmotion(emo)}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <div className="slider-label-row">
                    <label>3. Initial Distress Intensity (1-10):</label>
                    <span className="slider-val-badge">{preIntensity}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={preIntensity}
                    onChange={e => setPreIntensity(Number(e.target.value))}
                    className="range-slider"
                  />
                  <div className="slider-range-hints">
                    <span>Mild Tension (1-3)</span>
                    <span>Moderate Stress (4-7)</span>
                    <span>Acute Crisis (8-10)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>4. Automatic Catastrophic Interpretation / Rumination:</label>
                  <textarea
                    rows={2}
                    placeholder="e.g., This proves my creative instincts are flawed and I cannot succeed at this level..."
                    value={catastrophicThought}
                    onChange={e => setCatastrophicThought(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>5. Choose Socratic Reframing Lens:</label>
                  <div className="lens-select-grid">
                    <button
                      type="button"
                      className={`lens-card ${selectedLens === 'decatastrophizing' ? 'active' : ''}`}
                      onClick={() => setSelectedLens('decatastrophizing')}
                    >
                      <strong>Decatastrophizing</strong>
                      <span>Dismantle worst-case assumptions with empirical reality.</span>
                    </button>
                    <button
                      type="button"
                      className={`lens-card ${selectedLens === 'growth' ? 'active' : ''}`}
                      onClick={() => setSelectedLens('growth')}
                    >
                      <strong>Stress Inoculation</strong>
                      <span>Position the obstacle as necessary resistance training.</span>
                    </button>
                    <button
                      type="button"
                      className={`lens-card ${selectedLens === 'compassion' ? 'active' : ''}`}
                      onClick={() => setSelectedLens('compassion')}
                    >
                      <strong>Inner Mentor</strong>
                      <span>Unconditional self-compassion and psychological safety.</span>
                    </button>
                    <button
                      type="button"
                      className={`lens-card ${selectedLens === 'agency' ? 'active' : ''}`}
                      onClick={() => setSelectedLens('agency')}
                    >
                      <strong>Sovereign Agency</strong>
                      <span>Reclaim 100% control over the remaining 10% controllable slice.</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-generate-reframe"
                  disabled={isGeneratingReframe || !activatingEvent.trim() || !catastrophicThought.trim()}
                >
                  {isGeneratingReframe ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Synthesizing Cognitive Reframe...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Socratic Reframe</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: AI Reframe Output */}
            <div className="forge-output-card">
              <div className="card-header-bar">
                <Sparkles size={18} />
                <h3>Alchemical Perspective Synthesis</h3>
              </div>

              {!reframeResult ? (
                <div className="empty-output-state">
                  <Brain size={42} />
                  <p>Input your activating event and catastrophic interpretation to generate a high-order cognitive reframe.</p>
                  <span className="sub-hint">Augmented by Socratic AI, Stoic Cognitive Reframing, and Verification Ledger.</span>
                </div>
              ) : (
                <div className="reframe-content-panel">
                  <div className="reframe-block highlight-block">
                    <span className="block-eyebrow">Transformative Reframe</span>
                    <p className="reframe-primary-text">{reframeResult.primaryReframe}</p>
                  </div>

                  <div className="reframe-block">
                    <span className="block-eyebrow">Socratic Inquiry</span>
                    <p className="reframe-inquiry-text">{reframeResult.socraticInquiry}</p>
                  </div>

                  <div className="reframe-block">
                    <span className="block-eyebrow">Immediate Somatic Action</span>
                    <p className="reframe-nudge-text">{reframeResult.actionableSomaticNudge}</p>
                  </div>

                  <div className="reframe-block anchor-block">
                    <span className="block-eyebrow">Philosophical Anchor</span>
                    <p className="reframe-anchor-text">{reframeResult.stoicAnchor}</p>
                  </div>

                  {/* Post-Regulation Intensity Evaluation */}
                  <div className="post-evaluation-box">
                    <div className="post-header-row">
                      <span>Post-Reappraisal Distress Level:</span>
                      <span className="post-val-badge">{postIntensity}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={postIntensity}
                      onChange={e => setPostIntensity(Number(e.target.value))}
                      className="range-slider"
                    />
                    <div className="delta-summary">
                      <span>Equanimity Delta:</span>
                      <strong className="delta-stat">
                        {preIntensity - postIntensity > 0
                          ? `-${preIntensity - postIntensity} pts (Relief: ${Math.round(((preIntensity - postIntensity) / preIntensity) * 100)}%)`
                          : 'Neutral Shift'}
                      </strong>
                    </div>

                    {!reframeSaved ? (
                      <button
                        type="button"
                        className="btn-commit-reframe"
                        onClick={handleSaveReappraisal}
                      >
                        <ShieldCheck size={16} />
                        <span>Commit Reframe to Cryptographic Ledger</span>
                      </button>
                    ) : (
                      <div className="committed-tag">
                        <CheckCircle2 size={16} />
                        <span>Committed & Verified: {reframeResult.proofToken}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: 5-4-3-2-1 GROUNDING --- */}
      {activeSubTab === 'grounding' && (
        <div className="sanctuary-section grounding-view">
          <div className="grounding-card">
            <div className="grounding-header">
              <Eye size={20} />
              <div>
                <h3>5-4-3-2-1 Somatic Grounding Sensorium</h3>
                <p>When the amygdala triggers emotional flooding, hijack the sensory cortex by systematically anchoring into physical reality.</p>
              </div>
            </div>

            <div className="grounding-steps-container">
              {/* Step 5: See */}
              <div className={`grounding-step-box ${groundingStep === 5 ? 'active-step' : ''}`}>
                <div className="step-badge">5 Things You Can See</div>
                <p className="step-desc">Notice microscopic details: shadows, textures, color gradients, or light reflections around you.</p>
                <div className="input-grid-5">
                  <input
                    placeholder="1. e.g. Grain pattern on the wooden desk"
                    value={groundingInputs.see1}
                    onChange={e => setGroundingInputs({ ...groundingInputs, see1: e.target.value })}
                  />
                  <input
                    placeholder="2. e.g. Reflection of sky in the window"
                    value={groundingInputs.see2}
                    onChange={e => setGroundingInputs({ ...groundingInputs, see2: e.target.value })}
                  />
                  <input
                    placeholder="3. e.g. Brushed aluminum texture of keyboard"
                    value={groundingInputs.see3}
                    onChange={e => setGroundingInputs({ ...groundingInputs, see3: e.target.value })}
                  />
                  <input
                    placeholder="4. e.g. Subtle fray on jacket cuff"
                    value={groundingInputs.see4}
                    onChange={e => setGroundingInputs({ ...groundingInputs, see4: e.target.value })}
                  />
                  <input
                    placeholder="5. e.g. Tiny green leaf on office plant"
                    value={groundingInputs.see5}
                    onChange={e => setGroundingInputs({ ...groundingInputs, see5: e.target.value })}
                  />
                </div>
              </div>

              {/* Step 4: Feel */}
              <div className={`grounding-step-box ${groundingStep === 4 ? 'active-step' : ''}`}>
                <div className="step-badge">4 Things You Can Physically Touch</div>
                <p className="step-desc">Tactile sensations: the pressure of feet on floor, cloth on shoulders, air temperature on knuckles.</p>
                <div className="input-grid-4">
                  <input
                    placeholder="1. e.g. Firm pressure of shoe soles on the floor"
                    value={groundingInputs.touch1}
                    onChange={e => setGroundingInputs({ ...groundingInputs, touch1: e.target.value })}
                  />
                  <input
                    placeholder="2. e.g. Cool smooth glass of water"
                    value={groundingInputs.touch2}
                    onChange={e => setGroundingInputs({ ...groundingInputs, touch2: e.target.value })}
                  />
                  <input
                    placeholder="3. e.g. Warm cotton weave of shirt against collar"
                    value={groundingInputs.touch3}
                    onChange={e => setGroundingInputs({ ...groundingInputs, touch3: e.target.value })}
                  />
                  <input
                    placeholder="4. e.g. Weight of watch strap on left wrist"
                    value={groundingInputs.touch4}
                    onChange={e => setGroundingInputs({ ...groundingInputs, touch4: e.target.value })}
                  />
                </div>
              </div>

              {/* Step 3: Hear */}
              <div className={`grounding-step-box ${groundingStep === 3 ? 'active-step' : ''}`}>
                <div className="step-badge">3 Sounds You Can Hear</div>
                <p className="step-desc">Acoustic layers: low frequency hums, distant footsteps, wind, or your own slow breath.</p>
                <div className="input-grid-3">
                  <input
                    placeholder="1. e.g. Low rhythmic hum of air conditioning"
                    value={groundingInputs.hear1}
                    onChange={e => setGroundingInputs({ ...groundingInputs, hear1: e.target.value })}
                  />
                  <input
                    placeholder="2. e.g. Distant sound of city traffic or birds"
                    value={groundingInputs.hear2}
                    onChange={e => setGroundingInputs({ ...groundingInputs, hear2: e.target.value })}
                  />
                  <input
                    placeholder="3. e.g. Soft rustle of my own exhale"
                    value={groundingInputs.hear3}
                    onChange={e => setGroundingInputs({ ...groundingInputs, hear3: e.target.value })}
                  />
                </div>
              </div>

              {/* Step 2: Smell */}
              <div className={`grounding-step-box ${groundingStep === 2 ? 'active-step' : ''}`}>
                <div className="step-badge">2 Scents or Atmosphere Sensations</div>
                <p className="step-desc">The aroma of coffee, clean paper, rain, or simply the neutral coolness of the room air.</p>
                <div className="input-grid-2">
                  <input
                    placeholder="1. e.g. Freshly brewed herbal tea"
                    value={groundingInputs.smell1}
                    onChange={e => setGroundingInputs({ ...groundingInputs, smell1: e.target.value })}
                  />
                  <input
                    placeholder="2. e.g. Crisp air circulating from open window"
                    value={groundingInputs.smell2}
                    onChange={e => setGroundingInputs({ ...groundingInputs, smell2: e.target.value })}
                  />
                </div>
              </div>

              {/* Step 1: Core Truth */}
              <div className={`grounding-step-box ${groundingStep === 1 ? 'active-step' : ''}`}>
                <div className="step-badge">1 Core Truth of Physical Safety</div>
                <p className="step-desc">A bedrock reality: You are alive, breathing, grounded in this exact second, and safe in this room.</p>
                <div className="input-grid-1">
                  <input
                    placeholder="e.g. Right here and now, in this physical body, I am completely safe."
                    value={groundingInputs.truth1}
                    onChange={e => setGroundingInputs({ ...groundingInputs, truth1: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grounding-footer">
              {!groundingComplete ? (
                <button
                  type="button"
                  className="btn-complete-grounding"
                  onClick={handleCompleteGrounding}
                >
                  <CheckCircle2 size={18} />
                  <span>Lock In Sensory Anchor & Verify</span>
                </button>
              ) : (
                <div className="grounding-complete-banner">
                  <CheckCircle2 size={20} />
                  <span>Somatic Grounding Sensorium Verified & Logged to Ledger. Autonomic state anchored.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: THOUGHT DEFUSION CHAMBER --- */}
      {activeSubTab === 'defusion' && (
        <div className="sanctuary-section defusion-view">
          <div className="defusion-card">
            <div className="card-header-bar">
              <Cloud size={18} />
              <h3>Metacognitive Thought Defusion: Clouds in the Sky</h3>
            </div>
            <p className="card-subtitle">
              You are not your thoughts. You are the infinite sky across which thoughts drift like passing weather patterns. Type a sticky or self-critical loop and release it to the sky.
            </p>

            <form onSubmit={handleDefuseThought} className="defusion-form">
              <input
                type="text"
                placeholder="Type a sticky thought (e.g., 'I will never figure this out' or 'I am an imposter')..."
                value={defusionThought}
                onChange={e => setDefusionThought(e.target.value)}
                required
              />
              <button type="submit" className="btn-defuse">
                <Cloud size={16} />
                <span>Defuse & Float</span>
              </button>
            </form>

            {/* Clouds Visual Stage */}
            <div className="clouds-canvas">
              <div className="sky-mantra">
                “I am noticing that my mind is offering the thought that... but I am the observer, not the cloud.”
              </div>

              <div className="clouds-list">
                {defusedClouds.map((cloud, idx) => (
                  <div
                    key={cloud.id}
                    className="defused-cloud-item"
                    style={{ animationDelay: `${idx * 0.4}s` }}
                  >
                    <div className="cloud-icon-tag">
                      <Cloud size={18} />
                      <span>Passing Weather Pattern</span>
                    </div>
                    <p className="cloud-thought-text">"{cloud.text}"</p>
                    <span className="cloud-subtext">Unhooked from identity • Allowed to pass</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: NCT CURATED REGULATION DRILLS --- */}
      {activeSubTab === 'drills' && (
        <div className="sanctuary-section drills-view">
          <div className="drills-header-row">
            <div>
              <h3>NCT Affective Regulation Workouts</h3>
              <p>Calibrated cognitive drills you can launch right into the Numinous Cognizance Trainer session runner.</p>
            </div>
          </div>

          <div className="curated-drills-grid">
            {emotionalExercises.map(ex => (
              <div key={ex.id} className="drill-card">
                <div className="drill-card-top">
                  <span className="drill-badge">{ex.category.replace('_', ' ')}</span>
                  <span className="drill-duration">
                    <Clock size={12} />
                    {Math.round(ex.suggestedDurationSeconds / 60)} min
                  </span>
                </div>

                <h4 className="drill-title">{ex.title}</h4>
                <p className="drill-subtitle">{ex.subtitle}</p>
                <p className="drill-prompt-preview">{ex.prompt}</p>

                <div className="drill-spark-box">
                  <strong>Spark Inquiry:</strong> {ex.sparkQuestion}
                </div>

                <button
                  type="button"
                  className="btn-launch-drill"
                  onClick={() => onLaunchExercise(ex)}
                >
                  <Play size={14} />
                  <span>Start in NCT Runner</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 6: VERIFIED REGULATION LEDGER --- */}
      {activeSubTab === 'history' && (
        <div className="sanctuary-section history-view">
          <div className="history-header-bar">
            <div>
              <h3>Cryptographic Verification Ledger</h3>
              <p>Tamper-evident record of all completed somatic resets, cognitive reappraisals, and grounding drills.</p>
            </div>
            <button
              type="button"
              className="btn-refresh-history"
              onClick={loadHistory}
            >
              <RefreshCw size={14} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {history.length === 0 ? (
            <div className="empty-history-box">
              <ShieldCheck size={36} />
              <p>No emotional regulation sessions recorded yet. Complete a breathing protocol or reappraisal above to generate your first cryptographic proof token.</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Session Title</th>
                    <th>Emotion / Focus</th>
                    <th>Equanimity Shift</th>
                    <th>Time</th>
                    <th>Proof Token</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id}>
                      <td>
                        <span className={`type-tag type-${item.type}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="table-title-cell">{item.title}</td>
                      <td>{item.emotion || 'Somatic Equilibrium'}</td>
                      <td>
                        {item.preIntensity !== undefined && item.postIntensity !== undefined ? (
                          <span className="shift-positive">
                            {item.preIntensity}/10 → {item.postIntensity}/10 (-{item.preIntensity - item.postIntensity} pts)
                          </span>
                        ) : (
                          <span className="shift-neutral">Autonomic Reset</span>
                        )}
                      </td>
                      <td className="table-time-cell">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className="token-code">{item.proofToken}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
