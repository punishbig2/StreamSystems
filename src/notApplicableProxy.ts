import { EditableFlag } from "types/product";
import { MoStore } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";

export const NotApplicableProxy = <T>(
  prefix: string,
  entry: DealEntry,
  defaultValue: string | null = null
): any => {
  return {
    get: (target: T, name: keyof T): any => {
      if (
        MoStore.getFieldEditableFlag(prefix, name as string, entry.strategy) ===
        EditableFlag.NotApplicable
      ) {
        return defaultValue;
      } else {
        return target[name];
      }
    },
  };
};
