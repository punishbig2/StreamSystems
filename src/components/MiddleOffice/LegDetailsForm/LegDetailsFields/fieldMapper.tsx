import { FormField } from "components/FormField";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import {
  getCurrencyValue,
  getRatesValue,
  getStrikeValue,
} from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/helpers/getStrikeValue";
import { FieldDef } from "forms/fieldDef";
import { FieldType } from "forms/fieldType";
import { getStyledValue } from "legsUtils";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { Symbol } from "types/symbol";

const capitalize = (str: string): string => {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
};

export const fieldsMapper = (
  leg: Leg,
  onValueChange: (name: keyof Leg, value: any) => void,
  store: DealEntryStore,
  disabled: boolean
) => (fieldDef: FieldDef<Leg, {}, DealEntry>, index: number): ReactElement => {
  const { entry } = store;
  const { deal } = moStore;
  const extraProps = ((): { value: any } & any => {
    const symbol: Symbol | undefined = moStore.findSymbolById(entry.ccypair);
    if (fieldDef.type === "strike") {
      if (symbol === undefined) return null;
      return getStrikeValue(leg, symbol, fieldDef.name);
    } else if (fieldDef.type === "currency") {
      return getCurrencyValue(leg, fieldDef.name, entry.premstyle);
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
      return {
        value: leg[fieldDef.name],
      };
    }
  })();
  const isEditable = (fieldDef: FieldDef<Leg, {}, DealEntry>): boolean => {
    if (!moStore.isEditMode) return false;
    if (typeof fieldDef.editable !== "function") {
      return fieldDef.editable;
    } else {
      return fieldDef.editable(null, store.entry);
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
      key={index}
      id={leg.option}
      color={fieldDef.color}
      label={fieldDef.label}
      editable={isEditable(fieldDef)}
      precision={fieldDef.precision}
      name={fieldDef.name}
      rounding={fieldDef.rounding}
      type={getType()}
      disabled={disabled}
      onChange={onValueChange}
      value={null}
      {...extraProps}
    />
  );
};
