import { Injectable, ElementRef } from '@angular/core';
import { Line } from '../models/line.model';
import { LineService } from './BzLine.Service';
import { drawActiveUI } from 'src/app/shared/utils/BzDrawActiveUI';
import { getPath } from 'src/app/shared/utils/BzGetpath';
import { Point } from '../models/point.model';
import { drawPointerIcon } from 'src/app/shared/utils/BzDrawPointerIcon';
import { CanvasService } from './BzCanvas.Service';
import { auditTime, merge } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RenderService {
  private ctx!: CanvasRenderingContext2D;
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private lines: Line[] = [];
  private activeId: number | null = null;
  private zoomLevel: number = 1;
  private hoveredLineId: number | null = null;
  private dragging: any = null;
  private previewElbow: Point | null = null;

  setCanvasContext(
    ctx: CanvasRenderingContext2D,
    canvasRef: ElementRef<HTMLCanvasElement>,
  ) {
    this.ctx = ctx;
    this.canvasRef = canvasRef;
  }

  constructor(
    private lineService: LineService,
    private canvasService: CanvasService,
  ) {
    // Keep DATA synced (No render calls here)
    this.lineService.lines$.subscribe((l) => (this.lines = l));
    this.lineService.activeId$.subscribe((id) => (this.activeId = id));
    this.canvasService.zoomLevel$.subscribe((z) => (this.zoomLevel = z));
    this.canvasService.hoveredLineId$.subscribe(
      (id) => (this.hoveredLineId = id),
    );
    this.canvasService.dragging$.subscribe((d) => (this.dragging = d));
    this.canvasService.previewElbow$.subscribe((p) => (this.previewElbow = p));

    // The unified RENDER TRIGGER
    // We listen to all changes, but auditTime(0) ensures we only
    // draw once per animation frame.
    merge(
      this.lineService.lines$,
      this.lineService.activeId$,
      this.canvasService.zoomLevel$,
      this.canvasService.hoveredLineId$,
      this.canvasService.previewElbow$,
      this.canvasService.renderRequested$,
    )
      .pipe(auditTime(0))
      .subscribe(() => {
        this.render();
      });
  }

  render() {
    if (!this.ctx || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const zoomLevel = this.zoomLevel;
    const activeId = this.activeId;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.ctx.save();

    // Zoom transform
    this.ctx.translate(canvas.width / 2, canvas.height / 2);
    this.ctx.scale(zoomLevel, zoomLevel);
    this.ctx.translate(-canvas.width / 2, -canvas.height / 2);

    this.lines.forEach((line) => {
      const pts = [line.start, ...line.elbows, line.end];
      const path = new Path2D(getPath(pts, line.type));

      this.ctx.save();

      this.ctx.strokeStyle = line.color;
      this.ctx.lineWidth = line.width;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      // Stroke styles
      if (line.strokeStyle === 'dashed') {
        this.ctx.setLineDash([line.width * 3, line.width * 3]);
      } else if (line.strokeStyle === 'dotted') {
        this.ctx.setLineDash([0, line.width * 2.5]);
      } else {
        this.ctx.setLineDash([]);
      }

      this.ctx.stroke(path);
      this.ctx.restore();

      // Active UI
      if (line.id === activeId) {
        drawActiveUI(this.ctx, line);
      }
    });

    // Draw the Pointer Icon (Snapping)
    if (this.previewElbow && !this.dragging) {
      const hoveredLine = this.lines.find((l) => l.id === this.hoveredLineId);
      if (hoveredLine && !hoveredLine.locked) {
        drawPointerIcon(this.ctx, this.previewElbow.x, this.previewElbow.y);
      }
    }
    this.ctx.restore();
  }
}
