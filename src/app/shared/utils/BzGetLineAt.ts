import { Line } from 'src/app/core/models/line.model';
import { getPath } from './BzGetpath';

export function getLineAt(
  x: number,
  y: number,
  lines: Line[],
  ctx: CanvasRenderingContext2D,
): Line | null {
  // Loop backwards to pick the line "on top"
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    const path = new Path2D(getPath([l.start, ...l.elbows, l.end], l.type));

    // Set a consistent hit-area (20px is usually good for finger/mouse)
    ctx.lineWidth = 20;
    if (ctx.isPointInStroke(path, x, y)) {
      return l;
    }
  }
  return null;
}
