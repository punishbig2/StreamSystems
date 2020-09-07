import { Grid } from "@material-ui/core";
import { FormField } from "components/FormField";
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
  disabled: boolean;
  readOnly: boolean;
  color: "green" | "orange" | "cream" | "grey";
  onChange?: (name: keyof T, value: any) => void;
}

const DummyBankEntity: BankEntity = {
  code: "",
  default: false,
  id: "",
  name: "",
};

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
  const { value, disabled, readOnly, name, onChange } = props;
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
      const defaultValue: BankEntity | undefined = getDefaultEntity(
        firm,
        mapped
      );
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

  const onBankChange = (name: keyof T, value: any): void => {
    if (typeof value === "string") {
      setCurrentFirm(value);
    }
  };

  const onEntityChange = (name: keyof T, value: any): void => {
    if (typeof value === "string") {
      if (onChange !== undefined) {
        onChange(props.name, value);
      }
    }
  };

  return (
    <Grid container>
      <Grid className={"bank-entity-field"} spacing={1} item container>
        <Grid xs={6} item>
          <FormField
            color={props.color}
            name={props.name}
            value={firm}
            dropdownData={firms.map((item: string) => ({
              label: item,
              value: item,
            }))}
            onChange={onBankChange}
            disabled={disabled}
            editable={!readOnly}
            type={"dropdown"}
          />
        </Grid>
        <Grid xs={6} item>
          <FormField
            color={props.color}
            name={props.name}
            value={entities.includes(value) ? value : ""}
            dropdownData={entities.map((item: string) => ({
              label: item,
              value: item,
            }))}
            onChange={onEntityChange}
            disabled={disabled}
            editable={!readOnly}
            type={"dropdown"}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}
