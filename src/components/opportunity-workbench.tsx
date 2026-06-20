"use client";

import {
  AlertCircle,
  ClipboardList,
  FileCheck2,
  Gauge,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ActionAssetsPanel } from "@/components/action-assets-panel";
import { AssessmentPanel } from "@/components/assessment-panel";
import { PipelinePanel } from "@/components/pipeline-panel";
import { ProfileForm } from "@/components/profile-form";
import { CopyButton, ErrorNotice } from "@/components/workspace-ui";
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
  { id: "input", label: "事实输入", icon: ClipboardList },
  { id: "assessment", label: "路径评估", icon: Gauge },
  { id: "assets", label: "行动资产", icon: FileCheck2 },
  { id: "pipeline", label: "目标与反馈", icon: Target },
] as const;

export function OpportunityWorkbench({ apiConfigured }: Props) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(createEmptyWorkspace);
  const [hydrated, setHydrated] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [loading, setLoading] = useState<"assess" | "assets" | "">("");
  const [calibratingActionId, setCalibratingActionId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setWorkspace(loadWorkspace());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => saveWorkspace(workspace), 250);
    return () => window.clearTimeout(timeout);
  }, [hydrated, workspace]);

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

  async function assess() {
    if (!requiredReady || loading) return;
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

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="mx-auto flex w-[min(1480px,calc(100%-32px))] items-center justify-between gap-4 py-3 max-sm:w-[calc(100%-24px)]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#252822] text-[#fffdf8]">
              <Sparkles size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold">非标机会生成器</h1>
                <span className="rounded-md bg-[#e4ebe4] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#536c5b]">
                  Internal V0.1
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-[#777970]">
                找到可进入的机会路径，并用真实反馈持续校准
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {markdown && <CopyButton text={markdown} label="导出 Markdown" />}
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d9d3c8] bg-[#fffdf8] px-3 py-2 text-xs font-medium text-[#66695f]"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">清空</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-[min(1480px,calc(100%-32px))] py-5 max-sm:w-[calc(100%-16px)]">
        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <SprintMetric label="研究目标" value={workspace.targets.length} goal={10} />
          <SprintMetric label="真实发送" value={sentCount} goal={6} />
          <SprintMetric label="有效进展" value={progressCount} goal={2} />
        </section>

        <section className="panel mb-5 overflow-hidden">
          <div className="flex overflow-x-auto">
            {VIEWS.map((view) => {
              const Icon = view.icon;
              const selected = workspace.activeView === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => patchWorkspace({ activeView: view.id })}
                  className={`flex min-w-fit flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                    selected
                      ? "border-[#9e4d35] bg-[#fffaf5] text-[#713523]"
                      : "border-transparent text-[#777970]"
                  }`}
                >
                  <Icon size={14} />
                  {view.label}
                </button>
              );
            })}
          </div>
        </section>

        {!apiConfigured && (
          <div className="mb-5 flex gap-3 rounded-xl border border-[#e8c9be] bg-[#f9ebe6] p-4 text-[#7d3828]">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">尚未配置 API Key</p>
              <p className="mt-1 text-[11px] leading-5">
                可继续编辑本地记录；AI 评估与校准前，请在 .env.local 中配置
                LLM_API_KEY。
              </p>
            </div>
          </div>
        )}

        <ErrorNotice message={error} />
        <div className={error ? "mt-5" : ""}>
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

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[10px] text-[#8a8c84]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={12} />
            本地 v2 工作区 · 不自动发送 · 每项价值需回溯证据
          </span>
          <span>{hydrated ? "已启用本地自动保存" : "正在读取本地工作区"}</span>
          {packageMinutes !== null && (
            <span>输入到行动包：约 {packageMinutes} 分钟</span>
          )}
        </footer>
      </div>
    </main>
  );
}

function SprintMetric({
  label,
  value,
  goal,
}: {
  label: string;
  value: number;
  goal: number;
}) {
  const percentage = Math.min(100, Math.round((value / goal) * 100));
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#66695f]">{label}</span>
        <span className="font-mono text-sm font-semibold">
          {value}/{goal}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e8e3da]">
        <div
          className="h-full rounded-full bg-[#9e4d35] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
