import { Column, ColumnType } from "components/Table/Column";
import { ColumnState } from "components/Table/columnSpecification";
import React, { useState, ReactElement, useRef } from "react";
import { getCellWidth } from "components/Table/helpers";
import { observer } from "mobx-react";
import { HeaderStore } from "mobx/stores/headerStore";

interface Props {
  columns: ColumnState[];
  totalWidth: number;
  allowReorderColumns: boolean;
  containerWidth: number;
  onFiltered: (column: string, value: string) => void;
  onSortBy: (columnName: string) => void;
  onColumnsOrderChange: (sourceIndex: number, targetIndex: number) => void;
}

export const Header: <T extends unknown>(props: Props) => any = observer(
  <T extends unknown>(props: Props) => {
    const { columns } = props;
    const [store] = useState<HeaderStore>(new HeaderStore());

    const {
      state: grabbedColumn,
      style: grabbedColumnStyle,
    } = store.movingColumn || { state: null };

    const headerRef: React.Ref<HTMLDivElement> = useRef<HTMLDivElement>(null);

    const onColumnGrabbed = (
      column: ColumnState,
      element: HTMLDivElement,
      grabbedAt: number
    ) => {
      store.setGrabbedColumn(
        column,
        element,
        grabbedAt,
        props.onColumnsOrderChange
      );
    };

    const columnMapperFactory = (
      totalWidth: number,
      containerWidth: number
    ) => (column: ColumnState) => {
      return (
        <Column
          key={column.name}
          name={column.name}
          filterable={column.filterable}
          movable={props.allowReorderColumns}
          sortable={column.sortable}
          sortOrder={column.sortOrder}
          width={getCellWidth(column.width, totalWidth, containerWidth)}
          type={ColumnType.Real}
          onGrabbed={(element: HTMLDivElement, grabbedAt: number) =>
            onColumnGrabbed(column, element, grabbedAt)
          }
          onFiltered={(keyword: string) =>
            props.onFiltered(column.name, keyword)
          }
          onSorted={props.onSortBy}
        >
          {column.header(props)}
        </Column>
      );
    };
    const grabbedColumnElement: ReactElement | undefined = grabbedColumn ? (
      <Column
        key={grabbedColumn.name + "moving"}
        name={grabbedColumn.name}
        filterable={grabbedColumn.filterable}
        movable={props.allowReorderColumns}
        sortable={grabbedColumn.sortable}
        sortOrder={grabbedColumn.sortOrder}
        style={grabbedColumnStyle}
        width={getCellWidth(
          grabbedColumn.width,
          props.totalWidth,
          props.containerWidth
        )}
        type={ColumnType.Fake}
        onGrabbed={() => null}
        onSorted={() => null}
        onFiltered={() => null}
      >
        {grabbedColumn.header(props)}
      </Column>
    ) : undefined;
    const columnMapper = columnMapperFactory(
      props.totalWidth,
      props.containerWidth
    );
    const renderedColumns: ReactElement[] = columns.map(columnMapper);
    if (grabbedColumnElement) renderedColumns.push(grabbedColumnElement);
    return (
      <div
        className={"thead" + (grabbedColumn !== null ? " column-moving" : "")}
        ref={headerRef}
      >
        <div className={"tr"}>{renderedColumns}</div>
      </div>
    );
  }
);
