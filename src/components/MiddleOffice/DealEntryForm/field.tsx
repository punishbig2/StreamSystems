import { FormField } from "components/FormField";
import { getValue } from "components/MiddleOffice/DealEntryForm/helpers";
import { EditableCondition } from "components/MiddleOffice/types/moStrategy";
import deepEqual from "deep-equal";
import { FieldDef } from "forms/fieldDef";
import moStore, { MoStore } from "mobx/stores/moStore";
import React from "react";
import { DealEntry } from "structures/dealEntry";
import { API } from "../../../API";
import { CalendarVolDatesResponse } from "../../../types/calendarFXPair";
import { SPECIFIC_TENOR } from "../../../utils/tenorUtils";
import {
  addToDate,
  forceParseDate,
  naiveTenorToDate,
  toUTC,
} from "../../../utils/timeUtils";

interface Props {
  readonly field: FieldDef<DealEntry, MoStore, DealEntry>;
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
    const editableCondition: EditableCondition = React.useMemo(() => {
      if (strategy !== undefined && strategy.fields !== undefined) {
        const { f1 } = strategy.fields;
        return f1[field.name];
      }
      return EditableCondition.None;
    }, [strategy, field]);
    const rawValue: any = React.useMemo(() => entry[field.name], [
      entry,
      field,
    ]);
    const value: any = React.useMemo(
      () => getValue(field, editableCondition, rawValue, false),
      [field, editableCondition, rawValue]
    );
    const editable: boolean | undefined = React.useMemo(():
      | boolean
      | undefined => {
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
    const onTenorChange = React.useCallback(
      async (name: keyof DealEntry, value: string | Date): Promise<void> => {
        const { symbol } = entry;
        if (typeof value === "string") {
          try {
            const dates: CalendarVolDatesResponse = await API.queryVolDates({
              tradeDate: toUTC(entry.tradeDate, true),
              fxPair: symbol.symbolID,
              rollExpiryDates: true,
              addHolidays: true,
              Tenors: [value],
            });
            const spotDate: Date = forceParseDate(dates.SpotDate);
            onChangeCompleted({
              [name]: {
                name: value,
                deliveryDate: forceParseDate(dates.DeliveryDates[0]),
                expiryDate: forceParseDate(dates.ExpiryDates[0]),
              },
              premiumDate: spotDate,
              spotDate: spotDate,
            });
          } catch {
            const expiryDate: Date = naiveTenorToDate(value);
            onChangeCompleted({
              [name]: {
                name: value,
                deliveryDate: addToDate(
                  expiryDate,
                  symbol.SettlementWindow,
                  "d"
                ),
                expiryDate: expiryDate,
              },
            });
          }
        } else {
          onChangeCompleted({
            [name]: {
              name: SPECIFIC_TENOR,
              deliveryDate: addToDate(value, symbol.SettlementWindow, "d"),
              expiryDate: value,
            },
          });
        }
      },
      [entry, onChangeCompleted]
    );
    const onChange = React.useCallback(
      async (name: keyof DealEntry, value: any): Promise<void> => {
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
          await onChangeCompleted({ [name]: convertedValue });
        }
      },
      [
        onChangeStart,
        onChangeCompleted,
        onTenorChange,
        field,
        editableCondition,
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
