// RYZE 프로젝트 "Planning" 챕터(및 아직 콘텐츠가 없는 나머지 챕터) 상세 화면.
// App.tsx가 5,400줄이 넘는 단일 파일이 되어 있던 걸 분리한 것 — 이 파일 하나가 Planning의
// 7개 화면(문제 정의 5장 + 페르소나&저니맵 2장), 차트 3종, 페르소나 콜라주를 전부 담는다.
// App.tsx(일반 챕터 공용 셸)와는 src/ryze/shared.tsx를 통해서만 연결된다(순환 참조 방지).
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { RYZE_GALLERY_TOC, RyzeWorkGallery, getRyzeGalleryBg, getRyzeGalleryRightEdge, hasRyzeGallery, isRyzeGalleryLight, scrollToRyzeGalleryItem, useRyzeGalleryActiveToc } from './RyzeWorkGallery';
import { RYZE_TITLE_FONT_CSS } from './RyzeProjectsSection';
import { getImageUrl, hexToRgba, RYZE_BG, RYZE_FONT, RYZE_INK, RyzeDesignScaleLayer, RyzeMusicToggleWithLabel, useRyzeDesignMetrics } from './shared';

const RYZE_WORK_CHAPTERS: { slug: string; title: string }[] = [
  { slug: 'planning', title: 'Planning' },
  { slug: 'brand-design', title: 'Brand & Visuals' },
  { slug: 'content-design', title: 'Content Design' },
];

// 다른 프로젝트 상세 페이지의 TOC 사이드바(점 불릿 + 활성 항목 강조, 나머지는 옅은 톤)와
// 같은 UI를 재사용한다. 아직 실제 스크롤 섹션이 없는 자리표시자 페이지라 스크롤 스파이는
// 없이, 첫 항목을 활성 상태로 고정 표시하는 정적 목차다. Planning만 실제 목차 구성을
// 갖추고, 나머지 챕터는 콘텐츠가 채워지기 전까지 페이지 제목 하나만 보여준다.
const RYZE_WORK_CHAPTER_TOC: Record<string, string[]> = {
  planning: ['문제 정의', '페르소나 & 저니맵', '비즈니스 모델', '프로덕트 로드맵'],
};

// "여성 리더십의 한계와 재부상한 패션 실루엣" 화면 — 사진 대신 본문에 인용된 두 통계(여성
// 고용률 62.1% vs 여성 임원 비율 6.5%)를 첨부 레퍼런스와 같은 아주 심플한 에디토리얼 톤의
// 막대 그래프로 보여준다. 색은 두껍고 끝이 둥근 세로선(line, strokeLinecap="round")
// 하나로만 표현하고, 축·눈금·라벨은 전부 옅은 톤으로 눌러 그래프 자체(막대)만 시선을 받게 한다.
const RYZE_STAT_BARS: { label: string; source: string; value: number }[] = [
  { label: '여성 고용률', source: '국가데이터처, 2024', value: 62.1 },
  { label: '여성 임원 비율', source: '유니코써치, 2025', value: 6.5 },
];

const RyzeStatBarChart: React.FC<{ ink: string }> = ({ ink }) => {
  const maxValue = 70; // 축 상한 — 최대값(62.1%)이 여유 있게 들어가도록.
  const baselineY = 460;
  const chartTop = 60;
  const chartH = baselineY - chartTop;
  // viewBox 아래쪽에 여백(520→552)을 더 둬서, 라벨/출처 텍스트 아래가 박스 하단과
  // 너무 가깝게 붙지 않도록 한다(내용 위치 자체는 그대로, 캔버스만 살짝 더 키움).
  const totalH = 552;

  return (
    <svg viewBox={`0 0 400 ${totalH}`} className="w-full h-full max-w-[420px] mx-auto -mt-5" style={{ overflow: 'visible' }}>
      {/* y축 눈금 + %라벨 — 선(축) 없이 짧은 틱과 숫자만 옅게. */}
      {[0, 20, 40, 60].map((tick) => {
        const y = baselineY - (tick / maxValue) * chartH;
        return (
          <g key={tick}>
            <line x1={36} y1={y} x2={44} y2={y} stroke={ink} strokeOpacity={0.3} strokeWidth={1} />
            <text x={28} y={y + 4} textAnchor="end" className="text-[15px] md:text-[16px]" fill={ink} fillOpacity={0.55} fontFamily={RYZE_FONT}>
              {tick}%
            </text>
          </g>
        );
      })}
      {/* 베이스라인 */}
      <line x1={44} y1={baselineY} x2={380} y2={baselineY} stroke={ink} strokeOpacity={0.3} strokeWidth={1} />
      {/* 막대 — 첨부 레퍼런스처럼 두껍고 끝이 둥근 세로선 하나로만 표현. */}
      {RYZE_STAT_BARS.map((s, i) => {
        const x = 130 + i * 180;
        const barTop = baselineY - (s.value / maxValue) * chartH;
        return (
          <g key={s.label}>
            <line x1={x} y1={baselineY} x2={x} y2={barTop} stroke={ink} strokeWidth={16} strokeLinecap="round" />
            <text x={x} y={barTop - 18} textAnchor="middle" className="text-[15px] md:text-[16px]" fontWeight={700} fill={ink} fontFamily={RYZE_FONT}>
              {s.value}%
            </text>
            <text x={x} y={baselineY + 38} textAnchor="middle" className="text-[15px] md:text-[16px]" fontWeight={600} fill={ink} fontFamily={RYZE_FONT}>
              {s.label}
            </text>
            <text x={x} y={baselineY + 66} textAnchor="middle" className="text-[15px] md:text-[16px]" fontWeight={500} fill={ink} fillOpacity={0.65} fontFamily={RYZE_FONT}>
              {s.source}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// 이코노미스트 '유리천장지수' 인사이트 — 첨부 레퍼런스의 구성(상단 0~100 눈금축 + 나라별
// 가로 막대 + 한국 강조)만 가져오고, 표현 방식은 이 페이지의 다른 그래프와 같은 아주 심플한
// 에디토리얼 톤(색 없이 두껍고 끝이 둥근 선 하나, 옅은 톤 vs 짙은 톤으로만 강조 구분)으로
// 만든다. 국가는 상위(스웨덴·핀란드·노르웨이)와 하위(일본·한국)만 추려서 격차를 대비시킨다.
// 값은 실제 지수 원자료가 아니라 본문에 인용된 수치(28위 한국)를 기준으로 한 예시적 스케일이다.
const RYZE_GLASS_CEILING_ROWS: { country: string; value: number; highlight?: boolean }[] = [
  { country: '스웨덴', value: 8 },
  { country: '핀란드', value: 11 },
  { country: '노르웨이', value: 14 },
  { country: '일본', value: 71 },
  { country: '한국', value: 88, highlight: true },
];

const RyzeGlassCeilingChart: React.FC<{ ink: string }> = ({ ink }) => {
  const rows = RYZE_GLASS_CEILING_ROWS;
  const rowH = 32;
  const chartLeft = 76;
  const chartRight = 380;
  const chartW = chartRight - chartLeft;
  const titleY = 16;
  const subtitleY = titleY + 22; // 제목 바로 아래 출처 표기
  const firstRowY = subtitleY + 44; // 제목/출처와 첫 나라 행 사이 간격
  const rowsEndY = firstRowY + (rows.length - 1) * rowH;
  const axisY = rowsEndY + 30; // 0~100 기준선을 한국(마지막 행) 아래로, 간격을 두고 배치
  const footnoteY = axisY + 49;
  const totalH = footnoteY + 10;

  const xScale = (v: number) => chartLeft + (v / 100) * chartW;

  // "스웨덴"은 오른쪽 정렬(textAnchor="end")이라 폰트 폭에 따라 왼쪽 끝(글자 "스"가
  // 시작하는 실제 x)이 매번 달라진다. 그 실제 렌더링된 왼쪽 끝을 getBBox()로 측정해,
  // 제목 "유리천장지수"의 시작 x를 거기에 정확히 맞춘다(다른 나라 라벨의 정렬은 건드리지 않음).
  const swedenLabelRef = useRef<SVGTextElement>(null);
  const [titleX, setTitleX] = useState<number | null>(null);
  useEffect(() => {
    if (swedenLabelRef.current) {
      setTitleX(swedenLabelRef.current.getBBox().x);
    }
  }, []);

  return (
    <svg
      viewBox={`0 0 400 ${totalH}`}
      preserveAspectRatio="xMinYMid meet"
      className="w-full h-full max-w-[440px] ml-4"
      style={{ overflow: 'visible' }}
    >
      {/* 제목 — 한국 막대와 같은 색(짙은 ink, 불투명)으로. 측정된 titleX(="스웨덴"의 "스"
          왼쪽 끝)가 나오기 전까지는 깜빡임 없이 opacity 0으로 숨겨둔다. */}
      <text
        x={titleX ?? 0}
        y={titleY}
        textAnchor="start"
        className="text-[15px] md:text-[16px]"
        fontWeight={700}
        letterSpacing={1}
        fill={ink}
        fillOpacity={titleX === null ? 0 : 1}
        fontFamily={RYZE_FONT}
      >
        유리천장지수
      </text>
      {/* 출처 — 제목 바로 아래, 같은 왼쪽 정렬선(titleX)에 옅은 톤으로. 위쪽 그래프의
          "국가데이터처, 2024" 출처 폰트 크기(11)와 동일하게 맞춘다. */}
      <text
        x={titleX ?? 0}
        y={subtitleY}
        textAnchor="start"
        className="text-[15px] md:text-[16px]"
        fontWeight={500}
        fill={ink}
        fillOpacity={titleX === null ? 0 : 0.65}
        fontFamily={RYZE_FONT}
      >
        The Economist, 2025
      </text>

      {/* 나라별 막대 — 두껍고 끝이 둥근 선 하나로, 한국만 짙게(불투명)·나머지는 옅게. */}
      {rows.map((row, i) => {
        const y = firstRowY + i * rowH;
        return (
          <g key={row.country}>
            <text
              ref={i === 0 ? swedenLabelRef : undefined}
              x={chartLeft - 10}
              y={y + 5}
              textAnchor="end"
              className="text-[15px] md:text-[16px]"
              fontWeight={row.highlight ? 800 : 500}
              fill={ink}
              fillOpacity={row.highlight ? 1 : 0.6}
              fontFamily={RYZE_FONT}
            >
              {row.country}
            </text>
            {/* strokeLinecap="round"는 끝을 x1보다 strokeWidth/2만큼 더 왼쪽으로 부풀리므로,
                x1을 그만큼 오른쪽으로 밀어줘야 막대의 실제 왼쪽 끝이 0~100 기준선의 "0"
                눈금과 정확히 맞는다. */}
            <line
              x1={chartLeft + (row.highlight ? 6 : 3.5)}
              y1={y}
              x2={xScale(row.value)}
              y2={y}
              stroke={ink}
              strokeOpacity={row.highlight ? 1 : 0.3}
              strokeWidth={row.highlight ? 12 : 7}
              strokeLinecap="round"
            />
            <text
              x={xScale(row.value) + 12}
              y={y + 5}
              className="text-[15px] md:text-[16px]"
              fontWeight={row.highlight ? 700 : 500}
              fill={ink}
              fillOpacity={row.highlight ? 0.9 : 0.55}
              fontFamily={RYZE_FONT}
            >
              {row.value}
            </text>
          </g>
        );
      })}

      {/* 0~100 기준선 — 한국(마지막 행) 아래로 간격을 두고 배치. 그리드선 없이 짧은 틱과
          숫자만 옅게. */}
      {[0, 50, 100].map((tick) => {
        const x = xScale(tick);
        return (
          <g key={tick}>
            <line x1={x} y1={axisY - 4} x2={x} y2={axisY + 4} stroke={ink} strokeOpacity={0.3} strokeWidth={1} />
            <text x={x} y={axisY + 20} textAnchor="middle" className="text-[15px] md:text-[16px]" fill={ink} fillOpacity={0.55} fontFamily={RYZE_FONT}>
              {tick}
            </text>
          </g>
        );
      })}
      <line x1={chartLeft} y1={axisY} x2={chartRight} y2={axisY} stroke={ink} strokeOpacity={0.3} strokeWidth={1} />
      {/* 기준선 각주 — 한국 막대와 같은 색(짙은 ink, 불투명)으로 맞추고, "100" 눈금에 우측 정렬. */}
      <text x={chartRight + 9} y={footnoteY} textAnchor="end" className="text-[15px] md:text-[16px]" fill={ink} fillOpacity={1} fontFamily={RYZE_FONT}>
        100 = 최악 (가장 낮은 성평등/유리천장)
      </text>
    </svg>
  );
};

// "기업 내 성별 승진 격차" — 차장급 여성/남성 비율, 임원급 증가율(남성 150% vs 여성 20%)을
// 도넛 두 개로 비교한다. 각 도넛은 하나의 원(링) 안에서 여성·남성이 서로의 상대적 비중만큼
// 호(arc)를 나눠 갖는 구조(첨부 레퍼런스와 같은 "하나의 서클" 구성) — 두 값의 합을 100%로
// 보고, 여성 몫(진한 톤, 12시 시작 위치)을 남성 몫(옅은 톤)보다 시각적으로 강조한다.
// 이 섹션의 서사(여성 리더십의 한계)가 남성 중심이 아니라 여성 쪽에 초점이 맞도록,
// 색 위계·범례 순서 모두 여성을 먼저·진하게 둔다. 실제 숫자는 항상 라벨로 그대로 보여준다.
const RYZE_PROMOTION_GAP_DONUTS: { title: string; male: number; female: number }[] = [
  { title: '차장급 성별 비율', male: 7.0, female: 4.3 },
  { title: '임원급 증가율', male: 150, female: 20 },
];

const RyzePromotionGapChart: React.FC<{ ink: string }> = ({ ink }) => {
  const R = 42;
  const cx = 60;
  const cy = 56;
  const stroke = 14;
  const gap = 170; // 도넛 하나가 차지하는 가로 폭
  const circ = 2 * Math.PI * R;
  // 실제 콘텐츠(도넛 그룹의 translate(70) + 범례 텍스트 y=cy+R+44=142)는 세로로 212까지
  // 내려가는데, viewBox가 190으로 더 짧으면 preserveAspectRatio가 "짧은 박스" 기준으로
  // 중앙 정렬을 계산해버려 실제로는 아래로 쏠려 보인다. 실제 콘텐츠 높이에 맞춰 viewBox를
  // 늘려야 세로 중앙 정렬이 진짜로 맞는다. 제목-범례 간격을 넓히고 범례를 2줄로 쌓으면서
  // 콘텐츠가 더 아래로 내려가 236 → 290으로 늘렸다.
  const totalH = 290;

  return (
    <svg
      viewBox={`0 0 400 ${totalH}`}
      preserveAspectRatio="xMinYMid meet"
      className="w-full h-full max-w-[420px] ml-12"
      style={{ overflow: 'visible', transform: 'translateY(4px)' }}
    >
      {/* 제목 + 출처 */}
      <text x={0} y={16} className="text-[15px] md:text-[16px]" fontWeight={700} fill={ink} fillOpacity={1} fontFamily={RYZE_FONT}>
        기업 내 성별 승진 격차
      </text>
      <text x={0} y={38} className="text-[15px] md:text-[16px]" fontWeight={500} fill={ink} fillOpacity={0.65} fontFamily={RYZE_FONT}>
        한국여성정책연구원(KWDI), 2026
      </text>

      {RYZE_PROMOTION_GAP_DONUTS.map((d, i) => {
        const groupCx = 50 + i * gap;
        const total = d.male + d.female;
        const femaleFrac = d.female / total;
        const femaleLen = circ * femaleFrac;
        const maleLen = circ - femaleLen;
        // 두 호 사이에 아주 살짝 틈(gapPx)을 둬서 각 몫이 하나로 뭉개져 보이지 않게 한다.
        const gapPx = 3;
        return (
          <g key={d.title} transform={`translate(${groupCx}, 66)`}>
            {/* 배경 트랙 */}
            <circle cx={cx - 50} cy={cy} r={R} fill="none" stroke={ink} strokeOpacity={0.08} strokeWidth={stroke} />
            {/* 여성 몫 — 진한 톤(강조), 12시 방향부터 시계방향으로. 남성 중심이 아니라
                여성 쪽에 시각적 위계(더 진한 색 + 시작 위치)를 실어준다. */}
            <circle
              cx={cx - 50}
              cy={cy}
              r={R}
              fill="none"
              stroke={ink}
              strokeOpacity={0.9}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, femaleLen - gapPx)} ${circ}`}
              transform={`rotate(-90 ${cx - 50} ${cy})`}
            />
            {/* 남성 몫 — 옅은 톤, 여성 몫이 끝나는 지점부터 이어서 */}
            <circle
              cx={cx - 50}
              cy={cy}
              r={R}
              fill="none"
              stroke={ink}
              strokeOpacity={0.25}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, maleLen - gapPx)} ${circ}`}
              transform={`rotate(${-90 + femaleFrac * 360} ${cx - 50} ${cy})`}
            />
            {/* 도넛 제목 — 원형 그래프와의 간격을 더 넓힘(34 → 44). */}
            <text x={cx - 50} y={cy + R + 44} textAnchor="middle" className="text-[15px] md:text-[16px]" fontWeight={600} fill={ink} fillOpacity={0.8} fontFamily={RYZE_FONT}>
              {d.title}
            </text>
            {/* 여/남 값 범례 — 제목과의 간격을 넓히고(56 → 76), 가로 2열 대신 여성 위·남성
                아래로 세로 2줄로 쌓았다(여성을 먼저, 진한 톤으로). 두 줄 사이 간격은 32는
                너무 벌어져 보여 26으로 살짝 좁혔다. 불릿(cx=-46)과 텍스트(x=-38)는 두 줄
                모두 같은 x라 항상 좌측 정렬이 맞는데, 그 둘 사이 간격(8)이 너무 붙어 보여서
                텍스트를 오른쪽으로 밀어(-38 → -30) 여유를 줬다. 두 도넛(차장급/임원급) 모두
                이 map 안에서 같은 코드로 그려지므로 정렬 값도 항상 동일하다. */}
            <g transform={`translate(${cx - 50}, ${cy + R + 76})`}>
              {/* 임원급 증가율(두 번째 도넛, i===1) 범례만 불릿+텍스트를 함께 오른쪽으로 10
                  밀어달라는 요청 — 이전엔 텍스트만 옮겨서 불릿과 텍스트 사이 간격이 벌어져
                  버렸다. 불릿 cx와 텍스트 x 둘 다 같은 offset을 더해 한 덩어리로 이동시킨다.
                  차장급 도넛(i===0)은 그대로 둔다. */}
              <circle cx={-46 + (i === 1 ? 10 : 0)} cy={-3.5} r={4} fill={ink} fillOpacity={0.9} />
              <text x={-30 + (i === 1 ? 10 : 0)} y={0} className="text-[15px] md:text-[16px]" fontWeight={600} fill={ink} fillOpacity={0.9} fontFamily={RYZE_FONT}>
                여성 {d.female}%
              </text>
              <circle cx={-46 + (i === 1 ? 10 : 0)} cy={22.5} r={4} fill={ink} fillOpacity={0.3} />
              <text x={-30 + (i === 1 ? 10 : 0)} y={26} className="text-[15px] md:text-[16px]" fill={ink} fillOpacity={0.6} fontFamily={RYZE_FONT}>
                남성 {d.male}%
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

// 연구 인용 카드 — "여성 리더십과 성 고정관념 연구 동향" 타이틀, 저자 출처(백연정, ...)를
// 보조 타이틀로, 그리고 본문 인용구를 이 사이트에서 쓰는 폰트 그대로 이탤릭으로 보여준다.
// 다른 그래프 카드들과 같은 타이포 크기(제목 12px bold, 출처 11px 옅은 톤)를 그대로 따른다.
const RyzeLeadershipQuoteCard: React.FC<{ ink: string }> = ({ ink }) => (
  <div className="w-full h-full flex flex-col justify-center pl-12" style={{ fontFamily: RYZE_FONT }}>
    <div className="text-[15px] md:text-[16px] font-bold" style={{ color: ink }}>
      여성 리더십과 성 고정관념 연구 동향
    </div>
    <div className="mt-1 text-[15px] md:text-[16px]" style={{ color: ink, opacity: 0.65 }}>
      백연정, 2024
    </div>
    {/* 박스가 가로로 넓어진 만큼, 인용구는 줄바꿈 없이 한 줄로. */}
    <p className="mt-3 text-[15px] md:text-[16px] font-semibold italic leading-relaxed whitespace-nowrap" style={{ color: ink, opacity: 0.85 }}>
      결단력이나 추진력 같은 '리더의 자질' 자체가 남성적인 이미지로 굳어져 있다 보니, 평가 기준부터 이미 불균형이 발생한다.
    </p>
  </div>
);

// 그래프 카드 래퍼 — 옅은 회색 박스 안에 그래프를 담아, 첨부하신 배치 예시처럼 "박스 하나 =
// 그래프 하나"인 카드형 그리드를 만든다. 박스 색은 페이지 배경(#F9FAFB, 쿨톤)과 어울리는
// 쿨톤 회색(#E7E9EC)으로 맞춘다 — 예전 배경이 #F5F5F0(웜톤)일 때 맞춰뒀던 #DFDFDC(마찬가지로
// 웜톤)를 그대로 두면, 쿨톤 배경 위에서 누렇게 들떠 보인다.
const RyzeChartCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div
    className={`rounded-xl p-6 flex items-center justify-center overflow-hidden ${className}`}
    style={{ backgroundColor: '#E7E9EC' }}
  >
    {children}
  </div>
);

// 비즈니스 모델 캔버스(9블록) 데이터 — 사용자가 준 레퍼런스 표의 텍스트를 그대로 옮겼다.
// lines(항목을 줄마다 나열)와 paragraph(한 덩어리 줄글) 중 하나만 쓰고, footnote는 더 옅은
// 톤의 보충 설명(가치 제안/고객 세그먼트에만 있음).
const RYZE_BMC_BLOCKS: { title: string; lines?: string[]; paragraph?: string; footnote?: string }[] = [
  {
    title: '핵심 파트너십',
    lines: ['패브릭 · 원단 공급업체', '메탈릭 하드웨어 제작 업체', '패션위크·아트페어 주최측', '물류 · 풀필먼트 업체'],
  },
  { title: '핵심 활동', lines: ['시즌 컬렉션 기획 및 제작', '브랜드 콘텐츠 제작'] },
  { title: '핵심 자원', lines: ['브랜드 아이덴티티(로고, 세계관)', 'D2C 자사몰'] },
  {
    title: '가치 제안',
    paragraph: '각진 테일러드 라인과 메탈릭 디테일이 만든 시각적 시그니처',
    footnote: '상세 근거 — 문제 정의 참조',
  },
  { title: '고객 관계', lines: ['시즌 드롭 방식으로 희소성 유지', '재구매율 · 객단가(AOV) 중심 관리'] },
  {
    title: '채널',
    lines: ['D2C 자사몰 단독 운영', '인스타그램 콘텐츠 채널', '온라인 커머스 플랫폼', '플래그십 스토어'],
  },
  {
    title: '고객 세그먼트',
    paragraph: 'C-Level, 크리에이티브 디렉터, 전문직 여성',
    footnote: '상세 페르소나 — 페르소나 & 저니맵 참조',
  },
  {
    title: '비용 구조',
    paragraph: '원단·부자재 및 제작 인건비, 메탈릭 하드웨어 제작비, 오프라인 매장 운영비(임차료·인건비 등), 자사몰 운영 및 물류비',
  },
  {
    title: '수익원',
    paragraph:
      '코어 라인(시그니처 포멀웨어) 및 진입 라인(메탈릭 액세서리) 판매. 세컨드 라인 · 카테고리 확장을 통한 수익 다각화 계획',
  },
];

// 캔버스 한 칸 — 어두운 배경(화면 전체가 검정이라 카드는 그보다 살짝 밝은 회색) + 제목(굵게,
// 밝은색) + 내용(항목 리스트 또는 줄글, 옅은 회색) + 선택적 각주(더 옅은 톤). 스크롤에 들어오면
// 아래에서 위로(y:40→0) 이즈아웃으로, index에 따라 순서대로 살짝씩 늦게(스태거) 나타난다.
const RyzeBmcCard: React.FC<{
  title: string;
  lines?: string[];
  paragraph?: string;
  footnote?: string;
  index: number;
  className?: string;
}> = ({ title, lines, paragraph, footnote, index, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 44 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.3 }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
    className={`rounded-2xl p-5 flex flex-col overflow-hidden ${className}`}
    style={{ backgroundColor: '#181818' }}
  >
    <p style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 700, fontSize: ppx(19), color: '#F9FAFB' }}>
      {title}
    </p>
    <div
      className="mt-4 flex flex-col gap-3"
      style={{ color: 'rgba(249,250,251,0.75)', fontFamily: "'Pretendard', sans-serif", fontWeight: 400, fontSize: ppx(19), lineHeight: `${ppx(29)}px`, letterSpacing: `${ppx(0.19)}px` }}
    >
      {lines ? lines.map((l, i) => <p key={i}>{l}</p>) : <p>{paragraph}</p>}
    </div>
    {footnote && (
      <p
        className="mt-3"
        style={{ color: 'rgba(249,250,251,0.4)', fontFamily: "'Pretendard', sans-serif", fontWeight: 400, fontSize: ppx(15), lineHeight: `${ppx(22)}px` }}
      >
        {footnote}
      </p>
    )}
  </motion.div>
);

// 프로덕트 로드맵(NOW/NEXT/LATER) 데이터 — 피그마 레퍼런스(node 2900:486)의 텍스트를 그대로
// 옮겼다. bullets의 note는 본문과 이어 붙는 옅은 톤 괄호 설명(예: "(아이덴티티·세계관)")이라
// 텍스트에서 분리해뒀다 — RyzeRoadmapColumn에서 dim 처리해 이어 붙인다.
const RYZE_ROADMAP_COLUMNS: {
  title: string;
  goal: string;
  feasibility: string;
  question: string;
  bullets: { text: string; note?: string }[];
  prerequisite: string;
}[] = [
  {
    title: 'NOW',
    goal: '브랜드가 시장에 존재하기 위한 최소 조건 확보',
    feasibility: 'High',
    question: '"만들 수 있는가"',
    bullets: [
      { text: '브랜드가 일관된 정체성을 가지고 있는가', note: '(아이덴티티·세계관)' },
      { text: '시그니처적인 제작 역량을 실제로 조달할 수 있는가' },
      { text: '고객에게 물건을 전달할 최소 채널이 존재하는가', note: '(자사몰)' },
    ],
    prerequisite: 'NONE — 이 작업이 막히면 다음 진행이 불가능한 최우선 과제',
  },
  {
    title: 'NEXT',
    goal: '타겟 고객이 실제로 반응하는 채널·제품 조합 발견',
    feasibility: 'Medium',
    question: '"팔리는가?, 어디서 더 잘 팔리는가?"',
    bullets: [
      { text: '코어 제품(고관여) 단독으로 구매 장벽을 넘을 수 있는가, 진입 제품(저관여)이 필요한가' },
      { text: '온라인(자사몰)과 오프라인 매장 중 타겟(C-Level, 크리에이티브 디렉터)이 어디에 더 반응하는가' },
      { text: '희소성 기반 드롭 전략이 재구매·입소문을 만드는가' },
    ],
    prerequisite: 'NOW 결과 기반',
  },
  {
    title: 'LATER',
    goal: '검증된 것을 발판으로 브랜드 영역을 넓힐 방향 탐색',
    feasibility: 'Low',
    question: '"어디까지 넓힐 수 있는가"',
    bullets: [
      { text: 'A : 오프라인 매장 강하게 반응 → off 경험 중심 확장', note: '(플래그십 스토어, 팝업, 편집숍 입점 확대)' },
      { text: 'B : 자사몰, 드롭 모델 강하게 반응 → 온라인 카테고리 확장' },
      { text: '공통 필요 조건 : 물류·풀필먼트 정식화', note: '(시나리오 무관)' },
    ],
    prerequisite: 'NEXT 결과 기반, 실행안 미확정',
  },
];

// 로드맵 텍스트 등장 타이밍 — 이 화면은 스크롤 스냅(smooth scrollTo ~0.7s)으로 "도달"하는데,
// 기본값(화면에 30%만 걸쳐도 재생)이면 화면이 아직 스크롤로 들어오는 중에 모션이 이미 끝나
// 버려 너무 빨리 재생되는 것처럼 보였다. 요소가 90% 이상 보일 때(= 거의 도달했을 때)만
// 트리거하고, 남은 스크롤 시간만큼 추가 delay를 줘서 화면이 완전히 멈춘 뒤 재생되게 한다.
const RYZE_ROADMAP_ARRIVAL_AMOUNT = 0.9;
const RYZE_ROADMAP_ARRIVAL_DELAY = 0.1;

const RYZE_ROADMAP_KEY_ASSUMPTIONS = [
  '코어 타겟은 온라인보다 오프라인 경험에 더 반응할 것이라 가정',
  '진입 라인이 있어야 코어 라인의 구매 장벽을 완충할 것이라 가정',
  '채널 검증(NEXT) 없이 카테고리로부터 확장하면 브랜드 시그니처가 희석될 리스크가 있다고 가정',
];

// 로드맵 한 칸(NOW/NEXT/LATER) — 큰 타이틀만 "BRAND EXPERIENCE JOURNEY" 제목과 같은 규격
// (RYZE_FONT/Satoshi, 700, ppx(24.823))을 쓰고, 그 아래 목표/실행 가능성/검증 질문/선행 조건은
// 전부 위 라벨·본문 스타일(페르소나 규격)을 그대로 재사용한다.
const RyzeRoadmapColumn: React.FC<{
  title: string;
  goal: string;
  feasibility: string;
  question: string;
  bullets: { text: string; note?: string }[];
  prerequisite: string;
  index: number;
  last?: boolean;
}> = ({ title, goal, feasibility, question, bullets, prerequisite, index, last = false }) => (
  <motion.div
    {...ryzeRevealUp(RYZE_ROADMAP_ARRIVAL_DELAY + index * 0.1, RYZE_ROADMAP_ARRIVAL_AMOUNT)}
    className="flex-1 h-full px-10 md:px-14 flex flex-col justify-center"
    style={{ gap: ppx(48), ...(!last ? { borderRight: '1px solid #0A0A0A' } : undefined) }}
  >
    <p style={{ fontFamily: RYZE_FONT, fontWeight: 700, fontSize: ppx(24.823), letterSpacing: `${ppx(0.5)}px`, color: '#0A0A0A' }}>
      {title}
    </p>
    <div className="flex flex-col" style={{ gap: ppx(56) }}>
      <div className="flex flex-col" style={{ gap: ppx(10) }}>
        <p style={RYZE_ROADMAP_LABEL_STYLE}>목표</p>
        <p style={RYZE_ROADMAP_BODY_STYLE}>{goal}</p>
      </div>
      <div className="flex flex-col" style={{ gap: ppx(10) }}>
        <p style={RYZE_ROADMAP_LABEL_STYLE}>실행 가능성</p>
        <p style={RYZE_ROADMAP_BODY_STYLE}>{feasibility}</p>
      </div>
      <div className="flex flex-col" style={{ gap: ppx(10) }}>
        <p style={RYZE_ROADMAP_LABEL_STYLE}>검증 질문</p>
        <p style={RYZE_ROADMAP_BODY_STYLE}>{question}</p>
        <ul className="flex flex-col" style={{ gap: ppx(12), marginTop: ppx(4) }}>
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start" style={{ gap: ppx(8) }}>
              <span style={{ ...RYZE_ROADMAP_BODY_STYLE, flexShrink: 0 }}>·</span>
              <span style={RYZE_ROADMAP_BODY_STYLE}>
                {b.text}
                {b.note && <span style={{ display: 'block', color: 'rgba(10,10,10,0.4)' }}>{b.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col" style={{ gap: ppx(10) }}>
        <p style={RYZE_ROADMAP_LABEL_STYLE}>선행 조건</p>
        <p style={RYZE_ROADMAP_BODY_STYLE}>{prerequisite}</p>
      </div>
    </div>
  </motion.div>
);

// Planning "문제 정의" 5개 화면(파워드레싱 인트로/설명, 여성 리더십, 상징적 소비, The Dawn of
// RYZE.)이 전부 재사용하는 좌측 텍스트 컬럼 — 화면마다 사진/차트/캐러셀 등 우측(또는 배경)
// 비주얼은 서로 다르지만, 이 텍스트 블록(제목 → 출처(선택) → 본문 단락들 → 인용 콜아웃(선택))의
// 위치·타이포·모션 타이밍은 5개 화면 모두 동일해서 하나로 통합한다. subtitle(출처 표기) 유무에
// 따라 본문 위 간격(mt-16/mt-12)과 등장 딜레이가 달라지는 것도 원본 그대로 재현한다.
const RyzePlanningTextColumn: React.FC<{
  ink: string;
  title: string;
  subtitle?: string;
  paragraphs: string[];
  quote?: string;
}> = ({ ink, title, subtitle, paragraphs, quote }) => (
  <div className="absolute left-6 md:left-12 top-64 md:top-80 max-w-[520px] md:max-w-[620px]">
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="mt-3 text-base md:text-lg font-bold leading-relaxed"
      style={{ color: ink, fontFamily: RYZE_FONT }}
    >
      {title}
    </motion.p>
    {subtitle && (
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        className="mt-2 text-[15px] md:text-[16px] leading-[1.6]"
        style={{ color: ink, opacity: 0.75, fontFamily: RYZE_FONT }}
      >
        {subtitle}
      </motion.p>
    )}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: subtitle ? 0.4 : 0.3 }}
      className={`${subtitle ? 'mt-16' : 'mt-12'} flex flex-col gap-4 text-[15px] md:text-[16px] leading-[1.6]`}
      style={{ color: ink, opacity: 0.75, fontFamily: RYZE_FONT }}
    >
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </motion.div>
    {quote && (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: subtitle ? 0.5 : 0.4 }}
        className="mt-20 flex items-stretch gap-4"
      >
        <div className="w-1 shrink-0" style={{ backgroundColor: '#0A0A0A', transform: 'skewX(-20deg)' }} />
        <p
          className="text-[15px] md:text-[16px] font-medium italic leading-relaxed whitespace-nowrap"
          style={{ color: ink, fontFamily: RYZE_FONT }}
        >
          {quote}
        </p>
      </motion.div>
    )}
  </div>
);

// Planning "문제 정의" 화면(사진/차트/캐러셀 등 비주얼 종류와 무관하게) 2~5번째가 공통으로 쓰는
// 바깥 껍데기 — 화면 높이(designCanvasH)와 이음매 처리(-mt-px + overflow-hidden)만 담당한다.
// 첫 화면(파워드레싱 인트로)은 !isPlanning일 때의 "Coming soon" 자리표시자와 같은 자리를
// 공유하는 특수 구조라 이 래퍼를 쓰지 않고 그대로 둔다.
const RyzePlanningScreen: React.FC<{ designCanvasH: number; children: React.ReactNode }> = ({ designCanvasH, children }) => (
  <div className="ryze-planning-screen relative shrink-0 -mt-px overflow-hidden" style={{ height: designCanvasH }}>
    {children}
  </div>
);

// "사진 한 장 + 텍스트 컬럼"만으로 구성되는 화면(파워드레싱 설명/상징적 소비)의 사진 —
// left/top/width 공식은 전부 동일하고, 화면마다 반올림 오차 보정용 세로 오버사이즈(heightPad)만
// 다르다.
const RyzePlanningPhotoVisual: React.FC<{ src: string; heightPad?: number; loading?: 'lazy' }> = ({
  src,
  heightPad = 4,
  loading,
}) => (
  <motion.img
    src={getImageUrl(src)}
    alt=""
    loading={loading}
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: false, amount: 0.3 }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="absolute object-cover pointer-events-none select-none"
    style={{ left: 918, top: -2, width: 'calc(100% - 920px - 420px + 4px)', height: `calc(100% + ${heightPad}px)` }}
  />
);

// 이 화면(RyzeWorkChapterDetail)은 스크롤 위치(activeSection)·Dawn 캐러셀 인덱스 등 자주
// 바뀌는 state를 여러 개 들고 있는데, 그때마다 이미 다 그려진 차트 4개까지 매번 다시
// 렌더링될 이유가 없다 — 네 컴포넌트 모두 항상 같은 리터럴 문자열(ink="#0A0A0A")만
// 받으므로 memo로 그 불필요한 리렌더를 건너뛴다.
const RyzeStatBarChartMemo = React.memo(RyzeStatBarChart);
const RyzeGlassCeilingChartMemo = React.memo(RyzeGlassCeilingChart);
const RyzePromotionGapChartMemo = React.memo(RyzePromotionGapChart);
const RyzeLeadershipQuoteCardMemo = React.memo(RyzeLeadershipQuoteCard);

// Planning 여섯 번째 화면(페르소나 & 저니맵)용 더미 데이터 — 앞선 리서치(파워 드레싱 재부상,
// 여성 리더십의 구조적 한계)에서 자연스럽게 이어지는 가상의 타깃 페르소나 한 명.
const RYZE_PERSONA = {
  nameKo: '강혜인',
  nameEn: 'Hyein Kang',
  age: '34Y',
  role: 'CMO / 스타트업 코파운더',
  backstory:
    '대기업 마케팅팀에서 리더로 8년간 일하며 성과를 냈지만, 승진 심사 때마다 "구심력이 부족하다", "임팩트가 약하다"는 애매한 피드백을 들었다. 성과는 숫자로 남아도 평가는 늘 다른 이유로 미뤄졌다. 결국 조직에서 인정받는 방식 자체를 바꾸기로 하고 퇴사해 창업했다. 지금은 본인이 곧 회사의 얼굴이자 대표 인격이다 — 투자자 앞에 서고, 인터뷰를 하고, 팀의 방향을 제시한다. 능력을 증명하는 것과 드러나 보이게 만드는 것은 별개의 문제라는 걸 그 과정에서 체득했다.',
  values: [
    { label: '자기주도적', desc: '조직의 평가 기준을 기다리기보다, 스스로 자리를 만들고 그에 맞는 존재감을 설계하는 쪽을 택한다.' },
    { label: '정교함의 미학', desc: '꼼꼼한 마감과 정교한 실루엣이, 타협 없이 완벽을 기하는 자신의 업무 방식과 닮아있다고 느낀다.' },
    { label: '트렌드세터', desc: '클래식한 테일러드만으로는 충분하지 않다고 느낀다. 특히 크롬, 실버 같은 메탈릭 질감에 끌리는데, 남들과 같은 것을 입지 않겠다는 성향에서 비롯된다. 무난하고 예측 가능한 선택보다, 흔치 않고 낯선 디테일을 소화하는 쪽을 택함으로써 자신만의 고유함을 드러내고 싶어한다.' },
  ],
  touchpoints: [
    { label: '키노트 강연 전', desc: '무대에 오르기 전, 옷차림이 심리적으로도 준비 상태를 만들어준다고 느낀다.' },
    { label: '투자 유치 미팅', desc: '짙은 숄더라인이 협상 테이블에서의 존재감에 영향을 준다고 생각한다.' },
    { label: '패션위크/아트페어', desc: "업무 밖에서는 '일하는 사람'이 아닌, 고유한 감각을 가진 개인으로 읽히길 원한다." },
  ],
};

// 유저 페르소나 + 저니맵 화면 — 2026-09-18 Figma 디자인(각각 node 2886:56, 2897:249,
// 파일 FbrDBrAKA1w8Srjjc9XPfg)으로 교체. 두 화면 모두 같은 2405px 폭 프레임이라 ppx() 배율
// 하나를 공유한다 — 다른 Planning 화면(문제 정의 5장)에는 전혀 영향을 주지 않는다.
const RYZE_PERSONA2_FIGMA_SCALE = 2560 / 2405;
const ppx = (n: number) => n * RYZE_PERSONA2_FIGMA_SCALE;

// 프로덕트 로드맵 화면 전용 — 페르소나(RyzePersonaInfoRow)·저니맵 오버레이와 정확히 같은
// 폰트 규격. 라벨은 Pretendard 700, 본문은 Pretendard 400, 둘 다 fontSize ppx(19)/lineHeight
// ppx(29)에 본문만 letterSpacing ppx(0.19)까지 동일하게 맞췄다. 로드맵은 밝은 배경(#F9FAFB)
// 화면이라 색만 어두운 잉크(#0A0A0A)로 둔다.
const RYZE_ROADMAP_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Pretendard', sans-serif",
  fontWeight: 700,
  fontSize: ppx(19),
  lineHeight: `${ppx(29)}px`,
  color: '#0A0A0A',
};
const RYZE_ROADMAP_BODY_STYLE: React.CSSProperties = {
  fontFamily: "'Pretendard', sans-serif",
  fontWeight: 400,
  fontSize: ppx(19),
  lineHeight: `${ppx(29)}px`,
  letterSpacing: `${ppx(0.19)}px`,
  color: '#0A0A0A',
};

// 저니맵 화면 전체(타이틀+화살표+노드 다이어그램)를 묶은 블록의 축소 배율. 피그마 원본
// 크기가 1이고, 이 값 하나만 바꾸면 블록 전체(폰트 크기 포함)가 같이 커지거나 작아지며,
// 세로 중앙 정렬(아래 바깥 박스 높이 계산)도 자동으로 같이 맞춰진다.
const JOURNEY2_GROUP_SCALE = 0.85;
// 타이틀(피그마 원본 top=137)부터 노드 다이어그램 그룹(피그마 원본 top=318)까지의 간격.
const JOURNEY2_BLOCK_TOP_GAP = 318 - 137;
// 블록 전체의 디자인 좌표 기준 높이(타이틀 top=0부터 다이어그램 하단까지) — JOURNEY2_GROUP_SCALE로
// 스케일하기 전의 원본 크기다.
const JOURNEY2_BLOCK_H = JOURNEY2_BLOCK_TOP_GAP + 928;
// 사진 패널의 왼쪽 경계 — 피그마 원본은 1255였다. 흰 배경 영역을 좁혔다가(1100) 살짝
// 다시 오른쪽으로 넓혔다(사진 패널 폭은 2405 - JOURNEY2_PHOTO_LEFT로 자동 계산).
const JOURNEY2_PHOTO_LEFT = 1140;
// 흰 배경 영역(0 ~ JOURNEY2_PHOTO_LEFT) 안에서 블록을 가로로도 정중앙에 두기 위한 보정값.
// 브라우저에서 실제 렌더된 콘텐츠(라벨 텍스트 폭까지 포함한 진짜 바운딩 박스)를 실측해
// 구했다 — 라벨 중 "Purchase"가 중앙 정렬(translateX(-50%))이라 숫자 원(137)보다 더
// 왼쪽으로 튀어나오고, 화살표 장식이 가장 오른쪽까지 나가는 게 기준이 됐다.
const JOURNEY2_BLOCK_OFFSET_X = 48.74;

// "문제 정의" 화면(RyzePlanningTextColumn)의 텍스트와 똑같은 "아래→위 페이드인" 등장 모션 —
// 화면(뷰포트)에 30% 이상 들어올 때마다(once:false) 16px 아래에서 올라오며 나타난다. 페르소나
// 화면의 텍스트 덩어리들(이름/직함, 백스토리, 타이틀, 가치관/접점 제목·목록)이 전부 같은 값을
// 쓰고 delay만 다르게(순서대로) 줘서 한 군데서 관리한다.
const ryzeRevealUp = (delay: number, amount = 0.3) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
});

// "가치관"/"RYZE와의 접점" 목록 한 행 — 굵은 라벨(고정폭 컬럼)과 일반 설명을 나란히 배치한다.
// 피그마 원본은 행마다 라벨-설명 사이 gap이 제각각(78/58/78, 84/84/53px)이었는데, 실측해보면
// 전부 "라벨폭+gap"의 합이 섹션 안에서 항상 같았다(가치관=161px, RYZE와의 접점=192px) —
// 즉 실제 의도는 "설명 칸이 항상 같은 x에서 시작하는 고정 2단 컬럼"이었다. 라벨을 고정폭
// 컬럼에 넣는 편이 매 행 다른 gap 숫자를 하드코딩하는 것보다 이 의도를 정확히 재현한다.
const RyzePersonaInfoRow: React.FC<{ label: string; desc: string; labelWidth: number }> = ({
  label,
  desc,
  labelWidth,
}) => (
  <div className="flex items-start" style={{ width: ppx(862) }}>
    <p
      className="shrink-0"
      style={{ width: ppx(labelWidth), fontFamily: "'Pretendard', sans-serif", fontWeight: 700, fontSize: ppx(19), lineHeight: `${ppx(29)}px`, color: '#0A0A0A' }}
    >
      {label}
    </p>
    <p
      className="shrink-0"
      style={{ width: ppx(862 - labelWidth), fontFamily: "'Pretendard', sans-serif", fontWeight: 400, fontSize: ppx(19), lineHeight: `${ppx(29)}px`, letterSpacing: `${ppx(0.19)}px`, color: '#0A0A0A' }}
    >
      {desc}
    </p>
  </div>
);

// 섹션 제목("가치관"/"RYZE와의 접점") + 그 아래 검정 밑줄 한 줄 — 피그마의 얇은 Line 5 SVG는
// 순수 1px 검정 직선이라(stroke="black") 에셋 없이 border로 그대로 재현한다.
const RyzePersonaSectionHeading: React.FC<{ title: string }> = ({ title }) => (
  <div>
    {/* 밑줄(width 1005)은 제목보다 6px 왼쪽에서 시작해 더 넓게 걸쳐 있어, 제목만 marginLeft로
        살짝 들여 정렬한다. */}
    <p className="whitespace-nowrap" style={{ marginLeft: ppx(6), fontFamily: RYZE_FONT, fontWeight: 700, fontSize: ppx(24.823), color: '#0A0A0A' }}>
      {title}
    </p>
    <div style={{ width: ppx(1005), height: 0, marginTop: ppx(19), borderTop: `${ppx(1)}px solid #000000` }} />
  </div>
);

// 왼쪽 인물 패널 — 사진(크롭은 피그마와 동일하게 -99px 오프셋한 오버사이즈 이미지를
// overflow-hidden으로 자르는 방식) + 하단 그라디언트 스크림 + 이름/직함 + 백스토리 문단.
const RyzePersonaPhotoPanel: React.FC = () => (
  <div className="absolute overflow-hidden" style={{ left: 0, top: 0, width: ppx(901), height: '100%' }}>
    {/* object-fit: cover로 패널을 항상 위아래 빈틈 없이 꽉 채운다 — 피그마 프레임(1383px)
        기준의 고정 left/width 오프셋을 쓰면 실제 섹션 높이가 그와 달라질 때 사진이 짧아져
        위아래에 배경색 여백이 남았다. object-position(75% = 피그마 크롭 99/132 비율과 동일)으로
        가로 크롭 지점만 피그마와 동일하게 고정한다. */}
    {/* left/top을 살짝 음수로, width/height를 calc(100% + Npx)로 오버사이즈해 scale 트랜스폼
        반올림 오차로 생기는 좌측 모서리의 얇은 흰 틈(패널 배경색이 비쳐 보임)을
        overflow-hidden이 흡수하게 한다 — 문제 정의 사진 배경들과 같은 패턴. */}
    <img
      src={getImageUrl('RYZE/카드 이미지 샘플.webp')}
      alt=""
      className="absolute w-full h-full object-cover"
      style={{ left: -2, top: -2, width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', objectPosition: '75% center' }}
    />
    {/* 그라디언트도 패널과 정확히 같은 폭(100%)·하단 정렬로 — 피그마 원본은 913px(패널
        901px보다 넓음)이었는데 실제로는 패널 폭과 같아야 사진 경계 밖으로 삐져나오지 않는다. */}
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none"
      style={{
        height: `${(564 / 1383) * 100}%`,
        background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.72) 54.327%, rgba(0,0,0,0) 100%)',
      }}
    />
    {/* 이름/직함/백스토리를 하나의 컬럼으로 묶어 패널 "하단"에서부터 고정 거리(bottom)로
        앉힌다 — 예전엔 top: ppx(933)/ppx(1093)처럼 피그마 프레임 높이(1383px) 기준 절대
        top 값을 썼는데, 사진 패널 높이를 실제 화면 높이(designCanvasH)에 맞춰 채우도록
        바꾼 뒤로는 그 값이 실제 패널 높이와 어긋나(주로 짧아져) 백스토리 문단이 패널
        아래로 밀려나 overflow-hidden에 잘려 보이는 문제가 있었다. bottom 고정이면 패널
        높이가 얼마든 항상 같은 위치에 안정적으로 보인다. */}
    <div className="absolute flex flex-col text-white" style={{ left: ppx(81), bottom: ppx(130), width: ppx(740), gap: ppx(86) }}>
      <motion.div {...ryzeRevealUp(0.2)} className="flex flex-col" style={{ gap: ppx(21) }}>
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 700, fontSize: ppx(24.82) }}>
          {RYZE_PERSONA.nameKo} ({RYZE_PERSONA.nameEn}), {RYZE_PERSONA.age}
        </p>
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 700, fontSize: ppx(19) }}>{RYZE_PERSONA.role}</p>
      </motion.div>
      {/* wordBreak: keep-all — 한글은 기본값(break-word)이면 폭이 빠듯할 때 "임팩트가"처럼
          단어 중간에서 줄바꿈된다. 어절(공백) 단위로만 줄바꿈되게 고정한다. */}
      <motion.p
        {...ryzeRevealUp(0.3)}
        style={{
          fontFamily: "'Pretendard', sans-serif",
          fontWeight: 400,
          fontSize: ppx(19),
          lineHeight: `${ppx(32)}px`,
          wordBreak: 'keep-all',
        }}
      >
        {RYZE_PERSONA.backstory}
      </motion.p>
    </div>
  </div>
);

// 마지막(일곱 번째) 화면 — "Brand Experience Journy" 6단계 여정. 피그마 레퍼런스(node
// 2897:249, 같은 파일)로 교체 — AIDA류 6단계(Awareness→Interest→Consideration→Purchase→
// Experience→Retention)를 구불구불한 경로로 잇는 노드 다이어그램. 원+연결선은 피그마가
// 내려준 SVG(journey2-path.svg)를 그대로 쓴다 — 부드러운 S자 베지어 곡선이라 손으로 다시
// 그리면 오차가 생기기 쉽다(숫자 1~6은 SVG 밖에서 별도 텍스트로 얹는다, 피그마 원본도 동일
// 구조). 원 중심좌표(journey2-path.svg의 6개 circle/ellipse cx/cy에 컨테이너 오프셋
// left:139,top:318을 더한 값)를 기준으로 숫자는 cy-18, 라벨은 그 아래 배치하는 패턴이지만
// 여섯 번째(Retention)만 피그마 원본 자체가 4px 어긋나 있어 패턴화하지 않고 각 좌표를
// 그대로 하드코딩했다(사용자가 요청한 "정확히 가져오기"를 우선한다).
const RYZE_JOURNEY2_STAGES: {
  num: string;
  numLeft: number;
  numTop: number;
  label: string;
  labelLeft: number;
  labelTop: number;
  // 원 중심 기준 64x64 flex 정중앙 배치를 해도, 숫자 글리프마다 폰트 자체의 잉크 무게중심이
  // 달라(예: "1"은 세로획 하나뿐이라 시각적으로 왼쪽에 붙어 보이고, "4"/"6"은 위아래 비대칭
  // 곡선 때문에 아래로 처져 보인다) 눈으로 보고 스테이지별로 미세 보정한 값. 대부분 0.
  numNudgeX?: number;
  numNudgeY?: number;
}[] = [
  { num: '1', numLeft: 594, numTop: 332, label: 'Awareness', labelLeft: 594, labelTop: 393, numNudgeX: -0.3 },
  { num: '2', numLeft: 1011.5, numTop: 458, label: 'Interest', labelLeft: 1011.5, labelTop: 519, numNudgeX: 1 },
  { num: '3', numLeft: 574.5, numTop: 584, label: 'Consideration', labelLeft: 574.5, labelTop: 645 },
  { num: '4', numLeft: 169, numTop: 710, label: 'Purchase', labelLeft: 169, labelTop: 771, numNudgeY: 0 },
  { num: '5', numLeft: 598.5, numTop: 836, label: 'Experience', labelLeft: 598.5, labelTop: 897, numNudgeX: -0.2, numNudgeY: -1.2 },
  { num: '6', numLeft: 1011, numTop: 962, label: 'Retention', labelLeft: 1011, labelTop: 1019, numNudgeY: 0 },
];

// Interest(2)/Purchase(4)/Retention(6)는 연결선 곡선이 라벨 자리를 그대로 지나간다. 라벨
// 위치는 옮기지 않고, 대신 연결선 쪽에 라벨의 실제 렌더 박스(브라우저에서 실측)만 살짝 여유를
// 두고 배경색(#F9FAFB)으로 덮어 구멍을 낸다 — 선이 라벨에 닿기 전에 끊겼다가 지나간 뒤 다시
// 이어지는 것처럼 보인다. 처음엔 "곡선이 지나는 넓은 구간"을 통째로 지웠더니 글자 근처만이
// 아니라 원-라벨 사이 선 전체가 끊긴 것처럼 과하게 보였다 — 라벨 자체의 바운딩박스(실측)에
// 딱 맞는 작은 창으로 줄였다. top은 반드시 해당 원의 아래쪽 끝(circleBottom = numTop-268,
// 6개 원 모두 반지름 32 기준)과 정확히 일치해야 한다 — 이보다 낮으면(원과 창 사이 틈) 원과
// 창 사이에 실선이 짧게 삐져나와 보이고(2/4에서 있었던 문제), 이보다 높으면(원과 겹침) 배경색
// 사각형이 원의 아랫부분을 덮어 원이 잘린 것처럼 보인다(6에서 있었던 문제).
const JOURNEY2_LABEL_LINE_GAP: Record<string, { left: number; top: number; width: number; height: number }> = {
  '2': { left: 954, top: 190, width: 115, height: 60 },
  '4': { left: 103, top: 442, width: 135, height: 60 },
  '6': { left: 941, top: 694, width: 139, height: 56 },
};

// 저니맵 원(1~6) 클릭 시 사진 위에 뜨는 상세 콘텐츠 — 사용자가 준 AIDA 표(인지/관심/탐색/
// 구매/경험/재구매 6단계, Action/Feeling/Touchpoint)를 그대로 옮겼다. 4번(구매)·5번(경험)은
// 표에 Touchpoint 칸이 비어 있어 빈 문자열로 둔다.
const RYZE_JOURNEY2_OVERLAY: Record<string, { koLabel: string; enLabel: string; action: string; feeling: string; touchpoint: string }> = {
  '1': {
    koLabel: '인지', enLabel: 'Awareness',
    action: '패션위크/아트페어에서 RYZE 착장을 목격',
    feeling: '"저 실루엣, 낯선데 눈을 뗄 수가 없어"',
    touchpoint: '오프라인 이벤트 SNS 태그된 콘텐츠',
  },
  '2': {
    koLabel: '관심', enLabel: 'Interest',
    action: '인스타그램에서 RYZE 계정 팔로우, 브랜드 스토리 탐색',
    feeling: '로고의 상징인 북극성(North Star), 궤도(Orbit) 서사에 공감',
    touchpoint: 'SNS 콘텐츠, 브랜드 매니페스토',
  },
  '3': {
    koLabel: '탐색', enLabel: 'Consideration',
    action: '웹사이트 방문, 소재·핏·가격대 확인',
    feeling:
      '"이 정도 완성도라면 투자할 가치가 있다."\n\n특히 메탈릭 하드웨어, 크롬 디테일을 유심히 살피며, 이런 디테일이야말로 흔한 브랜드에서는 보기 힘든, RYZE만의 고유함이라고 느낀다.',
    touchpoint: 'SNS 콘텐츠, 브랜드 매니페스토',
  },
  '4': {
    koLabel: '구매', enLabel: 'Purchase',
    action: '온라인 구매 / 오프라인 매장 방문 구매',
    feeling: '중요한 이벤트(투자 유치 등)를 앞두고 결정',
    touchpoint: '온라인 자사몰 · 커머스 플랫폼, 플래그십 스토어',
  },
  '5': {
    koLabel: '경험', enLabel: 'Experience',
    action: '강연, 투자 미팅 자리에서 실제 착용',
    feeling: '존재감과 확신을 시각적으로 체감',
    touchpoint: '',
  },
  '6': {
    koLabel: '재구매', enLabel: 'Retention',
    action: '시즌 드롭 알림 구독, 신제품 재구매',
    feeling: 'RYZE를 자신의 "시그니처"로 인식',
    touchpoint: '이메일/SNS 시즌 알림',
  },
};


// 스크롤 진행률 표시 — "스크롤이 가능하다"와 "얼마나 남았다"를 한 번에 보여주는 얇은 세로
// 트랙+썸(thumb). 트랙(옅은 톤, 전체 스크롤 가능 범위)은 항상 화면에 고정돼 있고, 그 위의
// 썸(진한 톤)은 뷰포트가 전체 문서에서 차지하는 비율만큼의 길이로, 스크롤한 위치에 맞춰
// 위→아래로 움직인다. 브라우저 기본 스크롤바와 같은 원리라 설명 없이도 바로 이해된다.
const RYZE_SCROLL_PROGRESS_TRACK_H = 280; // px — h-[280px]와 반드시 같은 값이어야 한다.

const RyzeScrollProgress: React.FC<{
  color: string;
  rightClassName?: string;
  // 트랙 위치를 right 클래스 대신 직접 지정할 때(예: Brand 갤러리 컬럼 바로 옆) — 주면 right 클래스는 무시된다.
  style?: React.CSSProperties;
  thumbColor?: string;
  sectionLimit?: number;
  forceHidden?: boolean;
}> = ({
  color,
  rightClassName = 'right-6 md:right-12',
  style,
  thumbColor = '#0A0A0A',
  sectionLimit,
  forceHidden = false,
}) => {
  const [visible, setVisible] = useState(false); // 스크롤할 내용이 있을 때만 표시
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 스크롤 위치(progress)는 매 프레임 바뀌는 값이라, 이걸 React state로 들고 있으면
    // setState → 리렌더 → 커밋을 스크롤 중 계속 반복하게 되어 미세한 버벅임의 원인이 된다.
    // (requestAnimationFrame으로 호출 빈도를 프레임당 1회로 줄여도, 리액트 리렌더 자체의
    // 비용은 여전히 남는다.) 그래서 progress는 state로 두지 않고, ref로 잡은 DOM 노드의
    // style.transform/height를 rAF 안에서 직접 바꾼다 — 리렌더 없이 컴포지터 레이어만
    // 갱신되므로(top/height % 대신 transform 사용) 훨씬 매끄럽다.
    //
    // sectionLimit — Planning처럼 한 페이지 안에 화면 단위로 이어 붙인 서로 다른 목차
    // 섹션(문제 정의 / 페르소나 & 저니맵 / ...)이 있을 때, 진행률을 문서 전체 스크롤
    // 높이가 아니라 "지금 속한 섹션이 차지하는 화면 수(sectionLimit)"만으로 계산한다 —
    // 그래야 문제 정의 구간 안에서는 정확히 그 5화면만 기준으로 0~100%가 채워지고, 뒤에
    // 다른 섹션(페르소나 & 저니맵 등)이 이어 붙어도 그만큼 진행률이 끌려가지 않는다.
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const vh = window.innerHeight;
      const totalH = sectionLimit ? sectionLimit * vh : doc.scrollHeight;
      const scrollable = totalH - vh;
      const hasScroll = scrollable > 0;
      setVisible((prev) => (prev === hasScroll ? prev : hasScroll));
      if (!hasScroll || !thumbRef.current) return;
      const thumbRatio = Math.min(1, vh / totalH);
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      const thumbH = thumbRatio * RYZE_SCROLL_PROGRESS_TRACK_H;
      const y = progress * (RYZE_SCROLL_PROGRESS_TRACK_H - thumbH);
      thumbRef.current.style.height = `${thumbH}px`;
      thumbRef.current.style.transform = `translateY(${y}px)`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sectionLimit]);

  // 예전엔 visible=false일 때 트랙/썸 DOM 자체를 return null로 안 그렸는데, 그러면 마운트 직후
  // useEffect의 첫 update() 호출 시점엔 아직 (visible이 true로 리렌더되기 전이라) thumbRef.current가
  // null이라 썸의 height/transform을 못 정해주고 그냥 빠져나갔다 — 그래서 실제로 스크롤 이벤트가
  // 한 번 발생해야만(다음 update() 호출에서야 비로소 ref가 존재) 썸이 나타나 보이는 버그였다.
  // 이제 DOM은 항상 그려두고 visible만으로 표시 여부를 CSS로 제어해, 마운트 첫 프레임부터
  // thumbRef가 항상 존재하도록 한다.
  //
  // 트랙에 CSS opacity를 직접 주면 그 안의 썸(자식)까지 곱연산으로 함께 옅어져 버려서
  // "짙은 사각형"이 안 보이는 원인이었다 — 트랙은 반투명 배경색(hexToRgba)으로, 썸은
  // 불투명한 원래 색 그대로 둬서 서로 대비가 확실히 나게 분리한다. 썸(짙은 부분)은 페이지
  // 톤(color prop)과 무관하게 항상 #0A0A0A 고정.
  //
  // forceHidden — Planning에서 "문제 정의" 구간을 벗어나(페르소나 & 저니맵 등) 더 이상 이
  // 트랙이 의미 없어질 때, 부모가 아예 언마운트해버리면 트랜지션 없이 뚝 끊겨 사라진다.
  // 그 대신 계속 마운트한 채 opacity만 0으로 내려, 아래 transition-opacity로 부드럽게
  // 사라지게 한다(visible=false로 스크롤할 내용이 없을 때와 동일하게 처리).
  return (
    <div
      className={`hidden md:block fixed ${style ? '' : rightClassName} bottom-24 w-2 h-[280px] pointer-events-none transition-opacity duration-500 ease-out ${visible && !forceHidden ? '' : 'opacity-0'}`}
      style={{ backgroundColor: hexToRgba(color, 0.15), ...style }}
    >
      <div ref={thumbRef} className="absolute left-0 top-0 w-2" style={{ backgroundColor: thumbColor, willChange: 'transform' }} />
    </div>
  );
};

// Overview 히어로(RyzeOverviewHero)와 같은 방식의 "스크롤 스냅"(휠 입력을 가로채 화면 단위로
// 딱딱 넘어가게 만드는 스크롤락) 훅. 자연스러운 관성 스크롤 대신, 휠 한 번에 정확히 한 화면씩
// smooth scrollTo로 이동시키고, 그 애니메이션이 끝나기 전까지는 추가 휠 입력을 완전히 삼켜서
// "탁" 걸리는 듯한 스냅감을 만든다.
// 섹션 사이 이음매(-mt-px, RyzeWorkChapterDetail 본문 섹션들)는 디자인 좌표계에서 1px를
// 겹쳐서(이음매에 배경색이 실낱같이 비치는 걸 막으려고) 스케일 레이어 안에 들어있다 —
// 그래서 화면에 실제로 그려지는 섹션 하나의 세로 폭은 innerHeight(vh)가 아니라
// "vh - (1px × designScale)"만큼 살짝 더 짧다. 예전엔 이 훅이 그냥 vh 배수로만 스크롤
// 위치를 계산해서, 스크롤할수록(=겹침이 여러 번 누적될수록) 실제 섹션 경계보다 점점
// 더 아래로 스크롤하게 됐고, 그 오차만큼 다음 섹션이 화면 맨 아래에 미리 비쳐 보였다
// (해상도가 클수록 1px가 스케일되어 더 크게 보여 더 눈에 띄었다). vh 대신 실제 한 섹션의
// 스크롤 보폭(step)을 써서 이 드리프트를 없앤다.
function useRyzeSectionSnapScroll(sectionCount: number, enabled: boolean, designScale: number = 0) {
  const snapping = useRef(false);

  useEffect(() => {
    if (!enabled || sectionCount <= 1) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      if (snapping.current) { e.preventDefault(); return; }
      const dir = e.deltaY > 0 ? 1 : -1;
      const step = window.innerHeight - designScale;
      const current = Math.round(window.scrollY / step);
      const next = Math.min(sectionCount - 1, Math.max(0, current + dir));
      if (next === current) return; // 맨 위/맨 아래에서는 그냥 흘려보낸다(브라우저 기본 동작).
      e.preventDefault();
      snapping.current = true;
      window.scrollTo({ top: next * step, behavior: 'smooth' });
      window.setTimeout(() => { snapping.current = false; }, 700);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [sectionCount, enabled, designScale]);
}

// 화면(섹션) 단위로 딱딱 넘어가는 스냅 스크롤과 짝을 이루는 스크롤스파이 — 지금 몇 번째
// 화면을 보고 있는지를 스크롤 위치로부터 계산한다. 각 섹션이 정확히 한 화면 높이(h-screen)
// 라서, scrollY를 화면 높이로 나눈 값을 반올림하기만 하면 된다.
function useRyzeActiveSection(sectionCount: number, designScale: number = 0): number {
  const [active, setActive] = useState(0);
  // 지금 보고 있는 섹션 번호를 "진짜 스크롤"이 일어날 때만 갱신해 기억해둔다(resize에는
  // 반응하지 않음) — 창 크기가 바뀌는 순간엔 리플로우 때문에 window.scrollY 자체가 브라우저에
  // 의해 먼저 흔들릴 수 있어서, 그 시점의 scrollY로 "몇 번째 섹션이었는지"를 거꾸로 계산하면
  // 틀리기 쉽다. 대신 마지막으로 "정상적으로 스크롤해서 도달한" 섹션 번호를 이 ref에 담아두고,
  // 해상도가 바뀌면 이 값을 그대로 믿고 새 step 기준 위치로 다시 스크롤한다.
  const activeRef = useRef(0);
  const prevStepRef = useRef<number | null>(null);
  // 창 크기를 드래그로 연속해서 바꾸면 resize 이벤트가 짧은 시간에 여러 번(많으면 수십 번)
  // 연달아 발생하고, 그때마다 이 effect가 다시 돈다. 매번 즉시 교정하면 그 scrollTo 자체가
  // 낸 'scroll' 이벤트를, 아직 리플로우가 다 안 끝난 상태에서 onScroll이 주워 잘못 반올림해
  // activeRef를 엉뚱한 번호로 "확정"해버리는 경우가 있었다(그 뒤로는 그 틀린 번호를 계속
  // 진짜인 것처럼 재사용). 그래서 (1) step이 바뀐 걸 감지한 즉시 suppressRef를 켜서 그 사이
  // 모든 scroll 이벤트를 무시하고, (2) 실제 교정은 짧게 디바운스해 창 크기 변경이 완전히
  // 멎은 뒤 마지막 한 번만 수행한다.
  const suppressRef = useRef(false);
  const resizeTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const step = window.innerHeight - designScale;
    const update = () => {
      const i = Math.min(sectionCount - 1, Math.max(0, Math.round(window.scrollY / step)));
      activeRef.current = i;
      setActive(i);
    };
    // RyzeScrollProgress와 같은 이유로 requestAnimationFrame으로 프레임당 한 번만 반영한다.
    let ticking = false;
    const onScroll = () => {
      if (suppressRef.current) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };
    if (prevStepRef.current != null && prevStepRef.current !== step) {
      suppressRef.current = true;
      if (resizeTimerRef.current != null) window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = window.setTimeout(() => {
        // 디바운스가 끝난 시점의 "진짜" step으로 다시 계산한다 — 타이머를 건 순간과 실행되는
        // 순간 사이에도 창 크기가 더 바뀌었을 수 있어서다.
        const settledStep = window.innerHeight - designScale;
        window.scrollTo({ top: activeRef.current * settledStep, behavior: 'auto' });
        window.setTimeout(() => { suppressRef.current = false; }, 250);
      }, 350);
    } else if (!suppressRef.current) {
      // suppressRef가 켜져 있다는 건 방금 교정 타이머를 건 참(또는 아직 정착 대기 중)이라는
      // 뜻이다 — 이 시점에 여기로 들어오는 건 대부분 React StrictMode의 개발 모드 effect
      // 이중 실행(mount→cleanup→remount)으로, prevStepRef가 이미 최신 step으로 갱신된 채라
      // "안 바뀐 것처럼" 보여 이 분기를 타게 된다. 그대로 update()를 부르면 아직 리플로우가
      // 안 끝난 window.scrollY로 activeRef를 잘못 덮어써 버리므로, 교정이 끝날 때까지는
      // 건너뛴다.
      update();
    }
    prevStepRef.current = step;
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionCount, designScale]);
  return active;
}

// "The Dawn of RYZE." 화면(다섯 번째 화면) 이미지 — 여러 장을 화살표로 넘겨볼 수 있게 배열로
// 둔다. dark: 이 사진의 우상단(카운터 배지가 놓이는 자리) 영역이 어두운 톤인지 여부 —
// 어두우면 배지 글자를 밝은 색(#F9FAFB)으로, 밝으면 어두운 색(#0A0A0A)으로 반전해 항상
// 사진 위에서 또렷이 읽히게 한다.
const RYZE_DAWN_IMAGES: { src: string; dark: boolean }[] = [
  { src: 'RYZE/KakaoTalk_20260908_231704246.webp', dark: true },
  { src: 'RYZE/KakaoTalk_20260909_011001610.webp', dark: false },
];

// Planning 화면(0~6)별로 좌측 모서리(고정 "PLANNING" 라벨/"Back to Work" 버튼 자리)가 어두운
// 배경 위에 있는지 여부 — 어두우면 글자를 밝은 색(#F9FAFB), 아니면 어두운 색(#0A0A0A)으로
// 반전해 항상 또렷이 읽히게 한다. 문제 정의 5화면(0~4)은 사진이 오른쪽(left-920px~)에서
// 시작해 왼쪽 모서리는 항상 밝은 페이지 배경이다. 페르소나 화면(5)은 사진 패널이 화면
// 왼쪽 전체(0~901/2405)를 차지해 모서리가 어둡다. 저니맵 화면(6)은 반대로 왼쪽이 밝은
// 패널(#F9FAFB)이고 사진은 오른쪽(1255~2405)에만 있어 모서리가 다시 밝다. 비즈니스 모델
// 화면(7)은 화면 전체가 어두운 풀블리드 배경이라 항상 어둡다. 프로덕트 로드맵 화면(8)은
// 다시 밝은 페이지 배경(#F9FAFB)이라 모서리도 밝다.
const RYZE_PLANNING_DARK_CORNER_SECTIONS = [false, false, false, false, false, true, false, true, false];

// 우측 목차(TOC)는 좌측 모서리와 반대쪽 끝(화면 실제 오른쪽 가장자리)에 fixed로 떠 있어서,
// 어느 배경 위에 있는지가 좌측 모서리와 다르게 갈린다. 문제 정의 5화면(0~4)은 사진 오른쪽 끝과
// 실제 화면 오른쪽 끝 사이에 페이지 배경(밝음)이 남는 여백이 있어 TOC는 항상 그 위(밝음). 페르
// 소나 화면(5)은 사진 패널이 왼쪽에만 있고 오른쪽은 밝은 정보 패널이라 TOC 자리도 밝다. 저니맵
// 화면(6)은 반대로 사진이 화면 오른쪽 끝까지 꽉 채워 TOC가 그 사진(어두움) 위에 있다.
// 비즈니스 모델(7)은 화면 전체가 어두워 TOC도 어둡고, 프로덕트 로드맵(8)은 다시 밝다.
const RYZE_TOC_DARK_CORNER_SECTIONS = [false, false, false, false, false, false, true, true, false];

const RyzeWorkChapterDetail: React.FC = () => {
  const { chapter } = useParams();
  const navigate = useNavigate();
  const idx = Math.max(0, RYZE_WORK_CHAPTERS.findIndex((c) => c.slug === chapter));
  const current = RYZE_WORK_CHAPTERS[idx] ?? RYZE_WORK_CHAPTERS[0];
  // Planning 챕터만 밝은 배경(#F9FAFB)을 쓴다 — 다른 챕터와 톤이 다르므로, 텍스트도
  // 기존 RYZE_INK(밝은 색, 어두운 배경 전용)가 아니라 어두운 잉크로 반전해 가독성을 맞춘다.
  const isPlanning = current.slug === 'planning';
  // 작업물 갤러리가 있는 챕터(Brand, Content) — 어두운 대지 배경 + 가운데 이미지 컬럼 + 컬럼 옆 스크롤 바.
  const isGallery = hasRyzeGallery(current.slug);
  // 밝은 대지의 갤러리(Content)는 Planning처럼 어두운 잉크로 UI를 그린다.
  const isLightPage = isPlanning || isRyzeGalleryLight(current.slug);
  const vw = document.documentElement.clientWidth;
  const bg = isPlanning ? '#F9FAFB' : isGallery ? getRyzeGalleryBg(current.slug) : RYZE_BG;
  const ink = isLightPage ? RYZE_BG : RYZE_INK;
  // 갤러리 챕터 중 목차 항목마다 스크롤 대상 이미지가 정해진 것(Brand) — 항목 클릭 시 그 이미지로
  // 스크롤하고, 스크롤 위치에 맞춰 활성 항목이 바뀐다.
  const galleryToc = RYZE_GALLERY_TOC[current.slug];
  const galleryActiveToc = useRyzeGalleryActiveToc(current.slug);
  const tocItems = galleryToc ? galleryToc.map((g) => g.label) : (RYZE_WORK_CHAPTER_TOC[current.slug] ?? [current.title]);
  // Planning은 문제 정의 5화면 + 페르소나 화면 + 저니맵 화면 + 비즈니스 모델 화면 +
  // 프로덕트 로드맵 화면, 총 9화면.
  const sectionCount = isPlanning ? 9 : 1;
  // Planning 전체를 2560-폭 캔버스로 보고 뷰포트 폭에 맞춰 균일하게 축소/확대한다(자세한
  // 이유는 useRyzeDesignMetrics 정의부 주석 참고). Planning이 아닌 챕터의 "본문"은 지금처럼
  // 실제 뷰포트 그대로 렌더링해 손대지 않지만, 고정 UI(라벨/뒤로가기/TOC)만큼은 모든 챕터가
  // 공유하는 컴포넌트라 항상 스케일값을 계산해둔다 — 아래 fixed 레이어에 챕터 구분 없이
  // 적용해 Overview의 검정 알약 Back to Main과 크기를 통일한다.
  const { scale: designScale, canvasH: designCanvasH } = useRyzeDesignMetrics(true);
  // 섹션 사이 -mt-px 겹침이 스케일만큼(designScale) 각 섹션의 실제 세로 폭을 줄이므로,
  // 스냅 스크롤/활성 섹션 계산에도 같은 값을 넘겨 화면 경계와 정확히 맞춘다(아래 두 훅
  // 정의부 주석 참고) — Planning이 아닐 땐 어차피 sectionCount<=1이라 쓰이지 않는다.
  useRyzeSectionSnapScroll(sectionCount, isPlanning, designScale);
  // 휠 스냅(useRyzeSectionSnapScroll)은 'wheel' 이벤트만 가로채므로, 스크롤바를 직접
  // 드래그하거나 키보드(Space/PageDown/방향키)로 스크롤하면 스냅을 타지 않고 화면 경계
  // 사이 중간 어딘가에 멈출 수 있었다 — 그 상태에서는 다음 화면이 뷰포트 아래쪽에 자연스럽게
  // 걸쳐 보이는데, 이게 "화면 경계에 틈이 있다"는 착시로 오인되기 쉽다(실제로는 틈이 아니라
  // 스냅이 적용 안 된 정상적인 중간 스크롤 상태). 네이티브 CSS scroll-snap을 보조로 깔아
  // 입력 방식과 무관하게(휠/트랙패드/키보드/스크롤바 드래그/터치 전부) 항상 화면 경계로
  // 멈추도록 한다 — html에 클래스를 토글해 Planning 챕터에서만 적용하고, 다른 챕터/페이지의
  // 스크롤 동작에는 영향을 주지 않는다.
  useEffect(() => {
    if (!isPlanning) return;
    document.documentElement.classList.add('ryze-planning-snap');
    return () => document.documentElement.classList.remove('ryze-planning-snap');
  }, [isPlanning]);
  const activeSection = useRyzeActiveSection(sectionCount, designScale);
  // Planning의 앞 5개 화면(0~4)은 전부 목차상 "문제 정의" 한 항목에 속하고, 6~7번째 화면
  // (5,6)은 "페르소나 & 저니맵", 8번째 화면(7)은 "비즈니스 모델", 9번째 화면(8)은
  // "프로덕트 로드맵"에 대응한다.
  const activeTocIndex = galleryToc
    ? galleryActiveToc
    : isPlanning
    ? activeSection >= 8
      ? 3
      : activeSection >= 7
        ? 2
        : activeSection >= 5
          ? 1
          : 0
    : activeSection;
  // 좌상단 "PLANNING" 라벨과 좌하단 "Back to Work" 버튼은 fixed라 모든 화면 위에 항상 같은
  // 자리(좌측 상/하단 모서리)에 떠 있는다 — 화면(섹션)마다 그 모서리가 사진(어두움) 위인지
  // 페이지 배경(밝음) 위인지가 달라서, RYZE_PLANNING_DARK_CORNER_SECTIONS로 화면별 어두움
  // 여부를 조회해 글자색을 반전한다.
  const isPlanningDarkCorner = isPlanning && !!RYZE_PLANNING_DARK_CORNER_SECTIONS[activeSection];
  const isTocDarkCorner = isPlanning && !!RYZE_TOC_DARK_CORNER_SECTIONS[activeSection];
  // "The Dawn of RYZE." 화면(다섯 번째 화면)의 이미지 여러 장 중 지금 보여줄 인덱스. 슬라이드는
  // 더 이상 key로 <img>를 갈아 끼우는 방식이 아니라, 모든 이미지를 처음부터 전부 DOM에
  // 그려두고(아래 캐러셀 참고) 컨테이너를 translateX로 미는 방식이라 별도의 "방향" 상태는
  // 필요 없다 — 인덱스가 커지든 작아지든(마지막→처음 되돌림 포함) 같은 x 계산식이 알아서
  // 올바른 방향으로 슬라이드한다.
  const [dawnImageIndex, setDawnImageIndex] = useState(0);
  // 저니맵 원(1~6)을 클릭하면 그 단계의 상세 콘텐츠(위치 아이콘+한글/영문 라벨 + Action/Feeling/
  // Touchpoint + 큰 번호)가 사진 패널 위에 검정 50% 불투명 슬라이드로 왼쪽에서 오른쪽으로
  // 등장한다. null이면 닫힌 상태.
  const [journeyOverlayStage, setJourneyOverlayStage] = useState<string | null>(null);
  // 파동 힌트가 지금 가리키는 원 번호 — 처음엔 1번. 사용자가 어떤 원을 클릭하면(1번을 클릭하면
  // 2번, 2번을 클릭하면 3번으로) "다음 눌러볼 원"으로 힌트가 넘어간다. 6번까지 가면 더 이상
  // 안내할 다음 단계가 없으니 힌트를 끈다(null).
  const [journeyRippleTarget, setJourneyRippleTarget] = useState<string | null>('1');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: bg, color: ink }}
    >
      {/* 고정 UI(진행률 트랙 + 라벨 + 뒤로가기 + TOC) 묶음 — 모든 챕터에서 2560-폭 캔버스
          기준으로 스케일해 해상도가 달라져도 항상 같은 비율로 보이게 한다(본문 콘텐츠는
          Planning만 스케일되지만, 이 fixed 오버레이는 문서 스크롤/레이아웃에 관여하지 않는
          독립적인 오버레이라 챕터 구분 없이 켜도 기존 레이아웃에 영향이 없다 — Overview
          인트로의 검정 알약 Back to Main과 크기를 맞추기 위함). */}
      <RyzeDesignScaleLayer enabled scale={designScale} canvasH={designCanvasH} fixed>
      {/* 스크롤 UI(진행률 트랙) — 이미지 바로 옆에 붙여서, 스크롤이 지금 보고 있는 사진과
          이어진 하나의 진행 상태라는 게 한눈에 보이게 한다. "문제 정의" 5화면에서만 의미가
          있고, 그 뒤(페르소나 & 저니맵, index 5)부터는 다른 목차 항목으로 넘어간 것이라
          더 이상 표시하지 않는다. sectionLimit=5로 진행률 계산 자체도 문제 정의 5화면
          범위로만 한정해, 뒤에 이어 붙은 다른 섹션들 때문에 100%가 밀리지 않게 한다.
          언마운트 대신 forceHidden으로 넘겨, 그 경계를 넘는 순간 트랙이 부드럽게(트랜지션과
          함께) 사라지도록 한다. */}
      <RyzeScrollProgress
        color={ink}
        rightClassName={isPlanning ? 'right-[380px]' : 'right-6 md:right-12'}
        // Brand: 갤러리 컬럼(폭 min(62%,1400px), 가운데 정렬)의 오른쪽 가장자리 바로 옆에 붙인다.
        // Planning이 사진 바로 옆에 붙는 것과 같은 방식이고, 위치 표시 부분은 밝은색(#F9FAFB).
        // 이 트랙은 2560 캔버스(scale 적용) 안에 있어 left가 캔버스 좌표라, 실제 뷰포트 px로 구한
        // 컬럼 오른쪽 끝 + 간격 24px를 designScale로 나눠 넘긴다.
        style={isGallery && designScale ? { left: (getRyzeGalleryRightEdge(current.slug, vw) + 24) / designScale } : undefined}
        thumbColor={isGallery ? ink : undefined}
        sectionLimit={isPlanning ? 5 : undefined}
        forceHidden={isPlanning && activeSection >= 5}
      />
      {/* 좌상단 페이지 라벨 — 스크롤로 화면이 바뀌어도 안 움직이도록 섹션 밖에서 fixed로 한 번만
          렌더링한다(예전엔 화면마다 똑같이 복제해서 스크롤에 같이 쓸려 내려갔었다). */}
      <div className="fixed z-20 px-6 md:px-12 py-10 pointer-events-auto">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm font-bold uppercase tracking-widest transition-colors duration-300"
          style={{ color: isPlanningDarkCorner ? '#F9FAFB' : ink, fontFamily: RYZE_FONT }}
        >
          {current.title}
        </motion.span>
      </div>
      {/* Overview 인트로 섹션의 "Back to Main" 알약 버튼과 동일한 컴포넌트. 라벨과 같은 이유로
          fixed로 한 번만 렌더링해 스크롤 중에도 항상 같은 자리에 떠 있게 한다. */}
      <motion.button
        onClick={() => navigate('/projects/2')}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`group cursor-pointer fixed z-20 bottom-6 left-6 md:bottom-10 md:left-12 uppercase tracking-widest font-semibold transition-[opacity,color] duration-300 opacity-70 hover:opacity-100 flex items-center gap-2 pointer-events-auto ${isPlanning || isGallery ? 'text-sm' : 'rounded-full px-5 py-3'}`}
        style={
          isPlanning
            ? { color: isPlanningDarkCorner ? '#F9FAFB' : '#0A0A0A', fontFamily: RYZE_FONT }
            : isGallery
              // 갤러리 챕터: 알약 없이 글자만(Planning과 같은 형태) — 배경이 항상 어두워 글자색은 밝게 고정.
              ? { color: ink, fontFamily: RYZE_FONT }
              : { color: '#F9FAFB', backgroundColor: '#0A0A0A', fontFamily: RYZE_FONT, fontSize: RYZE_TITLE_FONT_CSS }
        }
      >
        <ArrowRight className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" /> Back to Work
      </motion.button>
      {/* 우측 목차(TOC) — 마찬가지로 fixed 하나만 두고, 지금 보고 있는 화면(activeSection)에 맞춰
          활성 항목의 점·굵기만 바뀌는 스크롤스파이로 동작한다. Planning 페이지에 처음 들어올 때
          항목들이 한 덩어리로 같이 뜨지 않고, 위에서부터 하나씩 순서대로 "착착착" 나타나도록
          각 항목마다 개별 motion + 순차 delay(스태거)를 준다 — sticky/fixed라 스크롤로 섹션이
          바뀔 때마다 다시 재생할 대상은 아니라서 mount 시 한 번만(whileInView가 아닌 animate) 재생한다. */}
      {/* 저니맵 원(1~6)을 클릭해 오른쪽에 상세 콘텐츠 슬라이드가 뜨면, 그 슬라이드와 시각적으로
          겹치지 않도록 TOC를 화면 오른쪽 바깥으로 밀어낸다 — 슬라이드가 닫히면 다시 제자리로.
          journeyOverlayStage는 저니맵 화면(activeSection 6 — 5는 그 앞의 페르소나 화면)을
          벗어나도 초기화되지 않아서, 그 화면에서 슬라이드를 열어둔 채 다른 화면(페르소나,
          비즈니스 모델 등)으로 스크롤해도 TOC가 계속 숨어있는 버그가 있었다 —
          activeSection === 6(저니맵 화면)일 때만 밀어내도록 조건을 더한다. */}
      <motion.div
        className="hidden md:flex fixed z-20 right-6 md:right-12 top-64 md:top-80 flex-col gap-3 py-2 pointer-events-auto"
        style={{ fontFamily: RYZE_FONT }}
        animate={{
          x: journeyOverlayStage && activeSection === 6 ? 200 : 0,
          opacity: journeyOverlayStage && activeSection === 6 ? 0 : 1,
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-px transition-colors duration-300"
          style={{ backgroundColor: isTocDarkCorner ? '#F9FAFB' : ink, opacity: 0.15 }}
        />
        {tocItems.map((item, i) => {
          // "문제 정의"(0번)는 5개 화면(0~4) 전부에 대응해 눌렀을 때 그 첫 화면("트렌드
          // 자체는...")으로, "페르소나 & 저니맵"(1번)은 6번째(index 5) 화면으로, "비즈니스
          // 모델"(2번)은 8번째(index 7) 화면으로, "프로덕트 로드맵"(3번)은 9번째(마지막,
          // index 8) 화면으로 스크롤한다.
          const isClickable = !!galleryToc || (isPlanning && (i === 0 || i === 1 || i === 2 || i === 3));
          const targetSection = i === 0 ? 0 : i === 1 ? 5 : i === 2 ? 7 : 8;
          return (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.08 }}
            onClick={
              galleryToc
                ? () => scrollToRyzeGalleryItem(current.slug, galleryToc[i])
                : isClickable
                ? () => {
                    // window.innerHeight가 아니라 useRyzeSectionSnapScroll/useRyzeActiveSection과
                    // 똑같은 step(= innerHeight - designScale)을 써야 한다 — 화면 사이 -mt-px
                    // 겹침 때문에 실제 한 화면의 스크롤 보폭은 innerHeight보다 designScale만큼
                    // 짧다. innerHeight로 계산하면 targetSection이 클수록(뒤쪽 화면일수록) 그
                    // 차이가 누적되어 실제 화면 경계보다 더 아래로 스크롤되고, 그만큼 다음
                    // 화면이 뷰포트 하단에 미리 걸쳐 보였다(유저 페르소나 TOC 클릭 시 하단에
                    // 저니맵이 비치던 현상의 원인).
                    const step = window.innerHeight - designScale;
                    window.scrollTo({ top: targetSection * step, behavior: 'smooth' });
                  }
                : undefined
            }
            className={`relative flex items-center justify-end pr-6 text-right ${isClickable ? 'cursor-pointer' : ''}`}
            style={{ fontSize: 16 }}
          >
            <span
              className="absolute right-[-2.5px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-[opacity,background-color] duration-300"
              style={{ backgroundColor: isTocDarkCorner ? '#F9FAFB' : ink, opacity: i === activeTocIndex ? 1 : 0 }}
            />
            <span
              className="transition-[opacity,font-weight,color] duration-300"
              style={{
                color: isTocDarkCorner ? '#F9FAFB' : ink,
                opacity: i === activeTocIndex ? 1 : 0.4,
                fontWeight: i === activeTocIndex ? 600 : 400,
              }}
            >
              {item}
            </span>
          </motion.div>
          );
        })}
      </motion.div>
      </RyzeDesignScaleLayer>
      {/* 우상단 BGM 토글 — 위 RyzeDesignScaleLayer(fixed) 밖에 둬서 캔버스 스케일에 영향받지
          않는 실제 뷰포트 네이티브 픽셀로 고정한다. PLANNING 라벨/TOC는 2560 캔버스 기준으로
          함께 스케일되는 게 의도된 동작이지만, 이 토글은 메인 홈(RyzeProjectsSection)의 BGM
          토글과 크기·위치·호버 시 곡명 라벨까지 창 폭에 관계없이 항상 정확히 같아야 해서
          (실측: top:14px, right: 12px/md 20px) 스케일 레이어 밖에 그대로 둔다. 라벨이 옆으로
          늘어날 수 있어야 하므로 너비는 고정하지 않는다. 색은 TOC와 같은 우측 모서리 기준으로
          isTocDarkCorner를 따라 반전한다(Planning이 아닌 챕터는 항상 어두운 배경이라 무조건
          반전). */}
      <div className="fixed z-20 top-[14px] right-3 md:right-5 pointer-events-auto">
        <RyzeMusicToggleWithLabel onDarkBg={isTocDarkCorner || !isLightPage} />
      </div>
      {/* 스크롤 본문(사진+텍스트 섹션들) 묶음 — 마찬가지로 Planning에서만 2560 캔버스 기준으로
          스케일한다. 실제 문서 스크롤(window.scrollY)은 그대로 두고 시각적 크기만 바뀌므로,
          스크롤 스냅·TOC 활성 표시 등 기존 로직은 전혀 손대지 않아도 된다. */}
      <RyzeDesignScaleLayer enabled={isPlanning} scale={designScale} canvasH={designCanvasH}>
      {/* 첫 화면(히어로) 전체를 정확히 한 화면 높이(h-screen)로 고정하는 래퍼 — 안의 사진이
          absolute라 이 래퍼가 없으면 문서 높이에 반영되지 않아, 그 아래 더미 섹션이 첫 화면과
          겹쳐 보이게 된다. shrink-0으로 flex-col 안에서 찌그러지지 않게. Planning에서는 실제
          뷰포트 높이(h-screen) 대신 디자인 캔버스 높이(designCanvasH — 고정 1440이 아니라 실제
          뷰포트 높이를 스케일로 역산한 값)를 써야, 위 RyzeDesignScaleLayer가 scale로 줄였을 때
          정확히 실제 뷰포트 한 화면 분량이 된다. */}
      <div
        className={isPlanning ? 'ryze-planning-screen relative shrink-0 overflow-hidden' : isGallery ? 'relative shrink-0' : 'relative h-screen shrink-0'}
        style={isPlanning ? { height: designCanvasH } : undefined}
      >
      {/* Planning 전용 — 좌측 본문·우측 TOC와의 간격을 해상도와 무관하게 항상 고정폭(920px /
          420px)으로 유지하면서, 위아래도 화면에 항상 딱 붙게 한다. 이 세 조건(양쪽 간격 고정 +
          위아래 완전히 붙임 + 크롭 없음)은 원본 비율이 고정된 이상 모든 해상도에서 동시에
          만족할 수 없어서, 크롭을 허용하는 쪽을 택했다 — object-cover로 채우다 보니 해상도에
          따라 사진의 좌우 일부가 잘려 보일 수 있다. <img>(대체 요소)는 absolute + left/right/
          top/bottom을 동시에 줘도 자동으로 그 박스에 맞춰 늘어나지 않는 CSS 특성이 있어,
          right 대신 명시적 calc() 폭으로 박스 크기를 직접 계산해준다. */}
      {isPlanning && (
        <motion.img
          src={getImageUrl('RYZE/planning-hero.webp')}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute object-cover pointer-events-none select-none"
          style={{ left: 918, top: -2, width: 'calc(100% - 920px - 420px + 4px)', height: 'calc(100% + 4px)' }}
        />
      )}
      {/* Planning 전용 — 좌상단 "PLANNING" 라벨과 같은 좌측 정렬선에 맞춰 본문을 배치한다.
          "문제 정의" 타이틀 자체는 우측 목차(TOC)에 이미 표시되므로 여기서는 생략한다. */}
      {isPlanning && (
        <RyzePlanningTextColumn
          ink={ink}
          title='트렌드 자체는 "파워 드레싱"으로 확실히 돌아오고 있다.'
          subtitle="Pinterest Predicts 2026 — Glamoratti"
          paragraphs={[
            "핀터레스트가 매년 발표하는 연간 트렌드 예측 리포트에서 두툼한 벨트 +65%, 헐렁한 정장 +90%, 하이칼라 재킷 +60%, 금색 커프+ 50%, 80년대 럭셔리 +225%의 핀터레스트의 자체 검색 통계를 발표하며, 어깨선이 강조된 맞춤 정장이 더 커지고 액세서리는 더 굵고 대담해지는 1980년대의 '파워 드레싱(Power Dressing)'의 패션 트렌드가 2026년의 트렌드일 것임을 시사하고 있으며, 이 유행을 MZ세대가 주도한다는 발표였습니다.",
            "가장 신뢰도 높은 패션 업계 전문지로 꼽히는 'WWD(Women's Wear Daily)' 또한 핀터레스트의 예측리포트를 자체 검증 후 보도했습니다. 단순한 소셜 플랫폼의 트렌드 예측이 아닌, 업계 전문가들이 실제로 주목할 만한 신호로서 해석할 수 있습니다.",
          ]}
        />
      )}
      {/* Planning은 위쪽 라벨(PLANNING/문제 정의)로 구성이 바뀌어 가운데 자리표시자 문구가
          필요 없으므로, Planning에서는 이 중앙 블록을 렌더링하지 않는다. */}
      {isGallery && <RyzeWorkGallery slug={current.slug} />}
      {!isPlanning && !isGallery && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 pb-24 text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs md:text-sm tracking-[0.3em] opacity-50"
            style={{ fontFamily: RYZE_FONT }}
          >
            {String(idx + 1).padStart(2, '0')} — WORK
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="italic mt-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: 'clamp(48px, 9vw, 120px)' }}
          >
            {current.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="mt-8 text-sm md:text-base opacity-50 uppercase tracking-widest"
            style={{ fontFamily: RYZE_FONT }}
          >
            Coming soon
          </motion.p>
        </div>
      )}
      </div>
      {/* 두 번째 화면 — 첫 화면과 같은 사진/타이틀·출처·본문 배치를 그대로 재사용한 자리표시자.
          라벨/뒤로가기/TOC는 이제 위에서 fixed로 한 번만 렌더링되므로 여기서는 사진과 본문만
          둔다. 텍스트 내용은 나중에 실제 콘텐츠(페르소나 & 저니맵)로 교체하면 된다. */}
      {/* 두 번째 화면 — 파워 드레싱 설명 */}
      {isPlanning && (
        <RyzePlanningScreen designCanvasH={designCanvasH}>
          <RyzePlanningPhotoVisual src="RYZE/hf_20260908_100649_3cf2df40-7505-4102-a14d-862a97a17df5.webp" loading="lazy" />
          <RyzePlanningTextColumn
            ink={ink}
            title="파워 드레싱(Power Dressing)"
            paragraphs={[
              "1980년대 여성들의 사회적 지위가 높아지기 시작한 시점으로, 무채색 또는 저명도 정장 스타일과 오피스룩이 유행했고, 여성들도 남성이 주로 입던 조끼 · 재킷을 입고 넥타이와 로퍼를 신는 게 특징이었으며, 슈트와 어깨 패드 같은 강한 실루엣을 통해 권위와 전문성을 시각화하는 스타일이었습니다.",
              "여성들이 대거 기업/금융권에 진출하던 시기이며, 남성 중심 직장 문화 속에서 옷을 통해 전문성과 입지를 획득하려던 사회적 배경이 이 스타일의 근본 동기였습니다.",
            ]}
          />
        </RyzePlanningScreen>
      )}
      {/* 세 번째 화면 — 앞의 두 화면과 같은 사진/본문 배치를 그대로 재사용한 자리표시자.
          텍스트 내용은 나중에 실제 콘텐츠(정보구조(IA) & 기능 정의 등)로 교체하면 된다. */}
      {isPlanning && (
        <RyzePlanningScreen designCanvasH={designCanvasH}>
          {/* 사진 대신, 본문에 인용된 통계·연구를 카드형 박스 배치(첨부 레퍼런스와 동일한
              그리드: 위쪽 큰 박스+작은 박스, 그 아래 넓은 박스, 그 아래 절반 폭 박스)로
              시각화한다(사진과 정확히 같은 자리/영역). 박스 배경이 항상 어두워서, 안의 그래프
              색은 페이지 톤(ink)과 무관하게 밝은 색(#F9FAFB) 고정. */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-[830px] top-0 w-[calc(100%-830px-420px)] h-full flex flex-col justify-center gap-4 pointer-events-none select-none"
          >
            {/* 1행 — 왼쪽 박스(고용률/임원 비율)는 더 위로 길게(세로), 폭은 좁게(왼쪽 정렬,
                고정 폭)로 줄이고, 오른쪽 박스(유리천장지수)가 그만큼 줄어든 폭의 여백을
                자연스럽게 채우도록 flex-1로 남는 공간을 전부 가져가게 한다. 아래쪽 끝은
                서로 맞춘 채(items-end) 높이만 다르게. */}
            {/* 모든 박스를 다시 %기반 너비로 통일 — 그래프 영역 자체가 가로로 늘고 줄 때
                네 박스가 항상 같은 비율로 함께 반응하도록 한다. */}
            <div className="w-full h-[46%] flex items-end gap-4">
              <RyzeChartCard className="h-full w-[40%] shrink-0">
                <RyzeStatBarChartMemo ink="#0A0A0A" />
              </RyzeChartCard>
              <RyzeChartCard className="h-[70%] w-[52%] shrink-0 !justify-start">
                <RyzeGlassCeilingChartMemo ink="#0A0A0A" />
              </RyzeChartCard>
            </div>
            {/* 2행 — 왼쪽 정렬, 오른쪽은 다 채우지 않고 짧게 끝나는 박스(승진 격차 도넛).
                박스 안 그래프 자체도 좌단 정렬 + 세로 중앙(justify-start)으로. 오른쪽 길이를
                조금 더 줄임. */}
            <RyzeChartCard className="w-[56%] h-[30%] self-start !justify-start">
              <RyzePromotionGapChartMemo ink="#0A0A0A" />
            </RyzeChartCard>
            {/* 3행 — 가로로 넓고 세로는 짧은 박스(연구 인용 카드). 오른쪽 길이를 아주 조금만
                줄임. */}
            <RyzeChartCard className="w-[80%] h-[14%] self-start">
              <RyzeLeadershipQuoteCardMemo ink="#0A0A0A" />
            </RyzeChartCard>
          </motion.div>
          <RyzePlanningTextColumn
            ink={ink}
            title="여성 리더십의 구조적 한계"
            paragraphs={[
              "트렌드의 반복은 시대적 조건의 반영입니다. 40년 전 존재감을 증명하던 '파워 드레싱'의 재부상은, 그 실루엣이 해소하던 심리적 기제가 여전히 유효하다는 신호입니다.",
              "데이터를 보면 흥미로운 지점이 발견됩니다. 여성 고용률은 62.1%로 역대 최고를 기록했지만, 여성 임원 비율은 여전히 6.5%에 머뭅니다. 직장 내 여성의 지위와 기회를 종합적으로 평가하는 국제 비교 지수인 '유리천장지수'에서도, 한국은 2025년 처음으로 12년 연속 꼴찌를 벗어났지만 여전히 OECD 29개국 중 28위에 그칩니다.",
              "즉, 여성의 노동시장 참여는 크게 늘었으나, 조직 내 주도적 역할을 하는 위치는 여전히 좁은 문이었습니다. 이 격차는 여성의 역량이나 성과가 낮아서가 아닙니다. 국내 리더십 연구들은 이를 여성 리더십에 대한 뿌리 깊은 사회적 고정관념의 결과로 설명합니다. 리더는 이래야 한다는 기준 자체가 '여성적인 것'과는 거리가 멀게 설정되어 있어, 실력과 무관하게 승진과 인정에서 밀려나게 만든다는 연구입니다. 실제로 승진 사다리를 오를수록 그 격차는 더 벌어집니다. 차장급에서 여성 비율은 이미 남성에 못 미치고, 임원급 증가율은 남성이 150%인 동안 여성은 20%에 그쳤습니다. 그 결과, 능력만큼의 자리를 갖추지 못한 이들이 늘어났습니다.",
            ]}
            quote="이 분석은 특정 성별의 우열이 아니라, 실제 데이터로서 측정된 시장 세그먼트에 대한 관찰입니다."
          />
        </RyzePlanningScreen>
      )}
      {/* 네 번째 화면 — 상징적 소비 */}
      {isPlanning && (
        <RyzePlanningScreen designCanvasH={designCanvasH}>
          <RyzePlanningPhotoVisual src="RYZE/KakaoTalk_20260908_204629907.webp" heightPad={6} loading="lazy" />
          <RyzePlanningTextColumn
            ink={ink}
            title="상징적 소비"
            paragraphs={[
              "이처럼 '되고 싶은 위치'와 '현재의 위치' 사이에 격차가 존재할 때, 소비자행동학은 흥미로운 지점을 관찰해왔습니다. 그 간극을 종종 상징적 소비를 통해 해소한다는 점이 보고되며 — 이를 보상소비(compensatory consumption)라 부릅니다. 특히 권위(authority)는 이 격차가 가장 빈번히 발생하는 영역 중 하나로 꼽히며, 지위를 표현하는 상징적 소비가 그 해소 수단이 됩니다.",
              '실제로 최근 패션 소비 시장에서도 이와 공명하는 변화가 관측됩니다. 절제된 미니멀리즘(quiet luxury) 이후, 맥시멀리스트 액세서리에 대한 관심은 2025년 4분기에만 100% 이상 급증했습니다(Trend Suite, 2025). 업계는 이 변화를 "침묵하는 옷차림은 더 이상 세련되지 않다"는 방향으로의 전환으로 해석합니다. 이전의 소비자행동학 이론에 비추어 보면, 이는 존재감과 지위를 스스로 표현하려는 상징적 소비 심리가 시장 데이터로 나타난 사례로 읽을 수 있습니다.',
            ]}
          />
        </RyzePlanningScreen>
      )}
      {/* 다섯 번째 화면 — 앞선 화면들과 같은 사진/본문 배치를 그대로 재사용한 자리표시자.
          텍스트 내용은 나중에 실제 콘텐츠(프로덕트 로드맵 등)로 교체하면 된다. 뒤로 페르소나·
          저니맵 두 화면이 더 있어(더 이상 문서의 진짜 끝이 아니다) 다른 화면들과 동일하게
          h-[calc(100%+4px)]로 살짝 키워, 뷰포트 높이 반올림 오차로 맨 아래에 비치던 흰 줄을
          없앤다(여기서 넘친 4px는 이 섹션 자체의 overflow-hidden에 그대로 잘린다). */}
      {isPlanning && (
        <RyzePlanningScreen designCanvasH={designCanvasH}>
          {/* 여러 장을 넘겨볼 수 있는 이미지 영역 — 가로로 나열한 "필름 스트립"을 통째로
              translateX 하나로만 밀어서 넘기는 캐러셀 방식. 예전엔 AnimatePresence로 <img>를
              key마다 마운트/언마운트했는데, 그러면 처음 등장하는 이미지는 "마운트되는 그 순간"에
              브라우저가 디코딩은 물론 GPU 텍스처 업로드(레이어 승격)까지 처음부터 해야 해서
              — 화면 밖에서 미리 decode()만 끝내놔도 실제 DOM에 그려진 적이 없으면 이 텍스처
              업로드 비용은 피할 수 없었다 — 오직 "처음 한 번"만 버벅였다(그 다음부터는 이미
              업로드된 텍스처라 매끈했다). 지금처럼 모든 이미지를 처음부터 전부 DOM에 그려두고
              (필요하면 overflow-hidden 밖에 가려진 채로) 단순히 컨테이너를 옆으로 미는
              방식이면, 텍스처 업로드가 이 섹션이 뜨는 시점(버튼을 누르기 훨씬 전)에 전부 끝나
              있어 첫 클릭부터 매끈하다. */}
          <div
            className="absolute overflow-hidden"
            style={{ left: 918, top: -2, width: 'calc(100% - 920px - 420px + 4px)', height: 'calc(100% + 6px)' }}
          >
            <motion.div
              className="flex h-full"
              style={{ width: `${RYZE_DAWN_IMAGES.length * 100}%` }}
              animate={{ x: `-${(100 / RYZE_DAWN_IMAGES.length) * dawnImageIndex}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {RYZE_DAWN_IMAGES.map((image) => (
                <img
                  key={image.src}
                  src={getImageUrl(image.src)}
                  alt=""
                  className="h-full shrink-0 object-cover pointer-events-none select-none"
                  style={{ width: `${100 / RYZE_DAWN_IMAGES.length}%` }}
                />
              ))}
            </motion.div>
            {/* 여러 장일 때만 노출 — 다음 이미지로 넘기는 버튼(이미지 오른쪽 부근)과
                우상단 "n/총장수" 카운터. 카운터 글자색은 지금 보이는 사진의 우상단 톤에 맞춰
                항상 또렷이 읽히도록 반전한다(사진이 어두우면 밝은 글자, 밝으면 어두운 글자).
                마지막 장(다음이 처음으로 되돌아감)에서는 버튼을 반대쪽인 왼쪽으로 옮기고
                화살표도 그 방향(왼쪽)을 가리키게 바꿔, "처음으로 돌아간다"는 방향이 자연스럽게
                읽히게 한다. */}
            {RYZE_DAWN_IMAGES.length > 1 && (() => {
              const isLast = dawnImageIndex === RYZE_DAWN_IMAGES.length - 1;
              const Icon = isLast ? ChevronLeft : ChevronRight;
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setDawnImageIndex((prev) => (prev + 1) % RYZE_DAWN_IMAGES.length)}
                    aria-label="다음 이미지"
                    className={`group absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 ${
                      isLast ? 'left-5' : 'right-5'
                    }`}
                    style={{ backgroundColor: 'rgba(10, 10, 10, 0.55)', backdropFilter: 'blur(4px)' }}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isLast ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
                      }`}
                      style={{ color: '#F9FAFB' }}
                    />
                  </button>
                  <div
                    className="absolute right-7 top-4 z-10 text-base font-semibold tabular-nums"
                    style={{
                      color: RYZE_DAWN_IMAGES[dawnImageIndex].dark ? '#F9FAFB' : '#0A0A0A',
                      fontFamily: RYZE_FONT,
                    }}
                  >
                    {dawnImageIndex + 1}/{RYZE_DAWN_IMAGES.length}
                  </div>
                </>
              );
            })()}
          </div>
          <RyzePlanningTextColumn
            ink={ink}
            title="The Dawn of RYZE."
            paragraphs={[
              "다만 이 표현은 단순한 복고가 아니어야 합니다. 1980년대의 파워 드레싱을 그대로 재현하는 것은 과거로의 회귀일 뿐입니다. RYZE가 지향하는 건 '그때처럼'이 아니라 '지금의 방식으로' 존재감을 드러내는 언어입니다. 이 지점에서 메탈릭 디테일, 조각적 실루엣 같은 미래지향적 요소를 더한 세련된 시크함을 선택합니다. 과거의 스타일 문법을 오늘의 감각으로 다시 쓰는 방식입니다.",
              "그리고 이 방향에는 아직 뚜렷한 선점자가 없습니다. 오피스웨어는 재해석 초기 단계에 머물러 있고, 여성 하이엔드 포멀웨어 시장에서도 이 지점을 선점한 브랜드는 뚜렷하지 않습니다.",
              "RYZE는 인식의 격차와, 그 격차를 해소하려는 상징적 소비 심리, 그리고 아직 충족되지 않은 시장의 교차점에서 출발하며, 성별과 배경을 넘어서 모두가 RYZE를 통해 각자만의 고유한 아우라를 완성하고, 주체적인 삶의 영감을 마주하도록 돕습니다.",
            ]}
          />
        </RyzePlanningScreen>
      )}
      {/* 여섯 번째 화면 — "유저 페르소나". 피그마 레퍼런스(node 2886:56, Figma 파일
          FbrDBrAKA1w8Srjjc9XPfg)를 그대로 이식 — 좌측 사진 패널 + 우측 가치관/RYZE와의 접점
          2단 컬럼. 이 화면 전용 ppx()(2405px 캔버스 기준, 위에서 정의)로 위치·크기·폰트를
          전부 변환해 피그마 좌표를 그대로 재현한다(저니맵의 rpx()와는 무관). */}
      {isPlanning && (
        <div className="ryze-planning-screen relative shrink-0 -mt-px overflow-hidden" style={{ height: designCanvasH }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center select-none"
          >
            {/* 캔버스 높이를 피그마 프레임 실측치(ppx(1383)) 대신 이 화면의 실제 섹션 높이
                (designCanvasH, RyzeDesignScaleLayer가 이미 2560px 디자인 폭에 맞춰 계산해준
                값)로 채운다 — 고정 높이로 두면 실제 뷰포트 비율이 피그마 프레임 비율(2405:1383)과
                다를 때 사진 패널 위아래로 레터박싱(여백)이 생겼다. */}
            <div className="relative" style={{ width: ppx(2405), height: designCanvasH }}>
              <RyzePersonaPhotoPanel />
              {/* 우측 텍스트 패널 전체(배경 2장 + 타이틀 + 가치관/RYZE와의 접점)를 한 덩어리로
                  묶어 세로 중앙 정렬한다. 사진 패널은 실제 섹션 높이(designCanvasH)를 그대로
                  꽉 채워야 하지만(그래야 레터박싱이 없다), 이 텍스트 블록은 피그마 원본 높이
                  (top 122~1218, 즉 1096px)를 그대로 유지하는 고정 크기라야 뷰포트 비율이 바뀌어도
                  줄바꿈·좌표가 흔들리거나 바닥에서 잘리지 않는다 — 두 요구사항이 서로 달라 이렇게
                  분리했다. 아래 각 요소의 top 값은 전부 피그마 원본 top에서 122(이 블록의 원래
                  시작 지점)를 뺀 상대값이다. */}
              <div className="absolute" style={{ left: 0, top: '50%', width: ppx(2405), height: ppx(1096), transform: 'translateY(-50%)' }}>
                <div className="absolute" style={{ left: ppx(901), top: ppx(183), width: ppx(1157), height: ppx(913), backgroundColor: '#F9FAFB' }} />
                <div className="absolute" style={{ left: ppx(922), top: 0, width: ppx(522), height: ppx(134), backgroundColor: '#F9FAFB' }} />
                <motion.p
                  {...ryzeRevealUp(0.2)}
                  className="absolute whitespace-nowrap"
                  style={{ left: ppx(1030), top: ppx(134), fontFamily: RYZE_FONT, fontWeight: 700, fontSize: ppx(30), letterSpacing: `${ppx(0.6)}px`, color: '#0A0A0A' }}
                >
                  RYZE USER PERSONA
                </motion.p>
                {/* 가치관/RYZE와의 접점 — 피그마 절대좌표(그룹 2886:93 기준, top=410)를 그대로
                    ppx()로 옮긴 것. 헤더 블록(제목+밑줄) 높이 53px 뒤 54px 갭을 두고 목록이
                    시작하는 리듬(107px 오프셋)이 두 섹션 모두 동일해 그대로 반복한다. */}
                <motion.div {...ryzeRevealUp(0.3)} className="absolute" style={{ left: ppx(1031), top: ppx(288) }}>
                  <RyzePersonaSectionHeading title="가치관" />
                </motion.div>
                <motion.div {...ryzeRevealUp(0.4)} className="absolute flex flex-col" style={{ left: ppx(1035), top: ppx(395), width: ppx(862), gap: ppx(44) }}>
                  {RYZE_PERSONA.values.map((v) => (
                    <RyzePersonaInfoRow key={v.label} label={v.label} desc={v.desc} labelWidth={161} />
                  ))}
                </motion.div>
                <motion.div {...ryzeRevealUp(0.5)} className="absolute" style={{ left: ppx(1031), top: ppx(732) }}>
                  <RyzePersonaSectionHeading title="RYZE와의 접점" />
                </motion.div>
                <motion.div {...ryzeRevealUp(0.6)} className="absolute flex flex-col" style={{ left: ppx(1035), top: ppx(839), width: ppx(862), gap: ppx(44) }}>
                  {RYZE_PERSONA.touchpoints.map((v) => (
                    <RyzePersonaInfoRow key={v.label} label={v.label} desc={v.desc} labelWidth={192} />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* 일곱 번째(마지막) 화면 — "Brand Experience Journy". 피그마 레퍼런스(node 2897:249,
          Figma 파일 FbrDBrAKA1w8Srjjc9XPfg)로 교체 — 페르소나 화면과 같은 2405px 폭 캔버스라
          같은 ppx() 배율을 그대로 재사용한다. */}
      {isPlanning && (
        <div className="ryze-planning-screen relative shrink-0 -mt-px overflow-hidden" style={{ height: designCanvasH }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 select-none"
          >
            <div
              className="relative"
              style={{ width: ppx(2405), height: designCanvasH }}
              onClick={() => setJourneyOverlayStage(null)}
            >
              {/* 우측 사진 패널 — 페르소나 화면과 동일하게, 피그마 프레임 실측 높이(1391px) 대신
                  실제 섹션 높이(100%)를 꽉 채운다. object-position: bottom = 피그마의
                  object-bottom(이미지 아래쪽 기준 정렬, 위쪽부터 잘림)과 동일. 경계(JOURNEY2_PHOTO_LEFT)를
                  왼쪽으로 당겨 흰 배경 영역을 좁히고 사진을 넓혔다. onClick에서 stopPropagation —
                  이 패널(사진+오버레이 슬라이드) 자체를 클릭했을 땐 안 닫히고, 바깥 흰 배경을
                  클릭했을 때만(위 부모의 onClick) 오버레이가 닫힌다. */}
              <div
                className="absolute overflow-hidden"
                style={{ left: ppx(JOURNEY2_PHOTO_LEFT), top: 0, width: ppx(2405 - JOURNEY2_PHOTO_LEFT), height: '100%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={getImageUrl('RYZE/123123.webp')}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: 'center bottom', transform: 'scale(1.15)' }}
                />
                {/* 원(1~6) 클릭 시 뜨는 상세 콘텐츠 슬라이드 — 검정 50% 불투명, 왼쪽에서
                    오른쪽으로 등장/퇴장. AnimatePresence로 언마운트 시에도 exit 애니메이션이
                    재생되게 한다. */}
                <AnimatePresence>
                  {journeyOverlayStage && RYZE_JOURNEY2_OVERLAY[journeyOverlayStage] && (
                    <motion.div
                      key={journeyOverlayStage}
                      initial={{ x: '-100%' }}
                      animate={{ x: '0%' }}
                      exit={{ x: '-100%' }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0"
                      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                    >
                      {/* 헤더(GPS 아이콘+한글/영문 라벨)와 Action/Feeling/Touchpoint 목록을
                          "BRAND EXPERIENCE JOURNEY" 타이틀과 똑같은 세로 중앙 정렬 박스(top:50%
                          + translateY(-50%), 높이 ppx(JOURNEY2_BLOCK_H * JOURNEY2_GROUP_SCALE))
                          안에 넣는다 — 타이틀도 이 박스 안 local top=0에 있으므로, 이 헤더도
                          local top=0에 두면 해상도가 바뀌어도(두 값 다 같은 공식으로 다시
                          계산되므로) 항상 타이틀과 같은 y선에서 시작한다. */}
                      <div
                        className="absolute"
                        style={{ left: 0, top: '50%', width: ppx(2405), height: ppx(JOURNEY2_BLOCK_H * JOURNEY2_GROUP_SCALE), transform: 'translateY(-50%)' }}
                      >
                        {/* 아이콘-"인지" 간격은 gap-2(고정 8px, 해상도 무관)로 붙어 있던 걸
                            ppx() 기반 marginRight로 바꿔서 더 넓혔다 — "인지"-"Awareness" 사이
                            간격은 그대로 두고 아이콘 쪽만 오른쪽으로 더 띄운다. */}
                        {/* "인지"-"Awareness" 간격을 더 띄웠다(marginRight 8 → 20). */}
                        <div className="absolute flex items-center" style={{ left: ppx(100), top: 0 }}>
                          <MapPin style={{ width: ppx(28), height: ppx(28), marginRight: ppx(16) }} color="#F9FAFB" strokeWidth={1.6} />
                          <span style={{ marginRight: ppx(20), fontFamily: RYZE_FONT, fontWeight: 700, fontSize: ppx(30), color: '#F9FAFB' }}>
                            {RYZE_JOURNEY2_OVERLAY[journeyOverlayStage].koLabel}
                          </span>
                          <span style={{ fontFamily: RYZE_FONT, fontWeight: 500, fontSize: ppx(20), color: 'rgba(249,250,251,0.6)' }}>
                            {RYZE_JOURNEY2_OVERLAY[journeyOverlayStage].enLabel}
                          </span>
                        </div>
                        {/* Action/Feeling/Touchpoint 문단 간격(행간)을 아래로 더 넓혔다(60 → 76).
                            값 텍스트(강조된 굵은 글자)는 Satoshi 대신 프리텐다드 세미볼드(600)로
                            바꿨다 — 이 화면의 다른 한글 본문(페르소나 등)과 같은 폰트 패밀리. */}
                        <div className="absolute flex flex-col" style={{ left: ppx(100), top: ppx(170), gap: ppx(76), width: ppx(900) }}>
                          {/* 4번(구매)·5번(경험)은 원본 표에 Touchpoint 칸이 비어 있다 —
                              값이 빈 문자열인 행은 아예 렌더하지 않는다(라벨만 남는 빈 줄 방지). */}
                          {([
                            ['Action', RYZE_JOURNEY2_OVERLAY[journeyOverlayStage].action],
                            ['Feeling', RYZE_JOURNEY2_OVERLAY[journeyOverlayStage].feeling],
                            ['Touchpoint', RYZE_JOURNEY2_OVERLAY[journeyOverlayStage].touchpoint],
                          ] as const)
                            .filter(([, value]) => value !== '')
                            .map(([rowLabel, value]) => (
                            <div key={rowLabel} className="flex items-start" style={{ gap: ppx(40) }}>
                              <p style={{ width: ppx(160), flexShrink: 0, fontFamily: RYZE_FONT, fontWeight: 500, fontSize: ppx(20), color: 'rgba(249,250,251,0.6)' }}>
                                {rowLabel}
                              </p>
                              {/* whiteSpace: pre-line — 데이터 안에 줄바꿈(\n)을 넣은 항목(3번
                                  Feeling)이 그 지점에서 실제로 줄바꿈되게 한다. */}
                              <p style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 600, fontSize: ppx(20), color: '#F9FAFB', whiteSpace: 'pre-line' }}>
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* 우하단 큰 번호 — Satoshi Medium(700 → 500)으로 바꾸고, 구석에 딱
                          붙어 있던 걸 좌상단 방향으로 띄웠다(right/bottom 값을 키움). 크기도
                          한 번 더 키우고 좌상단으로 더 밀었다. */}
                      <p
                        className="absolute whitespace-nowrap"
                        style={{ right: ppx(110), bottom: ppx(90), fontFamily: RYZE_FONT, fontWeight: 500, fontSize: ppx(110), color: '#F9FAFB', lineHeight: 1 }}
                      >
                        {journeyOverlayStage}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* 타이틀+화살표+노드 다이어그램(원래 top 137/147/318~)을 전부 하나의 블록으로
                  묶어 통째로 세로 중앙(오른쪽 사진 패널의 세로 중앙과 같은 기준)에 고정한다 —
                  항상 같은 간격을 유지한 채 하나의 컴포넌트처럼 함께 움직이고, JOURNEY2_GROUP_SCALE
                  하나로 폰트 크기까지 포함해 전체가 같이 커지거나 작아진다. 바깥 박스 높이는
                  반드시 안쪽(scale 적용) 높이(JOURNEY2_BLOCK_H * JOURNEY2_GROUP_SCALE)와 정확히
                  일치해야 세로 중앙 정렬이 어긋나지 않는다. left도 0 대신 JOURNEY2_BLOCK_OFFSET_X를
                  더해, 사진 패널(left=1255부터) 앞의 흰 배경 영역(0~1255) 안에서 실제 렌더된
                  콘텐츠(라벨 텍스트 폭까지 포함한 진짜 시각적 바운딩 박스, 브라우저에서 실측)가
                  가로로도 정중앙에 오도록 보정했다. */}
              <div className="absolute" style={{ left: ppx(JOURNEY2_BLOCK_OFFSET_X), top: '50%', width: ppx(2405), height: ppx(JOURNEY2_BLOCK_H * JOURNEY2_GROUP_SCALE), transform: 'translateY(-50%)' }}>
                <div className="absolute" style={{ left: 0, top: 0, width: ppx(2405), height: ppx(JOURNEY2_BLOCK_H), transform: `scale(${JOURNEY2_GROUP_SCALE})`, transformOrigin: 'top left' }}>
                  <p
                    className="absolute whitespace-nowrap"
                    style={{ left: ppx(137), top: 0, fontFamily: RYZE_FONT, fontWeight: 700, fontSize: ppx(30), letterSpacing: `${ppx(0.6)}px`, color: '#0A0A0A' }}
                  >
                    BRAND EXPERIENCE JOURNEY
                  </p>
                  {/* 화살표 장식 — 가로선+대각선의 교차 각도가 CSS 재현으로는 어긋나서(대각선이 박스
                      밖으로 삐져나감), 피그마가 내려준 원본 SVG를 그대로 쓴다. */}
                  <img
                    src={getImageUrl('RYZE/journey2-arrow.svg')}
                    alt=""
                    className="absolute pointer-events-none select-none"
                    style={{ left: ppx(1005), top: ppx(147 - 137), width: ppx(106.408), height: ppx(22.944) }}
                  />
                  {/* 노드 다이어그램(6단계 경로+번호+"Ready to Shift?") + 라이즈 심볼 플로리시 —
                      위 바깥 div가 이미 블록 전체를 스케일하므로 여기서 별도로 scale하지 않는다. */}
                  <div className="absolute" style={{ left: 0, top: ppx(JOURNEY2_BLOCK_TOP_GAP), width: ppx(2405), height: ppx(928) }}>
                  <p
                    className="absolute whitespace-nowrap"
                    style={{ left: ppx(137), top: ppx(14), fontFamily: RYZE_FONT, fontWeight: 700, fontSize: ppx(24.82), letterSpacing: `${ppx(0.4964)}px`, color: '#0A0A0A' }}
                  >
                    Ready to Shift?
                  </p>
                  {/* 6단계 노드 다이어그램 — 원+구불구불한 연결선은 피그마가 내려준 SVG를 그대로
                      쓴다(손으로 다시 그리면 곡선 오차가 생기기 쉽다). 숫자·단계명은 그 위에
                      별도 텍스트로 얹는다(피그마 원본 구조와 동일). */}
                  <img
                    src={getImageUrl('RYZE/journey2-path.svg')}
                    alt=""
                    className="absolute pointer-events-none select-none"
                    style={{ left: ppx(139), top: ppx(0), width: ppx(904), height: ppx(788) }}
                  />
                  {RYZE_JOURNEY2_STAGES.map((s) => {
                    // "반전(활성화)" 상태를 오버레이가 열려있는 스테이지(journeyOverlayStage)와
                    // 같은 값으로 취급한다 — 예전엔 스테이지별 boolean 토글 맵(journeyStageActive)을
                    // 따로 들고 있었는데, 그러면 4번을 켠 채 5번을 켜도 4번의 토글은 꺼지지 않아
                    // 여러 원이 동시에 반전 상태로 남는 버그가 있었다. 단일 값(journeyOverlayStage)
                    // 하나로 "지금 선택된 스테이지"를 표현하면 항상 최대 하나만 활성화된다.
                    const isActive = journeyOverlayStage === s.num;
                    return (
                    <React.Fragment key={s.num}>
                      {/* Interest(2)/Purchase(4)/Retention(6)는 연결선 곡선이 라벨 바로 그
                          자리를 지나간다. 라벨은 원래 위치 그대로 두고, 대신 라벨 주변(여유를
                          둔 사각형)만 배경색(#F9FAFB)으로 덮어 그 밑을 지나던 선을 지운다 — 선이
                          라벨에 닿기 전에 끊겼다가 지나간 뒤 다시 이어지는 것처럼 보인다. 반드시
                          원(버튼)보다 먼저 그려야 한다 — 나중에 그리면 원이 호버로 커질 때
                          이 사각형이 그 위를 덮어 원 가장자리가 잘린 것처럼 보인다. */}
                      {JOURNEY2_LABEL_LINE_GAP[s.num] && (
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: ppx(JOURNEY2_LABEL_LINE_GAP[s.num].left),
                            top: ppx(JOURNEY2_LABEL_LINE_GAP[s.num].top),
                            width: ppx(JOURNEY2_LABEL_LINE_GAP[s.num].width),
                            height: ppx(JOURNEY2_LABEL_LINE_GAP[s.num].height),
                            backgroundColor: '#F9FAFB',
                          }}
                        />
                      )}
                      {/* 파동(ripple) 힌트 — 처음엔 1번에 있다가, 사용자가 원을 클릭할 때마다
                          "다음" 번호로 넘어간다(journeyRippleTarget, 1→2→3→...). "이 원을 누를
                          수 있다"는 걸 알려주고, 한 번 눌러본 뒤엔 "다음은 여기"로 계속 안내를
                          이어간다. 오버레이 슬라이드가 열려 있어도(다른 스테이지를 보고 있는
                          중이라도) 계속 재생돼야 한다 — 슬라이드를 닫아야만 다음 힌트가 보이면
                          "다음엔 뭘 눌러야 하는지" 미리 알 수 없기 때문. 버튼과 같은 중심좌표에서
                          커지며 옅어지는 원을 무한 반복하고, 클릭을 가로채지 않도록
                          pointer-events-none. */}
                      {/* 반복(loop) 경계에서 끊겨 보이는 원인 — 예전엔 opacity가 0.6→0으로
                          easeOut(끝으로 갈수록 느려짐)만 타서, 한 사이클이 끝나기 직전엔
                          거의 다 사그라들었지만 완전히 0은 아닌 채로 다음 사이클의 시작값
                          (0.6, 다시 선명하게 보임)으로 순간 리셋되며 "뚝" 튀어 보였다.
                          opacity를 0→0.6→0 키프레임으로 명시해 각 사이클이 스스로 0에서
                          시작해 0으로 끝나게 하면, 반복 경계에서 값이 이어져 끊김이 없다. */}
                      {s.num === journeyRippleTarget && (
                        <motion.div
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            left: ppx(s.numLeft - 32),
                            top: ppx(s.numTop - 318 + 18 - 32),
                            width: ppx(64),
                            height: ppx(64),
                            border: `${ppx(2)}px solid #0A0A0A`,
                          }}
                          initial={{ scale: 1, opacity: 0 }}
                          animate={{ scale: [1, 1.8], opacity: [0, 0.85, 0] }}
                          transition={{ duration: 1, times: [0, 0.15, 1], ease: 'easeOut', repeat: Infinity }}
                        />
                      )}
                      {/* 단계 원 — 기본은 검정 배경+흰 숫자(경로 svg에서 원 도형은 이미 지웠고,
                          이 버튼이 그 자리를 대신한다). 호버하면 살짝 커져서(scale) 눌러볼 수 있는
                          요소라는 걸 직관적으로 알려주고, 클릭하면 배경/테두리가 반전된
                          "윤곽선만 있는 원"으로 토글된다(다시 클릭하면 원래대로). 숫자 색은 같은
                          isActive 값을 공유해서 항상 원 색과 대비되게 맞춘다.
                          CSS :hover + transition 대신 motion.button의 whileHover를 쓴다 — 이 화면은
                          스크롤에 따라 activeSection 등 state가 자주 바뀌면서 상위가 리렌더되는데,
                          매 리렌더마다 button의 style 객체가 새로 만들어지면서 브라우저가 CSS
                          트랜지션을 "새로 시작한 것"으로 취급해 호버 애니메이션이 재생 중간에
                          끊기고 즉시 최종값으로 스냅해버리는 문제가 있었다. Framer Motion은 제스처
                          애니메이션을 React 렌더 사이클 밖(자체 애니메이션 엔진)에서 처리하므로
                          이 리렌더 간섭에서 자유롭다. */}
                      <motion.button
                        type="button"
                        aria-label={`${s.num}. ${s.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setJourneyOverlayStage((prev) => (prev === s.num ? null : s.num));
                          // 방금 클릭한 원의 "다음" 번호로 파동 힌트를 넘긴다(1→2, 2→3, ...).
                          // 6번(마지막)을 클릭하면 더 안내할 다음 단계가 없으니 힌트를 끈다.
                          const next = Number(s.num) + 1;
                          setJourneyRippleTarget(next <= 6 ? String(next) : null);
                        }}
                        className="absolute rounded-full cursor-pointer"
                        whileHover={{ scale: 1.18 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          left: ppx(s.numLeft - 32),
                          top: ppx(s.numTop - 318 + 18 - 32),
                          width: ppx(64),
                          height: ppx(64),
                          boxSizing: 'border-box',
                          backgroundColor: isActive ? '#F9FAFB' : '#0A0A0A',
                          border: `${ppx(2.4)}px solid #0A0A0A`,
                          padding: 0,
                        }}
                      />
                      {/* 숫자 — 원의 중심(circleCenterX≈numLeft, circleCenterY≈numTop+18)을 기준으로
                          64x64 박스를 만들고 flex로 정중앙 정렬한다. top/left 오프셋 값을 눈대중으로
                          맞추는 대신(폰트마다 글자가 박스 안에서 차지하는 실제 잉크 위치가 달라
                          "시스템상 정중앙"이어도 시각적으로는 치우쳐 보인다), 폰트가 바뀌어도 항상
                          원과 맞게 재조정할 수 있게 배치를 통일했다. lineHeight:1 + 작은 보정치
                          (numOpticalNudge)로 Satoshi 숫자 글리프의 시각적 무게중심을 원 중심에 맞춘다. */}
                      <p
                        className="absolute whitespace-nowrap flex items-center justify-center pointer-events-none"
                        style={{
                          left: ppx(s.numLeft - 32),
                          top: ppx(s.numTop - 318 + 18 - 32),
                          width: ppx(64),
                          height: ppx(64),
                          transform: (s.numNudgeX || s.numNudgeY) ? `translate(${ppx(s.numNudgeX ?? 0)}px, ${ppx(s.numNudgeY ?? 0)}px)` : undefined,
                          lineHeight: 1,
                          fontFamily: RYZE_FONT,
                          fontWeight: 700,
                          fontSize: ppx(24.82),
                          letterSpacing: `${ppx(0.4964)}px`,
                          color: isActive ? '#0A0A0A' : '#F9FAFB',
                        }}
                      >
                        {s.num}
                      </p>
                      <p
                        className="absolute whitespace-nowrap text-center"
                        style={{
                          left: ppx(s.labelLeft),
                          top: ppx(s.labelTop - 318),
                          transform: 'translateX(-50%)',
                          fontFamily: RYZE_FONT,
                          fontWeight: 700,
                          fontSize: ppx(24.82),
                          letterSpacing: `${ppx(0.4964)}px`,
                          color: '#0A0A0A',
                        }}
                      >
                        {s.label}
                      </p>
                    </React.Fragment>
                    );
                  })}
                  {/* 로고 심볼 — 이전엔 피그마 노드(3103:48)의 합성 렌더(export, 248x169)를 썼는데
                      이 export가 배경색으로 꽉 찬 불투명 PNG라 밑을 지나는 연결선이 심볼 박스
                      영역에서 가려지는 문제가 있었다(별도 브릿지로 땜질했다가 어긋나서 결국
                      제거). 사용자가 실제 누끼(알파 투명) 딴 원본 아트웍
                      (`로고(심볼)_누끼제거_블랙.webp`, 2048x1152, 별 잉크 바운딩박스는
                      548,226~1522,888)을 줘서 교체 — 투명 배경이라 연결선이 별 주변에서 자연스럽게
                      비쳐 보이고, 해상도도 높아져(2048x1152) 확대해도 덜 흐리다. width/height/left/top은
                      이 잉크 바운딩박스가 이전 248x169 박스와 정확히 같은 화면 크기·위치에 오도록
                      역산한 값(scale ≈ 248/974)이다. */}
                  <img
                    src={getImageUrl('RYZE/로고(심볼)_누끼제거_블랙.webp')}
                    alt=""
                    className="absolute pointer-events-none select-none"
                    style={{ left: ppx(222 - 100), top: ppx(648 + 2.5), width: ppx(522), height: ppx(294) }}
                  />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* 여덟 번째(마지막) 화면 — "비즈니스 모델". 클래식 비즈니스 모델 캔버스(9블록: 파트너십/
          활동/자원/가치 제안/관계/채널/세그먼트/비용 구조/수익원) 레이아웃을 검정 풀블리드
          배경 위에 재현한다. 다른 Planning 화면과 달리 화면 전체가 어두운 배경이라, 좌상단
          "PLANNING" 라벨과 우측 TOC 모서리 색도 반전해야 해서 RYZE_PLANNING_DARK_CORNER_SECTIONS
          / RYZE_TOC_DARK_CORNER_SECTIONS의 8번째(index 7) 값을 true로 맞춰뒀다. */}
      {isPlanning && (
        // 공용 RyzePlanningScreen(자식 "absolute inset-0" div에 배경을 주는 방식) 대신, 이
        // 화면만 배경색을 래퍼(실제 화면 경계·overflow-hidden을 가진 요소) 자신에게 직접
        // 준다 — background-color는 자기 자신의 border-box를 정의상 정확히 채우므로, 자식
        // 요소가 뷰포트 높이/스케일 반올림 오차로 경계를 살짝 못 채워 하단에 흰 틈이 비치는
        // 현상이 구조적으로 생길 수 없다. 공용 컴포넌트를 건드리지 않고 이 화면에만 적용해
        // 다른 Planning 화면(페르소나·저니맵 등)에 영향이 가지 않게 범위를 좁혔다.
        //
        // height를 +2, zIndex를 1로 준 이유 — 모든 화면 사이의 "-mt-px" 겹침은 원래 다음
        // 화면(DOM 순서상 나중=항상 위에 그려짐)이 현재 화면의 바닥 틈을 덮어 가리기 위한
        // 장치인데, 이 장치는 양쪽이 "같은 색"일 때만 티가 안 난다. 비즈니스 모델(검정) 바로
        // 다음이 프로덕트 로드맵(흰색)이라 색이 바뀌는 경계라서, 뷰포트 높이/스케일의
        // 서브픽셀 반올림으로 이 화면의 실제 렌더링 높이가 뷰포트보다 0.1~1px 짧아지는
        // 순간 그 겹침 구간에서 "나중" 화면인 로드맵의 흰색이 위에 그려져 버려 하단에 얇은
        // 흰 줄로 비쳤다. 바닥쪽으로 2px 더 키우고(위쪽은 안 건드림 — 저니맵 쪽 경계에 영향
        // 없음) z-index로 다음 화면보다 위에 그려지게 해, 그 서브픽셀 구간에서도 검정이
        // 로드맵의 흰색을 덮도록 강제한다.
        <div
          className="ryze-planning-screen relative shrink-0 -mt-px overflow-hidden"
          style={{ height: designCanvasH + 2, backgroundColor: '#0A0A0A', zIndex: 1 }}
        >
          <div
            className="absolute left-24 md:left-44 right-40 md:right-68 top-52 md:top-60 bottom-44 md:bottom-48 flex flex-col gap-6"
          >
            {/* 위쪽 5열 — 파트너십 | 활동/자원(세로 2단) | 가치 제안 | 관계/채널(세로 2단) |
                세그먼트. flex-[62]/flex-[38]로 위(캔버스 5열)와 아래(비용/수익) 행 비율을
                62:38로 나눈다. */}
            <div className="flex-[62] flex gap-6 min-h-0">
              <RyzeBmcCard {...RYZE_BMC_BLOCKS[0]} index={0} className="w-[20%]" />
              <div className="w-[16%] flex flex-col gap-6">
                <RyzeBmcCard {...RYZE_BMC_BLOCKS[1]} index={1} className="flex-[38]" />
                <RyzeBmcCard {...RYZE_BMC_BLOCKS[2]} index={2} className="flex-[62]" />
              </div>
              <RyzeBmcCard {...RYZE_BMC_BLOCKS[3]} index={3} className="w-[24%]" />
              <div className="w-[16%] flex flex-col gap-6">
                <RyzeBmcCard {...RYZE_BMC_BLOCKS[4]} index={4} className="flex-[38]" />
                <RyzeBmcCard {...RYZE_BMC_BLOCKS[5]} index={5} className="flex-[62]" />
              </div>
              <RyzeBmcCard {...RYZE_BMC_BLOCKS[6]} index={6} className="w-[20%]" />
            </div>
            {/* 아래쪽 2열 — 비용 구조 | 수익원 */}
            <div className="flex-[38] flex gap-6 min-h-0">
              <RyzeBmcCard {...RYZE_BMC_BLOCKS[7]} index={7} className="w-[38%]" />
              <RyzeBmcCard {...RYZE_BMC_BLOCKS[8]} index={8} className="w-[62%]" />
            </div>
          </div>
        </div>
      )}
      {/* 아홉 번째(마지막) 화면 — "프로덕트 로드맵". 피그마 레퍼런스(node 2900:486)의 NOW/NEXT/
          LATER 3단 레이아웃을 그대로 재현한다. 밝은 페이지 배경(#F9FAFB) 화면이라 PLANNING
          라벨/TOC 모서리는 RYZE_PLANNING_DARK_CORNER_SECTIONS / RYZE_TOC_DARK_CORNER_SECTIONS의
          9번째(index 8) 값을 false로 맞춰뒀다(기본 어두운 잉크). */}
      {isPlanning && (
        <RyzePlanningScreen designCanvasH={designCanvasH}>
          <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="flex-1 flex min-h-0">
              {RYZE_ROADMAP_COLUMNS.map((col, i) => (
                <RyzeRoadmapColumn key={col.title} {...col} index={i} last={i === RYZE_ROADMAP_COLUMNS.length - 1} />
              ))}
            </div>
            {/* 하단 Key Assumptions — 위 3단 레이아웃과 가로 구분선으로 분리, 왼쪽 제목(칼럼
                타이틀과 같은 규격) + 오른쪽 불릿 목록. */}
            <div
              className="shrink-0 flex items-start px-10 md:px-14 pt-16 md:pt-20 pb-18 md:pb-24"
              style={{ gap: ppx(64), borderTop: '1px solid #0A0A0A' }}
            >
              <motion.p
                {...ryzeRevealUp(RYZE_ROADMAP_ARRIVAL_DELAY + 0.3, RYZE_ROADMAP_ARRIVAL_AMOUNT)}
                className="shrink-0"
                style={{ fontFamily: RYZE_FONT, fontWeight: 700, fontSize: ppx(24.823), color: '#0A0A0A' }}
              >
                Key Assumptions
              </motion.p>
              <motion.div
                {...ryzeRevealUp(RYZE_ROADMAP_ARRIVAL_DELAY + 0.4, RYZE_ROADMAP_ARRIVAL_AMOUNT)}
                className="flex flex-col justify-start"
                style={{ gap: ppx(12) }}
              >
                {RYZE_ROADMAP_KEY_ASSUMPTIONS.map((a, i) => (
                  <div key={i} className="flex items-start" style={{ gap: ppx(8) }}>
                    <span style={{ ...RYZE_ROADMAP_BODY_STYLE, flexShrink: 0 }}>·</span>
                    <span style={RYZE_ROADMAP_BODY_STYLE}>{a}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </RyzePlanningScreen>
      )}
      </RyzeDesignScaleLayer>
    </motion.div>
  );
};

export default RyzeWorkChapterDetail;
