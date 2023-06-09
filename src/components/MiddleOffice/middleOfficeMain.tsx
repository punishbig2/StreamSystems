import { API } from 'API';
import { ActionButtons } from 'components/MiddleOffice/actionButtons';
import { DealEntryButtons, isButtonDisabled } from 'components/MiddleOffice/buttonStateResolver';
import { DealBlotter } from 'components/MiddleOffice/DealBlotter';
import { DealEntryForm } from 'components/MiddleOffice/DealEntryForm';
import { DeleteQuestion } from 'components/MiddleOffice/deleteQuestion';
import { MiddleOfficeError } from 'components/MiddleOffice/error';
import { useDealDeletedListener } from 'components/MiddleOffice/hooks/useDealDeletedListener';
import { useDealEditListener } from 'components/MiddleOffice/hooks/useDealEditListener';
import { useErrorListener } from 'components/MiddleOffice/hooks/useErrorListener';
import { useNewDealListener } from 'components/MiddleOffice/hooks/useNewDealListener';
import { useSEFListener } from 'components/MiddleOffice/hooks/useSEFListener';
import { LegDetailsForm } from 'components/MiddleOffice/LegDetailsForm';
import { ProgressView } from 'components/MiddleOffice/progressView';
import { SuccessMessage } from 'components/MiddleOffice/successMessage';
import { SummaryLegDetailsForm } from 'components/MiddleOffice/SummaryLegDetailsForm';
import { Cut } from 'components/MiddleOffice/types/cut';
import { Deal } from 'components/MiddleOffice/types/deal';
import { Leg } from 'components/MiddleOffice/types/leg';
import { SummaryLeg } from 'components/MiddleOffice/types/summaryLeg';
import { ModalWindow } from 'components/ModalWindow';
import { ScrollArea } from 'components/ScrollArea';
import { MiddleOfficeProcessingState, MoGenericMessage } from 'mobx/stores/middleOfficeStore';
import React from 'react';
import { DealEditStatus } from 'signalR/signalRClient';
import { DealEntry, EntryType } from 'types/dealEntry';
import { MOErrorMessage } from 'types/middleOfficeError';
import { SEFUpdate } from 'types/sefUpdate';
import { randomID } from 'utils/randomID';

interface Props {
  readonly visible: boolean;
  readonly error: MOErrorMessage | null;
  readonly entry: DealEntry;
  readonly removeDeal: (id: string) => Promise<void>;
  readonly addDeal: (deal: { [key: string]: any }) => Promise<void>;
  readonly setDeal: (deal: Deal | null) => void;
  readonly setError: (error: MOErrorMessage) => void;
  readonly updateLeg: (index: number, key: keyof Leg, value: any) => Promise<void>;
  readonly status: MiddleOfficeProcessingState;
  readonly deals: readonly Deal[];
  readonly selectedDealID: string | null;
  readonly isEditMode: boolean;
  readonly isWorking: boolean;
  readonly isLoadingLegs: boolean;
  readonly entryType: EntryType;
  readonly addNewDeal: () => void;
  readonly cloneDeal: () => void;
  readonly cancelAddOrClone: () => void;
  readonly setEditMode: (editMode: boolean) => void;
  readonly legs: readonly Leg[];
  readonly summaryLeg: SummaryLeg | null;
  readonly isModified: boolean;
  readonly isDealEditable: boolean;
  readonly cuts: readonly Cut[];
  readonly isReadyForSubmission: boolean;
  readonly updateEntry: (partial: Partial<DealEntry>) => Promise<void>;
  readonly price: () => void;
  readonly createOrClone: () => void;
  readonly setWorking: (working: boolean) => void;
  readonly saveCurrentEntry: () => void;
  readonly submit: () => void;
  readonly successMessage: MoGenericMessage | null;
  readonly updateSEFStatus: (update: SEFUpdate) => Promise<void>;
  readonly updateSummaryLeg: (fieldName: keyof SummaryLeg, value: any) => Promise<void>;
  readonly editDeal: (status: DealEditStatus, id: string) => void;
  readonly loadingDeals: boolean;
}

export const MiddleOfficeMain: React.FC<Props> = (props: Props): React.ReactElement => {
  const [deleteQuestionOpen, showDeleteQuestion] = React.useState<boolean>(false);
  const classes: string[] = ['middle-office'];

  const {
    status,
    isLoadingLegs,
    loadingDeals,
    entry,
    isEditMode,
    isModified,
    isReadyForSubmission,
    error,
  } = props;

  // Deal event handlers
  useNewDealListener((deal: { [key: string]: any }) => {
    void props.addDeal(deal);
  });

  useDealDeletedListener((id: string): void => {
    void props.removeDeal(id);
  });

  useDealEditListener((status: DealEditStatus, id: string): void => {
    props.editDeal(status, id);
  });

  useSEFListener((sefUpdate: SEFUpdate): void => {
    void props.updateSEFStatus(sefUpdate);
  });

  useErrorListener((error: any): void => props.setError(error));
  // If it's hidden ... wait, what?
  if (!props.visible) classes.push('hidden');
  if (props.loadingDeals) classes.push('loading-deals');

  const dontDelete = (): void => {
    showDeleteQuestion(false);
  };

  const doDelete = (): void => {
    showDeleteQuestion(false);
    if (entry.dealID === undefined) {
      throw new Error("cannot delete this entry, it has no id so it's new or data is bad");
    } else {
      API.removeDeal(entry.dealID)
        .then(() => null)
        .catch((error: any) => {
          console.warn(error);
        })
        .finally(() => {
          return;
        });
    }
  };

  const removeDeal = (): void => {
    showDeleteQuestion(true);
  };

  const onUpdateLeg = (index: number, key: keyof Leg, value: any): Promise<void> => {
    return props.updateLeg(index, key, value);
  };

  const onDealSelected = (deal: Deal | null): void => {
    props.setDeal(deal);
  };

  const disabled: boolean = React.useMemo(
    (): boolean =>
      isLoadingLegs ||
      (status !== MiddleOfficeProcessingState.Normal &&
        status !== MiddleOfficeProcessingState.SilentlySubmitting) ||
      loadingDeals,
    [status, isLoadingLegs, loadingDeals]
  );

  const isButtonDisabledWrapper = React.useCallback(
    (button: keyof DealEntryButtons): boolean => {
      if (disabled || status === MiddleOfficeProcessingState.SilentlySubmitting) {
        return true;
      }

      return isButtonDisabled(button, entry, isEditMode, isModified, isReadyForSubmission);
    },
    [disabled, entry, isEditMode, isModified, isReadyForSubmission, status]
  );

  const headingClasses: string[] = ['heading'];
  if (
    props.status !== MiddleOfficeProcessingState.Normal &&
    props.status !== MiddleOfficeProcessingState.SilentlySubmitting
  ) {
    headingClasses.push('disabled');
  }

  return (
    <>
      <div className={classes.join(' ')}>
        <div className="left-panel">
          <DealBlotter
            id={randomID('')}
            disabled={
              props.status !== MiddleOfficeProcessingState.Normal &&
              props.status !== MiddleOfficeProcessingState.SilentlySubmitting
            }
            selectedRow={props.selectedDealID}
            deals={props.deals}
            onDealSelected={onDealSelected}
          />
        </div>

        <div className="right-panel">
          <div className="container">
            <ScrollArea>
              <div className="form-group-container">
                <div className="form-group">
                  <div className={headingClasses.join(' ')}>
                    <h1>Deal Entry</h1>
                    <div className="actions">
                      <ActionButtons
                        isEditMode={props.isEditMode}
                        entryType={props.entryType}
                        editable={props.isDealEditable}
                        isButtonDisabled={isButtonDisabledWrapper}
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
                    isEditMode={props.isEditMode}
                    isModified={props.isModified}
                    isButtonDisabled={isButtonDisabledWrapper}
                    onPrice={props.price}
                    onUpdateEntry={props.updateEntry}
                    onSetWorking={props.setWorking}
                    onCreateOrClone={props.createOrClone}
                    onSaveCurrentEntry={props.saveCurrentEntry}
                    onSubmit={props.submit}
                    disabled={disabled}
                  />
                </div>
                <div className="form-group">
                  <div className={headingClasses.join(' ')}>
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
            </ScrollArea>
          </div>
          <ScrollArea>
            <div className="container">
              <div className="form-group-container">
                <LegDetailsForm
                  legs={props.legs}
                  isEditMode={props.isEditMode}
                  isLoading={props.isLoadingLegs}
                  dealEntry={props.entry}
                  disabled={disabled}
                  onUpdateLeg={onUpdateLeg}
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      <ModalWindow isOpen={error !== null} render={() => <MiddleOfficeError error={error} />} />
      <ModalWindow isOpen={props.successMessage !== null} render={() => <SuccessMessage />} />
      <ModalWindow
        isOpen={deleteQuestionOpen}
        render={() => <DeleteQuestion onNo={dontDelete} onYes={doDelete} />}
      />
      <ModalWindow
        isOpen={
          props.status !== MiddleOfficeProcessingState.Normal &&
          props.status !== MiddleOfficeProcessingState.SilentlySubmitting
        }
        render={() => <ProgressView />}
      />
    </>
  );
};
