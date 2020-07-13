import { Leg } from "components/MiddleOffice/interfaces/leg";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import React, {
  ReactElement,
  useEffect,
  useState,
  useCallback,
  CSSProperties,
} from "react";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { Grid } from "@material-ui/core";
import { randomID } from "randomID";
import moStore from "mobx/stores/moStore";
import { observer } from "mobx-react";
import { ProgressView } from "components/progressView";
import signalRManager from "signalR/signalRManager";
import {
  PricingResult,
  buildPricingResult,
} from "components/MiddleOffice/interfaces/pricingResult";
import { ModalWindow } from "components/ModalWindow";
import { API, Task } from "API";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import dealsStore from "mobx/stores/dealsStore";
import { QuestionBox } from "components/QuestionBox";
import { MessageBox } from "components/MessageBox";
import strings from "locales";
import { EntryType } from "structures/dealEntry";

interface Props {
  visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const [deStore] = useState<DealEntryStore>(new DealEntryStore());
    const [
      summaryContainer,
      setSummaryContainer,
    ] = useState<HTMLDivElement | null>(null);
    const [summaryStyle, setSummaryStyle] = useState<
      CSSProperties | undefined
    >();
    const [removeQuestionModalOpen, setRemoveQuestionModalOpen] = useState<
      boolean
    >(false);
    const classes: string[] = ["middle-office"];
    const { deal, error } = moStore;
    const [pricingResult, setPricingResult] = useState<PricingResult | null>(
      null
    );
    useEffect(() => {
      if (pricingResult === null) return;
      moStore.setLegs(pricingResult.legs, {
        ...moStore.summaryLeg,
        ...pricingResult.summary,
      } as SummaryLeg);
    }, [pricingResult]);
    useEffect(() => {
      return signalRManager.addDealDeletedListener((dealId: string) => {
        dealsStore.removeDeal(dealId);
        moStore.setDeal(null, deStore);
      });
    }, [deStore]);
    const renderError = (): ReactElement | null => {
      if (error === null) return null;
      return (
        <MessageBox
          title={strings.ErrorModalTitle}
          message={() => {
            return (
              <div className={"pricer-error"}>
                <p className={"message"}>{error.message}</p>
                <p className={"tag"}>
                  error code: {error.status} ({error.error})
                </p>
              </div>
            );
          }}
          icon={"exclamation-triangle"}
          buttons={() => {
            return (
              <>
                <button
                  className={"cancel"}
                  onClick={() => moStore.setError(null)}
                >
                  {strings.Close}
                </button>
              </>
            );
          }}
          color={"bad"}
        />
      );
    };
    useEffect(() => {
      moStore.loadReferenceData().then(() => {});
    }, []);
    useEffect(() => {
      setPricingResult(null);
    }, [deal]);
    const updatePricingData = useCallback(
      (data: any) => {
        setSummaryStyle(undefined);
        if (deal === null) return;
        // If this is not the deal we're showing, it's too late and we must skip it
        if (data.id !== deal.dealID) return;
        const pricingResult: PricingResult = buildPricingResult(data);
        setPricingResult(pricingResult);
      },
      [deal]
    );
    useEffect(() => {
      if (deal === null) return;
      const content: string | null = localStorage.getItem(deal.dealID);
      if (content !== null) {
        const localLegs: {
          legs: Leg[];
          summary: SummaryLeg;
        } = JSON.parse(content);
        moStore.setLegs(localLegs.legs, localLegs.summary);
      } else {
        const task: Task<any> = API.getLegs(deal.dealID);
        task
          .execute()
          .then((response: any) => {
            if (response !== null) {
              updatePricingData(response);
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
      }
    }, [deal, updatePricingData]);
    if (!props.visible) classes.push("hidden");
    if (!moStore.isInitialized) {
      return (
        <ProgressView
          title={"Loading: Middle Office"}
          message={"Please wait, we are loading some data"}
          value={moStore.loadingReferenceDataProgress}
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
      const getActionButton = (): ReactElement | null => {
        switch (deStore.entryType) {
          case EntryType.Empty:
            return (
              <button
                className={"primary"}
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
                  onClick={() => moStore.setEditMode(false)}
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
                  onClick={() => deStore.addNewDeal()}
                >
                  <i className={"fa fa-plus"} />
                  <span>New</span>
                </button>
                <button
                  className={"primary"}
                  onClick={() => moStore.setEditMode(true)}
                >
                  <i className={"fa fa-edit"} />
                  <span>Edit</span>
                </button>
                <button
                  className={"primary"}
                  onClick={() => deStore.cloneDeal()}
                >
                  <i className={"fa fa-clone"} />
                  <span>Clone</span>
                </button>
                <button className={"danger"} onClick={removeDeal}>
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
                onClick={() => deStore.cancelAddOrClone()}
              >
                <i className={"fa fa-times"} />
                <span>Cancel</span>
              </button>
            );
        }
      };

      const toggleSummary = () => {
        if (summaryContainer === null) return;
        if (summaryStyle !== undefined) {
          setSummaryStyle(undefined);
        } else {
          const parent: HTMLDivElement = summaryContainer.parentNode as HTMLDivElement;
          if (parent === null) return;
          const boundingRect: DOMRect = summaryContainer.getBoundingClientRect();
          const top: number = boundingRect.bottom - parent.offsetHeight;
          setSummaryStyle({
            transform: `translateY(-${top}px)`,
            boxShadow: "0 -4px 8px -8px black",
          });
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
                    <div className={"actions"}>{getActionButton()}</div>
                  </div>
                  <DealEntryForm store={deStore} />
                </div>
                <div
                  className={"form-group"}
                  ref={setSummaryContainer}
                  style={summaryStyle}
                >
                  <div className={"heading"}>
                    <h1>Summary Leg Details</h1>
                    <div className={"actions"}>
                      <button
                        className={"no-label"}
                        onClick={() => toggleSummary()}
                      >
                        {summaryStyle ? (
                          <i className={"fa fa-angle-double-down"} />
                        ) : (
                          <i className={"fa fa-angle-double-up"} />
                        )}
                      </button>
                    </div>
                  </div>
                  <SummaryLegDetailsForm />
                </div>
              </Grid>
              <Grid xs={5} className={"container"} item>
                <LegDetailsForm dealEntryStore={deStore} />
              </Grid>
            </Grid>
          </div>
          <ModalWindow visible={error !== null} render={renderError} />
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
          <div
            className={[
              "spinner ",
              moStore.isSendingPricingRequest ? "visible" : "hidden",
            ].join(" ")}
          />
        </>
      );
    }
  }
);
