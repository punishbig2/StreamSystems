import {HubConnectionState} from '@microsoft/signalr';
import * as signalR from '@microsoft/signalr';
import config from 'config';
import {AnyAction, Dispatch, MiddlewareAPI} from 'redux';
import {createAction} from 'redux/actionCreator';
import {SignalRActions} from 'redux/constants/signalRActions';
import {WorkareaActions} from 'redux/constants/workareaConstants';
import {WSAction} from 'redux/wsAction';

const ApiConfig = config.Api;
const connection = new signalR.HubConnectionBuilder()
  .withUrl(`http://${ApiConfig.Host}/liveUpdateSignalRHub`)
  .withAutomaticReconnect()
  .build()
;

const setupConnection = (dispatch: Dispatch<AnyAction>, connection: signalR.HubConnection) => {
  connection.on('updateMarketData', (message) => {
    dispatch(createAction(SignalRActions.UpdateMarketData, JSON.parse(message)));
  });
};

export const signalRMiddleware = (store: MiddlewareAPI) =>
  (next: Dispatch<AnyAction>) =>
    (action: AnyAction | WSAction<any>) => {
      if (action instanceof WSAction) {
        const {data} = action;
        if (connection.state === HubConnectionState.Disconnected) {
          connection.start()
            .then(() => {
              setupConnection(store.dispatch, connection);
              // Re-dispatch the action that caused this connection
              store.dispatch(action);
            });
        } else if (connection.state === HubConnectionState.Connected) {
          connection.invoke('SubscribeForMarketData', ...data)
            .then((data) => console.log('subscribed', data))
          ;
        }
      } else {
        // We're not interested in this action
        return next(action);
      }
    };
