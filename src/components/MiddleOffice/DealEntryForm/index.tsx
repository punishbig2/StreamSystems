import { Grid } from "@material-ui/core";
import { ExistingEntryButtons } from "components/MiddleOffice/DealEntryForm/existingEntryButtons";
import originalFields from "components/MiddleOffice/DealEntryForm/fields";
import { createDefaultLegsFromDeal } from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { NewEntryButtons } from "components/MiddleOffice/DealEntryForm/newEntryButtons";
import { Cut } from "components/MiddleOffice/types/cut";
import { FieldDef } from "forms/fieldDef";
import {
  MiddleOfficeStore,
  MiddleOfficeStoreContext,
} from "mobx/stores/middleOfficeStore";
import { NotApplicableProxy } from "notApplicableProxy";
import React, { ReactElement, useEffect, useRef } from "react";
import { DealEntry, EntryType } from "types/dealEntry";
import { Field } from "./field";
import { DealStatus } from "types/dealStatus";
import { emailNotSet } from "../helpers";
import { DealEntryButtons } from "components/MiddleOffice/buttonStateResolver";

interface Props {
  readonly entryType: EntryType;
  readonly entry: DealEntry;
  readonly cuts: ReadonlyArray<Cut>;
  readonly isModified: boolean;
  readonly isEditMode: boolean;
  readonly disabled: boolean;

  isButtonDisabled(button: keyof DealEntryButtons): boolean;

  onUpdateEntry(partial: Partial<DealEntry>): Promise<void>;
  onSetWorking(working: boolean): void;
  onCreateOrClone(): void;
  onSaveCurrentEntry(): void;
  onSubmit(): void;
  onPriced(): void;
}

export const DealEntryForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { entry } = props;
  const { symbol, strategy } = entry;
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);

  // Generate legs when either symbol or strategy change
  React.useEffect((): void => {
    const { entry } = store;
    const { strategy } = entry;
    // If it's not a new deal we don't generate
    // new stub legs
    if (entry.type !== EntryType.New) return;
    const { cuts } = store;
    const proxyEntry = new Proxy(
      entry,
      NotApplicableProxy<DealEntry>("leg", entry, "N/A")
    );
    const [legs, summaryLeg] = createDefaultLegsFromDeal(
      cuts,
      proxyEntry,
      store.legDefinitions[strategy.productid]
    );
    store.setLegs(legs, summaryLeg);
  }, [symbol, strategy, store]);

  useEffect((): void => {
    const fields: ReadonlyArray<
      FieldDef<DealEntry, DealEntry, MiddleOfficeStore>
    > = fieldsRef.current;
    const index: number = fields.findIndex(
      (field: FieldDef<DealEntry, DealEntry, MiddleOfficeStore>): boolean =>
        field.name === "dealstrike"
    );
    fieldsRef.current = [
      ...fields.slice(0, index),
      { ...fields[index], rounding: symbol["strike-rounding"] },
      ...fields.slice(index + 1),
    ];
  }, [symbol]);

  const fieldsRef: React.MutableRefObject<
    ReadonlyArray<FieldDef<DealEntry, DealEntry, MiddleOfficeStore>>
  > =
    useRef<ReadonlyArray<FieldDef<DealEntry, DealEntry, MiddleOfficeStore>>>(
      originalFields
    );

  const fields: ReadonlyArray<
    FieldDef<DealEntry, DealEntry, MiddleOfficeStore>
  > | null = fieldsRef.current;

  const ActionButtons = (): ReactElement | null => {
    switch (props.entryType) {
      case EntryType.ExistingDeal:
        return (
          <ExistingEntryButtons
            isModified={props.isModified}
            isEditMode={props.isEditMode}
            status={entry.status}
            submitDisabled={
              entry.status === DealStatus.SEFComplete &&
              (emailNotSet(entry.buyer_useremail) ||
                emailNotSet(entry.seller_useremail))
            }
            isButtonDisabled={props.isButtonDisabled}
            onSubmit={props.onSubmit}
            onSave={props.onSaveCurrentEntry}
            onPrice={props.onPriced}
          />
        );
      case EntryType.New:
      case EntryType.Clone:
        return (
          <NewEntryButtons
            isButtonDisabled={props.isButtonDisabled}
            onSubmit={props.onCreateOrClone}
          />
        );
      case EntryType.Empty:
        return null;
    }
  };

  return (
    <form
      className={props.entryType === EntryType.Empty ? "invisible" : undefined}
    >
      <Grid alignItems={"stretch"} container>
        <Grid xs={12} item>
          <fieldset className={"group full-height"} disabled={props.disabled}>
            {fields.map(
              (
                field: FieldDef<DealEntry, DealEntry, MiddleOfficeStore>
              ): ReactElement => (
                <Field
                  key={field.name + field.type}
                  field={field}
                  entry={entry}
                  // Stuff from properties
                  isEditMode={props.isEditMode}
                  disabled={props.disabled}
                  onChangeCompleted={(partial: Partial<DealEntry>) => {
                    props
                      .onUpdateEntry(partial)
                      .finally((): void => props.onSetWorking(false));
                  }}
                  onChangeStart={() => props.onSetWorking(true)}
                />
              )
            )}
          </fieldset>
        </Grid>
      </Grid>
      <div className={"button-box"}>
        <ActionButtons />
      </div>
    </form>
  );
};
