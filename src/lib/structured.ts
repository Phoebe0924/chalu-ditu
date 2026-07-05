import {
  OPPORTUNITY_PATHS,
  type ActionAsset,
  type EvidenceVerificationLevel,
  type FeedbackDiagnosis,
  type OpportunityAssessment,
  type OpportunityPath,
  type PathEvaluation,
} from "@/lib/types";

const VERIFICATION_LEVELS: EvidenceVerificationLevel[] = [
  "verified",
  "self_reported_consistent",
  "self_reported_isolated",
];

const VERIFICATION_LABELS: Record<EvidenceVerificationLevel, string> = {
  verified: "可独立验证",
  self_reported_consistent: "自述—内部一致",
  self_reported_isolated: "自述—孤证",
};

const VERIFICATION_STRENGTH: Record<EvidenceVerificationLevel, number> = {
  self_reported_isolated: 0,
  self_reported_consistent: 1,
  verified: 2,
};

const FORBIDDEN_OUTWARD_PHRASES = [
  "商业成功",
  "成功创业者",
  "增长专家",
  "资深产品经理",
  "AI 专家",
  "工作流专家",
  "显著降本",
];

function isOpportunityPath(value: unknown): value is OpportunityPath {
  return OPPORTUNITY_PATHS.includes(value as OpportunityPath);
}

export function validateAssessment(
  value: Partial<OpportunityAssessment>,
): Omit<OpportunityAssessment, "id" | "createdAt" | "model"> {
  const paths = value.pathEvaluations;
  if (
    !value.identityPositioning ||
    !Array.isArray(value.marketValues) ||
    !Array.isArray(value.evidenceLedger) ||
    !Array.isArray(paths) ||
    paths.length !== OPPORTUNITY_PATHS.length ||
    !Array.isArray(value.recommendedPaths) ||
    !value.targetProfile ||
    !value.entryDesign ||
    !Array.isArray(value.riskBoundaries) ||
    !Array.isArray(value.evidenceToCollectNext) ||
    typeof value.immediateNextStep !== "string"
  ) {
    throw new Error("模型返回的机会评估缺少必要字段。");
  }

  const uniquePaths = new Set(paths.map((item) => item.path));
  const uniqueRanks = new Set(paths.map((item) => item.rank));
  if (
    uniquePaths.size !== OPPORTUNITY_PATHS.length ||
    uniqueRanks.size !== OPPORTUNITY_PATHS.length ||
    paths.some(
      (item) =>
        !isOpportunityPath(item.path) ||
        !["high", "medium", "low"].includes(item.priority) ||
        item.rank < 1 ||
        item.rank > 6,
    )
  ) {
    throw new Error("六条机会路径的名称或排序无效。");
  }

  const evidenceIds = new Set(value.evidenceLedger.map((item) => item.id));
  if (
    value.evidenceLedger.length < 3 ||
    evidenceIds.size !== value.evidenceLedger.length ||
    value.evidenceLedger.some(
      (item) =>
        !VERIFICATION_LEVELS.includes(item.verificationLevel) ||
        !item.verificationBasis?.trim() ||
        !item.verificationUpgradeSuggestion?.trim(),
    ) ||
    value.marketValues.some((item) =>
      item.evidenceIds.some((id) => !evidenceIds.has(id)),
    )
  ) {
    throw new Error("价值主张未完整回溯到证据账本。");
  }

  return value as Omit<OpportunityAssessment, "id" | "createdAt" | "model">;
}

export function validateAssets(
  value: Array<Partial<ActionAsset>>,
  assessment: OpportunityAssessment,
): Array<Omit<ActionAsset, "id" | "status" | "createdAt" | "updatedAt">> {
  if (!Array.isArray(value) || value.length < 1) {
    throw new Error("模型未生成有效行动资产。");
  }

  const usableEvidence = assessment.evidenceLedger.filter(
    (item) => item.verificationLevel !== "self_reported_isolated",
  );
  const evidenceById = new Map(usableEvidence.map((item) => [item.id, item]));
  const evidenceIds = new Set(evidenceById.keys());
  return value.map((asset) => {
    if (
      !asset.type ||
      !asset.title ||
      !asset.recommendedPath ||
      !isOpportunityPath(asset.recommendedPath) ||
      !asset.audience ||
      !asset.purpose ||
      !asset.content ||
      !Array.isArray(asset.sourceEvidenceIds) ||
      asset.sourceEvidenceIds.length === 0 ||
      !Array.isArray(asset.claimChecks) ||
      asset.claimChecks.length === 0 ||
      !Array.isArray(asset.guardrails) ||
      asset.sourceEvidenceIds.some((id) => !evidenceIds.has(id))
    ) {
      throw new Error("行动资产缺少字段或引用了不存在的证据。");
    }

    const content = asset.content;
    if (FORBIDDEN_OUTWARD_PHRASES.some((phrase) => content.includes(phrase))) {
      throw new Error("行动资产正文包含高风险正向身份或成果标签。");
    }

    for (const claimCheck of asset.claimChecks) {
      if (
        !claimCheck.claim?.trim() ||
        !claimCheck.expressionBoundary?.trim() ||
        !Array.isArray(claimCheck.sourceEvidenceIds) ||
        claimCheck.sourceEvidenceIds.length === 0 ||
        !VERIFICATION_LEVELS.includes(claimCheck.verificationLevel) ||
        claimCheck.sourceEvidenceIds.some(
          (id) => !evidenceIds.has(id) || !asset.sourceEvidenceIds?.includes(id),
        )
      ) {
        throw new Error("行动资产的主张核查缺少证据、边界或引用了未声明证据。");
      }

      const weakestLevel = claimCheck.sourceEvidenceIds
        .map((id) => evidenceById.get(id)?.verificationLevel)
        .filter((level): level is EvidenceVerificationLevel => Boolean(level))
        .sort(
          (a, b) => VERIFICATION_STRENGTH[a] - VERIFICATION_STRENGTH[b],
        )[0];

      if (!weakestLevel || claimCheck.verificationLevel !== weakestLevel) {
        throw new Error("行动资产的主张验证等级未按最低证据等级保守标注。");
      }
    }

    const referencesSelfReported = asset.sourceEvidenceIds.some(
      (id) =>
        usableEvidence.find((item) => item.id === id)?.verificationLevel ===
        "self_reported_consistent",
    );
    const normalized = asset as Omit<
      ActionAsset,
      "id" | "status" | "createdAt" | "updatedAt"
    >;
    if (
      referencesSelfReported &&
      !normalized.guardrails.some((item) => item.includes("自述"))
    ) {
      normalized.guardrails = [
        ...normalized.guardrails,
        "引用了自述—内部一致信息：必须保持第一人称自陈，不得写成第三方已验证成果。",
      ];
    }
    return normalized;
  });
}

export function validateDiagnosis(
  value: Partial<FeedbackDiagnosis>,
): Omit<FeedbackDiagnosis, "id" | "actionId" | "createdAt" | "model"> {
  const layers = [
    "activation",
    "target",
    "opening",
    "evidence",
    "request",
    "collaboration",
    "delivery",
    "progress",
  ];
  if (
    !value.failureLayer ||
    !layers.includes(value.failureLayer) ||
    !value.diagnosis ||
    !Array.isArray(value.signals) ||
    !Array.isArray(value.preserve) ||
    !Array.isArray(value.change) ||
    !value.nextAction
  ) {
    throw new Error("模型返回的反馈诊断不完整。");
  }
  return value as Omit<
    FeedbackDiagnosis,
    "id" | "actionId" | "createdAt" | "model"
  >;
}

export function assessmentToMarkdown(
  assessment: OpportunityAssessment,
  assets: ActionAsset[],
) {
  const paths = [...assessment.pathEvaluations]
    .sort((a, b) => a.rank - b.rank)
    .map(
      (item: PathEvaluation) =>
        `${item.rank}. **${item.path}（建议优先级：${item.priority}）**：${item.rationale}\n   - 风险：${item.risks.join("；") || "无"}\n   - 证据缺口：${item.evidenceGaps.join("；") || "无"}\n   - 暂不优先条件：${item.whyNotNow}`,
    )
    .join("\n");

  const ledger = assessment.evidenceLedger
    .map(
      (item) =>
        `### ${item.id} · ${item.valueClaim}\n- 事实：${item.fact}\n- 证据：${item.evidence.join("；")}\n- 验证等级：${item.verificationLevel}（${VERIFICATION_LABELS[item.verificationLevel]}）\n- 验证依据：${item.verificationBasis}\n- 能证明：${item.proves}\n- 不能证明：${item.doesNotProve}\n- 待补证：${item.missingEvidence.join("；") || "无"}\n- 最快补证行动：${item.verificationUpgradeSuggestion}\n- 表达边界：${item.boundary}`,
    )
    .join("\n\n");

  const assetMarkdown = assets
    .map(
      (asset) =>
        `### ${asset.title}\n\n${asset.content}\n\n**主张核查：**\n${(asset.claimChecks ?? [])
          .map(
            (check) =>
              `- ${check.claim}｜证据：${check.sourceEvidenceIds.join("、")}｜等级：${check.verificationLevel}｜边界：${check.expressionBoundary}`,
          )
          .join("\n") || "- 尚未生成主张核查。"}\n\n> 证据引用：${asset.sourceEvidenceIds.join("、")}；使用边界：${asset.guardrails.join("；")}`,
    )
    .join("\n\n");

  return `# 非标机会工作包

## 身份定位

${assessment.identityPositioning.positioningStatement}

- 不宜被当作：${assessment.identityPositioning.notStandardCandidateFor}
- 更像：${assessment.identityPositioning.opportunityTalentType}

## 事实—价值—证据—边界账本

${ledger}

## 六条机会路径

${paths}

## 推荐路径

${assessment.recommendedPaths.map((item) => `- ${item}`).join("\n")}

## 目标对象画像

- 人：${assessment.targetProfile.people.join("；")}
- 公司：${assessment.targetProfile.companies.join("；")}
- 团队：${assessment.targetProfile.teams.join("；")}
- 暂避：${assessment.targetProfile.avoid.join("；")}

## 机会入口

- 开口角度：${assessment.entryDesign.openingAngle}
- 对方可能关心：${assessment.entryDesign.counterpartQuestions.join("；")}
- 可提供价值：${assessment.entryDesign.valueOffered.join("；")}
- 最低风险下一步：${assessment.entryDesign.lowestRiskStep}

## 风险与下一步

${assessment.riskBoundaries.map((item) => `- ${item}`).join("\n")}

**今天的行动：** ${assessment.immediateNextStep}

## 行动资产

${assetMarkdown || "尚未生成行动资产。"}
`;
}
