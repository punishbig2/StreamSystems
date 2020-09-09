import { Grid } from "@material-ui/core";
import { Leg } from "components/MiddleOffice/types/leg";
import { fieldMapper } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/fieldMapper";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";

import fields from "./fields";

type Props = {
  leg: Leg;
  disabled: boolean;
  entry: DealEntry;
  onValueChange: (key: keyof Leg, value: any) => void;
};

export const LegDetailsFields: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  return (
    <Grid container>
      {fields.map(
        fieldMapper(props.leg, props.onValueChange, props.disabled, props.entry)
      )}
    </Grid>
  );
};
