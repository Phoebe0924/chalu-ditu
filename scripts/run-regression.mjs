const baseUrl = (process.env.REGRESSION_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const runsPerSample = Number(process.env.REGRESSION_RUNS || 3);
const selectedSampleId = process.env.REGRESSION_SAMPLE_ID || "";

async function request(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `${path} failed with ${response.status}`);
  }
  return payload;
}

function includesAny(serialized, values) {
  return values.some((value) => serialized.includes(value));
}

function evaluate(sample, assessment, assets) {
  const sorted = [...assessment.pathEvaluations].sort((a, b) => a.rank - b.rank);
  const topThree = sorted.slice(0, 3).map((item) => item.path);
  const serializedAssessment = JSON.stringify(assessment);
  const serializedAssets = JSON.stringify(assets);
  const serializedAssetContent = assets.map((asset) => asset.content).join("\n");
  const failures = [];
  const verificationLevels = new Set(
    assessment.evidenceLedger.map((item) => item.verificationLevel),
  );
  const isolatedEvidenceIds = new Set(
    assessment.evidenceLedger
      .filter((item) => item.verificationLevel === "self_reported_isolated")
      .map((item) => item.id),
  );

  if (
    assessment.evidenceLedger.some(
      (item) =>
        !item.verificationLevel ||
        !item.verificationBasis?.trim() ||
        !item.verificationUpgradeSuggestion?.trim(),
    )
  ) {
    failures.push("证据条目缺少验证等级、依据或补证行动");
  }
  if (
    assets.some((asset) =>
      asset.sourceEvidenceIds.some((id) => isolatedEvidenceIds.has(id)),
    )
  ) {
    failures.push("行动资产引用了自述孤证");
  }
  for (const level of sample.expected.requiredVerificationLevels || []) {
    if (!verificationLevels.has(level)) {
      failures.push(`缺少验证等级：${level}`);
    }
  }
  for (const check of sample.expected.factVerificationChecks || []) {
    const matchingFacts = assessment.evidenceLedger.filter((item) =>
      [
        item.fact,
        item.valueClaim,
        item.evidence.join(" "),
        item.verificationBasis,
      ]
        .join(" ")
        .includes(check.factIncludes),
    );
    if (
      matchingFacts.length === 0 ||
      matchingFacts.some(
        (item) => !check.allowedLevels.includes(item.verificationLevel),
      )
    ) {
      failures.push(`事实验证等级不符合预期：${check.factIncludes}`);
    }
  }

  if (!sample.expected.prioritize.some((path) => topThree.includes(path))) {
    failures.push("预期优先路径未进入前三");
  }
  if (
    sample.expected.deprioritize.some((path) => {
      const item = sorted.find((candidate) => candidate.path === path);
      return item && item.rank <= 2;
    })
  ) {
    failures.push("应降级路径进入前二");
  }
  if (!includesAny(serializedAssessment, sample.expected.requiredRisks)) {
    failures.push("未覆盖必要风险");
  }
  if (!includesAny(serializedAssessment, sample.expected.requiredEvidenceGaps)) {
    failures.push("未提出必要补证");
  }
  if (!includesAny(serializedAssets, sample.expected.requiredAssets)) {
    failures.push("缺少必要行动材料");
  }
  for (const claim of sample.expected.forbiddenClaims) {
    const unsafePatterns = [`我是${claim}`, `作为${claim}`, `资深${claim}`, `成功${claim}`];
    if (
      unsafePatterns.some((pattern) =>
        serializedAssetContent.includes(pattern),
      )
    ) {
      failures.push(`出现高风险正向身份声明：${claim}`);
    }
  }

  return failures;
}

const samplePayload = await request("/api/regression-samples");
const samples = selectedSampleId
  ? samplePayload.samples.filter((sample) => sample.id === selectedSampleId)
  : samplePayload.samples;
if (samples.length === 0) {
  throw new Error(`No regression sample matched: ${selectedSampleId}`);
}
const results = [];

for (const sample of samples) {
  for (let run = 1; run <= runsPerSample; run += 1) {
    try {
      const { assessment } = await request("/api/assess", sample.form);
      const { assets } = await request("/api/action-package", {
        form: sample.form,
        assessment,
      });
      const failures = evaluate(sample, assessment, assets);
      results.push({
        sample: sample.name,
        run,
        passed: failures.length === 0,
        failures,
      });
      console.log(
        `${failures.length ? "FAIL" : "PASS"} ${sample.name} #${run}${
          failures.length ? ` — ${failures.join("；")}` : ""
        }`,
      );
    } catch (error) {
      results.push({
        sample: sample.name,
        run,
        passed: false,
        failures: [error instanceof Error ? error.message : String(error)],
      });
      console.log(`ERROR ${sample.name} #${run} — ${String(error)}`);
    }
  }
}

const passed = results.filter((result) => result.passed).length;
const truthfulnessFailures = results.filter((result) =>
  result.failures.some((failure) => failure.includes("高风险正向身份声明")),
).length;
const passRate = results.length ? passed / results.length : 0;

console.log(
  `\nSummary: ${passed}/${results.length} passed (${Math.round(passRate * 100)}%), truthfulness failures: ${truthfulnessFailures}`,
);

if (passRate < 0.9 || truthfulnessFailures > 0) {
  process.exitCode = 1;
}
