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

  // --- Zoom & Footer State ---
  zoomLevel: number = 1.0;
  showFooter: boolean = false;
  isGlobalLocked: boolean = false;

  // --- UI Controls (Restoring missing properties) ---
  menuStates = { width: false };
  widthOptions = Array.from({ length: 100 }, (_, i) => i + 1);
  colors = [
    '#3b82f6',
    '#22c55e',
    '#eab308',
    '#ef4444',
    '#000000',
    '#8b5cf6',
    '#ec4899',
    '#f97316',
    '#06b6d4',
    '#10b981',
    '#00bfff',
    '#00e676',
    '#ff8c00',
    '#ff0000',
    '#ff00ff',
    '#ffff00',
    '#00ffff',
    '#ff00ff',
    '#00ff00',
    '#0000ff',
    '#ff00ff',
    '#00ffff',
    '#ffff00',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ff00ff',
    '#00ffff',
    '#ffff00',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ff00ff',
    '#00ffff',
    '#ffff00',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ff00ff',
    '#00ffff',
    '#ffff00',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ff00ff',
    '#00ffff',
    '#ffff00',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ff00ff',
    '#00ffff',
    '#ffff00',
    '#ff0000',
    '#00ff00',
    '#0000ff',
  ];
  scrollIndex = 0;

  get activeLine() {
    return this.lines.find((l) => l.id === this.activeId);
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
    // Zoom from center
    this.ctx.translate(canvas.width / 2, canvas.height / 2);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);
    this.ctx.translate(-canvas.width / 2, -canvas.height / 2);

    this.lines.forEach((line) => {
      const pts = [line.start, ...line.elbows, line.end];
      const path = new Path2D(this.getPath(pts, line.type));
      this.ctx.strokeStyle = line.color;
      this.ctx.lineWidth = line.width;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke(path);

      if (line.id === this.activeId) {
        this.drawActiveUI(line);
      }
    });

    this.ctx.restore();
  }

  private drawActiveUI(line: Line) {
    const box = this.getBoundingBox(line);
    this.drawIcon(box.midX - 25, box.minY - 40, '✥'); // Move
    this.drawIcon(box.midX + 25, box.minY - 40, '↻'); // Rotate

    // Elbows
    line.elbows.forEach((p) => {
      // Draw the elbow point itself
      this.ctx.fillStyle = '#fff';
      this.ctx.strokeStyle = '#ff4444';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw the "X" button offset from the point (Top-Right)
      const offX = p.x + 15;
      const offY = p.y - 15;
      this.ctx.fillStyle = '#ef4444';
      this.ctx.strokeStyle = line.color === '#ef4444' ? '#fff' : '#ef4444';
      this.ctx.lineWidth = 0.5;
      this.ctx.beginPath();
      this.ctx.arc(p.x + 15, p.y - 15, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('✕', offX, offY);
    });
    // Start/End
    [line.start, line.end].forEach((p) => {
      this.ctx.fillStyle = '#fff';
      this.ctx.strokeStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
  }

  private drawIcon(x: number, y: number, icon: string) {
    this.ctx.save();

    // Force the UI line width to 1px so it doesn't inherit the drawing line's width
    this.ctx.lineWidth = 1;

    // Background box
    this.ctx.fillStyle = '#fff';
    this.ctx.strokeStyle = '#000';
    this.ctx.fillRect(x - 12, y - 12, 24, 24);
    this.ctx.strokeRect(x - 12, y - 12, 24, 24);

    // Icon text
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(icon, x, y);

    this.ctx.restore();
  }

  // --- Interaction ---
  onMouseDown(e: MouseEvent) {
    const { x, y } = this.getAdjustedCoords(e);
    if (this.isGlobalLocked) return;

    const activeLine = this.activeLine;
    if (activeLine) {
      const box = this.getBoundingBox(activeLine);

      // Delete elbow (Ctrl + Click)
      const deleteIdx = activeLine.elbows.findIndex(
        (p) => Math.hypot(x - (p.x + 12), y - (p.y - 12)) < 8,
      );

      if (deleteIdx !== -1) {
        activeLine.elbows.splice(deleteIdx, 1);
        this.render();
        return;
      }

      // Drag Handles
      const pts = [activeLine.start, activeLine.end, ...activeLine.elbows];
      const point = pts.find((pt) => Math.hypot(x - pt.x, y - pt.y) < 12);
      if (point) {
        this.dragging = { type: 'point', ref: point };
        return;
      }

      // Move UI
      if (Math.hypot(x - (box.midX - 25), y - (box.minY - 40)) < 15) {
        this.dragging = { type: 'line', line: activeLine, lx: x, ly: y };
        return;
      }

      // Rotate UI
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

    const clickedLine = this.getLineAt(x, y);
    this.activeId = clickedLine ? clickedLine.id : null;
    this.render();
  }

  onMouseMove(e: MouseEvent) {
    const { x, y } = this.getAdjustedCoords(e);
    if (this.dragging) {
      this.handleDragging(x, y);
    } else {
      const line = this.getLineAt(x, y);
      this.hoveredLineId = line ? line.id : null;
      this.canvasRef.nativeElement.style.cursor = line
        ? 'pointer'
        : 'crosshair';
    }
    this.render();
  }

  onMouseUp() {
    this.dragging = null;
  }

  onDoubleClick(e: MouseEvent) {
    const { x, y } = this.getAdjustedCoords(e);
    const line = this.activeLine;
    if (!line || this.isGlobalLocked) return;

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
      line.elbows.splice(bestIdx, 0, { x, y });
      this.render();
    }
  }

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
    if (type === 'straight') {
      for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
    } else {
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i],
          p2 = pts[i + 1];
        const p0 = i > 0 ? pts[i - 1] : p1;
        const p3 = i < pts.length - 2 ? pts[i + 2] : p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6,
          cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6,
          cp2y = p2.y - (p3.y - p1.y) / 6;
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
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const l = this.lines[i];
      const path = new Path2D(
        this.getPath([l.start, ...l.elbows, l.end], l.type),
      );
      this.ctx.lineWidth = 20;
      if (this.ctx.isPointInStroke(path, x, y)) return l;
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

  // --- Template Action Methods ---
  addNewLine(type: 'straight' | 'step' | 'curve') {
    const id = Date.now();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // 1. Define the base line object
    let newLine: Line = {
      id,
      color: '#3b82f6',
      width: 4,
      locked: false,
      type,
      start: { x: centerX - 100, y: centerY },
      end: { x: centerX + 100, y: centerY },
      elbows: [],
    };

    // 2. Apply specific layouts based on type
    if (type === 'step') {
      // Creates an 'S' or 'Z' step shape centered on screen
      newLine.start = { x: centerX - 150, y: centerY - 75 };
      newLine.elbows = [
        { x: centerX, y: centerY - 75 }, // First corner
        { x: centerX, y: centerY + 75 }, // Second corner
      ];
      newLine.end = { x: centerX + 150, y: centerY + 75 };
    } else if (type === 'curve') {
      // Creates a slight upward arc
      newLine.start = { x: centerX - 150, y: centerY };
      newLine.elbows = [{ x: centerX, y: centerY - 100 }]; // Peak of the curve
      newLine.end = { x: centerX + 150, y: centerY };
    }

    // 3. Update state and trigger canvas refresh
    this.lines.push(newLine);
    this.activeId = id;
    this.render();
  }

  updateActiveLine(c: string | null, w: number | null) {
    if (!this.activeLine) return;
    if (c) this.activeLine.color = c;
    if (w) this.activeLine.width = w;
    this.render();
  }

  deleteActiveLine() {
    this.lines = this.lines.filter((l) => l.id !== this.activeId);
    this.activeId = null;
    this.render();
  }

  toggleGlobalLock() {
    this.isGlobalLocked = !this.isGlobalLocked;
  }

  scrollPalette(dir: number) {
    this.scrollIndex = Math.max(
      0,
      Math.min(this.colors.length - 6, this.scrollIndex + dir),
    );
  }

  addToProject() {
    console.log('Saving project:', this.lines);
    alert('Project Data Saved!');
  }
}
