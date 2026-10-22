import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { PLANETS, PlanetId, StudioModelId } from '../data/portfolioData';
import {
  createStudioContactShadowTexture,
  createCleanSaturnRingTexture,
  createCameraPbrMaps,
  drawSonyCameraLcdCanvas,
  drawRetroMacTerminalCanvas,
  drawSmartphoneScreenCanvas,
  createStardustParticleTexture,
  createStarfieldSurveyRingTexture,
} from '../three/proceduralTextures';

const sRGBEncoding: THREE.ColorSpace =
  ((THREE as Record<string, unknown>).sRGBEncoding as THREE.ColorSpace) ||
  THREE.SRGBColorSpace;

// Pre-allocated math helpers at module scope (Zero GC in render loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 0, 0);
const _dummy = new THREE.Object3D();
const _mouse = new THREE.Vector2();
const _darkBgColor = new THREE.Color(0x030508);
const _whiteStudioColor = new THREE.Color(0xf8fafc);
const _lerpBgColor = new THREE.Color(0x030508);
const _projCenter = new THREE.Vector3();
const _projEdge = new THREE.Vector3();
const _barycenter = new THREE.Vector3(0, -0.2, -20);

export interface CosmicStageProps {
  worldMode: 'intro' | 'white-space';
  scrollProgress: number;
  focusedPlanetId: PlanetId;
  activeStudioModelId: StudioModelId;
  macViewIndex: number;
  reflexArchIndex: number;
  slicingEnabled: boolean;
  phonePresetIndex: number;
  customPhoneImage: HTMLImageElement | null;
  customRelicUpload?: {
    slotId: 'dragon-relic' | 'lantern-relic';
    files: File[];
    timestamp: number;
  } | null;
  isInstrumentHovered?: boolean;
  onPlanetHoverChange?: (planetId: PlanetId | null) => void;
  onFocusPlanetInIntro: (planetId: PlanetId) => void;
  onEnterWhiteSpace: (planetId: PlanetId) => void;
  onModelLoadStateChange?: (loading: boolean) => void;
  onRelicSaved?: (
    slotId: 'dragon-relic' | 'lantern-relic',
    displayName: string,
    savedToServer: boolean
  ) => void;
}

/**
 * Builds a clean radial RingGeometry mapped 0..1 along radius for the single-band Saturn ring texture.
 */
function createRadialRingGeometry(
  innerRadius: number,
  outerRadius: number
): THREE.RingGeometry {
  const geo = new THREE.RingGeometry(innerRadius, outerRadius, 128);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v3 = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const radius = v3.length();
    const u = THREE.MathUtils.clamp(
      (radius - innerRadius) / (outerRadius - innerRadius),
      0,
      1
    );
    uv.setXY(i, u, 0.5);
  }
  return geo;
}

/**
 * Builds a 3D geometric vernier tick-and-arc LineSegments ring for Layer 2 of the Starfield survey rig.
 */
function createVernierTickGeometry(radius: number): THREE.BufferGeometry {
  const vertices: number[] = [];

  // 72 equidistant radial vernier ticks
  for (let i = 0; i < 72; i++) {
    const deg = i * 5;
    // Skip cardinal label zones
    if ((deg > 345 || deg < 15) || (deg > 165 && deg < 195)) continue;
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 15 === 0;
    const rIn = radius * (isMajor ? 0.94 : 0.965);
    const rOut = radius * (isMajor ? 1.02 : 1.0);
    vertices.push(
      Math.cos(rad) * rIn,
      Math.sin(rad) * rIn,
      0,
      Math.cos(rad) * rOut,
      Math.sin(rad) * rOut,
      0
    );
  }

  // Segmented precision arcs (4 arcs with crisp gaps)
  const arcSegs = 28;
  const arcR = radius * 1.045;
  for (let q = 0; q < 4; q++) {
    const aStart = (q * Math.PI) / 2 + 0.14;
    const aEnd = ((q + 1) * Math.PI) / 2 - 0.14;
    for (let s = 0; s < arcSegs; s++) {
      const a0 = aStart + ((aEnd - aStart) * s) / arcSegs;
      const a1 = aStart + ((aEnd - aStart) * (s + 1)) / arcSegs;
      vertices.push(
        Math.cos(a0) * arcR,
        Math.sin(a0) * arcR,
        0,
        Math.cos(a1) * arcR,
        Math.sin(a1) * arcR,
        0
      );
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geo;
}

export const CosmicStage3D: React.FC<CosmicStageProps> = ({
  worldMode,
  scrollProgress,
  focusedPlanetId,
  activeStudioModelId,
  macViewIndex,
  reflexArchIndex,
  slicingEnabled,
  phonePresetIndex,
  customPhoneImage,
  customRelicUpload,
  isInstrumentHovered = false,
  onPlanetHoverChange,
  onFocusPlanetInIntro,
  onEnterWhiteSpace,
  onModelLoadStateChange,
  onRelicSaved,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const reticleDomRef = useRef<HTMLDivElement | null>(null);
  const waypointDomRefs = useRef<Record<PlanetId, HTMLButtonElement | null>>({
    heritage: null,
    nlp: null,
    commercial: null,
    awards: null,
  });

  const stateRef = useRef({
    worldMode,
    scrollProgress,
    focusedPlanetId,
    activeStudioModelId,
    macViewIndex,
    reflexArchIndex,
    slicingEnabled,
    phonePresetIndex,
    customPhoneImage,
    isInstrumentHovered,
    hoveredPlanetId: null as PlanetId | null,
    warpBoost: 0,
    whiteBlend: worldMode === 'white-space' ? 1 : 0,
    userRotX: 0,
    userRotY: 0,
  });

  useEffect(() => {
    const prevWorld = stateRef.current.worldMode;
    const prevPlanet = stateRef.current.focusedPlanetId;
    const prevModel = stateRef.current.activeStudioModelId;

    if (prevWorld !== worldMode || prevPlanet !== focusedPlanetId) {
      stateRef.current.warpBoost = 1.0;
      stateRef.current.userRotX = 0;
      stateRef.current.userRotY = 0;
    } else if (prevModel !== activeStudioModelId) {
      stateRef.current.userRotX = 0;
      stateRef.current.userRotY = 0;
    }

    stateRef.current.worldMode = worldMode;
    stateRef.current.scrollProgress = scrollProgress;
    stateRef.current.focusedPlanetId = focusedPlanetId;
    stateRef.current.activeStudioModelId = activeStudioModelId;
    stateRef.current.macViewIndex = macViewIndex;
    stateRef.current.reflexArchIndex = reflexArchIndex;
    stateRef.current.slicingEnabled = slicingEnabled;
    stateRef.current.phonePresetIndex = phonePresetIndex;
    stateRef.current.customPhoneImage = customPhoneImage;
    stateRef.current.isInstrumentHovered = isInstrumentHovered;
  }, [
    worldMode,
    scrollProgress,
    focusedPlanetId,
    activeStudioModelId,
    macViewIndex,
    reflexArchIndex,
    slicingEnabled,
    phonePresetIndex,
    customPhoneImage,
    isInstrumentHovered,
  ]);

  const callbacksRef = useRef({
    onPlanetHoverChange,
    onFocusPlanetInIntro,
    onEnterWhiteSpace,
    onModelLoadStateChange,
    onRelicSaved,
  });
  useEffect(() => {
    callbacksRef.current = {
      onPlanetHoverChange,
      onFocusPlanetInIntro,
      onEnterWhiteSpace,
      onModelLoadStateChange,
      onRelicSaved,
    };
  }, [
    onPlanetHoverChange,
    onFocusPlanetInIntro,
    onEnterWhiteSpace,
    onModelLoadStateChange,
    onRelicSaved,
  ]);

  const loadStudioModelFnRef = useRef<((modelId: StudioModelId) => void) | null>(
    null
  );
  const uploadRelicFilesFnRef = useRef<
    | ((
        slotId: 'dragon-relic' | 'lantern-relic',
        files: File[]
      ) => Promise<void>)
    | null
  >(null);

  useEffect(() => {
    if (loadStudioModelFnRef.current) {
      loadStudioModelFnRef.current(activeStudioModelId);
    }
  }, [activeStudioModelId]);

  useEffect(() => {
    if (customRelicUpload && uploadRelicFilesFnRef.current) {
      uploadRelicFilesFnRef.current(
        customRelicUpload.slotId,
        customRelicUpload.files
      );
    }
  }, [customRelicUpload]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    // 1. Initialize Scene, Camera, Renderer (Dune Cold Deep-Space Contrast)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030508);
    const sceneFog = new THREE.FogExp2(0x030508, 0.011);
    scene.fog = sceneFog;

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    camera.position.set(-14, 1.8, -4.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isHeadless,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isHeadless ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Studio Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    // 3. Clean 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.3);
    keyLight.position.set(10, 14, 14);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.9);
    fillLight.position.set(-12, 4, 10);
    scene.add(fillLight);

    // =========================================================================
    // WORLD 1 GROUP: COSMIC INTRO (Dune Deep Space + Starfield Survey Rings + Orbits)
    // =========================================================================
    const cosmicIntroGroup = new THREE.Group();
    scene.add(cosmicIntroGroup);

    // A. Far-Field Crisp Stars (Restrained Cold/Ivory Dune Palette — No Garish Nebulae)
    const starCount = 1200;
    const starGeo = new THREE.SphereGeometry(0.044, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.78,
    });
    const starInstanced = new THREE.InstancedMesh(starGeo, starMat, starCount);
    starInstanced.frustumCulled = false;

    const starCoords = new Float32Array(starCount * 3);
    const starPalette = [
      new THREE.Color(0xf8fafc),
      new THREE.Color(0xe2e8f0),
      new THREE.Color(0xfef3c7),
      new THREE.Color(0xcbd5e1),
    ];

    for (let i = 0; i < starCount; i++) {
      const sx = (Math.random() - 0.5) * 145;
      const sy = (Math.random() - 0.5) * 92;
      const sz = 20 - Math.random() * 115;
      starCoords[i * 3] = sx;
      starCoords[i * 3 + 1] = sy;
      starCoords[i * 3 + 2] = sz;

      _dummy.position.set(sx, sy, sz);
      _dummy.scale.setScalar(0.4 + Math.random() * 0.95);
      _dummy.updateMatrix();
      starInstanced.setMatrixAt(i, _dummy.matrix);
      starInstanced.setColorAt(i, starPalette[i % starPalette.length]);
    }
    starInstanced.instanceMatrix.needsUpdate = true;
    if (starInstanced.instanceColor) starInstanced.instanceColor.needsUpdate = true;
    starInstanced.computeBoundingSphere();
    cosmicIntroGroup.add(starInstanced);

    // B. Dune Volumetric 3D Atmospheric Stardust Micro-Particles (Parallax & Depth)
    const dustCount = 1650;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    const cWhite = new THREE.Color(0xf8fafc);
    const cSand = new THREE.Color(0xe2d9c8);
    const cIce = new THREE.Color(0xcbd5e1);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 76;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 44;
      dustPositions[i * 3 + 2] = 6 - Math.random() * 58;

      const c = i % 3 === 0 ? cSand : i % 2 === 0 ? cWhite : cIce;
      dustColors[i * 3] = c.r;
      dustColors[i * 3 + 1] = c.g;
      dustColors[i * 3 + 2] = c.b;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(dustPositions, 3)
    );
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    const stardustTex = createStardustParticleTexture();
    const dustMat = new THREE.PointsMaterial({
      size: 0.21,
      map: stardustTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const stardustPoints = new THREE.Points(dustGeo, dustMat);
    cosmicIntroGroup.add(stardustPoints);

    // C. Deep-Space Astrometric Reference Plane (Ultra-fine Ecliptic Horizon Ring & Meridians)
    const eclipticGroup = new THREE.Group();
    eclipticGroup.position.copy(_barycenter);
    cosmicIntroGroup.add(eclipticGroup);

    [16.5, 29.5].forEach((rad, rIdx) => {
      const eCurve = new THREE.EllipseCurve(0, 0, rad, rad * 0.82, 0, Math.PI * 2, false, 0);
      const pts2d = eCurve.getPoints(180);
      const pts3d = pts2d.map((p) => new THREE.Vector3(p.x, 0, p.y));
      const eGeo = new THREE.BufferGeometry().setFromPoints(pts3d);
      const eMat = new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: rIdx === 0 ? 0.35 : 0.6,
        gapSize: rIdx === 0 ? 0.35 : 0.45,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      });
      const eLine = new THREE.Line(eGeo, eMat);
      eLine.computeLineDistances();
      eclipticGroup.add(eLine);
    });

    const texLoader = new THREE.TextureLoader();
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const loadSRGBTex = (path: string) =>
      texLoader.load(path, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = maxAnisotropy;
      });

    const marsTex = loadSRGBTex('/textures/mars.jpg');
    const jupiterTex = loadSRGBTex('/textures/jupiter.jpg');
    const saturnTex = loadSRGBTex('/textures/saturn.jpg');
    const cleanSaturnRingTex = createCleanSaturnRingTexture();
    const earthTex = loadSRGBTex('/textures/earth_atmos.jpg');
    const earthNormal = texLoader.load('/textures/earth_normal.jpg');
    const moonTex = loadSRGBTex('/textures/moon.jpg');

    const planetClickMeshes: THREE.Object3D[] = [];
    const planetBodiesMap = new Map<PlanetId, THREE.Group>();
    const planetInstrumentMap = new Map<
      PlanetId,
      {
        surveyRig: THREE.Group;
        outerDialMesh: THREE.Mesh;
        outerDialMat: THREE.MeshBasicMaterial;
        innerVernierLine: THREE.LineSegments;
        innerVernierMat: THREE.LineBasicMaterial;
        orbitMat: THREE.LineDashedMaterial;
        harmonicOrbitMat: THREE.LineDashedMaterial;
        spinAngle: number;
        spinSpeed: number;
      }
    >();

    // D. Planets + Gravitational Elliptical Dashed Orbits + Starfield Survey Outer Rings
    PLANETS.forEach((pData, idx) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(...pData.position);
      pGroup.userData = {
        type: 'planet',
        planetId: pData.id,
      };

      // 1. Gravitational Elliptical Dashed Orbit passing directly through pData.position
      const [px, py, pz] = pData.position;
      const dx = px - _barycenter.x;
      const dy = py - _barycenter.y;
      const dz = pz - _barycenter.z;
      const orbitR = Math.hypot(dx, dz);
      const ux = dx / orbitR;
      const uz = dz / orbitR;
      const vx = -uz;
      const vz = ux;
      const ecc = 0.76 + idx * 0.03;
      const tiltY = (idx % 2 === 0 ? 1 : -1) * 1.35;

      const orbitPoints: THREE.Vector3[] = [];
      const orbitSegments = 240;
      for (let s = 0; s <= orbitSegments; s++) {
        const a = (s / orbitSegments) * Math.PI * 2;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const ox = _barycenter.x + orbitR * cosA * ux + orbitR * ecc * sinA * vx;
        const oz = _barycenter.z + orbitR * cosA * uz + orbitR * ecc * sinA * vz;
        const oy = _barycenter.y + dy * cosA + tiltY * sinA;
        orbitPoints.push(new THREE.Vector3(ox, oy, oz));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 0.42,
        gapSize: 0.26,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.computeLineDistances();
      cosmicIntroGroup.add(orbitLine);

      // Companion fine harmonic orbital arc flanking the planet
      const harmonicPoints: THREE.Vector3[] = [];
      const harmR = orbitR + (idx === 2 ? pData.radius * 2.75 : pData.radius * 2.05);
      for (let s = -40; s <= 40; s++) {
        const a = (s / 40) * 0.42;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const ox = _barycenter.x + harmR * cosA * ux + harmR * ecc * sinA * vx;
        const oz = _barycenter.z + harmR * cosA * uz + harmR * ecc * sinA * vz;
        const oy = _barycenter.y + dy * cosA + tiltY * sinA;
        harmonicPoints.push(new THREE.Vector3(ox, oy, oz));
      }
      const harmonicGeo = new THREE.BufferGeometry().setFromPoints(harmonicPoints);
      const harmonicOrbitMat = new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 0.14,
        gapSize: 0.14,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      });
      const harmonicLine = new THREE.Line(harmonicGeo, harmonicOrbitMat);
      harmonicLine.computeLineDistances();
      cosmicIntroGroup.add(harmonicLine);

      // 2. Physical Planet Body Group (Authentic PBR textures & natural axial rotation)
      const planetBodyGroup = new THREE.Group();
      pGroup.add(planetBodyGroup);

      const sphereGeo = new THREE.SphereGeometry(pData.radius, 64, 64);
      let sphereMat: THREE.MeshStandardMaterial;

      if (idx === 0) {
        sphereMat = new THREE.MeshStandardMaterial({
          map: marsTex,
          roughness: 0.82,
          metalness: 0.05,
        });
      } else if (idx === 1) {
        sphereMat = new THREE.MeshStandardMaterial({
          map: jupiterTex,
          roughness: 0.65,
          metalness: 0.05,
        });
      } else if (idx === 2) {
        sphereMat = new THREE.MeshStandardMaterial({
          map: saturnTex,
          roughness: 0.7,
          metalness: 0.05,
        });

        const ringGeo = createRadialRingGeometry(
          pData.radius * 1.36,
          pData.radius * 2.15
        );
        const ringMat = new THREE.MeshStandardMaterial({
          map: cleanSaturnRingTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          roughness: 0.6,
          depthWrite: false,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.25;
        ringMesh.rotation.y = -0.2;
        planetBodyGroup.add(ringMesh);
      } else {
        sphereMat = new THREE.MeshStandardMaterial({
          map: earthTex,
          normalMap: earthNormal,
          normalScale: new THREE.Vector2(1.1, 1.1),
          roughness: 0.55,
          metalness: 0.1,
        });

        const moonGeo = new THREE.SphereGeometry(pData.radius * 0.23, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
          map: moonTex,
          roughness: 0.88,
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(pData.radius * 1.85, 0.35, 0);
        planetBodyGroup.add(moonMesh);
      }

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.rotation.z = 0.1 * (idx % 2 === 0 ? 1 : -1);
      sphereMesh.userData = pGroup.userData;
      planetBodyGroup.add(sphereMesh);

      // Invisible generous hit proxy so hovering anywhere within the Starfield ring locks smoothly
      const hitProxyRadius = idx === 2 ? pData.radius * 2.45 : pData.radius * 1.85;
      const hitProxyGeo = new THREE.SphereGeometry(hitProxyRadius, 16, 16);
      const hitProxyMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      });
      const hitProxyMesh = new THREE.Mesh(hitProxyGeo, hitProxyMat);
      hitProxyMesh.userData = pGroup.userData;
      pGroup.add(hitProxyMesh);
      planetClickMeshes.push(hitProxyMesh);

      // 3. Starfield Chronomark 3D Astrometric Survey Outer Rings (Flat Plane, In-Plane Rotation Only)
      const surveyRig = new THREE.Group();
      const dialSpan = idx === 2 ? pData.radius * 5.15 : pData.radius * 3.85;
      const surveyRingTex = createStarfieldSurveyRingTexture(
        pData.index,
        pData.astrometry.designation,
        pData.astrometry.coordinates,
        maxAnisotropy
      );
      const outerDialGeo = new THREE.PlaneGeometry(dialSpan, dialSpan);
      const outerDialMat = new THREE.MeshBasicMaterial({
        map: surveyRingTex,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const outerDialMesh = new THREE.Mesh(outerDialGeo, outerDialMat);
      surveyRig.add(outerDialMesh);

      // Layer 2: Concentric Inner Vernier Arc & Tick Ring on the same steady plane
      const vernierRadius = idx === 2 ? pData.radius * 2.38 : pData.radius * 1.76;
      const innerVernierGeo = createVernierTickGeometry(vernierRadius);
      const innerVernierMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
      });
      const innerVernierLine = new THREE.LineSegments(
        innerVernierGeo,
        innerVernierMat
      );
      innerVernierLine.position.z = 0.04;
      surveyRig.add(innerVernierLine);

      pGroup.add(surveyRig);
      cosmicIntroGroup.add(pGroup);

      planetBodiesMap.set(pData.id, planetBodyGroup);
      planetInstrumentMap.set(pData.id, {
        surveyRig,
        outerDialMesh,
        outerDialMat,
        innerVernierLine,
        innerVernierMat,
        orbitMat,
        harmonicOrbitMat,
        spinAngle: 0,
        spinSpeed: 1,
      });
    });

    // =========================================================================
    // WORLD 2 GROUP: PURE WHITE STUDIO SPACE (100% Real Downloaded .GLB Models)
    // =========================================================================
    const whiteStudioGroup = new THREE.Group();
    whiteStudioGroup.position.set(0, 0, 0);
    whiteStudioGroup.visible = false;
    scene.add(whiteStudioGroup);

    const shadowTex = createStudioContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(4.4, 4.4);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.78,
    });
    const contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadowMesh.position.set(0, -1.35, 0);
    whiteStudioGroup.add(contactShadowMesh);

    const centerModelHolder = new THREE.Group();
    centerModelHolder.position.set(0, 0, 0);
    whiteStudioGroup.add(centerModelHolder);

    // Dynamic Screen Textures mapped onto the real downloaded GLB models
    const crtCanvas = document.createElement('canvas');
    crtCanvas.width = 768;
    crtCanvas.height = 512;
    const crtTexture = new THREE.CanvasTexture(crtCanvas);
    crtTexture.colorSpace = THREE.SRGBColorSpace;
    crtTexture.anisotropy = maxAnisotropy;

    const cameraLcdCanvas = document.createElement('canvas');
    cameraLcdCanvas.width = 640;
    cameraLcdCanvas.height = 420;
    const cameraLcdTexture = new THREE.CanvasTexture(cameraLcdCanvas);
    cameraLcdTexture.colorSpace = sRGBEncoding;
    cameraLcdTexture.anisotropy = maxAnisotropy;

    const cameraPbrMaps = createCameraPbrMaps(maxAnisotropy);

    const phoneCanvas = document.createElement('canvas');
    phoneCanvas.width = 512;
    phoneCanvas.height = 1024;
    const phoneTexture = new THREE.CanvasTexture(phoneCanvas);
    phoneTexture.colorSpace = sRGBEncoding;
    phoneTexture.anisotropy = maxAnisotropy;

    const dracoLoader = new DRACOLoader();
    const basePrefix = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '');
    dracoLoader.setDecoderPath(`${basePrefix}/draco/`);
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const glbCache = new Map<
      string,
      {
        wrapper: THREE.Group;
        rawRoot: THREE.Object3D;
        animations: THREE.AnimationClip[];
      }
    >();
    const pendingLoads = new Map<
      string,
      Array<
        (cached: {
          wrapper: THREE.Group;
          rawRoot: THREE.Object3D;
          animations: THREE.AnimationClip[];
        }) => void
      >
    >();
    let activeMixer: THREE.AnimationMixer | null = null;
    let currentLoadToken = 0;

    const updateCameraModelMaterials = (
      root: THREE.Object3D,
      modelId: StudioModelId
    ) => {
      const isCameraModel =
        modelId === 'dslr-camera' || modelId === 'compact-camera';

      root.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        mesh.castShadow = !isHeadless && modelId !== 'dslr-camera';
        mesh.receiveShadow = !isHeadless && modelId !== 'dslr-camera';

        const applyPbrWorkflow = (
          mat: THREE.Material
        ): THREE.MeshStandardMaterial => {
          const srcMat = mat as THREE.MeshStandardMaterial;
          const pbrMat = srcMat.isMeshStandardMaterial
            ? srcMat
            : new THREE.MeshStandardMaterial({
                name: mat.name,
                color:
                  (mat as THREE.MeshBasicMaterial).color?.clone() ??
                  new THREE.Color(0xffffff),
              });

          const map = pbrMat.map || (isCameraModel ? cameraPbrMaps.map : null);
          const normalMap =
            pbrMat.normalMap ||
            (isCameraModel ? cameraPbrMaps.normalMap : null);
          const roughnessMap =
            pbrMat.roughnessMap ||
            pbrMat.metalnessMap ||
            (isCameraModel ? cameraPbrMaps.roughnessMap : null);
          const metalnessMap =
            pbrMat.metalnessMap ||
            pbrMat.roughnessMap ||
            (isCameraModel ? cameraPbrMaps.metalnessMap : null);

          pbrMat.map = map;
          pbrMat.normalMap = normalMap;
          pbrMat.roughnessMap = roughnessMap;
          pbrMat.metalnessMap = metalnessMap;

          if (pbrMat.map) {
            pbrMat.map.colorSpace = sRGBEncoding;
            pbrMat.map.anisotropy = maxAnisotropy;
            pbrMat.map.needsUpdate = true;
            renderer.initTexture(pbrMat.map);
          }
          if (pbrMat.normalMap) {
            pbrMat.normalMap.colorSpace = THREE.NoColorSpace;
            pbrMat.normalMap.anisotropy = maxAnisotropy;
            if (isCameraModel) {
              pbrMat.normalScale = new THREE.Vector2(0.04, 0.04);
            }
            pbrMat.normalMap.needsUpdate = true;
          }
          if (pbrMat.roughnessMap) {
            pbrMat.roughnessMap.colorSpace = THREE.NoColorSpace;
            pbrMat.roughnessMap.anisotropy = maxAnisotropy;
            pbrMat.roughnessMap.needsUpdate = true;
          }
          if (pbrMat.metalnessMap) {
            pbrMat.metalnessMap.colorSpace = THREE.NoColorSpace;
            pbrMat.metalnessMap.anisotropy = maxAnisotropy;
            pbrMat.metalnessMap.needsUpdate = true;
          }

          if (isCameraModel) {
            pbrMat.roughness = THREE.MathUtils.clamp(
              pbrMat.roughness ?? 0.42,
              0.12,
              0.85
            );
            pbrMat.metalness = THREE.MathUtils.clamp(
              pbrMat.metalness ?? 0.15,
              0.08,
              0.85
            );
            pbrMat.envMapIntensity = 1.15;
          } else if (modelId === 'dragon-relic') {
            pbrMat.roughness = 0.28;
            pbrMat.metalness = 0.25;
            pbrMat.envMapIntensity = 1.25;
          } else if (modelId === 'lantern-relic') {
            pbrMat.roughness = 0.35;
            pbrMat.metalness = 0.12;
            pbrMat.envMapIntensity = 1.25;
          }

          pbrMat.needsUpdate = true;
          return pbrMat;
        };

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(applyPbrWorkflow);
        } else if (mesh.material) {
          mesh.material = applyPbrWorkflow(mesh.material);
        }
      });
    };

    const attachDynamicScreenToRealGlb = (
      root: THREE.Object3D,
      modelId: StudioModelId
    ) => {
      if (modelId === 'all-in-one-mac') {
        const displayGlass = root.getObjectByName('Display glass');
        if (displayGlass) {
          const screenPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.478, 0.312),
            new THREE.MeshBasicMaterial({ map: crtTexture })
          );
          screenPlane.position.set(0, 0, 0.0022);
          displayGlass.add(screenPlane);
        }
      } else if (modelId === 'retro-laptop') {
        const laptopScreen = root.getObjectByName('classic_laptop_screen');
        if (laptopScreen) {
          const screenPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.444, 0.362),
            new THREE.MeshBasicMaterial({ map: crtTexture })
          );
          screenPlane.position.set(0.0004, 0.2416, 0.0072);
          laptopScreen.add(screenPlane);
        }
      } else if (modelId === 'dslr-camera' || modelId === 'compact-camera') {
        const insetGlass = root.getObjectByName('Inset display glass');
        if (insetGlass) {
          cameraLcdTexture.colorSpace = sRGBEncoding;
          const lcdMat = new THREE.MeshStandardMaterial({
            map: cameraLcdTexture,
            normalMap: cameraPbrMaps.normalMap,
            roughnessMap: cameraPbrMaps.roughnessMap,
            metalnessMap: cameraPbrMaps.metalnessMap,
            roughness: 0.2,
            metalness: 0.1,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: cameraLcdTexture,
            emissiveIntensity: 0.35,
          });
          const lcdPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.093, 0.059),
            lcdMat
          );
          lcdPlane.rotation.y = Math.PI;
          lcdPlane.position.set(0, 0, -0.0016);
          insetGlass.add(lcdPlane);
        }
      } else if (modelId === 'iphone-real') {
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            const matName = (m.material as THREE.Material)?.name || '';
            if (
              child.name.includes('Front_Screen') ||
              child.name.includes('scr') ||
              matName === 'COLOUR_Cherry_Screen' ||
              matName === 'material_10'
            ) {
              m.material = new THREE.MeshBasicMaterial({
                map: phoneTexture,
              });
            }
          }
        });
      }
    };

    const buildNormalizedEntry = (
      rawRoot: THREE.Group,
      animations: THREE.AnimationClip[],
      scaleMult: number,
      initRot: [number, number, number],
      modelId: StudioModelId
    ) => {
      const wrapper = new THREE.Group();
      wrapper.add(rawRoot);

      rawRoot.updateWorldMatrix(true, true);
      const box = new THREE.Box3();
      const childBox = new THREE.Box3();
      rawRoot.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const geom = (child as THREE.Mesh).geometry;
          if (!geom.boundingBox) geom.computeBoundingBox();
          if (geom.boundingBox) {
            childBox.copy(geom.boundingBox).applyMatrix4(child.matrixWorld);
            box.union(childBox);
          }
        }
      });
      if (box.isEmpty()) {
        box.setFromObject(rawRoot);
      }

      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const normScale = (1.0 / maxDim) * scaleMult;

      rawRoot.position.sub(center);
      wrapper.scale.setScalar(normScale);
      wrapper.rotation.set(initRot[0], initRot[1], initRot[2]);

      updateCameraModelMaterials(rawRoot, modelId);
      attachDynamicScreenToRealGlb(rawRoot, modelId);

      return { wrapper, rawRoot, animations };
    };

    const mountCachedEntry = (
      entry: {
        wrapper: THREE.Group;
        rawRoot: THREE.Object3D;
        animations: THREE.AnimationClip[];
      },
      initRot: [number, number, number]
    ) => {
      while (centerModelHolder.children.length > 0) {
        centerModelHolder.remove(centerModelHolder.children[0]);
      }
      if (activeMixer) {
        activeMixer.stopAllAction();
        activeMixer = null;
      }

      entry.wrapper.rotation.set(initRot[0], initRot[1], initRot[2]);
      centerModelHolder.add(entry.wrapper);

      if (entry.animations && entry.animations.length > 0) {
        activeMixer = new THREE.AnimationMixer(entry.rawRoot);
        entry.animations.forEach((clip) => {
          activeMixer!.clipAction(clip).play();
        });
      }
    };

    const allArtifacts = PLANETS.flatMap((p) => p.studioArtifacts);

    const fetchAndCacheModel = (
      spec: (typeof allArtifacts)[number],
      onReady?: (entry: {
        wrapper: THREE.Group;
        rawRoot: THREE.Object3D;
        animations: THREE.AnimationClip[];
      }) => void,
      onError?: () => void
    ) => {
      const url = spec.modelUrl;
      if (glbCache.has(url)) {
        onReady?.(glbCache.get(url)!);
        return;
      }
      if (pendingLoads.has(url)) {
        if (onReady) pendingLoads.get(url)!.push(onReady);
        return;
      }
      pendingLoads.set(url, onReady ? [onReady] : []);

      gltfLoader.load(
        url,
        (gltf) => {
          const entry = buildNormalizedEntry(
            gltf.scene,
            gltf.animations || [],
            spec.scaleMultiplier,
            spec.initialRotation,
            spec.id
          );
          glbCache.set(url, entry);
          const waiters = pendingLoads.get(url) || [];
          pendingLoads.delete(url);
          waiters.forEach((cb) => cb(entry));
        },
        undefined,
        () => {
          pendingLoads.delete(url);
          onError?.();
        }
      );
    };

    const loadStudioModel = (modelId: StudioModelId) => {
      const token = ++currentLoadToken;
      const spec =
        allArtifacts.find((a) => a.id === modelId) || allArtifacts[0];
      if (!spec?.modelUrl) return;

      if (glbCache.has(spec.modelUrl)) {
        callbacksRef.current.onModelLoadStateChange?.(false);
        mountCachedEntry(glbCache.get(spec.modelUrl)!, spec.initialRotation);
        return;
      }

      callbacksRef.current.onModelLoadStateChange?.(true);
      fetchAndCacheModel(
        spec,
        (entry) => {
          if (token !== currentLoadToken) return;
          callbacksRef.current.onModelLoadStateChange?.(false);
          mountCachedEntry(entry, spec.initialRotation);
        },
        () => {
          if (token !== currentLoadToken) return;
          callbacksRef.current.onModelLoadStateChange?.(false);
        }
      );
    };

    const handleUploadRelicFiles = async (
      slotId: 'dragon-relic' | 'lantern-relic',
      files: File[]
    ) => {
      if (!files || files.length === 0) return;
      const spec =
        allArtifacts.find((a) => a.id === slotId) || allArtifacts[0];
      if (!spec) return;

      callbacksRef.current.onModelLoadStateChange?.(true);

      try {
        const glbFile = files.find((f) => /\.(glb|gltf)$/i.test(f.name));
        const objFile = files.find((f) => /\.(obj|txt)$/i.test(f.name));
        const mtlFile = files.find((f) => /\.mtl$/i.test(f.name));
        const imageFiles = files.filter((f) =>
          /\.(jpg|jpeg|png|webp|bmp)$/i.test(f.name)
        );

        const persistGlbBufferToServer = async (buffer: ArrayBuffer) => {
          try {
            const resp = await fetch(`/api/save-relic?slot=${slotId}`, {
              method: 'POST',
              body: buffer,
            });
            return resp.ok;
          } catch {
            return false;
          }
        };

        if (glbFile) {
          const arrayBuffer = await glbFile.arrayBuffer();
          gltfLoader.parse(
            arrayBuffer.slice(0),
            '',
            async (gltf) => {
              const entry = buildNormalizedEntry(
                gltf.scene,
                gltf.animations || [],
                spec.scaleMultiplier,
                spec.initialRotation,
                slotId
              );
              glbCache.set(spec.modelUrl, entry);
              if (stateRef.current.activeStudioModelId === slotId) {
                mountCachedEntry(entry, spec.initialRotation);
              }
              callbacksRef.current.onModelLoadStateChange?.(false);
              const saved = await persistGlbBufferToServer(arrayBuffer);
              const cleanName = glbFile.name.replace(/\.[^/.]+$/, '');
              callbacksRef.current.onRelicSaved?.(
                slotId,
                `${cleanName} (.GLB)`,
                saved
              );
            },
            () => {
              callbacksRef.current.onModelLoadStateChange?.(false);
            }
          );
          return;
        }

        if (objFile) {
          const objText = await objFile.text();
          const blobUrlByBasename = new Map<string, string>();
          let fallbackBlobUrl: string | null = null;

          for (const imgFile of imageFiles) {
            const bUrl = URL.createObjectURL(imgFile);
            const base = imgFile.name.split(/[/\\]/).pop()!.toLowerCase();
            blobUrlByBasename.set(base, bUrl);
            if (!fallbackBlobUrl) fallbackBlobUrl = bUrl;
          }

          let loadedPrimaryTexture: THREE.Texture | null = null;
          if (fallbackBlobUrl) {
            loadedPrimaryTexture = await new Promise<THREE.Texture | null>(
              (resolve) => {
                texLoader.load(
                  fallbackBlobUrl!,
                  (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = maxAnisotropy;
                    tex.needsUpdate = true;
                    resolve(tex);
                  },
                  undefined,
                  () => resolve(null)
                );
              }
            );
          }

          const manager = new THREE.LoadingManager();
          manager.setURLModifier((url) => {
            const base = url.split(/[/\\]/).pop()?.toLowerCase() || '';
            if (blobUrlByBasename.has(base)) {
              return blobUrlByBasename.get(base)!;
            }
            return fallbackBlobUrl || url;
          });

          const objLoader = new OBJLoader(manager);
          if (mtlFile) {
            const mtlText = await mtlFile.text();
            const mtlLoader = new MTLLoader(manager);
            const materials = mtlLoader.parse(mtlText, '');
            materials.preload();
            objLoader.setMaterials(materials);
          }

          const parsedGroup = objLoader.parse(objText);
          parsedGroup.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;
            if (mesh.geometry && !mesh.geometry.attributes.normal) {
              mesh.geometry.computeVertexNormals();
            }
            const upgradeMat = (m: THREE.Material) => {
              const existingMap = (m as THREE.MeshStandardMaterial).map;
              const finalMap = existingMap || loadedPrimaryTexture || null;
              if (finalMap) {
                finalMap.colorSpace = THREE.SRGBColorSpace;
                finalMap.anisotropy = maxAnisotropy;
                finalMap.needsUpdate = true;
              }
              return new THREE.MeshStandardMaterial({
                name: m.name || 'RelicMaterial',
                color: finalMap ? 0xffffff : 0xd6c7b2,
                map: finalMap,
                roughness: 0.62,
                metalness: 0.08,
              });
            };
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map(upgradeMat);
            } else if (mesh.material) {
              mesh.material = upgradeMat(mesh.material);
            }
          });

          const exportClone = parsedGroup.clone(true);
          const entry = buildNormalizedEntry(
            parsedGroup,
            [],
            spec.scaleMultiplier,
            spec.initialRotation,
            slotId
          );
          glbCache.set(spec.modelUrl, entry);
          if (stateRef.current.activeStudioModelId === slotId) {
            mountCachedEntry(entry, spec.initialRotation);
          }
          callbacksRef.current.onModelLoadStateChange?.(false);

          const cleanName = objFile.name.replace(/\.[^/.]+$/, '');
          const exporter = new GLTFExporter();
          exporter.parse(
            exportClone,
            async (result) => {
              if (result instanceof ArrayBuffer) {
                const saved = await persistGlbBufferToServer(result);
                callbacksRef.current.onRelicSaved?.(
                  slotId,
                  `${cleanName} (.OBJ 实测文物)`,
                  saved
                );
              } else {
                callbacksRef.current.onRelicSaved?.(
                  slotId,
                  `${cleanName} (.OBJ 实测文物)`,
                  false
                );
              }
            },
            () => {
              callbacksRef.current.onRelicSaved?.(
                slotId,
                `${cleanName} (.OBJ 实测文物)`,
                false
              );
            },
            { binary: true }
          );
        } else {
          callbacksRef.current.onModelLoadStateChange?.(false);
        }
      } catch {
        callbacksRef.current.onModelLoadStateChange?.(false);
      }
    };

    loadStudioModelFnRef.current = loadStudioModel;
    uploadRelicFilesFnRef.current = handleUploadRelicFiles;
    loadStudioModel(stateRef.current.activeStudioModelId);

    const preloadTimer = window.setTimeout(() => {
      const priorityIds: StudioModelId[] = [
        'dragon-relic',
        'lantern-relic',
        'ion-drive',
        'retro-laptop',
        'dslr-camera',
        'iphone-real',
      ];
      priorityIds.forEach((id) => {
        const s = allArtifacts.find((a) => a.id === id);
        if (s) fetchAndCacheModel(s);
      });
    }, 150);

    renderer.compile(scene, camera);

    // 5. Pointer Drag, Hover Instrument Lock & Click Raycasting
    const raycaster = new THREE.Raycaster();
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;
    let lastHoverCheck = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevPointerX;
        const dy = e.clientY - prevPointerY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        stateRef.current.userRotY += dx * 0.008;
        stateRef.current.userRotX = THREE.MathUtils.clamp(
          stateRef.current.userRotX + dy * 0.006,
          -0.75,
          0.75
        );
        return;
      }

      const now = performance.now();
      if (now - lastHoverCheck < 36) return;
      lastHoverCheck = now;

      if (stateRef.current.worldMode === 'intro') {
        _mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        _mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(_mouse, camera);

        const hits = raycaster.intersectObjects(planetClickMeshes, false);
        const hitPid =
          hits.length > 0
            ? (hits[0].object.userData.planetId as PlanetId)
            : null;

        if (stateRef.current.hoveredPlanetId !== hitPid) {
          stateRef.current.hoveredPlanetId = hitPid;
          callbacksRef.current.onPlanetHoverChange?.(hitPid);
        }
        document.body.style.cursor = hitPid ? 'pointer' : 'grab';
      } else if (stateRef.current.focusedPlanetId === 'awards') {
        document.body.style.cursor = 'default';
      } else {
        document.body.style.cursor = 'grab';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDragging = false;
      const moveDist = Math.hypot(
        e.clientX - pointerDownX,
        e.clientY - pointerDownY
      );
      if (moveDist > 6) return;

      _mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      _mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(_mouse, camera);

      if (stateRef.current.worldMode === 'intro') {
        const planetHits = raycaster.intersectObjects(planetClickMeshes, false);
        if (planetHits.length > 0) {
          const pid = planetHits[0].object.userData.planetId as PlanetId;
          if (pid) {
            if (pid === stateRef.current.focusedPlanetId) {
              callbacksRef.current.onEnterWhiteSpace(pid);
            } else {
              callbacksRef.current.onFocusPlanetInIntro(pid);
            }
          }
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 6. Main Animation Loop
    const clock = new THREE.Clock();
    let animFrameId = 0;
    let lastCrtRedraw = 0;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      if (activeMixer) {
        activeMixer.update(dt);
      }

      st.warpBoost = THREE.MathUtils.damp(st.warpBoost, 0, 3.2, dt);
      const targetWhite = st.worldMode === 'white-space' ? 1.0 : 0.0;
      st.whiteBlend = THREE.MathUtils.damp(st.whiteBlend, targetWhite, 5.5, dt);

      _lerpBgColor.copy(_darkBgColor).lerp(_whiteStudioColor, st.whiteBlend);
      (scene.background as THREE.Color).copy(_lerpBgColor);
      sceneFog.color.copy(_lerpBgColor);
      sceneFog.density = THREE.MathUtils.lerp(0.011, 0.004, st.whiteBlend);

      const isStaticGallery =
        st.worldMode === 'white-space' && st.focusedPlanetId === 'awards';

      cosmicIntroGroup.visible = st.whiteBlend < 0.85;
      whiteStudioGroup.visible = st.whiteBlend > 0.15 && !isStaticGallery;

      const targetFov = 42 + st.warpBoost * 24;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, dt);
        camera.updateProjectionMatrix();
      }

      if (st.worldMode === 'intro') {
        const stretchZ = 1 + st.warpBoost * 18;
        for (let i = 0; i < starCount; i++) {
          let sz = starCoords[i * 3 + 2] + elapsed * (1.2 + st.warpBoost * 24);
          sz = ((sz + 95) % 115) - 95;
          _dummy.position.set(starCoords[i * 3], starCoords[i * 3 + 1], sz);
          _dummy.scale.set(1, 1, stretchZ);
          _dummy.updateMatrix();
          starInstanced.setMatrixAt(i, _dummy.matrix);
        }
        starInstanced.instanceMatrix.needsUpdate = true;

        // Subtle Dune 3D atmospheric stardust drift & camera parallax
        stardustPoints.rotation.y = elapsed * 0.009 - st.userRotY * 0.15;
        stardustPoints.rotation.x = Math.sin(elapsed * 0.12) * 0.02 - st.userRotX * 0.12;
        stardustPoints.position.x = THREE.MathUtils.damp(
          stardustPoints.position.x,
          -camera.position.x * 0.06,
          3.0,
          dt
        );
        stardustPoints.position.y = THREE.MathUtils.damp(
          stardustPoints.position.y,
          -camera.position.y * 0.06,
          3.0,
          dt
        );

        // Authentic physical rotation on planet bodies ONLY (no flash, no wild tumbling)
        planetBodiesMap.forEach((bodyGrp) => {
          bodyGrp.rotation.y = elapsed * 0.12 + st.userRotY * 0.5;
        });

        // Starfield Astrometric Survey Rig: Steady Plane, In-Plane Rotation, Stops on Hover
        PLANETS.forEach((pData, idx) => {
          const inst = planetInstrumentMap.get(pData.id);
          if (!inst) return;

          const isFocused = st.focusedPlanetId === pData.id;
          const isHovered =
            st.hoveredPlanetId === pData.id ||
            (isFocused && st.isInstrumentHovered);
          const isActive = isFocused || isHovered;
          const phase = elapsed * 1.35 + idx * 1.1;
          const breathePulse = Math.sin(phase);

          // Focused planet stays continuously in the selected state with gentle breathing luminance
          const targetDialOpacity = isActive ? 0.86 + breathePulse * 0.08 : 0.22;
          const targetVernierOpacity = isActive ? 0.76 + breathePulse * 0.1 : 0.16;
          const targetOrbitOpacity = isActive ? 0.52 + breathePulse * 0.08 : 0.18;
          const targetHarmonicOpacity = isActive ? 0.44 + breathePulse * 0.08 : 0.12;

          inst.outerDialMat.opacity = THREE.MathUtils.damp(
            inst.outerDialMat.opacity,
            targetDialOpacity,
            8,
            dt
          );
          inst.innerVernierMat.opacity = THREE.MathUtils.damp(
            inst.innerVernierMat.opacity,
            targetVernierOpacity,
            8,
            dt
          );
          inst.orbitMat.opacity = THREE.MathUtils.damp(
            inst.orbitMat.opacity,
            targetOrbitOpacity,
            8,
            dt
          );
          inst.harmonicOrbitMat.opacity = THREE.MathUtils.damp(
            inst.harmonicOrbitMat.opacity,
            targetHarmonicOpacity,
            8,
            dt
          );

          // Keep the ring plane 100% steady (no front-back pitching or tilting)
          inst.surveyRig.rotation.set(0, 0, 0);

          // Pause rotation smoothly when mouse hovers over the planet
          const targetSpinSpeed = isHovered ? 0.0 : 1.0;
          inst.spinSpeed = THREE.MathUtils.damp(
            inst.spinSpeed,
            targetSpinSpeed,
            12,
            dt
          );
          inst.spinAngle += dt * inst.spinSpeed;

          // In-plane rotation (outer ring clockwise, inner vernier ring counter-clockwise) + subtle radial breathing
          inst.outerDialMesh.rotation.z = inst.spinAngle * 0.14;
          const dialScale = 1.0 + Math.sin(phase) * 0.032;
          inst.outerDialMesh.scale.setScalar(dialScale);

          inst.innerVernierLine.rotation.z = -inst.spinAngle * 0.22;
          const vernierScale = 1.0 + Math.sin(phase - 0.8) * 0.036;
          inst.innerVernierLine.scale.setScalar(vernierScale);
        });

        const planet =
          PLANETS.find((p) => p.id === st.focusedPlanetId) || PLANETS[0];
        const [px, py, pz] = planet.position;
        _targetCamPos.set(px, py + 0.12, pz + 9.2);
        _targetLookAt.set(px, py - 0.28, pz);
      } else {
        _targetCamPos.set(0, 0.2, 5.2);
        _targetLookAt.set(0, 0, 0);

        centerModelHolder.rotation.y =
          st.scrollProgress * Math.PI * 2 + st.userRotY;
        centerModelHolder.rotation.x = st.userRotX;

        if (elapsed - lastCrtRedraw > 0.06) {
          lastCrtRedraw = elapsed;
          if (
            st.activeStudioModelId === 'all-in-one-mac' ||
            st.activeStudioModelId === 'retro-laptop'
          ) {
            drawRetroMacTerminalCanvas(
              crtCanvas,
              st.macViewIndex,
              st.reflexArchIndex,
              st.slicingEnabled,
              elapsed
            );
            crtTexture.needsUpdate = true;
          } else if (st.activeStudioModelId === 'dslr-camera') {
            drawSonyCameraLcdCanvas(cameraLcdCanvas, elapsed);
            cameraLcdTexture.needsUpdate = true;
          } else if (st.activeStudioModelId === 'iphone-real') {
            drawSmartphoneScreenCanvas(
              phoneCanvas,
              st.phonePresetIndex,
              st.customPhoneImage,
              elapsed
            );
            phoneTexture.needsUpdate = true;
          }
        }
      }

      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        _targetCamPos.x,
        4.8,
        dt
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        _targetCamPos.y,
        4.8,
        dt
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        _targetCamPos.z,
        4.8,
        dt
      );

      _currentLookAt.x = THREE.MathUtils.damp(
        _currentLookAt.x,
        _targetLookAt.x,
        5.5,
        dt
      );
      _currentLookAt.y = THREE.MathUtils.damp(
        _currentLookAt.y,
        _targetLookAt.y,
        5.5,
        dt
      );
      _currentLookAt.z = THREE.MathUtils.damp(
        _currentLookAt.z,
        _targetLookAt.z,
        5.5,
        dt
      );
      camera.lookAt(_currentLookAt);

      // Update 60fps Screen-Space Starfield Reticle & Off-Axis Celestial Waypoints in Intro Mode
      if (st.worldMode === 'intro' && st.whiteBlend < 0.25) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const focusedPlanet =
          PLANETS.find((p) => p.id === st.focusedPlanetId) || PLANETS[0];

        if (reticleDomRef.current) {
          _projCenter.set(...focusedPlanet.position).project(camera);
          _projEdge
            .set(
              focusedPlanet.position[0] + focusedPlanet.radius * 1.48,
              focusedPlanet.position[1],
              focusedPlanet.position[2]
            )
            .project(camera);

          if (_projCenter.z < 1.0) {
            const sx = (_projCenter.x * 0.5 + 0.5) * vw;
            const sy = (-_projCenter.y * 0.5 + 0.5) * vh;
            const edgeX = (_projEdge.x * 0.5 + 0.5) * vw;
            const baseRadius = Math.max(84, Math.min(220, Math.abs(edgeX - sx)));
            const breatheRadius = baseRadius * (1 + Math.sin(elapsed * 1.35) * 0.032);

            reticleDomRef.current.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
            reticleDomRef.current.style.setProperty(
              '--reticle-r',
              `${breatheRadius.toFixed(1)}px`
            );
            reticleDomRef.current.style.opacity = String(1 - st.whiteBlend * 4);
          }
        }

        // Project distant non-focused planets as subtle off-axis celestial telemetry markers
        PLANETS.forEach((p) => {
          const wpEl = waypointDomRefs.current[p.id];
          if (!wpEl) return;
          if (p.id === st.focusedPlanetId) {
            wpEl.style.opacity = '0';
            wpEl.style.pointerEvents = 'none';
            return;
          }
          _projCenter.set(...p.position).project(camera);
          if (
            _projCenter.z > 0 &&
            _projCenter.z < 1.0 &&
            Math.abs(_projCenter.x) < 0.94 &&
            Math.abs(_projCenter.y) < 0.88
          ) {
            const wx = (_projCenter.x * 0.5 + 0.5) * vw;
            const wy = (-_projCenter.y * 0.5 + 0.5) * vh;
            wpEl.style.transform = `translate3d(${wx.toFixed(1)}px, ${wy.toFixed(1)}px, 0)`;
            const isWpHovered = st.hoveredPlanetId === p.id;
            wpEl.style.opacity = isWpHovered ? '0.95' : '0.35';
            wpEl.style.pointerEvents = 'auto';
          } else {
            wpEl.style.opacity = '0';
            wpEl.style.pointerEvents = 'none';
          }
        });
      }

      renderer.render(scene, camera);
    };

    drawRetroMacTerminalCanvas(crtCanvas, 0, 0, true, 0);
    crtTexture.needsUpdate = true;
    drawSonyCameraLcdCanvas(cameraLcdCanvas, 0);
    cameraLcdTexture.needsUpdate = true;
    drawSmartphoneScreenCanvas(phoneCanvas, 0, null, 0);
    phoneTexture.needsUpdate = true;

    animFrameId = requestAnimationFrame(animate);

    return () => {
      window.clearTimeout(preloadTimer);
      cancelAnimationFrame(animFrameId);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      dracoLoader.dispose();
      renderer.dispose();
      if (domElem.parentNode === container) {
        container.removeChild(domElem);
      }
    };
  }, []);

  const currentPlanet =
    PLANETS.find((p) => p.id === focusedPlanetId) || PLANETS[0];

  return (
    <>
      <div
        ref={canvasMountRef}
        className="fixed inset-0 w-full h-full z-0"
        aria-label="Three.js Dual-World 3D Stage"
      />

      {/* Screen-Space Starfield Astrometric Reticle & Corner Lock Brackets (Always Active on Focused Planet) */}
      {worldMode === 'intro' && (
        <div
          className="fixed inset-0 z-[5] pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Focused Planet Always-Locked 4-Corner Right-Angle Reticle ([ and ]) + Leader Callout */}
          <div
            ref={reticleDomRef}
            className="absolute top-0 left-0 will-change-transform"
            style={{ '--reticle-r': '128px' } as React.CSSProperties}
          >
            {/* 4 Corner Right-Angle Lock Brackets ([ and ]) around the Planet */}
            <div
              className="relative -translate-x-1/2 -translate-y-1/2 opacity-90"
              style={{
                width: 'calc(var(--reticle-r) * 2.15)',
                height: 'calc(var(--reticle-r) * 2.15)',
              }}
            >
              {/* Top-Left Corner Bracket */}
              <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-[1.5px] border-l-[1.5px] border-white" />
              {/* Top-Right Corner Bracket */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t-[1.5px] border-r-[1.5px] border-white" />
              {/* Bottom-Left Corner Bracket */}
              <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-[1.5px] border-l-[1.5px] border-white" />
              {/* Bottom-Right Corner Bracket */}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-[1.5px] border-r-[1.5px] border-white" />

              {/* Subtle Cardinal Crosshair Hairlines */}
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-white/70" />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-white/70" />
              <span className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-2 h-[1px] bg-white/70" />
              <span className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-2 h-[1px] bg-white/70" />

              {/* Left Flank Astrometric Vernier Scale (Desktop) */}
              <div className="hidden md:flex flex-col items-end justify-between absolute top-1/2 -translate-y-1/2 right-[calc(100%+22px)] h-28 font-mono-tabular text-[10px] tracking-[0.2em] text-white whitespace-nowrap">
                <span>+15° // APOGEE</span>
                <div className="flex items-center gap-2 opacity-75">
                  <span>{currentPlanet.astrometry.signalFreq}</span>
                  <span className="w-5 h-[1px] bg-white" />
                </div>
                <span>-15° // PERIGEE</span>
              </div>

              {/* Right Flank Starfield Instrument Leader Line & Telemetry Callout (Desktop) */}
              <div className="hidden md:flex items-start absolute top-[18%] left-[calc(100%+10px)] whitespace-nowrap">
                {/* Diagonal + Horizontal Hairline Leader */}
                <svg
                  width="64"
                  height="28"
                  viewBox="0 0 64 28"
                  className="shrink-0 overflow-visible"
                >
                  <polyline
                    points="0,24 18,4 62,4"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.1"
                  />
                  <circle cx="0" cy="24" r="2" fill="white" />
                </svg>

                <div className="pl-2 -mt-1.5 space-y-1 font-mono-tabular text-left">
                  <div className="text-[11px] font-semibold tracking-[0.22em] text-white">
                    [ {currentPlanet.astrometry.designation} ]
                  </div>
                  <div className="text-[10px] tracking-[0.16em] text-slate-300">
                    {currentPlanet.astrometry.coordinates}
                  </div>
                  <div className="text-[10px] tracking-[0.16em] text-slate-400">
                    {currentPlanet.astrometry.orbitSpecs}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Off-Axis Deep-Space Celestial Waypoint Markers for Non-Focused Planets */}
          {PLANETS.map((p) => (
            <button
              key={p.id}
              ref={(el) => {
                waypointDomRefs.current[p.id] = el;
              }}
              type="button"
              onClick={() => onFocusPlanetInIntro(p.id)}
              onMouseEnter={() => onPlanetHoverChange?.(p.id)}
              onMouseLeave={() => onPlanetHoverChange?.(null)}
              className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 font-mono-tabular text-[10px] tracking-[0.18em] text-white transition-opacity duration-150 cursor-pointer group"
              style={{ opacity: 0, pointerEvents: 'none' }}
            >
              <span className="relative flex items-center justify-center w-5 h-5">
                <span className="absolute inset-0 border border-white/60 rotate-45 group-hover:scale-110 transition-transform" />
                <span className="w-1 h-1 bg-white" />
              </span>
              <span className="whitespace-nowrap spatial-text-glow">
                {p.index} // {p.astrometry.designation}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
};
