import { SCREEN_WIDTH, SCREEN_HEIGHT, canvas } from './render.js';
import DataBus from './databus.js';
import Music from './runtime/music.js';

const GameGlobal = window.GameGlobal;

// ==================== 配置 ====================
const URINAL_MIN = 3;
const URINAL_MAX = 8;

/** 像素风配色 */
const C = {
  wall:       '#D4C5A9',
  wallLine:   '#C4B599',
  floor:      '#8B7D6B',
  floorLine:  '#7A6E5E',
  baseboard:  '#A0927A',
  urinalBody: '#F0F0F0',
  urinalBowl: '#D8D8D8',
  skin:       '#FFDAB9',
  pants:      '#4A4A4A',
  shoes:      '#333333',
  playerHat:  '#FF6B35',
  playerShirt:'#FF6B35',
  playerPants:'#4169E1',
  btnBg:      '#4A90D9',
  btnBorder:  '#357ABD',
  btnText:    '#FFFFFF',
  titleColor: '#555555',
};

const PRAISE = ['完美！','明智之选！','懂得都懂！','讲究！','标准答案！','稳！','真男人！','有品位！'];
const REJECT_MSG = ['？','…','?!','喂！','看啥呢'];

const NPC_STYLES = [
  { hat:'#4A90D9', shirt:'#3498DB', hair:'#8B4513' },
  { hat:'#E74C3C', shirt:'#E67E22', hair:'#2C1810' },
  { hat:'#2ECC71', shirt:'#1ABC9C', hair:'#FFD700' },
  { hat:'#9B59B6', shirt:'#F1C40F', hair:'#4A3728' },
  { hat:'#E91E63', shirt:'#00BCD4', hair:'#8B4513' },
  { hat:'#795548', shirt:'#607D8B', hair:'#2C1810' },
  { hat:'#FF9800', shirt:'#8BC34A', hair:'#5D4037' },
  { hat:'#673AB7', shirt:'#FF5722', hair:'#3E2723' },
  { hat:'#CDDC39', shirt:'#009688', hair:'#6D4C41' },
  { hat:'#03A9F4', shirt:'#FF4081', hair:'#4E342E' },
];

const PANTS_COLORS = ['#4A4A4A','#37474F','#5D4037','#455A64','#3E2723','#2E7D32','#1565C0','#6A1B9A'];
const SHOE_COLORS  = ['#333333','#1A1A1A','#4E342E','#37474F'];

/** 生成随机 NPC 完整外观（颜色 + 身高 + 体型 + 裤子/鞋颜色） */
function randomNPCstyle() {
  const base = NPC_STYLES[Math.floor(Math.random() * NPC_STYLES.length)];
  return {
    hat: base.hat,
    shirt: base.shirt,
    hair: base.hair,
    heightScale: 0.85 + Math.random() * 0.27,  // 0.85 ~ 1.12
    build: Math.floor(Math.random() * 3),       // 0=瘦, 1=正常, 2=壮
    pantsColor: PANTS_COLORS[Math.floor(Math.random() * PANTS_COLORS.length)],
    shoeColor: SHOE_COLORS[Math.floor(Math.random() * SHOE_COLORS.length)],
  };
}

/** 儿童 NPC 专属外观：明显矮小、偏瘦、色彩明亮 */
function randomChildStyle() {
  const childHats = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8C42'];
  const childShirts = ['#FFE082', '#A5D6A7', '#90CAF9', '#F48FB1', '#CE93D8'];
  const childHairs = ['#4E342E', '#5D4037', '#3E2723', '#FFCC80', '#FFAB91'];
  const childPants = ['#5D9CEC', '#48CFAD', '#ED5565', '#8CC152', '#A0D468'];
  const childShoes = ['#555555', '#666666'];
  return {
    hat: childHats[Math.floor(Math.random() * childHats.length)],
    shirt: childShirts[Math.floor(Math.random() * childShirts.length)],
    hair: childHairs[Math.floor(Math.random() * childHairs.length)],
    heightScale: 0.55 + Math.random() * 0.1,   // 0.55 ~ 0.65，明显矮小
    build: 0,                                   // 始终瘦型
    pantsColor: childPants[Math.floor(Math.random() * childPants.length)],
    shoeColor: childShoes[Math.floor(Math.random() * childShoes.length)],
  };
}

// ==================== 场景亮度 ====================
const BRIGHTNESS_LEVELS = [
  { name: '正常亮', overlay: null },                     // 0
  { name: '半亮',   overlay: 'rgba(230,160,60,0.10)' },  // 1 - 傍晚/黎明
  { name: '昏暗',   overlay: 'rgba(5,10,35,0.42)' },     // 2 - 晚上
];
// ==================== 隔板模式 ====================
const PARTITION_NONE = 0;
const PARTITION_SHORT = 1;
const PARTITION_LONG = 2;

// ==================== 布局常量（基于 SCREEN_HEIGHT）====================
/** 地板起始 Y（墙壁占比 78%） */
const FLOOR_Y = SCREEN_HEIGHT * 0.78;
/** 人物总高度（帽顶 → 脚底） */
const PERSON_H = Math.round(SCREEN_HEIGHT * 0.285);
/** 人物半宽 */
const PHW = 18;
/** 尿兜尺寸 */
const URINAL_W = 54;
const URINAL_H = 54;
/** 尿兜顶部 Y（安装在墙上，碗底在地板之上约 32px 处） */
const URINAL_TOP = FLOOR_Y - URINAL_H - 28;
/** 儿童尿兜尺寸（约为正常的 60%） */
const CHILD_URINAL_W = Math.round(URINAL_W * 0.6);
const CHILD_URINAL_H = Math.round(URINAL_H * 0.6);
/** 儿童尿兜顶部 Y（底部与普通尿兜对齐） */
const CHILD_URINAL_TOP = FLOOR_Y - CHILD_URINAL_H - 28;
const CHILD_NONE = 0;
const CHILD_LEFT = 1;
const CHILD_RIGHT = 2;
/** 人物脚底 Y（站在地板上） */
const PERSON_FEET = URINAL_TOP + URINAL_H + 10;
/** 人物中心 Y（脚底 - 半高） */
const PERSON_CY = PERSON_FEET - PERSON_H / 2;

// ==================== 工具 ====================
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ==================== 主类 ====================
export default class Main {
  constructor() {
    GameGlobal.databus = new DataBus();
    this.music = new Music();
    this.brightness = 0;        // 当前场景亮度
    this.partitionType = PARTITION_NONE; // 当前隔板类型
    this.signMode = 0;          // 当前标语模式
    this.childUrinalPos = CHILD_NONE; // 当前儿童尿兜位置
    this.endureCount = 0;       // 连续"忍"的次数
    this.initScene();
    this.bindTouch();
    this.loop();
  }

  // ---------- 场景生成 ----------
  initScene() {
    const db = GameGlobal.databus;
    const count = URINAL_MIN + Math.floor(Math.random() * (URINAL_MAX - URINAL_MIN + 1));
    // 场景亮度
    this.brightness = Math.floor(Math.random() * BRIGHTNESS_LEVELS.length);
    // 隔板类型：0=无, 1=短, 2=长
    this.partitionType = Math.floor(Math.random() * 3);
    // 标语模式
    this.signMode = Math.floor(Math.random() * 3); // 0=无, 1=小标语, 2=大标语
    // 儿童尿兜：0=无, 1=最左侧, 2=最右侧
    this.childUrinalPos = Math.floor(Math.random() * 3);

    // 等距排列尿兜（左右留边）
    const spacing = Math.min((SCREEN_WIDTH - 60) / count, 130);
    const totalW = spacing * (count - 1);
    const startX = (SCREEN_WIDTH - totalW) / 2;

    const urinals = [];

    // 新逻辑：总人数 M = 0 ~ count-2，再随机分配
    const peopleCount = Math.floor(Math.random() * (count - 1)); // 0 ~ count-2
    const occupiedSlots = new Array(count).fill(false);
    // 随机选 M 个不同位置设为有人
    const candidates = Array.from({ length: count }, (_, i) => i);
    for (let pick = 0; pick < peopleCount; pick++) {
      const idx = Math.floor(Math.random() * candidates.length);
      occupiedSlots[candidates[idx]] = true;
      candidates.splice(idx, 1);
    }

    for (let i = 0; i < count; i++) {
      const occupied = occupiedSlots[i];
      const isChild = (this.childUrinalPos === CHILD_LEFT && i === 0)
        || (this.childUrinalPos === CHILD_RIGHT && i === count - 1);
      const uw = isChild ? CHILD_URINAL_W : URINAL_W;
      const uh = isChild ? CHILD_URINAL_H : URINAL_H;
      const utop = isChild ? CHILD_URINAL_TOP : URINAL_TOP;

      // 儿童 NPC 使用专属小孩外观
      let style = occupied ? (isChild ? randomChildStyle() : randomNPCstyle()) : null;

      urinals.push({
        id: i,
        // 尿兜本身的矩形（用于命中检测、绘制）
        x: startX + i * spacing - uw / 2,
        y: utop,
        width: uw,
        height: uh,
        occupied,
        style,
        // 人物背向站立，中心 X 与尿兜中心对齐
        cx: startX + i * spacing,
        personIdlePhase: Math.random() * Math.PI * 2,
        // 标语：模式1=每个尿兜小标语
        hasSign: this.signMode === 1,
        isChild,
      });
    }

    db.urinals = urinals;
    db.bubble = null;
    db.playerAnim = null;
    db.rejectAnim = null;
    db.explosion = null;
    db.state = 'IDLE';
    db.frame = 0;
  }

  // ---------- 触摸 ----------
  bindTouch() {
    // 首次用户交互时启动背景音乐（绕过浏览器 Autoplay Policy）
    const startAudio = () => {
      this.music.startAmbientOnGesture();
      document.removeEventListener('pointerdown', startAudio);
      document.removeEventListener('touchstart', startAudio);
    };
    document.addEventListener('pointerdown', startAudio);
    document.addEventListener('touchstart', startAudio, { passive: true });

    const handler = (e) => {
      e.preventDefault();
      const clientX = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
      const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
      this.handleTap(clientX, clientY);
    };
    canvas.addEventListener('pointerdown', handler);
    canvas.addEventListener('touchstart', handler, { passive: false });
  }

  handleTap(x, y) {
    const db = GameGlobal.databus;

    if (db.state === 'IDLE') {
      // "忍一时风平浪静" 跳过按钮
      const skipBx = SCREEN_WIDTH / 2 - 100;
      const skipBy = SCREEN_HEIGHT - 60;
      if (x >= skipBx && x <= skipBx + 200 && y >= skipBy && y <= skipBy + 44) {
        this.endureCount++;
        if (this.endureCount >= 4) {
          // 第四次忍：爆炸效果
          this.endureCount = 0;
          db.state = 'EXPLODING';
          db.explosion = { frame: 0, maxFrames: 80 };
          return;
        }
        this.initScene();
        return;
      }

      for (const u of db.urinals) {
        // 点击区域：尿兜 + 前方人物站立范围
        const hx = x >= u.x - 10 && x <= u.x + u.width + 10;
        const hy = y >= u.y - 10 && y <= PERSON_FEET + 10;
        if (!hx || !hy) continue;

        // 点击尿兜即"不忍"，清空忍次数
        this.endureCount = 0;

        if (!u.occupied) {
          // 成功
          db.state = 'ANIMATING';
          db.playerAnim = {
            progress: 0,
            targetCx: u.cx,
          };
          db.bubble = null;
        } else {
          // 拒绝
          db.state = 'REJECTING';
          db.rejectAnim = { urinalId: u.id, timer: 50 };
          const msg = REJECT_MSG[Math.floor(Math.random() * REJECT_MSG.length)];
          const npcScale = u.style ? u.style.heightScale || 1 : 1;
          db.bubble = {
            text: msg,
            x: u.cx,
            y: Math.round(PERSON_FEET - 94 * npcScale - 10),
            timer: 45,
            isReject: true,
          };
          this.music.playReject();
        }
        break;
      }
    } else if (db.state === 'DONE') {
      const bx = SCREEN_WIDTH / 2 - 70;
      const by = SCREEN_HEIGHT - 60;
      if (x >= bx && x <= bx + 140 && y >= by && y <= by + 44) {
        this.initScene();
      }
    }
  }

  // ---------- 更新 ----------
  update() {
    const db = GameGlobal.databus;
    db.frame++;

    if (db.state === 'ANIMATING' && db.playerAnim) {
      db.playerAnim.progress += 0.035;
      if (db.playerAnim.progress >= 1) {
        db.playerAnim.progress = 1;
        db.state = 'DONE';
        const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        const target = db.urinals.find(u => u.cx === db.playerAnim.targetCx);
        db.bubble = {
          text: msg,
          x: target.cx,
          y: PERSON_FEET - 111,
          timer: 9999,
          isReject: false,
        };
        this.music.playSuccess();
      }
    }

    if (db.state === 'REJECTING' && db.rejectAnim) {
      db.rejectAnim.timer--;
      if (db.rejectAnim.timer <= 0) {
        db.state = 'IDLE';
        db.rejectAnim = null;
        db.bubble = null;
      }
    }

    if (db.bubble && db.bubble.isReject) {
      db.bubble.timer--;
      if (db.bubble.timer <= 0) db.bubble = null;
    }

    // 爆炸动画更新
    if (db.state === 'EXPLODING' && db.explosion) {
      db.explosion.frame++;
      if (db.explosion.frame >= db.explosion.maxFrames) {
        this.initScene();
      }
    }
  }

  // ==================== 渲染 ====================
  render(ctx) {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // ① 背景（墙 + 地板）
    this.drawBackground(ctx);
    // ② 隔板（在墙和尿兜之间）
    if (this.partitionType !== PARTITION_NONE) this.drawPartitions(ctx);
    // ③ 大标语（模式2，墙上先绘制，避免挡人）
    if (this.signMode === 2) this.drawBigSign(ctx);
    // ④ 尿兜（安装在墙上）
    this.drawUrinals(ctx);
    // ⑤ 占位 NPC（站在尿兜前，背对镜头）
    this.drawNPCs(ctx);
    // ⑥ 玩家角色（选择后从左侧走入）
    if (GameGlobal.databus.state === 'ANIMATING' || GameGlobal.databus.state === 'DONE') {
      this.drawPlayer(ctx);
    }
    // ⑦ 气泡
    if (GameGlobal.databus.bubble) this.drawBubble(ctx, GameGlobal.databus.bubble);
    // ⑧ 场景亮度遮罩
    const overlay = BRIGHTNESS_LEVELS[this.brightness].overlay;
    if (overlay) {
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
    // ⑨ 爆炸效果（覆盖在其他图层之上）
    if (GameGlobal.databus.state === 'EXPLODING') {
      this.drawExplosion(ctx);
      return; // 爆炸时不再绘制其他 UI
    }
    // ⑩ UI（提示 + 按钮）
    this.drawUI(ctx);
  }

  // ==================== 背景 ====================
  drawBackground(ctx) {
    // 墙壁
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, SCREEN_WIDTH, FLOOR_Y);

    // 墙砖网格（横缝通长，竖缝错开模拟真实瓷砖）
    ctx.strokeStyle = C.wallLine;
    ctx.lineWidth = 1.2;
    const tileH = 26, tileW = 40;
    for (let y = 0; y < FLOOR_Y; y += tileH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SCREEN_WIDTH, y);
      ctx.stroke();
    }
    for (let x = 0; x < SCREEN_WIDTH; x += tileW) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FLOOR_Y);
      ctx.stroke();
    }

    // 踢脚线
    ctx.fillStyle = C.baseboard;
    ctx.fillRect(0, FLOOR_Y - 8, SCREEN_WIDTH, 8);

    // 地板
    ctx.fillStyle = C.floor;
    ctx.fillRect(0, FLOOR_Y, SCREEN_WIDTH, SCREEN_HEIGHT - FLOOR_Y);

    // 地板砖缝
    ctx.strokeStyle = C.floorLine;
    ctx.lineWidth = 1;
    const ftH = 16, ftW = 48;
    for (let y = FLOOR_Y; y < SCREEN_HEIGHT; y += ftH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SCREEN_WIDTH, y);
      ctx.stroke();
    }
    for (let x = 0; x < SCREEN_WIDTH; x += ftW) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y);
      ctx.lineTo(x, SCREEN_HEIGHT);
      ctx.stroke();
    }
  }

  /** 绘制隔板（在每个尿兜之间） */
  drawPartitions(ctx) {
    const urinals = GameGlobal.databus.urinals;
    const partW = 7;
    const isShort = this.partitionType === PARTITION_SHORT;

    // 长隔板：从尿兜顶部延伸到地板附近
    // 短隔板：从尿兜中部延伸到地板附近
    const partTop = isShort ? (URINAL_TOP + URINAL_H * 0.45) : (URINAL_TOP - 4);
    const partBot = FLOOR_Y - 6;
    const partH = partBot - partTop;

    for (let i = 0; i < urinals.length - 1; i++) {
      const midX = (urinals[i].cx + urinals[i + 1].cx) / 2;
      const px = midX - partW / 2;

      // 隔板主体（浅灰色金属质感）
      ctx.fillStyle = '#C8C0B0';
      ctx.fillRect(px, partTop, partW, partH);

      // 隔板顶部圆角处理（让顶端看起来更自然）
      ctx.fillStyle = '#D8D0C0';
      ctx.fillRect(px, partTop, 2, partH);
      // 边缘阴影
      ctx.fillStyle = '#B0A898';
      ctx.fillRect(px + partW - 2, partTop, 2, partH);

      // 额外的金属质感装饰线（短隔板顶部加一条横线）
      if (isShort) {
        ctx.fillStyle = '#A09888';
        ctx.fillRect(px, partTop, partW, 2);
      }
    }
  }

  // ==================== 尿兜 ====================
  drawUrinals(ctx) {
    for (const u of GameGlobal.databus.urinals) {
      const { x, y, w, h, isChild } = { x: u.x, y: u.y, w: u.width, h: u.height, isChild: u.isChild || false };
      // 儿童尿兜比例缩放因子
      const s = isChild ? 0.6 : 1;

      // 陶瓷主体（靠墙安装）
      ctx.fillStyle = isChild ? '#E8F0FF' : C.urinalBody;
      ctx.fillRect(x, y, w, h);

      // 外边框
      ctx.strokeStyle = '#D0D0D0';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);

      // 排水盆（椭圆形凹陷）
      ctx.fillStyle = isChild ? '#D0D8E8' : C.urinalBowl;
      const bx = x + Math.round(8 * s), by = y + Math.round(12 * s);
      const bw = w - Math.round(16 * s), bh = h - Math.round(22 * s);
      roundRect(ctx, bx, by, bw, bh, Math.round(7 * s));
      ctx.fill();

      // 盆内更深色
      ctx.fillStyle = '#C8C8C8';
      roundRect(ctx, bx + Math.round(4 * s), by + Math.round(4 * s),
        bw - Math.round(8 * s), bh - Math.round(8 * s), Math.round(5 * s));
      ctx.fill();

      // 最底部排水孔
      ctx.fillStyle = '#B0B0B0';
      ctx.fillRect(x + w / 2 - Math.round(3 * s), y + h - Math.round(10 * s),
        Math.round(6 * s), Math.round(4 * s));

      // 上沿高光
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(x + Math.round(5 * s), y + Math.round(2 * s),
        w - Math.round(10 * s), Math.round(4 * s));

      // 左右装饰线
      ctx.strokeStyle = '#C0C0C0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + Math.round(8 * s));
      ctx.lineTo(x, y + h - Math.round(8 * s));
      ctx.moveTo(x + w, y + Math.round(8 * s));
      ctx.lineTo(x + w, y + h - Math.round(8 * s));
      ctx.stroke();

      // 入墙水管暗示
      ctx.fillStyle = '#A0A0A0';
      ctx.fillRect(x + w / 2 - Math.round(5 * s), y - Math.round(3 * s),
        Math.round(10 * s), Math.round(5 * s));

      // ---- 每个尿兜独立的小标语牌 ----
      if (u.hasSign) {
        const sw = Math.round(32 * s), sh = Math.round(13 * s);
        const sx = x + (w - sw) / 2;
        const sy = y - sh - Math.round(4 * s); // 尿兜上方墙壁

        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(sx + 1, sy + 1, sw, sh);

        // 牌匾
        ctx.fillStyle = '#FFF8DC';
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, sw, sh);

        // 模拟文字行（像素风格小线段）
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(sx + Math.round(4 * s), sy + Math.round(2 * s),
          sw - Math.round(8 * s), Math.round(2 * s));
        ctx.fillRect(sx + Math.round(4 * s), sy + Math.round(8 * s),
          sw - Math.round(8 * s), Math.round(2 * s));
      }
    }
  }

  // ==================== NPC（背向） ====================
  drawNPCs(ctx) {
    for (const u of GameGlobal.databus.urinals) {
      if (!u.occupied) continue;

      const bob = Math.sin(GameGlobal.databus.frame * 0.04 + u.personIdlePhase) * 1.5;
      const isReject = GameGlobal.databus.rejectAnim && GameGlobal.databus.rejectAnim.urinalId === u.id;
      const turn = isReject ? Math.min((50 - GameGlobal.databus.rejectAnim.timer) / 20, 1) : 0;

      this.drawPersonBack(ctx, u.cx, PERSON_FEET + bob, u.style, turn);
    }
  }

  /**
   * 绘制背向人物（站在尿兜前，背朝观众）
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx  - 人物水平中心
   * @param {number} feetY - 脚底 Y
   * @param {object} style - 完整外观：{hat, shirt, hair, heightScale, build, pantsColor, shoeColor}
   * @param {number} turn - 转头程度 0~1
   */
  drawPersonBack(ctx, cx, feetY, style, turn = 0) {
    const s = style || randomNPCstyle();
    const scale = s.heightScale || 1;
    // 体型宽度因子: 0=瘦 1=正常 2=壮
    const buildFactors = [0.78, 1.0, 1.28];
    const bf = buildFactors[s.build] || 1.0;

    const h = 88 * scale;         // 实际身高（身体各部位总和为88px）
    const hw = PHW * bf;          // 实际半宽

    // ---------- y 坐标换算（按身高缩放） ----------
    const hatTop   = feetY - h;
    const headTop  = hatTop + 8 * scale;
    const neckTop  = headTop + 16 * scale;
    const bodyTop  = neckTop + 4 * scale;
    const bodyBot  = bodyTop + 36 * scale;
    const legTop   = bodyBot;
    const legBot   = legTop + 18 * scale;
    const shoeBot  = legBot + 6 * scale;

    // 微步偏移（待机时轻微重心移动）
    const shift = Math.sin(GameGlobal.databus.frame * 0.03 + (cx * 0.1)) * 1.5;
    const turnOff = turn * 6;

    // 上装尺寸（随体型缩放）
    const shoulderW = Math.round((hw + 4) * bf);
    const waistW    = Math.round((hw - 2) * bf);
    const armLen    = Math.round(28 * scale);
    const armW      = Math.round(6 * bf);

    // ---------- 绘制 ----------
    // 鞋
    ctx.fillStyle = s.shoeColor || C.shoes;
    ctx.fillRect(cx - Math.round(8 * bf) + shift, legBot, Math.round(7 * bf), Math.round(shoeBot - legBot));
    ctx.fillRect(cx + Math.round(1 * bf) + shift, legBot, Math.round(7 * bf), Math.round(shoeBot - legBot));

    // 裤腿
    ctx.fillStyle = s.pantsColor || C.pants;
    const legW = Math.round(8 * bf);
    ctx.fillRect(cx - Math.round(9 * bf) + shift, legTop, legW, Math.round(legBot - legTop));
    ctx.fillRect(cx + Math.round(1 * bf) + shift, legTop, legW, Math.round(legBot - legTop));

    // 上衣身体（倒梯形）
    ctx.fillStyle = s.shirt;
    ctx.beginPath();
    ctx.moveTo(cx - shoulderW + shift, bodyTop);
    ctx.lineTo(cx + shoulderW + shift, bodyTop);
    ctx.lineTo(cx + waistW + shift, bodyBot);
    ctx.lineTo(cx - waistW + shift, bodyBot);
    ctx.closePath();
    ctx.fill();

    // 手臂
    ctx.fillStyle = s.shirt;
    const armSwing = turn * 3;
    ctx.fillRect(cx - shoulderW - armW + shift, bodyTop + 2 * scale - armSwing, armW + 1, armLen);
    ctx.fillRect(cx + shoulderW - 1 + shift, bodyTop + 2 * scale, armW + 1, armLen);

    // 手
    ctx.fillStyle = C.skin;
    ctx.fillRect(cx - shoulderW - armW + 1 + shift, bodyTop + (28 * scale) - armSwing, armW - 1, Math.round(6 * scale));
    ctx.fillRect(cx + shoulderW - 1 + shift, bodyTop + (28 * scale), armW - 1, Math.round(6 * scale));

    // 脖子
    ctx.fillStyle = C.skin;
    ctx.fillRect(cx - Math.round(4 * bf) + shift, neckTop, Math.round(8 * bf), Math.round(bodyTop - neckTop));

    // 头（背向）
    const headW = Math.round(20 * bf);
    const headH = Math.round(18 * scale);
    ctx.fillRect(cx - headW / 2 + turnOff + shift, headTop, headW, headH);

    // 后脑头发
    ctx.fillStyle = s.hair;
    ctx.fillRect(cx - headW / 2 + 1 + turnOff + shift, headTop + 1, headW - 2, Math.round(5 * scale));

    // 帽子
    ctx.fillStyle = s.hat;
    const hatW = Math.round(22 * bf);
    const hatH = Math.round(8 * scale);
    const brimW = Math.round(16 * bf);
    const brimH = Math.round(6 * scale);
    if (turn > 0.2) {
      ctx.fillRect(cx - hatW / 2 + turnOff + shift, hatTop, hatW, hatH);
      ctx.fillRect(cx - brimW / 2 + turnOff + shift, hatTop - brimH, brimW, brimH);
    } else {
      ctx.fillRect(cx - hatW / 2 + shift, hatTop, hatW, hatH);
      ctx.fillRect(cx - brimW / 2 + shift, hatTop - brimH, brimW, brimH);
    }

    // 转头表情
    if (turn > 0.4) {
      ctx.fillStyle = '#333';
      ctx.fillRect(cx + 3 + turnOff + shift, headTop + 6 * scale, 4, Math.round(3 * scale));
      ctx.fillRect(cx + 3 + turnOff + shift, headTop + 13 * scale, 4, Math.round(2 * scale));
    }
  }

  // ==================== 玩家（从左侧走入） ====================
  drawPlayer(ctx) {
    const anim = GameGlobal.databus.playerAnim;
    if (!anim) return;

    const p = anim.progress;
    // 缓动
    const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const startX = -PHW - 20;
    const endX = anim.targetCx;
    const cx = startX + (endX - startX) * ease;
    const feetY = PERSON_FEET;

    // 行走起伏 + 手臂摆动
    const walkBob = p < 1 ? Math.sin(p * Math.PI * 5) * 2.5 : 0;
    const armSw = p < 1 ? Math.sin(p * Math.PI * 5) * 5 : 0;

    const h = 96;                    // 实际绘制总高度（各部分和为96px）
    const hw = PHW;
    const hatTop   = feetY - h + walkBob;
    const headTop  = hatTop + 8;
    const neckTop  = headTop + 18;
    const bodyTop  = neckTop + 4;
    const bodyBot  = bodyTop + 40;
    const legTop   = bodyBot;
    const legBot   = legTop + 20;

    // 鞋
    ctx.fillStyle = C.shoes;
    ctx.fillRect(cx - 8, legBot, 7, 6);
    ctx.fillRect(cx + 1, legBot, 7, 6);

    // 裤腿（浅蓝色牛仔裤）
    ctx.fillStyle = C.playerPants;
    ctx.fillRect(cx - 9, legTop, 8, legBot - legTop);
    ctx.fillRect(cx + 1, legTop, 8, legBot - legTop);

    // 上衣
    ctx.fillStyle = C.playerShirt;
    const shoulderW = hw + 4;
    const waistW = hw - 2;
    ctx.beginPath();
    ctx.moveTo(cx - shoulderW, bodyTop);
    ctx.lineTo(cx + shoulderW, bodyTop);
    ctx.lineTo(cx + waistW, bodyBot);
    ctx.lineTo(cx - waistW, bodyBot);
    ctx.closePath();
    ctx.fill();

    // 手臂（摆动）
    ctx.fillStyle = C.playerShirt;
    ctx.fillRect(cx - shoulderW - 4, bodyTop + 2 - armSw, 6, 30);
    ctx.fillRect(cx + shoulderW - 2, bodyTop + 2 + armSw, 6, 30);

    // 手
    ctx.fillStyle = C.skin;
    ctx.fillRect(cx - shoulderW - 3, bodyTop + 28 - armSw, 5, 6);
    ctx.fillRect(cx + shoulderW - 1, bodyTop + 28 + armSw, 5, 6);

    // 脖子
    ctx.fillStyle = C.skin;
    ctx.fillRect(cx - 4, neckTop, 8, bodyTop - neckTop);

    // 头
    ctx.fillStyle = C.skin;
    ctx.fillRect(cx - 10, headTop, 20, 18);

    // 头发
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(cx - 9, headTop + 1, 18, 5);

    // 棒球帽
    ctx.fillStyle = C.playerHat;
    ctx.fillRect(cx - 11, hatTop, 22, 8);
    ctx.fillRect(cx - 8, hatTop - 5, 16, 6);

    // 帽檐（朝右，朝向尿兜方向）
    ctx.fillRect(cx + 6, hatTop - 3, 9, 4);
  }

  // ==================== 气泡 ====================
  drawBubble(ctx, bubble) {
    const { text, x, y, isReject, timer } = bubble;

    let alpha = 1;
    if (isReject && timer < 12) alpha = timer / 12;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.font = 'bold 17px sans-serif';
    const tw = ctx.measureText(text).width;
    const bw = Math.max(tw + 24, 54);
    const bh = 32;
    const bx = x - bw / 2;
    const by = y - bh;

    // 背景
    ctx.fillStyle = isReject ? '#FFF3E0' : '#E8F5E9';
    ctx.strokeStyle = isReject ? '#FF9800' : '#66BB6A';
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    // 三角尾巴
    ctx.fillStyle = isReject ? '#FFF3E0' : '#E8F5E9';
    ctx.beginPath();
    ctx.moveTo(x - 5, by + bh);
    ctx.lineTo(x + 5, by + bh);
    ctx.lineTo(x, by + bh + 8);
    ctx.closePath();
    ctx.fill();

    // 文字
    ctx.fillStyle = isReject ? '#E65100' : '#2E7D32';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, by + bh / 2);

    ctx.restore();
  }

  /** 绘制统一大标语 */
  drawBigSign(ctx) {
    const cx = SCREEN_WIDTH / 2;
    const signW = 150;
    const signH = 36;
    const signX = cx - signW / 2;
    const signY = URINAL_TOP - 54;

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    roundRect(ctx, signX + 2, signY + 2, signW, signH, 5);
    ctx.fill();

    // 牌匾底色
    ctx.fillStyle = '#FFF8DC';
    roundRect(ctx, signX, signY, signW, signH, 5);
    ctx.fill();

    // 边框
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1.5;
    roundRect(ctx, signX, signY, signW, signH, 5);
    ctx.stroke();

    // 内框装饰线
    ctx.strokeStyle = '#C8B898';
    ctx.lineWidth = 1;
    roundRect(ctx, signX + 4, signY + 4, signW - 8, signH - 8, 3);
    ctx.stroke();

    // 文字
    ctx.fillStyle = '#5D4037';
    ctx.textAlign = 'center';
    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('向前一小步', cx, signY + 12);
    ctx.fillText('文明一大步', cx, signY + signH - 10);
  }

  // ==================== 爆炸效果 ====================
  drawExplosion(ctx) {
    const exp = GameGlobal.databus.explosion;
    if (!exp) return;
    const progress = Math.min(exp.frame / exp.maxFrames, 1);

    // 屏幕闪烁（前 15 帧白色闪烁）
    if (exp.frame < 15) {
      ctx.fillStyle = `rgba(255,255,255,${1 - exp.frame / 15})`;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    // 爆炸冲击波（径向扩散圆环）
    const cx = SCREEN_WIDTH / 2;
    const cy = SCREEN_HEIGHT / 2;
    const maxRadius = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.7;
    const radius = progress * maxRadius;

    // 外圈光晕
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const alpha = progress < 0.3 ? 1 : Math.max(0, 1 - (progress - 0.3) / 0.7);
    grad.addColorStop(0, `rgba(255,200,50,${alpha * 0.8})`);
    grad.addColorStop(0.5, `rgba(255,100,0,${alpha * 0.5})`);
    grad.addColorStop(1, `rgba(200,50,0,0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 内圈明亮核心
    if (progress < 0.4) {
      const coreAlpha = Math.max(0, 1 - progress / 0.4);
      ctx.fillStyle = `rgba(255,255,200,${coreAlpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 粒子效果（小方块飞溅）
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + progress * 0.5;
      const dist = radius * (0.4 + progress * 0.8);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const size = 3 + Math.random() * 4;
      const colors = ['#FF6B35', '#FFD700', '#FF4500', '#FF8C00', '#FFFF00'];
      ctx.globalAlpha = (1 - progress) * 0.9;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(px, py, size, size);
    }
    ctx.restore();

    // 屏幕震动（前 30 帧）
    if (exp.frame < 30) {
      const shake = (30 - exp.frame) * 0.8;
      ctx.fillStyle = 'rgba(0,0,0,0)'; // placeholder for shake visual
    }

    // "忍不住啦！" 文字（从第 20 帧开始显示）
    if (exp.frame >= 20) {
      const textAlpha = Math.min(1, (exp.frame - 20) / 15);
      const scale = 1 + Math.sin(exp.frame * 0.1) * 0.05;
      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 48px sans-serif';
      ctx.strokeStyle = '#CC3300';
      ctx.lineWidth = 6;
      ctx.strokeText('忍不住啦！', 0, 0);
      ctx.fillStyle = '#FF4444';
      ctx.fillText('忍不住啦！', 0, 0);
      ctx.restore();
    }
  }

  // ==================== UI ====================
  drawUI(ctx) {
    const db = GameGlobal.databus;

    if (db.state === 'IDLE') {
      // 显示连续"忍"的次数（左上角）
      if (this.endureCount > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        roundRect(ctx, 8, 8, 74, 30, 8);
        ctx.fill();

        ctx.fillStyle = '#E65100';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`忍 ×${this.endureCount}`, 18, 23);
      }

      ctx.fillStyle = C.titleColor;
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('点击选择一个空位...', SCREEN_WIDTH / 2, 16);

      // "忍一时风平浪静" 跳过按钮
      const bx = SCREEN_WIDTH / 2 - 100;
      const by = SCREEN_HEIGHT - 60;
      const bw = 200, bh = 44;

      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      roundRect(ctx, bx + 2, by + 2, bw, bh, 10);
      ctx.fill();

      ctx.fillStyle = '#8E8E8E';
      roundRect(ctx, bx, by, bw, bh, 10);
      ctx.fill();
      ctx.strokeStyle = '#6E6E6E';
      ctx.lineWidth = 2;
      roundRect(ctx, bx, by, bw, bh, 10);
      ctx.stroke();

      ctx.fillStyle = C.btnText;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('忍一时风平浪静', SCREEN_WIDTH / 2, by + bh / 2);
    }

    if (db.state === 'DONE') {
      const bx = SCREEN_WIDTH / 2 - 70;
      const by = SCREEN_HEIGHT - 60;
      const bw = 140, bh = 44;

      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      roundRect(ctx, bx + 2, by + 2, bw, bh, 10);
      ctx.fill();

      ctx.fillStyle = C.btnBg;
      roundRect(ctx, bx, by, bw, bh, 10);
      ctx.fill();
      ctx.strokeStyle = C.btnBorder;
      ctx.lineWidth = 2;
      roundRect(ctx, bx, by, bw, bh, 10);
      ctx.stroke();

      ctx.fillStyle = C.btnText;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('下一泡', SCREEN_WIDTH / 2, by + bh / 2);
    }
  }

  // ==================== 主循环 ====================
  loop() {
    this.update();
    const ctx = canvas.getContext('2d');
    this.render(ctx);
    requestAnimationFrame(() => this.loop());
  }
}
