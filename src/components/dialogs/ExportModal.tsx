import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, Image as ImageIcon } from 'lucide-react';
import type { Editor } from '../../core/Editor';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, editor }) => {
  if (!isOpen || !editor) return null;

  const [format, setFormat] = useState<'svg' | 'png'>('svg');
  const [pngScale, setPngScale] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const artboard = editor.viewport.getArtboard();
  const svgContent = editor.exportSVG();

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (format === 'svg') {
        if (window.electronAPI?.isElectron) {
          await window.electronAPI.exportFileDialog({
            base64Data: svgContent,
            defaultName: `${artboard.name || 'illustration'}.svg`,
            extension: 'svg',
          });
          onClose();
          return;
        }
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${artboard.name || 'illustration'}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const dataUrl = await editor.exportPNG(pngScale);
        if (window.electronAPI?.isElectron) {
          await window.electronAPI.exportFileDialog({
            base64Data: dataUrl,
            defaultName: `${artboard.name || 'illustration'}@${pngScale}x.png`,
            extension: 'png',
          });
          onClose();
          return;
        }
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${artboard.name || 'illustration'}@${pngScale}x.png`;
        a.click();
      }
      onClose();
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs">
      <div className="w-[540px] max-w-[95vw] rounded-lg border border-ai-border bg-ai-panel shadow-2xl p-5 text-ai-textLight flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-ai-border">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">Экспорт документа</span>
            <span className="text-xs text-ai-textMuted font-mono">
              ({artboard.width} × {artboard.height} px)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
          >
            <X size={18} />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex bg-ai-darkest p-1 rounded-md border border-ai-border">
          <button
            onClick={() => setFormat('svg')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              format === 'svg'
                ? 'bg-ai-accent text-white shadow-xs'
                : 'text-ai-textMuted hover:text-ai-textLight'
            }`}
          >
            <FileCode size={15} />
            Векторный SVG
          </button>
          <button
            onClick={() => setFormat('png')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              format === 'png'
                ? 'bg-ai-accent text-white shadow-xs'
                : 'text-ai-textMuted hover:text-ai-textLight'
            }`}
          >
            <ImageIcon size={15} />
            Растровый PNG
          </button>
        </div>

        {/* Body based on format */}
        {format === 'svg' ? (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-ai-textMuted">
              Чистый SVG код для веба, Figma, Illustrator или мобильной разработки:
            </div>
            <div className="relative">
              <pre className="h-44 overflow-auto p-3 bg-ai-darkest text-emerald-400 font-mono text-[11px] rounded border border-ai-border leading-relaxed">
                {svgContent}
              </pre>
              <button
                onClick={handleCopySvg}
                className="absolute top-2 right-2 px-2.5 py-1 bg-ai-panel hover:bg-ai-hover border border-ai-border text-ai-textLight rounded text-xs flex items-center gap-1.5 shadow-sm"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="text-xs text-ai-textMuted">
              Растеризовать монтажную область в изображение без потерь качества:
            </div>
            <div className="flex items-center gap-4 bg-ai-darker p-3 rounded border border-ai-border">
              <span className="text-xs font-medium">Разрешение:</span>
              <div className="flex gap-2">
                {[1, 2, 3].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setPngScale(scale)}
                    className={`px-3 py-1 rounded text-xs font-medium border ${
                      pngScale === scale
                        ? 'bg-ai-accent border-ai-accent text-white'
                        : 'bg-ai-panel border-ai-border text-ai-textMuted hover:text-ai-textLight'
                    }`}
                  >
                    {scale}x ({artboard.width * scale} × {artboard.height * scale} px)
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-ai-border">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs bg-ai-darker hover:bg-ai-hover border border-ai-border"
          >
            Отмена
          </button>
          <button
            disabled={isExporting}
            onClick={handleDownload}
            className="px-4 py-1.5 bg-ai-accent hover:bg-ai-accentHover text-white rounded text-xs font-medium flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Download size={14} />
            {isExporting ? 'Экспортирую...' : `Скачать ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};
