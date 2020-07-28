import { Grid } from "@material-ui/core";
import { FormField } from "components/FormField";
import { NoDataMessage } from "components/noDataMessage";
import { observer } from "mobx-react";
import moStore, { MOStatus } from "mobx/stores/moStore";
import React, { ReactElement } from "react";

interface Props {
}

export const SummaryLegDetailsForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const data = moStore.summaryLeg;
    if (data === null) {
      return <NoDataMessage />;
    }
    const { dealOutput } = data;
    const brokerage = data.brokerage
      ? data.brokerage
      : {
          buyerComm: null,
          sellerComm: null,
        };
    const totalComm: number | null =
      brokerage.buyerComm !== null && brokerage.sellerComm !== null
        ? brokerage.buyerComm + brokerage.sellerComm
        : null;
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
                  value={""}
                  name={"brokerageRate"}
                  type={"text"}
                  disabled={disabled}
                />
                <FormField
                  label={"Buyer Comm"}
                  color={"grey"}
                  value={brokerage.buyerComm}
                  name={"buyerComm"}
                  type={"currency"}
                  currency={"USD"}
                  disabled={disabled}
                />
                <FormField
                  label={"Seller Comm"}
                  color={"grey"}
                  value={brokerage.sellerComm}
                  name={"sellerComm"}
                  type={"currency"}
                  currency={"USD"}
                  disabled={disabled}
                />
                <FormField
                  label={"Total Comm"}
                  color={"grey"}
                  value={totalComm}
                  name={"totalComm"}
                  type={"currency"}
                  currency={"USD"}
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
