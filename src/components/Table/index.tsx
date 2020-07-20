import { ColumnSpec } from "components/Table/columnSpecification";
import { Header } from "components/Table/Header";
import { VirtualScroll } from "components/VirtualScroll";
import React, {
  CSSProperties,
  ReactElement,
  useState,
  useMemo,
  useEffect,
} from "react";
import getStyles from "styles";
import { getOptimalWidthFromColumnsSpec } from "getOptimalWIdthFromColumnsSpec";
import { TableStore } from "mobx/stores/tableStore";
import { observer } from "mobx-react";
import { create } from "mobx-persist";
import persistStorage from "persistStorage";

interface Props {
  id: string;
  columns: ColumnSpec[];
  rows?: { [id: string]: any };
  scrollable: boolean;
  renderRow: (props: any, index?: number) => ReactElement | null;
  showInsertRow?: boolean;
  allowReorderColumns?: boolean;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: CSSProperties;
}

const BasicTable = (
  props: Props,
  ref: React.Ref<HTMLDivElement>
): ReactElement | null => {
  const [store] = useState<TableStore>(new TableStore(props.columns));
  const { rows: initialRows, columns: initialColumns, id } = props;
  const { rows, columns } = store;

  useEffect(() => {
    const hydrate = create({
      storage: persistStorage.tables,
      jsonify: true,
    });
    hydrate(id, store).then(() => {
      store.preFilterAndSort();
    });
  }, [store, id]);
  useEffect(() => {
    store.setRows(initialRows);
  }, [store, initialRows]);

  useEffect(() => {
    store.setInitialColumns(initialColumns);
  }, [store, initialColumns]);

  const [optimalWidth] = useState(getOptimalWidthFromColumnsSpec(columns));
  const style = useMemo(
    (): CSSProperties => ({ minWidth: `${optimalWidth}px`, ...props.style }),
    [optimalWidth, props.style]
  );
  if (!rows) return null; // FIXME: show "No data in this depth message"
  const entries: [string, any][] = Object.entries(rows);
  const totalWidth: number = columns.reduce(
    (total: number, column: ColumnSpec) => total + column.width,
    0
  );
  const propertyMapper = ([key, row]: [string, any]) => ({
    id: key,
    totalWidth: totalWidth,
    containerWidth: optimalWidth,
    key,
    columns,
    row,
  });

  const rowProps: { [key: string]: any }[] = entries.map(propertyMapper);

  const getBody = (rowProps: any) => {
    const rows = rowProps;
    if (rows.length === 0 && props.showInsertRow === false) {
      return (
        <div className={"empty-table"}>
          <h1>There's no data yet</h1>
        </div>
      );
    }

    if (props.scrollable) {
      const styles = getStyles();
      return (
        <VirtualScroll itemSize={styles.tableRowHeight} className={"tbody"}>
          {rows.map(props.renderRow)}
        </VirtualScroll>
      );
    } else {
      return <div className={"tbody"}>{rows.map(props.renderRow)}</div>;
    }
  };

  const getHeaders = () => {
    return (
      <Header
        columns={columns}
        allowReorderColumns={!!props.allowReorderColumns}
        totalWidth={totalWidth}
        containerWidth={optimalWidth}
        onSortBy={store.sortBy}
        onFiltered={store.filterBy}
        onColumnsOrderChange={store.updateColumnsOrder}
      />
    );
  };

  const classes: string[] = ["table"];
  if (props.className) classes.push(props.className);
  return (
    <div id={props.id} ref={ref} className={classes.join(" ")} style={style}>
      {getHeaders()}
      {getBody(rowProps)}
      <div className={"loading-banner"}>
        <div className={"spinner"} />
      </div>
    </div>
  );
};

export const Table: React.FC<Props> = observer(React.forwardRef(BasicTable));
Table.defaultProps = {
  allowReorderColumns: false,
  showInsertRow: false,
};
