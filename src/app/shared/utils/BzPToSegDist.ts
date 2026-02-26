import { Point } from 'src/app/core/models/point.model';

export function pToSegDist(x: number, y: number, a: Point, b: Point): number {
  const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  if (l2 === 0) return Math.hypot(x - a.x, y - a.y);
  const t = Math.max(
    0,
    Math.min(1, ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / l2),
  );
  return Math.hypot(x - (a.x + t * (b.x - a.x)), y - (a.y + t * (b.y - a.y)));
}
