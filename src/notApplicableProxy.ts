import { MiddleOfficeStore } from 'mobx/stores/middleOfficeStore';
import { DealEntry } from 'types/dealEntry';
import { EditableFlag } from 'types/product';

export const NotApplicableProxy = <T>(
  prefix: string,
  entry: DealEntry,
  defaultValue: string | null = null
): any => {
  return {
    get: (target: T, name: keyof T): any => {
      if (
        MiddleOfficeStore.getFieldEditableFlag(prefix, name as string, entry.strategy) ===
        EditableFlag.NotApplicable
      ) {
        return defaultValue;
      } else {
        return target[name];
      }
    },
  };
};
