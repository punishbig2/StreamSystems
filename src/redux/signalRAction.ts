import {HubConnection} from '@microsoft/signalr';
import {Action} from 'redux/action';

export class SignalRAction<T> implements Action<T> {
  type: any;
  data: any;

  constructor(type: string, data: any) {
    this.type = type;
    this.data = data;
  }

  handle = async (connection: HubConnection): Promise<any> => {
    return await connection.invoke(this.type, ...this.data);
  };
}
