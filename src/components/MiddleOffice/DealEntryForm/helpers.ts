import { BankEntitiesQueryResponse } from 'API';
import { FieldDef } from 'forms/fieldDef';
import { MiddleOfficeStore } from 'mobx/stores/middleOfficeStore';
import { DealEntry } from 'types/dealEntry';
import { DealStatus } from 'types/dealStatus';
import { EditableFlag } from 'types/product';
import { resolveBankToEntity, stateMap } from 'utils/dealUtils';

export const getValue = (
  field: FieldDef<DealEntry, DealEntry, MiddleOfficeStore>,
  editFlag: EditableFlag,
  rawValue: any,
  internal: boolean,
  entities: BankEntitiesQueryResponse
): any => {
  if (editFlag === EditableFlag.NotApplicable) return 'N/A';
  if (field.type === 'bank-entity') return resolveBankToEntity(rawValue, entities);
  if (field.name === 'status') return stateMap[rawValue as DealStatus];
  if (!internal) {
    if (field.name === 'symbol') {
      return rawValue.symbolID;
    } else if (field.name === 'strategy') {
      return rawValue.productid;
    }
  }
  if (field.type === 'number') {
    if (rawValue === null || rawValue === undefined || rawValue.length === 0) return null;
    const candidate = Number(rawValue);
    if (isNaN(candidate)) {
      return undefined;
    }
    return rawValue;
  } else {
    return rawValue;
  }
};
