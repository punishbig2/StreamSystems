import { Grid } from "@material-ui/core";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { fieldsMapper } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/fieldMapper";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import React, { ReactElement } from "react";

import fields from "./fields";

type Props = {
  leg: Leg;
  dealEntryStore: DealEntryStore;
  onValueChange: (key: keyof Leg, value: any) => void;
};

export const LegDetailsFields: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  return (
    <Grid container>
      {fields.map(
        fieldsMapper(props.leg, props.onValueChange, props.dealEntryStore)
      )}
    </Grid>
  );
};
