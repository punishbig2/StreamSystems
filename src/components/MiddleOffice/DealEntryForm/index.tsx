import { Grid } from "@material-ui/core";
import originalFields from "components/MiddleOffice/DealEntryForm/fields";
import { createDefaultLegsFromDeal } from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
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
import { emailNotSet } from "../helpers";
import { DealEntryButtons } from "components/MiddleOffice/buttonStateResolver";
import { ActionButtons } from "components/MiddleOffice/DealEntryForm/actionButtons";

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
  onPrice(): void;
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

  const isSubmitDisabled = React.useMemo(
    (): boolean =>
      emailNotSet(entry.buyer_useremail) || emailNotSet(entry.seller_useremail),
    [entry.buyer_useremail, entry.seller_useremail]
  );

  return (
    <>
      <form
        className={
          props.entryType === EntryType.Empty ? "invisible" : undefined
        }
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
      </form>
      <div className={"button-box"}>
        <ActionButtons
          buttonsDisabled={props.isButtonDisabled}
          entryType={props.entryType}
          status={entry.status}
          submitDisabled={isSubmitDisabled}
          onSaveCurrentEntry={props.onSaveCurrentEntry}
          onSubmit={props.onSubmit}
          onCreateOrClone={props.onCreateOrClone}
          onPrice={props.onPrice}
        />
      </div>
    </>
  );
};
