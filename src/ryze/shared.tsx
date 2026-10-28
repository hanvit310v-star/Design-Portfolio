// RYZE 챕터들이 공유하는 유틸/디자인 토큰/스케일 레이어.
// App.tsx(일반 챕터: Home/ProjectDetail 등)와 src/ryze/RyzeWorkChapterDetail.tsx(Planning
// 챕터) 양쪽에서 같이 쓰여서, 순환 참조(circular import)를 피하려고 별도 파일로 뽑았다.
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- 이미지 경로 헬퍼 ---
export const getImageUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${import.meta.env.BASE_URL}${path}`;
};

// --- RYZE 색상 토큰 (배경/잉크) ---
export const RYZE_BG = '#0A0A0A';
export const RYZE_INK = '#F9FAFB';
export const RYZE_INK_RGB: [number, number, number] = [245, 245, 240];

// --- RYZE 본문/UI 폰트 ---
export const RYZE_FONT = "'Satoshi', 'Inter', sans-serif";

// ─────────────────────────────────────────────────────────────────────────
// 해상도 독립 스케일링 — Planning 페이지의 모든 수치(920px, 420px, 각 차트 SVG 안의 폰트
// 크기, 여백 등)는 전부 이번 세션 내내 2560×1440 화면을 보면서 눈대중으로 맞춘 값이다.
// 그래서 더 작은 해상도(예: 1920×1080)에서 보면 글자만 콩알만해지고, 고정폭 박스(예: 여성
// 리더십과 성 고정관념 연구 동향 카드, 850px 고정)는 상대폭(%) 박스들과 다른 비율로 줄어들어
// 삐져나오거나 잘리는 문제가 생긴다.
//
// 해결책으로 "반응형(요소마다 vw/clamp로 재조정)" 대신 "고정 해상도 캔버스 + 균일 스케일"을
// 택했다 — 이유는, 이미 존재하는 수백 개의 절대 픽셀 값(개별 컴포넌트 곳곳, 특히 SVG 차트
// 내부는 JS 숫자라 CSS 단위 전환 자체가 불가능)을 하나하나 vw/rem으로 바꾸는 것은 값 하나만
// 놓쳐도 그 부분만 비율이 어긋나는 회귀가 생기기 쉬운 반면, 이미 2560×1440 기준으로 완성된
// 레이아웃 전체를 한 장의 "디자인 캔버스"로 보고 CSS transform: scale()로 통째로 줄이면
// 기존에 검증된 모든 값·정렬·타이포 비율이 완전히 그대로 보존된 채 크기만 바뀐다.
//
// 처음엔 "가로 비율(뷰포트폭/2560)만으로 스케일해도 16:9라 세로까지 맞아떨어진다"고 가정하고
// window.innerWidth만 기준으로 스케일했는데, 실제 크롬 브라우저로 확인해보니 틀렸다 —
// window.innerHeight는 화면 해상도(예: 2560×1440)가 아니라 "브라우저 콘텐츠 영역"이라
// 탭바·주소창·북마크바 높이(대략 100~150px)만큼 항상 화면 높이보다 작다. 그래서 실제로는
// 순수 16:9가 아니라 "가로는 꽉 차지만 세로는 그보다 살짝 부족한" 비율이 되고, 가로 기준으로만
// 스케일하면 디자인 캔버스가 실제 세로 여백보다 커져서 아래쪽(뒤로가기 버튼 등)이 화면 밖으로
// 잘려 나갔다.
//
// 그래서 처음엔 가로·세로 비율 중 더 작은 쪽에 맞춰 스케일해봤는데, 이번엔 반대 문제가
// 생겼다 — 세로가 기준이 되면서 가로가 화면을 다 못 채우고 좌우에 원치 않는 여백이 남았다.
// "어느 방향으로도 절대 잘리지 않으면서 동시에 화면을 항상 꽉 채운다"는 두 요구는 뷰포트
// 비율이 실제로 조금씩 다른 이상 동시에 만족할 수 없다 — 그래서 가로·세로를 서로 다른
// 기준으로 분리했다: 가로는 항상 뷰포트 폭에 꽉 맞춰 스케일(scale = 뷰포트폭/2560, 좌우
// 여백 없음)하고, 세로는 "디자인 캔버스가 몇 px이어야 하는가"를 고정값(1440)이 아니라
// "지금 실제 뷰포트 높이를 스케일로 나눈 값"으로 그때그때 역산한다 — 그러면 스케일을 다시
// 곱하는 순간 정확히 실제 뷰포트 높이로 되돌아오므로, top/bottom으로 붙인 요소들이 항상
// 화면의 진짜 위/아래 끝에 맞고(안 잘림), 가로는 항상 꽉 차서(여백 없음) 두 요구를 동시에
// 만족한다. 실제 브라우저 크롬 높이는 가로 폭과 무관하게 대체로 비슷한 절대 px라, 세 목표
// 해상도(1920×1080 / 2560×1440 / 3840×2160)에서 세로 비율은 거의 비슷하게 유지된다.
export const RYZE_DESIGN_W = 2560;
// 노트북 최소 기준 밑으로는 scale이 더 줄지 않게 하한선을 둔다 — 맥북 13인치(에어/프로)는
// 논리 해상도가 기본 1280px, "공간 늘리기" 설정에서도 1440px 정도라, 1440px을 기준으로 잡아야
// 13인치처럼 물리적으로 작은 화면에서도 글자가 충분히 커 보인다(1280 기준이었을 때 화면을
// 가득 채워도 작게 느껴진다는 피드백 반영). 이 프로젝트는 모바일을 지원하지 않으므로(1280px
// 미만은 대상 밖) 그 아래에서 글자가 계속 작아지며 가독성이 떨어지는 대신, 캔버스가 실제
// 뷰포트보다 살짝 넓어져 가로 스크롤이 생기는 쪽을 택한다 — 어차피 지원 범위 밖이라 트레이드
// 오프로 문제 되지 않는다.
export const RYZE_DESIGN_MIN_SCALE = 1440 / RYZE_DESIGN_W;
// 반대로 2560px보다 넓은 대형/울트라와이드 데스크톱 모니터에서는 디자인 원본 크기(scale 1.0 =
// 2560px 그대로) 이상으로는 더 커지지 않게 상한선을 둔다 — 그 이상 계속 키우면 큰 모니터일수록
// 글자가 과도하게 확대되어 오히려 어색해 보인다.
export const RYZE_DESIGN_MAX_SCALE = 1;

export function useRyzeDesignMetrics(enabled: boolean): { scale: number; canvasH: number } {
  const compute = () => {
    if (typeof window === 'undefined') return { scale: 1, canvasH: 1440 };
    // window.innerWidth에는 세로 스크롤바가 차지하는 트랙 폭이 포함되어 있어서(스크롤바가
    // 뜬 상태라면) 그 값을 그대로 디자인 폭 기준으로 쓰면 실제 보이는 영역(스크롤바 제외)보다
    // 콘텐츠가 그만큼(보통 15~17px) 더 넓게 그려져 가로 스크롤이 생긴다. document.documentElement
    // .clientWidth는 스크롤바를 제외한 실제 가시 영역 폭이라 이걸 기준으로 삼아야 좌우 여백
    // 없이 꽉 차면서도 가로 스크롤이 생기지 않는다.
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const scale = Math.min(RYZE_DESIGN_MAX_SCALE, Math.max(RYZE_DESIGN_MIN_SCALE, vw / RYZE_DESIGN_W));
    return { scale, canvasH: window.innerHeight / scale };
  };
  const [metrics, setMetrics] = useState(compute);
  useEffect(() => {
    if (!enabled) return;
    const update = () => setMetrics(compute());
    update();
    // 마운트 직후 한 번 더(다음 프레임에) 재측정한다 — 스크롤바를 CSS로 숨긴 뒤로, 첫 렌더
    // 시점(브라우저가 아직 이 페이지의 실제 콘텐츠 높이에 맞춰 레이아웃을 끝내기 전)에 측정한
    // clientWidth가 스크롤바가 "있었을 때" 폭(약 15px 더 좁게)으로 한 번 굳어버린 뒤, 이후엔
    // resize 이벤트가 안 일어나(스크롤바 유무 변화 자체는 resize를 발생시키지 않는다) 영영
    // 갱신되지 않아 캔버스 전체가 그만큼 좁게 그려지며 화면 좌우에 흰 여백이 고정적으로
    // 남는 버그가 있었다. requestAnimationFrame으로 레이아웃이 안정된 다음 프레임에 다시 한
    // 번 측정해 이 틀어짐을 스스로 바로잡는다.
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);
  return enabled ? metrics : { scale: 1, canvasH: typeof window !== 'undefined' ? window.innerHeight : 1440 };
}

// 위 useRyzeDesignMetrics와 짝을 이루는 래퍼 — enabled가 false면 아무 것도 감싸지 않고 children을
// 그대로 통과시켜(Planning이 아닌 챕터는 지금 코드와 100% 동일하게 렌더링), enabled가 true일
// 때만 2560×canvasH 캔버스 박스로 감싸 scale만큼 축소/확대한다. canvasH는 고정값이 아니라
// "지금 실제 뷰포트 높이를 스케일로 나눈 값"이라(위 useRyzeDesignMetrics 주석 참고), 이 박스를
// scale배 하면 가로·세로 모두 항상 실제 뷰포트 크기와 정확히 같아진다 — 그래서 아래 두
// 분기 모두 좌우 여백 계산이 필요 없다(가로가 항상 정확히 꽉 차므로).
//
// fixed=true(고정 UI: 라벨·뒤로가기·TOC·진행률 트랙)는 애초에 문서 스크롤(scrollHeight)에
// 관여하지 않는 position:fixed라 이 문제가 없다 — 캔버스 박스를 그대로 scale해서 fixed로
// 붙이기만 하면 된다(클릭 판정은 브라우저가 실제 렌더링된(=scale 적용된) 위치 기준으로 하므로
// 정확히 맞는다).
//
// fixed=false(문서 스크롤을 타는 본문 섹션들)는 다르다 — CSS transform은 "그려지는 모양"만
// 바꿀 뿐 레이아웃 크기(=부모의 scrollHeight 계산에 쓰이는 값)는 절대 줄이지 않는다는 사실을
// 처음에 놓쳐서, 실제 스크롤 가능 범위가 축소되지 않은 원본 2560-캔버스 높이 그대로 남아
// 섹션 경계가 실제 뷰포트 한 칸과 어긋나는(섹션끼리 겹쳐 보이거나 스크롤 스냅이 밀리는)
// 문제가 있었다. 그래서 바깥 박스(문서 흐름에 실제로 잡히는 크기)는 명시적으로 "측정한 원본
// 높이 × scale"(=축소된 실제 크기)로 고정해 문서에 정확히 그만큼만 반영되게 하고, 안쪽
// 박스만 원본(2560) 크기로 그린 뒤 transform으로 시각적으로 줄여서 바깥 박스 안에 정확히
// 맞춘다.
export const RyzeDesignScaleLayer: React.FC<{
  enabled: boolean;
  scale: number;
  // fixed=true일 때만 실제로 쓰인다(고정 UI 박스 자체의 높이). fixed=false(스크롤 콘텐츠)는
  // 내부 콘텐츠 높이를 스스로 측정하므로 필요 없다 — 그런 곳에서는 그냥 생략하면 된다.
  canvasH?: number;
  fixed?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ enabled, scale, canvasH = 0, fixed = false, className = '', children }) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);

  React.useLayoutEffect(() => {
    if (!enabled || fixed) return;
    const measure = () => {
      if (innerRef.current) setContentH(innerRef.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [enabled, fixed]);

  if (!enabled) return <>{children}</>;

  if (fixed) {
    // pointer-events-none가 핵심이다 — 이 오버레이는 항상 뷰포트 전체를 덮고 있어서, 이게
    // 없으면 라벨/버튼/TOC처럼 실제로 그려진 곳이 아닌 "빈 공간"까지도 이 오버레이가 클릭을
    // 그대로 먹어버려 그 아래(스크롤되는 사진·다음 이미지 버튼 등)로 클릭이 전달되지 않는다.
    // 실제 눌러야 하는 자식들(라벨/뒤로가기/TOC)에는 원래 코드에 그대로 있던
    // pointer-events-auto가 각자 붙어 있어 정상적으로 클릭된다.
    return (
      <div
        className={`fixed top-0 left-0 z-20 pointer-events-none ${className}`}
        style={{
          width: RYZE_DESIGN_W,
          height: canvasH,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    );
  }

  // scale이 MIN/MAX 경계에 걸리면(뷰포트가 1440px보다 좁거나 2560px보다 넓으면) 이 박스의
  // 너비(RYZE_DESIGN_W * scale)가 실제 뷰포트 폭과 정확히 같지 않다. 이 div는 부모의
  // flex-col(align-items 기본값 stretch)에서 명시적 width가 있으면 그대로 그 너비만큼만
  // 차지하고 cross-axis 시작(왼쪽)에 붙는다 — 그래서 좁은/넓은 화면에서는 캔버스 전체(=이
  // 안의 모든 콘텐츠)가 왼쪽으로 쏠려 보였다. margin: 0 auto로 중앙 정렬을 시도했었는데,
  // MIN_SCALE 경계(뷰포트 < 1440px)에서는 박스 너비(1440px 고정)가 오히려 뷰포트보다 넓어져
  // "남는 공간"이 음수가 되고, 이때 브라우저는 auto 마진을 0으로 취급해버려(CSS 스펙상 음수
  // auto margin은 적용되지 않음) 다시 왼쪽에 붙고 오른쪽으로만 넘치는 문제가 있었다(1366/1440
  // 같은 흔한 노트북 해상도에서 실제로 발생). left:50% + translateX(-50%)는 박스가 부모보다
  // 넓든 좁든 항상 자기 너비의 절반만큼 당겨 중앙에 맞추므로 두 경우 모두 안전하다.
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)',
        width: RYZE_DESIGN_W * scale,
        height: contentH ? contentH * scale : undefined,
        overflow: 'hidden',
      }}
    >
      <div ref={innerRef} style={{ width: RYZE_DESIGN_W, transformOrigin: 'top left', transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────

// RYZE 프로젝트 진입 인트로("LET'S SEE THE WORK")를 재생시키는 함수를 하위 트리에 공유하는
// 컨텍스트 — RyzeProjectsSection(카드 클릭 시 재생 트리거)과 AppRoutes(Provider) 양쪽에서
// 쓰여서 여기 둔다.
export const RyzeWorkIntroContext = React.createContext<(go: () => void) => void>(() => {});

// ── RYZE BGM 멀티트랙 플레이어 ────────────────────────────────────────────
// AppRoutes(useRyzeBgm), RyzeMusicToggle(재생/정지·곡 선택 UI), NewProjectPlaceholder(히어로
// 재생 완료 표시) 여러 곳에서 공유해야 해서 여기 둔다. 트랙은 각각 loop=true라, 사용자가 직접
// 다른 곡을 고르지 않는 한 지금 재생 중인 곡이 계속 반복된다.
// gain — 곡마다 원본 음원의 마스터링 음량이 크게 달라서(실측 RMS: SHOWROOM ≈ -42dB, 피크 -27dB /
// RUNWAY ≈ -7.7dB, 피크 0dB → 약 34dB 차이) 둘 다 audio.volume=1로 틀면 RUNWAY가 훨씬 크게
// 들린다. SHOWROOM을 기준(1)으로, RUNWAY는 그와 같은 체감 음량이 되도록 10^(-34.4/20)≈0.02배로
// 낮췄는데, 실제로 들어보니 조금 작게 들려 0.035배(≈ +5dB)로 올렸다. 모든 페이드인/아웃의
// "최대 음량"이 이 gain이다.
export const RYZE_BGM_TRACKS = [
  { label: '#1) RYZE SHOWROOM', src: 'RYZE/RYZE BGM.mp3', gain: 1 },
  { label: '#2) RYZE RUNWAY', src: 'RYZE/RYZE Runway.mp3', gain: 0.058 },
] as const;
// 곡을 바꾸거나 재생/정지 토글할 때의 페이드 시간 — 뚝 끊기지 않고 음량이 부드럽게
// 빠지고(out) 들어오게(in) 한다. RYZE 영역을 완전히 벗어날 때는 기존대로 1초.
const RYZE_BGM_FADE_MS = 900;
const RYZE_BGM_LEAVE_FADE_MS = 1000;
// 곡을 바꿀 때 이전 곡이 완전히 사라진 뒤 새 곡이 들어오기 전까지의 짧은 무음 간격 —
// 크로스페이드로 바로 겹쳐 넣으면 곡이 "확" 바뀌는 느낌이라 살짝 숨을 쉬게 한다.
const RYZE_BGM_SWITCH_GAP_MS = 350;
let ryzeSwitchTimer: number | undefined;
const cancelRyzeSwitch = () => {
  if (ryzeSwitchTimer) { window.clearTimeout(ryzeSwitchTimer); ryzeSwitchTimer = undefined; }
};
// 소리 나는 영상(예: Content Design의 8-1)이 재생되는 동안 배경음악을 잠시 내려두었는지(ducked),
// 그리고 지금 RYZE 영역 안인지 — 영상이 화면을 벗어났을 때 "내가 내려둔 배경음악만" 되살리고,
// RYZE 영역을 이미 떠났다면 되살리지 않기 위한 플래그.
let ryzeDucked = false;
let ryzeInArea = false;

// 오디오뿐 아니라 소리 나는 영상(<video>)도 같은 페이드 함수를 쓰므로 HTMLMediaElement 기준.
export type RyzeAudio = HTMLMediaElement & { _fadeTimer?: number };
const ryzeAudios: (RyzeAudio | null)[] = RYZE_BGM_TRACKS.map(() => null);
const getRyzeAudio = (i: number): RyzeAudio => {
  let audio = ryzeAudios[i];
  if (!audio) {
    audio = new Audio(getImageUrl(RYZE_BGM_TRACKS[i].src)) as RyzeAudio;
    audio.loop = true;
    audio.preload = 'auto';
    ryzeAudios[i] = audio;
  }
  return audio;
};

// 현재 선택된 곡(track)과 "사용자 의도상 재생 중인지"(playing) — 곡 전환/정지에 페이드가
// 걸려 있어 audio.paused만으론 UI 상태를 정확히 못 정하므로, 이 값이 UI의 단일 출처다.
// useSyncExternalStore로 구독해 토글 UI(막대 애니메이션)와 곡 목록 하이라이트가 따라간다.
let ryzeBgmState: { track: number; playing: boolean } = { track: 0, playing: false };
const ryzeBgmListeners = new Set<() => void>();
const setRyzeBgmState = (next: Partial<typeof ryzeBgmState>) => {
  ryzeBgmState = { ...ryzeBgmState, ...next };
  ryzeBgmListeners.forEach((l) => l());
};
export function useRyzeBgmState() {
  return useSyncExternalStore(
    (listener) => {
      ryzeBgmListeners.add(listener);
      return () => ryzeBgmListeners.delete(listener);
    },
    () => ryzeBgmState,
  );
}

// 음량을 target까지 ms 동안 부드럽게(smoothstep) 옮긴다. 같은 audio에 새 페이드를 걸면 진행
// 중이던 페이드는 onDone 없이 취소된다 — 예: 정지 페이드아웃 도중 다시 재생하면 "pause()"가
// 실행되지 않는다.
export const fadeRyzeAudio = (audio: RyzeAudio, target: number, ms: number, onDone?: () => void) => {
  if (audio._fadeTimer) { window.clearInterval(audio._fadeTimer); audio._fadeTimer = undefined; }
  const start = audio.volume;
  if (ms <= 0 || start === target) { audio.volume = target; onDone?.(); return; }
  const t0 = performance.now();
  audio._fadeTimer = window.setInterval(() => {
    const k = Math.min((performance.now() - t0) / ms, 1);
    const eased = k * k * (3 - 2 * k);
    audio.volume = Math.min(1, Math.max(0, start + (target - start) * eased));
    if (k >= 1) {
      window.clearInterval(audio._fadeTimer);
      audio._fadeTimer = undefined;
      onDone?.();
    }
  }, 30);
};
const stopRyzeAudio = (audio: RyzeAudio) => {
  if (audio._fadeTimer) { window.clearInterval(audio._fadeTimer); audio._fadeTimer = undefined; }
  audio.pause();
  audio.currentTime = 0;
};
// 곡 i를 (멈춰 있었다면 음량 0에서) 페이드인으로 재생한다. 브라우저가 자동재생을 막으면
// play()가 거부되므로 그 경우엔 playing을 다시 false로 되돌려 UI가 거짓 재생 상태가 되지 않게 한다.
const playRyzeTrackWithFade = (i: number) => {
  const audio = getRyzeAudio(i);
  if (audio.paused) audio.volume = 0;
  audio.muted = false;
  audio.play().catch(() => {
    if (audio._fadeTimer) { window.clearInterval(audio._fadeTimer); audio._fadeTimer = undefined; }
    if (ryzeBgmState.track === i) setRyzeBgmState({ playing: false });
  });
  fadeRyzeAudio(audio, RYZE_BGM_TRACKS[i].gain, RYZE_BGM_FADE_MS);
};

// 재생/정지 토글 — 둘 다 페이드로 처리해 뚝 끊기지 않게 한다.
export const toggleRyzeBgm = () => {
  cancelRyzeSwitch();
  ryzeDucked = false; // 사용자가 직접 켜고 끄면 그 의도가 우선 — 영상 종료 시 자동 재개하지 않는다.
  const { track, playing } = ryzeBgmState;
  if (playing) {
    setRyzeBgmState({ playing: false });
    const audio = ryzeAudios[track];
    if (audio) fadeRyzeAudio(audio, 0, RYZE_BGM_FADE_MS, () => audio.pause());
  } else {
    setRyzeBgmState({ playing: true });
    playRyzeTrackWithFade(track);
  }
};
// 곡 선택 — 재생 중이던 곡은 페이드아웃, 새 곡은 처음부터 페이드인(크로스페이드). 정지 상태에서
// 곡을 고르면 이전 곡 페이드 없이 새 곡만 페이드인으로 들어온다. 이미 선택된 곡이면 멈춰 있을
// 때만 다시 재생한다.
export const selectRyzeBgmTrack = (i: number) => {
  if (i === ryzeBgmState.track) {
    if (!ryzeBgmState.playing) toggleRyzeBgm();
    return;
  }
  cancelRyzeSwitch();
  ryzeDucked = false;
  const prev = ryzeAudios[ryzeBgmState.track];
  const prevAudible = !!prev && (!prev.paused || !!prev._fadeTimer);
  if (prev && prevAudible) {
    fadeRyzeAudio(prev, 0, RYZE_BGM_FADE_MS, () => { prev.pause(); prev.currentTime = 0; });
  }
  setRyzeBgmState({ track: i, playing: true });
  // 이전 곡이 소리 나고 있었다면 그 페이드아웃 + 짧은 간격이 끝난 뒤에 새 곡을 시작한다.
  if (prevAudible) {
    ryzeSwitchTimer = window.setTimeout(() => {
      ryzeSwitchTimer = undefined;
      if (ryzeBgmState.track !== i || !ryzeBgmState.playing) return;
      const n = getRyzeAudio(i);
      if (n.paused) n.currentTime = 0;
      playRyzeTrackWithFade(i);
    }, RYZE_BGM_FADE_MS + RYZE_BGM_SWITCH_GAP_MS);
    return;
  }
  // 아직 페이드아웃 중이라 소리가 나고 있는 곡을 곧바로 다시 고른 경우엔 처음으로 되감지
  // 않고(뚝 튀는 소리 방지) 그 자리에서 음량만 다시 올린다.
  const next = getRyzeAudio(i);
  if (next.paused) next.currentTime = 0;
  playRyzeTrackWithFade(i);
};

// 소리 나는 영상이 재생되기 시작하면 배경음악을 페이드아웃으로 멈추고(재생 위치는 그대로),
// 영상이 화면을 벗어나면 멈춘 지점부터 페이드인으로 다시 이어 재생한다. 배경음악이 원래 꺼져 있었다면
// (사용자가 정지해 둔 상태) 아무것도 하지 않는다.
export const duckRyzeBgmForVideo = () => {
  if (!ryzeBgmState.playing || ryzeDucked) return;
  ryzeDucked = true;
  cancelRyzeSwitch();
  const audio = ryzeAudios[ryzeBgmState.track];
  setRyzeBgmState({ playing: false });
  if (audio) fadeRyzeAudio(audio, 0, RYZE_BGM_FADE_MS, () => audio.pause());
};
export const unduckRyzeBgm = () => {
  if (!ryzeDucked) return;
  ryzeDucked = false;
  if (!ryzeInArea || ryzeBgmState.playing) return;
  setRyzeBgmState({ playing: true });
  playRyzeTrackWithFade(ryzeBgmState.track);
};

// 히어로 1회 재생 플래그
// 히어로 스플래시가 "이번 RYZE 방문"에서 이미 재생됐는지 — RYZE 영역(pathname 기준) 안에서
// project-new ↔ projects/:n 사이를 오가는 동안엔 true로 유지되어 히어로가 다시 재생되지 않고,
// RYZE 영역을 완전히 벗어나면(예: 홈으로 이동) false로 리셋되어 다음 재진입 때 다시 재생된다.
let ryzeHeroPlayed = false;
export const getRyzeHeroPlayed = () => ryzeHeroPlayed;
// 다른 모듈(NewProjectPlaceholder)에서 이 값을 "쓸" 때 쓰는 setter — import된 let 바인딩은
// 외부에서 직접 대입할 수 없어(읽기 전용 라이브 바인딩) 함수로 감싼다.
export const markRyzeHeroPlayed = () => {
  ryzeHeroPlayed = true;
};

// RYZE 관련 페이지("/project-new"와 그 안의 카드 상세 "/projects/:n") 사이를 이동하는
// 동안에는 BGM이 끊기지 않아야 하므로, 개별 페이지 컴포넌트가 아니라 라우트 상위(AppRoutes)에서
// pathname을 관찰해 "RYZE 프로젝트 영역에 있는지"가 바뀔 때만 재생/정지한다.
export function useRyzeBgm(pathname: string) {
  const isRyzePage = pathname === '/project-new' || pathname.startsWith('/projects/');
  // 브랜드 & 비주얼 챕터 화면에서만 #2 RUNWAY를 쓴다 — 그 화면에 들어가면 RUNWAY로, 나오면 다시
  // #1 SHOWROOM으로 돌아간다(그 외 화면의 기본 곡은 SHOWROOM).
  const isBrandChapter = /^\/projects\/[^/]+\/brand-design$/.test(pathname);
  const sectionTrack = isBrandChapter ? 1 : 0;
  const wasRyzePage = useRef(false);
  // 탭이 숨겨지기 직전에 실제로 재생 중이었는지 — 사용자가 토글 버튼으로 직접 정지해둔 상태라면
  // 탭이 다시 보여도 멋대로 재생을 재개하지 않기 위해 필요하다.
  const wasPlayingBeforeHide = useRef(false);

  useEffect(() => {
    if (isRyzePage && !wasRyzePage.current) {
      // RYZE 영역 진입 — 모든 곡을 처음 상태로 되돌리고 #1 곡을 처음부터 재생 시작
      ryzeInArea = true;
      ryzeDucked = false;
      ryzeAudios.forEach((a) => { if (a) stopRyzeAudio(a); });
      setRyzeBgmState({ track: sectionTrack, playing: false });
      const audio = getRyzeAudio(sectionTrack);
      audio.volume = RYZE_BGM_TRACKS[sectionTrack].gain;
      audio.muted = false;
      if (!document.hidden) {
        audio.play().then(() => setRyzeBgmState({ playing: true })).catch(() => {});
      }
    } else if (!isRyzePage && wasRyzePage.current) {
      // RYZE 영역 완전 이탈 — 다음 재진입 때 히어로가 다시 재생되도록 리셋
      ryzeHeroPlayed = false;
    }
    if (!isRyzePage && wasRyzePage.current) {
      // RYZE 영역 이탈 — 뚝 끊지 않고 ~1초 페이드아웃 후 정지(재생 중이던 곡 전부)
      ryzeInArea = false;
      ryzeDucked = false;
      setRyzeBgmState({ playing: false });
      ryzeAudios.forEach((a) => {
        if (a && (!a.paused || a._fadeTimer)) {
          fadeRyzeAudio(a, 0, RYZE_BGM_LEAVE_FADE_MS, () => { a.pause(); a.currentTime = 0; });
        }
      });
    }
    wasRyzePage.current = isRyzePage;
  }, [isRyzePage]);

  // RYZE 영역 안에서 챕터 화면이 바뀔 때 곡을 맞춘다. 재생 중이면 크로스페이드로 전환하고,
  // 사용자가 정지해 둔 상태면 소리는 내지 않은 채 선택된 곡만 바꿔 둔다(다시 재생하면 그 곡).
  // 영역 진입 시점의 곡은 위 effect가 이미 sectionTrack으로 맞추므로 그땐 아무것도 안 한다.
  useEffect(() => {
    if (!isRyzePage || ryzeBgmState.track === sectionTrack) return;
    if (ryzeBgmState.playing) selectRyzeBgmTrack(sectionTrack);
    else setRyzeBgmState({ track: sectionTrack });
  }, [isRyzePage, sectionTrack]);

  // 다른 탭/창으로 이탈하면 완전히 일시정지, 돌아오면 이어서 재생.
  // 예전엔 muted만 토글했는데, 백그라운드 상태에서도 오디오 디코딩·루프 재시작은 계속 진행되다 보니
  // (특히 루프 이음매에서) 브라우저/OS에 따라 muted가 반영되는 타이밍이 살짝 어긋나며 "뚝뚝"거리는
  // 클릭음이 새어나오는 경우가 있었다. 아예 pause()로 디코딩 자체를 멈추면 이 문제가 원천적으로
  // 사라진다 — 였는데, 창을 "최소화"할 때는 Windows/Chrome 조합에 따라 최소화 애니메이션 도중
  // visibilitychange가 hidden→visible→hidden처럼 순간적으로 여러 번(플리커) 발생하는 경우가
  // 있고, 그때마다 곧바로 pause/play를 그대로 따라가다 보니 아주 짧게 재생됐다 멈추는 게
  // 반복되며 오히려 "뚝뚝"거리는 소리로 들렸다. 실제 상태가 바뀐 뒤 200ms 동안 더 이상 바뀌지
  // 않을 때만(디바운스) 적용해 이 플리커를 걸러낸다.
  useEffect(() => {
    let debounceTimer: number | undefined;
    const apply = () => {
      if (document.hidden) {
        wasPlayingBeforeHide.current = ryzeBgmState.playing;
        // 진행 중이던 페이드도 같이 취소하고 전부 즉시 멈춘다(백그라운드에선 페이드가 의미 없다).
        ryzeAudios.forEach((a) => {
          if (!a) return;
          if (a._fadeTimer) { window.clearInterval(a._fadeTimer); a._fadeTimer = undefined; }
          a.pause();
        });
      } else if (wasRyzePage.current && wasPlayingBeforeHide.current) {
        // 숨겨지기 직전 사용자 의도상 재생 중이었고, 현재 RYZE 영역에 있을 때만(영역을 이미
        // 떠났다면 wasRyzePage가 false라 재개하지 않는다) 지금 선택된 곡을 이어서 재생한다 —
        // 사용자가 직접 정지해둔 상태는 건드리지 않는다.
        playRyzeTrackWithFade(ryzeBgmState.track);
      }
    };
    const onVisibility = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(apply, 200);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (debounceTimer) window.clearTimeout(debounceTimer);
    };
  }, []);
}

// RYZE BGM 재생/정지 토글 버튼 — skiper-ui.com/v1/skiper25 "Music Toggle Button"의
// 마이크로 인터랙션(호버/탭 시 패딩이 스프링으로 늘어나는 알약 모양 버튼, 재생 중엔
// 100ms마다 무작위 높이로 흔들리는 5개의 웨이브폼 바, 정지 시 모든 바가 최소 높이로
// 가라앉는 스프링 애니메이션)을 그대로 재현한다. 다만 자체 오디오를 새로 재생하는 대신
// 이미 떠 있는 RYZE BGM 싱글턴(ryzeBgm)의 재생/일시정지를 그대로 토글한다.
// 채워진 알약(pill) 배경 자체가 "PLANNING"/"Back to Work" 텍스트와 같은 방식으로 반전된다 —
// 이 토글이 놓인 화면 모서리가 어두운 배경이면 onDarkBg=true를 넘겨, 알약은 밝은색(#F9FAFB)+
// 바는 어두운색(#0A0A0A)으로, 아니면(밝은 배경) 알약은 어두운색(#0A0A0A)+바는 밝은색(#F9FAFB)으로
// 자동으로 대비를 맞춘다(둘 다 항상 서로 반대색이라 대비가 깨지지 않는다).
export const RyzeMusicToggle: React.FC<{ onDarkBg?: boolean }> = ({ onDarkBg = false }) => {
  const bgColor = onDarkBg ? '#F9FAFB' : '#0A0A0A';
  const color = onDarkBg ? '#0A0A0A' : '#F9FAFB';
  const BARS = 5;
  const getRandomHeights = () => Array.from({ length: BARS }, () => Math.random() * 0.8 + 0.2);
  const [heights, setHeights] = useState<number[]>(() => Array(BARS).fill(0.1));
  // 재생 상태는 BGM 플레이어의 공용 상태(useRyzeBgmState)를 그대로 구독한다 — 곡 전환/정지에
  // 페이드가 걸려 있어 audio.paused만으론 막대 애니메이션 시점을 정확히 못 정하기 때문.
  const { playing: isPlaying } = useRyzeBgmState();

  useEffect(() => {
    if (isPlaying) {
      const waveformIntervalId = window.setInterval(() => setHeights(getRandomHeights()), 100);
      return () => window.clearInterval(waveformIntervalId);
    }
    setHeights(Array(BARS).fill(0.1));
  }, [isPlaying]);

  return (
    <motion.div
      onClick={toggleRyzeBgm}
      initial={{ padding: '11px 11px ' }}
      whileHover={{ padding: '15px 18px ' }}
      whileTap={{ padding: '15px 18px ' }}
      transition={{ duration: 1, bounce: 0.6, type: 'spring' }}
      className="cursor-pointer rounded-full transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
      aria-label={isPlaying ? 'Pause music' : 'Play music'}
      role="button"
    >
      <motion.div
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(4px)' }}
        transition={{ type: 'spring', bounce: 0.35 }}
        className="flex h-[15px] w-full items-center gap-1 rounded-full"
      >
        {heights.map((height, index) => (
          <motion.div
            key={index}
            className="rounded-full transition-colors duration-300"
            style={{ backgroundColor: color, width: onDarkBg ? 1.6 : 1 }}
            initial={{ height: 1 }}
            animate={{ height: Math.max(3, height * 12) }}
            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

// 메인 홈(RyzeProjectsSection)에서만 있던 "호버하면 왼쪽에 곡명이 뜨는" 기능 — 다른 RYZE
// 화면(Overview/Planning)의 토글에도 똑같이 필요해서 여기로 옮겨 공유한다. 라벨 색은 토글의
// 알약(pill) 색과 같은 방향으로(onDarkBg에 따라 #0A0A0A/#F9FAFB) 반전해, 배경이 밝든
// 어둡든 항상 또렷이 읽히게 한다. 바깥에서 굳이 64×56 박스로 다시 감쌀 필요 없도록 그 박스도
// 내부에 포함한다 — 호출부는 위치(fixed/absolute + top/right)만 잡아주면 된다.
//
// 곡 목록은 "스크롤 프리뷰(scroll peek)" 기법의 세로 캐러셀이다 — 지금 재생 중인 곡이 토글
// 바로 옆 자리에 온전히 놓이고, 그 위/아래 이웃 곡은 윗/아랫부분만 살짝 걸쳐 보이게(위아래로
// 페이드되는 마스크) 잘라 "위/아래에 더 있다"는 걸 암시한다(+ 까딱이는 화살표 = scroll signal).
// 곡을 고르면 목록 전체가 위/아래로 슬라이드해, 고른 곡은 토글 옆 자리로 들어오고 이전에
// 재생하던 곡은 그 위(또는 아래)로 밀려나 걸쳐 보이는 상태가 된다. 보이는 곡은 눌러서 재생한다.
// 호버 영역이 끊기지 않게 목록은 토글 박스에 바로 붙여(오른쪽 padding 12px) 둔다.
const RYZE_BGM_ROW_H = 22;
// 이웃 곡이 걸쳐 보이는 높이 = PEEK_H - ROW_GAP. 예전엔 16-6=10px뿐이라 글자(약 12px)가 절반도
// 안 보여 읽히지 않았다 — 지금은 20-3=17px라 글자 전체가 보이고 아래쪽만 살짝 페이드된다.
const RYZE_BGM_ROW_GAP = 8;
const RYZE_BGM_PEEK_H = 25;
// 창(window) 높이 = 위 peek + 활성 곡 행 + 아래 peek. 활성 곡 행의 세로 중심이 토글(64×56 박스의
// 중심 y=28)과 같은 높이에 오도록 창의 top을 잡는다.
const RYZE_BGM_PANEL_H = RYZE_BGM_PEEK_H + RYZE_BGM_ROW_H + RYZE_BGM_PEEK_H;
const RYZE_BGM_PANEL_TOP = 28 - RYZE_BGM_PEEK_H - RYZE_BGM_ROW_H / 2;
// 마스크로 사라지는 구간은 위·아래 각 4px로 짧게 — 걸쳐 보이는 이웃 곡 글자가 읽히게 한다.
const RYZE_BGM_PEEK_MASK = 'linear-gradient(to bottom, transparent 0, #000 4px, #000 calc(100% - 4px), transparent 100%)';

const RyzeBgmTrackList: React.FC<{ inkColor: string }> = ({ inkColor }) => {
  const { track } = useRyzeBgmState();
  const last = RYZE_BGM_TRACKS.length - 1;
  // focus = 지금 토글 옆 자리에 "보고 있는" 곡. 재생 중인 곡(track)과는 별개다 — 마우스 휠로
  // 목록을 위아래로 넘겨 보다가(focus만 이동) 마음에 드는 곡을 눌러야 그 곡이 재생된다. 처음엔
  // 재생 중인 곡에서 시작하고, 곡이 실제로 바뀌면(클릭 등) 그 곡으로 따라간다.
  const [focus, setFocus] = useState(track);
  useEffect(() => setFocus(track), [track]);
  // 곡 순서는 고정(#1, #2)이고, focus 곡이 창의 가운데 슬롯(위 peek 높이만큼 내려온 자리)에
  // 오도록 줄 전체를 위/아래로 슬라이드한다 — 이전 곡은 위(또는 아래)로 밀려나 걸쳐 보이는
  // 상태로 남고, 고른 곡이 토글 옆 자리로 올라온다.
  const stripY = RYZE_BGM_PEEK_H - focus * (RYZE_BGM_ROW_H + RYZE_BGM_ROW_GAP);

  // 마우스 휠 — 목록 위에서 굴리면 한 번에 한 곡씩 넘긴다. React의 onWheel은 passive라
  // preventDefault가 안 먹어서(페이지 스냅 스크롤/일반 스크롤로 새버림) 네이티브 리스너를
  // passive:false로 직접 달고, stopPropagation으로 window의 스냅 스크롤 핸들러까지 막는다.
  // 휠은 짧은 시간에 여러 번 발생하므로 220ms 쿨다운으로 한 번의 굴림이 한 곡만 넘기게 한다.
  const windowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;
    let lastStep = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      if (Math.abs(e.deltaY) < 4 || now - lastStep < 220) return;
      lastStep = now;
      setFocus((f) => Math.min(last, Math.max(0, f + (e.deltaY > 0 ? 1 : -1))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [last]);

  return (
    <div className="relative">
      <div
        ref={windowRef}
        style={{ height: RYZE_BGM_PANEL_H, overflow: 'hidden', maskImage: RYZE_BGM_PEEK_MASK, WebkitMaskImage: RYZE_BGM_PEEK_MASK }}
      >
        <motion.div
          className="flex flex-col"
          style={{ gap: RYZE_BGM_ROW_GAP }}
          initial={false}
          animate={{ y: stripY }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          {RYZE_BGM_TRACKS.map((t, i) => (
            <motion.button
              key={t.label}
              type="button"
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              onClick={() => {
                selectRyzeBgmTrack(i);
                setFocus(i);
              }}
              className="relative text-right text-[10px] md:text-xs uppercase tracking-[0.08em] font-semibold whitespace-nowrap cursor-pointer transition-opacity duration-300 hover:!opacity-70"
              style={{
                height: RYZE_BGM_ROW_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                transformOrigin: 'center center',
                color: inkColor,
                // 재생 중인 곡만 또렷하게, 나머지는 옅게(예전 0.75 → 0.38)
                opacity: i === track ? 1 : 0.38,
              }}
            >
              {/* 재생 중인 곡 표시 — 휠로 다른 곡을 넘겨 보는 중에도 어느 곡이 재생 중인지 알 수 있게 */}
              {i === track && (
                <motion.span
                  className="absolute rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  style={{ right: -10, top: '50%', width: 4, height: 4, marginTop: -2, backgroundColor: inkColor }}
                />
              )}
              {t.label}
            </motion.button>
          ))}
        </motion.div>
      </div>
      {/* scroll signal — 위/아래에 더 있는 곡이 있을 때만, 걸쳐 보이는 글자와 겹치지 않게 창 바깥
          (위는 -10px, 아래는 +10px)에 까딱이는 화살표를 둔다. */}
      <AnimatePresence>
        {focus < last && (
          <div key="down" className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ top: RYZE_BGM_PANEL_H + 10, color: inkColor }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6, y: [0, 3, 0] }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.2 }, y: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } }}
            >
              <ChevronDown size={12} strokeWidth={2.5} />
            </motion.div>
          </div>
        )}
        {focus > 0 && (
          <div key="up" className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ top: -22, color: inkColor }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6, y: [0, -3, 0] }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.2 }, y: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } }}
            >
              <ChevronUp size={12} strokeWidth={2.5} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const RyzeMusicToggleWithLabel: React.FC<{ onDarkBg?: boolean }> = ({ onDarkBg = false }) => {
  const [hovered, setHovered] = useState(false);
  const inkColor = onDarkBg ? '#F9FAFB' : '#0A0A0A';
  return (
    // select-none: 곡명/토글은 일반 텍스트라 클릭하면 브라우저가 그 자리에 선택(캐럿) 위치를 만들어
    // 깜빡이는 커서가 뜬다 — 선택 자체를 막아 없앤다.
    <div className="relative select-none" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tracks"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="absolute"
            style={{ right: 64, top: RYZE_BGM_PANEL_TOP, paddingRight: 12 }}
          >
            <RyzeBgmTrackList inkColor={inkColor} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-center" style={{ width: 64, height: 56 }}>
        <RyzeMusicToggle onDarkBg={onDarkBg} />
      </div>
    </div>
  );
};
