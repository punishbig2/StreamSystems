import { Geometry } from "@cib/windows-manager";

export interface ExecutionBlotterState {
  readonly isNew: boolean;
  readonly lastGeometry: Geometry;
}
