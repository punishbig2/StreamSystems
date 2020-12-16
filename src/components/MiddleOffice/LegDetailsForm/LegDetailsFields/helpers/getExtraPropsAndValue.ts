import { capitalize } from "@material-ui/core";
import {
  getCurrencyValue,
  getRatesValue,
  getStrikeValue,
} from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/helpers/getValueHelpers";
import { Leg } from "components/MiddleOffice/types/leg";
import { EditableFlag } from "components/MiddleOffice/types/moStrategy";
import { FieldDef } from "forms/fieldDef";
import { MoStore } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";
import { getStyledValue } from "utils/legsUtils";

export const getExtraPropsAndValue = (
  field: FieldDef<Leg, {}, DealEntry>,
  leg: Leg,
  entry: DealEntry
): any => {
  const { symbol } = entry;
  const editFlag: EditableFlag = MoStore.getFieldEditableFlag(
    "leg",
    field.name,
    entry.strategy
  );
  if (editFlag === EditableFlag.NotApplicable) {
    return {
      value: "N/A",
    };
  }
  if (field.type === "strike") {
    return getStrikeValue(leg, symbol, field.name);
  } else if (field.type === "currency") {
    return getCurrencyValue(leg, field.name, symbol, entry.premstyle);
  } else if (field.name === "rates") {
    return getRatesValue(leg, field.data);
  } else if (field.name === "side") {
    return {
      value: capitalize(leg[field.name]),
    };
  } else if (field.name === "price") {
    return {
      value: getStyledValue(leg[field.name], entry.premstyle),
    };
  } else if (field.name === "delta") {
    return {
      value: getStyledValue(leg[field.name], entry.deltastyle),
    };
  } else {
    const value: any = leg[field.name];
    return {
      value: value,
    };
  }
};
