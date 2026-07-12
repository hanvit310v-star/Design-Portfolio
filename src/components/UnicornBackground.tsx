import React, { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    UnicornStudio: any;
  }
}

// unicorn.studio 워터마크 강제 제거 유틸.
// canvas(또는 canvas를 품은 요소)는 절대 건드리지 않고, 임베드 컨테이너 안의 '비-canvas' 요소와
// 문서 전역의 unicorn 워터마크 흔적(링크/이미지)만 제거한다.
// 흰색 배지/어두운 알약 등 배지 형태가 환경마다 달라도 모두 대응한다.
const removeBadge = (el: Element | null) => {
  if (!el || el.tagName === 'CANVAS') return;
  if (el.querySelector && el.querySelector('canvas')) return; // canvas를 품은 요소는 보호
  el.remove();
};

const killUnicornWatermark = () => {
  // 1) 임베드 컨테이너 안에서 canvas가 아닌(=canvas를 품지 않은) 모든 요소 = 워터마크 → 제거
  document.querySelectorAll('[data-us-project]').forEach((c) => {
    Array.from(c.children).forEach((ch) => removeBadge(ch));
  });
  // 2) 문서 어디든 남아있는 unicorn 워터마크 흔적 제거 (링크/이미지 변형 대비)
  document
    .querySelectorAll('a[href*="unicorn.studio" i], img[src*="made_in_us" i], img[alt*="unicorn" i]')
    .forEach((el) => removeBadge((el.closest('a') as Element) || el));
  // 3) 텍스트 기반(어두운 알약 배지가 div/span+텍스트로 붙는 변형 대비). 짧은 텍스트만 매칭해 본문 오인 제거 방지.
  document.querySelectorAll('a, div, span, p, button').forEach((el) => {
    if (el.children.length > 1) return; // 배지는 단순 요소 — 자식 많은 컨테이너는 제외
    const t = (el.textContent || '').trim().toLowerCase();
    if (t.length < 40 && (t.includes('made with unicorn') || t === 'unicorn.studio')) {
      removeBadge((el.closest('a') as Element) || el);
    }
  });
};

interface UnicornBackgroundProps {
  projectId?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  hideOnMobile?: boolean;
  delayInit?: number;
}

export default React.memo(function UnicornBackground({ 
  projectId = "b6GFRsHM7mhh80x4vsB2",
  width = "100%",
  height = "100%",
  className = "fixed inset-0 z-0 pointer-events-none overflow-hidden",
  hideOnMobile = true,
  delayInit = 600 // Default 600ms delay to allow page transition animations to finish smoothly
}: UnicornBackgroundProps) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hideOnMobile) return;
    const checkIsDesktop = () => setIsDesktop(window.innerWidth > 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, [hideOnMobile]);

  useEffect(() => {
    if (hideOnMobile && !isDesktop) return;

    setIsLoaded(false);
    let timeoutId: NodeJS.Timeout;

    const initUnicorn = () => {
      if (window.UnicornStudio && containerRef.current) {
        // Only init if it hasn't been initialized yet (no canvas child)
        if (!containerRef.current.querySelector('canvas')) {
          window.UnicornStudio.init();
        }
        killUnicornWatermark();
        // Fade in slightly after init to prevent sudden pop-in
        setTimeout(() => setIsLoaded(true), 100);
      }
    };

    // 워터마크 강제 제거: init 직후 반복 스윕 + 동적 주입 감시(MutationObserver).
    // 배지는 init 직후 '한 번' 주입되므로, 감시는 임베드 컨테이너로만 좁히고(=상시 전역 스캔 방지)
    // 10초 뒤 옵저버를 끊어 메모리/CPU 상시 점유를 없앤다. canvas는 보호하므로 애니메이션엔 영향 없음.
    killUnicornWatermark();
    const sweeps = [150, 400, 800, 1500, 3000, 5000].map((t) => setTimeout(killUnicornWatermark, t));
    let rafScheduled = false;
    const watermarkObserver = new MutationObserver(() => {
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(() => { rafScheduled = false; killUnicornWatermark(); });
    });
    if (containerRef.current) {
      watermarkObserver.observe(containerRef.current, { childList: true });
    }
    const stopWatermarkObserver = setTimeout(() => watermarkObserver.disconnect(), 10000);

    const scriptId = 'unicorn-studio-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.5/dist/unicornStudio.umd.js";
      script.async = true;
      script.onload = () => {
        timeoutId = setTimeout(initUnicorn, delayInit);
      };
      document.body.appendChild(script);
    } else {
      // If script is already loaded, init after the delay
      if (window.UnicornStudio) {
        timeoutId = setTimeout(initUnicorn, delayInit);
      } else {
        script.addEventListener('load', () => {
          timeoutId = setTimeout(initUnicorn, delayInit);
        }, { once: true });
      }
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(stopWatermarkObserver);
      sweeps.forEach(clearTimeout);
      watermarkObserver.disconnect();
      if (window.UnicornStudio && typeof window.UnicornStudio.destroy === 'function') {
        try {
          window.UnicornStudio.destroy();
        } catch (e) {
          console.error("Error destroying UnicornStudio:", e);
        }
      }
      // Manually clean up the container to ensure WebGL contexts/canvases are removed
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [projectId, isDesktop, hideOnMobile, delayInit]);

  if (hideOnMobile && !isDesktop) {
    return <div className={`${className} bg-[#050505]`} />;
  }

  return (
    <div className={className}>
      <div className={`w-full h-full transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* 성능 최적화: 렌더 해상도 dpi 1.0(기본 1.5 대비 픽셀 ~55%↓), 프레임 30fps(초당 GPU 작업 절반).
            앰비언트 배경이라 화질 체감 차이는 거의 없음. */}
        <div ref={containerRef} style={{ width, height }} data-us-project={projectId} data-us-dpi="1" data-us-fps="30"></div>
      </div>
    </div>
  );
});
