import { ReactElement } from "react";
import { SortDirection } from "types/sortDirection";

export interface TableColumn {
  readonly name: string;
  readonly sortable?: boolean;
  readonly filterable?: boolean;
  readonly header: (props: any) => ReactElement | string | null;
  readonly render: (props: any) => ReactElement | string | null;
  readonly span?: number;
  readonly width: number;
  readonly filterByKeyword?: (v1: any, keyword: string) => boolean;
  readonly difference?: (v1: any, v2: any) => number;
  readonly template: string;
  readonly className?: string;
}

export interface ExtendedTableColumn extends TableColumn {
  readonly sortDirection: SortDirection;
  readonly filter: string;
}
