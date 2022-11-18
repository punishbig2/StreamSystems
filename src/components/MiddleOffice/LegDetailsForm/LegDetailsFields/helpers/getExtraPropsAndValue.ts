import { Leg } from 'components/MiddleOffice/types/leg';
import { FieldDef } from 'forms/fieldDef';
import { MiddleOfficeStore } from 'mobx/stores/middleOfficeStore';
import { DealEntry } from 'types/dealEntry';
import { EditableFlag } from 'types/product';

export const getExtraPropsAndValue = (
  field: FieldDef<Leg, any, DealEntry>,
  leg: Leg,
  entry: DealEntry
): any => {
  const editFlag: EditableFlag = MiddleOfficeStore.getFieldEditableFlag(
    'leg',
    field.name,
    entry.strategy
  );
  if (editFlag === EditableFlag.NotApplicable) {
    return {
      value: 'N/A',
    };
  }
  const value: any = leg[field.name];
  if (field.getValue !== undefined) {
    return field.getValue(leg, entry);
  } else {
    return {
      value: value,
    };
  }
};
