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
import { PricingResult, ResultLeg } from "components/MiddleOffice/interfaces/pricingResult";
import { ModalWindow } from "components/ModalWindow";
import middleOfficeStore from "mobx/stores/middleOfficeStore";
import { Rates } from "components/MiddleOffice/interfaces/leg";
import { splitCurrencyPair } from "symbolUtils";

interface Props {
  visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const [error, setError] = useState<{
      message: string;
      error: string;
      status: number;
    } | null>(null);
    const classes: string[] = ["middle-office"];
    const { deal } = store;
    const [pricingResult, setPricingResult] = useState<PricingResult | null>(
      null
    );
    const renderError = (): ReactElement | null => {
      if (error === null) return null;
      return (
        <div className={"middle-office-error"}>
          <div className={"header"}>
            <div className={"fa fa-exclamation-triangle icon"} />
            <h3>Oops, an error happened</h3>
          </div>
          <p className={"message"}>{error.message}</p>
          <p className={"tag"}>
            error code: {error.status} ({error.error})
          </p>
          <div className={"button-box"}>
            <button type={"button"} onClick={() => setError(null)}>
              Close
            </button>
          </div>
        </div>
      );
    };
    useEffect(() => {
      store.loadReferenceData().then(() => {});
    }, []);
    useEffect(() => {
      setPricingResult(null);
    }, [deal]);
    useEffect(() => {
      if (deal === null) return;
      const { symbol } = deal;
      return signalRManager.addPricingResponseListener((response: any) => {
        if (response.status === 200) {
          const {
            Output: {
              Results: { Premium, Gamma, Vega, Forward_Delta, Legs },
              MarketSnap,
              Inputs: { strike, putVol, callVol, forward, spot },
            },
            id,
          } = response.data;
          if (id !== deal.dealID) return;
          const currencies: [string, string] = splitCurrencyPair(deal.currencyPair);
          const rates: Rates = [{
            currency: currencies[0],
            value: 100 * MarketSnap.ccy1Zero,
          }, {
            currency: currencies[1],
            value: 100 * MarketSnap.ccy2Zero,
          }];
          const legs = Legs.map((name: string, index: number): ResultLeg => {
            const option: string = name.split("|")[1];
            return {
              option: option,
              premium: Premium["CCY1"][index],
              pricePercent: Premium["%_CCY1"][index],
              strike: strike,
              vol: option.toLowerCase() === "put" ? putVol : callVol,
              delta: Forward_Delta["%_CCY1"][index],
              gamma: Gamma["CCY1"][index],
              vega: Vega["CCY1"][index],
              hedge: Forward_Delta.CCY1[index],
              fwdPts: 1000 * (forward - spot),
              fwdRate: forward,
              premiumCurrency: symbol.premiumCCY,
              rates: rates,
            };
          });
          setPricingResult({
            summary: legs[0],
            legs: legs.slice(1),
          });
          middleOfficeStore.setSpot(spot);
        } else {
          const { data } = response;
          setError(data);
        }
      });
    }, [deal]);
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
        <>
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
          <ModalWindow visible={error !== null} render={renderError} />
          <div
            className={[
              "spinner ",
              middleOfficeStore.isSendingPricingRequest ? "visible" : "hidden",
            ].join(" ")}
          >
            <h1>Loading</h1>
          </div>
        </>
      );
    }
  }
);
