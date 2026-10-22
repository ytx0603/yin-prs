/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PLANETS, PlanetId, StudioModelId } from './data/portfolioData';
import { PureLandingHero } from './components/PureLandingHero';
import { CosmicStage3D } from './components/CosmicStage3D';
import { BorderlessHeader } from './components/BorderlessHeader';
import { ArchiveInteractiveOverlay } from './components/ArchiveInteractiveOverlay';
import { FullResumeModal } from './components/FullResumeModal';

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [worldMode, setWorldMode] = useState<'intro' | 'white-space'>('intro');
  const [focusedPlanetId, setFocusedPlanetId] = useState<PlanetId>('heritage');
  const [activeStudioModelId, setActiveStudioModelId] =
    useState<StudioModelId>('dragon-relic');
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [resumeModalOpen, setResumeModalOpen] = useState<boolean>(false);
  const [hoveredPlanetId, setHoveredPlanetId] = useState<PlanetId | null>(null);
  const [isInstrumentHovered, setIsInstrumentHovered] = useState<boolean>(false);

  // Interactive Work Proof States
  const [macViewIndex, setMacViewIndex] = useState<number>(0);
  const [reflexArchIndex, setReflexArchIndex] = useState<number>(0);
  const [slicingEnabled, setSlicingEnabled] = useState<boolean>(true);
  const [phonePresetIndex, setPhonePresetIndex] = useState<number>(0);
  const [customPhoneImage, setCustomPhoneImage] =
    useState<HTMLImageElement | null>(null);
  const [customRelicUpload, setCustomRelicUpload] = useState<{
    slotId: 'dragon-relic' | 'lantern-relic';
    files: File[];
    timestamp: number;
  } | null>(null);
  const [customRelicNames, setCustomRelicNames] = useState<
    Partial<Record<'dragon-relic' | 'lantern-relic', string>>
  >(() => {
    try {
      const raw = localStorage.getItem('hyp_custom_relic_names');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wheelCooldownRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleSelectPlanetInIntro = useCallback((planetId: PlanetId) => {
    setFocusedPlanetId(planetId);
    const planet = PLANETS.find((p) => p.id === planetId) || PLANETS[0];
    if (planet.studioArtifacts.length > 0) {
      setActiveStudioModelId(planet.studioArtifacts[0].id);
    }
  }, []);

  const handleEnterWhiteSpace = useCallback((planetId: PlanetId) => {
    setFocusedPlanetId(planetId);
    const planet = PLANETS.find((p) => p.id === planetId) || PLANETS[0];
    if (planet.studioArtifacts.length > 0) {
      setActiveStudioModelId(planet.studioArtifacts[0].id);
    }
    setScrollProgress(0);
    setShowLanding(false);
    setWorldMode('white-space');
  }, []);

  const handleReturnToIntro = useCallback(() => {
    setShowLanding(false);
    setWorldMode('intro');
  }, []);

  const handleReturnToLanding = useCallback(() => {
    setWorldMode('intro');
    setShowLanding(true);
  }, []);

  // Mouse Wheel Handler:
  // - In 'intro' (when not on Landing): switches between the 4 planets
  // - In 'white-space' (for 3D spaces): rotates the 3D object manually via wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (showLanding || resumeModalOpen) return;

      const target = e.target as HTMLElement | null;
      if (target && target.closest('.no-scrollbar')) {
        const el = target.closest('.no-scrollbar') as HTMLElement;
        if (el.scrollHeight > el.clientHeight + 8) {
          return;
        }
      }

      if (worldMode === 'intro') {
        const now = performance.now();
        if (now - wheelCooldownRef.current < 420) return;
        if (Math.abs(e.deltaY) < 18) return;
        wheelCooldownRef.current = now;

        const dir = e.deltaY > 0 ? 1 : -1;
        const currIdx = PLANETS.findIndex((p) => p.id === focusedPlanetId);
        const nextIdx = (currIdx + dir + PLANETS.length) % PLANETS.length;
        handleSelectPlanetInIntro(PLANETS[nextIdx].id);
      } else if (focusedPlanetId !== 'awards') {
        // Manual wheel rotation of the 3D artifact in the exhibition hall
        setScrollProgress((prev) => prev + e.deltaY * 0.00055);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [
    showLanding,
    worldMode,
    focusedPlanetId,
    resumeModalOpen,
    handleSelectPlanetInIntro,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showLanding) return;
      if (e.key === 'Escape') {
        if (resumeModalOpen) {
          setResumeModalOpen(false);
        } else if (worldMode === 'white-space') {
          handleReturnToIntro();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLanding, resumeModalOpen, worldMode, handleReturnToIntro]);

  const handleUploadPhoneScreenshot = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl) return;
        const img = new Image();
        img.onload = () => {
          setCustomPhoneImage(img);
          showToast('真实手机截图已贴入 iPhone 18 Pro Max 屏幕');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [showToast]
  );

  const handleUploadRelicModel = useCallback(
    (slotId: 'dragon-relic' | 'lantern-relic', fileList: FileList) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;
      setCustomRelicUpload({
        slotId,
        files,
        timestamp: Date.now(),
      });
    },
    []
  );

  const handleRelicSaved = useCallback(
    (
      slotId: 'dragon-relic' | 'lantern-relic',
      displayName: string,
      savedToServer: boolean
    ) => {
      setCustomRelicNames((prev) => {
        const next = { ...prev, [slotId]: displayName };
        try {
          localStorage.setItem('hyp_custom_relic_names', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      showToast(
        savedToServer
          ? `${displayName} 已实时加载并永久写入项目 /models/ 目录`
          : `${displayName} 已实时加载至 3D 展厅`
      );
    },
    [showToast]
  );

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-500 ${
        worldMode === 'white-space' ? 'bg-[#F8FAFC]' : 'bg-[#04060A]'
      }`}
    >
      {/* 0. Initial Pure Hero Landing Page (Press any key to continue into Planetary Navigation) */}
      {showLanding && (
        <PureLandingHero onContinue={() => setShowLanding(false)} />
      )}

      {/* 1. Dual-World Three.js 3D Stage */}
      <CosmicStage3D
        worldMode={worldMode}
        scrollProgress={scrollProgress}
        focusedPlanetId={focusedPlanetId}
        activeStudioModelId={activeStudioModelId}
        macViewIndex={macViewIndex}
        reflexArchIndex={reflexArchIndex}
        slicingEnabled={slicingEnabled}
        phonePresetIndex={phonePresetIndex}
        customPhoneImage={customPhoneImage}
        customRelicUpload={customRelicUpload}
        isInstrumentHovered={
          isInstrumentHovered || hoveredPlanetId === focusedPlanetId
        }
        onPlanetHoverChange={setHoveredPlanetId}
        onFocusPlanetInIntro={handleSelectPlanetInIntro}
        onEnterWhiteSpace={handleEnterWhiteSpace}
        onModelLoadStateChange={setIsLoadingModel}
        onRelicSaved={handleRelicSaved}
      />

      {/* 2. Single Unified Top Navigation Bar (visible once inside Planetary Navigation / Exhibition Spaces) */}
      {!showLanding && (
        <BorderlessHeader
          worldMode={worldMode}
          focusedPlanetId={focusedPlanetId}
          onReturnToLanding={handleReturnToLanding}
          onReturnToIntro={handleReturnToIntro}
          onSelectPlanet={(pid) => {
            if (worldMode === 'white-space') {
              handleEnterWhiteSpace(pid);
            } else {
              handleSelectPlanetInIntro(pid);
            }
          }}
          onOpenFullResumeModal={() => setResumeModalOpen(true)}
        />
      )}

      {/* 3. Open-Space Exhibition Overlay (3D Works + Static Awards Gallery) */}
      {!showLanding && (
        <ArchiveInteractiveOverlay
          worldMode={worldMode}
          focusedPlanetId={focusedPlanetId}
          activeStudioModelId={activeStudioModelId}
          isLoadingModel={isLoadingModel}
          macViewIndex={macViewIndex}
          reflexArchIndex={reflexArchIndex}
          slicingEnabled={slicingEnabled}
          phonePresetIndex={phonePresetIndex}
          hasCustomScreenshot={Boolean(customPhoneImage)}
          onSelectPlanetInIntro={handleSelectPlanetInIntro}
          onEnterWhiteSpace={handleEnterWhiteSpace}
          onReturnToIntro={handleReturnToIntro}
          onSelectStudioModel={setActiveStudioModelId}
          onChangeMacView={setMacViewIndex}
          onChangeReflexArch={setReflexArchIndex}
          onToggleSlicing={() => setSlicingEnabled((prev) => !prev)}
          onChangePhonePreset={setPhonePresetIndex}
          onUploadPhoneScreenshot={handleUploadPhoneScreenshot}
          onClearPhoneScreenshot={() => setCustomPhoneImage(null)}
          customRelicNames={customRelicNames}
          onUploadRelicModel={handleUploadRelicModel}
          isPlanetHovered={hoveredPlanetId === focusedPlanetId}
          onInstrumentHoverChange={setIsInstrumentHovered}
        />
      )}

      {/* 4. Subtle Toast */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-8 z-20 text-xs font-semibold tracking-wider pointer-events-none ${
            worldMode === 'white-space'
              ? 'text-sky-600'
              : 'text-sky-400 spatial-text-glow'
          }`}
        >
          ✦ {toastMessage}
        </div>
      )}

      {/* 5. Overview & Contact Modal */}
      <FullResumeModal
        open={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        onJumpToArchive={(pid) => handleEnterWhiteSpace(pid)}
      />
    </div>
  );
}
