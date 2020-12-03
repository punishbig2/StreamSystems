import { API } from "API";
import { FormField } from "components/FormField";
import { getValue } from "components/MiddleOffice/DealEntryForm/helpers";
import { EditableFlag } from "components/MiddleOffice/types/moStrategy";
import deepEqual from "deep-equal";
import { FieldDef } from "forms/fieldDef";
import moStore, { MoStore } from "mobx/stores/moStore";
import React from "react";
import { DealEntry } from "structures/dealEntry";
import { CalendarVolDatesResponse } from "types/calendarFXPair";
import { getVegaAdjust } from "utils/getVegaAdjust";
import { SPECIFIC_TENOR } from "utils/tenorUtils";

import { safeForceParseDate, toUTC } from "utils/timeUtils";

export interface DealEntryEditInterface {
  readonly updateEntry: (partial: Partial<DealEntry>) => Promise<void>;
  readonly setWorking: (field: keyof DealEntry | null) => void;
}

type FieldType = FieldDef<DealEntry, DealEntry, MoStore>;

interface Props {
  readonly field: FieldType;
  readonly entry: DealEntry;
  readonly isEditMode: boolean;
  readonly disabled: boolean;
  readonly onChangeStart: () => void;
  readonly onChangeCompleted: (partial: Partial<DealEntry>) => void;
}

export const Field: React.FC<Props> = React.memo(
  (props: Props): React.ReactElement => {
    const { field, entry, isEditMode } = props;
    const { transformData, dataSource } = field;
    const [dropdownData, setDropdownData] = React.useState<any[]>([]);
    React.useEffect(() => {
      if (!transformData) return;
      if (dataSource) {
        if (!moStore[dataSource]) return;
        setDropdownData(transformData(moStore[dataSource], entry));
      } else {
        setDropdownData(transformData(null));
      }
    }, [dataSource, transformData, entry]);
    const { strategy } = entry;
    const editableCondition: EditableFlag = React.useMemo(() => {
      if (strategy !== undefined && strategy.fields !== undefined) {
        const { f1 } = strategy.fields;
        return f1[field.name];
      }
      return EditableFlag.None;
    }, [strategy, field]);
    const value: any = React.useMemo(
      (): any => getValue(field, editableCondition, entry[field.name], false),
      [field, editableCondition, entry]
    );
    const editable: boolean | undefined = React.useMemo(():
      | boolean
      | undefined => {
      if (!isEditMode) return false;
      if (
        editableCondition === EditableFlag.NotEditable ||
        editableCondition === EditableFlag.NotApplicable
      ) {
        return false;
      } else {
        if (typeof field.editable === "function") {
          return field.editable(field.name, entry, moStore.isEditMode, "");
        } else {
          return field.editable;
        }
      }
    }, [field, isEditMode, entry, editableCondition]);
    const { onChangeStart, onChangeCompleted } = props;
    const onTenorChange = React.useCallback(
      async (name: keyof DealEntry, value: string | Date): Promise<void> => {
        const { symbol } = entry;
        const dates: CalendarVolDatesResponse = await ((): Promise<
          CalendarVolDatesResponse
        > => {
          if (typeof value === "string") {
            return API.queryVolTenors(
              {
                tradeDate: toUTC(entry.tradeDate, true),
                fxPair: symbol.symbolID,
                addHolidays: true,
                rollExpiryDates: true,
              },
              [value]
            );
          } else {
            return API.queryVolDates(
              {
                tradeDate: toUTC(entry.tradeDate, true),
                fxPair: symbol.symbolID,
                addHolidays: true,
                rollExpiryDates: true,
              },
              [toUTC(value)]
            );
          }
        })();
        return onChangeCompleted({
          [name]: {
            name: typeof value === "string" ? value : SPECIFIC_TENOR,
            ...safeForceParseDate("deliveryDate", dates.DeliveryDates[0]),
            ...safeForceParseDate("expiryDate", dates.ExpiryDates[0]),
          },
          // If it's tenor 2 it does not affect deal level spot/premium dates
          // otherwise it does
          ...(name === "tenor1"
            ? {
                ...safeForceParseDate("spotDate", dates.SpotDate),
                ...safeForceParseDate("premiumDate", dates.SpotDate),
              }
            : {}),
        });
      },
      [entry, onChangeCompleted]
    );
    const onChange = React.useCallback(
      async (name: keyof DealEntry, value: any): Promise<void> => {
        const dependants: Partial<DealEntry> = ((
          name: keyof DealEntry
        ): Partial<DealEntry> => {
          if (name === "symbol") {
            return { legadj: getVegaAdjust(value, entry.strategy) };
          } else if (name === "strategy") {
            return { legadj: getVegaAdjust(entry.symbol, value) };
          } else {
            return {};
          }
        })(name);
        onChangeStart();
        if (field.type === "tenor") {
          await onTenorChange(name, value);
        } else {
          const convertedValue: any = getValue(
            field,
            editableCondition,
            value,
            true
          );
          if (convertedValue === undefined) return;
          // This will also take some time presumably
          await onChangeCompleted({ [name]: convertedValue, ...dependants });
        }
      },
      [
        onChangeStart,
        field,
        entry.strategy,
        entry.symbol,
        onTenorChange,
        editableCondition,
        onChangeCompleted,
      ]
    );
    return (
      <FormField<DealEntry>
        {...field}
        editable={editable}
        dropdownData={dropdownData}
        value={value}
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
