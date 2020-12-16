import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import { DropdownItem, FieldDef } from "forms/fieldDef";
import { InternalValuationModel, MoStore } from "mobx/stores/moStore";
import { DealEntry, DealType, EntryType } from "structures/dealEntry";
import { LegAdjustValue, UndefinedLegAdjustValue } from "types/legAdjustValue";
import { Symbol } from "types/symbol";

const fields: ReadonlyArray<FieldDef<DealEntry, DealEntry, MoStore>> = [
  {
    name: "symbol",
    label: "CCYPair",
    type: "dropdown",
    color: "orange",
    editable: MoStore.createEditableFilter(DealType.Voice | DealType.Manual),
    transformData: (array: Symbol[]): DropdownItem<Symbol>[] =>
      array.map(
        (symbol: Symbol): DropdownItem<Symbol> => ({
          value: symbol.symbolID,
          internalValue: Object.assign({}, symbol),
          label: symbol.description,
        })
      ),
    dataSource: "symbols",
  },
  {
    name: "strategy",
    label: "Strategy",
    type: "dropdown",
    color: "orange",
    editable: MoStore.createEditableFilter(DealType.Voice | DealType.Manual),
    transformData: (
      data: { [key: string]: MOStrategy },
      entry?: DealEntry
    ): DropdownItem<MOStrategy>[] => {
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
            case DealType.Cloned:
              // We don't care, it's not editable anyway
              return true;
          }
          return false;
        })
        .map(
          (strategy: MOStrategy): DropdownItem<MOStrategy> => ({
            value: strategy.productid,
            internalValue: Object.assign({}, strategy),
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
    editable: MoStore.createEditableFilter(DealType.All),
    transformData: (data: string[]): DropdownItem[] => {
      return data.map(
        (tenor: string): DropdownItem => ({
          value: tenor,
          internalValue: tenor,
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
    editable: MoStore.createEditableFilter(DealType.All),
    transformData: (data: string[]): DropdownItem[] => {
      return data.map(
        (tenor: string): DropdownItem => ({
          value: tenor,
          internalValue: tenor,
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
    editable: MoStore.createEditableFilter(DealType.Voice | DealType.Manual),
  },
  {
    name: "vol",
    label: "Vol",
    type: "percent",
    precision: 3,
    placeholder: "0",
    color: "orange",
    editable: MoStore.createEditableFilter(
      DealType.Voice | DealType.Manual,
      0,
      (entry: DealEntry): boolean => {
        const { strategy } = entry;
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
    type: "percent",
    placeholder: "0",
    color: "orange",
    editable: MoStore.createEditableFilter(
      DealType.Voice | DealType.Manual,
      0,
      (entry: DealEntry): boolean => {
        const { strategy } = entry;
        if (strategy === undefined) return false;
        return (
          strategy.spreadvsvol === "spread" || strategy.spreadvsvol === "both"
        );
      }
    ),
    emptyValue: "N/A",
    precision: 3,
  },
  {
    name: "not1",
    label: "Notional 1",
    type: "number",
    placeholder: "0",
    precision: 0,
    color: "orange",
    minimum: 100000,
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    name: "not2",
    label: "Notional 2",
    type: "number",
    placeholder: "0",
    precision: 0,
    color: "orange",
    minimum: 100000,
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    name: "legadj",
    label: "Leg Adj",
    type: "dropdown",
    color: "orange",
    editable: MoStore.createEditableFilter(DealType.All),
    transformData: (): ReadonlyArray<DropdownItem<LegAdjustValue>> => [
      {
        value: "bsVega",
        internalValue: "bsVega",
        label: "bsVega",
      },
      {
        value: "stickyVega",
        internalValue: "stickyVega",
        label: "stickyVega",
      },
      {
        value: UndefinedLegAdjustValue,
        internalValue: UndefinedLegAdjustValue,
        label: "N/A",
      },
    ],
  },
  {
    name: "premstyle",
    label: "Premium Style",
    type: "dropdown",
    transformData: (list: string[]): DropdownItem[] => {
      return list.map(
        (item: string): DropdownItem => ({
          value: item,
          internalValue: item,
          label: item,
        })
      );
    },
    dataSource: "premiumStyles",
    color: "orange",
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    name: "deltastyle",
    label: "Delta Style",
    type: "dropdown",
    transformData: (list: string[]): DropdownItem[] => {
      return list.map(
        (item: string): DropdownItem => ({
          value: item,
          internalValue: item,
          label: item,
        })
      );
    },
    dataSource: "deltaStyles",
    color: "orange",
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    name: "buyer",
    label: "Buyer",
    type: "bank-entity",
    color: "cream",
    editable: true,
    transformData: (list: string[]): DropdownItem[] =>
      list.map(
        (name: string): DropdownItem => ({
          value: name,
          internalValue: name,
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
    editable: true,
    transformData: (list: string[]): DropdownItem[] =>
      list.map(
        (name: string): DropdownItem => ({
          value: name,
          internalValue: name,
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
    name: "dealID",
    label: "Deal Id",
    type: "text",
    color: "green",
    editable: false,
  },
  {
    name: "style",
    label: "Style",
    type: "dropdown",
    color: "green",
    editable: MoStore.createEditableFilter(DealType.All),
    transformData: (list: string[]): DropdownItem[] =>
      list.map(
        (name: string): DropdownItem => ({
          value: name,
          internalValue: name,
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
    editable: MoStore.createEditableFilter(DealType.All),
    transformData: (list: InternalValuationModel[]): DropdownItem<number>[] =>
      list.map(
        (model: InternalValuationModel): DropdownItem<number> => ({
          value: model.ValuationModelID,
          internalValue: model.ValuationModelID,
          label: model.OptionModelDesc,
        })
      ),
    dataSource: "models",
  },
  {
    name: "status",
    label: "Status",
    type: "text",
    color: "green",
    editable: false,
  },
  {
    name: "sef_namespace",
    label: "SEF Namespace",
    type: "text",
    color: "orange",
    editable: false,
  },
];

export default fields;
