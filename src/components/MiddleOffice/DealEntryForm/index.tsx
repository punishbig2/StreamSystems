import { Grid } from "@material-ui/core";
import React, { ReactElement } from "react";
import { observer } from "mobx-react";
import mo from "mobx/stores/moStore";
import moStore from "mobx/stores/moStore";
import useLegs from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { DealEntryStore, EntryType } from "mobx/stores/dealEntryStore";
import { ExistingEntryButtons } from "components/MiddleOffice/DealEntryForm/existingEntryButtons";
import { NewEntryButtons } from "components/MiddleOffice/DealEntryForm/newEntryButtons";
import existingEntryFields from "components/MiddleOffice/DealEntryForm/existingEntryFields";
import newEntryFields from "components/MiddleOffice/DealEntryForm/newEntryFields";
import { fieldMapper } from "components/MiddleOffice/DealEntryForm/fieldMapper";
import { sendPricingRequest } from "components/MiddleOffice/DealEntryForm/sendPricingRequest";

interface Props {
  store: DealEntryStore;
}

export const DealEntryForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { store } = props;
    const { cuts, deal } = mo;
    const { entry } = store;

    useLegs(cuts, deal);

    const onPriced =
      deal === null ? undefined : () => sendPricingRequest(deal, entry);
    const getActionButtons = (): ReactElement | null => {
      switch (store.entryType) {
        case EntryType.Empty:
          return null;
        case EntryType.ExistingDeal:
          return (
            <ExistingEntryButtons
              isModified={store.isModified}
              isPriced={false}
              onPriced={onPriced}
            />
          );
        case EntryType.New:
        case EntryType.Clone:
          return (
            <NewEntryButtons
              onCancelled={() => moStore.setDeal(null, store)}
              onSubmitted={store.createOrClone}
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
            <fieldset className={"full-height"}>
              {fields.map(fieldMapper(store, entry))}
            </fieldset>
          </Grid>
        </Grid>
        <div className={"button-box"}>{getActionButtons()}</div>
      </form>
    );
  }
);
