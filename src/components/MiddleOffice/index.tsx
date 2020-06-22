import React, { ReactElement, useEffect, useState } from "react";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { Grid } from "@material-ui/core";
import { randomID } from "randomID";
import store from "mobx/stores/middleOfficeStore";
import { observer } from "mobx-react";
import { ProgressView } from "components/progressView";
import signalRManager from "signalR/signalRManager";
import { PricingResult } from "components/MiddleOffice/interfaces/pricingResult";

interface Props {
  visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const classes: string[] = ["middle-office"];
    const { deal } = store;
    const [pricingResult, setPricingResult] = useState<PricingResult | null>(
      null
    );
    useEffect(() => {
      store.loadReferenceData();
    }, []);
    useEffect(() => {
      setPricingResult(null);
    }, [deal]);
    useEffect(() => {
      return signalRManager.addPricingResponseListener((response: any) => {
        console.log(response);
        const {
          Output: {
            Results: { Premium, Gamma, Vega, Forward_Delta },
            Inputs: { strike, putVol, callVol },
          },
        } = response;
        setPricingResult({
          premiumAMT: Premium.CCY1[0],
          pricePercent: Premium["%_CCY1"][0],
          delta: Forward_Delta["%_CCY1"][0],
          gamma: Gamma["%_CCY1"][0],
          vega: Vega["%_CCY1"][0],
          hedge: Forward_Delta.CCY1[0],
          legs: Premium.CCY1.slice(1).map((cc1: number, index: number) => ({
            premium: cc1,
            pricePercent: Premium["%_CCY1"][index],
            strike: strike,
            vol: index % 2 !== 0 ? putVol : callVol,
            delta: Forward_Delta["%_CCY1"][index],
            gamma: Gamma["%_CCY1"][index],
            vega: Vega["%_CCY1"][index],
            hedge: Forward_Delta.CCY1[index],
          })),
        });
      });
    });
    if (!props.visible) classes.push("hidden");
    if (!store.isInitialized) {
      return (
        <ProgressView
          title={"Loading: Middle Office"}
          message={"Please wait, we are loading some data"}
          value={store.loadingReferenceDataProgress}
        />
      );
    } else {
      return (
        <div className={classes.join(" ")}>
          <div className={"left-panel"}>
            <DealBlotter id={randomID("")} />
          </div>
          <Grid className={"right-panel"} container>
            <Grid xs={7} className={"container"} item>
              <div className={"form-group"}>
                <h1>Deal Entry</h1>
                <DealEntryForm />
              </div>
              <div className={"form-group"}>
                <h1>Summary Leg Details</h1>
                <SummaryLegDetailsForm pricingResult={pricingResult} />
              </div>
            </Grid>
            <Grid xs={5} className={"container"} item>
              <LegDetailsForm pricingResult={pricingResult} />
            </Grid>
          </Grid>
        </div>
      );
    }
  }
);
