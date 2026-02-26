import { Line } from 'src/app/core/models/line.model';
import { Point } from 'src/app/core/models/point.model';
import { getClosestPointOnSegment } from './BzGetClosestPointOnSegment';
import { getBezierPoint } from './BzGetBezierPoint';

export function getClosestPointOnLine(
  px: number,
  py: number,
  line: Line,
): Point | null {
  const pts = [line.start, ...line.elbows, line.end];
  let bestPt: Point | null = null;
  let minDist = 30;

  // 1. Terminal Snapping (Nodes)
  for (const pt of pts) {
    if (Math.hypot(px - pt.x, py - pt.y) < 15) return { x: pt.x, y: pt.y };
  }

  // 2. Path Snapping
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];

    // --- STRAIGHT TYPE ---
    if (line.type === 'straight') {
      const snap = getClosestPointOnSegment(px, py, p1, p2);
      const d = Math.hypot(px - snap.x, py - snap.y);
      if (d < minDist) {
        minDist = d;
        bestPt = snap;
      }
    }

    // --- SMOOTH STEP TYPE ---
    else if (line.type === 'step') {
      const corner = { x: p2.x, y: p1.y };
      const r = Math.min(
        20,
        Math.abs(p2.x - p1.x) / 2,
        Math.abs(p2.y - p1.y) / 2,
      );

      const sX = corner.x - (p2.x > p1.x ? r : -r);
      const eY = corner.y + (p2.y > p1.y ? r : -r);

      // Check the horizontal straight leg
      const hSnap = getClosestPointOnSegment(px, py, p1, {
        x: sX,
        y: p1.y,
      });
      const hDist = Math.hypot(px - hSnap.x, py - hSnap.y);
      if (hDist < minDist) {
        minDist = hDist;
        bestPt = hSnap;
      }

      // Check the vertical straight leg
      const vSnap = getClosestPointOnSegment(
        px,
        py,
        { x: corner.x, y: eY },
        p2,
      );
      const vDist = Math.hypot(px - vSnap.x, py - vSnap.y);
      if (vDist < minDist) {
        minDist = vDist;
        bestPt = vSnap;
      }

      // Sample the rounded elbow (Quadratic Bezier)
      for (let t = 0; t <= 1; t += 0.1) {
        const cx =
          Math.pow(1 - t, 2) * sX +
          2 * (1 - t) * t * corner.x +
          Math.pow(t, 2) * corner.x;
        const cy =
          Math.pow(1 - t, 2) * corner.y +
          2 * (1 - t) * t * corner.y +
          Math.pow(t, 2) * eY;
        const d = Math.hypot(px - cx, py - cy);
        if (d < minDist) {
          minDist = d;
          bestPt = { x: cx, y: cy };
        }
      }
    }

    // --- CURVE TYPE ---
    else if (line.type === 'curve') {
      const f = 0.35;
      const cp1x = p1.x + (p2.x - p1.x) * f;
      const cp1y = p1.y + (p2.y - p1.y) * 0.1;
      const cp2x = p2.x - (p2.x - p1.x) * f;
      const cp2y = p2.y - (p2.y - p1.y) * 0.1;

      for (let t = 0; t <= 1; t += 0.01) {
        const cx = getBezierPoint(t, p1.x, cp1x, cp2x, p2.x);
        const cy = getBezierPoint(t, p1.y, cp1y, cp2y, p2.y);
        const dist = Math.hypot(px - cx, py - cy);
        if (dist < minDist) {
          minDist = dist;
          bestPt = { x: cx, y: cy };
        }
      }
    }
  }
  return bestPt;
}
