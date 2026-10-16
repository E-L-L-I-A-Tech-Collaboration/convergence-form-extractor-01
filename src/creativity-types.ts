export type ExerciseCategory =
  | 'alternative_uses'
  | 'concept_collision'
  | 'constraint_inversion'
  | 'remote_associates'
  | 'metaphor_forge'
  | 'emotional_regulation'
  | 'cognitive_reappraisal'
  | 'somatic_grounding'
  | 'affective_defusion';

export interface EmotionalRegulationSession {
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

export interface CreativityExercise {
  id: string;
  category: ExerciseCategory;
  title: string;
  subtitle: string;
  prompt: string;
  sparkQuestion: string;
  difficulty: 'accessible' | 'medium' | 'stretch';
  suggestedDurationSeconds: number;
  domainA?: string;
  domainB?: string;
  constraints?: string[];
  examples?: string[];
  evaluationFocus: string;
}

export interface UserCreativeIdea {
  id: string;
  text: string;
  timestamp: number;
  categoryTag?: string;
  notes?: string;
}

export interface CognitiveMonitorMetrics {
  flowState: 'convergent_focus' | 'divergent_expansion' | 'bisociative_incubation' | 'generative_flow';
  flowScore: number;
  divergenceIndex: number;
  conceptualFlexibility: number;
  cognitiveEntropy: number;
  ideationVelocity: number;
  channelDistribution: number[];
  phaseDescription: string;
}

export interface DimensionalScores {
  fluency: number;
  flexibility: number;
  originality: number;
  elaboration: number;
  synthesis: number;
}

export interface CreativeAssessmentResult {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseTitle: string;
  category: ExerciseCategory;
  submittedAt: string;
  durationSeconds: number;
  totalIdeas: number;
  overallScore: number;
  creativeArchetype: string;
  dimensionScores: DimensionalScores;
  ideaFeedback: Array<{
    ideaText: string;
    originalityScore: number;
    flexibilityCategory: string;
    highlights: string;
  }>;
  qualitativeReview: {
    standoutSpark: string;
    keyStrengths: string[];
    creativeBlindspots: string[];
    coachingNudge: string;
  };
  hrmMetrics: {
    finalCognitiveEntropy: number;
    divergenceVector: number[];
    stabilityRatio: number;
  };
  verificationProof: {
    ledgerHead: string;
    eventCount: number;
    proofToken: string;
    verifiedAt: string;
  };
}

export interface AIAssistResponse {
  type: 'provocation' | 'pivot' | 'steep_challenge' | 'elaboration';
  text: string;
  suggestedAngle?: string;
  hrmFieldGuidance?: string;
}

export interface AssessmentHistorySummary {
  id: string;
  exerciseTitle: string;
  category: ExerciseCategory;
  overallScore: number;
  submittedAt: string;
  ideasCount: number;
  archetype: string;
  proofToken: string;
}
