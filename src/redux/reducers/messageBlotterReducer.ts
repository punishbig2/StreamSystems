import {MessageBlotterEntry} from 'interfaces/messageBlotterEntry';
import {Action} from 'redux/action';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';

const initialState: MessageBlotterState = {
  entries: [],
  connected: false,
};

const entryReducer = (entries: { [id: string]: MessageBlotterEntry }, entry: MessageBlotterEntry) => {
  entries[entry.ExecID] = entry;
  return entries;
};

type ActionType = MessageBlotterActions | SignalRActions;
export default (state: MessageBlotterState = initialState, {type, data}: Action<ActionType>) => {
  switch (type) {
    case SignalRActions.Connected:
      return {...state, connected: true};
    case SignalRActions.Disconnected:
      return {...state, connected: false};
    case MessageBlotterActions.Update:
      return {...state, entries: [data, ...state.entries]};
    case MessageBlotterActions.Initialize:
      return {...state, entries: data.reduce(entryReducer, {})};
    default:
      return state;
  }
}
