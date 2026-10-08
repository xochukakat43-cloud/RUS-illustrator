# Guidelines for Vector Studio (AI Illustrator) Development

## 1. Paper.js Layer Architecture & Isolation
The project strictly isolates rendering into three dedicated Paper.js layers within a single `PaperScope`:
1. `artboardLayer`: Contains the document background rectangle, drop shadow, and grid guides. Never select or remove these during tool interactions.
2. `mainLayer`: Contains all user vector objects (paths, shapes, groups, text). All drawing tools must insert their paths into `mainLayer`.
3. `overlayLayer`: Contains temporary interactive UI (transform bounding boxes, rotation stems, scale handles, marquee selection rectangles, rubberbands).
   - Temporary shapes (like `marqueeBox`) must be instantiated with `{ insert: false }` before adding to `overlayLayer` so they never pollute `mainLayer`.

### Strict Rule: Layers Must NEVER Be Selected
- In Paper.js, `paper.Layer` inherits from `paper.Group` (`layer instanceof paper.Group === true`).
- **NEVER** traverse groups without stopping at layers:
  ```ts
  while (targetItem.parent && targetItem.parent instanceof paper.Group && !(targetItem.parent instanceof paper.Layer)) {
    targetItem = targetItem.parent;
  }
  ```
- `mainLayer.selected` must ALWAYS remain `false`.

---

## 2. 60 FPS Canvas Performance & React State Separation
- **No React state spam on drag**: During `onMouseDrag`, NEVER invoke `editor.notifySelectionChange()` or dispatch full React state updates on every pixel of movement.
- Update Paper.js item coordinates and visual handles directly in Canvas memory.
- Dispatch React state notifications (properties, layer tree, history) only in `onMouseUp` or throttled at low frequency.

---

## 3. Coordinate Systems & Viewport Transformations
- `event.point` and `event.lastPoint` in Paper.js `ToolEvent` are already in **Project Coordinates**.
- `event.delta` is in **Project Coordinates** (already scaled by zoom).
- DOM wheel events (`e.deltaX`, `e.deltaY`) are in **Screen Coordinates**.
- When panning via `Viewport.pan(delta, isScreenDelta)`:
  - If `isScreenDelta === true`, divide by `zoom`.
  - If `isScreenDelta === false` (from `ToolEvent`), use delta directly.

---

## 4. Item Position and Transform Mutations
- In Paper.js, `item.position.x += dx` is ignored by internal setters. Always assign the full point:
  ```ts
  item.position = item.position.add(new paper.Point(dx, dy));
  ```
- When scaling via handles, compute incremental scale ratios relative to the opposite anchor point to avoid exponential compounding and `NaN` errors.

---

## 5. History & Serialization
- When serializing with `exportJSON` or `importJSON`, protect against nested layer creation.
- Keep `mainLayer` children clean of internal helper nodes.
