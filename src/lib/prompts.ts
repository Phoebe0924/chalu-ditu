import type {
  ActionAsset,
  ActionRecord,
  EvidenceLedgerItem,
  OpportunityAssessment,
  OpportunityFormData,
  TargetRecord,
} from "@/lib/types";

const SHARED_RULES = `你服务的是非标履历人群。只使用用户提供的事实，不伪造经历、数据、客户、收入、技术能力或商业结果。
不得卖惨，不把生育、照护、修行或空窗硬包装成商业成果，不把会使用 AI 编程工具的人自动描述为工程师。
必须指出风险、证据缺口和不能承诺的边界。不得为了鼓励而虚高评价。
标准岗位不是默认答案，必须考虑提案、作品集、弱关系、试单和创始人约聊。
输出必须是严格 JSON，不要 Markdown、代码围栏、注释或解释。`;

function value(value: string) {
  return value.trim() || "（未提供）";
}

export function buildAssessmentMessages(data: OpportunityFormData) {
  const { profile, scenario } = data;
  const system = `你是非标机会评估顾问。先判断事实、证据和边界，再评价机会路径。${SHARED_RULES}

输出对象必须符合以下结构：
{
  "identityPositioning": {
    "notStandardCandidateFor": "不适合被当作哪类标准候选人",
    "opportunityTalentType": "更像哪类机会型人才",
    "positioningStatement": "一句克制定位"
  },
  "marketValues": [{"value":"价值","reasonToEngage":"为什么值得见面或试用","evidenceIds":["e1"]}],
  "evidenceLedger": [{
    "id":"e1","fact":"用户明确提供的事实","valueClaim":"可对外表达的价值",
    "evidence":["证据"],
    "verificationLevel":"verified|self_reported_consistent|self_reported_isolated",
    "verificationBasis":"为何属于该等级的具体依据",
    "verificationUpgradeSuggestion":"提升验证等级的最快具体行动",
    "proves":"能证明什么","doesNotProve":"不能证明什么",
    "missingEvidence":["待补证"],"boundary":"表达边界"
  }],
  "pathEvaluations": [{
    "path":"标准岗位路径|提案式求职路径|作品集吸引路径|弱关系引荐路径|试单/项目路径|创始人约聊路径",
    "rank":1,"priority":"high|medium|low","fitSignals":["适配信号"],"risks":["风险"],
    "evidenceGaps":["证据缺口"],"rationale":"推荐或排序理由","whyNotNow":"暂不优先的理由；若优先则说明适用条件"
  }],
  "recommendedPaths":["按优先级列出前2至3条路径"],
  "targetProfile":{"people":["人"],"companies":["公司"],"teams":["团队"],"avoid":["暂避对象"]},
  "entryDesign":{"openingAngle":"开口角度","counterpartQuestions":["对方关心的问题"],"valueOffered":["可提供价值"],"lowestRiskStep":"最低风险下一步"},
  "riskBoundaries":["风险与边界"],
  "evidenceToCollectNext":["下一步应补的证据"],
  "immediateNextStep":"今天能完成的一项可核验行动"
}

验证等级判定规则：
- verified：用户提供了第三方可检查的具体材料，例如可访问链接、可演示产物、明确命名的文档、截图、第三方反馈；该事实必须与材料直接对应。明确命名的项目/产品，加上明确列出的可查看过程材料（如需求文档、竞品分析、部署产物、反馈记录），属于具体可检查对象，即使底稿未直接粘贴 URL，也可判为 verified，但 verificationBasis 必须提示实际对外使用前仍要确认材料可访问。
- self_reported_consistent：没有外部可检查材料，但该具体事实在两个或更多底稿字段中相互吻合，没有冲突。
- self_reported_isolated：事实只在一个字段出现，既无外部材料，也不能被其他字段交叉支撑。
- 保守原则：混合事实按最低等级处理；更好的做法是拆成多个原子事实。不得仅因用户写了“有证据”就自动判为 verified，必须指出具体可检查对象。

路径 priority 表示“建议优先级”，不是成功概率或模型置信度。排序必须同时考虑：目标场景匹配、可用证据强度、进入成本、现实限制与风险。rationale 必须明确写出这些依据。

硬性要求：pathEvaluations 必须恰好包含六条路径，rank 为 1-6 且不重复。证据账本至少 3 项；每个 e 条目只容纳一个验证等级一致的原子事实，混合事实必须拆分；每项价值必须引用真实 evidenceIds。`;

  const user = `候选人档案：
- 工作经历：${value(profile.workExperience)}
- 非标转折：${value(profile.nonstandardTransitions)}
- 非标期间真实行动：${value(profile.realWorkDuringTransition)}
- 项目与证据：${value(profile.projectsAndEvidence)}
- 想靠近的方向：${value(profile.desiredDirection)}
- 担心被误解：${value(profile.fearedMisunderstandings)}
- 现实限制：${value(profile.constraints)}
- 包装边界：${value(profile.packagingBoundaries)}

机会场景：
- 类型：${scenario.types.join("；") || "（未选择）"}
- 公司或对象：${value(scenario.targetCompanyOrPerson)}
- 岗位或 JD：${value(scenario.targetRoleOrJd)}
- 对方问题假设：${value(scenario.counterpartProblems)}
- 合作方向：${value(scenario.proposedCollaboration)}
- 已有作品：${value(scenario.existingWork)}

请完成结构化机会评估。材料不足时降低确定性并明确补证，不要自行补写事实。`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function buildActionPackageMessages(
  form: OpportunityFormData,
  assessment: OpportunityAssessment,
  target?: TargetRecord,
) {
  const system = `你是非标机会行动设计顾问。根据已经确认的结构化评估，为最高优先级路径生成可直接编辑和发送的材料。${SHARED_RULES}

输出必须是 JSON 对象，顶层结构为：
{
  "assets": [
    {
      "type":"founder_message|weak_tie_message|pilot_proposal|portfolio_structure|job_match|trial_design|conversation_guide|interview_prep",
      "title":"材料名称",
      "recommendedPath":"六条路径之一",
      "audience":"使用对象",
      "purpose":"这份材料要推动的最低风险下一步",
      "content":"完整可用正文，使用必要占位符",
      "sourceEvidenceIds":["引用的证据账本 id"],
      "guardrails":["发送或使用前必须核对的边界"]
    }
  ]
}

验证等级约束：
- verified：可以使用肯定陈述，作为核心支撑。
- self_reported_consistent：只能使用第一人称自陈句式，例如“我做过……”“我参与过……”，不得写成第三方已确认成果，也不得作为对外承诺的唯一依据。
- self_reported_isolated：不会出现在本次安全上下文中，禁止推测、补写或以任何形式放入对外文案。
- sourceEvidenceIds 只能引用安全上下文提供的证据 ID。
- packagingBoundaries 只用于约束生成，不得原样写入面向外部的 content；例如“不要包装成工程师”不能变成对外自我介绍的一部分。

生成 3-5 项资产。若推荐提案式求职，必须有完整两周试点，写清目标、范围、第一周、第二周、交付物、双方投入、成功信号和不包含什么。
若推荐创始人约聊，必须有创始人私信和 20 分钟约聊提纲。
若推荐作品集吸引，必须有作品展示结构。所有内容都必须能回溯到 evidenceLedger。`;

  const user = `可用于对外材料的安全上下文：
${JSON.stringify(buildSafeActionContext(form, assessment))}

${target ? `当前目标对象：\n${JSON.stringify(target)}` : "当前没有指定单一目标对象，请保留清晰占位符。"}

请生成行动资产。`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

function buildSafeActionContext(
  form: OpportunityFormData,
  assessment: OpportunityAssessment,
) {
  const evidenceLedger = assessment.evidenceLedger.filter(
    (item) => item.verificationLevel !== "self_reported_isolated",
  );
  const allowedEvidenceIds = new Set(evidenceLedger.map((item) => item.id));
  const marketValues = assessment.marketValues
    .map((item) => ({
      ...item,
      evidenceIds: item.evidenceIds.filter((id) => allowedEvidenceIds.has(id)),
    }))
    .filter((item) => item.evidenceIds.length > 0);

  return {
    scenario: form.scenario,
    constraints: form.profile.constraints,
    packagingBoundaries: form.profile.packagingBoundaries,
    recommendedPaths: assessment.recommendedPaths,
    targetProfile: assessment.targetProfile,
    riskBoundaries: assessment.riskBoundaries,
    evidenceLedger: evidenceLedger.map(
      (item): EvidenceLedgerItem => ({
        ...item,
      }),
    ),
    marketValues,
  };
}

export function buildCalibrationMessages(input: {
  assessment: OpportunityAssessment;
  target: TargetRecord;
  action: ActionRecord;
  asset?: ActionAsset;
}) {
  const system = `你是机会反馈校准顾问。你的任务不是重写整份职业报告，而是根据一次真实行动判断当前卡在哪一层，并给出下一步。${SHARED_RULES}

失败层级只能是：
- activation：尚未完成发送
- target：对象选择或问题假设不匹配
- opening：开口没有建立相关性
- evidence：对方需要更多可信证据
- request：请求过重、过轻或不清楚
- collaboration：合作范围或试点设计不成立
- delivery：试点交付后没有延续
- progress：已经获得有效机会进展

输出结构：
{
  "failureLayer":"上述枚举",
  "diagnosis":"克制诊断",
  "signals":["依据"],
  "preserve":["应保留的部分"],
  "change":["应改变的部分"],
  "nextAction":"一个具体可核验的下一步",
  "revisedAsset":{"title":"可选修订材料标题","content":"仅在确有必要时提供修订正文"}
}`;

  return [
    { role: "system" as const, content: system },
    {
      role: "user" as const,
      content: `评估：${JSON.stringify(input.assessment)}
目标对象：${JSON.stringify(input.target)}
行动记录：${JSON.stringify(input.action)}
使用材料：${JSON.stringify(input.asset ?? null)}

请定位失败层级并给出最小修正。`,
    },
  ];
}
