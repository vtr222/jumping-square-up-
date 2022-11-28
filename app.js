let [data, methods, computed] = [{}, {}, {}, {}]

data.p = ''
data.c = ''
data.gameWidth = 800
data.gameHeight = 580
data.mainLoopId = 0


data.mouseX = 0
data.mouseY = 0

methods.getMouseCoords = function (e) {
    // console.log('mouse',this.mouseX)
    // console.log('rabbit', this.rabbit.x)
    this.mouseX = e.clientX - this.$refs.canvas.getBoundingClientRect().left
    this.mouseY = e.clientY
}

const JUMPING = 'j'
const FALLING = 'f'
const IDLE = 'i'

data.rabbit = {
    y: 0,
    x: data.gameWidth / 2,
    w: 32,
    h: 32,
    state: IDLE,
    YImpulse: 0
}

const TRACKING_DELAY = 0.1
const INITIAL_IMPULSE = -22
const MAX_IMPULSE = 45
const GRAVITY = 1
const GROUND = 580

data.rabbit.y = GROUND - data.rabbit.h

const BELL_HEIGHT = 18 //19 // 9 // 4
const BELL_WIDTH = 58
const BELL_SLOT = data.gameHeight / 6

data.bells = []

data.gameState = {
    started: false,
    bellsJumped: 0,
    bellRatio: 1
}

//Util

function rnd(min = 0, max = 10) {
    return Math.round(Math.random() * (max - min) + min)
}

function inBetween(value, min, max) {
    if (value > min && value < max) {
        return true
    }
    return false
}

methods.gameLoop = function () {

    this.clearScreen()
    this.setCamera()
    this.setBells()
    this.p.fillStyle = 'black'
    this.drawRabbit()//
    this.mainLoopId = window.requestAnimationFrame(this.gameLoop)
}

data.bellStartY = 0
data.lastBellY = 0

methods.generateBells = function () {
    this.bells = []
    this.bellStartY = this.gameHeight * 0.66
    for (let i = 0; i < 8; i++) {
        this.bellStartY -= BELL_SLOT * 1.5
        let y = rnd(this.bellStartY, this.bellStartY + BELL_SLOT)
        this.lastBellY = y
        this.bells.push({
            x: rnd(BELL_WIDTH, this.gameWidth - BELL_WIDTH * 2),
            y,
            w: BELL_WIDTH,
            h: BELL_HEIGHT,
            jumped: false,
            ratio: 1
        })
    }
}

computed.bellsY = function () { return this.bells.map(b => b.y) }

methods.clearScreen = function () {
    let { f: translateY } = this.p.getTransform()
    let screenTop = translateY * -1
    this.currentTranslateY = translateY
    this.p.clearRect(0, screenTop, this.gameWidth, this.gameHeight)
}
methods.setCamera = function () {
    let y = 0
    if (!this.gameState.started) return

    let impulse = this.rabbit.YImpulse

    if (this.rabbit.y < this.gameHeight / 2) {
        y = this.rabbit.y
        let screenTop = this.currentTranslateY * -1
        let screenBottom = screenTop + this.gameHeight

        if (impulse < 0) {

            inBetween(y, screenTop, screenTop + this.gameHeight / 2)
                ? this.p.translate(0, impulse * -1 * (!inBetween(y, screenTop, screenTop + this.gameHeight / 3) ? 0.7 : 1))
                : this.p.translate(0, impulse * -1 * 0.3)
        }
        else {
            inBetween(y, screenBottom - this.gameHeight / 4, screenBottom)
                ? this.p.translate(0, impulse * -1 * 1.01)
                : this.p.translate(0, impulse * -1 * 0.3)
        }
    }
    else {
        this.currentTranslateY !== 0 ? this.p.setTransform(1, 0, 0, 1, 0, this.currentTranslateY > 0 ? this.currentTranslateY - impulse : 0) : ''
    }
}
methods.setBells = function () {
    let killLine = this.rabbit.y + this.gameHeight
    let r = this.rabbit
    let g = this.gameState
    this.p.fillStyle = 'rgb(161,151,200)'
    this.bells.forEach(b => {
        //Collision
        if (inBetween(r.y, b.y - r.h, b.y + BELL_HEIGHT)) {
            if (inBetween(r.x, b.x, b.x + b.w) || inBetween(r.x + r.w, b.x, b.x + b.w) || inBetween(b.x, r.x + r.w) || inBetween(b.x + b.w, r.x, r.x + r.w)) {
                b.jumped = true
                g.bellsJumped++
                this.rabbitJump()
                if (this.gameState.bellsJumped < 60) { g.bellRatio = 1 }
                else if (this.gameState.bellsJumped < 120) { g.bellRatio = 0.75 }
                else if (this.gameState.bellsJumped > 120) { g.bellRatio = 0.5 }

            }
        }
        //Redraw
        if (b.jumped || b.y > killLine || b.y > this.gameHeight * 0.75) {

            this.lastBellY = Math.min(...this.bellsY)
            this.bellStartY = this.lastBellY - BELL_SLOT * 1.8

            let y = rnd(this.bellStartY, this.bellStartY + BELL_SLOT)
            b.y = y
            b.x = rnd(b.w, this.gameWidth - b.w * 2)
            b.jumped = false

            if (b.ratio !== g.bellRatio) {
                b.w = Math.floor(b.w * g.bellRatio)
                b.h = Math.floor(b.h * g.bellRatio)
                b.ratio = g.bellRatio
            }


        }
        b.y += GRAVITY
        this.p.fillRect(b.x, b.y, b.w, b.h)
    })
}
methods.drawRabbit = function () {

    let r = this.rabbit
    this.p.fillRect(r.x, r.y, r.w, r.h)
    let middle = r.x + r.w / 2
    //X Movement
    if (!inBetween(middle, this.mouseX - r.w / 2, this.mouseX + r.w / 2) && this.mouseX) {
        let distance = Math.abs(this.mouseX - middle)
        let movement = Math.round(distance * TRACKING_DELAY)
        this.mouseX > r.x ? r.x += movement : r.x -= movement
    }
    // Y Movement
    if (r.state !== IDLE) {
        r.YImpulse += r.state === JUMPING ? GRAVITY : GRAVITY * 0.5
        r.YImpulse > 0 ? r.YImpulse = Math.min(r.YImpulse, MAX_IMPULSE) : ''
        r.y += r.YImpulse
        r.state = r.YImpulse <= 0 ? JUMPING : FALLING
    }
    //Collision 
    if ((r.y + r.h) >= GROUND) {
        r.y = GROUND - r.h
        r.state = IDLE
        if (this.gameState.bellsJumped && this.gameState.started) {
            this.gameOver()
            this.ui.gameOver = true
        }
        this.gameState.started = false


    }
}
methods.rabbitJump = function () {
    this.rabbit.state = JUMPING
    this.rabbit.YImpulse = INITIAL_IMPULSE
}

data.ui = {
    welcome: true,
    gameOver: false
}
methods.setupGame = function () {
    this.ui.welcome = false
    this.ui.gameOver = false
    this.gameState.bellsJumped = 0
    this.gameState.bellRatio = 1
    this.generateBells()
    cancelAnimationFrame(this.mainLoopId)
    this.mainLoopId = window.requestAnimationFrame(this.gameLoop)
}

methods.startGame = function () {
    document.querySelector("#audio").play()
    if (!this.gameState.started) {
        this.gameState.started = true
        this.rabbitJump()
    }
}
methods.gameOver = function () { }

data.currentTranslateY = 0


let mounted = function () {
    this.c = this.$refs.canvas
    this.p = this.c.getContext('2d')
    this.p.save()
}

let obj = {
    data() { return data },
    methods,
    computed,
    mounted,
}
const vueTemplate = Vue.createApp(obj).mount('#vue')
