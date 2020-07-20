import { FormField } from "components/FormField";
import { FieldDef, SelectItem } from "forms/fieldDef";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus, MoStore } from "mobx/stores/moStore";
import { isMoment } from "moment";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { stateMap } from "utils/dealUtils";
import { SPECIFIC_TENOR, tenorToDate } from "utils/tenorUtils";

export const fieldMapper = (store: DealEntryStore, entry: DealEntry) => (
  fieldDef: FieldDef<DealEntry, MoStore, DealEntryStore>,
  index: number
): ReactElement | null => {
  const { transformData, dataSource, ...field } = fieldDef;
  const source: any = !!dataSource ? moStore[dataSource] : undefined;
  const dropdownData: SelectItem[] = !!transformData
    ? transformData(source, entry)
    : [];

  const getValue = (): any => {
    if (!entry) return null;
    const entryValue: any = entry[field.name];
    if (field.name === "status") return stateMap[Number(entryValue)];
    if (field.name === "tenor") {
      return {
        tenor: entry.tenor,
        expiryDate: entry.expiryDate,
      };
    }
    if (field.type === "number") {
      if (
        entryValue === null ||
        entryValue === undefined ||
        entryValue.length === 0
      )
        return null;
      const candidate: number = Number(entryValue);
      if (isNaN(candidate)) {
        return undefined;
      }
      return entryValue;
    } else {
      return entryValue;
    }
  };

  const value: any = getValue();
  const onTenorChange = (value: string) => {
    if (isMoment(value)) {
      store.updateEntry("tenor", SPECIFIC_TENOR);
      store.updateEntry("expiryDate", value);
    } else {
      store.updateEntry("tenor", value);
      store.updateEntry("expiryDate", tenorToDate(value));
    }
  };

  const onChange = (name: keyof DealEntry, value: string) => {
    if (name === "tenor") return onTenorChange(value);
    const convertedValue: any = getValue();
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
      disabled={moStore.status !== MOStatus.Normal}
    />
  );
};
