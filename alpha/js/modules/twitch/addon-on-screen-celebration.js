/* Thank you Claude <3 */

/**
 * onScreenCelebration
 * -----------------------------------------------------------------------
 * Recria o Power-up "On-Screen Celebration" da Twitch: várias cópias de um
 * emote sobem pela tela como balões de hélio, balançando em zigue-zague,
 * com variação de tamanho, velocidade e opacidade.
 *
 * IMPLEMENTAÇÃO: em vez de desenhar em <canvas> (o que congela GIF/WebP
 * animado no Chromium/CEF, usado pelo OBS Browser Source), cada emote é
 * um elemento <img> real, posicionado via CSS transform e animado a cada
 * requestAnimationFrame. Como é uma <img> de verdade, o navegador anima o
 * GIF/WebP nativamente — sem congelar.
 *
 * Uso básico:
 *   onScreenCelebration("https://static-cdn.jtvnw.net/emoticons/.../3.0");
 *
 * Uso com parâmetros customizados:
 *   onScreenCelebration(emoteUrl, {
 *     minSize: 24,
 *     maxSize: 70,
 *     spawnDuration: 8000,
 *     spawnInterval: 90,
 *     direction: "down"
 *   });
 *
 * Para controlar a quantidade de emotes de forma simples, use "intensity"
 * (1 = padrão, 2 = dobro de emotes, 0.5 = metade):
 *   onScreenCelebration(emoteUrl, { intensity: 2.5 });
 *
 * Retorna um objeto controlador: { stop() } — chame .stop() para
 * interromper novos spawns e deixar as cópias já em tela terminarem.
 * -----------------------------------------------------------------------
 */

function onScreenCelebration(emoteUrl, options = {}) {
  const {
    // tamanho de cada emote (px), sorteado entre minSize e maxSize
    minSize = 18,
    maxSize = 56,

    // velocidade vertical (px/frame), sorteada entre minSpeed e maxSpeed
    minSpeed = 0.45,
    maxSpeed = 1.1,

    // amplitude horizontal do zigue-zague (px)
    minAmplitude = 25,
    maxAmplitude = 90,

    // frequência do zigue-zague (quanto maior, mais rápido ele balança)
    minFrequency = 0.006,
    maxFrequency = 0.016,

    // rotação leve de cada emote (radianos) e sua velocidade de giro
    minRotation = -0.3,
    maxRotation = 0.3,
    minRotationSpeed = -0.01,
    maxRotationSpeed = 0.01,

    // opacidade máxima de cada emote
    minOpacity = 0.75,
    maxOpacity = 1,

    // duração do fade-in ao nascer (ms)
    minFadeIn = 300,
    maxFadeIn = 600,

    // tempo de vida de cada emote antes de ser removido (ms)
    minLife = 6500,
    maxLife = 10000,

    // por quanto tempo novos emotes continuam nascendo (ms)
    spawnDuration = 5000,

    // intervalo entre cada novo emote nascendo (ms) — controla o espaçamento
    spawnInterval = 130,

    // quantos emotes nascem por "tick" do intervalo acima
    spawnCount = 1,

    // atalho para controlar a quantidade total de emotes de forma simples:
    // 1 = padrão, 2 = o dobro de emotes, 0.5 = metade, etc.
    // Multiplica o spawnCount e divide o spawnInterval proporcionalmente,
    // então não precisa mexer nos dois parâmetros manualmente.
    intensity = 1,

    // "up" = sobe como balão de hélio | "down" = cai como confete
    direction = "up",

    // zona de fade-out perto da borda de saída (px)
    edgeFadeZone = 140,

    // elemento container já existente para reaproveitar (opcional).
    // Se não for passado, um <div> full-screen é criado e removido
    // automaticamente ao final da animação. Aceita também "canvas" por
    // compatibilidade com a versão anterior (nesse caso o valor passado
    // é ignorado e um novo container próprio é criado, já que não dá
    // pra usar um <canvas> como pai de <img>s).
    container = null,
    canvas = null,

    // callback disparado quando a animação termina naturalmente
    onComplete = null
  } = options;

  if (!emoteUrl) {
    throw new Error("onScreenCelebration: 'emoteUrl' é obrigatório.");
  }

  // aplica o multiplicador de intensidade: mais emotes por tick e/ou
  // ticks mais frequentes, mantendo um mínimo sensato em ambos
  const effectiveSpawnCount = Math.max(1, Math.round(spawnCount * intensity));
  const effectiveSpawnInterval = Math.max(15, spawnInterval / intensity);

  const rand = (min, max) => Math.random() * (max - min) + min;

  // ---- container: usa o fornecido ou cria um overlay full-screen próprio ----
  let ownContainer = false;
  let root = container && container.nodeType === 1 ? container : null;
  if (!root) {
    ownContainer = true;
    root = document.createElement("div");
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.overflow = "hidden";
    root.style.pointerEvents = "none";
    root.style.zIndex = "2147483647";
    (document.getElementById("chat") || document.body).appendChild(root);
  }

  function containerSize() {
    return {
      w: root.clientWidth || window.innerWidth,
      h: root.clientHeight || window.innerHeight
    };
  }

  let emotes = [];
  let rafId = null;
  let spawning = false;
  let stopped = false;

  function spawnEmote() {
    const size = rand(minSize, maxSize);
    const { w, h } = containerSize();
    const goingUp = direction === "up";

    const el = document.createElement("img");
    el.src = emoteUrl;
    el.crossOrigin = "anonymous";
    el.style.position = "absolute";
    el.style.left = "0";
    el.style.top = "0";
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.willChange = "transform, opacity";
    el.style.opacity = "0";
    root.appendChild(el);

    emotes.push({
      el,
      baseX: rand(0, w),
      y: goingUp ? h + size : -size,
      size,
      vy: goingUp ? -rand(minSpeed, maxSpeed) : rand(minSpeed, maxSpeed),
      amp: rand(minAmplitude, maxAmplitude),
      freq: rand(minFrequency, maxFrequency),
      phase: rand(0, Math.PI * 2),
      rot: rand(minRotation, maxRotation),
      vrot: rand(minRotationSpeed, maxRotationSpeed),
      born: performance.now(),
      fadeIn: rand(minFadeIn, maxFadeIn),
      life: rand(minLife, maxLife),
      opacityMax: rand(minOpacity, maxOpacity)
    });
  }

  function tick(now) {
    const { h } = containerSize();
    const goingUp = direction === "up";

    emotes.forEach((e) => {
      e.y += e.vy;
      e.rot += e.vrot;
      const age = now - e.born;
      const x = e.baseX + Math.sin(e.y * e.freq + e.phase) * e.amp;

      let alpha;
      if (age < e.fadeIn) {
        alpha = (age / e.fadeIn) * e.opacityMax;
      } else if (goingUp && e.y < edgeFadeZone) {
        alpha = e.opacityMax * Math.max(0, e.y / edgeFadeZone);
      } else if (!goingUp && e.y > h - edgeFadeZone) {
        alpha = e.opacityMax * Math.max(0, (h - e.y) / edgeFadeZone);
      } else {
        alpha = e.opacityMax;
      }

      alpha = Math.min(1, Math.max(0, alpha));

      // translate posiciona o centro do emote em (x, e.y); o segundo
      // translate(-50%, -50%) centraliza a <img> nesse ponto, e rotate
      // gira em torno do próprio centro.
      e.el.style.transform =
        `translate(${x}px, ${e.y}px) rotate(${e.rot}rad) translate(-50%, -50%)`;
      e.el.style.opacity = String(alpha);
    });

    emotes = emotes.filter((e) => {
      const alive = (now - e.born) < e.life;
      const onScreen = goingUp ? (e.y + e.size > -20) : (e.y - e.size < h + 20);
      const keep = alive && onScreen;
      if (!keep && e.el.parentNode) e.el.parentNode.removeChild(e.el);
      return keep;
    });

    if (spawning || emotes.length) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
      cleanup();
    }
  }

  function ensureLoop() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function cleanup() {
    if (ownContainer && root.parentNode) {
      root.parentNode.removeChild(root);
    }
    if (typeof onComplete === "function") onComplete();
  }

  function start() {
    spawning = true;
    ensureLoop();

    const spawnStart = performance.now();
    const spawnTimer = setInterval(() => {
      if (stopped || performance.now() - spawnStart > spawnDuration) {
        clearInterval(spawnTimer);
        spawning = false;
        return;
      }
      for (let i = 0; i < effectiveSpawnCount; i++) spawnEmote();
    }, effectiveSpawnInterval);
  }

  start();

  // controlador: permite interromper novos spawns manualmente
  return {
    stop() {
      stopped = true;
      spawning = false;
    }
  };
}

// Disponibiliza no escopo global quando usado via <script src="...">
if (typeof window !== "undefined") {
  window.onScreenCelebration = onScreenCelebration;
}

// Suporte a import/export em módulos ES / CommonJS, caso aplicável
if (typeof module !== "undefined" && module.exports) {
  module.exports = onScreenCelebration;
}