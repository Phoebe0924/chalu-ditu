import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

function loadPlaywright() {
  try {
    return createRequire(import.meta.url)("playwright");
  } catch {
    if (!process.env.PLAYWRIGHT_NODE_MODULES) {
      throw new Error(
        "Playwright is not installed. Run `npm install -D playwright` or set PLAYWRIGHT_NODE_MODULES to a node_modules directory that contains playwright.",
      );
    }
    return createRequire(
      path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"),
    )("playwright");
  }
}

const { chromium } = loadPlaywright();

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3000";
const outputDir = path.join(process.cwd(), "docs", "screenshots");
const storageKey = "nonstandard-opportunity-workspace-v3";
const now = "2026-07-04T00:00:00.000Z";

const form = {
  profile: {
    workExperience:
      "6 年产品运营和项目推进经验，做过内容增长、产品运营 POC 和全球化平台运营。",
    nonstandardTransitions: "过去三年因生育、家庭照护和志愿服务暂停传统职场。",
    realWorkDuringTransition: "承担照护和志愿服务，最近系统使用 AI 工具推进真实产品项目。",
    projectsAndEvidence:
      "完成 LightPic AI 商品图工具的需求拆解、竞品分析、Prompt 设计、API 接入、部署和反馈复盘；有产品与过程文档，没有商业化结果。",
    desiredDirection: "AI 产品运营、AIGC 工具、AI 工作流、Founder’s Associate、远程运营。",
    fearedMisunderstandings: "空窗太久、不懂代码、项目不是自己做的。",
    constraints: "优先远程或时间灵活，需要兼顾家庭。",
    packagingBoundaries: "不包装成工程师，不夸大 LightPic 商业结果，不卖惨。",
  },
  scenario: {
    types: ["我有心仪公司", "我有一个想联系的老板/创始人", "我有一个作品/项目想展示"],
    targetCompanyOrPerson: "AI 应用创业公司创始人",
    targetRoleOrJd: "没有公开岗位",
    counterpartProblems: "产品案例、教程和用户场景表达较弱。",
    proposedCollaboration: "提出一个两周场景内容试点。",
    existingWork: "LightPic 产品与完整过程材料。",
  },
};

const assessment = {
  id: "demo-assessment",
  createdAt: now,
  model: "demo",
  identityPositioning: {
    notStandardCandidateFor: "不宜被当作传统程序员或只投递 JD 的标准候选人",
    opportunityTalentType: "AI 应用场景运营与试点推进型人才",
    positioningStatement:
      "有产品运营和项目推进背景，正在用可展示的 AI 工具项目进入提案式合作机会。",
  },
  marketValues: [
    {
      value: "能把 AI 工具从想法拆成可讨论、可试点的流程",
      reasonToEngage: "适合用低风险试点验证案例、教程和用户场景表达",
      evidenceIds: ["e1", "e4"],
    },
  ],
  evidenceLedger: [
    {
      id: "e1",
      fact: "LightPic AI 商品图工具有需求拆解、竞品分析、Prompt 设计、API 接入、部署和反馈复盘材料。",
      valueClaim: "AI 工具项目推进",
      evidence: ["LightPic 项目", "产品与过程文档"],
      verificationLevel: "verified",
      verificationBasis: "存在明确项目与过程材料；对外使用前仍需确认材料可访问。",
      verificationUpgradeSuggestion: "整理一个可公开查看的 LightPic 案例页。",
      proves: "能推进一个 AI 工具项目的产品化过程。",
      doesNotProve: "不能证明独立工程能力或商业化结果。",
      missingEvidence: ["外部用户反馈", "可公开链接"],
      boundary: "表达为项目推进与 AI 工具使用，不包装成工程师。",
    },
    {
      id: "e2",
      fact: "候选人自述有 6 年产品运营和项目推进经验。",
      valueClaim: "产品运营背景",
      evidence: ["用户自述"],
      verificationLevel: "self_reported_isolated",
      verificationBasis: "年限只出现在工作经历字段，暂无简历或第三方材料直接支撑。",
      verificationUpgradeSuggestion: "补充公开履历、简历或可核验项目清单。",
      proves: "只能作为背景线索。",
      doesNotProve: "不能作为已验证资历。",
      missingEvidence: ["简历", "证明人", "公开履历"],
      boundary: "不在外联文案中强调年限。",
    },
    {
      id: "e3",
      fact: "过去三年因生育、家庭照护和志愿服务暂停传统职场。",
      valueClaim: "非连续履历需要解释边界",
      evidence: ["用户自述"],
      verificationLevel: "self_reported_isolated",
      verificationBasis: "空窗原因来自用户自述，不应包装成商业成果。",
      verificationUpgradeSuggestion: "准备 2 句话说明现实边界和当前可投入节奏。",
      proves: "解释履历连续性变化。",
      doesNotProve: "不能证明商业能力。",
      missingEvidence: ["当前可投入时间"],
      boundary: "克制说明，不卖惨。",
    },
    {
      id: "e4",
      fact: "近期系统使用 AI 工具推进真实产品项目。",
      valueClaim: "AI 工具学习转化为实践",
      evidence: ["非标期间真实行动", "LightPic 项目材料"],
      verificationLevel: "self_reported_consistent",
      verificationBasis: "该事实在真实行动与项目证据中互相支撑。",
      verificationUpgradeSuggestion: "补充工具使用日志或项目复盘截图。",
      proves: "能把 AI 学习转化为项目实践。",
      doesNotProve: "不能证明专业软件工程能力。",
      missingEvidence: ["工具使用过程记录"],
      boundary: "用第一人称自陈表达。",
    },
  ],
  pathEvaluations: [
    {
      path: "提案式求职路径",
      rank: 1,
      priority: "high",
      fitSignals: ["没有公开岗位", "有具体问题观察", "有两周试点方向"],
      risks: ["项目商业化不足"],
      evidenceGaps: ["外部用户反馈"],
      rationale: "目标是 AI 应用创业公司，适合先用低风险试点建立相关性。",
      whyNotNow: "需要先确认目标对象和案例材料可展示。",
    },
    {
      path: "创始人约聊路径",
      rank: 2,
      priority: "high",
      fitSignals: ["对象是创始人", "问题假设具体"],
      risks: ["请求过重"],
      evidenceGaps: ["目标公司研究证据"],
      rationale: "适合用 20 分钟约聊验证问题是否真实。",
      whyNotNow: "避免一上来要求岗位。",
    },
    {
      path: "作品集吸引路径",
      rank: 3,
      priority: "medium",
      fitSignals: ["有 LightPic 过程材料"],
      risks: ["材料未公开"],
      evidenceGaps: ["案例页"],
      rationale: "作品集可降低对方理解成本。",
      whyNotNow: "先做最小案例页即可。",
    },
    {
      path: "弱关系引荐路径",
      rank: 4,
      priority: "medium",
      fitSignals: ["可用于后续扩展"],
      risks: ["关系链不足"],
      evidenceGaps: ["引荐对象"],
      rationale: "适合作为第二波动作。",
      whyNotNow: "当前场景优先创始人直连。",
    },
    {
      path: "试单/项目路径",
      rank: 5,
      priority: "medium",
      fitSignals: ["可以设计小交付"],
      risks: ["范围需压小"],
      evidenceGaps: ["成功信号"],
      rationale: "可与提案式路径合并为两周试点。",
      whyNotNow: "需要先获得约聊或回复。",
    },
    {
      path: "标准岗位路径",
      rank: 6,
      priority: "low",
      fitSignals: ["方向相关"],
      risks: ["空窗", "非技术背景"],
      evidenceGaps: ["JD 匹配证明"],
      rationale: "当前没有公开岗位，不应默认投递。",
      whyNotNow: "先用提案和作品打开入口。",
    },
  ],
  recommendedPaths: ["提案式求职路径", "创始人约聊路径", "作品集吸引路径"],
  targetProfile: {
    people: ["AI 应用创业公司创始人", "增长或用户教育负责人"],
    companies: ["早期 AI 应用公司", "有复杂功能但案例表达弱的工具产品"],
    teams: ["小团队", "需要场景表达和用户教育的团队"],
    avoid: ["只看传统技术面试的团队", "要求立即全职高强度坐班的岗位"],
  },
  entryDesign: {
    openingAngle: "我观察到你们功能完整，但案例、教程和用户场景表达还有提升空间。",
    counterpartQuestions: ["你观察到了什么？", "两周能交付什么？", "你不能做什么？"],
    valueOffered: ["场景案例梳理", "教程结构诊断", "两周试点交付"],
    lowestRiskStep: "先进行 20 分钟约聊，确认是否值得做两周试点。",
  },
  riskBoundaries: ["空窗期需要克制解释", "非技术背景不能包装成工程师", "LightPic 没有商业化结果"],
  evidenceToCollectNext: ["LightPic 公开案例页", "外部用户反馈", "目标公司研究截图"],
  immediateNextStep: "今天整理一个目标公司观察和 3 条案例表达问题。",
};

const assets = [
  {
    id: "asset-1",
    type: "founder_message",
    title: "创始人私信",
    recommendedPath: "创始人约聊路径",
    audience: "AI 应用创业公司创始人",
    purpose: "争取一次 20 分钟约聊",
    content:
      "你好，我关注到你们产品功能已经比较完整，但案例、教程和用户场景表达似乎还有进一步梳理空间。我最近用 AI 工具做过一个 LightPic 商品图项目，整理过需求、竞品、Prompt 和反馈复盘。想请教你们现在是否也在处理用户理解成本的问题。如果合适，我可以先用 20 分钟交流一个很小的两周试点思路。",
    sourceEvidenceIds: ["e1", "e4"],
    claimChecks: [
      {
        claim: "做过 LightPic 商品图项目过程材料",
        sourceEvidenceIds: ["e1"],
        verificationLevel: "verified",
        expressionBoundary: "可肯定陈述项目过程，但不说商业结果。",
      },
      {
        claim: "近期系统使用 AI 工具推进项目",
        sourceEvidenceIds: ["e4"],
        verificationLevel: "self_reported_consistent",
        expressionBoundary: "保持第一人称自陈，不包装成工程师。",
      },
    ],
    guardrails: ["发送前确认 LightPic 材料可展示", "不夸大商业结果"],
    status: "approved",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "asset-2",
    type: "pilot_proposal",
    title: "两周试点提案",
    recommendedPath: "提案式求职路径",
    audience: "AI 应用创业公司",
    purpose: "把约聊推进到低风险试点",
    content:
      "两周试点目标：围绕一个核心用户场景，重写 1 个案例页和 1 组教程结构。第一周完成用户场景拆解、竞品表达对照和案例框架；第二周完成案例初稿、教程大纲和复盘建议。不包含增长承诺、工程开发或商业结果承诺。",
    sourceEvidenceIds: ["e1"],
    claimChecks: [
      {
        claim: "能做案例和教程结构试点",
        sourceEvidenceIds: ["e1"],
        verificationLevel: "verified",
        expressionBoundary: "只承诺文档和结构交付，不承诺增长。",
      },
    ],
    guardrails: ["控制范围", "先确认对方真实问题"],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  },
];

const targets = [
  {
    id: "target-1",
    name: "某 AI 应用创始人",
    company: "Demo AI Tools",
    role: "Founder",
    channel: "LinkedIn / 即刻 / 邮件",
    relationship: "none",
    problemHypothesis: "产品功能多，但案例、教程和用户场景表达较弱。",
    contactReason: "目标公司正在做 AI 工具，问题与 LightPic 过程经验相关。",
    researchEvidence: "官网功能页复杂，案例页较少。",
    selectedAssetId: "asset-1",
    status: "responded",
    createdAt: now,
    updatedAt: now,
  },
];

const actions = [
  {
    id: "action-1",
    targetId: "target-1",
    assetId: "asset-1",
    assetTitle: "创始人私信",
    contentSnapshot: assets[0].content,
    channel: "LinkedIn",
    status: "replied",
    sentAt: now,
    followUpAt: "",
    followUpCount: 0,
    followUpNewInformation: "",
    feedbackType: "substantive_reply",
    feedbackText: "对方回复愿意看看案例结构。",
    nextStep: "发送 1 页 LightPic 案例结构，并提出 20 分钟约聊。",
    reflection: "对方对案例表达问题有兴趣。",
    createdAt: now,
    updatedAt: now,
  },
];

const diagnoses = [
  {
    id: "diagnosis-1",
    actionId: "action-1",
    createdAt: now,
    model: "demo",
    failureLayer: "progress",
    diagnosis: "已经获得有效机会进展。",
    signals: ["对方愿意看案例结构"],
    preserve: ["具体问题观察", "低风险请求"],
    change: ["补充更可视化的案例材料"],
    nextAction: "发送 1 页案例结构，并约 20 分钟交流。",
    revisedAsset: null,
  },
];

function workspace(activeView) {
  return {
    version: 3,
    startedAt: now,
    form,
    assessment,
    assets,
    targets,
    actions,
    diagnoses,
    activeView,
    updatedAt: now,
  };
}

async function screenshot(browser, activeView, filename, scrollY = 0) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  await context.addInitScript(
    ([key, data]) => {
      window.localStorage.setItem(key, JSON.stringify(data));
    },
    [storageKey, workspace(activeView)],
  );
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => document.body.innerText.includes("已启用本地自动保存"),
    { timeout: 5_000 },
  );
  if (process.env.DEBUG_SCREENSHOTS) {
    const loadedView = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw).activeView : null;
    }, storageKey);
    console.log(filename, loadedView);
  }
  if (scrollY > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(300);
  }
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: false,
  });
  await context.close();
}

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_EXECUTABLE ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});

await screenshot(browser, "input", "input-form.png");
await screenshot(browser, "assessment", "path-assessment.png");
await screenshot(browser, "assessment", "evidence-ledger.png", 760);
await screenshot(browser, "assets", "action-assets.png");
await screenshot(browser, "pipeline", "feedback-pipeline.png");

await browser.close();
console.log(`Screenshots written to ${outputDir}`);
