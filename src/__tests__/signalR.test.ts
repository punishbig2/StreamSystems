import { API } from "API";
import { SignalRManager } from "signalR/signalRManager";
import { Sides } from "types/sides";
import { MessageTypes, W } from "types/w";

jest.setTimeout(60000);

const testSymbol = "USDBRL";
const testStrategy = "ATMF";
const testTenor = "1W";

describe("SignalR consistently receives messages", () => {
  it("Connects to SignalR hub", async (): Promise<void> => {
    const manager = new SignalRManager();
    manager.connect();

    const promise = new Promise<void>((resolve: () => void): void => {
      manager.addMarketListener(
        testSymbol,
        testStrategy,
        testTenor,
        (w: W): void => {
          console.log(w);
        }
      );
    });

    await API.executeCreateOrderRequest({
      MsgType: MessageTypes.D,
      TransactTime: (Date.now() / 1000).toString(),
      User: "iharob@gmail.com",
      Symbol: testSymbol,
      Strategy: testStrategy,
      Tenor: testTenor,
      Side: Sides.Buy,
      Quantity: "10",
      Price: "0.3",
    });
    return promise;
  });
});
