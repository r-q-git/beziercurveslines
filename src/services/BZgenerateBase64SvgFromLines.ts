import { ElementRef } from '@angular/core';
import { Line, Point } from 'src/models/line.model';

export function BZgenerateBase64SvgFromLines(
  canvasRef: ElementRef<HTMLCanvasElement>,
  lines: Line[],
): string {
  const canvas = canvasRef.nativeElement;

  const width = canvas.width;
  const height = canvas.height;

  let svgContent = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}"
     viewBox="0 0 ${width} ${height}">
`;

  lines.forEach((line: Line) => {
    const pts: Point[] = [line.start, ...(line.elbows || []), line.end];

    // 🔥 EXACT SAME DASH LOGIC AS render()
    const dashArray =
      line.strokeStyle === 'dashed'
        ? `${line.width * 3} ${line.width * 3}`
        : line.strokeStyle === 'dotted'
          ? `0 ${line.width * 2.5}`
          : null;

    svgContent += `
  <path
    d="${getPath(pts, line.type)}"
    fill="none"
    stroke="${line.color}"
    stroke-width="${line.width}"
    stroke-linecap="round"
    stroke-linejoin="round"
    ${dashArray ? `stroke-dasharray="${dashArray}"` : ''}
  />
`;
  });

  svgContent += `</svg>`;

  const base64 = btoa(unescape(encodeURIComponent(svgContent)));
  return `data:image/svg+xml;base64,${base64}`;
}

/* ======================================================
   PATH GENERATOR (Matches your render() logic)
====================================================== */

function getPath(pts: Point[], type: string): string {
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
