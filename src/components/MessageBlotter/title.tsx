import React, { ReactElement } from 'react';
import { BlotterTypes } from 'redux/constants/messageBlotterConstants';

interface Props {
  type: BlotterTypes;
}

export const MessageBlotterTitle: React.FC<Props> = (props: Props): ReactElement | null => {
  switch (props.type) {
    case BlotterTypes.Regular:
      return <h1>Blotter</h1>;
    case BlotterTypes.Executions:
      return <h1>Execution Blotter</h1>;
    default:
      return null;
  }
};
