import paper from 'paper';
import type { Editor } from './Editor';
import type { DirectSelectionInfo, SelectionInfo } from './types';

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

    // Filter items in mainLayer that are selected and not helper guides
    return mainLayer.getItems({
      selected: true,
      match: (item: paper.Item) => item.parent === mainLayer || item.parent instanceof paper.Group
    });
  }

  public clearSelection(): void {
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
        opacity: null,
        isPath: false,
        isGroup: false,
      };
    }

    let unionBounds = items[0].bounds.clone();
    for (let i = 1; i < items.length; i++) {
      unionBounds = unionBounds.unite(items[i].bounds);
    }

    const firstItem = items[0];
    const fillHex = firstItem.fillColor ? firstItem.fillColor.toCSS(true) : null;
    const strokeHex = firstItem.strokeColor ? firstItem.strokeColor.toCSS(true) : null;

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
      strokeColor: strokeHex,
      strokeWidth: firstItem.strokeWidth || 0,
      opacity: firstItem.opacity ?? 1,
      isPath: firstItem instanceof paper.Path,
      isGroup: firstItem instanceof paper.Group,
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
      item.position.x += dx;
      item.position.y += dy;
    });

    this.updateSelection();
    this.editor.history.pushState();
  }
}
