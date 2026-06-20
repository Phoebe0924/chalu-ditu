import { NextResponse } from "next/server";
import { generateStructured, LlmConfigurationError } from "@/lib/llm";
import { buildCalibrationMessages } from "@/lib/prompts";
import { feedbackDiagnosisSchema } from "@/lib/schemas";
import { validateDiagnosis } from "@/lib/structured";
import type {
  ActionAsset,
  ActionRecord,
  FeedbackDiagnosis,
  OpportunityAssessment,
  TargetRecord,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  assessment: OpportunityAssessment;
  target: TargetRecord;
  action: ActionRecord;
  asset?: ActionAsset;
};

function isValidPayload(value: unknown): value is Payload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<Payload>;
  return Boolean(payload.assessment?.id && payload.target?.id && payload.action?.id);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: "缺少评估、目标对象或行动记录。" },
        { status: 400 },
      );
    }

    const result = await generateStructured<Partial<FeedbackDiagnosis>>({
      messages: buildCalibrationMessages(body),
      schemaName: "feedback_diagnosis",
      schema: feedbackDiagnosisSchema,
      reasoningEffort: "medium",
    });
    const diagnosis = validateDiagnosis(result.data);

    return NextResponse.json({
      diagnosis: {
        ...diagnosis,
        id: crypto.randomUUID(),
        actionId: body.action.id,
        createdAt: new Date().toISOString(),
        model: result.model,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "反馈校准失败，请稍后重试。";
    const status = error instanceof LlmConfigurationError ? 503 : 500;
    console.error("Feedback calibration failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
