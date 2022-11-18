import { FieldDef } from 'forms/fieldDef';
import { MiddleOfficeStore } from 'mobx/stores/middleOfficeStore';
import { BrokerageCommission } from 'types/brokerageCommission';
import { DealType } from 'types/dealEntry';

export const fields: ReadonlyArray<FieldDef<BrokerageCommission, BrokerageCommission>> = [
  {
    label: 'Buyer Brokerage Rate',
    color: 'grey',
    name: 'buyer_comm_rate',
    type: 'number',
    precision: 2,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
  {
    label: 'Seller Brokerage Rate',
    color: 'grey',
    name: 'seller_comm_rate',
    type: 'number',
    precision: 2,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
  {
    label: 'Buyer Commission',
    color: 'grey',
    name: 'buyer_comm',
    type: 'currency',
    precision: 2,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
  {
    label: 'Seller Commission',
    color: 'grey',
    name: 'seller_comm',
    type: 'currency',
    precision: 2,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
  {
    label: 'Total Commission',
    color: 'grey',
    name: 'total',
    type: 'currency',
    precision: 2,
    editable: MiddleOfficeStore.createEditableFilter(DealType.All),
  },
];
