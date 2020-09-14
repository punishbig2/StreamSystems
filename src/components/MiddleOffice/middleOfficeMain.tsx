import { Grid } from "@material-ui/core";
import { API } from "API";
import { ActionButtons } from "components/MiddleOffice/actionButtons";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { DeleteQuestion } from "components/MiddleOffice/deleteQuestion";
import { MiddleOfficeError } from "components/MiddleOffice/error";
import { useDealDeletedListener } from "components/MiddleOffice/hooks/useDealDeletedListener";
import { useErrorListener } from "components/MiddleOffice/hooks/useErrorListener";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { ProgressView } from "components/MiddleOffice/progressView";
import { SuccessMessage } from "components/MiddleOffice/successMessage";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { Deal } from "components/MiddleOffice/types/deal";
import { ModalWindow } from "components/ModalWindow";
import { observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import dealsStore from "mobx/stores/dealsStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { randomID } from "randomID";
import React, { ReactElement, useEffect, useState } from "react";
import signalRManager from "signalR/signalRManager";

interface Props {
  readonly visible: boolean;
}

export const MiddleOfficeMain: React.FC<Props> = observer(
  (props: Props): ReactElement => {
    const [deleteQuestionOpen, showDeleteQuestion] = useState<boolean>(false);
    const [entryStore] = useState<DealEntryStore>(new DealEntryStore());
    const classes: string[] = ["middle-office"];
    const { error } = moStore;
    const { entry } = entryStore;
    useDealDeletedListener(entryStore);
    useErrorListener(moStore.setError);
    useEffect(() => {
      signalRManager.addDealListener((deal: Deal) => {
        dealsStore.addDeal(deal);
      });
    }, []);
    if (!props.visible) classes.push("hidden");
    const dontDelete = () => {
      showDeleteQuestion(false);
    };
    const doDelete = (): void => {
      if (entry.dealID === undefined) {
        throw new Error(
          "cannot delete this entry, it has no id so it's new or data is bad"
        );
      } else {
        API.removeDeal(entry.dealID)
          .then(() => null)
          .catch((error: any) => {
            console.warn(error);
          })
          .finally(() => {
            showDeleteQuestion(false);
          });
      }
    };

    const removeDeal = () => {
      showDeleteQuestion(true);
    };

    const headingClasses: string[] = ["heading"];
    if (moStore.status !== MOStatus.Normal) headingClasses.push("disabled");
    return (
      <>
        <div className={classes.join(" ")}>
          <div className={"left-panel"}>
            <DealBlotter
              id={randomID("")}
              disabled={moStore.status !== MOStatus.Normal}
              deals={dealsStore.deals}
              selectedRow={moStore.selectedDealID}
              onDealSelected={(deal: Deal | null) =>
                moStore.setDeal(deal, entryStore)
              }
            />
          </div>
          <Grid className={"right-panel"} container>
            <Grid xs={7} item>
              <OverlayScrollbarsComponent className={"container"}>
                <div className={"form-group"}>
                  <div className={headingClasses.join(" ")}>
                    <h1>Deal Entry</h1>
                    <div className={"actions"}>
                      <ActionButtons
                        entryStore={entryStore}
                        onRemoveDeal={removeDeal}
                      />
                    </div>
                  </div>
                  <DealEntryForm store={entryStore} />
                </div>
                <div className={"form-group"}>
                  <div className={headingClasses.join(" ")}>
                    <h1>Summary Leg Details</h1>
                  </div>
                  <SummaryLegDetailsForm
                    dealEntryStore={entryStore}
                    summaryLeg={moStore.summaryLeg}
                  />
                </div>
              </OverlayScrollbarsComponent>
            </Grid>
            <Grid xs={5} item>
              <OverlayScrollbarsComponent className={"container"}>
                <LegDetailsForm
                  status={moStore.status}
                  entry={entryStore.entry}
                />
              </OverlayScrollbarsComponent>
            </Grid>
          </Grid>
        </div>
        {/* Modal windows */}
        <ModalWindow
          isOpen={error !== null}
          render={() => <MiddleOfficeError error={error} />}
        />
        <ModalWindow
          isOpen={moStore.successMessage !== null}
          render={() => <SuccessMessage />}
        />
        <ModalWindow
          isOpen={deleteQuestionOpen}
          render={() => <DeleteQuestion onNo={dontDelete} onYes={doDelete} />}
        />
        <ModalWindow
          isOpen={moStore.status !== MOStatus.Normal}
          render={() => <ProgressView />}
        />
      </>
    );
  }
);
