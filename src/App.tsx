/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowUp, Search } from 'lucide-react';
import UnicornBackground from './components/UnicornBackground';
import {
  getImageUrl,
  getRyzeHeroPlayed,
  markRyzeHeroPlayed,
  RYZE_BG,
  RyzeMusicToggleWithLabel,
  RyzeWorkIntroContext,
  useRyzeBgm,
} from './ryze/shared';
import RyzeWorkChapterDetail from './ryze/RyzeWorkChapterDetail';
import { RyzeWorkIntroOverlay, useRyzeWorkIntro } from './ryze/RyzeWorkIntroOverlay';
import { RyzeHero } from './ryze/RyzeHero';
import { RyzeProjectsSection } from './ryze/RyzeProjectsSection';
import { RyzeProjectDetail } from './ryze/RyzeOverview';
import { PROJECTS, TOC_KO } from './data/projects';

// --- Components ---
// 돋보기 렌즈 크기(px) — 가로로 약간 긴 직사각형
const LENS_W = 600;
const LENS_H = 440;

// 프로젝트 사진 + 돋보기(루페).
// 돋보기 모드일 때 사진 위에 마우스를 올리면, 커서 옆에 그 지점을 확대한 렌즈가 따라다닌다.
// 휠로 배율(1.5x~5x)을 조절하며 렌즈에 현재 배율을 표시한다.
// 렌즈 상태는 갤러리 전체에서 단 하나만 유지 → 어떤 경우에도 렌즈가 2개 뜨지 않는다.
const PortfolioImages = React.memo(({ sections, zoomMode }: { sections: any[]; zoomMode?: boolean }) => {
  const [zoom, setZoom] = useState(2.5); // 돋보기 배율
  const [active, setActive] = useState<{ src: string; relX: number; relY: number; rw: number; rh: number; cx: number; cy: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (src: string) => (e: React.MouseEvent<HTMLImageElement>) => {
    if (!zoomMode) return;
    const r = e.currentTarget.getBoundingClientRect();
    setActive({ src, relX: e.clientX - r.left, relY: e.clientY - r.top, rw: r.width, rh: r.height, cx: e.clientX, cy: e.clientY });
  };
  const clear = () => setActive(null);

  // 돋보기 모드가 꺼지면 렌즈 숨김
  useEffect(() => { if (!zoomMode) setActive(null); }, [zoomMode]);

  // 휠 배율 조절: 돋보기 모드 + 사진 위일 때만 가로채 페이지 스크롤을 막는다.
  // (preventDefault 를 위해 passive:false 네이티브 리스너로 등록)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!zoomMode || (e.target as HTMLElement)?.tagName !== 'IMG') return;
      e.preventDefault();
      setZoom((z) => Math.min(5, Math.max(1.5, +(z + (e.deltaY < 0 ? 0.3 : -0.3)).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomMode]);

  // 단일 렌즈 렌더
  let lens: React.ReactNode = null;
  if (zoomMode && active) {
    const bgW = active.rw * zoom;
    const bgH = active.rh * zoom;
    const bgX = -(active.relX * zoom - LENS_W / 2);
    const bgY = -(active.relY * zoom - LENS_H / 2);
    // 렌즈를 커서 중앙에 둔다. bgX/bgY가 커서 지점을 렌즈 중앙에 맞추므로
    // 확대 영역이 실제 커서 위치와 정확히 겹쳐 위치 감각이 또렷해진다(돋보기 유리 느낌).
    const left = active.cx - LENS_W / 2;
    const top = active.cy - LENS_H / 2;
    lens = createPortal(
      <div
        className="fixed z-[100002] pointer-events-none rounded-2xl border border-white/40 shadow-2xl overflow-hidden bg-[#050505]"
        style={{
          left, top, width: LENS_W, height: LENS_H,
          backgroundImage: `url("${active.src}")`,
          backgroundSize: `${bgW}px ${bgH}px`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/10 text-white text-[11px] font-medium tabular-nums backdrop-blur">
          {zoom.toFixed(1)}×
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full max-w-[1300px]">
      {sections.map((section: any, index: number) => {
        const src = getImageUrl(section.image);
        return (
          <div
            id={`section-${section.id}`}
            key={section.id}
            className="w-full mb-0 scroll-mt-24"
          >
            <img
              src={src}
              alt={section.title}
              className={`w-full h-auto block ${zoomMode ? 'cursor-crosshair' : ''}`}
              referrerPolicy="no-referrer"
              decoding="async"
              loading={index < 2 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              draggable={false}
              onMouseMove={handleMove(src)}
              onMouseLeave={clear}
            />
          </div>
        );
      })}
      {lens}
    </div>
  );
});

// 탑버튼/돋보기 버튼 공통 활성화 기준.
// 첫 프로젝트 사진의 윗변이 뷰포트 높이의 20% 지점까지 올라오면(=기여도/회고 정보를 지나
// 사진이 화면을 채우며 "사진을 보고 있는" 지점) true. 사진이 없으면(홈) null → scrollY 폴백.
const PORTFOLIO_TRIGGER_RATIO = 0.2;
const isPortfolioInView = (): boolean | null => {
  const el = document.querySelector('[data-portfolio-start] img');
  if (!el) return null;
  return el.getBoundingClientRect().top <= window.innerHeight * PORTFOLIO_TRIGGER_RATIO;
};

const ScrollToTopButton = React.memo(() => {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const showTopBtnRef = useRef(false);
  const { pathname } = useLocation();
  // Overview(/projects/1)는 자체 카드 스와이프 스크롤을 쓰는 화면이라 이 버튼이 필요 없다 —
  // 아예 렌더링하지 않는다. 그 외 RYZE 화면(프로젝트 목록/Work 챕터/Planning 등)은 밝은
  // 배경(#F5F5F0)을 쓰는 경우가 많아, 기본 다크 테마의 hover(옅은 흰색 틴트)가 배경과
  // 거의 구분되지 않아 "호버하면 버튼이 안 보인다"는 문제가 있었다 — RYZE 화면에서만 호버 시
  // 색을 통째로 반전(배경 #F5F5F0 + 테두리·화살표 #0A0A0A)해 항상 또렷이 보이게 한다.
  const isOverview = pathname === '/projects/1';
  const isRyze = pathname === '/project-new' || pathname.startsWith('/projects/');

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 프로젝트 페이지: 사진 섹션이 들어오면 / 그 외(홈): scrollY 400 기준
          const inView = isPortfolioInView();
          const isPastThreshold = inView === null ? window.scrollY > 400 : inView;
          if (showTopBtnRef.current !== isPastThreshold) {
            showTopBtnRef.current = isPastThreshold;
            setShowTopBtn(isPastThreshold);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isOverview) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {showTopBtn && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          whileHover={isRyze ? { scale: 1.08 } : undefined}
          whileTap={isRyze ? { scale: 0.94 } : undefined}
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white/60 ${
            isRyze
              ? 'transition-[background-color,border-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#F5F5F0] hover:border-[#0A0A0A] hover:text-[#0A0A0A]'
              : 'transition-colors hover:text-white hover:border-white/40 hover:bg-white/10'
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
});

const CurtainTransition = ({ projectId }: { projectId: number }) => {
  if (projectId !== 2) return null;

  const shortTitle = '29CM';
  const isMacOS = typeof window !== 'undefined' ? /Mac|iPod|iPhone|iPad/.test(navigator.userAgent) : false;
  
  const fontStack = isMacOS ? "'Jost', sans-serif" : "'Century Gothic', 'Avant Garde Gothic', sans-serif";
  const logoSizeClass = isMacOS ? "text-[48px] md:text-[96px]" : "text-[72px] md:text-[144px]";
  const descSizeClass = isMacOS ? "text-[8px] md:text-[11px]" : "text-[9px] md:text-[13px]";
  const spacingClass = isMacOS ? "mr-1 md:mr-2" : "mr-1 md:mr-3";
  const gapClass = isMacOS ? "mt-4 md:mt-6" : "mt-6 md:mt-10";
  
  return (
    <motion.div 
      className="fixed inset-x-0 top-0 z-[9999] overflow-hidden bg-[#050505] shadow-[0_30px_60px_rgba(0,0,0,0.4),0_10px_30px_rgba(0,0,0,0.2)]"
      initial={{ height: '100vh' }}
      animate={{ height: '0vh' }}
      transition={{ delay: 2.1, duration: 1.1, ease: [0.05, 0.95, 0.1, 1] }}
    >
      <div className="absolute inset-x-0 top-0 h-[100vh] flex flex-col items-center justify-center">
        {/* Background Video */}
        <motion.video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          src={getImageUrl('29CM/Interaction.webm')}
        />

        {/* Ambient Light */}
        <motion.div 
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{ background: 'radial-gradient(100% 90% at 50% 100%, rgba(228, 107, 34, 0.45) 0%, rgba(228, 107, 34, 0.15) 50%, transparent 100%)' }}
        />
        
        <div 
          className="flex overflow-hidden relative z-10 items-center"
          style={{ fontFamily: fontStack }}
        >
          {shortTitle.split('').map((char, index) => (
            <motion.span
              key={index}
              className={`inline-block tracking-wide md:tracking-[0.05em] text-white ${logoSizeClass} ${spacingClass} last:mr-0 leading-none`}
              style={{ fontWeight: 300, WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              transition={{ delay: index * 0.08 + 0.3, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            >
              {char}
            </motion.span>
          ))}
        </div>
        
        <motion.div
          className={`${gapClass} text-center text-white tracking-[0.1em] md:tracking-[0.15em] ${descSizeClass} leading-[2] relative z-10`}
          style={{ fontFamily: fontStack, fontWeight: 300, WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        >
          <p>29CM IS A CURATED SELECT SHOP FOR REFINED TASTES</p>
          <p>WE HELP OUR CUSTOMERS DISCOVER BETTER CHOICES</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = PROJECTS.find(p => p.id === Number(id));
  
  const [activeSection, setActiveSection] = useState<string>('');
  const [zoomMode, setZoomMode] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(false); // 유도 도움말/펄스 (버튼 등장 5초 후 발동)
  const [showActiveHint, setShowActiveHint] = useState(false); // 활성화 후 사용법 안내(5초)
  const [scrolled, setScrolled] = useState(false); // 프로젝트 사진 섹션 진입 여부
  const hintDone = useRef(false); // 도움말을 이미 보여줬거나 돋보기를 누르면 다시 띄우지 않음

  // 돋보기를 켜면 사용법 안내를 5초간 띄웠다가 자동으로 숨긴다.
  useEffect(() => {
    if (!zoomMode) { setShowActiveHint(false); return; }
    setShowActiveHint(true);
    const t = setTimeout(() => setShowActiveHint(false), 5000);
    return () => clearTimeout(t);
  }, [zoomMode]);

  // 탑버튼·돋보기 버튼은 프로젝트 "사진"을 보고 있는 지점에 들어오면 함께 나타난다.
  useEffect(() => {
    const onScroll = () => setScrolled(isPortfolioInView() === true);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 버튼이 사진 영역에 들어와 나타난 뒤 5초가 지나면 도움말/펄스(마이크로 인터랙션)가 발동하고,
  // 이후 7초간 보여준 뒤 사라진다. (한 번 보여줬거나 사용자가 돋보기를 누르면 다시 띄우지 않음)
  useEffect(() => {
    if (!scrolled || zoomMode || hintDone.current) return;
    const showT = setTimeout(() => setShowZoomHint(true), 5000);
    const hideT = setTimeout(() => { setShowZoomHint(false); hintDone.current = true; }, 12000);
    return () => { clearTimeout(showT); clearTimeout(hideT); };
  }, [scrolled, zoomMode]);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    window.scrollTo(0, 0);
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const onBack = () => navigate('/');

  useEffect(() => {
    if (!project || !project.portfolioSections) return;

    const handleScroll = () => {
      if (isScrolling.current) return;
      
      const sections = project.portfolioSections
        .filter((s: any) => s.id !== 'last' && !s.hideFromToc)
        .map((s: any) => document.getElementById(`section-${s.id}`))
        .filter(Boolean) as HTMLElement[];
        
      let currentActive = '';
      // Find the last section whose top is above the middle of the viewport
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        // Adjust the threshold as needed (e.g., 40% of window height)
        if (rect.top <= window.innerHeight * 0.4) {
          currentActive = section.id.replace('section-', '');
        }
      }
      
      if (currentActive) {
        setActiveSection(prev => prev !== currentActive ? currentActive : prev);
      } else if (sections.length > 0) {
        const firstId = sections[0].id.replace('section-', '');
        setActiveSection(prev => prev !== firstId ? firstId : prev);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger once on mount to set initial active section
    const timeoutId = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [project]);

  if (!project) return <div className="min-h-screen flex items-center justify-center text-white">Project not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: project.id === 2 ? 0 : 0.4 } }}
      exit={{ opacity: 1, transition: { duration: 0.4 } }}
      className="relative min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30"
    >
      <CurtainTransition projectId={project.id} />
      
      {/* Wipe Overlay on Exit */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '-100%' }}
        exit={{ x: '0%' }}
        transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
        className="fixed inset-0 bg-[#050505] z-[100000] pointer-events-none"
      />
      
      {/* Header */}
      <header className="fixed top-0 w-full h-[70px] z-50 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: -70 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: project.id === 2 ? 2.9 : 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 bg-[#050505]/90 border-b border-white/10 pointer-events-auto"
        />
        <div className="absolute inset-0 flex items-center justify-between px-4 md:px-8 lg:px-16 pointer-events-none">
          <motion.button 
            onClick={onBack} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: project.id === 2 ? 3.0 : 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="cursor-pointer text-sm uppercase tracking-widest text-white/60 hover:text-white transition-colors flex items-center gap-2 pointer-events-auto"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to HOME
          </motion.button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] flex flex-col justify-end pb-24 px-4 md:px-8 lg:px-16 overflow-hidden border-b border-white/10">
        {/* Background Media Placeholder */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#050505]">
          {project.unicornProjectId && (
            <div className="absolute inset-0 w-full h-full bg-[#000000]"></div>
          )}
          {project.unicornProjectId ? (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-60 z-10">
              <div className={`w-full h-full flex items-center justify-center ${project.id === 3 ? 'lg:scale-110' : ''}`}>
                <UnicornBackground 
                  projectId={project.unicornProjectId}
                  className="w-full h-full"
                  hideOnMobile={false}
                />
              </div>
            </div>
          ) : (
            <img 
              src={getImageUrl(project.image)} 
              alt={project.title} 
              className="w-full h-full object-cover object-[50%_25%] opacity-60" 
              referrerPolicy="no-referrer"
              fetchPriority="high"
              decoding="async"
            />
          )}
          {/* Gradient overlay to blend with the background */}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent"></div>
          <div className="absolute inset-0 z-20 bg-gradient-to-r from-[#050505]/70 via-[#050505]/10 to-transparent"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: project.id === 2 ? 2.4 : 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-start max-w-[1600px] w-full mx-auto"
        >
          <div className="text-[11px] text-white/40 mb-8 flex items-center gap-2 font-semibold font-sans tracking-normal uppercase">
            <span>{project.detailSubtitle || project.category}</span>
          </div>
          <h1 className="text-[34px] font-bold leading-[1.2] tracking-tight max-w-[1200px] font-sans">
            {project.title}
          </h1>
        </motion.div>
      </section>

      {/* Project Info Section */}
      <section className="w-full bg-[#050505] px-4 md:px-8 lg:px-16 py-12 md:py-16 border-b border-white/10 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: project.id === 2 ? 2.5 : 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-start max-w-[1600px] w-full mx-auto"
        >
          <div className="w-full max-w-[1200px] flex flex-col gap-10 md:gap-16">
            <div className="flex flex-col md:flex-row flex-wrap gap-6 md:gap-16 lg:gap-24">
              <div className="flex flex-col gap-3 min-w-[120px]">
                <span className="text-[13px] text-white/40 uppercase tracking-widest font-medium" style={{ fontFamily: "'Pretendard', sans-serif" }}>기여도</span>
                <p className="text-sm text-white/80 leading-relaxed font-sans">{project.contribution}</p>
              </div>
              <div className="flex flex-col gap-3 min-w-[120px]">
                <span className="text-[13px] text-white/40 uppercase tracking-widest font-medium" style={{ fontFamily: "'Pretendard', sans-serif" }}>작업 기간</span>
                <p className="text-sm text-white/80 leading-relaxed font-sans">{project.duration}</p>
              </div>
              <div className="flex flex-col gap-3 min-w-[120px]">
                <span className="text-[13px] text-white/40 uppercase tracking-widest font-medium" style={{ fontFamily: "'Pretendard', sans-serif" }}>프로젝트 속성</span>
                <p className="text-sm text-white/80 leading-relaxed font-sans">{project.projectProperty}</p>
              </div>
            </div>
            {project.retrospective && (
              <div className="flex flex-col gap-3">
                <span className="text-[13px] text-white/40 uppercase tracking-widest font-medium" style={{ fontFamily: "'Pretendard', sans-serif" }}>회고</span>
                <div className="text-sm text-white/80 leading-[1.8] font-sans whitespace-pre-line">{project.retrospective}</div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Dynamic Content Section */}
      {project.portfolioSections && (
        <section data-portfolio-start className="w-full bg-[#050505] px-4 md:px-8 lg:px-16 pt-20 md:pt-28 pb-12 relative">
          <div className="flex justify-start max-w-[1600px] w-full mx-auto lg:gap-16 xl:gap-24">
            {/* TOC Sidebar */}
            <div className="hidden lg:block w-56 xl:w-64 shrink-0 relative">
              <div className="sticky top-32 flex flex-col gap-3 py-2">
              {/* Vertical Line */}
              <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/10" />
              
              {(() => {
                const activeSectionData = project.portfolioSections.find((s: any) => s.id === activeSection);
                const activeParentTitle = activeSectionData?.parentTitle;
                
                const handleTocClick = (id: string) => {
                  isScrolling.current = true;
                  setActiveSection(id);
                  clearTimeout(scrollTimeout.current);
                  scrollTimeout.current = setTimeout(() => {
                    isScrolling.current = false;
                  }, 1000);
                  const el = document.getElementById(`section-${id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                };

                return project.portfolioSections.filter((s: any) => s.id !== 'last' && !s.hideFromToc).map((section: any, index: number, array: any[]) => {
                  const hasParent = !!section.parentTitle;
                  const isFirstOfParent = hasParent && array[index - 1]?.parentTitle !== section.parentTitle;
                  const isFirstAfterParent = !hasParent && !!array[index - 1]?.parentTitle;
                  const isActive = activeSection === section.id;
                  const isParentActive = hasParent && section.parentTitle === activeParentTitle;

                  return (
                    <React.Fragment key={section.id}>
                      {isFirstOfParent && (
                        <button
                          onClick={() => handleTocClick(section.id)}
                          className={`group text-left text-sm mt-4 mb-1 tracking-wide transition-colors pl-6 ${
                            isParentActive ? 'text-white font-medium' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <span className="relative inline-block">
                            {section.parentTitle}
                            {TOC_KO[section.parentTitle] && (
                              <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap text-[11px] font-normal normal-case tracking-[0.02em] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ fontFamily: "'Pretendard', sans-serif" }}>
                                {TOC_KO[section.parentTitle]}
                              </span>
                            )}
                          </span>
                        </button>
                      )}
                    <button
                      onClick={() => handleTocClick(section.id)}
                      className={`group text-left text-sm transition-colors duration-500 relative flex items-center w-full ${
                        hasParent ? 'pl-10' : 'pl-6'
                      } ${isFirstAfterParent ? 'mt-4' : ''} ${
                        isActive 
                          ? 'text-white font-medium' 
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      <span 
                        className={`absolute left-[-2.5px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white transition-all duration-500 ease-in-out ${
                          isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                        }`} 
                      />
                      <span className="relative inline-block transition-colors duration-500">
                        {section.title}
                        {TOC_KO[section.title] && (
                          <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap text-[11px] font-normal tracking-[0.02em] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ fontFamily: "'Pretendard', sans-serif" }}>
                            {TOC_KO[section.title]}
                          </span>
                        )}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })})()}
            </div>
          </div>
          
          {/* Images Content */}
          <PortfolioImages
            sections={project.portfolioSections}
            zoomMode={zoomMode}
          />
        </div>
        </section>
      )}

      {/* 돋보기(사진 확대) 버튼 — 프로젝트 페이지 전용. 탑버튼과 동일하게 스크롤 후 함께 등장. */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            key="magnifier"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-8 z-50 flex items-center gap-5"
          >
            <AnimatePresence mode="wait">
              {zoomMode && showActiveHint ? (
                <motion.span
                  key="active-hint"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25 }}
                  className="hidden sm:block whitespace-nowrap text-xs tracking-wide text-white/80 bg-[#1a1a1a]/90 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur pointer-events-none"
                >
                  사진에 마우스를 올리면 확대 · 휠로 배율 조절
                </motion.span>
              ) : !zoomMode && showZoomHint ? (
                // 활성화 전 유도 도움말 — 어두운 사이트에서 눈에 띄게 흰색 팝업, 꼬리 없음
                <motion.div
                  key="intro-hint"
                  initial={{ opacity: 0, x: 8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="hidden sm:block max-w-[240px] text-right bg-white rounded-2xl px-4 py-3 shadow-2xl ring-1 ring-black/5 pointer-events-none"
                >
                  <p className="text-[13px] font-semibold text-[#1a1a1a] leading-snug">자세히 보고 싶으신가요?</p>
                  <p className="mt-0.5 text-[11px] text-black/50 leading-snug">이 돋보기로 확대해서 보세요</p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="relative">
              {/* 활성화 전 주의를 끄는 은은한 펄스 */}
              {!zoomMode && showZoomHint && (
                <span className="absolute inset-0 rounded-full bg-white/50 animate-ping pointer-events-none" />
              )}
              <button
                onClick={() => { setZoomMode((v) => !v); setShowZoomHint(false); hintDone.current = true; }}
                aria-label={zoomMode ? '돋보기 모드 끄기' : '돋보기 모드 켜기'}
                aria-pressed={zoomMode}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                  zoomMode
                    ? 'bg-[#1a1a1a] border border-white/40 text-white ring-2 ring-white/70'
                    : 'bg-white border border-white/10 text-[#1a1a1a] hover:bg-white/90'
                }`}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ScrollRestorer = ({ scrollPos, justReturned }: { scrollPos: { current: number }, justReturned: { current: boolean } }) => {
  React.useLayoutEffect(() => {
    if (justReturned.current) {
      window.scrollTo(0, scrollPos.current);
      justReturned.current = false;
    }
  }, [scrollPos, justReturned]);
  return null;
};

const scrollPos = { current: 0 };
const justReturned = { current: false };

// 사원증 3D 애니메이션 (badge.html / Three.js)을 iframe으로 임베드.
// 화면에 보일 때만 애니메이션을 돌리고, 동시에 배경 UnicornStudio WebGL을 멈춰
// GPU를 사원증 렌더링에 양보 → 끊김 없이 스무스하게 출력.
const BadgeSection = React.memo(() => {
  const sectionRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const visibleRef = useRef(false);
  const unicornRetryRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 배경 UnicornStudio WebGL을 사원증 가시성에 맞춰 일시정지/재개해 GPU를 사원증에 양보.
  // UnicornStudio는 mount 후 지연(약 600ms) init되므로, 프로젝트에서 복귀해 스크롤이
  // 사원증 위치로 복원될 때 "init 전 pause 호출이 무효화"되는 race가 발생한다.
  // → scenes가 준비될 때까지 재시도하며 최신 가시성 상태를 강제로 반영한다.
  const enforceUnicornPaused = () => {
    clearTimeout(unicornRetryRef.current);
    let attempts = 0;
    const tryApply = () => {
      const US = (window as any).UnicornStudio;
      if (US?.scenes?.length) {
        US.scenes.forEach((s: any) => { s.paused = visibleRef.current; });
      } else if (attempts++ < 60) {
        unicornRetryRef.current = setTimeout(tryApply, 150); // 최대 ~9초간 재시도
      }
    };
    tryApply();
  };

  const send = (type: string) =>
    iframeRef.current?.contentWindow?.postMessage({ type }, '*');

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        send(entry.isIntersecting ? 'resume' : 'pause');
        enforceUnicornPaused();
      },
      // 섹션이 화면 중앙쯤 들어왔을 때 작동(상·하단 35%를 감지에서 제외)
      { threshold: 0, rootMargin: '-35% 0px -35% 0px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(unicornRetryRef.current);
      const US = (window as any).UnicornStudio;
      if (US?.scenes) US.scenes.forEach((s: any) => { s.paused = false; });
    };
  }, []);

  // iframe 로드 완료 후 현재 가시성 상태를 즉시 전송 + 배경 일시정지 상태도 재확정
  const handleIframeLoad = () => {
    send(visibleRef.current ? 'resume' : 'pause');
    enforceUnicornPaused();
  };

  return (
    <section
      id="resume"
      ref={sectionRef}
      className="relative bg-[#020202] border-t border-white/10 overflow-hidden lg:flex lg:items-center lg:min-h-[780px]"
    >
      {/* 좌측 텍스트 (슬로건 + 소개 본문) */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-16 py-36 lg:py-48 order-1">
        <div className="max-w-md xl:max-w-xl">
          <h2 className="font-sans font-bold leading-[1.1] tracking-tight text-white mb-6 text-[clamp(1.75rem,2.6vw,3.25rem)]">
            Where the Blind Spot
            <br />
            Becomes the Core Insight.
          </h2>
          {/* 소개 본문 */}
          <div className="mt-12">
            <p className="border-l border-white/20 pl-5 font-sans text-base md:text-lg italic font-bold leading-relaxed tracking-wide text-white/80">
              자신이 모르고 있던 편견이나 사각지대를 인식할 때 진정한 이해가 시작된다.
            </p>
            <div className="mt-20 space-y-4 text-base md:text-lg leading-[1.9] text-neutral-400" style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 400 }}>
              <p>안녕하세요, 디자이너 조한빛입니다.</p>
              <p>
                저는 익숙함 속에 가려진 불편함을 발견하는 것에서 디자인을 시작합니다.
                사용자가 말하는 것보다 말하지 않는 것에, 데이터가 보여주는 것보다 그 아래
                숨은 맥락에 더 오래 머뭅니다.
              </p>
              <p>
                디자이너의 시선은 강력한 도구인 동시에 편견의 출발점이 될 수 있습니다.
                그래서 저는 스스로의 가정을 의심하는 습관을 디자인 프로세스의 첫 번째
                단계로 삼습니다. 겉으로 드러나지 않는 맥락까지 살펴 본질에 가까운 경험을
                설계하고, 데이터와 직관 사이의 균형을 통해 사용자와 비즈니스 모두에게
                의미 있는 결과를 만들어가는 것을 지향합니다.
              </p>
              <p>
                블라인드 스팟을 인식하는 순간이 불편하게 느껴질 때도 있습니다. 하지만
                저는 그 순간을 두려워하지 않고 오히려 찾아나서려 합니다. 진짜 문제는 늘
                그 균열로부터 시작되기 때문입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* 우측 사원증 */}
      {/* 사원증 크기 고정: iframe 높이를 뷰포트 비례(100vh) 대신 고정 px로 두어
          해상도(모니터 높이)와 무관하게 카드가 항상 같은 크기로 보이게 함(본문 텍스트처럼 고정). */}
      <div className="w-full h-[55vh] lg:h-[1200px] lg:w-[54%] xl:w-[56%] lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-[58%] order-2 pointer-events-none lg:pointer-events-auto">
        <iframe
          ref={iframeRef}
          src="badge.html?embed=1&v=13"
          onLoad={handleIframeLoad}
          className="block w-full h-full border-0"
          title="사원증 애니메이션"
        />
      </div>
    </section>
  );
});

function Home() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);

  // 성능 최적화: 홈의 unicorn 배경은 fixed라 스크롤해도 항상 "화면 안"으로 인식돼
  // 히어로를 벗어난 뒤(불투명 콘텐츠가 덮은 상태)에도 매 프레임 GPU 렌더링이 계속된다.
  // 히어로가 완전히 화면 밖으로 나가면 씬을 일시정지(렌더 루프 정지)하고, 다시 들어오면 재개한다.
  // 히어로가 보이는 동안에는 애니메이션이 100% 그대로 동작하므로 시각적 차이는 없다.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || typeof IntersectionObserver === 'undefined') return;

    const setPaused = (paused: boolean) => {
      const scenes = window.UnicornStudio?.scenes;
      if (Array.isArray(scenes)) {
        scenes.forEach((s: any) => { if (s) s.paused = paused; });
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);

    return () => {
      observer.disconnect();
      setPaused(false); // 정리 시 항상 재생 상태로 되돌림
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
        <motion.div 
          key="main"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30"
        >
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 bg-[#050505] z-[99999] pointer-events-none"
            style={{ willChange: 'opacity' }}
          />
          <ScrollRestorer scrollPos={scrollPos} justReturned={justReturned} />
      <UnicornBackground 
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden scale-115 md:scale-130" 
        hideOnMobile={false}
      />

      {/* Atmospheric Overlays for the Hero Section */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90 z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col">
        {/* --- Header --- */}
        <header className="fixed top-0 w-full flex items-center justify-center px-4 h-[70px] md:px-8 lg:px-16 z-50 bg-[#050505]/90 border-b border-white/10">
          <nav className="flex gap-8 md:gap-12 text-sm uppercase tracking-widest text-white">
            <a 
              href="#portfolio" 
              onClick={(e) => scrollToSection(e, 'portfolio')}
              className="hover:text-white/80 transition-colors"
            >
              Portfolio
            </a>
            <a 
              href="#resume" 
              onClick={(e) => scrollToSection(e, 'resume')}
              className="hover:text-white/80 transition-colors"
            >
              About Me
            </a>
          </nav>
        </header>

        {/* --- Hero Section --- */}
        <section ref={heroRef} className="relative h-[110vh] flex flex-col items-center justify-center px-4 md:px-8 lg:px-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="text-xs uppercase tracking-[0.3em] text-white/60 mb-6 italic">
              CHO HAN VIT
            </div>
            <h1
              className="font-ivypresto text-6xl md:text-8xl lg:text-[140px] font-light leading-[0.9] tracking-tight mb-6 italic"
              style={{ textShadow: '0 0 18px rgba(255,255,255,0.35), 0 0 42px rgba(255,255,255,0.18)' }}
            >
              DESIGN ARCHIVE
            </h1>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute bottom-[76px] flex flex-col items-center gap-[21px]"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">Scroll Down</span>
            <div className="w-[1px] h-10 bg-gradient-to-t from-neutral-400 to-transparent animate-pulse"></div>
          </motion.div>
        </section>

        {/* --- Portfolio Section --- */}
        <section id="portfolio" className="relative bg-[#050505] border-t border-white/10 px-4 py-48 md:px-8 lg:px-20 md:py-64">
          <div className="max-w-[1680px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div>
                <h2
                  className="font-ivypresto text-6xl md:text-8xl font-light tracking-normal italic"
                  style={{ textShadow: '0 0 18px rgba(255,255,255,0.35), 0 0 42px rgba(255,255,255,0.18)' }}
                >
                  Portfolio
                </h2>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16 md:gap-x-8 md:gap-y-24 mt-12">
              {PROJECTS.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: index < 4 ? 1 : 0, y: index < 4 ? 0 : 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "300px" }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="group cursor-pointer flex flex-col"
                  style={{ willChange: "transform, opacity" }}
                  onClick={() => {
                    scrollPos.current = window.scrollY;
                    justReturned.current = true;
                    navigate(project.customPath || `/project/${project.id}`);
                  }}
                >
                  <div className="relative w-full aspect-[3/4] md:aspect-[3/4] overflow-hidden mb-8 bg-[#111] rounded-2xl">
                    {(project.thumbnail || project.image) ? (
                      <img
                        src={getImageUrl(project.thumbnail || project.image)}
                        alt={project.title}
                        className={`w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 ${project.thumbnailPosition || 'object-center'}`}
                        referrerPolicy="no-referrer"
                        loading="eager"
                        fetchPriority={index < 4 ? "high" : "auto"}
                      />
                    ) : (
                      // 썸네일 이미지가 아직 없는 프로젝트(추후 내용 채울 예정)용 플레이스홀더
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 border border-dashed border-white/15 group-hover:border-white/30 transition-colors duration-700">
                        <span className="text-3xl font-light text-white/25 group-hover:text-white/50 transition-colors duration-700">+</span>
                        <span className="text-[11px] uppercase tracking-widest text-white/25 group-hover:text-white/50 transition-colors duration-700">Coming Soon</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700" />
                  </div>
                  
                  <div className="flex flex-col flex-grow justify-between pr-8">
                    <div>
                      <h3 className="font-sans text-xl md:text-2xl font-semibold tracking-tight leading-snug text-white/90 group-hover:text-white transition-colors duration-500 whitespace-pre-wrap break-keep">
                        {project.title
                          .replace(' UX/UI', '\nUX/UI')
                          .replace('29CM', '29cm')}
                      </h3>
                    </div>
                    
                    <div className="mt-8 flex items-center">
                      <div className="relative w-8 h-[1px] bg-white/30 group-hover:w-16 group-hover:bg-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-white/30 group-hover:border-white rotate-45 transform origin-center transition-colors duration-700" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 사원증 애니메이션 --- */}
        <BadgeSection />

        {/* --- Footer --- */}
        <footer className="bg-[#020202] border-t border-white/10 py-24 px-4 text-center">
          <div className="font-serif text-2xl mb-4">Thank you for your time.</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Copyright © Cho Han Vit All rights reserved.
          </div>
        </footer>
      </div>
    </motion.div>
  );
}

// 이후 섹션들은 추후 이 아래에 이어서 제작 예정.
const NewProjectPlaceholder: React.FC = () => {
  // 이번 RYZE 방문에서 히어로가 이미 재생됐다면(카드 상세로 갔다가 돌아온 경우 등)
  // 히어로/도어 리빌 전부 건너뛰고 곧장 카드 그리드로 표시한다.
  const skipHeroThisMount = useRef(getRyzeHeroPlayed()).current;
  const [stage, setStage] = useState<'hero' | 'reveal' | 'projects'>(skipHeroThisMount ? 'projects' : 'hero');
  const [heroSnapshot, setHeroSnapshot] = useState<string | null>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const reduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen relative"
      style={{ backgroundColor: RYZE_BG }}
    >
      {/* 히어로 스플래시 — 1사이클 재생 후 도어 리빌로 전환.
          전환 시점에 캔버스를 스냅샷해 도어 표면으로 사용하므로 컷오버 플래시가 없다.
          (reduced-motion에선 스냅샷 없이 크로스페이드하므로 리빌 중에도 히어로 유지) */}
      {(stage === 'hero' || (reduced && stage === 'reveal')) && (
        <section ref={heroSectionRef} className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: RYZE_BG }}>
          <RyzeHero
            onComplete={() => {
              const cv = heroSectionRef.current?.querySelector('canvas');
              let snap: string | null = null;
              try { snap = cv ? cv.toDataURL('image/png') : null; } catch { snap = null; }
              setHeroSnapshot(snap);
              setStage('reveal');
              markRyzeHeroPlayed(); // 이번 RYZE 방문에서 재생 완료 — 재방문 시 다시 재생되지 않음
            }}
          />
        </section>
      )}

      {/* 프로젝트 섹션 — 리빌 단계부터 마운트, 히어로가 도어로 갈라지며 드러남 */}
      {stage !== 'hero' && (
        <RyzeProjectsSection
          revealing={stage === 'reveal'}
          reduced={reduced}
          instant={skipHeroThisMount}
          heroSnapshot={heroSnapshot}
          onRevealDone={() => setStage('projects')}
        />
      )}
    </motion.div>
  );
};

// RYZE 진입 인트로("LET'S SEE THE WORK" 오버레이)는 src/ryze/RyzeWorkIntroOverlay.tsx로
// 분리했다 — 여기서는 그 타이밍을 관리하는 useRyzeWorkIntro()만 불러와서 라우트 트리
// 바깥(AppRoutes)에 <RyzeWorkIntroOverlay>를 띄운다(라우트가 바뀌어도 사라지지 않도록).
function AppRoutes() {
  const location = useLocation();
  useRyzeBgm(location.pathname);
  const { phase, run } = useRyzeWorkIntro();
  // "/project-new"(메인 홈)는 RyzeProjectsSection 헤더 안에 이미 자체 BGM 토글이 있고,
  // "/projects/2/:chapter"(Planning)는 화면마다 배경 밝기가 달라 RyzeWorkChapterDetail
  // 내부에서 그 화면의 잉크(ink) 색을 그대로 물려받아 직접 띄운다. 여기서는 그 사이의
  // Overview 화면(엘리베이터 "/projects/2", 카드 상세 "/projects/:n")에서만 고정 위치로
  // 띄운다 — 이 화면들은 항상 어두운 배경(RYZE_BG)이라 색을 고정해도 된다.
  const showFixedBgmToggle = /^\/projects\/[^/]+$/.test(location.pathname);
  return (
    <RyzeWorkIntroContext.Provider value={run}>
      <AnimatePresence mode="wait">
        {/* @ts-ignore */}
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/project-new" element={<NewProjectPlaceholder />} />
          <Route path="/projects/:n" element={<RyzeProjectDetail />} />
          <Route path="/projects/2/:chapter" element={<RyzeWorkChapterDetail />} />
        </Routes>
      </AnimatePresence>
      {phase !== 'idle' && <RyzeWorkIntroOverlay phase={phase} />}
      {showFixedBgmToggle && (
        // 메인 홈(RyzeProjectsSection)의 BGM 토글과 크기·위치·호버 시 곡명 라벨까지 완전히
        // 같도록, 그 버튼의 실측 좌표(top:14px, right: 12px/md 20px)를 그대로 고정값으로
        // 옮겼다. 라벨이 옆으로 늘어날 수 있어야 하므로 너비는 고정하지 않는다(64×56 박스는
        // RyzeMusicToggleWithLabel 내부에 있다).
        <div className="fixed z-30 top-[14px] right-3 md:right-5">
          <RyzeMusicToggleWithLabel onDarkBg />
        </div>
      )}
    </RyzeWorkIntroContext.Provider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
      <ScrollToTopButton />
    </HashRouter>
  );
}
