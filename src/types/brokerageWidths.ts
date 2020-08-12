export interface Width<T = "gold" | "silver" | "bronze"> {
  type: T;
  value: number;
}
export type BrokerageWidths = [Width<"gold">?, Width<"silver">?, Width<"bronze">?];
