import { EditableFlag } from "components/MiddleOffice/types/moStrategy";
import { MoStore } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";

export const NotApplicableProxy = <T>(
  prefix: string,
  entry: DealEntry,
  defaultValue: string | null = null
): any => {
  return {
    get: (target: T, name: keyof T): any => {
      console.log(prefix + name);
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
