import {Message, ExecTypes} from 'interfaces/message';

export const getMessageSize = (message: Message): number => {
  switch (message.OrdStatus) {
    case ExecTypes.PartiallyFilled:
    case ExecTypes.Filled:
      return Number(message.LastShares);
    case ExecTypes.Canceled:
      return Number(message.LeavesQty);
    default:
      return Number(message.OrderQty);
  }
};

export const getMessagePrice = (message: Message): number => {
  if (message.OrdStatus === ExecTypes.PartiallyFilled || message.OrdStatus === ExecTypes.Filled) {
    return Number(message.LastPx);
  } else {
    return Number(message.Price);
  }
};
