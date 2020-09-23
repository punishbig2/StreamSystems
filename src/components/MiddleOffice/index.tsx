import { MuiThemeProvider } from "@material-ui/core";
import { useMoInitializer } from "components/MiddleOffice/hooks/useMoInitializer";
import { MiddleOfficeMain } from "components/MiddleOffice/middleOfficeMain";
import { Deal } from "components/MiddleOffice/types/deal";
import { Leg } from "components/MiddleOffice/types/leg";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { ProgressView } from "components/progressView";
import { observer } from "mobx-react";
import store from "mobx/stores/moStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { MOErrorMessage } from "types/middleOfficeError";

import { createTheme } from "./theme";

interface Props {
  readonly visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { preferences } = workareaStore;
    useMoInitializer();
    if (!store.isInitialized) {
      return (
        <ProgressView
          title={"Loading: Middle Office"}
          message={"Please wait, we are loading some data"}
          value={store.progress}
        />
      );
    } else {
      return (
        <MuiThemeProvider theme={createTheme(preferences.theme)}>
          <MiddleOfficeMain
            visible={props.visible}
            error={store.error}
            entry={store.entry}
            removeDeal={(id: string): Promise<void> => store.removeDeal(id)}
            addDeal={(deal: Deal): Promise<void> => store.addDeal(deal)}
            setDeal={(deal: Deal | null): void => store.setDeal(deal)}
            setError={(error: MOErrorMessage): void => store.setError(error)}
            updateLeg={(index: number, key: keyof Leg, value: any): void =>
              store.updateLeg(index, key, value)
            }
            updateSummaryLeg={(key: keyof SummaryLeg, value: any): void =>
              store.updateSummaryLeg(key, value)
            }
            status={store.status}
            deals={store.deals}
            selectedDealID={store.selectedDealID}
            isEditMode={store.isEditMode}
            isLoadingLegs={store.isLoadingLegs}
            entryType={store.entryType}
            addNewDeal={(): void => store.addNewDeal()}
            cloneDeal={(): void => store.cloneDeal()}
            cancelAddOrClone={(): void => store.cancelAddOrClone()}
            setEditMode={(editMode: boolean): void =>
              store.setEditMode(editMode)
            }
            legs={store.legs}
            summaryLeg={store.summaryLeg}
            isModified={store.isModified}
            cuts={store.cuts}
            isReadyForSubmission={store.isReadyForSubmission}
            updateEntry={async (partial: Partial<DealEntry>): Promise<void> => {
              store.updateEntry(partial);
            }}
            price={(): void => store.price()}
            createOrClone={(): void => store.createOrClone()}
            setWorking={(working: boolean): void => store.setWorking(working)}
            isWorking={store.isWorking}
            saveCurrentEntry={(): void => store.saveCurrentEntry()}
            submit={(): void => store.submit()}
            successMessage={store.successMessage}
          />
        </MuiThemeProvider>
      );
    }
  }
);
