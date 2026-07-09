"use client";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDashed,
  KeyRound,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { CopyButton, PrimaryButton } from "@/components/workspace-ui";
import {
  FREE_QUOTA,
  USAGE_LABELS,
  type Entitlement,
  type UsageKind,
} from "@/lib/entitlement";
import { deriveLoopReceipt, deriveLoopStages } from "@/lib/loop";
import type { WorkspaceData } from "@/lib/types";

type Props = {
  workspace: WorkspaceData;
  entitlement: Entitlement;
  paymentUrl: string;
  onNavigate: (view: WorkspaceData["activeView"]) => void;
  onActivateLicense: (key: string) => Promise<void>;
};

const FAILURE_LAYER_LABELS: Record<string, string> = {
  activation: "启动层：还没真正发出行动",
  target: "目标层：找的人不对",
  opening: "开场层：开口方式没有对准对方",
  evidence: "证据层：主张缺少可信支撑",
  request: "请求层：要求的东西不合适",
  collaboration: "合作层：合作方式风险过高",
  delivery: "交付层：试点执行出了问题",
  progress: "推进层：有反馈但没推进到下一步",
};

export function LoopReviewPanel({
  workspace,
  entitlement,
  paymentUrl,
  onNavigate,
  onActivateLicense,
}: Props) {
  const stages = deriveLoopStages(workspace);
  const receipt = deriveLoopReceipt(workspace);
  const firstOpen = stages.find((stage) => !stage.done);

  const reviewMarkdown = buildReviewMarkdown(receipt, stages);
  const postDraft = buildPostDraft(receipt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Loop Review */}
      <section className="panel" style={{ overflow: "hidden" }}>
        <div className="section-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Receipt size={16} style={{ color: "var(--clay)" }} />
              <h2 className="section-header-title">本次闭环复盘</h2>
              <span className={`tag ${receipt.loopClosed ? "tag--verified" : "tag--consistent"}`}>
                {receipt.loopClosed ? "闭环已跑通" : "闭环进行中"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {receipt.evidenceTotal > 0 && (
                <CopyButton text={postDraft} label="复制过程帖草稿" />
              )}
              {receipt.loopClosed && (
                <CopyButton text={reviewMarkdown} label="复制闭环报告" />
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px" }}>
          <ol style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0 }}>
            {stages.map((stage, index) => (
              <li key={stage.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{
                  marginTop: 2,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: stage.done ? "var(--sage)" : "transparent",
                  border: stage.done ? "none" : "1.5px solid var(--line)",
                  color: stage.done ? "white" : "var(--ink-muted)",
                }}>
                  {stage.done ? <Check size={12} /> : index + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{stage.label}</p>
                    {!stage.done && stage === firstOpen && (
                      <button
                        type="button"
                        onClick={() => onNavigate(stage.view)}
                        className="btn btn-ghost"
                        style={{ fontSize: 10, padding: "2px 8px", background: "var(--paper-raised)" }}
                      >
                        去完成 <ArrowRight size={10} />
                      </button>
                    )}
                  </div>
                  <p style={{ marginTop: 2, fontSize: 12, lineHeight: 1.5, color: "var(--ink-soft)" }}>
                    {stage.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Value Bill */}
      <section className="panel" style={{ overflow: "hidden" }}>
        <div className="section-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={16} style={{ color: "var(--clay)" }} />
            <div>
              <h2 className="section-header-title">价值账单（全部来自真实记录）</h2>
              <p className="section-header-desc">
                每个数字都能回溯到你输入的事实、系统生成的资产和你记录的真实行动。
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(4, 1fr)", padding: "16px 20px" }}>
          <ReceiptStat label="证据账本条目" value={`${receipt.evidenceTotal}`} note={`可核验 ${receipt.evidenceVerified} · 自述一致 ${receipt.evidenceConsistent} · 孤证 ${receipt.evidenceIsolated}`} />
          <ReceiptStat label="孤证被挡在对外文案之外" value={`${receipt.evidenceIsolated}`} note="不伪造经历：孤证不进入行动资产" />
          <ReceiptStat label="可发送行动资产" value={`${receipt.assetsApproved}/${receipt.assetsTotal}`} note={`共 ${receipt.claimChecksTotal} 条主张核查，逐条可回溯`} />
          <ReceiptStat label="输入到行动包" value={receipt.minutesToActionPackage !== null ? `${receipt.minutesToActionPackage} 分钟` : "—"} note="从填写事实到拿到可编辑材料" />
          <ReceiptStat label="目标对象" value={`${receipt.targetsTotal}`} note="有名字、有联系理由、有问题假设" />
          <ReceiptStat label="真实发送" value={`${receipt.sentTotal}`} note="系统不自动发送，每次都是你按下的" />
          <ReceiptStat label="记录反馈" value={`${receipt.feedbackTotal}`} note="包括没有回复——沉默也是数据" />
          <ReceiptStat label="反馈校准" value={`${receipt.diagnosesTotal}`} note="定位失败层级，只给一个下一步" />
        </div>
        {receipt.latestNextAction && (
          <div style={{ borderTop: "1px solid var(--line-light)", padding: "14px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)" }}>最新校准结论</p>
            <p style={{ marginTop: 4, fontSize: 13, lineHeight: 1.6 }}>
              {FAILURE_LAYER_LABELS[receipt.latestDiagnosisLayer] ?? receipt.latestDiagnosisLayer}
            </p>
            <p style={{ marginTop: 2, fontSize: 13, lineHeight: 1.6 }}>
              <strong>下一步：</strong>{receipt.latestNextAction}
            </p>
          </div>
        )}
      </section>

      {/* Upgrade Section */}
      <UpgradeSection
        entitlement={entitlement}
        paymentUrl={paymentUrl}
        loopClosed={receipt.loopClosed}
        onActivateLicense={onActivateLicense}
      />
    </div>
  );
}

function UpgradeSection({
  entitlement,
  paymentUrl,
  loopClosed,
  onActivateLicense,
}: {
  entitlement: Entitlement;
  paymentUrl: string;
  loopClosed: boolean;
  onActivateLicense: (key: string) => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [licenseError, setLicenseError] = useState("");

  async function activate() {
    if (!key.trim() || activating) return;
    setActivating(true);
    setLicenseError("");
    try {
      await onActivateLicense(key.trim());
      setKey("");
    } catch (caught) {
      setLicenseError(caught instanceof Error ? caught.message : "解锁失败，请重试。");
    } finally {
      setActivating(false);
    }
  }

  if (entitlement.plan === "pro") {
    return (
      <section className="panel" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BadgeCheck size={16} style={{ color: "var(--sage)" }} />
          <h2 className="section-header-title">Pro 已解锁</h2>
        </div>
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "var(--ink-soft)" }}>
          本机额度限制已解除：路径评估、行动包生成、反馈校准不限次数。感谢你为一个诚实的工具付费。
        </p>
      </section>
    );
  }

  return (
    <section className="panel" style={{ overflow: "hidden" }}>
      <div className="section-header">
        <div>
          <h2 className="section-header-title">为什么值得付费</h2>
          <p className="section-header-desc">
            {loopClosed
              ? "你刚刚跑完一次完整闭环：不是拿到一份报告，而是完成了一次真实机会推进，并且知道了下一步。"
              : "免费额度足够跑通第一个完整闭环。跑通后你会知道这个工具是否值得为第二个、第三个目标付费。"}
          </p>
        </div>
      </div>
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr", padding: "20px 24px" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>免费额度用量（本机）</p>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {(Object.keys(FREE_QUOTA) as UsageKind[]).map((kind) => {
              const used = entitlement.usage[kind];
              const limit = FREE_QUOTA[kind];
              return (
                <div key={kind}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span>{USAGE_LABELS[kind]}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{used}/{limit}</span>
                  </div>
                  <div style={{ marginTop: 4, height: 4, borderRadius: 99, background: "var(--line-light)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: 99,
                      background: used >= limit ? "var(--danger)" : "var(--sage)",
                      width: `${Math.min(100, Math.round((used / limit) * 100))}%`,
                      transition: "width 400ms ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <ul style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0, fontSize: 12, lineHeight: 1.5, color: "var(--ink-soft)" }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <Check size={12} style={{ marginTop: 2, flexShrink: 0, color: "var(--sage)" }} />
              Pro 解除本机全部额度限制，可并行推进多个目标
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <Check size={12} style={{ marginTop: 2, flexShrink: 0, color: "var(--sage)" }} />
              真实性护栏不变：孤证排除、主张核查、不自动发送
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <CircleDashed size={12} style={{ marginTop: 2, flexShrink: 0, color: "var(--ink-muted)" }} />
              内测阶段：暂无自动支付，付款后 24 小时内人工发放解锁码
            </li>
          </ul>
        </div>
        <div style={{
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--line-light)",
          background: "white",
          padding: "16px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", fontFamily: "var(--font-display)" }}>¥49</span>
            <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>内测早鸟 · 一次性买断本机 Pro</span>
          </div>
          {paymentUrl ? (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ marginTop: 12, width: "100%", justifyContent: "center", padding: "10px 20px" }}
            >
              去付款并获取解锁码 <ArrowRight size={14} />
            </a>
          ) : (
            <p style={{ marginTop: 12, borderRadius: "var(--radius-sm)", background: "var(--paper-raised)", padding: "10px 12px", fontSize: 12, lineHeight: 1.5, color: "var(--ink-soft)" }}>
              支付链接尚未配置。当前通过人工渠道收款并发放解锁码——联系产品作者获取。
            </p>
          )}
          <div style={{ marginTop: 16, borderTop: "1px solid var(--line-light)", paddingTop: 16 }}>
            <label className="block">
              <span className="field-label">已有解锁码？</span>
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="CLD1.xxxx.xxxx"
                className="text-field"
                style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
              />
            </label>
            {licenseError && (
              <p style={{ marginTop: 6, fontSize: 12, color: "var(--danger)" }}>{licenseError}</p>
            )}
            <div style={{ marginTop: 10 }}>
              <PrimaryButton onClick={activate} loading={activating}>
                <KeyRound size={14} /> 验证并解锁 Pro
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReceiptStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ borderRadius: "var(--radius-md)", background: "var(--paper-raised)", padding: "12px 14px" }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)" }}>{label}</p>
      <p style={{ marginTop: 4, fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>{value}</p>
      <p style={{ marginTop: 4, fontSize: 10, lineHeight: 1.4, color: "var(--ink-muted)" }}>{note}</p>
    </div>
  );
}

function buildPostDraft(receipt: ReturnType<typeof deriveLoopReceipt>): string {
  const lines = [
    "用自己做的工具找机会 · 真实进度",
    "",
    "我在用「岔路地图」推进自己的求职/合作闭环，规则是不伪造经历：每句对外的话都要能回溯到证据。本周的真实数字：",
    "",
    `· 证据账本 ${receipt.evidenceTotal} 条（可核验 ${receipt.evidenceVerified} / 自述一致 ${receipt.evidenceConsistent} / 孤证 ${receipt.evidenceIsolated}，孤证被系统挡在对外文案之外）`,
    `· 已确认行动资产 ${receipt.assetsApproved} 份，主张核查 ${receipt.claimChecksTotal} 条`,
    `· 目标对象 ${receipt.targetsTotal} 个 · 真实发送 ${receipt.sentTotal} 次 · 记录反馈 ${receipt.feedbackTotal} 条 · 校准 ${receipt.diagnosesTotal} 次`,
  ];
  if (receipt.latestNextAction) {
    lines.push("", `系统根据真实反馈给我的下一步：${receipt.latestNextAction}`);
  }
  lines.push(
    "",
    "[这里补一段本周的真实感受或卡点，一两句就够]",
    "",
    "过程持续公开。工具地址见评论区。",
  );
  return lines.join("\n");
}

function buildReviewMarkdown(
  receipt: ReturnType<typeof deriveLoopReceipt>,
  stages: ReturnType<typeof deriveLoopStages>,
): string {
  const lines = [
    "# 岔路地图 · 闭环复盘",
    "",
    "## 闭环链条",
    ...stages.map((s) => `- [${s.done ? "x" : " "}] ${s.label}：${s.detail}`),
    "",
    "## 价值账单",
    `- 证据账本：${receipt.evidenceTotal} 条（可核验 ${receipt.evidenceVerified} / 自述一致 ${receipt.evidenceConsistent} / 孤证 ${receipt.evidenceIsolated}）`,
    `- 行动资产：确认 ${receipt.assetsApproved}/${receipt.assetsTotal}，主张核查 ${receipt.claimChecksTotal} 条`,
    `- 目标对象：${receipt.targetsTotal} · 真实发送：${receipt.sentTotal} · 记录反馈：${receipt.feedbackTotal} · 校准：${receipt.diagnosesTotal}`,
  ];
  if (receipt.minutesToActionPackage !== null) {
    lines.push(`- 输入到行动包：约 ${receipt.minutesToActionPackage} 分钟`);
  }
  if (receipt.latestNextAction) {
    lines.push("", "## 最新校准", `- 下一步：${receipt.latestNextAction}`);
  }
  return lines.join("\n");
}
