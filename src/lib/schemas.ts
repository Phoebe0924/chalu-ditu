import {
  OPPORTUNITY_PATHS,
  type ActionAssetType,
} from "@/lib/types";

const stringSchema = { type: "string" } as const;
const stringArraySchema = {
  type: "array",
  items: stringSchema,
} as const;

const closedObject = (
  properties: Record<string, unknown>,
  required: string[] = Object.keys(properties),
) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

const opportunityPathSchema = {
  type: "string",
  enum: OPPORTUNITY_PATHS,
} as const;

const verificationLevelSchema = {
  type: "string",
  enum: [
    "verified",
    "self_reported_consistent",
    "self_reported_isolated",
  ],
} as const;

export const assessmentSchema = closedObject({
  identityPositioning: closedObject({
    notStandardCandidateFor: stringSchema,
    opportunityTalentType: stringSchema,
    positioningStatement: stringSchema,
  }),
  marketValues: {
    type: "array",
    items: closedObject({
      value: stringSchema,
      reasonToEngage: stringSchema,
      evidenceIds: stringArraySchema,
    }),
  },
  evidenceLedger: {
    type: "array",
    items: closedObject({
      id: stringSchema,
      fact: stringSchema,
      valueClaim: stringSchema,
      evidence: stringArraySchema,
      verificationLevel: verificationLevelSchema,
      verificationBasis: stringSchema,
      verificationUpgradeSuggestion: stringSchema,
      proves: stringSchema,
      doesNotProve: stringSchema,
      missingEvidence: stringArraySchema,
      boundary: stringSchema,
    }),
  },
  pathEvaluations: {
    type: "array",
    items: closedObject({
      path: opportunityPathSchema,
      rank: { type: "integer", minimum: 1, maximum: 6 },
      priority: { type: "string", enum: ["high", "medium", "low"] },
      fitSignals: stringArraySchema,
      risks: stringArraySchema,
      evidenceGaps: stringArraySchema,
      rationale: stringSchema,
      whyNotNow: stringSchema,
    }),
  },
  recommendedPaths: {
    type: "array",
    items: opportunityPathSchema,
  },
  targetProfile: closedObject({
    people: stringArraySchema,
    companies: stringArraySchema,
    teams: stringArraySchema,
    avoid: stringArraySchema,
  }),
  entryDesign: closedObject({
    openingAngle: stringSchema,
    counterpartQuestions: stringArraySchema,
    valueOffered: stringArraySchema,
    lowestRiskStep: stringSchema,
  }),
  riskBoundaries: stringArraySchema,
  evidenceToCollectNext: stringArraySchema,
  immediateNextStep: stringSchema,
});

const ASSET_TYPES: ActionAssetType[] = [
  "founder_message",
  "weak_tie_message",
  "pilot_proposal",
  "portfolio_structure",
  "job_match",
  "trial_design",
  "conversation_guide",
  "interview_prep",
];

export const actionPackageSchema = closedObject({
  assets: {
    type: "array",
    items: closedObject({
      type: { type: "string", enum: ASSET_TYPES },
      title: stringSchema,
      recommendedPath: opportunityPathSchema,
      audience: stringSchema,
      purpose: stringSchema,
      content: stringSchema,
      sourceEvidenceIds: stringArraySchema,
      claimChecks: {
        type: "array",
        items: closedObject({
          claim: stringSchema,
          sourceEvidenceIds: stringArraySchema,
          verificationLevel: verificationLevelSchema,
          expressionBoundary: stringSchema,
        }),
      },
      guardrails: stringArraySchema,
    }),
  },
});

const failureLayers = [
  "activation",
  "target",
  "opening",
  "evidence",
  "request",
  "collaboration",
  "delivery",
  "progress",
] as const;

export const feedbackDiagnosisSchema = closedObject({
  failureLayer: { type: "string", enum: failureLayers },
  diagnosis: stringSchema,
  signals: stringArraySchema,
  preserve: stringArraySchema,
  change: stringArraySchema,
  nextAction: stringSchema,
  revisedAsset: {
    anyOf: [
      closedObject({
        title: stringSchema,
        content: stringSchema,
      }),
      { type: "null" },
    ],
  },
});
