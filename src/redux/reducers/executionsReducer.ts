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

const applyFilter = (messages: Message[]): Message[] => {
  const getOrderLinkID = (message: any): string => {
    if (message.hasOwnProperty('ClOrdLinkID')) {
      return message.ClOrdLinkID;
    } else {
      return message['583'];
    }
  };

  const filtered: Message[] = messages.filter((item: Message, index: number, array: Message[]) => {
    if (index !== array.findIndex((each: Message) => each.ClOrdID === item.ClOrdID))
      return false;
    const link: number = array.findIndex((each: Message) => {
      return getOrderLinkID(each) === item.ClOrdID;
    });
    const hasLink: boolean = link !== -1;
    return hasLink && item.Side === '1';
  });
  console.log(filtered);
  return filtered;
};

export default (state: Message[] = defaultExecutions, action: FXOAction<MessageBlotterActions>): Message[] => {
  switch (action.type) {
    case MessageBlotterActions.Initialize:
      return applyFilter([...state, ...filterExecutions(action.data)]);
    case MessageBlotterActions.Update:
      if (!isFill(action.data))
        return state;
      return applyFilter([...state, action.data]);
    default:
      return state;
  }
}
