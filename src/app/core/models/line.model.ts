import { Point } from './point.model';

export interface Line {
  id: number;
  color: string;
  width: number;
  locked: boolean;
  start: Point;
  end: Point;
  elbows: Point[];
  type: 'straight' | 'step' | 'curve';
  strokeStyle: 'solid' | 'dashed' | 'dotted';
}
