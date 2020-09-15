import { FormField } from "components/FormField";
import { IsEditableData } from "components/MiddleOffice/SummaryLegDetailsForm/fields";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { FieldDef } from "forms/fieldDef";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";

export const fieldMapper = (data: IsEditableData, entry: SummaryLeg) => (
  fieldDef: FieldDef<SummaryLeg, IsEditableData, SummaryLeg>
): ReactElement | null => {
  const getValue = (): number | string | Date => {
    if (fieldDef.name === "dealOutput")
      throw new Error("this is not a normal value, cannot display it");
    const value: number | string | Date | null = entry[fieldDef.name];
    if (
      fieldDef.type === "number" &&
      value !== null &&
      typeof value !== "number" &&
      typeof value !== "string"
    ) {
      return "";
    }
    if (value === null) return "";
    return value;
  };
  const isEditable = (): boolean => {
    if (typeof fieldDef.editable === "function") {
      return fieldDef.editable(data, entry);
    } else {
      return fieldDef.editable;
    }
  };
  return (
    <FormField
      key={fieldDef.name}
      name={fieldDef.name}
      label={fieldDef.label}
      value={getValue()}
      type={fieldDef.type}
      color={fieldDef.color}
      rounding={fieldDef.rounding}
      precision={fieldDef.precision}
      editable={isEditable()}
      onChange={moStore.updateSummaryLeg}
    />
  );
};
