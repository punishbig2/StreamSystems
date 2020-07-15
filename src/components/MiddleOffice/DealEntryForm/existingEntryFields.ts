import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { FieldDef, SelectItem } from "forms/fieldDef";
import { Symbol } from "interfaces/symbol";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import { InternalValuationModel, MoStore } from "mobx/stores/moStore";
import { DealEntry, DealType } from "structures/dealEntry";

const editableFilter = (types: number) => (
  data: any,
  store?: DealEntryStore
): boolean => {
  if (store === undefined) return false;
  const { entry } = store;
  if (entry.status === 5) return false;
  return (entry.dealType & types) !== 0;
};

const fields: FieldDef<DealEntry, MoStore, DealEntryStore>[] = [
  {
    name: "currencyPair",
    label: "CCYPair",
    type: "dropdown",
    color: "orange",
    editable: editableFilter(DealType.Voice | DealType.Manual),
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
    editable: editableFilter(DealType.Voice | DealType.Manual),
    transformData: (
      data: { [key: string]: MOStrategy },
      entry?: DealEntry
    ): SelectItem[] => {
      return Object.values(data)
        .filter((item: MOStrategy): boolean => {
          if (entry === undefined) return false;
          switch (entry.dealType) {
            case DealType.Invalid:
              return false;
            case DealType.Electronic:
              return item.source === "Electronic";
            case DealType.Voice:
              return item.source === "Voice";
            case DealType.Manual:
              return item.source === "Manual";
          }
          return false;
        })
        .map(
          (strategy: MOStrategy): SelectItem => ({
            value: strategy.name,
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
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
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
    editable: editableFilter(DealType.Voice | DealType.Manual),
    emptyValue: "N/A",
  },
  {
    name: "spread",
    label: "Spread",
    type: "number",
    placeholder: "0",
    color: "orange",
    editable: editableFilter(DealType.Voice | DealType.Manual),
    emptyValue: "N/A",
    precision: 2,
  },
  {
    name: "vol",
    label: "Vol",
    type: "percent",
    precision: 4,
    placeholder: "0",
    color: "orange",
    editable: editableFilter(DealType.Voice | DealType.Manual),
    emptyValue: "N/A",
  },
  {
    name: "notional",
    label: "Notional",
    type: "number",
    placeholder: "0",
    precision: 0,
    color: "orange",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    name: "legAdj",
    label: "Leg Adj",
    type: "dropdown",
    color: "orange",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
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
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
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
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
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
