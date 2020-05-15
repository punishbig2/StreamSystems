import React, { ReactElement, useEffect } from "react";
import { Message } from "interfaces/message";
import { getMessageSize, getMessagePrice } from "messageUtils";
import { UserPreferences, ExecSound } from "interfaces/user";
import { getSound } from "beep-sound";
import userProfileStore from "mobx/stores/userPreferencesStore";

interface OwnProps {
  trade: Message;
  preferences: UserPreferences;
  onClose: () => void;
}

const sideClasses: { [key: string]: string } = {
  2: "sell",
  1: "buy",
};

const getSoundFile = async (name: string) => {
  if (name === "default") {
    return "/sounds/alert.wav";
  } else {
    const sound: ExecSound = await getSound(name);
    return sound.data as string;
  }
};

const playBeep = async (
  preferences: UserPreferences,
  destination: string | undefined
) => {
  const src: string = await (async () => {
    if (destination === "DP") {
      return getSoundFile(preferences.darkPoolExecSound);
    } else {
      return getSoundFile(preferences.execSound);
    }
  })();
  const element: HTMLAudioElement = document.createElement("audio");
  element.src = src;
  element.play();
};

export const TradeConfirmation: React.FC<OwnProps> = (
  props: OwnProps
): ReactElement | null => {
  const { trade } = props;
  const { Side } = trade;
  const direction: string = Side.toString() === "1" ? "from" : "to";
  useEffect(() => {
    playBeep(userProfileStore.preferences, trade.ExDestination);
  });
  return (
    <div className={[sideClasses[trade.Side], "item"].join(" ")}>
      <div className={"content"}>
        <div className={"line"}>
          {trade.Symbol} {trade.Tenor} {trade.Strategy} @{" "}
          {getMessagePrice(trade)}
        </div>
        <div className={"line"}>
          You {Side.toString() === "1" ? "buy" : "sell"} {getMessageSize(trade)}{" "}
          {direction} {trade.ExecBroker}
        </div>
      </div>
    </div>
  );
};
