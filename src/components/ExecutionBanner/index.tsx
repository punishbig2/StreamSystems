import { MessagesStore, MessagesStoreContext } from 'mobx/stores/messagesStore';
import { observer } from 'mobx-react';
import React, { ReactElement } from 'react';
import { Message } from 'types/message';
import { toClassName } from 'utils/conditionalClasses';
import { getMessagePrice } from 'utils/messageUtils';
import { priceFormatter } from 'utils/priceFormatter';

const ExecutionBanner: React.FC = observer((): ReactElement | null => {
  const messagesStore: MessagesStore = React.useContext<MessagesStore>(MessagesStoreContext);
  const { executions } = messagesStore;
  const latest: readonly Message[] = executions.slice(0, 5);

  return (
    <div className="execution-banner">
      {latest.map((execution: Message) => {
        const aggressionClass = getAggressionClass(execution);

        return (
          <div
            className={toClassName('execution-banner-item', aggressionClass)}
            key={execution.ExecID}
          >
            {execution.Symbol} {execution.Strategy} {execution.Tenor} @{' '}
            {priceFormatter(getMessagePrice(execution))}
          </div>
        );
      })}
    </div>
  );
});

export { ExecutionBanner };
const getAggressionClass = (execution: Message): string => {
  if (execution.AggressorIndicator === 'Y') {
    if (execution.Side === '1') {
      return 'buy';
    } else {
      return 'sell';
    }
  } else {
    return '';
  }
};
