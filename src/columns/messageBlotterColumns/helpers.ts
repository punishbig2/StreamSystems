import { Message, ExecTypes } from "interfaces/message";
import { User } from "interfaces/user";
import workareaStore from "mobx/stores/workareaStore";

export const involved = (message: Message): boolean => {
  const user: User = workareaStore.user;
  if (
    message.ExecType !== ExecTypes.PartiallyFilled &&
    message.ExecType !== ExecTypes.Filled
  )
    return true;
  if (message.MDMkt === user.firm) return true;
  return message.Username === user.email || message.ContraTrader === user.email;
};
