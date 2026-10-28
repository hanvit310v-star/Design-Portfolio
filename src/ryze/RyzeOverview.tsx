// RYZE 프로젝트 "Overview"(/projects/2) 및 개별 카드 상세(/projects/:n) 화면 —
// 스크롤 히어로 슬라이드, 인트로 페이지, Work 챕터 목록, 카드 상세(엘리베이터 화면).
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { getImageUrl, RYZE_BG, RYZE_FONT, RYZE_INK, RyzeDesignScaleLayer, useRyzeDesignMetrics } from './shared';
import { RYZE_CARD_COPY, RYZE_CARD_IMAGES, RYZE_GRID_COUNT, RYZE_TITLE_FONT_CSS } from './RyzeProjectsSection';


// Overview 상세 페이지 상단 스크롤 히어로에 쓰는 더미 슬라이드 데이터.
// 모든 슬라이드가 2분할(좌/우 이미지) + 합성 단어 구성으로 통일된다.
const RYZE_OVERVIEW_SLIDES: { images: [string, string]; title: string; subtitle: string; subtitleKo: string }[] = [
  {
    images: ['RYZE/card1.webp', 'RYZE/card2.webp'],
    title: 'Planning',
    subtitle: 'Strategy, designed with AI',
    subtitleKo: '서비스 전략, AI로 설계하다',
  },
  {
    images: ['RYZE/card2.webp', 'RYZE/card3.png'],
    title: 'Brand & Visuals',
    subtitle: 'Interfaces, built with AI',
    subtitleKo: '아이덴티티, AI로 시각화하다',
  },
  {
    images: ['RYZE/card4.webp', 'RYZE/card1.webp'],
    title: 'Content Design',
    subtitle: 'Identity, visualized with AI',
    subtitleKo: '콘텐츠, AI로 전환을 만들다',
  },
];

// "창(mask)"과 "이미지" 모션을 분리한다 — 바깥 마스크(overflow-hidden 박스)와 그 안의 이미지가
// 서로 다른 거리(100%/130%)를 움직여 패럴랙스 느낌을 주되, "덮는다"는 느낌보다 이미지 자체가
// 위/아래로 연속해서 바뀌는 느낌에 가깝다. 텍스트도 같은 구조: 좌/우 clip-path 마스크 + 안쪽
// 텍스트 레이어를 분리해 이미지와 동일하게 상/하로 움직이며 전환된다.
// duration과 easing은 마스크/이미지 모두 동일하게 통일했다 — 예전에는 mask(0.7s)가 화면 밖으로
// 완전히 나가고 나면 inner(0.95s)의 남은 0.25초가 안 보여서, 진입(아래로 스크롤) 때는 완만한
// ease-out 꼬리가 화면에 보이지만 퇴장(위로 스크롤) 때는 이미 화면 밖이라 안 보였다 — 그래서
// 위로 스크롤할 때만 유독 "훅 빠르게 사라지는" 것처럼 체감됐다. easeInOut(양쪽 다 완만하게
// 시작·종료)으로 바꾸고 duration을 통일해 진입/퇴장 체감 속도를 대칭으로 맞춘다.
const SLIDE_TRANSITION = { duration: 0.85, ease: [0.65, 0, 0.35, 1] as const }; // easeInOut
const MASK_TRANSITION = SLIDE_TRANSITION;
const INNER_TRANSITION = SLIDE_TRANSITION;

// 슬라이드 한 장 — 좌/우 2분할 이미지 + 가운데 큰 타이틀(같은 좌/우로 clip-path 분할)로 구성.
// 왼쪽 절반은 아래→위로, 오른쪽 절반은 위→아래로 서로 반대 방향으로 움직이며 전환된다.
// entered는 스크롤 위치를 단계로 끊어 계산한 값이라, 값이 바뀔 때 한 번에 스냅되듯 전환된다
// (스크롤량에 비례해 실시간으로 따라오는 스크러빙이 아니라, 정해진 지점을 넘으면 스크롤과
// 무관하게 위 트랜지션이 그대로 "재생"되는 스크롤 스냅 방식).
// z-index가 순서대로 쌓이므로 이전 레이어는 별도 exit 애니메이션 없이 자연히 가려진다.
const RyzeOverviewSlide: React.FC<{
  slide: (typeof RYZE_OVERVIEW_SLIDES)[number];
  index: number;
  entered: boolean;
}> = ({ slide, index, entered }) => {
  return (
    <div className="absolute inset-0" style={{ zIndex: index }}>
      <div className="absolute inset-0 flex">
        {slide.images.map((img, i) => (
          <motion.div
            key={i}
            className="relative h-full overflow-hidden"
            style={{ width: '50%' }}
            initial={false}
            animate={{ y: entered ? '0%' : i === 0 ? '100%' : '-100%' }}
            transition={MASK_TRANSITION}
          >
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ y: entered ? '0%' : i === 0 ? '130%' : '-130%' }}
              transition={INNER_TRANSITION}
            >
              <img
                src={getImageUrl(img)}
                alt=""
                loading={index === 0 ? undefined : 'lazy'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/45" />
            </motion.div>
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ fontFamily: RYZE_FONT, color: RYZE_INK }}>
        {[0, 1].map((side) => (
          <motion.div
            key={side}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{ clipPath: side === 0 ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)' }}
            initial={false}
            animate={{ y: entered ? '0%' : side === 0 ? '100%' : '-100%' }}
            transition={MASK_TRANSITION}
          >
            <motion.div
              className="flex flex-col items-center"
              initial={false}
              animate={{ y: entered ? '0%' : side === 0 ? '130%' : '-130%' }}
              transition={INNER_TRANSITION}
            >
              <span className="mb-8 text-[10px] md:text-xs uppercase tracking-[0.3em] font-semibold" style={{ color: '#FFFFFF' }}>
                OVERVIEW — {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="font-bold uppercase leading-[0.9]" style={{ fontSize: 'clamp(48px, 9vw, 160px)', letterSpacing: '-0.02em' }}>
                {slide.title}
              </h2>
              <span className="mt-10 text-sm md:text-base tracking-[0.05em] font-semibold" style={{ color: '#FFFFFF' }}>
                {slide.subtitle}
              </span>
              <span className="mt-2 text-xs md:text-sm tracking-[0.02em] font-medium" style={{ color: '#FFFFFF' }}>
                {slide.subtitleKo}
              </span>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Overview 상세 페이지 상단 — 휠 입력으로 직접 카드를 넘기는 스크롤락(scroll-lock) 히어로.
// 자연스러운 문서 스크롤(스크롤 위치 → 진행률 매핑) 대신, wheel 이벤트를 가로채 카드 인덱스를
// 직접 제어한다 — 그래서 카드마다 필요한 "스크롤 정도"가 완전히 동일하고(휠 한 번 = 카드 한 장),
// 현재 카드의 전환 애니메이션(SLIDE_TRANSITION)이 끝나기 전까지는 다음 휠 입력을 무시해
// 애니메이션이 다 끝나야만 다음 카드로 넘어갈 수 있다.
const RyzeOverviewHero: React.FC<{ onBack: () => void; designScale: number; designCanvasH: number }> = ({
  onBack,
  designScale,
  designCanvasH,
}) => {
  const total = RYZE_OVERVIEW_SLIDES.length;
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const locked = useRef(false);
  const lastChangeAt = useRef(0);
  // 마지막 카드 → 3열 레이아웃(그리고 그 반대)으로 넘어갈 때 스크롤 스냅 애니메이션이
  // 진행 중인지 — 애니메이션 도중 들어오는 추가 휠 입력으로 scrollTo가 중복 호출되는 것을 막는다.
  const snapping = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      // 스냅 애니메이션(JS의 smooth scrollTo)이 진행 중일 때 트랙패드 관성 스크롤 등으로 추가
      // 휠 이벤트가 들어오면, 그걸 막지 않고 그냥 흘려보내던 게 "뚝" 끊기는 원인이었다 — 브라우저
      // 기본 스크롤과 우리가 실행 중인 smooth scrollTo가 동시에 같은 스크롤 위치를 두고 충돌하며
      // 버벅였다. 애니메이션이 끝날 때까지는 모든 휠 입력을 완전히 삼킨다.
      if (snapping.current) { e.preventDefault(); return; }
      const dir = e.deltaY > 0 ? 1 : -1;

      // 히어로는 실제로는 스크롤되지 않는 h-screen 고정 박스라, 카드를 넘기는 동안 문서 스크롤
      // 위치는 항상 0에 머문다. scrollY가 0을 넘어서면(=3열 레이아웃 영역을 보고 있으면) 카드
      // 넘기기는 더 이상 가로채지 않되, 그 영역 맨 위쪽에서 위로 스크롤하면 히어로로 다시
      // 스냅해 들어가도록 한다 — 어중간한 위치에 걸쳐 있지 않고 두 구간을 딱 붙여서 오간다.
      if (window.scrollY > 0) {
        if (dir < 0 && window.scrollY < window.innerHeight && !snapping.current) {
          e.preventDefault();
          snapping.current = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.setTimeout(() => { snapping.current = false; }, 600);
        }
        return;
      }
      const next = activeRef.current + dir;
      if (next < 0 || next > total - 1) {
        // 마지막(또는 첫) 카드라도, 그 카드로 들어오는 전환 모션이 아직 다 끝나지 않았으면
        // 대지(다음 섹션)로 넘어가는 것도 막는다 — 모션이 완전히 끝난 뒤에야 스냅 스크롤이
        // 이어지도록 한다.
        const stillAnimating = locked.current || Date.now() - lastChangeAt.current < SLIDE_TRANSITION.duration * 1000;
        if (stillAnimating) { e.preventDefault(); return; }
        // 모션이 끝난 뒤 아래로 흘려보내는 첫 휠 입력 — 어중간하게 흘러가지 않고 3열
        // 레이아웃 영역 맨 위로 곧장 스냅한다.
        if (dir > 0 && next > total - 1 && !snapping.current) {
          e.preventDefault();
          snapping.current = true;
          // 히어로 높이(=innerHeight)만큼 내려가는 게 기본이지만, 3열 레이아웃이 한 화면보다
          // 짧으면 문서 끝(스크롤 가능한 최대치)이 그보다 먼저 온다 — 그 경우 문서 끝에서
          // 멈춰야 3열 레이아웃 전체가 화면에 딱 맞게 보인다.
          const target = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({ top: target, behavior: 'smooth' });
          window.setTimeout(() => { snapping.current = false; }, 700);
        }
        return;
      }
      e.preventDefault();
      if (locked.current) return;
      locked.current = true;
      lastChangeAt.current = Date.now();
      setActive(next);
      window.setTimeout(() => {
        locked.current = false;
      }, SLIDE_TRANSITION.duration * 1000 + 60);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [total]);

  // 슬라이드 타이틀은 clamp(48px, 9vw, 160px)라 1777px(=160/0.09) 이상 폭에서는 전부 160px로
  // 캡돼, Planning과 같은 이유로 1920/2560/3840에서 절대 크기는 같지만 화면 대비 상대적
  // 비중이 달라 보인다. 2560 디자인 캔버스로 감싸 스케일한다 — 휠로 카드를 넘기는 로직은
  // window.scrollY/innerHeight 같은 실제 값을 그대로 쓰므로 전혀 건드릴 필요가 없다(이
  // 래퍼는 실제 문서 scrollHeight 기여분이 정확히 한 화면(innerHeight)이 되도록
  // 높이만 맞춰줄 뿐이다).
  return (
    <RyzeDesignScaleLayer enabled scale={designScale} canvasH={designCanvasH}>
    <div className="relative w-full overflow-hidden" style={{ height: designCanvasH, backgroundColor: RYZE_BG }}>
      {RYZE_OVERVIEW_SLIDES.map((slide, i) => (
        <RyzeOverviewSlide key={i} slide={slide} index={i} entered={i <= active} />
      ))}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="group cursor-pointer absolute top-6 left-6 md:top-10 md:left-12 uppercase tracking-widest transition-opacity opacity-70 hover:opacity-100 flex items-center gap-2"
        style={{ color: RYZE_INK, zIndex: total + 1, fontSize: RYZE_TITLE_FONT_CSS }}
      >
        <ArrowRight className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" /> Back to Main
      </motion.button>
      <motion.div
        animate={{ opacity: active === 0 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ color: RYZE_INK, zIndex: total }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <div className="w-px h-8 bg-gradient-to-b from-current to-transparent opacity-60 animate-pulse" />
      </motion.div>
    </div>
    </RyzeDesignScaleLayer>
  );
};

// 화면 상단에 놓이는 평범한(pill이 아닌) 텍스트형 "Back to Main" 버튼 — RyzeWorkChapterList와
// 카드 상세(ProjectDetail의 일반 카드 분기)에서 마크업이 동일해 하나로 통합.
// (히어로/인트로의 절대 위치·pill 스타일 버튼은 시각적으로 달라 별도로 유지한다.)
const RyzeBackToMainButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.button
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    className="group cursor-pointer text-sm uppercase tracking-widest font-semibold transition-opacity opacity-60 hover:opacity-100 flex items-center gap-2"
    style={{ color: RYZE_INK, fontFamily: RYZE_FONT }}
  >
    <ArrowRight className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" /> Back to Main
  </motion.button>
);

// Overview 히어로(카드 스와이프) 다음에 이어지는 첫 콘텐츠 섹션 — 밝은 대지(#F5F5F5) 페이지
// 3장을 나란히 배치한 인쇄물/룩북 스타일 레이아웃. 페이지 사이의 얇은 틈(gap)으로 뒤에 깔린
// 흑백 사진이 살짝 비치면서 각 페이지의 구분감을 준다. 각 페이지는 번호, 타이틀, 본문으로 구성되며
// 세 번째 페이지 우하단에는 브랜드 심볼이 놓인다.
const RYZE_OVERVIEW_INTRO_PAGES: {
  number: string;
  title: string;
  body?: string[];
  note?: string[];
  list?: string[];
  date?: string;
}[] = [
  {
    number: '01',
    title: 'AI Design Project',
    body: [
      '가상의 패션 브랜드 RYZE를 통해 기획, 브랜드 전략,',
      '무드보드, 이미지 · 영상 제작에 이르는 다양한',
      '디자인 영역에 AI를 도입하여 워크플로우의 생산성과',
      '비용 효율을 실험하고, 고품질 결과물을 위한',
      '프로세스를 정립하고자 합니다.',
    ],
    note: ['해당 포트폴리오를 구성하고 있는 모든 콘텐츠는', 'AI로 제작된 결과물입니다.'],
    date: '2026.08 ~ 2026.09',
  },
  {
    number: '02',
    title: 'Duration / Scope',
    body: ['4 Weeks / Solo Project'],
  },
  {
    number: '03',
    title: 'Tool Used',
    list: ['Higgsfield', 'Midjourney', 'Claud Code', 'Figma', 'ChatGPT', 'Google Gemini', 'Adobe Photoshop', 'Adobe Illustrator'],
  },
];

// 텍스트 한 줄을 아래에서 위로 밀어올려 등장시키는 마스크 리빌 — RyzeOverviewSlide의 텍스트
// 전환과 같은 방식(overflow-hidden 마스크 + 안쪽 레이어의 y 이동, opacity는 건드리지 않음)이다.
// "revealed"가 false→true로 바뀌는 순간 한 번만 재생되고, delay로 줄마다 순차적으로 나타난다.
const RevealUp: React.FC<{
  children: React.ReactNode;
  revealed: boolean;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, revealed, delay = 0, className, style }) => (
  <div className={`overflow-hidden ${className || ''}`} style={style}>
    <motion.div
      initial={false}
      animate={{ y: revealed ? '0%' : '100%' }}
      transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1], delay: revealed ? delay : 0 }}
    >
      {children}
    </motion.div>
  </div>
);

const RyzeOverviewIntro: React.FC<{ onBack: () => void; designScale: number; designCanvasH: number }> = ({ onBack, designScale, designCanvasH }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    // disconnect 없이 계속 관찰 — 화면에서 벗어나면 revealed를 다시 false로 되돌려, 나중에
    // 재진입할 때 리빌 애니메이션이 처음부터 다시 재생되게 한다.
    const io = new IntersectionObserver(
      ([entry]) => {
        setRevealed(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
      {/* 페이지 높이(920/1080px)가 두 단계 브레이크포인트 고정값이라, 목표 세 해상도
          (1920/2560/3840)는 전부 md: 기준(1080px)을 그대로 써서 절대 높이가 같아지고 상대
          비중이 달라진다 — 2560 캔버스로 감싸 비율을 유지한다. */}
      <RyzeDesignScaleLayer enabled scale={designScale}>
      {/* 높이는 1080 고정이 아니라 뷰포트 높이(designCanvasH)의 85% — 위쪽에 히어로 슬라이드가
          15% 정도만 걸쳐 보이게 하면서 흰색 영역은 예전(1080)보다 위로 더 길게 자란다. 화면을
          완전히 채우지 않는 건 의도다(스크롤은 문서 맨 아래에 멈추므로 아래쪽이 고정되고 위로 자란다). */}
      <div className="relative flex" style={{ height: Math.round(Math.max(1080, designCanvasH * 0.85)), gap: '3px' }}>
        {/* 히어로의 Back to Main은 그 h-screen 박스 안에서만 절대 위치해 스크롤로 3열 레이아웃까지
            내려오면 화면에서 사라진다 — 이 구간에서도 동일하게 돌아갈 수 있도록 여기 다시 둔다.
            다른 화면들의 검정 알약 Back to Main/Work 버튼과 크기를 통일하기 위해 스케일 캔버스
            "안쪽"(2560 디자인 좌표계)으로 옮겨, transform이 폰트/패딩/보더radius까지 함께
            축소·확대하게 한다(캔버스 밖에 두면 실제 px 그대로 그려져 해상도별로 다른 크기가 됨). */}
        <motion.button
          onClick={onBack}
          initial={false}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 12 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="group cursor-pointer absolute bottom-6 left-6 md:bottom-10 md:left-12 z-10 rounded-full uppercase tracking-widest font-semibold transition-opacity opacity-70 hover:opacity-100 flex items-center gap-2 px-5 py-3"
          style={{ color: '#F9FAFB', backgroundColor: '#0A0A0A', fontFamily: RYZE_FONT, fontSize: RYZE_TITLE_FONT_CSS }}
        >
          <ArrowRight className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" /> Back to Main
        </motion.button>
        {RYZE_OVERVIEW_INTRO_PAGES.map((page, i) => {
          const pageDelay = i * 0.08;
          let lineIndex = 0;
          const nextDelay = () => pageDelay + lineIndex++ * 0.06;
          return (
            <div
              key={i}
              className="relative flex-1 h-full flex flex-col px-6 md:px-10 py-8 md:py-12"
              style={{ backgroundColor: '#F5F5F5', color: '#0A0A0A', fontFamily: RYZE_FONT }}
            >
              <div className="flex flex-col gap-8 md:gap-10 w-full">
                <RevealUp revealed={revealed} delay={nextDelay()} className="text-[15px] md:text-[16px] tracking-[2px] opacity-70 font-medium">
                  {page.number}
                </RevealUp>
                <RevealUp revealed={revealed} delay={nextDelay()} className="text-2xl md:text-[28px] font-bold">
                  <span style={{ letterSpacing: '-0.28px' }}>{page.title}</span>
                </RevealUp>
                {page.body && (
                  <div className="max-w-[300px] md:max-w-[360px] text-[15px] md:text-[16px] leading-[1.6]" style={{ opacity: 0.75 }}>
                    {page.body.map((line, li) => (
                      <RevealUp key={li} revealed={revealed} delay={nextDelay()}>{line}</RevealUp>
                    ))}
                  </div>
                )}
                {page.note && (
                  <div className="max-w-[300px] md:max-w-[390px] text-[15px] md:text-[16px] leading-[1.5]" style={{ opacity: 0.75 }}>
                    {page.note.map((line, li) => (
                      <RevealUp key={li} revealed={revealed} delay={nextDelay()}>{line}</RevealUp>
                    ))}
                  </div>
                )}
                {page.date && (
                  <RevealUp revealed={revealed} delay={nextDelay()} className="text-[13px] md:text-[14px] tracking-[1px] opacity-60">
                    {page.date}
                  </RevealUp>
                )}
                {page.list && (
                  <div className="max-w-[300px] text-[15px] md:text-[16px] leading-[2.4]" style={{ opacity: 0.75 }}>
                    {page.list.map((item, li) => (
                      <RevealUp key={li} revealed={revealed} delay={nextDelay()}>
                        <span className="flex">
                          <span>-</span>
                          <span className="ml-3">{item}</span>
                        </span>
                      </RevealUp>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </RyzeDesignScaleLayer>
    </section>
  );
};

// "Work" 챕터 목록 — 첨부 레퍼런스 영상(핀터레스트 임베드 클립)의 디자인/모션을 그대로
// 재현한다. 영상을 프레임 단위로 뜯어보면: 우측 정렬된 굵은 세리프 대문자 목록, 항목 사이
// 얇은 구분선, 왼쪽에 붙은 작은 번호. 마우스 위치와 무관하게 WORKS → ABOUT → CONTACT
// 순서로 한 항목씩 자동으로 밝아지는(다른 항목은 흐려지는) 스포트라이트 애니메이션이
// 반복 재생됐다 — hover와는 별개의 자동 루프였다.
const RYZE_WORK_CHAPTER_LIST: { title: string; slug: string }[] = [
  { title: 'Planning', slug: 'planning' },
  { title: 'Brand & Visuals', slug: 'brand-design' },
  { title: 'Content Design', slug: 'content-design' },
];

const RyzeWorkChapterList: React.FC<{ onBack: () => void; onOpen: (slug: string) => void }> = ({ onBack, onOpen }) => {
  // 시간차 자동 순환은 제거 — 실제로 마우스가 올라간 항목에서만 반응한다. null이면
  // 아무 것도 호버되지 않은 기본 상태로, 이때는 전부 동일하게 밝게 보인다.
  const [hovered, setHovered] = useState<number | null>(null);
  // 이 화면의 제목 글자 크기는 clamp(24px, 6vw, 108px)라 1800px(=108/0.06) 이상 폭에서는
  // 전부 108px로 캡돼, 1920/2560/3840 세 목표 해상도에서 절대 크기는 같지만 화면에서 차지하는
  // 상대적 비중은 서로 달라 보인다(Planning에서 쓴 것과 같은 RyzeDesignScaleLayer로 감싸
  // 2560 기준 비율을 그대로 유지한다).
  const { scale: designScale, canvasH: designCanvasH } = useRyzeDesignMetrics(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: RYZE_BG, color: RYZE_INK }}
    >
      {/* 검정 배경 대신 엘리베이터 화보 사진을 깐다 — object-cover라 어느 해상도·화면
          비율에서도 여백 없이 화면을 완전히 채우고, 넘치는 부분만 잘려나간다(인물이
          중앙에 있어 어느 비율이든 양옆/위아래 벽만 살짝 잘리고 인물은 항상 프레임 안에
          있다). 위에 어두운 그라데이션을 겹쳐 흰 텍스트/구분선 가독성을 지킨다. */}
      <img
        src={getImageUrl('RYZE/work-chapter-bg.webp')}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.45) 35%, rgba(10,10,10,0.85) 100%)' }}
      />
      {/* RyzeDesignScaleLayer(2560 캔버스 전체 폭 기준 중앙 정렬 박스)로 감싸면, 이 박스가
          바깥의 px-6/12 패딩을 무시하고 뷰포트 전체 폭 기준으로 다시 중앙 정렬되면서 버튼이
          왼쪽 패딩 밖으로 밀려나 잘려 보였다 — 카드 상세(ProjectDetail)의 동일한 버튼처럼
          단순 패딩 컨테이너만 쓴다(제목과 달리 이 버튼은 캔버스 비율 유지가 필요 없다). */}
      <div className="relative px-6 md:px-12 py-10">
        <RyzeBackToMainButton onClick={onBack} />
      </div>
      <div className="relative flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-14 lg:px-20 pb-24">
        <RyzeDesignScaleLayer enabled scale={designScale} canvasH={designCanvasH}>
        {/* max-w-[1550px]는 이제 2560 디자인 캔버스 내부 좌표라, scale이 곱해지면 실제로는
            1550×scale px가 된다 — 2560 기준 비율이 그대로 유지된다. */}
        <div className="w-full max-w-[1550px] mx-auto">
          {RYZE_WORK_CHAPTER_LIST.map((chapter, i) => {
            const isActive = hovered === null || i === hovered;
            return (
              <motion.button
                key={chapter.slug}
                onClick={() => onOpen(chapter.slug)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.08 }}
                className={`group w-full flex items-baseline justify-between gap-3 sm:gap-5 cursor-pointer py-4 sm:py-6 md:py-9 ${
                  i < RYZE_WORK_CHAPTER_LIST.length - 1 ? 'border-b' : ''
                }`}
                style={{ borderColor: 'rgba(245,245,240,0.15)' }}
              >
                {/* 번호 — flex 자식이라 항목 폭과 무관하게 항상 텍스트 왼쪽에 같은 간격으로
                    붙는다(전에는 absolute라 긴 제목과 겹치거나 짧은 제목과는 멀어졌었다).
                    shrink-0로 제목이 줄어도 번호 자체는 찌그러지지 않는다. Cormorant Garamond는
                    이 작은 크기에서는 획이 너무 가늘어 가독성이 떨어져서, 같은 세리프 계열이지만
                    더 단단한 Playfair Display(Bold)로 바꿨다. */}
                <span
                  className="shrink-0 text-xs sm:text-sm md:text-base tracking-[0.15em] transition-opacity duration-700"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, opacity: isActive ? 1 : 0.35 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {/* 제목 — 굵은 세리프 대문자, 우측 정렬. 활성 항목만 완전히 밝고 나머지는 흐리게.
                    clamp 최소값을 작게 잡아 320px 폭에서도 가장 긴 제목("Content Design")이
                    줄바꿈 없이 한 줄에 들어간다. */}
                <span
                  className="flex-1 min-w-0 uppercase text-right transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-2 md:group-hover:-translate-x-4"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 600,
                    fontSize: 'clamp(24px, 6vw, 108px)',
                    letterSpacing: '0.01em',
                    opacity: isActive ? 1 : 0.35,
                    display: 'inline-block',
                  }}
                >
                  {chapter.title}
                </span>
              </motion.button>
            );
          })}
        </div>
        </RyzeDesignScaleLayer>
      </div>
    </motion.div>
  );
};

// RYZE 개별 프로젝트 상세 — 그리드 카드(4개) 클릭 시 이동하는 페이지
export const RyzeProjectDetail: React.FC = () => {
  const { n } = useParams();
  const navigate = useNavigate();
  const idx = Math.max(1, Math.min(RYZE_GRID_COUNT, parseInt(n || '1', 10) || 1)) - 1;
  const copy = RYZE_CARD_COPY[idx];
  const portraitImage = RYZE_CARD_IMAGES[idx];
  // Overview 히어로+인트로가 함께 쓸 스케일/캔버스 높이 — 두 컴포넌트가 각자 따로 계산하면
  // 리사이즈 타이밍이 프레임 하나씩 어긋날 수 있어 여기서 한 번만 계산해 내려보낸다.
  const { scale: overviewScale, canvasH: overviewCanvasH } = useRyzeDesignMetrics(idx === 0);

  if (idx === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen"
        style={{ backgroundColor: RYZE_BG, color: RYZE_INK }}
      >
        <RyzeOverviewHero
          onBack={() => navigate('/project-new')}
          designScale={overviewScale}
          designCanvasH={overviewCanvasH}
        />
        <RyzeOverviewIntro onBack={() => navigate('/project-new')} designScale={overviewScale} designCanvasH={overviewCanvasH} />
      </motion.div>
    );
  }

  // "Work" 카드(그리드 2번째, idx===1) 전용 챕터 목록 페이지 — 첨부 레퍼런스 영상(핀터레스트
  // 임베드 클립) 재현. 훅을 써야 해서 별도 컴포넌트(RyzeWorkChapterList)로 분리했다.
  if (idx === 1) {
    return <RyzeWorkChapterList onBack={() => navigate('/project-new')} onOpen={(slug) => navigate(`/projects/2/${slug}`)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: RYZE_BG, color: RYZE_INK }}
    >
      <div className="px-6 md:px-12 py-10">
        <RyzeBackToMainButton onClick={() => navigate('/project-new')} />
      </div>
      <div className="flex-1 flex flex-col items-center px-6 md:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative w-full max-w-[420px] aspect-[3/4] overflow-hidden rounded-xl"
        >
          <img
            src={getImageUrl(portraitImage)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: '45%', background: 'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0) 100%)' }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="mt-8 flex flex-col items-center gap-3 text-center"
          style={{ fontFamily: RYZE_FONT }}
        >
          <span className="text-xs tracking-[0.3em] opacity-40">RYZE — {String(idx + 1).padStart(2, '0')}</span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-wide">{copy.title}</h1>
          <p className="text-sm md:text-base opacity-60 max-w-md uppercase">{copy.desc}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};
