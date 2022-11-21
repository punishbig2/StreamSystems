import { BlotterTypes } from 'columns/messageBlotter';
import { BlotterRowTypes, Row } from 'components/MessageBlotter/row';
import workareaStore from 'mobx/stores/workareaStore';
import React, { ReactElement } from 'react';
import { NONE } from 'stateDefs/workspaceState';
import { ExecTypes, Message } from 'types/message';
import { hasRole, Role } from 'types/role';
import { User } from 'types/user';

export const isExecution = (message: Message): boolean => {
  return message.OrdStatus === ExecTypes.Filled || message.OrdStatus === ExecTypes.PartiallyFilled;
};

export const isMyBankMessage = (message: Message): boolean => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const { roles } = user;
  if (hasRole(roles, Role.Broker))
    return message.MDMkt === personality || message.ExecBroker === personality;
  return message.MDMkt === user.firm || message.ExecBroker === user.firm;
};

export const isMyMessage = (message: Message): boolean => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const { roles } = user;
  if (hasRole(roles, Role.Broker)) {
    if (personality === NONE) return false;
    return (
      (message.Username === user.email || message.ContraTrader === user.email) &&
      (message.MDMkt === personality || message.ExecBroker === personality)
    );
  }
  return message.Username === user.email || message.ContraTrader === user.email;
};

export const renderRowFactory = (blotterType: BlotterTypes) =>
  function RowElement(props: any): ReactElement | null {
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

export const isBusted = (_message: Message): boolean => {
  return false;
};
