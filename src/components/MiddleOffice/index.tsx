import { Grid } from "@material-ui/core";
import { API } from "API";
import { MessageBox } from "components/MessageBox";
import { ActionButtons } from "components/MiddleOffice/actionButtons";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { Error } from "components/MiddleOffice/error";
import { useDealDeletedListener } from "components/MiddleOffice/hooks/useDealDeletedListener";
import { useErrorListener } from "components/MiddleOffice/hooks/useErrorListener";
import { useMoInitializer } from "components/MiddleOffice/hooks/useMoInitializer";
import { usePricingUpdater } from "components/MiddleOffice/hooks/usePricingUpdater";
import { useSEFSubmissionSuccessListener } from "components/MiddleOffice/hooks/useSEFSubmissionListener";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { ModalWindow } from "components/ModalWindow";
import { ProgressModalContent } from "components/ProgressModalContent";
import { ProgressView } from "components/progressView";
import { QuestionBox } from "components/QuestionBox";
import { observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { messages, MOStatus } from "mobx/stores/moStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { randomID } from "randomID";
import React, { ReactElement, useState } from "react";

interface Props {
  visible: boolean;
}

export const MiddleOffice: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const [entryStore] = useState<DealEntryStore>(new DealEntryStore());
    const [removeQuestionModalOpen, setRemoveQuestionModalOpen] = useState<
      boolean
    >(false);
    const classes: string[] = ["middle-office"];
    const { deal, error } = moStore;
    // Update pricing data on change
    usePricingUpdater(deal);
    useDealDeletedListener(entryStore);
    useMoInitializer();
    useSEFSubmissionSuccessListener();
    useErrorListener();

    if (!props.visible) classes.push("hidden");
    if (!moStore.isInitialized) {
      return (
        <ProgressView
          title={"Loading: Middle Office"}
          message={"Please wait, we are loading some data"}
          value={moStore.progress}
        />
      );
    } else {
      const doRemoveDeal = () => {
        if (deal === null) return;
        API.removeDeal(deal.dealID)
          .then(() => null)
          .catch((error: any) => {
            console.warn(error);
          })
          .finally(() => {
            setRemoveQuestionModalOpen(false);
          });
      };

      const removeDeal = () => {
        setRemoveQuestionModalOpen(true);
      };

      const headingClasses: string[] = ["heading"];
      if (moStore.status !== MOStatus.Normal) headingClasses.push("disabled");
      return (
        <>
          <div className={classes.join(" ")}>
            <div className={"left-panel"}>
              <DealBlotter
                id={randomID("")}
                onDealSelected={(deal: Deal | null) =>
                  moStore.setDeal(deal, entryStore)
                }
                disabled={moStore.status !== MOStatus.Normal}
              />
            </div>
            <Grid className={"right-panel"} container>
              <Grid xs={7} item>
                <OverlayScrollbarsComponent className={"container"}>
                  <div className={"form-group"}>
                    <div className={headingClasses.join(" ")}>
                      <h1>Deal Entry</h1>
                      <div className={"actions"}>
                        <ActionButtons
                          entryStore={entryStore}
                          onRemoveDeal={removeDeal}
                        />
                      </div>
                    </div>
                    <DealEntryForm store={entryStore} />
                  </div>
                  <div className={"form-group"}>
                    <div className={headingClasses.join(" ")}>
                      <h1>Summary Leg Details</h1>
                    </div>
                    <SummaryLegDetailsForm />
                  </div>
                </OverlayScrollbarsComponent>
              </Grid>
              <Grid xs={5} item>
                <OverlayScrollbarsComponent className={"container"}>
                  <LegDetailsForm
                    status={moStore.status}
                    dealEntryStore={entryStore}
                  />
                </OverlayScrollbarsComponent>
              </Grid>
            </Grid>
          </div>
          <ModalWindow
            visible={error !== null}
            render={() => <Error error={error} />}
          />
          <ModalWindow
            visible={moStore.successMessage !== null}
            render={(): ReactElement | null => {
              if (moStore.successMessage === null) return null;
              const { title, text } = moStore.successMessage;
              return (
                <MessageBox
                  title={title}
                  message={text}
                  icon={"check-circle"}
                  buttons={() => (
                    <button onClick={() => moStore.setSuccessMessage(null)}>
                      Close
                    </button>
                  )}
                  color={"good"}
                />
              );
            }}
          />
          <ModalWindow
            visible={removeQuestionModalOpen}
            render={(): ReactElement => {
              return (
                <QuestionBox
                  title={"Delete Deal"}
                  content={
                    "Are you sure you want to remove this deal? This is irreversible"
                  }
                  onNo={() => setRemoveQuestionModalOpen(false)}
                  onYes={doRemoveDeal}
                />
              );
            }}
          />
          <ModalWindow
            visible={moStore.status !== MOStatus.Normal}
            render={(): ReactElement | null => {
              if (moStore.status === MOStatus.Normal) return null;
              const message: string = messages[moStore.status];
              return (
                <ProgressModalContent
                  maximum={-1}
                  progress={0}
                  message={message}
                  startTime={Date.now()}
                />
              );
            }}
          />
        </>
      );
    }
  }
);
