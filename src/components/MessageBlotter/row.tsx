import { ColumnSpec } from "components/Table/columnSpecification";
import React, { CSSProperties, ReactElement, useEffect, useState } from "react";
import { $$ } from "utils/stringPaster";
import { getCellWidth } from "components/Table/helpers";
import { DarkPool } from "interfaces/w";
import { BlotterTypes } from "columns/messageBlotter";
import { DealInsertStore } from "mobx/stores/dealInsertStore";
import { Menu, MenuItem } from "@material-ui/core";

export enum BlotterRowTypes {
  Normal,
  MyFill,
  MyBankFill,
  Busted,
}

export interface ContextMenuItem {
  label: string;
  action: () => void;
}

interface MenuSpec {
  x: number;
  y: number;
  visible: boolean;
}

interface Props {
  columns: ColumnSpec[];
  row: { [key: string]: any } | null;
  weight: number;
  type: BlotterRowTypes;
  isSelected?: boolean;
  blotterType: BlotterTypes;
  totalWidth: number;
  containerWidth: number;
  insertStore?: DealInsertStore;
  onClick?: (deal: any) => void;
  contextMenu?: ContextMenuItem[];
}

const getClassFromRowType = (
  baseClassName: string,
  rowType: BlotterRowTypes,
  executed: boolean,
  isDarkPool: boolean,
  isSelected: boolean
): string => {
  const classes: string[] = [baseClassName];
  if (isSelected) classes.push("selected");
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
  const [menu, setMenu] = useState<MenuSpec>({
    x: 0,
    y: 0,
    visible: false,
  });
  const ExecID: string | null = row !== null ? row.ExecID : null;
  useEffect(() => {
    if (ExecID === null) return;
    if (blotterType === BlotterTypes.Executions) {
      let timer: number | null = null;
      const onExecuted = () => {
        setExecuted(true);
        timer = setTimeout(() => {
          setExecuted(false);
        }, 10000);
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
        {column.render({ message: row, deal: row, store: props.insertStore })}
      </div>
    );
  };
  if (!row) {
    return (
      <div
        className={getClassFromRowType(
          "tr",
          props.type,
          executed,
          false,
          false
        )}
        id={"__INSERT_ROW__"}
        key={"__INSERT_ROW__"}
      >
        {columns.map(columnMapper("__INSERT_ROW__"))}
      </div>
    );
  }
  const isSelected: boolean =
    props.isSelected !== undefined && props.isSelected;
  const isDarkPool: boolean = row.ExDestination === DarkPool;
  const onClick = !!props.onClick ? () => props.onClick!(row) : undefined;
  const onContextMenu = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (props.contextMenu && isSelected) {
      setMenu({
        x: event.clientX,
        y: event.clientY,
        visible: true,
      });
    }
  };
  const hideMenu = () => setMenu({ x: 0, y: 0, visible: false });
  const getContextMenu = (): ReactElement | null => {
    const { contextMenu } = props;
    if (contextMenu) {
      return (
        <Menu
          open={menu.visible}
          onClose={hideMenu}
          onClick={hideMenu}
          anchorReference={"anchorPosition"}
          anchorPosition={{
            top: menu.y,
            left: menu.x,
          }}
        >
          {contextMenu.map((item: ContextMenuItem) => (
            <MenuItem onClick={item.action} key={item.label}>{item.label}</MenuItem>
          ))}
        </Menu>
      );
    } else {
      return null;
    }
  };
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={[
        getClassFromRowType("tr", props.type, executed, isDarkPool, isSelected),
        !!props.onClick ? "clickable" : "",
      ].join(" ")}
      id={row.id}
      key={row.id}
    >
      {columns.map(columnMapper(row.id))}
      {getContextMenu()}
    </div>
  );
};

export { Row };
