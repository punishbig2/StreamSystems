import { Grid } from "@material-ui/core";
import { API } from "API";
import { ActionButtons } from "components/MiddleOffice/actionButtons";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { DeleteQuestion } from "components/MiddleOffice/deleteQuestion";
import { MiddleOfficeError } from "components/MiddleOffice/error";
import { useDealDeletedListener } from "components/MiddleOffice/hooks/useDealDeletedListener";
import { useDealEditListener } from "components/MiddleOffice/hooks/useDealEditListener";
import { useErrorListener } from "components/MiddleOffice/hooks/useErrorListener";
import { useNewDealListener } from "components/MiddleOffice/hooks/useNewDealListener";
import { useSEFListener } from "components/MiddleOffice/hooks/useSEFListener";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { ProgressView } from "components/MiddleOffice/progressView";
import { SuccessMessage } from "components/MiddleOffice/successMessage";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { Cut } from "components/MiddleOffice/types/cut";
import { Deal } from "components/MiddleOffice/types/deal";
import { Leg } from "components/MiddleOffice/types/leg";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { ModalWindow } from "components/ModalWindow";
import {
  MoGenericMessage,
  MiddleOfficeProcessingState,
} from "mobx/stores/middleOfficeStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import React, { ReactElement, useEffect, useState } from "react";
import { DealEditStatus } from "signalR/signalRManager";
import { DealEntry, EntryType } from "types/dealEntry";
import { MOErrorMessage } from "types/middleOfficeError";
import { SEFUpdate } from "types/sefUpdate";
import { randomID } from "utils/randomID";

interface Props {
  readonly visible: boolean;
  readonly error: MOErrorMessage | null;
  readonly entry: DealEntry;
  readonly removeDeal: (id: string) => Promise<void>;
  readonly addDeal: (deal: { [key: string]: any }) => Promise<void>;
  readonly setDeal: (deal: Deal | null) => void;
  readonly setError: (error: MOErrorMessage) => void;
  readonly updateLeg: (
    index: number,
    key: keyof Leg,
    value: any
  ) => Promise<void>;
  readonly status: MiddleOfficeProcessingState;
  readonly deals: ReadonlyArray<Deal>;
  readonly selectedDealID: string | null;
  readonly isEditMode: boolean;
  readonly isWorking: boolean;
  readonly isLoadingLegs: boolean;
  readonly entryType: EntryType;
  readonly addNewDeal: () => void;
  readonly cloneDeal: () => void;
  readonly cancelAddOrClone: () => void;
  readonly setEditMode: (editMode: boolean) => void;
  readonly legs: ReadonlyArray<Leg>;
  readonly summaryLeg: SummaryLeg | null;
  readonly isModified: boolean;
  readonly isDealEditable: boolean;
  readonly cuts: ReadonlyArray<Cut>;
  readonly isReadyForSubmission: boolean;
  readonly updateEntry: (partial: Partial<DealEntry>) => Promise<void>;
  readonly price: () => void;
  readonly createOrClone: () => void;
  readonly setWorking: (working: boolean) => void;
  readonly saveCurrentEntry: () => void;
  readonly submit: () => void;
  readonly successMessage: MoGenericMessage | null;
  readonly updateSEFStatus: (update: SEFUpdate) => Promise<void>;
  readonly updateSummaryLeg: (
    fieldName: keyof SummaryLeg,
    value: any
  ) => Promise<void>;
  readonly editDeal: (status: DealEditStatus, id: string) => void;
}

export const MiddleOfficeMain: React.FC<Props> = (
  props: Props
): ReactElement => {
  const [deleteQuestionOpen, showDeleteQuestion] = useState<boolean>(false);
  const classes: string[] = ["middle-office"];
  const { error } = props;
  const { entry } = props;

  // Deal event handlers
  useNewDealListener((deal: { [key: string]: any }) => {
    // noinspection JSIgnoredPromiseFromCall
    props.addDeal(deal);
  });

  useDealDeletedListener((id: string): void => {
    // noinspection JSIgnoredPromiseFromCall
    props.removeDeal(id);
  });

  useDealEditListener((status: DealEditStatus, id: string): void => {
    props.editDeal(status, id);
  });

  useSEFListener((sefUpdate: SEFUpdate): void => {
    void props.updateSEFStatus(sefUpdate);
  });

  useErrorListener((error: any): void => props.setError(error));
  // If it's hidden ... wait, what?
  if (!props.visible) classes.push("hidden");

  const dontDelete = () => {
    showDeleteQuestion(false);
  };

  const doDelete = (): void => {
    showDeleteQuestion(false);
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
        .finally(() => {});
    }
  };

  const removeDeal = () => {
    showDeleteQuestion(true);
  };

  const onUpdateLeg = (
    index: number,
    key: keyof Leg,
    value: any
  ): Promise<void> => {
    return props.updateLeg(index, key, value);
  };

  const onDealSelected = (deal: Deal | null) => {
    props.setDeal(deal);
  };

  const headingClasses: string[] = ["heading"];
  if (props.status !== MiddleOfficeProcessingState.Normal)
    headingClasses.push("disabled");
  const disabled: boolean =
    props.isLoadingLegs || props.status !== MiddleOfficeProcessingState.Normal;
  return (
    <>
      <div className={classes.join(" ")}>
        <div className={"left-panel"}>
          <DealBlotter
            id={randomID("")}
            disabled={props.status !== MiddleOfficeProcessingState.Normal}
            selectedRow={props.selectedDealID}
            deals={props.deals}
            onDealSelected={onDealSelected}
          />
        </div>
        <Grid className={"right-panel"} container>
          <Grid xs={7} item>
            <OverlayScrollbarsComponent className={"container"}>
              <div className={"form-group-container"}>
                <div className={"form-group"}>
                  <div className={headingClasses.join(" ")}>
                    <h1>Deal Entry</h1>
                    <div className={"actions"}>
                      <ActionButtons
                        isEditMode={props.isEditMode}
                        disabled={disabled}
                        entryType={props.entryType}
                        editable={props.isDealEditable}
                        onRemoveDeal={removeDeal}
                        onAddNewDeal={() => props.addNewDeal()}
                        onCloneDeal={() => props.cloneDeal()}
                        onCancelAddOrClone={() => props.cancelAddOrClone()}
                        onEdit={() => props.setEditMode(true)}
                      />
                    </div>
                  </div>
                  <DealEntryForm
                    cuts={props.cuts}
                    entryType={props.entryType}
                    entry={props.entry}
                    disabled={disabled}
                    isEditMode={props.isEditMode}
                    isModified={props.isModified}
                    isReadyForSubmission={props.isReadyForSubmission}
                    onPriced={props.price}
                    onUpdateEntry={props.updateEntry}
                    onSetWorking={props.setWorking}
                    onCreateOrClone={props.createOrClone}
                    onSaveCurrentEntry={props.saveCurrentEntry}
                    onSubmit={props.submit}
                  />
                </div>
                <div className={"form-group"}>
                  <div className={headingClasses.join(" ")}>
                    <h1>Summary Leg Details</h1>
                  </div>
                  <SummaryLegDetailsForm
                    summaryLeg={props.summaryLeg}
                    disabled={disabled}
                    isEditMode={props.isEditMode}
                    isLoading={props.isLoadingLegs}
                    dealEntry={props.entry}
                    onUpdateSummaryLeg={props.updateSummaryLeg}
                  />
                </div>
              </div>
            </OverlayScrollbarsComponent>
          </Grid>
          <Grid xs={5} item>
            <OverlayScrollbarsComponent className={"container"}>
              <div className={"form-group-container"}>
                <LegDetailsForm
                  legs={props.legs}
                  isEditMode={props.isEditMode}
                  isLoading={props.isLoadingLegs}
                  dealEntry={props.entry}
                  disabled={disabled}
                  onUpdateLeg={onUpdateLeg}
                />
              </div>
            </OverlayScrollbarsComponent>
          </Grid>
        </Grid>
      </div>
      <ModalWindow
        isOpen={error !== null}
        render={() => <MiddleOfficeError error={error} />}
      />
      <ModalWindow
        isOpen={props.successMessage !== null}
        render={() => <SuccessMessage />}
      />
      <ModalWindow
        isOpen={deleteQuestionOpen}
        render={() => <DeleteQuestion onNo={dontDelete} onYes={doDelete} />}
      />
      <ModalWindow
        isOpen={props.status !== MiddleOfficeProcessingState.Normal}
        render={() => <ProgressView />}
      />
    </>
  );
};
