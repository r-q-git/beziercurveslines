import { Injectable, ElementRef } from '@angular/core';
import { IframeMessageType } from 'src/app/core/models/iframeMessage.model';
import { QlIframeMessageService } from 'src/app/core/services/QlIframeMessageService';
import { generateBase64SvgFromLines } from 'src/app/shared/utils/BzGenerateBase64SvgFromLines';
import { Line } from 'src/app/core/models/line.model';

@Injectable({ providedIn: 'root' })
export class SendToProjectService {
  exportToProject(canvasWidth: number, canvasHeight: number, lines: Line[]) {
    const base64Svg = generateBase64SvgFromLines(
      canvasWidth,
      canvasHeight,
      lines,
    );
    console.log(base64Svg);
    QlIframeMessageService.sendMessageToParent(
      {
        type: IframeMessageType.ADD_OBJECT,
        payload: {
          dataString: base64Svg,
          type: 'stickerbox',
          metaData: {
            width: canvasWidth,
            height: canvasHeight,
            name: 'Bezier Drawing',
            createdAt: new Date().toISOString(),
          },
        },
      },
      '*',
    );
  }
}
