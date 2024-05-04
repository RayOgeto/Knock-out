const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

//innteractions
const gravity = 0.7

class sprite {
    constructor({position, velocity, color = 'red', offset}){
        this.position = position
        this.velocity = velocity
        this.width = 50
        this.height = 150
        this.lastKey
        this.attackBox = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            offset,
            width: 100,
            height: 50,
        }
        this.color = color
        this.isAttacking
        this.health = 100
    }

    draw() {
        c.fillStyle ='red'
        c.fillRect(this.position.x, this.position.y, this.width, this.height)

        //atkbx
        if (this.isAttacking) {
            c.fillStyle = 'yellow'
            c.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height)
         }
    }

    update() {
        this.draw()

        this.attackBox.position.x = this.position.x + this.attackBox.offset.x
        this.attackBox.position.y = this.position.y

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        if (this.position.y + this.height + this.velocity.y >= canvas.height ) {
            this.velocity.y = 0 
        } else
        this.velocity.y += gravity

    }

    attack() {
        this.isAttacking = true
        setTimeout(() => {
            this.isAttacking = false
        }, 100);
    }
}

const player = new sprite({
    position: {
        x:0,
        y:0
    },
    velocity: {
        x: 0,
        y: 0
    },
    offset: {
        x: 0,
        y:0
    },
})
 

const enemy = new sprite({
    position: {
        x:400,
        y:100
    },
    velocity: {
        x: 0,
        y: 0
    },
    color: 'blue',
    offset: {
        x:-50,
        y:0
    }
})

console.log(player)

const keys  = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowUp : {
        pressed: false
    },
    ArrowDown: {
        pressed:false
    }


}

/*function rectcollision(rectangle1, rectangle2) {
     return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= 
        rectangle2.position.x 
        && rectangle1.attackBox.position.x <= 
        rectangle2.position.x + rectangle2.width
        && rectangle1.attackBox.position.y + rectangle1.attackBox.height >= 
        rectangle2.position.y
        && rectangle1.attackBox.position.y <= 
        rectangle2.position.y + rectangle2.height
    )
}*/

//ze timing funtionality of ze game. for game over and stuff!!

function winner({player, enemy, wacha}) {
    clearTimeout(wacha)
    document.querySelector('#out').style.display = 'flex'

    if (player.health === enemy.health) {
        document.querySelector('#out').innerHTML = 'draw'
        console.log('draw')
    } else if (player.health > enemy.health) {
        document.querySelector('#out').innerHTML = 'player wins'
    } else if (player.health < enemy.health) {
        document.querySelector('#out').innerHTML = 'nemesis wins'
    }
}

let hesabu = 60
let wacha 

function  decreaseTimer() {
    if (hesabu > 0) {
        wacha = setTimeout(decreaseTimer, 1000)
        hesabu--
        document.querySelector('#hesabu').innerHTML = hesabu
    }

    if (hesabu === 0) {
        // document.querySelector('#out').style.display = 'flex'
        winner({player, enemy, wacha})
       /* if (player.health === enemy.health) {
            document.querySelector('#out').innerHTML = 'draw'
            console.log('draw')
        } else if (player.health > enemy.health) {
            document.querySelector('#out').innerHTML = 'player wins'
        } else if (player.health < enemy.health) {
            document.querySelector('#out').innerHTML = 'nemesis wins'
        }*/
    }
}

decreaseTimer()

function animate() {
    window.requestAnimationFrame(animate)
    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)
    player.update()
    enemy.update()

    player.velocity.x = 0
    enemy.velocity.x = 0

    //action  movement of player 1
    if (keys.a.pressed && player.lastKey === 'a') {
        player.velocity.x = -5
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 5
    }

// movement player 2
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
        enemy.velocity.x = -5
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
        enemy.velocity.x = 5
    }

    // collisions
    if (player.attackBox.position.x + player.attackBox.width >= 
        enemy.position.x 
        && player.attackBox.position.x <= 
        enemy.position.x + enemy.width
        && player.attackBox.position.y + player.attackBox.height >= 
        enemy.position.y
        && player.attackBox.position.y <= 
        enemy.position.y + enemy.height 
        && player.isAttacking) 
    {
        player.isAttacking = false
        enemy.health -= 20
        document.querySelector('#nemesis').style.width = enemy.health + '%'
        console.log('player one is making some moves')
    }

    if (enemy.attackBox.position.x + enemy.attackBox.width >= 
        player.position.x 
        && enemy.attackBox.position.x <= 
        player.position.x + player.width
        && enemy.attackBox.position.y + enemy.attackBox.height >= 
        player.position.y
        && enemy.attackBox.position.y <= 
        player.position.y + player.height
        && enemy.isAttacking)
    {
        enemy.isAttacking = false
        player.health -= 20
        document.querySelector('#playerHealth').style.width = player.health + '%'
        console.log('you getting kicked real bad!!!!')
    }

    /*if (rectcollision({
            rectangle1: player,
            rectangle2: enemy
        })
        && enemy.isAttacking
    )
    {
        player.isAttacking = false
        document.querySelector('nemesis').style.width = '20%'
        console.log("minus health.")
    }
    
    if (
        rectcollision({
            rectangle1: enemy,
            rectangle2: player
        })
        && enemy.isAttacking
    )
    {
        enemy.isAttacking = false
        console.log("die, die,die")
    } */

    if (enemy.health <= 0 || player.health <= 0) {
         winner({player, enemy, wacha})
    }
}

animate()

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = true
            player.lastKey = 'd'
            break
        case 'a':
            keys.a.pressed =  true
            player.lastKey = 'a'
            break
        case 'w':
            player.velocity.y = -20
            break
        case ' ':
            player.attack()
            break
    //change theser stuff to use the normal arow shit functions
    //enemy , villain, the wrong guy, Dangamanya, movement functions

        case 'ArrowRight':
            keys.ArrowRight.pressed = true
            enemy.lastKey = 'ArrowRight'
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed =  true
            enemy.lastKey = 'ArrowLeft'
            break
        case 'ArrowUp':
            enemy.velocity.y = -20
            break
        case 'ArrowDown': 
            enemy.attack()
            break
    }
})

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false
            break
        case 'a':
            keys.a.pressed =  false
            break
        case 'w':
            keys.a.pressed =  false
            lastkey = 'w'
            break
    
        //enemy, adui attack
        case 'ArrowUp':
            keys.ArrowUp.pressed = false
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed =  false
            break
        case 'ArrowRight':
            keys.ArrowRight.pressed =  false
            break
        case 'ArrowDown': 
            enemy.isAttacking = false
            break
    }
})