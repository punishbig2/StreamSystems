import { Grid, MenuItem, Select } from "@material-ui/core";
import moStore from "mobx/stores/moStore";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import { BankEntity } from "types/bankEntity";

interface Props<T> {
  list: {
    value: string;
    label: string;
  }[];
  value: string;
  name: keyof T;
  readOnly: boolean;
  onChange?: (name: keyof T, value: any) => void;
}

const DummyBankEntity: BankEntity = {
  code: "",
  default: false,
  id: "",
  name: "",
};

const simpleMenuItemRenderer = (value: string): ReactElement => (
  <MenuItem key={value} value={value}>
    {value}
  </MenuItem>
);

const getCurrentEntity = (
  code: string,
  entities: { [p: string]: BankEntity[] }
): BankEntity => {
  const flat: BankEntity[] = Object.values(
    entities
  ).reduce((current: BankEntity[], next: BankEntity[]): BankEntity[] => [
    ...current,
    ...next,
  ]);
  const found: BankEntity | undefined = flat.find(
    (entity: BankEntity): boolean => entity.code === code
  );
  if (found === undefined) {
    return DummyBankEntity;
  } else {
    return found;
  }
};

const getDefaultEntity = (
  bank: string,
  entities: { [p: string]: BankEntity[] }
): BankEntity | undefined => {
  const list: BankEntity[] | undefined = entities[bank];
  if (list === undefined) return;
  return list.find((entity: BankEntity): boolean => entity.default);
};

export function BankEntityField<T>(props: Props<T>): ReactElement {
  const { value, readOnly, name, onChange } = props;
  const [entities, setEntities] = useState<string[]>([]);
  const [firms, setFirms] = useState<string[]>([]);
  const { entities: mapped } = moStore;
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
        onChange(name, defaultValue.code);
      }
    },
    [onChange, name, mapped]
  );

  useEffect(() => {
    if (mapped === null || mapped === undefined) return;
    // Extract the keys, which are the banks
    setFirms(Object.keys(mapped));
  }, [mapped]);

  const onBankChange = (
    event: React.ChangeEvent<{ value: unknown; name?: string }>
  ): void => {
    const { value } = event.target;
    if (typeof value === "string") {
      setCurrentFirm(value);
    }
  };

  const onEntityChange = (
    event: React.ChangeEvent<{ value: unknown; name?: string }>
  ): void => {
    const { value } = event.target;
    const { name } = props;
    if (typeof value === "string") {
      if (onChange !== undefined) {
        onChange(name, value);
      }
    }
  };

  if (readOnly) {
    return (
      <Grid className={"MuiInputBase-root"} alignItems={"center"} container>
        <Grid container>
          <Grid className={"MuiSelect-root"} xs={6} item>
            <span>{firm}</span>
          </Grid>
          <Grid className={"MuiSelect-root"} xs={6} item>
            <span>{value}</span>
          </Grid>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid className={"MuiInputBase-root"} alignItems={"center"} container>
      <Grid className={"bank-entity-field"} item container>
        <Grid xs={6} item>
          <Select
            readOnly={readOnly}
            displayEmpty={true}
            value={firm}
            fullWidth={true}
            onChange={onBankChange}
          >
            {firms.map(simpleMenuItemRenderer)}
          </Select>
        </Grid>
        <Grid xs={6} item>
          <Select
            readOnly={readOnly}
            displayEmpty={true}
            value={entities.includes(value) ? value : ""}
            fullWidth={true}
            onChange={onEntityChange}
          >
            {entities.map(simpleMenuItemRenderer)}
          </Select>
        </Grid>
      </Grid>
    </Grid>
  );
}
