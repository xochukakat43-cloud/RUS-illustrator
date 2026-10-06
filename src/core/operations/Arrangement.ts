import paper from 'paper';

export class Arrangement {
  public static bringToFront(items: paper.Item[]): void {
    items.forEach((item) => item.bringToFront());
  }

  public static sendToBack(items: paper.Item[]): void {
    // Reverse order to preserve relative ordering
    [...items].reverse().forEach((item) => item.sendToBack());
  }

  public static bringForward(items: paper.Item[]): void {
    items.forEach((item) => {
      const nextSibling = item.nextSibling;
      if (nextSibling) {
        item.insertAbove(nextSibling);
      }
    });
  }

  public static sendBackward(items: paper.Item[]): void {
    items.forEach((item) => {
      const prevSibling = item.previousSibling;
      if (prevSibling) {
        item.insertBelow(prevSibling);
      }
    });
  }

  public static group(items: paper.Item[]): paper.Group | null {
    if (items.length < 2) return null;

    const parent = items[0].parent;
    if (!parent) return null;

    const group = new paper.Group(items);
    parent.addChild(group);
    group.selected = true;
    return group;
  }

  public static ungroup(groups: paper.Group[]): paper.Item[] {
    const extractedItems: paper.Item[] = [];

    groups.forEach((group) => {
      if (group instanceof paper.Group) {
        const parent = group.parent;
        if (!parent) return;

        const children = [...group.children];
        children.forEach((child) => {
          parent.addChild(child);
          child.selected = true;
          extractedItems.push(child);
        });
        group.remove();
      }
    });

    return extractedItems;
  }
}
