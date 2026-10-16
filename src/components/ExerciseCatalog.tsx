import React, { useState } from 'react';
import { Play, Sparkles, Plus, Clock, Target, Shuffle } from 'lucide-react';
import type { CreativityExercise, ExerciseCategory } from '../creativity-types';

interface ExerciseCatalogProps {
  exercises: CreativityExercise[];
  onSelectExercise: (exercise: CreativityExercise) => void;
  onStartCustom: (exercise: CreativityExercise) => void;
}

const CATEGORY_TABS: Array<{ key: ExerciseCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All Workouts' },
  { key: 'alternative_uses', label: 'Alternative Uses' },
  { key: 'concept_collision', label: 'Concept Collision' },
  { key: 'constraint_inversion', label: 'Constraint Inversion' },
  { key: 'remote_associates', label: 'Remote Associates' },
  { key: 'metaphor_forge', label: 'Metaphor Forge' },
  { key: 'cognitive_reappraisal', label: 'Cognitive Reappraisal' },
  { key: 'somatic_grounding', label: 'Somatic Grounding' },
  { key: 'affective_defusion', label: 'Thought Defusion' },
  { key: 'emotional_regulation', label: 'Emotional Regulation' }
];

export const ExerciseCatalog: React.FC<ExerciseCatalogProps> = ({
  exercises,
  onSelectExercise,
  onStartCustom
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customSpark, setCustomSpark] = useState('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>('alternative_uses');

  const filtered = selectedCategory === 'all'
    ? exercises
    : exercises.filter(e => e.category === selectedCategory);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customPrompt.trim()) return;

    const customEx: CreativityExercise = {
      id: `custom-${Date.now()}`,
      category: customCategory,
      title: customTitle.trim(),
      subtitle: 'Self-Directed Creative Sprint',
      prompt: customPrompt.trim(),
      sparkQuestion: customSpark.trim() || 'What hidden affordance or unexpected angle breaks default thinking?',
      difficulty: 'medium',
      suggestedDurationSeconds: 180,
      evaluationFocus: 'Personal divergent exploration and conceptual agility'
    };

    onStartCustom(customEx);
    setShowCustomModal(false);
  };

  const handleRandomPick = () => {
    const randomIndex = Math.floor(Math.random() * exercises.length);
    onSelectExercise(exercises[randomIndex]);
  };

  return (
    <div className="catalog-container">
      <div className="catalog-top-row">
        <div>
          <div className="section-eyebrow">Numinous Cognizance Trainer (NCT)</div>
          <h2 className="section-title">Generative Exercises & Ideation Sprints</h2>
          <p className="section-desc">
            Calibrated cognitive workouts designed to expand mental flexibility, shatter linear assumptions, and strengthen your divergent ideation muscles.
          </p>
        </div>

        <div className="catalog-actions-row">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRandomPick}
            title="Pick a random creative challenge"
          >
            <Shuffle size={16} />
            <span>Surprise Me</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowCustomModal(true)}
          >
            <Plus size={16} />
            <span>Create Custom NCT Drill</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-filter-tabs">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`cat-tab ${selectedCategory === tab.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Exercise Grid */}
      <div className="exercise-cards-grid">
        {filtered.map(exercise => (
          <div key={exercise.id} className="exercise-card">
            <div className="card-top">
              <div className="card-badge-row">
                <span className={`difficulty-pill ${exercise.difficulty}`}>
                  {exercise.difficulty}
                </span>
                <span className="duration-tag">
                  <Clock size={12} />
                  <span>{Math.round(exercise.suggestedDurationSeconds / 60)} min</span>
                </span>
              </div>
              <span className="category-label">
                {exercise.category.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <h3 className="exercise-card-title">{exercise.title}</h3>
            <div className="exercise-card-subtitle">{exercise.subtitle}</div>

            <p className="exercise-prompt-preview">{exercise.prompt}</p>

            <div className="spark-preview-box">
              <Sparkles size={14} className="spark-icon" />
              <span>{exercise.sparkQuestion}</span>
            </div>

            {exercise.domainA && exercise.domainB && (
              <div className="domain-collision-tag">
                <span className="domain-chip">{exercise.domainA.split('(')[0].trim()}</span>
                <span className="cross-symbol">✕</span>
                <span className="domain-chip">{exercise.domainB.split('(')[0].trim()}</span>
              </div>
            )}

            <div className="card-footer">
              <div className="focus-note">
                <Target size={13} />
                <span>{exercise.evaluationFocus}</span>
              </div>
              <button
                type="button"
                className="btn-card-launch"
                onClick={() => onSelectExercise(exercise)}
              >
                <span>Start NCT Drill</span>
                <Play size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Drill Modal */}
      {showCustomModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create Custom NCT Drill</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCustomModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="modal-form">
              <div className="form-group">
                <label>Exercise Title</label>
                <input
                  type="text"
                  placeholder="e.g., The Desert Monolith or Plastic Bottle"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value as ExerciseCategory)}
                >
                  <option value="alternative_uses">Alternative Uses (Guilford Divergent)</option>
                  <option value="concept_collision">Concept Collision (Bisociation)</option>
                  <option value="constraint_inversion">Constraint Inversion (Lateral Thinking)</option>
                  <option value="remote_associates">Remote Associates (Bridge Building)</option>
                  <option value="metaphor_forge">Metaphor Forge (Cross-Domain Mapping)</option>
                  <option value="cognitive_reappraisal">Cognitive Reappraisal (Crisis to Catalyst)</option>
                  <option value="somatic_grounding">Somatic Grounding (5-4-3-2-1 Anchoring)</option>
                  <option value="affective_defusion">Thought Defusion (Observer Self)</option>
                  <option value="emotional_regulation">Emotional Regulation (Affective Equilibrium)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Core Prompt & Challenge</label>
                <textarea
                  placeholder="Describe what you want to generate ideas for..."
                  rows={3}
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Spark Question (Optional provocation)</label>
                <input
                  type="text"
                  placeholder="e.g. What if gravity, time, or cost were zero?"
                  value={customSpark}
                  onChange={e => setCustomSpark(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Launch Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
