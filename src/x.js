import bezierEasing from "bezier-easing"

const easing = bezierEasing(0.250, 0.100, 0.250, 1.000)

const easeOut = bezierEasing(0, 0, 0.58, 1)

const easeIn = bezierEasing(0.42, 0, 1, 1)

const quadratic = bezierEasing(0.25, 0.46, 0.45, 0.94)

const circular = bezierEasing(0.1, 0.57, 0.1, 1)

class XMScroll {
  constructor(el, options) {
    options = { ...XMScroll.defaults, ...options }

    this.$el = el

    this.$con = options.content ? (options.content instanceof Node ? options.content : this.$el.querySelector(options.content)) : this.$el.children[0]

    this.state = {
      enabled: true, // 是否启用
      touching: false,
      scrolling: false,
      bouncing: false,
      minX: 0,
      maxX: 0,
      width: 0,

      useTransform: options.useTransform,

      slowDownOverflow: options.slowDownOverflow,

      bounceTime: 600,

      x: 0,
    }

    this.scrollingTimer = null
    this.calctempStateTimer = null // 当手指移动停止，且未离开屏幕时，一定时间后，将速度设置为0

    this.tempState = {
      lastTime: 0,
      lastX: 0,
      time: 0,
      x: 0,
      s: 0,  // 移动距离
      t: 0,  // 移动时间
      v: 0,  // 速度
    }

    this._eventHandles = {}
    this.eventHandles = {}

    this.reset(options)

    this.initEvent()
  }

  // 重新计算滚动范围
  refresh(options) {
    const oldState = { ...this.state }
    this.state.width = this.$el.clientWidth
    this.state.maxX = this.$el.clientWidth - this.$con.offsetWidth
    options && (this.state = { ...this.state, ...options })
    if (oldState.minX !== this.state.minX || oldState.maxX !== this.state.maxX) {
      if (this.state.bouncing || !this.state.scrolling) {
        this.bounce()
      }
    }
  }

  reset(options) {
    this.refresh(options)
    this.translateTo(this.state.minX, false)
  }

  // 执行反弹
  bounce() {
    this.stopScrolling()
    if (this.state.x <= this.state.minX && this.state.x >= this.state.maxX) {
      return
    }
    this.state.scrolling = true
    this.state.bouncing = true
    let len = 0
    if (this.state.x > this.state.minX) {
      len = this.state.minX - this.state.x
    } else {
      len = this.state.maxX - this.state.x
    }
    const x = this.state.x

    let timeStart = 0

    const _bounce = (oldTime) => {
      this.setTimer((time) => {
        if (oldTime) {
          let percent = (time - timeStart) / this.state.bounceTime
          if (percent > 1) percent = 1
          this.translateTo(x + easing(percent) * len)
          if (percent === 1) {
            this.state.bouncing = false
            this.stopScrolling()
            return
          }
        } else {
          timeStart = time
        }
        _bounce(time)
      })
    }

    _bounce()
  }

  _addEvent(name, handle) {
    const handles = this._eventHandles
    if (!handles[name]) {
      handles[name] = []
    }
    handles[name].push(handle)
    this.$el.addEventListener(name, handle)
  }

  _removeEvent(name, handle) {
    const handles = this._eventHandles
    if (!name) {
      Object.keys(handles).forEach((name) => {
        this._removeEvent(name)
      })
    }

    if (!handles[name]) return
    if (!handle) {
      handles[name].forEach((h) => {
        this.$el.removeEventListener(name, h)
      })
      handles[name] = []
    } else {
      this.$el.removeEventListener(name, handle)
      const index = handles[name].findIndex(h => h === handle)
      handles[name].splice(index, 1)
    }
  }

  initEvent() {
    this._removeEvent()
    this._addEvent("touchstart", (e) => {
      this.state.touching = true
      this.stopScrolling()
      this.calctempState(e.timeStamp, e.targetTouches[0].screenX, true)
      this.trigger("touchstart", this.state)
    })

    this._addEvent("touchmove", (e) => {
      if (!this.state.enabled) return
      e.preventDefault()
      if (this.state.touching) {
        this.calctempState(e.timeStamp, e.targetTouches[0].screenX)
        let len = this.tempState.s
        if (this.state.x > this.state.minX || this.state.x < this.state.maxX) {
          len /= 3
        }
        this.translate(len)
        this.setCalcTimer()
      }
      this.trigger("touchmove", this.state)
    })

    this._addEvent("touchend", (e) => {
      this.state.touching = false
      this.removeCalcTimer()
      this.trigger("touchend", this.state)
      this.slowDown()
    })
  }

  calctempState(time, x, reset = false) {
    if (reset) {
      this.tempState = {
        startTime: time,
        startX: x,
        lastTime: 0,
        lastX: 0,
        time: 0,
        x: 0,
        s: 0,  // 移动距离
        t: 0,  // 移动时间
        v: 0,  // 速度
      }
    }
    this.tempState.lastTime = this.tempState.time
    this.tempState.lastX = this.tempState.x
    this.tempState.time = time
    this.tempState.x = x
    if (!reset) {
      this.tempState.s = this.tempState.x - this.tempState.lastX
      this.tempState.t = this.tempState.time - this.tempState.lastTime
      this.tempState.v = this.tempState.s / this.tempState.t
      this.tempState.ov = this.tempState.v
    }
  }

  stopScrolling() { // 停止自动滚动（包括反弹滚动）
    if (this.scrollingTimer) {
      window.cancelAnimationFrame(this.scrollingTimer)
      this.scrollingTimer = null
    }
    this.state.scrolling = false
    this.state.bouncing = false
  }

  setTimer(callback) {
    this.scrollingTimer = window.requestAnimationFrame(callback)
  }

  setCalcTimer() {
    this.removeCalcTimer()
    this.calctempStateTimer = window.setTimeout(() => {
      this.calctempState(this.tempState.time + 100, this.tempState.x) // 将速度设置为0
    }, 100)
  }

  removeCalcTimer() {
    if (this.calctempStateTimer) {
      window.clearTimeout(this.calctempStateTimer)
      this.calctempStateTimer = null
    }
  }

  slowDown() { // 减速停止
    if (this.state.x >= this.state.minX || this.state.x <= this.state.maxX) {
      this.bounce()
      return
    }

    const v = this.tempState.v === 0 ? 0 : (this.tempState.x - this.tempState.startX) / (this.tempState.time - this.tempState.startTime) // this.tempState.v

    const startTime = Date.now()

    const startX = this.state.x

    const a = 0.001

    const time = Math.abs(v / a) // 减速时间 = 以当前速度做匀减速运动的时间

    const s = v * time / 2   // 匀减速距离

    const toX = startX + s

    const limit = Math.abs(v) * 15

    const minLimitX = this.state.minX + limit

    const maxLimitX = this.state.maxX - limit

    // if(toX > minLimitX) {
    //   s = minLimitX - startX
    //   time = s * 2 / v
    // } else if ( toX < maxLimitX) {
    //   s = maxLimitX - startX
    //   time = s * 2 / v
    // }

    const _slowDown = () => {
      const changeTime = Date.now() - startTime

      if (!this.state.slowDownOverflow) {
        if (this.state.x >= this.state.minX) {
          this.stopScrolling()
          this.translateTo(this.state.minX)
          return
        } else if (this.state.x <= this.state.maxX) {
          this.stopScrolling()
          this.translateTo(this.state.maxX)
          return
        }
      }

      if (this.state.x >= minLimitX
        || this.state.x <= maxLimitX
        || changeTime >= time
        ) {
        this.stopScrolling()
        this.bounce()
        return
      }

      this.state.scrolling = true

      this.setTimer(() => {
        // this.translateTo(startX + s * easeOut(changeTime/time))
        const tempV = v * (1 - quadratic(changeTime / time))
        this.translate(tempV * 16)
        _slowDown()
      })
    }

    _slowDown()
  }

  translateTo(x, triggerEvent = true) { // 滚动到x
    // console.log(x)
    this.state.x = x
    if (this.state.useTransform) {
      this.$con.style.webkitTransform = `translateZ(0) translateX(${x}px)`
      this.$con.style.transform = `translateZ(0) translateX(${x}px)`
    } else {
      this.$con.style.marginTop = `${x}px`
    }
    triggerEvent && this.trigger("scroll", this.state)
  }

  translate(len = 0) {  // 滚动内容
    this.translateTo(this.state.x + len)
  }

  on(name, callback) {
    const handles = this.eventHandles
    if (!handles[name]) {
      handles[name] = []
    }
    handles[name].push(callback)
  }

  trigger(name, data) {
    const handles = this.eventHandles
    if (!handles[name]) return
    handles[name].forEach((h) => {
      h(data)
    })
  }

  off(name, callback) {
    const handles = this.eventHandles

    if (!name) {
      Object.keys(handles).forEach((name) => {
        this.off(name)
      })
    }

    if (!handles[name]) return
    if (!callback) {
      handles[name] = []
    } else {
      const index = handles[name].findIndex(h => h === callback)
      handles[name].splice(index, 1)
    }
  }

  disable() {
    this.state.enabled = false
  }

  enable() {
    this.state.enabled = true
  }

  destroy() {
    this.stopScrolling()
    this.off()
    this._removeEvent()
    this.translateTo(0)
  }

}


XMScroll.defaults = {
  content: null,  // 滚动内容的Node或选择器，不传默认取容器的第一个子节点
  useTransform: true, // 默认使用transform，false时，将使用marginTop
  slowDownOverflow: true
}


export default XMScroll
