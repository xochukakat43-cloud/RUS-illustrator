import paper from 'paper';

export interface SnapResult {
  delta: paper.Point;
  snappedX: boolean;
  snappedY: boolean;
  guideLines: {
    type: 'vertical' | 'horizontal';
    coord: number;
    from: number;
    to: number;
  }[];
}

export interface SnapOptions {
  threshold?: number;
  snapToArtboard?: boolean;
  snapToObjects?: boolean;
  manualGuides?: { orientation: 'horizontal' | 'vertical'; coord: number }[];
}

export class SmartGuidesEngine {
  private scope: paper.PaperScope;
  private guideItems: paper.Item[] = [];

  constructor(scope: paper.PaperScope) {
    this.scope = scope;
  }

  /**
   * Calculates snapping against other main layer items and artboard bounds.
   */
  public calculateSnap(
    movingBounds: paper.Rectangle,
    rawDelta: paper.Point,
    referenceItems: paper.Item[],
    artboardBounds: paper.Rectangle | null,
    zoom: number,
    options: SnapOptions = {}
  ): SnapResult {
    const threshold = (options.threshold ?? 6) / zoom;
    const proposedBounds = new this.scope.Rectangle(
      movingBounds.x + rawDelta.x,
      movingBounds.y + rawDelta.y,
      movingBounds.width,
      movingBounds.height
    );

    const proposedXCandidates = [
      { coord: proposedBounds.left, origin: 'left' },
      { coord: proposedBounds.center.x, origin: 'center' },
      { coord: proposedBounds.right, origin: 'right' },
    ];

    const proposedYCandidates = [
      { coord: proposedBounds.top, origin: 'top' },
      { coord: proposedBounds.center.y, origin: 'center' },
      { coord: proposedBounds.bottom, origin: 'bottom' },
    ];

    // Collect all snap targets (X and Y)
    const targetXList: { coord: number; minY: number; maxY: number; source: string }[] = [];
    const targetYList: { coord: number; minX: number; maxX: number; source: string }[] = [];

    // 1. Manual Guides
    if (options.manualGuides) {
      for (const g of options.manualGuides) {
        if (g.orientation === 'vertical') {
          targetXList.push({ coord: g.coord, minY: -100000, maxY: 100000, source: 'manual-guide' });
        } else {
          targetYList.push({ coord: g.coord, minX: -100000, maxX: 100000, source: 'manual-guide' });
        }
      }
    }

    // 2. Artboard bounds
    if (options.snapToArtboard !== false && artboardBounds) {
      targetXList.push(
        { coord: artboardBounds.left, minY: artboardBounds.top, maxY: artboardBounds.bottom, source: 'artboard' },
        { coord: artboardBounds.center.x, minY: artboardBounds.top, maxY: artboardBounds.bottom, source: 'artboard' },
        { coord: artboardBounds.right, minY: artboardBounds.top, maxY: artboardBounds.bottom, source: 'artboard' }
      );
      targetYList.push(
        { coord: artboardBounds.top, minX: artboardBounds.left, maxX: artboardBounds.right, source: 'artboard' },
        { coord: artboardBounds.center.y, minX: artboardBounds.left, maxX: artboardBounds.right, source: 'artboard' },
        { coord: artboardBounds.bottom, minX: artboardBounds.left, maxX: artboardBounds.right, source: 'artboard' }
      );
    }

    // 3. Other main layer objects
    if (options.snapToObjects !== false) {
      for (const item of referenceItems) {
        if (!item.visible || item.locked) continue;
        const b = item.bounds;
        if (!b || b.width === 0 || b.height === 0) continue;

        targetXList.push(
          { coord: b.left, minY: b.top, maxY: b.bottom, source: 'object' },
          { coord: b.center.x, minY: b.top, maxY: b.bottom, source: 'object' },
          { coord: b.right, minY: b.top, maxY: b.bottom, source: 'object' }
        );

        targetYList.push(
          { coord: b.top, minX: b.left, maxX: b.right, source: 'object' },
          { coord: b.center.y, minX: b.left, maxX: b.right, source: 'object' },
          { coord: b.bottom, minX: b.left, maxX: b.right, source: 'object' }
        );
      }
    }

    let bestDiffX: number | null = null;
    let bestSnapX: number | null = null;
    let bestTargetXObj: typeof targetXList[0] | null = null;

    for (const cand of proposedXCandidates) {
      for (const target of targetXList) {
        const diff = target.coord - cand.coord;
        if (Math.abs(diff) <= threshold) {
          if (bestDiffX === null || Math.abs(diff) < Math.abs(bestDiffX)) {
            bestDiffX = diff;
            bestSnapX = target.coord;
            bestTargetXObj = target;
          }
        }
      }
    }

    let bestDiffY: number | null = null;
    let bestSnapY: number | null = null;
    let bestTargetYObj: typeof targetYList[0] | null = null;

    for (const cand of proposedYCandidates) {
      for (const target of targetYList) {
        const diff = target.coord - cand.coord;
        if (Math.abs(diff) <= threshold) {
          if (bestDiffY === null || Math.abs(diff) < Math.abs(bestDiffY)) {
            bestDiffY = diff;
            bestSnapY = target.coord;
            bestTargetYObj = target;
          }
        }
      }
    }

    const adjustedDelta = new this.scope.Point(
      rawDelta.x + (bestDiffX !== null ? bestDiffX : 0),
      rawDelta.y + (bestDiffY !== null ? bestDiffY : 0)
    );

    const guideLines: SnapResult['guideLines'] = [];

    if (bestSnapX !== null && bestTargetXObj) {
      const finalMovingY1 = proposedBounds.top + (bestDiffY ?? 0);
      const finalMovingY2 = proposedBounds.bottom + (bestDiffY ?? 0);
      const minY = Math.min(finalMovingY1, bestTargetXObj.minY) - 20 / zoom;
      const maxY = Math.max(finalMovingY2, bestTargetXObj.maxY) + 20 / zoom;

      guideLines.push({
        type: 'vertical',
        coord: bestSnapX,
        from: minY,
        to: maxY,
      });
    }

    if (bestSnapY !== null && bestTargetYObj) {
      const finalMovingX1 = proposedBounds.left + (bestDiffX ?? 0);
      const finalMovingX2 = proposedBounds.right + (bestDiffX ?? 0);
      const minX = Math.min(finalMovingX1, bestTargetYObj.minX) - 20 / zoom;
      const maxX = Math.max(finalMovingX2, bestTargetYObj.maxX) + 20 / zoom;

      guideLines.push({
        type: 'horizontal',
        coord: bestSnapY,
        from: minX,
        to: maxX,
      });
    }

    return {
      delta: adjustedDelta,
      snappedX: bestDiffX !== null,
      snappedY: bestDiffY !== null,
      guideLines,
    };
  }

  /**
   * Renders magnetic alignment lines on the overlay layer.
   */
  public renderGuides(overlayLayer: paper.Layer, guideLines: SnapResult['guideLines'], zoom: number): void {
    this.clearGuides();

    if (guideLines.length === 0) return;

    overlayLayer.activate();
    const magentaColor = new this.scope.Color('#ff007a'); // Signature Illustrator Smart Guide magenta
    const strokeWidth = 1 / zoom;

    guideLines.forEach((g) => {
      let line: paper.Path.Line;
      if (g.type === 'vertical') {
        line = new this.scope.Path.Line({
          from: new this.scope.Point(g.coord, g.from),
          to: new this.scope.Point(g.coord, g.to),
          strokeColor: magentaColor,
          strokeWidth,
          insert: false,
        });
      } else {
        line = new this.scope.Path.Line({
          from: new this.scope.Point(g.from, g.coord),
          to: new this.scope.Point(g.to, g.coord),
          strokeColor: magentaColor,
          strokeWidth,
          insert: false,
        });
      }

      line.data = { isSmartGuide: true };
      overlayLayer.addChild(line);
      this.guideItems.push(line);
    });
  }

  /**
   * Cleans up all rendered smart guide lines.
   */
  public clearGuides(): void {
    this.guideItems.forEach((item) => {
      try {
        item.remove();
      } catch {
        // ignore
      }
    });
    this.guideItems = [];
  }
}
