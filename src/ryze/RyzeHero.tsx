// RYZE 프로젝트 진입 시 재생되는 캔버스 히어로 애니메이션(워드마크 "RYZE" 드로잉) + 로고 SVG.
// NewProjectPlaceholder(App.tsx)와 RyzeProjectsSection(같은 로고를 헤더에 재사용)에서 쓴다.
//
// RYZE 히어로 글리치 스플래시 — 레퍼런스 영상(워드로고 스플레시.mp4, 60fps)을 프레임 단위로
// 실측해 재현한 타임라인:
//  · 리드인(283ms): 성긴 검은 블록 1~4개, 첫 배치 83ms 유지 후 33ms 간격 배치 교체
//  · 플러드(~67ms): 카드 대부분을 덮는 대형 블록 클러스터 2연타
//  · 디픽셀레이션(~253ms): 워드마크 저해상 모자이크가 8단계로 점점 미세해짐
//    (레퍼런스는 문자 스크램블이 아니라 모자이크 해상도 상승 방식)
//  · 스타일 플래시: 클린(17ms) → 스트레치+미세 스큐(100ms) → 슬래시 글리프(166ms)
//    → 스워시 필기획 관통(167ms), 각각 33ms 간격 마이크로 지터
//  · 정착 스냅(t≈1.05s) 후 클린 홀드 → 주기 4.15s로 무한 반복
//  · 인트로(첫 진입)는 영상과 동일하게 리드인 없이 플러드부터 시작
//  · 색상: 배경 #0A0A0A / 잉크(텍스트·블록) #F9FAFB
import React, { useEffect, useRef } from 'react';
import { RYZE_BG, RYZE_INK, RYZE_INK_RGB } from './shared';

// 워드마크 글자 원본 벡터(사용자 제공 SVG). 각 문자의 viewBox 폭/높이 + path d.
// 네 글자 모두 동일 아트보드(높이 ≈734) 기준이라 높이 하나로 정규화해 배치한다.
const RYZE_LETTERS: { ch: string; w: number; h: number; d: string }[] = [
  {
    ch: 'R', w: 616.02, h: 738.49,
    d: 'M.01,734.1l.12-7.87c42.69-3.17,51.53-45.64,53.87-81.15-7.91-182.71,10.58-374.4.12-556.08C51.91,50.88,42.94,15.64.29,7.82L0,.1l285.11-.1c137.12,6.5,237.82,68.84,226.98,219.17-6.28,87.18-63.94,133.58-137.22,166.76-1.78.81-3.63-1.23-2.9,3.18,40.26,67.47,77.45,136.87,117.7,204.33,31.77,53.25,62.43,114.97,126.05,134.94l.3,7.71c-82.46,6.01-158.36,6.24-209.64-67.36l-151.37-264.63h-89l-.08,235.08c2.04,38.41,9.45,83.06,55.96,87.05l.12,7.87H.01ZM166.01,382.1c68.06-1.05,146.61,11.07,192.84-50.16,51.54-68.27,50.96-234.75-25.02-286.66-14.21-9.7-48-23.18-64.82-23.18h-103v360Z',
  },
  {
    ch: 'Y', w: 594.54, h: 734,
    d: 'M232.43,0l-.23,7.78c-36.21,5.32-42.5,27.1-34.34,59.79,41.48,104.23,100.71,200.19,146.59,302.43,1.34,1,3.66-3.46,4.37-4.6,40.95-65.61,68.66-152.89,106.54-221.46,14.58-36.33,46.79-109.49-2.95-130.92-8.64-3.72-20.97-1.44-17.98-13.01h160c-.09,2.64.66,5.69-.92,8.08-.9,1.36-23.17,10.75-28.9,15.09-8.93,6.77-16.54,17.43-25.2,24.8-55.84,90.22-110.22,193.62-152.69,291.31-44.29,101.86-20.56,213.16-26.04,321.47,3.61,21.68,9.61,44.18,29.09,56.91,9.61,6.28,26.86,5.35,26.67,16.33h-224l.12-7.87c44.04-4.33,53.72-43.38,55.97-81.04,3.13-52.56,2.97-125.53,0-178.17-1.63-28.93-8.68-57.26-20.37-83.63-54.73-98.78-97.62-209-153.37-306.63-14.6-25.58-30.33-46.84-56.31-61.69C10.1,10.18-2.5,10.58.43,0h232Z',
  },
  {
    ch: 'Z', w: 553.98, h: 734.05,
    d: 'M415.35,688.4c-39.05,17.68-85.53,23.97-128.25,25.75-47.44,1.98-95.67-.85-143.08-1.08,46.69-75.08,85.45-156.94,132.37-231.63,6.4-10.19,13.47-21.79,20.78-31.22,48.54-62.66,129.43-79.28,204.85-84.17v-5.98c-22.45-1.12-47.9-3.14-69.57-9.45-67.25-19.56-33.6-78.43-11.48-120.6,35.28-67.3,77.71-137.72,116.7-203.3,4.87-8.19,9.8-17.78,16.32-24.65V0L84.02.07l-24.01,185.99,7.7-.31c11.39-35.43,24.14-71.69,48.35-100.64C186.93.35,312.17,25.07,409.99,23.04c-51.63,84.85-95.77,174.51-150.96,257.04-50.18,59.4-109.21,67.64-181.75,78.25-3.29.48-19.28,1.9-19.24,4.72,2.4,3.98,5.75,2.38,8.94,3.02,27.82,5.54,82.56,4.11,96.77,33.23,11.56,23.71-2.29,52.58-13.41,74.09L0,734.05h512l30-195.99-9.8.2c-17.22,65.16-54.22,121.79-116.85,150.14Z',
  },
  {
    ch: 'E', w: 486, h: 734.12,
    d: 'M475.78,539.31c-13.45,50.84-33.54,96.54-74.83,130.75-63.27,52.44-155.93,42.94-232.94,44.06v-340c64.88,4.48,165.83-19.8,198.97,54.03,3.13,6.97,9.41,36.87,11.05,37.97,1.69,1.13,7.98-.95,7.98-2.99v-203l-7.78.23c-9.78,51.95-35.42,78.95-87.8,87.19-40.41,6.35-81.64,4.21-122.13,4.58V22.12c69.32,2.58,143.32-10.83,207.06,23.66,54.67,29.58,78.35,83.65,95.88,140.46,3.04-.7,9.93,2.12,8.66-2.97L452.77,0,2.31.07v7.66c33.21,5.59,46.26,26.43,51.14,57.94,2.82,18.18.43,32.39.45,49.36.27,182.69.02,365.38.06,548.06-3.08,31.25-19.34,61.36-53.85,63.16l-.12,7.87h458l28-195.98-10.22,1.17Z',
  },
];
const RYZE_LETTER_PATHS: Path2D[] = RYZE_LETTERS.map((l) => new Path2D(l.d));
// 글자쌍별 자간 비율(캡하이트 대비) — 레퍼런스 워드마크는 균일 자간이 아니라
// 글자끼리 살짝 겹치는 네거티브 커닝(R|Y, Y|Z, Z|E)이라 쌍별로 지정한다.
const RYZE_LETTER_GAPS = [-0.2, -0.05, 0.06];

// capH 기준으로 각 글자의 스케일/가로 위치를 계산 (좌측 정렬 좌표, 폭 합계 포함)
const layoutRyzeWord = (capH: number) => {
  const gaps = RYZE_LETTER_GAPS.map((g) => capH * g);
  const scales = RYZE_LETTERS.map((l) => capH / l.h);
  const widths = RYZE_LETTERS.map((l, i) => l.w * scales[i]);
  const totalW = widths.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  let x = -totalW / 2;
  const positions = RYZE_LETTERS.map((_, i) => {
    const pos = { x, scale: scales[i], width: widths[i] };
    x += widths[i] + (gaps[i] ?? 0);
    return pos;
  });
  return { totalW, positions };
};

// 재사용 가능한 RYZE SVG 로고 — 히어로 캔버스와 동일한 글자 벡터·자간(layoutRyzeWord)을
// 그대로 써서, 어디에 박아 넣어도 히어로의 RYZE 워드마크와 자간이 완전히 일치한다.
export const RyzeLogoSVG: React.FC<{ height?: number; color?: string; className?: string }> = ({
  height = 18,
  color = RYZE_INK,
  className,
}) => {
  const capH = 100;
  const { totalW, positions } = layoutRyzeWord(capH);
  const width = height * (totalW / capH);
  return (
    <svg
      viewBox={`${-totalW / 2} 0 ${totalW} ${capH}`}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block', overflow: 'visible' }}
      aria-label="RYZE"
      role="img"
    >
      {positions.map((pos, i) => (
        <path key={RYZE_LETTERS[i].ch} d={RYZE_LETTERS[i].d} fill={color} transform={`translate(${pos.x} 0) scale(${pos.scale})`} />
      ))}
    </svg>
  );
};

export const RyzeHero: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let disposed = false;
    let W = 0, H = 0, DPR = 1;
    let fontSize = 100, textW = 0, capH = 72, baselineY = 0, centerX = 0, centerY = 0;
    let letterPositions: { x: number; scale: number; width: number }[] = [];
    const textCv = document.createElement('canvas'); // 정착 상태 원본(모자이크 소스)
    let mosaics: HTMLCanvasElement[] = [];
    let lastKey = '';

    // ── 실측 타임라인(ms, 사이클 기준) ──
    const LEAD_END = 283;
    const FLOOD_STEPS = [283, 316];
    const REFINE_STEPS = [350, 370, 403, 453, 486, 503, 553, 586]; // 8단계
    const CLEAN_FLASH = [603, 620];
    const STRETCH = [620, 720];   // 지터 스텝 620/653/686
    const SLASH = [720, 886];     // 지터 스텝 720/753/786/820/853
    const SWASH = [886, 1053];    // 모프 스텝 886/920/953/986/1020
    const SETTLE_AT = 1053;
    const CYCLE = 1750; // 정착 후 홀드를 짧게 줄여 가로지르는 효과로 더 빨리 이어지도록 함
    const INTRO_OFFSET = LEAD_END; // 첫 사이클은 플러드부터

    const quant = (v: number, q: number) => Math.round(v / q) * q;

    // 시드 기반 의사난수 — 같은 스텝 안에서는 배치가 고정되도록
    const rand = (seed: number) => {
      let s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    const setup = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (W === 0 || H === 0) return;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // 워드마크 폭 = 화면 폭의 ~55% (레퍼런스의 워드/카드 비율 실측)
      const { totalW: totalW100 } = layoutRyzeWord(100);
      let capHTarget = (Math.min(W * 0.55, 980) / totalW100) * 100;
      capHTarget = Math.min(capHTarget, H * 0.38 * 0.72);
      capH = capHTarget;
      fontSize = capH / 0.72; // 스트로크 굵기 등 기존 비율식 호환용
      const layout = layoutRyzeWord(capH);
      textW = layout.totalW;
      letterPositions = layout.positions;
      centerX = W / 2; centerY = H / 2;
      baselineY = centerY + capH / 2;

      // 정착 상태 텍스트를 오프스크린에 렌더 (모자이크 소스)
      textCv.width = canvas.width; textCv.height = canvas.height;
      const tg = textCv.getContext('2d')!;
      tg.setTransform(DPR, 0, 0, DPR, 0, 0);
      tg.clearRect(0, 0, W, H);
      tg.fillStyle = RYZE_INK;
      letterPositions.forEach((pos, i) => {
        tg.save();
        tg.translate(centerX + pos.x, baselineY - capH);
        tg.scale(pos.scale, pos.scale);
        tg.fill(RYZE_LETTER_PATHS[i]);
        tg.restore();
      });

      // 모자이크 8단계 사전 생성 (거친 → 미세)
      const cells = [1.5, 2.0, 2.6, 3.4, 4.5, 6, 9, 14].map((d) => capH / d);
      mosaics = cells.map((cell) => {
        const mw = Math.max(2, Math.ceil(W / cell));
        const mh = Math.max(2, Math.ceil(H / cell));
        const mc = document.createElement('canvas');
        mc.width = mw; mc.height = mh;
        const mg = mc.getContext('2d', { willReadFrequently: true })!;
        mg.drawImage(textCv, 0, 0, mw, mh);
        // 이진화 — 레퍼런스 블록은 안티앨리어스 없는 솔리드 블랙.
        // 임계값을 낮게 잡아 거친 단계에서 레퍼런스처럼 두꺼운 클러스터가 남도록 함.
        const img = mg.getImageData(0, 0, mw, mh);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] > 40) { d[i] = RYZE_INK_RGB[0]; d[i + 1] = RYZE_INK_RGB[1]; d[i + 2] = RYZE_INK_RGB[2]; d[i + 3] = 255; }
          else d[i + 3] = 0;
        }
        mg.putImageData(img, 0, 0);
        return mc;
      });
      lastKey = '';
    };

    const drawWord = (scaleX = 1, scaleY = 1, skewDeg = 0) => {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.transform(scaleX, 0, Math.tan((skewDeg * Math.PI) / 180), scaleY, 0, 0);
      ctx.translate(-centerX, -centerY);
      ctx.fillStyle = RYZE_INK;

      const fillLetters = () => {
        letterPositions.forEach((pos, i) => {
          ctx.save();
          ctx.translate(centerX + pos.x, baselineY - capH);
          ctx.scale(pos.scale, pos.scale);
          ctx.fill(RYZE_LETTER_PATHS[i]);
          ctx.restore();
        });
      };

      // 포트폴리오 첫 화면 "DESIGN ARCHIVE"와 동일한 하얀 은은한 outer glow(다중 text-shadow:
      // 0 0 18px rgba(255,255,255,.35), 0 0 42px rgba(255,255,255,.18))를 캔버스로 재현한다.
      // Canvas 2D는 shadow를 한 번에 하나만 지원하므로, 같은 글자를 shadow 설정만 바꿔가며
      // 두 겹(넓고 옅은 겹 → 좁고 진한 겹)으로 겹쳐 그린 뒤, shadow 없이 한 번 더 그려 또렷한
      // 최종 글자를 그 위에 얹는다 — 매번 같은 모양의 불투명 fill이라 여러 번 겹쳐도 보이는
      // 글자 자체는 달라지지 않고, 그 아래 번지는 광원만 누적된다.
      ctx.shadowColor = 'rgba(255,255,255,0.18)';
      ctx.shadowBlur = 42;
      fillLetters();
      ctx.shadowColor = 'rgba(255,255,255,0.35)';
      ctx.shadowBlur = 18;
      fillLetters();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      fillLetters();

      ctx.restore();
    };

    // 리드인: 성긴 블록 1~4개 (텍스트 존 주변, 그리드 양자화)
    const drawLeadBlocks = (step: number) => {
      const g = capH / 2.4;
      const n = 1 + Math.floor(rand(step * 7.13) * 4);
      ctx.fillStyle = RYZE_INK;
      for (let i = 0; i < n; i++) {
        const s = step * 31 + i * 7;
        const bw = quant((0.08 + rand(s + 1) * 0.42) * textW, g);
        const bh = quant((0.35 + rand(s + 2) * 0.85) * g, g / 2) || g / 2;
        const bx = quant(centerX - textW / 2 + rand(s + 3) * (textW - bw), g);
        const by = quant(centerY - capH * 0.85 + rand(s + 4) * capH * 1.3, g);
        ctx.fillRect(bx, by, Math.max(bw, g * 0.5), Math.max(bh, g * 0.45));
      }
    };

    // 플러드: 화면 중앙부를 넓게 덮는 대형 클러스터
    const drawFloodBlocks = (step: number) => {
      const g = capH / 1.5;
      const n = 7 + Math.floor(rand(step * 3.7) * 4);
      ctx.fillStyle = RYZE_INK;
      for (let i = 0; i < n; i++) {
        const s = step * 53 + i * 11;
        const bw = quant((0.6 + rand(s + 1) * 3.2) * g, g);
        const bh = quant((0.8 + rand(s + 2) * 2.2) * g, g);
        const bx = quant(W * 0.06 + rand(s + 3) * (W * 0.88 - bw), g);
        const by = quant(centerY - capH * 2.0 + rand(s + 4) * capH * 3.6, g);
        ctx.fillRect(bx, by, bw, bh);
      }
    };

    // 슬래시 변형: 'Z' 획을 가로지르는 대각 스트로크
    const drawSlash = () => {
      const zPos = letterPositions[2]; // R,Y,Z,E
      const left = centerX + zPos.x;
      const zw = zPos.width;
      ctx.strokeStyle = RYZE_INK;
      ctx.lineWidth = fontSize * 0.055;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(left + zw * 1.06, centerY - capH * 0.62);
      ctx.lineTo(left - zw * 0.10, centerY + capH * 0.62);
      ctx.stroke();
    };

    // 스워시: 워드를 관통하는 필기 플로리시 (레퍼런스 4.68~4.85s 구간)
    const drawSwash = (morph: number) => {
      const x0 = centerX - textW / 2, x1 = centerX + textW / 2;
      const dy = (k: number) => Math.sin(morph * 2.1 + k) * capH * 0.05;
      ctx.strokeStyle = RYZE_INK;
      ctx.lineWidth = fontSize * 0.048;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0 - textW * 0.13, centerY + capH * 0.30 + dy(0));
      ctx.bezierCurveTo(
        x0 + textW * 0.08, centerY - capH * 0.95 + dy(1),
        x0 + textW * 0.34, centerY - capH * 0.42 + dy(2),
        x0 + textW * 0.56, centerY - capH * 0.10 + dy(3)
      );
      ctx.bezierCurveTo(
        x0 + textW * 0.78, centerY + capH * 0.22 + dy(4),
        x1 - textW * 0.02, centerY + capH * 0.05 + dy(5),
        x1 + textW * 0.03, centerY - capH * 0.32 + dy(6)
      );
      // 우측 끝 루프 + 꼬리
      ctx.bezierCurveTo(
        x1 + textW * 0.07, centerY - capH * 0.62 + dy(7),
        x1 - textW * 0.06, centerY - capH * 0.66 + dy(0),
        x1 - textW * 0.04, centerY - capH * 0.36 + dy(1)
      );
      ctx.bezierCurveTo(
        x1 - textW * 0.02, centerY - capH * 0.12 + dy(2),
        x1 + textW * 0.10, centerY + capH * 0.10 + dy(3),
        x1 + textW * 0.15, centerY + capH * 0.34 + dy(4)
      );
      ctx.stroke();
    };

    const render = (t: number) => {
      // 사이클 내 상태 → 렌더 키 (변화 없으면 스킵)
      let key = '';
      let phase: string;
      let step = 0;
      if (t < LEAD_END) {
        phase = 'lead';
        step = t < 83 ? 0 : 1 + Math.floor((t - 83) / 33.4);
        key = `lead${step}`;
      } else if (t < REFINE_STEPS[0]) {
        phase = 'flood';
        step = t < FLOOD_STEPS[1] ? 0 : 1;
        key = `flood${step}`;
      } else if (t < CLEAN_FLASH[0]) {
        phase = 'refine';
        step = 0;
        for (let i = REFINE_STEPS.length - 1; i >= 0; i--) { if (t >= REFINE_STEPS[i]) { step = i; break; } }
        key = `refine${step}`;
      } else if (t < STRETCH[0]) {
        phase = 'cleanflash'; key = 'cleanflash';
      } else if (t < SLASH[0]) {
        phase = 'stretch';
        step = Math.floor((t - STRETCH[0]) / 33.4);
        key = `stretch${step}`;
      } else if (t < SWASH[0]) {
        phase = 'slash';
        step = Math.floor((t - SLASH[0]) / 33.4);
        key = `slash${step}`;
      } else if (t < SETTLE_AT) {
        phase = 'swash';
        step = Math.floor((t - SWASH[0]) / 33.4);
        key = `swash${step}`;
      } else {
        phase = 'settled'; key = 'settled';
      }
      if (key === lastKey) return;
      lastKey = key;

      ctx.clearRect(0, 0, W, H);
      // 캔버스 배경을 항상 불투명 검정으로 채운다 — 그렇지 않으면 정착 스냅샷(toDataURL)이
      // 투명 배경이 되어, 리빌 화면에서 도어/필러 레이어의 '빈' 영역마다 뒤 더미 이미지가
      // 슬릿이 아닌 곳까지 새어 보이는 버그가 생긴다.
      ctx.fillStyle = RYZE_BG;
      ctx.fillRect(0, 0, W, H);
      switch (phase) {
        case 'lead': drawLeadBlocks(step); break;
        case 'flood': drawFloodBlocks(step); break;
        case 'refine': {
          const mc = mosaics[step];
          if (mc) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(mc, 0, 0, mc.width, mc.height, 0, 0, W, H);
            ctx.imageSmoothingEnabled = true;
          }
          break;
        }
        case 'cleanflash': drawWord(1, 1, 0); break;
        case 'stretch': {
          const j = rand(step * 17.3) * 0.06 - 0.03;
          drawWord(1.5 + j, 1.22 + j * 0.5, -3);
          break;
        }
        case 'slash': {
          const j = rand(step * 23.9) * 0.04 - 0.02;
          drawWord(1.16 + j, 1.16 + j, 0);
          // 슬래시는 스케일 좌표계 밖(화면 좌표)에서 근사 — 시각적으로 동일
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(1.16 + j, 1.16 + j);
          ctx.translate(-centerX, -centerY);
          drawSlash();
          ctx.restore();
          break;
        }
        case 'swash':
          drawWord(1, 1, 0);
          drawSwash(step);
          break;
        case 'settled':
          drawWord(1, 1, 0);
          break;
      }
    };

    const start = () => {
      if (disposed) return;
      setup();
      if (W === 0) { raf = requestAnimationFrame(start); return; }

      if (reduced) {
        // 접근성: 모션 최소화 — 글리치 없이 정적 렌더 + CSS 페이드.
        // 이후 흐름(밴드 트랜지션)이 이어지도록 잠시 보여준 뒤 완료 통지.
        drawWord(1, 1, 0);
        canvas.style.transition = 'opacity 0.8s ease';
        canvas.style.opacity = '1';
        completeTimer = window.setTimeout(() => { if (!disposed) onCompleteRef.current?.(); }, 1800);
        return;
      }
      canvas.style.opacity = '1';

      // 정확히 1사이클만 재생: 정착 후 홀드를 거쳐 사이클이 끝나는 지점에서
      // 루프를 멈추고(재글리치 없음) 완료를 통지한다.
      const t0 = performance.now() - INTRO_OFFSET; // 인트로는 플러드부터
      const loop = (now: number) => {
        if (disposed) return;
        const t = now - t0;
        if (t >= CYCLE) {
          render(SETTLE_AT + 1); // 정착 프레임 유지 (lastKey 덕에 재드로잉은 스킵됨)
          onCompleteRef.current?.();
          return;
        }
        render(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    const onResize = () => { setup(); };
    window.addEventListener('resize', onResize);

    // 페이지 진입 시점 기준 0.5초 뒤에 히어로 모션 시작
    let cancelled = false;
    let completeTimer = 0;
    const startTimer = window.setTimeout(() => { if (!cancelled) start(); }, 500);

    return () => {
      disposed = true; cancelled = true;
      clearTimeout(startTimer);
      clearTimeout(completeTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-0" />;
};
