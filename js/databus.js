/**
 * 游戏状态管理器
 * 状态机: IDLE -> ANIMATING(成功动画) -> DONE
 *        IDLE -> REJECTING(拒绝动画) -> IDLE
 *        DONE -> (点击重来) -> IDLE
 */
let instance;

export default class DataBus {
  constructor() {
    if (instance) return instance;
    instance = this;
    this.reset();
  }

  reset() {
    this.state = 'IDLE'; // IDLE | ANIMATING | REJECTING | DONE
    this.urinals = [];           // 尿兜数组
    this.playerAnim = null;      // 玩家动画状态
    this.rejectAnim = null;      // 被拒动画状态
    this.bubbles = [];           // 气泡文字数组
    this.isPervert = false;      // 是否为变态模式（类型2/3）
    this.frame = 0;
  }
}
