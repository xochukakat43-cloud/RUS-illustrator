import paper from 'paper';
import type { ArtboardConfig, ViewportState } from './types';

export class Viewport {
  private scope: paper.PaperScope;
  private artboards: ArtboardConfig[] = [
    {
      id: 'artboard-1',
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
      backgroundColor: '#ffffff',
      name: 'Артборд 1',
    },
  ];
  private activeArtboardIndex: number = 0;

  private onViewportChange: (state: ViewportState) => void;

  constructor(scope: paper.PaperScope, onViewportChange: (state: ViewportState) => void) {
    this.scope = scope;
    this.onViewportChange = onViewportChange;
  }

  public getArtboard(): ArtboardConfig {
    const ab = this.artboards[this.activeArtboardIndex] || this.artboards[0];
    return {
      id: ab.id || 'artboard-1',
      x: ab.x ?? 0,
      y: ab.y ?? 0,
      width: ab.width,
      height: ab.height,
      backgroundColor: ab.backgroundColor,
      name: ab.name,
    };
  }

  public getArtboards(): ArtboardConfig[] {
    return this.artboards.map((ab, idx) => ({
      id: ab.id || `artboard-${idx + 1}`,
      x: ab.x ?? 0,
      y: ab.y ?? 0,
      width: ab.width,
      height: ab.height,
      backgroundColor: ab.backgroundColor,
      name: ab.name,
    }));
  }

  public getActiveArtboardIndex(): number {
    return this.activeArtboardIndex;
  }

  public setActiveArtboardIndex(index: number): void {
    if (index >= 0 && index < this.artboards.length) {
      this.activeArtboardIndex = index;
      this.notifyChange();
    }
  }

  public setArtboard(config: Partial<ArtboardConfig>): void {
    const cur = this.artboards[this.activeArtboardIndex] || this.artboards[0];
    this.artboards[this.activeArtboardIndex] = {
      ...cur,
      ...config,
      x: config.x !== undefined ? config.x : (cur.x ?? 0),
      y: config.y !== undefined ? config.y : (cur.y ?? 0),
    };
    this.notifyChange();
  }

  public setArtboards(artboards: ArtboardConfig[], activeIndex: number = 0): void {
    if (artboards.length > 0) {
      this.artboards = artboards.map((ab, idx) => ({
        id: ab.id || `artboard-${idx + 1}`,
        x: ab.x ?? 0,
        y: ab.y ?? 0,
        width: ab.width,
        height: ab.height,
        backgroundColor: ab.backgroundColor || '#ffffff',
        name: ab.name || `Артборд ${idx + 1}`,
      }));
      this.activeArtboardIndex = Math.max(0, Math.min(activeIndex, this.artboards.length - 1));
      this.notifyChange();
    }
  }

  public addArtboard(config?: Partial<ArtboardConfig>): ArtboardConfig {
    // Find rightmost point across existing artboards
    let maxX = 0;
    for (const ab of this.artboards) {
      const right = (ab.x ?? 0) + ab.width;
      if (right > maxX) maxX = right;
    }

    const newIndex = this.artboards.length + 1;
    const newArtboard: ArtboardConfig = {
      id: `artboard-${Date.now()}`,
      x: config?.x !== undefined ? config.x : maxX + 100,
      y: config?.y !== undefined ? config.y : 0,
      width: config?.width || 1200,
      height: config?.height || 800,
      backgroundColor: config?.backgroundColor || '#ffffff',
      name: config?.name || `Артборд ${newIndex}`,
    };

    this.artboards.push(newArtboard);
    this.activeArtboardIndex = this.artboards.length - 1;
    this.notifyChange();
    return newArtboard;
  }

  public removeArtboard(idOrIndex: string | number): boolean {
    if (this.artboards.length <= 1) return false;

    if (typeof idOrIndex === 'number') {
      if (idOrIndex >= 0 && idOrIndex < this.artboards.length) {
        this.artboards.splice(idOrIndex, 1);
      }
    } else {
      this.artboards = this.artboards.filter((ab) => ab.id !== idOrIndex);
    }

    if (this.activeArtboardIndex >= this.artboards.length) {
      this.activeArtboardIndex = this.artboards.length - 1;
    }
    this.notifyChange();
    return true;
  }

  public getZoom(): number {
    return this.scope.view.zoom;
  }

  public setZoom(zoom: number, centerPoint?: paper.Point): void {
    const clampedZoom = Math.max(0.05, Math.min(64.0, zoom));
    if (centerPoint) {
      const currentZoom = this.scope.view.zoom;
      const factor = clampedZoom / currentZoom;
      const viewCenter = this.scope.view.center;
      const newCenter = centerPoint.subtract(centerPoint.subtract(viewCenter).divide(factor));
      this.scope.view.center = newCenter;
      this.scope.view.zoom = clampedZoom;
    } else {
      this.scope.view.zoom = clampedZoom;
    }
    this.notifyChange();
  }

  public pan(delta: paper.Point, isScreenDelta: boolean = true): void {
    const projectDelta = isScreenDelta ? delta.divide(this.scope.view.zoom) : delta;
    this.scope.view.center = this.scope.view.center.subtract(projectDelta);
    this.notifyChange();
  }

  public fitArtboard(index?: number): void {
    const viewSize = this.scope.view.viewSize;
    if (viewSize.width === 0 || viewSize.height === 0) return;

    const ab = index !== undefined ? this.artboards[index] : this.getArtboard();
    if (!ab) return;

    const margin = 80;
    const availableWidth = Math.max(100, viewSize.width - margin * 2);
    const availableHeight = Math.max(100, viewSize.height - margin * 2);

    const scaleX = availableWidth / ab.width;
    const scaleY = availableHeight / ab.height;
    const fitZoom = Math.min(scaleX, scaleY, 2.0);

    const abX = ab.x ?? 0;
    const abY = ab.y ?? 0;

    this.scope.view.zoom = fitZoom;
    this.scope.view.center = new this.scope.Point(abX + ab.width / 2, abY + ab.height / 2);
    this.notifyChange();
  }

  public fitAllArtboards(): void {
    const viewSize = this.scope.view.viewSize;
    if (viewSize.width === 0 || viewSize.height === 0) return;

    const bounds = this.getAllArtboardsBounds();
    const margin = 80;
    const availableWidth = Math.max(100, viewSize.width - margin * 2);
    const availableHeight = Math.max(100, viewSize.height - margin * 2);

    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const fitZoom = Math.min(scaleX, scaleY, 2.0);

    this.scope.view.zoom = fitZoom;
    this.scope.view.center = bounds.center;
    this.notifyChange();
  }

  public zoomIn(): void {
    this.setZoom(this.getZoom() * 1.25);
  }

  public zoomOut(): void {
    this.setZoom(this.getZoom() / 1.25);
  }

  public resetZoom(): void {
    this.setZoom(1.0);
  }

  public screenToProject(point: paper.Point): paper.Point {
    return this.scope.view.viewToProject(point);
  }

  public projectToScreen(point: paper.Point): paper.Point {
    return this.scope.view.projectToView(point);
  }

  public getArtboardBounds(index?: number): paper.Rectangle {
    const ab = index !== undefined ? this.artboards[index] : this.getArtboard();
    if (!ab) {
      return new this.scope.Rectangle(0, 0, 1200, 800);
    }
    return new this.scope.Rectangle(ab.x ?? 0, ab.y ?? 0, ab.width, ab.height);
  }

  public getAllArtboardsBounds(): paper.Rectangle {
    if (this.artboards.length === 0) {
      return new this.scope.Rectangle(0, 0, 1200, 800);
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const ab of this.artboards) {
      const left = ab.x ?? 0;
      const top = ab.y ?? 0;
      const right = left + ab.width;
      const bottom = top + ab.height;

      if (left < minX) minX = left;
      if (top < minY) minY = top;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }

    return new this.scope.Rectangle(minX, minY, maxX - minX, maxY - minY);
  }

  public getState(): ViewportState {
    return {
      zoom: this.scope.view.zoom,
      panX: this.scope.view.center.x,
      panY: this.scope.view.center.y,
    };
  }

  private notifyChange(): void {
    this.onViewportChange(this.getState());
  }
}
