import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {FXOAction} from 'redux/fxo-action';
import {ExecTypes, Message} from 'interfaces/message';

const filterExecutions = (array: Message[]): Message[] => {
  return array.filter((item: any) => {
    return (item.OrdStatus === ExecTypes.PartiallyFilled || item.OrdStatus === ExecTypes.Filled);
  });
};

export default (state: Message[] = [], action: FXOAction<MessageBlotterActions>): Message[] => {
  switch (action.type) {
    case MessageBlotterActions.Initialize:
      return [...state, ...filterExecutions(action.data)];
    case MessageBlotterActions.Update:
      console.log(action.data);
      return state;
    default:
      return state;
  }
}
