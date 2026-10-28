// RYZE 진입 후 보이는 "도어 리빌 + 프로젝트 카드 그리드" 화면. NewProjectPlaceholder(App.tsx)가
// 히어로 재생이 끝나면 이 컴포넌트로 넘어간다.
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { getImageUrl, RYZE_BG, RYZE_FONT, RYZE_INK, RyzeMusicToggleWithLabel, RyzeWorkIntroContext } from './shared';
import { RyzeLogoSVG } from './RyzeHero';

// ── 도어 리빌 트랜지션 (레퍼런스 123.mp4 프레임 단위 실측 재현) ──
// 레퍼런스의 실제 구조 (컴포지션 좌표 실측치를 우리 히어로 레이아웃에 맞게 이식):
//  · 정지 상태: 정착된 히어로 스냅샷이 화면 전체를 그대로 덮고 있다 (컷 없음).
//    우리 히어로의 RYZE 워드마크는 정확히 화면 세로 50% 중앙에 그려지므로,
//    가로지르는 선/도어의 중심도 레퍼런스 원본 비율(0.4345)이 아니라 50%로 맞춘다
//    (레퍼런스는 자기 컴포지션 기준 로고가 정중앙이 아니었을 뿐).
//  · 가로지르는 효과: 아주 얇은 컷 라인(높이 ~1.2%)이 왼쪽 끝에서 오른쪽 끝까지
//    부드럽게 지나가며, 지나간 자리에서만 그 얇은 틈으로 뒤 씬(더미 이미지)이
//    비쳐 보인다 — 이때 위·아래 조각은 전혀 밀리지 않아(오프셋 0) RYZE 글자는
//    제자리에 그대로 있고, 가로선만 가로지르는 것처럼 보인다.
//  · 도어 오픈: 가로지르기가 끝나면 바로 그 컷 라인 자리에서 위/아래 조각이
//    자연스럽게 각자의 높이만큼 밀려나며 열린다. 이징 실측 ≈ cubic-bezier(0.7,0,0.2,1).
//  · 패널 확장: 도어 오픈 도중 x 0.356~0.649(폭 29.3%) 자리에 흰 패널이
//    가로 드로우 없이 폭 100%로 곧장 나타나 세로로만 펴진다(중심은 도어와 동일한 50%).
//    easeInOutCubic(0.65,0,0.35,1).
//  · 콘텐츠: 패널 확장 말미부터 패널 안 텍스트가 서서히 페이드 인.
//  · 전체 타이밍은 사용자 요청으로 느리고 부드럽게 늘여 재생한다.
const RYZE_DOOR_MS = 1150;
const RYZE_DOOR_EASE: [number, number, number, number] = [0.7, 0, 0.2, 1];
const RYZE_PANEL_EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
const RYZE_SPLIT = 0.5;           // 도어/패널의 세로 중심 — 히어로 워드마크와 동일한 정중앙(50%)
const RYZE_LINE_HALF = 0.012;     // 가로지르는 컷 라인의 절반 두께 (~2.4% 높이)
// 패널(=그리드 카드) 지오메트리: 화면에 4개가 가로로 들어갈 카드 크기.
// 첫 카드가 펴질 때부터 이 크기로 나타나서 그리드 단계에서 크기 변화 없이
// 위치만 이동하면 되도록 한다.
const RYZE_PANEL_W = 16.5;        // 카드 폭 (vw)
const RYZE_PANEL_H = 0.58;        // 카드 높이 (뷰포트 비)
const RYZE_GRID_GAP = 2.8;        // 카드 사이 간격 (vw)
export const RYZE_GRID_COUNT = 4;        // 그리드 카드 개수
// 카드별 세로 위치를 살짝씩 어긋나게 주는 오프셋(뷰포트 높이 비율, vh) — 한 줄로 가지런히
// 정렬된 느낌 대신 카드마다 높낮이가 조금씩 다른 불규칙한 배치를 만든다.
const RYZE_CARD_Y_OFFSET_VH = [-2.5, 4.5, -1.5, 5.5];
// 4개 카드 전체를 한꺼번에 조금 더 아래로 내리는 공통 오프셋(vh) — 개별 카드 간
// 높낮이 차이(RYZE_CARD_Y_OFFSET_VH)는 그대로 유지한 채 그룹 전체만 이동한다.
const RYZE_CARD_GROUP_Y_OFFSET_VH = 1.5;
// 배경 심볼 이미지 — 카드(RYZE_PANEL_W/RYZE_GRID_GAP: vw, RYZE_PANEL_H: vh)와 정확히
// 같은 비율로 함께 커지고 작아져야, 이미지의 특정 부분(뾰족한 축/고리 등)이 특정 카드
// 뒤에 걸쳐 보이는 지금의 배치가 뷰포트 크기와 무관하게 항상 유지된다. 예전엔 이미지가
// 고정 px 폭(3200px)이라 카드(vw 기반)와 독립적으로 스케일되면서 뷰포트가 바뀌면
// 정렬이 어긋났다 — 카드와 동일하게 vw(가로)/vh(세로) 단위로 맞춰 하나의 비율로 묶는다.
const RYZE_BG_IMG_WIDTH_VW = 170;   // 카드 폭(vw)과 같은 기준의 비례 폭
const RYZE_BG_IMG_OFFSET_X_VW = -1.3; // 중앙 대비 가로 오프셋(vw)
const RYZE_BG_IMG_OFFSET_Y_VH = 4.7;  // 중앙 대비 세로 오프셋(vh) — 카드 높이(vh 기반)와 같은 단위
// 카드 안 제목/설명 폰트 크기 — 카드 폭(RYZE_PANEL_W)이 vw 기반이라 화면 폭에 따라
// 카드 자체는 이미 유동적이지만, 폰트가 고정 px였던 탓에 좁은 화면에서 카드 대비
// 텍스트가 커져 "AI WORKFLOW DEEP-DIVE"처럼 긴 제목이 카드 밖으로 잘려 보이는 문제가 있었다.
// clamp(최소, 뷰포트에 비례하는 값, 최대)로 유동 스케일링하되 최소/최대를 둬서
// 아주 큰 화면에서 과도하게 커지거나 아주 작은 화면에서 읽기 힘들 만큼 작아지지 않게 한다.
// 최대값(15px/12px)은 2560px 기준 디자인에서 의도한 크기, 768px 부근부터 최소값에 가까워진다.
export const RYZE_TITLE_FONT_CSS = 'clamp(9px, 0.28vw + 7.8px, 15px)';
const RYZE_DESC_FONT_CSS = 'clamp(8px, 0.22vw + 6.3px, 12px)';
// 각 카드 안을 채우는 임의의 플레이스홀더 이미지 (picsum 고정 id — 매번 같은 사진)
// pravatar는 인물 사진만 제공하는 플레이스홀더 서비스 — 카드별로 고정된 인물이 나오도록
// 서로 다른 img 번호를 지정한다.
export const RYZE_CARD_IMAGES = ['RYZE/card1.webp', 'RYZE/card2.webp', 'RYZE/card3.png', 'RYZE/card4.webp'];
// 레퍼런스 사진처럼 카드 좌하단에 얹는 더미 텍스트 — 제품명/설명
export const RYZE_CARD_COPY: { title: string; desc: string }[] = [
  { title: 'Overview', desc: 'Before the work reveals itself in detail, a brief overview — the purpose, the scope, the essentials' },
  { title: 'Work', desc: 'Planning, brand, product, and content, the work that shaped RYZE from the start' },
  { title: 'AI Workflow Deep-dive', desc: 'An inside look at how AI was integrated into every part of the workflow' },
  { title: 'Outcome / Reflection', desc: 'Where the project lands, with its outcomes, its limits, and what was learned' },
];
// 카드 우상단 라벨 — SS26 — RYZE ARCHIVE 문구와 동일한 폰트(Satoshi)·크기(RYZE_TITLE_FONT_CSS)
const RYZE_CARD_LABELS = [
  'No 01 — A Brief Walkthrough',
  'No 02 — The Craft',
  'No 03 — The Method',
  'No 04 — The Reflection',
];

// Satoshi 폰트에서 em dash("—")가 대문자(uppercase) 텍스트의 캡 하이트 대비 살짝 아래로
// 처져 보이는 렌더링 특성을 보정 — 대시만 살짝 위로 올려 다른 글자와 수평이 맞아 보이게 한다.
const RyzeDashText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split('—');
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <span style={{ position: 'relative', top: '-0.12em' }}>—</span>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

// 카드 안 제목/설명 텍스트 — 카드가 화면에 도착하는 순간, 오른쪽에서 왼쪽으로
// 슬라이드 인 되며 나타난다(카드 자체의 진입 방향과 같은 방향). 처음엔 빠르게
// 들어왔다가 점점 느려지는 Ease-Out과, 안 보이다가 후반부로 갈수록 보이는
// 오퍼시티 페이드인을 함께 적용한다.
const RyzeSlideText: React.FC<{
  active: boolean;
  reduced: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ active, reduced, className, children }) => (
  <motion.div
    className={className}
    initial={{ x: 28, opacity: 0 }}
    animate={active || reduced ? { x: 0, opacity: 1 } : {}}
    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);
// 카드를 화면 가로 중앙에 정렬했을 때 각 카드 중심의 x좌표(vw)
const RYZE_GRID_CENTERS = Array.from({ length: RYZE_GRID_COUNT }, (_, i) => {
  const totalW = RYZE_GRID_COUNT * RYZE_PANEL_W + (RYZE_GRID_COUNT - 1) * RYZE_GRID_GAP;
  const startX = (100 - totalW) / 2;
  return startX + i * (RYZE_PANEL_W + RYZE_GRID_GAP) + RYZE_PANEL_W / 2;
});
// 카드의 x 이동은 항상 `left:50%`를 기준으로 한 translateX(x)로만 제어한다 —
// 화면 중앙(50vw) 대비 목표 중심의 편차만큼 -50%에 더해서 이동시킨다.
const ryzeCardX = (centerVw: number, extraVw = 0) =>
  `calc(-50% + ${(centerVw - 50 + extraVw).toFixed(3)}vw)`;
// 리빌되는 섹션 배경 — 커버(#0A0A0A)와 구분되어 '열림'이 읽히도록 살짝 밝게
// (레퍼런스도 커버=검정, 뒤 씬=회색 톤으로 명도 차가 있음)
const RYZE_SCENE_BG = '#141414';

const RYZE_WIPE_MS = 800; // 가로지르는 슬릿 리빌: 좌→우로 부드럽게, 히어로 스냅샷 위를 지나가며 뒤 씬을 드러냄
const RYZE_WIPE_EASE: [number, number, number, number] = [0.45, 0, 0.2, 1];
const RYZE_GRID_ENTER_MS = 850;   // 카드들이 오른쪽 밖에서 들어오는 시간 (감속 구간을 더 길게 느끼도록 연장)
const RYZE_GRID_STAGGER_MS = 100; // 카드별 진입 지연 간격
// Ease-Out(감속) — easeOutExpo보다 더 급격한 커브. 초반에 거의 순간적으로 튀어나왔다가
// 도착 지점 앞에서 아주 길고 뚜렷하게 느려지며 멈춘다 (감속감을 최대로 강조).
const RYZE_GRID_ENTER_EASE: [number, number, number, number] = [0.07, 0.9, 0.17, 1];

// 카드 본체(라벨+이미지+그라디언트+타이틀/설명) 마크업 — 첫 카드(패널)와 나머지 그리드
// 카드가 동일한 구조를 그대로 복붙해 쓰던 것을 하나로 통합. idx===0(패널)은 뷰포트
// 진입 즉시 필요하므로 eager, 나머지는 gridPhase 이후에만 마운트되므로 lazy 처리한다.
const RyzeCardBody: React.FC<{ idx: number; textActive: boolean; reduced: boolean }> = ({ idx, textActive, reduced }) => {
  const copy = RYZE_CARD_COPY[idx];
  return (
    <>
      {/* 카드 위 라벨 — 카드 바깥(위쪽)에 배치되어 카드가 커지거나 호버해도 잘리지 않는다.
          SS26 — RYZE ARCHIVE 문구와 동일한 폰트·크기 */}
      <div
        className="absolute right-0 pointer-events-none text-right"
        style={{ bottom: 'calc(100% + 10px)', fontFamily: RYZE_FONT, fontSize: RYZE_TITLE_FONT_CSS, color: '#0A0A0A' }}
      >
        <span className="font-semibold tracking-wide uppercase"><RyzeDashText text={RYZE_CARD_LABELS[idx]} /></span>
      </div>
      {/* 카드 본체 — 이미지/텍스트를 담는 실제 박스. overflow-hidden으로 이미지 확대 호버가
          카드 밖으로 삐져나오지 않게 클립한다. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ backgroundColor: RYZE_INK, boxShadow: '0 16px 34px -6px rgba(0,0,0,0.32)' }}
      >
        {/* 카드 안 임의 이미지 — 각 카드를 채우는 플레이스홀더 사진. 호버 시 살짝 확대되어 반응감을 준다. */}
        <img
          src={getImageUrl(RYZE_CARD_IMAGES[idx])}
          alt=""
          loading={idx === 0 ? undefined : 'lazy'}
          className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-out group-hover:scale-110 will-change-transform"
        />
        {/* 하단 그라디언트 스크림 — 사진 위에서도 텍스트가 읽히도록 */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: '55%', background: 'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0) 100%)' }}
        />
        {/* 제품명 — 카드 중앙 하단부(빨간 박스 위치)에 배치, 살짝 오른쪽으로 이동.
            카드가 도착하는 순간 오른쪽에서 왼쪽으로 슬라이드 인 된다. */}
        <div className="absolute left-0 w-full pl-6 md:pl-8 pr-4 md:pr-5 pointer-events-none overflow-hidden" style={{ top: '64%', fontFamily: RYZE_FONT, fontSize: RYZE_TITLE_FONT_CSS }}>
          <RyzeSlideText active={textActive} reduced={reduced} className="font-semibold tracking-wide text-white uppercase leading-tight">
            {copy.title}
          </RyzeSlideText>
        </div>
        {/* 더미 텍스트 — 설명(파란 박스 위치로 이동, 좌측을 재킷#번호와 동일하게 정렬) */}
        <div className="absolute left-0 w-full pl-6 md:pl-8 pr-4 md:pr-5 pointer-events-none overflow-hidden" style={{ top: '78%', fontFamily: RYZE_FONT, fontSize: RYZE_DESC_FONT_CSS }}>
          <RyzeSlideText active={textActive} reduced={reduced} className="leading-snug text-white max-w-[85%] uppercase">
            {copy.desc}
          </RyzeSlideText>
        </div>
      </div>
    </>
  );
};

// 그리드의 2~4번째 카드(idx: RYZE_CARD_COPY 기준 1~3) — 오른쪽에서 자기 순서(idx)만큼
// 시차를 두고 들어오며, 자신의 진입 애니메이션이 끝나는 순간 텍스트 글리치 리빌이 시작된다.
// React.memo — 부모(RyzeProjectsSection)가 bgmHovered 같은 사소한 상태로 리렌더돼도
// idx/centerVw/reduced/onOpen이 그대로면 이 카드는 다시 렌더되지 않는다.
const RyzeGridCard: React.FC<{
  idx: number; // RYZE_CARD_COPY / RYZE_CARD_PORTRAIT_IDS 상의 인덱스 (1~3)
  centerVw: number;
  panelHeight: any;
  reduced: boolean;
  onOpen: () => void;
}> = React.memo(({ idx, centerVw, panelHeight, reduced, onOpen }) => {
  const [textActive, setTextActive] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const delay = RYZE_GRID_ENTER_MS + (idx - 1) * RYZE_GRID_STAGGER_MS;
    const t = window.setTimeout(() => setTextActive(true), delay);
    return () => window.clearTimeout(t);
  }, [reduced, idx]);

  return (
    <motion.div
      className="absolute cursor-pointer group"
      onClick={onOpen}
      style={{
        left: '50%',
        top: `calc(${RYZE_SPLIT * 100}% + ${RYZE_CARD_Y_OFFSET_VH[idx] + RYZE_CARD_GROUP_Y_OFFSET_VH}vh)`,
        y: '-50%',
        width: `max(120px, ${RYZE_PANEL_W}vw)`,
        height: reduced ? `${RYZE_PANEL_H * 100}vh` : panelHeight,
      }}
      initial={{ x: ryzeCardX(centerVw, 100) }}
      animate={{ x: ryzeCardX(centerVw) }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        x: {
          duration: RYZE_GRID_ENTER_MS / 1000,
          ease: RYZE_GRID_ENTER_EASE,
          delay: ((idx - 1) * RYZE_GRID_STAGGER_MS) / 1000,
        },
        scale: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      <RyzeCardBody idx={idx} textActive={textActive} reduced={reduced} />
    </motion.div>
  );
});

export const RyzeProjectsSection: React.FC<{
  revealing: boolean;         // true면 도어 리빌 진행 중, false면 정착 상태
  reduced: boolean;
  instant?: boolean;          // true면 도어/그리드 애니메이션 전부 생략하고 곧바로 정착 상태로 표시(세션 내 재방문)
  heroSnapshot: string | null; // 정착된 히어로 화면 스냅샷 (도어 표면)
  onRevealDone: () => void;
}> = ({ revealing, reduced, instant, heroSnapshot, onRevealDone }) => {
  const navigate = useNavigate();
  const runWorkIntro = useContext(RyzeWorkIntroContext);
  // instant일 땐 reduced-motion과 동일하게 모든 모션을 생략하고 최종 상태로 곧장 표시한다.
  const skip = reduced || !!instant;
  // wipe: 슬릿이 좌→우로 가로지르며 드러나는 진행도 0→1 (가로지르는 효과 본체)
  const wipe = useMotionValue(skip ? 1 : 0);
  const door = useMotionValue(skip ? 1 : 0);   // 도어 진행도 0(슬릿)→1(완전 오픈) — 가로지르기 완료 후 시작
  const panelH = useMotionValue(skip ? 1 : 0); // 패널 세로 확장(그냥 펴지는) 진행도
  const textReveal = useMotionValue(skip ? 1 : 0); // 패널 안 "RYZE" 텍스트 좌→우 리빌 진행도
  // 패널은 도어가 열리기 전까지는 아예 보이지 않아야 한다(가로지르는 동안 얇은 흰 선처럼
  // 비치던 문제) — 도어가 열리고 패널이 펴지기 시작하는 순간에만 나타나도록 게이트.
  const [panelReady, setPanelReady] = useState(skip);
  // 그리드 단계: 첫 카드가 왼쪽으로 붙고, 나머지 5개 카드가 오른쪽 밖에서 빠르게 들어와
  // 화면을 채운다. 텍스트 리빌이 끝난 뒤 켜진다.
  const [gridPhase, setGridPhase] = useState(skip);
  // 첫 카드(카드 0) 텍스트 슬라이드 인 트리거 — 자신의 진입 애니메이션(RYZE_GRID_ENTER_MS)이
  // 끝나는 시점, 즉 카드가 화면에 도착한 순간에 맞춰 켠다(다른 카드들이 다 들어올 때까지 기다리지 않음).
  // instant(세션 내 재방문)일 때도 이 타이밍은 그대로 유지해야 카드가 도착한 뒤 텍스트가
  // 슬라이드 인 되는 모습이 매번 재생된다 — 오직 진짜 reduced-motion에서만 건너뛴다.
  const [text0Active, setText0Active] = useState(reduced);
  useEffect(() => {
    if (reduced || !gridPhase) return;
    const t = window.setTimeout(() => setText0Active(true), RYZE_GRID_ENTER_MS);
    return () => window.clearTimeout(t);
  }, [gridPhase, reduced]);
  // 뒤로가기 버튼: 예전엔 그리드까지 다 채워진 뒤에야 나타나서 너무 늦었다 — 이제 도어가
  // 열리기 시작하는 시점에 곧바로(다른 프로젝트 상세 페이지와 동일한 아래→위 모션으로) 나타난다.
  const [headerReady, setHeaderReady] = useState(skip);
  const onRevealDoneRef = useRef(onRevealDone);
  onRevealDoneRef.current = onRevealDone;
  // 카드 클릭 핸들러 — idx별로 안정된(stable) 함수 참조를 유지해 RyzeGridCard의
  // React.memo가 부모 리렌더(예: bgmHovered)마다 무효화되지 않게 한다.
  const handleCardOpen = useCallback((idx: number) => {
    // "Work" 카드(그리드 2번째, idx===1 → RYZE_CARD_COPY[1])만 "WORK" 등장 인트로를
    // 거쳐 진입한다. 나머지 카드는 기존처럼 곧장 이동.
    if (idx === 1) {
      runWorkIntro(() => navigate('/projects/2'));
    } else {
      navigate(`/projects/${idx + 1}`);
    }
  }, [runWorkIntro, navigate]);
  const cardOpenHandlers = useMemo(
    () => RYZE_GRID_CENTERS.slice(1).map((_, i) => () => handleCardOpen(i + 1)),
    [handleCardOpen]
  );

  // 도어 위치: door=0일 땐 오프셋 0(제자리, 글자 안 밀림) — door=1이 되면 각 조각이
  // 자기 높이만큼 밀려나 화면 밖으로 완전히 사라진다.
  const topDoorY = useTransform(door, (v) => `${-(RYZE_SPLIT - RYZE_LINE_HALF) * v * 100}vh`);
  const botDoorY = useTransform(door, (v) => `${(1 - RYZE_SPLIT - RYZE_LINE_HALF) * v * 100}vh`);
  // 패널 높이: 2px → 61.9vh — 가로 드로우 없이 폭은 처음부터 100%, 세로로만 곧장 펴진다.
  const panelHeight = useTransform(panelH, (v) => `max(2px, ${RYZE_PANEL_H * v * 100}vh)`);
  // 가로지르기 마스크: 아직 지나가지 않은 오른쪽 구간엔 정착된 히어로 스냅샷(필러)이 그대로 남아있고,
  // 이미 지나간 왼쪽 구간에서만 슬릿(도어 레이어)이 드러나 그 틈으로 뒤 씬이 보인다.
  const fillerClip = useTransform(wipe, (v) => `inset(0 0 0 ${v * 100}%)`);
  const doorClip = useTransform(wipe, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);

  useEffect(() => {
    if (skip) {
      // 접근성(reduced-motion) 또는 세션 내 재방문(instant): 도어/패널 모션 생략, 곧장 정착 상태로 표시
      const t = window.setTimeout(() => onRevealDoneRef.current(), 850);
      return () => window.clearTimeout(t);
    }
    const anims: { stop: () => void }[] = [];
    const timers: number[] = [];
    // t=0(마운트)엔 아직 아무 변화 없음(필러가 정착 화면을 그대로 보여줌).
    // 짧은 홀드 후: ① 슬릿이 좌→우로 가로지르며 드러남 → ② 완료 시 위아래로 자연스럽게 열림.
    const HOLD = 200;
    timers.push(window.setTimeout(() => {
      // ① 가로지르는 효과: 슬릿이 왼쪽에서 오른쪽으로 부드럽게 지나가며 더미 이미지를 드러냄
      anims.push(animate(wipe, 1, {
        duration: RYZE_WIPE_MS / 1000,
        ease: RYZE_WIPE_EASE,
        onComplete: () => {
          // ② 가로지르기가 끝난 자리에서 자연스럽게 위/아래로 갈라져 열림
          anims.push(animate(door, 1, { duration: RYZE_DOOR_MS / 1000, ease: RYZE_DOOR_EASE }));
          // 뒤로가기 버튼은 도어가 열리기 시작하는 지금 바로 나타난다 (그리드까지 기다리지 않음)
          setHeaderReady(true);
          // ③ 도어가 열린 뒤에야 흰 패널이 나타나 곧장 세로로 펴진다(더 빠르게).
          timers.push(window.setTimeout(() => {
            setPanelReady(true);
            anims.push(animate(panelH, 1, {
              duration: 0.6,
              ease: RYZE_PANEL_EASE,
              onComplete: () => {
                // ④ 패널이 다 펴지면 먼저 첫 카드가 왼쪽으로 붙고, 나머지 카드들이
                // 오른쪽 밖에서 들어와 화면을 채운다 — 텍스트보다 그리드가 먼저 완성된다.
                setGridPhase(true);
                const enterTotal =
                  RYZE_GRID_ENTER_MS + (RYZE_GRID_COUNT - 1) * RYZE_GRID_STAGGER_MS + 100;
                timers.push(window.setTimeout(() => {
                  // ⑤ 그리드가 다 채워진 뒤에야 "RYZE" 텍스트가 좌→우로 드러남
                  anims.push(animate(textReveal, 1, {
                    duration: 0.5,
                    ease: 'easeOut',
                    onComplete: () => onRevealDoneRef.current(),
                  }));
                }, enterTotal));
              },
            }));
          }, 360));
        },
      }));
    }, HOLD));
    return () => { timers.forEach((t) => window.clearTimeout(t)); anims.forEach((a) => a.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.section
      className={revealing ? 'fixed inset-0 z-10 overflow-hidden' : 'relative w-full h-screen overflow-hidden'}
      style={{ backgroundColor: RYZE_SCENE_BG }}
      initial={skip ? { opacity: 0 } : false}
      animate={skip ? { opacity: 1 } : undefined}
      transition={skip ? { duration: 0.8 } : undefined}
    >
      {/* 더미 배경: 흰색 패널 바깥쪽, 도어 뒤 씬 자리 — 단색 배경(#F9FAFB) */}
      <div className="absolute inset-0" style={{ backgroundColor: '#F9FAFB' }} />

      {/* 배경 이미지 — 카드 그리드와 같은 세로 중심(RYZE_SPLIT)에, 헤더/카드보다 훨씬
          크게 얹어 모든 요소 "뒤로" 깔리는 대형 배경 그래픽으로 배치한다. 헤더보다도
          먼저 그려야(DOM 순서상 앞) 내비게이션(Back to Home/로고/BGM 토글)이 가려지지 않는다.
          카드와 동일하게 vw/vh 단위로 크기·위치를 잡아, 뷰포트가 바뀌어도 이미지의 특정
          부분이 특정 카드 뒤에 걸쳐 보이는 배치가 항상 같은 비율로 유지된다. 효과 없이
          항상 표시되어, 이 섹션이 마운트되는 순간(히어로 화면이 가로지르며 전환되는
          시점)부터 곧바로 보인다. */}
      <div
        className="absolute left-1/2 pointer-events-none"
        style={{
          top: `${RYZE_SPLIT * 100}%`,
          transform: `translate(calc(-50% + ${RYZE_BG_IMG_OFFSET_X_VW}vw), calc(-50% + ${RYZE_BG_IMG_OFFSET_Y_VH}vh))`,
        }}
      >
        <img
          src={getImageUrl('RYZE/bg-symbol.webp')}
          alt=""
          loading="lazy"
          style={{ width: `${RYZE_BG_IMG_WIDTH_VW}vw`, maxWidth: 'none' }}
        />
      </div>

      {/* 섹션 헤더 — 도어가 열리기 시작하면 곧바로 나타남(headerReady). 다른 프로젝트
          상세 페이지의 Back to Home과 동일한 아래→위 페이드인 모션 적용. */}
      {headerReady && (
        <div className="absolute top-0 left-0 w-full flex items-center justify-between px-6 md:px-12 py-8">
          <motion.button
            onClick={() => navigate('/')}
            initial={skip ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="cursor-pointer text-sm uppercase tracking-widest font-semibold transition-opacity opacity-60 hover:opacity-100 flex items-center gap-2"
            style={{ color: '#0A0A0A' }}
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
          </motion.button>
          {/* 내비게이션 바 중앙 로고 — 히어로 캔버스와 동일한 자간의 RYZE SVG */}
          <motion.div
            className="absolute left-1/2"
            style={{ x: '-50%' }}
            initial={skip ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <RyzeLogoSVG height={22} color="#0A0A0A" />
          </motion.div>
          {/* 우상단 BGM 재생/정지 토글 — skiper25 마이크로 인터랙션 재현.
              flex 흐름 밖으로 절대 위치시켜 호버 시 패딩이 커져도 Back to Home/로고 등
              다른 헤더 요소가 밀리지 않게 한다. 바깥 wrapper는 right로만 고정하고 폭은
              auto로 둬, 왼쪽에 라벨이 나타나도 토글 버튼 자체(오른쪽 끝)는 제자리에 머문다. */}
          <div className="absolute right-3 md:right-5 top-1/2" style={{ transform: 'translateY(-50%)' }}>
            {/* 곡 목록(호버 시 뜨는 #1/#2 스크롤 프리뷰)·64×56 박스 모두 다른 RYZE 화면과 같은
                공용 RyzeMusicToggleWithLabel을 쓴다 — 예전엔 이 파일에 라벨 로직이 따로 복제돼 있었다. */}
            <motion.div
              initial={skip ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <RyzeMusicToggleWithLabel />
            </motion.div>
          </div>
        </div>
      )}

      {/* 좌하단 캡션 — 카드 제목과 동일한 폰트(Satoshi)·크기(RYZE_TITLE_FONT_CSS)로 표기 */}
      {headerReady && (
        <motion.div
          className="absolute left-6 md:left-12 bottom-8 md:bottom-11"
          initial={skip ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: RYZE_FONT, fontSize: RYZE_TITLE_FONT_CSS, color: '#0A0A0A' }}
        >
          <span className="font-semibold tracking-wide uppercase"><RyzeDashText text="SS26 — RYZE ARCHIVE" /></span>
        </motion.div>
      )}

      {/* 우하단 캡션 — 좌하단 캡션과 동일한 폰트·크기로 대칭 배치 */}
      {headerReady && (
        <motion.div
          className="absolute right-6 md:right-12 bottom-8 md:bottom-11"
          initial={skip ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: RYZE_FONT, fontSize: RYZE_TITLE_FONT_CSS, color: '#0A0A0A' }}
        >
          <span className="font-semibold tracking-wide uppercase">LAT 37.5665° N</span>
        </motion.div>
      )}

      {/* 잉크 패널(=그리드 첫 카드): 가로지르는 동안·도어가 열리는 동안엔 완전히 숨겨져
          있다가(panelReady), 도어가 열린 뒤에야 나타나 높이만 2px→풀사이즈로 곧장 펴진다.
          텍스트 리빌 뒤에는 x만 애니메이션으로 왼쪽 그리드 자리로 이동한다. */}
      <motion.div
        className="absolute cursor-pointer group"
        onClick={() => gridPhase && navigate('/projects/1')}
        style={{
          left: '50%',
          top: `calc(${RYZE_SPLIT * 100}% + ${RYZE_CARD_Y_OFFSET_VH[0] + RYZE_CARD_GROUP_Y_OFFSET_VH}vh)`,
          y: '-50%',
          width: `max(120px, ${RYZE_PANEL_W}vw)`,
          height: skip ? `${RYZE_PANEL_H * 100}vh` : panelHeight,
          opacity: skip || panelReady ? 1 : 0,
        }}
        initial={{ x: ryzeCardX(50) }}
        animate={{ x: gridPhase ? ryzeCardX(RYZE_GRID_CENTERS[0]) : ryzeCardX(50) }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        transition={{
          x: { duration: RYZE_GRID_ENTER_MS / 1000, ease: RYZE_GRID_ENTER_EASE },
          scale: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        <RyzeCardBody idx={0} textActive={text0Active} reduced={reduced} />
      </motion.div>

      {/* 나머지 5개 그리드 카드: 텍스트 리빌이 끝나면(gridPhase) 오른쪽 화면 밖에서
          카드별로 살짝 시차를 두고 빠르게 들어와 화면을 채운다. */}
      {gridPhase && RYZE_GRID_CENTERS.slice(1).map((centerVw, idx) => (
        <RyzeGridCard
          key={idx + 1}
          idx={idx + 1}
          centerVw={centerVw}
          panelHeight={panelHeight}
          reduced={reduced}
          onOpen={cardOpenHandlers[idx]}
        />
      ))}

      {/* 가로지르는 슬릿 리빌 + 도어: 정착된 히어로 스냅샷이 화면을 덮고 있다가,
          왼쪽→오른쪽으로 지나가는 슬릿(가로지르는 효과)이 뒤 씬을 드러내고,
          그 자리에서 자연스럽게 위/아래로 갈라져 열린다. */}
      {!skip && revealing && heroSnapshot && (
        <>
          {/* 필러: 아직 슬릿이 지나가지 않은 구간에 정착 화면을 그대로 유지 (가로지르기 전엔 컷 없음) */}
          <motion.img
            src={heroSnapshot}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ clipPath: fillerClip }}
          />
          {/* 도어 레이어: 슬릿이 지나간 구간에서만 드러남 — 위/아래 조각 사이에 항상
              얇은 컷 라인(RYZE_LINE_HALF)만큼의 틈이 있고, door=0일 땐 그 자리에
              고정(오프셋 없음)되어 있어 글자가 밀려 보이지 않는다. door 애니메이션이
              시작되면 그제서야 각 조각이 밀려나며 갈라져 열린다. */}
          <motion.div className="absolute inset-0 pointer-events-none" style={{ clipPath: doorClip }}>
            <motion.div
              className="absolute left-0 w-full overflow-hidden"
              style={{ top: 0, height: `${(RYZE_SPLIT - RYZE_LINE_HALF) * 100}vh`, y: topDoorY, backgroundColor: RYZE_BG }}
            >
              <img src={heroSnapshot} alt="" className="absolute top-0 left-0 w-full object-cover" style={{ height: '100vh' }} />
            </motion.div>
            <motion.div
              className="absolute left-0 w-full overflow-hidden"
              style={{
                top: `${(RYZE_SPLIT + RYZE_LINE_HALF) * 100}vh`,
                height: `${(1 - RYZE_SPLIT - RYZE_LINE_HALF) * 100}vh`,
                y: botDoorY,
                backgroundColor: RYZE_BG,
              }}
            >
              <img
                src={heroSnapshot}
                alt=""
                className="absolute left-0 w-full object-cover"
                style={{ height: '100vh', top: `${-(RYZE_SPLIT + RYZE_LINE_HALF) * 100}vh` }}
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.section>
  );
};
