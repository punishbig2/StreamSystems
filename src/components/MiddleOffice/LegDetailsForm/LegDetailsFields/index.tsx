import { Grid } from '@material-ui/core';
import { Field } from 'components/MiddleOffice/LegDetailsForm/LegDetailsFields/field';
import fields from 'components/MiddleOffice/LegDetailsForm/LegDetailsFields/fields';
import { Leg } from 'components/MiddleOffice/types/leg';
import { FieldDef } from 'forms/fieldDef';
import React, { ReactElement } from 'react';
import { DealEntry } from 'types/dealEntry';

type Props = {
  leg: Leg;
  disabled: boolean;
  dealEntry: DealEntry;
  isEditMode: boolean;
  onValueChange: (key: keyof Leg, value: any) => Promise<void>;
};

export const LegDetailsFields: React.FC<Props> = (props: Props): ReactElement | null => {
  return (
    <Grid container>
      {fields.map(
        (field: FieldDef<Leg, any, DealEntry>, index: number): ReactElement => (
          <Field
            key={field.name + index}
            field={field}
            leg={props.leg}
            dealEntry={props.dealEntry}
            isEditMode={props.isEditMode}
            disabled={props.disabled}
            onValueChange={props.onValueChange}
          />
        )
      )}
    </Grid>
  );
};
