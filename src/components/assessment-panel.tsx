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

const VERIFICATION_LABEL: Record<EvidenceVerificationLevel, string> = {
  verified: "可独立验证",
  self_reported_consistent: "自述—内部一致",
  self_reported_isolated: "自述—孤证",
};

const VERIFICATION_CLASS: Record<EvidenceVerificationLevel, string> = {
  verified: "tag tag--verified",
  self_reported_consistent: "tag tag--consistent",
  self_reported_isolated: "tag tag--isolated",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Identity Positioning */}
      <section className="panel" style={{ overflow: "hidden" }}>
        <div className="section-header">
          <div>
            <div className="section-header-kicker" style={{ color: "var(--sage)" }}>Positioning</div>
            <h2 className="section-header-title" style={{ fontSize: 18 }}>
              {assessment.identityPositioning.opportunityTalentType}
            </h2>
            <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "var(--ink-soft)" }}>
              {assessment.identityPositioning.positioningStatement}
            </p>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 2fr", padding: "16px 20px" }}>
          <div style={{
            borderRadius: "var(--radius-md)",
            background: "var(--paper-raised)",
            padding: "12px 16px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              不宜被当作
            </p>
            <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink)" }}>
              {assessment.identityPositioning.notStandardCandidateFor}
            </p>
          </div>
          <div style={{
            borderRadius: "var(--radius-md)",
            background: "var(--sage-light)",
            padding: "12px 16px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--sage-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              今天的最小行动
            </p>
            <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink)" }}>
              {assessment.immediateNextStep}
            </p>
          </div>
        </div>
      </section>

      {/* Path Evaluations */}
      <section className="panel" style={{ overflow: "hidden" }}>
        <div className="section-header">
          <div>
            <div className="section-header-title">六条路径的可解释排序</div>
            <p className="section-header-desc">
              "高 / 中 / 低"表示建议优先级，不是成功概率或模型置信度。
            </p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--line-light)" }}>
          {[...assessment.pathEvaluations]
            .sort((a, b) => a.rank - b.rank)
            .map((path) => (
              <article key={path.path} style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--line-light)",
              }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <span className="mono-tag">#{path.rank}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-serif)" }}>
                    {path.path}
                  </h3>
                  <span className={`tag ${path.priority === "high" ? "tag--priority-high" : path.priority === "medium" ? "tag--priority-medium" : "tag--priority-low"}`}>
                    建议{path.priority === "high" ? "高" : path.priority === "medium" ? "中" : "低"}优先
                  </span>
                </div>
                <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "var(--ink-soft)" }}>
                  {path.rationale}
                </p>
                <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <SmallList title="适配信号" items={path.fitSignals} tone="good" />
                  <SmallList title="风险" items={path.risks} tone="risk" />
                  <SmallList title="证据缺口" items={path.evidenceGaps} tone="plain" />
                </div>
                <p style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, color: "var(--ink-muted)" }}>
                  <strong style={{ color: "var(--ink-soft)" }}>暂不优先条件：</strong>{path.whyNotNow}
                </p>
              </article>
            ))}
        </div>
      </section>

      {/* Evidence Ledger */}
      <section className="panel" style={{ overflow: "hidden" }}>
        <div className="section-header">
          <div>
            <div className="section-header-title">事实—价值—证据—边界账本</div>
            <p className="section-header-desc">
              每项价值必须能回到事实；不能证明的部分也明确保留。
            </p>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", padding: "16px 20px" }}>
          {assessment.evidenceLedger.map((item) => (
            <article key={item.id} style={{
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line-light)",
              background: "white",
              padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mono-tag">{item.id}</span>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                  {item.valueClaim}
                </h3>
                <span className={VERIFICATION_CLASS[item.verificationLevel]} style={{ marginLeft: "auto" }}>
                  {VERIFICATION_LABEL[item.verificationLevel]}
                </span>
              </div>
              <dl style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, fontSize: 12, lineHeight: 1.6 }}>
                <LedgerRow label="事实" value={item.fact} />
                <LedgerRow label="证据" value={item.evidence.join("；")} />
                <LedgerRow label="验证依据" value={item.verificationBasis} />
                <LedgerRow label="能证明" value={item.proves} />
                <LedgerRow label="不能证明" value={item.doesNotProve} />
                <LedgerRow label="待补证" value={item.missingEvidence.join("；") || "无"} />
                <LedgerRow label="最快补证行动" value={item.verificationUpgradeSuggestion} />
                <LedgerRow label="边界" value={item.boundary} />
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* Generate Assets CTA */}
      <section className="panel" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-serif)" }}>
              评估确认后生成行动资产
            </h3>
            <p style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5, color: "var(--ink-soft)" }}>
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
    <div style={{
      borderRadius: "var(--radius-md)",
      background: "var(--paper-raised)",
      padding: "10px 14px",
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}>{title}</p>
      <ul style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item) => (
          <li key={item} style={{ display: "flex", gap: 6, fontSize: 12, lineHeight: 1.5, color: "var(--ink-soft)" }}>
            <Icon
              size={12}
              style={{
                marginTop: 3,
                flexShrink: 0,
                color: tone === "risk" ? "var(--danger)" : tone === "good" ? "var(--sage)" : "var(--ink-muted)",
              }}
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
      <dt style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)" }}>{label}</dt>
      <dd style={{ marginTop: 1, color: "var(--ink-soft)" }}>{value}</dd>
    </div>
  );
}
