import { useMoInitializer } from "components/MiddleOffice/hooks/useMoInitializer";
import { ReadyMiddleOfficeView } from "components/MiddleOffice/ReadyMIddleOfficeView";
import { ProgressView } from "components/progressView";
import { observer } from "mobx-react";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";

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
      return <ReadyMiddleOfficeView visible={props.visible} />;
    }
  }
);
