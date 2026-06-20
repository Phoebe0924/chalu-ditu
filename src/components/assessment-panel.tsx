"use client";

import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import type {
  EvidenceVerificationLevel,
  OpportunityAssessment,
} from "@/lib/types";
import { EmptyPanel, PrimaryButton } from "@/components/workspace-ui";

type Props = {
  assessment: OpportunityAssessment | null;
  loadingAssets: boolean;
  onGenerateAssets: () => void;
};

const PRIORITY_LABELS = {
  high: "高",
  medium: "中",
  low: "低",
};

const VERIFICATION_META: Record<
  EvidenceVerificationLevel,
  { label: string; className: string }
> = {
  verified: {
    label: "可独立验证",
    className: "bg-[#e4ebe4] text-[#46604f]",
  },
  self_reported_consistent: {
    label: "自述—内部一致",
    className: "bg-[#f5ead8] text-[#855f2f]",
  },
  self_reported_isolated: {
    label: "自述—孤证",
    className: "bg-[#f1e5dc] text-[#8a432f]",
  },
};

export function AssessmentPanel({
  assessment,
  loadingAssets,
  onGenerateAssets,
}: Props) {
  if (!assessment) {
    return (
      <section className="panel">
        <EmptyPanel
          title="还没有结构化评估"
          description="先建立事实底稿。评估会分别判断六条路径，并把每项价值回溯到证据。"
        />
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="panel overflow-hidden">
        <div className="border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#536c5b]">
            Positioning
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {assessment.identityPositioning.opportunityTalentType}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#55584f]">
            {assessment.identityPositioning.positioningStatement}
          </p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3 sm:p-6">
          <div className="rounded-xl bg-[#f8f5ee] p-4">
            <p className="text-[11px] font-semibold text-[#777970]">不宜被当作</p>
            <p className="mt-2 text-sm leading-6">
              {assessment.identityPositioning.notStandardCandidateFor}
            </p>
          </div>
          <div className="rounded-xl bg-[#e8eee8] p-4 md:col-span-2">
            <p className="text-[11px] font-semibold text-[#536c5b]">今天的最小行动</p>
            <p className="mt-2 text-sm leading-6">{assessment.immediateNextStep}</p>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold">六条路径的可解释排序</h2>
          <p className="mt-1 text-xs text-[#777970]">
            “高 / 中 / 低”表示建议优先级，不是成功概率或模型置信度。
          </p>
        </div>
        <div className="divide-y divide-[#e8e3da]">
          {[...assessment.pathEvaluations]
            .sort((a, b) => a.rank - b.rank)
            .map((path) => (
              <article key={path.path} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-[#9e4d35]">
                    #{path.rank}
                  </span>
                  <h3 className="text-sm font-semibold">{path.path}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      path.priority === "high"
                        ? "bg-[#e4ebe4] text-[#46604f]"
                        : path.priority === "medium"
                          ? "bg-[#f5ead8] text-[#855f2f]"
                          : "bg-[#efede8] text-[#777970]"
                    }`}
                  >
                    建议{PRIORITY_LABELS[path.priority]}优先
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#55584f]">
                  {path.rationale}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <SmallList title="适配信号" items={path.fitSignals} tone="good" />
                  <SmallList title="风险" items={path.risks} tone="risk" />
                  <SmallList title="证据缺口" items={path.evidenceGaps} tone="plain" />
                </div>
                <p className="mt-3 text-xs leading-5 text-[#777970]">
                  <strong>暂不优先条件：</strong>{path.whyNotNow}
                </p>
              </article>
            ))}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold">事实—价值—证据—边界账本</h2>
          <p className="mt-1 text-xs text-[#777970]">
            每项价值必须能回到事实；不能证明的部分也明确保留。
          </p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 sm:p-5">
          {assessment.evidenceLedger.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-[#e2ddd3] bg-[#fffdf8] p-4"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#f1e5dc] px-2 py-1 font-mono text-[10px] text-[#8a432f]">
                  {item.id}
                </span>
                <h3 className="text-sm font-semibold">{item.valueClaim}</h3>
                <span
                  className={`ml-auto rounded-full px-2 py-1 text-[10px] font-semibold ${VERIFICATION_META[item.verificationLevel].className}`}
                >
                  {VERIFICATION_META[item.verificationLevel].label}
                </span>
              </div>
              <dl className="mt-4 space-y-3 text-xs leading-5">
                <LedgerRow label="事实" value={item.fact} />
                <LedgerRow label="证据" value={item.evidence.join("；")} />
                <LedgerRow label="验证依据" value={item.verificationBasis} />
                <LedgerRow label="能证明" value={item.proves} />
                <LedgerRow label="不能证明" value={item.doesNotProve} />
                <LedgerRow
                  label="待补证"
                  value={item.missingEvidence.join("；") || "无"}
                />
                <LedgerRow
                  label="最快补证行动"
                  value={item.verificationUpgradeSuggestion}
                />
                <LedgerRow label="边界" value={item.boundary} />
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold">评估确认后生成行动资产</h2>
            <p className="mt-1 text-xs leading-5 text-[#777970]">
              只为前 2–3 条路径生成材料，并保留证据引用和使用边界。
            </p>
          </div>
          <PrimaryButton onClick={onGenerateAssets} loading={loadingAssets}>
            生成行动包 <ArrowRight size={15} />
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}

function SmallList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "risk" | "plain";
}) {
  const Icon = tone === "risk" ? ShieldAlert : CheckCircle2;
  return (
    <div className="rounded-xl bg-[#f8f5ee] p-3.5">
      <p className="text-[11px] font-semibold text-[#66695f]">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-5 text-[#55584f]">
            <Icon
              size={13}
              className={tone === "risk" ? "mt-1 text-[#9e4d35]" : "mt-1 text-[#536c5b]"}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-[#777970]">{label}</dt>
      <dd className="mt-0.5 text-[#454840]">{value}</dd>
    </div>
  );
}
