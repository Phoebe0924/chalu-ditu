export const SCENARIO_OPTIONS = [
  "我有一个具体 JD",
  "我有心仪公司",
  "我有一个想联系的老板/创始人",
  "我有一个弱关系对象",
  "我有一个想服务的人群",
  "我有一个作品/项目想展示",
  "我想先探索方向",
] as const;

export const OPPORTUNITY_PATHS = [
  "标准岗位路径",
  "提案式求职路径",
  "作品集吸引路径",
  "弱关系引荐路径",
  "试单/项目路径",
  "创始人约聊路径",
] as const;

export const TARGET_STATUSES = [
  "research",
  "ready",
  "contacted",
  "responded",
  "conversation",
  "trial",
  "closed",
] as const;

export const ACTION_STATUSES = [
  "draft",
  "ready",
  "sent",
  "replied",
  "conversation",
  "trial",
  "closed",
] as const;

export const FEEDBACK_TYPES = [
  "none",
  "substantive_reply",
  "referral",
  "portfolio_review",
  "conversation",
  "interview",
  "trial_discussion",
  "collaboration_terms",
  "polite_rejection",
  "no_response",
] as const;

export type ScenarioOption = (typeof SCENARIO_OPTIONS)[number];
export type OpportunityPath = (typeof OPPORTUNITY_PATHS)[number];
export type TargetStatus = (typeof TARGET_STATUSES)[number];
export type ActionStatus = (typeof ACTION_STATUSES)[number];
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type Priority = "high" | "medium" | "low";
export type EvidenceVerificationLevel =
  | "verified"
  | "self_reported_consistent"
  | "self_reported_isolated";
export type ActionAssetType =
  | "founder_message"
  | "weak_tie_message"
  | "pilot_proposal"
  | "portfolio_structure"
  | "job_match"
  | "trial_design"
  | "conversation_guide"
  | "interview_prep";

export type ActionAssetClaimCheck = {
  claim: string;
  sourceEvidenceIds: string[];
  verificationLevel: EvidenceVerificationLevel;
  expressionBoundary: string;
};

export type CandidateProfile = {
  workExperience: string;
  nonstandardTransitions: string;
  realWorkDuringTransition: string;
  projectsAndEvidence: string;
  desiredDirection: string;
  fearedMisunderstandings: string;
  constraints: string;
  packagingBoundaries: string;
};

export type OpportunityScenario = {
  types: ScenarioOption[];
  targetCompanyOrPerson: string;
  targetRoleOrJd: string;
  counterpartProblems: string;
  proposedCollaboration: string;
  existingWork: string;
};

export type OpportunityFormData = {
  profile: CandidateProfile;
  scenario: OpportunityScenario;
};

export type EvidenceLedgerItem = {
  id: string;
  fact: string;
  valueClaim: string;
  evidence: string[];
  verificationLevel: EvidenceVerificationLevel;
  verificationBasis: string;
  verificationUpgradeSuggestion: string;
  proves: string;
  doesNotProve: string;
  missingEvidence: string[];
  boundary: string;
};

export type PathEvaluation = {
  path: OpportunityPath;
  rank: number;
  priority: Priority;
  fitSignals: string[];
  risks: string[];
  evidenceGaps: string[];
  rationale: string;
  whyNotNow: string;
};

export type TargetProfile = {
  people: string[];
  companies: string[];
  teams: string[];
  avoid: string[];
};

export type EntryDesign = {
  openingAngle: string;
  counterpartQuestions: string[];
  valueOffered: string[];
  lowestRiskStep: string;
};

export type OpportunityAssessment = {
  id: string;
  createdAt: string;
  model: string;
  identityPositioning: {
    notStandardCandidateFor: string;
    opportunityTalentType: string;
    positioningStatement: string;
  };
  marketValues: Array<{
    value: string;
    reasonToEngage: string;
    evidenceIds: string[];
  }>;
  evidenceLedger: EvidenceLedgerItem[];
  pathEvaluations: PathEvaluation[];
  recommendedPaths: OpportunityPath[];
  targetProfile: TargetProfile;
  entryDesign: EntryDesign;
  riskBoundaries: string[];
  evidenceToCollectNext: string[];
  immediateNextStep: string;
};

export type ActionAsset = {
  id: string;
  type: ActionAssetType;
  title: string;
  recommendedPath: OpportunityPath;
  audience: string;
  purpose: string;
  content: string;
  sourceEvidenceIds: string[];
  claimChecks: ActionAssetClaimCheck[];
  guardrails: string[];
  status: "draft" | "approved";
  createdAt: string;
  updatedAt: string;
};

export type TargetRecord = {
  id: string;
  name: string;
  company: string;
  role: string;
  channel: string;
  relationship: "none" | "weak" | "warm";
  problemHypothesis: string;
  contactReason: string;
  researchEvidence: string;
  selectedAssetId: string;
  status: TargetStatus;
  createdAt: string;
  updatedAt: string;
};

export type ActionRecord = {
  id: string;
  targetId: string;
  assetId: string;
  assetTitle: string;
  contentSnapshot: string;
  channel: string;
  status: ActionStatus;
  sentAt: string;
  followUpAt: string;
  followUpCount: number;
  followUpNewInformation: string;
  feedbackType: FeedbackType;
  feedbackText: string;
  nextStep: string;
  reflection: string;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackDiagnosis = {
  id: string;
  actionId: string;
  createdAt: string;
  model: string;
  failureLayer:
    | "activation"
    | "target"
    | "opening"
    | "evidence"
    | "request"
    | "collaboration"
    | "delivery"
    | "progress";
  diagnosis: string;
  signals: string[];
  preserve: string[];
  change: string[];
  nextAction: string;
  revisedAsset?: {
    title: string;
    content: string;
  } | null;
};

export type WorkspaceData = {
  version: 3;
  startedAt: string;
  form: OpportunityFormData;
  assessment: OpportunityAssessment | null;
  assets: ActionAsset[];
  targets: TargetRecord[];
  actions: ActionRecord[];
  diagnoses: FeedbackDiagnosis[];
  activeView: "input" | "assessment" | "assets" | "pipeline" | "review";
  updatedAt: string;
};

export type AssessResponse = {
  assessment: OpportunityAssessment;
};

export type ActionPackageResponse = {
  assets: ActionAsset[];
  model: string;
};

export type CalibrateResponse = {
  diagnosis: FeedbackDiagnosis;
};

export const EMPTY_FORM: OpportunityFormData = {
  profile: {
    workExperience: "",
    nonstandardTransitions: "",
    realWorkDuringTransition: "",
    projectsAndEvidence: "",
    desiredDirection: "",
    fearedMisunderstandings: "",
    constraints: "",
    packagingBoundaries: "",
  },
  scenario: {
    types: [],
    targetCompanyOrPerson: "",
    targetRoleOrJd: "",
    counterpartProblems: "",
    proposedCollaboration: "",
    existingWork: "",
  },
};
