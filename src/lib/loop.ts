import type { ActionRecord, WorkspaceData } from "@/lib/types";

export const SENT_STATUSES = new Set<ActionRecord["status"]>([
  "sent",
  "replied",
  "conversation",
  "trial",
  "closed",
]);

export type LoopStageId =
  | "facts"
  | "paths"
  | "assets"
  | "target"
  | "action"
  | "feedback"
  | "calibration";

export type LoopStage = {
  id: LoopStageId;
  label: string;
  view: WorkspaceData["activeView"];
  done: boolean;
  detail: string;
};

export function isFormReady(workspace: WorkspaceData): boolean {
  return Boolean(
    workspace.form.profile.workExperience.trim() &&
      workspace.form.profile.projectsAndEvidence.trim() &&
      workspace.form.profile.desiredDirection.trim() &&
      workspace.form.scenario.types.length,
  );
}

export function deriveLoopStages(workspace: WorkspaceData): LoopStage[] {
  const approvedAssets = workspace.assets.filter(
    (asset) => asset.status === "approved",
  );
  const sentActions = workspace.actions.filter((action) =>
    SENT_STATUSES.has(action.status),
  );
  const feedbackActions = workspace.actions.filter(
    (action) => action.feedbackType !== "none" || action.feedbackText.trim(),
  );

  return [
    {
      id: "facts",
      label: "输入事实",
      view: "input",
      done: isFormReady(workspace),
      detail: isFormReady(workspace)
        ? "必填事实已完成"
        : "补齐经历、证据、方向和场景",
    },
    {
      id: "paths",
      label: "判断路径",
      view: "assessment",
      done: Boolean(workspace.assessment),
      detail: workspace.assessment
        ? `推荐路径：${workspace.assessment.recommendedPaths[0] ?? "—"}`
        : "生成结构化路径评估",
    },
    {
      id: "assets",
      label: "行动资产",
      view: "assets",
      done: approvedAssets.length > 0,
      detail:
        approvedAssets.length > 0
          ? `已人工确认 ${approvedAssets.length} 份`
          : workspace.assets.length > 0
            ? "生成了草稿，等待人工确认"
            : "根据评估生成行动包",
    },
    {
      id: "target",
      label: "目标对象",
      view: "pipeline",
      done: workspace.targets.length > 0,
      detail:
        workspace.targets.length > 0
          ? `目标池 ${workspace.targets.length} 人`
          : "加入第一个真实对象",
    },
    {
      id: "action",
      label: "完成行动",
      view: "pipeline",
      done: sentActions.length > 0,
      detail:
        sentActions.length > 0
          ? `真实发送 ${sentActions.length} 次`
          : "复制材料，真实发出，标记已发送",
    },
    {
      id: "feedback",
      label: "记录反馈",
      view: "pipeline",
      done: feedbackActions.length > 0,
      detail:
        feedbackActions.length > 0
          ? `记录反馈 ${feedbackActions.length} 条`
          : "记录对方真实回复（包括没有回复）",
    },
    {
      id: "calibration",
      label: "校准下一步",
      view: "review",
      done: workspace.diagnoses.length > 0,
      detail:
        workspace.diagnoses.length > 0
          ? `完成校准 ${workspace.diagnoses.length} 次`
          : "根据真实反馈定位失败层级",
    },
  ];
}

export type LoopReceipt = {
  loopClosed: boolean;
  evidenceTotal: number;
  evidenceVerified: number;
  evidenceConsistent: number;
  evidenceIsolated: number;
  assetsTotal: number;
  assetsApproved: number;
  claimChecksTotal: number;
  minutesToActionPackage: number | null;
  targetsTotal: number;
  sentTotal: number;
  feedbackTotal: number;
  diagnosesTotal: number;
  latestDiagnosisLayer: string;
  latestNextAction: string;
};

export function deriveLoopReceipt(workspace: WorkspaceData): LoopReceipt {
  const ledger = workspace.assessment?.evidenceLedger ?? [];
  const stages = deriveLoopStages(workspace);
  const latestDiagnosis =
    workspace.diagnoses[workspace.diagnoses.length - 1] ?? null;
  const minutesToActionPackage =
    workspace.assets.length > 0
      ? Math.max(
          0,
          Math.round(
            (new Date(workspace.assets[0].createdAt).getTime() -
              new Date(workspace.startedAt).getTime()) /
              60_000,
          ),
        )
      : null;

  return {
    loopClosed: stages.every((stage) => stage.done),
    evidenceTotal: ledger.length,
    evidenceVerified: ledger.filter(
      (item) => item.verificationLevel === "verified",
    ).length,
    evidenceConsistent: ledger.filter(
      (item) => item.verificationLevel === "self_reported_consistent",
    ).length,
    evidenceIsolated: ledger.filter(
      (item) => item.verificationLevel === "self_reported_isolated",
    ).length,
    assetsTotal: workspace.assets.length,
    assetsApproved: workspace.assets.filter(
      (asset) => asset.status === "approved",
    ).length,
    claimChecksTotal: workspace.assets.reduce(
      (sum, asset) => sum + (asset.claimChecks?.length ?? 0),
      0,
    ),
    minutesToActionPackage,
    targetsTotal: workspace.targets.length,
    sentTotal: workspace.actions.filter((action) =>
      SENT_STATUSES.has(action.status),
    ).length,
    feedbackTotal: workspace.actions.filter(
      (action) => action.feedbackType !== "none" || action.feedbackText.trim(),
    ).length,
    diagnosesTotal: workspace.diagnoses.length,
    latestDiagnosisLayer: latestDiagnosis?.failureLayer ?? "",
    latestNextAction: latestDiagnosis?.nextAction ?? "",
  };
}
