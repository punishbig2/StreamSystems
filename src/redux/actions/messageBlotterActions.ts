import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {SignalRAction} from 'redux/signalRAction';

export const clearLastEntry = (): Action<MessageBlotterActions> => {
  return createAction(MessageBlotterActions.ClearLastEntry);
};

export const subscribe = (email: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.SubscribeForMBMsg, [email]);
};

export const unsubscribe = (email: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.UnsubscribeForMBMsg, [email]);
};
