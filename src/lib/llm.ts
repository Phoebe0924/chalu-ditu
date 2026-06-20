type ModelMessage = {
  role: "system" | "user";
  content: string;
};

type ReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh";

type JsonSchema = Record<string, unknown>;

type ResponsesPayload = {
  id?: string;
  status?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  error?: {
    code?: string;
    message?: string;
  };
};

export class LlmConfigurationError extends Error {}

function getLlmConfig() {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new LlmConfigurationError(
      "尚未配置 API Key。请复制 .env.example 为 .env.local，并填写 LLM_API_KEY。",
    );
  }

  return {
    apiKey,
    baseUrl: (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
    model: process.env.LLM_MODEL || "gpt-5.5",
  };
}

function extractOutputText(payload: ResponsesPayload) {
  if (payload.output_text?.trim()) return payload.output_text.trim();

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.refusal) {
        throw new Error(`模型拒绝生成：${content.refusal}`);
      }
      if (content.type === "output_text" && content.text?.trim()) {
        return content.text.trim();
      }
    }
  }

  return "";
}

export async function generateStructured<T>({
  messages,
  schemaName,
  schema,
  reasoningEffort = "medium",
}: {
  messages: ModelMessage[];
  schemaName: string;
  schema: JsonSchema;
  reasoningEffort?: ReasoningEffort;
}) {
  const config = getLlmConfig();
  const body = JSON.stringify({
    model: config.model,
    input: messages,
    reasoning: {
      effort: reasoningEffort,
    },
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch(`${config.baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
        signal: controller.signal,
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as ResponsesPayload;

      if (!response.ok) {
        const detail =
          payload.error?.message ||
          `模型服务请求失败（HTTP ${response.status}）。请检查 API 配置。`;
        if (
          response.status === 404 ||
          payload.error?.code === "model_not_found" ||
          /model.*not found|does not exist|access/i.test(detail)
        ) {
          throw new LlmConfigurationError(
            `当前 API 项目无法使用模型「${config.model}」。请检查模型名称、项目权限和 API 计费状态。原始错误：${detail}`,
          );
        }
        throw new Error(detail);
      }

      const content = extractOutputText(payload);
      if (!content) {
        throw new Error(
          `模型未返回结构化内容（状态：${payload.status || "unknown"}）。`,
        );
      }

      try {
        return {
          data: JSON.parse(content) as T,
          model: config.model,
        };
      } catch {
        throw new Error("模型返回内容未能解析为 JSON。");
      }
    } catch (error) {
      if (error instanceof LlmConfigurationError) throw error;

      const isAbort = error instanceof Error && error.name === "AbortError";
      const isTransientNetworkError =
        error instanceof TypeError && /fetch failed/i.test(error.message);

      if (
        attempt === 1 &&
        (isAbort || isTransientNetworkError)
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        continue;
      }

      if (isAbort) {
        throw new Error("模型连续两次响应超过 120 秒，请稍后重试。");
      }
      if (isTransientNetworkError) {
        throw new Error("连接模型服务时网络中断，自动重试后仍未恢复。");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("模型请求未完成。");
}
