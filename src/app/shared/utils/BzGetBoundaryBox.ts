import { Line } from 'src/app/core/models/line.model';

export function getBoundingBox(line: Line) {
  const all = [line.start, line.end, ...line.elbows];
  const minX = Math.min(...all.map((p) => p.x)),
    maxX = Math.max(...all.map((p) => p.x));
  return { minY: Math.min(...all.map((p) => p.y)), midX: (minX + maxX) / 2 };
}
