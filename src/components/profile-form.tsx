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
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <section className="panel overflow-hidden">
        <div className="border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4 sm:px-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e4d35]">
            Truth dossier
          </p>
          <h2 className="mt-1 text-base font-semibold">候选人事实底稿</h2>
          <p className="mt-1.5 text-xs leading-5 text-[#777970]">
            系统只允许从这里的事实和证据生成价值主张。
          </p>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <label className="block">
            <span className="field-label">加载回归样本</span>
            <select
              value={selectedSampleId}
              onChange={(event) => onSelectSample(event.target.value)}
              className="text-field px-3.5 py-3 text-sm"
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
              <span className="field-label">
                {label}
                {required && <span className="ml-1 text-[#9e4d35]">*</span>}
                <span className="field-hint"> · {hint}</span>
              </span>
              <textarea
                value={form.profile[key]}
                onChange={(event) => updateProfile(key, event.target.value)}
                rows={key === "workExperience" || key === "projectsAndEvidence" ? 4 : 3}
                className="text-field px-3.5 py-3 text-sm"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="panel h-fit overflow-hidden lg:sticky lg:top-[82px]">
        <div className="border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4 sm:px-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#536c5b]">
            Opportunity context
          </p>
          <h2 className="mt-1 text-base font-semibold">机会场景</h2>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <span className="field-label">
              选择场景<span className="ml-1 text-[#9e4d35]">*</span>
            </span>
            <div className="grid gap-2">
              {SCENARIO_OPTIONS.map((option) => {
                const selected = form.scenario.types.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleScenario(option)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                      selected
                        ? "border-[#aa6048] bg-[#f6e8e0] text-[#713523]"
                        : "border-[#ded9ce] bg-[#fffdf8] text-[#65685f]"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-[#9e4d35] bg-[#9e4d35] text-white"
                          : "border-[#c9c3b8]"
                      }`}
                    >
                      {selected && <Check size={11} />}
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
                className="text-field px-3.5 py-3 text-sm"
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
            <p className="text-[11px] leading-5 text-[#8a8c84]">
              需填写工作经历、项目证据、目标方向，并选择至少一种场景。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
