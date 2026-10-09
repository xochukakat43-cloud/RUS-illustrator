import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Editor } from '../../core/Editor';
import type { ViewportState } from '../../core/types';

interface RulerViewProps {
  editor: Editor | null;
  viewport: ViewportState;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const RULER_THICKNESS = 20; // px
const TICK_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

export const RulerView: React.FC<RulerViewProps> = ({
  editor,
  viewport,
  containerRef,
  canvasRef,
}) => {
  const topCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mousePos, setMousePos] = useState<{ screenX: number; screenY: number } | null>(null);
  const [draggingGuide, setDraggingGuide] = useState<{
    orientation: 'horizontal' | 'vertical';
    screenCoord: number;
    projectCoord: number;
  } | null>(null);

  // Helper to find optimal step size so tick labels don't collide
  const getStep = useCallback((zoom: number) => {
    for (const step of TICK_STEPS) {
      if (step * zoom >= 45) {
        return step;
      }
    }
    return 5000;
  }, []);

  // Redraw rulers
  useEffect(() => {
    if (!editor || !containerRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const topCanvas = topCanvasRef.current;
    const leftCanvas = leftCanvasRef.current;
    const container = containerRef.current;

    const width = container.clientWidth - RULER_THICKNESS;
    const height = container.clientHeight - RULER_THICKNESS;

    if (width <= 0 || height <= 0) return;

    const zoom = viewport.zoom || 1;
    const step = getStep(zoom);
    const subStep = step / 10;
    const halfStep = step / 2;

    // 1. Draw Top Horizontal Ruler
    if (topCanvas) {
      topCanvas.width = width * dpr;
      topCanvas.height = RULER_THICKNESS * dpr;
      topCanvas.style.width = `${width}px`;
      topCanvas.style.height = `${RULER_THICKNESS}px`;

      const ctx = topCanvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(0, 0, width, RULER_THICKNESS);

        ctx.strokeStyle = '#383838';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, RULER_THICKNESS - 0.5);
        ctx.lineTo(width, RULER_THICKNESS - 0.5);
        ctx.stroke();

        ctx.fillStyle = '#8e8e8e';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Calculate visible range in project coordinates
        // screenX = 0 on top ruler is at screen X = RULER_THICKNESS on canvas
        const pStart = editor.viewport.screenToProject(new editor.scope.Point(0, 0)).x;
        const pEnd = editor.viewport.screenToProject(new editor.scope.Point(width, 0)).x;

        const firstTick = Math.floor(Math.min(pStart, pEnd) / step) * step;
        const lastTick = Math.ceil(Math.max(pStart, pEnd) / step) * step;

        // Draw sub-ticks
        ctx.strokeStyle = '#444444';
        for (let p = firstTick; p <= lastTick; p += subStep) {
          const sPoint = editor.viewport.projectToScreen(new editor.scope.Point(p, 0));
          const sx = Math.round(sPoint.x);
          if (sx < 0 || sx > width) continue;

          const isMajor = Math.abs(p % step) < 0.001;
          const isHalf = Math.abs(p % halfStep) < 0.001;
          const tickHeight = isMajor ? 12 : isHalf ? 7 : 4;

          ctx.beginPath();
          ctx.moveTo(sx + 0.5, RULER_THICKNESS - tickHeight);
          ctx.lineTo(sx + 0.5, RULER_THICKNESS);
          ctx.stroke();

          if (isMajor) {
            ctx.fillText(Math.round(p).toString(), sx + 3, 2);
          }
        }

        // Draw mouse hairline on top ruler
        if (mousePos && mousePos.screenX >= 0 && mousePos.screenX <= width) {
          ctx.strokeStyle = '#00c0ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mousePos.screenX + 0.5, 0);
          ctx.lineTo(mousePos.screenX + 0.5, RULER_THICKNESS);
          ctx.stroke();
        }
      }
    }

    // 2. Draw Left Vertical Ruler
    if (leftCanvas) {
      leftCanvas.width = RULER_THICKNESS * dpr;
      leftCanvas.height = height * dpr;
      leftCanvas.style.width = `${RULER_THICKNESS}px`;
      leftCanvas.style.height = `${height}px`;

      const ctx = leftCanvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(0, 0, RULER_THICKNESS, height);

        ctx.strokeStyle = '#383838';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(RULER_THICKNESS - 0.5, 0);
        ctx.lineTo(RULER_THICKNESS - 0.5, height);
        ctx.stroke();

        ctx.fillStyle = '#8e8e8e';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const pStart = editor.viewport.screenToProject(new editor.scope.Point(0, 0)).y;
        const pEnd = editor.viewport.screenToProject(new editor.scope.Point(0, height)).y;

        const firstTick = Math.floor(Math.min(pStart, pEnd) / step) * step;
        const lastTick = Math.ceil(Math.max(pStart, pEnd) / step) * step;

        ctx.strokeStyle = '#444444';
        for (let p = firstTick; p <= lastTick; p += subStep) {
          const sPoint = editor.viewport.projectToScreen(new editor.scope.Point(0, p));
          const sy = Math.round(sPoint.y);
          if (sy < 0 || sy > height) continue;

          const isMajor = Math.abs(p % step) < 0.001;
          const isHalf = Math.abs(p % halfStep) < 0.001;
          const tickWidth = isMajor ? 12 : isHalf ? 7 : 4;

          ctx.beginPath();
          ctx.moveTo(RULER_THICKNESS - tickWidth, sy + 0.5);
          ctx.lineTo(RULER_THICKNESS, sy + 0.5);
          ctx.stroke();

          if (isMajor) {
            ctx.save();
            ctx.translate(2, sy + 3);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(Math.round(p).toString(), 0, 0);
            ctx.restore();
          }
        }

        // Draw mouse hairline on left ruler
        if (mousePos && mousePos.screenY >= 0 && mousePos.screenY <= height) {
          ctx.strokeStyle = '#00c0ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, mousePos.screenY + 0.5);
          ctx.lineTo(RULER_THICKNESS, mousePos.screenY + 0.5);
          ctx.stroke();
        }
      }
    }
  }, [editor, viewport, mousePos, containerRef, getStep]);

  // Handle canvas mouse move to update ruler indicators
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      setMousePos({ screenX: sx, screenY: sy });
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
  }, [canvasRef]);

  // Dragging Guide from Top Ruler
  const startDragHorizontalGuide = (e: React.MouseEvent) => {
    if (!editor || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    const handleMove = (moveEvent: MouseEvent) => {
      const sy = moveEvent.clientY - canvasRect.top;
      const projPoint = editor.viewport.screenToProject(new editor.scope.Point(0, sy));
      setDraggingGuide({
        orientation: 'horizontal',
        screenCoord: sy,
        projectCoord: Math.round(projPoint.y),
      });
    };

    const handleUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);

      const sy = upEvent.clientY - canvasRect.top;
      if (sy > 0) {
        const projPoint = editor.viewport.screenToProject(new editor.scope.Point(0, sy));
        editor.addManualGuide('horizontal', Math.round(projPoint.y));
      }
      setDraggingGuide(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Dragging Guide from Left Ruler
  const startDragVerticalGuide = (e: React.MouseEvent) => {
    if (!editor || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    const handleMove = (moveEvent: MouseEvent) => {
      const sx = moveEvent.clientX - canvasRect.left;
      const projPoint = editor.viewport.screenToProject(new editor.scope.Point(sx, 0));
      setDraggingGuide({
        orientation: 'vertical',
        screenCoord: sx,
        projectCoord: Math.round(projPoint.x),
      });
    };

    const handleUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);

      const sx = upEvent.clientX - canvasRect.left;
      if (sx > 0) {
        const projPoint = editor.viewport.screenToProject(new editor.scope.Point(sx, 0));
        editor.addManualGuide('vertical', Math.round(projPoint.x));
      }
      setDraggingGuide(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <>
      {/* Top Left Corner Box */}
      <div
        className="absolute top-0 left-0 bg-[#181818] border-r border-b border-[#333333] z-20 flex items-center justify-center text-[9px] font-mono text-ai-textMuted select-none cursor-default"
        style={{ width: RULER_THICKNESS, height: RULER_THICKNESS }}
        title="Единицы измерения: px"
      >
        px
      </div>

      {/* Top Horizontal Ruler */}
      <div
        className="absolute top-0 overflow-hidden z-10 cursor-row-resize select-none"
        style={{ left: RULER_THICKNESS, height: RULER_THICKNESS, right: 0 }}
        onMouseDown={startDragHorizontalGuide}
        title="Потяните вниз, чтобы создать горизонтальную направляющую"
      >
        <canvas ref={topCanvasRef} className="block select-none" />
      </div>

      {/* Left Vertical Ruler */}
      <div
        className="absolute left-0 overflow-hidden z-10 cursor-col-resize select-none"
        style={{ top: RULER_THICKNESS, width: RULER_THICKNESS, bottom: 0 }}
        onMouseDown={startDragVerticalGuide}
        title="Потяните вправо, чтобы создать вертикальную направляющую"
      >
        <canvas ref={leftCanvasRef} className="block select-none" />
      </div>

      {/* Live guide line while dragging from ruler */}
      {draggingGuide && (
        <div
          className="absolute pointer-events-none z-30"
          style={
            draggingGuide.orientation === 'horizontal'
              ? {
                  top: RULER_THICKNESS + draggingGuide.screenCoord,
                  left: RULER_THICKNESS,
                  right: 0,
                  height: 1,
                  backgroundColor: '#00c0ff',
                }
              : {
                  left: RULER_THICKNESS + draggingGuide.screenCoord,
                  top: RULER_THICKNESS,
                  bottom: 0,
                  width: 1,
                  backgroundColor: '#00c0ff',
                }
          }
        >
          {/* Coordinate Tooltip */}
          <div
            className="absolute bg-ai-darkest/90 text-cyan-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/50 shadow-md whitespace-nowrap"
            style={
              draggingGuide.orientation === 'horizontal'
                ? { left: 10, top: -20 }
                : { top: 10, left: 6 }
            }
          >
            Y: {draggingGuide.projectCoord} px
          </div>
        </div>
      )}
    </>
  );
};
