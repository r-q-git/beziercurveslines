import { Line } from 'src/app/core/models/line.model';
import { getBoundingBox } from './BzGetBoundaryBox';

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  icon: string,
) {
  ctx.save();

  // 1. Set up the Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'; // Light grey/translucent black
  ctx.shadowBlur = 6; // Softness of the shadow
  ctx.shadowOffsetX = 0; // Horizontal offset
  ctx.shadowOffsetY = 3; // Vertical offset (gives it lift)

  // 2. Draw the White Circle Background
  ctx.beginPath();
  ctx.fillStyle = '#ffffff'; // Pure white background
  // Radius of 14 for a 28px diameter circle (slightly larger than your 24px rect)
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();

  // 3. IMPORTANT: Clear shadow before drawing the text
  // This keeps the icon/symbol sharp
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 4. Draw the Icon/Symbol
  ctx.fillStyle = '#000000'; // Your theme color
  ctx.font = '20px Arial'; // Adjusted size for the circle
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, y);

  ctx.restore();
}

export function drawActiveUI(ctx: CanvasRenderingContext2D, line: Line) {
  const box = getBoundingBox(line);

  // Only draw Move (✥) and Rotate (↻) icons if the line is NOT locked
  if (!line.locked) {
    drawIcon(ctx, box.midX - 25, box.minY - 40, '✥');
    drawIcon(ctx, box.midX + 25, box.minY - 40, '↻');
  } else {
    // Optional: Draw a Lock icon in the center to show status
    // drawIcon(box.midX, box.minY - 40, '');
  }

  line.elbows.forEach((p) => {
    // Draw the elbow point itself
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Only draw the Delete Button for this elbow if NOT locked
    if (!line.locked) {
      const offX = p.x + 20;
      const offY = p.y - 20;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(offX, offY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', offX, offY);
    }
  });

  // Endpoints always visible for context, but you could hide these too if preferred
  [line.start, line.end].forEach((p) => {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}
