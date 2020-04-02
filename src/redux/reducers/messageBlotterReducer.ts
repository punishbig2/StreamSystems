import { ExecTypes } from 'interfaces/message';
import { MessageBlotterActions } from 'redux/constants/messageBlotterConstants';
import { SignalRActions } from 'redux/constants/signalRConstants';
import { MessageBlotterState } from 'redux/stateDefs/messageBlotterState';
import { FXOAction } from 'redux/fxo-action';
import { WorkareaActions } from 'redux/constants/workareaConstants';
import { getUserFromUrl } from 'utils/getUserFromUrl';

export const defaultMessageBlotterState: MessageBlotterState = {
  entries: [],
};

type ActionType = MessageBlotterActions | SignalRActions & WorkareaActions;
export default (state: MessageBlotterState = defaultMessageBlotterState, { type, data }: FXOAction<ActionType>) => {
  switch (type) {
    case MessageBlotterActions.Update:
      if (data.Username !== getUserFromUrl())
        return state;
      if (data.OrdStatus === ExecTypes.PartiallyFilled || data.OrdStatus === ExecTypes.Filled)
        return { ...state, entries: [data, ...state.entries], lastEntry: data };
      return { ...state, entries: [data, ...state.entries] };
    case MessageBlotterActions.Initialize:
      return { ...state, entries: data };
    default:
      return state;
  }
};
