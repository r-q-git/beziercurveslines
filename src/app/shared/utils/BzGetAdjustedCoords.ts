import { ElementRef } from '@angular/core';

export function getAdjustedCoords(
  canvasRef: ElementRef<HTMLCanvasElement>,
  e: MouseEvent,
  zoomLevel: number,
) {
  const canvas = canvasRef.nativeElement;
  const rect = canvas.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;
  const x = (clientX - canvas.width / 2) / zoomLevel + canvas.width / 2;
  const y = (clientY - canvas.height / 2) / zoomLevel + canvas.height / 2;
  return { x, y };
}
