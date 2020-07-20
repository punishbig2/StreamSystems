import { StrikeHandler } from "components/FormField/strike";
import {
  MOStrategy,
  ProductSource,
} from "components/MiddleOffice/interfaces/moStrategy";
import { FieldDef, SelectItem } from "forms/fieldDef";
import { Symbol } from "interfaces/symbol";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import { InternalValuationModel, MoStore } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";

const editableIfSpreadVsVolIs = (spreadvsvol: string) => (
  data: { [key: string]: MOStrategy },
  store?: DealEntryStore
): boolean => {
  if (store === undefined) return false;
  const { entry } = store;
  if (!entry) return true;
  const strategy: MOStrategy | undefined = data[entry.strategy];
  if (strategy === undefined) return false;
  return strategy.spreadvsvol === spreadvsvol;
};

const fields: FieldDef<DealEntry, MoStore, DealEntryStore>[] = [
  {
    name: "currencyPair",
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
    dataSource: "symbols",
  },
  {
    name: "strategy",
    label: "Strategy",
    type: "dropdown",
    color: "orange",
    editable: true,
    transformData: (data: { [key: string]: MOStrategy }): SelectItem[] => {
      return Object.values(data)
        .filter((item: MOStrategy) => item.source !== ProductSource.Electronic)
        .map(
          (strategy: MOStrategy): SelectItem => ({
            value: strategy.productid,
            label: strategy.description,
          })
        );
    },
    dataSource: "strategies",
  },
  {
    name: "tenor",
    label: "Tenor",
    type: "tenor",
    color: "orange",
    editable: true,
    transformData: (data: string[]): SelectItem[] => {
      return data.map(
        (tenor: string): SelectItem => ({
          value: tenor,
          label: tenor,
        })
      );
    },
    dataSource: "tenors",
  },
  {
    name: "strike",
    label: "Strike",
    type: "text",
    placeholder: "0D",
    color: "orange",
    editable: true,
    emptyValue: "N/A",
    handler: new StrikeHandler(),
  },
  {
    name: "spread",
    label: "Spread",
    type: "number",
    placeholder: "0",
    color: "orange",
    editable: editableIfSpreadVsVolIs("spread"),
    transformData: (data: { [key: string]: MOStrategy }): any => {
      return data;
    },
    dataSource: "strategies",
    emptyValue: "N/A",
    precision: 2,
  },
  {
    name: "vol",
    label: "Vol",
    type: "number",
    precision: 4,
    placeholder: "0",
    color: "orange",
    editable: editableIfSpreadVsVolIs("vol"),
    transformData: (data: { [key: string]: MOStrategy }): any => {
      return data;
    },
    dataSource: "strategies",
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
    editable: false,
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
    type: "current:date",
    color: "green",
    editable: false,
  },
  {
    name: "tradeDate",
    label: "Timestamp",
    type: "current:time",
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
    editable: true,
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
    editable: true,
    transformData: (list: InternalValuationModel[]): SelectItem[] =>
      list.map(
        (model: InternalValuationModel): SelectItem => ({
          value: model.ValuationModelID,
          label: model.OptionModelDesc,
        })
      ),
    dataSource: "models",
  },
];

export default fields;
