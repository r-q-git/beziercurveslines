import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { CanvasComponent } from './features/canvas/canvas.component';
import { ToolbarComponent } from './features/toolbar/toolbar.component';
import { ZoomComponent } from './features/zoom/zoom.component';
import { NewLineComponent } from './features/new-line/new-line.component';
import { SendToProjectComponent } from './features/send-to-project/send-to-project.component';
import { MainComponent } from './features/main/main.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    ToolbarComponent,
    ZoomComponent,
    NewLineComponent,
    SendToProjectComponent,
    MainComponent,
  ],
  imports: [BrowserModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
