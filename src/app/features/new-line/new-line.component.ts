import { Component } from '@angular/core';
import { LineService } from 'src/app/core/services/BzLine.Service';

@Component({
  selector: 'app-new-line',
  templateUrl: './new-line.component.html',
  styleUrls: ['./new-line.component.css'],
})
export class NewLineComponent {
  constructor(private lineService: LineService) {}

  addNewLine(type: 'straight' | 'step' | 'curve') {
    this.lineService.addLine(type);
  }
}
