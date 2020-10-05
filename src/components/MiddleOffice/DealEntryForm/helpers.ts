import { EditableCondition } from "components/MiddleOffice/types/moStrategy";
import { FieldDef } from "forms/fieldDef";
import { MoStore } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";
import { resolveBankToEntity, stateMap } from "utils/dealUtils";

export const getValue = (
  field: FieldDef<DealEntry, MoStore, DealEntry>,
  editableCondition: EditableCondition,
  rawValue: any,
  internal: boolean,
): any => {
  if (editableCondition === EditableCondition.NotApplicable) return "N/A";
  if (field.type === "bank-entity") return resolveBankToEntity(rawValue);
  if (field.name === "status") return stateMap[Number(rawValue)];
  if (field.name === "legadj") {
    if (!!rawValue) {
      return "true";
    } else {
      return "false";
    }
  }
  if (!internal) {
    if (field.name === "symbol") {
      return rawValue.symbolID;
    } else if (field.name === "strategy") {
      return rawValue.productid;
    }
  }
  if (field.type === "number") {
    if (rawValue === null || rawValue === undefined || rawValue.length === 0)
      return null;
    const candidate: number = Number(rawValue);
    if (isNaN(candidate)) {
      return undefined;
    }
    return rawValue;
  } else {
    return rawValue;
  }
};