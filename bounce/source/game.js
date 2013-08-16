/*jslint browser: true */
/*global Utils, Storage, Audio */

(function () {
	"use strict";
	
	var board, ship, ball, tail, bricks, sound, scores, zoom,
		container, header, paragrath, counter,
		animation, startTime, keyPressed, shortcuts,
		messages = {
			mainScreen:   [ "Bounce",     "Select a game"      ],
			paused:       [ "Paused",     "Continue the game?" ],
			gameOver:     [ "GameOver",   "Select an option"   ],
			gameOverSave: [ "GameOver",   "Write your name"    ],
			highScores:   [ "HighScores", "Select a game"      ],
			help:         [ "Help",       "Game controls"      ]
		},
		soundFiles    = [ "bounce", "brick", "end" ],
		fastKeys      = [ 37, 65, 39, 68 ],
		speedInc      = 0.05,					/** @const By how much the speed increases		*/
		minSpeed      = 4,						/** @const Minimum random speed					*/
		maxSpeed      = 8,						/** @const Maximum random speed					*/
		minAngle      = 30,						/** @const Minimum random angle					*/
		maxAngle      = 75,						/** @const Maximum random angle					*/
		minShipWidth  = 30,						/** @const Minimum width of the ship			*/
		shipDecrease  = 10,						/** @const Amount of pixels to decrease the width of the ship	*/
		brickHeight   = 25,						/** @const Brick Height							*/
		brickWidth    = 46,						/** @const Brick Width							*/
		bottomBricks  = 196,					/** @const Brick Height * Vertical Bricks		*/
		horizBricks   = 5,						/** @const Amount of horizontal bricks			*/
		vertBricks    = 4,						/** @const Amount of vertical bricks			*/
		tailsAmount   = 15,						/** @const Amount of tails						*/
		tailDistance  = 8,						/** @const Distance between each tail			*/
		maxScores     = 5,						/** @const Maximum scores displayed				*/
		soundStorage  = "bounce.sound",			/** @const The name of the Sound Storage		*/
		scoresStorage = "bounce.hs.",			/** @const The name of the High Scores Storage	*/
		zoomStorage   = "bounce.zoom",			/** @const The name of the Zoom Storage			*/
		gameDisplay   = "mainScreen",
		gameMode      = "speed",
		gameScore     = 0,
		hasStarted    = false;


	/**
	 * Modes and Display Functions
	 */
	function isSpeedMode() {  return gameMode    === "speed";   }
	function isRandomMode() { return gameMode    === "random";  }
	function isBricksMode() { return gameMode    === "bricks";  }
	function isPaused() {     return gameDisplay === "paused";  }
	function isPlaying() {    return gameDisplay === "playing"; }
	
	
	/**
	 * Key Press Event
	 * @param {number} key
	 * @param {?Event} event
	 */
	function pressKey(key, event) {
		if (scores.isFocused()) {
			if (key === 13) {
				scores.save();
			}
		} else {
			if (!isPlaying()) {
				event.preventDefault();
			}
			
			if ([69, 49, 97].indexOf(key) > -1) {			// E / 1
				key = "E";
			} else if ([82, 50, 98].indexOf(key) > -1) {	// R / 2
				key = "R";
			} else if ([75, 51, 99].indexOf(key) > -1) {	// K / 3
				key = "C";
			} else if ([8, 66, 78].indexOf(key) > -1) {		// Backspace / B / N
				key = "B";
			} else if ([13, 32, 79].indexOf(key) > -1) {	// Enter / Space / O
				key = "O";
			} else if ([80, 67].indexOf(key) > -1) {		// P / C
				key = "P";
			} else if ([37, 65].indexOf(key) > -1) {		// Left  / A
				key = "A";
			} else if ([39, 68].indexOf(key) > -1) {		// Right / D
				key = "D";
			} else {
				key = String.fromCharCode(key);
			}
			
			if (shortcuts[gameDisplay][key]) {
				shortcuts[gameDisplay][key]();
			}
		}
	}
	
	/**
	 * Key handler for the on key down event
	 * @param {$.Event} event
	 */
	function onKeyDown(event) {
		if (isPlaying() && fastKeys.indexOf(event.keyCode) > -1) {
			if (keyPressed === null) {
				keyPressed = event.keyCode;
			} else {
				return;
			}
		}
		pressKey(event.keyCode, event);
	}
	
	/**
	 * Key handler for the on key up event
	 * @param {$.Event} event
	 */
	function onKeyUp() {
		keyPressed = null;
	}
	
	/**
	 * When a key is pressed, this is called on each frame for fast key movements
	 */
	function onKeyHold() {
		if (keyPressed !== null && isPlaying()) {
			pressKey(keyPressed);
		}
	}
	
	
	/**
	 * Request an animation frame
	 */
	function requestAnimation() {
		startTime = new Date().getTime();
		animation = Utils.requestAnimationFrame(function () {
			var time  = new Date().getTime() - startTime,
				speed = time / 16;
			
			if (speed < 0) {
				speed = 0;
			}
			if (speed > 5) {
				return requestAnimation();
			}
			
			if (hasStarted) {
				ball.move(speed);
			}
			onKeyHold();
			
			if (isPlaying()) {
				requestAnimation();
			}
		});
	}
	
	/**
	 * Cancel an animation frame
	 */
	function cancelAnimation() {
		Utils.cancelAnimationFrame(animation);
	}
	
	
	/**
	 * Increases the Score
	 */
	function increaseScore() {
		gameScore += 1;
		counter.innerHTML = gameScore;
	}
	
	/**
	 * Show the messages
	 */
	function showMessage() {
		container.className = gameDisplay;
		header.innerHTML    = messages[gameDisplay][0];
		paragrath.innerHTML = messages[gameDisplay][1];
	}
	
	/**
	 * Hide the messages
	 */
	function hideMessage() {
		container.className = "playing";
	}
	
	
	/**
	 * Show the Main Screen
	 */
	function showMainScreen() {
		gameDisplay = "mainScreen";
		showMessage();
	}
	
	/**
	 * Start the Game
	 */
	function startGame() {
		hasStarted = true;
		ball.start();
	}
	
	/**
	 * Finish the Game
	 */
	function finishGame() {
		board.end();
		bricks.destroy();
		showMainScreen();
	}
	
	/**
	 * Show the required game parts
	 */
	function showGame() {
		hideMessage();
		board.start();
	}
	
	/**
	 * Hide the required game parts
	 */
	function hideGame() {
		showMessage();
		board.end();
	}
	
	/**
	 * Pauses the game
	 */
	function startPause() {
		gameDisplay = "paused";
		hideGame();
	}
	
	/**
	 * Unpauses the game
	 */
	function endPause() {
		gameDisplay = "playing";
		showGame();
		
		if (hasStarted) {
			requestAnimation();
		}
	}
	
	/**
	 * Game Over
	 */
	function gameOver() {
		gameDisplay = Utils.supportsStorage() ? "gameOverSave" : "gameOver";
		hideGame();
		scores.setInput();
		board.end();
		bricks.destroy();
	}
	
	/**
	 * Show the High Scores
	 */
	function showHighScores() {
		gameDisplay = "highScores";
		showMessage();
	}
	
	/**
	 * Show the Help
	 */
	function showHelp() {
		gameDisplay = "help";
		showMessage();
	}
	
	
	
	/**
	 * @constructor
	 * Board Manager
	 */
	function Board() {
		this.element  = document.querySelector(".board");
		this.width    = this.element.offsetWidth;
		this.height   = this.element.offsetHeight;
		this.position = Utils.getPosition(this.element);
		this.border   = 10;
		
		this.element.addEventListener("click", function (e) {
			if (!hasStarted) {
				startGame();
			} else {
				startPause();
			}
		});
	}
	
	/**
	 * Add the event listeners
	 */
	Board.prototype.start = function () {
		this.element.addEventListener("mousemove", function (e) {
			ship.mouseMove(e);
		});
	};
	
	/**
	 * Remove the event listeners
	 */
	Board.prototype.end = function () {
		this.element.removeEventListener("mousemove", function (e) {
			ship.mouseMove(e);
		});
	};
	
	/**
	 * Sub Functions
	 */
	Board.prototype.getElement = function () { return this.element;       };
	Board.prototype.getWidth   = function () { return this.width;         };
	Board.prototype.getHeight  = function () { return this.height;        };
	Board.prototype.getBorder  = function () { return this.border;        };
	Board.prototype.getTop     = function () { return this.position.top;  };
	Board.prototype.getLeft    = function () { return this.position.left; };
	
	
	
	/**
	 * @constructor
	 * Ship Manager
	 */
	function Ship() {
		this.element = board.getElement().getElementsByClassName("ship")[0];
		this.width   = isBricksMode() ? 120 : 50;
		this.top     = board.getHeight() - this.element.offsetHeight - 5;
		this.left    = (board.getWidth() - this.element.offsetWidth) / 2;
		
		this.setWidth();
		this.setTop();
		this.setLeft();
	}
	
	/**
	 * Set the width property of the element
	 */
	Ship.prototype.setWidth = function () {
		this.element.style.width = this.width + "px";
	};
	
	/**
	 * Set the top property of the element
	 */
	Ship.prototype.setTop = function () {
		this.element.style.top = this.top + "px";
	};
	
	/**
	 * Set the left property of the element
	 */
	Ship.prototype.setLeft = function () {
		this.element.style.left = this.left + "px";
	};
	
	/**
	 * Move the Ship using the mouse
	 */
	Ship.prototype.mouseMove = function (e) {
		var mouseLeft  = Utils.getMousePos(e).left,
			shipHalth  = this.width / 2,
			boardLeft  = board.getLeft() - board.getBorder(),
			boardRight = board.getLeft() + board.getWidth() + board.getBorder(),
			leftSide   = board.getLeft() + shipHalth,
			rightSide  = board.getLeft() + board.getWidth() - shipHalth,
			shipLeft   = 0;
		
		if (mouseLeft < boardLeft || mouseLeft > boardRight) {
			return;
		} else if (mouseLeft >= leftSide && mouseLeft <= rightSide) {
			shipLeft = mouseLeft - board.getLeft() - shipHalth;
		} else if (mouseLeft > rightSide) {
			shipLeft = rightSide - board.getLeft() - shipHalth;
		}
		this.doMove(shipLeft);
	};
	
	/**
	 * Move the Ship using the keyboard
	 */
	Ship.prototype.keyMove = function (direction) {
		var left  = this.left + 10 * direction,
			maxim = board.getWidth() - this.width;
		
		if (left < 0) {
			left = 0;
		}
		if (left > maxim) {
			left = maxim;
		}
		
		this.doMove(left);
	};
	
	/**
	 * Move the Ship
	 */
	Ship.prototype.doMove = function (left) {
		if (left !== this.left) {
			this.left = left;
			this.setLeft();
			
			if (!hasStarted) {
				ball.setStartLeft();
				tail.start();
			}
		}
	};
	
	/**
	 * Change the Style when the ball crashes the ship
	 */
	Ship.prototype.ballCrash = function () {
		var self = this;
		this.element.style.top = (this.top + 2) + "px";
		setTimeout(function () { self.setTop(); }, 100);
	};
	
	/**
	 * Reduce the width of the ship
	 */
	Ship.prototype.reduceWidth = function () {
		if (this.width > minShipWidth) {
			this.width -= shipDecrease;
			this.left  -= shipDecrease / 2;
			this.setWidth();
			this.setLeft();
		}
	};
	
	/**
	 * Sub Functions
	 */
	Ship.prototype.getTop   = function () { return this.top;   };
	Ship.prototype.getLeft  = function () { return this.left;  };
	Ship.prototype.getWidth = function () { return this.width; };
	
	
	
	/**
	 * @constructor
	 * Ball Manager
	 */
	function Ball() {
		this.element = board.getElement().querySelector(".ball");
		this.angle   = Utils.rand(50, 70);
		this.dirTop  = -1;
		this.dirLeft = -1;
		this.speed   = minSpeed;
		this.size    = this.element.offsetWidth;
		this.top     = 0;
		this.left    = 0;
		
		this.setStartTop();
		this.setStartLeft();
	}
	
	/**
	 * Set the top start position
	 */
	Ball.prototype.setStartTop = function () {
		this.top = Math.round(ship.getTop() - this.size);
		this.setTop();
	};
	
	/**
	 * Set the left start position
	 */
	Ball.prototype.setStartLeft = function () {
		this.left = Math.round(ship.getLeft() + (ship.getWidth() - this.size) / 2);
		this.setLeft();
	};
	
	/**
	 * Move the ball when starting
	 */
	Ball.prototype.start = function () {
		this.top -= 1;
	};
	
	/**
	 * Move after starting
	 * @param {number} speed - The animation speed
	 */
	Ball.prototype.move = function (speed) {
		var movey = this.angle / 90, crash;
		
		tail.move(this.top, this.left);
		this.top  += this.speed * this.dirTop * movey * speed;
		this.left += this.speed * this.dirLeft * (1 - movey) * speed;
		
		this.setTop();
		this.setLeft();
		
		if (isBricksMode() && bricks.crash()) {
			sound.brick();
			increaseScore();
			this.randomChange();
		} else {
			crash = this.dirTop  < 0 ? this.topCrash() : this.shipCrash();
			if (!crash) {
				this.bottomCrash();
				crash = this.dirLeft < 0 ? this.leftCrash() : this.rightCrash();
			}
		}
	};
	
	/**
	 * If the ball crashed the top wall, change the direction, angle and speed
	 * @return {boolean} True if the ball crashed the top wall
	 */
	Ball.prototype.topCrash = function () {
		if (this.top <= 0) {
			this.dirTop = 1;
			this.wallCrash();
			return true;
		}
		return false;
	};
	
	/**
	 * If the ball crashed the left wall, change the direction, angle and speed
	 * @return {boolean} True if the ball crashed the left wall
	 */
	Ball.prototype.leftCrash = function () {
		if (this.left <= 0) {
			this.dirLeft = 1;
			this.wallCrash();
			return true;
		}
		return false;
	};
	
	/**
	 * If the ball crashed the right wall, change the direction, angle and speed
	 * @return {boolean} True if the ball crashed the right wall
	 */
	Ball.prototype.rightCrash = function () {
		if (this.left + this.size >= board.getWidth()) {
			this.dirLeft = -1;
			this.wallCrash();
			return true;
		}
		return false;
	};
	
	/**
	 * Called when the ball crashed any wall
	 */
	Ball.prototype.wallCrash = function () {
		if (isRandomMode() || isBricksMode()) {
			this.randomChange();
		}
	};
	
	/**
	 * If the ball went through the bottom wall, game over
	 * @return {boolean} True if the ball went through the bottom wall
	 */
	Ball.prototype.bottomCrash = function () {
		if (this.top + this.size >= board.getHeight()) {
			sound.end();
			gameOver();
			return true;
		}
		return false;
	};
	
	/**
	 * If the ball crashed the ship, perform the required actions
	 */
	Ball.prototype.shipCrash = function () {
		if (this.onShip()) {
			this.dirTop = -1;
			sound.bounce();
			ship.ballCrash();
		 	
			if (isSpeedMode()) {
				this.changeAngle();
				this.accelerate();
			}
			if (isSpeedMode() || isRandomMode()) {
				increaseScore();
			}
			if (isBricksMode()) {
				bricks.restart();
			}
			return true;
		}
		return false;
	};
	
	/**
	 * Change the angle
	 */
	Ball.prototype.changeAngle = function () {
		var pos   = this.left + this.size / 2 - ship.getLeft() + 5,
			width = ship.getWidth() + 10;
		
		this.angle = Math.floor(pos * 180 / width);
		if (this.angle > 90) {
			this.angle = 180 - this.angle;
		}
		if (this.angle > 75) {
			this.angle = 75;
		}
		if (this.angle < 20) {
			this.angle = 20;
		}
		
		if (this.dirLeft === 1 && pos < width / 2) {
			this.dirLeft = -1;
		} else if (this.dirLeft === -1 && pos > width / 2) {
			this.dirLeft = 1;
		}
	};
	
	/**
	 * Increase the speed
	 */
	Ball.prototype.accelerate = function () {
		this.speed += speedInc;
	};
	
	/**
	 * Randomly change the angle and speed
	 */
	Ball.prototype.randomChange = function () {
		this.angle = Utils.rand(minAngle, maxAngle);
		this.speed = Utils.rand(minSpeed, maxSpeed);
	};
	
	/**
	 * Check if the ball is touching the ship
	 * @return {boolean}
	 */
	Ball.prototype.onShip = function () {
		var sTop   = ship.getTop(),
			sLeft  = ship.getLeft() - 5,
			sWidth = ship.getWidth() + 10,
			bLeft  = this.left + this.size / 2;
		
		return (this.top + this.size >= sTop && bLeft >= sLeft && bLeft <= sLeft + sWidth);
	};
	
	/**
	 * Sub functions
	 */
	Ball.prototype.setTop     = function () { this.element.style.top  = this.top + "px";  };
	Ball.prototype.setLeft	  = function () { this.element.style.left = this.left + "px"; };
	Ball.prototype.setDirTop  = function (dir) { this.dirTop = dir;  };
	Ball.prototype.setDirLeft = function (dir) { this.dirLeft = dir; };
	
	Ball.prototype.getSize    = function () { return this.size; };
	Ball.prototype.getTop     = function () { return this.top;  };
	Ball.prototype.getLeft    = function () { return this.left; };
	
	
	
	/**
	 * @constructor
	 * Tail Manager
	 */
	function Tail() {
		this.elements = [];
		
		var container = document.querySelector(".tail"), i, div;
		for (i = 0; i < tailsAmount; i += 1) {
			div = document.createElement("DIV");
			container.appendChild(div);
			
			this.elements.push({
				element: div,
				top:     0,
				left:    0
			});
		}
		
		this.start();
	}
	
	/**
	 * Sets the initial positions of the tails elements
	 */
	Tail.prototype.start = function () {
		var top  = ball.getTop(),
			left = ball.getLeft();
		
		this.elements.forEach(function (data) {
			data.top  = top;
			data.left = left;
		});
		this.setPosition();
	};
	
	/**
	 * Move the tail
	 * @param {number} top
	 * @param {number} left
	 */
	Tail.prototype.move = function (top, left) {
		var oldTop, oldLeft, first = this.elements[0];
		
		if (Math.abs(top - first.top) < tailDistance || Math.abs(left - first.left) < tailDistance) {
			return;
		}
		this.elements.forEach(function (data) {
			oldTop  = data.top;
			oldLeft = data.left;
			
			data.top  = top;
			data.left = left;
			
			top  = oldTop;
			left = oldLeft;
		});
		this.setPosition();
	};
	
	/**
	 * Sets the position of each element
	 */
	Tail.prototype.setPosition = function () {
		var self = this;
		this.elements.forEach(function (data) {
			data.element.style.top  = data.top  + "px";
			data.element.style.left = data.left + "px";
		});
	};
	
	
	
	/**
	 * @constructor
	 * Bricks Manager
	 */
	function Bricks() {
		if (isBricksMode()) {
			this.container = document.querySelector(".bricks");
			this.elements  = [];
			this.create();
		}
	}
	
	/**
	 * Destroys the bricks
	 */
	Bricks.prototype.destroy = function () {
		if (isBricksMode()) {
			this.removeContent();
		}
	};
		
	/**
	 * Creates the bricks
	 */
	Bricks.prototype.create = function () {
		var i, j;
		for (i = 0; i < vertBricks; i += 1) {
			for (j = 0; j < horizBricks; j += 1) {
				this.createBrick(i, j);
			}
		}
		this.elements.reverse();
		
		this.container.classList.add("fade");
		setTimeout(function () {
			bricks.container.classList.remove("fade");
		}, 1000);
	};
	
	/**
	 * Creates a single brick
	 * @param {number} row
	 * @param {number} column
	 */
	Bricks.prototype.createBrick = function (row, column) {
		var data = {
			element: document.createElement("DIV"),
			top:     brickHeight * row,
			left:    brickWidth  * column
		};
		data.element.style.top  = data.top  + "px";
		data.element.style.left = data.left + "px";
		
		this.container.appendChild(data.element);
		this.elements.push(data);
	};
	
	/**
	 * Check if the Ball crashed any brick and remove it when it did
	 * @return {boolean} True if the ball crashed a brick
	 */
	Bricks.prototype.crash = function () {
		var self = this;
		
		if (ball.getTop() > bottomBricks) {
			return false;
		} else {
			return this.elements.some(function (element, index) {
				if (self.bottomCrash(element) || self.leftCrash(element) ||
						self.rightCrash(element) || self.topCrash(element)) {
					self.remove(element, index);
					return true;
				}
				return false;
			});
		}
	};
	
	/**
	 * If the ball crashed the bottom part of the brick, change the ball direction
	 * @param {{element: DOM, top: number, left: number}} element
	 * @return {boolean} True if the ball crashed the bottom part of the brick
	 */
	Bricks.prototype.bottomCrash = function (element) {
		var top  = ball.getTop(),
			left = ball.getLeft() + ball.getSize() / 2;
		
		if (this.pointInElement(top, left, element)) {
			ball.setDirTop(1);
			return true;
		}
		return false;
	};
	
	/**
	 * If the ball crashed the left part of the brick, change the ball direction
	 * @param {{element: DOM, top: number, left: number}} element
	 * @return {boolean} True if the ball crashed the left part of the brick
	 */
	Bricks.prototype.leftCrash = function (element) {
		var top  = ball.getTop()  + ball.getSize() / 2,
			left = ball.getLeft() + ball.getSize();
		
		if (this.pointInElement(top, left, element)) {
			ball.setDirLeft(-1);
			return true;
		}
		return false;
	};
	
	/**
	 * If the ball crashed the right part of the brick, change the ball direction
	 * @param {{element: DOM, top: number, left: number}} element
	 * @return {boolean} True if the ball crashed the right part of the brick
	 */
	Bricks.prototype.rightCrash = function (element) {
		var top  = ball.getTop() + ball.getSize() / 2,
			left = ball.getLeft();
		
		if (this.pointInElement(top, left, element)) {
			ball.setDirLeft(-1);
			return true;
		}
		return false;
	};
	
	/**
	 * If the ball crashed the top part of the brick, change the ball direction
	 * @param {{element: DOM, top: number, left: number}} element
	 * @return {boolean} True if the ball crashed the top part of the brick
	 */
	Bricks.prototype.topCrash = function (element) {
		var top  = ball.getTop()  + ball.getSize(),
			left = ball.getLeft() + ball.getSize() / 2;
		
		if (this.pointInElement(top, left, element)) {
			ball.setDirTop(-1);
			return true;
		}
		return false;
	};
	
	/**
	 * Destroys a Brick at the given index
	 * @param {{element: DOM, top: number, left: number}} element
	 * @param {number} index
	 */
	Bricks.prototype.remove = function (element, index) {
		this.elements.splice(index, 1);
		
		var el = element.element;
		el.style.borderWidth = "15px";
		
		setTimeout(function (el) {
			Utils.removeElement(el);
		}, 500, el);
	};
	
	/**
	 * Recreate the bricks and reduce the ship width
	 */
	Bricks.prototype.restart = function () {
		if (this.elements.length === 0) {
			this.removeContent();
			this.create();
			ship.reduceWidth();
		}
	};
	
	/**
	 * Destroys all the bricks
	 */
	Bricks.prototype.removeContent = function () {
		this.container.innerHTML = "";
	};
	
	/**
	 * Check if a given position is inside a given element
	 * @param {number} top
	 * @param {number} left
	 * @param {{element: DOM, top: number, left: number}} element
	 * @return {boolean}
	 */
	Bricks.prototype.pointInElement = function (top, left, element) {
		return (
			top  >= element.top  && top  <= element.top  + brickHeight &&
			left >= element.left && left <= element.left + brickWidth
		);
	};
	
	
	
	/**
	 * @constructor
	 * Sound Controller
	 */
	function Sound() {
		this.data   = new Storage(soundStorage);
		this.audio  = document.querySelector(".audio");
		this.waves  = document.querySelector(".waves");
		this.format = Utils.supportsOGG() ? ".ogg" : (Utils.supportsMP3() ? ".mp3" : null);
		this.mute   = this.getMute();
		
		if (this.format) {
			this.setSounds();
			this.setDisplay();
		} else {
			this.audio.style.display = "none";
		}
	}
	
	/**
	 * Create all the Sound Functions
	 */
	Sound.prototype.setSounds = function () {
		var audio, self = this;
		
		soundFiles.forEach(function (sound) {
			self[sound] = function () {
				audio = new Audio("audio/" + sound + self.format);
				if (self.format && !self.mute) {
					audio.play();
				}
			};
		});
	};
	
	/**
	 * Mute/Unmute the sound
	 */
	Sound.prototype.toggle = function () {
		this.setMute(!this.mute);
		this.setDisplay();
	};
	
	/**
	 * Returns true if the sound is mute
	 * @return {boolean}
	 */
	Sound.prototype.getMute = function () {
		return this.data.get("sound");
	};
	
	/**
	 * Sets and saves the mute option
	 * @param {boolean} mute
	 */
	Sound.prototype.setMute = function (mute) {
		this.mute = mute;
		this.data.set("sound", this.mute);
	};
	
	/**
	 * Sets the display of the sound waves
	 */
	Sound.prototype.setDisplay = function () {
		this.waves.style.display = this.mute ? "none" : "block";
	};
	
	
	
	/**
	 * @constructor
	 * The Game High Scores
	 */
	function HighScores() {
		this.input  = document.querySelector(".input input");
		this.scores = document.querySelector(".scores");
		this.none   = document.querySelector(".none");
		this.mode   = "";
		this.data   = {};
		this.total  = 0;
	
		this.input.onfocus = function () { this.focused = true;  };
		this.input.onblur  = function () { this.focused = false; };
	}
	
	/**
	 * Creates the high scores for the given mode
	 * @param {string} mode
	 */
	HighScores.prototype.create = function (mode) {
		this.mode  = mode;
		this.data  = new Storage(scoresStorage + this.mode);
		this.total = this.data.get("total") || 0;
	};
	
	/**
	 * Show the Scores for the given mode
	 * @param {string} mode
	 */
	HighScores.prototype.show = function (mode) {
		this.scores.innerHTML = "";
		this.create(mode);
		this.showHideNone(this.total === 0);
		
		if (this.total > 0) {
			this.displayScores();
		}
	};
	
	/**
	 * Create each score line and place it in the DOM
	 */
	HighScores.prototype.displayScores = function () {
		var i, data, div;
		
		for (i = 1; i <= this.total; i += 1) {
			data = this.data.get(i);
			div	 = document.createElement("DIV");
			div.className = "highScore";
			div.innerHTML = "<div class='name'>" + data.name + "</div>" +
							"<div class='score'>" + Utils.formatNumber(data.score, ",") + "</div>";
			
			this.scores.appendChild(div);
		}
	};
	
	/**
	 * Tries to save a score, when possible
	 */
	HighScores.prototype.save = function () {
		if (this.input.value && Utils.supportsStorage()) {
			this.create(gameMode);
			this.saveData();
			
			showHighScores();
			this.show(this.mode);
		}
	};
	
	/**
	 * Gets the scores and adds the new one in the right position, updating the total, when possible
	 */
	HighScores.prototype.saveData = function () {
		var i, hs, data = [], saved = false, self = this,
			actual = {
				name:  this.input.value,
				score: gameScore
			};
		
		for (i = 1; i <= this.total; i += 1) {
			hs = this.data.get(i);
			if (!saved && hs.score < actual.score) {
				data[data.length] = actual;
				saved = true;
			}
			if (data.length < maxScores) {
				data[data.length] = hs;
			}
		}
		if (!saved && data.length < maxScores) {
			data[data.length] = actual;
		}
		
		this.data.set("total", data.length);
		data.forEach(function (element) {
			self.data.set(i + 1, element);
		});
	};
	
	/**
	 * Shows or hides the no results element
	 */
	HighScores.prototype.showHideNone = function (show) {
		this.none.style.display = show ? "block" : "none";
	};
	
	/**
	 * Sets the input value and focus it
	 */
	HighScores.prototype.setInput = function () {
		this.input.value = "";
		this.input.focus();
	};
	
	/**
	 * Returns true if the input is focus
	 */
	HighScores.prototype.isFocused = function () {
		return this.input.focused;
	};
	
	
	
	/**
	 * @constructor
	 * Game Zoom
	 */
	function Zoom() {
		this.element = document.querySelector(".zoom");
		this.name    = zoomStorage;
		this.values  = [ "1.0", "1.2", "1.4", "1.6", "1.8", "2.0" ];
		this.current = 0;
		this.style   = null;
		
		if (Utils.supportsStorage() && window.localStorage[this.name]) {
			this.current = parseInt(window.localStorage[this.name], 10);
			if (this.current > 0) {
				this.setContent();
				this.setStyle();
			}
		}
	}
	
	/**
	 * Change the zoom
	 */
	Zoom.prototype.change = function () {
		this.current += 1;
		if (this.current === this.values.length) {
			this.current = 0;
		}
		this.setContent();
		this.setStyle();
		
		if (Utils.supportsStorage()) {
			window.localStorage[this.name] = this.current;
		}
	};
	
	/**
	 * Set the new zoom value
	 */
	Zoom.prototype.setContent = function () {
		this.element.innerHTML = "x" + this.values[this.current];
	};
	
	/**
	 * Set the style for the zoom in the current style or in a new one
	 */
	Zoom.prototype.setStyle = function () {
		if (this.style) {
			this.style.innerHTML = this.current === 0 ? "" : this.getStyle();
		} else {
			var head = document.querySelector("head");
			
			this.style = document.createElement("style");
			this.style.id = "sZoom";
			this.style.innerHTML = this.getStyle();
			head.appendChild(this.style);
		}
	};
	
	/**
	 * Creates the style as a transform for each prefix
	 */
	Zoom.prototype.getStyle = function () {
		var prefix  = ["-webkit-", "-o-", ""],
			content = "body > *:not(.zoom) {",
			self    = this;
		
		prefix.forEach(function (prefix) {
			content += prefix + "transform: scale(" + self.values[self.current] + ");";
		});
		return content + " }";
	};
	
	
	
	/**
	 * Starts a new game
	 * @param {string} mode
	 */
	function newGame(mode) {
		gameDisplay = "playing";
		gameMode    = mode;
		gameScore   = -1;
		hasStarted  = false;
		
		hideMessage();
		increaseScore();
		showGame();
		
		board.start();
		ship   = new Ship();
		ball   = new Ball();
		tail   = new Tail();
		bricks = new Bricks();
		
		requestAnimation();
	}
	
	/**
	 * Creates the shortcuts functions
	 */
	function createShortcuts() {
		shortcuts = {
			mainScreen: {
				O: function () { newGame(gameMode);     },
				E: function () { newGame("speed");      },
				R: function () { newGame("random");     },
				C: function () { newGame("bricks");     },
				I: function () { showHighScores();      },
				H: function () { showHelp();            },
				M: function () { sound.toggle();        }
			},
			paused: {
				P: function () { endPause();            },
				B: function () { finishGame();          }
			},
			gameOver: {
				B: function () { showMainScreen();      }
			},
			gameOverSave: {
				O: function () { scores.save();         },
				B: function () { showMainScreen();      }
			},
			highScores: {
				E: function () { scores.show("speed");  },
				R: function () { scores.show("random"); },
				C: function () { scores.show("bricks"); },
				B: function () { showMainScreen();      }
			},
			help: {
				B: function () { showMainScreen();      }
			},
			playing: {
				A: function () { ship.keyMove(-1);      },
				D: function () { ship.keyMove(1);       },
				O: function () { startGame();           },
				P: function () { startPause();          },
				M: function () { sound.toggle();        }
			}
		};
	}
	
	/**
	 * Stores the used DOM elements and initializes the Event Handlers
	 */
	function initDomListeners() {
		container = document.querySelector("#container");
		header    = document.querySelector(".messages h2");
		paragrath = document.querySelector(".messages p");
		counter   = document.querySelector(".count");
		
		document.body.addEventListener("click", function (e) {
			var element = e.target;
			while (element.parentElement && !element.dataset.action) {
				element = element.parentElement;
			}
			
			switch (element.dataset.action) {
			case "play":
				newGame(element.dataset.mode);
				break;
			case "mainScreen":
				showMainScreen();
				break;
			case "highScores":
				showHighScores();
				break;
			case "help":
				showHelp();
				break;
			case "endPause":
				endPause();
				break;
			case "finishGame":
				finishGame();
				break;
			case "save":
				scores.save();
				break;
			case "showScores":
				scores.show(element.dataset.mode);
				break;
			case "sound":
				sound.toggle();
				break;
			case "zoom":
				zoom.change();
				break;
			}
		});
		
		document.addEventListener("keydown", function (e) { onKeyDown(e); });
		document.addEventListener("keyup",   function (e) { onKeyUp(e);   });
	}
	
	/**
	 * The main Function
	 */
	function main() {
		initDomListeners();
		createShortcuts();
		
		board  = new Board();
		sound  = new Sound();
		scores = new HighScores();
		zoom   = new Zoom();
	}
	
	
	// Load the game
	window.addEventListener("load", function () { main(); }, false);

}());