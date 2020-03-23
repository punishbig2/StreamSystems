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

const hasLink = (messages: Message[], item: Message): boolean => {
  const getOrderLinkID = (message: any): string => {
    if (message.hasOwnProperty('ClOrdLinkID')) {
      return message.ClOrdLinkID;
    } else {
      return message['583'];
    }
  };

  const link: number = messages.findIndex((each: Message) => {
    return getOrderLinkID(each) === item.ClOrdID;
  });
  return link !== -1;
};

const applyFilter = (messages: Message[]): Message[] => {
  return messages.filter((item: Message, index: number, array: Message[]) => {
    if (index !== array.findIndex((each: Message) => each.ClOrdID === item.ClOrdID))
      return false;
    return hasLink(array, item) && item.Side === '1';
  });
};

export default (state: Message[] = defaultExecutions, action: FXOAction<MessageBlotterActions>): Message[] => {
  switch (action.type) {
    case MessageBlotterActions.Initialize:
      return applyFilter([...state, ...filterExecutions(action.data)]);
    case MessageBlotterActions.Update:
      if (!isFill(action.data))
        return state;
      if (hasLink(state, action.data))
        return state;
      return [...state, action.data];
    default:
      return state;
  }
}
