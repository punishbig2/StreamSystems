import { Message, ExecTypes } from "types/message";
import { User } from "types/user";
import workareaStore from "mobx/stores/workareaStore";
import moment from "moment";
import { STRM } from "stateDefs/workspaceState";
import { Deal } from 'components/MiddleOffice/types/deal';

const MESSAGE_TIME_FORMAT: string = "YYYYMMDD-HH:mm:ss";
export const TransTypes: { [key: string]: string } = {
  [ExecTypes.New]: "New",
  [ExecTypes.Canceled]: "Cancel",
  [ExecTypes.PartiallyFilled]: "Partially Filled",
  [ExecTypes.Filled]: "Filled",
  [ExecTypes.Replace]: "Replace",
  [ExecTypes.PendingCancel]: "Pending Cancel",
};

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
  if (
    message.OrdStatus === ExecTypes.PartiallyFilled ||
    message.OrdStatus === ExecTypes.Filled
  ) {
    return Number(message.LastPx);
  } else {
    return Number(message.Price);
  }
};

export const getBuyer = (message: Message): string | null => {
  if (
    message.OrdStatus === ExecTypes.Filled ||
    message.OrdStatus === ExecTypes.PartiallyFilled
  )
    return message.Side === "1" ? message.MDMkt : message.ExecBroker;
  return null;
};

export const getSeller = (message: Message): string | null => {
  if (
    message.OrdStatus === ExecTypes.Filled ||
    message.OrdStatus === ExecTypes.PartiallyFilled
  )
    return message.Side === "1" ? message.ExecBroker : message.MDMkt;
  return null;
};

export const sortByTimeDescending = (m1: Message, m2: Message): number => {
  const M1: moment.Moment = moment(m1.TransactTime, MESSAGE_TIME_FORMAT);
  const M2: moment.Moment = moment(m2.TransactTime, MESSAGE_TIME_FORMAT);
  return -M1.diff(M2);
};

const isFill = (item: Message): boolean => {
  return (
    item.ExecType === ExecTypes.PartiallyFilled ||
    item.ExecType === ExecTypes.Filled ||
    item.OrdStatus === ExecTypes.PartiallyFilled ||
    item.OrdStatus === ExecTypes.Filled
  );
};

export const isMyMessage = (message: Message): boolean => {
  const user: User = workareaStore.user;
  return user.email === message.Username;
};

const isTraderInvolved = (message: Message, trader: string): boolean => {
  return message.Username === trader || message.ContraTrader === trader;
};

const isBrokerInvolved = (message: Message, bank: string): boolean => {
  return message.MDMkt === bank || message.ExecBroker === bank;
};

export const isAcceptableFill = (message: Message): boolean => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  if (!isFill(message)) return false;
  if (user.isbroker) {
    if (personality === STRM) return message.Side === "1";
    return (
      (!isBrokerInvolved(message, personality) && message.Side === "1") ||
      message.MDMkt === personality
    );
  }
  return (
    (!isTraderInvolved(message, user.email) && message.Side === "1") ||
    message.Username === user.email
  );
};

export const isMessage = (row: Message | Deal): row is Message => "ClOrdID" in row;
