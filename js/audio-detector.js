class AudioDetector {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.javascriptNode = null;
    this.onBlow = null;
    this.isDetecting = false;
    this.threshold = 60; // 吹气阈值
    this.blowCount = 0;
    this.requiredBlowFrames = 5; // 连续超过阈值的帧数
  }

  async init() {
    console.log("AudioDetector.init() 被调用");

    // 检查是否为调试模式
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("test") === "true") {
      console.log("测试模式：跳过 AudioContext 实例化");
      return true;
    }
    if (urlParams.get("debug") === "true") {
      console.log("调试模式：跳过麦克风检测");
      return true;
    }

    try {
      console.log("正在请求麦克风权限...");
      const stream = await this.getAudioStream();
      console.log("麦克风权限获取成功");
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);

      this.analyser.fftSize = 256;
      this.microphone.connect(this.analyser);

      this.isDetecting = true;
      this.detect();
      return true;
    } catch (err) {
      console.error("无法访问麦克风:", err);
      throw err;
    }
  }

  async getAudioStream() {
    if (!window.isSecureContext) {
      throw new Error("需要在 HTTPS 或 localhost 安全环境下访问麦克风");
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices.getUserMedia({ audio: true });
    }

    const legacyGetUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    if (!legacyGetUserMedia) {
      throw new Error("当前浏览器不支持麦克风访问");
    }

    return new Promise((resolve, reject) => {
      legacyGetUserMedia.call(navigator, { audio: true }, resolve, reject);
    });
  }

  detect() {
    if (!this.isDetecting) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // 计算平均音量
    let values = 0;
    for (let i = 0; i < dataArray.length; i++) {
      values += dataArray[i];
    }
    const average = values / dataArray.length;

    if (average > this.threshold) {
      this.blowCount++;
      if (this.blowCount >= this.requiredBlowFrames) {
        if (this.onBlow) this.onBlow();
        this.blowCount = 0; // 触发后重置
      }
    } else {
      this.blowCount = Math.max(0, this.blowCount - 1);
    }

    requestAnimationFrame(() => this.detect());
  }

  stop() {
    this.isDetecting = false;
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

window.AudioDetector = AudioDetector;
