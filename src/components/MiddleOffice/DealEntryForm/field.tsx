import { API } from "API";
import { FormField } from "components/FormField";
import { getValue } from "components/MiddleOffice/DealEntryForm/helpers";
import { EditableFlag } from "types/product";
import deepEqual from "deep-equal";
import { DropdownItem, FieldDef } from "forms/fieldDef";
import {
  MiddleOfficeStore,
  MiddleOfficeStoreContext,
} from "mobx/stores/middleOfficeStore";
import React from "react";
import { DealEntry } from "types/dealEntry";
import { CalendarVolDatesResponse } from "types/calendarFXPair";
import { SPECIFIC_TENOR } from "utils/tenorUtils";

import { safeForceParseDate, toUTC } from "utils/timeUtils";

export interface DealEntryEditInterface {
  readonly updateEntry: (partial: Partial<DealEntry>) => Promise<void>;
  readonly setWorking: (field: keyof DealEntry | null) => void;
}

type FieldType = FieldDef<DealEntry, DealEntry, MiddleOfficeStore>;

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
    const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
    const { field, entry, isEditMode } = props;
    const { transformData, dataSource } = field;
    const [dropdownData, setDropdownData] = React.useState<
      ReadonlyArray<DropdownItem>
    >([]);
    React.useEffect(() => {
      if (!transformData) return;
      if (dataSource) {
        if (!store[dataSource]) return;
        setDropdownData(transformData(store[dataSource], entry));
      } else {
        setDropdownData(transformData(null));
      }
    }, [dataSource, transformData, entry, store]);

    const { strategy } = entry;
    const editFlag: EditableFlag = React.useMemo(() => {
      return MiddleOfficeStore.getFieldEditableFlag("", field.name, strategy);
    }, [strategy, field]);

    const value: any = React.useMemo(
      (): any =>
        getValue(field, editFlag, entry[field.name], false, store.entities),
      [field, editFlag, entry, store.entities]
    );

    const editable: boolean | undefined = React.useMemo(():
      | boolean
      | undefined => {
      if (!isEditMode) return false;
      if (
        editFlag === EditableFlag.NotEditable ||
        editFlag === EditableFlag.NotApplicable
      ) {
        return false;
      } else {
        if (typeof field.editable === "function") {
          return field.editable(field.name, entry, store.isEditMode, "");
        } else {
          return field.editable;
        }
      }
    }, [isEditMode, editFlag, field, entry, store.isEditMode]);
    const { onChangeStart, onChangeCompleted } = props;
    const onTenorChange = React.useCallback(
      async (name: keyof DealEntry, value: string | Date): Promise<void> => {
        const { symbol } = entry;
        const dates: CalendarVolDatesResponse =
          await ((): Promise<CalendarVolDatesResponse> => {
            if (typeof value === "string") {
              return API.queryVolTenors(
                {
                  tradeDate: toUTC(entry.tradeDate, true),
                  fxPair: symbol.symbolID,
                  addHolidays: true,
                  rollExpiryDates: true,
                },
                [value]
              ).execute();
            } else {
              return API.queryVolDates(
                {
                  tradeDate: toUTC(entry.tradeDate, true),
                  fxPair: symbol.symbolID,
                  addHolidays: true,
                  rollExpiryDates: true,
                },
                [toUTC(value)]
              ).execute();
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
    const { symbol } = entry;
    const onChange = React.useCallback(
      async (name: keyof DealEntry, value: any): Promise<void> => {
        const dependants: Partial<DealEntry> = ((
          name: keyof DealEntry
        ): Partial<DealEntry> => {
          if (name === "strategy") {
            return { legadj: store.getDefaultLegAdjust(value, symbol) };
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
            editFlag,
            value,
            true,
            store.entities
          );
          if (convertedValue === undefined) return;
          // This will also take some time presumably
          await onChangeCompleted({ [name]: convertedValue, ...dependants });
        }
      },
      [
        onChangeStart,
        field,
        store,
        symbol,
        onTenorChange,
        editFlag,
        onChangeCompleted,
      ]
    );

    return (
      <FormField<DealEntry, MiddleOfficeStore>
        {...field}
        editable={editable}
        dropdownData={dropdownData}
        value={value}
        // Have a local change function to do some pre-processing
        onChange={onChange}
        disabled={props.disabled}
        store={store}
      />
    );
  },
  (prevProps: Props, nextProps: Props) => {
    const { entry: prevEntry, field } = prevProps;
    const { entry: nextEntry } = nextProps;
    if (prevProps.isEditMode !== nextProps.isEditMode) return false;
    if (prevEntry.strategy !== nextEntry.strategy) return false;
    if (prevEntry.symbol !== nextEntry.symbol) return false;
    if (prevEntry.buyer !== nextEntry.buyer) return false;
    if (prevEntry.seller !== nextEntry.seller) return false;
    if (prevProps.disabled !== nextProps.disabled) return false;
    return deepEqual(nextEntry[field.name], prevEntry[field.name]);
  }
);
