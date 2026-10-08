---
name: canvas-performance
description: >-
  Performance engineering patterns for 60 FPS HTML5 Canvas, Paper.js redraw batching,
  spatial partitioning, and memory leak prevention.
---

# Canvas Performance & 60 FPS Architecture

Use this skill when profiling or optimizing rendering, reducing lag during complex path dragging, or managing thousands of vector elements.

## 1. Frame Budget & Event Decoupling
- HTML5 Canvas redraw budget: **16.6ms** per frame for 60 FPS.
- Native `mousemove` events can fire at 120Hz – 1000Hz (on high-polling gaming mice).
- Never trigger React `setState` from mouse drag events.
- Keep tool interaction state purely inside the Paper.js tool lifecycle:
  - `onMouseDown`: Cache starting positions, record initial bounds.
  - `onMouseDrag`: Mutate items directly, let Paper.js view handle drawing.
  - `onMouseUp`: Sync with React state (`SelectionInfo`, `LayerNode`, `HistoryManager.pushState()`).

---

## 2. Redraw Batching & Dirty Rectangles
- Paper.js by default batches redrawing to `requestAnimationFrame` via `view.requestUpdate()`.
- Do not call manual `view.draw()` inside hot loops.
- Use `insert: false` when creating temporary computation paths so Paper.js doesn't mount them into the active project tree:
  ```ts
  const tempPath = new paper.Path({ insert: false });
  ```

---

## 3. Spatial Partitioning for Hit-Testing
When a document grows past 1,000+ objects:
- Naive `hitTest` scans all items in $O(N)$ time.
- Filter candidates by bounding box intersection before detailed segment hit testing:
  ```ts
  const candidates = layer.children.filter((child) => child.bounds.intersects(testArea));
  ```
- Keep guides, helpers, and bounding overlays in `overlayLayer` so hit testing on `mainLayer` ignores all UI decorations automatically.

---

## 4. Memory Management & Scope Cleanup
- Avoid orphaned `PaperScope` instances: always call `scope.project?.clear()` and remove attached event listeners in `Editor.destroy()`.
- When removing paths, use `path.remove()` to clean up segment references and unbind internal Paper.js caches.
