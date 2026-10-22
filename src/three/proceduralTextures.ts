import * as THREE from 'three';
import {
  REFLEX_ARCHITECTURES,
  PHONE_SCREEN_PRESETS,
  MAC_CORPUS_AND_ENGINE_VIEWS,
} from '../data/portfolioData';

/**
 * Creates a soft radial contact shadow texture for grounding 3D models in the Pure White Studio Space.
 */
export function createStudioContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 240);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.24)');
  grad.addColorStop(0.45, 'rgba(15, 23, 42, 0.09)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a clean, continuous single-system Saturn Ring texture (U = 0 inner to U = 1 outer)
 * so there is never an accidental double-ring ("大环套小环") artifact.
 */
export function createCleanSaturnRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, 'rgba(214, 196, 160, 0.0)');
  grad.addColorStop(0.08, 'rgba(214, 196, 160, 0.35)');
  grad.addColorStop(0.28, 'rgba(235, 216, 178, 0.78)');
  grad.addColorStop(0.55, 'rgba(242, 226, 192, 0.88)');
  grad.addColorStop(0.68, 'rgba(180, 162, 130, 0.32)'); // Subtle Cassini division
  grad.addColorStop(0.73, 'rgba(228, 210, 174, 0.72)');
  grad.addColorStop(0.92, 'rgba(212, 192, 155, 0.42)');
  grad.addColorStop(1.0, 'rgba(212, 192, 155, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 32);

  // Subtle fine concentric striations within the single ring band
  for (let x = 35; x < 485; x += 6) {
    const alpha = 0.04 + 0.04 * Math.sin(x * 0.25);
    ctx.fillStyle = `rgba(255, 250, 240, ${alpha})`;
    ctx.fillRect(x, 0, 2, 32);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a ribbed knurling bump texture for Sony A7 GM lens focus/zoom rings.
 */
export function createLensKnurlingBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 64);

  for (let x = 0; x < 512; x += 4) {
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x, 0, 2, 64);
    ctx.fillStyle = '#262626';
    ctx.fillRect(x + 2, 0, 2, 64);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Creates PBR metallic/roughness texture maps (map, normalMap, roughnessMap, metalnessMap)
 * for camera models so every material channel in the metallic/roughness workflow is populated
 * and properly configured with sRGBEncoding (SRGBColorSpace) for base color maps.
 */
export function createCameraPbrMaps(maxAnisotropy = 4): {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
} {
  const sRGBEncoding: THREE.ColorSpace =
    ((THREE as Record<string, unknown>).sRGBEncoding as THREE.ColorSpace) ||
    THREE.SRGBColorSpace;
  const size = 256;

  // 1. Base Color / Albedo fallback map (sRGB)
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const albedoCtx = albedoCanvas.getContext('2d')!;
  albedoCtx.fillStyle = '#1c1f24';
  albedoCtx.fillRect(0, 0, size, size);
  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = sRGBEncoding;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  // 2. Tangent-space Normal Map (Linear / NoColorSpace)
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d')!;
  const normalImg = normalCtx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = Math.sin(i * 12.9898) * 43758.5453;
    const grain = Math.floor((n - Math.floor(n) - 0.5) * 6);
    normalImg.data[i * 4] = 128 + grain;
    normalImg.data[i * 4 + 1] = 128 + grain;
    normalImg.data[i * 4 + 2] = 255;
    normalImg.data[i * 4 + 3] = 255;
  }
  normalCtx.putImageData(normalImg, 0, 0);
  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.anisotropy = maxAnisotropy;

  // 3. Roughness Map (Green channel in glTF PBR workflow, Linear / NoColorSpace)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d')!;
  const roughImg = roughCtx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = Math.cos(i * 78.233) * 29183.123;
    const v = 232 + Math.floor((n - Math.floor(n) - 0.5) * 14);
    roughImg.data[i * 4] = v;
    roughImg.data[i * 4 + 1] = v;
    roughImg.data[i * 4 + 2] = v;
    roughImg.data[i * 4 + 3] = 255;
  }
  roughCtx.putImageData(roughImg, 0, 0);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  // 4. Metalness Map (Blue channel in glTF PBR workflow, Linear / NoColorSpace)
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = size;
  metalCanvas.height = size;
  const metalCtx = metalCanvas.getContext('2d')!;
  const metalImg = metalCtx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 228;
    metalImg.data[i * 4] = v;
    metalImg.data[i * 4 + 1] = v;
    metalImg.data[i * 4 + 2] = v;
    metalImg.data[i * 4 + 3] = 255;
  }
  metalCtx.putImageData(metalImg, 0, 0);
  const metalnessMap = new THREE.CanvasTexture(metalCanvas);
  metalnessMap.colorSpace = THREE.NoColorSpace;
  metalnessMap.wrapS = THREE.RepeatWrapping;
  metalnessMap.wrapT = THREE.RepeatWrapping;
  metalnessMap.anisotropy = maxAnisotropy;

  return { map, normalMap, roughnessMap, metalnessMap };
}

/**
 * Creates the crisp white SONY wordmark and α7R V badge texture for the camera prism front.
 */
export function createSonyPrismLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#141619';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 78px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '6px';
  ctx.fillText('SONY', 256, 134);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates and updates the rear LCD Viewfinder screen on the Sony α7R V camera.
 */
export function drawSonyCameraLcdCanvas(
  canvas: HTMLCanvasElement,
  pulsePhase: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Viewfinder dark studio background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#090D16');
  grad.addColorStop(0.5, '#111827');
  grad.addColorStop(1, '#070A10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Rule-of-thirds composition grid
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 3, 44);
  ctx.lineTo(w / 3, h - 54);
  ctx.moveTo((w * 2) / 3, 44);
  ctx.lineTo((w * 2) / 3, h - 54);
  ctx.moveTo(24, h / 3);
  ctx.lineTo(w - 24, h / 3);
  ctx.moveTo(24, (h * 2) / 3);
  ctx.lineTo(w - 24, (h * 2) / 3);
  ctx.stroke();

  // Top Sony Alpha HUD Bar
  ctx.fillStyle = 'rgba(4, 6, 10, 0.72)';
  ctx.fillRect(0, 0, w, 42);
  ctx.fillStyle = '#F97316';
  ctx.font = '600 16px "MiSans", "Inter", sans-serif';
  ctx.fillText('α7R V · SIPS PRO SUPPORT', 20, 27);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '300 15px "MiSans", "Inter", sans-serif';
  ctx.fillText('RAW 61MP  |  FE 24-70mm F2.8 GM II', w - 285, 27);

  // Green Real-Time Tracking AF Box in center
  const afX = w / 2 + Math.sin(pulsePhase * 1.5) * 14;
  const afY = h / 2 - 8 + Math.cos(pulsePhase * 1.2) * 8;
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(afX - 56, afY - 38, 112, 76);

  ctx.fillStyle = '#10B981';
  ctx.font = '400 13px "MiSans", "Inter", sans-serif';
  ctx.fillText('AF-C · SIPS COMMERCIAL VISUAL', afX - 88, afY + 58);

  // Bottom Exposure Telemetry Bar
  ctx.fillStyle = 'rgba(4, 6, 10, 0.8)';
  ctx.fillRect(0, h - 50, w, 50);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '400 18px "MiSans", "Inter", sans-serif';
  ctx.fillText('1/1000', 22, h - 18);
  ctx.fillText('F2.8', 110, h - 18);
  ctx.fillText('ISO 100', 180, h - 18);
  ctx.fillStyle = '#38BDF8';
  ctx.fillText('+0.0 EV · STBY', w - 155, h - 18);
}

/**
 * Generates and updates the dynamic CRT screen texture for the 3D Macintosh Host
 * in Space 02 (Linguistics Corpus & Reflex Engine).
 */
export function drawRetroMacTerminalCanvas(
  canvas: HTMLCanvasElement,
  macViewIndex: number,
  archIndex: number,
  slicingEnabled: boolean,
  pulsePhase: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const viewSpec =
    MAC_CORPUS_AND_ENGINE_VIEWS[macViewIndex] || MAC_CORPUS_AND_ENGINE_VIEWS[0];
  const arch = REFLEX_ARCHITECTURES[archIndex] || REFLEX_ARCHITECTURES[0];

  // Classic Macintosh dark phosphor screen background
  ctx.fillStyle = '#050A14';
  ctx.fillRect(0, 0, w, h);

  // Top Macintosh Menu Bar
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, w, 38);
  ctx.fillStyle = '#38BDF8';
  ctx.font = '400 15px "MiSans", "Inter", sans-serif';
  ctx.fillText(`  ${viewSpec.screenTitle}`, 24, 25);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '300 14px "MiSans", "Inter", sans-serif';
  ctx.fillText(viewSpec.screenSub, 24, 66);

  if (macViewIndex === 0) {
    // =========================================================================
    // VIEW 0: LENOVO AI PC SYSTEM VOICE AGENT ENTRY (1,000W - 2,000W REVENUE)
    // =========================================================================
    const plotX = 28;
    const plotY = 86;
    const plotW = 340;
    const plotH = 210;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plotX, plotY, plotW, plotH);

    // Draw dynamic voice waveform inside the AI PC system floating bar
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(plotX + 16, plotY + 18, plotW - 32, 64);
    ctx.fillStyle = '#38BDF8';
    ctx.font = '600 13px "MiSans", "Inter", sans-serif';
    ctx.fillText('🎙️ LENOVO AI PC · 全局语音唤醒中', plotX + 28, plotY + 42);

    for (let i = 0; i < 28; i++) {
      const barH =
        6 +
        Math.abs(Math.sin(pulsePhase * 4.2 + i * 0.45)) * 18 +
        Math.abs(Math.cos(pulsePhase * 2.1 - i * 0.3)) * 8;
      const bx = plotX + 28 + i * 10;
      const by = plotY + 64 - barH / 2;
      ctx.fillStyle = i % 3 === 0 ? '#10B981' : '#38BDF8';
      ctx.fillRect(bx, by, 5, barH);
    }

    // Pipeline stages inside AI PC
    const stages = [
      '01. 端侧低功耗语音唤醒 & ASR 流式转写',
      '02. 端侧小模型能力边界评估与意图路由',
      '03. 跨应用系统级 Action 执行与多模态反馈',
    ];
    stages.forEach((stText, idx) => {
      const sy = plotY + 114 + idx * 32;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(plotX + 16, sy - 18, plotW - 32, 24);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '400 13px "MiSans", "Inter", sans-serif';
      ctx.fillText(stText, plotX + 26, sy - 2);
    });

    // Right Column: Key Commercial & Product Metrics
    const rightX = 392;
    ctx.fillStyle = '#38BDF8';
    ctx.font = '600 38px "MiSans", "Inter", sans-serif';
    ctx.fillText('1,000-2,000万', rightX, 132);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '400 15px "MiSans", "Inter", sans-serif';
    ctx.fillText('预计年端侧 License 商业营收', rightX, 160);
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('产品侧唯一负责人 · 0→1 独立全链路交付', rightX, 184);

    const deliverables = [
      { name: '端侧模型边界评估', pct: 1.0, col: '#38BDF8' },
      { name: 'Figma 高保真交互原型', pct: 1.0, col: '#10B981' },
      { name: '前端可交互 Demo 交付', pct: 1.0, col: '#F59E0B' },
    ];
    deliverables.forEach((tp, idx) => {
      const ty = 216 + idx * 28;
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '400 13px "MiSans", "Inter", sans-serif';
      ctx.fillText(tp.name, rightX, ty);
      ctx.fillStyle = tp.col;
      ctx.fillRect(rightX + 150, ty - 10, 175 * tp.pct, 8);
    });

    // Bottom Live Command Execution Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(28, 316, w - 56, 162);

    ctx.fillStyle = '#10B981';
    ctx.font = '600 14px "MiSans", "Inter", sans-serif';
    ctx.fillText('LENOVO AI PC SYSTEM AGENT // LIVE EXECUTION TRACE:', 44, 344);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '400 15px "MiSans", "Inter", sans-serif';
    ctx.fillText(viewSpec.sampleQuote, 44, 376);

    ctx.fillStyle = '#38BDF8';
    ctx.font = '400 14px "MiSans", "Inter", sans-serif';
    ctx.fillText(viewSpec.sampleAnalysis, 44, 412);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '400 13px "MiSans", "Inter", sans-serif';
    ctx.fillText(`✦ ${viewSpec.footerNote}`, 44, 452);
    return;
  }

  if (macViewIndex === 1) {
    // =========================================================================
    // VIEW 1: EDGE ASR/LLM/TTS BOUNDARY & JEV SUB-MILLISECOND PRE-ROUTING
    // =========================================================================
    ctx.fillStyle = '#10B981';
    ctx.font = '600 44px "MiSans", "Inter", sans-serif';
    ctx.fillText('0.045 ms ROUTE', 28, 132);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '400 16px "MiSans", "Inter", sans-serif';
    ctx.fillText('端侧 ASR/LLM/TTS 边界评估 · 客服 Jev 毫秒级前置分流管线', 28, 164);

    const sources = [
      'Stage 1 · 实时语音流 ASR',
      'Stage 2 · Jev 毫秒级意图分流',
      'Stage 3 · 端侧高频指令直达',
      'Stage 4 · 复杂长尾云端协同',
    ];
    sources.forEach((s, i) => {
      const sy = 206 + i * 38;
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(28, sy - 18, 220, 28);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '400 13px "MiSans", "Inter", sans-serif';
      ctx.fillText(s, 40, sy);

      const pulseX = 255 + ((pulsePhase * 90 + i * 45) % 170);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.moveTo(248, sy - 4);
      ctx.lineTo(430, 260);
      ctx.stroke();

      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(
        pulseX,
        sy - 4 + (260 - (sy - 4)) * ((pulseX - 248) / 182),
        3.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(435, 195, 295, 140);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 16px "MiSans", "Inter", sans-serif';
    ctx.fillText('端侧路由与 AIGC 业务闭环', 455, 230);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '400 14px "MiSans", "Inter", sans-serif';
    ctx.fillText('· 语音客服 Jev 毫秒级前置意图管线', 455, 262);
    ctx.fillText('· 小红书 AIGC 审核闭环全员日常使用', 455, 290);
    ctx.fillStyle = '#10B981';
    ctx.fillText('STATUS: PRODUCTION DEPLOYED', 455, 318);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(28, 370, w - 56, 105);
    ctx.fillStyle = '#38BDF8';
    ctx.font = '400 14px "MiSans", "Inter", sans-serif';
    ctx.fillText(viewSpec.sampleQuote, 44, 405);
    ctx.fillStyle = '#CBD5E1';
    ctx.fillText(viewSpec.sampleAnalysis, 44, 442);
    return;
  }

  // =========================================================================
  // VIEW 2: REFLEX 0.045ms EDGE ENGINE & AI HARNESS
  // =========================================================================
  const matrixTop = 92;
  const cols = 16;
  const rows = 4;
  const cellW = (w - 56) / cols;
  const cellH = 22;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const isCandidate = idx < 4;
      if (slicingEnabled) {
        if (isCandidate) {
          const glow = 0.75 + 0.25 * Math.sin(pulsePhase * 4 + idx);
          ctx.fillStyle = `rgba(56, 189, 248, ${glow})`;
        } else {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.28)';
        }
      } else {
        const wave = 0.35 + 0.25 * Math.sin(pulsePhase * 2 + idx * 0.3);
        ctx.fillStyle = `rgba(245, 158, 11, ${wave})`;
      }
      ctx.fillRect(28 + c * cellW, matrixTop + r * (cellH + 6), cellW - 6, cellH);
    }
  }

  const latencyText = slicingEnabled ? arch.latencyMs : '1.692 ms';
  const speedupText = slicingEnabled ? `${arch.speedup} 加速` : '1.0× 全词表基线';
  const projText = slicingEnabled
    ? 'Dynamic Sub-Vocab Slicing: -99.9% 投影计算量'
    : 'Full Vocab Projection: 151,936 Tokens';

  ctx.fillStyle = slicingEnabled ? '#38BDF8' : '#F59E0B';
  ctx.font = '300 46px "MiSans", "Inter", sans-serif';
  ctx.fillText(latencyText, 28, 266);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '300 20px "MiSans", "Inter", sans-serif';
  ctx.fillText(`${arch.name}  ·  ${speedupText}  ·  准确率 ${arch.accuracy}`, 245, 258);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '300 15px "MiSans", "Inter", sans-serif';
  ctx.fillText(`${projText}  |  体积 ${arch.memoryMb}`, 28, 304);

  // Waveform
  ctx.beginPath();
  ctx.strokeStyle = slicingEnabled ? '#38BDF8' : '#F59E0B';
  ctx.lineWidth = 2.5;
  const waveY = 365;
  for (let x = 28; x < w - 28; x += 6) {
    const t = (x - 28) / (w - 56);
    const amp = slicingEnabled ? 9 : 26;
    const freq = slicingEnabled ? 18 : 8;
    const y = waveY + Math.sin(t * freq + pulsePhase * 5) * amp * Math.sin(t * Math.PI);
    if (x === 28) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#10B981';
  ctx.font = '300 14px "MiSans", "Inter", sans-serif';
  ctx.fillText(
    'APPLIED IN UNISOUND: 云知声 AI 客服项目 & AI 语音输入法项目 (前端毫秒级用户意图识别)',
    28,
    452
  );
}

const _flowerAssets: {
  banner: HTMLImageElement | null;
  icon: HTMLImageElement | null;
  screen1: HTMLImageElement | null;
  screen2: HTMLImageElement | null;
  initialized: boolean;
} = {
  banner: null,
  icon: null,
  screen1: null,
  screen2: null,
  initialized: false,
};

function ensureFlowerAssetsLoaded() {
  if (_flowerAssets.initialized || typeof Image === 'undefined') return;
  _flowerAssets.initialized = true;

  const load = (src: string, key: 'banner' | 'icon' | 'screen1' | 'screen2') => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      _flowerAssets[key] = img;
    };
    img.src = src;
  };

  load('/assets/aistudio/flower_banner.jpg', 'banner');
  load('/assets/aistudio/flower_icon.jpg', 'icon');
  load('/assets/aistudio/flower_screen_1.jpg', 'screen1');
  load('/assets/aistudio/flower_screen_2.jpg', 'screen2');
}

/**
 * Generates or updates the 3D Smartphone OLED screen canvas texture.
 */
export function drawSmartphoneScreenCanvas(
  canvas: HTMLCanvasElement,
  presetIndex: number,
  customImage: HTMLImageElement | null,
  pulsePhase: number
) {
  ensureFlowerAssetsLoaded();
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  if (customImage) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    const imgRatio = customImage.width / Math.max(1, customImage.height);
    const canvasRatio = w / h;
    let drawW = w;
    let drawH = h;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawH = h;
      drawW = h * imgRatio;
      offsetX = (w - drawW) / 2;
    } else {
      drawW = w;
      drawH = w / imgRatio;
      offsetY = (h - drawH) / 2;
    }
    ctx.drawImage(customImage, offsetX, offsetY, drawW, drawH);
    return;
  }

  // Preset 0: Exact "Flower: Expense Tracker" App Store Screenshot (from user's uploaded screenshot)
  if (presetIndex === 0) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // 1. Top Hero Banner (flower_banner.jpg)
    if (_flowerAssets.banner) {
      ctx.drawImage(_flowerAssets.banner, 0, 0, w, 268);
    } else {
      const bGrad = ctx.createLinearGradient(0, 0, w, 268);
      bGrad.addColorStop(0, '#F5E6F7');
      bGrad.addColorStop(0.5, '#FCE7F3');
      bGrad.addColorStop(1, '#FEF9C3');
      ctx.fillStyle = bGrad;
      ctx.fillRect(0, 0, w, 268);
    }

    // Status bar ("13:16", signal, wifi, battery 24)
    ctx.fillStyle = '#000000';
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "MiSans", sans-serif';
    ctx.fillText('13:16', 52, 34);

    // Battery pill on top right
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.roundRect(w - 78, 17, 42, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('24', w - 65, 32);

    // Back "<" and Share buttons
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.beginPath();
    ctx.arc(48, 86, 22, 0, Math.PI * 2);
    ctx.arc(w - 48, 86, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(52, 78);
    ctx.lineTo(43, 86);
    ctx.lineTo(52, 94);
    ctx.stroke();

    // 2. App Icon + Title + Subtitle + "Update" Button
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(24, 290, 124, 124, 28);
    ctx.clip();
    if (_flowerAssets.icon) {
      ctx.drawImage(_flowerAssets.icon, 24, 290, 124, 124);
    } else {
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(24, 290, 124, 124);
    }
    ctx.restore();

    ctx.fillStyle = '#000000';
    ctx.font = '700 25px -apple-system, BlinkMacSystemFont, "MiSans", sans-serif';
    ctx.fillText('Flower: Expense Tracker', 168, 322);

    ctx.fillStyle = '#8E8E93';
    ctx.font = '400 15px -apple-system, BlinkMacSystemFont, "MiSans", sans-serif';
    ctx.fillText('See Your Life, Entry by Entry', 168, 348);

    // Blue "Update" button
    ctx.fillStyle = '#007AFF';
    ctx.beginPath();
    ctx.roundRect(168, 376, 98, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "MiSans", sans-serif';
    ctx.fillText('Update', 190, 400);

    // 3. Ratings Strip (5.0 / 4+ / Finance / Zhiwen Huang)
    ctx.strokeStyle = '#E5E5EA';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 434);
    ctx.lineTo(w - 24, 434);
    ctx.moveTo(24, 520);
    ctx.lineTo(w - 24, 520);
    ctx.stroke();

    ctx.fillStyle = '#8E8E93';
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('5 RATINGS', 38, 456);
    ctx.fillText('AGE RATING', 160, 456);
    ctx.fillText('CATEGORY', 286, 456);
    ctx.fillText('DEVELOPER', 402, 456);

    ctx.fillStyle = '#6C6C70';
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('5.0', 52, 486);
    ctx.fillText('4+', 180, 486);
    ctx.fillText('Finance', 284, 486);

    ctx.fillStyle = '#8E8E93';
    ctx.font = '400 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('★★★★★', 38, 508);
    ctx.fillText('Years', 178, 508);
    ctx.fillText('Zhiwen Huang', 396, 508);

    // 4. What's New Section
    ctx.fillStyle = '#000000';
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText("What's New  ›", 24, 558);

    ctx.fillStyle = '#8E8E93';
    ctx.font = '400 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Version 1.5.2', 24, 590);
    ctx.fillText('12h ago', w - 82, 590);

    ctx.fillStyle = '#1C1C1E';
    ctx.font = '400 14.5px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('• Borrowing and lending: track money lent and borrowed', 24, 622);
    ctx.fillText('in Assets, record repayments, and see the principal still', 24, 644);
    ctx.fillText('outstanding.', 24, 666);
    ctx.fillStyle = '#007AFF';
    ctx.fillText('more', w - 64, 666);

    // 5. Preview Section with Official Screenshots
    ctx.fillStyle = '#000000';
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Preview', 24, 718);

    // Card 1 ("Record it in 3 seconds")
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(24, 736, 268, 288, 24);
    ctx.clip();
    if (_flowerAssets.screen1) {
      ctx.drawImage(_flowerAssets.screen1, 24, 736, 268, 560);
    } else {
      ctx.fillStyle = '#DBEAFE';
      ctx.fillRect(24, 736, 268, 288);
    }
    ctx.restore();

    // Card 2 ("Screenshot or just say it")
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(308, 736, 268, 288, 24);
    ctx.clip();
    if (_flowerAssets.screen2) {
      ctx.drawImage(_flowerAssets.screen2, 308, 736, 268, 560);
    } else {
      ctx.fillStyle = '#DBEAFE';
      ctx.fillRect(308, 736, 268, 288);
    }
    ctx.restore();

    // 6. Bottom iOS Floating Tab Pill (Today / Games / Apps / Search)
    ctx.fillStyle = 'rgba(244, 244, 248, 0.92)';
    ctx.beginPath();
    ctx.roundRect(24, h - 86, w - 48, 64, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 122, 255, 0.14)';
    ctx.beginPath();
    ctx.roundRect(w - 148, h - 80, 116, 52, 26);
    ctx.fill();

    ctx.fillStyle = '#1C1C1E';
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Today', 66, h - 34);
    ctx.fillText('Games', 176, h - 34);
    ctx.fillText('Apps', 290, h - 34);
    ctx.fillStyle = '#007AFF';
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Search', w - 110, h - 34);
    return;
  }

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#07101E');
  grad.addColorStop(0.5, '#0B192C');
  grad.addColorStop(1, '#050811');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const preset = PHONE_SCREEN_PRESETS[presetIndex] || PHONE_SCREEN_PRESETS[0];

  ctx.fillStyle = '#94A3B8';
  ctx.font = '300 18px "MiSans", "Inter", sans-serif';
  ctx.fillText('09:41', 42, 46);
  ctx.fillText('5G · 100%', w - 135, 46);

  ctx.fillStyle = '#020408';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 70, 20, 140, 32, 16);
  ctx.fill();

  if (presetIndex === 1) {
    ctx.fillStyle = '#38BDF8';
    ctx.font = '400 17px "MiSans", "Inter", sans-serif';
    ctx.fillText('LENOVO AI PC · OS VOICE AGENT', 42, 118);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '300 32px "MiSans", "Inter", sans-serif';
    ctx.fillText('Windows 系统级语音意图入口', 42, 168);

    const cy = 390;
    for (let ring = 0; ring < 4; ring++) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.7 - ring * 0.15})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const rad = 55 + ring * 32 + Math.sin(pulsePhase * 2 + ring) * 2;
      ctx.arc(w / 2, cy, rad, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#F59E0B';
    ctx.font = '300 40px "MiSans", "Inter", sans-serif';
    ctx.fillText('¥1,000W – 2,000W', 42, 620);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '300 20px "MiSans", "Inter", sans-serif';
    ctx.fillText('预计年收入商业测算 (端侧 License 授权)', 42, 664);
  } else {
    ctx.fillStyle = '#A855F7';
    ctx.font = '400 17px "MiSans", "Inter", sans-serif';
    ctx.fillText('JEV INTENT ROUTER & AIGC WORKFLOW', 42, 118);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '300 32px "MiSans", "Inter", sans-serif';
    ctx.fillText('毫秒级客服意图分流管线', 42, 168);

    const nodes = [
      { y: 270, label: 'ASR 实时语音流输入', color: '#38BDF8' },
      { y: 380, label: 'Jev 轻量前置意图分类器', color: '#10B981' },
      { y: 490, label: '精准路由 / 模糊意图转人工', color: '#F59E0B' },
    ];
    nodes.forEach((n) => {
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(70, n.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '300 21px "MiSans", "Inter", sans-serif';
      ctx.fillText(n.label, 100, n.y + 7);
    });
  }

  ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.font = '300 15px "MiSans", "Inter", sans-serif';
  ctx.fillText(preset.kicker, 42, h - 42);
}

/**
 * Creates a soft radial atmospheric dust mote texture for the Dune-inspired 3D deep-space particle field.
 */
export function createStardustParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.25, 'rgba(241, 245, 249, 0.65)');
  grad.addColorStop(0.6, 'rgba(203, 213, 225, 0.16)');
  grad.addColorStop(1.0, 'rgba(203, 213, 225, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a Starfield Chronomark-inspired high-precision astrometric survey ring texture (1024x1024)
 * featuring pure white concentric geometric arcs, equidistant tick marks, curved arc-slots, and micro monospace coordinates.
 */
export function createStarfieldSurveyRingTexture(
  planetIndex: string,
  designation: string,
  coordinates: string,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // 1. Outer segmented geometric arcs (4 quadrants with crisp degree-slot gaps)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 1.6;
  const outerR = 474;
  for (let q = 0; q < 4; q++) {
    const startAngle = (q * Math.PI) / 2 + 0.07;
    const endAngle = ((q + 1) * Math.PI) / 2 - 0.07;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.stroke();
  }

  // Cardinal crosshair ticks on the outer perimeter
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = 2.0;
  for (let q = 0; q < 4; q++) {
    const ang = (q * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * 450, cy + Math.sin(ang) * 450);
    ctx.lineTo(cx + Math.cos(ang) * 490, cy + Math.sin(ang) * 490);
    ctx.stroke();
  }

  // 2. Primary equidistant tick-mark ring (180 ticks = every 2 degrees)
  const tickOuterR = 452;
  for (let deg = 0; deg < 360; deg += 2) {
    // Leave clean breathing slots near cardinal text labels
    if (
      (deg > 348 || deg < 12) ||
      (deg > 168 && deg < 192)
    ) {
      continue;
    }
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMedium = deg % 10 === 0;
    const len = isMajor ? 22 : isMedium ? 13 : 6.5;
    ctx.strokeStyle = isMajor
      ? 'rgba(255, 255, 255, 0.92)'
      : isMedium
      ? 'rgba(255, 255, 255, 0.62)'
      : 'rgba(255, 255, 255, 0.34)';
    ctx.lineWidth = isMajor ? 2.0 : isMedium ? 1.3 : 1.0;

    ctx.beginPath();
    ctx.moveTo(
      cx + Math.cos(rad) * (tickOuterR - len),
      cy + Math.sin(rad) * (tickOuterR - len)
    );
    ctx.lineTo(
      cx + Math.cos(rad) * tickOuterR,
      cy + Math.sin(rad) * tickOuterR
    );
    ctx.stroke();
  }

  // 3. Starfield Chronomark recessed arc-slots (double-walled curved slots at opposing flanks)
  const slotInnerR = 402;
  const slotOuterR = 414;
  const slotArcs = [
    [0.32, 1.22],
    [Math.PI + 0.32, Math.PI + 1.22],
  ];
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
  ctx.lineWidth = 1.4;
  slotArcs.forEach(([a0, a1]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, slotOuterR, a0, a1);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, slotInnerR, a0, a1);
    ctx.stroke();

    // End caps of the arc slot
    [a0, a1].forEach((capAng) => {
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.cos(capAng) * slotInnerR,
        cy + Math.sin(capAng) * slotInnerR
      );
      ctx.lineTo(
        cx + Math.cos(capAng) * slotOuterR,
        cy + Math.sin(capAng) * slotOuterR
      );
      ctx.stroke();
    });
  });

  // Companion fine hairline arc on the opposite quadrants
  const compArcs = [
    [Math.PI / 2 + 0.25, Math.PI - 0.25],
    [(3 * Math.PI) / 2 + 0.25, Math.PI * 2 - 0.25],
  ];
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.lineWidth = 1.1;
  compArcs.forEach(([a0, a1]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 408, a0, a1);
    ctx.stroke();
  });

  // 4. Micro-etched monospace telemetry & coordinate labels along the ring
  const drawArcLabel = (text: string, angleDeg: number, radius: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.font = '600 13.5px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -radius);
    ctx.restore();
  };

  drawArcLabel(`SYS-${planetIndex} // ${designation}`, 0, 440);
  drawArcLabel(coordinates, 180, 440);
  drawArcLabel('045° // LOCK', 45, 382);
  drawArcLabel('135° // SYNC', 135, 382);
  drawArcLabel('225° // GRAD', 225, 382);
  drawArcLabel('315° // VERN', 315, 382);

  // 5. Inner concentric vernier ring with 12 precision inward ticks
  const innerR = 356;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.46)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < 12; i++) {
    const rad = (i * 30 * Math.PI) / 180;
    ctx.strokeStyle =
      i % 3 === 0 ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.48)';
    ctx.lineWidth = i % 3 === 0 ? 1.8 : 1.1;
    ctx.beginPath();
    ctx.moveTo(
      cx + Math.cos(rad) * (innerR - 12),
      cy + Math.sin(rad) * (innerR - 12)
    );
    ctx.lineTo(
      cx + Math.cos(rad) * (innerR + 4),
      cy + Math.sin(rad) * (innerR + 4)
    );
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}


