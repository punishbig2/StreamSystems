import { Grid } from "@material-ui/core";
import { ExistingEntryButtons } from "components/MiddleOffice/DealEntryForm/existingEntryButtons";
import { fieldMapper } from "components/MiddleOffice/DealEntryForm/fieldMapper";
import originalFields from "components/MiddleOffice/DealEntryForm/fields";
import useLegs from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { NewEntryButtons } from "components/MiddleOffice/DealEntryForm/newEntryButtons";
import { sendPricingRequest } from "components/MiddleOffice/DealEntryForm/sendPricingRequest";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { FieldDef } from "forms/fieldDef";
import { observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus, MoStore } from "mobx/stores/moStore";
import React, { ReactElement, useEffect, useRef } from "react";
import { DealEntry, EntryType } from "structures/dealEntry";
import { Symbol } from "types/symbol";

interface Props {
  readonly store: DealEntryStore;
}

export const DealEntryForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { store } = props;
    const { cuts, deal } = moStore;
    const { entry } = store;
    const { ccypair } = entry;
    useLegs(cuts, entry);
    useEffect(() => {
      if (deal === null) return;
      store.setDeal(deal);
    }, [store, deal]);
    const fieldsRef: React.MutableRefObject<ReadonlyArray<
      FieldDef<DealEntry, MoStore, DealEntryStore>
    >> = useRef<ReadonlyArray<FieldDef<DealEntry, MoStore, DealEntryStore>>>(
      originalFields
    );
    useEffect((): void => {
      const fields: ReadonlyArray<FieldDef<
        DealEntry,
        MoStore,
        DealEntryStore
      >> = fieldsRef.current;
      const symbol: Symbol | undefined = moStore.findSymbolById(ccypair, false);
      if (symbol === undefined) return;
      const index: number = fields.findIndex(
        (field: FieldDef<DealEntry, MoStore, DealEntryStore>): boolean =>
          field.name === "dealstrike"
      );
      fieldsRef.current = [
        ...fields.slice(0, index),
        { ...fields[index], rounding: symbol["strike-rounding"] },
        ...fields.slice(index + 1),
      ];
    }, [ccypair]);
    const fields: ReadonlyArray<
      FieldDef<DealEntry, MoStore, DealEntryStore>
    > | null = fieldsRef.current;
    const onPriced =
      deal === null
        ? undefined
        : () => {
            const summary: SummaryLeg | null = moStore.summaryLeg;
            if (summary === null)
              throw new Error("cannot price if summary is non existent");
            sendPricingRequest(deal, entry, summary);
          };
    const getActionButtons = (): ReactElement | null => {
      switch (store.entryType) {
        case EntryType.Empty:
          return null;
        case EntryType.ExistingDeal:
          return (
            <ExistingEntryButtons
              disabled={moStore.status !== MOStatus.Normal}
              isModified={store.isModified}
              isEditMode={moStore.isEditMode}
              status={entry.status}
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

    return (
      <form
        className={
          store.entryType === EntryType.Empty ? "invisible" : undefined
        }
      >
        <Grid alignItems={"stretch"} container>
          <Grid xs={12} item>
            <fieldset
              className={"group full-height"}
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
