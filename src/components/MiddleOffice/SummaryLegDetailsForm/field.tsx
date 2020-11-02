import { FormField } from "components/FormField";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { FieldDef } from "forms/fieldDef";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";

interface Props {
  readonly dealEntry: DealEntry;
  readonly summaryLeg: SummaryLeg | null;
  readonly field: FieldDef<SummaryLeg, SummaryLeg>;
  readonly isEditMode: boolean;
  readonly onUpdateSummaryLeg: (
    fieldName: keyof SummaryLeg,
    value: any
  ) => Promise<void>;
}

export const Field: React.FC<Props> = (props: Props): ReactElement => {
  const { field, dealEntry, summaryLeg, isEditMode } = props;
  const getValue = (): any => {
    if (summaryLeg === null) return null;
    if (field.name === "dealOutput")
      throw new Error("this is not a normal value, cannot display it");
    const value = summaryLeg[field.name];
    if (
      field.type === "number" &&
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
    if (typeof field.editable === "function") {
      return field.editable(field.name, dealEntry, isEditMode);
    } else {
      return field.editable;
    }
  };
  return (
    <FormField
      key={field.name}
      name={field.name}
      label={field.label}
      value={getValue()}
      type={field.type}
      color={field.color}
      rounding={field.rounding}
      precision={field.precision}
      editable={isEditable()}
      onChange={props.onUpdateSummaryLeg}
    />
  );
};
