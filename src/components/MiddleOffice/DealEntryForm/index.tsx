import { Grid } from "@material-ui/core";
import { ExistingEntryButtons } from "components/MiddleOffice/DealEntryForm/existingEntryButtons";
import existingEntryFields from "components/MiddleOffice/DealEntryForm/existingEntryFields";
import { fieldMapper } from "components/MiddleOffice/DealEntryForm/fieldMapper";
import useLegs from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { NewEntryButtons } from "components/MiddleOffice/DealEntryForm/newEntryButtons";
import newEntryFields from "components/MiddleOffice/DealEntryForm/newEntryFields";
import { sendPricingRequest } from "components/MiddleOffice/DealEntryForm/sendPricingRequest";
import { observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import React, { ReactElement, useEffect } from "react";
import { EntryType } from "structures/dealEntry";

interface Props {
  store: DealEntryStore;
}

export const DealEntryForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { store } = props;
    const { cuts, deal } = moStore;
    const { entry } = store;

    useLegs(cuts, entry);
    useEffect(() => {
      if (deal === null) return;
      store.setDeal(deal);
    }, [store, deal]);

    const onPriced =
      deal === null ? undefined : () => sendPricingRequest(deal, entry);
    const getActionButtons = (): ReactElement | null => {
      switch (store.entryType) {
        case EntryType.Empty:
          return null;
        case EntryType.ExistingDeal:
          return (
            <ExistingEntryButtons
              disabled={moStore.status !== MOStatus.Normal}
              isModified={store.isModified}
              isPriced={entry.status === 2}
              onSubmit={store.submit}
              onSave={store.saveCurrentEntry}
              onPrice={onPriced}
            />
          );
        case EntryType.New:
        case EntryType.Clone:
          return (
            <NewEntryButtons
              disabled={moStore.status !== MOStatus.Normal}
              onSubmit={store.createOrClone}
              canSubmit={store.isReadyForSubmission}
            />
          );
      }
    };

    const fields =
      store.entryType === EntryType.New || store.entryType === EntryType.Clone
        ? newEntryFields
        : existingEntryFields;
    return (
      <form
        className={
          store.entryType === EntryType.Empty ? "invisible" : undefined
        }
      >
        <Grid alignItems={"stretch"} container>
          <Grid xs={12} item>
            <fieldset
              className={"full-height"}
              disabled={moStore.status !== MOStatus.Normal}
            >
              {fields.map(fieldMapper(store, entry))}
            </fieldset>
          </Grid>
        </Grid>
        <div className={"button-box"}>{getActionButtons()}</div>
      </form>
    );
  }
);
