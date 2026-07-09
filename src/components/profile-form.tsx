"use client";

import { Check } from "lucide-react";
import {
  SCENARIO_OPTIONS,
  type OpportunityFormData,
  type ScenarioOption,
} from "@/lib/types";
import type { RegressionSample } from "@/lib/regression-samples";
import { PrimaryButton } from "@/components/workspace-ui";

type Props = {
  form: OpportunityFormData;
  samples: RegressionSample[];
  selectedSampleId: string;
  loading: boolean;
  ready: boolean;
  onChange: (form: OpportunityFormData) => void;
  onSelectSample: (sampleId: string) => void;
  onAssess: () => void;
};

const PROFILE_FIELDS = [
  ["workExperience", "过去工作经历", "写事实，不必先润色", true],
  ["nonstandardTransitions", "非标转折", "空窗、转行、生育、照护、创业等", false],
  ["realWorkDuringTransition", "非标期间真实做过的事", "只写真实行动", false],
  ["projectsAndEvidence", "项目、作品或证据", "可验证比听起来厉害更重要", true],
  ["desiredDirection", "当前想靠近的方向", "行业、公司、人群或问题", true],
  ["fearedMisunderstandings", "最担心被误解的地方", "把风险放到桌面上", false],
  ["constraints", "现实限制", "机会必须适配真实生活", false],
  ["packagingBoundaries", "不希望被如何包装", "明确叙事底线", false],
] as const;

const SCENARIO_FIELDS = [
  ["targetCompanyOrPerson", "目标公司 / 对象"],
  ["targetRoleOrJd", "目标岗位 / JD"],
  ["counterpartProblems", "对方可能的问题"],
  ["proposedCollaboration", "想提出的合作方向"],
  ["existingWork", "已有作品链接或说明"],
] as const;

export function ProfileForm({
  form,
  samples,
  selectedSampleId,
  loading,
  ready,
  onChange,
  onSelectSample,
  onAssess,
}: Props) {
  function updateProfile(
    key: keyof OpportunityFormData["profile"],
    value: string,
  ) {
    onChange({
      ...form,
      profile: { ...form.profile, [key]: value },
    });
  }

  function updateScenario(
    key: keyof Omit<OpportunityFormData["scenario"], "types">,
    value: string,
  ) {
    onChange({
      ...form,
      scenario: { ...form.scenario, [key]: value },
    });
  }

  function toggleScenario(option: ScenarioOption) {
    const selected = form.scenario.types.includes(option);
    onChange({
      ...form,
      scenario: {
        ...form.scenario,
        types: selected
          ? form.scenario.types.filter((item) => item !== option)
          : [...form.scenario.types, option],
      },
    });
  }

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 0.9fr" }}>
      {/* Left: Truth Dossier */}
      <section className="panel" style={{ overflow: "hidden" }}>
        <div className="section-header">
          <div>
            <div className="section-header-kicker">Truth dossier</div>
            <h2 className="section-header-title">候选人事实底稿</h2>
          </div>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <label className="block">
            <span className="field-label">加载回归样本</span>
            <select
              value={selectedSampleId}
              onChange={(event) => onSelectSample(event.target.value)}
              className="text-field"
            >
              <option value="">不加载样本</option>
              {samples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.name}
                </option>
              ))}
            </select>
          </label>

          {PROFILE_FIELDS.map(([key, label, hint, required]) => (
            <label key={key} className="block">
              <span className="field-label field-label--dark">
                {label}
                {required && <span style={{ color: "var(--clay)", marginLeft: 4 }}>*</span>}
                <span className="field-hint"> · {hint}</span>
              </span>
              <textarea
                value={form.profile[key]}
                onChange={(event) => updateProfile(key, event.target.value)}
                rows={key === "workExperience" || key === "projectsAndEvidence" ? 4 : 3}
                className="text-field"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Right: Scenario */}
      <section className="panel" style={{ overflow: "hidden", alignSelf: "start", position: "sticky", top: 32 }}>
        <div className="section-header">
          <div>
            <div className="section-header-kicker" style={{ color: "var(--sage)" }}>Opportunity context</div>
            <h2 className="section-header-title">路径场景</h2>
          </div>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <span className="field-label">
              选择场景<span style={{ color: "var(--clay)", marginLeft: 4 }}>*</span>
            </span>
            <div style={{ display: "grid", gap: 8 }}>
              {SCENARIO_OPTIONS.map((option) => {
                const selected = form.scenario.types.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleScenario(option)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderRadius: "var(--radius-md)",
                      border: `1px solid ${selected ? "var(--clay)" : "var(--line)"}`,
                      background: selected ? "var(--clay-light)" : "var(--paper)",
                      padding: "8px 12px",
                      textAlign: "left",
                      fontSize: 13,
                      color: selected ? "var(--clay-dark)" : "var(--ink-soft)",
                      cursor: "pointer",
                      transition: "all 120ms ease",
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${selected ? "var(--clay)" : "var(--line-heavy)"}`,
                        background: selected ? "var(--clay)" : "transparent",
                        color: selected ? "white" : "transparent",
                        flexShrink: 0,
                        fontSize: 10,
                      }}
                    >
                      {selected && <Check size={10} />}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {SCENARIO_FIELDS.map(([key, label]) => (
            <label key={key} className="block">
              <span className="field-label">
                {label}<span className="field-hint"> · 可选</span>
              </span>
              <textarea
                value={form.scenario[key]}
                onChange={(event) => updateScenario(key, event.target.value)}
                rows={3}
                className="text-field"
              />
            </label>
          ))}

          <PrimaryButton
            onClick={onAssess}
            disabled={!ready}
            loading={loading}
          >
            {loading ? "正在评估六条路径" : "生成结构化机会评估"}
          </PrimaryButton>
          {!ready && (
            <p style={{ fontSize: 11, lineHeight: 1.5, color: "var(--ink-muted)" }}>
              需填写工作经历、项目证据、目标方向，并选择至少一种路径场景。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
