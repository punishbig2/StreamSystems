import React, { ReactElement } from "react";
import { Grid } from "@material-ui/core";
import { LegDetailsFields } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields";
import { Leg } from "components/MiddleOffice/interfaces/leg";

interface Props {
  legs: Leg[];
}

export const LegDetailsForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { legs } = props;
  return (
    <Grid className={"legs"} direction={"column"} xs={4} container item>
      <form>
        {legs.map((leg: Leg, index: number) => {
          return (
            <fieldset key={index}>
              <legend className={"leg-legend"}>
                Leg {index + 1} - {leg.type}
              </legend>
              <LegDetailsFields {...leg} />
            </fieldset>
          );
        })}
      </form>
    </Grid>
  );
};
