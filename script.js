const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

// --- AUDIO SYSTEM (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

const SoundManager = {
    playTone: (freq, type, duration) => {
        if (audioCtx.state === 'suspended') audioCtx.resume()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + duration)
    },
    playJump: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(300, audioCtx.currentTime)
        osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.2) // Rising pitch
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.2)
    },
    playAttack: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(500, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1) // Falling pitch (Whoosh)
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.1)
    },
    playHit: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'square' // Crunchier sound
        osc.frequency.setValueAtTime(150, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.1)
    }
}

const gravity = 0.7

class Sprite {
    constructor({ position, imageSrc, scale = 1, framesMax = 1, offset = { x: 0, y: 0 } }) {
        this.position = position
        this.width = 50
        this.height = 150
        this.image = new Image()
        this.image.src = imageSrc
        this.scale = scale
        this.framesMax = framesMax
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 5
        this.offset = offset
    }

    draw() {
        c.drawImage(
            this.image,
            this.framesCurrent * (this.image.width / this.framesMax),
            0,
            this.image.width / this.framesMax,
            this.image.height,
            this.position.x - this.offset.x,
            this.position.y - this.offset.y,
            (this.image.width / this.framesMax) * this.scale,
            this.image.height * this.scale
        )
    }

    animateFrames() {
        this.framesElapsed++

        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++
            } else {
                this.framesCurrent = 0
            }
        }
    }

    update() {
        this.draw()
        this.animateFrames()
    }
}

class Fighter extends Sprite {
    constructor({
        position,
        velocity,
        color = 'red',
        imageSrc,
        scale = 1,
        framesMax = 1,
        offset = { x: 0, y: 0 },
        sprites,
        attackBox = { offset: {}, width: undefined, height: undefined },
        stats = {}
    }) {
        super({
            position,
            imageSrc,
            scale,
            framesMax,
            offset
        })

        this.velocity = velocity
        this.width = 50
        this.height = 150
        this.lastKey
        this.attackBox = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            offset: attackBox.offset,
            width: attackBox.width,
            height: attackBox.height
        }
        this.color = color
        this.isAttacking
        this.health = stats.maxHealth || 100
        this.maxHealth = this.health
        this.sprites = sprites
        this.dead = false
        this.stats = stats // AI Stats: speed, aggressive, damageMult

        for (const sprite in this.sprites) {
            sprites[sprite].image = new Image()
            sprites[sprite].image.src = sprites[sprite].imageSrc
        }
    }

    draw() {
        c.save()
        
        // Apply Color Filter for Story Mode Bosses
        if (this.stats.color) {
            c.filter = this.stats.color
        }

        let isFlipped = false
        if (this.lastKey === 'a' || this.lastKey === 'ArrowLeft') {
            isFlipped = true
        } else if (this.lastKey === 'd' || this.lastKey === 'ArrowRight') {
            isFlipped = false
        } else {
             // Defaults if no key pressed yet
             if (this.color === 'blue' && !this.lastKey) isFlipped = true // Kenji default left
        }

        // Fix for Kenji: His sprites (or my logic) are inverted relative to standard Right-facing.
        // We invert the flip status for him.
        if (this.color === 'blue') {
             isFlipped = !isFlipped
        }

        if (isFlipped) {
            c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2)
            c.scale(-1, 1)
            c.translate(-(this.position.x + this.width / 2), -(this.position.y + this.height / 2))
        }

        c.drawImage(
            this.image,
            this.framesCurrent * (this.image.width / this.framesMax),
            0,
            this.image.width / this.framesMax,
            this.image.height,
            this.position.x - this.offset.x,
            this.position.y - this.offset.y,
            (this.image.width / this.framesMax) * this.scale,
            this.image.height * this.scale
        )
        
        c.restore()
    }

    animateFrames() {
        this.framesElapsed++

        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++
            } else {
                this.framesCurrent = 0
            }
        }
    }

    update() {
        this.draw()
        if (!this.dead) this.animateFrames()

        // attack box
        // Check direction
        let isFacingRight = true
        if (this.lastKey === 'a' || this.lastKey === 'ArrowLeft') {
            isFacingRight = false
        } else if (this.lastKey === 'd' || this.lastKey === 'ArrowRight') {
            isFacingRight = true
        } else {
             // Defaults if no key pressed yet
             if (this.color === 'blue') isFacingRight = false
        }

        this.attackBox.position.y = this.position.y + this.attackBox.offset.y
        
        if (isFacingRight) {
             this.attackBox.position.x = this.position.x + this.attackBox.offset.x
        } else {
             // Mirror the attack box to the left
             // position.x is left side of body. 
             // We want box to start at: position.x - attackBox.width + (width - offset.x check?)
             // Actually, let's try strict mirroring relative to body width:
             // Right: starts at pos.x + offset.x
             // Left: ends at pos.x + width - offset.x -> starts at pos.x + width - offset.x - attackBox.width
             this.attackBox.position.x = this.position.x + this.width - this.attackBox.width - this.attackBox.offset.x
        }

        // draw attack box (debug)
        // c.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height)

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        // gravity
        if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
            this.velocity.y = 0
            this.position.y = 330 // Stick to ground (ground level adjustment)
        } else this.velocity.y += gravity
        
        // Fix: Reset isAttacking if animation finished or changed
        // This prevents the "spam" state where isAttacking stays true if the frame check in animate() is missed.
        if (this.isAttacking && this.image === this.sprites.attack1.image && this.framesCurrent === this.sprites.attack1.framesMax - 1) {
             this.isAttacking = false
        }
    }

    attack() {
        SoundManager.playAttack()
        if (this.dead) return // Can't attack if dead
        this.switchSprite('attack1')
        this.isAttacking = true
        // setTimeout(() => {
        //     this.isAttacking = false
        // }, 100);
    }

    takeHit(damage = 20) {
        SoundManager.playHit()
        this.health -= damage
        if (this.health <= 0) {
            this.switchSprite('death')
        } else {
            this.switchSprite('takeHit')
        }
    }

    switchSprite(sprite) {
        if (this.image === this.sprites.death.image) {
            if (this.framesCurrent === this.sprites.death.framesMax - 1) this.dead = true
            return
        }

        // overriding all other animations with the attack animation
        if (
            this.image === this.sprites.attack1.image &&
            this.framesCurrent < this.sprites.attack1.framesMax - 1
        )
            return

        // override when fighter gets hit
        if (
            this.image === this.sprites.takeHit.image &&
            this.framesCurrent < this.sprites.takeHit.framesMax - 1
        )
            return

        switch (sprite) {
            case 'idle':
                if (this.image !== this.sprites.idle.image) {
                    this.image = this.sprites.idle.image
                    this.framesMax = this.sprites.idle.framesMax
                    this.framesCurrent = 0
                }
                break
            case 'run':
                if (this.image !== this.sprites.run.image) {
                    this.image = this.sprites.run.image
                    this.framesMax = this.sprites.run.framesMax
                    this.framesCurrent = 0
                }
                break
            case 'jump':
                if (this.image !== this.sprites.jump.image) {
                    this.image = this.sprites.jump.image
                    this.framesMax = this.sprites.jump.framesMax
                    this.framesCurrent = 0
                }
                break
            case 'fall':
                if (this.image !== this.sprites.fall.image) {
                    this.image = this.sprites.fall.image
                    this.framesMax = this.sprites.fall.framesMax
                    this.framesCurrent = 0
                }
                break
            case 'attack1':
                if (this.image !== this.sprites.attack1.image) {
                    this.image = this.sprites.attack1.image
                    this.framesMax = this.sprites.attack1.framesMax
                    this.framesCurrent = 0
                }
                break
            case 'takeHit':
                if (this.image !== this.sprites.takeHit.image) {
                    this.image = this.sprites.takeHit.image
                    this.framesMax = this.sprites.takeHit.framesMax
                    this.framesCurrent = 0
                }
                break
            case 'death':
                if (this.image !== this.sprites.death.image) {
                    this.image = this.sprites.death.image
                    this.framesMax = this.sprites.death.framesMax
                    this.framesCurrent = 0
                }
                break
        }
    }
}

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >=
        rectangle2.position.x &&
        rectangle1.attackBox.position.x <=
        rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >=
        rectangle2.position.y &&
        rectangle1.attackBox.position.y <=
        rectangle2.position.y + rectangle2.height
    )
}

function winner({ player, enemy, wacha }) {
    clearTimeout(wacha)
    gameRunning = false
    document.querySelector('#out').style.display = 'flex'

    if (player.health === enemy.health) {
        document.querySelector('#out').innerHTML = 'Draw<br>Press Enter to Restart'
    } else if (player.health > enemy.health) {
        if (gameMode === 'Story') {
            // Check if Final Stage
            if (currentStage === campaignStages.length - 1) {
                // VICTORY SCREEN IMMEDIATE
                document.querySelector('#screen-win').style.display = 'flex'
                document.querySelector('#screen-game').style.display = 'none'
                document.querySelector('#out').style.display = 'none'
            } else {
                // Standard Stage Clear
                document.querySelector('#screen-stage-clear').style.display = 'flex'
                document.querySelector('#screen-game').style.display = 'none'
                document.querySelector('#out').style.display = 'none'
                document.querySelector('#clear-msg').innerText = "You defeated " + campaignStages[currentStage].bossName + "."
            }
        } else {
            document.querySelector('#out').innerHTML = 'Player 1 Wins<br>Press Enter to Restart'
        }
    } else if (player.health < enemy.health) {
        if (gameMode === 'Story') {
            document.querySelector('#out').innerHTML = 'DEFEATED<br>Press Enter to Retry'
        } else {
            document.querySelector('#out').innerHTML = 'Player 2 Wins<br>Press Enter to Restart'
        }
    }
}

window.nextStageTransition = function() {
    document.querySelector('#screen-stage-clear').style.display = 'none'
    currentStage++
    
    if (currentStage >= campaignStages.length) {
        document.querySelector('#screen-win').style.display = 'flex'
        document.querySelector('#screen-game').style.display = 'none'
    } else {
        showStory()
    }
}

window.returnToMenu = function() {
    document.querySelector('#screen-win').style.display = 'none'
    document.querySelector('#screen-menu').style.display = 'flex'
    currentStage = 0
    gameMode = 'PvE'
}

let player
let enemy
let background
let shop
let hesabu = 60
let wacha
let gameMode = 'PvE' // 'PvE' or 'PvP' or 'Story'
let currentStage = 0
let gameRunning = false

const campaignStages = [
    {
        stageName: "STAGE 1",
        bossName: "IRON TARO",
        dialogue: [
            { speaker: "SAMURAI MACK", text: "Step aside, Taro. I only want Kenji." },
            { speaker: "IRON TARO", text: "The Grandmaster is not to be disturbed by ghosts." },
            { speaker: "SAMURAI MACK", text: "Then you will fall first." }
        ],
        stats: { maxHealth: 150, damageMult: 1.2, speed: 2, aggressive: 0.02, color: 'hue-rotate(320deg) sepia(0.5)' } // Tank: Rust Color
    },
    {
        stageName: "STAGE 2",
        bossName: "SWIFT JIRO",
        dialogue: [
            { speaker: "SWIFT JIRO", text: "You are slow, old man. Can you even see me?" },
            { speaker: "SAMURAI MACK", text: "I do not need eyes to catch a fly." }
        ],
        stats: { maxHealth: 80, damageMult: 0.9, speed: 8, aggressive: 0.08, color: 'hue-rotate(90deg)' } // Ninja: Green
    },
    {
        stageName: "STAGE 3",
        bossName: "VENOM SABURO",
        dialogue: [
            { speaker: "VENOM SABURO", text: "My blade drips with the venom of a thousand snakes." },
            { speaker: "SAMURAI MACK", text: "A coward's weapon for a coward's heart." }
        ],
        stats: { maxHealth: 100, damageMult: 1.1, speed: 5, aggressive: 0.04, color: 'hue-rotate(270deg)' } // Purple
    },
    {
        stageName: "STAGE 4",
        bossName: "BLIND SHIRO",
        dialogue: [
            { speaker: "BLIND SHIRO", text: "I sense your anger, Samurai. It blinds you." },
            { speaker: "SAMURAI MACK", text: "My anger is the only thing keeping me alive." }
        ],
        stats: { maxHealth: 130, damageMult: 1.5, speed: 3, aggressive: 0.01, color: 'grayscale(100%)' } // Grey
    },
    {
        stageName: "FINAL STAGE",
        bossName: "GRANDMASTER KENJI",
        dialogue: [
            { speaker: "GRANDMASTER KENJI", text: "So, the dog returns to its master." },
            { speaker: "SAMURAI MACK", text: "You took everything from me." },
            { speaker: "GRANDMASTER KENJI", text: "I only took what was weak. Come, show me your strength!" }
        ],
        stats: { maxHealth: 200, damageMult: 1.3, speed: 7, aggressive: 0.1, color: 'invert(1)' } // Boss: Inverted
    }
]

let currentDialogueIndex = 0
let typingInterval
let isTyping = false

window.advanceDialogue = function() {
    const stage = campaignStages[currentStage]
    const dialogueList = stage.dialogue
    
    // If typing, finish immediately
    if (isTyping) {
        clearInterval(typingInterval)
        isTyping = false
        const currentLine = dialogueList[currentDialogueIndex]
        document.querySelector('#story-desc').innerHTML = currentLine.text
        return
    }

    // Move to next line
    currentDialogueIndex++
    
    if (currentDialogueIndex < dialogueList.length) {
        playDialogue(dialogueList[currentDialogueIndex])
    } else {
        // End of dialogue
        document.querySelector('#story-btn').style.display = 'block'
        document.querySelector('#story-hint').style.display = 'none'
    }
}

function playDialogue(line) {
    document.querySelector('#story-speaker').innerText = line.speaker
    document.querySelector('#story-desc').innerHTML = ""
    document.querySelector('#story-hint').style.display = 'block'
    
    // Set speaker color (Mack = Blue, Enemy = Red)
    if (line.speaker === 'SAMURAI MACK') {
        document.querySelector('#story-speaker').style.color = '#818cf8'
    } else {
        document.querySelector('#story-speaker').style.color = '#ef4444'
    }

    let i = 0
    isTyping = true
    typingInterval = setInterval(() => {
        document.querySelector('#story-desc').innerHTML += line.text.charAt(i)
        i++
        if (i >= line.text.length) {
            clearInterval(typingInterval)
            isTyping = false
        }
    }, 30) // Speed of typing
}

window.startStoryMode = function() {
    currentStage = 0
    document.querySelector('#screen-menu').style.display = 'none'
    showStory()
}

function showStory() {
    const stage = campaignStages[currentStage]
    document.querySelector('#screen-story').style.display = 'flex'
    document.querySelector('#story-stage').innerText = stage.stageName
    document.querySelector('#story-boss').innerText = stage.bossName
    
    // Initialize Dialogue
    currentDialogueIndex = 0
    document.querySelector('#story-btn').style.display = 'none'
    playDialogue(stage.dialogue[0])
    
    // Reset Game Screens
    document.querySelector('#screen-game').style.display = 'none'
    document.querySelector('#out').style.display = 'none'
}

window.startNextFight = function(event) {
    if (event) event.stopPropagation()
    document.querySelector('#screen-story').style.display = 'none'
    startGame('Story')
}

window.startGame = function(mode) {
    document.querySelector('#screen-menu').style.display = 'none'
    document.querySelector('#screen-game').style.display = 'flex' // Changed to flex to match new CSS
    document.querySelector('#out').style.display = 'none'
    gameMode = mode
    
    // Reset inputs
    keys.a.pressed = false
    keys.d.pressed = false
    keys.ArrowRight.pressed = false
    keys.ArrowLeft.pressed = false
    
    init()
    decreaseTimer()
    gameRunning = true
}

function init() {
    background = new Sprite({
        position: {
            x: 0,
            y: 0
        },
        imageSrc: './img/background.png'
    })

    shop = new Sprite({
        position: {
            x: 600,
            y: 128
        },
        imageSrc: './img/shop.png',
        scale: 2.75,
        framesMax: 6
    })

    player = new Fighter({
        position: {
            x: 0,
            y: 0
        },
        velocity: {
            x: 0,
            y: 0
        },
        offset: {
            x: 0,
            y: 0
        },
        imageSrc: './img/samuraiMack/Idle.png',
        framesMax: 8,
        scale: 2.5,
        offset: {
            x: 215,
            y: 157
        },
        sprites: {
            idle: {
                imageSrc: './img/samuraiMack/Idle.png',
                framesMax: 8
            },
            run: {
                imageSrc: './img/samuraiMack/Run.png',
                framesMax: 8
            },
            jump: {
                imageSrc: './img/samuraiMack/Jump.png',
                framesMax: 2
            },
            fall: {
                imageSrc: './img/samuraiMack/Fall.png',
                framesMax: 2
            },
            attack1: {
                imageSrc: './img/samuraiMack/Attack1.png',
                framesMax: 6
            },
            takeHit: {
                imageSrc: './img/samuraiMack/TakeHit.png',
                framesMax: 4
            },
            death: {
                imageSrc: './img/samuraiMack/Death.png',
                framesMax: 6
            }
        },
        attackBox: {
            offset: {
                x: 100,
                y: 50
            },
            width: 160,
            height: 50
        }
    })

    let enemyStats = {}
    if (gameMode === 'Story') {
        enemyStats = campaignStages[currentStage].stats
        document.querySelector('#p2Name').innerText = campaignStages[currentStage].bossName
    } else {
        document.querySelector('#p2Name').innerText = 'KENJI'
    }

    enemy = new Fighter({
        position: {
            x: 400,
            y: 100
        },
        velocity: {
            x: 0,
            y: 0
        },
        color: 'blue',
        offset: {
            x: -50,
            y: 0
        },
        imageSrc: './img/kenji/Idle.png',
        framesMax: 4,
        scale: 2.5,
        offset: {
            x: 215,
            y: 167
        },
        sprites: {
            idle: {
                imageSrc: './img/kenji/Idle.png',
                framesMax: 4
            },
            run: {
                imageSrc: './img/kenji/Run.png',
                framesMax: 8
            },
            jump: {
                imageSrc: './img/kenji/Jump.png',
                framesMax: 2
            },
            fall: {
                imageSrc: './img/kenji/Fall.png',
                framesMax: 2
            },
            attack1: {
                imageSrc: './img/kenji/Attack1.png',
                framesMax: 4
            },
            takeHit: {
                imageSrc: './img/kenji/TakeHit.png',
                framesMax: 3
            },
            death: {
                imageSrc: './img/kenji/Death.png',
                framesMax: 7
            }
        },
        attackBox: {
            offset: {
                x: -170,
                y: 50
            },
            width: 170,
            height: 50
        },
        stats: enemyStats
    })

    hesabu = 60
    document.querySelector('#hesabu').innerHTML = hesabu
    document.querySelector('#playerHealth').style.width = '100%'
    document.querySelector('#nemesis').style.width = '100%'
    // document.querySelector('#out').style.display = 'none' // Don't hide here, startGame handles it

    clearTimeout(wacha)
    // decreaseTimer() // Don't auto start timer
}

function decreaseTimer() {
    if (hesabu > 0) {
        wacha = setTimeout(decreaseTimer, 1000)
        hesabu--
        document.querySelector('#hesabu').innerHTML = hesabu
    }

    if (hesabu === 0) {
        winner({ player, enemy, wacha })
    }
}

const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    }
}

init()

function animate() {
    window.requestAnimationFrame(animate)
    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)
    
    background.update()
    shop.update()
    c.fillStyle = 'rgba(255, 255, 255, 0.15)'
    c.fillRect(0, 0, canvas.width, canvas.height) // Contrast overlay
    
    if (!gameRunning) return

    player.update()
    enemy.update()

    player.velocity.x = 0
    enemy.velocity.x = 0

    // Player Movement & Animation Logic
    if (keys.a.pressed && player.lastKey === 'a' && player.position.x > 0) {
        player.velocity.x = -5
        player.switchSprite('run')
    } else if (keys.d.pressed && player.lastKey === 'd' && player.position.x < canvas.width - player.width) {
        player.velocity.x = 5
        player.switchSprite('run')
    } else {
        player.switchSprite('idle')
    }

    if (player.velocity.y < 0) {
        player.switchSprite('jump')
    } else if (player.velocity.y > 0) {
        player.switchSprite('fall')
    }

    // Enemy Control Logic
    if (gameMode === 'PvE' || gameMode === 'Story') {
        // --- AI LOGIC ---
        const distanceX = player.position.x - enemy.position.x
        const detectionRange = 100
        const retreatRange = 200
        const speed = enemy.stats.speed || 5
        const aggression = enemy.stats.aggressive || 0.02

        enemy.velocity.x = 0

        // Defensive Move: Jump over attacks
        if (player.isAttacking && Math.abs(distanceX) < 150 && enemy.velocity.y === 0) {
             if (Math.random() < 0.05) {
                 enemy.velocity.y = -15
                 SoundManager.playJump()
             }
        }

        // Behavior Decision
        if (enemy.health < 20 && Math.abs(distanceX) < retreatRange) {
            // RETREAT: Low health, run away!
            if (distanceX > 0) { // Player is right, run left
                 enemy.velocity.x = -speed
                 enemy.switchSprite('run')
                 enemy.lastKey = 'ArrowLeft'
            } else { // Player is left, run right
                 enemy.velocity.x = speed
                 enemy.switchSprite('run')
                 enemy.lastKey = 'ArrowRight'
            }
        } else if (Math.abs(distanceX) > detectionRange) {
            // CHASE: Run towards player
            if (distanceX > 0) {
                enemy.velocity.x = speed
                enemy.switchSprite('run')
                enemy.lastKey = 'ArrowRight'
            } else {
                enemy.velocity.x = -speed
                enemy.switchSprite('run')
                enemy.lastKey = 'ArrowLeft'
            }
        } else {
            // ATTACK: In range
            enemy.switchSprite('idle')
            if (Math.random() < aggression) {
                enemy.attack()
            }
        }
    } else {
        // --- PvP LOGIC (Manual Control) ---
        if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft' && enemy.position.x > 0) {
            enemy.velocity.x = -5
            enemy.switchSprite('run')
        } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight' && enemy.position.x < canvas.width - enemy.width) {
            enemy.velocity.x = 5
            enemy.switchSprite('run')
        } else {
            enemy.switchSprite('idle')
        }
    }

    // Jump/Fall Animation (Shared)
    if (enemy.velocity.y < 0) {
        enemy.switchSprite('jump')
    } else if (enemy.velocity.y > 0) {
        enemy.switchSprite('fall')
    }

    // collisions
    if (
        rectangularCollision({
            rectangle1: player,
            rectangle2: enemy
        }) &&
        player.isAttacking &&
        player.image === player.sprites.attack1.image &&
        player.framesCurrent === 4
    ) {
        enemy.takeHit()
        player.isAttacking = false 
        const healthPct = (enemy.health / enemy.maxHealth) * 100
        document.querySelector('#nemesis').style.width = (healthPct < 0 ? 0 : healthPct) + '%'
    }

    // If player misses - Logic moved to Fighter.update()

    if (
        rectangularCollision({
            rectangle1: enemy,
            rectangle2: player
        }) &&
        enemy.isAttacking &&
        enemy.image === enemy.sprites.attack1.image &&
        enemy.framesCurrent === 2
    ) {
        const damage = 20 * (enemy.stats.damageMult || 1)
        player.takeHit(damage)
        enemy.isAttacking = false
        const healthPct = (player.health / player.maxHealth) * 100
        document.querySelector('#playerHealth').style.width = (healthPct < 0 ? 0 : healthPct) + '%'
    }

    // If enemy misses - Logic moved to Fighter.update()

    if (enemy.health <= 0 || player.health <= 0) {
        winner({ player, enemy, wacha })
    }
}

animate()

window.addEventListener('keydown', (event) => {
    // Prevent game inputs if on Main Menu
    if (document.querySelector('#screen-menu').style.display !== 'none') return

    if (!player.dead) {
        switch (event.key) {
            case 'd':
                keys.d.pressed = true
                player.lastKey = 'd'
                break
            case 'a':
                keys.a.pressed = true
                player.lastKey = 'a'
                break
            case 'w':
                if(player.velocity.y === 0) {
                    player.velocity.y = -20
                    SoundManager.playJump()
                }
                break
            case ' ':
                player.attack()
                break
        }
    }

    if (!enemy.dead) {
        switch (event.key) {
            case 'ArrowRight':
                keys.ArrowRight.pressed = true
                enemy.lastKey = 'ArrowRight'
                break
            case 'ArrowLeft':
                keys.ArrowLeft.pressed = true
                enemy.lastKey = 'ArrowLeft'
                break
            case 'ArrowUp':
                if(enemy.velocity.y === 0) {
                    enemy.velocity.y = -20
                    SoundManager.playJump()
                }
                break
            case 'ArrowDown':
                enemy.attack()
                break
        }
    }
    
    // Restart Listener
    if (document.querySelector('#out').style.display === 'flex' && event.key === 'Enter') {
        if (gameMode === 'Menu') {
             document.querySelector('#out').style.display = 'none'
             document.querySelector('#screen-game').style.display = 'none'
             document.querySelector('#screen-menu').style.display = 'flex'
        } else if (gameMode === 'Story') {
            startStoryMode()
        } else {
            startGame(gameMode)
        }
    }
})

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        case 'w': // keys.w.pressed = false 
            break
        case 'ArrowRight':
            keys.ArrowRight.pressed = false
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false
            break
    }
})