const DEFAULT_SEGMENT_SELECTION = {
  schemaVersion: 1,
  id: "segment_selection.kdna",
  axioms: [
    {
      id: "transcript-bonus",
      dimensions: ["story"],
      condition: { path: "signals.fromTranscript", op: "eq", value: true },
      effect: { value: 8 }
    },
    {
      id: "text-length-bonus",
      dimensions: ["story"],
      condition: { path: "text.length", op: "gt", value: 40 },
      effect: { value: 5 }
    },
    {
      id: "primary-dialogue-bonus",
      dimensions: ["story"],
      condition: { path: "signals.sourceRole", op: "eq", value: "primary-dialogue" },
      effect: { value: 5 }
    },
    {
      id: "role-bonus",
      dimensions: ["story"],
      condition: { path: "candidateRoles.length", op: "gt", value: 0 },
      effect: { value: 5 }
    },
    {
      id: "good-duration-bonus",
      dimensions: ["rhythm"],
      condition: { path: "duration", op: "between", min: 5, max: 45 },
      effect: { value: 5 }
    },
    {
      id: "high-density-bonus",
      dimensions: ["story", "rhythm"],
      condition: { path: "profile.informationDensity", op: "gt", value: 0.3 },
      effect: { value: 12 }
    },
    {
      id: "low-density-penalty",
      dimensions: ["story", "rhythm"],
      condition: { path: "profile.informationDensity", op: "lt", value: 0.15 },
      effect: { value: -10 }
    },
    {
      id: "strong-hook-confidence",
      dimensions: ["story", "emotion"],
      condition: { path: "profile.narrativeRoleConfidence.hook", op: "gte", value: 0.5 },
      effect: { value: 10 }
    },
    {
      id: "strong-problem-confidence",
      dimensions: ["story", "emotion"],
      condition: { path: "profile.narrativeRoleConfidence.problem", op: "gte", value: 0.5 },
      effect: { value: 10 }
    },
    {
      id: "strong-mechanism-confidence",
      dimensions: ["story"],
      condition: { path: "profile.narrativeRoleConfidence.mechanism", op: "gte", value: 0.5 },
      effect: { value: 10 }
    },
    {
      id: "strong-example-confidence",
      dimensions: ["story", "emotion"],
      condition: { path: "profile.narrativeRoleConfidence.example", op: "gte", value: 0.5 },
      effect: { value: 10 }
    },
    {
      id: "strong-close-confidence",
      dimensions: ["story", "emotion"],
      condition: { path: "profile.narrativeRoleConfidence.close", op: "gte", value: 0.5 },
      effect: { value: 10 }
    },
    {
      id: "sentiment-urgent",
      dimensions: ["emotion"],
      condition: { path: "profile.sentiment", op: "eq", value: "urgent_negative" },
      effect: { value: 8 }
    },
    {
      id: "sentiment-positive",
      dimensions: ["emotion"],
      condition: { path: "profile.sentiment", op: "eq", value: "positive" },
      effect: { value: 5 }
    },
    {
      id: "topic-relevance",
      dimensions: ["story"],
      condition: { path: "topicRelevance", op: "gt", value: 0 },
      effect: { value: 8, multiplyBy: "topicRelevance" }
    },
    {
      id: "risk-penalty",
      dimensions: ["story"],
      condition: { path: "riskFlags.length", op: "gt", value: 0 },
      effect: { value: -12, multiplyBy: "riskFlags.length" }
    },
    {
      id: "short-duration-penalty",
      dimensions: ["rhythm"],
      condition: { path: "duration", op: "lt", value: 3 },
      effect: { value: -15 }
    },
    {
      id: "position-bias",
      dimensions: ["story"],
      condition: { path: "index", op: "gte", value: 0 },
      effect: { value: 0, multiplyBy: "index", cap: 0 }
    }
  ],
  thresholds: {
    minScore: 40,
    minDuration: 3,
    idealDurationMin: 5,
    idealDurationMax: 45
  }
};

const DEFAULT_NARRATIVE_STRUCTURE = {
  schemaVersion: 1,
  id: "narrative_structure.kdna",
  roles: ["hook", "problem", "mechanism", "example", "close"],
  roleTargetDurations: {
    hook: 12,
    problem: 24,
    mechanism: 36,
    example: 18,
    close: 10
  },
  maxPerRole: 2
};

const DEFAULT_EMOTIONAL_ARC = {
  schemaVersion: 1,
  id: "emotional_arc.kdna",
  validPatterns: [
    {
      name: "inspirational-arc",
      description: "Builds from neutral to concern, then resolves to hope",
      sequence: ["neutral", "concerned", "hopeful"],
      strength: "strong"
    },
    {
      name: "urgency-to-action",
      description: "Establishes urgency then channels it into positive action",
      sequence: ["neutral", "urgent_negative", "positive"],
      strength: "strong"
    }
  ],
  dangerPatterns: [
    {
      name: "emotional-monotony",
      condition: "all_same",
      severity: "warning",
      message:
        "All clips share the same sentiment; the emotional arc is flat. Consider varying tone to maintain engagement."
    },
    {
      name: "dangerous-jump",
      condition: "adjacent_shift",
      from: "urgent_negative",
      to: "positive",
      severity: "warning",
      message:
        "Abrupt emotional shift from urgent negative to positive without a transition. This can feel jarring to the audience."
    },
    {
      name: "descent-without-resolution",
      condition: "adjacent_shift",
      from: "positive",
      to: "urgent_negative",
      severity: "suggestion",
      message:
        "Emotional descent from positive to urgent negative may work as a plot twist, but verify it is intentional."
    }
  ]
};

const DEFAULT_PACING_RHYTHM = {
  schemaVersion: 1,
  id: "pacing_rhythm.kdna",
  thresholds: {
    highDensity: 0.4,
    lowDensity: 0.15,
    minBreathingSpaceSec: 2.0,
    maxHighDensityCluster: 2
  },
  patterns: [
    {
      name: "density-cluster",
      condition: "consecutive_high_density",
      minCount: 2,
      severity: "warning",
      message:
        "Consecutive high-information-density segments without breathing space. Audience may experience cognitive overload."
    },
    {
      name: "missing-breathing-space",
      condition: "no_variation_between",
      severity: "suggestion",
      message:
        "Consider inserting a pause, a visual break, or a lower-density segment to give the audience time to digest."
    }
  ]
};

const STORYCUT_DEFAULTS = {
  "segment_selection.kdna": DEFAULT_SEGMENT_SELECTION,
  "narrative_structure.kdna": DEFAULT_NARRATIVE_STRUCTURE,
  "emotional_arc.kdna": DEFAULT_EMOTIONAL_ARC,
  "pacing_rhythm.kdna": DEFAULT_PACING_RHYTHM
};

module.exports = {
  DEFAULT_SEGMENT_SELECTION,
  DEFAULT_NARRATIVE_STRUCTURE,
  DEFAULT_EMOTIONAL_ARC,
  DEFAULT_PACING_RHYTHM,
  STORYCUT_DEFAULTS
};
