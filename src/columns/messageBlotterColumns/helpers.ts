import { Message } from "types/message";
import { User } from "types/user";
import workareaStore from "mobx/stores/workareaStore";

export const involved = (message: Message): boolean => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  if (user.isbroker)
    return message.MDMkt === personality || message.ExecBroker === personality;
  if (message.MDMkt === user.firm || message.ExecBroker === user.firm)
    return true;
  return message.Username === user.email || message.ContraTrader === user.email;
};
