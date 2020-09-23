import { FormField } from "components/FormField";
import { getValue } from "components/MiddleOffice/DealEntryForm/helpers";
import { EditableCondition } from "components/MiddleOffice/types/moStrategy";
import deepEqual from "deep-equal";
import { FieldDef } from "forms/fieldDef";
import moStore, { MoStore } from "mobx/stores/moStore";
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { DealEntry } from "structures/dealEntry";
import { Tenor } from "types/tenor";
import { deriveTenor } from "utils/tenorUtils";

interface Props {
  readonly field: FieldDef<DealEntry, MoStore, DealEntry>;
  readonly entry: DealEntry;
  readonly isEditMode: boolean;
  readonly disabled: boolean;
  readonly onChangeStart: () => void;
  readonly onChangeCompleted: (partial: Partial<DealEntry>) => void;
}

export const Field: React.FC<Props> = React.memo(
  (props: Props): ReactElement => {
    const { field, entry, isEditMode } = props;
    const { transformData, dataSource } = field;
    const [dropdownData, setDropdownData] = useState<any[]>([]);
    useEffect(() => {
      if (!transformData) return;
      if (dataSource) {
        if (!moStore[dataSource]) return;
        setDropdownData(transformData(moStore[dataSource], entry));
      } else {
        setDropdownData(transformData(null));
      }
    }, [dataSource, transformData, entry]);
    const { strategy } = entry;
    const editableCondition: EditableCondition = useMemo(() => {
      if (strategy !== undefined && strategy.fields !== undefined) {
        const { f1 } = strategy.fields;
        return f1[field.name];
      }
      return EditableCondition.None;
    }, [strategy, field]);
    const rawValue: any = useMemo(() => entry[field.name], [entry, field]);
    const value: any = useMemo(
      () => getValue(field, editableCondition, rawValue, false),
      [field, editableCondition, rawValue]
    );
    const editable: boolean | undefined = useMemo((): boolean | undefined => {
      if (!isEditMode) return false;
      if (
        editableCondition === EditableCondition.NotEditable ||
        editableCondition === EditableCondition.NotApplicable
      ) {
        return false;
      } else {
        if (typeof field.editable === "function") {
          return field.editable(field.data || dropdownData, entry);
        } else {
          return field.editable;
        }
      }
    }, [field, isEditMode, dropdownData, entry, editableCondition]);
    const { onChangeStart, onChangeCompleted } = props;
    const onTenorChange = useCallback(
      (name: keyof DealEntry, value: string | Date): void => {
        deriveTenor(entry.symbol, value, entry.tradeDate).then(
          (tenor: Tenor): void => {
            onChangeCompleted({
              [name]: tenor,
            });
          }
        );
      },
      [onChangeCompleted, entry]
    );
    const onChange = useCallback(
      (name: keyof DealEntry, value: any): void => {
        onChangeStart();
        if (field.type === "tenor") {
          onTenorChange(name, value);
        } else {
          const convertedValue: any = getValue(
            field,
            editableCondition,
            value,
            true
          );
          if (convertedValue === undefined) return;
          onChangeCompleted({ [name]: convertedValue });
        }
      },
      [
        onChangeStart,
        onChangeCompleted,
        field,
        editableCondition,
        onTenorChange,
      ]
    );
    return (
      <FormField<DealEntry>
        {...field}
        editable={editable}
        dropdownData={dropdownData}
        value={value}
        rounding={field.rounding}
        // Have a local change function to do some pre-processing
        onChange={onChange}
        disabled={props.disabled}
      />
    );
  },
  (prevProps: Props, nextProps: Props) => {
    const { entry: prevEntry, field } = prevProps;
    const { entry: nextEntry } = nextProps;
    if (prevProps.isEditMode !== nextProps.isEditMode) return false;
    if (prevEntry.strategy !== nextEntry.strategy) return false;
    if (prevEntry.symbol !== nextEntry.symbol) return false;
    if (prevProps.disabled !== nextProps.disabled) return false;
    return deepEqual(nextEntry[field.name], prevEntry[field.name]);
  }
);
