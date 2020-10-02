import { Grid } from "@material-ui/core";
import { ExistingEntryButtons } from "components/MiddleOffice/DealEntryForm/existingEntryButtons";
import originalFields from "components/MiddleOffice/DealEntryForm/fields";
import useLegs from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { NewEntryButtons } from "components/MiddleOffice/DealEntryForm/newEntryButtons";
import { Cut } from "components/MiddleOffice/types/cut";
import { FieldDef } from "forms/fieldDef";
import { MoStatus, MoStore } from "mobx/stores/moStore";
import React, { ReactElement, useEffect, useRef } from "react";
import { DealEntry, EntryType } from "structures/dealEntry";
import { Field } from "./field";

interface Props {
  readonly entryType: EntryType;
  readonly entry: DealEntry;
  readonly cuts: ReadonlyArray<Cut>;
  readonly status: MoStatus;
  readonly isModified: boolean;
  readonly isEditMode: boolean;
  readonly isReadyForSubmission: boolean;
  readonly onUpdateEntry: (partial: Partial<DealEntry>) => Promise<void>;
  readonly onSetWorking: (field: keyof DealEntry | null) => void;
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
    FieldDef<DealEntry, MoStore, DealEntry>
  >> = useRef<ReadonlyArray<FieldDef<DealEntry, MoStore, DealEntry>>>(
    originalFields
  );
  useEffect((): void => {
    const fields: ReadonlyArray<FieldDef<DealEntry, MoStore, DealEntry>> =
      fieldsRef.current;
    const index: number = fields.findIndex(
      (field: FieldDef<DealEntry, MoStore, DealEntry>): boolean =>
        field.name === "dealstrike"
    );
    fieldsRef.current = [
      ...fields.slice(0, index),
      { ...fields[index], rounding: symbol["strike-rounding"] },
      ...fields.slice(index + 1),
    ];
  }, [symbol]);
  const fields: ReadonlyArray<FieldDef<DealEntry, MoStore, DealEntry>> | null =
    fieldsRef.current;
  const getActionButtons = (): ReactElement | null => {
    switch (props.entryType) {
      case EntryType.ExistingDeal:
        return (
          <ExistingEntryButtons
            disabled={props.status !== MoStatus.Normal}
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
            disabled={props.status !== MoStatus.Normal}
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
          <fieldset
            className={"group full-height"}
            disabled={props.status !== MoStatus.Normal}
          >
            {fields.map(
              (
                field: FieldDef<DealEntry, MoStore, DealEntry>,
                index: number
              ): ReactElement => (
                <Field
                  key={field.name + index}
                  field={field}
                  index={index}
                  onUpdateEntry={props.onUpdateEntry}
                  onSetWorking={props.onSetWorking}
                  dealEntry={entry}
                />
              )
            )}
            ;
          </fieldset>
        </Grid>
      </Grid>
      <div className={"button-box"}>{getActionButtons()}</div>
    </form>
  );
};
