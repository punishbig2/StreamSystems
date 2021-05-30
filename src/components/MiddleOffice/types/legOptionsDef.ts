export interface LegOptionsDefOut {
  productid: string;
  ReturnLegOut: string;
  ReturnSide: string;
  notional_ratio: number;
}

export interface LegOptionsDefIn {
  productid: string;
  OptionLegType: string;
  SideType: string;
  notional_ratio: number;
}
