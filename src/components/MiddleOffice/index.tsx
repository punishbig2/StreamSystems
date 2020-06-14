import React, { ReactElement, useEffect } from "react";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { Grid } from "@material-ui/core";
import { randomID } from "randomID";
import store from "mobx/stores/middleOfficeStore";
import { observer } from "mobx-react";
import { ProgressView } from "components/progressView";

interface Props {
  visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const classes: string[] = ["middle-office"];
    useEffect(() => {
      store.loadReferenceData();
    }, []);
    if (!props.visible) classes.push("hidden");
    if (!store.isInitialized) {
      return (
        <ProgressView
          title={"Loading: Middle Office"}
          message={"Please wait, we are loading some data"}
          value={store.loadingReferenceDataProgress}
        />
      );
    } else {
      return (
        <div className={classes.join(" ")}>
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
    }
  }
);
