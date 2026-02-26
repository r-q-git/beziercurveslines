import { Component } from '@angular/core';
import { CanvasService } from 'src/app/core/services/BzCanvas.Service';

@Component({
  selector: 'app-zoom',
  templateUrl: './zoom.component.html',
  styleUrls: ['./zoom.component.css'],
})
export class ZoomComponent {
  zoomLevel!: number;

  constructor(private canvasService: CanvasService) {
    this.canvasService.zoomLevel$.subscribe((zoom) => (this.zoomLevel = zoom));
  }

  // Handles clicking the + and - icons
  adjustZoom(delta: number) {
    let newZoom = this.zoomLevel + delta;

    if (newZoom < 0.1) newZoom = 0.1;
    if (newZoom > 2.0) newZoom = 2.0;

    this.zoomLevel = Math.round(newZoom * 10) / 10;
    this.canvasService.setZoomLevel(this.zoomLevel);
  }

  // Set the zoom back to exactly 100% (1.0)
  // Set the zoom back to exactly 100% (1.0)
  resetZoom() {
    this.zoomLevel = 1.0;
    this.canvasService.setZoomLevel(this.zoomLevel);
  }

  onZoomInput1() {
    this.canvasService.setZoomLevel(this.zoomLevel);
  }

  // Handles when a user types a number like '150' into the input
  onZoomInput2(value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const clamped = Math.min(Math.max(num, 10), 200);
      this.zoomLevel = clamped / 100;
      this.canvasService.setZoomLevel(this.zoomLevel);
    }
  }
}
