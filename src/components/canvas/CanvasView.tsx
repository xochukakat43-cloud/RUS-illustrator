import React, { useEffect, useState } from 'react';
import type { ArtboardConfig, ToolType, ViewportState } from '../../core/types';

interface CanvasViewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeTool: ToolType;
  viewport: ViewportState;
  artboard: ArtboardConfig;
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
  line: 'Отрезок (Line)',
  pan: 'Панорамирование (Hand Tool)',
  zoom: 'Масштаб (Zoom Tool)',
};

export const CanvasView: React.FC<CanvasViewProps> = ({
  canvasRef,
  activeTool,
  viewport,
  artboard,
}) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Calculate artboard coordinates
      const zoom = viewport.zoom || 1;
      const panX = viewport.panX || 0;
      const panY = viewport.panY || 0;

      // Project coord = (screen - screenCenter) / zoom + viewCenter
      const screenCenterX = rect.width / 2;
      const screenCenterY = rect.height / 2;
      const projX = Math.round((screenX - screenCenterX) / zoom + panX);
      const projY = Math.round((screenY - screenCenterY) / zoom + panY);

      setMousePos({ x: projX, y: projY });
    };

    const handleMouseLeave = () => {
      setMousePos(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [canvasRef, viewport]);

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-ai-darkest select-none">
      {/* Canvas container */}
      <div className="relative flex-1 w-full h-full overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full block focus:outline-none select-none"
          tabIndex={0}
        />
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
          {mousePos && (
            <span>
              X: {mousePos.x} px &nbsp; Y: {mousePos.y} px
            </span>
          )}
          <span>{Math.round(viewport.zoom * 100)}%</span>
        </div>
      </footer>
    </div>
  );
};
