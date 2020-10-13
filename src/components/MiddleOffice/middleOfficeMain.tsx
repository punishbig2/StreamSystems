import { Grid } from "@material-ui/core";
import { API } from "API";
import { ActionButtons } from "components/MiddleOffice/actionButtons";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { DeleteQuestion } from "components/MiddleOffice/deleteQuestion";
import { MiddleOfficeError } from "components/MiddleOffice/error";
import { useDealDeletedListener } from "components/MiddleOffice/hooks/useDealDeletedListener";
import { useErrorListener } from "components/MiddleOffice/hooks/useErrorListener";
import { useNewDealListener } from "components/MiddleOffice/hooks/useNewDealListener";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { ProgressView } from "components/MiddleOffice/progressView";
import { SuccessMessage } from "components/MiddleOffice/successMessage";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { Deal } from "components/MiddleOffice/types/deal";
import { Leg } from "components/MiddleOffice/types/leg";
import { ModalWindow } from "components/ModalWindow";
import { observer } from "mobx-react";
import store, { MoStatus } from "mobx/stores/moStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { randomID } from "randomID";
import React, { ReactElement, useState } from "react";
import { DealEntry } from "structures/dealEntry";

interface Props {
  readonly visible: boolean;
}

export const MiddleOfficeMain: React.FC<Props> = observer(
  (props: Props): ReactElement => {
    const [deleteQuestionOpen, showDeleteQuestion] = useState<boolean>(false);
    const classes: string[] = ["middle-office"];
    const { error } = store;
    const { entry } = store;
    // Deal event handlers
    useNewDealListener((deal: Deal) => {
      // noinspection JSIgnoredPromiseFromCall
      store.addDeal(deal);
    });
    useDealDeletedListener((id: string): void => {
      // noinspection JSIgnoredPromiseFromCall
      store.removeDeal(id);
    });
    useErrorListener((error: any): void => store.setError(error));
    // If it's hidden ... wait, what?
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

    const onUpdateLeg = (index: number, key: keyof Leg, value: any): void => {
      store.updateLeg(index, key, value);
    };

    const onDealSelected = (deal: Deal | null) => {
      store.setDeal(deal);
    };

    const headingClasses: string[] = ["heading"];
    if (store.status !== MoStatus.Normal) headingClasses.push("disabled");
    return (
      <>
        <div className={classes.join(" ")}>
          <div className={"left-panel"}>
            <DealBlotter
              id={randomID("")}
              disabled={store.status !== MoStatus.Normal}
              selectedRow={store.selectedDealID}
              deals={store.deals}
              onDealSelected={onDealSelected}
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
                        isEditMode={store.isEditMode}
                        disabled={
                          store.isLoadingLegs ||
                          store.status !== MoStatus.Normal
                        }
                        editable={store.isDealEditable}
                        entryType={store.entryType}
                        onRemoveDeal={removeDeal}
                        onAddNewDeal={() => store.addNewDeal()}
                        onCloneDeal={() => store.cloneDeal()}
                        onCancelAddOrClone={() => store.cancelAddOrClone()}
                        onEdit={() => store.setEditMode(true)}
                      />
                    </div>
                  </div>
                  <DealEntryForm
                    status={store.status}
                    cuts={store.cuts}
                    entryType={store.entryType}
                    entry={store.entry}
                    isEditMode={store.isEditMode}
                    isModified={store.isModified}
                    isReadyForSubmission={store.isReadyForSubmission}
                    onPriced={() => {
                      store.price();
                    }}
                    onUpdateEntry={(partial: Partial<DealEntry>) =>
                      store.updateEntry(partial)
                    }
                    onSetWorking={(field: keyof DealEntry | null) =>
                      store.setWorking(field)
                    }
                    onCreateOrClone={() => store.createOrClone()}
                    onSaveCurrentEntry={() => store.saveCurrentEntry()}
                    onSubmit={() => store.submit()}
                  />
                </div>
                <div className={"form-group"}>
                  <div className={headingClasses.join(" ")}>
                    <h1>Summary Leg Details</h1>
                  </div>
                  <SummaryLegDetailsForm
                    summaryLeg={store.summaryLeg}
                    isEditMode={store.isEditMode}
                    isLoading={store.isLoadingLegs}
                    dealEntry={store.entry}
                  />
                </div>
              </OverlayScrollbarsComponent>
            </Grid>
            <Grid xs={5} item>
              <OverlayScrollbarsComponent className={"container"}>
                <LegDetailsForm
                  status={store.status}
                  legs={store.legs}
                  isEditMode={store.isEditMode}
                  isLoading={store.isLoadingLegs}
                  entry={store.entry}
                  onUpdateLeg={onUpdateLeg}
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
          isOpen={store.successMessage !== null}
          render={() => <SuccessMessage />}
        />
        <ModalWindow
          isOpen={deleteQuestionOpen}
          render={() => <DeleteQuestion onNo={dontDelete} onYes={doDelete} />}
        />
        <ModalWindow
          isOpen={store.status !== MoStatus.Normal}
          render={() => <ProgressView />}
        />
      </>
    );
  }
);
