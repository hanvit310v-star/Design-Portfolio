import React, { useEffect, useRef, useState } from 'react';
import { duckRyzeBgmForVideo, fadeRyzeAudio, getImageUrl, unduckRyzeBgm } from './shared';

// 작업물 갤러리가 있는 챕터(Brand & Visuals, Content Design)가 같이 쓰는 갤러리 — 챕터별로 폴더와
// 파일 목록만 다르고 레이아웃은 같다. 양옆 여백(대지) 색은 챕터 페이지 배경과 같아야 경계가 안
// 보여서 한 곳에서 export한다.
const RYZE_GALLERY_DARK_BG = '#161616';
const RYZE_GALLERY_LIGHT_BG = '#F9FAFB';

// [파일명, 세로 px] 목록 — public/RYZE/<folder> 폴더의 파일을 숫자 순서대로 세로로 이어 붙인다
// (29CM/CGV 상세의 PortfolioImages와 같은 "이미지 이어붙이기" 방식). 파일은 원본(가로 3840px)
// 그대로 쓰고 별도 리사이즈/압축을 하지 않는다. 세로 값은 lazy 로딩 중에도 레이아웃이 밀리지 않게
// aspect-ratio를 미리 잡아두는 용도다. 영상(.webm/.mp4)은 해상도가 달라(아래 VIDEO_W) 자기
// 비율로 잡는다.
const BX_ITEMS: [string, number][] = [
  ['1.webp', 2492],
  ['2.webp', 1148],
  ['최종_컬러.webm', 1244], // 3번 자리 — 이미지 대신 영상(1670×1244)
  ['4.webp', 3026],
  ['5.webp', 5402],
  ['6.webp', 5446],
  ['7.webp', 7550],
  ['8.webp', 5032],
  ['9.webp', 4532],
  ['10.webp', 2420],
  ['11.webp', 2202],
  ['12.webp', 3880],
  ['13.webp', 3342],
  ['14.webp', 4544],
  ['15.webp', 5270],
  ['16.webp', 5032],
  ['17.webp', 2890],
  ['18.webp', 2594],
  ['19.webp', 2324],
];
const CT_ITEMS: [string, number][] = [
  ['1.webp', 2484],
  ['2.png', 3426],
  ['3.webp', 4342],
  ['4.webp', 2806],
  ['5.webp', 3632],
];
// Content Design의 Result — 위 메인 컬럼 아래에 간격을 두고, 메인 컬럼과 같은 가로 폭 안에 이미지를
// 묶음(group) 단위로 배치한다. 한 묶음은 여러 줄(row)로 이뤄지고, 한 줄의 칸(cell)들은 폭을 똑같이
// 나눠 갖는다. 칸은 이미지 한 장이거나, 이미지 배열(= 그 칸 안에서 위아래로 쌓임)이다. 줄 안/줄
// 사이는 RESULT_GAP_PX, 묶음과 묶음 사이는 RESULT_GROUP_GAP_PX만큼 띄운다. 영상(.mp4/.webm)도
// 같은 칸에 넣을 수 있다. [파일명, 원본 가로 px, 원본 세로 px].
const RESULT_GAP_PX = 20; // 한 묶음 안의 이미지 사이 간격
const RESULT_GROUP_GAP_PX = 160; // Result 묶음과 묶음 사이 간격
const RESULT_TOP_PX = 360; // 메인 컬럼과 Result 사이 간격
// [파일명, 원본 가로 px, 원본 세로 px].
type ResultImg = [string, number, number];
type ResultCell = ResultImg | ResultImg[];
// 격자(grid) 묶음 — 칸 크기가 서로 다른 레이아웃(예: 키 큰 영상 한 개 + 작은 이미지 여러 장)용.
// columns는 CSS grid-template-columns, 항목의 [열, 행]은 CSS grid-column/grid-row 값이다. 칸이 정해진
// 격자에서는 영상/이미지를 칸 크기에 맞춰 채운다(object-fit: cover — 미세한 높이 차이만 잘린다).
type ResultGridItem = { file: string; col: string; row: string };
type ResultGrid = { columns: string; items: ResultGridItem[] };
type ResultGroup = ResultCell[][] | ResultGrid;
const CT_RESULT_GROUPS: ResultGroup[] = [
  // 6번 시리즈 — 3장 한 줄.
  [
    [
      ['6-1.webp', 1720, 9398],
      ['6-2.webp', 1720, 12818],
      ['6-3.webp', 1720, 9728],
    ],
  ],
  // 7번 시리즈 — 3장 한 줄.
  [
    [
      ['7-1.webp', 2160, 5232],
      ['7-2.webp', 2160, 3840],
      ['7-3.webp', 2160, 5050],
    ],
  ],
  // 8번 — 왼쪽 두 열에 8-S 이미지 3장(위 줄 8-S-1·8-S-2, 아래 줄 8-S-3), 오른쪽 한 열에 키 큰 8-1
  // 영상이 두 줄 높이를 다 차지한다. 열 비율은 시안(스틸 폭 : 영상 폭 ≈ 1 : 1.5)을 따른다.
  {
    columns: '1fr 1fr 1.5fr',
    items: [
      { file: '8-S-1.png', col: '1', row: '1' },
      { file: '8-S-2.png', col: '2', row: '1' },
      { file: '8-S-3.png', col: '1', row: '2' },
      { file: '8-1.mp4', col: '3', row: '1 / span 2' },
    ],
  },
  // 9번 시리즈 — 왼쪽 칸에 9-1 한 장, 오른쪽 칸에 9-2·9-3이 위아래로 함께(3분할).
  [
    [
      ['9-1.webp', 3584, 4800],
      [
        ['9-2.webp', 4050, 4784],
        ['9-3.webp', 1792, 2400],
      ],
    ],
  ],
];

// 컬럼 폭 = min(viewport의 widthPct%, maxPx) — 챕터마다 양옆 여백을 따로 조절할 수 있다.
// bg — 양옆 대지 색. 밝은 대지(light)면 챕터 UI(라벨/목차/버튼/인디케이터)의 글자색을 어둡게 반전한다.
const GALLERIES: Record<
  string,
  { folder: string; items: [string, number][]; result?: ResultGroup[]; widthPct: number; maxPx: number; bg: string }
> = {
  'brand-design': { folder: 'RYZE/bx(webp)', items: BX_ITEMS, widthPct: 62, maxPx: 1400, bg: RYZE_GALLERY_DARK_BG },
  'content-design': { folder: 'RYZE/ct(webp)', items: CT_ITEMS, result: CT_RESULT_GROUPS, widthPct: 66, maxPx: 1500, bg: RYZE_GALLERY_DARK_BG },
};
export const hasRyzeGallery = (slug: string) => slug in GALLERIES;
export const getRyzeGalleryBg = (slug: string) => GALLERIES[slug]?.bg;
export const isRyzeGalleryLight = (slug: string) => GALLERIES[slug]?.bg === RYZE_GALLERY_LIGHT_BG;
// 컬럼의 오른쪽 끝 x(실제 뷰포트 px) — 스크롤 인디케이터 바를 컬럼 바로 옆에 붙이는 데 쓴다.
export const getRyzeGalleryRightEdge = (slug: string, vw: number) => {
  const g = GALLERIES[slug];
  return vw / 2 + Math.min((vw * g.widthPct) / 100, g.maxPx) / 2;
};

// 목차(TOC) 항목 → 클릭 시 스크롤해 갈 갤러리 항목 번호(1부터, 목록 순서 = 화면 순서; 영상 칸도
// 한 칸으로 센다). 목차 UI는 RyzeWorkChapterDetail이 그리고, 여기서는 데이터와 위치 계산만 맡는다.
// image는 메인 컬럼의 N번째 항목, resultGroup는 Result 줄(0부터)의 시작 위치를 가리킨다.
export const RYZE_GALLERY_TOC: Record<string, { label: string; image?: number; resultGroup?: number }[]> = {
  'brand-design': [
    { label: 'Brand Definition', image: 2 },
    { label: 'Logo & Wordmark', image: 8 },
    { label: 'Brand Identity System', image: 10 },
    { label: 'Application', image: 13 },
  ],
  'content-design': [
    { label: 'Content Design System', image: 1 },
    { label: 'Result', resultGroup: 0 },
  ],
};
const galleryItemId = (slug: string, n: number) => `ryze-gallery-${slug}-${n}`;
const galleryResultGroupId = (slug: string, r: number) => `ryze-gallery-${slug}-result-${r}`;
const tocTargetId = (slug: string, item: { image?: number; resultGroup?: number }) =>
  item.resultGroup !== undefined ? galleryResultGroupId(slug, item.resultGroup) : galleryItemId(slug, item.image ?? 1);
export const scrollToRyzeGalleryItem = (slug: string, item: { image?: number; resultGroup?: number }) => {
  const el = document.getElementById(tocTargetId(slug, item));
  if (!el) return;
  window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top, behavior: 'smooth' });
};
// 지금 보고 있는 목차 항목 — 각 항목의 시작 이미지가 화면 위쪽 35% 선에 닿았거나 지나간 것 중
// 마지막 항목. 첫 항목의 이미지보다 위(앞)에서는 첫 항목으로 둔다.
export function useRyzeGalleryActiveToc(slug: string) {
  const toc = RYZE_GALLERY_TOC[slug];
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!toc) return;
    let ticking = false;
    const update = () => {
      const line = window.innerHeight * 0.35;
      let next = 0;
      toc.forEach((item, i) => {
        const el = document.getElementById(tocTargetId(slug, item));
        if (el && el.getBoundingClientRect().top <= line) next = i;
      });
      setActive(next);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [slug, toc]);
  return active;
}

// 소리 있는 영상(withSound)의 재생 음량(0~1) — 페이드인의 목표값. 배경음악(Showroom 기준 1)과의 균형용.
const SOUND_VIDEO_VOLUME = 0.5;
const IMAGE_W = 3840;
const VIDEO_W = 1670;
const isVideo = (file: string) => file.endsWith('.webm') || file.endsWith('.mp4');

// 영상은 페이지에 들어오자마자 재생하지 않고, 스크롤해서 영상이 화면에 보이는 순간 처음부터
// 재생을 시작한다(첫 재생). 한 번 시작한 뒤에는 멈추지 않고 loop로 계속 반복한다 — 그래서
// 관찰은 첫 재생 때만 필요하고, 시작하면 바로 해제한다. 자동 재생은 브라우저 정책상 muted +
// playsInline이어야 허용된다.
const GalleryVideo: React.FC<{
  id?: string;
  src: string;
  aspect?: string;
  boxShadow?: string;
  preload?: 'auto' | 'metadata';
  // fill — 자기 비율 대신 부모 칸(격자)을 꽉 채운다(object-fit: cover).
  fill?: boolean;
  style?: React.CSSProperties;
  // withSound — 소리가 있는 영상. 화면에 보이는 동안만 소리 포함으로 재생하고(그동안 배경음악은
  // 페이드아웃), 화면을 벗어나면 영상을 멈추고 배경음악을 페이드인으로 이어 재생한다.
  withSound?: boolean;
}> = ({ id, src, aspect, boxShadow, preload = 'auto', fill = false, style, withSound = false }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (withSound) {
      // 소리 영상 — 보이는 동안 재생(들어올 때마다 처음부터), 벗어나면 일시정지. 들어올 때 영상 소리는 페이드인,
      // 나갈 때는 페이드아웃. 소리 있는 자동 재생은 브라우저가 사용자 조작(클릭 등) 이전엔 막을 수
      // 있어서, 막히면 음소거로 재생만 하고 배경음악은 그대로 둔다.
      let visible = false;
      const enter = () => {
        el.currentTime = 0; // 화면에 들어올 때마다 처음부터
        el.muted = false;
        if (el.paused) el.volume = 0;
        el.play().then(
          () => {
            if (!visible) return; // 재생 시작 직전에 이미 화면을 벗어난 경우
            duckRyzeBgmForVideo();
            fadeRyzeAudio(el, SOUND_VIDEO_VOLUME, 900);
          },
          () => {
            el.muted = true;
            el.volume = 1;
            el.play().catch(() => {});
          },
        );
      };
      const leave = () => {
        unduckRyzeBgm();
        fadeRyzeAudio(el, 0, 900, () => el.pause());
      };
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting === visible) return;
          visible = entry.isIntersecting;
          if (visible) enter();
          else leave();
        },
        { threshold: 0.3 },
      );
      io.observe(el);
      return () => {
        io.disconnect();
        if (visible) {
          unduckRyzeBgm();
          el.pause();
        }
      };
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.currentTime = 0;
        el.play().catch(() => {});
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [withSound]);
  return (
    <video
      id={id}
      ref={ref}
      src={src}
      className={fill ? 'block w-full h-full object-cover select-none' : 'block w-full h-auto select-none'}
      style={{ aspectRatio: aspect, boxShadow, ...style }}
      muted={!withSound}
      loop
      playsInline
      preload={preload}
      disablePictureInPicture
    />
  );
};

// Behance 작업물 페이지처럼 이미지를 화면 폭 가득이 아니라 가운데 컬럼에 두고 양옆에 대지 여백을
// 남긴다. 컬럼 좌우 끝에는 여백과 구분되도록 그림자를 깐다(이미지끼리 이어지는 세로 경계에는
// 그림자가 생기지 않도록 그림자는 개별 이미지가 아니라 컬럼 전체에 한 번만 준다).
export const RyzeWorkGallery: React.FC<{ slug: string }> = ({ slug }) => {
  const gallery = GALLERIES[slug];
  if (!gallery) return null;
  const colWidth = `min(${gallery.widthPct}%, ${gallery.maxPx}px)`;
  const shadow = '0 0 10px 0 rgba(0,0,0,0.6), 0 0 3px 0 rgba(0,0,0,0.7)';
  return (
    <div className="w-full flex flex-col items-center pt-24 md:pt-28 pb-32" style={{ backgroundColor: gallery.bg }}>
      <div className="flex flex-col" style={{ width: colWidth, boxShadow: shadow }}>
        {gallery.items.map(([file, h], i) =>
          isVideo(file) ? (
            <GalleryVideo key={file} id={galleryItemId(slug, i + 1)} src={getImageUrl(`${gallery.folder}/${file}`)} aspect={`${VIDEO_W} / ${h}`} />
          ) : (
            <img
              key={file}
              id={galleryItemId(slug, i + 1)}
              src={getImageUrl(`${gallery.folder}/${file}`)}
              alt=""
              width={IMAGE_W}
              height={h}
              className="block w-full h-auto select-none"
              style={{ aspectRatio: `${IMAGE_W} / ${h}` }}
              loading={i < 2 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
            />
          ),
        )}
      </div>
      {gallery.result && (
        // 메인 컬럼과 같은 폭 안에서 한 줄의 칸들이 같은 너비로 나눠 갖는다(flex-1) — 그림자는 각 이미지에.
        <div className="flex flex-col" style={{ width: colWidth, marginTop: RESULT_TOP_PX, gap: RESULT_GROUP_GAP_PX }}>
          {gallery.result.map((group, g) => (
            <div key={g} id={galleryResultGroupId(slug, g)} className="flex flex-col" style={{ gap: RESULT_GAP_PX }}>
              {!Array.isArray(group) ? (
                <div className="grid" style={{ gridTemplateColumns: group.columns, gap: RESULT_GAP_PX }}>
                  {group.items.map(({ file, col, row }) => {
                    const src = getImageUrl(`${gallery.folder}/${file}`);
                    const place = { gridColumn: col, gridRow: row, boxShadow: shadow };
                    return isVideo(file) ? (
                      <GalleryVideo key={file} src={src} boxShadow={shadow} preload="metadata" fill style={place} withSound />
                    ) : (
                      <img key={file} src={src} alt="" className="block w-full h-auto select-none" style={place} loading="lazy" decoding="async" draggable={false} />
                    );
                  })}
                </div>
              ) : group.map((row, r) => (
                <div key={r} className="flex items-start" style={{ gap: RESULT_GAP_PX }}>
                  {row.map((cell, c) => {
                    const imgs = Array.isArray(cell[0]) ? (cell as ResultImg[]) : [cell as ResultImg];
                    return (
                      <div key={c} className="flex min-w-0 flex-1 flex-col" style={{ gap: RESULT_GAP_PX }}>
                        {imgs.map(([file, w, h]) =>
                          isVideo(file) ? (
                            // 큰 파일이라 미리 전부 받지 않고(metadata), 화면에 보일 때 재생이 시작되며 받는다.
                            <GalleryVideo key={file} src={getImageUrl(`${gallery.folder}/${file}`)} aspect={`${w} / ${h}`} boxShadow={shadow} preload="metadata" />
                          ) : (
                            <img
                              key={file}
                              src={getImageUrl(`${gallery.folder}/${file}`)}
                              alt=""
                              width={w}
                              height={h}
                              className="block w-full h-auto select-none"
                              style={{ aspectRatio: `${w} / ${h}`, boxShadow: shadow }}
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                            />
                          ),
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
