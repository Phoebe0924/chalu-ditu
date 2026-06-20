import { NextResponse } from "next/server";
import { generateStructured, LlmConfigurationError } from "@/lib/llm";
import { buildAssessmentMessages } from "@/lib/prompts";
import { assessmentSchema } from "@/lib/schemas";
import { validateAssessment } from "@/lib/structured";
import type {
  OpportunityAssessment,
  OpportunityFormData,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidForm(value: unknown): value is OpportunityFormData {
  if (!value || typeof value !== "object") return false;
  const form = value as Partial<OpportunityFormData>;
  return Boolean(
    form.profile &&
      form.scenario &&
      typeof form.profile.workExperience === "string" &&
      typeof form.profile.projectsAndEvidence === "string" &&
      typeof form.profile.desiredDirection === "string" &&
      Array.isArray(form.scenario.types),
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isValidForm(body)) {
      return NextResponse.json({ error: "输入格式无效。" }, { status: 400 });
    }

    if (
      !body.profile.workExperience.trim() ||
      !body.profile.projectsAndEvidence.trim() ||
      !body.profile.desiredDirection.trim() ||
      body.scenario.types.length === 0
    ) {
      return NextResponse.json(
        { error: "请填写工作经历、项目证据、目标方向，并选择机会场景。" },
        { status: 400 },
      );
    }

    const messages = buildAssessmentMessages(body);
    let result = await generateStructured<Partial<OpportunityAssessment>>({
      messages,
      schemaName: "opportunity_assessment",
      schema: assessmentSchema,
      reasoningEffort: "medium",
    });

    try {
      validateAssessment(result.data);
    } catch {
      result = await generateStructured<Partial<OpportunityAssessment>>({
        messages: [
          ...messages,
          {
            role: "user",
            content:
              "上一次输出未通过业务校验。请重新生成：六条路径各出现一次，rank 1-6 互不重复；每个证据条目必须是验证等级一致的原子事实，并提供具体 verificationBasis 与 verificationUpgradeSuggestion；所有价值主张引用真实 evidenceLedger ID，不伪造证据。",
          },
        ],
        schemaName: "opportunity_assessment_retry",
        schema: assessmentSchema,
        reasoningEffort: "medium",
      });
    }

    const assessment = validateAssessment(result.data);
    const now = new Date().toISOString();

    return NextResponse.json({
      assessment: {
        ...assessment,
        id: crypto.randomUUID(),
        createdAt: now,
        model: result.model,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "评估失败，请稍后重试。";
    const status = error instanceof LlmConfigurationError ? 503 : 500;
    console.error("Opportunity assessment failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
