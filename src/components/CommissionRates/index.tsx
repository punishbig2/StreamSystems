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

export const CommissionRates: React.FC = observer((): ReactElement | null => {
  const brokerageStore = React.useContext<BrokerageStore | null>(
    BrokerageStoreContext
  );
  if (brokerageStore === null) {
    throw new Error("no brokerage store found");
  }
  const { commissionRates } = brokerageStore;
  const { user, personality } = workareaStore;

  useEffect(() => {
    const firm = personality !== STRM ? personality : user.firm;

    return brokerageStore.installListener(firm);
  }, [brokerageStore, personality, user.firm]);

  console.log(commissionRates);

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
            <Typography color={"textSecondary"} className={"region"}>
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
