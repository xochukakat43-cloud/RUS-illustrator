import paper from 'paper';
import type { Editor } from './Editor';
import type { DirectSelectionInfo, GradientDef, GradientStop, SelectionInfo } from './types';
import { applyCornerRadius } from './tools/ShapeTools';

export class SelectionManager {
  private editor: Editor;
  private selectedSegment: paper.Segment | null = null;
  private selectedHandle: 'in' | 'out' | null = null;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  public getSelectedItems(): paper.Item[] {
    const mainLayer = this.editor.getMainLayer();
    if (!mainLayer) return [];

    // Filter items in mainLayer that are selected and not the layer itself
    const items = mainLayer.getItems({
      selected: true,
      match: (item: paper.Item) => item !== mainLayer && !(item instanceof paper.Layer),
    });

    // Exclude items whose ancestor is already selected to avoid double transforms
    return items.filter((item) => {
      let p = item.parent;
      while (p && p !== mainLayer) {
        if (p.selected) return false;
        p = p.parent;
      }
      return true;
    });
  }

  public clearSelection(): void {
    const mainLayer = this.editor.getMainLayer();
    if (mainLayer) {
      mainLayer.selected = false;
    }

    const items = this.getSelectedItems();
    items.forEach((item) => {
      item.selected = false;
      if (item instanceof paper.Path) {
        item.fullySelected = false;
      }
    });
    this.selectedSegment = null;
    this.selectedHandle = null;
    this.updateSelection();
  }

  public selectItem(item: paper.Item, additive: boolean = false): void {
    if (!item || item instanceof paper.Layer) return;

    if (!additive) {
      this.clearSelection();
    }
    item.selected = true;
    this.updateSelection();
  }

  public deleteSelected(): void {
    const items = this.getSelectedItems();
    if (items.length === 0) return;

    items.forEach((item) => item.remove());
    this.selectedSegment = null;
    this.selectedHandle = null;
    this.updateSelection();
    this.editor.history.pushState();
  }

  public updateSelection(): void {
    this.editor.notifySelectionChange();
  }

  public getSelectionInfo(): SelectionInfo {
    const items = this.getSelectedItems();
    if (items.length === 0) {
      return {
        count: 0,
        bounds: null,
        fillColor: null,
        strokeColor: null,
        strokeWidth: null,
        dashArray: null,
        opacity: null,
        isPath: false,
        isGroup: false,
        isText: false,
      };
    }

    let unionBounds = items[0].bounds.clone();
    for (let i = 1; i < items.length; i++) {
      unionBounds = unionBounds.unite(items[i].bounds);
    }

    const firstItem = items[0];
    let fillHex: string | null = null;
    let gradientInfo: GradientDef | null = null;

    if (firstItem.fillColor && (firstItem.fillColor as any).gradient) {
      const g = (firstItem.fillColor as any).gradient;
      const stops: GradientStop[] = (g.stops || []).map((s: any) => ({
        color: s.color ? s.color.toCSS(true) : '#000000',
        offset: s.offset ?? 0,
      }));
      const originPoint = (firstItem.fillColor as any).origin;
      const destPoint = (firstItem.fillColor as any).destination;
      gradientInfo = {
        type: g.radial ? 'radial' : 'linear',
        stops,
        origin: originPoint ? { x: originPoint.x, y: originPoint.y } : undefined,
        destination: destPoint ? { x: destPoint.x, y: destPoint.y } : undefined,
      };
    } else if (firstItem.fillColor) {
      fillHex = firstItem.fillColor.toCSS(true);
    }

    const strokeHex = firstItem.strokeColor ? firstItem.strokeColor.toCSS(true) : null;

    const isText = firstItem instanceof paper.PointText;
    const textItem = isText ? (firstItem as paper.PointText) : null;

    return {
      count: items.length,
      bounds: {
        x: Math.round(unionBounds.x),
        y: Math.round(unionBounds.y),
        width: Math.round(unionBounds.width),
        height: Math.round(unionBounds.height),
        rotation: 0,
      },
      fillColor: fillHex,
      gradient: gradientInfo,
      strokeColor: strokeHex,
      strokeWidth: firstItem.strokeWidth || 0,
      dashArray: firstItem.dashArray ? [...firstItem.dashArray] : null,
      opacity: firstItem.opacity ?? 1,
      isPath: firstItem instanceof paper.Path,
      isGroup: firstItem instanceof paper.Group,
      isText,
      cornerRadius: typeof firstItem.data?.cornerRadius === 'number' ? firstItem.data.cornerRadius : 0,
      textContent: textItem ? textItem.content : undefined,
      fontFamily: textItem ? textItem.fontFamily : undefined,
      fontSize: textItem
        ? typeof textItem.fontSize === 'number'
          ? textItem.fontSize
          : parseFloat(textItem.fontSize as string) || 36
        : undefined,
      fontWeight: textItem ? (textItem.fontWeight as string) : undefined,
    };
  }

  public getDirectSelectionInfo(): DirectSelectionInfo {
    if (!this.selectedSegment) {
      return {
        selectedSegmentCount: 0,
        isSmooth: null,
      };
    }

    const hasHandles =
      !this.selectedSegment.handleIn.isZero() || !this.selectedSegment.handleOut.isZero();

    return {
      selectedSegmentCount: 1,
      isSmooth: hasHandles,
    };
  }

  public getSelectedSegment(): paper.Segment | null {
    return this.selectedSegment;
  }

  public setSelectedSegment(segment: paper.Segment | null, handle: 'in' | 'out' | null = null): void {
    this.selectedSegment = segment;
    this.selectedHandle = handle;
    this.updateSelection();
  }

  public getSelectedHandle(): 'in' | 'out' | null {
    return this.selectedHandle;
  }

  public convertPointToCorner(): void {
    if (!this.selectedSegment) return;
    this.selectedSegment.handleIn = new paper.Point(0, 0);
    this.selectedSegment.handleOut = new paper.Point(0, 0);
    this.updateSelection();
    this.editor.history.pushState();
  }

  public convertPointToSmooth(): void {
    if (!this.selectedSegment) return;
    this.selectedSegment.smooth({ type: 'continuous' });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyFill(color: string | null): void {
    const items = this.getSelectedItems();
    if (items.length === 0) return;

    items.forEach((item) => {
      item.fillColor = color ? new paper.Color(color) : null as any;
    });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyGradient(gradientDef: GradientDef): void {
    const items = this.getSelectedItems();
    if (items.length === 0) return;

    items.forEach((item) => {
      const bounds = item.bounds;
      const isRadial = gradientDef.type === 'radial';
      const pOrigin = gradientDef.origin
        ? new paper.Point(gradientDef.origin.x, gradientDef.origin.y)
        : isRadial
        ? bounds.center
        : bounds.topLeft;

      const pDest = gradientDef.destination
        ? new paper.Point(gradientDef.destination.x, gradientDef.destination.y)
        : isRadial
        ? bounds.center.add(new paper.Point(Math.max(bounds.width, bounds.height) / 2, 0))
        : bounds.bottomRight;

      const pStops = gradientDef.stops.map(
        (s) => new paper.GradientStop(new paper.Color(s.color), s.offset)
      );
      const pGradient = new (paper as any).Gradient(pStops, isRadial);

      item.fillColor = new paper.Color(pGradient, pOrigin, pDest);
    });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyStroke(color: string | null): void {
    const items = this.getSelectedItems();
    if (items.length === 0) return;

    items.forEach((item) => {
      item.strokeColor = color ? new paper.Color(color) : null as any;
    });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyStrokeWidth(width: number): void {
    const items = this.getSelectedItems();
    if (items.length === 0) return;

    items.forEach((item) => {
      item.strokeWidth = width;
    });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyOpacity(opacity: number): void {
    const items = this.getSelectedItems();
    if (items.length === 0) return;

    items.forEach((item) => {
      item.opacity = opacity;
    });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyCornerRadius(radius: number): void {
    const items = this.getSelectedItems();
    if (items.length === 0) return;

    items.forEach((item) => {
      if (item instanceof paper.Path) {
        applyCornerRadius(item, radius);
      }
    });

    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyBounds(newBounds: { x: number; y: number; width: number; height: number }): void {
    const items = this.getSelectedItems();
    if (items.length === 0) return;

    let currentBounds = items[0].bounds.clone();
    for (let i = 1; i < items.length; i++) {
      currentBounds = currentBounds.unite(items[i].bounds);
    }

    if (currentBounds.width === 0 || currentBounds.height === 0) return;

    const scaleX = newBounds.width / currentBounds.width;
    const scaleY = newBounds.height / currentBounds.height;
    const dx = newBounds.x - currentBounds.x;
    const dy = newBounds.y - currentBounds.y;

    items.forEach((item) => {
      // Scale relative to current bounds top-left
      const relOrigin = currentBounds.topLeft;
      item.scale(scaleX, scaleY, relOrigin);
      item.position = item.position.add(new paper.Point(dx, dy));
    });

    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyTextContent(content: string): void {
    const items = this.getSelectedItems();
    items.forEach((item) => {
      if (item instanceof paper.PointText) {
        item.content = content;
      }
    });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyFontFamily(fontFamily: string): void {
    const items = this.getSelectedItems();
    items.forEach((item) => {
      if (item instanceof paper.PointText) {
        item.fontFamily = fontFamily;
      }
    });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyFontSize(size: number): void {
    const items = this.getSelectedItems();
    items.forEach((item) => {
      if (item instanceof paper.PointText) {
        item.fontSize = size;
      }
    });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyFontWeight(weight: string): void {
    const items = this.getSelectedItems();
    items.forEach((item) => {
      if (item instanceof paper.PointText) {
        item.fontWeight = weight;
      }
    });
    this.updateSelection();
    this.editor.history.pushState();
  }

  public applyDashArray(dashArray: number[] | null): void {
    const items = this.getSelectedItems();
    items.forEach((item) => {
      item.dashArray = dashArray || [];
    });
    this.updateSelection();
    this.editor.history.pushState();
  }
}
