import { FormField } from "components/FormField";
import { Leg } from "components/MiddleOffice/types/leg";
import {
  getCurrencyValue,
  getRatesValue,
  getStrikeValue,
} from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/helpers/getValueHelpers";
import { FieldDef } from "forms/fieldDef";
import { FieldType } from "forms/fieldType";
import { getStyledValue } from "legsUtils";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { Symbol } from "types/symbol";

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
  const { deal } = moStore;
  const getExtraPropsAndValue = (entry: DealEntry): any => {
    const symbol: Symbol | undefined = moStore.findSymbolById(entry.ccypair);
    if (fieldDef.type === "strike") {
      if (symbol === undefined) {
        return { value: null, precision: 0, rounding: undefined };
      } else {
        return getStrikeValue(leg, symbol, fieldDef.name);
      }
    } else if (fieldDef.type === "currency") {
      if (symbol === undefined) return null;
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
    if (fieldDef.name === "price" && deal !== null) {
      const { symbol } = deal;
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
