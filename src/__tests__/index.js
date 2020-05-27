const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const users = [
  "iharob.alasimi@vascarsolutions.com",
  "stephen.pignalosa@outlook.com",
  "iharob@gmail.com",
];

const DEFAULT_WORKSPACE =
  "workspace=%7B%22workarea%22:%7B%22workarea%22:%7B%22workspaces%22:%7B%7D,%22currentWorkspaceID%22:null,%22preferences%22:%7B%22ccyGroup%22:%22%22,%22colorScheme%22:%22default%22,%22execSound%22:%22default%22,%22darkPoolExecSound%22:%22default%22,%22font%22:%22default%22,%22fontSize%22:%2215px%22,%22mpid%22:%22%22,%22oco%22:0,%22timezone%22:%22America/Caracas%22,%22userType%22:%22%22,%22execSoundList%22:%5B%5D,%22theme%22:%22default%22%7D%7D%7D,%22tables%22:%7B%22___EX_BLOTTER___-tbl%22:%7B%22sortedColumns%22:%7B%7D,%22sortingApplicationOrder%22:%5B%5D,%22filters%22:%7B%7D,%22columnsOrder%22:%5B0,1,2,3,4,5,6,7,8%5D%7D,%22windowsdknqdn-top%22:%7B%22sortedColumns%22:%7B%7D,%22sortingApplicationOrder%22:%5B%5D,%22filters%22:%7B%7D,%22columnsOrder%22:%5B0,1,2,3%5D%7D,%22windowsdknqdn-depth%22:%7B%22sortedColumns%22:%7B%7D,%22sortingApplicationOrder%22:%5B%5D,%22filters%22:%7B%7D,%22columnsOrder%22:%5B0,1,2,3%5D%7D,%22AUDBRLATMF-run%22:%7B%22sortedColumns%22:%7B%7D,%22sortingApplicationOrder%22:%5B%5D,%22filters%22:%7B%7D,%22columnsOrder%22:%5B0,1,2,3,4,5,6%5D%7D,%22windowsrpitxo-top%22:%7B%22sortedColumns%22:%7B%7D,%22sortingApplicationOrder%22:%5B%5D,%22filters%22:%7B%7D,%22columnsOrder%22:%5B0,1,2,3%5D%7D,%22windowsrpitxo-depth%22:%7B%22sortedColumns%22:%7B%7D,%22sortingApplicationOrder%22:%5B%5D,%22filters%22:%7B%7D,%22columnsOrder%22:%5B0,1,2,3%5D%7D,%22windowsbysrof-top%22:%7B%22sortedColumns%22:%7B%7D,%22sortingApplicationOrder%22:%5B%5D,%22filters%22:%7B%7D,%22columnsOrder%22:%5B0,1,2,3%5D%7D,%22windowsbysrof-depth%22:%7B%22sortedColumns%22:%7B%7D,%22sortingApplicationOrder%22:%5B%5D,%22filters%22:%7B%7D,%22columnsOrder%22:%5B0,1,2,3%5D%7D%7D,%22workspaces%22:%7B%7D,%22pods%22:%7B%7D,%22windows%22:%7B%7D%7D";
const API_SERVER_HOST_AND_PORT = "157.245.13.140:4001";

const createSession = async (user) => {
  const options = new chrome.Options();
  // options.addArguments("headless", "disable-gpu");
  const browser = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
  // Load the site
  await browser.get(`http://localhost:3000/?user=${user}`);
  // Reset workspace
  await browser.executeScript(`
   const body = \`useremail=${user}&\` + "${DEFAULT_WORKSPACE}";
   await fetch(\`http://${API_SERVER_HOST_AND_PORT}/api/UserApi/saveUserJson\`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body,
  });`);
  return browser;
};

const selectItemFromDropdown = async (browser, list, index) => {
  const select = await list.findElement(By.css("select"));
  // Click to open the dropdown
  list.click();
  // Get the item we will be selecting
  const item = await browser.wait(
    until.elementLocated(By.css(`ul.dropdown li:nth-child(${index})`))
  );
  // Get the text of such item
  const expected = await item.findElement(By.css("span")).getText();
  // Click the item
  item.click();
  // Get current value and confirm that it indeed changed
  const selected = await select.getAttribute("value");
  // Check that the value and the item matched
  return { selected, expected };
};

jest.setTimeout(30000);

describe("Create an empty workspace", () => {
  let user1;
  let user2;

  beforeAll(async () => {
    user1 = await createSession(users[0]);
    user2 = await createSession(users[1]);
  });

  afterAll(async () => {
    await user1.quit();
  }, 15000);

  it("Creates the workspace with a toolbar and selects the new tab", async function () {
    await user1.manage().window().setRect(1920, 1080);
    await user1.wait(
      until.elementLocated(By.css(".new-workspace > span:nth-child(2)"))
    );
    await user1
      .findElement(By.css(".new-workspace > span:nth-child(2)"))
      .click();
    const element = await user1.findElement(
      By.css(".new-workspace > span:nth-child(2)")
    );
    await user1.actions({ bridge: true }).move(element).perform();
    await user1
      .actions({ bridge: true })
      .move(await user1.findElement(By.css("body")), 0, 0)
      .perform();
    await user1
      .findElement(By.css(".MuiButtonBase-root:nth-child(2)"))
      .click();
    // Check that there's a toolbar
    const toolbar = await user1.wait(
      until.elementLocated(By.css(".toolbar")),
      5000
    );
    expect(toolbar).toBeDefined();
    // Check that there's a new tab, it's selected and has the correct label
    const tab = await user1.wait(
      until.elementLocated(
        By.css(".footer .tab-layout .tab.active .tab-label input")
      )
    );
    // Check that it's defined
    expect(tab).toBeDefined();
    // Check that it has the correct label
    expect(await tab.getAttribute("value")).toBe("Untitled (default)");
  });

  it("Creates a new tile without ccypair/strategy", async () => {
    const addButton = await user1.wait(
      until.elementLocated(By.css(".toolbar .content button:nth-child(1)"))
    );
    expect(addButton).toBeDefined();
    // Click the button
    addButton.click();
    // Find the new window
    const window = await user1.wait(
      until.elementLocated(By.css(".workspace .window-element"))
    );
    expect(window).toBeDefined();
    const currency = await user1.wait(
      until.elementLocated(
        By.css(".window-title-bar .item:nth-child(1) .select-container select")
      )
    );
    expect(await currency.getAttribute("value")).toBe("");
    const strategy = await user1.wait(
      until.elementLocated(
        By.css(".window-title-bar .item:nth-child(2) .select-container select")
      )
    );
    expect(await strategy.getAttribute("value")).toBe("");
  });

  it("Sets currency and strategy", async () => {
    const currency = await user1.wait(
      until.elementLocated(
        By.css(".window-title-bar .item:nth-child(1) .select-container")
      )
    );
    {
      const { expected, selected } = await selectItemFromDropdown(user1, currency, 2);
      expect(selected).toBe(expected);
    }
    const strategy = await user1.wait(
      until.elementLocated(By.css(".window-title-bar .item:nth-child(2) .select-container"))
    );
    {
      const { expected, selected } = await selectItemFromDropdown(user1, strategy, 1);
      expect(selected).toBe(expected);
    }
  });

  it("Creates a bid order successfully", () => {
  });
});
