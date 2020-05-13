import { Message, ExecTypes } from 'interfaces/message';
import { User } from 'interfaces/user';
import workareaStore from 'mobx/stores/workareaStore';
import moment from 'moment';

const MESSAGE_TIME_FORMAT: string = 'YYYYMMDD-HH:mm:ss';

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

export const getMessageBuyer = (message: Message): string => {
  if (message.Side === '1') {
    return message.MDMkt;
  } else {
    return message.ExecBroker;
  }
};

export const extractDealId = (message: Message): string => {
  const id: string = message.ExecID;
  const parts: string[] = id.split('-');
  if (parts.length === 0)
    return '?';
  return parts[0];
};

export const sortByTimeDescending = (m1: Message, m2: Message): number => {
  const M1: moment.Moment = moment(m1.TransactTime, MESSAGE_TIME_FORMAT);
  const M2: moment.Moment = moment(m2.TransactTime, MESSAGE_TIME_FORMAT);
  return -M1.diff(M2);
};

const isFill = (item: Message): boolean => {
  return item.ExecType === ExecTypes.PartiallyFilled
    || item.ExecType === ExecTypes.Filled
    || item.OrdStatus === ExecTypes.PartiallyFilled
    || item.OrdStatus === ExecTypes.Filled;
};

export const isMyMessage = (message: Message): boolean => {
  const user: User = workareaStore.user;
  return user.email === message.Username;
};

export const isAcceptableFill = (message: Message): boolean => {
  const user: User = workareaStore.user;
  if (!isFill(message))
    return false;
  if ((message.Username !== user.email)
    && (message.ContraTrader !== user.email)
    && (message.MDMkt !== user.firm)
    && (message.ExecBroker !== user.firm)) {
    return message.Side === '1';
  }
  return message.Username === user.email || message.MDMkt === user.firm;
};

