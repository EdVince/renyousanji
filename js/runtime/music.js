let instance;

export default class Music {
  constructor() {
    if (instance) return instance;
    instance = this;

    this.ambientAudio = new Audio('audio/bgm.mp3');
    this.successAudio = new Audio('audio/bullet.mp3');
    this.rejectAudio = new Audio('audio/boom.mp3');

    this.ambientAudio.loop = true;
    this.ambientAudio.volume = 0.2;
    this.successAudio.volume = 1.0;
    this.rejectAudio.volume = 0.8;

    this._started = false;
  }

  /** 在用户手势中启动背景音乐（浏览器 Autoplay Policy 要求） */
  startAmbientOnGesture() {
    if (this._started) return;
    this._started = true;
    const p = this.ambientAudio.play();
    if (p && p.catch) p.catch(() => {});
  }

  playAmbient() {
    const p = this.ambientAudio.play();
    if (p && p.catch) p.catch(() => {});
  }

  stopAmbient() {
    this.ambientAudio.pause();
    this.ambientAudio.currentTime = 0;
  }

  playSuccess() {
    this.successAudio.currentTime = 0;
    const p = this.successAudio.play();
    if (p && p.catch) p.catch(() => {});
  }

  playReject() {
    this.rejectAudio.currentTime = 0;
    const p = this.rejectAudio.play();
    if (p && p.catch) p.catch(() => {});
  }
}
