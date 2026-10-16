import { GoogleGenAI } from '@google/genai';
import { BinarySemanticLedger } from '../src/ledger';
import { createInitialHRMState, transitionHRM } from '../src/augmentation';
import { clamp } from '../src/math';
import type {
  HRMState,
  SearchTelemetry,
} from '../src/types';
import type {
  CreativityExercise,
  UserCreativeIdea,
  CognitiveMonitorMetrics,
  CreativeAssessmentResult,
  AIAssistResponse,
  DimensionalScores
} from '../src/creativity-types';

interface ActiveSession {
  id: string;
  exercise: CreativityExercise;
  startedAt: number;
  hrmState: HRMState;
  ledger: BinarySemanticLedger;
  ideas: UserCreativeIdea[];
  lastActivityAt: number;
}

const activeSessions = new Map<string, ActiveSession>();
const assessmentHistory: CreativeAssessmentResult[] = [];

// Lazy Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

export function startCreativeSession(exercise: CreativityExercise): { sessionId: string; initialMetrics: CognitiveMonitorMetrics } {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ledger = new BinarySemanticLedger(sessionId);
  const hrmState = createInitialHRMState(sessionId);

  ledger.append('CREATIVITY_SESSION_START', {
    sessionId,
    exerciseId: exercise.id,
    exerciseTitle: exercise.title,
    category: exercise.category,
    startedAt: new Date().toISOString()
  });

  const session: ActiveSession = {
    id: sessionId,
    exercise,
    startedAt: Date.now(),
    hrmState,
    ledger,
    ideas: [],
    lastActivityAt: Date.now()
  };

  activeSessions.set(sessionId, session);

  const initialMetrics = computeMonitorMetrics(hrmState, 0, 0, 0);
  return { sessionId, initialMetrics };
}

function computeCognitiveEntropy(phi: number[]): number {
  const squares = phi.map(x => x * x + 0.001);
  const sum = squares.reduce((a, b) => a + b, 0);
  const probs = squares.map(s => s / sum);
  let entropy = 0;
  for (const p of probs) {
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

function computeMonitorMetrics(
  hrm: HRMState,
  ideaCount: number,
  elapsedSeconds: number,
  recentPace: number
): CognitiveMonitorMetrics {
  const phi = hrm.field.phi;
  const entropy = computeCognitiveEntropy(phi);
  const avgMemory = hrm.memory.values.reduce((a, b) => a + Math.abs(b), 0) / hrm.memory.values.length;
  const avgCognition = hrm.cognition.values.reduce((a, b) => a + Math.abs(b), 0) / hrm.cognition.values.length;

  const divergence = clamp(Math.round(entropy * 28 + (avgCognition * 40)), 15, 98);
  const flexibility = clamp(Math.round(40 + (hrm.hierarchy.regions.reduce((a, b) => a + Math.abs(b), 0) * 30)), 20, 95);
  const flowScore = clamp(Math.round(50 + (recentPace * 12) + (avgMemory * 25) - (hrm.resources.pressure * 30)), 10, 99);

  let flowState: CognitiveMonitorMetrics['flowState'] = 'convergent_focus';
  let phaseDescription = 'Calibrating mental focus and framing constraints...';

  if (divergence > 68 && recentPace >= 1.5) {
    flowState = 'generative_flow';
    phaseDescription = 'Sustained Generative Flow: high divergence with frictionless ideational velocity.';
  } else if (divergence > 60) {
    flowState = 'divergent_expansion';
    phaseDescription = 'Divergent Expansion: exploring non-linear conceptual orbits and unconventional angles.';
  } else if (avgMemory > 0.45 || avgCognition > 0.45) {
    flowState = 'bisociative_incubation';
    phaseDescription = 'Bisociative Incubation: cross-pollinating memory structures with novel sensory stimuli.';
  } else {
    flowState = 'convergent_focus';
    phaseDescription = 'Convergent Focus: refining precision, clarifying mechanics, and selecting anchors.';
  }

  return {
    flowState,
    flowScore,
    divergenceIndex: divergence,
    conceptualFlexibility: flexibility,
    cognitiveEntropy: entropy,
    ideationVelocity: Number(recentPace.toFixed(1)),
    channelDistribution: phi.map(x => Number(x.toFixed(3))),
    phaseDescription
  };
}

export function updateSessionTelemetry(
  sessionId: string,
  ideas: UserCreativeIdea[],
  elapsedSeconds: number
): CognitiveMonitorMetrics {
  let session = activeSessions.get(sessionId);
  if (!session) {
    // If session expired or missing, create dynamic fallback
    const fallbackId = sessionId || `session-${Date.now()}`;
    const ledger = new BinarySemanticLedger(fallbackId);
    const hrm = createInitialHRMState(fallbackId);
    session = {
      id: fallbackId,
      exercise: {
        id: 'custom',
        category: 'alternative_uses',
        title: 'Open Ideation',
        subtitle: 'Dynamic session',
        prompt: 'Creative brainstorm',
        sparkQuestion: 'What else is possible?',
        difficulty: 'medium',
        suggestedDurationSeconds: 180,
        evaluationFocus: 'General creativity'
      },
      startedAt: Date.now() - (elapsedSeconds * 1000),
      hrmState: hrm,
      ledger,
      ideas,
      lastActivityAt: Date.now()
    };
    activeSessions.set(fallbackId, session);
  }

  session.ideas = ideas;
  const now = Date.now();
  const timeSinceLast = (now - session.lastActivityAt) / 1000;
  session.lastActivityAt = now;

  const minutes = Math.max(0.2, elapsedSeconds / 60);
  const pace = ideas.length / minutes;

  // Extract lexical tokens for diversity calculation
  const allWords = ideas.flatMap(i => i.text.toLowerCase().match(/[a-z]{3,}/g) || []);
  const uniqueWords = new Set(allWords);
  const lexicalDiversity = allWords.length > 0 ? uniqueWords.size / allWords.length : 0.5;

  const avgIdeaLen = ideas.length > 0
    ? ideas.reduce((acc, curr) => acc + curr.text.length, 0) / ideas.length
    : 0;

  const stagnation = clamp(timeSinceLast / 45, 0, 1);
  const elaborationSignal = clamp(avgIdeaLen / 80, 0, 1);

  // Map into SearchTelemetry to steer HRM dynamical field
  const telemetry: SearchTelemetry = {
    step: session.hrmState.step + 1,
    normalizedWork: clamp(ideas.length / 12, 0, 1),
    stagnation,
    gcdSignal: clamp(lexicalDiversity, 0, 1),
    progressSignal: clamp(pace / 3, 0, 1),
    failurePressure: clamp(stagnation > 0.7 ? 0.8 : 0.1, 0, 1),
    restartPressure: 0,
    curvePressure: clamp(ideas.length > 4 ? 0.7 : 0.3, 0, 1),
    residueSignal: elaborationSignal
  };

  const transition = transitionHRM(session.hrmState, telemetry);
  session.hrmState = transition.state;

  session.ledger.append('COGNITIVE_TELEMETRY_STEP', {
    step: session.hrmState.step,
    ideasCount: ideas.length,
    elapsedSeconds,
    pace: Number(pace.toFixed(2)),
    lexicalDiversity: Number(lexicalDiversity.toFixed(2)),
    cognitiveEntropy: computeCognitiveEntropy(session.hrmState.field.phi)
  });

  return computeMonitorMetrics(session.hrmState, ideas.length, elapsedSeconds, pace);
}

export async function getAIAssistance(
  sessionId: string,
  exercise: CreativityExercise,
  ideas: UserCreativeIdea[],
  mode: 'provocation' | 'pivot' | 'steep_challenge' | 'elaboration'
): Promise<AIAssistResponse> {
  const session = activeSessions.get(sessionId);
  const hrm = session?.hrmState || createInitialHRMState('assist');
  const phi = hrm.field.phi;

  // Hieromath-augmented guidance direction:
  const concreteDominance = (phi[0] + phi[1] + phi[2] + phi[3]) / 4;
  const functionalDominance = (phi[4] + phi[5] + phi[6] + phi[7]) / 4;
  const abstractDominance = (phi[8] + phi[9] + phi[10] + phi[11]) / 4;

  let hrmFieldGuidance = '';
  if (concreteDominance > abstractDominance + 0.3) {
    hrmFieldGuidance = 'Cognitive state is anchored in physical matter. Steer toward metaphysical, poetic, or procedural dimensions.';
  } else if (abstractDominance > concreteDominance + 0.3) {
    hrmFieldGuidance = 'Cognitive state is highly ethereal. Anchor into tangible mechanisms, textures, or physical sensations.';
  } else {
    hrmFieldGuidance = 'Cognitive state is balanced. Challenge fundamental assumptions and force orthogonal domain bridges.';
  }

  const ideasListText = ideas.length > 0
    ? ideas.map((idea, idx) => `${idx + 1}. "${idea.text}"`).join('\n')
    : '(User has not logged ideas yet)';

  const ai = getGemini();
  if (ai) {
    try {
      const prompt = `You are a high-level creative catalyst and Socratic muse in Convergence Form Extractor.
The user is working on the following exercise:
Exercise: ${exercise.title} (${exercise.category})
Core Prompt: ${exercise.prompt}
Spark Question: ${exercise.sparkQuestion}
Constraints: ${exercise.constraints?.join(', ') || 'None'}

Current Ideas from User so far:
${ideasListText}

Under-the-hood Cognitive HRM Vector Guidance:
${hrmFieldGuidance}

Requested Assistance Mode: ${mode}

Instructions:
1. Provide a sharp, thought-provoking Socratic provocation, lateral thinking prompt, or novel angle that shatters default assumptions.
2. DO NOT just write the user's answer for them; instead, provoke THEIR imagination with a vivid constraint, unexpected sensory metaphor, or inverted premise.
3. Keep it punchy, inspiring, and direct (max 2-3 sentences).
4. Provide one concise "suggestedAngle" (a 3-6 word conceptual trigger).

Format strictly as JSON:
{
  "text": "...",
  "suggestedAngle": "..."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.text) {
        session?.ledger.append('AI_ASSIST_EMITTED', {
          mode,
          text: parsed.text,
          suggestedAngle: parsed.suggestedAngle
        });

        return {
          type: mode,
          text: parsed.text,
          suggestedAngle: parsed.suggestedAngle || 'Orthogonal Vector',
          hrmFieldGuidance
        };
      }
    } catch (err) {
      console.error('Gemini assistance fallback:', err);
    }
  }

  // High quality algorithmic heuristic fallback
  const fallbackProvocations: Record<typeof mode, Array<{ text: string; angle: string }>> = {
    provocation: [
      {
        text: 'What if you subjected this concept to extreme thermal or geological pressure? What impossible property would emerge if it were compressed into a diamond-hard token?',
        angle: 'Geological Pressure Inversion'
      },
      {
        text: 'Strip away its most obvious attribute. If it could never be seen or touched directly, how would it manifest through sound, gravity, or emotional contagion?',
        angle: 'Sensory Deprivation Shift'
      },
      {
        text: 'Imagine an ancient civilization that possessed this object before agriculture was invented. How did their shamans or astronomers build rituals around it?',
        angle: 'Archaic Ritual Mapping'
      }
    ],
    pivot: [
      {
        text: 'Stop viewing this as an isolated tool. What if it is a modular biological cell in a macroscopic organism? What ecosystem depends on its metabolism?',
        angle: 'Organismic Ecosystem Shift'
      },
      {
        text: 'Invert the timeline: what does this become 1,000 years into its own decomposition or decay? How does decay create unexpected functionality?',
        angle: 'Deep Time & Decay'
      }
    ],
    steep_challenge: [
      {
        text: 'Rigorously eliminate every convenience. How does someone in an Antarctic blizzard or deep-sea habitat survive using only this concept?',
        angle: 'Extreme Survival Constraint'
      },
      {
        text: 'Make it entirely passive: zero human intervention, zero electricity, zero mechanical maintenance for 200 years. How does it self-regulate?',
        angle: 'Passive Self-Equilibrium'
      }
    ],
    elaboration: [
      {
        text: 'Take your most unconventional idea so far and describe its exact internal mechanical cross-section. What materials friction against each other?',
        angle: 'Micro-Mechanical Cross-Section'
      },
      {
        text: 'What would a 12-year-old and an 80-year-old perceive completely differently when interacting with this creation?',
        angle: 'Intergenerational Perception'
      }
    ]
  };

  const pool = fallbackProvocations[mode];
  const choice = pool[Math.floor(Math.random() * pool.length)];

  session?.ledger.append('AI_ASSIST_FALLBACK', {
    mode,
    choice
  });

  return {
    type: mode,
    text: choice.text,
    suggestedAngle: choice.angle,
    hrmFieldGuidance
  };
}

export async function assessCreativeSession(
  sessionId: string,
  exercise: CreativityExercise,
  ideas: UserCreativeIdea[],
  durationSeconds: number
): Promise<CreativeAssessmentResult> {
  const session = activeSessions.get(sessionId);
  const ledger = session?.ledger || new BinarySemanticLedger(sessionId);
  const hrm = session?.hrmState || createInitialHRMState(sessionId);

  // Deterministic algorithmic foundational scoring (Torrance & Guilford dimensions)
  const count = ideas.length;
  const minutes = Math.max(0.5, durationSeconds / 60);
  const rawPace = count / minutes;

  // 1. Fluency: Volume & rate normalized against target benchmark
  const fluencyScore = clamp(Math.round(Math.min(100, (count * 10) + (rawPace * 12))), 20, 98);

  // 2. Flexibility: Category & domain diversity
  const domainKeywords: Record<string, string[]> = {
    biological: ['cell', 'plant', 'animal', 'microbe', 'pulse', 'blood', 'leaf', 'root', 'living', 'symbiosis'],
    architectural: ['structure', 'wall', 'tile', 'arch', 'foundation', 'room', 'vault', 'facade', 'support'],
    acoustic: ['sound', 'vibration', 'echo', 'chime', 'resonance', 'frequency', 'tone', 'wave', 'silence'],
    metaphysical: ['soul', 'time', 'entropy', 'ritual', 'grief', 'memory', 'transcend', 'sacred', 'infinite'],
    chemical: ['heat', 'react', 'catalyst', 'mineral', 'alloy', 'powder', 'crystallize', 'oxidize'],
    social: ['community', 'dialogue', 'story', 'interact', 'human', 'shared', 'crowd', 'empathy'],
    computational: ['code', 'data', 'algorithm', 'loop', 'logic', 'signal', 'network', 'sensor'],
    somatic: ['body', 'breath', 'pulse', 'nerve', 'chest', 'sensation', 'temperature', 'ground', 'spine', 'muscle', 'tactile', 'feet', 'calm'],
    affective: ['emotion', 'fear', 'anxiety', 'frustration', 'peace', 'equanimity', 'compassion', 'stoic', 'reframe', 'catalyst', 'clarity', 'acceptance', 'defusion']
  };

  const matchedDomains = new Set<string>();
  for (const idea of ideas) {
    const lower = idea.text.toLowerCase();
    for (const [domain, keys] of Object.entries(domainKeywords)) {
      if (keys.some(k => lower.includes(k))) {
        matchedDomains.add(domain);
      }
    }
  }
  const flexibilityScore = clamp(Math.round(Math.min(100, (matchedDomains.size * 18) + (count > 3 ? 25 : 10))), 25, 96);

  // 3. Elaboration: Mechanistic and descriptive depth
  const avgIdeaWords = count > 0 ? ideas.reduce((a, b) => a + b.text.split(/\s+/).length, 0) / count : 0;
  const elaborationScore = clamp(Math.round(Math.min(100, avgIdeaWords * 5.5 + 20)), 20, 95);

  // 4. Originality: Length, uncommon syllables, rare token density
  let originalityAccumulator = 0;
  for (const idea of ideas) {
    const len = idea.text.length;
    const unusualTokens = (idea.text.match(/[xqzkj]/gi) || []).length;
    const punctuation = (idea.text.match(/[,;:\-—()]/g) || []).length;
    const score = Math.min(100, Math.round(40 + (len * 0.45) + (unusualTokens * 3) + (punctuation * 4)));
    originalityAccumulator += score;
  }
  const originalityScore = count > 0 ? clamp(Math.round(originalityAccumulator / count), 25, 97) : 35;

  // 5. Synthesis: Cross-domain bridging (especially for concept collision & remote associates)
  const synthesisScore = clamp(Math.round((flexibilityScore * 0.5) + (originalityScore * 0.5)), 25, 98);

  const dimensionScores: DimensionalScores = {
    fluency: fluencyScore,
    flexibility: flexibilityScore,
    originality: originalityScore,
    elaboration: elaborationScore,
    synthesis: synthesisScore
  };

  const overallScore = Math.round(
    dimensionScores.fluency * 0.20 +
    dimensionScores.flexibility * 0.25 +
    dimensionScores.originality * 0.30 +
    dimensionScores.elaboration * 0.15 +
    dimensionScores.synthesis * 0.10
  );

  // Determine Archetype
  let creativeArchetype = 'Generative Explorer';
  const isEmotionalCategory = ['cognitive_reappraisal', 'somatic_grounding', 'affective_defusion', 'emotional_regulation'].includes(exercise.category);

  if (isEmotionalCategory) {
    if (originalityScore >= 80 && flexibilityScore >= 80) {
      creativeArchetype = 'Equanimity Alchemist';
    } else if (flexibilityScore >= 75) {
      creativeArchetype = 'Adaptive Reframing Virtuoso';
    } else if (synthesisScore >= 75) {
      creativeArchetype = 'Stoic Cognitive Integrator';
    } else {
      creativeArchetype = 'Somatic Grounding Pioneer';
    }
  } else if (originalityScore >= 85 && synthesisScore >= 80) {
    creativeArchetype = 'Hyper-Divergent Synthesizer';
  } else if (flexibilityScore >= 80 && fluencyScore >= 80) {
    creativeArchetype = 'Polymathic Ideator';
  } else if (elaborationScore >= 80 && originalityScore >= 75) {
    creativeArchetype = 'Architectural Alchemist';
  } else if (originalityScore >= 80) {
    creativeArchetype = 'Radical Lateralist';
  } else if (synthesisScore >= 80) {
    creativeArchetype = 'Cross-Domain Bridge Builder';
  } else if (fluencyScore >= 75) {
    creativeArchetype = 'Rapid Conceptual Catalyst';
  }

  // Detailed Idea Feedback & Qualitative Review
  let ideaFeedback = ideas.map((idea, idx) => {
    const domains = Object.keys(domainKeywords).filter(d =>
      domainKeywords[d].some(k => idea.text.toLowerCase().includes(k))
    );
    const category = domains.length > 0 ? domains[0].toUpperCase() : 'FUNCTIONAL';
    return {
      ideaText: idea.text,
      originalityScore: clamp(Math.round(originalityScore + ((idx % 3) * 4) - 4), 30, 98),
      flexibilityCategory: category,
      highlights: idea.text.length > 60
        ? 'Rich functional mechanism with clear sensory or structural detail.'
        : 'Punchy conceptual spark with solid lateral divergence.'
    };
  });

  let qualitativeReview = {
    standoutSpark: ideas.length > 0
      ? ideas.reduce((max, cur) => cur.text.length > max.text.length ? cur : max, ideas[0]).text
      : 'Eager conceptual entry point.',
    keyStrengths: [
      `Strong category mobility across ${Math.max(2, matchedDomains.size)} distinct cognitive domains.`,
      `Rapid ideational momentum, clocking an unblocked flow rate of ${rawPace.toFixed(1)} ideas/min.`,
      'Demonstrated willingness to bypass initial cliché baselines and explore functional nuances.'
    ],
    creativeBlindspots: [
      'Opportunity to push sensory, tactile, and microscopic dimensions further.',
      'Can increase structural elaboration by specifying non-obvious energy sources or temporal lifespans.'
    ],
    coachingNudge: 'In your next exercise, try intentionally adopting the perspective of an entity with zero human sensory apparatus to stretch your originality quotient even higher.'
  };

  // Try calling Gemini for rich contextual evaluation if available
  const ai = getGemini();
  if (ai && ideas.length > 0) {
    try {
      const evalPrompt = `You are a world-class cognitive creativity evaluator specializing in Torrance Tests of Creative Thinking (TTCT) and Guilford's Structure of Intellect.
Analyze this human generative creativity session:

Exercise: ${exercise.title} (${exercise.category})
Prompt: ${exercise.prompt}
Target Focus: ${exercise.evaluationFocus}
Duration: ${durationSeconds} seconds
Ideas Generated (${ideas.length} total):
${ideas.map((id, i) => `${i + 1}. "${id.text}"`).join('\n')}

Under-the-hood calculated dimensions:
Fluency: ${fluencyScore}, Flexibility: ${flexibilityScore}, Originality: ${originalityScore}, Elaboration: ${elaborationScore}, Synthesis: ${synthesisScore}, Overall: ${overallScore}

Please provide an expert, supportive, deep assessment.
Format strictly as JSON:
{
  "creativeArchetype": "3-4 word title e.g. Hyper-Divergent Synthesizer, Architectural Alchemist, etc.",
  "standoutSpark": "Quote or identify the most brilliant/novel idea from their list and why it works",
  "keyStrengths": ["bullet 1", "bullet 2", "bullet 3"],
  "creativeBlindspots": ["constructive area 1", "constructive area 2"],
  "coachingNudge": "1-2 sentence actionable practice drill to expand their creative boundary",
  "ideaEvaluations": [
    {
      "originalityScore": 85,
      "flexibilityCategory": "ACOUSTIC",
      "highlights": "Specific praise for this exact idea"
    }
  ]
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: evalPrompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(res.text || '{}');
      if (parsed.creativeArchetype) creativeArchetype = parsed.creativeArchetype;
      if (parsed.standoutSpark) qualitativeReview.standoutSpark = parsed.standoutSpark;
      if (Array.isArray(parsed.keyStrengths) && parsed.keyStrengths.length > 0) qualitativeReview.keyStrengths = parsed.keyStrengths;
      if (Array.isArray(parsed.creativeBlindspots) && parsed.creativeBlindspots.length > 0) qualitativeReview.creativeBlindspots = parsed.creativeBlindspots;
      if (parsed.coachingNudge) qualitativeReview.coachingNudge = parsed.coachingNudge;

      if (Array.isArray(parsed.ideaEvaluations) && parsed.ideaEvaluations.length === ideas.length) {
        ideaFeedback = ideas.map((idea, i) => ({
          ideaText: idea.text,
          originalityScore: clamp(Number(parsed.ideaEvaluations[i].originalityScore || originalityScore), 20, 100),
          flexibilityCategory: String(parsed.ideaEvaluations[i].flexibilityCategory || 'DIVERGENT'),
          highlights: String(parsed.ideaEvaluations[i].highlights || 'Compelling creative contribution.')
        }));
      }
    } catch (e) {
      console.warn('Gemini qualitative assessment skipped or timed out, relying on robust algorithmic evaluation:', e);
    }
  }

  // Commit assessment milestone to the cryptographic ledger
  const assessmentEvent = ledger.append('CREATIVE_ASSESSMENT_FINAL', {
    exerciseId: exercise.id,
    durationSeconds,
    totalIdeas: count,
    overallScore,
    dimensionScores,
    creativeArchetype,
    finalHRMEntropy: computeCognitiveEntropy(hrm.field.phi)
  });

  const snapshot = ledger.snapshot();
  const proofToken = `PROOF-${snapshot.head.slice(0, 12).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const result: CreativeAssessmentResult = {
    id: `eval-${Date.now()}`,
    sessionId,
    exerciseId: exercise.id,
    exerciseTitle: exercise.title,
    category: exercise.category,
    submittedAt: new Date().toISOString(),
    durationSeconds,
    totalIdeas: count,
    overallScore,
    creativeArchetype,
    dimensionScores,
    ideaFeedback,
    qualitativeReview,
    hrmMetrics: {
      finalCognitiveEntropy: computeCognitiveEntropy(hrm.field.phi),
      divergenceVector: hrm.field.phi.slice(0, 6).map(x => Number(x.toFixed(3))),
      stabilityRatio: Number((1 - hrm.resources.pressure).toFixed(3))
    },
    verificationProof: {
      ledgerHead: snapshot.head,
      eventCount: snapshot.events.length,
      proofToken,
      verifiedAt: new Date().toISOString()
    }
  };

  assessmentHistory.unshift(result);
  if (assessmentHistory.length > 30) assessmentHistory.pop();

  return result;
}

export function getAssessmentHistory(): CreativeAssessmentResult[] {
  return assessmentHistory;
}

// --- Emotional Regulation Engine & Protocols ---

export interface ReappraisalRequest {
  activatingEvent: string;
  emotion: string;
  preIntensity: number;
  catastrophicThought: string;
  selectedLens: 'decatastrophizing' | 'growth' | 'compassion' | 'agency';
}

export interface ReappraisalResponse {
  primaryReframe: string;
  socraticInquiry: string;
  actionableSomaticNudge: string;
  stoicAnchor: string;
  suggestedLenses: Array<{ lens: string; title: string; reframe: string }>;
  proofToken: string;
}

export interface EmotionalSessionRecord {
  id: string;
  type: 'breathing' | 'reappraisal' | 'grounding' | 'defusion';
  title: string;
  timestamp: string;
  preIntensity?: number;
  postIntensity?: number;
  emotion?: string;
  notes?: string;
  proofToken: string;
  durationSeconds: number;
}

const emotionalSessionsHistory: EmotionalSessionRecord[] = [
  {
    id: 'emo-demo-1',
    type: 'reappraisal',
    title: 'Client Rejection to Strategic Pivot',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    preIntensity: 8,
    postIntensity: 3,
    emotion: 'Frustration',
    notes: 'Reappraised loss as filtration that preserved 120 hours of unaligned work.',
    proofToken: '0xEMO-REAPPRAISE-92b1a',
    durationSeconds: 180
  },
  {
    id: 'emo-demo-2',
    type: 'breathing',
    title: 'Physiological Sigh Autonomic Reset',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    preIntensity: 7,
    postIntensity: 2,
    emotion: 'Anxiety',
    notes: '12 breath cycles completed. Vagal tone proxy elevated.',
    proofToken: '0xEMO-BREATH-41cf8',
    durationSeconds: 140
  }
];

export async function generateCognitiveReappraisal(
  payload: ReappraisalRequest
): Promise<ReappraisalResponse> {
  const { activatingEvent, emotion, preIntensity, catastrophicThought, selectedLens } = payload;
  const ledger = new BinarySemanticLedger(`reappraisal-${Date.now()}`);

  const fallbackReframes: Record<string, { primary: string; inquiry: string; nudge: string; anchor: string }> = {
    decatastrophizing: {
      primary: `Even if the worst-case scenario materializes, your capacity to adapt, learn, and rebuild remains completely intact. The imagined catastrophe assumes static helplessness, but in reality you will respond dynamically.`,
      inquiry: `In 12 months, what percentage of this current dread will have any measurable impact on your foundational life trajectory?`,
      nudge: `Drop your shoulders 1 inch, unclamp your jaw, and exhale completely for 6 seconds. Notice that your immediate physical environment is safe right now.`,
      anchor: `“We suffer more often in imagination than in reality.” — Seneca`
    },
    growth: {
      primary: `This friction is not an impediment to the path; it is the exact resistance training required to expand your emotional tolerance and strategic acuity. Without this constraint, the breakthrough insight could not emerge.`,
      inquiry: `What specific psychological or tactical muscle does this exact obstacle force you to develop that comfort never could?`,
      nudge: `Write down 3 tiny micro-experiments you can run today that turn this setback into data rather than defeat.`,
      anchor: `“The impediment to action advances action. What stands in the way becomes the way.” — Marcus Aurelius`
    },
    compassion: {
      primary: `You are a human being navigating immense complexity and high stakes. Feeling ${emotion.toLowerCase()} is an honest biological signal of caring, not evidence of weakness or deficiency.`,
      inquiry: `If your closest, most respected friend were sitting in your chair facing this exact event, what gentle, unwavering truth would you speak to them?`,
      nudge: `Place a hand over the center of your chest. Feel the warmth and steady rhythm. Acknowledge: 'This hurts, and I am here with myself through it.'`,
      anchor: `“Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'”`
    },
    agency: {
      primary: `90% of this circumstance may be dictated by external forces, but the remaining 10%—your deliberate attention, your immediate attitude, and your very next action—is 100% within your command.`,
      inquiry: `What is the single smallest, sovereign action you can execute in the next 10 minutes to assert positive control?`,
      nudge: `Stand up, take one full deep diaphragmatic breath, and immediately complete one microscopic high-integrity action.`,
      anchor: `“You have power over your mind - not outside events. Realize this, and you will find strength.” — Marcus Aurelius`
    }
  };

  let chosen = fallbackReframes[selectedLens] || fallbackReframes.decatastrophizing;

  const ai = getGemini();
  if (ai) {
    try {
      const prompt = `You are an elite cognitive psychologist, Stoic philosopher, and emotional regulation coach in Convergence Form Extractor.
A user is experiencing acute ${emotion} (Distress level: ${preIntensity}/10).
Activating Event / Trigger: "${activatingEvent}"
Automatic Catastrophic Thought: "${catastrophicThought}"
Selected Reframing Lens: "${selectedLens}"

Generate a profound, grounded, scientifically backed cognitive reappraisal that shatters cognitive distortions (all-or-nothing thinking, catastrophizing, personalization) and restores agency and equanimity. No toxic positivity.

Return strictly JSON:
{
  "primaryReframe": "2-3 sentence transformative cognitive reframe tailored to their exact situation",
  "socraticInquiry": "1 incisive Socratic question that pierces their automatic assumption",
  "actionableSomaticNudge": "1 concrete somatic or physical micro-action to regulate the nervous system right now",
  "stoicAnchor": "1 relevant philosophical or psychological maxim",
  "alternateLenses": [
    { "lens": "Decatastrophizing", "title": "Worst-Case Disarmament", "reframe": "1 sentence reframe" },
    { "lens": "Growth", "title": "Stress Inoculation", "reframe": "1 sentence reframe" },
    { "lens": "Compassion", "title": "Inner Mentor Dialogue", "reframe": "1 sentence reframe" },
    { "lens": "Agency", "title": "Sovereign 10%", "reframe": "1 sentence reframe" }
  ]
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(res.text || '{}');
      if (parsed.primaryReframe) {
        chosen = {
          primary: parsed.primaryReframe,
          inquiry: parsed.socraticInquiry || chosen.inquiry,
          nudge: parsed.actionableSomaticNudge || chosen.nudge,
          anchor: parsed.stoicAnchor || chosen.anchor
        };
      }
    } catch (err) {
      console.warn('Gemini reappraisal generation fallback engaged:', err);
    }
  }

  const proofEvent = ledger.append('COGNITIVE_REAPPRAISAL_GENERATED', {
    emotion,
    preIntensity,
    lens: selectedLens,
    hashDigest: Math.random().toString(36).slice(2)
  });

  const proofToken = `0xEMO-${proofEvent.hash.slice(0, 8)}`;

  return {
    primaryReframe: chosen.primary,
    socraticInquiry: chosen.inquiry,
    actionableSomaticNudge: chosen.nudge,
    stoicAnchor: chosen.anchor,
    suggestedLenses: [
      { lens: 'decatastrophizing', title: 'Decatastrophizing', reframe: fallbackReframes.decatastrophizing.primary },
      { lens: 'growth', title: 'Growth & Inoculation', reframe: fallbackReframes.growth.primary },
      { lens: 'compassion', title: 'Self-Compassion', reframe: fallbackReframes.compassion.primary },
      { lens: 'agency', title: 'Sovereign Agency', reframe: fallbackReframes.agency.primary }
    ],
    proofToken
  };
}

export function logEmotionalRegulationSession(record: Omit<EmotionalSessionRecord, 'id' | 'proofToken'>): EmotionalSessionRecord {
  const ledger = new BinarySemanticLedger(`emo-session-${Date.now()}`);
  const event = ledger.append('EMOTIONAL_REGULATION_COMPLETED', {
    ...record,
    recordedAt: new Date().toISOString()
  });

  const fullRecord: EmotionalSessionRecord = {
    ...record,
    id: `emo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    proofToken: `0xEMO-${event.hash.slice(0, 8)}`
  };

  emotionalSessionsHistory.unshift(fullRecord);
  if (emotionalSessionsHistory.length > 50) emotionalSessionsHistory.pop();
  return fullRecord;
}

export function getEmotionalSessionsHistory(): EmotionalSessionRecord[] {
  return emotionalSessionsHistory;
}
