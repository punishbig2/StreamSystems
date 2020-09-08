import { Grid } from "@material-ui/core";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { fieldsMapper } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/fieldMapper";
import { observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import React, { ReactElement } from "react";

import fields from "./fields";

type Props = {
  leg: Leg;
  dealEntryStore: DealEntryStore;
  onValueChange: (key: keyof Leg, value: any) => void;
};

export const LegDetailsFields: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { status } = moStore;
    const disabled: boolean = status !== MOStatus.Normal;
    return (
      <Grid container>
        {fields.map(
          fieldsMapper(
            props.leg,
            props.onValueChange,
            props.dealEntryStore,
            disabled
          )
        )}
      </Grid>
    );
  }
);
