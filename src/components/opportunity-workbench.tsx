"use client";

import {
  AlertCircle,
  ClipboardList,
  FileCheck2,
  Gauge,
  PlayCircle,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Target,
} from "lucide-react";
import demoWorkspaceJson from "@/lib/demo-workspace.json";
import { useEffect, useState } from "react";
import { ActionAssetsPanel } from "@/components/action-assets-panel";
import { AssessmentPanel } from "@/components/assessment-panel";
import { LoopReviewPanel } from "@/components/loop-review-panel";
import { PipelinePanel } from "@/components/pipeline-panel";
import { ProfileForm } from "@/components/profile-form";
import { CopyButton, ErrorNotice } from "@/components/workspace-ui";
import {
  canUse,
  createFreeEntitlement,
  loadEntitlement,
  recordUsage,
  saveEntitlement,
  USAGE_LABELS,
  type Entitlement,
  type UsageKind,
} from "@/lib/entitlement";
import { deriveLoopStages } from "@/lib/loop";
import { REGRESSION_SAMPLES } from "@/lib/regression-samples";
import {
  createEmptyWorkspace,
  loadWorkspace,
  saveWorkspace,
  WORKSPACE_STORAGE_KEY,
} from "@/lib/storage";
import { assessmentToMarkdown } from "@/lib/structured";
import type {
  ActionPackageResponse,
  AssessResponse,
  CalibrateResponse,
  OpportunityFormData,
  WorkspaceData,
} from "@/lib/types";

type Props = {
  apiConfigured: boolean;
  paymentUrl: string;
};

const EFFECTIVE_FEEDBACK = new Set([
  "substantive_reply",
  "referral",
  "portfolio_review",
  "conversation",
  "interview",
  "trial_discussion",
  "collaboration_terms",
]);

const VIEWS = [
  { id: "input", label: "事实底稿", icon: "📋" },
  { id: "assessment", label: "路径评估", icon: "🗺️" },
  { id: "assets", label: "行动资产", icon: "📝" },
  { id: "pipeline", label: "目标与反馈", icon: "🎯" },
  { id: "review", label: "闭环复盘", icon: "🔄" },
] as const;

export function OpportunityWorkbench({ apiConfigured, paymentUrl }: Props) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(createEmptyWorkspace);
  const [entitlement, setEntitlement] = useState<Entitlement>(
    createFreeEntitlement,
  );
  const [hydrated, setHydrated] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [loading, setLoading] = useState<"assess" | "assets" | "">("");
  const [calibratingActionId, setCalibratingActionId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setWorkspace(loadWorkspace());
      setEntitlement(loadEntitlement());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => saveWorkspace(workspace), 250);
    return () => window.clearTimeout(timeout);
  }, [hydrated, workspace]);

  useEffect(() => {
    if (!hydrated) return;
    saveEntitlement(entitlement);
  }, [hydrated, entitlement]);

  const requiredReady = Boolean(
    workspace.form.profile.workExperience.trim() &&
      workspace.form.profile.projectsAndEvidence.trim() &&
      workspace.form.profile.desiredDirection.trim() &&
      workspace.form.scenario.types.length,
  );
  const sentCount = workspace.actions.filter((action) =>
    ["sent", "replied", "conversation", "trial", "closed"].includes(action.status),
  ).length;
  const progressCount = workspace.actions.filter((action) =>
    EFFECTIVE_FEEDBACK.has(action.feedbackType),
  ).length;
  const markdown = workspace.assessment
    ? assessmentToMarkdown(workspace.assessment, workspace.assets)
    : "";
  const packageMinutes =
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

  function patchWorkspace(patch: Partial<WorkspaceData>) {
    setWorkspace((current) => ({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }

  function setForm(form: OpportunityFormData) {
    patchWorkspace({
      form,
      assessment: null,
      assets: [],
    });
  }

  function selectSample(sampleId: string) {
    setSelectedSampleId(sampleId);
    const sample = REGRESSION_SAMPLES.find((item) => item.id === sampleId);
    if (sample) {
      patchWorkspace({
        form: structuredClone(sample.form),
        assessment: null,
        assets: [],
        activeView: "input",
      });
    }
  }

  function ensureQuota(kind: UsageKind): boolean {
    if (canUse(entitlement, kind)) return true;
    setError(
      `本机「${USAGE_LABELS[kind]}」的免费额度已用完。去「闭环复盘」页查看用量，解锁 Pro 后可继续。`,
    );
    return false;
  }

  async function activateLicense(key: string) {
    const response = await fetch("/api/license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const payload = (await response.json()) as {
      plan?: "pro";
      error?: string;
    };
    if (!response.ok || payload.plan !== "pro") {
      throw new Error(payload.error || "解锁失败，请重试。");
    }
    setEntitlement((current) => ({
      ...current,
      plan: "pro",
      licenseKey: key,
      unlockedAt: new Date().toISOString(),
    }));
  }

  async function assess() {
    if (!requiredReady || loading) return;
    if (!ensureQuota("assess")) return;
    setLoading("assess");
    setError("");
    try {
      const response = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workspace.form),
      });
      const payload = (await response.json()) as AssessResponse & {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "评估失败。");
      setEntitlement((current) => recordUsage(current, "assess"));
      patchWorkspace({
        assessment: payload.assessment,
        assets: [],
        activeView: "assessment",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "评估失败。");
    } finally {
      setLoading("");
    }
  }

  async function generateAssets() {
    if (!workspace.assessment || loading) return;
    if (!ensureQuota("actionPackage")) return;
    setLoading("assets");
    setError("");
    try {
      const response = await fetch("/api/action-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: workspace.form,
          assessment: workspace.assessment,
        }),
      });
      const payload = (await response.json()) as ActionPackageResponse & {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "行动包生成失败。");
      setEntitlement((current) => recordUsage(current, "actionPackage"));
      patchWorkspace({ assets: payload.assets, activeView: "assets" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "行动包生成失败。");
    } finally {
      setLoading("");
    }
  }

  async function calibrate(actionId: string) {
    if (!workspace.assessment) return;
    const action = workspace.actions.find((item) => item.id === actionId);
    const target = workspace.targets.find((item) => item.id === action?.targetId);
    const asset = workspace.assets.find((item) => item.id === action?.assetId);
    if (!action || !target) return;
    if (!ensureQuota("calibrate")) return;

    setCalibratingActionId(actionId);
    setError("");
    try {
      const response = await fetch("/api/calibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: workspace.assessment,
          target,
          action,
          asset,
        }),
      });
      const payload = (await response.json()) as CalibrateResponse & {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "反馈校准失败。");
      setEntitlement((current) => recordUsage(current, "calibrate"));
      patchWorkspace({
        diagnoses: [...workspace.diagnoses, payload.diagnosis],
        actions: workspace.actions.map((item) =>
          item.id === actionId
            ? { ...item, nextStep: payload.diagnosis.nextAction }
            : item,
        ),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "反馈校准失败。");
    } finally {
      setCalibratingActionId("");
    }
  }

  function reset() {
    if (!window.confirm("清空本机保存的档案、评估、目标和行动记录？")) return;
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    setWorkspace(createEmptyWorkspace());
    setSelectedSampleId("");
    setError("");
  }

  function loadDemoWorkspace() {
    if (
      !window.confirm(
        "载入演示闭环？这是一次真实生成的完整闭环记录（目标对象与反馈为虚构示例，用于演示），会覆盖当前工作区。",
      )
    ) {
      return;
    }
    setWorkspace(
      structuredClone(demoWorkspaceJson) as unknown as WorkspaceData,
    );
    setSelectedSampleId("");
    setError("");
  }

  const activeViewLabel = VIEWS.find((v) => v.id === workspace.activeView)?.label ?? "";

  return (
    <div className="workspace-shell--with-sidebar">
      {/* ═══ Sidebar ═══ */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">岔路地图</div>
          <div className="sidebar-brand-sub">非标履历 · 机会推进</div>
        </div>

        <div className="sidebar-section">工作台</div>

        {VIEWS.map((view) => {
          const selected = workspace.activeView === view.id;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => patchWorkspace({ activeView: view.id })}
              className={`sidebar-item ${selected ? "sidebar-item--active" : ""}`}
            >
              <span className="sidebar-item-icon">{view.icon}</span>
              {view.label}
            </button>
          );
        })}

        <div className="sidebar-section">资源</div>

        <button
          type="button"
          onClick={loadDemoWorkspace}
          className="sidebar-item"
          style={{ fontSize: 12, color: "var(--ink-muted)" }}
        >
          <span className="sidebar-item-icon">📚</span>
          演示闭环
        </button>

        <div className="sidebar-spacer" />

        <div className="sidebar-footer">
          <button
            type="button"
            onClick={reset}
            className="sidebar-item"
            style={{ fontSize: 12, color: "var(--ink-muted)" }}
          >
            <span className="sidebar-item-icon">🗑️</span>
            清空工作区
          </button>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <main style={{ padding: "32px 48px", maxWidth: 960, minWidth: 0 }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span className="page-icon-emoji">
            {VIEWS.find((v) => v.id === workspace.activeView)?.icon ?? "📄"}
          </span>
          <h1 className="page-title">{activeViewLabel}</h1>
        </div>
        <p className="page-subtitle" style={{ marginLeft: 48, marginBottom: 24 }}>
          {hydrated
            ? `事实底稿路径 · 最后更新于 ${new Date(workspace.updatedAt).toLocaleDateString("zh-CN")}`
            : "正在读取本地工作区"}
        </p>

        <hr className="divider" />

        {/* Stage Stepper */}
        <div className="stage-bar">
          {deriveLoopStages(workspace).map((stage, index, all) => (
            <div key={stage.id} style={{ display: "flex", alignItems: "center", gap: 1 }}>
              <button
                type="button"
                onClick={() => patchWorkspace({ activeView: stage.view })}
                title={stage.detail}
                className={`stage-item ${stage.done ? "stage-item--done" : ""}`}
              >
                <span className="stage-item-circle">
                  {stage.done ? "✓" : index + 1}
                </span>
                {stage.label}
              </button>
              {index < all.length - 1 && <span className="stage-connector" />}
            </div>
          ))}
        </div>

        {/* Sprint Metrics */}
        <div className="sprint-grid">
          <div className="sprint-card">
            <div className="sprint-card-label">研究目标</div>
            <div className="sprint-card-value">
              {workspace.targets.length}<span style={{ fontSize: 16, color: "var(--ink-muted)", marginLeft: 4 }}>/ 10</span>
            </div>
            <div className="sprint-card-bar">
              <div className="sprint-card-bar-fill" style={{ width: `${Math.min(100, Math.round((workspace.targets.length / 10) * 100))}%` }} />
            </div>
          </div>
          <div className="sprint-card">
            <div className="sprint-card-label">真实发送</div>
            <div className="sprint-card-value">
              {sentCount}<span style={{ fontSize: 16, color: "var(--ink-muted)", marginLeft: 4 }}>/ 6</span>
            </div>
            <div className="sprint-card-bar">
              <div className="sprint-card-bar-fill" style={{ width: `${Math.min(100, Math.round((sentCount / 6) * 100))}%` }} />
            </div>
          </div>
          <div className="sprint-card">
            <div className="sprint-card-label">有效进展</div>
            <div className="sprint-card-value">
              {progressCount}<span style={{ fontSize: 16, color: "var(--ink-muted)", marginLeft: 4 }}>/ 2</span>
            </div>
            <div className="sprint-card-bar">
              <div className="sprint-card-bar-fill" style={{ width: `${Math.min(100, Math.round((progressCount / 2) * 100))}%` }} />
            </div>
          </div>
        </div>

        {/* API Key Warning */}
        {!apiConfigured && (
          <div
            style={{
              display: "flex",
              gap: 12,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--clay-light)",
              background: "var(--clay-light)",
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 12,
              lineHeight: 1.5,
              color: "var(--clay-dark)",
            }}
          >
            <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600 }}>尚未配置 API Key</p>
              <p style={{ marginTop: 4, opacity: 0.85 }}>
                可继续编辑本地记录；AI 评估与校准前，请在 .env.local 中配置 LLM_API_KEY。
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        <ErrorNotice message={error} />

        {/* Content Area */}
        <div style={error ? { marginTop: 16 } : {}}>
          {workspace.activeView === "input" && (
            <ProfileForm
              form={workspace.form}
              samples={REGRESSION_SAMPLES}
              selectedSampleId={selectedSampleId}
              loading={loading === "assess"}
              ready={requiredReady}
              onChange={setForm}
              onSelectSample={selectSample}
              onAssess={assess}
            />
          )}
          {workspace.activeView === "assessment" && (
            <AssessmentPanel
              assessment={workspace.assessment}
              loadingAssets={loading === "assets"}
              onGenerateAssets={generateAssets}
            />
          )}
          {workspace.activeView === "assets" && (
            <ActionAssetsPanel
              assessment={workspace.assessment}
              assets={workspace.assets}
              onChange={(assets) => patchWorkspace({ assets })}
            />
          )}
          {workspace.activeView === "review" && (
            <LoopReviewPanel
              workspace={workspace}
              entitlement={entitlement}
              paymentUrl={paymentUrl}
              onNavigate={(view) => patchWorkspace({ activeView: view })}
              onActivateLicense={activateLicense}
            />
          )}
          {workspace.activeView === "pipeline" && (
            <PipelinePanel
              assets={workspace.assets}
              targets={workspace.targets}
              actions={workspace.actions}
              diagnoses={workspace.diagnoses}
              calibratingActionId={calibratingActionId}
              onTargetsChange={(targets) => patchWorkspace({ targets })}
              onActionsChange={(actions) => patchWorkspace({ actions })}
              onCalibrate={calibrate}
            />
          )}
        </div>

        {/* Footer */}
        <hr className="divider" style={{ marginTop: 32 }} />
        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0 48px",
            fontSize: 11,
            color: "var(--ink-muted)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={12} />
            本地 v3 · 不自动发送 · 每项价值可回溯
          </span>
          <span>
            {hydrated ? "已启用本地自动保存" : "正在读取本地工作区"}
          </span>
          {packageMinutes !== null && (
            <span>输入到行动包：约 {packageMinutes} 分钟</span>
          )}
        </footer>
      </main>
    </div>
  );
}
