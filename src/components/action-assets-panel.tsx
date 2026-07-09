"use client";

import { Check } from "lucide-react";
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
          title="先完成路径评估"
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
          description="回到路径评估页生成行动包。系统会根据推荐路径生成 3–5 份独立材料。"
        />
      </section>
    );
  }

  function updateAsset(id: string, patch: Partial<ActionAsset>) {
    onChange(
      assets.map((asset) =>
        asset.id === id
          ? {
              ...asset,
              ...patch,
              status:
                typeof patch.content === "string" &&
                patch.content !== asset.content
                  ? "draft"
                  : (patch.status ?? asset.status),
              updatedAt: new Date().toISOString(),
            }
          : asset,
      ),
    );
  }

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
      {assets.map((asset) => (
        <article key={asset.id} className="panel" style={{ overflow: "hidden" }}>
          <div className="section-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, width: "100%" }}>
              <div>
                <h2 className="section-header-title">{asset.title}</h2>
                <p style={{ marginTop: 2, fontSize: 12, color: "var(--ink-soft)" }}>
                  {asset.recommendedPath} · {asset.audience}
                </p>
              </div>
              <CopyButton text={asset.content} label="复制" />
            </div>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              borderRadius: "var(--radius-md)",
              background: "var(--paper-raised)",
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--ink-soft)",
            }}>
              <strong>推动的下一步：</strong>{asset.purpose}
            </div>
            <textarea
              value={asset.content}
              onChange={(event) =>
                updateAsset(asset.id, { content: event.target.value })
              }
              rows={14}
              className="text-field"
              style={{ fontSize: 13, fontFamily: "var(--font-serif)" }}
            />
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)" }}>证据引用</p>
                <p style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5 }}>
                  {asset.sourceEvidenceIds.join("、")}
                </p>
                <p style={{ marginTop: 2, fontSize: 10, color: "var(--ink-muted)" }}>
                  已自动排除"自述—孤证"条目
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)" }}>使用边界</p>
                <p style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5 }}>
                  {asset.guardrails.join("；")}
                </p>
              </div>
            </div>
            <div style={{
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line-light)",
              background: "white",
              padding: "12px 14px",
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)" }}>主张核查</p>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {(asset.claimChecks ?? []).length > 0 ? (
                  asset.claimChecks.map((check, index) => (
                    <div key={`${asset.id}-claim-${index}`} style={{
                      borderRadius: "var(--radius-sm)",
                      background: "var(--paper-raised)",
                      padding: "8px 10px",
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "var(--ink-soft)",
                    }}>
                      <p style={{ fontWeight: 600, color: "var(--ink)" }}>{check.claim}</p>
                      <p style={{ marginTop: 4 }}>
                        证据：{check.sourceEvidenceIds.join("、")} · 等级：{check.verificationLevel}
                      </p>
                      <p>边界：{check.expressionBoundary}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    旧版行动资产未生成主张核查；建议重新生成行动包。
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateAsset(asset.id, {
                  status: asset.status === "approved" ? "draft" : "approved",
                })
              }
              className={`btn ${asset.status === "approved" ? "btn-secondary" : "btn-ghost"}`}
              style={{
                width: "100%",
                justifyContent: "center",
                border: asset.status === "approved" ? "1px solid var(--sage-light)" : "1px solid var(--line)",
                background: asset.status === "approved" ? "var(--sage-light)" : "transparent",
                color: asset.status === "approved" ? "var(--sage-dark)" : "var(--ink-soft)",
              }}
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
