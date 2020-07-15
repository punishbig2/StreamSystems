import { DealEntryStore } from "mobx/stores/dealEntryStore";
import { DealEntry } from "structures/dealEntry";
import { FieldDef, SelectItem } from "forms/fieldDef";
import moStore, { MoStore } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { FormField } from "components/FormField";

export const fieldMapper = (store: DealEntryStore, entry: DealEntry) => (
  fieldDef: FieldDef<DealEntry, MoStore, DealEntryStore>,
  index: number
): ReactElement | null => {
  const { transformData, dataSource, ...field } = fieldDef;
  const source: any = !!dataSource ? moStore[dataSource] : undefined;
  const dropdownData: SelectItem[] = !!transformData
    ? transformData(source, entry)
    : [];
  const value: any = !!entry ? entry[field.name] : null;
  const onChange = (name: keyof DealEntry, value: string) => {
    const convertedValue: any = (() => {
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
    if (name === "vol" || name === "spread") console.log(convertedValue);
    // Ignore it!
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
      onChange={onChange}
      value={value}
    />
  );
};
