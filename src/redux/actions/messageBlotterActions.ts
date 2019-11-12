import {API} from 'API';
import {ExecTypes, MessageBlotterEntry} from 'interfaces/messageBlotterEntry';
import {User} from 'interfaces/user';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {RunActions} from 'redux/constants/runConstants';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {SignalRAction} from 'redux/signalRAction';
import {toRunId} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {$$} from 'utils/stringPaster';

export const getSnapshot = (): AsyncAction<any, any> => {
  return new AsyncAction<any, any>(async () => {
    const user: User = getAuthenticatedUser();
    const snapshot: MessageBlotterEntry[] = await API.getMessagesSnapshot();
    const filtered: MessageBlotterEntry[] = snapshot.filter((entry: MessageBlotterEntry) => {
      return entry.Username === user.email;
    });
    // Return the initialization action
    return [
      createAction(MessageBlotterActions.Initialize, snapshot),
      ...filtered.map((entry: MessageBlotterEntry) => {
        return createAction($$(toRunId(entry.Symbol, entry.Strategy), RunActions.UpdateOrders), entry);
      }),
    ];
  }, createAction(MessageBlotterActions.GettingSnapshot));
};

export const subscribe = (email: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.SubscribeForMBMsg, [email]);
};

export const unsubscribe = (email: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.UnsubscribeForMBMsg, [email]);
};
