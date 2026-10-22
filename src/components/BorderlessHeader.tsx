import React from 'react';
import { PLANETS, PlanetId } from '../data/portfolioData';

interface BorderlessHeaderProps {
  worldMode: 'intro' | 'white-space';
  focusedPlanetId: PlanetId;
  onReturnToLanding: () => void;
  onReturnToIntro: () => void;
  onSelectPlanet: (planetId: PlanetId) => void;
  onOpenFullResumeModal: () => void;
}

export const BorderlessHeader: React.FC<BorderlessHeaderProps> = ({
  worldMode,
  focusedPlanetId,
  onReturnToLanding,
  onReturnToIntro,
  onSelectPlanet,
  onOpenFullResumeModal,
}) => {
  const isWhite = worldMode === 'white-space';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-4 px-6 md:px-10 xl:px-14 py-5 pointer-events-auto transition-colors duration-300 ${
        isWhite ? 'bg-[#F8FAFC]/85 backdrop-blur-md border-b border-slate-200/80' : ''
      }`}
    >
      {/* Zone 1: Original Bold Display Wordmark ("殷添行 YIN TIANXING" kept as before, clicks back to Landing Hero) */}
      <button
        type="button"
        onClick={onReturnToLanding}
        className={`font-display text-lg md:text-xl font-bold tracking-tight transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          isWhite
            ? 'text-slate-900 hover:text-sky-600'
            : 'text-slate-50 hover:text-sky-400 spatial-text-glow'
        }`}
      >
        殷添行 YIN TIANXING
      </button>

      {/* Zone 2: Minimalist Single-Console Navigation */}
      <nav
        aria-label="主导航"
        className="flex flex-wrap items-center gap-5 md:gap-8 text-xs md:text-sm font-medium"
      >
        <button
          type="button"
          onClick={onReturnToIntro}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            !isWhite
              ? 'text-sky-400 underline underline-offset-8 decoration-sky-400/80 spatial-text-glow'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          00. 星际导航
        </button>

        {PLANETS.map((planet) => {
          const isActive = focusedPlanetId === planet.id && isWhite;
          const isFocusedInIntro = focusedPlanetId === planet.id && !isWhite;
          return (
            <button
              key={planet.id}
              type="button"
              onClick={() => onSelectPlanet(planet.id)}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isWhite
                  ? isActive
                    ? 'text-slate-950 font-bold underline underline-offset-8 decoration-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                  : isFocusedInIntro
                  ? 'text-white font-semibold underline underline-offset-8 decoration-sky-400/70 spatial-text-glow'
                  : 'text-slate-400 hover:text-slate-100 spatial-text-glow'
              }`}
            >
              {planet.index}. {planet.name}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Contact / Overview */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenFullResumeModal}
          className={`text-xs md:text-sm font-semibold tracking-wide underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isWhite
              ? 'text-slate-900 hover:text-sky-600 decoration-slate-900/40'
              : 'text-sky-400 hover:text-amber-400 decoration-sky-400/60 spatial-text-glow'
          }`}
        >
          作品总览 · 联系
        </button>
      </div>
    </header>
  );
};
