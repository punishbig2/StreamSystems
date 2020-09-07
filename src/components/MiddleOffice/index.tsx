import { MuiThemeProvider } from "@material-ui/core";
import { useMoInitializer } from "components/MiddleOffice/hooks/useMoInitializer";
import { MiddleOfficeMain } from "components/MiddleOffice/middleOfficeMain";
import { ProgressView } from "components/progressView";
import { observer } from "mobx-react";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";

import theme from "./theme";

interface Props {
  readonly visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    useMoInitializer();
    if (!moStore.isInitialized) {
      return (
        <ProgressView
          title={"Loading: Middle Office"}
          message={"Please wait, we are loading some data"}
          value={moStore.progress}
        />
      );
    } else {
      return (
        <MuiThemeProvider theme={theme}>
          <MiddleOfficeMain visible={props.visible} />
        </MuiThemeProvider>
      );
    }
  }
);
