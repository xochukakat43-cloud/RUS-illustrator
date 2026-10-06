import type paper from 'paper';
import type { AlignMode, AlignType } from '../types';

export class Alignment {
  public static execute(
    items: paper.Item[],
    type: AlignType,
    mode: AlignMode,
    artboardBounds: paper.Rectangle
  ): void {
    if (items.length === 0) return;
    if (mode === 'selection' && items.length < 2 && !type.startsWith('distribute')) return;

    // Calculate reference bounds
    let refBounds: paper.Rectangle;

    if (mode === 'artboard' || items.length === 1) {
      refBounds = artboardBounds;
    } else {
      // Union of all items' bounds
      let unionBounds = items[0].bounds.clone();
      for (let i = 1; i < items.length; i++) {
        unionBounds = unionBounds.unite(items[i].bounds);
      }
      refBounds = unionBounds;
    }

    switch (type) {
      case 'left':
        items.forEach((item) => {
          item.position.x += refBounds.left - item.bounds.left;
        });
        break;

      case 'horizontalCenter':
        items.forEach((item) => {
          item.position.x += refBounds.center.x - item.bounds.center.x;
        });
        break;

      case 'right':
        items.forEach((item) => {
          item.position.x += refBounds.right - item.bounds.right;
        });
        break;

      case 'top':
        items.forEach((item) => {
          item.position.y += refBounds.top - item.bounds.top;
        });
        break;

      case 'verticalCenter':
        items.forEach((item) => {
          item.position.y += refBounds.center.y - item.bounds.center.y;
        });
        break;

      case 'bottom':
        items.forEach((item) => {
          item.position.y += refBounds.bottom - item.bounds.bottom;
        });
        break;

      case 'distributeHorizontally':
        if (items.length > 2) {
          const sorted = [...items].sort((a, b) => a.bounds.left - b.bounds.left);
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const totalDistance = last.bounds.left - first.bounds.left;
          const step = totalDistance / (sorted.length - 1);

          for (let i = 1; i < sorted.length - 1; i++) {
            sorted[i].position.x += (first.bounds.left + step * i) - sorted[i].bounds.left;
          }
        }
        break;

      case 'distributeVertically':
        if (items.length > 2) {
          const sorted = [...items].sort((a, b) => a.bounds.top - b.bounds.top);
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const totalDistance = last.bounds.top - first.bounds.top;
          const step = totalDistance / (sorted.length - 1);

          for (let i = 1; i < sorted.length - 1; i++) {
            sorted[i].position.y += (first.bounds.top + step * i) - sorted[i].bounds.top;
          }
        }
        break;
    }
  }
}
