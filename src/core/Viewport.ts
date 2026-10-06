import paper from 'paper';
import type { ArtboardConfig, ViewportState } from './types';

export class Viewport {
  private scope: paper.PaperScope;
  private artboard: ArtboardConfig = {
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    name: 'Artboard 1'
  };

  private onViewportChange: (state: ViewportState) => void;

  constructor(scope: paper.PaperScope, onViewportChange: (state: ViewportState) => void) {
    this.scope = scope;
    this.onViewportChange = onViewportChange;
  }

  public getArtboard(): ArtboardConfig {
    return { ...this.artboard };
  }

  public setArtboard(config: Partial<ArtboardConfig>): void {
    this.artboard = { ...this.artboard, ...config };
    this.notifyChange();
  }

  public getZoom(): number {
    return this.scope.view.zoom;
  }

  public setZoom(zoom: number, centerPoint?: paper.Point): void {
    const clampedZoom = Math.max(0.05, Math.min(64.0, zoom));
    if (centerPoint) {
      // Zoom centered at specific point
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

  public pan(delta: paper.Point): void {
    this.scope.view.center = this.scope.view.center.subtract(delta.divide(this.scope.view.zoom));
    this.notifyChange();
  }

  public fitArtboard(): void {
    const viewSize = this.scope.view.viewSize;
    if (viewSize.width === 0 || viewSize.height === 0) return;

    const margin = 80;
    const availableWidth = Math.max(100, viewSize.width - margin * 2);
    const availableHeight = Math.max(100, viewSize.height - margin * 2);

    const scaleX = availableWidth / this.artboard.width;
    const scaleY = availableHeight / this.artboard.height;
    const fitZoom = Math.min(scaleX, scaleY, 2.0);

    this.scope.view.zoom = fitZoom;
    // Artboard is centered around (width/2, height/2)
    this.scope.view.center = new this.scope.Point(this.artboard.width / 2, this.artboard.height / 2);
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

  public getArtboardBounds(): paper.Rectangle {
    return new this.scope.Rectangle(0, 0, this.artboard.width, this.artboard.height);
  }

  public getState(): ViewportState {
    return {
      zoom: this.scope.view.zoom,
      panX: this.scope.view.center.x,
      panY: this.scope.view.center.y
    };
  }

  private notifyChange(): void {
    this.onViewportChange(this.getState());
  }
}
