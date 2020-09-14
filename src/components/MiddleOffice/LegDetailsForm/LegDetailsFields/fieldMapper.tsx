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

const capitalize = (str: string): string => {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
};

export const fieldMapper = (
  leg: Leg,
  onValueChange: (name: keyof Leg, value: any) => void,
  disabled: boolean,
  entry: DealEntry,
  isEditMode: boolean
) => (fieldDef: FieldDef<Leg, {}, DealEntry>, index: number): ReactElement => {
  const getExtraPropsAndValue = (entry: DealEntry): any => {
    const { symbol } = entry;
    if (fieldDef.type === "strike") {
      return getStrikeValue(leg, symbol, fieldDef.name);
    } else if (fieldDef.type === "currency") {
      return getCurrencyValue(leg, fieldDef.name, symbol, entry.premstyle);
    } else if (fieldDef.name === "rates") {
      return getRatesValue(leg, fieldDef.data);
    } else if (fieldDef.name === "side") {
      return {
        value: capitalize(leg[fieldDef.name]),
      };
    } else if (fieldDef.name === "price") {
      return {
        value: getStyledValue(leg[fieldDef.name], entry.premstyle),
      };
    } else if (fieldDef.name === "delta") {
      return {
        value: getStyledValue(leg[fieldDef.name], entry.deltastyle),
      };
    } else {
      const value: any = leg[fieldDef.name];
      return {
        value: value,
      };
    }
  };
  const isEditable = (
    fieldDef: FieldDef<Leg, {}, DealEntry>,
    isEditMode: boolean
  ): boolean => {
    if (!isEditMode) return false;
    if (typeof fieldDef.editable !== "function") {
      return fieldDef.editable;
    } else {
      return fieldDef.editable(null, entry);
    }
  };
  const getType = (): FieldType => {
    if (fieldDef.name === "price") {
      const { symbol } = entry;
      if (symbol.premiumCCYpercent) {
        return "percent";
      } else {
        return "number";
      }
    }
    return fieldDef.type;
  };
  return (
    <FormField<Leg>
      id={leg.option}
      key={fieldDef.name + index}
      color={fieldDef.color}
      label={fieldDef.label}
      editable={isEditable(fieldDef, isEditMode)}
      precision={fieldDef.precision}
      name={fieldDef.name}
      rounding={fieldDef.rounding}
      type={getType()}
      disabled={disabled}
      {...getExtraPropsAndValue(entry)}
      onChange={onValueChange}
    />
  );
};
