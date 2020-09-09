import { FormField } from "components/FormField";
import { FieldDef, DropdownItem } from "forms/fieldDef";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus, MoStore } from "mobx/stores/moStore";
import { isMoment } from "moment";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { resolveBankToEntity, stateMap } from "utils/dealUtils";
import { SPECIFIC_TENOR, tenorToDate } from "utils/tenorUtils";
import { EditableCondition, MOStrategy } from "../types/moStrategy";

export const fieldMapper = (store: DealEntryStore, entry: DealEntry) => (
  fieldDef: FieldDef<DealEntry, MoStore, DealEntryStore>,
  index: number
): ReactElement | null => {
  const { transformData, dataSource, ...field } = fieldDef;
  const source: any = !!dataSource ? moStore[dataSource] : undefined;
  const dropdownData: DropdownItem[] = !!transformData
    ? transformData(source, entry)
    : [];
  const editableCondition: EditableCondition = (() => {
    const strategy: MOStrategy | undefined = moStore.getStrategyById(
      entry.strategy
    );
    if (strategy !== undefined) {
      const { f1 } = strategy.fields;
      return f1[field.name];
    }
    return EditableCondition.None;
  })();

  const getValue = (rawValue: any): any => {
    if (editableCondition === EditableCondition.NotApplicable) return "N/A";
    if (field.type === "bank-entity") return resolveBankToEntity(rawValue);
    if (field.name === "status") return stateMap[Number(rawValue)];
    if (field.type === "tenor") {
      return {
        tenor: entry[field.name],
        expiryDate: entry[(field.name + "expiry") as keyof DealEntry],
      };
    }
    if (field.name === "legadj") {
      if (!!rawValue) {
        return "true";
      } else {
        return "false";
      }
    }
    if (field.type === "number") {
      if (rawValue === null || rawValue === undefined || rawValue.length === 0)
        return null;
      const candidate: number = Number(rawValue);
      if (isNaN(candidate)) {
        return undefined;
      }
      return rawValue;
    } else {
      return rawValue;
    }
  };
  const value: any = getValue(!!entry ? entry[field.name] : null);
  const onTenorChange = (name: keyof DealEntry, value: string): void => {
    const expiry: keyof DealEntry = (name + "expiry") as keyof DealEntry;
    if (isMoment(value)) {
      store.updateEntry(name, SPECIFIC_TENOR);
      store.updateEntry(expiry, value);
    } else {
      store.updateEntry(name, value);
      store.updateEntry(expiry, tenorToDate(value));
    }
  };
  const onChange = (name: keyof DealEntry, value: string): void => {
    if (field.type === "tenor") return onTenorChange(name, value);
    const convertedValue: any = getValue(value);
    if (convertedValue === undefined) return;
    store.updateEntry(name, convertedValue);
  };
  const isEditable = (
    fieldDef: FieldDef<DealEntry, MoStore, DealEntryStore>
  ): boolean | undefined => {
    if (!moStore.isEditMode) return false;
    if (
      editableCondition === EditableCondition.NotEditable ||
      editableCondition === EditableCondition.NotApplicable
    ) {
      return false;
    } else {
      if (typeof fieldDef.editable === "function") {
        return fieldDef.editable(fieldDef.data || dropdownData, store);
      } else {
        return fieldDef.editable;
      }
    }
  };
  return (
    <FormField<DealEntry>
      key={field.name + index}
      {...field}
      editable={isEditable(fieldDef)}
      dropdownData={dropdownData}
      value={value}
      rounding={fieldDef.rounding}
      onChange={onChange}
      disabled={moStore.status !== MOStatus.Normal}
    />
  );
};
