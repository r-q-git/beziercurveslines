import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

interface Point {
  x: number;
  y: number;
}
interface Line {
  id: number;
  color: string;
  width: number;
  locked: boolean;
  start: Point;
  end: Point;
  elbows: Point[];
  type: 'straight' | 'step' | 'curve';
  strokeStyle: 'solid' | 'dashed' | 'dotted';
}

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements OnInit, AfterViewInit {
  @ViewChild('editorCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // --- Drawing State ---
  lines: Line[] = [];
  activeId: number | null = null;
  hoveredLineId: number | null = null;
  dragging: any = null;
  previewElbow: Point | null = null; // New: For hover pointer

  // --- Zoom & Footer State ---
  zoomLevel: number = 1.0;
  showFooter: boolean = false;

  // --- UI Controls ---
  menuStates = { width: false };

  scrollIndex = 0;

  get activeLine() {
    return this.lines.find((l) => l.id === this.activeId);
  }

  toggleLineStyle() {
    if (this.activeLine) {
      this.activeLine.type =
        this.activeLine.type === 'curve' ? 'straight' : 'curve';
      this.render();
    }
  }

  onWidthChange(value: string | number) {
    const width = Number(value);
    if (this.activeLine && !isNaN(width)) {
      // We use Math.max(0.1, width) just so the line doesn't
      // technically vanish, but otherwise it's exactly what they typed.
      const userValue = Math.max(0.1, width);
      this.updateActiveLine(null, userValue);
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resize();
  }

  @HostListener('window:resize')
  resize() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.render();
  }

  // --- Core Rendering ---
  render() {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.ctx.save();
    this.ctx.translate(canvas.width / 2, canvas.height / 2);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);
    this.ctx.translate(-canvas.width / 2, -canvas.height / 2);

    this.lines.forEach((line) => {
      const pts = [line.start, ...line.elbows, line.end];
      const path = new Path2D(this.getPath(pts, line.type));

      this.ctx.save();

      this.ctx.strokeStyle = line.color;
      this.ctx.lineWidth = line.width;

      // MANDATORY: This must be 'round' for the dotted trick to work
      this.ctx.lineCap = 'round';
      // this.ctx.lineJoin = 'round';

      // --- Stroke Style Selection ---
      if (line.strokeStyle === 'dashed') {
        this.ctx.setLineDash([line.width * 3, line.width * 3]);
      } else if (line.strokeStyle === 'dotted') {
        this.ctx.setLineDash([0, line.width * 2.5]);
      } else {
        this.ctx.setLineDash([]); // Solid
      }

      this.ctx.stroke(path);
      this.ctx.restore();

      if (line.id === this.activeId) {
        this.drawActiveUI(line);
      }
    });

    // Draw the Pointer Icon (Snapping)
    if (this.previewElbow && !this.dragging) {
      const hoveredLine = this.lines.find((l) => l.id === this.hoveredLineId);
      if (hoveredLine && !hoveredLine.locked) {
        this.drawPointerIcon(this.previewElbow.x, this.previewElbow.y);
      }
    }

    this.ctx.restore();
  }

  private drawPointerIcon(x: number, y: number) {
    this.ctx.save();
    // ----- Outer dashed circle -----
    this.ctx.beginPath();
    this.ctx.setLineDash([3, 3, 3, 3, 3]); // dash pattern
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#ff9100';
    this.ctx.lineCap = 'round';
    this.ctx.arc(x, y, 10, 0, Math.PI * 2);
    this.ctx.stroke();

    // ----- Center solid circle -----
    this.ctx.beginPath();
    this.ctx.setLineDash([]); // reset dash
    this.ctx.fillStyle = '#ff9100';
    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawActiveUI(line: Line) {
    const box = this.getBoundingBox(line);

    // Only draw Move (✥) and Rotate (↻) icons if the line is NOT locked
    if (!line.locked) {
      this.drawIcon(box.midX - 25, box.minY - 40, '✥');
      this.drawIcon(box.midX + 25, box.minY - 40, '↻');
    } else {
      // Optional: Draw a Lock icon in the center to show status
      // this.drawIcon(box.midX, box.minY - 40, '');
    }

    line.elbows.forEach((p) => {
      // Draw the elbow point itself
      this.ctx.fillStyle = '#fff';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Only draw the Delete Button for this elbow if NOT locked
      if (!line.locked) {
        const offX = p.x + 20;
        const offY = p.y - 20;
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(offX, offY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('✕', offX, offY);
      }
    });

    // Endpoints always visible for context, but you could hide these too if preferred
    [line.start, line.end].forEach((p) => {
      this.ctx.fillStyle = '#fff';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
  }

  private drawIcon(x: number, y: number, icon: string) {
    this.ctx.save();

    // 1. Set up the Shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'; // Light grey/translucent black
    this.ctx.shadowBlur = 6; // Softness of the shadow
    this.ctx.shadowOffsetX = 0; // Horizontal offset
    this.ctx.shadowOffsetY = 3; // Vertical offset (gives it lift)

    // 2. Draw the White Circle Background
    this.ctx.beginPath();
    this.ctx.fillStyle = '#ffffff'; // Pure white background
    // Radius of 14 for a 28px diameter circle (slightly larger than your 24px rect)
    this.ctx.arc(x, y, 14, 0, Math.PI * 2);
    this.ctx.fill();

    // 3. IMPORTANT: Clear shadow before drawing the text
    // This keeps the icon/symbol sharp
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    // 4. Draw the Icon/Symbol
    this.ctx.fillStyle = '#000000'; // Your theme color
    this.ctx.font = '20px Arial'; // Adjusted size for the circle
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(icon, x, y);

    this.ctx.restore();
  }

  // --- Interaction ---
  onMouseDown(e: MouseEvent) {
    const { x, y } = this.getAdjustedCoords(e);

    const activeLine = this.activeLine;
    if (activeLine) {
      // 1. ELBOW DELETE LOGIC (Only if NOT locked)
      if (!activeLine.locked) {
        const deleteIdx = activeLine.elbows.findIndex((p) => {
          const btnX = p.x + 20;
          const btnY = p.y - 20;
          const overButton = Math.hypot(x - btnX, y - btnY) < 12;
          const overPoint = Math.hypot(x - p.x, y - p.y) < 10;
          return overButton || (e.ctrlKey && overPoint);
        });

        if (deleteIdx !== -1) {
          activeLine.elbows.splice(deleteIdx, 1);
          this.render();
          return;
        }
      }

      // 2. POINT DRAGGING (Only if NOT locked)
      if (!activeLine.locked) {
        const pts = [activeLine.start, activeLine.end, ...activeLine.elbows];
        const point = pts.find((pt) => Math.hypot(x - pt.x, y - pt.y) < 12);
        if (point) {
          this.dragging = { type: 'point', ref: point };
          return;
        }
      }

      // 3. MOVE & ROTATE LOGIC (Only if NOT locked)
      if (!activeLine.locked) {
        const box = this.getBoundingBox(activeLine);

        // Hit-test Move Button
        if (Math.hypot(x - (box.midX - 25), y - (box.minY - 40)) < 15) {
          this.dragging = { type: 'line', line: activeLine, lx: x, ly: y };
          return;
        }

        // Hit-test Rotate Button
        if (Math.hypot(x - (box.midX + 25), y - (box.minY - 40)) < 15) {
          const center = {
            x: (activeLine.start.x + activeLine.end.x) / 2,
            y: (activeLine.start.y + activeLine.end.y) / 2,
          };
          this.dragging = {
            type: 'rotate',
            line: activeLine,
            center,
            startAngle: Math.atan2(y - center.y, x - center.x),
          };
          return;
        }
      }
    }

    // 4. LINE SELECTION (Always allowed so you can select a line to unlock it)
    const clickedLine = this.getLineAt(x, y);
    this.activeId = clickedLine ? clickedLine.id : null;
    this.render();
  }
  onMouseMove(e: MouseEvent) {
    const { x, y } = this.getAdjustedCoords(e);
    this.previewElbow = null; // Clear previous frame's snap point

    if (this.dragging) {
      this.canvasRef.nativeElement.style.cursor = 'grabbing';
      this.handleDragging(x, y);
      this.render();
      return; // Skip hover logic while dragging
    }

    let foundUI = false;

    // 1. PRIORITIZE ACTIVE LINE UI (Buttons)
    if (this.activeLine) {
      const box = this.getBoundingBox(this.activeLine);
      const isLocked = this.activeLine.locked; // Use the specific line's locked property

      // Detect Move and Rotate ONLY if the line is NOT locked
      const isOverMove =
        !isLocked && Math.hypot(x - (box.midX - 25), y - (box.minY - 40)) < 15;
      const isOverRotate =
        !isLocked && Math.hypot(x - (box.midX + 25), y - (box.minY - 40)) < 15;

      // Detect Delete buttons (we keep detecting them even if locked so we can show 'not-allowed')
      const isOverDelete = this.activeLine.elbows.some(
        (p) => Math.hypot(x - (p.x + 25), y - (p.y - 25)) < 12,
      );

      if (isOverMove || isOverRotate || isOverDelete) {
        foundUI = true;

        // If the line is locked, the only UI interaction possible was Delete (detected above)
        // We show 'not-allowed' for locked lines, 'pointer' for unlocked
        this.canvasRef.nativeElement.style.cursor = isLocked
          ? 'not-allowed'
          : 'pointer';
      }
    }

    if (!foundUI) {
      // 2. FIND TOP-MOST LINE
      const targetLine = this.getLineAt(x, y);

      if (targetLine) {
        this.hoveredLineId = targetLine.id;

        // If the hovered line is locked, show 'not-allowed'
        if (targetLine.locked) {
          this.canvasRef.nativeElement.style.cursor = 'not-allowed';
        } else {
          // Unlocked lines get the custom red snap cursor
          this.previewElbow = this.getClosestPointOnLine(x, y, targetLine);
          this.canvasRef.nativeElement.style.cursor = 'none';
        }
      } else {
        this.hoveredLineId = null;
        this.canvasRef.nativeElement.style.cursor = 'crosshair';
      }
    }

    this.render();
  }
  onMouseUp() {
    this.dragging = null;
  }

  onDoubleClick(e: MouseEvent) {
    const { x, y } = this.getAdjustedCoords(e);
    const line = this.activeLine;
    if (!line || line.locked) return;

    // Use the calculated preview point instead of the raw mouse X/Y
    const snap = this.getClosestPointOnLine(x, y, line);

    if (snap) {
      const pts = [line.start, ...line.elbows, line.end];
      let bestIdx = -1;
      let minDist = 20;

      for (let i = 0; i < pts.length - 1; i++) {
        const dist = this.pToSegDist(x, y, pts[i], pts[i + 1]);
        if (dist < minDist) {
          minDist = dist;
          bestIdx = i;
        }
      }

      if (bestIdx !== -1) {
        // Insert the point at the SNAPPED coordinates
        line.elbows.splice(bestIdx, 0, { x: snap.x, y: snap.y });
        this.render();
      }
    }
  }

  private getClosestPointOnLine(
    px: number,
    py: number,
    line: Line,
  ): Point | null {
    const pts = [line.start, ...line.elbows, line.end];
    let bestPt: Point | null = null;
    let minDist = 30;

    // 1. Terminal Snapping (Nodes)
    for (const pt of pts) {
      if (Math.hypot(px - pt.x, py - pt.y) < 15) return { x: pt.x, y: pt.y };
    }

    // 2. Path Snapping
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];

      // --- STRAIGHT TYPE ---
      if (line.type === 'straight') {
        const snap = this.getClosestPointOnSegment(px, py, p1, p2);
        const d = Math.hypot(px - snap.x, py - snap.y);
        if (d < minDist) {
          minDist = d;
          bestPt = snap;
        }
      }

      // --- SMOOTH STEP TYPE ---
      else if (line.type === 'step') {
        const corner = { x: p2.x, y: p1.y };
        const r = Math.min(
          20,
          Math.abs(p2.x - p1.x) / 2,
          Math.abs(p2.y - p1.y) / 2,
        );

        const sX = corner.x - (p2.x > p1.x ? r : -r);
        const eY = corner.y + (p2.y > p1.y ? r : -r);

        // Check the horizontal straight leg
        const hSnap = this.getClosestPointOnSegment(px, py, p1, {
          x: sX,
          y: p1.y,
        });
        const hDist = Math.hypot(px - hSnap.x, py - hSnap.y);
        if (hDist < minDist) {
          minDist = hDist;
          bestPt = hSnap;
        }

        // Check the vertical straight leg
        const vSnap = this.getClosestPointOnSegment(
          px,
          py,
          { x: corner.x, y: eY },
          p2,
        );
        const vDist = Math.hypot(px - vSnap.x, py - vSnap.y);
        if (vDist < minDist) {
          minDist = vDist;
          bestPt = vSnap;
        }

        // Sample the rounded elbow (Quadratic Bezier)
        for (let t = 0; t <= 1; t += 0.1) {
          const cx =
            Math.pow(1 - t, 2) * sX +
            2 * (1 - t) * t * corner.x +
            Math.pow(t, 2) * corner.x;
          const cy =
            Math.pow(1 - t, 2) * corner.y +
            2 * (1 - t) * t * corner.y +
            Math.pow(t, 2) * eY;
          const d = Math.hypot(px - cx, py - cy);
          if (d < minDist) {
            minDist = d;
            bestPt = { x: cx, y: cy };
          }
        }
      }

      // --- CURVE TYPE ---
      else if (line.type === 'curve') {
        const f = 0.35;
        const cp1x = p1.x + (p2.x - p1.x) * f;
        const cp1y = p1.y + (p2.y - p1.y) * 0.1;
        const cp2x = p2.x - (p2.x - p1.x) * f;
        const cp2y = p2.y - (p2.y - p1.y) * 0.1;

        for (let t = 0; t <= 1; t += 0.01) {
          const cx = this.getBezierPoint(t, p1.x, cp1x, cp2x, p2.x);
          const cy = this.getBezierPoint(t, p1.y, cp1y, cp2y, p2.y);
          const dist = Math.hypot(px - cx, py - cy);
          if (dist < minDist) {
            minDist = dist;
            bestPt = { x: cx, y: cy };
          }
        }
      }
    }
    return bestPt;
  }

  private getClosestPointOnSegment(
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

  // Helper to calculate the Cubic Bezier point at time t (0 to 1)
  private getBezierPoint(
    t: number,
    p0: number,
    p1: number,
    p2: number,
    p3: number,
  ): number {
    return (
      (1 - t) ** 3 * p0 +
      3 * (1 - t) ** 2 * t * p1 +
      3 * (1 - t) * t ** 2 * p2 +
      t ** 3 * p3
    );
  }

  // --- Utility methods (getPath, handleDragging, getLineAt, getBoundingBox, pToSegDist, addNewLine, etc.) ---
  // Ensure these match your existing logic.

  // --- Helpers ---

  private getAdjustedCoords(e: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const x = (clientX - canvas.width / 2) / this.zoomLevel + canvas.width / 2;
    const y =
      (clientY - canvas.height / 2) / this.zoomLevel + canvas.height / 2;
    return { x, y };
  }

  private getPath(pts: Point[], type: string): string {
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
        // THE CONCAVE LOGIC:
        // Instead of just horizontal bias, we use a percentage of the
        // actual distance between the points to define the "pull."
        const f = 0.35; // Curvature factor

        const cp1x = p1.x + (p2.x - p1.x) * f;
        const cp1y = p1.y + (p2.y - p1.y) * 0.1; // Slight vertical pull for concavity

        const cp2x = p2.x - (p2.x - p1.x) * f;
        const cp2y = p2.y - (p2.y - p1.y) * 0.1; // Slight vertical pull for concavity

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
    }
    return d;
  }

  private handleDragging(x: number, y: number) {
    if (this.dragging.type === 'point') {
      this.dragging.ref.x = x;
      this.dragging.ref.y = y;
      this.canvasRef.nativeElement.style.cursor = 'grabbing';
    } else if (this.dragging.type === 'line') {
      const dx = x - this.dragging.lx,
        dy = y - this.dragging.ly;
      [
        this.dragging.line.start,
        this.dragging.line.end,
        ...this.dragging.line.elbows,
      ].forEach((p) => {
        p.x += dx;
        p.y += dy;
      });
      this.dragging.lx = x;
      this.dragging.ly = y;
    } else if (this.dragging.type === 'rotate') {
      const angle = Math.atan2(
        y - this.dragging.center.y,
        x - this.dragging.center.x,
      );
      const diff = angle - this.dragging.startAngle;
      [
        this.dragging.line.start,
        this.dragging.line.end,
        ...this.dragging.line.elbows,
      ].forEach((p) => {
        const dx = p.x - this.dragging.center.x,
          dy = p.y - this.dragging.center.y;
        p.x =
          this.dragging.center.x + dx * Math.cos(diff) - dy * Math.sin(diff);
        p.y =
          this.dragging.center.y + dx * Math.sin(diff) + dy * Math.cos(diff);
      });
      this.dragging.startAngle = angle;
    }
  }

  private getLineAt(x: number, y: number): Line | null {
    // Loop backwards to pick the line "on top"
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const l = this.lines[i];
      const path = new Path2D(
        this.getPath([l.start, ...l.elbows, l.end], l.type),
      );

      // Set a consistent hit-area (20px is usually good for finger/mouse)
      this.ctx.lineWidth = 20;
      if (this.ctx.isPointInStroke(path, x, y)) {
        return l;
      }
    }
    return null;
  }

  private getBoundingBox(line: Line) {
    const all = [line.start, line.end, ...line.elbows];
    const minX = Math.min(...all.map((p) => p.x)),
      maxX = Math.max(...all.map((p) => p.x));
    return { minY: Math.min(...all.map((p) => p.y)), midX: (minX + maxX) / 2 };
  }

  private pToSegDist(x: number, y: number, a: Point, b: Point): number {
    const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    if (l2 === 0) return Math.hypot(x - a.x, y - a.y);
    const t = Math.max(
      0,
      Math.min(1, ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / l2),
    );
    return Math.hypot(x - (a.x + t * (b.x - a.x)), y - (a.y + t * (b.y - a.y)));
  }

  addNewLine(type: 'straight' | 'step' | 'curve') {
    const id = Date.now();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    let newLine: Line = {
      id,
      color: '#3b82f6',
      width: 2,
      locked: false,
      type,
      start: { x: centerX - 100, y: centerY },
      end: { x: centerX + 100, y: centerY },
      elbows: [],
      strokeStyle: 'solid',
    };
    if (type === 'step') {
      newLine.start = { x: centerX - 150, y: centerY - 75 };
      newLine.elbows = [
        { x: centerX, y: centerY - 75 },
        { x: centerX, y: centerY + 75 },
      ];
      newLine.end = { x: centerX + 150, y: centerY + 75 };
    } else if (type === 'curve') {
      newLine.start = { x: centerX - 150, y: centerY };
      newLine.elbows = [{ x: centerX, y: centerY - 100 }];
      newLine.end = { x: centerX + 150, y: centerY };
    }
    this.lines.push(newLine);
    this.activeId = id;
    this.render();
  }

  updateActiveLine(
    c: string | null,
    w: number | null,
    lockToggle: boolean = false,
    ss?: 'solid' | 'dashed' | 'dotted', // Optional parameter for stroke style
  ) {
    if (!this.activeLine) return;

    // 1. Handle the Lock Toggle first (Always allowed)
    if (lockToggle) {
      this.activeLine.locked = !this.activeLine.locked;
    }

    // 2. Only allow property changes if the line is NOT locked
    // This prevents color, width, or style changes while the line is 'frozen'
    if (!this.activeLine.locked) {
      if (c !== null) {
        this.activeLine.color = c;
      }

      if (w !== null) {
        this.activeLine.width = w;
      }

      if (ss) {
        this.activeLine.strokeStyle = ss;
      }
    }

    // 3. Redraw the canvas to reflect changes
    this.render();
  }

  deleteActiveLine() {
    this.lines = this.lines.filter((l) => l.id !== this.activeId);
    this.activeId = null;

    this.render();
  }

  /**
   * handle Zoom:
   *
   */
  // Set the zoom back to exactly 100% (1.0)
  // Set the zoom back to exactly 100% (1.0)
  resetZoom() {
    this.zoomLevel = 1.0;
    this.render();
  }

  // Handles clicking the + and - icons
  adjustZoom(delta: number) {
    let newZoom = this.zoomLevel + delta;

    // Clamp between 10% (0.1) and 200% (2.0)
    if (newZoom < 0.1) newZoom = 0.1;
    if (newZoom > 2.0) newZoom = 2.0;

    // Rounding to avoid floating point precision issues (e.g., 0.30000000000000004)
    this.zoomLevel = Math.round(newZoom * 10) / 10;
    this.render();
  }

  // Handles when a user types a number like '150' into the input
  onZoomInput(value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      // Convert e.g. 150 to 1.5, clamping between 10 and 200
      const clamped = Math.min(Math.max(num, 10), 200);
      this.zoomLevel = clamped / 100;
      this.render();
    }
  }

  addToProject() {
    console.log('Saving project:', this.lines);
    alert('Project Data Saved!');
  }
}
