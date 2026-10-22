const BASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : '/';
const withBase = (assetPath: string) =>
  `${BASE_URL.replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;

export type PlanetId = 'heritage' | 'nlp' | 'commercial' | 'awards';

export type StudioModelId =
  | 'dragon-relic'
  | 'lantern-relic'
  | 'all-in-one-mac'
  | 'retro-laptop'
  | 'ion-drive'
  | 'dslr-camera'
  | 'compact-camera'
  | 'iphone-real';

export interface StudioArtifactSpec {
  id: StudioModelId;
  name: string;
  modelUrl: string; // 100% real downloaded .glb files in /models/*.glb
  scaleMultiplier: number;
  initialRotation: [number, number, number];
  categoryTag: string;
  projectTitle: string;
  projectSubtitle: string;
  proofPoints: string[];
  metrics: { value: string; unit: string; label: string }[];
  externalLink?: { label: string; url: string };
}

export interface AwardCertificateItem {
  id: string;
  title: string;
  awardLevel: string;
  projectTitle: string;
  roleLine: string;
  issuer: string;
  certNo: string;
  date: string;
  imageUrl: string;
}

export interface PublicationProofItem {
  id: string;
  typeTag: string;
  title: string;
  venue: string;
  highlight: string;
}

export interface PlanetAstrometry {
  designation: string;
  coordinates: string;
  orbitSpecs: string;
  telemetryTag: string;
  signalFreq: string;
}

export interface PlanetData {
  id: PlanetId;
  index: string;
  name: string;
  englishName: string;
  introSubtitle: string;
  summary: string;
  astrometry: PlanetAstrometry;
  colorHex: string;
  position: [number, number, number];
  radius: number;
  isStaticGallery?: boolean;
  studioArtifacts: StudioArtifactSpec[];
}

export const PROFILE_DATA = {
  name: '殷添行',
  englishName: 'YIN TIANXING',
  roleTarget: 'DeepSeek · AI 跨界技术人才作品集',
  identityLine: '端侧推理优化 · 语言语境实证 · 文化遗产 3D · 商业视觉与产品闭环',
  phone: '18779129874',
  email: '449096895@qq.com',
  website: 'hongyuanpai2026.site',
  education:
    '江西师范大学 · 商务英语（2023.09 – 2027.06）· GPA 3.6/4.0（前 10%）· 专四良好 · CET-6 550+',
};

export const MAC_CORPUS_AND_ENGINE_VIEWS = [
  {
    id: 'aipc-voice-agent',
    tabLabel: '01. 联想 AI PC · 系统级语音唤醒与跨应用意图路由',
    screenTitle: 'LENOVO AI PC // SYSTEM VOICE AGENT ENTRY',
    screenSub: 'End-to-End ASR · Local Intent Router · Cross-App Action Execution',
    headlineMetric: '1,000-2,000万',
    secondaryMetric: '预计年端侧 License 营收 · 产品侧唯一负责人 · 0→1 全链路交付',
    sampleQuote:
      '[WakeWord -> Local ASR] "帮我整理本周会议纪要并发送至项目组" -> Multi-App Agent Dispatched',
    sampleAnalysis:
      '端侧模型能力边界评估 + 系统级全局语音浮窗交互 + Figma 高保真原型与前端可交互 Demo',
    footerNote: '独立主导联想 AI PC 系统级语音 Agent 入口从产品定义到可交互前端交付闭环',
  },
  {
    id: 'aipc-jev-pipeline',
    tabLabel: '02. 端侧 ASR/LLM/TTS 边界评估 & 客服 Jev 毫秒级分流',
    screenTitle: 'EDGE VOICE & JEV PIPELINE // Sub-Millisecond Routing',
    screenSub: 'ASR Confidence Gate · Local Sub-Vocab Router · Cloud Fallback',
    headlineMetric: '0.045 ms',
    secondaryMetric: '端侧前置意图分流 · 全员日常投入使用 · 显著削减云端大模型调用成本',
    sampleQuote:
      '[Jev Pre-Router] Intent Confidence 0.94 -> Local Fast-Path Executed (Cloud Bypassed)',
    sampleAnalysis:
      '语音大模型客服 Jev 毫秒级前置意图管线 + 小红书 AIGC 自动化审核工作流闭环',
    footerNote: '将端侧小模型边界评估与业务场景深度耦合，实现千万级商业化落地',
  },
  {
    id: 'reflex-engine',
    tabLabel: '03. Reflex 0.045ms 端侧算子 & 云知声前端意图识别',
    screenTitle: 'REFLEX EDGE ENGINE // Qwen3-0.6B + OpenJev',
    screenSub: 'Dynamic Sub-Vocab Slicing (-99.9% FLOPs) · RTX 4060 Verified',
    headlineMetric: '0.045 ms',
    secondaryMetric: '37.6× 实测加速 · Astra 90.12% 准确率 (15/15 评测域超越基线)',
    sampleQuote:
      'INT4 Quantized (241 MB) · Applied in Unisound AI Customer Service & Voice IME',
    sampleAnalysis:
      '应用于云知声 AI 客服项目与 AI 语音输入法项目，承担前端毫秒级用户意图识别',
    footerNote: '将语言意图理解压缩至 241MB 端侧亚毫秒级执行',
  },
];

export const REFLEX_ARCHITECTURES = [
  {
    id: 'astra',
    name: 'Astra 候选打分',
    accuracy: '90.12%',
    baselineDelta: '+20.97%',
    latencyMs: '0.045 ms',
    speedup: '37.6×',
    memoryMb: '241 MB',
  },
  {
    id: 'sol',
    name: 'Sol 逐域分类',
    accuracy: '87.64%',
    baselineDelta: '+18.49%',
    latencyMs: '0.062 ms',
    speedup: '28.4×',
    memoryMb: '248 MB',
  },
  {
    id: 'luna',
    name: 'Luna 极轻量核',
    accuracy: '84.30%',
    baselineDelta: '+15.15%',
    latencyMs: '0.031 ms',
    speedup: '44.2×',
    memoryMb: '196 MB',
  },
];

export const PHONE_SCREEN_PRESETS = [
  {
    id: 'app-huahua',
    title: 'Flower: Expense Tracker (App Store 5.0★)',
    kicker: 'App Store 已上架独立应用 · 原创花花 IP · 首月 MAU 150+',
  },
];

export const INITIAL_AWARD_CERTIFICATES: AwardCertificateItem[] = [
  {
    id: 'challenge-cup-ai',
    title: '第十九届“挑战杯”人工智能+专项赛',
    awardLevel: '国家级三等奖（铜奖）',
    projectTitle: '《红源 π——基于数智技术的革命文物活化与协同探究新范式》',
    roleLine: '团队第一顺位（殷添行 等）',
    issuer: '共青团中央、中国科协、教育部、中国社科院、中国工程院、全国学联',
    certNo: '2025-TZB19-RC30089H-FCDF99',
    date: '2025.11',
    imageUrl: withBase('/assets/aistudio/challenge_cup_ai_award.jpg'),
  },
  {
    id: 'business-elite-first',
    title: '全国高校商业精英挑战赛国际贸易竞赛',
    awardLevel: '国家级一等奖（总决赛）',
    projectTitle: '《深圳市永诺电器有限公司》（国际贸易业务模拟赛道 · 方案与展陈获企业商用）',
    roleLine: '团队第一顺位（殷添行 等）',
    issuer: '中国国际贸易促进委员会商业行业委员会、中国国际商会商业行业商会、中国商业经济学会',
    certNo: '2024-国贸总决赛-一等奖',
    date: '2024.05',
    imageUrl: withBase('/assets/aistudio/business_elite_first_prize.jpg'),
  },
  {
    id: 'cicsic-silver-1',
    title: '中国国际大学生创新大赛（2025）',
    awardLevel: '国家级银奖',
    projectTitle: '《迈思特—中国智能可穿戴设备出海品牌挑战者》',
    roleLine: '核心负责人 / 主答辩手（殷添行 等）',
    issuer: '教育部、中央统战部、国家发改委、工信部等十二部委',
    certNo: '202505426',
    date: '2025.10',
    imageUrl: withBase('/assets/aistudio/c3bff4c7edac1c4131b611746c97d4b3_e7ed658b.jpg'),
  },
  {
    id: 'cicsic-silver-2',
    title: '中国国际大学生创新大赛（2025）',
    awardLevel: '国家级银奖',
    projectTitle: '《贝图声—中国新潮蓝牙耳机的海外拓展突围者》',
    roleLine: '核心负责人 / 主答辩手（殷添行 等）',
    issuer: '教育部、中央统战部、国家发改委、工信部等十二部委',
    certNo: '202505516',
    date: '2025.10',
    imageUrl: withBase('/assets/aistudio/c2b19fdf535b8f2798be93ed2be9546c_f4417a4c.jpg'),
  },
  {
    id: 'cicsic-bronze',
    title: '中国国际大学生创新大赛（2025）',
    awardLevel: '国家级铜奖',
    projectTitle: '《菇往金来—新型杏鲍菇菌种赋能乡村振兴梦》',
    roleLine: '核心负责人（殷添行 等）',
    issuer: '教育部、中央统战部、国家发改委、工信部等十二部委',
    certNo: '202504354',
    date: '2025.10',
    imageUrl: withBase('/assets/aistudio/7182f3c1e62b7c528730d4902def7788_733b9de8.jpg'),
  },
];

export const PUBLICATION_AND_HONOR_PROOFS: PublicationProofItem[] = [
  {
    id: 'cssci-paper',
    typeTag: '中文核心期刊 · CSSCI 扩展版',
    title: '《新时代江西革命文物数字化保护利用研究》',
    venue: '发表于《中国博物馆》2025 年第 6 期',
    highlight: '第一作者团队核心成果，系统构建革命文物三维数字化与知识图谱活化范式',
  },
  {
    id: 'corpus-empirical-paper',
    typeTag: '跨语境计算语言学实证研究 (N=6,386)',
    title: '《十年外媒涉华报道跨语境情感极性与语用意图背离实证研究》',
    venue: '十年跨度 6,386 篇英文新闻 BERTopic 主题建模 × VADER vs Claude 实证',
    highlight:
      '实证揭示 VADER 表层词典极性与 Claude 真实语用意图相关系数仅 r = 0.348 (p < 0.001)，证明词典极性无法等价于语用意图',
  },
  {
    id: 'provincial-instruction',
    typeTag: '省级决策采纳实证',
    title: '江西革命文物数字化保护利用咨政报告',
    venue: '获江西省领导肯定性批示',
    highlight: '研究成果转化为省级文博数字化决策参考',
  },
  {
    id: 'national-dachuang',
    typeTag: '国家级课题立项结项',
    title: '国家级非遗—铅山连四纸现代性转化课题',
    venue: '国家级大学生创新创业训练计划（已结项）',
    highlight: '非遗传统工艺数字化归档与现代视觉传播转化',
  },
];

export const PLANETS: PlanetData[] = [
  {
    id: 'heritage',
    index: '01',
    name: '个人项目',
    englishName: 'PERSONAL PROJECTS',
    introSubtitle: '红源派文物评审与修复智能体 (RLVR/GRPO) · GitHub Actions 自动调查周报系统',
    summary: '红源派革命文物评审与修复方案智能体 (RLVR/GRPO) · GitHub Actions 多源自动调查与周报管线',
    astrometry: {
      designation: 'ORB-01 // RELIC-PRIME',
      coordinates: 'RA 05h 34m 31s · DEC +22°00′52″',
      orbitSpecs: 'a = 19.80 AU · e = 0.038 · i = 3.4°',
      telemetryTag: '117 3D RELICS · 10,651 KG FACTS · 120K+ ETL',
      signalFreq: 'RLVR / GRPO SEQUENTIAL POMDP',
    },
    colorHex: '#F59E0B',
    position: [-14, 1.5, -14],
    radius: 0.92,
    studioArtifacts: [
      {
        id: 'dragon-relic',
        name: '红源派 · 革命文物评审与修复方案智能体',
        modelUrl: withBase('/models/cloisonne_vase.glb'),
        scaleMultiplier: 1.78,
        initialRotation: [0.04, -0.35, 0],
        categoryTag: 'PROJECT 01 · 红源派 (hongyuanpai2026.site)',
        projectTitle: '利用 RLVR / GRPO 构建革命文物评审与修复方案智能体（类 CDSS 智能体）',
        projectSubtitle: '基于 Vue 3 + Three.js + 6 层知识图谱 (KG v6) 的文博序贯决策支持系统',
        proofPoints: [
          '开发 4DAGE 资产解析管线，自动化处理 73 件 OBJ 模型与高精贴图，完成 117 件文物 WebGL 三维交互展陈',
          '构建器物、事件、人物、时空、工艺、修复 6 层本体与 10,651 条知识图谱 (KG v6)，接入 RAG 提供可溯源证据',
          '设计基于 RLVR 与 GRPO 的文物修复三层奖励函数，转向序贯 POMDP 决策，打造类 CDSS 评审与修复方案智能体',
        ],
        metrics: [
          { value: '117', unit: '件', label: '3D 在线交互展示文物' },
          { value: '10,651', unit: '条', label: '6 层知识图谱 (KG v6) 事实' },
          { value: '73', unit: '件 OBJ', label: '4DAGE 管线自动化解析' },
          { value: '3', unit: '层奖励', label: 'RLVR / GRPO 修复决策奖励' },
        ],
        externalLink: {
          label: '访问线上平台 hongyuanpai2026.site ↗',
          url: 'https://hongyuanpai2026.site',
        },
      },
      {
        id: 'lantern-relic',
        name: 'GitHub Actions 自动调查爬取与周报管线',
        modelUrl: withBase('/models/black_vase.glb'),
        scaleMultiplier: 1.78,
        initialRotation: [0.04, 0.35, 0],
        categoryTag: 'PROJECT 02 · 多源自动调查爬取与智能周报管线',
        projectTitle: '基于 GitHub Actions 构建自动调查爬取与每周智能周报管线',
        projectSubtitle: '4 路异构源无人值守调查爬取 · 12万+ 条结构化沉淀 · 图聚类回测与自动出报',
        proofPoints: [
          '开发基于 GitHub Actions 定时调度的全自动 ETL 管线，无人值守爬取 4 路异构源，沉淀 120,000+ 条记录至 SQLite',
          '构建图聚类（Graph Clustering）信号聚合与多维规则回测模块，自动识别每周高频异动簇与关键趋势节点',
          '打通大模型研判与自动排版工作流，每周定时产出结构化深度周报，实现从调查爬取、聚类到出报的全自动闭环',
        ],
        metrics: [
          { value: '120,000+', unit: '条记录', label: '4 路异构源自动爬取沉淀' },
          { value: '4', unit: '路数据源', label: '异构信息无人值守调查' },
          { value: 'Weekly', unit: '自动周报', label: 'GitHub Actions 定时出报' },
          { value: 'Graph', unit: '图聚类', label: '异动信号聚合与回测闭环' },
        ],
      },
    ],
  },
  {
    id: 'nlp',
    index: '02',
    name: '实习项目',
    englishName: 'INTERNSHIP PROJECTS',
    introSubtitle: 'Reflex 0.045ms 端侧路由推理引擎 · 联想 AI PC 千万级系统级语音 Agent 入口',
    summary: 'Reflex 0.045ms 端侧路由推理引擎 (37.6× 加速) · 联想 AI PC 千万级系统级语音 Agent 入口',
    astrometry: {
      designation: 'ORB-02 // REFLEX-CORE',
      coordinates: 'RA 14h 29m 42s · DEC -62°40′46″',
      orbitSpecs: 'a = 17.26 AU · e = 0.051 · i = 2.8°',
      telemetryTag: '0.045ms LATENCY · 37.6× SPEEDUP · ¥10M-20M/YR',
      signalFreq: 'QWEN3-0.6B SUB-VOCAB SLICING',
    },
    colorHex: '#38BDF8',
    position: [14, 1.4, -10],
    radius: 0.94,
    studioArtifacts: [
      {
        id: 'ion-drive',
        name: 'Reflex 端侧推理引擎与算子加速',
        modelUrl: withBase('/models/ion_drive.glb'),
        scaleMultiplier: 1.7,
        initialRotation: [0.12, -0.55, 0],
        categoryTag: 'INTERNSHIP 01 · 端侧推理引擎与前端意图识别',
        projectTitle: '基于 Qwen3-0.6B 构建 Reflex 端侧路由推理引擎 & Dynamic Sub-Vocab Slicing',
        projectSubtitle: 'INT4 量化 + 词表裁剪至 241 MB · 应用于云知声 AI 客服与 AI 语音输入法前端意图识别',
        proofPoints: [
          '算子切片加速：基于 Qwen3-0.6B 仅计算候选 Token 输出投影切片，削减 99.9% 计算量，RTX 4060 实测延迟 0.045ms (37.6× 加速)',
          '路由架构实证：设计 Astra / Sol / Luna 三套端侧路由架构（Astra 15/15 评测域达 90.12% 准确率），INT4 量化压缩至 241 MB',
          '业务场景落地：应用于云知声（Unisound）AI 客服项目与 AI 语音输入法项目中，作为前端的用户意图识别与毫秒级分流模块',
        ],
        metrics: [
          { value: '0.045', unit: 'ms', label: 'Reflex 端侧算子延迟 (37.6× 加速)' },
          { value: '90.12', unit: '%', label: 'Astra 架构 15/15 评测域准确率' },
          { value: '-99.9', unit: '%', label: '输出投影计算量削减比例' },
          { value: '241', unit: 'MB', label: 'INT4 量化 + 词表裁剪后体积' },
        ],
      },
      {
        id: 'retro-laptop',
        name: '联想 AI PC 系统级语音 Agent 入口',
        modelUrl: withBase('/models/retro_laptop.glb'),
        scaleMultiplier: 1.62,
        initialRotation: [0.12, -0.38, 0],
        categoryTag: 'INTERNSHIP 02 · 联想 AI PC 系统级语音入口',
        projectTitle: '主导联想 AI PC 系统级语音 Agent 入口（预计年营收 1,000万–2,000万）',
        projectSubtitle: '产品侧唯一负责人 · 端侧模型能力边界评估 · Figma 高保真原型与前端可交互 Demo 交付',
        proofPoints: [
          '千万级商业闭环：担任联想 AI PC 系统级语音 Agent 入口产品侧唯一负责人，主导端侧 License 商业化落地（预计年营收 1,000万–2,000万）',
          '端侧模型边界评估：开展端侧 ASR / LLM / TTS 全链路能力边界评估与意图路由设计，定义系统级唤醒与跨应用指令执行规范',
          '0→1 全链路交付：独立完成从产品 PRD、Figma 全套高保真交互原型到前端可交互 Demo 的闭环交付，支撑核心客户验收签约',
        ],
        metrics: [
          { value: '1,000-2,000', unit: '万/年', label: '联想 AI PC 端侧 License 营收测算' },
          { value: '唯一', unit: '产品负责人', label: '独立主导产品定义与高保真交付' },
          { value: '0→1', unit: '全栈闭环', label: '模型评估 / Figma / 前端 Demo' },
          { value: 'System', unit: '系统级入口', label: 'AI PC 全局语音唤醒与跨应用 Agent' },
        ],
      },
    ],
  },
  {
    id: 'commercial',
    index: '03',
    name: '商业视觉与产品前端',
    englishName: 'SONY SIPS VISUAL & PRODUCT',
    introSubtitle: 'SONY A7R3 GM 专业影像 · 国赛总设计 & 出海展陈 · Flower 独立商业 App',
    summary: 'Sony SIPS 官方认证专业影像 · 5 项国赛路演总设计 & 出海展陈 · Flower 独立商业 App (5.0★)',
    astrometry: {
      designation: 'ORB-03 // OPTIC-SIPS',
      coordinates: 'RA 18h 36m 56s · DEC +38°47′01″',
      orbitSpecs: 'a = 28.35 AU · e = 0.064 · i = 5.1°',
      telemetryTag: 'SONY SIPS PRO · 5 NATIONAL AWARDS · APP 5.0★',
      signalFreq: 'FE 16-35MM F2.8 GM · IOS FULL-STACK',
    },
    colorHex: '#10B981',
    position: [15, -1.6, -24],
    radius: 0.9,
    studioArtifacts: [
      {
        id: 'dslr-camera',
        name: 'SONY A7R3 + FE 16-35mm F2.8 GM (.GLB)',
        modelUrl: withBase('/models/sony_a7r3.glb'),
        scaleMultiplier: 1.56,
        initialRotation: [0.14, 0.46, 0],
        categoryTag: 'VISUAL 01 · 商业视觉、国赛总设计与出海展陈',
        projectTitle: 'Sony SIPS 商业视觉 · 国赛总设计 & 企业出海展陈',
        projectSubtitle: 'SONY A7R3 + GM 16-35mm F2.8 真实扫描模型 · Sony Imaging PRO Support 官方认证',
        proofPoints: [
          '专业影像认证：持有 Sony Imaging PRO Support (SIPS) 官方专业会员认证，长期从事商业摄影与高管级视觉叙事创作',
          '国赛路演总设计：100% 独立主笔挑战杯 AI 专项赛、商业精英挑战赛、国创赛（2银1铜）等 5 项国赛全套路演 PPT 与视觉设计',
          '企业出海展会商用：全国商业精英挑战赛国贸赛国家级一等奖，制定的出海营销方案、线下展位与主视觉海报获企业实际商用',
        ],
        metrics: [
          { value: 'SIPS', unit: 'PRO', label: 'Sony 官方专业影像会员认证' },
          { value: '5', unit: '项国家级奖', label: '挑战杯 · 商业精英赛 · 国创赛' },
          { value: '100', unit: '%', label: '全部国赛路演视觉体系独立主笔' },
          { value: '100+', unit: '场次', label: '国家级竞赛中英双语/主答辩实战' },
        ],
      },
      {
        id: 'iphone-real',
        name: 'iPhone 18 Pro Max · Flower 独立应用 (.GLB)',
        modelUrl: withBase('/models/iphone_18_pro_max.glb'),
        scaleMultiplier: 1.78,
        initialRotation: [0.02, -0.22, 0],
        categoryTag: 'PRODUCT 02 · 独立商业应用研发、UI 与原创 IP 闭环',
        projectTitle: 'Flower: Expense Tracker (App Store 5.0★)',
        projectSubtitle: 'Apple iPhone 18 Pro Max 真实模型 · 0→1 独立完成产品研发、UI 设计、原创「花花」IP 与全球上架',
        proofPoints: [
          '0→1 独立全栈研发：独立完成 iOS 客户端架构、交互动效、本地数据持久化与 App Store 审核上架全流程，累计 2 款应用在架',
          '原创「花花」视觉 IP：自主设计整套「花花」品牌视觉与情感化记账组件体系，打造兼具极简效率与视觉温度的财务追踪体验',
          '真实用户口碑验证：Flower: Expense Tracker 获 App Store 5.0 满分评价，零买量推广实现首月自然月活（MAU）150+',
        ],
        metrics: [
          { value: '5.0★', unit: 'App Store', label: 'Flower: Expense Tracker 满分评分' },
          { value: '150+', unit: 'MAU', label: '零买量首月自然活跃用户' },
          { value: '2', unit: '款在架', label: 'App Store 独立商业应用' },
          { value: '100', unit: '%', label: '研发 / UI / 原创花花 IP 独立完成' },
        ],
      },
    ],
  },
  {
    id: 'awards',
    index: '04',
    name: '奖项证书与核心论文',
    englishName: 'AWARDS & PUBLICATIONS GALLERY',
    introSubtitle: '挑战杯 AI 专项赛 · 商业精英赛国一 · 国创赛 2银1铜 ·《中国博物馆》核心期刊',
    summary: '挑战杯 AI 专项赛 · 商业精英赛国一 · 国创赛 2银1铜 ·《中国博物馆》核心期刊与十年 6,386 篇语料实证',
    astrometry: {
      designation: 'ORB-04 // ARCHIVE-SIGMA',
      coordinates: 'RA 21h 12m 08s · DEC -11°16′24″',
      orbitSpecs: 'a = 34.98 AU · e = 0.029 · i = 1.9°',
      telemetryTag: '5 NATIONAL CERTS · CSSCI JOURNAL · N=6,386 CORPUS',
      signalFreq: 'R = 0.348 (P < 0.001) EMPIRICAL PROOF',
    },
    colorHex: '#A855F7',
    position: [-14, -1.8, -32],
    radius: 0.92,
    isStaticGallery: true,
    studioArtifacts: [],
  },
];

export const SKILL_CONSTELLATION = [
  {
    category: '模型、算法与语言学实证',
    items: [
      'Python / PyTorch',
      'Qwen3 / Gemma 端侧推理',
      'Dynamic Sub-Vocab Slicing',
      'RAG & 知识图谱 (KG v6)',
      'BERTopic 跨语境实证',
      'RLVR / GRPO 奖励设计',
      'ASR / TTS 语音链路',
      'Temperature Scaling / ECE 校准',
    ],
  },
  {
    category: '工程、商业产品与专业视觉',
    items: [
      '联想 AI PC 系统级语音入口',
      '云知声 AI 客服 & 语音输入法意图路由',
      'Three.js / WebGL / React / Vue 3',
      'SQLite / 12万+ 异构 ETL',
      'Sony SIPS 专业摄影',
      'Figma / PS / PR / AI',
      '中英双语学术写作与百场级主答辩',
    ],
  },
];
