import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputSwitchModule } from 'primeng/inputswitch';

// CDK
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    DropdownModule,
    SliderModule,
    ColorPickerModule,
    InputSwitchModule,
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }