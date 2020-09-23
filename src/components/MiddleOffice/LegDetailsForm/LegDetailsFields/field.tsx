import { capitalize } from "@material-ui/core";
import { FormField } from "components/FormField";
import {
  getCurrencyValue,
  getRatesValue,
  getStrikeValue,
} from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/helpers/getValueHelpers";
import { Leg } from "components/MiddleOffice/types/leg";
import { FieldDef } from "forms/fieldDef";
import { FieldType } from "forms/fieldType";
import { getStyledValue } from "legsUtils";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";

interface Props {
  leg: Leg;
  onValueChange: (name: keyof Leg, value: any) => void;
  disabled: boolean;
  dealEntry: DealEntry;
  field: FieldDef<Leg, {}, DealEntry>;
  isEditMode: boolean;
}

export const Field: React.FC<Props> = (props: Props): ReactElement => {
  const { leg, field, dealEntry } = props;
  const getExtraPropsAndValue = (entry: DealEntry): any => {
    const { symbol } = entry;
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
  const isEditable = (
    field: FieldDef<Leg, {}, DealEntry>,
    isEditMode: boolean
  ): boolean => {
    if (!isEditMode) return false;
    if (typeof field.editable !== "function") {
      return field.editable;
    } else {
      return field.editable(null, dealEntry);
    }
  };
  const getType = (): FieldType => {
    if (field.name === "price") {
      const { symbol } = dealEntry;
      if (symbol.premiumCCYpercent) {
        return "percent";
      } else {
        return "number";
      }
    }
    return field.type;
  };
  return (
    <FormField<Leg>
      id={leg.option}
      key={field.name + field.type}
      color={field.color}
      label={field.label}
      editable={isEditable(field, props.isEditMode)}
      precision={field.precision}
      name={field.name}
      rounding={field.rounding}
      type={getType()}
      disabled={props.disabled}
      {...getExtraPropsAndValue(dealEntry)}
      onChange={props.onValueChange}
    />
  );
};
