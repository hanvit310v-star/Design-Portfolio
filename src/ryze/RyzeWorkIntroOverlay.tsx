// RYZE 프로젝트 진입 트랜지션 — "LET'S SEE THE WORK" 텍스트 롤콜 + 엘리베이터 문 열림
// 애니메이션 + 효과음/보이스(리버브 포함) 오버레이. App.tsx의 AppRoutes가
// useRyzeWorkIntro()로 타이밍을 관리하고, phase 값을 RyzeWorkIntroOverlay에 그대로 넘긴다.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getImageUrl } from './shared';
import { prefetchRyzeGalleryHeads } from './RyzeWorkGallery';

// Orbitron(700)은 index.css의 구글 폰트 @import(display=swap)로 불러오는데, WORK 카드를 눌러
// 인트로의 "LET'S"가 이 폰트를 처음 쓰는 순간이라 다운로드가 안 끝나 있으면 폴백 폰트로 잠깐
// 그려졌다가(letterSpacing까지 어긋나 글자가 이상해 보임) 스왑되는 문제가 있었다(새로고침 후
// 다시 재생하면 이미 브라우저 캐시에 있어 문제없이 보였던 이유). 모듈이 로드되는 즉시(=사이트
// 진입 시점부터) 미리 다운로드를 걸어둬, 실제로 WORK 카드를 누를 때쯤엔 이미 준비돼 있게 한다.
if (typeof document !== 'undefined' && 'fonts' in document) {
  document.fonts.load("700 100px Orbitron").catch(() => {});
}

// 인트로가 쓰는 이미지(문 질감·THE WORK 배경)와 문 뒤에 드러날 엘리베이터 화면 배경도 같은
// 이유로 미리 받아 디코딩해둔다 — 배포(네트워크) 환경에서는 이 이미지들이 문이 열리는 순간에야
// 요청돼, 문 뒤 화면이 늦게 그려지고 상단(Back to Main/음악 UI)이 문 모션 뒤에 갑자기 뜨던 원인이었다.
if (typeof window !== 'undefined') {
  ['RYZE/work-door-texture.webp', 'RYZE/work-intro-bg.webp', 'RYZE/work-chapter-bg.webp'].forEach((path) => {
    const img = new Image();
    img.src = getImageUrl(path);
    img.decode?.().catch(() => {});
  });
}

// 인트로 효과음도 마찬가지다 — 재생하는 순간에야 new Audio(url)로 요청하면 처음 접속에선 내려받는
// 시간만큼 소리가 모션보다 밀려 나온다(도착음은 +2.6s, 전화벨은 +4.7s, 문 열림음은 +6.0s 시점에
// 요청됐다). 모듈 로드 때 미리 받아 두고, 재생할 땐 이 객체를 꺼내 쓴다. 같은 파일을 받는 시점만
// 앞당기는 것이라 전송량은 같다.
const RYZE_INTRO_SOUNDS = [
  'RYZE/elevator-move.mp3',
  'RYZE/elevator-arrival.mp3',
  'RYZE/elevator-door-open.mp3',
  'RYZE/전화벨.wav',
  "RYZE/듣고있어(I'm Listening).mp3",
] as const;
const ryzeIntroSoundCache = new Map<string, HTMLAudioElement>();
// 미리 받아 둔 효과음을 꺼낸다 — 처음 꺼낼 땐 준비된 객체 그대로, 다시 꺼낼 땐 복제본(같은 HTTP
// 캐시를 써서 재다운로드는 없다)을 준다. 어느 쪽이든 항상 처음 위치(0초)에서 시작한다.
const ryzeIntroSoundTaken = new Set<string>();
function takeRyzeIntroSound(path: string): HTMLAudioElement {
  let base = ryzeIntroSoundCache.get(path);
  if (!base) {
    base = new Audio(getImageUrl(path));
    base.preload = 'auto';
    ryzeIntroSoundCache.set(path, base);
  }
  const audio = ryzeIntroSoundTaken.has(path) ? (base.cloneNode(true) as HTMLAudioElement) : base;
  ryzeIntroSoundTaken.add(path);
  audio.currentTime = 0;
  return audio;
}
if (typeof window !== 'undefined') {
  RYZE_INTRO_SOUNDS.forEach((path) => {
    const audio = new Audio(getImageUrl(path));
    audio.preload = 'auto';
    audio.load();
    ryzeIntroSoundCache.set(path, audio);
  });
}

// WORK 카드의 "LET'S SEE THE WORK" + 엘리베이터 문 열림 인트로 모션이 이번 사이트 접속(세션)에서
// 이미 한 번 재생됐는지 — 페이지를 새로고침하거나 사이트를 완전히 새로 접속해 이 모듈이 다시
// 로드될 때만 false로 초기화되어, 그때는 어떤 경로로 들어오든 인트로가 다시 재생된다.
let ryzeWorkIntroPlayed = false;

const RYZE_WORK_INTRO_PHRASES = ["LET'S", 'SEE', 'THE WORK'] as const;
// 문장마다 등장 시간이 동일하도록 하나의 간격(ms)만 쓴다.
const RYZE_WORK_INTRO_PHRASE_INTERVAL_MS = 900;
// 암전(검정 배경 0.4s) → WORK 화면 페이드인(0.4s)이 끝나야 내용이 온전히 보이므로, 문장
// 순환도 그 시점부터 시작해야 "LET'S"가 채 보이기도 전에 잘리지 않는다.
const RYZE_WORK_INTRO_BLACKOUT_MS = 800;
// 암전 → LET'S → SEE → THE WORK를 다 보여준 뒤 실제 라우트 이동 + 나가는 전환(exiting)이
// 시작되기까지의 시간. useRyzeWorkIntro(라우트 이동 타이밍)와 이동음 재생 스케줄(아래
// RyzeWorkIntroOverlay) 양쪽에서 같은 값을 써야 어긋나지 않는다.
// THE WORK가 뜬 뒤(등장 모션 0.7s) 깜빡임 효과가 최소 한 바퀴 이상 눈에 보일 시간을 줘야
// 해서, 문 모션으로 넘어가기 전 여유를 400ms가 아니라 1.5s로 늘렸다가, 이후 "너무 늘어진다"는
// 피드백에 따라 1.15s로 살짝 단축했다.
const RYZE_WORK_INTRO_HOLD_MS = RYZE_WORK_INTRO_BLACKOUT_MS + RYZE_WORK_INTRO_PHRASE_INTERVAL_MS * 3 + 1150;
// 세 문장 모두 같은 글자 크기를 쓰되, 컨테이너(패널)의 폭/높이에 상대적인 cqw/cqh 단위로 잡는다
// (뷰포트 비율에 따라 패널 크기가 달라져도 늘 패널 안에 맞고, vw/vh 기준이라 패널을 벗어나 보이던
// 문제도 함께 해결된다). 가장 긴 "THE WORK"이 폭 기준(9cqw)에 걸려 높이가 자연히 줄어들고,
// 짧은 "LET'S"/"SEE"는 폭에 걸리지 않아 같은 높이(22cqh)로 렌더링되어 결과적으로 크기가 통일된다.
const RYZE_WORK_INTRO_PHRASE_FONT_SIZE = 'min(9cqw, 22cqh)';

// 배경 사진 교체(정면에 가깝게 촬영된 새 엘리베이터 패널) 후 재실측: 1200×674로 스케일한
// 그리드 이미지에서 검은 화면 네 꼭짓점 픽셀 좌표 TL(398,258) TR(800,260) BR(798,383) BL(390,385).
// 상단 변 기울기가 거의 0(atan2(2,402)≈0.3°)이라 이전 사진과 달리 카메라가 거의 정면이라,
// 3D 원근(rotateX/rotateY)도 함께 제거하고 평면에 가깝게 얹는다.
// 중심 (49.7%, 47.7%), 화면 크기 (원본 대비 폭 33.75%, 높이 18.55%).
const RYZE_WORK_INTRO_BG_ASPECT = 2733 / 1536;
const RYZE_WORK_INTRO_SCREEN = { leftPct: 49.7, topPct: 47.7, widthPct: 33.75, heightPct: 18.55, rotateDeg: 0 };

// 브러시드 스틸 문짝 텍스처(사용자 제공 사진) 한 장을 좌우 절반씩 나눠 두 문짝에 걸쳐 쓴다.
// 각 문짝은 배경을 화면 전체 너비(200%)로 깔고 좌/우 절반만 보여주는 식이라, 문이 닫혀
// 있을 때는 이음새 없이 하나로 이어진 금속판처럼 보이다가 열리면서 좌우로 갈라진다.
const RYZE_WORK_INTRO_DOOR_IMG = 'RYZE/work-door-texture.webp';

// WORK 화면이 프레임 밖으로 솟구쳐 빠져나갈 때 쓰는 타이밍 — 문도 정확히 같은 duration·이징으로
// 반대 방향(아래→제자리)에서 들어와야, 두 레이어가 항상 화면을 빈틈없이 나눠 덮어(위쪽은 빠져나가는
// WORK, 아래쪽은 들어오는 문) 블랙 프레임 없이 하나의 연속된 수직 움직임처럼 보인다.
const RYZE_WORK_INTRO_RISE_DURATION = 1.1;
// 문이 자리를 다 채운 뒤 열리기 시작하기까지 닫힌 채 정지해 있는 시간.
const RYZE_WORK_INTRO_DOOR_HOLD_S = 0.25;
// 처음엔 빠르게 튀어나가고 끝으로 갈수록 느려지며 자리를 잡는 ease-out 곡선.
const RYZE_WORK_INTRO_RISE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
// 문이 좌우로 갈라져 열리는 데 걸리는 시간 — 기존 0.7s에서 조금 느리게 늘렸다.
const RYZE_WORK_INTRO_DOOR_OPEN_DURATION = 0.95;
// 목적지 화면으로의 실제 라우트 이동(go)을 나가는 전환(exiting) 시작보다 이만큼 먼저 한다.
// 오버레이(THE WORK 화면)가 아직 전부 덮고 있는 동안 이전 화면 퇴장(0.4s) → 새 화면 마운트 →
// 페이드인(0.4s) + Back to Main 슬라이드인(0.6s)이 끝나 있어야, 문이 열릴 때 상단까지 이미
// 완성된 화면이 드러난다. 이동을 문 상승과 같은 순간에 하면 이 연쇄가 문 열림 시점에야 끝나(느린
// 환경에선 그 뒤에 끝나) 상단이 문 모션이 끝난 뒤에 갑자기 나타난다.
const RYZE_WORK_INTRO_GO_LEAD_MS = 1000;

// "듣고 있어" 보이스에 통화 너머로 들리는 듯한 울림을 더하기 위한 컨볼루션 리버브용
// 임펄스 응답을 코드로 직접 생성한다(별도 IR 음원 파일 없이, 지수적으로 감쇠하는 백색
// 잡음으로 근사한 방 울림).
function createRyzeReverbImpulse(ctx: AudioContext, duration = 1.6, decay = 2.4): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * duration);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

// 등장 모션이 끝난 뒤 나가는 전환: ① "THE WORK" 화면(배경+텍스트) 전체가 강한 세로 모션
// 블러를 매달고 매우 빠르게 위로 솟구쳐 빠져나가고, ② 같은 순간 같은 속도로 엘리베이터 문이
// 아래에서 바통을 이어받듯 올라와 자리를 채운다(암전 없이 완전히 이어지는 하나의 움직임).
// ③ 문이 잠깐 닫혀 있다가 ④ 좌우로 열리며 뒤에 있는 목적지 화면을 드러낸다.
export const RyzeWorkIntroOverlay: React.FC<{ phase: 'rolling' | 'exiting' }> = ({ phase }) => {
  const exiting = phase === 'exiting';
  // "LET'S" → "SEE" → "THE WORK" 순서로 문장을 갈아끼운다. phase가 다시 'rolling'으로 켜질
  // 때마다(카드를 다시 눌러도) 처음부터 재생되도록 phase를 의존성에 둔다.
  // -1 = 아직 아무 문장도 없음(암전 구간). LET'S도 SEE/THE WORK와 똑같이 암전이 끝난 뒤에야
  // 등장해야, 화면이 안 보이는 동안 이미 다 올라와버려서 등장 모션이 생략된 것처럼 보이지
  // 않는다(이전엔 LET'S만 t=0에 바로 마운트돼 암전 뒤에서 등장 모션이 거의 끝나 있었다).
  const [phraseIndex, setPhraseIndex] = useState(-1);
  useEffect(() => {
    if (phase !== 'rolling') return;
    setPhraseIndex(-1);
    let cancelled = false;
    const timers: number[] = [];

    // 모듈 로드 시점에 미리 걸어둔 Orbitron 프리로드가 아직도 안 끝났을 가능성(느린 네트워크,
    // 사이트 진입 직후 바로 WORK를 누른 경우 등)에 대비해, 첫 문장("LET'S")만큼은 최소 암전
    // 시간(BLACKOUT_MS)은 지키되 폰트가 그 시점에도 준비 안 됐으면 최대 400ms까지만 더
    // 기다렸다가 띄운다(폴백 폰트로 잠깐 이상하게 보이던 깜빡임 방지).
    const minWait = new Promise<void>((resolve) => {
      timers.push(window.setTimeout(resolve, RYZE_WORK_INTRO_BLACKOUT_MS));
    });
    const fontReady =
      typeof document !== 'undefined' && 'fonts' in document
        ? document.fonts.load("700 100px Orbitron").then(() => document.fonts.ready).catch(() => {})
        : Promise.resolve();
    const fontTimeout = new Promise<void>((resolve) => {
      timers.push(window.setTimeout(resolve, RYZE_WORK_INTRO_BLACKOUT_MS + 400));
    });
    Promise.all([minWait, Promise.race([fontReady, fontTimeout])]).then(() => {
      if (!cancelled) setPhraseIndex(0);
    });

    timers.push(
      window.setTimeout(() => setPhraseIndex(1), RYZE_WORK_INTRO_BLACKOUT_MS + RYZE_WORK_INTRO_PHRASE_INTERVAL_MS),
      window.setTimeout(() => {
        setPhraseIndex(2);
        // 엘리베이터 도착음 — "THE WORK"가 뜨는 순간과 함께 울린다. 볼륨은 아주 살짝만 낮춘다.
        const arrival = takeRyzeIntroSound('RYZE/elevator-arrival.mp3');
        arrival.volume = 0.5;
        arrival.play().catch(() => {});
      }, RYZE_WORK_INTRO_BLACKOUT_MS + RYZE_WORK_INTRO_PHRASE_INTERVAL_MS * 2)
    );
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [phase]);
  // Work 카드를 누른 순간부터 문이 열릴 때까지 5초 가까이 걸리므로, 그 시간을 이용해 챕터 갤러리의
  // 첫 화면 이미지를 미리 받아 둔다(챕터에 들어가자마자 바로 보이게).
  useEffect(() => {
    prefetchRyzeGalleryHeads();
  }, []);
  // 엘리베이터 이동음 — Work 카드를 누른 순간(=이 오버레이가 처음 마운트되는 순간)부터
  // 문이 열리기 시작하는 순간까지 깔아준다. 시작할 때 살짝 페이드인하고, 문이 열리기
  // 직전에 정확히 페이드아웃이 끝나도록 스케줄링해 뚝 끊기지 않고 자연스럽게 넘어간다.
  // 이 오버레이는 rolling→exiting 동안 계속 마운트된 상태로 유지되므로(AppRoutes에서
  // idle일 때만 언마운트) 마운트 1회짜리 효과로 전체 구간을 커버할 수 있다.
  useEffect(() => {
    const audio = takeRyzeIntroSound('RYZE/elevator-move.mp3');
    audio.loop = true;
    audio.volume = 0;
    audio.play().catch(() => {});

    const FADE_IN_MS = 1000;
    const FADE_OUT_MS = 400;
    const TARGET_VOLUME = 0.7;
    // 문이 열리기 시작하는 시점(RYZE_WORK_INTRO_HOLD_MS 이후 문 상승+정지 구간이 끝나는 때)에
    // 맞춰 이동음이 딱 끊기도록 한다.
    const doorOpenAtMs = RYZE_WORK_INTRO_HOLD_MS + (RYZE_WORK_INTRO_RISE_DURATION + RYZE_WORK_INTRO_DOOR_HOLD_S) * 1000;
    const t0 = performance.now();

    const tick = () => {
      const elapsed = performance.now() - t0;
      if (elapsed < FADE_IN_MS) {
        audio.volume = TARGET_VOLUME * (elapsed / FADE_IN_MS);
      } else if (elapsed < doorOpenAtMs - FADE_OUT_MS) {
        audio.volume = TARGET_VOLUME;
      } else if (elapsed < doorOpenAtMs) {
        const k = (elapsed - (doorOpenAtMs - FADE_OUT_MS)) / FADE_OUT_MS;
        audio.volume = TARGET_VOLUME * (1 - k);
      } else {
        audio.volume = 0;
        audio.pause();
        window.clearInterval(fadeTimer);
      }
    };
    const fadeTimer = window.setInterval(tick, 50);

    return () => {
      window.clearInterval(fadeTimer);
      audio.pause();
    };
  }, []);
  // 엘리베이터 문이 열리기 시작하는 바로 그 순간(위 이동음이 끊기는 시점과 동일)에
  // 문 열리는 효과음을 한 번 재생한다.
  useEffect(() => {
    const doorOpenAtMs = RYZE_WORK_INTRO_HOLD_MS + (RYZE_WORK_INTRO_RISE_DURATION + RYZE_WORK_INTRO_DOOR_HOLD_S) * 1000;
    const t = window.setTimeout(() => {
      const doorOpenSfx = takeRyzeIntroSound('RYZE/elevator-door-open.mp3');
      doorOpenSfx.volume = 0.9;
      doorOpenSfx.play().catch(() => {});
    }, doorOpenAtMs);
    return () => window.clearTimeout(t);
  }, []);
  // 전화벨 — 엘리베이터 문이 (아래에서 올라와) 등장하는 모션이 시작되는 순간(=exiting 단계
  // 시작, holdMs)과 동시에 울리기 시작해, 처음엔 아주 약하게 들리다가 점점 빠르게 커지는
  // 곡선(ease-in, 제곱 커브)으로 페이드인된다. 문이 거의 다 열려갈 때쯤(="듣고 있어"가
  // 재생되는, 즉 전화를 받는 순간) 끊긴다. "듣고 있어"는 그 순간 재생되며, 자기 길이의
  // 마지막 0.4초 구간 동안 페이드아웃되며 자연스럽게 끝난다.
  useEffect(() => {
    const ringAtMs = RYZE_WORK_INTRO_HOLD_MS;
    const doorOpenAtMs = RYZE_WORK_INTRO_HOLD_MS + (RYZE_WORK_INTRO_RISE_DURATION + RYZE_WORK_INTRO_DOOR_HOLD_S) * 1000;
    // "듣고 있어" 재생 시점 — 문이 다 열리고 나서가 아니라, 거의 다 열려갈 때쯤(95% 지점) 재생한다.
    const listenAtMs = doorOpenAtMs + RYZE_WORK_INTRO_DOOR_OPEN_DURATION * 1000 * 0.9;

    const RING_TARGET_VOLUME = 0.19;
    const RING_FADE_IN_MS = 1800;
    let ring: HTMLAudioElement | null = null;
    let ringFadeTimer: number | undefined;

    const ringStartTimer = window.setTimeout(() => {
      ring = takeRyzeIntroSound('RYZE/전화벨.wav');
      ring.volume = 0;
      ring.play().catch(() => {});
      const t0 = performance.now();
      ringFadeTimer = window.setInterval(() => {
        const elapsed = performance.now() - t0;
        if (!ring) return;
        // 처음엔 약하게, 뒤로 갈수록 빠르게 커지는 ease-in(제곱) 커브.
        const progress = Math.min(1, elapsed / RING_FADE_IN_MS);
        ring.volume = RING_TARGET_VOLUME * progress * progress;
        if (elapsed >= RING_FADE_IN_MS) window.clearInterval(ringFadeTimer);
      }, 50);
    }, ringAtMs);

    const ringStopTimer = window.setTimeout(() => {
      window.clearInterval(ringFadeTimer);
      ring?.pause();
    }, listenAtMs);

    const listenTimer = window.setTimeout(() => {
      const listen = takeRyzeIntroSound("RYZE/듣고있어(I'm Listening).mp3");
      const LISTEN_VOLUME = 0.15;
      const FADE_OUT_S = 0.4;
      listen.volume = LISTEN_VOLUME;
      listen.addEventListener('timeupdate', () => {
        if (!isFinite(listen.duration)) return;
        const remain = listen.duration - listen.currentTime;
        if (remain <= FADE_OUT_S) {
          listen.volume = Math.max(0, LISTEN_VOLUME * (remain / FADE_OUT_S));
        }
      });
      // 리버브 — Web Audio API로 드라이(원음)/웻(컨볼루션 리버브) 신호를 섞어, 전화기 너머
      // 공간에서 울리는 듯한 느낌을 더한다. 지원하지 않는 환경이면 조용히 원음만 재생한다.
      try {
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextCtor();
        // AudioContext는 사용자 제스처에서 멀리 떨어진(수 초 뒤 setTimeout 안) 시점에 생성되면
        // 브라우저(특히 Safari)가 suspended 상태로 만들어버려, 그래프가 다 연결돼 있어도 아무
        // 소리도 안 나는 경우가 있다 — resume()을 명시적으로 걸어 깨워준다.
        ctx.resume().catch(() => {});
        const source = ctx.createMediaElementSource(listen);
        const convolver = ctx.createConvolver();
        convolver.buffer = createRyzeReverbImpulse(ctx);
        const dryGain = ctx.createGain();
        dryGain.gain.value = 0.7;
        const wetGain = ctx.createGain();
        wetGain.gain.value = 0.55;
        source.connect(dryGain).connect(ctx.destination);
        source.connect(convolver).connect(wetGain).connect(ctx.destination);
        listen.addEventListener('ended', () => ctx.close().catch(() => {}), { once: true });
      } catch {
        // Web Audio API를 쓸 수 없으면 리버브 없이 그냥 재생한다.
      }
      listen.play().catch(() => {});
    }, listenAtMs);

    return () => {
      window.clearTimeout(ringStartTimer);
      window.clearTimeout(ringStopTimer);
      window.clearTimeout(listenTimer);
      window.clearInterval(ringFadeTimer);
      ring?.pause();
    };
  }, []);
  const phrase = RYZE_WORK_INTRO_PHRASES[phraseIndex];
  return (
    // Overview 카드는 실제로는 두 단계다 — ① 그리드 페이지 자체가 exit={{opacity:0}}로
    // 0.4s에 걸쳐 어두워지고, ② 그 다음(AnimatePresence mode="wait") 새 페이지가 검정 위에서
    // 0.4s에 걸쳐 페이드인된다 — 합쳐서 총 0.8s짜리 "암전→콘텐츠 등장" 시퀀스다. Work 카드는
    // 그리드가 실제로 언마운트되는 게 아니라서 그 첫 단계를 검정 배경 레이어의 페이드인으로
    // 흉내내고, WORK 화면(사진+텍스트)의 페이드인을 그 다음(0.4s 지연)에 이어 붙여 동일하게
    // 총 0.8s가 되도록 맞췄다.
    <div className="fixed inset-0 z-[300] overflow-hidden">
      {/* 검정 배경 1단계 — 그리드가 어두워지는 것과 같은 속도(0.4s)로 서서히 불투명해져
          그리드를 덮는다. WORK 화면이 사라지고 문이 나타나기까지의 구간에도 목적지 화면이
          비쳐 보이지 않게 덮어주다가, 문이 완전히 자리 잡은 직후부터는 투명해져서 문이 열릴
          때 이 레이어가 아니라 실제 목적지 화면이 그대로 드러난다. */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: '#000' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={
          exiting
            ? { delay: RYZE_WORK_INTRO_RISE_DURATION, duration: 0.15 }
            : { duration: 0.4 }
        }
      />
      <motion.div
        // overflow-hidden: 안쪽 사진은 뷰포트를 cover로 덮으려고 뷰포트보다 크게(가로로 넓은 창일수록
        // 세로로 더 크게) 깔려 있어서, 이 레이어를 뷰포트 높이(-100%)만큼만 올려 보내면 넘친 아랫부분이
        // 화면 상단에 어두운 띠로 남아 Back to Main/음악 UI를 가렸다. 레이어 경계에서 잘라 사진이 레이어와
        // 함께 완전히 빠져나가게 한다(평소엔 바깥 overflow-hidden이 같은 영역을 이미 잘라내므로 모습 동일).
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        // 등장할 땐 검정 배경이 다 덮인 뒤(0.4s 지연) Overview 콘텐츠처럼 0.4s에 걸쳐 서서히
        // 페이드인되고(총 0.8s), 나갈 땐 THE WORK 화면 전체(배경+텍스트)가 강한 세로 모션
        // 블러를 매달고 프레임 밖으로 솟구쳐 빠져나간다 — 처음에 가장 빠르고(블러도 가장
        // 진하고) 갈수록 느려지며 빠져나가므로 블러도 그에 맞춰 처음에 진하다가 옅어지게 잡았다.
        initial={{ y: '0%', filter: 'blur(0px)', opacity: 0 }}
        animate={
          exiting
            ? { y: '-100%', filter: ['blur(0px)', 'blur(34px)', 'blur(6px)'], opacity: [1, 1, 0] }
            : { y: '0%', filter: 'blur(0px)', opacity: 1 }
        }
        transition={{
          y: { duration: RYZE_WORK_INTRO_RISE_DURATION, ease: RYZE_WORK_INTRO_RISE_EASE },
          filter: { duration: RYZE_WORK_INTRO_RISE_DURATION, times: [0, 0.35, 1], ease: RYZE_WORK_INTRO_RISE_EASE },
          // 등장할 때만 검정 배경이 다 덮인 뒤(0.4s) 이어서 0.4s에 걸쳐 페이드인 — Overview와
          // 같은 총 0.8s. 나갈 땐 위 opacity:1이 그대로 유지되므로(즉시 도달) 별도 종료 페이드
          // 없이 블러+상승만으로 빠져나간다.
          // 나갈 땐 상승이 끝나는 순간(마지막 3%) 레이어를 투명하게 해, 남은 블러 번짐(6px)이
          // 화면 상단에 비치지 않게 한다 — 그 시점엔 이미 문이 화면을 다 덮고 있어 눈에 안 띈다.
          opacity: exiting ? { duration: RYZE_WORK_INTRO_RISE_DURATION, times: [0, 0.97, 1], ease: 'linear' } : { delay: 0.4, duration: 0.4 },
        }}
      >
        {/* 사진의 16:9(1200:675) 비율은 유지하되, 뷰포트를 "꽉 채우도록"(cover) 필요한 쪽으로
            더 키운다 — min()이면 레터박스(여백)가 생기지만 max()면 항상 화면을 완전히 덮고
            남는 부분만 바깥으로 잘려나간다. 패널 위치는 사진 기준 퍼센트라 잘려도 그대로 맞는다. */}
        <div
          className="relative"
          style={{
            width: `max(100vw, calc(100vh * ${RYZE_WORK_INTRO_BG_ASPECT}))`,
            aspectRatio: `${RYZE_WORK_INTRO_BG_ASPECT}`,
            // flex 부모(justify-center)가 기본적으로 flex item을 줄여버려서(flex-shrink:1)
            // max()로 크게 지정한 너비가 무시되고 뷰포트 폭에 눌리던 문제 — 줄어들지 않게 고정.
            flexShrink: 0,
          }}
        >
          <img
            src={getImageUrl('RYZE/work-intro-bg.webp')}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />
          {/* WORK — 빈 표시등 화면 자리에, 실측한 위치·크기·기울기 그대로 겹친다. 부모에 perspective를
              주고 자식을 rotateX/rotateY까지 살짝 기울여, 패널 표면에 딱 붙어 원근이 있는 것처럼
              보이게 한다(단순 2D rotate만으로는 평면 스티커처럼 보였다). */}
          <div
            className="absolute flex items-center justify-center overflow-hidden"
            style={{
              left: `${RYZE_WORK_INTRO_SCREEN.leftPct}%`,
              top: `${RYZE_WORK_INTRO_SCREEN.topPct}%`,
              width: `${RYZE_WORK_INTRO_SCREEN.widthPct}%`,
              height: `${RYZE_WORK_INTRO_SCREEN.heightPct}%`,
              transform: 'translate(-50%, -50%)',
              // 폰트 크기를 이 패널 자체의 폭/높이 기준(cqw/cqh)으로 잡기 위한 컨테이너.
              containerType: 'size',
            }}
          >
            {/* mode="wait"는 나가는 문장이 완전히 끝난 뒤에야 다음 문장이 들어오기 시작해
                그 사이에 아무것도 없는 "끊기는" 순간이 생겼다. 겹치며 자연스럽게 넘어가도록
                동시 진행(기본 모드)으로 바꾼다. */}
            <AnimatePresence>
              {phrase && (
                <motion.div
                  key={phrase}
                  className="absolute inset-0 flex items-center justify-center uppercase leading-none"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    fontStyle: 'normal',
                    color: '#FF0A1A',
                    fontSize: RYZE_WORK_INTRO_PHRASE_FONT_SIZE,
                    letterSpacing: phrase === "LET'S" ? '0.12em' : 'normal',
                    whiteSpace: 'nowrap',
                    transformOrigin: 'center',
                    textShadow: '0 0 1px rgba(255,255,255,0.75), 0 0 3px #FF1122, 0 0 6px #FF0018',
                  }}
                  // 글자 높이(패널 높이의 최대 22%)를 감안해, 아무리 멀리 움직여도 패널(검정
                  // 인디케이터 영역) 밖으로 글자가 삐져나가지 않는 한도 안에서만 이동시킨다.
                  // 이동(y)은 느리고 부드럽게, 나타나고 사라지는 오퍼시티는 그보다 훨씬 빠르게
                  // 끝나도록 속성별로 다른 트랜지션을 준다 — 이게 있어야 겹치는 구간에서도
                  // 두 문장이 흐릿하게 뭉개지지 않고 또렷하게 교차한다.
                  initial={{ y: '28%', opacity: 0, rotate: RYZE_WORK_INTRO_SCREEN.rotateDeg }}
                  animate={{
                    y: '0%',
                    opacity: 1,
                    rotate: RYZE_WORK_INTRO_SCREEN.rotateDeg,
                    transition: { y: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.18, ease: 'easeOut' } },
                  }}
                  exit={{
                    y: '-28%',
                    opacity: 0,
                    rotate: RYZE_WORK_INTRO_SCREEN.rotateDeg,
                    transition: { y: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.18, ease: 'easeIn' } },
                  }}
                >
                  {/* THE WORK만 등장(올라오는 모션, duration 0.7s) 직후부터 일정한 주기로
                      꺼졌다 켜지는 깜빡임(flicker)을 계속 반복한다. 프레이머 모션의 중첩
                      키프레임 배열(delay+repeat:Infinity 조합)로는 실제로 애니메이션이
                      멈춰버리는 현상이 있어, index.css의 순수 CSS @keyframes로 대신
                      구현했다 — ease-out 커브(등장 모션의 이동량 대부분이 앞부분에서
                      일어나 실제로는 0.7s보다 훨씬 일찍 자리를 잡은 것처럼 보임) 특성을
                      고려해 animation-delay를 0s로 없애, 텍스트가 마운트되는 즉시(등장 모션과
                      거의 동시에) 깜빡이기 시작하게 했다. 주기를
                      0.8초로 살짝 더 짧게 잡고, 키프레임도 앞쪽(0~20%)만 유지한 뒤 곧바로
                      꺼지게 해서 "다 올라온 직후 바로 깜빡이기 시작"하는 느낌을 살렸다. */}
                  <span
                    className="inline-block"
                    style={
                      phrase === 'THE WORK'
                        ? { animation: 'ryzeWorkFlicker 0.8s ease-in-out 0s infinite' }
                        : undefined
                    }
                  >
                    {phrase}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      {exiting && (
        <>
          {/* 왼쪽 문짝 — 배경을 화면 폭의 200%로 깔고 왼쪽 절반만 보여준다. WORK 화면과 정확히
              같은 duration·이징으로 아래(100%)에서 제자리(0%)까지 올라온다 — 그래서 항상
              "위로 빠져나가는 WORK + 아래에서 들어오는 문"이 화면을 빈틈없이 나눠 덮는다.
              살짝 걸려있던 블러가 도착과 함께 풀리며 "받아 안는" 느낌을 준다. */}
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2"
            style={{
              backgroundImage: `url(${getImageUrl(RYZE_WORK_INTRO_DOOR_IMG)})`,
              backgroundSize: '200% 100%',
              backgroundPosition: 'left center',
              boxShadow: 'inset -6px 0 12px -4px rgba(0,0,0,0.6)',
            }}
            initial={{ y: '100%', x: '0%', filter: 'blur(18px)' }}
            animate={{ y: '0%', x: '-100%', filter: 'blur(0px)' }}
            transition={{
              y: { duration: RYZE_WORK_INTRO_RISE_DURATION, ease: RYZE_WORK_INTRO_RISE_EASE },
              filter: { duration: RYZE_WORK_INTRO_RISE_DURATION, ease: 'easeOut' },
              x: { delay: RYZE_WORK_INTRO_RISE_DURATION + RYZE_WORK_INTRO_DOOR_HOLD_S, duration: RYZE_WORK_INTRO_DOOR_OPEN_DURATION, ease: [0.6, 0, 0.2, 1] },
            }}
          />
          {/* 오른쪽 문짝 — 같은 배경의 오른쪽 절반. 왼쪽 문짝과 맞닿아 하나로 이어져 보인다. */}
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2"
            style={{
              backgroundImage: `url(${getImageUrl(RYZE_WORK_INTRO_DOOR_IMG)})`,
              backgroundSize: '200% 100%',
              backgroundPosition: 'right center',
              boxShadow: 'inset 6px 0 12px -4px rgba(0,0,0,0.6)',
            }}
            initial={{ y: '100%', x: '0%', filter: 'blur(18px)' }}
            animate={{ y: '0%', x: '100%', filter: 'blur(0px)' }}
            transition={{
              y: { duration: RYZE_WORK_INTRO_RISE_DURATION, ease: RYZE_WORK_INTRO_RISE_EASE },
              filter: { duration: RYZE_WORK_INTRO_RISE_DURATION, ease: 'easeOut' },
              x: { delay: RYZE_WORK_INTRO_RISE_DURATION + RYZE_WORK_INTRO_DOOR_HOLD_S, duration: RYZE_WORK_INTRO_DOOR_OPEN_DURATION, ease: [0.6, 0, 0.2, 1] },
            }}
          />
        </>
      )}
    </div>
  );
};

// 트랜지션 진행 상태 + 타이밍을 관리하는 훅. run(go)를 호출하면 "WORK"가 롤링해 등장하고,
// 잠시 멈춰 보여준 뒤 그 시점에 go()로 실제 라우트를 이동시키고(화면은 여전히 오버레이로
// 덮여 있어 전환 자체는 보이지 않는다) 오버레이가 페이드아웃되며 걷힌다.
export function useRyzeWorkIntro() {
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'exiting'>('idle');
  const timers = useRef<number[]>([]);

  const run = useCallback((go: () => void) => {
    // 이번 접속(세션)에서 이미 한 번 재생됐다면 오버레이 없이 곧장 이동한다.
    if (ryzeWorkIntroPlayed) {
      go();
      return;
    }
    ryzeWorkIntroPlayed = true;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPhase('rolling');
    // 암전(0.8s) 뒤 LET'S → SEE → THE WORK, 세 문장 모두 동일한 간격만큼 보여준 뒤 실제
    // 라우트 이동 + 나가는 전환을 시작한다. THE WORK가 뜨고 나서 문 모션으로 넘어가기까지
    // 0.4초를 더 늘려 여유를 준다.
    const holdMs = RYZE_WORK_INTRO_HOLD_MS;
    timers.current.push(
      window.setTimeout(go, holdMs - RYZE_WORK_INTRO_GO_LEAD_MS),
      window.setTimeout(() => setPhase('exiting'), holdMs)
    );
    // exiting 단계 전체(WORK 상승+블러(문도 동시에 같은 속도로 올라와 자리를 채움) + 문
    // 정지(RYZE_WORK_INTRO_DOOR_HOLD_S) + 문 열림(RYZE_WORK_INTRO_DOOR_OPEN_DURATION)) 재생이
    // 끝나면 오버레이를 완전히 제거한다. 문이 열린 뒤 0.2초 후 "듣고 있어" 사운드가 재생되도록
    // RyzeWorkIntroOverlay 안에 별도 타이머가 걸려 있으므로, 그 타이머가 실행되기 전에
    // 오버레이가 먼저 언마운트되어 타이머가 취소돼버리지 않도록 여유(+600ms)를 더 둔다.
    const exitTotalMs = (RYZE_WORK_INTRO_RISE_DURATION + RYZE_WORK_INTRO_DOOR_HOLD_S + RYZE_WORK_INTRO_DOOR_OPEN_DURATION) * 1000;
    timers.current.push(window.setTimeout(() => setPhase('idle'), holdMs + exitTotalMs + 600));
  }, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  return { phase, run };
}

