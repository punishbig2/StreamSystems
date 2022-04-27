import { Typography } from "@material-ui/core";
import { Globals } from "golbals";
import { observer } from "mobx-react";
import {
  BrokerageStore,
  BrokerageStoreContext,
  CommissionRate,
} from "mobx/stores/brokerageStore";
import React, { ReactElement, useEffect } from "react";
import { toClassName } from "utils/conditionalClasses";
import workareaStore from "mobx/stores/workareaStore";
import { STRM } from "stateDefs/workspaceState";
import { API } from "API";
import { BrokerageCommissionResponse } from "types/brokerageCommissionResponse";

export const CommissionRates: React.FC = observer((): ReactElement | null => {
  const brokerageStore = React.useContext<BrokerageStore | null>(
    BrokerageStoreContext
  );
  if (brokerageStore === null) {
    throw new Error("no brokerage store found");
  }
  const { commissionRates } = brokerageStore;
  const { user, personality, connected } = workareaStore;

  useEffect((): (() => void) | void => {
    if (!connected) {
      return;
    }
    const firm = personality !== STRM ? personality : user.firm;
    const task = API.getBrokerageCommission(firm);

    task
      .execute()
      .then((rates: BrokerageCommissionResponse): void => {
        // noinspection SuspiciousTypeOfGuard
        if (typeof rates === "string") {
          brokerageStore.setRates({});
          return;
        }

        brokerageStore.setRates(rates);
      })
      .catch(console.warn);

    const removeListener = brokerageStore.installListener(firm);
    return (): void => {
      removeListener();
      task.cancel();
    };
  }, [brokerageStore, connected, personality, user.firm]);

  return (
    <div className={"commission-rates-container"}>
      {commissionRates.map((entry: CommissionRate): ReactElement => {
        const { value, region } = entry;
        const formattedValue: string = value.toLocaleString(Globals.locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        });
        return (
          <div
            key={region}
            className={toClassName("entry", {
              "has-discount": entry.hasDiscount,
            })}
          >
            <Typography
              variant={"subtitle1"}
              color={"textSecondary"}
              className={"region"}
            >
              {region}
            </Typography>
            <Typography color={"textPrimary"} className={"value"}>
              {formattedValue}
            </Typography>
          </div>
        );
      })}
    </div>
  );
});
