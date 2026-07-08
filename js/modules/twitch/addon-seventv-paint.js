const paintCache = new Map();   // twitchId -> css object | null
const paintPending = new Map(); // twitchId -> in-flight promise

const PAINT_QUERY = `query($id:String!){users{userByConnection(platform:TWITCH,platformId:$id){style{activePaint{id name data{layers{opacity ty{__typename ... on PaintLayerTypeSingleColor{color{hex}} ... on PaintLayerTypeLinearGradient{angle repeating stops{at color{hex}}} ... on PaintLayerTypeRadialGradient{repeating shape stops{at color{hex}}} ... on PaintLayerTypeImage{images{url scale mime}}}} shadows{color{hex} offsetX offsetY blur}}}}}}}`;

function paintStops(stops) {
    return (stops || []).slice().sort((a, b) => a.at - b.at)
        .map(s => `${s.color.hex} ${(s.at * 100).toFixed(2)}%`).join(', ');
}

function paintLayerBg(layer) {
    const t = layer.ty || {};
    if (t.__typename === 'PaintLayerTypeLinearGradient') {
        const s = paintStops(t.stops);
        return s ? `${t.repeating ? 'repeating-' : ''}linear-gradient(${t.angle || 0}deg, ${s})` : null;
    }
    if (t.__typename === 'PaintLayerTypeRadialGradient') {
        const s = paintStops(t.stops);
        return s ? `${t.repeating ? 'repeating-' : ''}radial-gradient(${(t.shape || 'circle').toLowerCase()}, ${s})` : null;
    }
    if (t.__typename === 'PaintLayerTypeSingleColor') {
        const h = t.color && t.color.hex;
        return h ? `linear-gradient(${h}, ${h})` : null; // flat color via gradient trick, so it composites like the others
    }
    if (t.__typename === 'PaintLayerTypeImage') {
        const imgs = (t.images || []).filter(i => /\.webp(\?|$)/.test(i.url));
        const pick = (imgs.length ? imgs : (t.images || [])).slice().sort((a, b) => (b.scale || 0) - (a.scale || 0))[0];
        return pick ? `url("${pick.url}")` : null;
    }
    return null;
}

function paintToCss(paint) {
    if (!paint || !paint.data) return null;
    const layers = paint.data.layers || [];
    // 7TV lists layers bottom-to-top; CSS background lists render top-to-bottom, so reverse.
    const bgs = layers.map(paintLayerBg).filter(Boolean).reverse();
    if (!bgs.length) return null;
    const cover = layers.some(l => l.ty && l.ty.__typename === 'PaintLayerTypeImage');
    const shadows = (paint.data.shadows || [])
        .map(s => `drop-shadow(${s.offsetX || 0}px ${s.offsetY || 0}px ${s.blur || 0}px ${s.color.hex})`)
        .join(' ');
    return { image: bgs.join(', '), cover, shadows };
}

function applyPaint(element, css) {
    if (!element || !css) return;
    element.style.backgroundImage = css.image;
    if (css.cover) { element.style.backgroundSize = 'cover'; element.style.backgroundPosition = 'center'; }
    element.style.webkitBackgroundClip = element.style.backgroundClip = 'text';
    element.style.webkitTextFillColor = 'transparent';
    element.style.color = 'transparent';
    if (css.shadows) element.style.filter = css.shadows;
}

async function fetchPaint(twitchId) {
    const key = String(twitchId);
    if (paintPending.has(key)) return paintPending.get(key);

    const pr = (async () => {
        try {
            console.debug(`[ChatRD][Twitch][7TV-Paint] Paint for user ${twitchId} not cached. Fetching...`);
            const res = await fetch('https://7tv.io/v4/gql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: PAINT_QUERY, variables: { id: key } }),
            });
            const json = await res.json();
            const paint = json?.data?.users?.userByConnection?.style?.activePaint ?? null;
            const css = paintToCss(paint);
            paintCache.set(key, css);
            console.debug(`[ChatRD][Twitch][7TV-Paint] Paint for user ${twitchId} set!`);
            return css;
        } catch (err) {
            console.warn(`[ChatRD][Twitch][7TV-Paint] Failed to fetch paint for ${twitchId}:`, err);
            paintCache.set(key, null);
            return null;
        }
    })();

    paintPending.set(key, pr);
    return pr.finally(() => paintPending.delete(key));
}

async function applyUsernamePaint(element, twitchId) {
    const key = String(twitchId);

    if (paintCache.has(key)) {
        console.debug(`[ChatRD][Twitch][7TV-Paint] Paint for user ${twitchId} found in cache!`);
        applyPaint(element, paintCache.get(key));
        return;
    }

    const css = await fetchPaint(key);
    if (css) {
        element.setAttribute('data-seventv-paint-id', key);
        applyPaint(element, css);
    }
}