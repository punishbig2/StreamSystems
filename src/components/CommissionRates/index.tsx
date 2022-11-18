import { Typography } from '@material-ui/core';
import { API } from 'API';
import { Globals } from 'golbals';
import { BrokerageStore, BrokerageStoreContext, CommissionRate } from 'mobx/stores/brokerageStore';
import workareaStore from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React, { ReactElement, useEffect } from 'react';
import { BrokerageCommissionResponse } from 'types/brokerageCommissionResponse';
import { toClassName } from 'utils/conditionalClasses';

export const CommissionRates: React.FC = observer((): ReactElement | null => {
  const brokerageStore = React.useContext<BrokerageStore | null>(BrokerageStoreContext);
  if (brokerageStore === null) {
    throw new Error('no brokerage store found');
  }
  const { commissionRates } = brokerageStore;
  const { connected, effectiveFirm } = workareaStore;

  useEffect((): VoidFunction | void => {
    if (!connected) {
      return;
    }
    const task = API.getBrokerageCommission(effectiveFirm);

    task
      .execute()
      .then((rates: BrokerageCommissionResponse): void => {
        // noinspection SuspiciousTypeOfGuard
        if (typeof rates === 'string') {
          brokerageStore.setRates({});
          return;
        }

        brokerageStore.setRates(rates);
      })
      .catch(console.warn);

    const removeListener = brokerageStore.installListener(effectiveFirm);
    return (): void => {
      removeListener();
      task.cancel();
    };
  }, [brokerageStore, connected, effectiveFirm]);

  return (
    <div className="commission-rates-container">
      {commissionRates.map((entry: CommissionRate): ReactElement => {
        const { value, region } = entry;
        const formattedValue: string = value.toLocaleString(Globals.locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        });
        return (
          <div
            key={region}
            className={toClassName('entry', {
              'has-discount': entry.hasDiscount,
            })}
          >
            <Typography variant="subtitle1" color="textSecondary" className="region">
              {region}
            </Typography>
            <Typography color="textPrimary" className="value">
              {formattedValue}
            </Typography>
          </div>
        );
      })}
    </div>
  );
});
