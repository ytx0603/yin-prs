import React from 'react';
import {
  PROFILE_DATA,
  PLANETS,
  SKILL_CONSTELLATION,
  PlanetId,
} from '../data/portfolioData';

interface FullResumeModalProps {
  open: boolean;
  onClose: () => void;
  onJumpToArchive: (planetId: PlanetId) => void;
}

export const FullResumeModal: React.FC<FullResumeModalProps> = ({
  open,
  onClose,
  onJumpToArchive,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-30 bg-[#04060A]/95 overflow-y-auto px-6 md:px-16 lg:px-28 py-16 pointer-events-auto text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="殷添行作品总览与联系"
    >
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex flex-wrap items-baseline justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs tracking-widest text-sky-400">
              {PROFILE_DATA.roleTarget}
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              {PROFILE_DATA.name}{' '}
              <span className="text-slate-400 font-normal text-2xl md:text-3xl ml-2">
                {PROFILE_DATA.englishName}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-slate-300">
              <span>电话：{PROFILE_DATA.phone}</span>
              <span aria-hidden="true">·</span>
              <span>邮箱：{PROFILE_DATA.email}</span>
              <span aria-hidden="true">·</span>
              <span>作品平台：{PROFILE_DATA.website}</span>
            </div>
            <div className="text-xs text-slate-400 pt-1">
              {PROFILE_DATA.education}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold tracking-wider text-amber-400 hover:text-amber-300 underline underline-offset-8 cursor-pointer"
          >
            ✕ 关闭返回 [ESC]
          </button>
        </div>

        {/* Four Exhibition Spaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {PLANETS.map((planet) => (
            <div key={planet.id} className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="text-sm font-bold"
                    style={{ color: planet.colorHex }}
                  >
                    {planet.index}.
                  </span>
                  <h3 className="font-display text-xl font-bold text-white">
                    {planet.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onJumpToArchive(planet.id);
                  }}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-4 cursor-pointer"
                >
                  进入展厅 ↗
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {planet.introSubtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Technical & Visual Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {SKILL_CONSTELLATION.map((group) => (
            <div key={group.category} className="space-y-2">
              <div className="text-xs font-semibold tracking-wider text-sky-400">
                {group.category}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-300">
                {group.items.map((item, idx) => (
                  <React.Fragment key={item}>
                    <span>{item}</span>
                    {idx < group.items.length - 1 && (
                      <span className="text-slate-600" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
