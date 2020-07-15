import { DealEntryStore } from "mobx/stores/dealEntryStore";
import { DealEntry } from "structures/dealEntry";
import { FieldDef, SelectItem } from "forms/fieldDef";
import moStore, { MoStore } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { FormField } from "components/FormField";
import { stateMap } from "utils/dealUtils";

export const fieldMapper = (store: DealEntryStore, entry: DealEntry) => (
  fieldDef: FieldDef<DealEntry, MoStore, DealEntryStore>,
  index: number
): ReactElement | null => {
  const { transformData, dataSource, ...field } = fieldDef;
  const source: any = !!dataSource ? moStore[dataSource] : undefined;
  const dropdownData: SelectItem[] = !!transformData
    ? transformData(source, entry)
    : [];
  const value: any = (() => {
    if (!entry) return null;
    if (field.name === "status") return stateMap[Number(entry[field.name])];
    return entry[field.name];
  })();
  const onChange = (name: keyof DealEntry, value: string) => {
    const convertedValue: any = (() => {
      if (field.name === "status") return stateMap[Number(value)];
      if (field.type === "number") {
        if (value === null || value.length === 0) return null;
        const candidate: number = Number(value);
        if (isNaN(candidate)) {
          return undefined;
        }
        return value;
      } else {
        return value;
      }
    })();
    if (convertedValue === undefined) return;
    store.updateEntry(name, convertedValue);
  };
  const isEditable = (
    fieldDef: FieldDef<DealEntry, MoStore, DealEntryStore>
  ): boolean | undefined => {
    if (!moStore.isEditMode) return false;
    if (typeof fieldDef.editable === "function") {
      return fieldDef.editable(fieldDef.data || dropdownData, store);
    } else {
      return fieldDef.editable;
    }
  };
  return (
    <FormField<DealEntry>
      key={field.name + index}
      {...field}
      editable={isEditable(fieldDef)}
      dropdownData={dropdownData}
      value={value}
      onChange={onChange}
    />
  );
};
