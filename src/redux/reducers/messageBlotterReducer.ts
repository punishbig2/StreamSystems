import {ExecTypes} from 'interfaces/message';
import {Action} from 'redux/action';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';

const initialState: MessageBlotterState = {
  entries: [],
  connected: false,
  lastEntry: null,
};

type ActionType = MessageBlotterActions | SignalRActions;
export default (state: MessageBlotterState = initialState, {type, data}: Action<ActionType>) => {
  switch (type) {
    case SignalRActions.Connected:
      return {...state, connected: true};
    case SignalRActions.Disconnected:
      return {...state, connected: false};
    case MessageBlotterActions.Update:
      if (data.ExecType === ExecTypes.PartiallyFilled || data.ExecType === ExecTypes.Filled)
        return {...state, entries: [data, ...state.entries], lastEntry: data};
      return {...state, entries: [data, ...state.entries]};
    case MessageBlotterActions.ClearLastEntry:
      return {...state, lastEntry: null};
    case MessageBlotterActions.Initialize:
      return {...state, entries: data};
    default:
      return state;
  }
}
