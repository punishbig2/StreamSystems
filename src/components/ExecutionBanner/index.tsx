import React, { ReactElement } from 'react';
import { Message } from 'interfaces/message';
import { priceFormatter } from 'utils/priceFormatter';
import store from 'mobx/stores/messagesStore';
import { getMessagePrice } from 'messageUtils';

interface OwnProps {
}

const ExecutionBanner: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const { entries } = store;
  const start: number = Math.max(0, entries.length - 5);
  const end: number = start + 5;
  const last5: Message[] = entries
    .slice(start, end)
    .reverse();
  return (
    <div className={'execution-banner'}>
      {last5.map((execution: Message) => (
        <div className={'execution-banner-item'} key={execution.ExecID}>
          {execution.Symbol} {execution.Strategy} {execution.Tenor} @ {priceFormatter(getMessagePrice(execution))}
        </div>
      ))}
    </div>
  );
};

export { ExecutionBanner };

