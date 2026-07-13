/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useFloating, offset, shift, flip, arrow, FloatingPortal, autoUpdate, useHover, useInteractions, safePolygon } from '@floating-ui/react';
import { ArrowRight, ArrowUp, Search } from 'lucide-react';
import UnicornBackground from './components/UnicornBackground';

const TermTooltip = ({ term, description }: { term: string, description: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [arrowEl, setArrowEl] = useState<HTMLDivElement | null>(null);

  const { refs, floatingStyles, placement, middlewareData, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 16 }),
      arrow({ element: arrowEl }),
    ],
  });

  const hover = useHover(context, {
    handleClose: safePolygon(),
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <span className="relative inline-block">
      <span 
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-flex items-center justify-center px-2 py-1 mr-1 my-1 rounded-md bg-white/10 border border-white/20 text-white/90 cursor-help transition-colors hover:bg-white/20"
      >
        {term}
      </span>
      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <div
              ref={refs.setFloating}
              style={{ ...floatingStyles, zIndex: 9999 }}
              {...getFloatingProps()}
            >
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="w-[max-content] max-w-[90vw] sm:max-w-[380px] p-4 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl relative pointer-events-auto"
              >
                <div className="text-xs text-white/80 leading-relaxed font-sans whitespace-normal text-left">
                  {description}
                </div>
                <div
                  ref={setArrowEl}
                  style={{
                    position: 'absolute',
                    left: middlewareData.arrow?.x != null ? `${middlewareData.arrow.x}px` : '',
                    top: middlewareData.arrow?.y != null ? `${middlewareData.arrow.y}px` : '',
                    [placement.startsWith('top') ? 'bottom' : 'top']: '-5px',
                    width: '10px',
                    height: '10px',
                    background: '#1a1a1a',
                    borderRight: placement.startsWith('top') ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    borderBottom: placement.startsWith('top') ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    borderLeft: placement.startsWith('bottom') ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    borderTop: placement.startsWith('bottom') ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    transform: 'rotate(45deg)',
                  }}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </span>
  );
};

// --- Mock Data ---
const getImageUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${import.meta.env.BASE_URL}${path}`;
};

const funeralIndustryDescription = (
  <div className="flex flex-col gap-4 text-left">
    <div className="flex flex-col gap-1">
      <strong className="text-white/90 text-[13px]">1. 정보 비공개성과 폐쇄성</strong>
      <p className="text-white/70">장례 산업은 병원, 장례식장, 상조회사 등 폐쇄적인 네트워크로 운영되는 경우가 많습니다.</p>
      <ul className="list-disc pl-4 text-white/60 space-y-0.5">
        <li>가격, 수익 구조, 계약 방식 등이 외부에서 잘 공개되지 않음</li>
        <li>기업 간 거래(B2B)가 많아 공식 자료가 제한적</li>
      </ul>
      <p className="text-white/80 mt-1">→ 공개된 보고서나 기사만으로는 실제 구조를 파악하기 어렵습니다.</p>
    </div>

    <div className="flex flex-col gap-1">
      <strong className="text-white/90 text-[13px]">2. 소비자 경험 데이터 부족</strong>
      <p className="text-white/70">일반적인 서비스는 사용자가 반복적으로 이용하며 데이터를 쌓지만, 장례는 개인이 평생 한두 번 겪는 특수한 상황입니다.</p>
      <ul className="list-disc pl-4 text-white/60 space-y-0.5">
        <li>대부분 인생에서 몇 번 안 겪음</li>
        <li>감정적으로 힘든 상황이라 리뷰나 기록 형태의 행동을 하지 않는 경우 많음</li>
      </ul>
      <p className="text-white/80 mt-1">→ 일반적인 산업처럼 리뷰, 사용자 행동 데이터가 거의 없습니다.</p>
    </div>

    <div className="flex flex-col gap-1">
      <strong className="text-white/90 text-[13px]">3. 민감한 주제 특성</strong>
      <p className="text-white/70">'죽음'이라는 주제 자체가 민감합니다.</p>
      <ul className="list-disc pl-4 text-white/60 space-y-0.5">
        <li>기업이나 개인이 정보 공개를 꺼림</li>
        <li>인터뷰 접근도 쉽지 않음</li>
      </ul>
      <p className="text-white/80 mt-1">→ 사용자의 목소리를 일반적인 리서치로 수집하기가 물리적으로 불가능합니다.</p>
    </div>
  </div>
);

interface Project {
  id: number;
  title: string;
  category: string;
  image: string;
  thumbnail?: string;
  thumbnailPosition?: string;
  unicornProjectId?: string;
  detailSubtitle?: string;
  contribution?: string;
  duration?: string;
  projectProperty?: string;
  retrospective?: React.ReactNode;
  portfolioSections: any[];
}

const PROJECTS: Project[] = [
  {
    id: 1,
    title: '추모, 고령 사용자 사용성 개선 UX/UI 기업 프로젝트',
    category: 'Web Design',
    image: 'Choomo/Choomo background image.webp',
    thumbnailPosition: 'object-left',
    unicornProjectId: 'PDAAZKOm9edkvDtWeNJI',
    detailSubtitle: 'DIGITAL SIGNAGE & ADMIN PAGE DESIGN',
    contribution: 'UX 리서치 및 전략 수립 & UI 디자인 진행 (UX/UI 100%)',
    duration: '2025.08 ~ 2025.10 (2개월)',
    projectProperty: 'B2B SaaS, B2C, O2O',
    retrospective: (
      <>
        <ul className="list-disc pl-5 space-y-12 marker:text-white/40">
          <li>
            '추모'는 탄탄한 거래처를 확보하고 있었으나, 사업 초기 단계의 스타트업으로서 서비스의 실질적인 사용자 데이터가 매우 부족한 상태였습니다. 또한 <TermTooltip term="장례 산업만이 가진 특수성" description={funeralIndustryDescription} />으로 인해 기초적인 데이터 외에 정보를 얻기 힘든 구조의 프로젝트였습니다.
            <br /><br />
            그렇기에 오프라인에서 직접 인사이트를 도출해야 했고, 유가족의 애도 과정을 존중하며 정서적 개입을 최소화해야 하는 환경적 제약 속에서 <TermTooltip term="에스노그래피(Ethnography)" description="사용자의 실제 생활 환경에 들어가 그들의 행동을 있는 그대로 관찰합니다. 어떤 지점에서 머뭇거리는지, 어떤 비효율적인 도구를 사용하는지 기록합니다." />, <TermTooltip term="쉐도잉(Shadowing)" description="특정 사용자를 그림자처럼 따라다니며 일거수일투족을 기록합니다. 사용자가 &quot;불편함이 없다&quot;고 말해도, 실제 행동에서 나타나는 마찰(Friction)을 포착할 수 있습니다." />, <TermTooltip term="맥락적 인터뷰(Contextual Inquiry)" description="사용자가 실제 업무나 활동을 하고 있는 '맥락' 안에서 질문을 던집니다. 기억에 의존하는 일반 인터뷰보다 훨씬 정확한 실무 데이터를 얻을 수 있습니다." />와 같은 정성 조사와 더불어 <TermTooltip term="동선 및 체류 시간 측정(Tracking & Dwell Time)" description="특정 공간에서 사용자가 이동하는 경로를 도식화하고, 각 단계별로 머무는 시간을 초 단위로 스톱워치 등을 이용해 기록합니다." />, <TermTooltip term="작업 성공률 및 오류율(Task Success/Error Rate)" description="오프라인 환경에서 특정 과업을 수행하게 하고, 이를 한 번에 성공했는지, 몇 번의 시행착오를 거쳤는지 카운팅합니다." /> 과 같은 정량 조사의 비개입 리서치 방법론을 활용했습니다.
            <br /><br />
            유가족의 슬픔이라는 무거운 정서가 지배하는 공간에서 리서치를 진행하는 것은 윤리적 감수성과 세밀한 리서치 설계 능력을 요구했고, 동시에 유의미한 사용자 데이터를 수집해야하는 상황적 특수성이 흥미로운 프로젝트였습니다.
          </li>
          <li>기업과 클라이언트의 니즈가 명확하고 확고했던 만큼, 프로젝트에서 구현 가능한 방향성과 다양성에는 상당한 제약이 따랐던 부분이 아쉬웠습니다.</li>
        </ul>
      </>
    ),
    portfolioSections: [
      { id: 'overview', title: 'Project Overview', image: 'Choomo/1.Project Overview.webp' },
      { id: 'status-issue-0', title: 'Issue', parentTitle: 'Status Board', image: 'Choomo/issue-0.webp' },
      { id: 'status-issue-1', title: 'Issue 1', parentTitle: 'Status Board', image: 'Choomo/issue-1.webp', hideFromToc: true },
      { id: 'status-issue-2', title: 'Issue 2', parentTitle: 'Status Board', image: 'Choomo/issue-2.webp', hideFromToc: true },
      { id: 'status-issue-3', title: 'Issue 3', parentTitle: 'Status Board', image: 'Choomo/issue-3.webp', hideFromToc: true },
      { id: 'status-solution', title: 'Solution', parentTitle: 'Status Board', image: 'Choomo/2-2.Solution.webp' },
      { id: 'status-solution-1', title: 'Solution 1', parentTitle: 'Status Board', image: 'Choomo/2-2.Solution-1.webp', hideFromToc: true },
      { id: 'admin-issue', title: 'Issue', parentTitle: 'Management Page (Admin)', image: 'Choomo/3-1.Issue.webp' },
      { id: 'admin-solution', title: 'Solution', parentTitle: 'Management Page (Admin)', image: 'Choomo/3-2.Solution.webp' },
      { id: 'result', title: 'Result', image: 'Choomo/4.Result.webp' }
    ]
  },
  {
    id: 2,
    title: '29CM 웹 초기 사용자 이탈 개선 UX/UI 리디자인',
    category: 'Web Design',
    image: '29CM/29cm tumbnail.webp',
    portfolioSections: [
      { id: 'about', title: 'About', image: '29CM/1-about.webp' },
      { id: 'project-background', title: 'Background', image: '29CM/2-1-project background.webp' },
      { id: 'project-background-2', title: 'Project Background 2', image: '29CM/2-project background.webp', hideFromToc: true },
      { id: 'research', title: 'Research', image: '29CM/3-research.webp' },
      { id: 'home', title: 'Home', parentTitle: 'UI Design', image: '29CM/4-home.webp' },
      { id: 'category', title: 'Category', parentTitle: 'UI Design', image: '29CM/5-category.webp' },
      { id: 'search-bar', title: 'Search Bar', parentTitle: 'UI Design', image: '29CM/6-search bar.webp' },
      { id: 'product-listing-page', title: 'Product Listing Page', parentTitle: 'UI Design', image: '29CM/7-product listing page.webp' },
      { id: 'filter', title: 'Filter', parentTitle: 'UI Design', image: '29CM/8-filter.webp' },
      { id: 'product-detail-page', title: 'Product Detail Page', parentTitle: 'UI Design', image: '29CM/9-product detail page.webp' },
      { id: 'purchase-section', title: 'Purchase Section', parentTitle: 'UI Design', image: '29CM/10-purchase section.webp' },
      { id: 'review', title: 'Review', parentTitle: 'UI Design', image: '29CM/11-review.webp' },
      { id: 'responsive-web-design', title: 'Responsive Web Design', image: '29CM/12-responsive web design.webp' },
      { id: 'outcome', title: 'Outcomes', image: '29CM/13-outcome.webp' },
      { id: 'last', title: 'Last', image: '29CM/14-last.webp' },
    ],
    detailSubtitle: 'WEB Design',
    contribution: 'UX 리서치 및 전략 수립 & UI 레이아웃 설계 참여 (UX/UI 100%)',
    duration: '2025.07 ~ 2025.08 (1.3개월)',
    projectProperty: '반응형 웹',
    retrospective: (
      <>
        <ul className="list-disc pl-5 space-y-6 marker:text-white/40">
          <li>
            반응형 웹 구동 원리와 다양한 디바이스 환경을 고려한 컴포넌트 설계 및 배치, 신규 사용자의 이탈 방지를 목표로 한 초기 온보딩 경험 최적화를 통해 기획력을 기르는 측면에서 많은 도움이 되는 프로젝트였습니다.
          </li>
          <li>기존 29CM의 디자인 톤앤매너는 유지하며, 실험적인 화면 디자인보다 실질적인 사용성 개선에 무게를 두고 고민했던 프로젝트였습니다.</li>
        </ul>
      </>
    ),
  },
  {
    id: 3,
    title: 'CGV 앱 영화 경험 고도화 UX/UI 프로젝트',
    category: 'Mobile UI',
    image: 'CGV/1.Project Overview.webp',
    thumbnail: 'CGV/CGV tumbnail.webp',
    unicornProjectId: 'PrXQWc4SSC0jy8v6x98a',
    detailSubtitle: 'APP DESIGN',
    contribution: 'UX 리서치 및 전략 수립 & UI 디자인 진행 (UX/UI 100%)',
    duration: '2025.05 ~ 2025.06 (1개월)',
    projectProperty: '앱 디자인',
    retrospective: (
      <>
        '단순 영화 예매 플랫폼’ 으로 고착된 앱의 정체성을 극복하고자 했던 프로젝트의 지향점을 바탕으로, 사용자 경험 개선뿐만 아니라 거시적인 관점에서 서비스의 가치를 다각화하며
        <br />
        '프로덕트의 성공을 위해 디자이너는 무엇을 고민해야 하는가' 를 생각하게 된 프로젝트였습니다.
      </>
    ),
    portfolioSections: [
      { id: 'overview', title: 'Project Overview', image: 'CGV/1.Project Overview.webp' },
      { id: 'research', title: 'Research', image: 'CGV/2.Research.webp' },
      { id: 'strategy', title: 'Strategy', image: 'CGV/3.Strategy.webp' },
      { id: 'user-flow', title: 'User Flow', image: 'CGV/4.User Flow.webp' },
      { id: 'home', title: 'Home', parentTitle: 'UI Design', image: 'CGV/5-1.Home.webp' },
      { id: 'community', title: 'Community', parentTitle: 'UI Design', image: 'CGV/5-2.Community.webp' },
      { id: 'last', title: 'Last', image: 'CGV/6.Last.webp', hideFromToc: true }
    ]
  }
];

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
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 transition-colors"
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
            className="text-sm uppercase tracking-widest text-white/60 hover:text-white transition-colors flex items-center gap-2 pointer-events-auto"
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
              <div className={`w-full h-full lg:h-auto lg:aspect-[1440/900] flex items-center justify-center ${project.id === 3 ? 'lg:scale-110' : ''}`}>
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
          <div className="w-full max-w-[1200px] flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col md:flex-row flex-wrap gap-6 md:gap-16 lg:gap-24">
              <div className="flex flex-col gap-3 min-w-[120px]">
                <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">기여도</span>
                <p className="text-sm text-white/80 leading-relaxed font-sans">{project.contribution}</p>
              </div>
              <div className="flex flex-col gap-3 min-w-[120px]">
                <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">작업 기간</span>
                <p className="text-sm text-white/80 leading-relaxed font-sans">{project.duration}</p>
              </div>
              <div className="flex flex-col gap-3 min-w-[120px]">
                <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">프로젝트 속성</span>
                <p className="text-sm text-white/80 leading-relaxed font-sans">{project.projectProperty}</p>
              </div>
            </div>
            {project.retrospective && (
              <div className="flex flex-col gap-3">
                <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">회고</span>
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
                          className={`text-left text-sm mt-4 mb-1 tracking-wide transition-colors pl-6 ${
                            isParentActive ? 'text-white font-medium' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          {section.parentTitle}
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
                      <span className="transition-colors duration-500">
                        {section.title}
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
      <div className="w-full h-[55vh] lg:h-[900px] lg:w-[54%] xl:w-[56%] lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 order-2 pointer-events-none lg:pointer-events-auto">
        <iframe
          ref={iframeRef}
          src="badge.html?embed=1&v=12"
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
            <h1 className="font-serif text-6xl md:text-8xl lg:text-[140px] font-normal leading-[0.9] tracking-tight mb-6 italic">
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
        <section id="portfolio" className="relative bg-[#050505] border-t border-white/10 px-4 py-48 md:px-8 lg:px-16 md:py-64">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div>
                <h2 className="font-serif text-6xl md:text-8xl font-light tracking-normal">Portfolio</h2>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16 md:gap-x-10 md:gap-y-24 mt-12">
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
                    navigate(`/project/${project.id}`);
                  }}
                >
                  <div className="relative w-full aspect-[3/4] md:aspect-[3/4] overflow-hidden mb-8 bg-[#111] rounded-2xl">
                    <img
                      src={getImageUrl(project.thumbnail || project.image)}
                      alt={project.title}
                      className={`w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 ${project.thumbnailPosition || 'object-center'}`}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      fetchPriority={index < 4 ? "high" : "auto"}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700" />
                  </div>
                  
                  <div className="flex flex-col flex-grow justify-between pr-8">
                    <div>
                      <h3 className="font-sans text-xl md:text-2xl font-medium tracking-tight leading-snug text-white/90 group-hover:text-white transition-colors duration-500 whitespace-pre-wrap">
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

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
      </Routes>
    </AnimatePresence>
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
