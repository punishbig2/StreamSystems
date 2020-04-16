import React, { ReactElement, useEffect } from 'react';
import { Message } from 'interfaces/message';
import { priceFormatter } from 'utils/priceFormatter';
import store from 'mobx/stores/messagesStore';
import { getMessagePrice } from 'messageUtils';
import { observer } from 'mobx-react';

const ExecutionBanner: React.FC<{}> = observer((): ReactElement | null => {
  const { executions } = store;
  useEffect(() => {
    console.log('executions change: ', executions.length);
  }, [executions]);
  const last5: Message[] = executions
    .slice(0, 5)
    .reverse();
  console.log(last5.map((m: Message) => ({
    time: m.TransactTime,
    id: m.ExecID,
    user: m.Username,
    tenor: m.Tenor,
    strategy: m.Strategy,
    symbol: m.Symbol,
    price: Number(m.Price),
  })));
  return (
    <div className={'execution-banner'}>
      {last5.map((execution: Message) => (
        <div className={'execution-banner-item'} key={execution.ExecID}>
          {execution.Symbol} {execution.Strategy} {execution.Tenor} @ {priceFormatter(getMessagePrice(execution))}
        </div>
      ))}
    </div>
  );
});

export { ExecutionBanner };

