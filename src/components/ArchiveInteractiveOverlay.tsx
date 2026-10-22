import React, { useRef, useState } from 'react';
import {
  PLANETS,
  MAC_CORPUS_AND_ENGINE_VIEWS,
  REFLEX_ARCHITECTURES,
  INITIAL_AWARD_CERTIFICATES,
  PUBLICATION_AND_HONOR_PROOFS,
  AwardCertificateItem,
  PlanetId,
  StudioModelId,
} from '../data/portfolioData';

interface ArchiveInteractiveOverlayProps {
  worldMode: 'intro' | 'white-space';
  focusedPlanetId: PlanetId;
  activeStudioModelId: StudioModelId;
  isLoadingModel: boolean;
  macViewIndex: number;
  reflexArchIndex: number;
  slicingEnabled: boolean;
  phonePresetIndex: number;
  hasCustomScreenshot: boolean;
  onSelectPlanetInIntro: (planetId: PlanetId) => void;
  onEnterWhiteSpace: (planetId: PlanetId) => void;
  onReturnToIntro: () => void;
  onSelectStudioModel: (modelId: StudioModelId) => void;
  onChangeMacView: (idx: number) => void;
  onChangeReflexArch: (idx: number) => void;
  onToggleSlicing: () => void;
  onChangePhonePreset: (idx: number) => void;
  onUploadPhoneScreenshot: (file: File) => void;
  onClearPhoneScreenshot: () => void;
  customRelicNames?: Partial<Record<'dragon-relic' | 'lantern-relic', string>>;
  onUploadRelicModel?: (
    slotId: 'dragon-relic' | 'lantern-relic',
    files: FileList
  ) => void;
  isPlanetHovered?: boolean;
  onInstrumentHoverChange?: (hovered: boolean) => void;
}

export const ArchiveInteractiveOverlay: React.FC<
  ArchiveInteractiveOverlayProps
> = ({
  worldMode,
  focusedPlanetId,
  activeStudioModelId,
  isLoadingModel,
  macViewIndex,
  reflexArchIndex,
  slicingEnabled,
  phonePresetIndex,
  hasCustomScreenshot,
  onSelectPlanetInIntro,
  onEnterWhiteSpace,
  onReturnToIntro,
  onSelectStudioModel,
  onChangeMacView,
  onChangeReflexArch,
  onToggleSlicing,
  onChangePhonePreset,
  onUploadPhoneScreenshot,
  onClearPhoneScreenshot,
  customRelicNames,
  onUploadRelicModel,
  isPlanetHovered = false,
  onInstrumentHoverChange,
}) => {
  const phoneFileInputRef = useRef<HTMLInputElement | null>(null);
  const certUploadInputRef = useRef<HTMLInputElement | null>(null);
  const relicSlot1InputRef = useRef<HTMLInputElement | null>(null);
  const relicSlot2InputRef = useRef<HTMLInputElement | null>(null);

  const [certificates, setCertificates] = useState<AwardCertificateItem[]>(
    INITIAL_AWARD_CERTIFICATES
  );
  const [lightboxCert, setLightboxCert] =
    useState<AwardCertificateItem | null>(null);
  const [isLocalInfoHovered, setIsLocalInfoHovered] = useState<boolean>(false);

  const currentPlanet =
    PLANETS.find((p) => p.id === focusedPlanetId) || PLANETS[0];
  const currentPlanetIndex = PLANETS.findIndex((p) => p.id === focusedPlanetId);

  const currentArtifact =
    currentPlanet.studioArtifacts.find((a) => a.id === activeStudioModelId) ||
    currentPlanet.studioArtifacts[0];

  const handlePrevPlanet = () => {
    const prevIdx = (currentPlanetIndex - 1 + PLANETS.length) % PLANETS.length;
    onSelectPlanetInIntro(PLANETS[prevIdx].id);
  };

  const handleNextPlanet = () => {
    const nextIdx = (currentPlanetIndex + 1) % PLANETS.length;
    onSelectPlanetInIntro(PLANETS[nextIdx].id);
  };

  const handleUploadMoreCertificates = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added: AwardCertificateItem[] = [];
    Array.from(files).forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      added.push({
        id: `custom-cert-${Date.now()}-${idx}`,
        title: cleanName,
        awardLevel: '实证奖状原件',
        projectTitle: '新增上传获奖证书 / 实证扫描件',
        roleLine: '殷添行 作品集实证档案',
        issuer: '官方颁发证书原件',
        certNo: 'VERIFIED',
        date: '2025–2026',
        imageUrl: url,
      });
    });
    setCertificates((prev) => [...prev, ...added]);
  };

  /* =========================================================================
     WORLD 1: COSMIC INTRO (MINIMALIST PLANETARY SWITCHER — EXACT ORIGINAL 4-LINE STATE)
     ========================================================================= */
  if (worldMode === 'intro') {
    return (
      <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-end items-center px-6 pb-14">
        <div
          onMouseEnter={() => onInstrumentHoverChange?.(true)}
          onMouseLeave={() => onInstrumentHoverChange?.(false)}
          className="text-center max-w-2xl pointer-events-auto space-y-3"
        >
          <div className="flex items-center justify-center gap-6 text-xs tracking-[0.2em] text-slate-400 spatial-text-glow">
            <button
              type="button"
              onClick={handlePrevPlanet}
              className="hover:text-white transition-colors cursor-pointer px-2 py-1"
              aria-label="上一个星球"
            >
              ← PREV
            </button>
            <span style={{ color: currentPlanet.colorHex }}>
              {currentPlanet.index} / 04 · {currentPlanet.englishName}
            </span>
            <button
              type="button"
              onClick={handleNextPlanet}
              className="hover:text-white transition-colors cursor-pointer px-2 py-1"
              aria-label="下一个星球"
            >
              NEXT →
            </button>
          </div>

          <h1
            onClick={() => onEnterWhiteSpace(currentPlanet.id)}
            className="font-display text-4xl md:text-6xl font-extrabold text-white tracking-tight spatial-title-glow cursor-pointer hover:text-sky-300 transition-colors"
          >
            {currentPlanet.name}
          </h1>

          <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed tracking-wider spatial-text-glow">
            {currentPlanet.introSubtitle}
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onEnterWhiteSpace(currentPlanet.id)}
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold tracking-[0.16em] text-sky-400 hover:text-sky-300 underline underline-offset-8 decoration-sky-400/70 transition-colors cursor-pointer spatial-text-glow"
            >
              <span>点击进入展厅 · ENTER SPACE ↗</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     WORLD 2A: SPACE 04 — SWISS ARCHIVAL GRID FOR 5 NATIONAL CERTIFICATES & CORE PAPERS
     ========================================================================= */
  if (currentPlanet.isStaticGallery || focusedPlanetId === 'awards') {
    return (
      <div className="fixed inset-0 z-10 pointer-events-auto overflow-y-auto no-scrollbar px-6 md:px-10 xl:px-14 pt-24 pb-24 text-slate-900">
        <div className="max-w-[1620px] mx-auto space-y-12">
          {/* Swiss Top Datum Header */}
          <div className="border-t-2 border-slate-950 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 text-xs font-mono-tabular tracking-[0.14em] text-slate-500">
                <button
                  type="button"
                  onClick={onReturnToIntro}
                  className="text-slate-950 font-bold hover:text-sky-600 underline underline-offset-4 cursor-pointer"
                >
                  ← 返回星际导航
                </button>
                <span>/</span>
                <span>04 · SWISS ARCHIVE OF NATIONAL AWARDS & PUBLICATIONS</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl xl:text-4xl font-extrabold text-slate-950 tracking-tight">
                国家级竞赛奖状与核心期刊论文陈列
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-xs xl:text-sm font-mono-tabular text-slate-600">
                01 / 国家级竞赛证书原件 ({certificates.length} 份) · 点击任意证书放大检视
              </span>
              <input
                ref={certUploadInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUploadMoreCertificates(e.target.files)}
              />
              <button
                type="button"
                onClick={() => certUploadInputRef.current?.click()}
                className="text-xs xl:text-sm font-semibold tracking-wider text-sky-600 hover:text-sky-700 underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
              >
                + 投递补充原件
              </button>
            </div>
          </div>

          {/* SECTION 01: 5-Column Swiss Museum Grid for All 5 National Competition Certificates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 xl:gap-7 items-start">
            {certificates.map((cert, index) => (
              <div
                key={cert.id}
                onClick={() => setLightboxCert(cert)}
                className="group cursor-pointer border-t-2 border-slate-900/80 pt-3.5 flex flex-col justify-between space-y-3"
              >
                {/* Swiss Index & Award Level Bar */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono-tabular text-xs xl:text-sm font-bold text-slate-400">
                    0{index + 1}
                  </span>
                  <span className="text-xs xl:text-sm font-bold text-amber-700">
                    {cert.awardLevel}
                  </span>
                </div>

                {/* Uniform Museum Mat Frame */}
                <div className="w-full aspect-[4/3] overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-3 transition-transform duration-200 group-hover:-translate-y-0.5 shadow-sm">
                  <img
                    src={cert.imageUrl}
                    alt={cert.title}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Swiss Structured Metadata */}
                <div className="space-y-1.5 pt-1">
                  <h2 className="text-sm xl:text-[15px] font-bold text-slate-950 leading-snug group-hover:text-sky-600 transition-colors">
                    {cert.title}
                  </h2>
                  <p className="text-xs xl:text-[13px] text-slate-600 leading-relaxed">
                    {cert.projectTitle}
                  </p>
                  <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs text-slate-500 font-mono-tabular">
                    <span className="truncate">{cert.roleLine}</span>
                    <span className="shrink-0">{cert.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 02: Core Academic Publications, Policy Instruction & National Research Project */}
          <div className="border-t-2 border-slate-950 pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="text-xs xl:text-sm font-mono-tabular font-bold tracking-[0.12em] text-slate-950">
                02 / ACADEMIC PUBLICATIONS & OFFICIAL ADOPTION · 核心期刊论文、语料实证与省级批示
              </div>
              <div className="text-xs xl:text-sm text-slate-500">
                学术发表、咨政批示与国家级大创结项档案
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 xl:gap-8">
              {PUBLICATION_AND_HONOR_PROOFS.map((pub, idx) => (
                <div
                  key={pub.id}
                  className="border-t border-slate-300 pt-4 space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono-tabular text-xs font-bold text-slate-400">
                      02.{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-sky-600">
                      {pub.typeTag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-950 leading-snug">
                    {pub.title}
                  </h3>
                  <p className="text-xs xl:text-[13.5px] font-medium text-slate-700">
                    {pub.venue}
                  </p>
                  <p className="text-xs xl:text-[13.5px] text-slate-600 leading-relaxed">
                    {pub.highlight}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 03: Swiss 12-Column Empirical Corpus Thesis Module */}
          <div className="border-t-2 border-slate-950 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
              {/* Left 5 Columns: Thesis Title & Lead */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="text-xs xl:text-sm font-mono-tabular font-bold tracking-[0.12em] text-sky-600">
                  03 / EMPIRICAL LINGUISTICS THESIS · 跨语境语料库实证
                </div>
                <h2 className="font-display text-xl xl:text-[26px] font-extrabold text-slate-950 tracking-tight leading-snug">
                  十年 6,386 篇外媒涉华语料实证：表层词典极性与深层语用意图背离研究
                </h2>
                <p className="text-xs xl:text-[14px] text-slate-600 leading-relaxed">
                  构建十年跨度（6,386 篇）涉华英文报道语料库，采用 BERTopic 动态主题演化建模，系统对比传统词典（VADER）与大模型深层语境标注（Claude）在外交让步与转折语境下的显著背离。
                </p>
              </div>

              {/* Right 7 Columns: 4 Swiss Metric Cells + 2 Findings */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-b border-slate-300 divide-y sm:divide-y-0 sm:divide-x divide-slate-300">
                  <div className="p-4 space-y-1">
                    <div className="font-mono-tabular text-2xl xl:text-3xl font-bold text-slate-950">
                      r = 0.348
                    </div>
                    <div className="text-xs font-semibold text-sky-600">
                      极性相关系数
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      VADER 与 Claude 语境显著背离
                    </p>
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="font-mono-tabular text-2xl xl:text-3xl font-bold text-slate-950">
                      6,386
                    </div>
                    <div className="text-xs font-semibold text-sky-600">
                      篇 (10年跨度)
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      外媒涉华英文自建实证语料库
                    </p>
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="font-mono-tabular text-2xl xl:text-3xl font-bold text-slate-950">
                      p &lt; 0.001
                    </div>
                    <div className="text-xs font-semibold text-sky-600">
                      统计学显著性
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      跨语境极性背离高度显著
                    </p>
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="font-mono-tabular text-2xl xl:text-3xl font-bold text-slate-950">
                      BERTopic
                    </div>
                    <div className="text-xs font-semibold text-sky-600">
                      动态主题演化
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      经贸、半导体与绿色转型追踪
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <div className="text-xs xl:text-sm font-bold text-slate-950 font-mono-tabular">
                      03.1 / 词典极性 (Lexicon) ≠ 真实语用意图 (Pragmatics)
                    </div>
                    <p className="text-xs xl:text-[13.5px] text-slate-600 leading-relaxed">
                      政经报道高频使用「先扬后抑」让步转折句式。传统 VADER 词典受表层积极词触发误判为正向（+0.42），深层语境模型则准确捕获转折后的真实叙事意图（-0.38）。
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs xl:text-sm font-bold text-slate-950 font-mono-tabular">
                      03.2 / 学理到工程：驱动端侧语义意图路由研究
                    </div>
                    <p className="text-xs xl:text-[13.5px] text-slate-600 leading-relaxed">
                      实证揭示浅层词典规则无法胜任复杂语境意图识别，从学理上直接驱动了基于轻量化预训练模型（Qwen3-0.6B）与动态子词表切片的端侧意图路由引擎研发。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Screen Certificate Lightbox Modal */}
        {lightboxCert && (
          <div
            onClick={() => setLightboxCert(null)}
            className="fixed inset-0 z-50 bg-slate-950/85 flex flex-col items-center justify-center p-6 md:p-12 cursor-zoom-out"
          >
            <img
              src={lightboxCert.imageUrl}
              alt={lightboxCert.title}
              className="max-w-full max-h-[82vh] object-contain shadow-2xl"
            />
            <div className="mt-4 text-center text-white space-y-1">
              <div className="text-sm md:text-base font-bold">
                {lightboxCert.title} · {lightboxCert.awardLevel}
              </div>
              <div className="text-xs text-slate-300">
                {lightboxCert.projectTitle} | {lightboxCert.roleLine}（点击任意处关闭）
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================================
     WORLD 2B: SPACES 01, 02, 03 — BALANCED SWISS GRID (480px LEFT | 3D STAGE | 440px RIGHT)
     ========================================================================= */
  if (!currentArtifact) return null;

  const isComputerModel =
    currentArtifact.id === 'all-in-one-mac' ||
    currentArtifact.id === 'retro-laptop';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-center px-6 md:px-10 xl:px-14 pt-20 pb-12 text-slate-900">
      {isLoadingModel && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 text-xs font-mono-tabular tracking-[0.16em] text-slate-600 bg-white/90 backdrop-blur px-3.5 py-1.5 border border-slate-200">
          正在载入 3D 展品 (.GLB)...
        </div>
      )}

      {/* BALANCED SWISS 3-ZONE CONTAINER: Generous 480px Left & 445px Right Columns with Clean Center 3D Frame */}
      <div className="w-full max-w-[1620px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* LEFT SWISS COLUMN: Comfortable Reading Width (440px-485px) & High Legibility */}
        <aside className="w-full lg:w-[435px] xl:w-[485px] shrink-0 pointer-events-auto bg-[#F8FAFC]/85 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none">
          {/* Top Datum Bar */}
          <div className="border-t-2 border-slate-950 pt-3.5 flex items-center justify-between text-xs font-mono-tabular tracking-[0.12em] text-slate-500">
            <span className="font-semibold text-slate-700">
              {currentPlanet.index} / 04 · {currentPlanet.englishName}
            </span>
            <button
              type="button"
              onClick={onReturnToIntro}
              className="text-slate-950 font-bold hover:text-sky-600 underline underline-offset-4 cursor-pointer"
            >
              ← 返回星际导航
            </button>
          </div>

          {/* Kicker, Title & Subtitle */}
          <div className="pt-4 pb-5 space-y-2.5">
            <div className="text-xs font-mono-tabular font-bold tracking-[0.08em] text-sky-600">
              {currentArtifact.categoryTag}
            </div>
            <h1 className="font-display text-2xl xl:text-[29px] font-extrabold text-slate-950 tracking-tight leading-[1.28]">
              {currentArtifact.projectTitle}
            </h1>
            <p className="text-sm xl:text-[14.5px] text-slate-600 leading-relaxed">
              {currentArtifact.projectSubtitle}
            </p>
          </div>

          {/* Swiss Modular Specification Rows (01 / 02 / 03) — Enlarged to 14px-15px for Effortless Reading */}
          <div className="divide-y divide-slate-200 border-t border-b border-slate-300">
            {currentArtifact.proofPoints.map((pt, idx) => (
              <div
                key={idx}
                className="py-3.5 xl:py-4 grid grid-cols-[32px_1fr] gap-2.5 items-baseline"
              >
                <span className="font-mono-tabular text-xs xl:text-[13px] font-bold text-slate-400">
                  0{idx + 1}
                </span>
                <p className="text-sm xl:text-[14.5px] text-slate-700 leading-[1.68]">
                  {pt}
                </p>
              </div>
            ))}
          </div>

          {/* External Link Row if Present */}
          {currentArtifact.externalLink && (
            <div className="pt-3.5">
              <a
                href={currentArtifact.externalLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs xl:text-sm font-bold text-sky-600 hover:text-sky-700 underline underline-offset-4"
              >
                {currentArtifact.externalLink.label}
              </a>
            </div>
          )}

          {/* Swiss Segmented Artifact Switcher (Placed Directly in Left Column — Never Covered by OS Dock) */}
          {currentPlanet.studioArtifacts.length > 1 && (
            <div className="pt-5 space-y-2">
              <div className="text-xs font-mono-tabular font-bold tracking-[0.08em] text-slate-500">
                SWITCH ARTIFACT · 切换当前展厅 3D 模型 ({currentPlanet.studioArtifacts.length} 项)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentPlanet.studioArtifacts.map((art, i) => {
                  const active = art.id === currentArtifact.id;
                  const customName =
                    art.id === 'dragon-relic' || art.id === 'lantern-relic'
                      ? customRelicNames?.[art.id]
                      : undefined;
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => onSelectStudioModel(art.id)}
                      className={`px-3.5 py-2.5 text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        active
                          ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                          : 'bg-white/95 text-slate-800 border-slate-300 hover:border-slate-950'
                      }`}
                    >
                      <span className="text-xs xl:text-[13px] font-bold truncate">
                        0{i + 1}. {customName || art.name}
                      </span>
                      <span
                        className={`text-[11px] font-mono-tabular shrink-0 ${
                          active ? 'text-sky-300' : 'text-sky-600'
                        }`}
                      >
                        {active ? '当前' : '切换 →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER 3D VIEWPORT FRAME (~640px Unobstructed Space) */}
        <div className="hidden lg:flex flex-1 h-[62vh] flex-col justify-end items-center pointer-events-none pb-2">
          <div className="text-xs font-mono-tabular tracking-[0.14em] text-slate-400">
            拖拽旋转检视 · 滚轮缩放
          </div>
        </div>

        {/* RIGHT SWISS COLUMN: Enlarged 2x2 Quantitative Matrix & Interactive Controls (410px-450px) */}
        <aside className="w-full lg:w-[405px] xl:w-[450px] shrink-0 pointer-events-auto bg-[#F8FAFC]/85 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none">
          {/* Top Datum Bar (Matches Left Column Datum Line) */}
          <div className="border-t-2 border-slate-950 pt-3.5 flex items-center justify-between text-xs font-mono-tabular tracking-[0.12em] text-slate-500">
            <span className="font-semibold text-slate-700">QUANTITATIVE PROOF</span>
            <span className="text-slate-950 font-bold">核心实证指标</span>
          </div>

          {/* 2x2 Swiss Hairline Metric Matrix — Large Tabular Numbers (30px-34px) */}
          <div className="mt-4 grid grid-cols-2 border-t border-b border-slate-300">
            {currentArtifact.metrics.map((m, i) => {
              const isRightCol = i % 2 === 1;
              const isBottomRow = i >= 2;
              return (
                <div
                  key={i}
                  className={`py-4 xl:py-5 ${
                    isRightCol ? 'pl-5 border-l border-slate-200' : 'pr-5'
                  } ${isBottomRow ? 'border-t border-slate-200' : ''}`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono-tabular text-2xl xl:text-[34px] font-bold text-slate-950 tracking-tight leading-none">
                      {m.value}
                    </span>
                    <span className="text-xs xl:text-sm font-bold text-sky-600">
                      {m.unit}
                    </span>
                  </div>
                  <p className="text-xs xl:text-[13.5px] text-slate-600 leading-snug mt-2">
                    {m.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* SPACE 02 INTERACTION A: Ion Drive -> Reflex Engine & Sub-Vocab Slicing Controls */}
          {currentArtifact.id === 'ion-drive' && (
            <div className="pt-5 space-y-3 border-b border-slate-200 pb-5">
              <div className="text-xs font-mono-tabular font-bold tracking-[0.08em] text-slate-700">
                REFLEX ROUTER · 端侧路由架构与算子切片实测
              </div>
              <div className="grid grid-cols-3 gap-2">
                {REFLEX_ARCHITECTURES.map((arch, idx) => (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => onChangeReflexArch(idx)}
                    className={`px-3 py-2.5 text-left border transition-colors cursor-pointer ${
                      reflexArchIndex === idx
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-white/95 text-slate-800 border-slate-300 hover:border-slate-950'
                    }`}
                  >
                    <div className="text-xs xl:text-[13px] font-bold truncate">
                      {arch.name}
                    </div>
                    <div
                      className={`text-[11px] font-mono-tabular mt-0.5 ${
                        reflexArchIndex === idx ? 'text-sky-300' : 'text-slate-500'
                      }`}
                    >
                      {arch.accuracy} · {arch.latencyMs}
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onToggleSlicing}
                className="w-full text-left pt-1 text-xs xl:text-[13.5px] font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 cursor-pointer"
              >
                {slicingEnabled
                  ? '⚡ Dynamic Sub-Vocab Slicing 已开启 (0.045ms · 点击对比全词表基线)'
                  : '当前为全词表基线 (1.692ms · 点击开启算子切片加速)'}
              </button>
            </div>
          )}

          {/* SPACE 02 INTERACTION B: Retro Laptop -> Lenovo AI PC System Voice Agent Screen Switcher */}
          {isComputerModel && (
            <div className="pt-5 space-y-2.5 border-b border-slate-200 pb-5">
              <div className="text-xs font-mono-tabular font-bold tracking-[0.08em] text-slate-700">
                SCREEN DISPLAY · 切换 PC 屏幕实证画面
              </div>
              <div className="flex flex-col gap-2">
                {MAC_CORPUS_AND_ENGINE_VIEWS.slice(0, 2).map((v, idx) => {
                  const active = macViewIndex === idx;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onChangeMacView(idx)}
                      className={`text-left px-3.5 py-2.5 text-xs xl:text-[13px] font-bold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-slate-950 text-white border-slate-950'
                          : 'bg-white/95 text-slate-800 border-slate-300 hover:border-slate-950'
                      }`}
                    >
                      {v.tabLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SPACE 03 INTERACTION B: Real iPhone GLB Screenshot Upload */}
          {currentArtifact.id === 'iphone-real' && (
            <div className="pt-5 space-y-2.5 border-b border-slate-200 pb-5">
              <div className="text-xs font-mono-tabular font-bold tracking-[0.08em] text-slate-700">
                SCREEN TEXTURE · 手机屏幕实证预览
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <input
                  ref={phoneFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadPhoneScreenshot(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => phoneFileInputRef.current?.click()}
                  className="text-xs xl:text-[13.5px] font-bold text-sky-600 hover:text-sky-700 underline underline-offset-4 cursor-pointer"
                >
                  上传真实截图贴入 iPhone 屏幕 ↗
                </button>
                {hasCustomScreenshot && (
                  <button
                    type="button"
                    onClick={onClearPhoneScreenshot}
                    className="text-xs xl:text-[13px] text-slate-500 hover:text-slate-900 underline underline-offset-4 cursor-pointer"
                  >
                    恢复 Flower 默认预览
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Jump to Space 04 Certificates */}
          <div className="pt-4 flex items-center justify-between text-xs xl:text-[13.5px]">
            <span className="font-mono-tabular text-xs font-semibold text-slate-400">
              ARCHIVE 04
            </span>
            <button
              type="button"
              onClick={() => onEnterWhiteSpace('awards')}
              className="font-bold text-slate-800 hover:text-sky-600 underline underline-offset-4 cursor-pointer"
            >
              检视 5 份国家级奖状与核心论文原件 →
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
