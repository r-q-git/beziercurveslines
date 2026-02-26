import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Line } from 'src/app/core/models/line.model';
import { CanvasService } from 'src/app/core/services/BzCanvas.Service';
import { LineService } from 'src/app/core/services/BzLine.Service';
import { SendToProjectService } from 'src/app/core/services/BzSendToProject.Service';

@Component({
  selector: 'app-send-to-project',
  templateUrl: './send-to-project.component.html',
  styleUrls: ['./send-to-project.component.css'],
})
export class SendToProjectComponent implements OnInit, AfterViewInit {
  lines!: Line[];
  private canvasWidth!: number;
  private canvasHeight!: number;

  constructor(
    private lineService: LineService,
    private canvasService: CanvasService,
    private sendToProjectService: SendToProjectService,
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.lineService.lines$.subscribe((lines) => (this.lines = lines));

    this.canvasService.windowInnerHeight$.subscribe((wih) => {
      this.canvasHeight = wih;
    });

    this.canvasService.windowInnerWidth$.subscribe((wiw) => {
      this.canvasWidth = wiw;
    });
  }

  addToProject() {
    this.lineService.lines$.subscribe((lines) => (this.lines = lines));
    console.log('Saving project:', this.lines);
    if (!this.lines || this.lines.length === 0) {
      console.log('No lines to export');
      return;
    }

    if (!this.canvasHeight || !this.canvasHeight) {
      console.log('No Canvas Height or Width!');
      return;
    }

    this.sendToProjectService.exportToProject(
      this.canvasWidth,
      this.canvasHeight,
      this.lines,
    );
  }
}
