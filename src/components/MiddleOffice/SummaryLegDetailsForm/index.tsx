import { Grid } from "@material-ui/core";
import { API, Task } from "API";
import { FormField } from "components/FormField";
import { NoDataMessage } from "components/noDataMessage";
import { observer } from "mobx-react";
import moStore, { MOStatus } from "mobx/stores/moStore";
import React, { ReactElement, useEffect, useState } from "react";
import { BankEntity } from "types/bankEntity";
import { BrokerageCommissionResponse } from "types/brokerageCommissionResponse";
import { Symbol } from "types/symbol";

interface CommissionRates {
  buyer: number;
  seller: number;
}

const getCommissionRates = (
  buyer: BankEntity,
  seller: BankEntity,
  symbol: Symbol
): Task<CommissionRates | undefined> => {
  const task1: Task<BrokerageCommissionResponse> = API.getBrokerageCommission(
    buyer.id
  );
  const task2: Task<BrokerageCommissionResponse> = API.getBrokerageCommission(
    seller.id
  );
  return {
    execute: async (): Promise<CommissionRates | undefined> => {
      try {
        const rates1: BrokerageCommissionResponse = await task1.execute();
        const rates2: BrokerageCommissionResponse = await task2.execute();
        return {
          seller: Number(rates2[symbol.ccyGroup]),
          buyer: Number(rates1[symbol.ccyGroup]),
        };
      } catch (error) {
        console.log(error);
      }
    },
    cancel: () => {
      task1.cancel();
      task2.cancel();
    },
  };
};

interface Brokerage {
  rate: number | null;
  buyer: number | null;
  seller: number | null;
  total: number | null;
}

const initialBrokerage: Brokerage = {
  rate: null,
  buyer: null,
  seller: null,
  total: null,
};

export const SummaryLegDetailsForm: React.FC = observer(
  (): ReactElement | null => {
    const { deal } = moStore;
    const [brokerage, setBrokerage] = useState<Brokerage>(initialBrokerage);

    const data = moStore.summaryLeg;

    useEffect(() => {
      if (deal === null) return;
      const buyer: BankEntity = moStore.entitiesMap[deal.buyer];
      const seller: BankEntity = moStore.entitiesMap[deal.seller];
      if (buyer === undefined || seller === undefined) return;
      const task: Task<CommissionRates | undefined> = getCommissionRates(
        buyer,
        seller,
        deal.symbol
      );
      const promise: Promise<CommissionRates | undefined> = task.execute();
      promise.then((rates: CommissionRates | undefined): void => {
        if (rates === undefined) {
          setBrokerage(initialBrokerage);
        } else {
          setBrokerage({
            ...rates,
            total: rates.buyer + rates.seller,
            rate: rates.buyer / rates.seller,
          });
        }
      });
      return () => task.cancel();
    }, [deal]);
    if (data === null) {
      return <NoDataMessage />;
    }
    const { dealOutput } = data;
    const disabled: boolean = moStore.status !== MOStatus.Normal;
    return (
      <>
        <form>
          <Grid container>
            <Grid alignItems={"stretch"} container item>
              <fieldset disabled={disabled}>
                <FormField
                  label={"Strategy"}
                  color={"grey"}
                  value={data.strategy}
                  name={"strategy"}
                  type={"text"}
                  disabled={disabled}
                />
                <FormField
                  label={"Trade Date"}
                  color={"grey"}
                  value={data.tradeDate}
                  name={"tradeDate"}
                  type={"date"}
                  disabled={disabled}
                />
                <FormField
                  label={"Spot Date"}
                  color={"grey"}
                  value={data.spotDate}
                  name={"spotDate"}
                  type={"date"}
                  disabled={disabled}
                />
                <FormField
                  label={"Spot"}
                  color={"grey"}
                  value={dealOutput.spot}
                  name={"spot"}
                  type={"number"}
                  precision={4}
                  disabled={disabled}
                />
                <FormField
                  label={"Cut City"}
                  color={"grey"}
                  value={data.cutCity}
                  name={"cutCity"}
                  type={"text"}
                  disabled={disabled}
                />
                <FormField
                  label={"Cut Time"}
                  color={"grey"}
                  value={data.cutTime}
                  name={"cutTime"}
                  type={"text"}
                  disabled={disabled}
                />
                <FormField
                  label={"Source"}
                  color={"grey"}
                  value={data.source}
                  name={"source"}
                  type={"text"}
                  disabled={disabled}
                />
                <FormField
                  label={"Delivery"}
                  color={"grey"}
                  value={data.delivery}
                  name={"delivery"}
                  type={"text"}
                  disabled={disabled}
                />
                <FormField
                  label={"USI#"}
                  color={"grey"}
                  value={data.usi}
                  name={"usi"}
                  type={"number"}
                  disabled={disabled}
                />
              </fieldset>
            </Grid>
            <Grid alignItems={"stretch"} container>
              <fieldset disabled={disabled}>
                <legend>Brokerage</legend>
                <FormField
                  label={"Brokerage Rate"}
                  color={"grey"}
                  value={brokerage.rate}
                  name={"brokerageRate"}
                  type={"number"}
                  precision={4}
                  disabled={disabled}
                />
                <FormField
                  label={"Buyer Comm"}
                  color={"grey"}
                  value={brokerage.buyer}
                  name={"buyerComm"}
                  type={"currency"}
                  currency={"USD"}
                  precision={2}
                  disabled={disabled}
                />
                <FormField
                  label={"Seller Comm"}
                  color={"grey"}
                  value={brokerage.seller}
                  name={"sellerComm"}
                  type={"currency"}
                  currency={"USD"}
                  precision={2}
                  disabled={disabled}
                />
                <FormField
                  label={"Total Comm"}
                  color={"grey"}
                  value={brokerage.total}
                  name={"totalComm"}
                  type={"currency"}
                  currency={"USD"}
                  precision={2}
                  disabled={disabled}
                />
              </fieldset>
            </Grid>
            <Grid alignItems={"stretch"} container>
              <fieldset disabled={disabled}>
                <legend>Deal Output</legend>
                <FormField
                  label={"Net Premium"}
                  color={"grey"}
                  value={dealOutput.premium}
                  name={"netPremium"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                  disabled={disabled}
                />
                <FormField
                  label={"Price %"}
                  color={"grey"}
                  value={dealOutput.pricePercent}
                  name={"pricePercent"}
                  type={"number"}
                  precision={4}
                  disabled={disabled}
                />
                <FormField
                  label={"Delta"}
                  color={"grey"}
                  value={dealOutput.delta}
                  name={"delta"}
                  type={"number"}
                  precision={8}
                  disabled={disabled}
                />
                <FormField
                  label={"Gamma"}
                  color={"grey"}
                  value={dealOutput.gamma}
                  name={"gamma"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                  disabled={disabled}
                />
                <FormField
                  label={"Net Vega"}
                  color={"grey"}
                  value={dealOutput.vega}
                  name={"vega"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                  disabled={disabled}
                />
                <FormField
                  label={"Net Hedge"}
                  color={"grey"}
                  value={dealOutput.hedge}
                  name={"hedge"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                  disabled={disabled}
                />
              </fieldset>
            </Grid>
          </Grid>
          <div className={"button-box"}>
            <button type={"button"} className={"primary"}>
              Add Leg
            </button>
          </div>
        </form>
      </>
    );
  }
);
