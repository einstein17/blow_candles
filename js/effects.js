class EffectsManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.isActive = false;
    this.animationId = null;
  }

  triggerAll() {
    document.body.classList.add("effect-active");
    this.spawnBalloons();
    this.startConfetti();
  }

  spawnBalloons() {
    const balloonCount = 12;
    for (let i = 0; i < balloonCount; i++) {
      setTimeout(() => {
        const balloon = document.createElement("div");
        balloon.className = "balloon";
        balloon.classList.add("balloon"); // 确保有明确的 class="balloon"

        const hue = Math.random() * 360;
        const color = `hsl(${hue}, 70%, 60%)`;
        balloon.style.left = `${Math.random() * 90}%`;
        balloon.style.setProperty("--balloon-color", color);
        balloon.style.setProperty("--balloon-hue", hue);
        balloon.style.borderBottomColor = color; // 用于伪元素的结

        // 随机上升速度 (4s - 7s)
        const duration = 4 + Math.random() * 3;
        balloon.style.animation = `balloon-rise ${duration}s ease-in forwards`;

        document.body.appendChild(balloon);

        // 动画结束后移除
        balloon.addEventListener("animationend", () => balloon.remove());
      }, i * 250);
    }
  }

  startConfetti() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.style.position = "fixed";
      this.canvas.style.top = "0";
      this.canvas.style.left = "0";
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
      this.canvas.style.pointerEvents = "none";
      this.canvas.style.zIndex = "900";
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
    }

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.particles = [];
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -Math.random() * 500,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 1.5 + 1, // 降低初始下落速度
        size: Math.random() * 6 + 4,
        color: `hsl(${Math.random() * 360}, 80%, 50%)`,
        rotation: Math.random() * 360,
        rSpeed: Math.random() * 6 - 3,
        phase: Math.random() * Math.PI * 2, // 初始相位，用于左右摆动
        amplitude: Math.random() * 1.5 + 0.5, // 摆动幅度
      });
    }

    this.isActive = true;
    this.animateConfetti();

    // 5秒后停止
    setTimeout(() => {
      this.isActive = false;
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      document.body.classList.remove("effect-active");
    }, 5000);
  }

  animateConfetti() {
    if (!this.isActive) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p) => {
      p.y += p.vy;
      p.vy += 0.02; // 极小的重力感，模拟空气阻力
      p.x += Math.sin(Date.now() / 200 + p.phase) * p.amplitude; // 左右轻微晃动
      p.rotation += p.rSpeed;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    });

    this.animationId = requestAnimationFrame(() => this.animateConfetti());
  }
}

window.EffectsManager = EffectsManager;
