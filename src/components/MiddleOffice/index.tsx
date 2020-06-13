import React, { ReactElement } from "react";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { Grid } from "@material-ui/core";
import { randomID } from "randomID";

interface Props {
  visible: boolean;
}

export const MiddleOffice: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  return (
    <div className={"middle-office" + (!props.visible ? " hidden" : "")}>
      <div className={"left-panel"}>
        <DealBlotter id={randomID("")} />
      </div>
      <Grid className={"right-panel"} container>
        <Grid xs={7} className={"container"} item>
          <div className={"form-group"}>
            <h1>Deal Entry</h1>
            <DealEntryForm />
          </div>
          <div className={"form-group"}>
            <h1>Summary Leg Details</h1>
            <SummaryLegDetailsForm />
          </div>
        </Grid>
        <Grid xs={5} className={"container"} item>
          <LegDetailsForm />
        </Grid>
      </Grid>
    </div>
  );
};
