import {Action} from 'redux/action';

export class WSAction<T> implements Action<T> {
  type: any;
  data: any;

  constructor(type: string, data: any) {
    this.type = type;
    this.data = data;
  }
}
