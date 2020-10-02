import { FormField } from "components/FormField";
import { IsEditableData } from "components/MiddleOffice/SummaryLegDetailsForm/fields";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { FieldDef } from "forms/fieldDef";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { DealEntry } from "../../../structures/dealEntry";

interface Props {
  field: FieldDef<SummaryLeg, IsEditableData, SummaryLeg>;
  summaryLeg: SummaryLeg;
  dealEntry: DealEntry;
  isEditMode: boolean;
}

export const Field: React.FC<Props> = (props: Props): ReactElement => {
  const { field: fieldDef, summaryLeg: entry } = props;
  const getValue = (): number | string | Date => {
    if (fieldDef.name === "dealOutput")
      throw new Error("this is not a normal value, cannot display it");
    if (fieldDef.name === "spotDate") return entry.spotDate;
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
      return fieldDef.editable(
        {
          dealEntry: props.dealEntry,
          isEditMode: props.isEditMode,
        },
        entry
      );
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
