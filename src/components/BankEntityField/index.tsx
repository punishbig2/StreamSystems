import { Grid, MenuItem, Select } from "@material-ui/core";
import moStore from "mobx/stores/moStore";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import { BankEntity } from "types/bankEntity";

interface Props {
  list: {
    value: string;
    label: string;
  }[];
  value: string;
  name: string;
  readOnly: boolean;
  onChange?: (value: any) => void;
}

const DummyBankEntity: BankEntity = {
  code: "",
  default: false,
  id: "",
  name: "",
};

export const BankEntityField: React.FC<Props> = (
  props: Props
): ReactElement => {
  const { value, readOnly } = props;
  const [currentEntity, setCurrentEntity] = useState<BankEntity>(
    DummyBankEntity
  );
  const [entities, setEntities] = useState<string[]>([]);
  const [firms, setFirms] = useState<string[]>([]);
  const [map, setMap] = useState<{ [p: string]: BankEntity }>({});
  const { entities: storeEntities } = moStore;

  useEffect(() => {
    if (value === undefined || value === null) return;
    const entity: BankEntity | undefined = map[value];
    if (entity !== undefined) {
      setCurrentEntity(entity);
    }
  }, [map, value]);

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
        setEntities(list.map((entity: BankEntity): string => entity.code));
        setCurrentEntity(defaultValue);
      }
    },
    [entities]
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
    if (typeof value === "string") {
      if (props.onChange !== undefined) {
        props.onChange(value);
      }
    }
  };

  return (
    <Grid className={"MuiInputBase-root"} alignItems={"center"} container>
      <Grid container>
        <Grid xs={6} item>
          <Select
            readOnly={readOnly}
            displayEmpty={true}
            value={currentEntity ? currentEntity.id : ""}
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
            value={currentEntity ? currentEntity.code : ""}
            fullWidth={true}
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
};
