import { NextResponse } from "next/server";
import { generateStructured, LlmConfigurationError } from "@/lib/llm";
import { buildActionPackageMessages } from "@/lib/prompts";
import { actionPackageSchema } from "@/lib/schemas";
import { validateAssessment, validateAssets } from "@/lib/structured";
import type {
  ActionAsset,
  OpportunityAssessment,
  OpportunityFormData,
  TargetRecord,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  form: OpportunityFormData;
  assessment: OpportunityAssessment;
  target?: TargetRecord;
};

function isValidPayload(value: unknown): value is Payload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<Payload>;
  return Boolean(payload.form?.profile && payload.form.scenario && payload.assessment?.id);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: "缺少候选人材料或已确认评估。" },
        { status: 400 },
      );
    }
    validateAssessment(body.assessment);

    const messages = buildActionPackageMessages(
      body.form,
      body.assessment,
      body.target,
    );
    let result = await generateStructured<{
      assets: Array<Partial<ActionAsset>>;
    }>({
      messages,
      schemaName: "action_package",
      schema: actionPackageSchema,
      reasoningEffort: "medium",
    });

    try {
      validateAssets(result.data.assets, body.assessment);
    } catch {
      result = await generateStructured<{
        assets: Array<Partial<ActionAsset>>;
      }>({
        messages: [
          ...messages,
          {
            role: "user",
            content:
              "上一次行动资产未通过业务校验。请重新生成 3-5 项：sourceEvidenceIds 和 claimChecks.sourceEvidenceIds 只能来自安全上下文，禁止使用 self_reported_isolated；每条 claimChecks.verificationLevel 必须等于所引用证据中的最低验证等级；self_reported_consistent 必须使用第一人称自陈，且材料可直接使用。",
          },
        ],
        schemaName: "action_package_retry",
        schema: actionPackageSchema,
        reasoningEffort: "medium",
      });
    }

    const validAssets = validateAssets(result.data.assets, body.assessment);
    const now = new Date().toISOString();
    const assets: ActionAsset[] = validAssets.map((asset) => ({
      ...asset,
      id: crypto.randomUUID(),
      status: "draft",
      createdAt: now,
      updatedAt: now,
    }));

    return NextResponse.json({ assets, model: result.model });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "行动包生成失败，请稍后重试。";
    const status = error instanceof LlmConfigurationError ? 503 : 500;
    console.error("Action package generation failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
