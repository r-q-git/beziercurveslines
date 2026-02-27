export function drawPointerIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
) {
  ctx.save();
  // Outer dashed circle
  ctx.beginPath();
  ctx.setLineDash([3, 3, 3, 3, 3]); // dash pattern
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ff9100';
  ctx.lineCap = 'round';
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.stroke();

  // Center solid circle
  ctx.beginPath();
  ctx.setLineDash([]); // reset dash
  ctx.fillStyle = '#ff9100';
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
