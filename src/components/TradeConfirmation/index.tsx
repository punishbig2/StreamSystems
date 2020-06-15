import React, { ReactElement, useEffect } from "react";
import { Message } from "interfaces/message";
import { getMessageSize, getMessagePrice } from "utils/messageUtils";
import { UserPreferences, User } from "interfaces/user";
import workareaStore from "../../mobx/stores/workareaStore";

interface OwnProps {
  trade: Message;
  preferences: UserPreferences;
  onClose: () => void;
}

const sideClasses: { [key: string]: string } = {
  2: "sell",
  1: "buy",
};

export const TradeConfirmation: React.FC<OwnProps> = (
  props: OwnProps
): ReactElement | null => {
  const { trade } = props;
  const { Side } = trade;
  const direction: string = Side.toString() === "1" ? "from" : "to";
  const verb: string = direction === "from" ? "buy" : "sell";
  useEffect(() => {});
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const firm: string = user.isbroker ? personality : user.firm;
  const subject1: string = trade.MDMkt === firm ? "You" : trade.MDMkt;
  const subject2: string = trade.ExecBroker;
  const size: number = getMessageSize(trade);
  const price: number = getMessagePrice(trade);
  const line1: string = `${trade.Symbol} ${trade.Tenor} ${trade.Strategy} @ ${price}`;
  const line2: string = `${subject1} ${verb} ${size} ${direction} ${subject2}`;
  Notification.requestPermission().then(() => {
    new Notification(`${line1}\n${line2}`);
  });
  return (
    <div className={[sideClasses[trade.Side], "item"].join(" ")}>
      <div className={"content"}>
        <div className={"line"}>{line1}</div>
        <div className={"line"}>{line2}</div>
      </div>
    </div>
  );
};
