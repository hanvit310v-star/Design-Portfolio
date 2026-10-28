// 용어 옆에 붙는 호버 설명 툴팁(플로팅 카드) — 프로젝트 상세 페이지 본문(및 그 안의
// 프로젝트 데이터, src/data/projects.tsx)에서 전문 용어를 풀어 설명할 때 재사용한다.
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { arrow, autoUpdate, flip, FloatingPortal, offset, safePolygon, shift, useFloating, useHover, useInteractions } from '@floating-ui/react';

export const TermTooltip = ({ term, description }: { term: string, description: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [arrowEl, setArrowEl] = useState<HTMLDivElement | null>(null);

  const { refs, floatingStyles, placement, middlewareData, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 16 }),
      arrow({ element: arrowEl }),
    ],
  });

  const hover = useHover(context, {
    handleClose: safePolygon(),
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <span className="relative inline-block">
      <span 
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-flex items-center justify-center px-2 py-1 mr-1 my-1 rounded-md bg-white/10 border border-white/20 text-white/90 cursor-help transition-colors hover:bg-white/20"
      >
        {term}
      </span>
      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <div
              ref={refs.setFloating}
              style={{ ...floatingStyles, zIndex: 9999 }}
              {...getFloatingProps()}
            >
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="w-[max-content] max-w-[90vw] sm:max-w-[380px] p-4 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl relative pointer-events-auto"
              >
                <div className="text-xs text-white/80 leading-relaxed font-sans whitespace-normal text-left">
                  {description}
                </div>
                <div
                  ref={setArrowEl}
                  style={{
                    position: 'absolute',
                    left: middlewareData.arrow?.x != null ? `${middlewareData.arrow.x}px` : '',
                    top: middlewareData.arrow?.y != null ? `${middlewareData.arrow.y}px` : '',
                    [placement.startsWith('top') ? 'bottom' : 'top']: '-5px',
                    width: '10px',
                    height: '10px',
                    background: '#1a1a1a',
                    borderRight: placement.startsWith('top') ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    borderBottom: placement.startsWith('top') ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    borderLeft: placement.startsWith('bottom') ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    borderTop: placement.startsWith('bottom') ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    transform: 'rotate(45deg)',
                  }}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </span>
  );
};
