const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;display:block';
document.body.appendChild(canvas);
GameGlobal.canvas = canvas;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

export { canvas, SCREEN_WIDTH, SCREEN_HEIGHT };
