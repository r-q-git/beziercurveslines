import { Point } from 'src/app/core/models/point.model';

export function getClosestPointOnSegment(
  px: number,
  py: number,
  p1: Point,
  p2: Point,
): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // 1. Calculate the squared length of the segment
  const l2 = dx * dx + dy * dy;

  // 2. If the segment is just a single point, return that point to avoid division by zero
  if (l2 === 0) return { x: p1.x, y: p1.y };

  // 3. Find the projection 't' of the point (px, py) onto the segment.
  // 't' is a normalized value where 0 is p1 and 1 is p2.
  let t = ((px - p1.x) * dx + (py - p1.y) * dy) / l2;

  // 4. Clamp 't' between 0 and 1 so the cursor doesn't "leak" off the ends of the line
  t = Math.max(0, Math.min(1, t));

  // 5. Calculate the final snapped coordinates
  return {
    x: p1.x + t * dx,
    y: p1.y + t * dy,
  };
}
