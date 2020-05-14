import { Message, ExecTypes } from "interfaces/message";
import { BlotterTypes } from "columns/messageBlotter";
import React, { ReactElement } from "react";
import { BlotterRowTypes, Row } from "components/MessageBlotter/row";

export const isExecution = (message: Message): boolean => {
  return (
    message.OrdStatus === ExecTypes.Filled ||
    message.OrdStatus === ExecTypes.PartiallyFilled
  );
};

export const isMyBankMessage = (message: Message, firm: string): boolean => {
  return message.MDMkt === firm;
};

export const isMyMessage = (message: Message, email: string): boolean => {
  return message.Username === email || message.ContraTrader === email;
};

export const renderRowFactory = (
  blotterType: BlotterTypes,
  email: string,
  firm: string
) => (props: any): ReactElement | null => {
  const message: Message = props.row;
  const rowType = ((): BlotterRowTypes => {
    if (!message) return BlotterRowTypes.Normal;
    if (!isExecution(message)) {
      if (isBusted(message)) return BlotterRowTypes.Busted;
      return BlotterRowTypes.Normal;
    }
    if (isMyMessage(message, email)) {
      return BlotterRowTypes.MyFill;
    } else if (isMyBankMessage(message, firm)) {
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
