/**
 * tabBar 图标生成脚本（纯 Node，无第三方依赖）
 *
 * 为什么需要它：微信小程序 tabBar 的 iconPath 只接受位图（PNG/JPG），不支持
 * SVG / 字体图标；缺图标会直接导致 `taro build` 失败。项目又处于未安装依赖阶段，
 * 无法使用 sharp / canvas 等库，因此这里用 Node 内置的 zlib 手写一个最小 PNG 编码器，
 * 按「未选中灰 + 选中玫瑰粉」两套，生成 4 个 tab 共 8 张图标。
 *
 * 运行：node scripts/gen-tabbar-icons.js
 * 产物：src/assets/tabbar/{notice,ai,message,mine}[-active].png
 *
 * 设计取舍：
 * - 图标用 81x81（微信推荐上限），@3x 下清晰；采用纯色剪影 + 透明背景，风格统一。
 * - 每个图标用简单几何图元（矩形/圆/线）拼出可辨识的剪影，不追求精细，够用即可，
 *   后续设计给到正式素材可直接替换同名文件。
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZE = 81 // 画布边长（正方形）
const INACTIVE = [0x99, 0x99, 0x99] // 未选中态：中性灰
const ACTIVE = [0xe7, 0x99, 0xb0] // 选中态：品牌玫瑰粉（与 THEME_COLOR 同步）

/**
 * 一张 RGBA 画布。像素以行优先存储，每像素 4 字节（R,G,B,A）。
 * 提供最小绘图图元，足以拼出 tabBar 剪影图标。
 */
class Canvas {
  constructor(size) {
    this.size = size
    // 初始全透明（A=0），后续绘制处再置为不透明
    this.data = Buffer.alloc(size * size * 4, 0)
  }

  /** 设置单个像素颜色（带边界裁剪与透明度） */
  set(x, y, [r, g, b], a = 255) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return
    const i = (y * this.size + x) * 4
    this.data[i] = r
    this.data[i + 1] = g
    this.data[i + 2] = b
    this.data[i + 3] = a
  }

  /** 填充矩形 [x,y,w,h] */
  fillRect(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, color)
    }
  }

  /** 圆角矩形描边/填充：用于卡片、气泡等 */
  roundRect(x, y, w, h, r, color, fill = true, thickness = 4) {
    const inside = (px, py) => {
      // 四角圆角判定：落在角部圆形区域外的点不算命中
      const cxL = x + r
      const cxR = x + w - r
      const cyT = y + r
      const cyB = y + h - r
      let cx = px
      let cy = py
      if (px < cxL) cx = cxL
      else if (px > cxR) cx = cxR
      if (py < cyT) cy = cyT
      else if (py > cyB) cy = cyB
      const dx = px - cx
      const dy = py - cy
      return dx * dx + dy * dy <= r * r
    }
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        if (!inside(px, py)) continue
        if (fill) {
          this.set(px, py, color)
        } else {
          // 描边：距离边界 thickness 内才画
          const near =
            px < x + thickness ||
            px > x + w - thickness - 1 ||
            py < y + thickness ||
            py > y + h - thickness - 1
          if (near) this.set(px, py, color)
        }
      }
    }
  }

  /** 实心圆 */
  fillCircle(cx, cy, radius, color) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const dx = x - cx
        const dy = y - cy
        if (dx * dx + dy * dy <= radius * radius) this.set(x, y, color)
      }
    }
  }

  /** 圆环（描边圆） */
  ringCircle(cx, cy, radius, thickness, color) {
    const outer = radius * radius
    const inner = (radius - thickness) * (radius - thickness)
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const dx = x - cx
        const dy = y - cy
        const d = dx * dx + dy * dy
        if (d <= outer && d >= inner) this.set(x, y, color)
      }
    }
  }

  /** 粗线段（Bresenham + 半径扩展模拟线宽） */
  line(x0, y0, x1, y1, color, width = 3) {
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    let x = x0
    let y = y0
    const rad = Math.floor(width / 2)
    // 沿路径每个点画一个小圆，形成有宽度的线
    // eslint-disable-next-line no-constant-condition
    while (true) {
      this.fillCircle(x, y, rad, color)
      if (x === x1 && y === y1) break
      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x += sx
      }
      if (e2 < dx) {
        err += dx
        y += sy
      }
    }
  }
}

/**
 * 把 RGBA 画布编码为 PNG Buffer。
 * 实现 PNG 最小子集：8-bit RGBA、无隔行；用 zlib.deflateSync 压缩 IDAT。
 */
function encodePNG(canvas) {
  const { size, data } = canvas

  // 每行前置 1 字节 filter type（0 = None），构成 raw 数据
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    const srcStart = y * size * 4
    const dstStart = y * (size * 4 + 1)
    raw[dstStart] = 0 // filter: None
    data.copy(raw, dstStart + 1, srcStart, srcStart + size * 4)
  }

  const idat = zlib.deflateSync(raw)

  /** 生成一个 PNG chunk：len(4) + type(4) + data + crc(4) */
  const chunk = (type, body) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(body.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, body])) >>> 0, 0)
    return Buffer.concat([len, typeBuf, body, crc])
  }

  // IHDR：宽、高、位深 8、颜色类型 6（RGBA）、其余 0
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** CRC32（PNG chunk 校验用），标准查表实现 */
const CRC_TABLE = (() => {
  const table = new Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

// ---- 各图标的绘制函数：入参为画布与颜色，产出对应剪影 ----

/** 通告：一张带横线（文本行）的文档 */
function drawNotice(c, color) {
  const x = 20
  const y = 14
  const w = 41
  const h = 53
  c.roundRect(x, y, w, h, 6, color, false, 4) // 文档外框
  // 三条文本行
  c.fillRect(x + 9, y + 13, w - 18, 4, color)
  c.fillRect(x + 9, y + 24, w - 18, 4, color)
  c.fillRect(x + 9, y + 35, w - 22, 4, color)
}

/** AI 盯单：一只「眼睛」（盯）内含瞳孔，呼应智能监控 */
function drawAI(c, color) {
  const cx = 40
  const cy = 40
  // 眼睛外轮廓：用上下两条弧线近似，这里简化为椭圆环
  for (let y = -20; y <= 20; y++) {
    for (let x = -30; x <= 30; x++) {
      // 椭圆边界：(x/30)^2 + (y/18)^2 ≈ 1，取环带
      const v = (x * x) / (30 * 30) + (y * y) / (18 * 18)
      if (v <= 1 && v >= 0.72) c.set(cx + x, cy + y, color)
    }
  }
  c.fillCircle(cx, cy, 9, color) // 瞳孔
}

/** 消息：圆角对话气泡 + 小尾巴 */
function drawMessage(c, color) {
  const x = 15
  const y = 16
  const w = 51
  const h = 38
  c.roundRect(x, y, w, h, 10, color, false, 4) // 气泡主体
  // 气泡尾巴：左下角三角
  c.line(x + 12, y + h - 2, x + 6, y + h + 10, color, 4)
  c.line(x + 6, y + h + 10, x + 24, y + h - 2, color, 4)
  // 气泡内三个点（省略号，表示会话）
  c.fillCircle(x + 15, y + h / 2, 3, color)
  c.fillCircle(x + 26, y + h / 2, 3, color)
  c.fillCircle(x + 37, y + h / 2, 3, color)
}

/** 我的：头 + 肩，经典个人中心剪影 */
function drawMine(c, color) {
  const cx = 40
  c.ringCircle(cx, 26, 13, 4, color) // 头（圆环）
  // 肩/身体：一段上凸的半环
  const bodyCx = cx
  const bodyCy = 74
  const rOuter = 26
  const thickness = 4
  for (let y = -rOuter; y <= 0; y++) {
    for (let x = -rOuter; x <= rOuter; x++) {
      const d = x * x + y * y
      if (d <= rOuter * rOuter && d >= (rOuter - thickness) * (rOuter - thickness)) {
        c.set(bodyCx + x, bodyCy + y, color)
      }
    }
  }
}

const ICONS = {
  notice: drawNotice,
  ai: drawAI,
  message: drawMessage,
  mine: drawMine,
}

function main() {
  const outDir = path.join(__dirname, '..', 'src', 'assets', 'tabbar')
  fs.mkdirSync(outDir, { recursive: true })

  for (const [name, draw] of Object.entries(ICONS)) {
    // 未选中（灰）
    const inactive = new Canvas(SIZE)
    draw(inactive, INACTIVE)
    fs.writeFileSync(path.join(outDir, `${name}.png`), encodePNG(inactive))

    // 选中（红）
    const active = new Canvas(SIZE)
    draw(active, ACTIVE)
    fs.writeFileSync(path.join(outDir, `${name}-active.png`), encodePNG(active))
  }

  console.log('tabBar icons generated at', outDir)
}

main()
