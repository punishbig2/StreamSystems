import { Grid } from "@material-ui/core";
import { ExistingEntryButtons } from "components/MiddleOffice/DealEntryForm/existingEntryButtons";
import originalFields from "components/MiddleOffice/DealEntryForm/fields";
import useLegs from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { NewEntryButtons } from "components/MiddleOffice/DealEntryForm/newEntryButtons";
import { Cut } from "components/MiddleOffice/types/cut";
import { FieldDef } from "forms/fieldDef";
import { MoStore } from "mobx/stores/moStore";
import React, { ReactElement, useEffect, useRef } from "react";
import { DealEntry, EntryType } from "structures/dealEntry";
import { Field } from "./field";

interface Props {
  readonly entryType: EntryType;
  readonly entry: DealEntry;
  readonly cuts: ReadonlyArray<Cut>;
  readonly isModified: boolean;
  readonly isEditMode: boolean;
  readonly isReadyForSubmission: boolean;
  readonly disabled: boolean;
  readonly onUpdateEntry: (partial: Partial<DealEntry>) => Promise<void>;
  readonly onSetWorking: (working: boolean) => void;
  readonly onCreateOrClone: () => void;
  readonly onSaveCurrentEntry: () => void;
  readonly onSubmit: () => void;
  readonly onPriced: () => void;
}

export const DealEntryForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { entry, cuts } = props;
  const { symbol } = entry;
  useLegs(cuts, entry);
  const fieldsRef: React.MutableRefObject<ReadonlyArray<
    FieldDef<DealEntry, DealEntry, MoStore>
  >> = useRef<ReadonlyArray<FieldDef<DealEntry, DealEntry, MoStore>>>(
    originalFields
  );
  useEffect((): void => {
    const fields: ReadonlyArray<FieldDef<DealEntry, DealEntry, MoStore>> =
      fieldsRef.current;
    const index: number = fields.findIndex(
      (field: FieldDef<DealEntry, DealEntry, MoStore>): boolean =>
        field.name === "strike"
    );
    fieldsRef.current = [
      ...fields.slice(0, index),
      { ...fields[index], rounding: symbol["strike-rounding"] },
      ...fields.slice(index + 1),
    ];
  }, [symbol]);
  const fields: ReadonlyArray<FieldDef<DealEntry, DealEntry, MoStore>> | null =
    fieldsRef.current;
  const getActionButtons = (): ReactElement | null => {
    switch (props.entryType) {
      case EntryType.ExistingDeal:
        return (
          <ExistingEntryButtons
            disabled={props.disabled}
            isModified={props.isModified}
            isEditMode={props.isEditMode}
            status={entry.status}
            onSubmit={props.onSubmit}
            onSave={props.onSaveCurrentEntry}
            onPrice={props.onPriced}
          />
        );
      case EntryType.New:
      case EntryType.Clone:
        return (
          <NewEntryButtons
            disabled={props.disabled}
            canSubmit={props.isReadyForSubmission}
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
                field: FieldDef<DealEntry, DealEntry, MoStore>
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
      <div className={"button-box"}>{getActionButtons()}</div>
    </form>
  );
};
