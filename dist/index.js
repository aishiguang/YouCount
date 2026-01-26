"use strict";
const MINIMUM_SCORE = 5;
const OVERLAP_THRESHOLD = 5;
/**
 * Initializes the application.
 */
document.addEventListener('DOMContentLoaded', () => {
    main();
});
function main() {
    new GameController();
    new BulletinController();
}
/**
 * Controller class to manage the game.
 */
class Controller {
    get glyph() {
        const candidates = ['☺️', '😀', '😆', '👍', '❤️', '🐦‍⬛', '🦍', '🦧', '🦜'];
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    constructor() {
        this.width = 600;
        this.height = 800;
        this.glyphSize = 48;
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.init();
        new MobileController();
    }
    init() {
        var _a;
        this.canvas.height = this.height;
        this.canvas.width = this.width;
        // this.canvas.style.width = `${this.width}px`;
        // this.canvas.style.height = `${this.height}px`;
        this.context.font = `${this.glyphSize}px serif`;
        this.context.fillStyle = 'black';
        this.context.textBaseline = 'top';
        (_a = document.getElementById('app')) === null || _a === void 0 ? void 0 : _a.appendChild(this.canvas);
    }
    paint(count) {
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.font = `${this.glyphSize}px serif`;
        this.context.textAlign = 'left';
        const char = this.glyph;
        const items = [];
        let overlapCount = 0;
        while (items.length < count) {
            const postionX = Math.floor(Math.random() * (this.width - this.glyphSize));
            const postionY = Math.floor(Math.random() * (this.height - this.glyphSize));
            if (this.detectOverlap(items, postionX, postionY)) {
                overlapCount++;
                continue;
            }
            this.context.fillText(char, postionX, postionY);
            items.push([postionX, postionY]);
        }
        if (overlapCount > OVERLAP_THRESHOLD) {
            console.log(`Overlap detected ${overlapCount} times.`);
            this.glyphSize -= 2;
        }
    }
    statement(testemonial) {
        this.context.textAlign = 'center';
        this.context.fillStyle = 'black';
        this.context.font = `24px serif`;
        const lines = testemonial.split('\n');
        lines.forEach((line, index) => {
            this.context.fillText(line, this.width / 2, this.height / 2 + (index - .5 * (lines.length)) * 30);
        });
        this.context.textAlign = 'left';
    }
    detectOverlap(arrPoints, postionX, postionY) {
        for (const [x, y] of arrPoints) {
            if (postionX + this.glyphSize < x) {
                continue;
            }
            if (postionX > x + this.glyphSize) {
                continue;
            }
            if (postionY + this.glyphSize < y) {
                continue;
            }
            if (postionY > y + this.glyphSize) {
                continue;
            }
            return true;
        }
        return false;
    }
}
class GameController extends Controller {
    constructor() {
        super();
        this.score = null;
        this.answer = null;
        this.strCache = null;
        this.roundTimespan = 2000; // milliseconds
        this.keypressHandler = this.keyPress.bind(this);
        this.countdownTimer = null;
        this.startGame();
    }
    startCountdown() {
        this.stopCountdown();
        this.countdownTimer = window.setTimeout(() => {
            this.lose('Time Up!');
            this.stopCountdown();
        }, this.roundTimespan);
    }
    stopCountdown() {
        if (this.countdownTimer !== null) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }
    }
    lose(message) {
        var _a;
        this.statement([message,
            `It was ${this.answer}`,
            `Your Best Score: ${(_a = this.score) !== null && _a !== void 0 ? _a : 0}`,
            'Press Enter to try again!'].join('\n'));
    }
    keyPress(event) {
        var _a, _b, _c, _d;
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
        const lenCache = (_b = (_a = this.strCache) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
        this.strCache = ((_c = this.strCache) !== null && _c !== void 0 ? _c : '') + event.key;
        const digitsToGo = charAnswer.length - this.strCache.length;
        this.context.textAlign = 'center';
        this.context.font = `144px serif`;
        if (charAnswer[lenCache] === event.key) {
            if (digitsToGo > 0) {
                return;
            }
            this.context.fillStyle = 'green';
            this.score = Math.max((_d = this.score) !== null && _d !== void 0 ? _d : 0, this.answer);
            this.context.fillText(this.answer.toFixed(), this.width / 2, this.height / 2 - 48);
            this.statement([
                'Correct!',
                'Press Enter for the next round!'
            ].join('\n'));
        }
        else {
            const strAnswered = this.strCache + new Array(digitsToGo).fill('_').join('');
            this.context.strokeText(strAnswered, this.width / 2, this.height / 2 - 48);
            this.lose('Game Over!');
        }
        this.stopCountdown();
        this.context.textAlign = 'left';
    }
    nextGame() {
        var _a;
        this.strCache = null;
        const lastScore = (_a = this.score) !== null && _a !== void 0 ? _a : MINIMUM_SCORE;
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
class MobileController {
    constructor() {
        if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.init();
        }
    }
    init() {
        var _a;
        const softKeyboard = document.createElement('div');
        softKeyboard.id = 'soft-keyboard';
        (_a = document.getElementById('app')) === null || _a === void 0 ? void 0 : _a.appendChild(softKeyboard);
        const keys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Enter'];
        for (let i of keys) {
            const btn = document.createElement('button');
            btn.textContent = i.toString();
            btn.addEventListener('click', () => {
                const event = new KeyboardEvent('keydown', { key: i.toString() });
                document.body.dispatchEvent(event);
            });
            softKeyboard.appendChild(btn);
        }
    }
}
class BulletinController {
    constructor() {
        this.wrapper = document.getElementById('bulletin');
        this.sections = Array.from(this.wrapper.querySelectorAll('section'));
        const cron = () => {
            this.switchSection();
            setTimeout(() => {
                cron();
            }, 10000);
        };
        cron();
    }
    switchSection(index) {
        if (index === undefined) {
            index = Math.floor(Math.random() * this.sections.length);
        }
        this.sections.forEach((section, idx) => {
            section.style.display = idx === index ? 'block' : 'none';
        });
    }
}
