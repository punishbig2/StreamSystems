import { EditableFlag } from "components/MiddleOffice/types/moStrategy";
import { MoStore } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";

export const NotApplicableProxy = <T>(entry: DealEntry): any => {
  return {
    get: (target: T, name: keyof T): any => {
      if (
        MoStore.getFieldEditableFlag(null, name as string, entry.strategy) ===
        EditableFlag.NotApplicable
      ) {
        return null;
      } else {
        return target[name];
      }
    },
  };
};
