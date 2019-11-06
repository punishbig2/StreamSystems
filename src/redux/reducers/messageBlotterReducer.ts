import {Action} from 'redux/action';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';

const initialState: MessageBlotterState = {
  entries: {},
  connected: false,
};

const print = (obj: any) => {
  console.log(obj);
  return obj;
};

type ActionType = MessageBlotterActions | SignalRActions;
export default (state: MessageBlotterState = initialState, {type, data}: Action<ActionType>) => {
  switch (type) {
    case SignalRActions.Connected:
      return {...state, connected: true};
    case SignalRActions.Disconnected:
      return {...state, connected: false};
    case MessageBlotterActions.Update:
      return print({...state, entries: {...state.entries, [data.ExecID]: data}});
    default:
      return state;
  }
}
