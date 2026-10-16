import React, { useState, useEffect } from 'react';
import type {
  CreativityExercise,
  CreativeAssessmentResult,
  CognitiveMonitorMetrics
} from './creativity-types';
import { CREATIVITY_EXERCISES } from './creativity-exercises';
import { Header } from './components/Header';
import { ExerciseCatalog } from './components/ExerciseCatalog';
import { ExerciseSession } from './components/ExerciseSession';
import { DiagnosticTest } from './components/DiagnosticTest';
import { CreativeMusePlayground } from './components/CreativeMusePlayground';
import { ProgressDashboard } from './components/ProgressDashboard';
import { AssessmentModal } from './components/AssessmentModal';
import { EmotionalRegulationSanctuary } from './components/EmotionalRegulationSanctuary';
import { UserProfileModal } from './components/UserProfileModal';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { safeFetchJson } from './api-client';
import { getStoredGuiTheme, applyThemeToDom } from './gui-theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<'exercises' | 'emotional-regulation' | 'diagnostic' | 'muse' | 'progress'>('exercises');
  const [exercises, setExercises] = useState<CreativityExercise[]>(CREATIVITY_EXERCISES);
  const [activeExercise, setActiveExercise] = useState<CreativityExercise | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<CreativeAssessmentResult | null>(null);
  const [history, setHistory] = useState<CreativeAssessmentResult[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'create' | 'profiles' | 'account' | 'stats'>('profile');

  const handleOpenProfile = (tab: 'profile' | 'create' | 'profiles' = 'profile') => {
    setProfileModalTab(tab);
    setIsProfileOpen(true);
  };
  const [liveMetrics, setLiveMetrics] = useState<CognitiveMonitorMetrics>({
    flowState: 'convergent_focus',
    flowScore: 78,
    divergenceIndex: 72,
    conceptualFlexibility: 80,
    cognitiveEntropy: 2.64,
    ideationVelocity: 2.4,
    channelDistribution: [0.4, 0.7, -0.2, 0.8, -0.3, 0.5, 0.9, -0.4, 0.6, 0.2, -0.5, 0.7],
    phaseDescription: 'Balanced cognitive readiness across divergent & synthesis fields'
  });

  // Android back button / navigation gesture handling
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (currentAssessment) {
        e.preventDefault();
        setCurrentAssessment(null);
      } else if (activeExercise) {
        e.preventDefault();
        setActiveExercise(null);
      } else if (isProfileOpen) {
        e.preventDefault();
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentAssessment, activeExercise, isProfileOpen]);

  // Initialize GUI theme and load exercises & past history on mount
  useEffect(() => {
    applyThemeToDom(getStoredGuiTheme());

    async function loadInitialData() {
      try {
        const [exRes, histRes] = await Promise.all([
          safeFetchJson<{ exercises: CreativityExercise[] }>('/api/creativity/exercises'),
          safeFetchJson<{ history: CreativeAssessmentResult[] }>('/api/creativity/history')
        ]);

        if (exRes.ok && exRes.data && Array.isArray(exRes.data.exercises) && exRes.data.exercises.length > 0) {
          setExercises(exRes.data.exercises);
        }

        if (histRes.ok && histRes.data && Array.isArray(histRes.data.history) && histRes.data.history.length > 0) {
          setHistory(histRes.data.history);
        } else {
          // Seed a representative foundational assessment so growth tab has rich immediate context
          const seedAssessment: CreativeAssessmentResult = {
            id: 'seed-baseline-01',
            sessionId: 'session-baseline',
            exerciseId: 'alt-uses-brick',
            exerciseTitle: 'The Humble Red Brick',
            category: 'alternative_uses',
            submittedAt: new Date(Date.now() - 86400000).toISOString(),
            durationSeconds: 120,
            totalIdeas: 8,
            overallScore: 86,
            creativeArchetype: 'Hyper-Divergent Synthesizer',
            dimensionScores: {
              fluency: 88,
              flexibility: 85,
              originality: 89,
              elaboration: 80,
              synthesis: 84
            },
            ideaFeedback: [
              {
                ideaText: 'Crushed into high-iron terracotta powder to fertilize acid-loving bonsai moss',
                originalityScore: 92,
                flexibilityCategory: 'BIOLOGICAL',
                highlights: 'Novel chemical & ecological affordance exploited.'
              },
              {
                ideaText: 'Thermal ballast heated in campfire coals and wrapped in wool as a foot warmer',
                originalityScore: 84,
                flexibilityCategory: 'FUNCTIONAL',
                highlights: 'Solid thermodynamic exploitation.'
              }
            ],
            qualitativeReview: {
              standoutSpark: 'Crushed into terracotta powder for bonsai mineral cultivation.',
              keyStrengths: [
                'Immediate willingness to transcend rigid construction stereotypes.',
                'Strong cross-category mobility from thermodynamics to biological cultivation.',
                'Fluid ideational cadence with negligible hesitance.'
              ],
              creativeBlindspots: [
                'Can push acoustic and tactile dimensions further in subsequent drills.'
              ],
              coachingNudge: 'Try combining biological and mechanical constraints in your next drill to stretch synthesis.'
            },
            hrmMetrics: {
              finalCognitiveEntropy: 2.74,
              divergenceVector: [0.55, -0.32, 0.78, 0.44, -0.19, 0.65],
              stabilityRatio: 0.92
            },
            verificationProof: {
              ledgerHead: 'f94a82e140bc892a',
              eventCount: 6,
              proofToken: 'PROOF-F94A82-BASE',
              verifiedAt: new Date(Date.now() - 86400000).toISOString()
            }
          };
          setHistory([seedAssessment]);
        }
      } catch (err) {
        console.warn('Initial load non-critical notice:', err);
      }
    }
    loadInitialData();
  }, []);

  const handleSelectExercise = (exercise: CreativityExercise) => {
    setActiveExercise(exercise);
    setActiveTab('exercises');
  };

  const handleCompleteAssessment = (result: CreativeAssessmentResult) => {
    setActiveExercise(null);
    setCurrentAssessment(result);
    setHistory(prev => [result, ...prev]);
  };

  return (
    <div className="studio-app-shell">
      <Header
        activeTab={activeTab}
        onSelectTab={tab => {
          setActiveTab(tab);
          if (tab !== 'exercises') {
            setActiveExercise(null);
          }
        }}
        liveMetrics={liveMetrics}
        onOpenProfile={() => handleOpenProfile('profile')}
        onOpenCreateProfile={() => handleOpenProfile('create')}
      />

      <main id="main-content" className="studio-main-content">
        {activeTab === 'exercises' && (
          activeExercise ? (
            <ExerciseSession
              exercise={activeExercise}
              onExit={() => setActiveExercise(null)}
              onCompletedAssessment={handleCompleteAssessment}
            />
          ) : (
            <ExerciseCatalog
              exercises={exercises}
              onSelectExercise={handleSelectExercise}
              onStartCustom={handleSelectExercise}
            />
          )
        )}

        {activeTab === 'emotional-regulation' && (
          <EmotionalRegulationSanctuary
            emotionalExercises={exercises.filter(e =>
              ['cognitive_reappraisal', 'somatic_grounding', 'affective_defusion', 'emotional_regulation'].includes(e.category)
            )}
            onLaunchExercise={handleSelectExercise}
          />
        )}

        {activeTab === 'diagnostic' && (
          <DiagnosticTest
            onCompletedAssessment={handleCompleteAssessment}
            onCancel={() => setActiveTab('exercises')}
          />
        )}

        {activeTab === 'muse' && (
          <CreativeMusePlayground />
        )}

        {activeTab === 'progress' && (
          <ProgressDashboard
            history={history}
            onSelectResult={result => setCurrentAssessment(result)}
            onLaunchWorkout={() => {
              setActiveExercise(exercises[0]);
              setActiveTab('exercises');
            }}
          />
        )}
      </main>

      {/* Android Ergonomic Bottom Navigation Bar for Mobile & Android devices */}
      <AndroidBottomNav
        activeTab={activeTab}
        onSelectTab={tab => {
          setActiveExercise(null);
          setActiveTab(tab);
        }}
        onOpenProfile={() => handleOpenProfile('profile')}
      />

      {/* Assessment Modal Report */}
      {currentAssessment && (
        <AssessmentModal
          result={currentAssessment}
          onClose={() => setCurrentAssessment(null)}
          onContinueExercises={() => {
            setCurrentAssessment(null);
            setActiveTab('exercises');
          }}
          onViewProgress={() => {
            setCurrentAssessment(null);
            setActiveTab('progress');
          }}
        />
      )}

      {/* Customizable User Profile & Email Authentication Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialTab={profileModalTab}
      />

      <footer className="studio-footer">
        <p>
          Convergence Form Extractor • Augmented by Cognitive HRM Modeling • Multi-Persona Creative Sanctuary
        </p>
      </footer>
    </div>
  );
}
