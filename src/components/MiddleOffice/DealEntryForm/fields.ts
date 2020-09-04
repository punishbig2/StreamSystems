import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { FieldDef, SelectItem } from "forms/fieldDef";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { InternalValuationModel, MoStore } from "mobx/stores/moStore";
import { DealEntry, DealType, EntryType } from "structures/dealEntry";
import { Symbol } from "types/symbol";

const editableFilter = (
  types: number,
  other?: (entry: DealEntry) => boolean
) => (data: any, store?: DealEntryStore): boolean => {
  if (store === undefined) return false;
  const { entry } = store;
  if (entry.status === 5) return false;
  if (other !== undefined && !other(entry)) return false;
  return (entry.dealType & types) !== 0;
};

const fields: ReadonlyArray<FieldDef<DealEntry, MoStore, DealEntryStore>> = [
  {
    name: "ccypair",
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
          if (entry.type === EntryType.New) return item.source !== "Electronic";
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
            value: strategy.productid,
            label: strategy.description,
          })
        );
    },
    dataSource: "strategies",
  },
  {
    name: "tenor1",
    label: "Tenor 1",
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
    name: "tenor2",
    label: "Tenor 2",
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
    name: "dealstrike",
    label: "Strike",
    type: "strike",
    placeholder: "0D",
    color: "orange",
    editable: editableFilter(DealType.Voice | DealType.Manual),
    emptyValue: "N/A",
  },
  {
    name: "vol",
    label: "Vol",
    type: "percent",
    precision: 4,
    placeholder: "0",
    color: "orange",
    editable: editableFilter(
      DealType.Voice | DealType.Manual,
      (entry: DealEntry): boolean => {
        const strategy: MOStrategy = moStore.getStrategyById(entry.strategy);
        if (strategy === undefined) return false;
        return (
          strategy.spreadvsvol === "vol" || strategy.spreadvsvol === "both"
        );
      }
    ),
    emptyValue: "N/A",
  },
  {
    name: "spread",
    label: "Spread",
    type: "number",
    placeholder: "0",
    color: "orange",
    editable: editableFilter(
      DealType.Voice | DealType.Manual,
      (entry: DealEntry): boolean => {
        const strategy: MOStrategy = moStore.getStrategyById(entry.strategy);
        if (strategy === undefined) return false;
        return (
          strategy.spreadvsvol === "spread" || strategy.spreadvsvol === "both"
        );
      }
    ),
    emptyValue: "N/A",
    precision: 2,
  },
  {
    name: "not1",
    label: "Notional 1",
    type: "number",
    placeholder: "0",
    precision: 0,
    color: "orange",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    name: "not2",
    label: "Notional 2",
    type: "number",
    placeholder: "0",
    precision: 0,
    color: "orange",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    name: "legadj",
    label: "Leg Adj",
    type: "dropdown",
    color: "orange",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
    transformData: (): SelectItem[] => [
      {
        value: "true",
        label: "TRUE",
      },
      {
        value: "false",
        label: "FALSE",
      },
      {
        value: "N/A",
        label: "N/A",
      },
    ],
  },
  {
    name: "premstyle",
    label: "Premium Style",
    type: "dropdown",
    transformData: (list: string[]): SelectItem[] => {
      return list.map((item: string): { value: string; label: string } => ({
        value: item,
        label: item,
      }));
    },
    dataSource: "premiumStyles",
    color: "orange",
    editable: true,
  },
  {
    name: "deltastyle",
    label: "Delta Style",
    type: "dropdown",
    transformData: (list: string[]): SelectItem[] => {
      return list.map((item: string): { value: string; label: string } => ({
        value: item,
        label: item,
      }));
    },
    dataSource: "deltaStyles",
    color: "orange",
    editable: true,
  },
  {
    name: "buyer",
    label: "Buyer",
    type: "bank-entity",
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
    type: "bank-entity",
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
