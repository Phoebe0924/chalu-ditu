"use client";

import { Check, PencilLine } from "lucide-react";
import type { ActionAsset, OpportunityAssessment } from "@/lib/types";
import { CopyButton, EmptyPanel } from "@/components/workspace-ui";

type Props = {
  assessment: OpportunityAssessment | null;
  assets: ActionAsset[];
  onChange: (assets: ActionAsset[]) => void;
};

export function ActionAssetsPanel({ assessment, assets, onChange }: Props) {
  if (!assessment) {
    return (
      <section className="panel">
        <EmptyPanel
          title="先完成机会评估"
          description="行动材料必须建立在已确认的路径判断和证据账本上。"
        />
      </section>
    );
  }

  if (assets.length === 0) {
    return (
      <section className="panel">
        <EmptyPanel
          title="还没有行动资产"
          description="回到机会评估页生成行动包。系统会根据推荐路径生成 3–5 份独立材料。"
        />
      </section>
    );
  }

  function updateAsset(id: string, patch: Partial<ActionAsset>) {
    onChange(
      assets.map((asset) =>
        asset.id === id
          ? { ...asset, ...patch, updatedAt: new Date().toISOString() }
          : asset,
      ),
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {assets.map((asset) => (
        <article key={asset.id} className="panel overflow-hidden">
          <div className="border-b border-[#e2ddd3] bg-[#faf7f1] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <PencilLine size={14} className="text-[#9e4d35]" />
                  <h2 className="text-sm font-semibold">{asset.title}</h2>
                </div>
                <p className="mt-1 text-[11px] text-[#777970]">
                  {asset.recommendedPath} · {asset.audience}
                </p>
              </div>
              <CopyButton text={asset.content} label="复制" />
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="rounded-xl bg-[#f8f5ee] p-3 text-xs leading-5 text-[#55584f]">
              <strong>推动的下一步：</strong>{asset.purpose}
            </div>
            <textarea
              value={asset.content}
              onChange={(event) =>
                updateAsset(asset.id, { content: event.target.value })
              }
              rows={16}
              className="text-field px-3.5 py-3 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold text-[#777970]">证据引用</p>
                <p className="mt-1 text-xs leading-5">
                  {asset.sourceEvidenceIds.join("、")}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#777970]">使用边界</p>
                <p className="mt-1 text-xs leading-5">
                  {asset.guardrails.join("；")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateAsset(asset.id, {
                  status: asset.status === "approved" ? "draft" : "approved",
                })
              }
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                asset.status === "approved"
                  ? "border-[#87a08d] bg-[#e4ebe4] text-[#46604f]"
                  : "border-[#d9d3c8] bg-[#fffdf8] text-[#66695f]"
              }`}
            >
              {asset.status === "approved" && <Check size={14} />}
              {asset.status === "approved" ? "已人工确认，可用于外联" : "人工确认事实与边界"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
