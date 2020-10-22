import { FormField } from "components/FormField";
import { DropdownItem, FieldDef } from "forms/fieldDef";
import moStore, { MoStatus, MoStore } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { resolveBankToEntity, stateMap } from "utils/dealUtils";
import { API } from "../../../API";
import { CalendarVolDatesResponse } from "../../../types/calendarFXPair";
import { SPECIFIC_TENOR } from "../../../utils/tenorUtils";
import { forceParseDate, toUTC } from "../../../utils/timeUtils";
import { EditableCondition } from "../types/moStrategy";

export interface DealEntryEditInterface {
  readonly updateEntry: (partial: Partial<DealEntry>) => Promise<void>;
  readonly setWorking: (field: keyof DealEntry | null) => void;
}

interface Props {
  readonly field: FieldDef<DealEntry, MoStore, DealEntry>;
  readonly dealEntry: DealEntry;
  readonly index: number;
  readonly onUpdateEntry: (entry: Partial<DealEntry>) => Promise<void>;
  readonly onSetWorking: (name: keyof DealEntry | null) => void;
}

export const Field: React.FC<Props> = (props: Props): ReactElement | null => {
  const { dealEntry } = props;
  const { transformData, dataSource, ...field } = props.field;
  // FIXME: this should be a little bit better (no access ot moStore from here)
  const source: any = !!dataSource ? moStore[dataSource] : undefined;
  const dropdownData: DropdownItem[] = !!transformData
    ? transformData(source, dealEntry)
    : [];
  const editableCondition: EditableCondition = (() => {
    const { strategy } = dealEntry;
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
  const value: any = getValue(
    !!dealEntry ? dealEntry[field.name] : null,
    false
  );
  const onTenorChange = async (
    name: keyof DealEntry,
    value: string | Date
  ): Promise<void> => {
    const { symbol } = dealEntry;
    const dates: CalendarVolDatesResponse = await ((): Promise<
      CalendarVolDatesResponse
    > => {
      if (typeof value === "string") {
        return API.queryVolTenors(
          {
            tradeDate: toUTC(dealEntry.tradeDate, true),
            fxPair: symbol.symbolID,
            addHolidays: true,
            rollExpiryDates: true,
          },
          [value]
        );
      } else {
        return API.queryVolDates(
          {
            tradeDate: toUTC(dealEntry.tradeDate, true),
            fxPair: symbol.symbolID,
            addHolidays: true,
            rollExpiryDates: true,
          },
          [toUTC(value)]
        );
      }
    })();
    return props.onUpdateEntry({
      [name]: {
        name: typeof value === "string" ? value : SPECIFIC_TENOR,
        deliveryDate: forceParseDate(dates.DeliveryDates[0]),
        expiryDate: forceParseDate(dates.ExpiryDates[0]),
      },
      // If it's tenor 2 it does not affect deal level spot/premium dates
      // otherwise it does
      ...(field.name === "tenor1"
        ? {
            spotDate: forceParseDate(dates.SpotDate),
            premiumDate: forceParseDate(dates.SpotDate),
          }
        : {}),
    });
  };
  const onChange = (name: keyof DealEntry, value: any): void => {
    if (field.type === "tenor") {
      props.onSetWorking(name);
      // Execute and then stop the working mode
      onTenorChange(name, value).finally(() => props.onSetWorking(null));
    } else {
      const convertedValue: any = getValue(value, true);
      if (convertedValue === undefined) return;
      props.onSetWorking(name);
      props
        .onUpdateEntry({ [name]: convertedValue })
        .finally(() => props.onSetWorking(null));
    }
  };
  const isEditable = (
    fieldDef: FieldDef<DealEntry, MoStore, DealEntry>
  ): boolean | undefined => {
    if (!moStore.isEditMode) return false;
    if (
      editableCondition === EditableCondition.NotEditable ||
      editableCondition === EditableCondition.NotApplicable
    ) {
      return false;
    } else {
      if (typeof fieldDef.editable === "function") {
        return fieldDef.editable(fieldDef.data || dropdownData, dealEntry);
      } else {
        return fieldDef.editable;
      }
    }
  };
  return (
    <FormField<DealEntry>
      key={field.name + props.index}
      {...field}
      editable={isEditable(field)}
      dropdownData={dropdownData}
      value={value}
      rounding={field.rounding}
      onChange={onChange}
      disabled={moStore.status !== MoStatus.Normal}
    />
  );
};
