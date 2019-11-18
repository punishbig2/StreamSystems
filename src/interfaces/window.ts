import {WindowTypes} from 'redux/constants/workareaConstants';

export enum WindowStatus {
  None, Docked, Minimized
}

export interface Window {
  id: string;
  type: WindowTypes;
  geometry?: ClientRect;
  status: WindowStatus;
}