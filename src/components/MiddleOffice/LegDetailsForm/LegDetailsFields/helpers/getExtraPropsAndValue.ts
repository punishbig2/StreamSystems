import { capitalize } from "@material-ui/core";
import {
  getCurrencyValue,
  getRatesValue,
  getStrikeValue,
} from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/helpers/getValueHelpers";
import { Leg } from "components/MiddleOffice/types/leg";
import { EditableFlag } from "types/product";
import { FieldDef } from "forms/fieldDef";
import { MoStore } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";
import { isStyledValue } from "types/styledValue";
import { getStyledValue } from "utils/legsUtils";

const getStyle = (
  name: string,
  premium: string,
  delta: string
): string | undefined => {
  switch (name) {
    case "premium":
      return premium;
    case "hedge":
    case "delta":
      return delta;
    default:
      return undefined;
  }
};

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
  const style: string | undefined = getStyle(
    field.name,
    entry.premstyle,
    entry.deltastyle
  );
  const value: any = leg[field.name];
  console.log(field.name, value);
  if (field.name === "price" || field.name === "hedge") {
    return {
      value: getStyledValue(value, entry.premstyle),
    };
  } else if (field.type === "strike") {
    return getStrikeValue(leg, symbol, field.name);
  } else if (field.type === "currency") {
    return getCurrencyValue(leg, field.name, symbol, style);
  } else if (isStyledValue(value)) {
    return {
      value: getStyledValue(value, style),
    };
  } else if (field.name === "rates") {
    return getRatesValue(leg, field.data);
  } else if (field.name === "side") {
    return {
      value: capitalize(value),
    };
  } else {
    return {
      value: value,
    };
  }
};
