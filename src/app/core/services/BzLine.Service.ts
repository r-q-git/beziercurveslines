import { Injectable } from '@angular/core';
import { Line } from '../models/line.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LineService {
  private _lines = new BehaviorSubject<Line[]>([]);
  lines$ = this._lines.asObservable();

  private _activeId = new BehaviorSubject<number | null>(null);
  activeId$ = this._activeId.asObservable();

  constructor() {}

  //  ADD NEW LINE
  addLine(type: 'straight' | 'step' | 'curve') {
    const id = Date.now();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    let newLine: Line = {
      id,
      color: '#A020F0',
      width: 2,
      locked: false,
      type,
      start: { x: centerX - 100, y: centerY },
      end: { x: centerX + 100, y: centerY },
      elbows: [],
      strokeStyle: 'solid',
    };

    if (type === 'step') {
      newLine = {
        ...newLine,
        start: { x: centerX - 150, y: centerY - 75 },
        elbows: [
          { x: centerX, y: centerY - 75 },
          { x: centerX, y: centerY + 75 },
        ],
        end: { x: centerX + 150, y: centerY + 75 },
      };
    }

    if (type === 'curve') {
      newLine = {
        ...newLine,
        start: { x: centerX - 150, y: centerY },
        elbows: [{ x: centerX, y: centerY - 100 }],
        end: { x: centerX + 150, y: centerY },
      };
    }

    const current = this._lines.getValue();
    this._lines.next([...current, newLine]);

    this._activeId.next(id);
  }

  // Getters and Setters
  get activeLine(): Line | undefined {
    const id = this._activeId.getValue();
    if (id === null) return undefined;
    return this._lines.getValue().find((l) => l.id === id);
  }

  get activeId(): number | null {
    return this._activeId.getValue();
  }

  setActiveId(id: number | null) {
    this._activeId.next(id);
  }

  getLines(): Line[] {
    return this._lines.getValue();
  }

  setLines(lines: Line[]) {
    this._lines.next(lines);
  }

  // UPDATE ACTIVE LINE
  updateActiveLine(
    c: string | null,
    w: number | null,
    lockToggle: boolean = false,
    ss?: 'solid' | 'dashed' | 'dotted',
  ) {
    const lines = this._lines.getValue();
    const index = lines.findIndex((l) => l.id === this._activeId.getValue());

    if (index === -1) return;

    const currentLine = lines[index];

    let updatedLine = { ...currentLine };

    if (lockToggle) {
      updatedLine.locked = !updatedLine.locked;
    }

    // Only update if not locked
    if (!updatedLine.locked) {
      if (c !== null) updatedLine.color = c;
      if (w !== null) updatedLine.width = w;
      if (ss) updatedLine.strokeStyle = ss;
    }

    const updatedLines = [...lines];
    updatedLines[index] = updatedLine;

    this._lines.next(updatedLines);
  }

  // DELETE ACTIVE LINE
  deleteActiveLine() {
    const id = this._activeId.getValue();
    if (id === null) return;

    const updated = this._lines.getValue().filter((l) => l.id !== id);

    this._lines.next(updated);
    this._activeId.next(null);
  }

  // TOGGLE LINE TYPE : Pointy | Roundy
  toggleLineStyle() {
    const lines = this._lines.getValue();
    const index = lines.findIndex((l) => l.id === this._activeId.getValue());

    if (index === -1) return;

    const current = lines[index];

    const updatedLine: Line = {
      ...current,
      type: current.type === 'curve' ? 'straight' : 'curve',
    };

    const updated = [...lines];
    updated[index] = updatedLine;

    this._lines.next(updated);
  }
}
