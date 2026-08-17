/**
 * ATOMIC - PWA 아이콘 생성기
 *
 * 외부 라이브러리 없이 Node 내장 zlib 만으로 PNG 를 직접 인코딩한다.
 * (오프라인/무의존 원칙 — 아이콘 때문에 빌드 도구를 늘리지 않는다)
 *
 * 실행: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '../public')

/* ---------------------------- PNG 인코더 ---------------------------- */
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------------------------- 그리기 ---------------------------- */
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const mix = (a, b, t) => a + (b - a) * t

function over(dst, src, alpha) {
  const a = clamp01(alpha)
  dst[0] = mix(dst[0], src[0], a)
  dst[1] = mix(dst[1], src[1], a)
  dst[2] = mix(dst[2], src[2], a)
  dst[3] = clamp01(dst[3] + a * (1 - dst[3]))
}

/**
 * @param {number} size  출력 크기(px)
 * @param {number} scale 아이콘 내용물 비율 (maskable 은 작게)
 * @param {boolean} rounded 배경 라운드 여부
 */
function drawAtom(size, scale, rounded) {
  const SS = 3 // 슈퍼샘플링
  const rgba = Buffer.alloc(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.22 // 라운드 반경

  const ORBITS = [0, 60, 120].map((deg) => (deg * Math.PI) / 180)
  const A = size * 0.40 * scale
  const B = size * 0.152 * scale
  const STROKE = Math.max(1.6, size * 0.021 * scale)
  const NUCLEUS = size * 0.083 * scale
  const ELECTRON = size * 0.045 * scale
  // 전자 위치 (각 궤도 위 매개변수각)
  const ELECTRON_T = [0.62, 2.45, 4.4]

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0, 0]
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS
          const y = py + (sy + 0.5) / SS
          const dx = x - cx
          const dy = y - cy
          const px01 = [0, 0, 0, 0]

          /* 배경 */
          let inside = true
          if (rounded) {
            const qx = Math.abs(dx) - (size / 2 - radius)
            const qy = Math.abs(dy) - (size / 2 - radius)
            const d =
              Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
            inside = d < 0
          }
          if (inside) {
            const r = Math.hypot(dx, dy) / (size * 0.62)
            const t = clamp01(r)
            over(px01, [mix(13, 5, t), mix(32, 10, t), mix(58, 22, t)], 1)
          }

          /* 중심 글로우 */
          const glow = Math.exp(-Math.pow(Math.hypot(dx, dy) / (size * 0.2 * scale), 2))
          over(px01, [44, 190, 255], glow * 0.42)

          /* 궤도 */
          for (let i = 0; i < ORBITS.length; i++) {
            const th = ORBITS[i]
            const rx = dx * Math.cos(th) + dy * Math.sin(th)
            const ry = -dx * Math.sin(th) + dy * Math.cos(th)
            const k = Math.hypot(rx / A, ry / B)
            const dist = Math.abs(k - 1) * Math.min(A, B)
            const edge = clamp01((STROKE / 2 - dist) / 1.2 + 0.5)
            if (edge > 0) over(px01, [116, 216, 255], edge * 0.92)
          }

          /* 전자 */
          for (let i = 0; i < ORBITS.length; i++) {
            const th = ORBITS[i]
            const t = ELECTRON_T[i]
            const ex = A * Math.cos(t)
            const ey = B * Math.sin(t)
            const wx = ex * Math.cos(th) - ey * Math.sin(th)
            const wy = ex * Math.sin(th) + ey * Math.cos(th)
            const d = Math.hypot(dx - wx, dy - wy)
            over(px01, [232, 252, 255], clamp01((ELECTRON - d) / 1.4 + 0.5))
          }

          /* 핵 */
          const dn = Math.hypot(dx, dy)
          over(px01, [255, 255, 255], clamp01((NUCLEUS * 0.55 - dn) / 1.4 + 0.5))
          over(px01, [125, 224, 255], clamp01((NUCLEUS - dn) / 1.6 + 0.5) * 0.85)

          acc[0] += px01[0]
          acc[1] += px01[1]
          acc[2] += px01[2]
          acc[3] += px01[3]
        }
      }
      const n = SS * SS
      const o = (py * size + px) * 4
      rgba[o] = Math.round(acc[0] / n)
      rgba[o + 1] = Math.round(acc[1] / n)
      rgba[o + 2] = Math.round(acc[2] / n)
      rgba[o + 3] = Math.round((acc[3] / n) * 255)
    }
  }
  return rgba
}

/* ---------------------------- 출력 ---------------------------- */
mkdirSync(PUBLIC_DIR, { recursive: true })

const OUTPUTS = [
  { file: 'icon-192.png', size: 192, scale: 1, rounded: true },
  { file: 'icon-512.png', size: 512, scale: 1, rounded: true },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.66, rounded: false },
]

for (const { file, size, scale, rounded } of OUTPUTS) {
  const png = encodePng(size, size, drawAtom(size, scale, rounded))
  writeFileSync(resolve(PUBLIC_DIR, file), png)
  console.log(`✅ ${file} (${size}×${size}, ${(png.length / 1024).toFixed(1)}KB)`)
}

/* favicon 은 SVG 로 — 어느 크기에서도 선명하다 */
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#0d2a48"/>
      <stop offset="100%" stop-color="#050a14"/>
    </radialGradient>
    <radialGradient id="core" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#4cc9ff"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <g fill="none" stroke="#74d8ff" stroke-width="2.4" opacity="0.95">
    <ellipse cx="32" cy="32" rx="25" ry="9.6"/>
    <ellipse cx="32" cy="32" rx="25" ry="9.6" transform="rotate(60 32 32)"/>
    <ellipse cx="32" cy="32" rx="25" ry="9.6" transform="rotate(120 32 32)"/>
  </g>
  <circle cx="32" cy="32" r="6" fill="url(#core)"/>
  <circle cx="52" cy="26" r="3" fill="#e8fcff"/>
  <circle cx="21" cy="14" r="3" fill="#e8fcff"/>
  <circle cx="20" cy="48" r="3" fill="#e8fcff"/>
</svg>
`
writeFileSync(resolve(PUBLIC_DIR, 'favicon.svg'), favicon, 'utf8')
console.log('✅ favicon.svg')
