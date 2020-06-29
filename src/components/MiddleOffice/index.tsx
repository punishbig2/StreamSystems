import React, { ReactElement, useEffect, useState, useCallback } from "react";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { Grid } from "@material-ui/core";
import { randomID } from "randomID";
import store from "mobx/stores/moStore";
import MO from "mobx/stores/moStore";
import { observer } from "mobx-react";
import { ProgressView } from "components/progressView";
import signalRManager from "signalR/signalRManager";
import {
  PricingResult,
  buildPricingResult,
} from "components/MiddleOffice/interfaces/pricingResult";
import { ModalWindow } from "components/ModalWindow";
import { API, Task } from "API";
import { OptionsButton, MenuItemSpec } from "components/OptionsButton";
import { DealEntryStore, EntryType } from "mobx/stores/dealEntryStore";
import moStore from "mobx/stores/moStore";
import { Deal } from "components/MiddleOffice/interfaces/deal";

interface Props {
  visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const [deStore] = useState<DealEntryStore>(new DealEntryStore());
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
    const setLegs = useCallback(
      (response: any) => {
        if (deal === null) return;
        const { data } = response;
        // If this is not the deal we're showing, it's too late
        if (data.id !== deal.dealID) return;
        const pricingResult: PricingResult = buildPricingResult(data, deal);
        setPricingResult(pricingResult);
      },
      [deal]
    );
    useEffect(() => {
      if (deal === null) return;
      const task: Task<any> = API.getLegs(deal.dealID);
      task
        .execute()
        .then((response: any) => {
          if (response !== null) {
            setLegs(response);
          }
        })
        .catch((reason: any) => {
          if (reason === "aborted") {
            return;
          } else {
            console.warn(reason);
          }
        });
      const removePricingListener: () => void = signalRManager.addPricingResponseListener(
        (response: any) => {
          if (response.status === 200) {
            setLegs(response);
          } else {
            const { data } = response;
            setError(data);
          }
        }
      );
      return () => {
        removePricingListener();
        task.cancel();
      };
    }, [deal, setLegs]);
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
      const menuItems: MenuItemSpec[] = [
        {
          label: "Clone",
          action: () => null,
        },
        {
          label: "Remove",
          action: () => null,
        },
      ];
      const addNewDeal = () => {
        deStore.addNewDeal();
      };
      const getActionButton = (): ReactElement => {
        if (deStore.entryType === EntryType.Empty) {
          return (
            <button className={"primary"} onClick={addNewDeal}>
              <i className={"fa fa-plus"} />
              <span>New</span>
            </button>
          );
        } else {
          return (
            <button
              className={"danger"}
              onClick={() => moStore.setDeal(null, deStore)}
            >
              <i className={"fa fa-times-circle"} />
              <span>Close</span>
            </button>
          );
        }
      };
      return (
        <>
          <div className={classes.join(" ")}>
            <div className={"left-panel"}>
              <DealBlotter
                id={randomID("")}
                onDealSelected={(deal: Deal | null) =>
                  moStore.setDeal(deal, deStore)
                }
              />
            </div>
            <Grid className={"right-panel"} container>
              <Grid xs={7} className={"container"} item>
                <div className={"form-group"}>
                  <div className={"heading"}>
                    <h1>Deal Entry</h1>
                    <div className={"actions"}>
                      {getActionButton()}
                      <OptionsButton
                        items={menuItems}
                        disabled={deal === null}
                      />
                    </div>
                  </div>
                  <DealEntryForm store={deStore} />
                </div>
                <div className={"form-group"}>
                  <div className={"heading"}>
                    <h1>Summary Leg Details</h1>
                  </div>
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
              MO.isSendingPricingRequest ? "visible" : "hidden",
            ].join(" ")}
          >
            <h1>Loading</h1>
          </div>
        </>
      );
    }
  }
);
