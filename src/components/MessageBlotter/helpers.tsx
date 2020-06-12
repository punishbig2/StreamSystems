import { Message, ExecTypes } from "interfaces/message";
import { BlotterTypes } from "columns/messageBlotter";
import React, { ReactElement } from "react";
import { BlotterRowTypes, Row } from "components/MessageBlotter/row";
import workareaStore from "../../mobx/stores/workareaStore";
import { STRM } from "../../stateDefs/workspaceState";
import { User } from "../../interfaces/user";

export const isExecution = (message: Message): boolean => {
  return (
    message.OrdStatus === ExecTypes.Filled ||
    message.OrdStatus === ExecTypes.PartiallyFilled
  );
};

export const isMyBankMessage = (message: Message): boolean => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  if (user.isbroker)
    return message.MDMkt === personality || message.ExecBroker === personality;
  return message.MDMkt === user.firm || message.ExecBroker === user.firm;
};

export const isMyMessage = (message: Message): boolean => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  if (user.isbroker) {
    if (personality === STRM) return false;
    return (
      (message.Username === user.email ||
        message.ContraTrader === user.email) &&
      (message.MDMkt === personality || message.ExecBroker === personality)
    );
  }
  return message.Username === user.email || message.ContraTrader === user.email;
};

export const renderRowFactory = (blotterType: BlotterTypes) => (
  props: any
): ReactElement | null => {
  const message: Message = props.row;
  const rowType = ((): BlotterRowTypes => {
    if (!message) return BlotterRowTypes.Normal;
    if (!isExecution(message)) {
      if (isBusted(message)) return BlotterRowTypes.Busted;
      return BlotterRowTypes.Normal;
    }
    if (isMyMessage(message)) {
      return BlotterRowTypes.MyFill;
    } else if (isMyBankMessage(message)) {
      return BlotterRowTypes.MyBankFill;
    }
    return BlotterRowTypes.Normal;
  })();
  return (
    <Row
      key={props.key}
      columns={props.columns}
      row={message}
      weight={props.weight}
      type={rowType}
      containerWidth={props.containerWidth}
      totalWidth={props.totalWidth}
      blotterType={blotterType}
    />
  );
};

export const isBusted = (message: Message): boolean => {
  return false;
};
