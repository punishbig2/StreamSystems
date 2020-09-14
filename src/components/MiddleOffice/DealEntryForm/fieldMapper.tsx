import { FormField } from "components/FormField";
import { DropdownItem, FieldDef } from "forms/fieldDef";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus, MoStore } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { resolveBankToEntity, stateMap } from "utils/dealUtils";
import { deriveTenor } from "utils/tenorUtils";
import { EditableCondition } from "../types/moStrategy";

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
    const { strategy } = entry;
    if (strategy !== undefined && strategy.fields !== undefined) {
      const { f1 } = strategy.fields;
      return f1[field.name];
    }
    return EditableCondition.None;
  })();

  const getValue = (rawValue: any, internal: boolean): any => {
    if (editableCondition === EditableCondition.NotApplicable) return "N/A";
    if (field.type === "bank-entity") return resolveBankToEntity(rawValue);
    if (field.name === "status") return stateMap[Number(rawValue)];
    if (field.name === "legadj") {
      if (!!rawValue) {
        return "true";
      } else {
        return "false";
      }
    }
    if (!internal) {
      if (field.name === "symbol") {
        return rawValue.symbolID;
      } else if (field.name === "strategy") {
        return rawValue.productid;
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
  const value: any = getValue(!!entry ? entry[field.name] : null, false);
  const onTenorChange = async (
    name: keyof DealEntry,
    value: string | Date
  ): Promise<void> => {
    return store.updateEntry({
      [name]: await deriveTenor(entry.symbol, value, entry.tradeDate),
    });
  };
  const onChange = (name: keyof DealEntry, value: any): void => {
    if (field.type === "tenor") {
      store.setWorking(name);
      // Execute and then stop the working mode
      onTenorChange(name, value).finally(() => store.setWorking(null));
    } else {
      const convertedValue: any = getValue(value, true);
      if (convertedValue === undefined) return;
      store.setWorking(name);
      store
        .updateEntry({ [name]: convertedValue })
        .finally(() => store.setWorking(null));
    }
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
