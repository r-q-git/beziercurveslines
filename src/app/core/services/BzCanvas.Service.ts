import { ElementRef, Injectable } from '@angular/core';
import { Line } from '../models/line.model';
import { BehaviorSubject, Subject } from 'rxjs';
import { Point } from '../models/point.model';
import { getAdjustedCoords } from 'src/app/shared/utils/BzGetAdjustedCoords';
import { LineService } from './BzLine.Service';
import { getBoundingBox } from 'src/app/shared/utils/BzGetBoundaryBox';
import { getLineAt } from 'src/app/shared/utils/BzGetLineAt';
import { getClosestPointOnLine } from 'src/app/shared/utils/BzGetClosestPointOnLine';
import { pToSegDist } from 'src/app/shared/utils/BzPToSegDist';

@Injectable({ providedIn: 'root' })
export class CanvasService {
  private ctx!: CanvasRenderingContext2D;
  private canvasRef!: ElementRef<HTMLCanvasElement>;
  private lines!: Line[];
  activeId!: number | null;

  setCanvasContext(
    ctx: CanvasRenderingContext2D,
    canvasRef: ElementRef<HTMLCanvasElement>,
  ) {
    this.ctx = ctx;
    this.canvasRef = canvasRef;
  }

  get activeLine() {
    return this.lineService.activeLine;
  }

  //Private store
  private _zoomLevel = new BehaviorSubject<number>(1.0);
  zoomLevel$ = this._zoomLevel.asObservable();

  private _hoveredLineId = new BehaviorSubject<number | null>(null);
  hoveredLineId$ = this._hoveredLineId.asObservable();

  private _dragging = new BehaviorSubject<any>(null);
  dragging$ = this._dragging.asObservable();

  private _previewElbow = new BehaviorSubject<Point | null>(null);
  previewElbow$ = this._previewElbow.asObservable();

  private _windowInnerHeight = new BehaviorSubject<number>(window.innerHeight);
  windowInnerHeight$ = this._windowInnerHeight.asObservable();

  private _windowInnerWidth = new BehaviorSubject<number>(window.innerWidth);
  windowInnerWidth$ = this._windowInnerWidth.asObservable();

  constructor(private lineService: LineService) {
    this.lineService.activeId$.subscribe((id) => {
      this.activeId = id;
    });

    this.lineService.lines$.subscribe((lines) => {
      this.lines = lines;
    });
  }

  // Create a trigger specifically for manual render requests
  private _renderRequested = new Subject<void>();
  renderRequested$ = this._renderRequested.asObservable();

  // Create a helper method to call it
  requestRender() {
    this._renderRequested.next();
  }

  // getter and setters :
  get getHoveredId() {
    return this._hoveredLineId.getValue();
  }

  get getDragging() {
    return this._dragging.getValue();
  }

  get getPreviewElbow() {
    return this._previewElbow.getValue();
  }

  get getZoomLevel() {
    return this._zoomLevel.getValue();
  }

  get getWindowInnerHeight() {
    return this._windowInnerHeight.getValue();
  }

  get getWindowInnerWidth() {
    return this._windowInnerWidth.getValue();
  }

  setHoveredId(value: number | null) {
    this._hoveredLineId.next(value);
  }

  setDraggging(value: any | null) {
    this._dragging.next(value);
  }

  setPreviewElbow(value: Point | null) {
    this._previewElbow.next(value);
  }

  setZoomLevel(value: number) {
    this._zoomLevel.next(value);
  }

  setWindowInnerHeight(value: number) {
    this._windowInnerHeight.next(value);
  }

  setWindowInnerWidth(value: number) {
    this._windowInnerWidth.next(value);
  }

  
  // Mouse Down Event
  onMouseDown(e: MouseEvent) {
    const { x, y } = getAdjustedCoords(this.canvasRef, e, this.getZoomLevel);

    const activeLine = this.activeLine;
    if (activeLine) {
      // ELBOW DELETE LOGIC 
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
          this.requestRender();
          return;
        }
      }

      // POINT DRAGGING
      if (!activeLine.locked) {
        const pts = [activeLine.start, activeLine.end, ...activeLine.elbows];
        const point = pts.find((pt) => Math.hypot(x - pt.x, y - pt.y) < 12);
        if (point) {
          this.setDraggging({ type: 'point', ref: point });
          return;
        }
      }

      // MOVE & ROTATE LOGIC
      if (!activeLine.locked) {
        const box = getBoundingBox(activeLine);

        // Hit-test Move Button
        if (Math.hypot(x - (box.midX - 25), y - (box.minY - 40)) < 15) {
          this.setDraggging({ type: 'line', line: activeLine, lx: x, ly: y });
          return;
        }

        // Hit-test Rotate Button
        if (Math.hypot(x - (box.midX + 25), y - (box.minY - 40)) < 15) {
          const center = {
            x: (activeLine.start.x + activeLine.end.x) / 2,
            y: (activeLine.start.y + activeLine.end.y) / 2,
          };
          this.setDraggging({
            type: 'rotate',
            line: activeLine,
            center,
            startAngle: Math.atan2(y - center.y, x - center.x),
          });
          return;
        }
      }
    }

    // LINE SELECTION (Always allowed so you can select a line to unlock it)
    const clickedLine = getLineAt(x, y, this.lines, this.ctx);
    this.lineService.setActiveId(clickedLine ? clickedLine.id : null);
    this.requestRender();
  }

  onMouseMove(e: MouseEvent) {
    const { x, y } = getAdjustedCoords(this.canvasRef, e, this.getZoomLevel);
    this.setPreviewElbow(null);

    if (this.getDragging) {
      this.canvasRef.nativeElement.style.cursor = 'grabbing';
      this.handleDragging(x, y);
      this.requestRender();
      return;
    }

    let foundUI = false;

    // PRIORITIZE ACTIVE LINE UI (Buttons)
    if (this.activeLine) {
      const box = getBoundingBox(this.activeLine);
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
      // FIND TOP-MOST LINE
      const targetLine = getLineAt(x, y, this.lines, this.ctx);

      if (targetLine) {
        this.setHoveredId(targetLine.id);

        // If the hovered line is locked, show 'not-allowed'
        if (targetLine.locked) {
          this.canvasRef.nativeElement.style.cursor = 'not-allowed';
        } else {
          // Unlocked lines get the custom red snap cursor
          this.setPreviewElbow(getClosestPointOnLine(x, y, targetLine));
          this.canvasRef.nativeElement.style.cursor = 'none';
        }
      } else {
        this.setHoveredId(null);
        this.canvasRef.nativeElement.style.cursor = 'crosshair';
      }
    }
    this.requestRender();
  }

  onMouseUp() {
    this.setDraggging(null);
  }

  onDoubleClick(e: MouseEvent) {
    const { x, y } = getAdjustedCoords(this.canvasRef, e, this.getZoomLevel);
    const line = this.activeLine;
    if (!line || line.locked) return;

    // Use the calculated preview point instead of the raw mouse X/Y
    const snap = getClosestPointOnLine(x, y, line);

    if (snap) {
      const pts = [line.start, ...line.elbows, line.end];
      let bestIdx = -1;
      let minDist = 20;

      for (let i = 0; i < pts.length - 1; i++) {
        const dist = pToSegDist(x, y, pts[i], pts[i + 1]);
        if (dist < minDist) {
          minDist = dist;
          bestIdx = i;
        }
      }

      if (bestIdx !== -1) {
        // Insert the point at the SNAPPED coordinates
        line.elbows.splice(bestIdx, 0, { x: snap.x, y: snap.y });
        this.requestRender();
      }
    }
  }

  // Handles Dragging!
  private handleDragging(x: number, y: number) {
    const dragging = this.getDragging;
    if (!dragging) return;

    if (dragging.type === 'point') {
      dragging.ref.x = x;
      dragging.ref.y = y;
      this.canvasRef.nativeElement.style.cursor = 'grabbing';
    } else if (dragging.type === 'line') {
      const dx = x - dragging.lx;
      const dy = y - dragging.ly;

      [dragging.line.start, dragging.line.end, ...dragging.line.elbows].forEach(
        (p) => {
          p.x += dx;
          p.y += dy;
        },
      );

      dragging.lx = x;
      dragging.ly = y;
    } else if (dragging.type === 'rotate') {
      const angle = Math.atan2(y - dragging.center.y, x - dragging.center.x);

      const diff = angle - dragging.startAngle;

      [dragging.line.start, dragging.line.end, ...dragging.line.elbows].forEach(
        (p) => {
          const dx = p.x - dragging.center.x;
          const dy = p.y - dragging.center.y;

          p.x = dragging.center.x + dx * Math.cos(diff) - dy * Math.sin(diff);

          p.y = dragging.center.y + dx * Math.sin(diff) + dy * Math.cos(diff);
        },
      );

      dragging.startAngle = angle;
    }
  }
}
