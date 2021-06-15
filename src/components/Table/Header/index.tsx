import { Column, ColumnType } from "components/Table/Column";
import { getCellWidth } from "components/Table/helpers";
import { TableColumn } from "components/Table/tableColumn";
import { observer } from "mobx-react";
import { HeaderStore } from "mobx/stores/headerStore";
import React from "react";
import { SortDirection } from "types/sortDirection";
import { toClassName } from "utils/conditionalClasses";

interface Props {
  readonly columns: ReadonlyArray<TableColumn>;
  readonly totalWidth: number;
  readonly allowReorderColumns: boolean;
  readonly containerWidth: number;
  readonly onFiltered?: (column: string, value: string) => void;
  readonly onSortBy?: (columnName: string, order: SortDirection) => void;
  readonly onColumnsOrderChange?: (
    sourceIndex: number,
    targetIndex: number
  ) => void;
}

export const TableHeader: React.FC<Props> = observer(
  <T extends unknown>(props: Props) => {
    const { columns } = props;
    const [store] = React.useState<HeaderStore>(new HeaderStore());

    const { state: grabbedColumn, style: grabbedColumnStyle } =
      store.movingColumn || { state: null };
    const [sortOrder, setSortOrder] = React.useState<{
      [key: string]: SortDirection;
    }>({});

    const headerRef: React.Ref<HTMLDivElement> =
      React.useRef<HTMLDivElement>(null);

    const onColumnGrabbed = (
      column: TableColumn,
      element: HTMLDivElement,
      grabbedAt: number
    ) => {
      const onChange = props.onColumnsOrderChange;
      store.setGrabbedColumn(column, element, grabbedAt, onChange);
    };

    const onSorted = (name: string): void => {
      const newSortOrder = ((): SortDirection => {
        switch (sortOrder[name]) {
          case SortDirection.None:
          case undefined:
            return SortDirection.Ascending;
          case SortDirection.Ascending:
            return SortDirection.Descending;
          case SortDirection.Descending:
            return SortDirection.None;
        }
      })();
      if (props.onSortBy !== undefined) {
        props.onSortBy(name, newSortOrder);
      }
      setSortOrder({ ...sortOrder, [name]: newSortOrder });
    };

    const getSortDirection = React.useCallback(
      (name: string): SortDirection => sortOrder[name] ?? SortDirection.None,
      [sortOrder]
    );

    const columnMapperFactory =
      (totalWidth: number) => (column: TableColumn) => {
        return (
          <Column
            key={column.name}
            name={column.name}
            filterable={column.filterable}
            movable={props.allowReorderColumns}
            sortable={column.sortable}
            sortDirection={getSortDirection(column.name)}
            width={getCellWidth(column.width, totalWidth)}
            type={ColumnType.Real}
            onGrabbed={(element: HTMLDivElement, grabbedAt: number) =>
              onColumnGrabbed(column, element, grabbedAt)
            }
            onFiltered={(keyword: string) => {
              if (props.onFiltered !== undefined) {
                props.onFiltered(column.name, keyword);
              }
            }}
            onSorted={onSorted}
          >
            {column.header(props)}
          </Column>
        );
      };
    const grabbedColumnElement: React.ReactElement | undefined =
      grabbedColumn ? (
        <Column
          key={grabbedColumn.name + "moving"}
          name={grabbedColumn.name}
          filterable={grabbedColumn.filterable}
          movable={props.allowReorderColumns}
          sortable={grabbedColumn.sortable}
          style={grabbedColumnStyle}
          width={getCellWidth(grabbedColumn.width, props.totalWidth)}
          type={ColumnType.Fake}
          onGrabbed={() => null}
          onSorted={() => null}
          onFiltered={() => null}
        >
          {grabbedColumn.header(props)}
        </Column>
      ) : undefined;
    const columnMapper = columnMapperFactory(props.totalWidth);
    const renderedColumns: Array<React.ReactElement> =
      columns.map(columnMapper);
    if (grabbedColumnElement) renderedColumns.push(grabbedColumnElement);
    return (
      <div
        className={toClassName("thead", {
          "column-moving": grabbedColumn !== null,
        })}
        ref={headerRef}
      >
        <div className={"tr"}>{renderedColumns}</div>
      </div>
    );
  }
);
