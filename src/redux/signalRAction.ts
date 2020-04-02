import { HubConnection } from '@microsoft/signalr';
import { SignalRActions } from 'redux/constants/signalRConstants';
import { FXOAction } from 'redux/fxo-action';

export type Subscriber = (symbol: string, strategy: string, tenor: string) => SignalRAction<SignalRActions>;

export class SignalRAction<T> implements FXOAction<T> {
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
