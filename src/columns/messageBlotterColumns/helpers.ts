import workareaStore from "mobx/stores/workareaStore";
import { Message } from "types/message";
import { Role } from "types/role";
import { User } from "types/user";

export const involved = (message: Message): boolean => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const { roles } = user;
  const isBroker: boolean = roles.includes(Role.Broker);
  if (isBroker)
    return message.MDMkt === personality || message.ExecBroker === personality;
  if (message.MDMkt === user.firm || message.ExecBroker === user.firm)
    return true;
  return message.Username === user.email || message.ContraTrader === user.email;
};
