const MINIMUM_SCORE = 5;
const OVERLAP_THRESHOLD = 5;

/**
 * Initializes the application.
 */
document.addEventListener('DOMContentLoaded', () => {
  main();
});


function main(): void {
  new GameController();
  new BulletinController();
}

/**
 * Controller class to manage the game.
 */
class Controller {
  width = 600;
  height = 800;
  glyphSize = 48;
  canvas: HTMLCanvasElement;
  get glyph(): string {
    const candidates = ['☺️', '😀', '😆', '👍', '❤️', '🐦‍⬛', '🦍', '🦧', '🦜'];
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  context: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.init();
  }

  init(): void {
    this.canvas.height = this.height;
    this.canvas.width = this.width;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.context.font = `${this.glyphSize}px serif`;
    this.context.fillStyle = 'black';
    this.context.textBaseline = 'top';

    document.getElementById('app')?.appendChild(this.canvas);

  }

  paint(count: number): void {
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.font = `${this.glyphSize}px serif`;
    this.context.textAlign = 'left';

    const char = this.glyph;
    const items: [number, number][] = [];
    let overlapCount = 0;

    while (items.length < count) {
      const postionX = Math.floor(Math.random() * (this.width - this.glyphSize));
      const postionY = Math.floor(Math.random() * (this.height - this.glyphSize));
      if (this.detectOverlap(items, postionX, postionY)){
        overlapCount++;
        continue; 
      }
      this.context.fillText(char, postionX, postionY);
      items.push([postionX, postionY]);
    }

    if (overlapCount > OVERLAP_THRESHOLD){
      console.log(`Overlap detected ${overlapCount} times.`);
      this.glyphSize -= 2;
    } 
  }

  statement(testemonial: string): void {
    this.context.textAlign = 'center';
    this.context.fillStyle = 'black';
    this.context.font = `24px serif`;
    const lines = testemonial.split('\n');
    lines.forEach((line, index) => {
      this.context.fillText(line, this.width / 2, this.height / 2 + (index - .5 * (lines.length)) * 30);
    });
    this.context.textAlign = 'left';
  }

  detectOverlap(arrPoints: [number, number][], postionX: number, postionY: number): boolean {
    for (const [x, y] of arrPoints) {
      if (postionX  + this.glyphSize < x){
        continue;
      }
      if (postionX > x + this.glyphSize){
        continue;
      }
      if (postionY + this.glyphSize < y){
        continue;
      }
      if (postionY > y + this.glyphSize){
        continue;
      }
      return true;
    }
    return false;
  }
}

class GameController extends Controller {
  score: number | null = null;
  answer: number | null = null;
  strCache: string | null = null;

  roundTimespan = 2000; // milliseconds

  keypressHandler = this.keyPress.bind(this);

  countdownTimer: number | null = null;

  constructor() {
    super();
    this.startGame();
  }

  startCountdown(): void {
    this.stopCountdown();
    this.countdownTimer = window.setTimeout(() => {
      this.lose('Time Up!');
      this.stopCountdown();
    }, this.roundTimespan);
  }

  stopCountdown(): void {
    if (this.countdownTimer !== null) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  lose(message?: string): void {
    this.statement([message, 
      `It was ${this.answer}`,
      `Your Best Score: ${this.score ?? 0}`,
      'Press Enter to try again!'
    ].join('\n'));
  }

  keyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.nextGame();
      return;
    }

    if (!'1234567890'.includes(event.key)) {
      return;
    }

    if (this.answer === null) {
      return;
    }

    if (this.countdownTimer === null) {
      return;
    }

    const charAnswer = this.answer.toFixed().split('');
    const lenCache = this.strCache?.length ?? 0;

    this.strCache = (this.strCache ?? '') + event.key;
    const digitsToGo = charAnswer.length - this.strCache.length;

    this.context.textAlign = 'center';
    this.context.font = `144px serif`;
    if (charAnswer[lenCache] === event.key) {
      if (digitsToGo > 0) {
        return
      }
      this.context.fillStyle = 'green';
      this.score = Math.max(this.score ?? 0, this.answer);
      this.context.fillText(this.answer.toFixed(), this.width / 2, this.height / 2 - 48);
      this.statement([
        'Correct!',
        'Press Enter for the next round!'
      ].join('\n'));
    } else {
      const strAnswered = this.strCache + new Array(digitsToGo).fill('_').join('');
      this.context.strokeText(strAnswered, this.width / 2, this.height / 2 - 48);
      this.lose('Game Over!');
    }
    this.stopCountdown();
    this.context.textAlign = 'left';
  }

  nextGame(): void {
    this.strCache = null;
    const lastScore = this.score ?? MINIMUM_SCORE;
    const randomRange = lastScore / 3;
    const randomDiff = Math.round(Math.random() * randomRange - .5 * randomRange);
    this.answer = lastScore + randomDiff;
    this.paint(this.answer);
    console.log(`Current Score: ${this.score}`, randomDiff, this.answer);
    this.startCountdown();
  }

  startGame() {
    document.body.removeEventListener('keydown', this.keypressHandler);
    document.body.addEventListener('keydown', this.keypressHandler);
    this.statement([
      'Can you count without counting?',
      '',
      'You have 2 seconds to GUESS how', 
      'many glyphs appear on screen.',
      'Key in the number to submit your answer.',
      '',
      'This is how animals in the', 'wild estimate quantities quickly.',
      '',
      'Press Enter to start!',
      '',
      'In much the same way, auto-regressive AI counts too.'
    ].join('\n'));
  }
}


class BulletinController {
  wrapper: HTMLDivElement;
  sections: HTMLElement[];
  constructor() {
    this.wrapper = document.getElementById('bulletin') as HTMLDivElement;
    this.sections = Array.from(this.wrapper.querySelectorAll('section'));
    const cron = () => {
      this.switchSection();
      setTimeout(() => {
        cron();
      }, 10000);
    }
    cron();
  }
  switchSection(index?: number): void {
    if (index === undefined) {
      index = Math.floor(Math.random() * this.sections.length);
    }
    this.sections.forEach((section, idx) => {
      section.style.display = idx === index ? 'block' : 'none';
    });
  }
}