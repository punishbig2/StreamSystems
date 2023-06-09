import { Grid } from '@material-ui/core';
import { getCurrentEntity, getDefaultEntity } from 'components/BankEntityField/helpers';
import { FormField } from 'components/FormField';
import { DropdownItem } from 'forms/fieldDef';
import { MiddleOfficeStore, MiddleOfficeStoreContext } from 'mobx/stores/middleOfficeStore';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { BankEntity } from 'types/bankEntity';

interface Props<T> {
  list: readonly DropdownItem[];
  value: string;
  name: keyof T;
  disabled: boolean;
  readOnly: boolean;
  color: 'green' | 'orange' | 'cream' | 'grey';
  onChange?: (name: keyof T, value: any) => Promise<void>;
}

export function BankEntityField<T>(props: Props<T>): ReactElement {
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const { value, disabled, readOnly, name, onChange } = props;
  const [entities, setEntities] = useState<string[]>([]);
  const [firms, setFirms] = useState<string[]>([]);
  const { entities: mapped } = store;
  // Get the entity from the value
  const entity: BankEntity = getCurrentEntity(value, mapped);
  // This is the bank
  const { id: firm } = entity;

  useEffect(() => {
    const list: BankEntity[] | undefined = mapped[firm];
    if (list !== undefined) {
      setEntities(list.map((entity: BankEntity) => entity.code));
    }
  }, [mapped, firm]);

  const setCurrentFirm = useCallback(
    (firm: string) => {
      const defaultValue: BankEntity | undefined = getDefaultEntity(firm, mapped);
      if (defaultValue === undefined) {
        console.warn(`${firm} has no default entity`);
      } else if (onChange !== undefined) {
        void onChange(name, defaultValue.code);
      }
    },
    [onChange, name, mapped]
  );

  useEffect(() => {
    if (mapped === null || mapped === undefined) return;
    // Extract the keys, which are the banks
    setFirms(Object.keys(mapped));
  }, [mapped]);

  const onBankChange = async (name: keyof T, value: any): Promise<void> => {
    if (typeof value === 'string') {
      await setCurrentFirm(value);
    }
  };

  const onEntityChange = async (name: keyof T, value: any): Promise<void> => {
    if (typeof value === 'string') {
      if (onChange !== undefined) {
        await onChange(props.name, value);
      }
    }
  };

  return (
    <Grid container>
      <Grid className="bank-entity-field" spacing={1} item container>
        <Grid xs={6} item>
          <FormField
            color={props.color}
            name={props.name}
            value={firm}
            dropdownData={firms.map(
              (item: string): DropdownItem => ({
                label: item,
                internalValue: item,
                value: item,
              })
            )}
            onChange={onBankChange}
            disabled={disabled}
            editable={!readOnly}
            type="dropdown"
            store={store}
          />
        </Grid>
        <Grid xs={6} item>
          <FormField
            color={props.color}
            name={props.name}
            value={entities.includes(value) ? value : ''}
            dropdownData={entities.map(
              (item: string): DropdownItem => ({
                label: item,
                internalValue: item,
                value: item,
              })
            )}
            onChange={onEntityChange}
            disabled={disabled}
            editable={!readOnly}
            type="dropdown"
            store={store}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}
