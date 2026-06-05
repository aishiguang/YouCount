import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { GameController, BulletinController } from "../src/index";

// jsdom ships without a canvas implementation; provide a minimal stub so
// Controller.constructor() can call getContext('2d') without throwing.
const mockCtx = {
  font: "",
  fillStyle: "",
  textBaseline: "",
  textAlign: "",
  clearRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
};

beforeAll(() => {
  // @ts-ignore – intentionally returning a partial stub
  HTMLCanvasElement.prototype.getContext = () => mockCtx;
});

function setupDOM() {
  document.body.innerHTML = `
    <div id="app"></div>
    <div id="bulletin">
      <section>Section A</section>
      <section>Section B</section>
      <section>Section C</section>
    </div>
  `;
}

// Replace the <body> element between tests to clear all event listeners
// accumulated by previous GameController instances.
function resetBody() {
  const parent = document.body.parentElement!;
  const fresh = document.createElement("body");
  parent.replaceChild(fresh, document.body);
}

function keydown(key: string) {
  document.body.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

beforeEach(() => {
  resetBody();
  setupDOM();
  jest.clearAllMocks();
});

afterEach(() => {
  location.hash = "";
  jest.useRealTimers();
});

describe("gameplay", () => {
  test("start new round", async () => {
    //@Given user is ready
    const game = new GameController();
    expect(game.answer).toBeNull();
    expect(game.countdownTimer).toBeNull();

    //@Given previous best score is N
    const N = game.score; // MINIMUM_SCORE (5) when no hash is set
    expect(N).toBeGreaterThan(0);
    jest.clearAllMocks(); // isolate fillText calls to the next step only

    //@When user hits Enter key
    keydown("Enter");

    //@Then a new round starts with a countdown
    expect(game.answer).not.toBeNull();
    expect(game.countdownTimer).not.toBeNull();
    game.stopCountdown();

    //@Then random count of glyphs is shown on the screen
    // paint() calls fillText once per glyph, so call count equals the answer
    expect(mockCtx.fillText).toHaveBeenCalledTimes(game.answer!);
  });

  test("random number per round", async () => {
    //@Given user starts a new round
    const game = new GameController();

    //@When previous best score is N
    const N = 9;
    game.score = N;

    //@Then the number of glyphs to count is a random number between N +- N \/ 3
    const range = N / 3;
    for (let i = 0; i < 30; i++) {
      game.nextGame();
      expect(game.answer).toBeGreaterThanOrEqual(Math.floor(N - range));
      expect(game.answer).toBeLessThanOrEqual(Math.ceil(N + range));
      game.stopCountdown();
    }
  });

  test("play a round", async () => {
    //@Given a number of glyphs are displayed on the screen
    const game = new GameController();
    game.score = 5;
    game.answer = 7;
    game.strCache = null;
    game.paint(game.answer);
    game.startCountdown();
    jest.clearAllMocks();

    //@When user counts and inputs the number
    keydown("7");

    //@Then if the input is correct, log score and a new round starts
    expect(game.score).toBe(7);           // best score updated
    expect(game.countdownTimer).toBeNull(); // countdown stopped; round over

    //@Then if the input is incorrect, the game ends and final score is displayed
    game.answer = 4;
    game.strCache = null;
    game.startCountdown();
    jest.clearAllMocks();
    keydown("9"); // wrong answer
    expect(game.countdownTimer).toBeNull();
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("Best Score"),
      expect.any(Number),
      expect.any(Number)
    );
  });

  test("multi-digit input", async () => {
    //@Given a number of glyphs greater than 9 are displayed on the screen
    const game = new GameController();
    game.answer = 42; // two-digit answer
    game.strCache = null;
    game.paint(game.answer);
    game.startCountdown();
    jest.clearAllMocks();

    //@When user inputs the count digit by digit
    keydown("4"); // first digit

    //@Then if the input digit is correct so far, show the input progress
    expect(game.strCache).toBe("4");        // partial input recorded
    expect(game.countdownTimer).not.toBeNull(); // still awaiting next digit

    //@Then if the input digit is incorrect, the game ends and final score is displayed
    keydown("9"); // wrong second digit (correct was '2')
    expect(game.countdownTimer).toBeNull();
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("Best Score"),
      expect.any(Number),
      expect.any(Number)
    );
  });

  test("bulletin board", async () => {
    //@Given the game is running
    jest.useFakeTimers();
    const bulletin = new BulletinController();
    const spy = jest.spyOn(bulletin, "switchSection");

    //@When 10 seconds pass
    jest.advanceTimersByTime(10000);

    //@Then the bulletin board switches to the next section
    expect(spy).toHaveBeenCalled();
    expect(bulletin.sections.filter((s) => s.style.display !== "none")).toHaveLength(1);
  });
});
