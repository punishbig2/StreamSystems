import {HubConnection} from '@microsoft/signalr';
import {Action} from 'redux/action';
import {SignalRActions} from 'redux/constants/signalRConstants';

export type Subscriber = (
  symbol: string,
  strategy: string,
  tenor: string,
) => SignalRAction<SignalRActions>;

export class SignalRAction<T> implements Action<T> {
  type: any;
  data: any;

  constructor(type: string, data: any) {
    this.type = type;
    this.data = data;
  }

  public handle = async (connection: HubConnection): Promise<any> => {
    return await connection.invoke(this.type, ...this.data);
  };
}
