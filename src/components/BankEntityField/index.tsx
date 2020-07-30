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

export function BankEntityField<T>(props: Props<T>): ReactElement {
  const { value, readOnly, name, onChange } = props;
  const [currentEntity, setCurrentEntity] = useState<BankEntity>(
    DummyBankEntity
  );
  const [entities, setEntities] = useState<string[]>([]);
  const [firms, setFirms] = useState<string[]>([]);
  const [map, setMap] = useState<{ [p: string]: BankEntity }>({});
  const { entities: storeEntities } = moStore;
  const { id, code } = currentEntity;

  useEffect(() => {
    if (value === undefined || value === null) return;
    // Not really new value
    if (code === value) return;
    const entity: BankEntity | undefined = map[value];
    if (entity !== undefined) {
      setCurrentEntity(entity);
    } else if (code !== DummyBankEntity.code) {
      setCurrentEntity(DummyBankEntity);
    }
  }, [map, code, value]);

  useEffect(() => {
    if (code === value) return;
    if (onChange) {
      onChange(name, code);
    }
  }, [name, value, code, onChange]);

  useEffect(() => {
    const list: BankEntity[] | undefined = storeEntities[id];
    if (list !== undefined) {
      setEntities(list.map((entity: BankEntity) => entity.code));
    }
  }, [storeEntities, id]);

  const setCurrentFirm = useCallback(
    (id: string) => {
      const list: BankEntity[] | undefined = storeEntities[id];
      if (list === undefined) return;
      const defaultValue: BankEntity | undefined = list.find(
        (entity: BankEntity): boolean => entity.default
      );
      if (defaultValue === undefined) {
        console.warn(`${id} has no default entity`);
      } else {
        setCurrentEntity(defaultValue);
      }
    },
    [storeEntities]
  );

  useEffect(() => {
    if (storeEntities === null || storeEntities === undefined) return;
    // Extract the keys, which are the banks
    setFirms(Object.keys(storeEntities));
    // Flatten and save
    const map: { [p: string]: BankEntity } = Object.values(storeEntities)
      .reduce(
        (accum: BankEntity[], next: BankEntity[]): BankEntity[] => [
          ...accum,
          ...next,
        ],
        []
      )
      .reduce((map: { [p: string]: BankEntity }, entity: BankEntity): {
        [p: string]: BankEntity;
      } => {
        return { ...map, [entity.code]: entity };
      }, {});
    setMap(map);
  }, [storeEntities]);

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
      if (value === code) return;
      if (props.onChange !== undefined) {
        props.onChange(name, value);
      }
    }
  };

  if (readOnly) {
    return (
      <Grid className={"MuiInputBase-root"} alignItems={"center"} container>
        <Grid container>
          <Grid className={"MuiSelect-root"} xs={6} item>
            <span>{id}</span>
          </Grid>
          <Grid className={"MuiSelect-root"} xs={6} item>
            <span>{code}</span>
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
            value={id}
            fullWidth={true}
            onChange={onBankChange}
          >
            {firms.map((value: string) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid xs={6} item>
          <Select
            readOnly={readOnly}
            displayEmpty={true}
            value={code}
            fullWidth={true}
            renderValue={(value: any) => value}
            onChange={onEntityChange}
          >
            {entities.map((value: string) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </Grid>
      </Grid>
    </Grid>
  );
}
