import React, { ReactElement, useState } from 'react';
import { Message } from 'interfaces/message';
import { priceFormatter } from 'utils/priceFormatter';
import { ExecutionBannerStore } from 'mobx/stores/executionBanner';

interface OwnProps {
}

const ExecutionBanner: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const [store] = useState<ExecutionBannerStore>(new ExecutionBannerStore());
  const { executions } = store;
  const start: number = Math.max(0, executions.length - 5);
  const end: number = start + 5;
  const last5: Message[] = executions
    .slice(start, end)
    .reverse();
  return (
    <div className={'execution-banner'}>
      {last5.map((execution: Message) => (
        <div className={'execution-banner-item'} key={execution.ExecID}>
          {execution.Symbol} {execution.Strategy} {execution.Tenor} @ {priceFormatter(Number(execution.LastPx))}
        </div>
      ))}
    </div>
  );
};

export { ExecutionBanner };

