import React, { useEffect, useRef } from 'react';
import type { Editor } from '../../core/Editor';
import type { ArtboardConfig, GuidesConfig, ToolType, ViewportState } from '../../core/types';
import { RulerView } from './RulerView';

interface CanvasViewProps {
  editor: Editor | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeTool: ToolType;
  viewport: ViewportState;
  artboard: ArtboardConfig;
  guidesConfig: GuidesConfig;
}

const TOOL_NAMES: Record<ToolType, string> = {
  select: 'Выделение (Selection Tool)',
  'direct-select': 'Прямое выделение узлов (Direct Selection)',
  pen: 'Перо Безье (Pen Tool)',
  pencil: 'Карандаш / Свободная кисть (Pencil)',
  text: 'Текст (Type Tool)',
  eyedropper: 'Пипетка (Eyedropper)',
  rectangle: 'Прямоугольник (Rectangle)',
  ellipse: 'Эллипс (Ellipse)',
  polygon: 'Многоугольник (Polygon Tool)',
  star: 'Звезда (Star Tool)',
  line: 'Отрезок (Line)',
  gradient: 'Градиент (Gradient Tool)',
  pan: 'Панорамирование (Hand Tool)',
  zoom: 'Масштаб (Zoom Tool)',
};

export const CanvasView: React.FC<CanvasViewProps> = ({
  editor,
  canvasRef,
  activeTool,
  viewport,
  artboard,
  guidesConfig,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!editor) return;
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const proj = editor.viewport.screenToProject(new editor.scope.Point(screenX, screenY));
      if (coordsRef.current) {
        coordsRef.current.textContent = `X: ${Math.round(proj.x)} px   Y: ${Math.round(proj.y)} px`;
      }
    };

    const handleMouseLeave = () => {
      if (coordsRef.current) {
        coordsRef.current.textContent = '';
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [canvasRef, editor]);

  const showRulers = guidesConfig?.showRulers ?? true;
  const rulerOffset = showRulers ? 20 : 0;

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-ai-darkest select-none">
      {/* Workspace container */}
      <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden select-none bg-ai-darkest">
        {showRulers && (
          <RulerView
            editor={editor}
            viewport={viewport}
            containerRef={containerRef}
            canvasRef={canvasRef}
          />
        )}

        {/* Canvas container */}
        <div
          className="absolute overflow-hidden select-none"
          style={{
            top: rulerOffset,
            left: rulerOffset,
            right: 0,
            bottom: 0,
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block focus:outline-none select-none"
            tabIndex={0}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 bg-ai-header border-t border-ai-border px-3 flex items-center justify-between text-[11px] text-ai-textMuted select-none shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span className="font-medium text-ai-textLight">
            {TOOL_NAMES[activeTool]}
          </span>
          <span className="hidden sm:inline opacity-70">
            {artboard.name} ({artboard.width} × {artboard.height} px)
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono">
          <span ref={coordsRef} />
          <span>{Math.round(viewport.zoom * 100)}%</span>
        </div>
      </footer>
    </div>
  );
};
