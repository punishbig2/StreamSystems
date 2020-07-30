import { Grid } from "@material-ui/core";
import { API, Task } from "API";
import { MessageBox } from "components/MessageBox";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { Error } from "components/MiddleOffice/error";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import {
  buildPricingResult,
  PricingResult,
} from "components/MiddleOffice/interfaces/pricingResult";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { ModalWindow } from "components/ModalWindow";
import { ProgressModalContent } from "components/ProgressModalContent";
import { ProgressView } from "components/progressView";
import { QuestionBox } from "components/QuestionBox";
import { parseManualLegs } from "legsUtils";
import { observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import dealsStore from "mobx/stores/dealsStore";
import moStore, { messages, MOStatus } from "mobx/stores/moStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { randomID } from "randomID";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import signalRManager from "signalR/signalRManager";
import { EntryType } from "structures/dealEntry";

interface Props {
  visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const [deStore] = useState<DealEntryStore>(new DealEntryStore());
    const [removeQuestionModalOpen, setRemoveQuestionModalOpen] = useState<
      boolean
    >(false);
    const classes: string[] = ["middle-office"];
    const { deal, error } = moStore;
    const setPricingResult = (pricingResult: PricingResult | null): void => {
      if (pricingResult === null) return;
      moStore.setLegs(pricingResult.legs, {
        ...moStore.summaryLeg,
        ...pricingResult.summary,
      } as SummaryLeg);
    };
    useEffect(() => {
      return signalRManager.addDealDeletedListener((dealId: string) => {
        dealsStore.removeDeal(dealId);
        moStore.setDeal(null, deStore);
      });
    }, [deStore]);
    useEffect(() => {
      moStore.loadReferenceData().then(() => {});
    }, []);
    useEffect(() => {
      setPricingResult(null);
    }, [deal]);
    const updatePricingData = useCallback(
      (data: any) => {
        if (deal === null) return;
        // If this is not the deal we're showing, it's too late and we must skip it
        if (data.id !== deal.dealID) return;
        const pricingResult: PricingResult = buildPricingResult(data);
        // Update pricing results to update everything
        setPricingResult(pricingResult);
        // In case we're pricing
        if (moStore.status === MOStatus.Pricing) {
          moStore.setStatus(MOStatus.Normal);
        }
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
            if ("dealId" in response) {
              moStore.setLegs(parseManualLegs(response.legs), null);
            } else {
              if ("error_msg" in response) {
                moStore.setError({
                  status: "Server error",
                  error: "Unexpected Error",
                  message: response.error_msg,
                  code: 500,
                });
              } else {
                updatePricingData(response);
              }
            }
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
          updatePricingData(response);
        }
      );
      return () => {
        removePricingListener();
        task.cancel();
      };
    }, [deal, updatePricingData]);
    if (!props.visible) classes.push("hidden");
    if (!moStore.isInitialized) {
      return (
        <ProgressView
          title={"Loading: Middle Office"}
          message={"Please wait, we are loading some data"}
          value={moStore.progress}
        />
      );
    } else {
      const doRemoveDeal = () => {
        if (deal === null) return;
        API.removeDeal(deal.dealID)
          .then(() => null)
          .catch((error: any) => {
            console.warn(error);
          })
          .finally(() => {
            setRemoveQuestionModalOpen(false);
          });
      };
      const removeDeal = () => {
        setRemoveQuestionModalOpen(true);
      };
      const getActionButtons = (): ReactElement | null => {
        switch (deStore.entryType) {
          case EntryType.Empty:
            return (
              <button
                className={"primary"}
                disabled={moStore.status !== MOStatus.Normal}
                onClick={() => deStore.addNewDeal()}
              >
                <i className={"fa fa-plus"} />
                <span>New</span>
              </button>
            );
          case EntryType.ExistingDeal:
            if (moStore.isEditMode) {
              return (
                <button
                  className={"primary"}
                  disabled={moStore.status !== MOStatus.Normal}
                  onClick={deStore.cancelAddOrClone}
                >
                  <i className={"fa fa-times"} />
                  <span>Cancel</span>
                </button>
              );
            }
            return (
              <>
                <button
                  className={"primary"}
                  disabled={moStore.status !== MOStatus.Normal}
                  onClick={() => deStore.addNewDeal()}
                >
                  <i className={"fa fa-plus"} />
                  <span>New</span>
                </button>
                <button
                  className={"primary"}
                  disabled={moStore.status !== MOStatus.Normal}
                  onClick={() => moStore.setEditMode(true)}
                >
                  <i className={"fa fa-edit"} />
                  <span>Edit</span>
                </button>
                <button
                  className={"primary"}
                  disabled={moStore.status !== MOStatus.Normal}
                  onClick={() => deStore.cloneDeal()}
                >
                  <i className={"fa fa-clone"} />
                  <span>Clone</span>
                </button>
                <button
                  className={"danger"}
                  disabled={moStore.status !== MOStatus.Normal}
                  onClick={removeDeal}
                >
                  <i className={"fa fa-trash"} />
                  <span>Remove</span>
                </button>
              </>
            );
          case EntryType.Clone:
          case EntryType.New:
            return (
              <button
                className={"primary"}
                disabled={moStore.status !== MOStatus.Normal}
                onClick={() => deStore.cancelAddOrClone()}
              >
                <i className={"fa fa-times"} />
                <span>Cancel</span>
              </button>
            );
        }
      };

      const headingClasses: string[] = ["heading"];
      if (moStore.status !== MOStatus.Normal) headingClasses.push("disabled");
      return (
        <>
          <div className={classes.join(" ")}>
            <div className={"left-panel"}>
              <DealBlotter
                id={randomID("")}
                onDealSelected={(deal: Deal | null) =>
                  moStore.setDeal(deal, deStore)
                }
                disabled={moStore.status !== MOStatus.Normal}
              />
            </div>
            <Grid className={"right-panel"} container>
              <Grid xs={7} item>
                <OverlayScrollbarsComponent className={"container"}>
                  <div className={"form-group"}>
                    <div className={headingClasses.join(" ")}>
                      <h1>Deal Entry</h1>
                      <div className={"actions"}>{getActionButtons()}</div>
                    </div>
                    <DealEntryForm store={deStore} />
                  </div>
                  <div className={"form-group"}>
                    <div className={headingClasses.join(" ")}>
                      <h1>Summary Leg Details</h1>
                    </div>
                    <SummaryLegDetailsForm />
                  </div>
                </OverlayScrollbarsComponent>
              </Grid>
              <Grid xs={5} item>
                <OverlayScrollbarsComponent className={"container"}>
                  <LegDetailsForm
                    status={moStore.status}
                    dealEntryStore={deStore}
                  />
                </OverlayScrollbarsComponent>
              </Grid>
            </Grid>
          </div>
          <ModalWindow
            visible={error !== null}
            render={() => <Error error={error} />}
          />
          <ModalWindow
            visible={moStore.successMessage !== null}
            render={(): ReactElement | null => {
              if (moStore.successMessage === null) return null;
              const { title, text } = moStore.successMessage;
              return (
                <MessageBox
                  title={title}
                  message={text}
                  icon={"check-circle"}
                  buttons={() => (
                    <button onClick={() => moStore.setSuccessMessage(null)}>
                      Close
                    </button>
                  )}
                  color={"good"}
                />
              );
            }}
          />
          <ModalWindow
            visible={removeQuestionModalOpen}
            render={(): ReactElement => {
              return (
                <QuestionBox
                  title={"Delete Deal"}
                  content={
                    "Are you sure you want to remove this deal? This is irreversible"
                  }
                  onNo={() => setRemoveQuestionModalOpen(false)}
                  onYes={doRemoveDeal}
                />
              );
            }}
          />
          <ModalWindow
            visible={moStore.status !== MOStatus.Normal}
            render={(): ReactElement | null => {
              if (moStore.status === MOStatus.Normal) return null;
              const message: string = messages[moStore.status];
              return (
                <ProgressModalContent
                  maximum={-1}
                  progress={0}
                  message={message}
                  startTime={Date.now()}
                />
              );
            }}
          />
        </>
      );
    }
  }
);
