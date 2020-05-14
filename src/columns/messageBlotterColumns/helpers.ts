import { Message, ExecTypes } from "interfaces/message";
import { User } from "interfaces/user";
import workareaStore from "mobx/stores/workareaStore";

export const involved = (message: Message): boolean => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  if (
    message.ExecType !== ExecTypes.PartiallyFilled &&
    message.ExecType !== ExecTypes.Filled
  )
    return true;
  if (user.isbroker && message.MDMkt === personality) return true;
  if (message.MDMkt === user.firm) return true;
  return message.Username === user.email || message.ContraTrader === user.email;
};
