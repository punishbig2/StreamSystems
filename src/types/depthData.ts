import { TableColumn } from "components/Table/tableColumn";
import { PodTable } from "types/podTable";

export interface DepthData {
  readonly rows: PodTable;
  readonly columns: ReadonlyArray<TableColumn>;
}
