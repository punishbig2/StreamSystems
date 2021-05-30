import { Column, ColumnType } from "components/Table/Column";
import { TableColumnState } from "components/Table/tableColumn";
import { getCellWidth } from "components/Table/helpers";
import { observer } from "mobx-react";
import { HeaderStore } from "mobx/stores/headerStore";
import React from "react";
import { toClassName } from "utils/conditionalClasses";

interface Props {
  readonly columns: ReadonlyArray<TableColumnState>;
  readonly totalWidth: number;
  readonly allowReorderColumns: boolean;
  readonly containerWidth: number;
  readonly onFiltered?: (column: string, value: string) => void;
  readonly onSortBy?: (columnName: string) => void;
  readonly onColumnsOrderChange?: (
    sourceIndex: number,
    targetIndex: number
  ) => void;
}

export const TableHeader: React.FC<Props> = observer(
  <T extends unknown>(props: Props) => {
    const { columns } = props;
    const [store] = React.useState<HeaderStore>(new HeaderStore());

    const {
      state: grabbedColumn,
      style: grabbedColumnStyle,
    } = store.movingColumn || { state: null };

    const headerRef: React.Ref<HTMLDivElement> = React.useRef<HTMLDivElement>(
      null
    );

    const onColumnGrabbed = (
      column: TableColumnState,
      element: HTMLDivElement,
      grabbedAt: number
    ) => {
      const onChange = props.onColumnsOrderChange;
      store.setGrabbedColumn(column, element, grabbedAt, onChange);
    };

    const columnMapperFactory = (totalWidth: number) => (
      column: TableColumnState
    ) => {
      return (
        <Column
          key={column.name}
          name={column.name}
          filterable={column.filterable}
          movable={props.allowReorderColumns}
          sortable={column.sortable}
          sortOrder={column.sortOrder}
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
          onSorted={props.onSortBy}
        >
          {column.header(props)}
        </Column>
      );
    };
    const grabbedColumnElement:
      | React.ReactElement
      | undefined = grabbedColumn ? (
      <Column
        key={grabbedColumn.name + "moving"}
        name={grabbedColumn.name}
        filterable={grabbedColumn.filterable}
        movable={props.allowReorderColumns}
        sortable={grabbedColumn.sortable}
        sortOrder={grabbedColumn.sortOrder}
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
    const renderedColumns: Array<React.ReactElement> = columns.map(
      columnMapper
    );
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
