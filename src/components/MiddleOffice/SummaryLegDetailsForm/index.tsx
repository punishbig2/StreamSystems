import React, { ReactElement } from "react";
import { Grid } from "@material-ui/core";
import { FormField } from "components/field";
import middleOfficeStore from "mobx/stores/middleOfficeStore";
import { observer } from "mobx-react";

export const SummaryLegDetailsForm: React.FC<{}> = observer(
  (): ReactElement | null => {
    const data = middleOfficeStore.summaryLeg;
    if (data === null) {
      return (
        <div className={"empty-section"}>
          <div className={"text"}>There's no data yet!</div>
        </div>
      );
    }
    const { brokerage, dealOutput } = data;
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
                  value={data.spot}
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
                />
                <FormField
                  label={"Seller Comm"}
                  color={"grey"}
                  value={brokerage.sellerComm}
                  name={"sellerComm"}
                  type={"currency"}
                />
                <FormField
                  label={"Total Comm"}
                  color={"grey"}
                  value={totalComm}
                  name={"totalComm"}
                  type={"currency"}
                />
              </fieldset>
            </Grid>
            <Grid alignItems={"stretch"} container>
              <fieldset>
                <legend>Deal Output</legend>
                <FormField
                  label={"Price %"}
                  color={"grey"}
                  value={dealOutput.pricePercent}
                  name={"pricePercent"}
                  type={"number"}
                  precision={8}
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
                />
                <FormField
                  label={"Vega"}
                  color={"grey"}
                  value={dealOutput.vega}
                  name={"vega"}
                  type={"currency"}
                />
                <FormField
                  label={"Hedge"}
                  color={"grey"}
                  value={dealOutput.hedge}
                  name={"hedge"}
                  type={"currency"}
                />
              </fieldset>
            </Grid>
          </Grid>
          <div className={"button-box"}>
            <button type={"button"} className={"primary"}>Add Leg</button>
          </div>
        </form>
      </>
    );
  }
);
