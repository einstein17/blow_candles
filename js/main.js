document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const startBtn = document.getElementById("start-btn");
  const plusBtn = document.getElementById("plus-btn");
  const minusBtn = document.getElementById("minus-btn");
  const blowHint = document.getElementById("blow-hint");
  const audioToggle = document.getElementById("audio-toggle");
  const birthdayAudio = document.getElementById("birthday-audio");
  const cakeSelectors = document.querySelectorAll(".selector-item");
  const isTestMode =
    new URLSearchParams(window.location.search).get("test") === "true";
  const isLocalTestMode =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const audioDetector = new window.AudioDetector();
  const interactionManager = new window.InteractionManager();
  const effectsManager = new window.EffectsManager();

  // 暴露给测试脚本
  window.audioDetector = audioDetector;

  let isBlown = false;
  let isAudioMuted = false;
  let hasUserActivatedAudio = false;
  const audioStartOffset = 3;

  if (isLocalTestMode) {
    blowHint.textContent = "🧪 测试模式（本地访问）";
    blowHint.classList.remove("hidden");
  }

  // 初始化
  interactionManager.init();

  // 开始按钮点击
  startBtn.addEventListener("click", async (e) => {
    if (e) e.preventDefault();
    console.log("开始按钮被点击，正在初始化音频检测器...");

    // 预先解锁音频播放能力（移动端需要用户手势）
    try {
      await unlockAudio();
    } catch (err) {
      console.warn("音频解锁失败:", err);
    }

    if (isLocalTestMode) {
      console.log("本地测试模式：跳过麦克风检测");
      startScreen.classList.add("hidden");
      gameContainer.classList.remove("hidden");
      if (interactionManager.candles.length === 0) {
        interactionManager.addCandle();
        updateBlowHint();
      }
      setTimeout(() => {
        if (!isBlown && interactionManager.candles.length > 0) {
          handleBlowSuccess();
        }
      }, 800);
      return;
    }

    try {
      let success = await audioDetector.init();
      console.log("音频检测器初始化结果:", success);

      if (success) {
        console.log("显示游戏界面...");
        startScreen.classList.add("hidden");
        gameContainer.classList.remove("hidden");

        // 设置吹气回调
        audioDetector.onBlow = () => {
          if (!isBlown && interactionManager.candles.length > 0) {
            handleBlowSuccess();
          }
        };
      } else {
        alert("请允许访问麦克风以使用吹蜡烛功能");
      }
    } catch (err) {
      console.error("开始流程出错:", err);
      const message = err && err.message ? err.message : String(err);
      const name = err && err.name ? err.name : "UnknownError";
      const details = [
        `name: ${name}`,
        `message: ${message}`,
        `protocol: ${window.location.protocol}`,
        `secureContext: ${window.isSecureContext}`,
      ].join("\n");
      alert("无法访问麦克风:\n" + details);
    }
  });

  // 蜡烛增减
  plusBtn.addEventListener("click", (e) => {
    if (e) e.preventDefault();
    if (isBlown) return;
    interactionManager.addCandle();
    updateBlowHint();
  });

  minusBtn.addEventListener("click", (e) => {
    if (e) e.preventDefault();
    if (isBlown) return;
    interactionManager.removeCandle();
    updateBlowHint();
  });

  // 蛋糕切换
  cakeSelectors.forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e) e.preventDefault();
      if (isBlown) return;
      const type = item.dataset.type;
      interactionManager.switchCake(type);
      updateBlowHint();
    });
  });

  function handleBlowSuccess() {
    console.log("[STATUS]: BLOW_SUCCESS");
    console.log("[TEST_EVENT]: SUCCESS_TRIGGERED");
    isBlown = true;
    interactionManager.extinguishAll();
    effectsManager.triggerAll();
    blowHint.textContent = "🎉 生日快乐！";

    startBirthdaySong();

    // 动画结束后自动重置
    setTimeout(() => {
      isBlown = false;
      interactionManager.resetDecorations();
      blowHint.classList.add("hidden");
      stopBirthdaySong();
    }, 8000); // 8秒后重置，确保气球和彩纸动画基本结束
  }

  function updateBlowHint() {
    if (interactionManager.candles.length > 0 && !isBlown) {
      blowHint.textContent = "对着麦克风吹气！";
      blowHint.classList.remove("hidden");
    } else {
      blowHint.classList.add("hidden");
    }
  }

  function updateAudioToggle() {
    if (!audioToggle) return;
    audioToggle.classList.toggle("is-playing", !isAudioMuted);
    audioToggle.textContent = isAudioMuted ? "🔇" : "🔊";
    audioToggle.setAttribute(
      "aria-label",
      isAudioMuted ? "开启生日歌" : "关闭生日歌"
    );
  }

  function startBirthdaySong() {
    if (!birthdayAudio) return;
    if (isAudioMuted) return;
    if (Number.isFinite(birthdayAudio.duration)) {
      birthdayAudio.currentTime = Math.min(
        audioStartOffset,
        Math.max(0, birthdayAudio.duration - 0.1)
      );
    } else {
      birthdayAudio.currentTime = audioStartOffset;
    }
    const playResult = birthdayAudio.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch((err) => {
        console.warn("生日歌播放失败:", err);
      });
    }
  }

  function stopBirthdaySong() {
    if (!birthdayAudio) return;
    birthdayAudio.pause();
    birthdayAudio.currentTime = 0;
  }

  async function unlockAudio() {
    if (!birthdayAudio || hasUserActivatedAudio) return;
    birthdayAudio.currentTime = audioStartOffset;
    const playResult = birthdayAudio.play();
    if (playResult && typeof playResult.then === "function") {
      await playResult;
      birthdayAudio.pause();
      birthdayAudio.currentTime = audioStartOffset;
      hasUserActivatedAudio = true;
    }
  }

  if (birthdayAudio) {
    birthdayAudio.muted = isAudioMuted;
  }

  if (audioToggle) {
    audioToggle.addEventListener("click", async (e) => {
      if (e) e.preventDefault();
      if (!birthdayAudio) return;
      try {
        await unlockAudio();
      } catch (err) {
        console.warn("音频解锁失败:", err);
        hasUserActivatedAudio = false;
      }
      isAudioMuted = !isAudioMuted;
      birthdayAudio.muted = isAudioMuted;
      if (isAudioMuted) {
        birthdayAudio.pause();
      } else if (isBlown) {
        startBirthdaySong();
      } else {
        // 在用户手势下主动播放一次，确保浏览器允许
        birthdayAudio.currentTime = audioStartOffset;
        const playResult = birthdayAudio.play();
        if (playResult && typeof playResult.catch === "function") {
          playResult.catch((err) => {
            console.warn("生日歌播放失败:", err);
          });
        }
        setTimeout(() => {
          birthdayAudio.pause();
          birthdayAudio.currentTime = audioStartOffset;
        }, 300);
      }
      updateAudioToggle();
    });
    updateAudioToggle();
  }

  if (isTestMode) {
    window._audioDetector = audioDetector;
    window._handleBlowSuccess = handleBlowSuccess;
  }
});
