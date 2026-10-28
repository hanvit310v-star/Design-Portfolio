# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 가장 먼저 참고하는 문서다. 작업을 시작하기 전에 이 문서를 읽고, 아래 구조/패턴을 따라서 진행한다.

## 작업 범위 규칙 (토큰 절약)

사용자가 특정 파일·섹션·기능(예: "라이즈 프로젝트만", "Planning 챕터만", "카드 그리드만")을 지목해 작업을 지시하면, **그와 직접 관련된 파일만 읽고 수정한다.** 예:
- "라이즈 프로젝트" → `src/ryze/*`만. `src/App.tsx`, `src/data/`, `src/components/` 등 다른 프로젝트 파일은 열지 않는다.
- "Planning 챕터만" → `src/ryze/RyzeWorkChapterDetail.tsx`만. `RyzeOverview.tsx`/`RyzeProjectsSection.tsx`는 그 챕터가 실제로 참조하는 공유 심볼(`shared.tsx`)을 확인할 때만 최소한으로 연다.

관련성이 불확실한 다른 파일을 열어야 할 것 같으면(예: 옮기려는 상수를 다른 파일이 참조하고 있는지 확인해야 할 때) 먼저 사용자에게 이유를 밝히고 확인받는다 — 그냥 "안전하게 넓게 훑어보기" 위해 조용히 범위를 넓히지 않는다. 이 규칙은 매번 사용자가 반복해서 말하지 않아도 기본으로 적용된다.

## 위치/수치 변경 작업 결과 보고 규칙

크기·좌표·간격·배율 등 **위치나 수치를 조정하는 작업**(스케일 값, top/left, 폭/높이, 여백, 폰트 크기 등)을 했을 때는, 결과 보고에 항상 **변경 전 → 변경 후 값을 간단히** 적는다(예: "`JOURNEY2_GROUP_SCALE` 1 → 0.85", "로고 width 480px → 248px"). 코드가 어디를 왜 고쳤는지 설명하는 산문만으로 대체하지 않는다 — 값 자체를 짧게 나열해서 사용자가 스캔만으로 뭐가 얼마나 바뀌었는지 바로 확인할 수 있게 한다.

## 프로젝트 개요

React 19 + Vite + Tailwind CSS 4 기반 개인 포트폴리오 사이트("Design Archive"). 라우팅은 `react-router-dom`(HashRouter), 애니메이션은 `motion`(Framer Motion 후신), 툴팁 등 플로팅 UI는 `@floating-ui/react`, 아이콘은 `lucide-react`를 쓴다.

```bash
npm run dev     # 개발 서버 (포트 3000, 이 harness에서는 launch.json이 3003으로 띄움)
npm run build   # 프로덕션 빌드
npm run lint    # tsc --noEmit (타입 체크만, ESLint 아님)
```

## 폴더 구조

```
src/
  App.tsx                 — 라우팅 셸 + 일반(비-RYZE) 포트폴리오 페이지들
  index.css                — 폰트 @font-face + 전역 스타일
  main.tsx                 — 엔트리포인트
  components/
    TermTooltip.tsx         — 호버 설명 툴팁 (프로젝트 데이터 안에서 재사용)
    UnicornBackground.tsx   — 다른 프로젝트 상세 페이지용 WebGL 배경
  data/
    projects.tsx            — PROJECTS 배열, Project 타입, TOC_KO(목차 한글 라벨)
  ryze/                     — RYZE 케이스 스터디 전용 (아래 "RYZE 케이스 스터디" 참고)
    shared.tsx
    RyzeHero.tsx
    RyzeWorkIntroOverlay.tsx
    RyzeProjectsSection.tsx
    RyzeOverview.tsx
    RyzeWorkChapterDetail.tsx
```

`App.tsx`에 남아있는 것: 라우팅(`AppRoutes`/`App`), 일반 프로젝트 상세(`ProjectDetail` + `PortfolioImages`/`CurtainTransition`/`ScrollToTopButton`/`isPortfolioInView`), 홈(`Home` + `BadgeSection`/`ScrollRestorer`), RYZE 진입점(`NewProjectPlaceholder`, RYZE 컴포넌트들을 조립만 함).

## RYZE 케이스 스터디 — 파일 위치

RYZE는 사이트에서 가장 크고 복잡한 케이스 스터디라 자체 폴더(`src/ryze/`)로 분리되어 있다. 라우트별 대응:

| 라우트 | 담당 파일 | 내용 |
|---|---|---|
| `/project-new` | `App.tsx`의 `NewProjectPlaceholder` → `RyzeHero.tsx` + `RyzeProjectsSection.tsx` | 히어로 캔버스 애니메이션 → 도어 리빌 + 카드 그리드 |
| 카드 클릭 시 오버레이 | `RyzeWorkIntroOverlay.tsx` | "LET'S SEE THE WORK" 텍스트 롤콜 + 엘리베이터 문 열림 |
| `/projects/2` | `RyzeOverview.tsx`의 `RyzeProjectDetail` | 엘리베이터 화면(Work 챕터 목록) |
| `/projects/:n` | `RyzeOverview.tsx`의 `RyzeOverviewHero`/`RyzeOverviewIntro` | Overview 스크롤 히어로 + 인트로 페이지 |
| `/projects/2/:chapter` (예: planning) | `RyzeWorkChapterDetail.tsx` | Planning 챕터 7화면(문제정의 5장 + 페르소나 + 저니맵), 차트 3종, 페르소나 콜라주 |

`shared.tsx`는 위 파일들이 공통으로 쓰는 것만 모아둔 곳이다 — 색상 토큰(`RYZE_FONT`/`RYZE_BG`/`RYZE_INK`), 이미지 경로 헬퍼(`getImageUrl`), 해상도 독립 스케일 레이어(`useRyzeDesignMetrics`/`RyzeDesignScaleLayer`), BGM 싱글턴(`useRyzeBgm`/`RyzeMusicToggle`), 인트로 재생 컨텍스트(`RyzeWorkIntroContext`). **새 RYZE 화면을 추가할 때 다른 RYZE 파일과 공유해야 하는 것이 생기면 여기로 옮긴다** — `App.tsx`나 다른 `ryze/*.tsx` 파일에서 직접 가져오면 순환 참조(circular import)가 난다.

## 자주 쓰는 컴포넌트 패턴

- **`getImageUrl(path)`** — `public/` 밑 이미지는 항상 이 헬퍼로 감싸서 참조한다(BASE_URL 처리).
- **`rpx()` 디자인 캔버스 스케일** (`RyzeWorkChapterDetail.tsx` 안에 정의) — 피그마 1451px 프레임 좌표를 그대로 쓰되 `rpx(n) = n * 2560/1451`로 변환해 2560px 디자인 캔버스에 맞춘다. Planning 챕터의 모든 절대좌표는 이 방식.
- **`RyzeDesignScaleLayer`** — 2560px 고정 캔버스를 `transform: scale()`로 실제 뷰포트에 맞게 축소/확대. 해상도가 달라져도 레이아웃 비율이 깨지지 않게 하는 핵심 장치. Planning 화면과 Overview 화면 양쪽에서 재사용.
- **섹션 스냅 스크롤** — `useRyzeSectionSnapScroll` + `useRyzeActiveSection` (둘 다 `RyzeWorkChapterDetail.tsx` 내부) 쌍으로 화면 단위 스크롤락 + 스크롤스파이를 구현. 새 스크롤 섹션 구조를 만들 때 이 패턴을 재사용한다.
- **이미지 배경의 모서리 흰 틈 방지** — `<img>`를 컨테이너에 딱 맞추면(`inset-0 w-full h-full`) scale 트랜스폼 반올림 오차로 모서리에 실낱같은 틈이 생길 수 있다. `left/top`을 살짝 음수로, `width/height`를 `calc(100% + Npx)`로 오버사이즈해 `overflow-hidden`이 흡수하게 한다 (`RyzeWorkChapterDetail.tsx`의 사진 배경들, `RyzeWorkChapterDetail.tsx` 저니맵 배경 참고).
- **모듈 전역 mutable 상태를 다른 파일에서 "쓸" 때** — import된 `let` 바인딩은 외부에서 직접 대입 불가(읽기 전용 라이브 바인딩). `export const setX = () => { x = ... }` 형태의 setter 함수로 감싼다 (`shared.tsx`의 `markRyzeHeroPlayed()` 참고).
- **차트/카드처럼 props가 거의 안 바뀌는 무거운 컴포넌트** — `React.memo`로 감싸서, 부모의 스크롤/타이머 state 변화로 인한 불필요한 리렌더를 막는다 (`RyzeWorkChapterDetail.tsx`의 `RyzeStatBarChartMemo` 등 참고).

## 파일 분리 시 체크리스트 (실수하기 쉬운 부분)

파일을 새로 쪼갤 때마다 아래 3가지를 놓쳐서 런타임 에러가 난 적이 여러 번 있었다. **매번 확인한다:**

1. **모든 `useXxx(` 호출**이 그 파일 자신의 import 목록에 있는지 (`useNavigate`, `useContext`, `useMotionValue`, `useTransform` 등을 빠뜨리기 쉽다).
2. **standalone `animate()`** (motion/react의 애니메이션 함수, JSX의 `animate=` prop과는 다름)를 쓰면서 import를 빠뜨리지 않았는지 — `grep -n "[^.]animate("`로 확인.
3. **원래 파일(예: `App.tsx`)에 남아있는 다른 컴포넌트가, 방금 옮긴 상수/컴포넌트를 여전히 참조하는지** — 옮기기 전에 `grep -n "\b대상이름\b" src/App.tsx`로 전체 사용처를 먼저 확인하고, 있으면 `export` + import로 연결한다.

검증은 코드만 보지 말고 **브라우저에서 실제 클릭 플로우를 끝까지 타본다** — 특히 RYZE는 `/project-new → 카드 클릭 → 인트로 오버레이 → /projects/2 → 챕터 클릭 → /projects/2/planning`까지 여러 라우트를 거치는데, import 누락은 해당 컴포넌트가 실제로 렌더링되는 순간에야 `ReferenceError`로 드러난다. 콘솔 에러는 이 harness의 preview 서버가 오래된 에러를 계속 재표시하는 경우가 있으니, 화면이 실제로 그려지는지(스크린샷/`document.getElementById('root').innerHTML.length`)로 최종 확인한다.

## 주기적 최적화 지침

이 프로젝트는 몇 시간 안 되는 세션 동안 `App.tsx`가 5,448줄짜리 단일 파일로 불어난 적이 있다. 같은 일이 반복되지 않도록, 아래 기준에 걸리면 먼저 사용자에게 "지금 정리할지" 묻고 진행한다(작업 중간에 자동으로 하지 않는다 — 리팩터링은 그 자체로 리스크가 있는 별도 작업이다).

**정리 트리거:**
- `src/App.tsx`(또는 다른 어떤 파일)가 **1,500줄을 넘어감**
- 한 화면/기능을 위해 **비슷한 구조의 블록이 3번 이상 반복**됨(예: Planning의 "사진+본문" 5개 화면 패턴)
- 새 기능을 추가하려는데 **관련 없는 코드 수백 줄을 먼저 읽어야** 맥락을 잡을 수 있을 때

**정리 절차 (이번에 썼던 방식):**
1. `grep -n "^const \|^function "로 최상위 선언과 줄 번호를 훑어 가장 큰 덩어리 3~5개를 짚는다.
2. 그 덩어리가 **다른 곳에서도 쓰이는 심볼**(색상 토큰, 훅, 헬퍼 등)에 의존하는지 확인 — 의존한다면 그 심볼을 먼저 공용 파일(`shared.tsx` 등)로 옮긴다(순환 참조 방지).
3. `sed -n 'START,ENDp'`로 덩어리를 통째로 잘라 새 파일에 붙이고, 필요한 것만 `export`.
4. 원본 파일에서 해당 범위 삭제, import 문 추가.
5. **양쪽 파일 모두** 위 "파일 분리 시 체크리스트" 3가지를 확인.
6. 미리보기 서버를 **완전히 재시작**(그냥 새로고침 말고 `preview_stop` → `preview_start`)한 뒤, 실제 클릭 플로우로 끝까지 검증.
7. 사용 안 하는 import 정리(`grep -c "\b심볼\b" 파일`로 카운트가 1(=import 줄 자신)뿐이면 제거).

**단, 아래는 억지로 쪼개지 않는다:**
- 서로 다른 시스템이 데이터/헬퍼를 깊게 공유하는 경우(예: `ProjectDetail`은 다른 포트폴리오 프로젝트들과 얽혀 있어 RYZE 폴더로 옮기지 않음) — 무리하게 분리하면 관련 없는 부분까지 리스크에 노출된다.
- 화면마다 구조는 비슷하지만 세부 조건(부제목 유무, 인용 콜아웃 유무 등)이 달라 공용 컴포넌트 API가 오히려 복잡해지는 경우 — 중복이 적당히 남는 게 과도한 추상화보다 낫다.
