const DEFAULT_PERSONAS = {
  "explainer-director": {
    schemaVersion: 1,
    id: "explainer-director",
    name: "Explainer Director",
    description:
      "Prioritizes story clarity, compact pacing, and information density. Ideal for educational and knowledge-sharing content.",
    ruleOfSix: {
      emotion: 0.40,
      story: 0.30,
      rhythm: 0.15,
      eyeTrace: 0.07,
      twoD: 0.05,
      threeD: 0.03
    },
    domains: [
      { id: "segment_selection.kdna", weight: 0.40 },
      { id: "narrative_structure.kdna", weight: 0.30 },
      { id: "emotional_arc.kdna", weight: 0.15 },
      { id: "pacing_rhythm.kdna", weight: 0.10 },
      { id: "risk_and_integrity.kdna", weight: 0.05 }
    ],
    preferences: {
      preserveNaturalPauses: false,
      preferConcreteExamples: true,
      maxJumpCutGapSec: 0.3,
      minBreathingSpaceSec: 1.0
    }
  },
  "documentary-director": {
    schemaVersion: 1,
    id: "documentary-director",
    name: "Documentary Director",
    description:
      "Prioritizes emotional authenticity, natural pauses, and slower rhythm. Ideal for interviews, documentaries, and human stories.",
    ruleOfSix: {
      emotion: 0.55,
      story: 0.20,
      rhythm: 0.10,
      eyeTrace: 0.07,
      twoD: 0.05,
      threeD: 0.03
    },
    domains: [
      { id: "segment_selection.kdna", weight: 0.35 },
      { id: "narrative_structure.kdna", weight: 0.25 },
      { id: "emotional_arc.kdna", weight: 0.20 },
      { id: "pacing_rhythm.kdna", weight: 0.15 },
      { id: "risk_and_integrity.kdna", weight: 0.05 }
    ],
    preferences: {
      preserveNaturalPauses: true,
      preferConcreteExamples: true,
      maxJumpCutGapSec: 0.5,
      minBreathingSpaceSec: 2.0
    }
  },
  "vlog-director": {
    schemaVersion: 1,
    id: "vlog-director",
    name: "Vlog Director",
    description:
      "Prioritizes rhythm, fast cuts, and high energy. Ideal for vlogs, shorts, and high-pace social content.",
    ruleOfSix: {
      emotion: 0.30,
      story: 0.20,
      rhythm: 0.25,
      eyeTrace: 0.10,
      twoD: 0.10,
      threeD: 0.05
    },
    domains: [
      { id: "segment_selection.kdna", weight: 0.35 },
      { id: "pacing_rhythm.kdna", weight: 0.25 },
      { id: "narrative_structure.kdna", weight: 0.20 },
      { id: "emotional_arc.kdna", weight: 0.10 },
      { id: "risk_and_integrity.kdna", weight: 0.05 }
    ],
    preferences: {
      preserveNaturalPauses: false,
      preferConcreteExamples: false,
      maxJumpCutGapSec: 0.2,
      minBreathingSpaceSec: 0.5
    }
  }
};

module.exports = { DEFAULT_PERSONAS };
