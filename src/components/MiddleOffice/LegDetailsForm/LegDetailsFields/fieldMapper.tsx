import { FormField } from "components/formField";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { FieldDef } from "forms/fieldDef";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";

const capitalize = (str: string): string => {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
};

export const fieldsMapper = (
  leg: Leg,
  onValueChange: (name: keyof Leg, value: any) => void
) => (
  fieldDef: FieldDef<Leg, {}, Deal>,
  index: number
): ReactElement | null => {
  const { rates } = leg;
  const { deal } = moStore;
  if (deal === null) return null;
  const extraProps = ((): { value: any } & any => {
    if (fieldDef.type === "currency") {
      return {
        value: leg[fieldDef.name],
        currency: leg.premiumCurrency,
      };
    } else if (fieldDef.name === "rates") {
      const index: number = fieldDef.data;
      return { ...rates[index], label: rates[index].currency + " Rate" };
    } else if (fieldDef.name === "side") {
      return {
        value: capitalize(leg[fieldDef.name]),
      };
    } else {
      return {
        value: leg[fieldDef.name],
      };
    }
  })();
  const isEditable = (fieldDef: FieldDef<Leg, {}, Deal>): boolean => {
    if (typeof fieldDef.editable !== "function") {
      return fieldDef.editable;
    } else {
      return fieldDef.editable(null, deal);
    }
  };
  return (
    <FormField<Leg>
      id={leg.option}
      key={fieldDef.name + index}
      color={fieldDef.color}
      label={fieldDef.label}
      editable={isEditable(fieldDef)}
      precision={fieldDef.precision}
      name={fieldDef.name}
      type={fieldDef.type}
      {...extraProps}
      onChange={onValueChange}
    />
  );
};
