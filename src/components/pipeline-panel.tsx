"use client";

import { ArrowRight, Plus, RefreshCw, Target } from "lucide-react";
import { useState } from "react";
import {
  ACTION_STATUSES,
  FEEDBACK_TYPES,
  TARGET_STATUSES,
  type ActionAsset,
  type ActionRecord,
  type FeedbackDiagnosis,
  type TargetRecord,
} from "@/lib/types";
import { EmptyPanel, PrimaryButton } from "@/components/workspace-ui";

type Props = {
  assets: ActionAsset[];
  targets: TargetRecord[];
  actions: ActionRecord[];
  diagnoses: FeedbackDiagnosis[];
  calibratingActionId: string;
  onTargetsChange: (targets: TargetRecord[]) => void;
  onActionsChange: (actions: ActionRecord[]) => void;
  onCalibrate: (actionId: string) => void;
};

const TARGET_LABELS: Record<(typeof TARGET_STATUSES)[number], string> = {
  research: "研究中",
  ready: "可联系",
  contacted: "已联系",
  responded: "已回复",
  conversation: "约聊中",
  trial: "试点中",
  closed: "已关闭",
};

const ACTION_LABELS: Record<(typeof ACTION_STATUSES)[number], string> = {
  draft: "草稿",
  ready: "待发送",
  sent: "已发送",
  replied: "有回复",
  conversation: "已约聊/面试",
  trial: "试点讨论/进行中",
  closed: "已关闭",
};

const FEEDBACK_LABELS: Record<(typeof FEEDBACK_TYPES)[number], string> = {
  none: "尚无反馈",
  substantive_reply: "实质性回复",
  referral: "主动引荐",
  portfolio_review: "愿意看作品",
  conversation: "同意约聊",
  interview: "进入面试",
  trial_discussion: "讨论试点",
  collaboration_terms: "提出合作条件",
  polite_rejection: "礼貌拒绝",
  no_response: "暂无回复",
};

const EMPTY_TARGET = {
  name: "",
  company: "",
  role: "",
  channel: "",
  relationship: "none" as const,
  problemHypothesis: "",
  contactReason: "",
  researchEvidence: "",
  selectedAssetId: "",
};

export function PipelinePanel({
  assets,
  targets,
  actions,
  diagnoses,
  calibratingActionId,
  onTargetsChange,
  onActionsChange,
  onCalibrate,
}: Props) {
  const [draft, setDraft] = useState(EMPTY_TARGET);
  const approvedAssets = assets.filter((asset) => asset.status === "approved");

  function addTarget() {
    if (
      !draft.name.trim() ||
      !draft.company.trim() ||
      !draft.contactReason.trim() ||
      !draft.problemHypothesis.trim()
    ) {
      return;
    }
    const now = new Date().toISOString();
    const target: TargetRecord = {
      ...draft,
      id: crypto.randomUUID(),
      status: "research",
      createdAt: now,
      updatedAt: now,
    };
    onTargetsChange([...targets, target]);
    setDraft(EMPTY_TARGET);
  }

  function updateTarget(id: string, patch: Partial<TargetRecord>) {
    onTargetsChange(
      targets.map((target) =>
        target.id === id
          ? { ...target, ...patch, updatedAt: new Date().toISOString() }
          : target,
      ),
    );
  }

  function createAction(target: TargetRecord) {
    if (!target.selectedAssetId) return;
    const selectedAsset = assets.find(
      (asset) => asset.id === target.selectedAssetId,
    );
    if (!selectedAsset || selectedAsset.status !== "approved") return;
    const now = new Date().toISOString();
    const action: ActionRecord = {
      id: crypto.randomUUID(),
      targetId: target.id,
      assetId: target.selectedAssetId,
      assetTitle: selectedAsset.title,
      contentSnapshot: selectedAsset.content,
      channel: target.channel,
      status: "ready",
      sentAt: "",
      followUpAt: "",
      followUpCount: 0,
      followUpNewInformation: "",
      feedbackType: "none",
      feedbackText: "",
      nextStep: "",
      reflection: "",
      createdAt: now,
      updatedAt: now,
    };
    onActionsChange([...actions, action]);
    updateTarget(target.id, { status: "ready" });
  }

  function updateAction(id: string, patch: Partial<ActionRecord>) {
    onActionsChange(
      actions.map((action) =>
        action.id === id
          ? { ...action, ...patch, updatedAt: new Date().toISOString() }
          : action,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <section className="panel overflow-hidden">
        <div className="border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[#9e4d35]" />
            <h2 className="text-base font-semibold">新增目标对象</h2>
          </div>
          <p className="mt-1 text-xs text-[#777970]">
            首轮目标：研究 10 人，个性化发送 6 次。系统不会代替你发送。
          </p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 sm:p-6">
          <TargetInput
            label="对象姓名 *"
            value={draft.name}
            onChange={(value) => setDraft({ ...draft, name: value })}
          />
          <TargetInput
            label="公司 *"
            value={draft.company}
            onChange={(value) => setDraft({ ...draft, company: value })}
          />
          <TargetInput
            label="角色"
            value={draft.role}
            onChange={(value) => setDraft({ ...draft, role: value })}
          />
          <TargetInput
            label="联系渠道"
            value={draft.channel}
            onChange={(value) => setDraft({ ...draft, channel: value })}
          />
          <TargetTextarea
            label="具体联系理由 *"
            value={draft.contactReason}
            onChange={(value) => setDraft({ ...draft, contactReason: value })}
          />
          <TargetTextarea
            label="问题假设 *"
            value={draft.problemHypothesis}
            onChange={(value) =>
              setDraft({ ...draft, problemHypothesis: value })
            }
          />
          <TargetTextarea
            label="研究证据"
            value={draft.researchEvidence}
            onChange={(value) =>
              setDraft({ ...draft, researchEvidence: value })
            }
          />
          <label className="block">
            <span className="field-label">准备使用的已确认资产</span>
            <select
              value={draft.selectedAssetId}
              onChange={(event) =>
                setDraft({ ...draft, selectedAssetId: event.target.value })
              }
              className="text-field px-3.5 py-3 text-sm"
            >
              <option value="">稍后选择</option>
              {approvedAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.title}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <PrimaryButton onClick={addTarget}>
              <Plus size={15} /> 加入目标池
            </PrimaryButton>
          </div>
        </div>
      </section>

      {targets.length === 0 ? (
        <section className="panel">
          <EmptyPanel
            title="目标池还是空的"
            description="不要继续扩展框架。先加入第一个真实对象，并写清楚为什么是她/他。"
          />
        </section>
      ) : (
        <div className="space-y-4">
          {targets.map((target) => {
            const targetActions = actions.filter(
              (action) => action.targetId === target.id,
            );
            return (
              <article key={target.id} className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold">
                      {target.name} · {target.company}
                    </h2>
                    <p className="mt-1 text-[11px] text-[#777970]">
                      {target.role || "角色未填写"} · {target.channel || "渠道未填写"}
                    </p>
                  </div>
                  <select
                    value={target.status}
                    onChange={(event) =>
                      updateTarget(target.id, {
                        status: event.target.value as TargetRecord["status"],
                      })
                    }
                    className="rounded-lg border border-[#d9d3c8] bg-[#fffdf8] px-3 py-2 text-xs"
                  >
                    {TARGET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {TARGET_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4 p-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <InfoBlock title="联系理由" value={target.contactReason} />
                    <InfoBlock title="问题假设" value={target.problemHypothesis} />
                    <InfoBlock title="研究证据" value={target.researchEvidence} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <select
                      value={target.selectedAssetId}
                      onChange={(event) =>
                        updateTarget(target.id, {
                          selectedAssetId: event.target.value,
                        })
                      }
                      className="text-field px-3.5 py-3 text-sm"
                    >
                      <option value="">选择已人工确认的行动资产</option>
                      {approvedAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!target.selectedAssetId}
                      onClick={() => createAction(target)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d0c8bc] bg-[#fffdf8] px-4 py-3 text-xs font-semibold disabled:opacity-40"
                    >
                      建立待发送行动 <ArrowRight size={14} />
                    </button>
                  </div>

                  {targetActions.map((action) => {
                    const asset = assets.find((item) => item.id === action.assetId);
                    const diagnosis = [...diagnoses]
                      .reverse()
                      .find((item) => item.actionId === action.id);
                    return (
                      <div
                        key={action.id}
                        className="rounded-xl border border-[#e1dcd2] bg-[#fffdf8] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold">
                              {asset?.title || action.assetTitle || "行动材料"}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-[#8a8c84]">
                              {action.id}
                            </p>
                          </div>
                          <select
                            value={action.status}
                            onChange={(event) => {
                              const status = event.target.value as ActionRecord["status"];
                              updateAction(action.id, {
                                status,
                                sentAt:
                                  status === "sent" && !action.sentAt
                                    ? new Date().toISOString()
                                    : action.sentAt,
                              });
                              const targetStatus =
                                status === "sent"
                                  ? "contacted"
                                  : status === "replied"
                                    ? "responded"
                                    : status === "conversation"
                                      ? "conversation"
                                      : status === "trial"
                                        ? "trial"
                                        : status === "closed"
                                          ? "closed"
                                          : target.status;
                              updateTarget(target.id, { status: targetStatus });
                            }}
                            className="rounded-lg border border-[#d9d3c8] bg-[#fffdf8] px-3 py-2 text-xs"
                          >
                            {ACTION_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {ACTION_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <label className="block">
                            <span className="field-label">真实反馈类型</span>
                            <select
                              value={action.feedbackType}
                              onChange={(event) =>
                                updateAction(action.id, {
                                  feedbackType: event.target
                                    .value as ActionRecord["feedbackType"],
                                })
                              }
                              className="text-field px-3.5 py-3 text-sm"
                            >
                              {FEEDBACK_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {FEEDBACK_LABELS[type]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <TargetInput
                            label="下次跟进时间"
                            type="date"
                            value={action.followUpAt}
                            onChange={(value) =>
                              updateAction(action.id, { followUpAt: value })
                            }
                          />
                          <TargetTextarea
                            label="跟进必须带来的新信息"
                            value={action.followUpNewInformation}
                            onChange={(value) =>
                              updateAction(action.id, {
                                followUpNewInformation: value,
                              })
                            }
                          />
                          <TargetTextarea
                            label="对方真实回复 / 发生了什么"
                            value={action.feedbackText}
                            onChange={(value) =>
                              updateAction(action.id, { feedbackText: value })
                            }
                          />
                          <TargetTextarea
                            label="当前下一步"
                            value={action.nextStep}
                            onChange={(value) =>
                              updateAction(action.id, { nextStep: value })
                            }
                          />
                        </div>
                        <button
                          type="button"
                          disabled={
                            action.followUpCount >= 1 ||
                            !action.followUpNewInformation.trim()
                          }
                          onClick={() =>
                            updateAction(action.id, {
                              followUpCount: 1,
                              followUpAt:
                                action.followUpAt ||
                                new Date().toISOString().slice(0, 10),
                            })
                          }
                          className="mt-3 mr-2 inline-flex items-center gap-2 rounded-lg border border-[#d0c8bc] px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {action.followUpCount >= 1
                            ? "已记录唯一一次跟进"
                            : "记录一次有新信息的跟进"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onCalibrate(action.id)}
                          disabled={calibratingActionId === action.id}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#d0c8bc] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                        >
                          <RefreshCw
                            size={13}
                            className={
                              calibratingActionId === action.id
                                ? "animate-spin"
                                : ""
                            }
                          />
                          根据真实反馈校准
                        </button>
                        {diagnosis && (
                          <div className="mt-3 rounded-xl bg-[#f3eee6] p-4 text-xs leading-6">
                            <p className="font-semibold">
                              校准：{diagnosis.failureLayer}
                            </p>
                            <p className="mt-1">{diagnosis.diagnosis}</p>
                            <p className="mt-2">
                              <strong>下一步：</strong>{diagnosis.nextAction}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TargetInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="text-field px-3.5 py-3 text-sm"
      />
    </label>
  );
}

function TargetTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="text-field px-3.5 py-3 text-sm"
      />
    </label>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8f5ee] p-3">
      <p className="text-[11px] font-semibold text-[#777970]">{title}</p>
      <p className="mt-1 text-xs leading-5">{value || "尚未填写"}</p>
    </div>
  );
}
