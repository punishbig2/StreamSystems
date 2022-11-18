import {
  getCurrencyValue,
  getRatesValue,
  getStrikeValue,
} from 'components/MiddleOffice/LegDetailsForm/LegDetailsFields/helpers/getValueHelpers';
import { Leg } from 'components/MiddleOffice/types/leg';
import { FieldDef } from 'forms/fieldDef';
import { MiddleOfficeStore } from 'mobx/stores/middleOfficeStore';
import { DealEntry, DealType } from 'types/dealEntry';
import { DealStatus, toBitwise } from 'types/dealStatus';
import { isStyledValue } from 'types/styledValue';
import { getStyledValue } from 'utils/legsUtils';

const fields: Array<FieldDef<Leg, any, DealEntry>> = [
  {
    type: 'text',
    color: 'grey',
    name: 'option',
    label: 'Option',
    editable: false /* This is grabbed from leg defs */,
  },
  {
    type: 'text',
    color: 'grey',
    name: 'side',
    label: 'Side',
    editable: false /* This is grabbed from leg defs */,
  },
  {
    type: 'text',
    color: 'grey',
    name: 'party',
    label: 'Party',
    editable: false /* This is grabbed from leg defs */,
  },
  {
    type: 'date',
    color: 'grey',
    name: 'expiryDate',
    label: 'Expiry Date',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
  {
    type: 'date',
    color: 'grey',
    name: 'deliveryDate',
    label: 'Delivery Date',
    editable: MiddleOfficeStore.createEditableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: 'number',
    color: 'grey',
    name: 'notional',
    label: 'Notional',
    precision: 0,
    editable: MiddleOfficeStore.createEditableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: 'strike',
    color: 'grey',
    name: 'strike',
    label: 'Strike',
    editable: MiddleOfficeStore.createEditableFilter(DealType.Voice | DealType.Manual),
    getValue(leg: Leg, entry: DealEntry): any {
      return getStrikeValue(leg, entry.symbol, this.name);
    },
  },
  {
    type: 'percent',
    color: 'grey',
    name: 'vol',
    label: 'Vol',
    precision: 3,
    editable: MiddleOfficeStore.createEditableFilter(DealType.Voice | DealType.Manual),
  },
  {
    type: 'number',
    color: 'grey',
    name: 'fwdPts',
    label: 'Fwd Pts',
    precision: 4,
    editable: MiddleOfficeStore.createEditableFilter(DealType.Voice | DealType.Manual),
  },
  {
    type: 'number',
    color: 'grey',
    name: 'fwdRate',
    label: 'Fwd Rate',
    precision: 4,
    editable: MiddleOfficeStore.createEditableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic,
      toBitwise(DealStatus.SEFComplete) | toBitwise(DealStatus.Pending)
    ),
  },
  {
    type: 'date',
    color: 'grey',
    name: 'premiumDate',
    label: 'Premium Date',
    editable: MiddleOfficeStore.createEditableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: 'currency',
    color: 'grey',
    name: 'premium',
    label: 'Premium',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    getValue(leg: Leg, entry: DealEntry): any {
      return getCurrencyValue(leg, this.name, entry.symbol, entry.premstyle);
    },
  },
  {
    type: 'percent',
    color: 'grey',
    name: 'price',
    label: 'Price %/Pips',
    precision: 5,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    getValue(leg: Leg, entry: DealEntry): any {
      const value = leg[this.name];

      if (!isStyledValue(value)) {
        throw new Error('cannot get styled value');
      } else {
        return { value: getStyledValue(value, entry.premstyle) };
      }
    },
  },
  {
    type: 'currency',
    color: 'grey',
    name: 'hedge',
    label: 'Hedge',
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    getValue(leg: Leg, entry: DealEntry): any {
      return getCurrencyValue(leg, this.name, entry.symbol, entry.deltastyle);
    },
  },
  {
    type: 'percent',
    color: 'grey',
    name: 'rates',
    label: 'CCY1 Depo',
    data: 0,
    precision: 4,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    getValue(leg: Leg): any {
      return getRatesValue(leg, this.data);
    },
  },
  {
    type: 'percent',
    color: 'grey',
    name: 'rates',
    label: 'CCY2 Depo',
    data: 1,
    precision: 4,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    getValue(leg: Leg): any {
      return getRatesValue(leg, this.data);
    },
  },
  {
    type: 'number',
    color: 'grey',
    name: 'delta',
    label: 'Delta',
    precision: 4,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
    getValue(leg: Leg, entry: DealEntry): any {
      const value = leg[this.name];
      if (!isStyledValue(value)) {
        throw new Error('unexpected styled value');
      }
      return { value: getStyledValue(value, entry.deltastyle) };
    },
  },
  {
    type: 'number',
    color: 'grey',
    name: 'usi_num',
    label: 'USI#',
    precision: 0,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
];

export default fields;
