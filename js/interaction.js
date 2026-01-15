class InteractionManager {
  constructor() {
    this.cakeBody = document.getElementById("cake-body");
    this.fruitLayer = document.getElementById("fruit-layer");
    this.candleLayer = document.getElementById("candle-layer");
    this.candleCountDisplay = document.getElementById("candle-count");

    this.currentCakeType = 1;
    this.candles = [];
    this.maxCandles = 20;

    // 固定水果位置 (百分比坐标)
    this.fruitPositions = [
      { x: 42, y: 24 },
      { x: 58, y: 24 },
      { x: 50, y: 25 },
      { x: 38, y: 26 },
      { x: 62, y: 26 },
      { x: 50, y: 27 },
    ];

    // 椭圆路径参数 (用于蜡烛排列)
    this.ellipse = {
      cx: 50, // 中心 x (%)
      cy: 25, // 中心 y (%)
      rx: 30, // 长轴 (%)
      ry: 6, // 短轴 (%)，更扁的椭圆符合透视
    };
  }

  init() {
    this.switchCake(1);
  }

  switchCake(type) {
    this.currentCakeType = type;

    // 切换 CSS 类来改变蛋糕样子
    this.cakeBody.className = `cake-type-${type}`;

    // 更新 UI 选中状态
    document.querySelectorAll(".selector-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.type == type);
    });

    this.resetDecorations();
  }

  resetDecorations() {
    this.clearCandles();
    this.placeFruits();
  }

  clearCandles() {
    this.candles = [];
    this.candleLayer.innerHTML = "";
    this.updateCandleCount();
  }

  placeFruits() {
    this.fruitLayer.innerHTML = "";
    this.fruitPositions.forEach((pos) => {
      const fruit = document.createElement("div");
      fruit.className = "fruit fruit-placeholder";
      fruit.style.left = `${pos.x}%`;
      fruit.style.top = `${pos.y}%`;
      fruit.style.zIndex = Math.floor(pos.y); // 增加 z-index 确保层级正确
      this.fruitLayer.appendChild(fruit);
    });
  }

  addCandle() {
    if (this.candles.length >= this.maxCandles) return;

    const candle = {
      id: Date.now(),
      element: this.createCandleElement(),
    };

    this.candles.push(candle);
    this.candleLayer.appendChild(candle.element);
    this.rearrangeCandles();
    this.updateCandleCount();
  }

  removeCandle() {
    if (this.candles.length === 0) return;

    const candle = this.candles.pop();
    this.candleLayer.removeChild(candle.element);
    this.rearrangeCandles();
    this.updateCandleCount();
  }

  createCandleElement() {
    const candleDiv = document.createElement("div");
    candleDiv.className = "candle";

    const flameDiv = document.createElement("div");
    flameDiv.className = "flame";

    candleDiv.appendChild(flameDiv);
    return candleDiv;
  }

  rearrangeCandles() {
    const n = this.candles.length;
    if (n === 0) return;

    this.candles.forEach((candle, i) => {
      // 计算在椭圆上的角度 (均匀分布)
      // 为了美观，我们只在椭圆的前半部分或全周分布
      // 这里采用全周分布
      const angle = (i / n) * Math.PI * 2;

      const x = this.ellipse.cx + this.ellipse.rx * Math.cos(angle);
      const y = this.ellipse.cy + this.ellipse.ry * Math.sin(angle);

      candle.element.style.left = `${x}%`;
      candle.element.style.top = `${y}%`;

      // 根据 y 坐标设置 z-index，y 越大（越靠下/前），z-index 越高
      candle.element.style.zIndex = Math.floor(y);
    });
  }

  updateCandleCount() {
    const count = this.candles.length;
    this.candleCountDisplay.textContent = count;

    const minusBtn = document.getElementById("minus-btn");
    const plusBtn = document.getElementById("plus-btn");
    if (minusBtn) minusBtn.disabled = count <= 0;
    if (plusBtn) plusBtn.disabled = count >= this.maxCandles;
  }

  extinguishAll() {
    this.candles.forEach((candle) => {
      const flame = candle.element.querySelector(".flame");
      if (flame) {
        // 熄灭动画
        flame.style.transition = "all 0.2s ease-out";
        flame.style.opacity = "0";
        flame.style.transform = "translateX(-50%) scale(0)";

        setTimeout(() => {
          if (flame.parentNode) flame.remove();
        }, 200);

        // 可以在这里添加烟雾效果
        this.addSmoke(candle.element);
      }
    });
  }

  addSmoke(parent) {
    const smoke = document.createElement("div");
    smoke.className = "smoke";
    parent.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1000);
  }
}

window.InteractionManager = InteractionManager;
