// ideas
// - simulation with sliders


let flock;
var gameoverButton;

let fishWidth = 1000;
let fishHeight = 500;

let maxFishNum = 200;
let initialFishNum = maxFishNum / 2;
var currentFishNum = initialFishNum;
// counter that holds how many fish are available for population
// catching fish adds to it
// per timestep, population eats 5 fish from total
let populationEatRate = -5;

let populationBar;
let populationTarget = initialFishNum / 2;

let fishPopulationBar;

let progressWidth = 400;
let progressHeight = 500;





function setup() {
  let myCanvas = createCanvas(fishWidth + progressWidth, fishHeight);
  myCanvas.parent("gamediv");

  flock = new Flock();
  populationBar = new ProgressBar(color(255, 204, 0), 1100,
    maxFishNum, initialFishNum, populationEatRate);
  fishPopulationBar = new ProgressBar(color(32, 176, 16), 1250,
    maxFishNum, currentFishNum, 0);
  // Add an initial set of boids into the system
  for (let i = 0; i < initialFishNum; i++) {
    let b = new Boid(width / 2,height / 2);
    flock.addBoid(b);
  }
}

function draw() {
  // check game over condition before drawing/simulating any more
  if (populationBar.barHeight <= 1 || fishPopulationBar.barHeight == 0) {
    gameOverScreen();
  } else {
    // draw background of fish area
    fill(16, 112, 176)
    rect(0, 0, fishWidth, fishHeight);

    // draw background of progress area
    fill(255, 255, 255);
    rect(fishWidth, 0, progressWidth, progressHeight);
    
    flock.run();

    runPopulationBar();
    populationBar.run();

    runFishPopulationBar();
    fishPopulationBar.run();

    drawProgressText();

    // deletes boids that are within circle
    useNet(flock.boids);
  }
}

function gameOverScreen() {
  fill(191, 125, 17);
  rect(0, 0, fishWidth + progressWidth, fishHeight);
  fill(0);
  textSize(100);
  textAlign(CENTER);
  text('Game Over', 725, 250);

  gameoverButton = createButton('Play Again');
  gameoverButton.position(700, 450);
  gameoverButton.size(100);
  gameoverButton.mousePressed(resetGame);
}

function resetGame() {
  removeElements();
  currentFishNum = initialFishNum;
  populationBar.barHeight = initialFishNum;
  fishPopulationBar.barHeight = initialFishNum;
  // Add an initial set of boids into the system again after clearing out
  // any remaining
  flock.boids = [];
  for (let i = 0; i < initialFishNum; i++) {
    let b = new Boid(width / 2,height / 2);
    flock.addBoid(b);
  }
}

function drawProgressText() {
  // draw text for progress section
  textSize(16);
  textAlign(RIGHT);
  text('100%', 1375, 20);
  text('100%', 1225, 20);
  textAlign(CENTER);
  textWrap(WORD);
  text('Human Satisfaction', 1100, 425, 75);
  text('Fish Population', 1250, 425, 75);
}

// a "net" to catch fish
function useNet(boids) {
  if (mouseIsPressed) {
    var mouseVector = createVector(mouseX, mouseY);
    // draws net
    fill(127);

    // don't let net go into progress part
    if (mouseVector.x + 36 > fishWidth) {
      circle(fishWidth - 36, mouseVector.y, 72);
      mouseVector.x = fishWidth - 36;
    } else {
      circle(mouseVector.x, mouseVector.y, 72);
    }

    // checks if fish are within net, have to loop thru all :(, maybe divide grid
    for (let i = 0; i < boids.length; i++) {
      if (p5.Vector.dist(boids[i].position, mouseVector) < 36) {
        boids.splice(i, 1);
        // add to fish caught, eg. population bar height
        populationBar.changeBarHeight(1);
        // 1 less fish
        currentFishNum -= 1;
      }
    }
  }
}

function respawnFish() {
  // respawn rate is y = sin(x) form
  // fish spawn slowly when pop low, fastest when pop med, and slow when pop high
  // amplitude of sin(x) is max respawn rate -> 1/20 max pop
  // 1/2 period of sin(x) should cover from 0 fish to max pop
  let rate = ceil((1/20 * maxFishNum) *  sin((PI / maxFishNum) * currentFishNum));
  // spawn fish in next to random fish
  for (let i = 0; i < rate; i++) {
    if (currentFishNum > 0) {
      let randomFishPosition = flock.boids[floor(random(currentFishNum - 1))].position;
      flock.addBoid(new Boid(randomFishPosition.x, randomFishPosition.y));
    }
  }
  // add to current fish count
  currentFishNum += rate;
}

function setEatRate() {
  // eat rate is form y = e^x + const
  // population eats slowly when few fish and exponentially faster when more
  // delta = e when bar height is max fish num / 100000
  let delta = -floor(exp(populationBar.barHeight * maxFishNum / 6000)) - 5;
  populationBar.setDelta(delta);
}

function ProgressBar(color, leftPx, totalElems, barHeight, delta) {
  this.barHeight = barHeight; // current bar height
  this.delta = delta; // how many fish are lost per update interval
  this.color = color; // color of bar
  this.leftPx = leftPx; // pixel loc of leftmost side of bar (kinda)

  this.updateInterval = 1000; // how quickly bar updates height
  this.elapsedTimeDelta = 0; // how many miliseconds have elapsed

  this.heightPx = progressHeight - 100; // how high up bar is in progress box
  this.widthPx = 75;
  this.unitHeightPx = this.heightPx / totalElems; // divide bar into units for each elem counting
}

ProgressBar.prototype.run = function() {
  if (this.barHeight > 0) {
    fill(this.color);
    
    rectMode(CORNERS)
    // draw rect from lower left corner
    noStroke();
    rect(this.leftPx, 
      this.heightPx,
      this.leftPx + this.widthPx,
      this.heightPx - (this.barHeight * this.unitHeightPx));
  }
  // draw outlining rect
  rectMode(CORNERS)
  noFill();
  stroke(51);
  strokeWeight(4);
  rect(this.leftPx, 
    this.heightPx,
    this.leftPx + this.widthPx,
    4);
  strokeWeight(1);
  fill(0);
  rectMode(CORNER);
}

function runPopulationBar() {
  // update bar height with respect to delta if 1 second has elapsed
  // update eating rate of population
  // update fish respawn rate
  populationBar.elapsedTimeDelta += deltaTime;
  if (populationBar.elapsedTimeDelta >= populationBar.updateInterval && populationBar.barHeight > 0) {
    setEatRate();
    populationBar.barHeight += populationBar.delta;
    if (currentFishNum > 0)
      respawnFish();
    populationBar.elapsedTimeDelta = 0;
  }
}

function runFishPopulationBar() {
  fishPopulationBar.barHeight = currentFishNum;
}

ProgressBar.prototype.changeBarHeight = function(delta) {
  this.barHeight += delta;
}

ProgressBar.prototype.setDelta = function(newDelta) {
  this.delta = newDelta;
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids
function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
}

Flock.prototype.run = function() {
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
  }
}

Flock.prototype.addBoid = function(b) {
  this.boids.push(b);
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 3.0;
  this.maxspeed = 3;    // Maximum speed
  this.maxforce = 0.05; // Maximum steering force
}

Boid.prototype.run = function(boids) {
  this.flock(boids);
  this.update();
  this.borders();
  this.render();
}

Boid.prototype.applyForce = function(force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids) {
  let sep = this.separate(boids);   // Separation
  let ali = this.align(boids);      // Alignment
  let coh = this.cohesion(boids);   // Cohesion
  // Arbitrarily weight these forces
  sep.mult(1.5);
  ali.mult(1.0);
  coh.mult(1.0);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
}

// Method to update location
Boid.prototype.update = function() {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
  let desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired,this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

Boid.prototype.render = function() {
  // Draw a triangle rotated in the direction of velocity
  let theta = this.velocity.heading() + radians(90);
  fill(51);
  stroke(200);
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  beginShape();
  vertex(0, -this.r * 2);
  vertex(-this.r, this.r * 2);
  vertex(this.r, this.r * 2);
  endShape(CLOSE);
  pop();
}

// Wraparound
Boid.prototype.borders = function() {
  if (this.position.x < -this.r)  this.position.x = fishWidth + this.r;
  if (this.position.y < -this.r)  this.position.y = fishHeight + this.r;
  if (this.position.x > fishWidth + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids) {
  let desiredseparation = 25.0;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {
  let neighbordist = 50;
  let sum = createVector(0,0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}