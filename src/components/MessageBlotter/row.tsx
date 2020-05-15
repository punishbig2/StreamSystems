import { ColumnSpec } from "components/Table/columnSpecification";
import React, { CSSProperties, ReactElement, useEffect, useState } from "react";
import { $$ } from "utils/stringPaster";
import { getCellWidth } from "components/Table/helpers";
import { DarkPool } from "interfaces/w";
import { BlotterTypes } from "columns/messageBlotter";
import { DealInsertStore } from "../../mobx/stores/dealInsertStore";

export enum BlotterRowTypes {
  Normal,
  MyFill,
  MyBankFill,
  Busted,
}

interface Props {
  columns: ColumnSpec[];
  row: { [key: string]: any } | null;
  weight: number;
  type: BlotterRowTypes;
  blotterType: BlotterTypes;
  totalWidth: number;
  containerWidth: number;
  insertStore?: DealInsertStore;
}

const getClassFromRowType = (
  baseClassName: string,
  rowType: BlotterRowTypes,
  executed: boolean,
  isDarkPool: boolean
): string => {
  const classes: string[] = [baseClassName];
  if (executed) classes.push("flash");
  if (isDarkPool) classes.push("dark-pool");
  switch (rowType) {
    case BlotterRowTypes.Normal:
      classes.push("normal");
      break;
    case BlotterRowTypes.MyFill:
      classes.push("my-fill");
      break;
    case BlotterRowTypes.MyBankFill:
      classes.push("my-bank-fill");
      break;
    case BlotterRowTypes.Busted:
      classes.push("busted");
      break;
  }
  return classes.join(" ");
};

const Row: React.FC<Props> = (props: Props): ReactElement | null => {
  const { columns, blotterType, row } = props;
  const [executed, setExecuted] = useState<boolean>(false);
  const ExecID: string | null = row !== null ? row.ExecID : null;
  useEffect(() => {
    setExecuted(false);
    if (ExecID === null) return;
    if (blotterType === BlotterTypes.Executions) {
      let timer: number | null = null;
      const onExecuted = () => {
        console.log("executed");
        setExecuted(true);
        timer = setTimeout(() => {
          setExecuted(false);
        }, 3000);
      };
      const type: string = $$(ExecID, "executed");
      document.addEventListener(type, onExecuted, true);
      return () => {
        document.removeEventListener(type, onExecuted, true);
        if (timer !== null) {
          clearTimeout(timer);
        }
      };
    }
  }, [ExecID, blotterType]);
  const columnMapper = (rowID: string) => (
    column: ColumnSpec
  ): ReactElement => {
    const style: CSSProperties = {
      width: getCellWidth(column.width, props.totalWidth, props.containerWidth),
    };
    const id: string = $$(column.name, rowID);
    return (
      <div className={"td"} id={id} key={id} style={style}>
        {column.render({ message: row, store: props.insertStore })}
      </div>
    );
  };
  if (!row) {
    return (
      <div
        className={getClassFromRowType("tr", props.type, executed, false)}
        id={"__INSERT_ROW__"}
        key={"__INSERT_ROW__"}
      >
        {columns.map(columnMapper("__INSERT_ROW__"))}
      </div>
    );
  }
  const isDarkPool: boolean = row.ExDestination === DarkPool;
  return (
    <div
      className={getClassFromRowType("tr", props.type, executed, isDarkPool)}
      id={row.id}
      key={row.id}
    >
      {columns.map(columnMapper(row.id))}
    </div>
  );
};

export { Row };
