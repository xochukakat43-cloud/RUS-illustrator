import type paper from 'paper';
import type { ArtboardConfig } from '../types';

export class Exporter {
  public static exportSVG(scope: paper.PaperScope, artboard: ArtboardConfig): string {
    const mainLayer = scope.project.layers.find((l) => l.name === 'main') || scope.project.activeLayer;

    // Clone main layer or export directly with bounds
    const svgElement = mainLayer.exportSVG({
      asString: false,
      bounds: new scope.Rectangle(0, 0, artboard.width, artboard.height),
      precision: 5,
    }) as SVGElement;

    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('width', `${artboard.width}`);
    svgElement.setAttribute('height', `${artboard.height}`);
    svgElement.setAttribute('viewBox', `0 0 ${artboard.width} ${artboard.height}`);

    // If background color is not transparent/white default, insert rect
    if (artboard.backgroundColor && artboard.backgroundColor !== 'transparent') {
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', artboard.backgroundColor);
      svgElement.insertBefore(bgRect, svgElement.firstChild);
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgElement);
  }

  public static async exportPNG(
    scope: paper.PaperScope,
    artboard: ArtboardConfig,
    scale: number = 1
  ): Promise<string> {
    const svgString = this.exportSVG(scope, artboard);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = artboard.width * scale;
        canvas.height = artboard.height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas 2d context'));
          return;
        }

        // Draw background
        if (artboard.backgroundColor && artboard.backgroundColor !== 'transparent') {
          ctx.fillStyle = artboard.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      img.src = url;
    });
  }

  public static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public static downloadDataUrl(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
