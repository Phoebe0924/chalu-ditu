import type { OpportunityFormData, OpportunityPath } from "@/lib/types";

export type RegressionSample = {
  id: string;
  name: string;
  persona: string;
  form: OpportunityFormData;
  expected: {
    prioritize: OpportunityPath[];
    deprioritize: OpportunityPath[];
    requiredRisks: string[];
    forbiddenClaims: string[];
    requiredAssets: string[];
    requiredEvidenceGaps: string[];
  };
};

export const REGRESSION_SAMPLES: RegressionSample[] = [
  {
    id: "mother-ai-return",
    name: "妈妈重返 · AI 产品运营",
    persona: "妈妈重返职场",
    form: {
      profile: {
        workExperience:
          "6 年产品运营和项目推进经验，做过内容增长、产品运营 POC 和全球化平台运营。",
        nonstandardTransitions: "过去三年因生育、家庭照护和志愿服务暂停传统职场。",
        realWorkDuringTransition:
          "承担照护和志愿服务，最近系统使用 AI 工具推进真实产品项目。",
        projectsAndEvidence:
          "完成 LightPic AI 商品图工具的需求拆解、竞品分析、Prompt 设计、API 接入、部署和反馈复盘；有产品与过程文档，没有商业化结果。",
        desiredDirection:
          "AI 产品运营、AIGC 工具、AI 工作流、Founder’s Associate、远程运营。",
        fearedMisunderstandings: "空窗太久、不懂代码、项目不是自己做的。",
        constraints: "优先远程或时间灵活，需要兼顾家庭。",
        packagingBoundaries:
          "不包装成工程师，不夸大 LightPic 商业结果，不卖惨。",
      },
      scenario: {
        types: ["我有心仪公司", "我有一个想联系的老板/创始人", "我有一个作品/项目想展示"],
        targetCompanyOrPerson: "AI 应用创业公司创始人",
        targetRoleOrJd: "没有公开岗位",
        counterpartProblems: "产品案例、教程和用户场景表达较弱。",
        proposedCollaboration: "提出一个两周场景内容试点。",
        existingWork: "LightPic 产品与完整过程材料。",
      },
    },
    expected: {
      prioritize: ["提案式求职路径", "创始人约聊路径", "作品集吸引路径"],
      deprioritize: ["标准岗位路径"],
      requiredRisks: ["空窗", "非技术背景", "商业化不足"],
      forbiddenClaims: ["工程师", "商业成功", "增长专家"],
      requiredAssets: ["两周试点", "创始人私信", "约聊提纲"],
      requiredEvidenceGaps: ["外部用户反馈", "商业结果"],
    },
  },
  {
    id: "caregiver-return",
    name: "长期照护 · 项目重启",
    persona: "长期照护空窗",
    form: {
      profile: {
        workExperience: "曾做 5 年客户成功与培训交付，擅长需求澄清和跨团队协调。",
        nonstandardTransitions: "因照护生病家人离开全职工作四年。",
        realWorkDuringTransition: "承担照护，同时为社区组织过两次公益培训。",
        projectsAndEvidence: "有培训课件、参与者反馈和社区负责人推荐。",
        desiredDirection: "远程客户成功、用户教育或服务运营。",
        fearedMisunderstandings: "经历中断、节奏跟不上。",
        constraints: "只能远程，每天可稳定工作 6 小时。",
        packagingBoundaries: "不把照护包装成管理经验，不虚构业务指标。",
      },
      scenario: {
        types: ["我有一个弱关系对象", "我有一个作品/项目想展示"],
        targetCompanyOrPerson: "朋友认识的 SaaS 用户成功负责人",
        targetRoleOrJd: "",
        counterpartProblems: "新用户上手和培训材料可能不够系统。",
        proposedCollaboration: "先做一次用户教育材料诊断。",
        existingWork: "培训课件与反馈。",
      },
    },
    expected: {
      prioritize: ["弱关系引荐路径", "试单/项目路径"],
      deprioritize: ["标准岗位路径"],
      requiredRisks: ["时间限制", "经历中断"],
      forbiddenClaims: ["照护管理专家", "团队管理经验"],
      requiredAssets: ["弱关系消息", "低风险试单"],
      requiredEvidenceGaps: ["近期商业场景"],
    },
  },
  {
    id: "traditional-switch",
    name: "传统行业 · 数字化转行",
    persona: "传统行业转行",
    form: {
      profile: {
        workExperience: "8 年制造业供应链协调经验。",
        nonstandardTransitions: "希望转向数字化产品实施。",
        realWorkDuringTransition: "自学数据分析并为原团队做过库存看板。",
        projectsAndEvidence: "库存看板、需求访谈记录、同事使用反馈。",
        desiredDirection: "供应链 SaaS 实施或产品运营。",
        fearedMisunderstandings: "没有互联网公司背景。",
        constraints: "可接受混合办公，不接受长期出差。",
        packagingBoundaries: "不假装软件产品经理，不虚构降本数据。",
      },
      scenario: {
        types: ["我有一个具体 JD", "我有心仪公司"],
        targetCompanyOrPerson: "供应链 SaaS 公司",
        targetRoleOrJd: "实施顾问，需要行业经验和客户沟通。",
        counterpartProblems: "客户需求与产品配置之间容易失真。",
        proposedCollaboration: "",
        existingWork: "库存看板案例。",
      },
    },
    expected: {
      prioritize: ["标准岗位路径", "作品集吸引路径"],
      deprioritize: ["创始人约聊路径"],
      requiredRisks: ["软件交付经验不足"],
      forbiddenClaims: ["资深产品经理", "显著降本"],
      requiredAssets: ["岗位匹配", "案例结构"],
      requiredEvidenceGaps: ["外部客户实施"],
    },
  },
  {
    id: "freelance-fulltime",
    name: "自由职业 · 转全职",
    persona: "自由职业转全职",
    form: {
      profile: {
        workExperience: "五年自由内容策略与品牌项目经验。",
        nonstandardTransitions: "一直以项目制工作，现在考虑加入小团队。",
        realWorkDuringTransition: "持续为不同客户交付内容策略和编辑项目。",
        projectsAndEvidence: "三份公开案例和两封客户推荐。",
        desiredDirection: "早期品牌、内容产品或创始人办公室。",
        fearedMisunderstandings: "缺乏长期组织协作和管理经验。",
        constraints: "偏好远程，不接受无边界待命。",
        packagingBoundaries: "不夸大客户规模，不把项目协作说成团队管理。",
      },
      scenario: {
        types: ["我有一个作品/项目想展示", "我有一个想联系的老板/创始人"],
        targetCompanyOrPerson: "内容型产品创始人",
        targetRoleOrJd: "",
        counterpartProblems: "品牌表达和产品叙事不一致。",
        proposedCollaboration: "先做一个内容叙事诊断样板。",
        existingWork: "公开案例。",
      },
    },
    expected: {
      prioritize: ["作品集吸引路径", "试单/项目路径", "创始人约聊路径"],
      deprioritize: [],
      requiredRisks: ["长期组织协作"],
      forbiddenClaims: ["团队管理", "大客户"],
      requiredAssets: ["作品集结构", "试单设计"],
      requiredEvidenceGaps: ["长期协作"],
    },
  },
  {
    id: "failed-founder",
    name: "创业失败 · 重新进入市场",
    persona: "创业失败后重新求职",
    form: {
      profile: {
        workExperience: "创办过一个本地生活服务项目，之前有四年商务拓展经验。",
        nonstandardTransitions: "项目经营两年后停止，没有实现盈利。",
        realWorkDuringTransition: "完成客户访谈、渠道合作、交付和团队协调。",
        projectsAndEvidence: "访谈记录、合作方案、复盘文档；没有增长或盈利数据。",
        desiredDirection: "早期业务运营、Founder’s Associate 或项目负责人。",
        fearedMisunderstandings: "创业失败、成果不够好。",
        constraints: "可全职，优先小团队。",
        packagingBoundaries: "不把失败包装成成功，不虚构融资或收入。",
      },
      scenario: {
        types: ["我有一个想联系的老板/创始人", "我想先探索方向"],
        targetCompanyOrPerson: "本地服务或 AI 服务创业公司",
        targetRoleOrJd: "",
        counterpartProblems: "早期业务验证和跨角色推进。",
        proposedCollaboration: "希望先约聊并讨论短项目。",
        existingWork: "创业复盘。",
      },
    },
    expected: {
      prioritize: ["创始人约聊路径", "试单/项目路径"],
      deprioritize: [],
      requiredRisks: ["缺少商业结果", "失败项目"],
      forbiddenClaims: ["成功创业者", "盈利", "融资"],
      requiredAssets: ["创始人私信", "约聊提纲"],
      requiredEvidenceGaps: ["结果数据"],
    },
  },
  {
    id: "ai-explorer-low-evidence",
    name: "AI 转型 · 证据薄弱",
    persona: "普通人向 AI 转型",
    form: {
      profile: {
        workExperience: "三年行政与协调经验。",
        nonstandardTransitions: "希望转向 AI 相关工作。",
        realWorkDuringTransition: "上过几门 AI 课程，日常使用 ChatGPT。",
        projectsAndEvidence: "暂时没有完整项目或外部反馈。",
        desiredDirection: "AI 产品、AI 运营或 AI 工作流。",
        fearedMisunderstandings: "没有技术背景和项目。",
        constraints: "希望远程。",
        packagingBoundaries: "不假装 AI 专家或产品经理。",
      },
      scenario: {
        types: ["我想先探索方向"],
        targetCompanyOrPerson: "",
        targetRoleOrJd: "",
        counterpartProblems: "",
        proposedCollaboration: "",
        existingWork: "",
      },
    },
    expected: {
      prioritize: ["作品集吸引路径"],
      deprioritize: ["提案式求职路径", "标准岗位路径"],
      requiredRisks: ["证据不足", "方向过宽"],
      forbiddenClaims: ["AI 专家", "产品经理", "工作流专家"],
      requiredAssets: ["作品验证计划"],
      requiredEvidenceGaps: ["真实项目", "外部反馈"],
    },
  },
];
