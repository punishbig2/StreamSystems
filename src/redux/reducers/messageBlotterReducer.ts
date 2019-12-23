import {ExecTypes} from 'interfaces/message';
import {Action} from 'redux/action';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';

const initialState: MessageBlotterState = {
  entries: [],
};

type ActionType = MessageBlotterActions | SignalRActions;
export default (state: MessageBlotterState = initialState, {type, data}: Action<ActionType>) => {
  switch (type) {
    case MessageBlotterActions.Update:
      if (data.OrdStatus === ExecTypes.PartiallyFilled || data.OrdStatus === ExecTypes.Filled)
        return {...state, entries: [data, ...state.entries], lastEntry: data};
      return {...state, entries: [data, ...state.entries]};
    case MessageBlotterActions.Initialize:
      return {...state, entries: data};
    default:
      return state;
  }
}
