import { Grid } from "@material-ui/core";
import { Leg } from "components/MiddleOffice/types/leg";
import { Field } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/field";
import { FieldDef } from "forms/fieldDef";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";

import fields from "./fields";

type Props = {
  leg: Leg;
  disabled: boolean;
  dealEntry: DealEntry;
  isEditMode: boolean;
  onValueChange: (key: keyof Leg, value: any) => void;
};

export const LegDetailsFields: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  return (
    <Grid container>
      {fields.map(
        (field: FieldDef<Leg, {}, DealEntry>): ReactElement => (
          <Field
            field={field}
            leg={props.leg}
            isEditMode={props.isEditMode}
            disabled={props.disabled}
            dealEntry={props.dealEntry}
            onValueChange={props.onValueChange}
          />
        )
      )}
    </Grid>
  );
};
