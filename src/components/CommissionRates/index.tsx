import { Typography } from "@material-ui/core";
import { Globals } from "golbals";
import { observer } from "mobx-react";
import { BrokerageStore, CommissionRate } from "mobx/stores/brokerageStore";
import React, { ReactElement, useEffect, useState } from "react";
import { toClassName } from "utils/conditionalClasses";

export const CommissionRates: React.FC = observer(
  (): ReactElement => {
    const [brokerageStore] = useState<BrokerageStore>(new BrokerageStore());
    const { commissionRates } = brokerageStore;
    useEffect(() => {
      return brokerageStore.installListener();
    });
    return (
      <div className={"commission-rates-container"}>
        {commissionRates.map(
          (entry: CommissionRate): ReactElement => {
            const { value, region } = entry;
            const formattedValue: string = value.toLocaleString(
              Globals.locale,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              }
            );
            return (
              <div
                key={region}
                className={toClassName("entry", {
                  "has-discount": entry.hasDiscount,
                })}
              >
                <Typography color={"textSecondary"} className={"region"}>
                  {region}
                </Typography>
                <Typography color={"textPrimary"} className={"value"}>
                  {formattedValue}
                </Typography>
              </div>
            );
          }
        )}
      </div>
    );
  }
);
