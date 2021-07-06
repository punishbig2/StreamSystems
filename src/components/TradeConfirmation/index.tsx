import { Typography } from "@material-ui/core";
import React, { ReactElement, useMemo } from "react";
import { Message } from "types/message";
import { Role } from "types/role";
import { User, UserPreferences } from "types/user";
import { getMessagePrice, getMessageSize } from "utils/messageUtils";
import { priceFormatter } from "utils/priceFormatter";
import workareaStore from "mobx/stores/workareaStore";

interface OwnProps {
  trade: Message;
  preferences: UserPreferences;
  onClose: () => void;
}

export const TradeConfirmation: React.FC<OwnProps> = (
  props: OwnProps
): ReactElement | null => {
  const { trade } = props;
  const { Side } = trade;
  const { Symbol } = trade;
  const direction: string = Side
    ? Side.toString() === "1"
      ? "from"
      : "to"
    : "unknown side";
  const verb: string = direction === "from" ? "buy" : "sell";
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return roles.includes(Role.Broker);
  }, [user]);
  const firm: string = isBroker ? personality : user.firm;
  const subject1: string = trade.MDMkt === firm ? "You" : trade.MDMkt;
  const subject2: string = trade.ExecBroker;
  const size: number = getMessageSize(trade);
  const price: string = priceFormatter(getMessagePrice(trade));
  const currency: string = Symbol.slice(0, 3);
  const line1: string = `${Symbol} ${trade.Tenor} ${trade.Strategy} @ ${price} ${currency}`;
  const line2: string = `${subject1} ${verb} ${size} ${direction} ${subject2}`;
  Notification.requestPermission().then(() => {
    new Notification(`${line1}\n${line2}`);
  });
  return (
    <div className={"item"}>
      <div className={"content"}>
        <Typography className={"line1"} variant={"body1"} color={"textPrimary"}>
          {line1}
        </Typography>
        <Typography className={"line2"} variant={"body1"} color={"textPrimary"}>
          {line2}
        </Typography>
      </div>
    </div>
  );
};
