import { Point } from 'src/app/core/models/point.model';

export function getPath(pts: Point[], type: string): string {
  if (pts.length < 2) return '';

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];

    if (type === 'straight') {
      d += ` L ${p2.x} ${p2.y}`;
    } else if (type === 'step') {
      d += ` L ${p2.x} ${p1.y} L ${p2.x} ${p2.y}`;
    } else if (type === 'curve') {
      const f = 0.35;

      const cp1x = p1.x + (p2.x - p1.x) * f;
      const cp1y = p1.y + (p2.y - p1.y) * 0.1;

      const cp2x = p2.x - (p2.x - p1.x) * f;
      const cp2y = p2.y - (p2.y - p1.y) * 0.1;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  return d;
}
