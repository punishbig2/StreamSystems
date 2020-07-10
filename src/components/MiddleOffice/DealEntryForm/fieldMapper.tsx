import { DealEntryStore } from "mobx/stores/dealEntryStore";
import { DealEntry } from "structures/dealEntry";
import { FieldDef, SelectItem } from "forms/fieldDef";
import mo, { MoStore } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { FormField } from "components/formField";

export const fieldMapper = (store: DealEntryStore, entry: DealEntry) => (
  fieldDef: FieldDef<DealEntry, MoStore, DealEntryStore>,
  index: number
): ReactElement | null => {
  const { transformData, dataSource, ...field } = fieldDef;
  const source: any = !!dataSource ? mo[dataSource] : undefined;
  const dropdownData: SelectItem[] = !!transformData
    ? transformData(source)
    : [];
  const value: any = !!entry ? entry[field.name] : null;
  const onChange = (name: keyof DealEntry, value: string) => {
    const convertedValue: any = (() => {
      if (field.type === "number") {
        if (value.length === 0) return null;
        const candidate: number = Number(value);
        if (isNaN(candidate)) {
          return undefined;
        }
        return value;
      } else {
        return value;
      }
    })();
    // Ignore it!
    if (convertedValue === undefined) return;
    store.updateEntry(name, convertedValue);
  };
  const isEditable = (
    fieldDef: FieldDef<DealEntry, MoStore, DealEntryStore>
  ): boolean | undefined => {
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
