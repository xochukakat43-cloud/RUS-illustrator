---
name: vector-geometry
description: >-
  Expert reference and algorithms for 2D computational geometry, Bezier curves,
  Paper.js geometry primitives, Boolean path operations, and parametric shape generation.
---

# Vector Geometry & Curve Algorithms

Use this skill when implementing new vector tools (Stars, Polygons, Corner Rounding, Scissors, Gradients) or debugging path math.

## 1. Bezier Curve Math & Smoothing

### Cubic Bezier Formulation
A cubic Bezier segment is defined by:
\[
B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3, \quad t \in [0, 1]
\]
- In Paper.js, each `paper.Segment` stores:
  - `point`: anchor position \(P_0\)
  - `handleIn`: relative vector \(P_1 - P_0\)
  - `handleOut`: relative vector \(P_2 - P_0\)

### Smooth Transition (Continuous Tangent)
For a node to be continuous (\(C^1\)), `handleIn` and `handleOut` must be collinear (opposite directions):
```ts
segment.handleOut = delta;
segment.handleIn = delta.multiply(-1);
```

---

## 2. Parametric Shapes Generation

### Star Geometry (N-Point Star)
A star with \(N\) points has \(2N\) vertices alternating between outer radius \(R\) and inner radius \(r\):
```ts
export function createStarPath(
  center: paper.Point,
  points: number = 5,
  outerRadius: number = 50,
  innerRadius: number = 25
): paper.Path {
  const path = new paper.Path();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const angle = i * step - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    path.add(new paper.Point(x, y));
  }
  path.closed = true;
  return path;
}
```

### Regular Polygon Geometry
A polygon with \(N\) sides:
```ts
export function createPolygonPath(
  center: paper.Point,
  sides: number = 6,
  radius: number = 50
): paper.Path {
  const path = new paper.Path();
  const step = (Math.PI * 2) / sides;
  for (let i = 0; i < sides; i++) {
    const angle = i * step - Math.PI / 2;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    path.add(new paper.Point(x, y));
  }
  path.closed = true;
  return path;
}
```

---

## 3. Live Corner Radius (Corner Rounding)

To round sharp polygon/rectangle vertices into circular arcs:
1. For each corner segment \(P_i\) between \(P_{i-1}\) and \(P_{i+1}\):
2. Compute normalized direction vectors:
   \(\vec{u} = \frac{P_{i-1} - P_i}{\|P_{i-1} - P_i\|}\), \(\vec{v} = \frac{P_{i+1} - P_i}{\|P_{i+1} - P_i\|}\).
3. Compute tangent points offset by radius \(r\):
   \(T_1 = P_i + \vec{u} \cdot r\), \(T_2 = P_i + \vec{v} \cdot r\).
4. Replace \(P_i\) with an arc from \(T_1\) to \(T_2\), or two Bezier handles with factor \(\kappa \approx 0.55228\).

---

## 4. Boolean Operations & Pathfinder
Paper.js provides constructive solid geometry operations on closed paths:
- `path1.unite(path2)`: Union
- `path1.subtract(path2)`: Difference (Minus Front)
- `path1.intersect(path2)`: Intersection
- `path1.exclude(path2)`: Symmetric Difference (XOR)

Always ensure input paths are closed (`path.closed = true`) and orientations are normalized before Boolean operations.
