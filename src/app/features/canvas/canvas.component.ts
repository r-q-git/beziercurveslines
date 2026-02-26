import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { RenderService } from 'src/app/core/services/BzRender.Service';
import { CanvasService } from 'src/app/core/services/BzCanvas.Service';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
})
export class CanvasComponent implements OnInit, AfterViewInit {
  @ViewChild('editorCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  ctx!: CanvasRenderingContext2D;

  constructor(
    private renderService: RenderService,
    private canvasService: CanvasService,
  ) {}

  canvasHeight!: number;
  canvasWidth!: number;

  ngOnInit(): void {}

  @HostListener('window:resize')
  resize() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.renderService.render();
  }

  // INIT
  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.renderService.setCanvasContext(this.ctx!, this.canvasRef);
    this.canvasService.setCanvasContext(this.ctx!, this.canvasRef);
    this.resize();
  }

  // --- Interaction ---
  onMouseDown(e: MouseEvent) {
    this.canvasService.onMouseDown(e);
  }

  onMouseMove(e: MouseEvent) {
    this.canvasService.onMouseMove(e);
  }

  onMouseUp() {
    this.canvasService.onMouseUp();
  }

  onDoubleClick(e: MouseEvent) {
    this.canvasService.onDoubleClick(e);
  }
}
