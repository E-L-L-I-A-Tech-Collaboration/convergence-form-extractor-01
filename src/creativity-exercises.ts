import type { CreativityExercise } from './creativity-types';

export const CREATIVITY_EXERCISES: CreativityExercise[] = [
  {
    id: 'alt-uses-brick',
    category: 'alternative_uses',
    title: 'The Humble Red Brick',
    subtitle: 'Classic Guilford Divergent Thinking Challenge',
    prompt: 'Name as many unconventional, non-construction uses for a standard red brick as you can imagine in 2 minutes.',
    sparkQuestion: 'What if you ground it down, altered its temperature, or placed it in microgravity or a museum?',
    difficulty: 'accessible',
    suggestedDurationSeconds: 120,
    constraints: [
      'Cannot be used to build a wall, house, path, or patio',
      'Focus on sensory, chemical, artistic, or functional transformations'
    ],
    examples: [
      'Carved into a stamp for printing rust-colored terracotta patterns',
      'Heat sink placed in an insulated tea-cosy to keep artisanal bread warm at a picnic'
    ],
    evaluationFocus: 'Fluency volume and semantic category distance (functional vs. artistic vs. survival)'
  },
  {
    id: 'alt-uses-coffee-cup',
    category: 'alternative_uses',
    title: 'The Ceramic Coffee Mug',
    subtitle: 'Everyday Object Transmutation',
    prompt: 'Envision novel uses for an ordinary ceramic coffee mug beyond holding liquids.',
    sparkQuestion: 'How could sound, acoustics, electrical insulation, or emergency situations transform this object?',
    difficulty: 'accessible',
    suggestedDurationSeconds: 120,
    constraints: [
      'No drinking or liquid containment functions',
      'Explore tactile, acoustic, geometric, and modular uses'
    ],
    examples: [
      'Passive acoustic amplifier for an inverted smartphone speaker',
      'Ceramic honing stone on the unglazed bottom rim for field knife sharpening'
    ],
    evaluationFocus: 'Originality of physical affordances exploited'
  },
  {
    id: 'concept-collision-ocean-metro',
    category: 'concept_collision',
    title: 'Bioluminescent Mass Transit',
    subtitle: 'Bisociation: Marine Biology meets Urban Commuting',
    prompt: 'Fuse the biological mechanisms of deep-sea bioluminescent organisms with the design of an urban subway or mass transit system.',
    sparkQuestion: 'How does nutrient pulsing, cold-light signaling, or symbiotic flow inspire civil infrastructure?',
    difficulty: 'medium',
    suggestedDurationSeconds: 180,
    domainA: 'Deep-Sea Bioluminescence (luciferin-luciferase reactions, abyssal symbiosis)',
    domainB: 'Urban Mass Transit (stations, passenger flows, signaling, ticketing, tunnels)',
    constraints: [
      'Must produce concrete, realistic or visionary architectural/operational mechanisms',
      'Integrate energy generation, sensory passenger navigation, or biological hygiene'
    ],
    examples: [
      'Living microbial wall tiles that glow softly blue when trains approach and pulse amber during peak congestion',
      'Zero-electricity bioluminescent ticketing wristbands that react with station humidity'
    ],
    evaluationFocus: 'Cross-domain structural mapping and mechanistic depth'
  },
  {
    id: 'concept-collision-origami-telescope',
    category: 'concept_collision',
    title: 'Origami Celestial Observatories',
    subtitle: 'Bisociation: Ancient Crease Geometry meets Deep Space Physics',
    prompt: 'Synthesize the algorithmic folding principles of paper origami with deep-space observation satellites or telescope arrays.',
    sparkQuestion: 'What if geometric tessellations could solve the spatial packing and thermal shielding limits of space exploration?',
    difficulty: 'stretch',
    suggestedDurationSeconds: 240,
    domainA: 'Miura-Ori and Hexagonal Tessellation Creasing',
    domainB: 'Deep-Space Infrared Telescopes and Starshades',
    constraints: [
      'Address physical actuation, ultra-compact launch volume, and micro-precision focal alignment'
    ],
    examples: [
      'A self-deploying starshade that blossoms along Miura creases actuated by shape-memory alloy wires',
      'Multi-spectral petal sunshield that re-folds dynamically to shield camera arrays from solar flares'
    ],
    evaluationFocus: 'Synthesis coherence, architectural inventiveness, and detail'
  },
  {
    id: 'constraint-inversion-silent-music',
    category: 'constraint_inversion',
    title: 'The Silent Concert Hall',
    subtitle: 'Assumption Inversion & Lateral Disruption',
    prompt: 'Invent a world-class musical experience or venue where not a single audible sound wave can be transmitted through the air.',
    sparkQuestion: 'How can rhythm, harmony, pitch, and timbre be perceived through bone conduction, tactile infrasound, or visual luminescence?',
    difficulty: 'medium',
    suggestedDurationSeconds: 180,
    constraints: [
      'Zero airborne acoustic transmission allowed',
      'Must convey the visceral emotional arc of a 60-minute symphonic performance'
    ],
    examples: [
      'Resonant wooden flooring calibrated to send micro-vibrations directly into spectators bare feet',
      'Sub-bass pneumatic vests that translate polyphonic counterpoint into varying pressure waves across the chest'
    ],
    evaluationFocus: 'Lateral agility, overcoming sensory constraints, and sensory translation'
  },
  {
    id: 'constraint-inversion-bookless-library',
    category: 'constraint_inversion',
    title: 'The Library Without Documents',
    subtitle: 'Core Asset Inversion & Social Architecture',
    prompt: 'Design an iconic civic library that contains no physical books, screens, e-readers, or digital audio recordings.',
    sparkQuestion: 'If knowledge is not stored in recorded symbols, how does human wisdom gather, cross-pollinate, and endure?',
    difficulty: 'accessible',
    suggestedDurationSeconds: 150,
    constraints: [
      'No physical, printed, or recorded media permitted',
      'Must remain a communal center for deep discovery, curiosity, and generational transmission'
    ],
    examples: [
      'A Human Living Archive where visitors "check out" elders, artisans, and storytellers for 30-minute dialogue sessions',
      'A tactile sensory botanical labyrinth where every plant species represents a historical era or scientific dilemma'
    ],
    evaluationFocus: 'Human-centered reframing and radical value proposition clarity'
  },
  {
    id: 'remote-associates-triad-1',
    category: 'remote_associates',
    title: 'The Invisible Keystone',
    subtitle: 'Mednick Remote Association & Semantic Bridging',
    prompt: 'Identify or invent unexpected conceptual threads that deeply link these three disparate concepts: "A pendulum clock", "A sourdough starter", and "A computer operating system scheduler".',
    sparkQuestion: 'What underlying laws of rhythm, feeding, threshold management, and entropy decay unify all three?',
    difficulty: 'stretch',
    suggestedDurationSeconds: 210,
    domainA: 'Harmonic physics / Time measurement',
    domainB: 'Microbial fermentation / Living cultures',
    constraints: [
      'Do not settle for superficial wordplay; find procedural, systemic, or metaphysical isomorphisms'
    ],
    examples: [
      'All three require periodic inputs (winding, flour/water, clock cycles) to prevent chaotic entropy from collapsing system equilibrium'
    ],
    evaluationFocus: 'Deep relational analogies over surface perceptual similarities'
  },
  {
    id: 'metaphor-forge-time-and-grief',
    category: 'metaphor_forge',
    title: 'The Architecture of Grief & Healing',
    subtitle: 'Abstract Emotional State to Physical Artifact',
    prompt: 'Craft vivid, non-cliché physical metaphors to explain how grief transforms over time, using terms from metallurgy, geology, or architectural ruin.',
    sparkQuestion: 'Instead of "healing like a wound", what if it is like tectonic shearing, work-hardening bronze, or moss claiming a granite cathedral?',
    difficulty: 'medium',
    suggestedDurationSeconds: 180,
    constraints: [
      'Avoid tired clichés ("wave", "storm", "broken heart")',
      'Ground the metaphor in tangible materials, phase changes, or structural mechanics'
    ],
    examples: [
      'Grief is not a wound that seals; it is cold-worked steel. The repeated impact hardens the material until it can bear immense weight, though it loses its initial elasticity forever.'
    ],
    evaluationFocus: 'Poetic resonance, visceral tactile detail, and cognitive novelty'
  },
  {
    id: 'emotion-reappraisal-crucible',
    category: 'cognitive_reappraisal',
    title: 'The Reappraisal Crucible: Crisis to Catalyst',
    subtitle: 'High-Velocity Cognitive Reframing Sprint',
    prompt: 'Recall an acute frustration, rejection, or moment of dread. Rapidly generate 5 radically divergent, empirically defensible reframings that position this obstacle as an asymmetric advantage, an emotional stress-inoculation trial, or an inflection point for creative emergence.',
    sparkQuestion: 'If an omniscient, deeply loving mentor reviewed this exact adversity from 10 years in the future, what unforeseen breakthrough would they point to?',
    difficulty: 'medium',
    suggestedDurationSeconds: 180,
    constraints: [
      'No toxic positivity; each reframe must be logically sound and actionable',
      'Explore at least 3 distinct domains: resilience training, strategic realignment, and empathetic growth'
    ],
    examples: [
      'Rejection as filtration: This doors closing spares 200 hours of misaligned labor and frees bandwidth for higher-leverage bets.',
      'Somatic calibration: This surge of adrenaline is not panic; it is biological fuel preparing my nervous system to perform with heightened vigilance.'
    ],
    evaluationFocus: 'Cognitive flexibility under acute tension, decatastrophizing velocity, and actionable reframing depth'
  },
  {
    id: 'emotion-somatic-grounding-54321',
    category: 'somatic_grounding',
    title: 'The Somatic Sensorium (5-4-3-2-1 Inversion)',
    subtitle: 'Autonomic Nervous System Anchoring',
    prompt: 'When cognitive entropy or affective turbulence peaks, root attention into raw physical sensation. Generate granular descriptions of 5 things seen with microscopic attention, 4 distinct tactile contact points, 3 acoustic frequencies, 2 atmospheric scents, and 1 somatic anchor of safety.',
    sparkQuestion: 'How does transforming amorphous anxiety into hyper-specific physical data collapse the threat-detection loop?',
    difficulty: 'accessible',
    suggestedDurationSeconds: 150,
    constraints: [
      'Focus strictly on tangible sensory phenomena occurring right now',
      'Describe textures, temperatures, light refraction, and subtle micro-rhythms'
    ],
    examples: [
      'The cool brushed aluminum bezel of my laptop dissipating palm heat.',
      'A low 60Hz hum of the air circulation unit vibrating against the window pane.'
    ],
    evaluationFocus: 'Sensory granularity, attentional grounding, and autonomic stabilization'
  },
  {
    id: 'emotion-affective-defusion-sky',
    category: 'affective_defusion',
    title: 'The Observer Self: Thought Defusion',
    subtitle: 'Metacognitive Unhooking & Non-Attachment',
    prompt: 'Externalize a persistent self-limiting belief or anxious recurring loop (e.g., "I will be exposed", "I cannot handle this uncertainty"). Write 5 distinct descriptive metaphors viewing this thought as an external weather pattern or ambient signal without arguing with it or obeying it.',
    sparkQuestion: 'Can you observe the storm without mistaking yourself for the rain?',
    difficulty: 'stretch',
    suggestedDurationSeconds: 210,
    constraints: [
      'Do not dispute or debate the validity of the thought',
      'Create spatial and perceptual distance between the experiencing awareness and the mental object'
    ],
    examples: [
      'This thought is a 1980s AM radio playing in an adjacent apartment: audible, crackling, but requiring zero action from me.',
      'A dark monsoon cloud drifting across the horizon: vast and dramatic, but passing through the infinite space of the sky.'
    ],
    evaluationFocus: 'Metacognitive distancing, defusion agility, and non-reactive equanimity'
  },
  {
    id: 'emotion-compassionate-counterweight',
    category: 'emotional_regulation',
    title: 'The Inner Mentor Counterweight',
    subtitle: 'Fierce Self-Compassion & Stoic Anchor',
    prompt: 'Draft 4 compassionate, grounded counter-perspectives addressing your harshest inner critic, synthesizing unshakeable stoic clarity with visceral warmth.',
    sparkQuestion: 'What would the most courageous, patient, and loving version of yourself whisper to you in the darkest hour?',
    difficulty: 'accessible',
    suggestedDurationSeconds: 150,
    constraints: [
      'Speak in the first person or direct compassionate address',
      'Acknowledge pain honestly without letting it dictate identity'
    ],
    examples: [
      'You are carrying heavy ambiguity right now, and fatigue is a natural biological response, not a moral failure. Breathe and release the imaginary verdict.',
      'No external outcome can diminish the intrinsic dignity of showing up with deliberate intent.'
    ],
    evaluationFocus: 'Affective resilience, self-directed empathy, and emotional equilibrium'
  }
];
