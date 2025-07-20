// Initialize Kaboom with a canvas and background color
kaboom({
  global: true,
  canvas: document.getElementById("game"),
  width: window.innerWidth,
  height: window.innerHeight,
  background: [173, 216, 230], // lighter sky blue
});

// Responsive resize
window.addEventListener("resize", () => {
  setTimeout(() => location.reload(), 200);
});

// Gravity for the world
setGravity(1200);

// Player properties
const PLAYER_SPEED = 200;
const JUMP_FORCE = 700;

// Add the player (a smiley face)
const player = add([
  text("😊", { size: 40 }),
  pos(width() / 2 - 20, height() - 120),
  area(),
  body(),
]);

// Add ground platform (cover full width)
add([
  rect(width(), 56, { radius: 12 }),
  pos(0, height() - 56),
  area(),
  body({ isStatic: true }),
  color(120, 200, 120), // softer green
]);

// UI Enhancements: Sun and Clouds
function addSun() {
  add([
    pos(width() - 100, 100),
    circle(50),
    color(255, 220, 80),
    z(-10),
  ]);
}

function addCloud(x, y, scale = 1) {
  add([
    pos(x, y),
    rect(80 * scale, 40 * scale, { radius: 20 * scale }),
    color(255, 255, 255),
    opacity(0.7),
    z(-9),
  ]);
  add([
    pos(x + 40 * scale, y - 10 * scale),
    rect(60 * scale, 30 * scale, { radius: 15 * scale }),
    color(255, 255, 255),
    opacity(0.7),
    z(-9),
  ]);
}

addSun();
addCloud(120, 100, 1);
addCloud(width() * 0.3, 60, 0.8);
addCloud(width() * 0.6, 130, 1.2);
addCloud(width() - 200, 80, 0.9);

// Add floating platforms across the screen with reduced vertical gaps
const platformWidth = 120;
const platformHeight = 24;
const platformColor = rgb(255, 200, 60); // Mario block yellow
const platformBorderColor = rgb(200, 140, 20);
const verticalGap = 60; // Further reduced vertical gap between platforms
const safeTopMargin = 100; // Ensure platforms don't go too close to the top

// Calculate how many platforms we can fit
const maxHeight = height() - safeTopMargin - 180;
const numPlatforms = Math.min(12, Math.floor(maxHeight / verticalGap));

const platforms = [];
for (let i = 0; i < numPlatforms; i++) {
  // Alternating left and right positions
  const x = (i % 2 === 0) ? 
    width() * (0.15 + (i % 4) * 0.05) : 
    width() * (0.75 - (i % 4) * 0.05);
  const y = height() - 180 - verticalGap * i;
  platforms.push([x, y]);
}

// Remove old platforms and add new ones
get().forEach(obj => {
  if (obj.is("platform")) destroy(obj);
});

platforms.forEach(([x, y]) => {
  add([
    rect(platformWidth, platformHeight, { radius: 6 }),
    outline(4, platformBorderColor),
    pos(x, y),
    area(),
    body({ isStatic: true }),
    color(platformColor),
    "platform",
  ]);
});

// Add ladders between platforms
get().forEach(obj => {
  if (obj.is("ladder")) destroy(obj);
});

// Update ladder color from brown to yellow
const ladderWidth = 20;
const ladderColor = rgb(255, 220, 60); // Yellow color instead of brown

for (let i = 1; i < platforms.length; i++) {
  const lower = platforms[i-1];
  const upper = platforms[i];
  
  // Calculate ladder position (connect platforms)
  const lx = (lower[0] < upper[0]) ? 
    lower[0] + platformWidth - ladderWidth/2 : 
    lower[0] - ladderWidth/2;
  const ly = upper[1];
  const lh = lower[1] - upper[1];
  
  add([
    rect(ladderWidth, lh, { radius: 6 }),
    pos(lx, ly),
    area(),
    color(ladderColor),
    "ladder",
    z(1),
  ]);
}

// Add more coins - one above each platform and some on ladders
get().forEach(obj => {
  if (obj.is("coin")) destroy(obj);
});

// Track total coins and collected coins
let totalCoins = 0;
let collectedCoins = 0;

// Fixed total coins count
const TOTAL_COINS = 9;

// Coins above platforms - place exactly 6 coins
const platformsWithCoins = [];
// Sort platforms by height (top to bottom)
const sortedPlatforms = [...platforms].sort((a, b) => a[1] - b[1]);
// Select 6 platforms evenly distributed
for (let i = 0; i < 6; i++) {
  const index = Math.floor(i * (sortedPlatforms.length / 6));
  if (index < sortedPlatforms.length) {
    platformsWithCoins.push(sortedPlatforms[index]);
  }
}

// Add coins to selected platforms
platformsWithCoins.forEach(([x, y]) => {
  add([
    text("🪙", { size: 32 }),
    pos(x + platformWidth / 2 - 12, y - 40),
    area(),
    "coin",
    z(2),
  ]);
  totalCoins++;
});

// Score counter
let score = 0;
const scoreLabel = add([
  text("Coins: 0/" + totalCoins, { size: 28 }),
  pos(32, 32),
  color(40, 40, 80),
  z(100),
]);

// Clear control instructions overlay
get().forEach(obj => {
  if (obj.is("overlay")) destroy(obj);
});

// Add clear arrow key instructions at the top - wider background to fit text
const instructionBg = add([
  rect(390, 50, { radius: 10 }), // Wider background
  pos(width() / 2 - 190, 20),
  color(255, 255, 255),
  opacity(0.7),
  outline(2, rgb(40, 40, 80)),
  z(99),
  "overlay",
]);

// Left arrow with text
add([
  text("← Move Left", { size: 18 }), // Smaller text
  pos(width() / 2 - 130, 45),
  color(40, 40, 80),
  anchor("center"),
  z(100),
  "overlay",
]);

// Up arrow with text
add([
  text("↑ Jump", { size: 18 }), // Smaller text
  pos(width() / 2, 45),
  color(40, 40, 80),
  anchor("center"),
  z(100),
  "overlay",
]);

// Right arrow with text
add([
  text("→ Move Right", { size: 18 }), // Smaller text
  pos(width() / 2 + 130, 45),
  color(40, 40, 80),
  anchor("center"),
  z(100),
  "overlay",
]);

// Player movement controls
onKeyDown("left", () => {
  player.move(-PLAYER_SPEED, 0);
});

onKeyDown("right", () => {
  player.move(PLAYER_SPEED, 0);
});

onKeyPress("up", () => {
  if (player.isGrounded()) {
    player.jump(JUMP_FORCE);
  }
});

// Add ladder climbing
let climbing = false;
player.onUpdate(() => {
  climbing = false;
  get("ladder").forEach(ladder => {
    if (player.isOverlapping(ladder)) {
      climbing = true;
      if (isKeyDown("up")) {
        player.move(0, -PLAYER_SPEED);
        player.gravityScale = 0;
      } else if (isKeyDown("down")) {
        player.move(0, PLAYER_SPEED);
        player.gravityScale = 0;
      }
    }
  });
  if (!climbing) {
    player.gravityScale = 1;
  }
});

// Keep the player within the screen bounds
player.onUpdate(() => {
  if (player.pos.x < 0) player.pos.x = 0;
  if (player.pos.x > width() - player.width) player.pos.x = width() - player.width;
});

// Simple lose condition: fall off the screen
player.onUpdate(() => {
  if (player.pos.y > height()) {
    player.pos = vec2(width() / 2 - 20, height() - 120);
  }
});

// Coin collection logic
player.onUpdate(() => {
  get("coin").forEach(coin => {
    if (player.isOverlapping(coin)) {
      destroy(coin);
      collectedCoins++;
      scoreLabel.text = `Coins: ${collectedCoins}/${totalCoins}`;
    }
  });
});

// Win condition - reach the top platform
let hasWon = false;
const topPlatformY = Math.min(...platforms.map(([_, y]) => y));

// Add central connecting ladders
const centralLadderPositions = [
  // [x, y, height]
  [width() / 2 - 10, height() - 280, 100], // Lower central ladder
  [width() / 2 - 10, height() - 480, 100], // Higher central ladder
];

centralLadderPositions.forEach(([x, y, h]) => {
  add([
    rect(ladderWidth, h, { radius: 6 }),
    pos(x, y),
    area(),
    color(ladderColor),
    "ladder",
    z(1),
  ]);
});

// Replace the top central ladder with a horizontal one
get().forEach(obj => {
  if (obj.is("winLadder")) destroy(obj);
});

// Add top horizontal platform (win condition) that player can stand on
const topY = Math.min(...platforms.map(([_, y]) => y)) - 40;
const winPlatform = add([
  rect(160, 20, { radius: 6 }), // Platform dimensions
  pos(width() / 2 - 80, topY - 20),
  area(),
  body({ isStatic: true }), // Make it a solid platform to stand on
  color(rgb(220, 180, 80)), // Gold color to make it special
  outline(3, rgb(180, 140, 40)), // Add outline to make it stand out
  "winPlatform",
  z(1),
]);

// Add a special coin higher above the win platform
get().forEach(obj => {
  if (obj.is("crown")) destroy(obj);
});

add([
  text("👑", { size: 40 }), // Crown emoji
  pos(width() / 2, topY - 30), // Position centered above the platform
  anchor("center"),
  area(),
  "crown",
  z(2),
]);

// Add coins to right side ladders - exactly 3 coins
const rightLadders = get("ladder").filter(ladder => ladder.pos.x > width() / 2);
// Sort ladders by height (top to bottom)
const sortedLadders = [...rightLadders].sort((a, b) => a.pos.y - b.pos.y);

// Select 3 ladders evenly distributed
const laddersWithCoins = [];
for (let i = 0; i < 3 && i < sortedLadders.length; i++) {
  const index = Math.floor(i * (sortedLadders.length / 3));
  if (index < sortedLadders.length) {
    laddersWithCoins.push(sortedLadders[index]);
  }
}

// Add exactly one coin to each selected ladder
laddersWithCoins.forEach(ladder => {
  add([
    text("🪙", { size: 32 }),
    pos(ladder.pos.x + 30, ladder.pos.y + ladder.height / 2),
    area(),
    "coin",
    z(2),
  ]);
  totalCoins++;
});

// Ensure we have exactly 9 coins
if (totalCoins !== TOTAL_COINS) {
  console.log(`Warning: Expected ${TOTAL_COINS} coins but got ${totalCoins}`);
}

// Set the score label
scoreLabel.text = `Coins: ${collectedCoins}/${totalCoins}`;

// Update win condition to check for the top platform AND all coins collected
player.onUpdate(() => {
  if (!hasWon && player.isColliding(winPlatform)) {
    if (collectedCoins === totalCoins) {
      hasWon = true;
      
      // Win message background
      add([
        rect(400, 120, { radius: 24 }),
        pos(width() / 2 - 200, height() / 2 - 60),
        color(255, 255, 255),
        outline(6, rgb(80, 180, 80)),
        z(200),
      ]);
      
      // Win message text
      add([
        text(`🎉 You Win! 🎉\nAll ${totalCoins} coins collected!`, { size: 40, width: 380, align: "center" }),
        pos(width() / 2, height() / 2),
        anchor("center"),
        color(40, 40, 80),
        z(201),
      ]);
    } else {
      // Message if not all coins collected - centered on screen
      const boxWidth = 400;
      const boxHeight = 150;
      
      const missingMsg = add([
        rect(boxWidth, boxHeight, { radius: 16 }),
        pos(width() / 2 - boxWidth/2, height() / 2 - boxHeight/2),
        color(255, 255, 255),
        opacity(0.9),
        outline(4, rgb(255, 100, 100)),
        z(100),
      ]);
      
      const missingText = add([
        text(`Collect all coins first and then go to the crown!`, { 
          size: 32, 
          width: 360, 
          align: "center",
          lineSpacing: 8
        }),
        pos(width() / 2, height() / 2),
        anchor("center"),
        color(255, 80, 80),
        z(101),
        "missingMsgText",
      ]);
      
      // Remove message after 1 second
      wait(1, () => {
        destroy(missingMsg);
        destroy(missingText);
      });
    }
  }
}); 