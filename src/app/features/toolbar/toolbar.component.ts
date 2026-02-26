import { AfterViewInit, Component, OnInit } from '@angular/core';
import { LineService } from 'src/app/core/services/BzLine.Service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
})
export class ToolbarComponent implements OnInit, AfterViewInit {
  activeId: number | null = null;
  menuStates = { width: false };

  constructor(private lineService: LineService) {}
  get activeLine() {
    return this.lineService.activeLine;
  }
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.lineService.activeId$.subscribe((id) => (this.activeId = id));
  }

  toggleLineStyle() {
    this.lineService.toggleLineStyle();
  }

  updateActiveLine(
    c: string | null,
    w: number | null,
    lockToggle: boolean | undefined,
    ss?: 'solid' | 'dashed' | 'dotted',
  ) {
    this.lineService.updateActiveLine(c, w, lockToggle, ss);
  }

  onWidthChange(value: string | number) {
    const width = Number(value);
    if (this.activeLine && !isNaN(width)) {
      // Note for Sir : We use Math.max(0.5, width) just so the line doesn't technically vanish, but otherwise it's exactly what they typed.
      const userValue = Math.max(0.5, width);
      this.updateActiveLine(
        null,
        userValue,
        undefined,
        this.activeLine.strokeStyle,
      );
    }
  }

  deleteActiveLine() {
    this.lineService.deleteActiveLine();
  }
}
