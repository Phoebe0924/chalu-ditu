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

  return (
    <div className="space-y-5">
      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-[#9e4d35]" />
            <h2 className="text-base font-semibold">本次闭环复盘</h2>
            {receipt.loopClosed ? (
              <span className="rounded-md bg-[#e4ebe4] px-1.5 py-0.5 text-[10px] font-semibold text-[#46604f]">
                闭环已跑通
              </span>
            ) : (
              <span className="rounded-md bg-[#f3e9dc] px-1.5 py-0.5 text-[10px] font-semibold text-[#8a6b3f]">
                闭环进行中
              </span>
            )}
          </div>
          {receipt.loopClosed && (
            <CopyButton text={reviewMarkdown} label="复制闭环报告" />
          )}
        </div>
        <div className="p-5 sm:p-6">
          <ol className="space-y-3">
            {stages.map((stage, index) => (
              <li key={stage.id} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    stage.done
                      ? "bg-[#46604f] text-[#fffdf8]"
                      : "border border-[#d0c8bc] text-[#8a8c84]"
                  }`}
                >
                  {stage.done ? <Check size={13} /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold">{stage.label}</p>
                    {!stage.done && stage === firstOpen && (
                      <button
                        type="button"
                        onClick={() => onNavigate(stage.view)}
                        className="inline-flex items-center gap-1 rounded-md bg-[#f3e9dc] px-2 py-0.5 text-[10px] font-semibold text-[#8a6b3f]"
                      >
                        去完成 <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-5 text-[#777970]">
                    {stage.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#9e4d35]" />
            <h2 className="text-base font-semibold">价值账单（全部来自真实记录）</h2>
          </div>
          <p className="mt-1 text-xs text-[#777970]">
            每个数字都能回溯到你输入的事实、系统生成的资产和你记录的真实行动。
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <ReceiptStat
            label="证据账本条目"
            value={`${receipt.evidenceTotal}`}
            note={`可核验 ${receipt.evidenceVerified} · 自述一致 ${receipt.evidenceConsistent} · 孤证 ${receipt.evidenceIsolated}`}
          />
          <ReceiptStat
            label="孤证被挡在对外文案之外"
            value={`${receipt.evidenceIsolated}`}
            note="不伪造经历：孤证不进入行动资产"
          />
          <ReceiptStat
            label="可发送行动资产"
            value={`${receipt.assetsApproved}/${receipt.assetsTotal}`}
            note={`共 ${receipt.claimChecksTotal} 条主张核查，逐条可回溯`}
          />
          <ReceiptStat
            label="输入到行动包"
            value={
              receipt.minutesToActionPackage !== null
                ? `${receipt.minutesToActionPackage} 分钟`
                : "—"
            }
            note="从填写事实到拿到可编辑材料"
          />
          <ReceiptStat
            label="目标对象"
            value={`${receipt.targetsTotal}`}
            note="有名字、有联系理由、有问题假设"
          />
          <ReceiptStat
            label="真实发送"
            value={`${receipt.sentTotal}`}
            note="系统不自动发送，每次都是你按下的"
          />
          <ReceiptStat
            label="记录反馈"
            value={`${receipt.feedbackTotal}`}
            note="包括没有回复——沉默也是数据"
          />
          <ReceiptStat
            label="反馈校准"
            value={`${receipt.diagnosesTotal}`}
            note="定位失败层级，只给一个下一步"
          />
        </div>
        {receipt.latestNextAction && (
          <div className="border-t border-[#e2ddd3] px-5 py-4 sm:px-6">
            <p className="text-[11px] font-semibold text-[#777970]">
              最新校准结论
            </p>
            <p className="mt-1 text-xs leading-6">
              {FAILURE_LAYER_LABELS[receipt.latestDiagnosisLayer] ??
                receipt.latestDiagnosisLayer}
            </p>
            <p className="mt-1 text-xs leading-6">
              <strong>下一步：</strong>
              {receipt.latestNextAction}
            </p>
          </div>
        )}
      </section>

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
      setLicenseError(
        caught instanceof Error ? caught.message : "解锁失败，请重试。",
      );
    } finally {
      setActivating(false);
    }
  }

  if (entitlement.plan === "pro") {
    return (
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <BadgeCheck size={16} className="text-[#46604f]" />
          <h2 className="text-base font-semibold">Pro 已解锁</h2>
        </div>
        <p className="mt-2 text-xs leading-6 text-[#66695f]">
          本机额度限制已解除：路径评估、行动包生成、反馈校准不限次数。感谢你为一个诚实的工具付费。
        </p>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold">为什么值得付费</h2>
        <p className="mt-1 text-xs leading-5 text-[#777970]">
          {loopClosed
            ? "你刚刚跑完一次完整闭环：不是拿到一份报告，而是完成了一次真实机会推进，并且知道了下一步。"
            : "免费额度足够跑通第一个完整闭环。跑通后你会知道这个工具是否值得为第二个、第三个目标付费。"}
        </p>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-[#66695f]">免费额度用量（本机）</p>
          <div className="mt-3 space-y-3">
            {(Object.keys(FREE_QUOTA) as UsageKind[]).map((kind) => {
              const used = entitlement.usage[kind];
              const limit = FREE_QUOTA[kind];
              return (
                <div key={kind}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>{USAGE_LABELS[kind]}</span>
                    <span className="font-mono font-semibold">
                      {used}/{limit}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e8e3da]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        used >= limit ? "bg-[#9e4d35]" : "bg-[#536c5b]"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((used / limit) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <ul className="mt-4 space-y-1.5 text-[11px] leading-5 text-[#66695f]">
            <li className="flex items-start gap-1.5">
              <Check size={12} className="mt-0.5 shrink-0 text-[#46604f]" />
              Pro 解除本机全部额度限制，可并行推进多个目标
            </li>
            <li className="flex items-start gap-1.5">
              <Check size={12} className="mt-0.5 shrink-0 text-[#46604f]" />
              真实性护栏不变：孤证排除、主张核查、不自动发送
            </li>
            <li className="flex items-start gap-1.5">
              <CircleDashed size={12} className="mt-0.5 shrink-0 text-[#8a8c84]" />
              内测阶段：暂无自动支付，付款后 24 小时内人工发放解锁码
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-[#e2ddd3] bg-[#fffdf8] p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">¥49</span>
            <span className="text-[11px] text-[#777970]">
              内测早鸟 · 一次性买断本机 Pro
            </span>
          </div>
          {paymentUrl ? (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#252822] px-4 py-3 text-sm font-semibold text-[#fffdf8] transition hover:bg-[#373a33]"
            >
              去付款并获取解锁码 <ArrowRight size={14} />
            </a>
          ) : (
            <p className="mt-3 rounded-lg bg-[#f8f5ee] p-3 text-[11px] leading-5 text-[#66695f]">
              支付链接尚未配置。当前通过人工渠道收款并发放解锁码——联系产品作者获取。
            </p>
          )}
          <div className="mt-4 border-t border-[#eee9df] pt-4">
            <label className="block">
              <span className="field-label">已有解锁码？</span>
              <input
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder="CLD1.xxxx.xxxx"
                className="text-field px-3.5 py-3 font-mono text-xs"
              />
            </label>
            {licenseError && (
              <p className="mt-2 text-[11px] text-[#8f392d]">{licenseError}</p>
            )}
            <div className="mt-3">
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

function ReceiptStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-xl bg-[#f8f5ee] p-3.5">
      <p className="text-[11px] font-semibold text-[#777970]">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#8a8c84]">{note}</p>
    </div>
  );
}

function buildReviewMarkdown(
  receipt: ReturnType<typeof deriveLoopReceipt>,
  stages: ReturnType<typeof deriveLoopStages>,
): string {
  const lines = [
    "# 岔路地图 · 闭环复盘",
    "",
    "## 闭环链条",
    ...stages.map(
      (stage) => `- [${stage.done ? "x" : " "}] ${stage.label}：${stage.detail}`,
    ),
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
