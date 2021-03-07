// Bucle optimizado para animaciones web.
/* eslint-disable func-names */
// Creating stuff.
const gameScreen = document.getElementById('gameScreen');
gameScreen.width = 540;
gameScreen.height = 540;
const screen = gameScreen.getContext('2d');
const bufferCanvas = document.createElement('canvas');
bufferCanvas.width = gameScreen.width;
bufferCanvas.height = gameScreen.height;
const bufferContext = bufferCanvas.getContext('2d');
const btnStart = document.getElementById('btnStartGame');

let squareMoving = null;
let target = null;

const fps = 60;
let gameLoopId = null;
let gameState = 'begin';
const dark = new Image();
dark.src = 'img/dark.png';
const bird = new Image();
bird.src = 'img/bird.png';
const nullSquare = new Image();
nullSquare.src = 'img/null.png';
const lblInfo = document.getElementById('lblInfo');
let time = 0;
let timeIntervalId = null;
let movements = 0;

// Stats.
// eslint-disable-next-line no-undef
const statsFps = new Stats();
// eslint-disable-next-line no-undef
const statsMs = new Stats();
statsFps.setMode(0); statsMs.setMode(1); // 0: fps, 1: ms
// Align top-left
statsFps.domElement.style.position = 'absolute';
statsFps.domElement.style.left = '0px';
statsFps.domElement.style.top = '0px';
// Align top-left
statsMs.domElement.style.position = 'absolute';
statsMs.domElement.style.left = '100px';
statsMs.domElement.style.top = '0px';
(function () {
  let lastTime = 0;
  const vendors = ['ms', 'moz', 'webkit', 'o'];

  for (let x = 0; x < vendors.length && !window.requestAnimationFrame; x += 1) {
    window.requestAnimationFrame = window[`${vendors[x]}RequestAnimationFrame`];
    window.cancelAnimationFrame = window[`${vendors[x]}CancelAnimationFrame`] || window[`${vendors[x]}CancelRequestAnimationFrame`];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = window.setTimeout(() => { callback(currTime + timeToCall); }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) { clearTimeout(id); };
  }
}());

// Class MouseListener.
function MouseListener() {
  // Properties.
  this.x = null; this.y = null;

  // Methods.
  this.listenMousedown = function (e) {
    const a = e || window.event;

    this.x = a.pageX - gameScreen.offsetLeft;
    this.y = a.pageY - gameScreen.offsetTop;
  };
  this.listenMouseup = function () {
    this.x = null;
    this.y = null;
  };
}

// Class Square.
function Square(xPosition, yPosition) {
  // Properties.
  this.xPos = xPosition; this.yPos = yPosition;

  // Methods.
  this.setPosition = function (lastX, lastY) {
    if (this.xPos < lastX) this.xPos += 30;
    else if (this.xPos > lastX) this.xPos -= 30;

    if (this.yPos < lastY) this.yPos += 30;
    else if (this.yPos > lastY) this.yPos -= 30;

    if (this.xPos === lastX && this.yPos === lastY) {
      clearInterval(squareMoving);
      squareMoving = null;
    }
  };
}

// Class Board.
function Board() {
  // Properties.
  this.points = new Array([]);
  this.points[0] = 0;
  this.points[1] = 180;
  this.points[2] = 360;
  this.points[3] = 540;
  this.squares = new Array([]);
  this.squares[0] = new Square(0, 0);
  this.squares[1] = new Square(180, 360);
  this.squares[2] = new Square(180, 180);
  this.squares[3] = new Square(0, 180);
  this.squares[4] = new Square(360, 360);
  this.squares[5] = new Square(360, 0);
  this.squares[6] = new Square(180, 0);
  this.squares[7] = new Square(360, 180);
  this.squares[8] = new Square(0, 360);

  // Methods.
  this.getCell = function (xPixel, yPixel) {
    const cell = {};

    if (xPixel >= this.points[0] && xPixel < this.points[1]) cell.x = 0;
    else if (xPixel >= this.points[1] && xPixel < this.points[2]) cell.x = 1;
    else if (xPixel >= this.points[2] && xPixel < this.points[3]) cell.x = 2;
    else return null;

    if (yPixel >= this.points[0] && yPixel < this.points[1]) cell.y = 0;
    else if (yPixel >= this.points[1] && yPixel < this.points[2]) cell.y = 1;
    else if (yPixel >= this.points[2] && yPixel < this.points[3]) cell.y = 2;
    else return null;

    return cell;
  };
  this.canMove = function (cell) {
    if (squareMoving === null) {
      for (let i = 1; i < 9; i += 1) {
        let leftCell = {};
        let topCell = {};
        let rightCell = {};
        let bottomCell = {};
        const seek1 = this.getCell(this.squares[i].xPos, this.squares[i].yPos);
        if (cell.x === seek1.x && cell.y === seek1.y) {
          leftCell.index = i; topCell.index = i; rightCell.index = i; bottomCell.index = i;
          if (cell.x === 0) { leftCell.x = null; topCell.x = 0; rightCell.x = 1; bottomCell.x = 0; }
          if (cell.x === 1) { leftCell.x = 0; topCell.x = 1; rightCell.x = 2; bottomCell.x = 1; }
          if (cell.x === 2) { leftCell.x = 1; topCell.x = 2; rightCell.x = null; bottomCell.x = 2; }
          if (cell.y === 0) { leftCell.y = 0; topCell.y = null; rightCell.y = 0; bottomCell.y = 1; }
          if (cell.y === 1) { leftCell.y = 1; topCell.y = 0; rightCell.y = 1; bottomCell.y = 2; }
          if (cell.y === 2) { leftCell.y = 2; topCell.y = 1; rightCell.y = 2; bottomCell.y = null; }

          if (leftCell.x === null || leftCell.y === null) leftCell = null;
          if (topCell.x === null || topCell.y === null) topCell = null;
          if (rightCell.x === null || rightCell.y === null) rightCell = null;
          if (bottomCell.x === null || bottomCell.y === null) bottomCell = null;

          for (let j = 1; j < 9; j += 1) {
            const seek2 = this.getCell(this.squares[j].xPos, this.squares[j].yPos);
            if (leftCell != null) {
              if (seek2.x === leftCell.x && seek2.y === leftCell.y) leftCell = null;
            }
            if (topCell != null) {
              if (seek2.x === topCell.x && seek2.y === topCell.y) topCell = null;
            }
            if (rightCell != null) {
              if (seek2.x === rightCell.x && seek2.y === rightCell.y) rightCell = null;
            }
            if (bottomCell != null) {
              if (seek2.x === bottomCell.x && seek2.y === bottomCell.y) bottomCell = null;
            }
          }
          if (leftCell != null) return leftCell;
          if (topCell != null) return topCell;
          if (rightCell != null) return rightCell;
          if (bottomCell != null) return bottomCell;
        }
      }
    }
    return null;
  };
}
const mouse = new MouseListener();
const board = new Board();
btnStart.onclick = function startGame() {
  btnStart.className = 'hide';
  gameState = 'game';
  timeIntervalId = setInterval(() => { time += 1; }, 1000);
};

function imageIsFit() {
  let isFit = true;

  for (let i = 0, y = 0; y < 3; y += 1) {
    for (let x = 0; x < 3; x += 1, i += 1) {
      if (board.squares[i].xPos !== board.points[x]
        || board.squares[i].yPos !== board.points[y]) isFit = false;
    }
  }

  return isFit;
}

function game() {
  if (imageIsFit() === false) {
    if (squareMoving === null && mouse.x != null && mouse.y != null) {
      target = board.canMove(board.getCell(mouse.x, mouse.y));

      if (target != null) {
        squareMoving = setInterval(() => {
          board.squares[target.index].setPosition(board.points[target.x], board.points[target.y]);
        }, 1000 / fps);
        movements += 1;
      }
    }

    lblInfo.innerHTML = `Game started<br>Time: ${time}s<br>Movements: ${movements}`;

    bufferContext.fillStyle = '#FFFFFF';
    bufferContext.fillRect(0, 0, bufferCanvas.width, bufferCanvas.height);
    for (let i = 0, y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1, i += 1) {
        if (x === 0 && y === 0) bufferContext.drawImage(nullSquare, 0, 0);
        else {
          bufferContext.drawImage(bird, board.points[x], board.points[y], 180, 180,
            board.squares[i].xPos, board.squares[i].yPos, 180, 180);
          bufferContext.beginPath();
          bufferContext.lineWidth = 2;
          bufferContext.strokeStyle = '#aaaaFF';
          bufferContext.rect(board.squares[i].xPos + 0.5,
            board.squares[i].yPos + 0.5, 180 - 0.5, 180 - 0.5);
          bufferContext.stroke();
        }
      }
    }
  } else {
    gameState = 'end';
    lblInfo.innerHTML += '<br><br><h5>Puzzle completed.</h5>Reload the page to start again.';
    document.getElementById('lblEndGame').className = '';
    bufferContext.drawImage(bird, 0, 0);
  }
}

window.onload = function gameLoop() {
  statsFps.begin();
  statsMs.begin();

  setTimeout(() => {
    gameLoopId = window.requestAnimationFrame(gameLoop);
  }, 30);
  if (gameState === 'begin') bufferContext.drawImage(dark, 0, 0);
  else if (gameState === 'game') game();
  else { window.cancelAnimationFrame(gameLoopId); clearInterval(timeIntervalId); }
  screen.drawImage(bufferCanvas, 0, 0);

  statsFps.end();
  statsMs.end();
};
