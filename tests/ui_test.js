const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    "_" +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  const resultsDir = path.resolve(__dirname, "results", timestamp);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  console.log(`开始测试，截图将保存至: ${resultsDir}`);

  // 自动允许麦克风权限
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });

  const context = await browser.newContext({
    permissions: ["microphone"],
  });
  const page = await context.newPage();

  await page.setViewportSize({ width: 375, height: 667 });

  // 捕获浏览器内部的 JS 报错
  let successTriggered = false;
  page.on("console", (msg) => {
    const text = msg.text();
    console.log(`[浏览器日志] ${msg.type()}: ${text}`);
    if (text.includes("[STATUS]: BLOW_SUCCESS")) {
      successTriggered = true;
    }
  });

  page.on("pageerror", (err) => {
    console.log(`[浏览器崩溃/报错] ${err.message}`);
  });

  // 使用用户提供的 Web Server 地址
  const url = `file://${path.resolve(__dirname, "../index.html")}?test=true`;

  try {
    // 禁用 Live Server 的自动刷新，防止截图触发页面重载
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url.includes("/ws") || url.includes("livereload")) {
        return route.abort();
      }
      route.continue();
    });

    console.log(`正在加载页面: ${url}`);

    // 在页面加载前注入监控代码
    await page.addInitScript(() => {
      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, "mediaDevices", {
          value: {
            getUserMedia: async () => {
              console.log("[监控] 模拟 getUserMedia");
              return {};
            },
          },
        });
        return;
      }
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
        navigator.mediaDevices
      );
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        console.log(`[监控] 请求媒体设备: ${JSON.stringify(constraints)}`);
        try {
          const stream = await originalGetUserMedia(constraints);
          console.log("[监控] 媒体设备请求成功");
          return stream;
        } catch (err) {
          console.error(
            `[监控] 媒体设备请求失败: ${err.name} - ${err.message}`
          );
          throw err;
        }
      };
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForLoadState("load");
    await page.waitForSelector("#start-btn", { state: "visible" });

    // 1. 初始界面
    await page.screenshot({
      path: path.join(resultsDir, "01-start-screen.png"),
    });

    // 2. 进入游戏
    console.log("点击开始按钮...");

    // 增加对按钮状态的检查
    const btnInfo = await page.evaluate(() => {
      const btn = document.getElementById("start-btn");
      const style = window.getComputedStyle(btn);
      return {
        exists: !!btn,
        visible: style.display !== "none" && style.visibility !== "hidden",
        text: btn ? btn.innerText : "",
      };
    });
    console.log(`按钮状态: ${JSON.stringify(btnInfo)}`);

    // 强制点击
    await page.click("#start-btn", { force: false });

    // 等待 hidden 类被移除，并增加超时到 15 秒
    console.log("等待游戏界面加载...");
    try {
      await page.waitForFunction(
        () => {
          const container = document.getElementById("game-container");
          const isHidden = container
            ? container.classList.contains("hidden")
            : true;
          return container && !isHidden;
        },
        { timeout: 10000 }
      );
    } catch (e) {
      const classes = await page.evaluate(() => {
        const c = document.getElementById("game-container");
        return c ? c.className : "not found";
      });
      console.log(`等待失败，当前 game-container 的 class: ${classes}`);
      throw e;
    }

    // 3. 添加蜡烛
    console.log("添加蜡烛...");
    await page.waitForSelector("#plus-btn", { state: "visible" });
    for (let i = 0; i < 5; i++) {
      await page.click("#plus-btn");
      await page.waitForTimeout(100);
    }

    // 4. 截图主交互界面
    await page.screenshot({ path: path.join(resultsDir, "02-main-game.png") });

    // 5. 切换蛋糕类型
    console.log("切换蛋糕类型...");
    await page.click('.selector-item[data-type="2"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(resultsDir, "03-cake-type-2.png"),
    });

    // 3. 添加蜡烛
    console.log("添加蜡烛...");
    await page.waitForSelector("#plus-btn", { state: "visible" });
    for (let i = 0; i < 5; i++) {
      await page.click("#plus-btn");
      await page.waitForTimeout(100);
    }

    // 6. 模拟成功状态 (触发吹气)
    console.log("模拟吹气成功...");
    await page.evaluate(() => {
      if (
        window.audioDetector &&
        typeof window.audioDetector.onBlow === "function"
      ) {
        console.log("触发 window.audioDetector.onBlow()...");
        window.audioDetector.onBlow();
      } else if (
        window._audioDetector &&
        typeof window._audioDetector.onBlow === "function"
      ) {
        console.log("触发 window._audioDetector.onBlow()...");
        window._audioDetector.onBlow();
      } else {
        console.error("未找到 audioDetector 或 onBlow 未挂载");
      }
    });

    // 等待日志和气球
    console.log("等待 SUCCESS_TRIGGERED 日志和气球元素...");
    await page.waitForSelector(".balloon", {
      state: "attached",
      timeout: 10000,
    });

    const isActive = await page.evaluate(() =>
      document.body.classList.contains("effect-active")
    );
    console.log(`Body has effect-active: ${isActive}`);

    if (!successTriggered) {
      throw new Error("测试失败: 未检测到 SUCCESS_TRIGGERED 日志！");
    }

    await page.screenshot({
      path: path.join(resultsDir, "04-success-balloons.png"),
    });

    console.log("测试完成，未发现报错");
  } catch (err) {
    console.error("----------------------------------------");
    console.error("测试过程中出错！详细信息如下：");
    console.error(`错误名称: ${err.name}`);
    console.error(`错误消息: ${err.message}`);
    console.error(`错误堆栈: ${err.stack}`);
    console.error("----------------------------------------");

    await page
      .screenshot({ path: path.join(resultsDir, "error-debug.png") })
      .catch(() => {});
  } finally {
    await browser.close();
  }
})();
