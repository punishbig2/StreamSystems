import { MuiThemeProvider } from '@material-ui/core';
import { Task } from 'API';
import { useMoInitializer } from 'components/MiddleOffice/hooks/useMoInitializer';
import { MiddleOfficeMain } from 'components/MiddleOffice/middleOfficeMain';
import { createTheme } from 'components/MiddleOffice/theme';
import { BackendDeal, Deal } from 'components/MiddleOffice/types/deal';
import { Leg } from 'components/MiddleOffice/types/leg';
import { SummaryLeg } from 'components/MiddleOffice/types/summaryLeg';
import { ProgressView } from 'components/progressView';
import { MiddleOfficeStore, MiddleOfficeStoreContext } from 'mobx/stores/middleOfficeStore';
import workareaStore from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React, { ReactElement } from 'react';
import { DealEditStatus } from 'signalR/signalRClient';
import { DealEntry } from 'types/dealEntry';
import { MOErrorMessage } from 'types/middleOfficeError';
import { SEFUpdate } from 'types/sefUpdate';

interface Props {
  readonly visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer((props: Props): ReactElement | null => {
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const { preferences } = workareaStore;
  const [newDeal, setDeal] = React.useState<Deal | null>(null);

  React.useEffect((): VoidFunction => {
    const task: Task<void> = store.setDeal(newDeal);
    // Execute the task
    try {
      void task.execute();
    } catch (error) {
      console.warn(error);
    }
    // Allow cancellation
    return (): void => task.cancel();
  }, [newDeal, store]);

  useMoInitializer(store);
  if (!store.isInitialized) {
    return (
      <ProgressView
        title="Loading: Middle Office"
        message="Please wait, we are loading some data"
        value={store.progress}
      />
    );
  } else {
    return (
      <MuiThemeProvider theme={createTheme(preferences.theme, preferences.fontFamily)}>
        <MiddleOfficeMain
          visible={props.visible}
          error={store.error}
          entry={store.entry}
          editDeal={(status: DealEditStatus, id: string): void => {
            if (status === DealEditStatus.Start) {
              store.lockDeal(id);
            } else {
              store.unlockDeal(id);
            }
          }}
          updateSEFStatus={(update: SEFUpdate): Promise<void> => store.updateSEFStatus(update)}
          removeDeal={(id: string): Promise<void> => store.removeDeal(id)}
          addDeal={(deal: BackendDeal): Promise<void> => store.addDeal(deal)}
          setDeal={(deal: Deal | null): void => setDeal(deal)}
          setError={(error: MOErrorMessage): void => store.setError(error)}
          updateLeg={(index: number, key: keyof Leg, value: any): Promise<void> =>
            store.updateLeg(index, key, value)
          }
          updateSummaryLeg={async (key: keyof SummaryLeg, value: any): Promise<void> =>
            store.updateSummaryLeg(key, value)
          }
          status={store.status}
          deals={store.deals}
          selectedDealID={store.selectedDealID}
          isEditMode={store.isEditMode}
          isLoadingLegs={store.isLoadingLegs}
          isDealEditable={store.isDealEditable}
          entryType={store.entryType}
          addNewDeal={(): void => store.addNewDeal()}
          cloneDeal={(): void => store.cloneDeal()}
          cancelAddOrClone={(): void => store.cancelAddOrClone()}
          setEditMode={(editMode: boolean): void => store.setEditMode(editMode)}
          legs={store.legs}
          summaryLeg={store.summaryLeg}
          isModified={store.isModified}
          cuts={store.cuts}
          isReadyForSubmission={store.isReadyForSubmission}
          updateEntry={async (partial: Partial<DealEntry>): Promise<void> => {
            await store.updateDealEntry(partial);
          }}
          price={(): void => store.price()}
          createOrClone={(): void => store.createOrClone()}
          setWorking={(working: boolean): void => store.setWorking(working)}
          isWorking={store.isWorking}
          saveCurrentEntry={(): void => store.saveCurrentEntry()}
          submit={(): void => store.submit()}
          successMessage={store.successMessage}
          loadingDeals={store.loadingDeals}
        />
      </MuiThemeProvider>
    );
  }
});
