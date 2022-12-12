import { Grid } from '@material-ui/core';
import { FormField } from 'components/FormField';
import { DropdownItem } from 'forms/fieldDef';
import { MiddleOfficeStore, MiddleOfficeStoreContext } from 'mobx/stores/middleOfficeStore';
import React, { ReactElement, useEffect, useState } from 'react';
import { InvalidTenor, Tenor } from 'types/tenor';
import { SPECIFIC_TENOR } from 'utils/tenorUtils';

interface Props<T> {
  readonly data: readonly DropdownItem[];
  readonly value: Tenor | InvalidTenor | null;
  readonly className?: string;
  readonly color: 'green' | 'orange' | 'cream' | 'grey';
  readonly name: keyof T;
  readonly disabled?: boolean;
  readonly readOnly: boolean;

  onChange?(name: keyof T, value: Tenor): Promise<void>;
}

const specificTenorDropdownItem: DropdownItem<string> = {
  internalValue: SPECIFIC_TENOR,
  value: SPECIFIC_TENOR,
  label: SPECIFIC_TENOR,
};

export function TenorDropdown<T>(props: Props<T>): ReactElement {
  const { data, value } = props;
  const { name = '', expiryDate = null } = value ?? {};
  const [intermediateName, setIntermediateName] = useState<string>('');
  const [intermediateDate, setIntermediateDate] = useState<Date | null>(null);

  useEffect((): void => {
    setIntermediateName(name);
  }, [name]);

  useEffect((): void => {
    if (name === SPECIFIC_TENOR) {
      return;
    }

    setIntermediateDate(expiryDate);
  }, [expiryDate, name]);

  const onDateChange = (event: React.ChangeEvent<HTMLInputElement>, date: Date | string): void => {
    if (date instanceof Date) {
      void props.onChange?.(props.name, {
        name: SPECIFIC_TENOR,
        deliveryDate: date,
        expiryDate: date,
      });
    } else {
      setIntermediateName(SPECIFIC_TENOR);
    }
  };

  const onSelectChange = async (name: keyof T, tenorName: string): Promise<void> => {
    if (tenorName !== SPECIFIC_TENOR) {
      await props.onChange?.(name, {
        expiryDate: expiryDate ?? new Date(),
        deliveryDate: expiryDate ?? new Date(),
        name: tenorName,
      });
    } else {
      setIntermediateDate(null);
    }

    setIntermediateName(tenorName);
  };

  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const tenors = React.useMemo(
    (): readonly DropdownItem[] => [specificTenorDropdownItem, ...data],
    [data]
  );

  return (
    <Grid className="MuiInputBase-root" alignItems="center" container>
      <Grid className="bank-entity-field" spacing={1} item container>
        <Grid xs={6} item>
          <FormField
            dropdownData={tenors}
            color={props.color}
            value={intermediateName}
            name={props.name}
            type="dropdown"
            editable={!props.readOnly}
            disabled={props.disabled}
            onChange={onSelectChange}
            store={store}
          />
          <div style={{ width: 2 }} />
        </Grid>
        <Grid xs={6} item>
          <div style={{ width: 2 }} />
          <FormField<{ date: Date }, MiddleOfficeStore>
            color={props.color}
            type="date"
            value={intermediateDate}
            placeholder="MM/DD/YYYY"
            editable={!props.readOnly}
            name="date"
            disabled={props.disabled}
            onInput={onDateChange}
            store={store}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}
