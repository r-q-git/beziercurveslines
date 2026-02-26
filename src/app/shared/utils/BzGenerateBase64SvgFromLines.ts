import { ElementRef } from '@angular/core';
import { Line } from 'src/app/core/models/line.model';
import { Point } from '../../core/models/point.model';
import { getPath } from './BzGetpath';

export function generateBase64SvgFromLines(
  canvasWidth: number,
  canvasHeight: number,
  lines: Line[],
): string {
  const width = canvasWidth;
  const height = canvasHeight;

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
