import { MenuItem, Select } from "@material-ui/core";
import moStore from "mobx/stores/moStore";
import React, { ReactElement, useEffect, useState } from "react";
import { BankEntity } from "types/bankEntity";

interface Props {
  list: {
    value: string;
    label: string;
  }[];
  bank: string;
  name: string;
  readOnly: boolean;
  onChange?: (value: any) => void;
}

interface Item {
  value: string;
  label: {
    primary: string;
    secondary: string;
    detail: string;
  };
}

export const BankEntityField: React.FC<Props> = (
  props: Props
): ReactElement => {
  const { bank, name, readOnly } = props;
  const [items, setItems] = useState<{ [p: string]: Item }>({});
  const { entities } = moStore;

  useEffect(() => {
    const items: { [p: string]: Item } = Object.values(entities)
      .reduce((flat: BankEntity[], next: BankEntity[]): BankEntity[] => [
        ...flat,
        ...next,
      ])
      .map(
        (entity: BankEntity): Item => ({
          value: entity.code,
          label: {
            primary: entity.id,
            secondary: entity.code,
            detail: entity.name,
          },
        })
      )
      .reduce((map: { [p: string]: Item }, item: Item): {
        [p: string]: Item;
      } => {
        return { ...map, [item.value]: item };
      }, {});
    setItems(items);
  }, [entities]);

  const renderValue = (value: any) => {
    if (value === undefined || value === "")
      return <div className={"empty-display-value"}>No selection</div>;
    const item: Item | undefined = items[value];
    if (item === undefined)
      return <div className={"error"}>Old value, please update</div>;
    const { label } = item;
    return (
      <>
        <div className={"primary"}>{label.primary}</div>
        <div className={"secondary"}>{label.secondary}</div>
      </>
    );
  };

  const onChange = (
    event: React.ChangeEvent<{ value: unknown; name?: string }>
  ): void => {
    const { value } = event.target;
    if (props.onChange !== undefined) {
      props.onChange(value);
    }
  };

  const values: Item[] = Object.values(items);
  return (
    <Select
      name={name}
      readOnly={readOnly}
      className={"pretty-select-root"}
      onChange={onChange}
      renderValue={renderValue}
      displayEmpty={true}
      value={bank}
    >
      {values.map(({ value, label }: Item) => (
        <MenuItem className={"pretty-menu-item"} key={value} value={value}>
          <div className={"heading"}>
            <div className={"primary"}>{label.primary}</div>
            <div className={"secondary"}>{label.secondary}</div>
          </div>
          <div className={"sub-heading"}>{label.detail}</div>
        </MenuItem>
      ))}
    </Select>
  );
};
