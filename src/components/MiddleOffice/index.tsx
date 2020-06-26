import React, { ReactElement, useEffect, useState, useCallback } from "react";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { Grid } from "@material-ui/core";
import { randomID } from "randomID";
import store from "mobx/stores/middleOfficeStore";
import middleOfficeStore from "mobx/stores/middleOfficeStore";
import { observer } from "mobx-react";
import { ProgressView } from "components/progressView";
import signalRManager from "signalR/signalRManager";
import {
  PricingResult,
  buildPricingResult,
} from "components/MiddleOffice/interfaces/pricingResult";
import { ModalWindow } from "components/ModalWindow";
import { API } from "API";
import { Deal } from "components/MiddleOffice/interfaces/deal";

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
    const setLegs = useCallback((response: any) => {
      if (deal === null) return;
      const { data } = response;
      // If this is not the deal we're showing, it's too late
      if (data.id !== deal.dealID) return;
      const pricingResult: PricingResult = buildPricingResult(data, deal);
      setPricingResult(pricingResult);
    }, [deal]);
    useEffect(() => {
      if (deal === null) return;
      API.getLegs(deal.dealID).then((response: any) => {
        if (response !== null) {
          setLegs(response);
        }
      });
      return signalRManager.addPricingResponseListener((response: any) => {
        if (response.status === 200) {
          setLegs(response);
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
