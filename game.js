// ============================================
// SUBWAY SURFERS CLONE - COMPLETE GAME
// ============================================

// ===== CONFIGURATION =====
const CONFIG = {
  // World
  LANE_WIDTH: 2.5,
  LANE_POSITIONS: [2.5, 0, -2.5],
  TRACK_WIDTH: 10,
  VISIBLE_DISTANCE: 150,
  SEGMENT_LENGTH: 50,

  // Player
  PLAYER_HEIGHT: 1.8,
  JUMP_HEIGHT: 2.0,
  JUMP_DURATION: 600,
  SLIDE_DURATION: 500,
  LANE_SWITCH_DURATION: 150,

  // Game
  BASE_SPEED: 20,
  MAX_SPEED: 45,
  ACCELERATION: 0.3,

  // Camera
  CAMERA_HEIGHT: 6,
  CAMERA_DISTANCE: 10,
  CAMERA_LOOK_AHEAD: 15,

  // Spawning
  MIN_OBSTACLE_GAP: 15,
  COIN_SPAWN_CHANCE: 0.7,

  // Colors
  COLORS: {
    SKY_TOP: 0x87ceeb,
    SKY_BOTTOM: 0xe0f4ff,
    GROUND: 0x8b7355,
    RAIL: 0x708090,
    TIE: 0x654321,
    COIN: 0xffd700,
    PLAYER_SKIN: 0xf4c7a1,
    PLAYER_SHIRT: 0x4a90d9,
    PLAYER_PANTS: 0x2c3e50,
    PLAYER_SHOES: 0xe74c3c,
    PLAYER_HAIR: 0x5d4e37,
    TRAIN_BODY: 0x2c3e50,
    TRAIN_WINDOW: 0x85c1e9,
    BARRIER: 0xff6b35,
    BUILDING_1: 0xe74c3c,
    BUILDING_2: 0x3498db,
    BUILDING_3: 0x27ae60,
    BUILDING_4: 0xf39c12,
  },
};

// ===== SOUND SYSTEM =====
const SoundManager = {
  context: null,
  sounds: {},
  muted: false,

  init() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.createSounds();
  },

  createSounds() {
    // Create simple sound effects using oscillators
    this.sounds = {
      jump: () => this.playTone(400, 0.1, "sine"),
      slide: () => this.playTone(200, 0.15, "sawtooth"),
      coin: () => this.playTone(800, 0.1, "sine", [800, 1000]),
      crash: () => this.playTone(100, 0.3, "sawtooth"),
      powerup: () => this.playTone(600, 0.2, "sine", [600, 800, 1000]),
      magnetCollect: () => this.playTone(700, 0.05, "sine"),
      jetpackBoost: () => this.playTone(300, 0.5, "triangle"),
      purchase: () => this.playTone(1000, 0.2, "sine", [1000, 1200]),
      error: () => this.playTone(150, 0.2, "square"),
    };
  },

  playTone(frequency, duration, type = "sine", frequencies = null) {
    if (this.muted || !this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

    // Frequency sweep for more interesting sounds
    if (frequencies) {
      const timePerFreq = duration / frequencies.length;
      frequencies.forEach((freq, i) => {
        oscillator.frequency.setValueAtTime(
          freq,
          this.context.currentTime + i * timePerFreq,
        );
      });
    }

    // Envelope
    gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + duration,
    );

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  },

  play(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName]();
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },
};

// ===== CHARACTER SYSTEM =====
const CharacterManager = {
  characters: {
    default: {
      name: "Default",
      emoji: "🏃",
      price: 0,
      colors: {
        skin: 0xf4c7a1,
        shirt: 0x4a90d9,
        pants: 0x2c3e50,
        hair: 0xe74c3c,
      },
      effect: null,
    },
    alien: {
      name: "Alien",
      emoji: "👽",
      price: 500,
      colors: {
        skin: 0x00ff00,
        shirt: 0x660099,
        pants: 0x330066,
        hair: 0x00ff00,
      },
      effect: "glow",
    },
    robot: {
      name: "Robot",
      emoji: "🤖",
      price: 750,
      colors: {
        skin: 0x808080,
        shirt: 0x404040,
        pants: 0x202020,
        hair: 0xff0000,
      },
      effect: "metallic",
    },
    ninja: {
      name: "Ninja",
      emoji: "🥷",
      price: 1000,
      colors: {
        skin: 0xf4c7a1,
        shirt: 0x000000,
        pants: 0x1a1a1a,
        hair: 0x000000,
      },
      effect: "shadow",
    },
    zombie: {
      name: "Zombie",
      emoji: "🧟",
      price: 600,
      colors: {
        skin: 0x7fb069,
        shirt: 0x654321,
        pants: 0x8b4513,
        hair: 0x3d3d3d,
      },
      effect: "particles",
    },
  },
  currentCharacter: "default",
  ownedCharacters: ["default"],

  loadProgress() {
    const saved = localStorage.getItem("ownedCharacters");
    if (saved) {
      this.ownedCharacters = JSON.parse(saved);
    }
    this.currentCharacter =
      localStorage.getItem("currentCharacter") || "default";
  },

  saveProgress() {
    localStorage.setItem(
      "ownedCharacters",
      JSON.stringify(this.ownedCharacters),
    );
    localStorage.setItem("currentCharacter", this.currentCharacter);
  },

  unlockCharacter(charId) {
    if (!this.ownedCharacters.includes(charId)) {
      this.ownedCharacters.push(charId);
      this.saveProgress();
      return true;
    }
    return false;
  },

  selectCharacter(charId) {
    if (this.ownedCharacters.includes(charId)) {
      this.currentCharacter = charId;
      this.saveProgress();
      return true;
    }
    return false;
  },

  getCurrentCharacter() {
    return this.characters[this.currentCharacter];
  },
};

// ===== POWERUP SYSTEM =====
const PowerUpManager = {
  activePowerUps: {},
  powerUpObjects: [],
  inventory: {
    magnetStart: 0,
    jetpackStart: 0,
    sneakersStart: 0,
  },

  loadInventory() {
    const saved = localStorage.getItem("powerUpInventory");
    if (saved) {
      this.inventory = JSON.parse(saved);
    }
  },

  saveInventory() {
    localStorage.setItem("powerUpInventory", JSON.stringify(this.inventory));
  },

  addToInventory(type, amount = 1) {
    const key = type + "Start";
    this.inventory[key] = (this.inventory[key] || 0) + amount;
    this.saveInventory();
  },

  useFromInventory(type) {
    const key = type + "Start";
    if (this.inventory[key] > 0) {
      this.inventory[key]--;
      this.saveInventory();
      return true;
    }
    return false;
  },

  activate(type, duration) {
    this.activePowerUps[type] = {
      endTime: gameTime + duration,
      duration: duration,
    };

    // Visual feedback
    const iconId = type + "-icon";
    const icon = document.getElementById(iconId);
    if (icon) {
      icon.classList.add("active");
    }

    SoundManager.play("powerup");

    if (type === "jetpack") {
      createJetpackOnPlayer();
    }
  },

  deactivate(type) {
    delete this.activePowerUps[type];

    const iconId = type + "-icon";
    const icon = document.getElementById(iconId);
    if (icon) {
      icon.classList.remove("active");
    }

    if (type === "jetpack") {
      removeJetpackFromPlayer();
    }
  },

  isActive(type) {
    return !!this.activePowerUps[type];
  },

  update() {
    Object.keys(this.activePowerUps).forEach((type) => {
      const powerUp = this.activePowerUps[type];
      const remaining = powerUp.endTime - gameTime;

      if (remaining <= 0) {
        this.deactivate(type);
      } else {
        // Update timer display
        const timerId = type + "-timer";
        const timer = document.getElementById(timerId);
        if (timer) {
          timer.textContent = Math.ceil(remaining) + "s";
        }
      }
    });
  },

  clear() {
    Object.keys(this.activePowerUps).forEach((type) => {
      this.deactivate(type);
    });
    this.activePowerUps = {};
  },
};

// ===== STORE SYSTEM =====
const StoreManager = {
  init() {
    this.renderStore();
  },

  renderStore() {
    // Render characters
    const charactersGrid = document.getElementById("characters-grid");
    charactersGrid.innerHTML = "";

    Object.keys(CharacterManager.characters).forEach((charId) => {
      const char = CharacterManager.characters[charId];
      const owned = CharacterManager.ownedCharacters.includes(charId);
      const selected = CharacterManager.currentCharacter === charId;

      const item = document.createElement("div");
      item.className =
        "store-item" + (owned ? " owned" : "") + (selected ? " selected" : "");
      item.innerHTML = `
                        <div class="item-preview">${char.emoji}</div>
                        <div class="item-name">${char.name}</div>
                        <div class="item-price">
                            ${owned ? (selected ? "EQUIPPED" : "OWNED") : `${char.price} <div class="mini-coin"></div>`}
                        </div>
                    `;

      item.addEventListener("click", () => {
        if (owned) {
          CharacterManager.selectCharacter(charId);
          SoundManager.play("purchase");
          this.showNotification(`${char.name} equipped!`);
          recreatePlayer();
          this.renderStore();
        } else {
          if (totalCoins >= char.price) {
            totalCoins -= char.price;
            updateTotalCoins();
            CharacterManager.unlockCharacter(charId);
            CharacterManager.selectCharacter(charId);
            SoundManager.play("purchase");
            this.showNotification(`${char.name} purchased!`);
            recreatePlayer();
            this.renderStore();
          } else {
            SoundManager.play("error");
            this.showNotification(`Not enough coins!`);
          }
        }
      });

      charactersGrid.appendChild(item);
    });

    // Render power-ups
    const powerupsGrid = document.getElementById("powerups-grid");
    powerupsGrid.innerHTML = "";

    const powerups = [
      {
        id: "magnetStart",
        name: "Magnet Start",
        emoji: "🧲",
        price: 100,
      },
      {
        id: "jetpackStart",
        name: "Jetpack Start",
        emoji: "🚀",
        price: 150,
      },
      {
        id: "sneakersStart",
        name: "Sneakers Start",
        emoji: "👟",
        price: 120,
      },
    ];

    powerups.forEach((powerup) => {
      const owned = PowerUpManager.inventory[powerup.id] || 0;

      const item = document.createElement("div");
      item.className = "store-item";
      item.innerHTML = `
                        <div class="item-preview">${powerup.emoji}</div>
                        <div class="item-name">${powerup.name}</div>
                        <div class="item-price">
                            ${powerup.price} <div class="mini-coin"></div>
                        </div>
                        <div style="font-size: 14px; margin-top: 10px; color: #7f8c8d;">Owned: ${owned}</div>
                    `;

      item.addEventListener("click", () => {
        if (totalCoins >= powerup.price) {
          totalCoins -= powerup.price;
          updateTotalCoins();
          const type = powerup.id.replace("Start", "");
          PowerUpManager.addToInventory(type);
          SoundManager.play("purchase");
          this.showNotification(`${powerup.name} purchased!`);
          this.renderStore();
        } else {
          SoundManager.play("error");
          this.showNotification(`Not enough coins!`);
        }
      });

      powerupsGrid.appendChild(item);
    });

    // Update balance
    document.getElementById("store-coins").textContent = totalCoins;
  },

  showNotification(message) {
    const notif = document.getElementById("character-notification");
    notif.textContent = message;
    notif.style.display = "block";
    setTimeout(() => {
      notif.style.display = "none";
    }, 2000);
  },

  open() {
    this.renderStore();
    document.getElementById("store-screen").style.display = "block";
    gameState = "STORE";
  },

  close() {
    document.getElementById("store-screen").style.display = "none";
    gameState = "MENU";
  },
};

// ===== GAME STATE =====
let gameState = "LOADING";
let score = 0;
let coins = 0;
let totalCoins = parseInt(localStorage.getItem("totalCoins")) || 10000; // FREE 10,000 COINS!
let distance = 0;
let highScore = parseInt(localStorage.getItem("subwaySurfersHighScore")) || 0;
let currentSpeed = CONFIG.BASE_SPEED;
let multiplier = 1;

// ===== THREE.JS SETUP =====
let scene, camera, renderer, composer;
let player, playerMixer;
let copChaser; // The cop chasing the player
let obstacles = [];
let coinObjects = [];
let trackSegments = [];
let buildings = [];
let environmentProps = [];
let clouds = [];
let streetLights = [];
let jetpackParticles = [];
let jetpackMeshOnPlayer = null;
let speedLinesGroup = null;
let speedLineParticles = [];

// Player state
let currentLane = 1; // 0, 1, 2 (left, center, right)
let targetLane = 1;
let isJumping = false;
let isSliding = false;
let isChangingLane = false;
let jumpStartTime = 0;
let slideStartTime = 0;
let laneChangeStartTime = 0;
let laneChangeStartX = 0;
let playerY = 0;
let velocityY = 0;

let isStunned = false;
let stunEndTime = 0;
let copVisibleTimer = 0;

// Timing
let lastTime = 0;
let deltaTime = 0;
let gameTime = 0;
let lastObstacleZ = 0;
let lastCoinZ = 0;

// Input
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let keysPressed = new Set();
let inputBuffer = [];

// ===== INITIALIZATION =====
function init() {
  // Initialize systems
  SoundManager.init();
  CharacterManager.loadProgress();
  PowerUpManager.loadInventory();

  // Scene
  scene = new THREE.Scene();

  // Sky gradient (using fog for depth effect)
  scene.background = new THREE.Color(CONFIG.COLORS.SKY_TOP);
  scene.fog = new THREE.Fog(0xe8e8e8, 50, 150);

  // Camera
  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  camera.position.set(0, CONFIG.CAMERA_HEIGHT, -CONFIG.CAMERA_DISTANCE);
  camera.lookAt(0, 2, CONFIG.CAMERA_LOOK_AHEAD);
  scene.add(camera); // Bắt buộc thêm camera vào scene để các object con (Speed Lines) được render

  // ULTRA HIGH-QUALITY Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("gameCanvas"),
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Lighting
  setupLighting();

  // Create environment
  createSkybox();
  createGround();
  createPlayer();

  // Initial track segments
  for (let i = 0; i < 4; i++) {
    createTrackSegment(i * CONFIG.SEGMENT_LENGTH);
  }

  // Initial buildings
  createBuildings();

  // Event listeners
  setupEventListeners();

  // Store
  StoreManager.init();

  // NEW SYSTEMS - Initialize all the new Subway Surfers features!
  HoverboardManager.loadProgress();
  MissionManager.init();
  DailyRewardManager.init();

  createSpeedLines();

  // Hide loading, show menu
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("main-menu").classList.remove("hidden");
  updateHighScoreDisplay();
  updateTotalCoins();

  gameState = "MENU";

  // Start render loop
  requestAnimationFrame(gameLoop);
}

function setupLighting() {
  // ULTRA REALISTIC LIGHTING

  // Ambient light - softer
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  // Main sun light - more realistic
  const sun = new THREE.DirectionalLight(0xfff5e6, 1.2);
  sun.position.set(-40, 50, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 4096; // Higher resolution shadows
  sun.shadow.mapSize.height = 4096;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 150;
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.bias = -0.0001;
  scene.add(sun);

  // Fill light - for softer shadows
  const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.4);
  fillLight.position.set(20, 20, -30);
  scene.add(fillLight);

  // Hemisphere light for realistic sky/ground bounce
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.6);
  scene.add(hemi);

  // Rim light for character separation
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
  rimLight.position.set(0, 10, -20);
  scene.add(rimLight);

  // Point lights for street lights (will add dynamically)
}

function createSkybox() {
  // ULTRA REALISTIC SKY
  const skyGeo = new THREE.SphereGeometry(120, 48, 48);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0077be) },
      bottomColor: { value: new THREE.Color(0x89cff0) },
      offset: { value: 20 },
      exponent: { value: 0.4 },
    },
    vertexShader: `
                    varying vec3 vWorldPosition;
                    void main() {
                        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
    fragmentShader: `
                    uniform vec3 topColor;
                    uniform vec3 bottomColor;
                    uniform float offset;
                    uniform float exponent;
                    varying vec3 vWorldPosition;
                    void main() {
                        float h = normalize(vWorldPosition + offset).y;
                        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                    }
                `,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // Add volumetric clouds
  createClouds();
}

function createClouds() {
  // Create realistic cloud clusters
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    roughness: 1.0,
    metalness: 0.0,
  });

  for (let i = 0; i < 30; i++) {
    const cloud = new THREE.Group();

    // Each cloud is made of multiple spheres
    const numPuffs = 5 + Math.floor(Math.random() * 8);
    for (let j = 0; j < numPuffs; j++) {
      const puffGeo = new THREE.SphereGeometry(2 + Math.random() * 3, 16, 16);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 8,
      );
      puff.scale.set(
        1 + Math.random() * 0.5,
        0.6 + Math.random() * 0.4,
        1 + Math.random() * 0.5,
      );
      cloud.add(puff);
    }

    // Position clouds around the scene
    const angle = (i / 30) * Math.PI * 2;
    const radius = 60 + Math.random() * 30;
    cloud.position.set(
      Math.cos(angle) * radius,
      15 + Math.random() * 20,
      Math.sin(angle) * radius + i * 20 - 200,
    );
    cloud.userData = {
      speed: 0.1 + Math.random() * 0.2,
      initialZ: cloud.position.z,
    };

    scene.add(cloud);
    clouds.push(cloud);
  }
}

function updateClouds(dt) {
  clouds.forEach((cloud) => {
    // Clouds drift slowly
    cloud.position.z -= cloud.userData.speed * dt;

    // Reset clouds that go behind
    if (cloud.position.z < -50) {
      cloud.position.z += 600;
    }
  });
}

function createGround() {
  // Main grass ground extending far out
  const grassGeo = new THREE.PlaneGeometry(300, CONFIG.VISIBLE_DISTANCE * 3);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x2d5a27, // Lush green grass
    roughness: 0.95,
    metalness: 0.0,
  });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.05;
  grass.position.z = CONFIG.VISIBLE_DISTANCE / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  // Track bed (gravel/dirt under rails)
  const trackBedGeo = new THREE.PlaneGeometry(
    CONFIG.TRACK_WIDTH + 1,
    CONFIG.VISIBLE_DISTANCE * 3,
  );
  const trackBedMat = new THREE.MeshStandardMaterial({
    color: 0x4a4036,
    roughness: 1.0,
  });
  const trackBed = new THREE.Mesh(trackBedGeo, trackBedMat);
  trackBed.rotation.x = -Math.PI / 2;
  trackBed.position.y = -0.02;
  trackBed.position.z = CONFIG.VISIBLE_DISTANCE / 2;
  trackBed.receiveShadow = true;
  scene.add(trackBed);

  // Sidewalks with curbs (vỉa hè gồ lên chân thực)
  const sidewalkGeo = new THREE.BoxGeometry(
    5,
    0.15,
    CONFIG.VISIBLE_DISTANCE * 3,
  );
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x95a5a6,
    roughness: 0.8,
  });

  const leftSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  leftSidewalk.position.set(-8.0, 0.075, CONFIG.VISIBLE_DISTANCE / 2);
  leftSidewalk.receiveShadow = true;
  scene.add(leftSidewalk);

  const rightSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  rightSidewalk.position.set(8.0, 0.075, CONFIG.VISIBLE_DISTANCE / 2);
  rightSidewalk.receiveShadow = true;
  scene.add(rightSidewalk);
}

function createTrackSegment(zPosition) {
  const segment = new THREE.Group();
  segment.position.z = zPosition;

  // Rails for each lane
  for (let lane = 0; lane < 3; lane++) {
    const laneX = CONFIG.LANE_POSITIONS[lane];

    // Left rail
    const railGeo = new THREE.BoxGeometry(0.1, 0.15, CONFIG.SEGMENT_LENGTH);
    const railMat = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.RAIL,
      metalness: 0.8,
      roughness: 0.3,
    });

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(laneX - 0.5, 0.075, CONFIG.SEGMENT_LENGTH / 2);
    segment.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(laneX + 0.5, 0.075, CONFIG.SEGMENT_LENGTH / 2);
    segment.add(rightRail);
  }

  // Railroad ties
  const tieGeo = new THREE.BoxGeometry(CONFIG.TRACK_WIDTH - 1, 0.1, 0.3);
  const tieMat = new THREE.MeshLambertMaterial({
    color: CONFIG.COLORS.TIE,
  });

  for (let i = 0; i < CONFIG.SEGMENT_LENGTH / 2; i++) {
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 0.02, i * 2 + 1);
    tie.receiveShadow = true;
    segment.add(tie);
  }

  scene.add(segment);
  trackSegments.push({ mesh: segment, startZ: zPosition });
}

function createPlayer() {
  const char = CharacterManager.getCurrentCharacter();
  const colors = char.colors;

  player = new THREE.Group();

  // ULTRA REALISTIC PLAYER MODEL

  // Head with better geometry
  const headGeo = new THREE.SphereGeometry(0.28, 32, 32);
  const headMat = new THREE.MeshStandardMaterial({
    color: colors.skin,
    roughness: 0.7,
    metalness: 0.1,
    flatShading: false,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.7;
  head.castShadow = true;
  head.receiveShadow = true;
  head.name = "head";
  player.add(head);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
  });
  const eyePupilMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.1,
  });

  const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  leftEye.position.set(-0.09, 1.75, 0.22);
  player.add(leftEye);

  const leftPupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 12, 12),
    eyePupilMat,
  );
  leftPupil.position.set(-0.09, 1.75, 0.25);
  player.add(leftPupil);

  const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  rightEye.position.set(0.09, 1.75, 0.22);
  player.add(rightEye);

  const rightPupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 12, 12),
    eyePupilMat,
  );
  rightPupil.position.set(0.09, 1.75, 0.25);
  player.add(rightPupil);

  // Nose
  const noseGeo = new THREE.ConeGeometry(0.04, 0.1, 8);
  const noseMat = new THREE.MeshStandardMaterial({
    color: colors.skin,
    roughness: 0.7,
  });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 1.65, 0.26);
  nose.rotation.x = Math.PI / 2;
  player.add(nose);

  // Hair/Cap - more detailed
  const hairGeo = new THREE.SphereGeometry(
    0.3,
    24,
    16,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  const hairMat = new THREE.MeshStandardMaterial({
    color: colors.hair,
    roughness: 0.8,
    metalness: 0.0,
  });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 1.75;
  hair.rotation.x = -0.2;
  hair.castShadow = true;
  player.add(hair);

  // Cap Brim (Vành mũ lưỡi trai)
  const brimGeo = new THREE.BoxGeometry(0.35, 0.05, 0.25);
  const brim = new THREE.Mesh(brimGeo, hairMat);
  brim.position.set(0, 1.85, 0.22);
  brim.rotation.x = -0.15;
  brim.castShadow = true;
  player.add(brim);

  // Ears (Hai tai)
  const earGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const leftEar = new THREE.Mesh(earGeo, headMat);
  leftEar.position.set(-0.28, 1.7, 0);
  player.add(leftEar);
  const rightEar = new THREE.Mesh(earGeo, headMat);
  rightEar.position.set(0.28, 1.7, 0);
  player.add(rightEar);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.2, 16);
  const neckMat = new THREE.MeshStandardMaterial({
    color: colors.skin,
    roughness: 0.7,
  });
  const neck = new THREE.Mesh(neckGeo, neckMat);
  neck.position.y = 1.45;
  neck.castShadow = true;
  player.add(neck);

  // Torso - more detailed with fabric texture
  const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.35, 2, 2, 2);
  const torsoMat = new THREE.MeshStandardMaterial({
    color: colors.shirt,
    roughness: 0.9,
    metalness: 0.0,
  });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.y = 1.0;
  torso.castShadow = true;
  torso.receiveShadow = true;
  torso.name = "torso";
  player.add(torso);

  // Hoodie strings details
  const stringGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
  const stringMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
  const leftString = new THREE.Mesh(stringGeo, stringMat);
  leftString.position.set(-0.08, 1.3, 0.2);
  leftString.rotation.z = 0.3;
  player.add(leftString);

  const rightString = new THREE.Mesh(stringGeo, stringMat);
  rightString.position.set(0.08, 1.3, 0.2);
  rightString.rotation.z = -0.3;
  player.add(rightString);

  // Backpack - ultra detailed
  const backpackGeo = new THREE.BoxGeometry(0.45, 0.55, 0.25, 2, 2, 2);
  const backpackMat = new THREE.MeshStandardMaterial({
    color: 0xf39c12,
    roughness: 0.6,
    metalness: 0.2,
  });
  const backpack = new THREE.Mesh(backpackGeo, backpackMat);
  backpack.position.set(0, 1.05, -0.3);
  backpack.castShadow = true;
  backpack.receiveShadow = true;
  player.add(backpack);

  // Backpack straps
  const strapGeo = new THREE.BoxGeometry(0.06, 0.6, 0.04);
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0xd68910,
    roughness: 0.7,
  });
  const leftStrap = new THREE.Mesh(strapGeo, strapMat);
  leftStrap.position.set(-0.15, 1.1, 0);
  player.add(leftStrap);

  const rightStrap = new THREE.Mesh(strapGeo, strapMat);
  rightStrap.position.set(0.15, 1.1, 0);
  player.add(rightStrap);

  // Belt
  const beltGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 24);
  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.6,
    metalness: 0.3,
  });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = 0.6;
  player.add(belt);

  // Legs with better shape
  const legGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.7, 16);
  const legMat = new THREE.MeshStandardMaterial({
    color: colors.pants,
    roughness: 0.85,
    metalness: 0.0,
  });

  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.13, 0.35, 0);
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  leftLeg.name = "leftLeg";
  player.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.13, 0.35, 0);
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  rightLeg.name = "rightLeg";
  player.add(rightLeg);

  // Shoes - detailed sneakers
  const shoeGeo = new THREE.BoxGeometry(0.22, 0.14, 0.35, 2, 2, 2);
  const shoeMat = new THREE.MeshStandardMaterial({
    color: CONFIG.COLORS.PLAYER_SHOES,
    roughness: 0.7,
    metalness: 0.2,
  });

  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(-0.13, 0.07, 0.05);
  leftShoe.castShadow = true;
  leftShoe.name = "leftShoe";
  player.add(leftShoe);

  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0.13, 0.07, 0.05);
  rightShoe.castShadow = true;
  rightShoe.name = "rightShoe";
  player.add(rightShoe);

  // Shoe soles and white tips (Đế giày và mũi giày)
  const soleGeo = new THREE.BoxGeometry(0.24, 0.04, 0.37);
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
  });
  const leftSole = new THREE.Mesh(soleGeo, soleMat);
  leftSole.position.set(0, -0.05, 0); // Positioned relative to shoe
  leftShoe.add(leftSole);

  const rightSole = new THREE.Mesh(soleGeo, soleMat);
  rightSole.position.set(0, -0.05, 0);
  rightShoe.add(rightSole);

  // White shoe tips (Mũi giày cao su)
  const tipGeo = new THREE.BoxGeometry(0.24, 0.08, 0.1);
  const leftTip = new THREE.Mesh(tipGeo, soleMat);
  leftTip.position.set(0, 0, 0.15);
  leftShoe.add(leftTip);

  const rightTip = new THREE.Mesh(tipGeo, soleMat);
  rightTip.position.set(0, 0, 0.15);
  rightShoe.add(rightTip);

  // Arms with joints
  const upperArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.35, 12);
  const armMat = new THREE.MeshStandardMaterial({
    color: colors.shirt,
    roughness: 0.9,
  });

  const leftUpperArm = new THREE.Mesh(upperArmGeo, armMat);
  leftUpperArm.position.set(-0.38, 1.15, 0);
  leftUpperArm.castShadow = true;
  leftUpperArm.name = "leftArm";
  player.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, armMat);
  rightUpperArm.position.set(0.38, 1.15, 0);
  rightUpperArm.castShadow = true;
  rightUpperArm.name = "rightArm";
  player.add(rightUpperArm);

  // Hands
  const handGeo = new THREE.SphereGeometry(0.08, 12, 12);
  const handMat = new THREE.MeshStandardMaterial({
    color: colors.skin,
    roughness: 0.7,
  });

  const leftHand = new THREE.Mesh(handGeo, handMat);
  leftHand.position.set(-0.38, 0.9, 0);
  leftHand.castShadow = true;
  player.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, handMat);
  rightHand.position.set(0.38, 0.9, 0);
  rightHand.castShadow = true;
  player.add(rightHand);

  // Apply character effects
  if (char.effect === "glow") {
    player.children.forEach((child) => {
      if (child.material) {
        child.material.emissive = new THREE.Color(0x00ff00);
        child.material.emissiveIntensity = 0.3;
      }
    });
  } else if (char.effect === "metallic") {
    player.children.forEach((child) => {
      if (child.material) {
        child.material.metalness = 0.8;
        child.material.roughness = 0.2;
      }
    });
  }

  player.position.set(CONFIG.LANE_POSITIONS[1], 0, 0);
  scene.add(player);
}

function recreatePlayer() {
  if (!player) return;
  const pos = player.position.clone();
  const rot = player.rotation.clone();
  const scl = player.scale.clone();
  scene.remove(player);
  createPlayer();
  player.position.copy(pos);
  player.rotation.copy(rot);
  player.scale.copy(scl);
}

// ===== COP CHASER =====
function createCopChaser() {
  copChaser = new THREE.Group();

  // Cop head
  const headGeo = new THREE.SphereGeometry(0.26, 32, 32);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xf4c7a1,
    roughness: 0.7,
    metalness: 0.1,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.65;
  head.castShadow = true;
  copChaser.add(head);

  // Cop hat
  const hatBrimGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 24);
  const hatMat = new THREE.MeshStandardMaterial({
    color: 0x001f3f,
    roughness: 0.8,
  });
  const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
  hatBrim.position.y = 1.8;
  copChaser.add(hatBrim);

  const hatTopGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 24);
  const hatTop = new THREE.Mesh(hatTopGeo, hatMat);
  hatTop.position.y = 1.92;
  hatTop.castShadow = true;
  copChaser.add(hatTop);

  // Police badge on hat
  const badgeGeo = new THREE.CircleGeometry(0.08, 6);
  const badgeMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0xffa500,
    emissiveIntensity: 0.3,
  });
  const badge = new THREE.Mesh(badgeGeo, badgeMat);
  badge.position.set(0, 1.92, 0.26);
  badge.rotation.x = -0.1;
  copChaser.add(badge);

  // Sunglasses - cool cop
  const glassGeo = new THREE.BoxGeometry(0.35, 0.08, 0.02);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9,
  });
  const glasses = new THREE.Mesh(glassGeo, glassMat);
  glasses.position.set(0, 1.68, 0.24);
  copChaser.add(glasses);

  // Mustache
  const mustacheGeo = new THREE.BoxGeometry(0.2, 0.04, 0.06);
  const mustacheMat = new THREE.MeshStandardMaterial({
    color: 0x2c2c2c,
    roughness: 0.8,
  });
  const mustache = new THREE.Mesh(mustacheGeo, mustacheMat);
  mustache.position.set(0, 1.58, 0.25);
  copChaser.add(mustache);

  // Police uniform (blue)
  const uniformGeo = new THREE.BoxGeometry(0.65, 0.85, 0.4, 2, 2, 2);
  const uniformMat = new THREE.MeshStandardMaterial({
    color: 0x001f3f,
    roughness: 0.9,
    metalness: 0.1,
  });
  const uniform = new THREE.Mesh(uniformGeo, uniformMat);
  uniform.position.y = 0.95;
  uniform.castShadow = true;
  copChaser.add(uniform);

  // Police badge on chest
  const chestBadgeGeo = new THREE.CircleGeometry(0.12, 6);
  const chestBadge = new THREE.Mesh(chestBadgeGeo, badgeMat);
  chestBadge.position.set(-0.15, 1.1, 0.21);
  copChaser.add(chestBadge);

  // Radio on shoulder
  const radioGeo = new THREE.BoxGeometry(0.08, 0.12, 0.06);
  const radioMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.6,
    roughness: 0.4,
  });
  const radio = new THREE.Mesh(radioGeo, radioMat);
  radio.position.set(-0.35, 1.25, 0.1);
  copChaser.add(radio);

  // Belt with equipment
  const beltGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 24);
  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.6,
    metalness: 0.4,
  });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = 0.52;
  copChaser.add(belt);

  // Handcuffs on belt
  const cuffGeo = new THREE.TorusGeometry(0.05, 0.02, 8, 16);
  const cuffMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.9,
    roughness: 0.2,
  });
  const cuff1 = new THREE.Mesh(cuffGeo, cuffMat);
  cuff1.position.set(0.2, 0.52, 0.15);
  cuff1.rotation.x = Math.PI / 2;
  copChaser.add(cuff1);

  // Legs (dark blue pants)
  const legGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.65, 16);
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x001a33,
    roughness: 0.85,
  });

  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.14, 0.32, 0);
  leftLeg.castShadow = true;
  leftLeg.name = "copLeftLeg";
  copChaser.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.14, 0.32, 0);
  rightLeg.castShadow = true;
  rightLeg.name = "copRightLeg";
  copChaser.add(rightLeg);

  // Black police boots
  const bootGeo = new THREE.BoxGeometry(0.24, 0.16, 0.32, 2, 2, 2);
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.3,
    metalness: 0.7,
  });

  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(-0.14, 0.08, 0.05);
  leftBoot.castShadow = true;
  leftBoot.name = "copLeftShoe";
  copChaser.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0.14, 0.08, 0.05);
  rightBoot.castShadow = true;
  rightBoot.name = "copRightShoe";
  copChaser.add(rightBoot);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.4, 12);
  const armMat = new THREE.MeshStandardMaterial({
    color: 0x001f3f,
    roughness: 0.9,
  });

  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.4, 1.05, 0);
  leftArm.castShadow = true;
  leftArm.name = "copLeftArm";
  copChaser.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.4, 1.05, 0.1);
  rightArm.rotation.x = -0.5;
  rightArm.castShadow = true;
  rightArm.name = "copRightArm";
  copChaser.add(rightArm);

  // Whistle in hand
  const whistleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 12);
  const whistleMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.8,
    roughness: 0.2,
  });
  const whistle = new THREE.Mesh(whistleGeo, whistleMat);
  whistle.position.set(0.4, 0.7, 0.25);
  whistle.rotation.x = Math.PI / 2;
  copChaser.add(whistle);

  // Position cop behind player
  copChaser.position.set(CONFIG.LANE_POSITIONS[1], 0, -8);
  copChaser.userData = { targetLane: 1 };
  scene.add(copChaser);
}

function updateCopChaser(dt) {
  if (!copChaser || !player) return;

  // Cop tries to follow player's lane
  const targetLane = currentLane;
  const targetX = CONFIG.LANE_POSITIONS[targetLane];
  const copX = copChaser.position.x;

  // Smooth lane following
  const laneChangeSpeed = 2 * dt;
  if (Math.abs(targetX - copX) > 0.1) {
    if (targetX > copX) {
      copChaser.position.x += laneChangeSpeed;
    } else {
      copChaser.position.x -= laneChangeSpeed;
    }
  }

  // Cop maintains distance behind player
  let targetDistance = -7 - currentSpeed / 10;

  if (gameState === "PLAYING" && gameTime > copVisibleTimer) {
    targetDistance = -20; // Fall back
  }

  const currentDistance = copChaser.position.z;

  // Smoothly approach target distance
  copChaser.position.z += (targetDistance - currentDistance) * 5 * dt;

  if (
    gameState === "PLAYING" &&
    copChaser.position.z < -18 &&
    gameTime > copVisibleTimer
  ) {
    scene.remove(copChaser);
    copChaser = null;
    return;
  }

  // Running animation for cop
  const runCycle = (gameTime * 12) % (Math.PI * 2);
  const copLeftLeg = copChaser.getObjectByName("copLeftLeg");
  const copRightLeg = copChaser.getObjectByName("copRightLeg");
  const copLeftArm = copChaser.getObjectByName("copLeftArm");
  const copRightArm = copChaser.getObjectByName("copRightArm");

  if (copLeftLeg && copRightLeg) {
    copLeftLeg.rotation.x = Math.sin(runCycle) * 0.6;
    copRightLeg.rotation.x = Math.sin(runCycle + Math.PI) * 0.6;
  }

  if (copLeftArm) {
    copLeftArm.rotation.x = Math.sin(runCycle + Math.PI) * 0.5;
  }

  // Bob up and down
  const bobHeight = Math.sin(runCycle * 2) * 0.08;
  copChaser.position.y = bobHeight;

  // Lean into turns
  if (Math.abs(targetX - copX) > 0.5) {
    const leanAmount = targetX - copX > 0 ? -0.15 : 0.15;
    copChaser.rotation.z = leanAmount;
  } else {
    copChaser.rotation.z *= 0.9; // Smooth back to upright
  }

  // Cop only catches you if you're stunned from hitting obstacle
  // No auto-catch - cop just chases menacingly!
}

// ===== HOVERBOARD SYSTEM =====
const HoverboardManager = {
  hoverboards: {
    default: {
      name: "Classic Board",
      emoji: "🛹",
      price: 0,
      duration: 30,
      color: 0xff6b35,
      speed: 1.0,
    },
    speedy: {
      name: "Speed Demon",
      emoji: "⚡",
      price: 3000,
      duration: 45,
      color: 0xffff00,
      speed: 1.3,
    },
    rainbow: {
      name: "Rainbow Rider",
      emoji: "🌈",
      price: 5000,
      duration: 40,
      color: 0xff00ff,
      speed: 1.1,
    },
    fire: {
      name: "Flame Thrower",
      emoji: "🔥",
      price: 4000,
      duration: 35,
      color: 0xff4500,
      speed: 1.2,
    },
  },
  ownedBoards: ["default"],
  currentBoard: null,
  activeBoard: null,
  boardEndTime: 0,

  loadProgress() {
    const saved = localStorage.getItem("ownedBoards");
    if (saved) {
      this.ownedBoards = JSON.parse(saved);
    }
  },

  saveProgress() {
    localStorage.setItem("ownedBoards", JSON.stringify(this.ownedBoards));
  },

  unlockBoard(boardId) {
    if (!this.ownedBoards.includes(boardId)) {
      this.ownedBoards.push(boardId);
      this.saveProgress();
      return true;
    }
    return false;
  },

  useBoard(boardId) {
    if (!this.ownedBoards.includes(boardId)) return false;
    if (this.activeBoard) return false; // Already on board

    const board = this.hoverboards[boardId];
    this.activeBoard = boardId;
    this.boardEndTime = gameTime + board.duration;
    this.createBoardVisual();
    SoundManager.play("powerup");
    return true;
  },

  createBoardVisual() {
    console.log(
      "Creating hoverboard visual...",
      "Player exists:",
      !!player,
      "Active board:",
      this.activeBoard,
    );
    if (!player || !this.activeBoard) {
      console.log("Cannot create board - missing player or activeBoard");
      return;
    }

    const board = this.hoverboards[this.activeBoard];
    console.log("Board details:", board);

    // SUPER VISIBLE HOVERBOARD!
    const boardGeo = new THREE.BoxGeometry(1.0, 0.2, 1.8, 3, 2, 3);
    const boardMat = new THREE.MeshStandardMaterial({
      color: board.color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: board.color,
      emissiveIntensity: 0.8, // Very bright!
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(0, -0.05, 0); // Right at feet level
    boardMesh.name = "hoverboard";
    boardMesh.castShadow = true;
    boardMesh.receiveShadow = true;
    player.add(boardMesh);

    // Add decorative stripe on board
    const stripeGeo = new THREE.BoxGeometry(0.3, 0.22, 1.9);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, -0.05, 0);
    stripe.name = "boardStripe";
    player.add(stripe);

    // HUGE visible wheels
    const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 20);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
    });

    const wheelPositions = [
      [-0.4, -0.15, -0.7],
      [0.4, -0.15, -0.7],
      [-0.4, -0.15, 0.7],
      [0.4, -0.15, 0.7],
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      wheel.name = "wheel";
      wheel.castShadow = true;
      player.add(wheel);
    });

    // MASSIVE glow effect underneath - super visible!
    const glowGeo = new THREE.PlaneGeometry(1.2, 2.0);
    const glowMat = new THREE.MeshBasicMaterial({
      color: board.color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, -0.2, 0);
    glow.rotation.x = Math.PI / 2;
    glow.name = "boardGlow";
    player.add(glow);

    // Add particle trail effects
    for (let i = 0; i < 4; i++) {
      const particleGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({
        color: board.color,
        transparent: true,
        opacity: 0.7,
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.set((Math.random() - 0.5) * 0.8, -0.3, -0.8 - i * 0.3);
      particle.name = "boardParticle";
      player.add(particle);
    }

    // Adjust player pose for riding
    this.adjustPlayerPoseForBoard();

    console.log(
      "Hoverboard visual created! Player children count:",
      player.children.length,
    );
    console.log("Board mesh added:", player.getObjectByName("hoverboard"));
  },

  adjustPlayerPoseForBoard() {
    if (!player) return;

    // Bend legs slightly for riding stance
    const leftLeg = player.getObjectByName("leftLeg");
    const rightLeg = player.getObjectByName("rightLeg");
    const leftShoe = player.getObjectByName("leftShoe");
    const rightShoe = player.getObjectByName("rightShoe");

    if (leftLeg && rightLeg) {
      leftLeg.rotation.x = 0.2; // Slight bend
      rightLeg.rotation.x = 0.2;
      leftLeg.position.y = 0.3; // Lower stance
      rightLeg.position.y = 0.3;
    }

    if (leftShoe && rightShoe) {
      leftShoe.position.y = 0.02;
      rightShoe.position.y = 0.02;
    }

    // Arms out for balance
    const leftArm = player.getObjectByName("leftArm");
    const rightArm = player.getObjectByName("rightArm");

    if (leftArm && rightArm) {
      leftArm.rotation.x = -0.3;
      leftArm.rotation.z = 0.3;
      rightArm.rotation.x = -0.3;
      rightArm.rotation.z = -0.3;
    }
  },

  resetPlayerPose() {
    if (!player) return;

    // Reset to normal stance
    const leftLeg = player.getObjectByName("leftLeg");
    const rightLeg = player.getObjectByName("rightLeg");
    const leftShoe = player.getObjectByName("leftShoe");
    const rightShoe = player.getObjectByName("rightShoe");
    const leftArm = player.getObjectByName("leftArm");
    const rightArm = player.getObjectByName("rightArm");

    if (leftLeg && rightLeg) {
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftLeg.position.set(-0.13, 0.35, 0);
      rightLeg.position.set(0.13, 0.35, 0);
    }

    if (leftShoe && rightShoe) {
      leftShoe.position.set(-0.13, 0.07, 0.05);
      rightShoe.position.set(0.13, 0.07, 0.05);
    }

    if (leftArm && rightArm) {
      leftArm.rotation.set(0, 0, 0);
      rightArm.rotation.set(0, 0, 0);
    }
  },

  removeBoardVisual() {
    if (!player) return;
    const board = player.getObjectByName("hoverboard");
    if (board) player.remove(board);

    const stripe = player.getObjectByName("boardStripe");
    if (stripe) player.remove(stripe);

    const glow = player.getObjectByName("boardGlow");
    if (glow) player.remove(glow);

    // Remove all wheels
    const wheels = player.children.filter((c) => c.name === "wheel");
    wheels.forEach((w) => player.remove(w));

    // Remove all particles
    const particles = player.children.filter((c) => c.name === "boardParticle");
    particles.forEach((p) => player.remove(p));

    // Reset player pose
    this.resetPlayerPose();
  },

  update() {
    if (this.activeBoard && gameTime > this.boardEndTime) {
      this.deactivate();
    }
  },

  deactivate() {
    this.removeBoardVisual();
    this.activeBoard = null;
  },

  isActive() {
    return this.activeBoard !== null;
  },
};

// ===== MISSIONS SYSTEM =====
const MissionManager = {
  missions: [
    {
      id: 1,
      name: "Coin Collector",
      desc: "Collect 100 coins",
      target: 100,
      progress: 0,
      reward: 500,
      type: "coins",
    },
    {
      id: 2,
      name: "Distance Runner",
      desc: "Run 1000m",
      target: 1000,
      progress: 0,
      reward: 300,
      type: "distance",
    },
    {
      id: 3,
      name: "Jump Master",
      desc: "Jump 50 times",
      target: 50,
      progress: 0,
      reward: 200,
      type: "jumps",
    },
    {
      id: 4,
      name: "Power Player",
      desc: "Collect 5 power-ups",
      target: 5,
      progress: 0,
      reward: 400,
      type: "powerups",
    },
    {
      id: 5,
      name: "High Scorer",
      desc: "Score 5000 points",
      target: 5000,
      progress: 0,
      reward: 600,
      type: "score",
    },
  ],
  activeMissions: [],
  completedToday: [],

  init() {
    this.loadProgress();
    this.assignDailyMissions();
  },

  loadProgress() {
    const saved = localStorage.getItem("missionProgress");
    if (saved) {
      const data = JSON.parse(saved);
      const today = new Date().toDateString();
      if (data.date === today) {
        this.activeMissions = data.missions;
        this.completedToday = data.completed || [];
      }
    }
  },

  saveProgress() {
    const data = {
      date: new Date().toDateString(),
      missions: this.activeMissions,
      completed: this.completedToday,
    };
    localStorage.setItem("missionProgress", JSON.stringify(data));
  },

  assignDailyMissions() {
    if (this.activeMissions.length === 0) {
      // Assign 3 random missions
      const shuffled = [...this.missions].sort(() => Math.random() - 0.5);
      this.activeMissions = shuffled.slice(0, 3).map((m) => ({ ...m }));
      this.saveProgress();
    }
  },

  updateProgress(type, amount) {
    this.activeMissions.forEach((mission) => {
      if (mission.type === type && !this.completedToday.includes(mission.id)) {
        mission.progress += amount;
        if (mission.progress >= mission.target) {
          this.completeMission(mission);
        }
      }
    });
    this.saveProgress();
  },

  completeMission(mission) {
    if (this.completedToday.includes(mission.id)) return;

    this.completedToday.push(mission.id);
    totalCoins += mission.reward;
    updateTotalCoins();
    SoundManager.play("purchase");
    StoreManager.showNotification(
      `Mission Complete! +${mission.reward} coins!`,
    );
  },

  getActiveMissions() {
    return this.activeMissions;
  },
};

// ===== MYSTERY BOX SYSTEM =====
let mysteryBoxes = [];

function createMysteryBox(laneIndex, zPosition) {
  const box = new THREE.Group();
  box.userData = {
    type: "mysterybox",
    lane: laneIndex,
    collected: false,
  };

  // Box body
  const boxGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const boxMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.7,
    metalness: 0.3,
  });
  const boxMesh = new THREE.Mesh(boxGeo, boxMat);
  box.add(boxMesh);

  // Question mark
  const qGeo = new THREE.PlaneGeometry(0.5, 0.6);
  const qMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
  });
  const qMark = new THREE.Mesh(qGeo, qMat);
  qMark.position.z = 0.41;
  box.add(qMark);

  const qMark2 = qMark.clone();
  qMark2.position.z = -0.41;
  qMark2.rotation.y = Math.PI;
  box.add(qMark2);

  // Glow effect
  const glowGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.3,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  box.add(glow);

  box.position.set(CONFIG.LANE_POSITIONS[laneIndex], 0.8, zPosition);
  scene.add(box);
  mysteryBoxes.push(box);
}

function updateMysteryBoxes(dt) {
  for (let i = mysteryBoxes.length - 1; i >= 0; i--) {
    const box = mysteryBoxes[i];

    // Rotate and float
    box.rotation.y += dt * 2;
    box.position.y = 0.8 + Math.sin(gameTime * 3 + box.position.z) * 0.2;

    // Move toward player
    box.position.z -= currentSpeed * dt;

    // Check collection
    if (!box.userData.collected) {
      const dx = player.position.x - box.position.x;
      const dy = player.position.y + 1 - box.position.y;
      const dz = player.position.z - box.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.5) {
        openMysteryBox(box);
      }
    }

    // Remove if behind
    if (box.position.z < -5) {
      scene.remove(box);
      mysteryBoxes.splice(i, 1);
    }
  }
}

function openMysteryBox(box) {
  box.userData.collected = true;

  // Random rewards
  const rewards = [
    { type: "coins", amount: 50, msg: "+50 Coins!" },
    { type: "coins", amount: 100, msg: "+100 Coins!" },
    { type: "coins", amount: 200, msg: "+200 Coins!" },
    { type: "hoverboard", msg: "Free Hoverboard!" },
    { type: "score", amount: 500, msg: "+500 Score!" },
    { type: "magnet", msg: "Magnet Power-up!" },
  ];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  switch (reward.type) {
    case "coins":
      coins += reward.amount;
      totalCoins += reward.amount;
      break;
    case "score":
      score += reward.amount;
      break;
    case "hoverboard":
      if (HoverboardManager.ownedBoards.includes("default")) {
        HoverboardManager.useBoard("default");
      }
      break;
    case "magnet":
      PowerUpManager.activate("magnet", 10);
      break;
  }

  StoreManager.showNotification(reward.msg);
  SoundManager.play("coin");

  // Animate box
  const animateBox = () => {
    box.scale.multiplyScalar(0.9);
    box.rotation.y += 0.2;
    if (box.scale.x > 0.1) {
      requestAnimationFrame(animateBox);
    } else {
      scene.remove(box);
      const idx = mysteryBoxes.indexOf(box);
      if (idx > -1) mysteryBoxes.splice(idx, 1);
    }
  };
  animateBox();

  updateUI();
  updateTotalCoins();
}

// ===== KEYS AND SCORE MULTIPLIER SYSTEM =====
let collectedKeys = 0;
let maxKeys = 5;
let scoreMultiplierKeys = 1;
let keyObjects = [];

function createKey(laneIndex, zPosition) {
  const key = new THREE.Group();
  key.userData = { type: "key", lane: laneIndex, collected: false };

  // Key head
  const headGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0xffaa00,
    emissiveIntensity: 0.5,
  });
  const head = new THREE.Mesh(headGeo, keyMat);
  head.rotation.x = Math.PI / 2;
  key.add(head);

  // Key shaft
  const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
  const shaft = new THREE.Mesh(shaftGeo, keyMat);
  shaft.position.z = -0.3;
  shaft.rotation.x = Math.PI / 2;
  key.add(shaft);

  // Key teeth
  for (let i = 0; i < 3; i++) {
    const toothGeo = new THREE.BoxGeometry(0.05, 0.1, 0.08);
    const tooth = new THREE.Mesh(toothGeo, keyMat);
    tooth.position.set(0.05, 0, -0.45 - i * 0.1);
    key.add(tooth);
  }

  key.position.set(CONFIG.LANE_POSITIONS[laneIndex], 1.5, zPosition);
  scene.add(key);
  keyObjects.push(key);
}

function updateKeys(dt) {
  for (let i = keyObjects.length - 1; i >= 0; i--) {
    const key = keyObjects[i];

    // Rotate
    key.rotation.y += dt * 4;
    key.position.y = 1.5 + Math.sin(gameTime * 4 + key.position.z) * 0.15;

    // Move toward player
    key.position.z -= currentSpeed * dt;

    // Check collection
    if (!key.userData.collected) {
      const dx = player.position.x - key.position.x;
      const dy = player.position.y + 1 - key.position.y;
      const dz = player.position.z - key.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.5) {
        collectKey(key);
      }
    }

    // Remove if behind
    if (key.position.z < -5) {
      scene.remove(key);
      keyObjects.splice(i, 1);
    }
  }
}

function collectKey(key) {
  key.userData.collected = true;
  collectedKeys++;

  if (collectedKeys >= maxKeys) {
    scoreMultiplierKeys++;
    collectedKeys = 0;
    StoreManager.showNotification(`Score Multiplier: x${scoreMultiplierKeys}!`);
    SoundManager.play("powerup");
  } else {
    SoundManager.play("coin");
  }

  // Animate
  const animateKey = () => {
    key.position.y += 0.3;
    key.scale.multiplyScalar(0.9);
    if (key.scale.x > 0.1) {
      requestAnimationFrame(animateKey);
    } else {
      scene.remove(key);
      const idx = keyObjects.indexOf(key);
      if (idx > -1) keyObjects.splice(idx, 1);
    }
  };
  animateKey();

  updateUI();
}

// ===== SUPER SNEAKERS POWER-UP =====
function createSuperSneakers(laneIndex, zPosition) {
  const sneakers = new THREE.Group();
  sneakers.userData = {
    type: "powerup",
    powerUpType: "sneakers",
    lane: laneIndex,
    collected: false,
  };

  // Shoe
  const shoeGeo = new THREE.BoxGeometry(0.4, 0.3, 0.6);
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.5,
    emissive: 0x00ff00,
    emissiveIntensity: 0.4,
  });
  const shoe = new THREE.Mesh(shoeGeo, shoeMat);
  sneakers.add(shoe);

  // Wings on shoe
  const wingGeo = new THREE.BoxGeometry(0.6, 0.05, 0.3);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.7,
    roughness: 0.3,
  });

  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-0.35, 0, 0);
  leftWing.rotation.z = 0.5;
  sneakers.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0.35, 0, 0);
  rightWing.rotation.z = -0.5;
  sneakers.add(rightWing);

  sneakers.position.set(CONFIG.LANE_POSITIONS[laneIndex], 1.0, zPosition);
  scene.add(sneakers);
  PowerUpManager.powerUpObjects.push(sneakers);
}

// ===== COMBO AND TRICKS SYSTEM =====
let comboCount = 0;
let lastTrickTime = 0;
let comboMultiplier = 1;

function performTrick(trickName) {
  const currentTime = Date.now();
  if (currentTime - lastTrickTime < 5000) {
    comboCount++;
    comboMultiplier = 1 + comboCount * 0.1;
  } else {
    comboCount = 1;
    comboMultiplier = 1;
  }

  lastTrickTime = currentTime;

  const trickScore = 50 * comboMultiplier * multiplier;
  score += trickScore;

  StoreManager.showNotification(
    `${trickName}! +${Math.floor(trickScore)} pts (Combo x${comboCount})`,
  );
  SoundManager.play("coin");

  MissionManager.updateProgress("score", trickScore);
  updateUI();
}

// ===== DAILY REWARD SYSTEM =====
const DailyRewardManager = {
  lastClaimed: null,
  streak: 0,
  rewards: [
    { day: 1, coins: 100 },
    { day: 2, coins: 200 },
    { day: 3, coins: 300 },
    { day: 4, coins: 500 },
    { day: 5, coins: 700 },
    { day: 6, coins: 1000 },
    { day: 7, coins: 2000 },
  ],

  init() {
    this.loadProgress();
    this.checkDailyReward();
  },

  loadProgress() {
    const saved = localStorage.getItem("dailyReward");
    if (saved) {
      const data = JSON.parse(saved);
      this.lastClaimed = data.lastClaimed;
      this.streak = data.streak || 0;
    }
  },

  saveProgress() {
    const data = {
      lastClaimed: this.lastClaimed,
      streak: this.streak,
    };
    localStorage.setItem("dailyReward", JSON.stringify(data));
  },

  checkDailyReward() {
    const today = new Date().toDateString();
    if (this.lastClaimed !== today) {
      this.showDailyReward();
    }
  },

  showDailyReward() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check streak
    if (this.lastClaimed === yesterday) {
      this.streak++;
    } else if (this.lastClaimed !== today) {
      this.streak = 1;
    }

    if (this.streak > 7) this.streak = 7;

    const reward = this.rewards[this.streak - 1];
    totalCoins += reward.coins;
    updateTotalCoins();

    this.lastClaimed = today;
    this.saveProgress();

    setTimeout(() => {
      StoreManager.showNotification(
        `Daily Reward Day ${this.streak}! +${reward.coins} coins!`,
      );
    }, 1000);
  },
};

function createBuildings() {
  // 1. Far Buildings (Parallax, 0.3 speed)
  const buildingColors = [
    0xe74c3c, 0x3498db, 0x95a5a6, 0xd35400, 0x7f8c8d, 0x2c3e50, 0x16a085,
    0xf1c40f,
  ];

  for (let side of [-1, 1]) {
    for (let i = 0; i < 25; i++) {
      const height = 15 + Math.random() * 30;
      const width = 8 + Math.random() * 8;
      const depth = 5 + Math.random() * 8;

      const buildingGeo = new THREE.BoxGeometry(width, height, depth, 3, 3, 3);
      const buildingColor =
        buildingColors[Math.floor(Math.random() * buildingColors.length)];
      const buildingMat = new THREE.MeshStandardMaterial({
        color: buildingColor,
        roughness: 0.85,
        metalness: 0.1,
      });
      const building = new THREE.Mesh(buildingGeo, buildingMat);

      building.position.set(
        side * (18 + Math.random() * 10), // Set further back from track
        height / 2,
        i * 18 + Math.random() * 8 - 100,
      );
      building.castShadow = true;
      building.receiveShadow = true;

      // Add roof details
      const roofGeo = new THREE.BoxGeometry(width + 0.5, 0.5, depth + 0.5);
      const roofMat = new THREE.MeshStandardMaterial({
        color: 0x2c3e50,
        roughness: 0.7,
        metalness: 0.3,
      });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = height / 2 + 0.25;
      building.add(roof);

      // Add windows with lighting
      addWindowsToBuilding(building, width, height, depth, side);

      scene.add(building);
      buildings.push({ mesh: building, initialZ: building.position.z });
    }

    // 2. Foreground Street Props (1.0 speed) - THƯA THỚT HƠN ĐỂ CHỐNG LAG
    for (let i = 0; i < 5; i++) {
      const zPos = i * 200 - 100; // Khoảng cách giãn ra 200m mỗi cụm cảnh quan

      // Trees
      if (Math.random() > 0.3) {
        const tree = createTree(side * (9 + Math.random() * 2), zPos);
        environmentProps.push({ mesh: tree });
      }

      // Bushes
      if (Math.random() > 0.5) {
        const bush = createBush(side * (7.5 + Math.random() * 1.5), zPos + 25);
        environmentProps.push({ mesh: bush });
      }

      // Lampposts - Cách nhau xa, tối ưu bộ nhớ
      const lamp = createLamppost(side, zPos + 100);
      environmentProps.push({ mesh: lamp });
    }
  }
}

function createTree(x, z) {
  const group = new THREE.Group();
  const height = 3 + Math.random() * 3;

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, height, 5);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 1.0,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  group.add(trunk);

  const leafGeo = new THREE.DodecahedronGeometry(1.5 + Math.random(), 1);
  const leafColors = [0x27ae60, 0x2ecc71, 0x229954];
  const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];
  const leafMat = new THREE.MeshStandardMaterial({
    color: leafColor,
    roughness: 0.9,
  });

  const numLeaves = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numLeaves; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(
      (Math.random() - 0.5) * 1.5,
      height + Math.random() * 2,
      (Math.random() - 0.5) * 1.5,
    );
    leaf.scale.set(1, 0.8 + Math.random() * 0.4, 1);
    leaf.castShadow = true;
    group.add(leaf);
  }

  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

function createBush(x, z) {
  const group = new THREE.Group();
  const bushGeo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.5, 1);
  const bushMat = new THREE.MeshStandardMaterial({
    color: 0x229954,
    roughness: 1.0,
  });
  const bush = new THREE.Mesh(bushGeo, bushMat);
  bush.position.y = 0.5;
  bush.scale.set(1, 0.7, 1);
  bush.castShadow = true;
  group.add(bush);

  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

function createLamppost(side, z) {
  const group = new THREE.Group();

  const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 5, 8);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    metalness: 0.8,
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2.5;
  pole.castShadow = true;
  group.add(pole);

  const topGeo = new THREE.BoxGeometry(1.2, 0.15, 0.3);
  const top = new THREE.Mesh(topGeo, poleMat);
  top.position.set(side * -0.4, 5, 0);
  group.add(top);

  const bulbGeo = new THREE.BoxGeometry(0.6, 0.1, 0.2);
  const bulbMat = new THREE.MeshBasicMaterial({
    color: 0xffffaa, // Dùng Basic Material để giả lập đèn sáng mà không gây lag máy
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(side * -0.6, 4.9, 0);
  group.add(bulb);

  // ĐÃ LOẠI BỎ POINT LIGHT (NGUYÊN NHÂN CHÍNH GÂY LAG)

  group.position.set(side * 6.5, 0, z);
  scene.add(group);
  return group;
}

function addFireEscape(building, width, height, depth) {
  const escapeGeo = new THREE.BoxGeometry(0.05, height * 0.8, 0.6);
  const escapeMat = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    metalness: 0.7,
    roughness: 0.4,
  });
  const escape = new THREE.Mesh(escapeGeo, escapeMat);
  escape.position.set(width / 2 + 0.1, 0, 0);
  building.add(escape);
}

function addWindowsToBuilding(building, width, height, depth, side) {
  // REALISTIC GLOWING WINDOWS
  const rows = Math.floor(height / 2.5);
  const cols = Math.floor(width / 1.5);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() > 0.2) {
        // Window pane with emission
        const isLit = Math.random() > 0.3;
        const windowGeo = new THREE.PlaneGeometry(0.7, 0.9);
        const windowMat = new THREE.MeshStandardMaterial({
          color: isLit ? 0xffffdd : 0x444444,
          emissive: isLit ? 0xffff88 : 0x000000,
          emissiveIntensity: isLit ? 0.8 : 0,
          roughness: 0.1,
          metalness: 0.8,
        });
        const window = new THREE.Mesh(windowGeo, windowMat);
        window.position.set(
          (col - cols / 2 + 0.5) * 1.3,
          (row - rows / 2 + 0.5) * 2.3 + height / 2 - 1,
          depth / 2 + 0.02,
        );
        window.rotation.y = side > 0 ? Math.PI : 0;
        building.add(window);

        // Window frame
        const frameGeo = new THREE.PlaneGeometry(0.75, 0.95);
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.9,
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(
          (col - cols / 2 + 0.5) * 1.3,
          (row - rows / 2 + 0.5) * 2.3 + height / 2 - 1,
          depth / 2 + 0.01,
        );
        frame.rotation.y = side > 0 ? Math.PI : 0;
        building.add(frame);
      }
    }
  }
}

function createTrain(laneIndex, zPosition, forceRamp = false) {
  const train = new THREE.Group();
  train.userData = { type: "train", lane: laneIndex, length: 20 };

  const trainLength = 15 + Math.random() * 10;
  const numCars = Math.floor(trainLength / 8);

  // Tăng tỉ lệ 65% tàu sẽ có bậc thang (ramp) để leo lên, cho phép ép buộc có dốc
  const hasRamp = forceRamp || Math.random() < 0.65;
  train.userData.hasRamp = hasRamp;

  for (let i = 0; i < numCars; i++) {
    const car = createTrainCar();
    car.position.z = i * 8.5;
    train.add(car);
  }

  if (hasRamp) {
    const rampLength = 4.0; // Độ dài 4.0 m với độ cao 3.5 m tạo góc nghiêng gần 45 độ
    const rampHeight = 3.5;
    const actualRampLen = Math.sqrt(
      rampLength * rampLength + rampHeight * rampHeight,
    );
    const rampGeo = new THREE.BoxGeometry(2.2, 0.2, actualRampLen);
    const rampMat = new THREE.MeshLambertMaterial({ color: 0x2ecc71 }); // Màu xanh lá cây
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(0, rampHeight / 2, -4.0 - rampLength / 2);
    ramp.rotation.x = -Math.atan2(rampHeight, rampLength);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    train.add(ramp);
  }

  train.position.set(CONFIG.LANE_POSITIONS[laneIndex], 0, zPosition);
  train.userData.length = numCars * 8.5;

  scene.add(train);
  obstacles.push(train);

  // Xuất hiện tiền trên nóc tàu và trên dốc
  if (hasRamp || Math.random() < 0.4) {
    const actualLength = numCars * 8.5;
    const numCoins = Math.floor(actualLength / 2.5);

    if (hasRamp) {
      for (let i = 0; i < 2; i++) {
        const rz = -6.5 + i * 2;
        const ry = ((rz + 8.0) / 4.0) * 3.5 + 0.8;
        createCoin(laneIndex, zPosition + rz, ry);
      }
    }

    for (let i = 0; i < numCoins; i++) {
      createCoin(laneIndex, zPosition + (hasRamp ? -2 : 0) + i * 2.5, 4.2);
    }
  }
}

function createTrainCar() {
  const car = new THREE.Group();

  // Main body - Realistic Metallic Material
  const bodyGeo = new THREE.BoxGeometry(2.2, 3.2, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: CONFIG.COLORS.TRAIN_BODY,
    metalness: 0.6,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.8;
  body.castShadow = true;
  car.add(body);

  // Decorative Stripe along the train (Dải sơn đỏ dọc toa)
  const stripeGeo = new THREE.PlaneGeometry(8, 0.2);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xe74c3c, // Red stripe
    metalness: 0.4,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  for (let side of [-1, 1]) {
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(side * 1.11, 1.2, 0);
    stripe.rotation.y = Math.PI / 2;
    car.add(stripe);
  }

  // Windows - Realistic Glass
  const windowGeo = new THREE.PlaneGeometry(1.5, 1.2);
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x111111, // Dark glass
    metalness: 0.9,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });

  for (let side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const window = new THREE.Mesh(windowGeo, windowMat);
      window.position.set(side * 1.11, 2.2, -2.5 + i * 2.5);
      window.rotation.y = Math.PI / 2;
      car.add(window);
    }
  }

  // Front/back windows
  const frontWindowGeo = new THREE.PlaneGeometry(1.8, 1.5);
  const frontWindow = new THREE.Mesh(frontWindowGeo, windowMat);
  frontWindow.position.set(0, 2.2, 4.01);
  car.add(frontWindow);

  const backWindow = new THREE.Mesh(frontWindowGeo, windowMat);
  backWindow.position.set(0, 2.2, -4.01);
  backWindow.rotation.y = Math.PI;
  car.add(backWindow);

  // Headlights / Taillights (Cụm đèn pha & đèn hậu)
  const lightGeo = new THREE.CircleGeometry(0.2, 16);
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 0.8,
  });

  const leftLight = new THREE.Mesh(lightGeo, lightMat);
  leftLight.position.set(-0.7, 1.0, 4.01);
  car.add(leftLight);

  const rightLight = new THREE.Mesh(lightGeo, lightMat);
  rightLight.position.set(0.7, 1.0, 4.01);
  car.add(rightLight);

  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8,
  });

  const backLeftLight = new THREE.Mesh(lightGeo, tailLightMat);
  backLeftLight.position.set(-0.7, 1.0, -4.01);
  backLeftLight.rotation.y = Math.PI;
  car.add(backLeftLight);

  const backRightLight = new THREE.Mesh(lightGeo, tailLightMat);
  backRightLight.position.set(0.7, 1.0, -4.01);
  backRightLight.rotation.y = Math.PI;
  car.add(backRightLight);

  // Roof details (AC units and vents)
  const roofGeo = new THREE.BoxGeometry(1.4, 0.3, 2.5);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    metalness: 0.5,
    roughness: 0.6,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 3.5;
  car.add(roof);

  const ventGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
  const vent = new THREE.Mesh(ventGeo, roofMat);
  vent.position.set(0, 3.5, 2);
  car.add(vent);

  // Graffiti panels (colored rectangles)
  const graffitiColors = [
    0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181, 0xaa96da,
  ];
  const graffitiGeo = new THREE.PlaneGeometry(3, 1);

  for (let side of [-1, 1]) {
    if (Math.random() > 0.5) {
      const graffitiMat = new THREE.MeshBasicMaterial({
        color:
          graffitiColors[Math.floor(Math.random() * graffitiColors.length)],
        side: THREE.DoubleSide,
      });
      const graffiti = new THREE.Mesh(graffitiGeo, graffitiMat);
      graffiti.position.set(side * 1.12, 1, Math.random() * 4 - 2);
      graffiti.rotation.y = Math.PI / 2;
      car.add(graffiti);
    }
  }

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.8,
    roughness: 0.4,
  });

  // Wheel connecting rod
  const rodGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
  const rodMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.9,
    roughness: 0.2,
  });

  for (let z of [-2.5, 2.5]) {
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(0, 0.3, z);
    rod.rotation.z = Math.PI / 2;
    car.add(rod);

    for (let x of [-0.8, 0.8]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, 0.3, z);
      wheel.rotation.z = Math.PI / 2;
      car.add(wheel);
    }
  }

  return car;
}

function createBarrier(laneIndex, zPosition, type = "small") {
  const barrier = new THREE.Group();
  barrier.userData = {
    type: "barrier",
    lane: laneIndex,
    barrierType: type,
  };

  if (type === "small") {
    // Traffic cone style
    const coneGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
    const coneMat = new THREE.MeshLambertMaterial({
      color: CONFIG.COLORS.BARRIER,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.4;
    cone.castShadow = true;
    barrier.add(cone);

    // White stripes
    const stripeGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.15, 8);
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
    stripe1.position.y = 0.35;
    barrier.add(stripe1);
    const stripe2 = new THREE.Mesh(stripeGeo, stripeMat);
    stripe2.position.y = 0.55;
    stripe2.scale.set(0.85, 1, 0.85);
    barrier.add(stripe2);
  } else {
    // Large crate
    const crateGeo = new THREE.BoxGeometry(1.5, 1.2, 1);
    const crateMat = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.y = 0.6;
    crate.castShadow = true;
    barrier.add(crate);

    // Wooden texture lines
    const lineGeo = new THREE.BoxGeometry(1.52, 0.05, 1.02);
    const lineMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    for (let i = 0; i < 3; i++) {
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.y = 0.3 + i * 0.35;
      barrier.add(line);
    }
  }

  barrier.position.set(CONFIG.LANE_POSITIONS[laneIndex], 0, zPosition);

  scene.add(barrier);
  obstacles.push(barrier);
}

function createOverhead(zPosition) {
  const overhead = new THREE.Group();
  overhead.userData = { type: "overhead" };

  // Horizontal beam across all lanes
  const beamGeo = new THREE.BoxGeometry(CONFIG.TRACK_WIDTH, 0.5, 0.5);
  const beamMat = new THREE.MeshLambertMaterial({ color: 0x27ae60 });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 1.4;
  beam.castShadow = true;
  overhead.add(beam);

  // Support pillars
  const pillarGeo = new THREE.BoxGeometry(0.4, 4, 0.4);
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });

  const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
  leftPillar.position.set(-CONFIG.TRACK_WIDTH / 2 - 0.5, 2, 0);
  leftPillar.castShadow = true;
  overhead.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
  rightPillar.position.set(CONFIG.TRACK_WIDTH / 2 + 0.5, 2, 0);
  rightPillar.castShadow = true;
  overhead.add(rightPillar);

  // Warning sign
  const signGeo = new THREE.PlaneGeometry(2, 1);
  const signMat = new THREE.MeshBasicMaterial({
    color: 0xf1c40f,
    side: THREE.DoubleSide,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 2.5, 0);
  overhead.add(sign);

  overhead.position.set(0, 0, zPosition);

  scene.add(overhead);
  obstacles.push(overhead);
}

function createCoin(laneIndex, zPosition, yOffset = 0.8) {
  const coin = new THREE.Group();
  coin.userData = { type: "coin", lane: laneIndex, collected: false };

  // Coin disc
  const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
  const coinMat = new THREE.MeshStandardMaterial({
    color: CONFIG.COLORS.COIN,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xffa500,
    emissiveIntensity: 0.2,
  });
  const coinMesh = new THREE.Mesh(coinGeo, coinMat);
  coinMesh.rotation.z = Math.PI / 2;
  coin.add(coinMesh);

  // Star detail on coin
  const starGeo = new THREE.CircleGeometry(0.2, 5);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const star = new THREE.Mesh(starGeo, starMat);
  star.position.x = 0.06;
  star.rotation.y = Math.PI / 2;
  coin.add(star);

  coin.position.set(CONFIG.LANE_POSITIONS[laneIndex], yOffset, zPosition);

  scene.add(coin);
  coinObjects.push(coin);
}

function createCoinPattern(pattern, startZ) {
  switch (pattern) {
    case "line":
      const lane = Math.floor(Math.random() * 3);
      for (let i = 0; i < 5; i++) {
        createCoin(lane, startZ + i * 2);
      }
      break;
    case "diagonal":
      for (let i = 0; i < 5; i++) {
        createCoin(i % 3, startZ + i * 2);
      }
      break;
    case "arc":
      const arcLane = Math.floor(Math.random() * 3);
      const heights = [0.8, 1.5, 2.5, 1.5, 0.8];
      for (let i = 0; i < 5; i++) {
        createCoin(arcLane, startZ + i * 2, heights[i]);
      }
      break;
    case "all_lanes":
      for (let i = 0; i < 3; i++) {
        createCoin(i, startZ);
      }
      break;
  }
}

// ===== POWER-UP CREATION =====
function createPowerUp(type, laneIndex, zPosition) {
  const powerUp = new THREE.Group();
  powerUp.userData = {
    type: "powerup",
    powerUpType: type,
    lane: laneIndex,
    collected: false,
  };

  if (type === "magnet") {
    // Magnet shape
    const magnetGeo = new THREE.BoxGeometry(0.6, 0.8, 0.2);
    const magnetMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
    });
    const magnet = new THREE.Mesh(magnetGeo, magnetMat);
    powerUp.add(magnet);

    // North/South poles
    const poleGeo = new THREE.BoxGeometry(0.65, 0.25, 0.25);
    const northMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const southMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });

    const north = new THREE.Mesh(poleGeo, northMat);
    north.position.y = 0.3;
    powerUp.add(north);

    const south = new THREE.Mesh(poleGeo, southMat);
    south.position.y = -0.3;
    powerUp.add(south);
  } else if (type === "jetpack") {
    // Jetpack shape
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      metalness: 0.7,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    powerUp.add(body);

    // Thrusters
    const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.4, 8);
    const thrusterMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
    });

    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.position.set(-0.15, -0.3, 0);
    powerUp.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    rightThruster.position.set(0.15, -0.3, 0);
    powerUp.add(rightThruster);

    // Flame effect
    const flameGeo = new THREE.ConeGeometry(0.1, 0.3, 8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.7,
    });

    const leftFlame = new THREE.Mesh(flameGeo, flameMat);
    leftFlame.position.set(-0.15, -0.6, 0);
    powerUp.add(leftFlame);

    const rightFlame = new THREE.Mesh(flameGeo, flameMat);
    rightFlame.position.set(0.15, -0.6, 0);
    powerUp.add(rightFlame);
  }

  powerUp.position.set(CONFIG.LANE_POSITIONS[laneIndex], 1.2, zPosition);
  scene.add(powerUp);
  PowerUpManager.powerUpObjects.push(powerUp);
}

function updatePowerUpObjects(dt) {
  for (let i = PowerUpManager.powerUpObjects.length - 1; i >= 0; i--) {
    const powerUp = PowerUpManager.powerUpObjects[i];

    // Rotate power-up
    powerUp.rotation.y += dt * 2;

    // Bob up and down
    powerUp.position.y =
      1.2 + Math.sin(gameTime * 3 + powerUp.position.z) * 0.2;

    // Move toward player
    powerUp.position.z -= currentSpeed * dt;

    // Check collection
    if (!powerUp.userData.collected) {
      const dx = player.position.x - powerUp.position.x;
      const dy = player.position.y + 1 - powerUp.position.y;
      const dz = player.position.z - powerUp.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.5) {
        collectPowerUp(powerUp);
      }
    }

    // Remove if behind player
    if (powerUp.position.z < -5) {
      scene.remove(powerUp);
      PowerUpManager.powerUpObjects.splice(i, 1);
    }
  }
}

function collectPowerUp(powerUp) {
  powerUp.userData.collected = true;
  const type = powerUp.userData.powerUpType;

  // Activate power-up
  if (type === "magnet") {
    PowerUpManager.activate("magnet", 10); // 10 seconds
    MissionManager.updateProgress("powerups", 1);
  } else if (type === "jetpack") {
    PowerUpManager.activate("jetpack", 8); // 8 seconds
    SoundManager.play("jetpackBoost");
    MissionManager.updateProgress("powerups", 1);
    spawnInitialJetpackCoins();
  } else if (type === "sneakers") {
    PowerUpManager.activate("sneakers", 15); // 15 seconds
    StoreManager.showNotification("Super Sneakers! Higher jumps!");
    SoundManager.play("powerup");
    MissionManager.updateProgress("powerups", 1);
  }

  // Collection animation
  const animatePowerUp = () => {
    powerUp.position.y += 0.3;
    powerUp.scale.multiplyScalar(0.9);
    if (powerUp.scale.x > 0.1) {
      requestAnimationFrame(animatePowerUp);
    } else {
      scene.remove(powerUp);
      const idx = PowerUpManager.powerUpObjects.indexOf(powerUp);
      if (idx > -1) PowerUpManager.powerUpObjects.splice(idx, 1);
    }
  };
  animatePowerUp();
}

// ===== JETPACK VISUALS & PARTICLES =====
function createJetpackOnPlayer() {
  if (jetpackMeshOnPlayer || !player) return;

  jetpackMeshOnPlayer = new THREE.Group();

  // Jetpack body
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x00aaff,
    metalness: 0.7,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  jetpackMeshOnPlayer.add(body);

  // Thrusters
  const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.4, 8);
  const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
  leftThruster.position.set(-0.15, -0.3, 0);
  jetpackMeshOnPlayer.add(leftThruster);

  const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
  rightThruster.position.set(0.15, -0.3, 0);
  jetpackMeshOnPlayer.add(rightThruster);

  // Position on player's back
  jetpackMeshOnPlayer.position.set(0, 1.1, -0.48);
  player.add(jetpackMeshOnPlayer);
}

function removeJetpackFromPlayer() {
  if (jetpackMeshOnPlayer && player) {
    player.remove(jetpackMeshOnPlayer);
    jetpackMeshOnPlayer = null;
  }
}

function updateJetpackParticles(dt) {
  // Sinh hạt lửa (particles) mới liên tục nếu đang bay Jetpack
  if (PowerUpManager.isActive("jetpack") && player && jetpackMeshOnPlayer) {
    for (let i = 0; i < 3; i++) {
      const particleGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const particleMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 1.0,
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);

      const isLeft = Math.random() > 0.5;
      const offsetX = isLeft ? -0.15 : 0.15;

      // Bắt đầu hạt lửa từ dưới miệng ống xả
      particle.position.copy(player.position);
      particle.position.x += offsetX + (Math.random() - 0.5) * 0.1;
      particle.position.y += 0.8 + (Math.random() - 0.5) * 0.1;
      particle.position.z += -0.48 + (Math.random() - 0.5) * 0.1;

      particle.userData = {
        life: 1.0,
        maxLife: 0.3 + Math.random() * 0.3,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -4 - Math.random() * 4, // Lực đẩy rơi xuống dưới
          (Math.random() - 0.5) * 2,
        ),
        rotSpeed: (Math.random() - 0.5) * 15,
      };

      scene.add(particle);
      jetpackParticles.push(particle);
    }
  }

  // Cập nhật trạng thái các hạt hiện có
  for (let i = jetpackParticles.length - 1; i >= 0; i--) {
    const p = jetpackParticles[i];
    p.userData.life -= dt;

    if (p.userData.life <= 0) {
      scene.remove(p);
      jetpackParticles.splice(i, 1);
      continue;
    }

    // Di chuyển hạt dựa trên lực bay và vận tốc kéo thế giới (cảm giác nhân vật lướt đi)
    p.position.addScaledVector(p.userData.velocity, dt);
    p.position.z -= currentSpeed * dt;

    // Thu nhỏ và đổi màu từ Vàng -> Cam -> Khói Xám
    const lifeRatio = p.userData.life / p.userData.maxLife;
    p.scale.setScalar(lifeRatio);

    if (lifeRatio > 0.6) {
      p.material.color.setHex(0xffff00); // Yellow
    } else if (lifeRatio > 0.3) {
      p.material.color.setHex(0xff6600); // Orange
    } else {
      p.material.color.setHex(0x555555); // Gray/Smoke
      p.material.opacity = lifeRatio * 1.5;
    }

    // Xoay hạt ngẫu nhiên tạo độ mượt
    p.rotation.x += p.userData.rotSpeed * dt;
    p.rotation.y += p.userData.rotSpeed * dt;
  }
}

// ===== SPEED LINES / MOTION BLUR EFFECT =====
function createSpeedLines() {
  speedLinesGroup = new THREE.Group();
  camera.add(speedLinesGroup); // Gắn hiệu ứng dính chặt vào Camera

  const lineGeo = new THREE.BoxGeometry(0.04, 0.04, 4);
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.0,
  });

  const aspect = window.innerWidth / window.innerHeight;

  for (let i = 0; i < 40; i++) {
    const line = new THREE.Mesh(lineGeo, lineMat);

    // Rải ngẫu nhiên xung quanh rìa màn hình, để trống ở giữa
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.5 + Math.random() * 3.5;

    line.position.x = Math.cos(angle) * radius * aspect;
    line.position.y = Math.sin(angle) * radius;
    line.position.z = -5 - Math.random() * 15; // Nằm trước Camera

    line.userData = { speed: 40 + Math.random() * 30 };

    speedLinesGroup.add(line);
    speedLineParticles.push(line);
  }
  speedLinesGroup.visible = false;
}

function updateSpeedLines(dt) {
  if (!speedLinesGroup) return;

  const threshold = CONFIG.MAX_SPEED * 0.85; // Bắt đầu hiện ở mức 85% tốc độ tối đa
  if (currentSpeed > threshold && gameState === "PLAYING") {
    speedLinesGroup.visible = true;
    const intensity =
      (currentSpeed - threshold) / (CONFIG.MAX_SPEED - threshold); // Nội suy 0.0 -> 1.0
    speedLineParticles.forEach((line) => {
      line.position.z += line.userData.speed * dt; // Lao về phía màn hình
      if (line.position.z > 2) line.position.z = -15 - Math.random() * 10; // Reset lại ra xa
      line.material.opacity = 0.6 * intensity; // Tốc độ càng cao, sọc càng rõ
    });
  } else {
    speedLinesGroup.visible = false;
  }
}

// ===== OBSTACLE SPAWNING =====
let lastPowerUpZ = 0;
let lastKeyZ = 0;
let lastMysteryBoxZ = 0;

function spawnInitialJetpackCoins() {
  // Ngay khi nhặt Jetpack, tạo sẵn một dải xu dài trên không để ăn luôn
  for (let z = 40; z <= CONFIG.VISIBLE_DISTANCE; z += 4) {
    // Tạo hiệu ứng lượn sóng cho đường xu trên không
    const wave = Math.sin((distance + z) * 0.1);
    let lane = 1;
    if (wave < -0.5) lane = 0;
    else if (wave > 0.5) lane = 2;

    createCoin(lane, z, 8.0); // Đặt y = 8.0 để vừa với tầm bắt xu của player
  }
  lastCoinZ = distance;
}

function spawnObstacles() {
  // Giữ vật thể spawn cố định ở rìa tầm nhìn, dùng khoảng cách (distance) để tracking thay vì Z
  const spawnZ = CONFIG.VISIBLE_DISTANCE;
  const jetpackActive = PowerUpManager.isActive("jetpack");

  if (jetpackActive) {
    // Chế độ bay: Chỉ spawn liên tục một hàng xu trên bầu trời, bỏ qua chướng ngại vật
    if (distance - lastCoinZ > 4) {
      const wave = Math.sin(distance * 0.1);
      let lane = 1;
      if (wave < -0.5) lane = 0;
      else if (wave > 0.5) lane = 2;

      createCoin(lane, spawnZ, 8.0);
      lastCoinZ = distance;
    }

    // Đồng bộ lại các bộ đếm để ngay khi rớt xuống đất, game không sinh một cục chướng ngại vật cùng lúc
    if (distance - lastObstacleZ > CONFIG.MIN_OBSTACLE_GAP)
      lastObstacleZ = distance;
    if (distance - lastPowerUpZ > 40) lastPowerUpZ = distance;
    if (distance - lastKeyZ > 60) lastKeyZ = distance;
    if (distance - lastMysteryBoxZ > 80) lastMysteryBoxZ = distance;

    return; // Dừng lại ở đây, không sinh ra chướng ngại vật bình thường
  }

  // Spawn obstacles
  if (distance - lastObstacleZ > CONFIG.MIN_OBSTACLE_GAP) {
    const difficulty = Math.min(distance / 1000, 1);
    const pattern = selectObstaclePattern(difficulty);

    createObstaclePattern(pattern, spawnZ);
    lastObstacleZ = distance;
  }

  // Spawn coins
  if (distance - lastCoinZ > 8 && Math.random() < CONFIG.COIN_SPAWN_CHANCE) {
    const patterns = ["line", "diagonal", "arc", "all_lanes"];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    createCoinPattern(pattern, spawnZ);
    lastCoinZ = distance;
  }

  // Spawn power-ups (magnet, jetpack, sneakers)
  if (distance - lastPowerUpZ > 40 && Math.random() < 0.15) {
    const rand = Math.random();
    let powerUpType;
    if (rand < 0.4) powerUpType = "magnet";
    else if (rand < 0.7) powerUpType = "jetpack";
    else powerUpType = "sneakers";

    const lane = Math.floor(Math.random() * 3);
    if (powerUpType === "sneakers") createSuperSneakers(lane, spawnZ);
    else createPowerUp(powerUpType, lane, spawnZ);
    lastPowerUpZ = distance;
  }

  // Spawn keys
  if (distance - lastKeyZ > 60 && Math.random() < 0.25) {
    const lane = Math.floor(Math.random() * 3);
    createKey(lane, spawnZ);
    lastKeyZ = distance;
  }

  // Spawn mystery boxes
  if (distance - lastMysteryBoxZ > 80 && Math.random() < 0.2) {
    const lane = Math.floor(Math.random() * 3);
    createMysteryBox(lane, spawnZ);
    lastMysteryBoxZ = distance;
  }
}

function selectObstaclePattern(difficulty) {
  const r = Math.random();

  if (difficulty < 0.3) {
    // Easy
    return r < 0.4 ? "single_train" : "single_barrier";
  } else if (difficulty < 0.6) {
    // Medium
    if (r < 0.2) return "double_barrier";
    if (r < 0.4) return "train_barrier";
    if (r < 0.7) return "single_train";
    if (r < 0.9) return "train_corridor";
    return "overhead";
  } else {
    // Hard
    if (r < 0.1) return "triple_barrier";
    if (r < 0.4) return "train_corridor";
    if (r < 0.6) return "train_parkour";
    if (r < 0.7) return "barrier_overhead";
    if (r < 0.9) return "multi_train";
    return "zigzag";
  }
}

function createObstaclePattern(pattern, zPosition) {
  const safeLane = Math.floor(Math.random() * 3);

  switch (pattern) {
    case "single_barrier":
      const lane1 = Math.floor(Math.random() * 3);
      createBarrier(lane1, zPosition, Math.random() > 0.5 ? "small" : "large");
      break;

    case "single_train":
      const lane2 = Math.floor(Math.random() * 3);
      createTrain(lane2, zPosition);
      break;

    case "double_barrier":
      const skip = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        if (i !== skip) {
          createBarrier(i, zPosition, "small");
        }
      }
      break;

    case "triple_barrier":
      // All lanes but must be jumpable
      for (let i = 0; i < 3; i++) {
        createBarrier(i, zPosition, "small");
      }
      break;

    case "train_barrier":
      const trainLane = Math.floor(Math.random() * 3);
      createTrain(trainLane, zPosition);
      const barrierLane = (trainLane + 1 + Math.floor(Math.random() * 2)) % 3;
      if (barrierLane !== trainLane) {
        createBarrier(barrierLane, zPosition + 10, "small");
      }
      break;

    case "train_corridor":
      const centerClear = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        if (i !== centerClear) {
          createTrain(i, zPosition);
        }
      }
      break;

    case "train_parkour":
      const rampLane = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        createTrain(i, zPosition, i === rampLane); // Đảm bảo luôn có 1 làn có dốc để trèo lên
      }
      break;

    case "overhead":
      createOverhead(zPosition);
      break;

    case "barrier_overhead":
      createOverhead(zPosition);
      createBarrier(safeLane, zPosition + 15, "large");
      break;

    case "multi_train":
      const t1 = Math.floor(Math.random() * 3);
      createTrain(t1, zPosition);
      const t2 = (t1 + 1 + Math.floor(Math.random() * 2)) % 3;
      createTrain(t2, zPosition + 25);
      break;

    case "zigzag":
      for (let i = 0; i < 3; i++) {
        createBarrier(i, zPosition + i * 8, "large");
      }
      break;
  }
}

// ===== UPDATE FUNCTIONS =====
function updatePlayer(dt) {
  const time = gameTime;
  const jetpackActive = PowerUpManager.isActive("jetpack");

  // Detect train roof as the ground surface
  let targetGroundY = 0;
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    if (obs.userData.type === "train") {
      const dx = Math.abs(obs.position.x - player.position.x);
      const obsZ = obs.position.z;
      const length = obs.userData.length || 0;
      const localZ = player.position.z - obsZ;

      if (dx < 1.3) {
        if (obs.userData.hasRamp && localZ >= -8.0 && localZ < -4.0) {
          targetGroundY = Math.max(targetGroundY, ((localZ + 8.0) / 4.0) * 3.5);
        } else if (
          localZ >= (obs.userData.hasRamp ? -4.0 : -2.0) &&
          localZ <= length + 2
        ) {
          targetGroundY = Math.max(targetGroundY, 3.5);
        }
      }
    }
  }

  // If player is too low relative to the train roof, they crash instead of magically stepping on it
  let effectiveGroundY = targetGroundY;
  if (player.position.y < targetGroundY - 1.2) {
    effectiveGroundY = 0;
  }

  // Jetpack mode
  if (jetpackActive) {
    // Cố định độ cao bay lên mức 7.0 (cao hơn hẳn nóc tàu 3.5) để không đâm xuyên chướng ngại vật
    // Không phụ thuộc vào effectiveGroundY để tránh hiện tượng giật cục lên xuống
    const targetHeight = 7.0 + Math.sin(time * 3) * 0.3;
    player.position.y += (targetHeight - player.position.y) * 10 * dt; // Nội suy để bay lên mượt mà
    velocityY = 0;
    isJumping = false;
  } else {
    // Trọng lực và cơ chế Nhảy (Gravity & Jumping Physics)
    if (isJumping || player.position.y > effectiveGroundY) {
      velocityY += -60 * dt; // Trọng lực hút cực mạnh tạo cảm giác jump dứt khoát
      player.position.y += velocityY * dt;

      // Xử lý khi rơi chạm đất / chạm nóc tàu
      if (velocityY < 0 && player.position.y <= effectiveGroundY) {
        player.position.y = effectiveGroundY;
        velocityY = 0;
        isJumping = false;

        // Reset các góc gấp chân lúc nhảy
        const leftLeg = player.getObjectByName("leftLeg");
        const rightLeg = player.getObjectByName("rightLeg");
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
        }
      } else if (isJumping) {
        // Gấp chân nhẹ ở điểm cao nhất của cú nhảy
        const leftLeg = player.getObjectByName("leftLeg");
        const rightLeg = player.getObjectByName("rightLeg");
        if (leftLeg && rightLeg) {
          const peakTuck = Math.max(0, 1 - Math.abs(velocityY) / 15) * 0.5;
          leftLeg.rotation.x = peakTuck;
          rightLeg.rotation.x = peakTuck;
        }
      }
    } else if (!isSliding && !HoverboardManager.isActive()) {
      // Hoạt ảnh chạy bộ (khi trên mặt đất / mặt tàu)
      const runCycle = (time * 10) % (Math.PI * 2);
      const bobHeight = Math.sin(runCycle * 2) * 0.08; // Nảy mạnh hơn một chút
      player.position.y = effectiveGroundY + bobHeight;

      const leftLeg = player.getObjectByName("leftLeg");
      const rightLeg = player.getObjectByName("rightLeg");
      const leftShoe = player.getObjectByName("leftShoe");
      const rightShoe = player.getObjectByName("rightShoe");
      const leftArm = player.getObjectByName("leftArm");
      const rightArm = player.getObjectByName("rightArm");
      const torso = player.getObjectByName("torso");
      const head = player.getObjectByName("head");

      if (torso && head) {
        torso.rotation.y = Math.sin(runCycle) * 0.15; // Vặn mình khi chạy
        torso.rotation.z = Math.sin(runCycle * 2) * 0.05; // Lắc lư vai
        head.rotation.y = Math.sin(runCycle + Math.PI) * 0.1; // Đầu giữ cân bằng counter-balance
      }

      if (leftLeg && rightLeg) {
        // Đầu gối gập nâng cao, sải bước dứt khoát
        leftLeg.rotation.x = Math.sin(runCycle) * 0.7;
        rightLeg.rotation.x = Math.sin(runCycle + Math.PI) * 0.7;
        leftLeg.position.y = 0.35 + Math.max(0, Math.sin(runCycle)) * 0.2;
        rightLeg.position.y =
          0.35 + Math.max(0, Math.sin(runCycle + Math.PI)) * 0.2;

        leftShoe.position.z = 0.05 + Math.sin(runCycle) * 0.2;
        rightShoe.position.z = 0.05 + Math.sin(runCycle + Math.PI) * 0.2;
        leftShoe.position.y = 0.07 + Math.max(0, Math.sin(runCycle)) * 0.2;
        rightShoe.position.y =
          0.07 + Math.max(0, Math.sin(runCycle + Math.PI)) * 0.2;
      }

      if (leftArm && rightArm) {
        // Gập khuỷu tay đánh mạnh như vđv điền kinh
        leftArm.rotation.x = Math.sin(runCycle + Math.PI) * 0.6 - 0.2;
        rightArm.rotation.x = Math.sin(runCycle) * 0.6 - 0.2;
      }
    } else if (HoverboardManager.isActive() && !isJumping && !isSliding) {
      // Nhún nhẹ tự nhiên khi đang lướt ván (giữ nguyên pose ván trượt)
      player.position.y = effectiveGroundY + Math.sin(time * 10) * 0.05;
    }
  }

  // Cơ chế Lướt (Slide)
  if (isSliding && !jetpackActive && !isJumping) {
    const elapsed = time * 1000 - slideStartTime;
    const progress = elapsed / CONFIG.SLIDE_DURATION;

    if (progress < 1) {
      player.scale.y = 0.5;
      player.position.y = effectiveGroundY - 0.4;
    } else {
      isSliding = false;
      player.scale.y = 1;
      player.position.y = effectiveGroundY;
    }
  } else if (!isSliding) {
    player.scale.y = 1;
  }

  // Lane change
  if (isChangingLane) {
    const elapsed = time * 1000 - laneChangeStartTime;
    const progress = Math.min(elapsed / CONFIG.LANE_SWITCH_DURATION, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const targetX = CONFIG.LANE_POSITIONS[targetLane];
    player.position.x = laneChangeStartX + (targetX - laneChangeStartX) * eased;

    // Lean into turn
    const leanDirection = targetX > laneChangeStartX ? -1 : 1;
    player.rotation.z = leanDirection * (1 - eased) * 0.2;

    if (progress >= 1) {
      isChangingLane = false;
      currentLane = targetLane;
      player.position.x = targetX;
      player.rotation.z = 0;
    }
  }

  // Stun effect
  if (isStunned) {
    player.rotation.y = Math.sin(time * 15) * 0.15; // Wiggle effect
  } else {
    player.rotation.y = 0;
  }

  if (isStunned && time > stunEndTime) {
    isStunned = false;
  }
}

function updateCoins(dt) {
  const magnetActive = PowerUpManager.isActive("magnet");
  const magnetRange = 5;

  for (let i = coinObjects.length - 1; i >= 0; i--) {
    const coin = coinObjects[i];

    // Rotate coin
    coin.rotation.y += dt * 3;

    // Bob up and down
    coin.position.y += Math.sin(gameTime * 5 + coin.position.z) * dt * 0.5;

    // Move toward player (world scrolling)
    coin.position.z -= currentSpeed * dt;

    // Magnet effect - attract coins
    if (magnetActive && !coin.userData.collected) {
      const dx = player.position.x - coin.position.x;
      const dy = player.position.y + 1 - coin.position.y;
      const dz = player.position.z - coin.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < magnetRange && dist > 0.1) {
        const attractSpeed = 10 * dt;
        coin.position.x += (dx / dist) * attractSpeed;
        coin.position.y += (dy / dist) * attractSpeed;
        coin.position.z += (dz / dist) * attractSpeed;
        SoundManager.play("magnetCollect");
      }
    }

    // Check collection
    if (!coin.userData.collected) {
      const dx = player.position.x - coin.position.x;
      const dy = player.position.y + 1 - coin.position.y;
      const dz = player.position.z - coin.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const collectionRange = magnetActive ? 2.5 : 1.5;
      if (dist < collectionRange) {
        collectCoin(coin);
      }
    }

    // Remove if behind player
    if (coin.position.z < -5) {
      scene.remove(coin);
      coinObjects.splice(i, 1);
    }
  }
}

function collectCoin(coin) {
  coin.userData.collected = true;
  coins++;
  totalCoins++;
  score += 10 * multiplier * scoreMultiplierKeys; // Keys multiply score!

  SoundManager.play("coin");

  // Update missions
  MissionManager.updateProgress("coins", 1);

  // Collection animation
  const startY = coin.position.y;
  const animateCoin = () => {
    coin.position.y += 0.3;
    coin.scale.multiplyScalar(0.9);
    if (coin.scale.x > 0.1) {
      requestAnimationFrame(animateCoin);
    } else {
      scene.remove(coin);
      const idx = coinObjects.indexOf(coin);
      if (idx > -1) coinObjects.splice(idx, 1);
    }
  };
  animateCoin();

  updateUI();
  updateTotalCoins();
}

function updateTotalCoins() {
  localStorage.setItem("totalCoins", totalCoins);
  document.getElementById("total-coins").textContent = totalCoins;
  document.getElementById("store-coins").textContent = totalCoins;
}

function updateObstacles(dt) {
  const jetpackActive = PowerUpManager.isActive("jetpack");

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];

    // Move toward player
    obstacle.position.z -= currentSpeed * dt;

    // Check collision (skip if jetpack is active)
    if (!obstacle.userData.hit && !jetpackActive) {
      const hitResult = checkCollision(obstacle);
      if (hitResult === true) {
        SoundManager.play("crash");
        gameOver();
        return;
      } else if (hitResult === "side_hit") {
        SoundManager.play("crash");
        handleSideHit(obstacle);
      }
    }

    // Remove if behind player
    const length = obstacle.userData.length || 0;
    if (obstacle.position.z + length < -20) {
      scene.remove(obstacle);
      obstacles.splice(i, 1);
    }
  }
}

function handleSideHit(obstacle) {
  obstacle.userData.hit = true;

  // Revert lane change
  if (isChangingLane) {
    targetLane = currentLane;
    laneChangeStartTime = gameTime * 1000;
    laneChangeStartX = player.position.x;
  }

  // Stun player
  isStunned = true;
  stunEndTime = gameTime + 3;
  currentSpeed = CONFIG.BASE_SPEED * 0.4;

  // Show Cop
  if (!copChaser) {
    createCopChaser();
    copChaser.position.z = player.position.z - 20; // start slightly behind and catch up
  }
  copVisibleTimer = gameTime + 5;
}

function checkCollision(obstacle) {
  const playerX = player.position.x;
  const playerY = player.position.y + (isSliding ? 0.3 : 0.9);
  const playerZ = player.position.z;

  const type = obstacle.userData.type;
  const obsX = obstacle.position.x;
  const obsZ = obstacle.position.z;
  const length = obstacle.userData.length || 0;

  // Calculate precise z-distance to the bounding box of the obstacle
  let dz = 0;
  let effectiveStart = obsZ;
  if (type === "train") {
    effectiveStart = obstacle.userData.hasRamp ? obsZ - 8.0 : obsZ - 4.0;
  }

  if (playerZ < effectiveStart) {
    dz = effectiveStart - playerZ;
  } else if (playerZ > obsZ + length) {
    dz = playerZ - (obsZ + length);
  }

  if (dz > 5) return false;

  const dx = Math.abs(obsX - playerX);

  if (type === "train") {
    const trainLength = length;
    const localZ = playerZ - obsZ;

    if (dx < 1.3) {
      if (obstacle.userData.hasRamp && localZ >= -8.0 && localZ < -4.0) {
        const rampHeight = ((localZ + 8.0) / 4.0) * 3.5;
        if (playerY < rampHeight - 0.3) {
          return "side_hit";
        }
      } else if (
        localZ >= (obstacle.userData.hasRamp ? -4.0 : -2.0) &&
        localZ <= trainLength + 2
      ) {
        // Nóc tàu ở y=3.5. Nếu đang trượt trên nóc tàu, playerY sẽ bị hạ xuống thành 3.4
        // Hạ collisionHeight xuống 3.0 khi đang trượt để tránh bị tính là đâm vào tàu
        const collisionHeight = isSliding ? 3.0 : 3.5;
        if (playerY < collisionHeight) {
          if (localZ < 1.5 && !obstacle.userData.hasRamp) {
            return true;
          } else {
            return "side_hit";
          }
        }
      }
    }
  } else if (type === "barrier") {
    const barrierType = obstacle.userData.barrierType;
    const barrierHeight = barrierType === "small" ? 0.8 : 1.2;

    if (dx < 0.8 && dz < 1) {
      // Can jump over
      if (playerY < barrierHeight) {
        return true;
      }
    }
  } else if (type === "overhead") {
    // Overhead obstacle - spans all lanes
    if (dz < 0.5) {
      // Must slide under (clearance at y=1.4) or jump over with sneakers (top at y=3.0)
      const slideHeight = isSliding ? 0.6 : 1.8;
      if (playerY + slideHeight > 1.2 && player.position.y < 3.0) {
        return true;
      }
    }
  }

  return false;
}

function updateTrack(dt) {
  // Move track segments
  for (let i = trackSegments.length - 1; i >= 0; i--) {
    const segment = trackSegments[i];
    segment.mesh.position.z -= currentSpeed * dt;

    // Recycle segments
    if (segment.mesh.position.z < -CONFIG.SEGMENT_LENGTH) {
      const furthestZ = Math.max(
        ...trackSegments.map((s) => s.mesh.position.z),
      );
      segment.mesh.position.z = furthestZ + CONFIG.SEGMENT_LENGTH;
    }
  }

  // Move buildings (parallax)
  buildings.forEach((building) => {
    building.mesh.position.z -= currentSpeed * dt * 0.3;

    if (building.mesh.position.z < -100) {
      building.mesh.position.z += 450;
    }
  });

  // Move environment props (1.0 speed)
  environmentProps.forEach((prop) => {
    prop.mesh.position.z -= currentSpeed * dt;
    if (prop.mesh.position.z < -100) {
      prop.mesh.position.z += 1000; // Vòng lặp dài 1000m (5 objects * 200m spacing)
    }
  });
}

function updateSpeed(dt) {
  let accel = CONFIG.ACCELERATION;

  if (isStunned) {
    accel = 0; // Không tăng tốc khi đang bị choáng
  } else if (currentSpeed < CONFIG.BASE_SPEED) {
    accel = 10.0; // Gia tốc cực lớn để phục hồi tốc độ nhanh sau khi hết choáng
  }

  if (currentSpeed < CONFIG.MAX_SPEED) {
    currentSpeed += accel * dt;
    currentSpeed = Math.min(currentSpeed, CONFIG.MAX_SPEED);
  }

  // Update multiplier based on speed
  multiplier = Math.floor(currentSpeed / 10);
  multiplier = Math.max(1, Math.min(multiplier, 5));
}

function updateCamera() {
  // Smooth camera follow
  const targetX = player.position.x * 0.3;
  const targetY = CONFIG.CAMERA_HEIGHT + player.position.y * 0.3;

  camera.position.x += (targetX - camera.position.x) * 0.1;
  camera.position.y += (targetY - camera.position.y) * 0.1;

  camera.lookAt(
    player.position.x * 0.5,
    2 + player.position.y * 0.5,
    CONFIG.CAMERA_LOOK_AHEAD,
  );
}

function updateUI() {
  document.getElementById("score").textContent =
    Math.floor(score).toLocaleString();
  document.getElementById("coins").textContent = coins;
  document.getElementById("multiplier").textContent = `x${multiplier}`;
}

// ===== INPUT HANDLING =====
function setupEventListeners() {
  // Keyboard
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  // Touch
  document.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  document.addEventListener("touchend", handleTouchEnd, {
    passive: false,
  });
  document.addEventListener("touchmove", (e) => e.preventDefault(), {
    passive: false,
  });

  // UI Buttons
  document.getElementById("play-btn").addEventListener("click", startGame);
  document
    .getElementById("store-btn")
    .addEventListener("click", () => StoreManager.open());
  document
    .getElementById("close-store-btn")
    .addEventListener("click", () => StoreManager.close());
  document.getElementById("pause-btn").addEventListener("click", togglePause);
  document.getElementById("resume-btn").addEventListener("click", togglePause);
  document.getElementById("retry-btn").addEventListener("click", startGame);
  document.getElementById("menu-btn").addEventListener("click", showMainMenu);

  // Resize
  window.addEventListener("resize", handleResize);
}

function handleKeyDown(e) {
  if (gameState !== "PLAYING") {
    if (e.code === "Space" || e.code === "Enter") {
      if (gameState === "MENU" || gameState === "GAME_OVER") {
        startGame();
      } else if (gameState === "PAUSED") {
        togglePause();
      }
    }
    return;
  }

  if (keysPressed.has(e.code)) return;
  keysPressed.add(e.code);

  switch (e.code) {
    case "ArrowLeft":
    case "KeyA":
      changeLane(-1);
      break;
    case "ArrowRight":
    case "KeyD":
      changeLane(1);
      break;
    case "ArrowUp":
    case "KeyW":
    case "Space":
      jump();
      break;
    case "ArrowDown":
    case "KeyS":
      slide();
      break;
    case "Escape":
    case "KeyP":
      togglePause();
      break;
  }
}

function handleKeyUp(e) {
  keysPressed.delete(e.code);
}

function handleTouchStart(e) {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
}

function handleTouchEnd(e) {
  e.preventDefault();

  if (gameState === "MENU" || gameState === "GAME_OVER") {
    return;
  }

  if (gameState !== "PLAYING") return;

  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const elapsed = Date.now() - touchStartTime;

  const minSwipe = 30;
  const maxTime = 300;

  if (elapsed > maxTime) return;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > minSwipe || absDy > minSwipe) {
    if (absDx > absDy) {
      // Horizontal swipe
      changeLane(dx > 0 ? 1 : -1);
    } else {
      // Vertical swipe
      if (dy < 0) {
        jump();
      } else {
        slide();
      }
    }
  }
}

function changeLane(direction) {
  // Cho phép chuyển tiếp sang làn khác ngay cả khi hoạt ảnh chưa kết thúc
  const baseLane = isChangingLane ? targetLane : currentLane;
  const newLane = baseLane + direction;

  if (newLane < 0 || newLane > 2) return;

  targetLane = newLane;
  isChangingLane = true;
  laneChangeStartTime = gameTime * 1000;
  laneChangeStartX = player.position.x;
}

function jump() {
  if (isJumping && !isSliding) return; // Chỉ chặn nếu đang bay bình thường, cho phép nhảy thoát slide

  isSliding = false;
  player.scale.y = 1; // Hủy form trượt nếu đang trượt
  isJumping = true;
  const jumpHeight = PowerUpManager.isActive("sneakers")
    ? 5.0
    : CONFIG.JUMP_HEIGHT;
  // v0 = căn bậc 2 của (2 * độ_lớn_trọng_lực * độ_cao_mong_muốn)
  velocityY = Math.sqrt(2 * 60 * jumpHeight);
  SoundManager.play("jump");

  // Track jumps for missions
  MissionManager.updateProgress("jumps", 1);

  // Perform trick for combo system
  if (currentSpeed > CONFIG.BASE_SPEED * 1.5) {
    performTrick("Sick Jump");
  }
}

function slide() {
  if (isSliding) return;

  // Cơ chế Dive - Rơi tự do nhanh nếu vuốt xuống lúc đang nhảy ở trên trời (giống Subway Surfers)
  if (isJumping) {
    velocityY = -40; // Gán gia tốc lao mạnh xuống
  }

  isSliding = true;
  slideStartTime = gameTime * 1000;
  SoundManager.play("slide");

  // Perform trick for combo system
  if (currentSpeed > CONFIG.BASE_SPEED * 1.5) {
    performTrick("Smooth Slide");
  }
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== GAME STATE FUNCTIONS =====
function startGame() {
  // Reset state
  score = 0;
  coins = 0;
  distance = 0;
  currentSpeed = CONFIG.BASE_SPEED;
  multiplier = 1;
  currentLane = 1;
  targetLane = 1;
  isJumping = false;
  isSliding = false;
  isChangingLane = false;
  playerY = 0;
  velocityY = 0;
  lastObstacleZ = 0;
  lastCoinZ = 0;
  lastPowerUpZ = 0;
  lastKeyZ = 0;
  lastMysteryBoxZ = 0;

  // Reset NEW features
  collectedKeys = 0;
  scoreMultiplierKeys = 1;
  comboCount = 0;
  lastTrickTime = 0;
  isStunned = false;
  stunEndTime = 0;
  copVisibleTimer = 0;

  // Clear obstacles, coins, and power-ups
  obstacles.forEach((o) => scene.remove(o));
  obstacles = [];
  coinObjects.forEach((c) => scene.remove(c));
  coinObjects = [];
  PowerUpManager.powerUpObjects.forEach((p) => scene.remove(p));
  PowerUpManager.powerUpObjects = [];
  PowerUpManager.clear();

  // Clear new collectibles
  keyObjects.forEach((k) => scene.remove(k));
  keyObjects = [];
  mysteryBoxes.forEach((b) => scene.remove(b));
  mysteryBoxes = [];

  // Clear jetpack visual and particles
  jetpackParticles.forEach((p) => scene.remove(p));
  jetpackParticles = [];
  removeJetpackFromPlayer();

  // Deactivate hoverboard if active
  HoverboardManager.deactivate();

  // Remove cop - he only appears when you crash!
  if (copChaser) {
    scene.remove(copChaser);
    copChaser = null;
  }

  // Check for starting power-ups from inventory
  if (PowerUpManager.inventory.magnetStart > 0) {
    if (
      confirm(
        "Use Magnet Start? (You have " +
          PowerUpManager.inventory.magnetStart +
          ")",
      )
    ) {
      PowerUpManager.useFromInventory("magnet");
      PowerUpManager.activate("magnet", 15);
    }
  }
  if (PowerUpManager.inventory.jetpackStart > 0) {
    if (
      confirm(
        "Use Jetpack Start? (You have " +
          PowerUpManager.inventory.jetpackStart +
          ")",
      )
    ) {
      PowerUpManager.useFromInventory("jetpack");
      PowerUpManager.activate("jetpack", 12);
      spawnInitialJetpackCoins();
    }
  }
  if (PowerUpManager.inventory.sneakersStart > 0) {
    if (
      confirm(
        "Use Sneakers Start? (You have " +
          PowerUpManager.inventory.sneakersStart +
          ")",
      )
    ) {
      PowerUpManager.useFromInventory("sneakers");
      PowerUpManager.activate("sneakers", 15);
    }
  }

  // Reset player
  player.position.set(CONFIG.LANE_POSITIONS[1], 0, 0);
  player.rotation.set(0, 0, 0);
  player.scale.set(1, 1, 1);

  // UI
  document.getElementById("main-menu").classList.add("hidden");
  document.getElementById("game-over").style.display = "none";
  document.getElementById("store-screen").style.display = "none";
  document.getElementById("hud").classList.remove("hidden");
  document.getElementById("powerups-hud").classList.remove("hidden");
  document.getElementById("tutorial").style.display = "block";
  setTimeout(() => {
    document.getElementById("tutorial").style.display = "none";
  }, 3000);

  updateUI();
  updateTotalCoins();

  gameState = "PLAYING";
}

function togglePause() {
  if (gameState === "PLAYING") {
    gameState = "PAUSED";
    document.getElementById("pause-screen").style.display = "flex";
  } else if (gameState === "PAUSED") {
    gameState = "PLAYING";
    document.getElementById("pause-screen").style.display = "none";
  }
}

function gameOver() {
  gameState = "GAME_OVER";

  // COP APPEARS WHEN YOU CRASH!
  if (!copChaser) {
    createCopChaser();
    // Make cop visible and close to player
    if (copChaser) {
      copChaser.position.z = player.position.z - 3;
    }
  }

  // Check high score
  const isNewRecord = score > highScore;
  if (isNewRecord) {
    highScore = Math.floor(score);
    localStorage.setItem("subwaySurfersHighScore", highScore);
  }

  // Update game over screen
  document.getElementById("final-score").textContent =
    Math.floor(score).toLocaleString();
  document.getElementById("final-coins").textContent = coins;
  document.getElementById("final-distance").textContent =
    Math.floor(distance) + "m";
  document.getElementById("best-score").textContent =
    highScore.toLocaleString();
  document.getElementById("new-record").style.display = isNewRecord
    ? "block"
    : "none";

  // Show game over
  document.getElementById("hud").classList.add("hidden");
  document.getElementById("powerups-hud").classList.add("hidden");
  document.getElementById("game-over").style.display = "flex";
}

function showMainMenu() {
  gameState = "MENU";
  document.getElementById("game-over").style.display = "none";
  document.getElementById("main-menu").classList.remove("hidden");
  updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
  document.getElementById("high-score-display").textContent =
    `HIGH SCORE: ${highScore.toLocaleString()}`;
}

// ===== MAIN GAME LOOP =====
function gameLoop(currentTime) {
  deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  if (gameState === "PLAYING") {
    gameTime += deltaTime;
    distance += currentSpeed * deltaTime;
    score += currentSpeed * deltaTime * multiplier * scoreMultiplierKeys * 0.1;

    // Update mission progress for distance
    MissionManager.updateProgress("distance", currentSpeed * deltaTime);
    MissionManager.updateProgress(
      "score",
      currentSpeed * deltaTime * multiplier * scoreMultiplierKeys * 0.1,
    );

    updatePlayer(deltaTime);
    updateCopChaser(deltaTime); // COP CHASING!
    updateObstacles(deltaTime);
    updateCoins(deltaTime);
    updatePowerUpObjects(deltaTime);
    PowerUpManager.update();
    HoverboardManager.update(); // Update hoverboard timer
    updateKeys(deltaTime); // Update keys
    updateMysteryBoxes(deltaTime); // Update mystery boxes
    updateTrack(deltaTime);
    updateSpeed(deltaTime);
    updateCamera();
    updateClouds(deltaTime); // Dynamic clouds
    updateJetpackParticles(deltaTime); // Jetpack particle effect
    updateSpeedLines(deltaTime); // Speed Lines effect
    spawnObstacles();
    updateUI();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}

// ===== START =====
window.onload = init;
