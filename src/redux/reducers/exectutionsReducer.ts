import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {FXOAction} from 'redux/fxo-action';
import {ExecTypes, Message} from 'interfaces/message';

const isFill = (item: Message): boolean =>
  (item.OrdStatus === ExecTypes.PartiallyFilled || item.OrdStatus === ExecTypes.Filled);

const filterExecutions = (array: Message[]): Message[] => {
  return array.filter((item: Message) => {
    return isFill(item);
  });
};

export default (state: Message[] = [], action: FXOAction<MessageBlotterActions>): Message[] => {
  switch (action.type) {
    case MessageBlotterActions.Initialize:
      return [...state, ...filterExecutions(action.data)];
    case MessageBlotterActions.Update:
      if (!isFill(action.data))
        return state;
      return [...state, action.data];
    default:
      return state;
  }
}
