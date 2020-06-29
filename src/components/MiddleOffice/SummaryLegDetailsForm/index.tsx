import React, { ReactElement } from "react";
import { Grid } from "@material-ui/core";
import { FormField } from "components/formField";
import MO from "mobx/stores/moStore";
import { observer } from "mobx-react";
import { NoDataMessage } from "components/noDataMessage";
import { PricingResult } from "components/MiddleOffice/interfaces/pricingResult";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";

interface Props {
  pricingResult: PricingResult | null;
}

export const SummaryLegDetailsForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { pricingResult } = props;
    const data = MO.summaryLeg;
    if (data === null) {
      return <NoDataMessage />;
    }
    const { brokerage } = data;
    const { dealOutput }: SummaryLeg = !!pricingResult
      ? pricingResult.summary as SummaryLeg
      : data;
    const { spot } = !!pricingResult ? pricingResult.summary : data;
    const totalComm: number | null =
      brokerage.buyerComm !== null && brokerage.sellerComm !== null
        ? brokerage.buyerComm + brokerage.sellerComm
        : null;
    return (
      <>
        <form>
          <Grid container>
            <Grid alignItems={"stretch"} container item>
              <fieldset>
                <FormField
                  label={"Strategy"}
                  color={"grey"}
                  value={data.strategy}
                  name={"strategy"}
                  type={"text"}
                />
                <FormField
                  label={"Trade Date"}
                  color={"grey"}
                  value={data.tradeDate}
                  name={"tradeDate"}
                  type={"date"}
                />
                <FormField
                  label={"Spot Date"}
                  color={"grey"}
                  value={data.spotDate}
                  name={"spotDate"}
                  type={"date"}
                />
                <FormField
                  label={"Spot"}
                  color={"grey"}
                  value={spot}
                  name={"spot"}
                  type={"number"}
                  precision={4}
                />
                <FormField
                  label={"Cut City"}
                  color={"grey"}
                  value={data.cutCity}
                  name={"cutCity"}
                  type={"text"}
                />
                <FormField
                  label={"Cut Time"}
                  color={"grey"}
                  value={data.cutTime}
                  name={"cutTime"}
                  type={"text"}
                />
                <FormField
                  label={"Source"}
                  color={"grey"}
                  value={data.source}
                  name={"source"}
                  type={"text"}
                />
                <FormField
                  label={"Delivery"}
                  color={"grey"}
                  value={data.delivery}
                  name={"delivery"}
                  type={"text"}
                />
                <FormField
                  label={"USI#"}
                  color={"grey"}
                  value={data.usi}
                  name={"usi"}
                  type={"number"}
                />
              </fieldset>
            </Grid>
            <Grid alignItems={"stretch"} container>
              <fieldset>
                <legend>Brokerage</legend>
                <FormField
                  label={"Buyer Comm"}
                  color={"grey"}
                  value={brokerage.buyerComm}
                  name={"buyerComm"}
                  type={"currency"}
                  currency={"USD"}
                />
                <FormField
                  label={"Seller Comm"}
                  color={"grey"}
                  value={brokerage.sellerComm}
                  name={"sellerComm"}
                  type={"currency"}
                  currency={"USD"}
                />
                <FormField
                  label={"Total Comm"}
                  color={"grey"}
                  value={totalComm}
                  name={"totalComm"}
                  type={"currency"}
                  currency={"USD"}
                />
              </fieldset>
            </Grid>
            <Grid alignItems={"stretch"} container>
              <fieldset>
                <legend>Deal Output</legend>
                <FormField
                  label={"Net Premium"}
                  color={"grey"}
                  value={dealOutput.premium}
                  name={"netPremium"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                />
                <FormField
                  label={"Price %"}
                  color={"grey"}
                  value={dealOutput.pricePercent}
                  name={"pricePercent"}
                  type={"number"}
                  precision={4}
                />
                <FormField
                  label={"Delta"}
                  color={"grey"}
                  value={dealOutput.delta}
                  name={"delta"}
                  type={"number"}
                  precision={8}
                />
                <FormField
                  label={"Gamma"}
                  color={"grey"}
                  value={dealOutput.gamma}
                  name={"gamma"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                />
                <FormField
                  label={"Net Vega"}
                  color={"grey"}
                  value={dealOutput.vega}
                  name={"vega"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                />
                <FormField
                  label={"Net Hedge"}
                  color={"grey"}
                  value={dealOutput.hedge}
                  name={"hedge"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
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
