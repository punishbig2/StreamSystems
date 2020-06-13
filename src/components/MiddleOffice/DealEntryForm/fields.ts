import { Symbol } from "interfaces/symbol";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { ValuationModel } from "components/MiddleOffice/interfaces/valuationModel";
import { FieldDef, SelectItem } from "forms/fieldDef";
import { DealEntry } from "structures/dealEntry";

const fields: FieldDef<DealEntry>[] = [
  {
    name: "currency",
    label: "CCYPair",
    type: "dropdown",
    color: "orange",
    editable: true,
    transformData: (array: Symbol[]): SelectItem[] =>
      array.map(
        (currency: Symbol): SelectItem => ({
          value: currency.name,
          label: currency.name,
        })
      ),
    dataSource: "currencies",
  },
  {
    name: "strategy",
    label: "Strategy",
    type: "dropdown",
    color: "orange",
    editable: true,
    transformData: (data: { [key: string]: MOStrategy }): SelectItem[] => {
      return Object.values(data).map(
        (strategy: MOStrategy): SelectItem => ({
          value: strategy.name,
          label: strategy.description,
        })
      );
    },
    dataSource: "strategies",
  },
  {
    name: "strike",
    label: "Strike",
    type: "text",
    placeholder: "0D",
    color: "orange",
    editable: true,
    emptyValue: "N/A",
  },
  {
    name: "spread",
    label: "Spread",
    type: "number",
    placeholder: "0",
    color: "orange",
    editable: true,
    emptyValue: "N/A",
    precision: 2,
  },
  {
    name: "vol",
    label: "Vol",
    type: "number",
    placeholder: "0",
    color: "orange",
    editable: false,
    emptyValue: "N/A",
  },
  {
    name: "notional",
    label: "Notional",
    type: "number",
    placeholder: "0",
    precision: 0,
    color: "orange",
    editable: true,
  },
  {
    name: "legAdj",
    label: "Leg Adj",
    type: "dropdown",
    color: "orange",
    editable: true,
    transformData: (): SelectItem[] => [
      {
        value: true,
        label: "TRUE",
      },
      {
        value: false,
        label: "FALSE",
      },
    ],
    dataSource: "",
  },
  {
    name: "buyer",
    label: "Buyer",
    type: "dropdown",
    color: "cream",
    editable: true,
    transformData: (list: string[]): SelectItem[] =>
      list.map(
        (name: string): SelectItem => ({
          value: name,
          label: name,
        })
      ),
    dataSource: "banks",
  },
  {
    name: "seller",
    label: "Seller",
    type: "dropdown",
    color: "cream",
    editable: true,
    transformData: (list: string[]): SelectItem[] =>
      list.map(
        (name: string): SelectItem => ({
          value: name,
          label: name,
        })
      ),
    dataSource: "banks",
  },
  {
    name: "legs",
    label: "Legs",
    type: "number",
    placeholder: "0",
    color: "green",
    editable: false,
  },
  {
    name: "tradeDate",
    label: "Trade Date",
    type: "date",
    color: "green",
    editable: false,
  },
  {
    name: "tradeDate",
    label: "Timestamp",
    type: "time",
    color: "green",
    editable: false,
  },
  {
    name: "dealId",
    label: "Deal Id",
    type: "text",
    color: "green",
    editable: false,
  },
  {
    name: "status",
    label: "Status",
    type: "text",
    color: "green",
    editable: false,
  },
  {
    name: "style",
    label: "Style",
    type: "dropdown",
    color: "green",
    editable: false,
    transformData: (list: string[]): SelectItem[] =>
      list.map(
        (name: string): SelectItem => ({
          value: name,
          label: name,
        })
      ),
    dataSource: "styles",
  },
  {
    name: "model",
    label: "Model",
    type: "dropdown",
    color: "green",
    editable: false,
    transformData: (list: ValuationModel[]): SelectItem[] =>
      list.map(
        (model: ValuationModel): SelectItem => ({
          value: model.ValuationModelID,
          label: model.OptionModelDesc,
        })
      ),
    dataSource: "models",
  },
];

export default fields;
