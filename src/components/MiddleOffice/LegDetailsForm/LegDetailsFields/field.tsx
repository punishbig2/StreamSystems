import { FormField } from "components/FormField";
import { getExtraPropsAndValue } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/helpers/getExtraPropsAndValue";
import { Leg } from "components/MiddleOffice/types/leg";
import { FieldDef } from "forms/fieldDef";
import { FieldType } from "forms/fieldType";
import moStore from "mobx/stores/moStore";

import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";

interface Props {
  readonly field: FieldDef<Leg, {}, DealEntry>;
  readonly leg: Leg;
  readonly dealEntry: DealEntry;
  readonly isEditMode: boolean;
  readonly disabled: boolean;
  readonly onValueChange: (name: keyof Leg, value: any) => void;
}

export const Field: React.FC<Props> = (props: Props): ReactElement => {
  const { field, leg, dealEntry } = props;

  const isEditable = (
    field: FieldDef<Leg, {}, DealEntry>,
    isEditMode: boolean
  ): boolean => {
    if (!isEditMode) return false;
    if (typeof field.editable !== "function") {
      return field.editable;
    } else {
      return field.editable(
        field.name,
        props.dealEntry,
        moStore.isEditMode,
        "leg"
      );
    }
  };

  const getType = (): FieldType => {
    if (field.name === "price") {
      const { symbol } = props.dealEntry;
      if (symbol.premiumCCYpercent) {
        return "percent";
      } else {
        return "number";
      }
    }
    return field.type;
  };

  const valueAndRelatedProps = React.useMemo((): any => {
    return getExtraPropsAndValue(field, leg, dealEntry);
  }, [field, leg, dealEntry]);

  return (
    <FormField<Leg>
      id={leg.option}
      color={field.color}
      label={field.label}
      editable={isEditable(field, props.isEditMode)}
      precision={field.precision}
      name={field.name}
      rounding={field.rounding}
      type={getType()}
      disabled={props.disabled}
      {...valueAndRelatedProps}
      onChange={props.onValueChange}
    />
  );
};
