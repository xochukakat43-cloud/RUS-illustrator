import paper from 'paper';
import type { PathfinderOp } from '../types';

export class Pathfinder {
  public static execute(items: paper.Item[], op: PathfinderOp): paper.Item | null {
    if (items.length < 2) return null;

    // Filter to only path or compound path items
    const validItems = items.filter(
      (item) => item instanceof paper.PathItem
    ) as paper.PathItem[];

    if (validItems.length < 2) return null;

    // Preserve stylistic attributes from bottom or top item (Illustrator uses bottom item for styling)
    const baseItem = validItems[0];
    const fillColor = baseItem.fillColor;
    const strokeColor = baseItem.strokeColor;
    const strokeWidth = baseItem.strokeWidth;
    const strokeCap = baseItem.strokeCap;
    const strokeJoin = baseItem.strokeJoin;
    const opacity = baseItem.opacity;
    const parent = baseItem.parent;

    let result: paper.PathItem = validItems[0];

    for (let i = 1; i < validItems.length; i++) {
      const nextItem = validItems[i];
      let newResult: paper.PathItem | null = null;

      try {
        switch (op) {
          case 'unite':
            newResult = result.unite(nextItem) as paper.PathItem;
            break;
          case 'subtract':
            newResult = result.subtract(nextItem) as paper.PathItem;
            break;
          case 'intersect':
            newResult = result.intersect(nextItem) as paper.PathItem;
            break;
          case 'exclude':
            newResult = result.exclude(nextItem) as paper.PathItem;
            break;
        }
      } catch (err) {
        console.error('Pathfinder operation failed:', err);
        return null;
      }

      if (newResult) {
        // Clean up intermediate result if it was generated during loop
        if (result !== validItems[0]) {
          result.remove();
        }
        result = newResult;
      }
    }

    // Apply styles to final result
    result.fillColor = fillColor;
    result.strokeColor = strokeColor;
    result.strokeWidth = strokeWidth;
    result.strokeCap = strokeCap;
    result.strokeJoin = strokeJoin;
    result.opacity = opacity;

    // Remove the original items from scene
    validItems.forEach((item) => item.remove());

    if (parent) {
      parent.addChild(result);
    }

    result.selected = true;
    return result;
  }
}
