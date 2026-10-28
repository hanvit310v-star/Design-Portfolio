// 포트폴리오 프로젝트 데이터(순수 데이터 — 컴포넌트 로직 없음). Home의 그리드와
// ProjectDetail(src/ProjectDetail.tsx)의 상세 페이지 양쪽에서 이 하나의 배열을 공유한다.
import React from 'react';
import { TermTooltip } from '../components/TermTooltip';

// --- Mock Data ---

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

// 목차(TOC) 영문 라벨의 한글 번역. 마우스를 올렸을 때만 옆에 살짝 노출되며,
// 평소엔 자리를 차지하지 않는다(순수 CSS hover, 레이아웃 영향 없음).
export const TOC_KO: Record<string, string> = {
  'Project Overview': '프로젝트 개요',
  'About': '소개',
  'Background': '배경',
  'Research': '리서치',
  'Strategy': '전략',
  'User Flow': '유저 플로우',
  'UI Specification': '화면 설계서',
  'Responsive Web Design': '반응형 웹',
  'Outcomes': '성과',
  'Result': '결과',
  'Issue': '이슈',
  'Solution': '솔루션',
  'Home': '홈',
  'Category': '카테고리',
  'Search Bar': '검색바',
  'Product Listing Page': '상품 목록',
  'Filter': '필터',
  'Product Detail Page': '상품 상세',
  'Purchase Section': '구매 영역',
  'Review': '리뷰',
  'Community': '커뮤니티',
  'Status Board': '현황판',
  'Management Page': '어드민 페이지',
  'UI Design': 'UI 디자인',
};

export interface Project {
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
  // 기존 ProjectDetail 템플릿(사원증/unicorn 배경 등)과 완전히 다른 디자인으로 만들 프로젝트용.
  // 지정하면 썸네일 클릭 시 /project/:id 대신 이 경로로 이동한다.
  customPath?: string;
}

export const PROJECTS: Project[] = [
  {
    id: 4,
    title: 'RYZE - AI Design Project',
    category: 'Coming Soon',
    image: '',
    // 기존 프로젝트 디테일 템플릿(사원증/unicorn 배경 등)을 쓰지 않고, 완전히 다른
    // 디자인의 전용 페이지로 이동한다. 내용은 추후 별도로 채울 예정.
    customPath: '/project-new',
    portfolioSections: [],
  },
  {
    id: 1,
    title: '추모, 고령 사용자 사용성 개선 UX/UI 기업 프로젝트',
    category: 'Web Design',
    image: 'Choomo/Choomo background image.webp',
    thumbnailPosition: 'object-left',
    unicornProjectId: 'PDAAZKOm9edkvDtWeNJI',
    detailSubtitle: 'DIGITAL SIGNAGE & ADMIN PAGE DESIGN',
    contribution: '문제 정의 · UX 리서치 · 서비스 전략 · IA/플로우 설계 · UI 디자인 · 사용성 테스트 (100%)',
    duration: '2025.08 ~ 2025.10 (2개월)',
    projectProperty: 'B2B SaaS, B2C, O2O',
    retrospective: (
      <>
        <ul className="list-disc pl-5 space-y-12 marker:text-white/40">
          <li>
            '추모'는 탄탄한 거래처를 확보하고 있었으나, 사업 초기 단계의 스타트업으로서 서비스의 실질적인 사용자 데이터가 매우 부족한 상태였습니다. 또한 <TermTooltip term="장례 산업만이 가진 특수성" description={funeralIndustryDescription} />으로 인해 기초적인 데이터 외에 정보를 얻기 힘든 구조의 프로젝트였습니다.
            <span className="block h-3" aria-hidden="true" />
            그렇기에 오프라인에서 직접 인사이트를 도출해야 했고, 유가족의 애도 과정을 존중하며 정서적 개입을 최소화해야 하는 환경적 제약 속에서 <TermTooltip term="에스노그래피(Ethnography)" description="사용자의 실제 생활 환경에 들어가 그들의 행동을 있는 그대로 관찰합니다. 어떤 지점에서 머뭇거리는지, 어떤 비효율적인 도구를 사용하는지 기록합니다." />, <TermTooltip term="쉐도잉(Shadowing)" description="특정 사용자를 그림자처럼 따라다니며 일거수일투족을 기록합니다. 사용자가 &quot;불편함이 없다&quot;고 말해도, 실제 행동에서 나타나는 마찰(Friction)을 포착할 수 있습니다." />, <TermTooltip term="맥락적 인터뷰(Contextual Inquiry)" description="사용자가 실제 업무나 활동을 하고 있는 '맥락' 안에서 질문을 던집니다. 기억에 의존하는 일반 인터뷰보다 훨씬 정확한 실무 데이터를 얻을 수 있습니다." />와 같은 정성 조사와 더불어 <TermTooltip term="동선 및 체류 시간 측정(Tracking & Dwell Time)" description="특정 공간에서 사용자가 이동하는 경로를 도식화하고, 각 단계별로 머무는 시간을 초 단위로 스톱워치 등을 이용해 기록합니다." />, <TermTooltip term="작업 성공률 및 오류율(Task Success/Error Rate)" description="오프라인 환경에서 특정 과업을 수행하게 하고, 이를 한 번에 성공했는지, 몇 번의 시행착오를 거쳤는지 카운팅합니다." /> 과 같은 정량 조사의 비개입 리서치 방법론을 활용했습니다.
            <span className="block h-3" aria-hidden="true" />
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
      { id: 'admin-issue', title: 'Issue', parentTitle: 'Management Page', image: 'Choomo/3-1.Issue.webp' },
      { id: 'admin-solution', title: 'Solution', parentTitle: 'Management Page', image: 'Choomo/3-2.Solution.webp' },
      { id: 'admin-ia', title: 'Information Architecture', parentTitle: 'Management Page', image: 'Choomo/3-3.Information Architecture.webp', hideFromToc: true },
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
      { id: 'ui-specification', title: 'UI Specification', image: 'CGV/4-1.UI Specification.webp' },
      { id: 'home', title: 'Home', parentTitle: 'UI Design', image: 'CGV/5-1.Home.webp' },
      { id: 'community', title: 'Community', parentTitle: 'UI Design', image: 'CGV/5-2.Community.webp' },
      { id: 'last', title: 'Last', image: 'CGV/6.Last.webp', hideFromToc: true }
    ]
  }
];
