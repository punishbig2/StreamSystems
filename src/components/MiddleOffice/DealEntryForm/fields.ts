import { DropdownItem, FieldDef } from 'forms/fieldDef';
import { InternalValuationModel, MiddleOfficeStore } from 'mobx/stores/middleOfficeStore';
import { DealEntry, DealType, EntryType } from 'types/dealEntry';
import { FXSymbol } from 'types/FXSymbol';
import { LegAdjustValue } from 'types/legAdjustValue';
import { Product } from 'types/product';
import { User } from 'types/user';

const fields: ReadonlyArray<FieldDef<DealEntry, DealEntry, MiddleOfficeStore>> = [
  {
    name: 'symbol',
    label: 'CCYPair',
    type: 'dropdown',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(DealType.Voice | DealType.Manual),
    transformData: (array: FXSymbol[]): Array<DropdownItem<FXSymbol>> =>
      array.map(
        (symbol: FXSymbol): DropdownItem<FXSymbol> => ({
          value: symbol.symbolID,
          internalValue: Object.assign({}, symbol),
          label: symbol.description,
        })
      ),
    dataSource: 'symbols',
  },
  {
    name: 'strategy',
    label: 'Strategy',
    type: 'dropdown',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(DealType.Voice | DealType.Manual),
    transformData: (
      data: { [key: string]: Product },
      entry?: DealEntry
    ): Array<DropdownItem<Product>> => {
      return Object.values(data)
        .filter((item: Product): boolean => {
          if (entry === undefined) return false;
          if (entry.type === EntryType.New) return item.source !== 'Electronic';
          switch (entry.dealType) {
            case DealType.Invalid:
              return false;
            case DealType.Electronic:
              return item.source === 'Electronic';
            case DealType.Voice:
              return item.source === 'Voice';
            case DealType.Manual:
              return item.source === 'Manual';
            case DealType.Cloned:
              // We don't care, it's not editable anyway
              return true;
          }
          return false;
        })
        .map(
          (strategy: Product): DropdownItem<Product> => ({
            value: strategy.productid,
            internalValue: Object.assign({}, strategy),
            label: strategy.description,
          })
        );
    },
    dataSource: 'strategies',
  },
  {
    name: 'tenor1',
    label: 'Tenor 1',
    type: 'tenor',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    transformData: (data: string[]): readonly DropdownItem[] => {
      return data.map(
        (tenor: string): DropdownItem => ({
          value: tenor,
          internalValue: tenor,
          label: tenor,
        })
      );
    },
    dataSource: 'tenors',
  },
  {
    name: 'tenor2',
    label: 'Tenor 2',
    type: 'tenor',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    transformData: (data: string[]): readonly DropdownItem[] => {
      return data.map(
        (tenor: string): DropdownItem => ({
          value: tenor,
          internalValue: tenor,
          label: tenor,
        })
      );
    },
    dataSource: 'tenors',
  },
  {
    name: 'dealstrike',
    label: 'Strike',
    type: 'strike',
    placeholder: '0D',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(DealType.Voice | DealType.Manual),
  },
  {
    name: 'vol',
    label: 'Vol',
    type: 'percent',
    precision: 3,
    placeholder: '0',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(
      DealType.Voice | DealType.Manual,
      0,
      (entry: DealEntry): boolean => {
        const { strategy } = entry;
        if (strategy === undefined) return false;
        return strategy.spreadvsvol === 'vol' || strategy.spreadvsvol === 'both';
      }
    ),
    emptyValue: 'N/A',
  },
  {
    name: 'spread',
    label: 'Spread',
    type: 'percent',
    placeholder: '0',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(
      DealType.Voice | DealType.Manual,
      0,
      (entry: DealEntry): boolean => {
        const { strategy } = entry;
        if (strategy === undefined) return false;
        return strategy.spreadvsvol === 'spread' || strategy.spreadvsvol === 'both';
      }
    ),
    emptyValue: 'N/A',
    precision: 3,
  },
  {
    name: 'not1',
    label: 'Notional 1',
    type: 'number',
    placeholder: '0',
    precision: 0,
    color: 'orange',
    minimum: (store: MiddleOfficeStore): number => store.minimumNotional,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
  {
    name: 'not2',
    label: 'Notional 2',
    type: 'number',
    placeholder: '0',
    precision: 0,
    color: 'orange',
    minimum: (store: MiddleOfficeStore): number => store.minimumNotional,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
  {
    name: 'legadj',
    dataSource: 'legAdjustValues',
    label: 'Leg Adj',
    type: 'dropdown',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    transformData: (
      list: readonly LegAdjustValue[]
    ): ReadonlyArray<DropdownItem<LegAdjustValue>> => {
      if (list === null) {
        return [];
      }
      return list.map((value: LegAdjustValue): any => ({
        value: value.VegaLegAdjustValue,
        internalValue: value.VegaLegAdjustValue,
        label: value.VegaLegAdjustValue + (value.defaultvalue ? '*' : ''),
      }));
    },
  },
  {
    name: 'premstyle',
    label: 'Premium Style',
    type: 'dropdown',
    transformData: (list: readonly string[]): readonly DropdownItem[] => {
      return list.map(
        (item: string): DropdownItem => ({
          value: item,
          internalValue: item,
          label: item,
        })
      );
    },
    dataSource: 'premiumStyles',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
  {
    name: 'deltastyle',
    label: 'Delta Style',
    type: 'dropdown',
    transformData: (list: readonly string[]): readonly DropdownItem[] => {
      return list.map(
        (item: string): DropdownItem => ({
          value: item,
          internalValue: item,
          label: item,
        })
      );
    },
    dataSource: 'deltaStyles',
    color: 'orange',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
  {
    name: 'buyer',
    label: 'Buyer',
    type: 'bank-entity',
    color: 'cream',
    editable: true,
    transformData: (list: readonly string[]): readonly DropdownItem[] =>
      list.map(
        (name: string): DropdownItem => ({
          value: name,
          internalValue: name,
          label: name,
        })
      ),
    dataSource: 'banks',
  },
  {
    name: 'buyer_useremail',
    label: 'Buyer (User)',
    type: 'dropdown',
    color: 'orange',
    editable: true,
    transformData: (items: readonly User[]): readonly DropdownItem[] => {
      return items.map(
        (user: User): DropdownItem => ({
          value: user.email,
          internalValue: user.email,
          label: user.email,
        })
      );
    },
    dataSource: 'buyers',
  },
  {
    name: 'seller',
    label: 'Seller',
    type: 'bank-entity',
    color: 'cream',
    editable: true,
    transformData: (list: readonly User[]): readonly DropdownItem[] =>
      list.map(
        (user: User): DropdownItem => ({
          value: user.email,
          internalValue: user.email,
          label: user.firstname + ' ' + user.lastname,
        })
      ),
    dataSource: 'banks',
  },
  {
    name: 'seller_useremail',
    label: 'Seller (User)',
    type: 'dropdown',
    color: 'orange',
    editable: true,
    transformData: (items: readonly User[]): readonly DropdownItem[] => {
      return items.map(
        (user: User): DropdownItem => ({
          value: user.email,
          internalValue: user.email,
          label: user.email,
        })
      );
    },
    dataSource: 'sellers',
  },
  {
    name: 'legs',
    label: 'Legs',
    type: 'number',
    placeholder: '0',
    color: 'green',
    editable: false,
  },
  {
    name: 'tradeDate',
    label: 'Trade Date',
    type: 'date',
    color: 'green',
    editable: false,
  },
  {
    name: 'tradeDate',
    label: 'Timestamp',
    type: 'time',
    color: 'green',
    editable: false,
  },
  {
    name: 'dealID',
    label: 'Deal Id',
    type: 'text',
    color: 'green',
    editable: false,
  },
  {
    name: 'style',
    label: 'Style',
    type: 'dropdown',
    color: 'green',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    transformData: (list: string[]): readonly DropdownItem[] =>
      list.map(
        (name: string): DropdownItem => ({
          value: name,
          internalValue: name,
          label: name,
        })
      ),
    dataSource: 'styles',
  },
  {
    name: 'model',
    label: 'Model',
    type: 'dropdown',
    color: 'green',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    transformData: (list: InternalValuationModel[]): Array<DropdownItem<number>> =>
      list.map(
        (model: InternalValuationModel): DropdownItem<number> => ({
          value: model.ValuationModelID,
          internalValue: model.ValuationModelID,
          label: model.OptionModelDesc,
        })
      ),
    dataSource: 'models',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'text',
    color: 'green',
    editable: false,
    tooltip: (store: MiddleOfficeStore): string | null => {
      const { entry } = store;
      if (!entry) return null;
      return entry.errorMsg;
    },
    tooltipStyle: 'bad',
  },
  {
    name: 'sef_namespace',
    label: 'SEF LEI',
    type: 'text',
    color: 'orange',
    editable: false,
  },
  {
    name: 'sef_dealid',
    label: 'SEF Deal ID',
    type: 'text',
    color: 'orange',
    editable: false,
  },
];

export default fields;
