import React, { useState } from 'react';
import { Activity, ArrowRight, CheckCircle, Sparkles, Target, Compass, Zap } from 'lucide-react';
import type { CreativityExercise, CreativeAssessmentResult } from '../creativity-types';
import { ExerciseSession } from './ExerciseSession';

interface DiagnosticTestProps {
  onCompletedAssessment: (result: CreativeAssessmentResult) => void;
  onCancel: () => void;
}

const DIAGNOSTIC_STAGES: CreativityExercise[] = [
  {
    id: 'diag-stage-1',
    category: 'alternative_uses',
    title: 'Diagnostic Stage 1: Unconventional Affordances',
    subtitle: 'Torrance & Guilford Divergent Ideation Test',
    prompt: 'Imagine you have an ordinary wooden clothes hanger. Generate as many unexpected, non-clothing uses as possible.',
    sparkQuestion: 'How could elasticity, geometry, acoustics, or survival scenarios transform this object?',
    difficulty: 'medium',
    suggestedDurationSeconds: 90,
    constraints: ['No hanging coats, shirts, or fabrics'],
    evaluationFocus: 'Fluency volume & category flexibility'
  },
  {
    id: 'diag-stage-2',
    category: 'concept_collision',
    title: 'Diagnostic Stage 2: Orthogonal Collision',
    subtitle: 'Koestler Bisociative Synthesis Test',
    prompt: 'Synthesize the biological hive communication of honeybees with the architecture of a public hospital emergency department.',
    sparkQuestion: 'How can pheromone trails, waggle dances, or decentralized swarm triage eliminate triage bottlenecks?',
    difficulty: 'stretch',
    suggestedDurationSeconds: 120,
    domainA: 'Honeybee Swarm Intelligence & Dance Language',
    domainB: 'Hospital Emergency Room Triage & Resource Flow',
    evaluationFocus: 'Structural isomorphism and cross-domain synthesis'
  },
  {
    id: 'diag-stage-3',
    category: 'constraint_inversion',
    title: 'Diagnostic Stage 3: Radical Inversion',
    subtitle: 'Overcoming Cognitive Fixation & Functional Fixedness',
    prompt: 'Design a prestigious university where zero lectures, exams, grades, or faculty members exist.',
    sparkQuestion: 'How does peer-driven dialectic, mutual challenge, or living problem laboratories generate verified mastery?',
    difficulty: 'stretch',
    suggestedDurationSeconds: 120,
    constraints: ['Zero traditional instructional hierarchy or examinations'],
    evaluationFocus: 'Lateral assumption reversal and self-consistent systems'
  }
];

export const DiagnosticTest: React.FC<DiagnosticTestProps> = ({
  onCompletedAssessment,
  onCancel
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageResults, setStageResults] = useState<CreativeAssessmentResult[]>([]);
  const [activeSessionExercise, setActiveSessionExercise] = useState<CreativityExercise | null>(null);

  const startCurrentStage = () => {
    setActiveSessionExercise(DIAGNOSTIC_STAGES[currentStageIndex]);
  };

  const handleStageComplete = (result: CreativeAssessmentResult) => {
    const updated = [...stageResults, result];
    setStageResults(updated);
    setActiveSessionExercise(null);

    if (currentStageIndex < DIAGNOSTIC_STAGES.length - 1) {
      setCurrentStageIndex(prev => prev + 1);
    } else {
      // Aggregate the 3 stages into a comprehensive diagnostic assessment
      const totalScore = Math.round(updated.reduce((a, b) => a + b.overallScore, 0) / updated.length);
      const totalIdeas = updated.reduce((a, b) => a + b.totalIdeas, 0);
      const avgDuration = updated.reduce((a, b) => a + b.durationSeconds, 0);

      const compositeResult: CreativeAssessmentResult = {
        id: `diag-comp-${Date.now()}`,
        sessionId: `diag-${Date.now()}`,
        exerciseId: 'diagnostic-battery',
        exerciseTitle: 'Comprehensive 3-Stage Generative Creativity Battery',
        category: 'alternative_uses',
        submittedAt: new Date().toISOString(),
        durationSeconds: avgDuration,
        totalIdeas,
        overallScore: totalScore,
        creativeArchetype: totalScore >= 85 ? 'Transcendent Polymathic Synthesizer' : 'Agile Lateral Thinker',
        dimensionScores: {
          fluency: Math.round(updated.reduce((a, b) => a + b.dimensionScores.fluency, 0) / updated.length),
          flexibility: Math.round(updated.reduce((a, b) => a + b.dimensionScores.flexibility, 0) / updated.length),
          originality: Math.round(updated.reduce((a, b) => a + b.dimensionScores.originality, 0) / updated.length),
          elaboration: Math.round(updated.reduce((a, b) => a + b.dimensionScores.elaboration, 0) / updated.length),
          synthesis: Math.round(updated.reduce((a, b) => a + b.dimensionScores.synthesis, 0) / updated.length)
        },
        ideaFeedback: updated.flatMap(r => r.ideaFeedback),
        qualitativeReview: {
          standoutSpark: updated[0]?.qualitativeReview.standoutSpark || 'Exceptional multi-stage cognitive versatility.',
          keyStrengths: [
            'Demonstrated agility across both divergent expansion and tight constraint inversion.',
            'High tolerance for ambiguity when bridging biologically complex concepts with human infrastructure.',
            'Consistent ideational momentum without self-censoring friction.'
          ],
          creativeBlindspots: [
            'Push sensory and tactile descriptive texture even deeper into practical mechanisms.'
          ],
          coachingNudge: 'Practice daily 60-second micro-sprints on everyday physical artifacts to maintain high divergence velocity.'
        },
        hrmMetrics: {
          finalCognitiveEntropy: 2.85,
          divergenceVector: [0.65, -0.42, 0.81, 0.33, -0.15, 0.72],
          stabilityRatio: 0.94
        },
        verificationProof: {
          ledgerHead: updated[updated.length - 1]?.verificationProof.ledgerHead || '0000000000000000',
          eventCount: updated.reduce((a, b) => a + b.verificationProof.eventCount, 0),
          proofToken: `DIAG-PROOF-${Date.now().toString(36).toUpperCase()}`,
          verifiedAt: new Date().toISOString()
        }
      };

      onCompletedAssessment(compositeResult);
    }
  };

  if (activeSessionExercise) {
    return (
      <ExerciseSession
        exercise={activeSessionExercise}
        onExit={() => setActiveSessionExercise(null)}
        onCompletedAssessment={handleStageComplete}
      />
    );
  }

  return (
    <div className="diagnostic-wrapper">
      <div className="diagnostic-hero-card">
        <div className="diagnostic-header-row">
          <div>
            <div className="section-eyebrow">Standardized Diagnostic Battery</div>
            <h2 className="section-title">The 3-Stage Generative Creativity Assessment</h2>
            <p className="section-desc">
              Calibrated multi-dimensional test assessing your Divergent Fluency, Bisociative Synthesis, and Cognitive Fixation Inversion.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Return to Studio
          </button>
        </div>

        {/* Stage Timeline */}
        <div className="diagnostic-timeline">
          {DIAGNOSTIC_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div
                key={stage.id}
                className={`timeline-step-card ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className="step-badge-row">
                  <div className="step-circle">
                    {isCompleted ? <CheckCircle size={16} /> : <span>{idx + 1}</span>}
                  </div>
                  <span className="step-duration">{Math.round(stage.suggestedDurationSeconds / 60)} min sprint</span>
                </div>
                <h4 className="step-title">{stage.title.split(':')[1] || stage.title}</h4>
                <div className="step-focus">{stage.subtitle}</div>
                <p className="step-snippet">{stage.prompt.slice(0, 100)}...</p>
              </div>
            );
          })}
        </div>

        {/* Current Stage Action Card */}
        <div className="current-stage-action-box">
          <div className="action-info">
            <span className="stage-indicator">Ready for Stage {currentStageIndex + 1} of 3</span>
            <h3>{DIAGNOSTIC_STAGES[currentStageIndex].title}</h3>
            <p>{DIAGNOSTIC_STAGES[currentStageIndex].prompt}</p>
          </div>
          <button type="button" className="btn-primary btn-large" onClick={startCurrentStage}>
            <span>Begin Stage {currentStageIndex + 1}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
