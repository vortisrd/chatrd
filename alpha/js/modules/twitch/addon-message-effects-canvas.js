/* Thank you Claude <3 */

const MESSAGE_EFFECTS_GRAVITY = 0.2;
const MESSAGE_EFFECTS_DEFAULT_EMOTE_SIZE = 28;
const MESSAGE_EFFECTS_DEFAULT_EMOTE_COUNT = 15;
const MESSAGE_EFFECTS_DONE_CLASS = "message-effect-animation-done";

class BouncingEmote {
	constructor(image, canvasWidth, canvasHeight, emoteSize, slotX) {
		this.image = image;
		this.size = emoteSize;
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.slotX = slotX;

		this.x = this.slotX;

		// resting position is fully BELOW the visible canvas area, so the
		// emote is completely hidden (as if behind the black message box)
		// until it jumps. baseY is where the TOP of the emote sits at rest.
		this.baseY = canvasHeight + this.size;
		this.y = this.baseY;
		this.velocityY = 0;

		this.state = "waiting"; // waiting -> jumping/falling -> waiting
		this.waitTimer = this.randomWait();
	}

	randomWait() {
		return 60 + Math.random() * 180; // frames before next jump
	}

	// jump strength is randomized but capped so the peak stays reachable
	// within the canvas height, measured from the hidden resting position
	maxJumpVelocity() {
		return -Math.sqrt(2 * MESSAGE_EFFECTS_GRAVITY * this.baseY);
	}

	update() {
		if (this.state === "waiting") {
			this.waitTimer--;
			if (this.waitTimer <= 0) {
				this.startJump();
			}
			return;
		}

		this.velocityY += MESSAGE_EFFECTS_GRAVITY;
		this.y += this.velocityY;

		if (this.y >= this.baseY) {
			this.y = this.baseY;
			this.velocityY = 0;
			this.state = "waiting";
			this.waitTimer = this.randomWait();
		}
	}

	startJump() {
		this.state = "jumping";

		// small random horizontal jitter around this emote's slot, so the
		// population still reads as "spread across the whole width" without
		// everyone jumping from the exact same spot every time
		const jitterRange = this.size;
		this.x = this.slotX + (Math.random() - 0.5) * jitterRange;
		this.x = Math.max(0, Math.min(this.canvasWidth - this.size, this.x));

		const maxVelocity = this.maxJumpVelocity();
		// randomize between 75% and 95% of max jump strength for variety
		this.velocityY = maxVelocity * (0.75 + Math.random() * 0.2);
	}

	draw(ctx) {
		// top of the emote at y - size; when y > canvasHeight the whole
		// sprite is below the visible area and effectively hidden
		if (this.y - this.size >= this.canvasHeight) {
			return;
		}

		ctx.drawImage(
			this.image,
			this.x,
			this.y - this.size,
			this.size,
			this.size
		);
	}
}

function loadEmoteImages(urls) {
	return Promise.all(
		urls.map((url) => new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => resolve(img);
			img.onerror = () => {
				console.error("Failed to load emote image:", url);
				resolve(null);
			};
			img.src = url;
		}))
	);
}

function resizeCanvasToDisplaySize(canvas) {
	// canvas internal resolution must match its rendered CSS size,
	// otherwise drawImage coordinates won't line up with what's visible
	const rect = canvas.getBoundingClientRect();
	canvas.width = rect.width;
	canvas.height = rect.height;
}

// builds one BouncingEmote per slot, evenly spread across the full
// canvas width, cycling through the available images if there are
// fewer images than slots
function createEmotes(images, canvas, emoteSize, emoteCount) {
	const slotWidth = canvas.width / emoteCount;
	const emotes = [];

	for (let i = 0; i < emoteCount; i++) {
		const image = images[i % images.length];
		const slotCenter = slotWidth * i + slotWidth / 2;
		const slotX = Math.max(
			0,
			Math.min(canvas.width - emoteSize, slotCenter - emoteSize / 2)
		);

		emotes.push(
			new BouncingEmote(image, canvas.width, canvas.height, emoteSize, slotX)
		);
	}

	return emotes;
}

// Public entry point.
// canvasElement: the <canvas> element itself (should be styled with
//                width: 100% and a fixed height, e.g. 30px).
//                Resolve it however you want before calling this,
//                e.g. document.getElementById(...) or
//                document.querySelector(...)
// emoteUrls: array of image URLs to animate
// options: { emoteSize, emoteCount, duration }
//          emoteSize - render size in px (default 28)
//          emoteCount - how many bouncing slots to spread across the
//                       full width (default 15, images repeat as needed)
//          duration - if set, time in ms after which the animation
//                      stops and canvasElement gets the CSS class
//                      "message-effect-animation-done". If omitted,
//                      the animation runs indefinitely.
async function initEmoteTrampoline(canvasElement, emoteUrls, options = {}) {
	const canvas = canvasElement;
	if (!canvas) {
		console.error("initEmoteTrampoline: canvasElement is null or undefined");
		return;
	}

	const ctx = canvas.getContext("2d");
	const emoteSize = options.emoteSize || MESSAGE_EFFECTS_DEFAULT_EMOTE_SIZE;
	const emoteCount = options.emoteCount || MESSAGE_EFFECTS_DEFAULT_EMOTE_COUNT;
	const duration = options.duration || null;

	resizeCanvasToDisplaySize(canvas);

	const images = await loadEmoteImages(emoteUrls);
	const loadedImages = images.filter((img) => img !== null);

	if (loadedImages.length === 0) {
		console.error("No emotes loaded, animation will not start");
		return;
	}

	let emotes = createEmotes(loadedImages, canvas, emoteSize, emoteCount);
	let animationFrameId = null;
	let stopTimeoutId = null;

	// whenever the canvas is resized (e.g. browser window resize), the
	// internal pixel resolution must be recalculated and the emote slots
	// rebuilt, otherwise the drawing gets stretched/squished
	const resizeObserver = new ResizeObserver(() => {
		resizeCanvasToDisplaySize(canvas);
		emotes = createEmotes(loadedImages, canvas, emoteSize, emoteCount);
	});
	resizeObserver.observe(canvas);

	function stopAnimation() {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}

		resizeObserver.disconnect();
		canvas.classList.add(MESSAGE_EFFECTS_DONE_CLASS);
	}

	function frame() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		emotes.forEach((emote) => {
			emote.update();
			emote.draw(ctx);
		});

		animationFrameId = requestAnimationFrame(frame);
	}

	frame();

	if (duration !== null) {
		stopTimeoutId = setTimeout(stopAnimation, duration);
	}

	// returned so the caller can stop the animation manually before the
	// duration elapses, if needed (e.g. tearing down the overlay early)
	return {
		stop() {
			if (stopTimeoutId !== null) {
				clearTimeout(stopTimeoutId);
			}
			stopAnimation();
		}
	};
}