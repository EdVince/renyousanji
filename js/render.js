const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
GameGlobal.canvas = canvas;

// 尝试锁定横屏方向（支持的浏览器会自动切换，不支持的静默失败）
if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock('landscape').catch(() => {});
}

let SCREEN_WIDTH, SCREEN_HEIGHT;

function resize() {
  const vpw = window.innerWidth;
  const vph = window.innerHeight;
  const isPortrait = vph > vpw;

  // 游戏始终以横屏渲染：宽 = 较长边，高 = 较短边
  SCREEN_WIDTH = Math.max(vpw, vph);
  SCREEN_HEIGHT = Math.min(vpw, vph);

  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;

  if (isPortrait) {
    // 竖屏：画布旋转 90° 填满屏幕
    canvas.style.cssText = `
      position: fixed;
      display: block;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(90deg);
    `;
  } else {
    // 横屏：直接铺满
    canvas.style.cssText = `
      position: fixed;
      display: block;
      top: 0;
      left: 0;
    `;
  }
}

resize();
window.addEventListener('resize', resize);

/** 将视口坐标（clientX/Y）映射为画布游戏坐标 */
export function viewportToCanvas(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const isPortrait = window.innerHeight > window.innerWidth;

  if (isPortrait) {
    // 竖屏：画布经 CSS rotate(90deg)（顺时针）旋转后铺满视口。
    // 由前向变换  viewport = (height - cy, cx)  反解得：
    //   canvas x = ny * width
    //   canvas y = (1 - nx) * height
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    return {
      x: Math.round(canvas.width * ny),
      y: Math.round(canvas.height * (1 - nx)),
    };
  } else {
    // 横屏：线性映射
    return {
      x: Math.round((clientX - rect.left) * (canvas.width / rect.width)),
      y: Math.round((clientY - rect.top) * (canvas.height / rect.height)),
    };
  }
}

export { canvas, SCREEN_WIDTH, SCREEN_HEIGHT };
