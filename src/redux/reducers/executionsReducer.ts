import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {FXOAction} from 'redux/fxo-action';
import {ExecTypes, Message} from 'interfaces/message';

export const defaultExecutions = [];

const isFill = (item: Message): boolean =>
  (item.OrdStatus === ExecTypes.PartiallyFilled || item.OrdStatus === ExecTypes.Filled);

const filterExecutions = (array: Message[]): Message[] => {
  return array.filter((item: Message) => {
    return isFill(item);
  });
};

const uniqueEntries = (messages: Message[]): Message[] => {
  return messages.filter((item: Message, index: number, array: Message[]) => {
    return index === array.findIndex((each: Message) => each.ClOrdID === item.ClOrdID);
  });
};

export default (state: Message[] = defaultExecutions, action: FXOAction<MessageBlotterActions>): Message[] => {
  switch (action.type) {
    case MessageBlotterActions.Initialize:
      return uniqueEntries([...state, ...filterExecutions(action.data)]);
    case MessageBlotterActions.Update:
      if (!isFill(action.data))
        return state;
      return uniqueEntries([...state, action.data]);
    default:
      return state;
  }
}
