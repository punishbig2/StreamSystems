import { observer } from "mobx-react";
import { BrokerageStore, CommissionRate } from "mobx/stores/brokerageStore";
import React, { ReactElement, useState } from "react";

export const CommissionRates: React.FC = observer(
  (): ReactElement => {
    const [{ commissionRates }] = useState<BrokerageStore>(
      new BrokerageStore()
    );
    return (
      <div className={"commission-rates-container"}>
        {commissionRates.map(
          (entry: CommissionRate): ReactElement => {
            const { value, region } = entry;
            const formattedValue: string = value.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            });
            return (
              <div key={region} className={"entry"}>
                <div className={"region"}>{region}</div>
                <div className={"value"}>{formattedValue}</div>
              </div>
            );
          }
        )}
      </div>
    );
  }
);
