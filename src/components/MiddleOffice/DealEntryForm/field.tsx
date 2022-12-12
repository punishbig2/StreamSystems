import { API } from 'API';
import { FormField } from 'components/FormField';
import { isInvalidTenor } from 'components/FormField/helpers';
import { getValue } from 'components/MiddleOffice/DealEntryForm/helpers';
import { DropdownItem, FieldDef } from 'forms/fieldDef';
import { MiddleOfficeStore, MiddleOfficeStoreContext } from 'mobx/stores/middleOfficeStore';
import React from 'react';
import { CalendarVolDatesResponse } from 'types/calendarFXPair';
import { DealEntry } from 'types/dealEntry';
import { EditableFlag } from 'types/product';
import { Tenor } from 'types/tenor';
import { SPECIFIC_TENOR } from 'utils/tenorUtils';
import { safeForceParseDate, toUTC } from 'utils/timeUtils';

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

export const Field: React.FC<Props> = (props: Props): React.ReactElement => {
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const { field, entry, isEditMode } = props;
  const { transformData, dataSource } = field;
  const [dropdownData, setDropdownData] = React.useState<readonly DropdownItem[]>([]);
  const { onChangeStart, onChangeCompleted } = props;
  const { symbol } = entry;

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
    return MiddleOfficeStore.getFieldEditableFlag('', field.name, strategy);
  }, [strategy, field]);

  const value: any = React.useMemo(
    (): any => getValue(field, editFlag, entry[field.name], false, store.entities),
    [field, editFlag, entry, store.entities]
  );

  const editable: boolean | undefined = React.useMemo((): boolean | undefined => {
    if (!isEditMode) return false;
    if (editFlag === EditableFlag.NotEditable || editFlag === EditableFlag.NotApplicable) {
      return false;
    } else {
      if (typeof field.editable === 'function') {
        return field.editable(field.name, entry, store.isEditMode, '');
      } else {
        return field.editable;
      }
    }
  }, [isEditMode, editFlag, field, entry, store.isEditMode]);

  const onTenorChange = React.useCallback(
    async (name: keyof DealEntry, value: Tenor): Promise<void> => {
      const { symbol } = entry;

      const dates: CalendarVolDatesResponse = await ((): Promise<CalendarVolDatesResponse> => {
        if (value.name !== SPECIFIC_TENOR) {
          return API.queryVolTenors(
            {
              tradeDate: toUTC(entry.tradeDate, true),
              fxPair: symbol.symbolID,
              addHolidays: true,
              rollExpiryDates: true,
            },
            [value.name]
          ).execute();
        } else {
          return API.queryVolDates(
            {
              tradeDate: toUTC(entry.tradeDate, true),
              fxPair: symbol.symbolID,
              addHolidays: true,
              rollExpiryDates: true,
            },
            [toUTC(value.expiryDate)]
          ).execute();
        }
      })();

      const result = {
        [name]: {
          name: value.name,
          ...safeForceParseDate('deliveryDate', dates.DeliveryDates[0]),
          ...safeForceParseDate('expiryDate', dates.ExpiryDates[0]),
        },
        // If it's tenor 2 it does not affect deal level spot/premium dates
        // otherwise it does
        ...(name === 'tenor1'
          ? {
              ...safeForceParseDate('spotDate', dates.SpotDate),
              ...safeForceParseDate('premiumDate', dates.SpotDate),
            }
          : {}),
      };
      console.log(result);

      return onChangeCompleted(result);
    },
    [entry, onChangeCompleted]
  );

  const onChange = React.useCallback(
    async (name: keyof DealEntry, value: any): Promise<void> => {
      const dependants: Partial<DealEntry> = ((name: keyof DealEntry): Partial<DealEntry> => {
        if (name === 'strategy') {
          return { legadj: store.getDefaultLegAdjust(value, symbol) };
        } else {
          return {};
        }
      })(name);
      onChangeStart();

      if (field.type === 'tenor') {
        await onTenorChange(name, value);
      } else if (field.name === 'symbol') {
        const { tenor1, tenor2 } = entry;
        const convertedValue: any = getValue(field, editFlag, value, true, store.entities);
        if (convertedValue === undefined) {
          return;
        }

        // Compute the tenor1 value with the new symbol
        if (!isInvalidTenor(tenor1) && tenor1.name !== '') {
          await onTenorChange('tenor1', tenor1);
        }

        // Compute the tenor1 value with the new symbol (if needed)
        if (
          tenor2 !== null &&
          !isInvalidTenor(tenor2) &&
          typeof tenor2 !== 'string' &&
          tenor2.name !== ''
        ) {
          await onTenorChange('tenor2', tenor2);
        }

        await onChangeCompleted({ [name]: convertedValue, ...dependants });
      } else {
        const convertedValue: any = getValue(field, editFlag, value, true, store.entities);
        if (convertedValue === undefined) {
          return;
        }
        // This will also take some time presumably
        await onChangeCompleted({ [name]: convertedValue, ...dependants });
      }
    },
    [onChangeStart, field, store, symbol, onTenorChange, editFlag, onChangeCompleted]
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
};
