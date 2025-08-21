// ---------- Utilities: RNG, math, helpers ----------
function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function mulberry32(a) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), 1 | t);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

function makeRng(seedStr) {
    if (!seedStr || !seedStr.trim()) seedStr = Math.random().toString(36).slice(2);
    const seedFn = xmur3(seedStr);
    return {seed: seedStr, rand: mulberry32(seedFn())};
}

function randRange(r, a = 0, b = 1) {
    return a + r.rand() * (b - a);
}

function choice(r, arr) {
    return arr[Math.floor(r.rand() * arr.length)]
}

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const TAU = Math.PI * 2;

// ---------- Domain: Generation ----------
const SPEC_CLASSES = [
    {c: "M", temp: [2400, 3700], mass: [0.1, 0.6], color: "#ff6b6b", bias: 0.72},
    {c: "K", temp: [3700, 5200], mass: [0.6, 0.8], color: "#ffad66", bias: 0.14},
    {c: "G", temp: [5200, 6000], mass: [0.8, 1.2], color: "#ffd15c", bias: 0.08},
    {c: "F", temp: [6000, 7500], mass: [1.2, 1.6], color: "#ffe99a", bias: 0.04},
    {c: "A", temp: [7500, 10000], mass: [1.6, 2.4], color: "#e6f0ff", bias: 0.015},
    {c: "B", temp: [10000, 30000], mass: [2.4, 16], color: "#cfe2ff", bias: 0.004},
    {c: "O", temp: [30000, 50000], mass: [16, 60], color: "#bcd1ff", bias: 0.001},
];

const ROCKY_COLORS = ["#caa370", "#a0a0a0", "#b97c5e", "#7f8fa0", "#6f5b4b", "#8c9784", "#9f886b", "#7a6f66", "#95a4ad", "#6b5d84"];

// Generate vibrant analogous color stripes for gas giants
function randomAnalogousColors(r, count = 7, baseHue = null) {
    // Pick a random base hue if not provided
    if (baseHue === null) baseHue = Math.floor(randRange(r, 180, 360));
    const colors = [];
    for (let i = 0; i < count; i++) {
        // Spread hues ±20° from base
        const hue = (baseHue + (i - (count / 2)) * 18 + randRange(r, -6, 6)) % 360;
        const sat = randRange(r, 65, 90); // vibrant
        const light = randRange(r, 55, 70); // mid-light
        colors.push(`hsl(${Math.round(hue)},${Math.round(sat)}%,${Math.round(light)}%)`);
    }
    return colors;
}

const ICE_COLORS = ["#bfe3ff", "#cfeaff", "#d9f3ff", "#f0fbff", "#a3d6ff"];

function pickSpec(r) {
    const total = SPEC_CLASSES.reduce((s, o) => s + o.bias, 0);
    let t = r.rand() * total;
    for (const sc of SPEC_CLASSES) {
        if ((t -= sc.bias) <= 0) return sc;
    }
    return SPEC_CLASSES[0];
}

function computeLuminosity(mass) {
    return Math.pow(mass, 3.5);
}

function hzFromLum(L) {
    const inner = Math.sqrt(L / 1.1);
    const outer = Math.sqrt(L / 0.53);
    return [inner, outer];
}

function nameSystem(r) {
    const syllA = ["Al", "Bel", "Cal", "Del", "Eri", "Fae", "Gly", "Hel", "Ira", "Jax", "Kai", "Lyr", "Myr", "Nex", "Or", "Pra", "Quel", "Rho", "Syl", "Tor", "Ur", "Vex", "Wyn", "Xel", "Yri", "Zan"];
    const syllB = ["ara", "oris", "yra", "ion", "ara", "eron", "esis", "arae", "yxis", "ara", "ith", "urn", "ara", "eon", "os", "arae", "ides", "ara", "arae", "ea", "ius", "a", "ea", "in", "on"];
    const s1 = choice(r, syllA), s2 = choice(r, syllB);
    const num = Math.floor(randRange(r, 100, 900));
    return `${s1}${s2}-${num}`;
}

function generateSystem(seedStr) {
    const r = makeRng(seedStr);
    const spec = pickSpec(r);
    const temp = Math.round(randRange(r, spec.temp[0], spec.temp[1]));
    const mass = +(randRange(r, spec.mass[0], spec.mass[1]).toFixed(2));
    const L = computeLuminosity(mass);
    const radiusSolar = +(Math.pow(mass, 0.8).toFixed(2));
    const [hzIn, hzOut] = hzFromLum(L);
    const sysName = nameSystem(r);

    const star = {
        kind: "star",
        name: sysName,
        spectral: spec.c,
        color: spec.color,
        temp,
        mass,
        radiusSolar,
        luminosity: +L.toFixed(2),
        hz: [+hzIn.toFixed(2), +hzOut.toFixed(2)]
    };

    const nPlanets = Math.floor(randRange(r, 3, 12));
    const planets = [];
    let aPrev = randRange(r, 0.2, 0.5);

    for (let i = 0; i < nPlanets; i++) {
        const spacing = randRange(r, 1.4, 2.0);
        const aAU = +(aPrev * spacing).toFixed(2);
        aPrev = aAU;
        const typePick = r.rand();
        let type = "rocky";
        if (typePick > 0.8) type = "ice giant";
        if (typePick > 0.6 && typePick <= 0.8) type = "gas giant";
        if (typePick <= 0.6) type = "rocky";

        let radiusE, massE, color, stripes;
        if (type === "rocky") {
            radiusE = +(randRange(r, 0.5, 1.8).toFixed(2));
            massE = +(Math.pow(radiusE, 3) * randRange(r, 0.8, 1.3)).toFixed(2);
            color = choice(r, ROCKY_COLORS);
        } else if (type === "gas giant") {
            radiusE = +(randRange(r, 5, 12).toFixed(2));
            massE = +(randRange(r, 30, 300).toFixed(1));
            // Generate a random analogous color scheme for stripes
            stripes = randomAnalogousColors(r, 7);
            color = stripes[Math.floor(randRange(r, 0, 7))];
        } else {
            radiusE = +(randRange(r, 3, 5).toFixed(2));
            massE = +(randRange(r, 10, 30).toFixed(1));
            color = choice(r, ICE_COLORS);
        }
        const ecc = +(randRange(r, 0, 0.1).toFixed(3));
        const periodY = +Math.sqrt(Math.pow(aAU, 3) / star.mass).toFixed(2);

        const hasRings = type !== 'rocky' && r.rand() > 0.5;

        const atmosphere = makeAtmosphere(r, type);
        const albedo = type === 'rocky' ? randRange(r, 0.15, 0.45) : (type === 'gas giant' ? randRange(r, 0.35, 0.6) : randRange(r, 0.45, 0.7));
        const Teq = Math.pow((star.luminosity * (1 - albedo)), 0.25) * 278 / Math.sqrt(aAU);

        const life = evaluateLife(r, type, aAU, star.hz, atmosphere, Teq);

        const moons = makeMoons(r, type, radiusE);

        const name = `${sysName} ${String.fromCharCode(97 + i).toUpperCase()}`;
        planets.push({
            kind: "planet",
            name,
            type,
            color,
            stripes,
            radiusE,
            massE,
            aAU,
            ecc,
            periodY,
            hasRings,
            atmosphere,
            albedo: +albedo.toFixed(2),
            Teq: +Teq.toFixed(0),
            life,
            moons
        });
    }

    return {seed: r.seed, name: sysName, star, planets};
}

function makeAtmosphere(r, type) {
    if (type === 'rocky') {
        const options = [
            {desc: "N₂-O₂ (Earthlike)", pressure: randRange(r, 0.6, 1.8), breathable: r.rand() > 0.7},
            {desc: "CO₂-N₂ (thin)", pressure: randRange(r, 0.05, 0.4), breathable: false},
            {desc: "CO₂ (dense)", pressure: randRange(r, 2, 9), breathable: false},
            {desc: "N₂-CH₄ (hazy)", pressure: randRange(r, 0.7, 2.5), breathable: false},
            {desc: "No significant atmosphere", pressure: 0.01, breathable: false},
            {desc: "H₂O-N₂ (humid)", pressure: randRange(r, 0.8, 1.5), breathable: r.rand() > 0.5},
        ];
        return choice(r, options);
    }
    if (type === 'gas giant') {
        return {desc: "H₂-He with trace CH₄/NH₃", pressure: randRange(r, 50, 300), breathable: false};
    }
    return {desc: "H₂-He-CH₄ (icy)", pressure: randRange(r, 20, 120), breathable: false};
}

function evaluateLife(r, type, aAU, hz, atm, Teq) {
    let p = 0.01;
    const withinHZ = aAU > hz[0] * 0.9 && aAU < hz[1] * 1.1;
    if (type === 'rocky' && withinHZ && atm.pressure > 0.3 && atm.pressure < 5 && !/No significant/.test(atm.desc)) p += 0.35;
    if (type === 'rocky' && Teq > 250 && Teq < 340) p += 0.25;
    if (type !== 'rocky' && withinHZ) p += 0.05;
    p = clamp(p, 0, 0.85);
    const has = r.rand() < p;

    const lifeTypesRocky = [
        "microbial mats in shallow seas",
        "lichen-like surface colonies",
        "plankton-rich oceans",
        "chemosynthetic vent ecosystems",
        "simple multicellular flora",
        "burrowing microfauna in soils",
        "algal blooms in crater lakes",
    ];
    const lifeTypesGas = [
        "aerial plankton in cloud decks",
        "floaters drifting in jet streams",
        "photophoretic spores in haze layers",
    ];
    const desc = has ? (type === 'rocky' ? choice(r, lifeTypesRocky) : choice(r, lifeTypesGas)) : "none detected";

    let complexity = 'none';
    if (has) {
        if (type === 'rocky' && /Earthlike|humid/.test(atm.desc) && Teq > 260 && Teq < 320) complexity = 'complex multicellular';
        else if (type === 'rocky') complexity = 'microbial';
        else complexity = 'aerial microbial';
    }
    const water = has ? Math.round(clamp(withinHZ ? randRange(makeRng(r.seed + "w"), 30, 90) : randRange(makeRng(r.seed + "w"), 0, 40), 0, 100)) : 0;
    const o2 = has ? (complexity === 'complex multicellular' ? +(randRange(makeRng(r.seed + "o"), 10, 28).toFixed(1)) : +(randRange(makeRng(r.seed + "o"), 0.1, 8).toFixed(1))) : 0;
    const ch4ppm = has ? Math.round(randRange(makeRng(r.seed + "m"), 2, 300)) : 0;
    const co2 = has ? +(randRange(makeRng(r.seed + "c"), 0.01, 5).toFixed(2)) : (atm.desc.includes('CO₂') ? +(randRange(makeRng(r.seed + "c"), 2, 90).toFixed(1)) : 0.04);
    const biosignature = has ? +(clamp((o2 / 21) * 0.6 + (ch4ppm / 200) * 0.3 + (water / 100) * 0.4, 0, 1).toFixed(2)) : 0;
    const metabRocky = ["oxygenic photosynthesis", "anoxygenic photosynthesis", "chemosynthesis (sulfide)", "chemosynthesis (methanogenic)"];
    const metabGas = ["aerobic cloud plankton", "ammonia-based reducers", "photophoretic spores"];
    const metabolism = has ? (type === 'rocky' ? choice(makeRng(r.seed + "met"), metabRocky) : choice(makeRng(r.seed + "met"), metabGas)) : "—";
    const biomes = has && type === 'rocky' ? ["coasts", "shallow seas", "tidal flats", "lake basins", "basaltic deserts", "alpine"]
        .filter(() => r.rand() > 0.45).slice(0, 4) : (has ? ["cloud decks", "updraft belts", "calm anvils"].filter(() => r.rand() > 0.5) : []);
    const intelligent = has && complexity === 'complex multicellular' && r.rand() < 0.02;

    return {
        has,
        description: desc,
        complexity,
        water,
        o2,
        ch4ppm,
        co2,
        biosignature,
        metabolism,
        biomes,
        intelligent
    };
}

function makeMoons(r, type, radiusE) {
    let n = 0;
    if (type === 'rocky') n = r.rand() > 0.6 ? Math.floor(randRange(r, 1, 2.6)) : (r.rand() > 0.9 ? 1 : 0);
    if (type !== 'rocky') n = Math.floor(randRange(r, 2, 9));
    n = Math.min(n, 12);
    const moons = [];
    let a = randRange(r, 4, 8) * radiusE * 6371;
    for (let i = 0; i < n; i++) {
        a *= randRange(r, 1.3, 1.8);
        const size = +(randRange(r, 0.1, type === 'rocky' ? 0.6 : 0.9).toFixed(2));
        const periodD = +(randRange(r, 1, 40).toFixed(1));
        moons.push({
            kind: "moon",
            name: `m${i + 1}`,
            size,
            aRel: a,
            periodD,
            color: i % 3 === 0 ? "#d4d4d4" : "#bdbdbd"
        });
    }
    return moons;
}

// ---------- Rendering ----------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const viewportEl = document.getElementById('viewport');
const DPR = Math.min(2, window.devicePixelRatio || 1);

const state = {
    system: null,
    t: 0,
    paused: false,
    showOrbits: true,
    showLabels: true,
    zoom: 1,
    pan: {x: 0, y: 0},
    hover: null,
    selected: null
};

function resize() {
    const rect = viewportEl.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
}

window.addEventListener('resize', resize);
const ro = new ResizeObserver(() => resize());
ro.observe(viewportEl);

function clear() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function worldToScreen(x, y) {
    const cx = canvas.width / 2 + state.pan.x * DPR;
    const cy = canvas.height / 2 + state.pan.y * DPR;
    return [cx + x * state.zoom, cy + y * state.zoom];
}

function drawStar(star) {
    const r = 28;
    const [sx, sy] = worldToScreen(0, 0);
    const g = ctx.createRadialGradient(sx, sy, r * 0.1 * DPR, sx, sy, r * 6 * DPR);
    g.addColorStop(0, star.color + 'cc');
    g.addColorStop(1, '#0000');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 6 * DPR, 0, TAU);
    ctx.fill();

    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(sx, sy, r * DPR, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx - r * 0.3 * DPR, sy - r * 0.3 * DPR, r * 0.6 * DPR, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (state.showLabels) {
        drawLabel(sx, sy - 36 * DPR, state.system.star.name);
    }
    return {x: sx, y: sy, r: r * DPR};
}

function drawOrbit(cx, cy, radius) {
    ctx.strokeStyle = 'rgba(120,145,210,0.25)';
    ctx.lineWidth = DPR;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.stroke();
}

function drawLabel(sx, sy, text) {
    ctx.font = `${12 * DPR}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(text, sx, sy);
}

function drawPlanet(p, idx, time, hitList) {
    const orbitR = 70 * DPR + idx * 50 * DPR;
    const [cx, cy] = worldToScreen(0, 0);
    if (state.showOrbits) drawOrbit(cx, cy, orbitR);

    const ang = (time / (p.periodY || 1)) * TAU + idx * 0.62;
    const px = cx + Math.cos(ang) * orbitR;
    const py = cy + Math.sin(ang) * orbitR;

    if (p.hasRings) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(0.6);
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = 'rgba(200,200,255,0.35)';
        ctx.lineWidth = 6 * DPR;
        ctx.beginPath();
        ctx.ellipse(0, 0, (p.radiusE * 1.6 + 12) * DPR, (p.radiusE * 0.8 + 8) * DPR, 0, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    const pr = (p.radiusE * 2.2 + 6) * DPR;
    if (p.type === 'rocky') {
        // Base planet
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.fill();
        
        // Add surface features for rocky planets
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.clip();
        
        // Generate deterministic surface features
        const rng = makeRng(p.name + '_surface');
        
        // Add continents/land masses
        for (let i = 0; i < 8; i++) {
            const featureX = px + (rng.rand() - 0.5) * pr * 1.6;
            const featureY = py + (rng.rand() - 0.5) * pr * 1.6;
            const featureR = pr * (0.15 + rng.rand() * 0.25);
            
            ctx.globalAlpha = 0.2 + rng.rand() * 0.15;
            ctx.fillStyle = p.Teq > 300 ? '#8B4513' : (p.Teq < 250 ? '#E6E6FA' : '#228B22');
            ctx.beginPath();
            ctx.arc(featureX, featureY, featureR, 0, TAU);
            ctx.fill();
        }
        
        // Add craters
        for (let i = 0; i < 12; i++) {
            const craterX = px + (rng.rand() - 0.5) * pr * 1.8;
            const craterY = py + (rng.rand() - 0.5) * pr * 1.8;
            const craterR = pr * (0.05 + rng.rand() * 0.1);
            
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterR, 0, TAU);
            ctx.fill();
        }
        
        // Add polar ice caps if cold enough
        if (p.Teq < 280) {
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#F0F8FF';
            ctx.beginPath();
            ctx.arc(px, py - pr * 0.7, pr * 0.3, 0, TAU);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px, py + pr * 0.7, pr * 0.25, 0, TAU);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Terminator shadow
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px - pr * 0.2, py - pr * 0.2, pr * 0.8, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
    } else if (p.type === 'gas giant') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.clip();
        
        // Enhanced gas giant bands with storm distortions
        const bands = 12;
        const bandH = pr * 0.2;
        const stripes = Array.isArray(p.stripes) && p.stripes.length ? p.stripes : randomAnalogousColors(makeRng(p.name), 7);
        
        // Create storm distortion data for larger gas giants
        const storms = [];
        if (p.radiusE > 3) {
            const stormRng = makeRng(p.name + '_storms');
            for (let i = 0; i < 2; i++) {
                storms.push({
                    x: px + (stormRng.rand() - 0.5) * pr * 1.0,
                    y: py + (stormRng.rand() - 0.5) * pr * 0.6,
                    radius: pr * (0.06 + stormRng.rand() * 0.04), // Much smaller
                    strength: 0.2 + stormRng.rand() * 0.3,
                    rotation: stormRng.rand() * TAU
                });
            }
        }
        
        // Draw bands with storm integration
        for (let i = 0; i < bands; i++) {
            const t = i / bands;
            ctx.fillStyle = stripes[i % stripes.length];
            
            const baseY = py - pr + t * pr * 2;
            const bandH = pr * 0.2;
            
            // Check if this band is affected by storms
            let stormInfluence = 0;
            let stormColor = stripes[i % stripes.length];
            
            storms.forEach(storm => {
                const bandCenterY = baseY + bandH / 2;
                const distanceToStorm = Math.abs(bandCenterY - storm.y);
                
                if (distanceToStorm < storm.radius * 2) {
                    const influence = Math.max(0, 1 - distanceToStorm / (storm.radius * 2));
                    if (influence > stormInfluence) {
                        stormInfluence = influence;
                        // Darken band color in storm areas
                        stormColor = stripes[i % stripes.length]
                            .replace(/(\d+)%\)/, (match, l) => `${Math.max(10, parseInt(l) - Math.floor(influence * 20))}%)`);
                    }
                }
            });
            
            ctx.fillStyle = stormColor;
            
            // Draw band with potential storm warping
            if (stormInfluence > 0.1) {
                // Draw warped band
                ctx.beginPath();
                let firstPoint = true;
                
                for (let x = px - pr; x <= px + pr; x += 3) {
                    let y1 = baseY;
                    let y2 = baseY + bandH;
                    
                    // Apply storm warping
                    storms.forEach(storm => {
                        const dx = x - storm.x;
                        const dy1 = y1 - storm.y;
                        const dy2 = y2 - storm.y;
                        const dist1 = Math.sqrt(dx * dx + dy1 * dy1);
                        const dist2 = Math.sqrt(dx * dx + dy2 * dy2);
                        
                        if (dist1 < storm.radius * 3) {
                            const influence = Math.max(0, 1 - dist1 / (storm.radius * 3)) * storm.strength;
                            const angle = Math.atan2(dy1, dx) + storm.rotation;
                            y1 += Math.sin(angle * 2) * influence * pr * 0.04;
                        }
                        if (dist2 < storm.radius * 3) {
                            const influence = Math.max(0, 1 - dist2 / (storm.radius * 3)) * storm.strength;
                            const angle = Math.atan2(dy2, dx) + storm.rotation;
                            y2 += Math.sin(angle * 2) * influence * pr * 0.04;
                        }
                    });
                    
                    if (firstPoint) {
                        ctx.moveTo(x, y1);
                        firstPoint = false;
                    } else {
                        ctx.lineTo(x, y1);
                    }
                }
                
                // Complete the warped band shape
                for (let x = px + pr; x >= px - pr; x -= 3) {
                    let y2 = baseY + bandH;
                    
                    storms.forEach(storm => {
                        const dx = x - storm.x;
                        const dy2 = y2 - storm.y;
                        const dist2 = Math.sqrt(dx * dx + dy2 * dy2);
                        
                        if (dist2 < storm.radius * 3) {
                            const influence = Math.max(0, 1 - dist2 / (storm.radius * 3)) * storm.strength;
                            const angle = Math.atan2(dy2, dx) + storm.rotation;
                            y2 += Math.sin(angle * 2) * influence * pr * 0.04;
                        }
                    });
                    
                    ctx.lineTo(x, y2);
                }
                
                ctx.closePath();
                ctx.fill();
            } else {
                // Draw normal straight band
                ctx.fillRect(px - pr, baseY, pr * 2, bandH);
            }
            
            // Add subtle turbulence overlay
            ctx.globalAlpha = 0.3;
            const turbulence = Math.sin((i + time * 0.05) * 3) * pr * 0.02;
            ctx.fillRect(px - pr, baseY + turbulence, pr * 2, bandH * 0.5);
            ctx.globalAlpha = 1;
        }
        
        // Add subtle storm centers for visual clarity
        storms.forEach(storm => {
            ctx.save();
            ctx.translate(storm.x, storm.y);
            ctx.scale(1, 0.7); // Oval shape
            
            const bandIndex = Math.floor((storm.y - py + pr) / (pr * 2) * bands);
            const localColor = stripes[Math.max(0, Math.min(bandIndex, stripes.length - 1)) % stripes.length];
            
            // Very subtle storm center
            const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, storm.radius);
            centerGrad.addColorStop(0, localColor.replace(/(\d+)%\)/, (match, l) => `${Math.max(5, parseInt(l) - 25)}%)`));
            centerGrad.addColorStop(0.7, localColor.replace(/(\d+)%\)/, (match, l) => `${Math.max(10, parseInt(l) - 10)}%)`));
            centerGrad.addColorStop(1, localColor);
            
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = centerGrad;
            ctx.beginPath();
            ctx.arc(0, 0, storm.radius, 0, TAU);
            ctx.fill();
            
            ctx.restore();
            ctx.globalAlpha = 1;
        });
        
        ctx.restore();
        
        // Add atmospheric glow
        const glow = ctx.createRadialGradient(px, py, pr * 0.8, px, py, pr * 1.2);
        glow.addColorStop(0, 'rgba(0,0,0,0)');
        glow.addColorStop(1, 'rgba(134, 167, 255, 0.25)'); // Blue gas giant glow
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, pr * 1.2, 0, TAU);
        ctx.fill();
        
        // Terminator shadow
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px - pr * 0.2, py - pr * 0.2, pr * 0.98, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
    } else {
        // Ice giant with enhanced features
        const grad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, p.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.fill();
        
        // Add ice giant bands (subtle)
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.clip();
        
        const rng = makeRng(p.name + '_ice');
        for (let i = 0; i < 6; i++) {
            const t = (i + 0.5) / 6;
            const bandY = py - pr + t * pr * 2;
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = rng.rand() > 0.5 ? '#87CEEB' : '#B0E0E6';
            ctx.fillRect(px - pr, bandY - pr * 0.1, pr * 2, pr * 0.2);
        }
        
        // Add atmospheric shimmer
        for (let i = 0; i < 8; i++) {
            const shimmerX = px + (rng.rand() - 0.5) * pr * 1.6;
            const shimmerY = py + (rng.rand() - 0.5) * pr * 1.6;
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#E0FFFF';
            ctx.beginPath();
            ctx.arc(shimmerX, shimmerY, pr * 0.05, 0, TAU);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Atmospheric glow for ice giants
        const iceGlow = ctx.createRadialGradient(px, py, pr * 0.9, px, py, pr * 1.1);
        iceGlow.addColorStop(0, 'rgba(0,0,0,0)');
        iceGlow.addColorStop(1, 'rgba(135, 206, 235, 0.38)'); // Ice blue glow
        ctx.fillStyle = iceGlow;
        ctx.beginPath();
        ctx.arc(px, py, pr * 1.1, 0, TAU);
        ctx.fill();
        
        // Terminator shadow
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px - pr * 0.2, py - pr * 0.2, pr * 0.95, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    if (state.showLabels) {
        drawLabel(px, py - pr - 8 * DPR, p.name);
    }

    for (let i = 0; i < p.moons.length; i++) {
        const m = p.moons[i];
        const mr = (m.size * 2 + 2) * DPR;
        const ma = (time / (m.periodD / 365)) * TAU + i * 0.6;
        const mrad = pr + 10 * DPR + i * 6 * DPR;
        const mx = px + Math.cos(ma) * mrad;
        const my = py + Math.sin(ma) * mrad;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, TAU);
        ctx.fill();
        if (state.showOrbits) {
            ctx.strokeStyle = 'rgba(180,190,220,0.25)';
            ctx.lineWidth = DPR;
            ctx.beginPath();
            ctx.arc(px, py, mrad, 0, TAU);
            ctx.stroke();
        }
        hitList.push({kind: 'moon', ref: m, parent: p, x: mx, y: my, r: mr});
    }

    hitList.push({kind: 'planet', ref: p, x: px, y: py, r: pr});
}

function drawSystem() {
    clear();
    const s = state.system;
    if (!s) return;
    const starHit = drawStar(s.star);
    const hits = [];

    for (let i = 0; i < s.planets.length; i++) {
        drawPlanet(s.planets[i], i, state.t, hits);
    }

    let hoverHit = state.hover;
    let selectedHit = null;
    if (state.selected) {
        if (state.selected.kind === 'star') {
            selectedHit = {x: starHit.x, y: starHit.y, r: starHit.r};
        } else {
            selectedHit = hits.find(h => h.kind === state.selected.kind && h.ref === state.selected.ref && (!h.parent || h.parent === state.selected.parent)) || null;
        }
    }
    const drawHL = (h) => {
        if (!h) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2 * DPR;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r + 4 * DPR, 0, TAU);
        ctx.stroke();
        ctx.restore();
    };
    if (hoverHit) drawHL(hoverHit);
    if (selectedHit) drawHL(selectedHit);

    return {starHit, hits};
}

function drawPlanetDetail(planet, canvas, ctx) {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.35;
    
    console.log('Drawing planet detail:', {w, h, centerX, centerY, radius});
    
    // Clear canvas with space background
    ctx.clearRect(0, 0, w, h);
    const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(w, h) / 2);
    bgGrad.addColorStop(0, '#1a2040');
    bgGrad.addColorStop(1, '#0b1020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    
    // Add stars in background
    const starRng = makeRng(planet.name + '_detailstars');
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + starRng.rand() * 0.7})`;
        ctx.beginPath();
        ctx.arc(starRng.rand() * w, starRng.rand() * h, 0.5 + starRng.rand() * 1, 0, TAU);
        ctx.fill();
    }
    
    // Draw planet at larger scale with enhanced detail
    const pr = radius;
    const px = centerX;
    const py = centerY;
    
    if (planet.type === 'rocky') {
        // Enhanced rocky planet detail
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.fill();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.clip();
        
        const rng = makeRng(planet.name + '_detailsurface');
        
        // Large continental features
        for (let i = 0; i < 15; i++) {
            const featureX = px + (rng.rand() - 0.5) * pr * 1.8;
            const featureY = py + (rng.rand() - 0.5) * pr * 1.8;
            const featureR = pr * (0.1 + rng.rand() * 0.3);
            
            ctx.globalAlpha = 0.3 + rng.rand() * 0.2;
            if (planet.Teq > 350) ctx.fillStyle = '#CD853F'; // Hot desert
            else if (planet.Teq < 250) ctx.fillStyle = '#F0F8FF'; // Ice
            else ctx.fillStyle = rng.rand() > 0.6 ? '#228B22' : '#8B4513'; // Forest or rock
            
            ctx.beginPath();
            ctx.arc(featureX, featureY, featureR, 0, TAU);
            ctx.fill();
        }
        
        // Mountain ranges (detailed)
        for (let i = 0; i < 8; i++) {
            const startX = px + (rng.rand() - 0.5) * pr * 1.6;
            const startY = py + (rng.rand() - 0.5) * pr * 1.6;
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 2 + rng.rand() * 3;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            for (let j = 0; j < 5; j++) {
                ctx.lineTo(startX + (rng.rand() - 0.5) * pr * 0.3, startY + (rng.rand() - 0.5) * pr * 0.3);
            }
            ctx.stroke();
        }
        
        // Detailed craters
        for (let i = 0; i < 25; i++) {
            const craterX = px + (rng.rand() - 0.5) * pr * 1.8;
            const craterY = py + (rng.rand() - 0.5) * pr * 1.8;
            const craterR = pr * (0.02 + rng.rand() * 0.08);
            
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterR, 0, TAU);
            ctx.fill();
            
            // Crater rim
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterR * 1.2, 0, TAU);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Day/night terminator
        ctx.save();
        const termGrad = ctx.createLinearGradient(px - pr, py, px + pr, py);
        termGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
        termGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
        ctx.fillStyle = termGrad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.fill();
        ctx.restore();
        
    } else if (planet.type === 'gas giant') {
        // Enhanced gas giant detail
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.clip();
        
        const bands = 20;
        const stripes = Array.isArray(planet.stripes) && planet.stripes.length ? planet.stripes : randomAnalogousColors(makeRng(planet.name), 7);
        const rng = makeRng(planet.name + '_detailbands');
        
        // Create detailed storm distortion data
        const detailStorms = [];
        if (planet.radiusE > 3) {
            const stormRng = makeRng(planet.name + '_detailstorms');
            for (let i = 0; i < 3; i++) {
                detailStorms.push({
                    x: px + (stormRng.rand() - 0.5) * pr * 1.2,
                    y: py + (stormRng.rand() - 0.5) * pr * 0.8,
                    radius: pr * (0.05 + stormRng.rand() * 0.04), // Much smaller
                    strength: 0.2 + stormRng.rand() * 0.3,
                    rotation: stormRng.rand() * TAU,
                    swirl: stormRng.rand() * 2 - 1 // Clockwise or counterclockwise
                });
            }
        }
        
        // Draw bands with integrated storm effects  
        for (let i = 0; i < bands; i++) {
            const t = i / bands;
            ctx.fillStyle = stripes[i % stripes.length];
            
            const baseY = py - pr + t * pr * 2;
            const bandHeight = pr * 0.15;
            
            // Check for storm influence on this band
            let stormInfluence = 0;
            let stormColor = stripes[i % stripes.length];
            
            detailStorms.forEach(storm => {
                const bandCenterY = baseY + bandHeight / 2;
                const distanceToStorm = Math.abs(bandCenterY - storm.y);
                
                if (distanceToStorm < storm.radius * 3) {
                    const influence = Math.max(0, 1 - distanceToStorm / (storm.radius * 3));
                    if (influence > stormInfluence) {
                        stormInfluence = influence;
                        stormColor = stripes[i % stripes.length]
                            .replace(/(\d+)%\)/, (match, l) => `${Math.max(8, parseInt(l) - Math.floor(influence * 15))}%)`);
                    }
                }
            });
            
            ctx.fillStyle = stormColor;
            
            // Draw band with storm warping if affected
            if (stormInfluence > 0.05) {
                ctx.beginPath();
                let firstPoint = true;
                
                // Top edge with storm distortion
                for (let x = px - pr; x <= px + pr; x += 2) {
                    let y = baseY;
                    
                    detailStorms.forEach(storm => {
                        const dx = x - storm.x;
                        const dy = y - storm.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < storm.radius * 4) {
                            const influence = Math.max(0, 1 - dist / (storm.radius * 4)) * storm.strength;
                            const angle = Math.atan2(dy, dx) + storm.rotation;
                            y += Math.sin(angle * 3 + storm.swirl) * influence * pr * 0.03;
                        }
                    });
                    
                    if (firstPoint) {
                        ctx.moveTo(x, y);
                        firstPoint = false;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                // Bottom edge with storm distortion
                for (let x = px + pr; x >= px - pr; x -= 2) {
                    let y = baseY + bandHeight;
                    
                    detailStorms.forEach(storm => {
                        const dx = x - storm.x;
                        const dy = y - storm.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < storm.radius * 4) {
                            const influence = Math.max(0, 1 - dist / (storm.radius * 4)) * storm.strength;
                            const angle = Math.atan2(dy, dx) + storm.rotation;
                            y += Math.sin(angle * 3 + storm.swirl) * influence * pr * 0.03;
                        }
                    });
                    
                    ctx.lineTo(x, y);
                }
                
                ctx.closePath();
                ctx.fill();
            } else {
                // Normal straight band
                ctx.fillRect(px - pr, baseY, pr * 2, bandHeight);
            }
        }
        
        // Add very subtle storm centers
        detailStorms.forEach(storm => {
            ctx.save();
            ctx.translate(storm.x, storm.y);
            ctx.scale(1.2, 0.8);
            
            const bandIndex = Math.floor((storm.y - py + pr) / (pr * 2) * bands);
            const localColor = stripes[Math.max(0, Math.min(bandIndex, stripes.length - 1)) % stripes.length];
            
            // Subtle storm center with spiral
            const stormGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, storm.radius * 1.2);
            stormGrad.addColorStop(0, localColor.replace(/(\d+)%\)/, (match, l) => `${Math.max(0, parseInt(l) - 20)}%)`));
            stormGrad.addColorStop(0.5, localColor.replace(/(\d+)%\)/, (match, l) => `${Math.max(5, parseInt(l) - 12)}%)`));
            stormGrad.addColorStop(1, localColor);
            
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = stormGrad;
            ctx.beginPath();
            ctx.arc(0, 0, storm.radius * 1.2, 0, TAU);
            ctx.fill();
            
            // Tiny spiral pattern
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = localColor.replace(/(\d+)%\)/, (match, l) => `${Math.max(0, parseInt(l) - 25)}%)`);
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            for (let a = 0; a < TAU * 2; a += 0.1) {
                const r = (a / (TAU * 2)) * storm.radius;
                const spiralAngle = a * 0.7 + storm.swirl * a * 0.3;
                const x = Math.cos(spiralAngle) * r;
                const y = Math.sin(spiralAngle) * r;
                if (a === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            ctx.restore();
            ctx.globalAlpha = 1;
        });
        
        ctx.restore();
    } else {
        // Enhanced ice giant detail
        const grad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, planet.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.fill();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        ctx.clip();
        
        // Detailed ice bands
        const rng = makeRng(planet.name + '_detailice');
        for (let i = 0; i < 12; i++) {
            const t = (i + 0.5) / 12;
            const bandY = py - pr + t * pr * 2;
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = rng.rand() > 0.5 ? '#87CEEB' : '#B0E0E6';
            ctx.fillRect(px - pr, bandY - pr * 0.05, pr * 2, pr * 0.1);
        }
        
        ctx.restore();
    }
    
    // Atmospheric glow
    const glowGrad = ctx.createRadialGradient(px, py, pr * 0.95, px, py, pr * 1.15);
    glowGrad.addColorStop(0, 'rgba(0,0,0,0)');
    if (planet.type === 'gas giant') {
        glowGrad.addColorStop(1, 'rgba(134, 167, 255, 0.25)'); // Gas giant glow
    } else if (planet.type === 'ice giant') {
        glowGrad.addColorStop(1, 'rgba(135, 206, 235, 0.19)'); // Ice giant glow
    } else {
        glowGrad.addColorStop(1, 'rgba(160, 160, 160, 0.19)'); // Rocky planet glow
    }
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr * 1.15, 0, TAU);
    ctx.fill();
}

// ---------- Interaction ----------
const tooltip = document.getElementById('tooltip');
let hitCache = [];
let lastFrameStarHit = {x: 0, y: 0, r: 0};

function updateTooltip(target, clientX, clientY) {
    if (!target) {
        tooltip.style.display = 'none';
        return;
    }
    tooltip.innerHTML = renderTooltipHTML(target);
    tooltip.style.display = 'block';
    const rect = tooltip.getBoundingClientRect();
    let x = clientX + 14, y = clientY + 14;
    if (x + rect.width > window.innerWidth - 8) x = clientX - rect.width - 12;
    if (y + rect.height > window.innerHeight - 8) y = clientY - rect.height - 12;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function renderTooltipHTML(t) {
    if (t.kind === 'star') {
        const s = t.ref;
        return `<h4>${s.name} <span class="sub">(${s.spectral}-type)</span></h4>
      <div class="kv">
        <div>Mass</div><div>${s.mass} M☉</div>
        <div>Radius</div><div>${s.radiusSolar} R☉</div>
        <div>Temp</div><div>${s.temp} K</div>
        <div>Luminosity</div><div>${s.luminosity.toFixed(2)} L☉</div>
        <div>HZ</div><div>${s.hz[0]}-${s.hz[1]} AU</div>
      </div>`;
    }
    if (t.kind === 'planet') {
        const p = t.ref;
        const lifePill = p.life.has
            ? `<span class="pill">Life: ${p.life.description}</span>`
            : '<span class="pill" style="background:#2d1220;border-color:#5a2a3e;color:#ff9db8">No Life</span>';
        return `<h4>${p.name} <span class="sub">${p.type}</span></h4>
      ${lifePill}
      <div class="kv">
        <div>Orbit</div><div>${p.aAU} AU</div>
        <div>Period</div><div>${p.periodY} years</div>
        <div>Radius</div><div>${p.radiusE} R⊕</div>
        <div>Mass</div><div>${p.massE} M⊕</div>
        <div>Teq</div><div>${p.Teq} K</div>
        <div>Albedo</div><div>${p.albedo}</div>
        <div>Atmos.</div><div>${p.atmosphere.desc}</div>
        <div>Moons</div><div>${p.moons.length}</div>
        ${p.life.has ? `<div>Life class</div><div>${p.life.complexity}</div>
                       <div>Water</div><div>${p.life.water}%</div>
                       <div>O₂</div><div>${p.life.o2}%</div>
                       <div>CH₄</div><div>${p.life.ch4ppm} ppm</div>
                       <div>Biosignature</div><div>${(p.life.biosignature * 100).toFixed(0)}%</div>` : ''}
      </div>`;
    }
    if (t.kind === 'moon') {
        const m = t.ref, p = t.parent;
        return `<h4>${p.name} · ${m.name} <span class="sub">moon</span></h4>
      <div class="kv">
        <div>Size</div><div>${m.size} R⊕</div>
        <div>Orbital period</div><div>${m.periodD} days</div>
        <div>Host</div><div>${p.name}</div>
      </div>`;
    }
    return '';
}

function pickTargetAt(x, y, starHit) {
    for (let i = hitCache.length - 1; i >= 0; i--) {
        const h = hitCache[i];
        const dx = x - h.x, dy = y - h.y;
        if (dx * dx + dy * dy <= (h.r + 3 * DPR) ** 2) return h;
    }
    const dx = x - starHit.x, dy = y - starHit.y;
    if (dx * dx + dy * dy <= (starHit.r + 6 * DPR) ** 2) {
        return {kind: 'star', ref: state.system.star, x: starHit.x, y: starHit.y, r: starHit.r};
    }
    return null;
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * DPR;
    const y = (e.clientY - rect.top) * DPR;
    const target = pickTargetAt(x, y, lastFrameStarHit);

    // Only mark for redraw if hover state actually changed
    if (state.hover !== target) {
        state.hover = target;
        markNeedsRedraw();
    }

    updateTooltip(target, e.clientX, e.clientY);
});

canvas.addEventListener('mouseleave', () => {
    state.hover = null;
    updateTooltip(null);
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * DPR;
    const y = (e.clientY - rect.top) * DPR;
    const target = pickTargetAt(x, y, lastFrameStarHit);

    if (state.selected !== target) {
        state.selected = target;
        showInInspector(target);
        markNeedsRedraw();
        
        // If planet detail view is open, handle selection change
        const detailPanel = document.getElementById('planetDetail');
        if (detailPanel.style.display === 'block') {
            if (target && target.kind === 'planet') {
                // Update to new planet
                openPlanetDetail(target.ref);
            } else {
                // Close detail view if non-planet selected
                closePlanetDetail();
            }
        }
    }
    
    // Double-click to open planet detail view
    if (e.detail === 2 && target && target.kind === 'planet') {
        openPlanetDetail(target.ref);
    }
});

let dragging = false, dragLast = {x: 0, y: 0};
let touchZoomStart = 0;
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Mouse controls for panning
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2 || e.button === 0) { // Right click or left click
        dragging = true;
        dragLast.x = e.clientX;
        dragLast.y = e.clientY;
    }
});

window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    state.pan.x += (e.clientX - dragLast.x);
    state.pan.y += (e.clientY - dragLast.y);
    dragLast.x = e.clientX;
    dragLast.y = e.clientY;
    markNeedsRedraw();
});

// Mouse wheel zooming
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const factor = delta > 0 ? 0.9 : 1.1;
    state.zoom = clamp(state.zoom * factor, 0.4, 2.5);
    markNeedsRedraw();
}, {passive: false});

// Touch controls for mobile devices
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        // Single touch = pan
        dragging = true;
        dragLast.x = e.touches[0].clientX;
        dragLast.y = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        // Two touches = pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchZoomStart = Math.hypot(dx, dy);
    }
    e.preventDefault();
}, {passive: false});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging) {
        // Single touch = pan
        state.pan.x += (e.touches[0].clientX - dragLast.x);
        state.pan.y += (e.touches[0].clientY - dragLast.y);
        dragLast.x = e.touches[0].clientX;
        dragLast.y = e.touches[0].clientY;
        markNeedsRedraw();
    } else if (e.touches.length === 2) {
        // Two touches = pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const touchZoomNew = Math.hypot(dx, dy);

        if (touchZoomStart > 0) {
            const zoomFactor = touchZoomNew / touchZoomStart;
            if (zoomFactor > 1.05 || zoomFactor < 0.95) {
                state.zoom = clamp(state.zoom * (zoomFactor > 1 ? 1.05 : 0.95), 0.4, 2.5);
                touchZoomStart = touchZoomNew;
                markNeedsRedraw();
            }
        }
    }
}, {passive: false});

canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
        dragging = false;
    } else if (e.touches.length === 1) {
        dragLast.x = e.touches[0].clientX;
        dragLast.y = e.touches[0].clientY;
        touchZoomStart = 0;
    }
});

// Keyboard navigation for accessibility
canvas.addEventListener('keydown', (e) => {
    const panStep = 15; // pixels to pan per keypress
    const zoomStep = 0.1; // zoom factor per keypress
    let handled = true;

    switch(e.key) {
        case 'ArrowLeft':
            state.pan.x += panStep;
            break;
        case 'ArrowRight':
            state.pan.x -= panStep;
            break;
        case 'ArrowUp':
            state.pan.y += panStep;
            break;
        case 'ArrowDown':
            state.pan.y -= panStep;
            break;
        case '+':
        case '=':
            state.zoom = clamp(state.zoom + zoomStep, 0.4, 2.5);
            break;
        case '-':
        case '_':
            state.zoom = clamp(state.zoom - zoomStep, 0.4, 2.5);
            break;
        case 'r':
            // Reset view
            state.zoom = 1;
            state.pan = {x: 0, y: 0};
            break;
        default:
            handled = false;
    }

    if (handled) {
        e.preventDefault();
        markNeedsRedraw();
    }
});

// ---------- Inspector ----------
function showInInspector(target) {
    const wrap = document.getElementById('cards');
    wrap.innerHTML = '';
    if (!target) {
        document.getElementById('selectionType').textContent = '(none)';
        return;
    }
    document.getElementById('selectionType').textContent = target.kind;

    function addCard(title, html) {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${title}</h3>${html}`;
        wrap.appendChild(div);
    }

    if (target.kind === 'star') {
        const s = target.ref;
        addCard(`${s.name} (${s.spectral}-type)`, `
      <div class="kv">
        <div>Mass</div><div>${s.mass} M☉</div>
        <div>Radius</div><div>${s.radiusSolar} R☉</div>
        <div>Temperature</div><div>${s.temp} K</div>
        <div>Luminosity</div><div>${s.luminosity} L☉</div>
        <div>Habitable Zone</div><div>${s.hz[0]}-${s.hz[1]} AU</div>
      </div>
    `);
    }
    if (target.kind === 'planet') {
        const p = target.ref;
        addCard(`${p.name} · ${p.type}`, `
      <div class="kv">
        <div>Orbit (a)</div><div>${p.aAU} AU</div>
        <div>Period</div><div>${p.periodY} years</div>
        <div>Eccentricity</div><div>${p.ecc}</div>
        <div>Radius</div><div>${p.radiusE} R⊕</div>
        <div>Mass</div><div>${p.massE} M⊕</div>
        <div>Albedo</div><div>${p.albedo}</div>
        <div>Teq</div><div>${p.Teq} K</div>
        <div>Atmosphere</div><div>${p.atmosphere.desc} · ${p.atmosphere.pressure.toFixed(2)} bar ${p.atmosphere.breathable ? "· breathable" : ""}</div>
        <div>Rings</div><div>${p.hasRings ? "yes" : "no"}</div>
        <div>Moons</div><div>${p.moons.length}</div>
        <div>Life</div><div>${p.life.has ? p.life.description : 'none detected'}</div>
      </div>
    `);
        
        // Add planet detail button
        const detailBtn = document.createElement('button');
        detailBtn.className = 'btn';
        detailBtn.textContent = 'View Planet Detail';
        detailBtn.style.marginTop = '8px';
        detailBtn.style.width = '100%';
        detailBtn.onclick = () => openPlanetDetail(p);
        wrap.lastElementChild.appendChild(detailBtn);
        if (p.life.has) {
            const biomes = p.life.biomes && p.life.biomes.length ? p.life.biomes.join(', ') : '—';
            addCard('Life Details', `
        <div class="kv">
          <div>Classification</div><div>${p.life.complexity}${p.life.intelligent ? ' (intelligent)' : ''}</div>
          <div>Biosignature</div><div>${(p.life.biosignature * 100).toFixed(0)}%</div>
          <div>Dominant metabolism</div><div>${p.life.metabolism}</div>
          <div>Surface water</div><div>${p.life.water}%</div>
          <div>O₂</div><div>${p.life.o2}%</div>
          <div>CH₄</div><div>${p.life.ch4ppm} ppm</div>
          <div>CO₂</div><div>${p.life.co2}%</div>
          <div>Biomes</div><div>${biomes}</div>
        </div>
      `);
        }
        if (p.moons.length) {
            const rows = p.moons.map((m, i) => `<div>${p.name} · ${m.name}</div><div>${m.size} R⊕</div><div>${m.periodD} d</div>`).join('');
            addCard('Moons', `<div class="kv"><div><b>Name</b></div><div><b>Size</b></div><div><b>Period</b></div>${rows}</div>`);
        }
    }
    if (target.kind === 'moon') {
        const m = target.ref, p = target.parent;
        addCard(`${p.name} · ${m.name}`, `
      <div class="kv">
        <div>Size</div><div>${m.size} R⊕</div>
        <div>Period</div><div>${m.periodD} days</div>
        <div>Host</div><div>${p.name}</div>
      </div>
    `);
    }
}

// ---------- Controls ----------
function applySeed(seed) {
    state.system = generateSystem(seed);
    document.getElementById('systemName').textContent = state.system.name + ' · seed ' + state.system.seed;
    state.t = 0;
    state.pan = {x: 0, y: 0};
    state.zoom = 1;
    state.selected = null;
    showInInspector(null);
    try {
        history.replaceState(null, '', '#' + encodeURIComponent(state.system.seed));
    } catch {
    }
}

document.getElementById('btnRandom').onclick = () => {
    applySeed(Math.random().toString(36).slice(2));
    document.getElementById('seedInput').value = state.system.seed;
};
document.getElementById('btnPause').onclick = (e) => {
    state.paused = !state.paused;
    e.target.textContent = state.paused ? 'Resume' : 'Pause';
};
document.getElementById('chkOrbits').onchange = (e) => {
    state.showOrbits = e.target.checked;
};
document.getElementById('chkLabels').onchange = (e) => {
    state.showLabels = e.target.checked;
};
document.getElementById('btnReset').onclick = () => {
    state.zoom = 1;
    state.pan = {x: 0, y: 0};
};
// Apply seed from input field
function applyInputSeed() {
    const inputField = document.getElementById('seedInput');
    const seedValue = inputField.value.trim();
    applySeed(seedValue || Math.random().toString(36).slice(2));
    inputField.focus();
}

// Handle Apply button click
document.getElementById('applySeed').onclick = applyInputSeed;

// Handle Enter key in seed input field
document.getElementById('seedInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        applyInputSeed();
    }
});

document.getElementById('btnExportJson').onclick = () => {
    const data = JSON.stringify(state.system, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.system.name.replace(/\\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
};
document.getElementById('btnLink').onclick = async () => {
    const seed = state.system?.seed || '';
    const url = location.origin + location.pathname + '#' + encodeURIComponent(seed);
    try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    } catch {
        prompt('Copy link:', url);
    }
};

// Sci-Fi Mode has been removed

// ---------- Main loop ----------
let timeLast = performance.now();
let needsRedraw = true;

// Mark when the state changes and a redraw is needed
function markNeedsRedraw() {
    needsRedraw = true;
}

// Attach the markNeedsRedraw function to state-changing events
document.getElementById('chkOrbits').addEventListener('change', markNeedsRedraw);
document.getElementById('chkLabels').addEventListener('change', markNeedsRedraw);
document.getElementById('btnReset').addEventListener('click', markNeedsRedraw);

// Enhanced animation loop with optimization
function tick(now) {
    const dt = Math.min(0.05, (now - timeLast) / 1000);
    timeLast = now;

    if (canvas.width === 0 || canvas.height === 0) {
        resize();
        needsRedraw = true;
    }

    // Only update time when not paused
    if (!state.paused) {
        state.t += dt * 0.08;
        needsRedraw = true; // Always redraw when animating
    }

    // Only redraw when necessary
    if (needsRedraw) {
        const d = drawSystem();
        if (d) {
            hitCache = d.hits;
            lastFrameStarHit = d.starHit;
        }
        needsRedraw = false;
    }

    requestAnimationFrame(tick);
}

// ---------- Planet Detail View ----------
function openPlanetDetail(planet) {
    console.log('Opening planet detail for:', planet.name);
    const detailPanel = document.getElementById('planetDetail');
    const planetCanvas = document.getElementById('planetCanvas');
    const planetName = document.getElementById('planetDetailName');
    const planetStats = document.getElementById('planetDetailStats');
    
    if (!detailPanel || !planetCanvas) {
        console.error('Planet detail elements not found');
        return;
    }
    
    // Show panel (if not already shown)
    const wasHidden = detailPanel.style.display === 'none' || !detailPanel.style.display;
    detailPanel.style.display = 'block';
    
    // Update info immediately
    planetName.textContent = `${planet.name} (${planet.type})`;
    
    // Clear canvas while updating
    const planetCtx = planetCanvas.getContext('2d');
    planetCtx.clearRect(0, 0, planetCanvas.width, planetCanvas.height);
    
    planetStats.innerHTML = `
        <div>Orbit Distance</div><div>${planet.aAU} AU</div>
        <div>Orbital Period</div><div>${planet.periodY} years</div>
        <div>Eccentricity</div><div>${planet.ecc}</div>
        <div>Radius</div><div>${planet.radiusE} R⊕</div>
        <div>Mass</div><div>${planet.massE} M⊕</div>
        <div>Surface Temp</div><div>${planet.Teq} K</div>
        <div>Albedo</div><div>${planet.albedo}</div>
        <div>Atmosphere</div><div>${planet.atmosphere.desc}</div>
        <div>Pressure</div><div>${planet.atmosphere.pressure.toFixed(2)} bar</div>
        <div>Breathable</div><div>${planet.atmosphere.breathable ? "Yes" : "No"}</div>
        <div>Rings</div><div>${planet.hasRings ? "Yes" : "No"}</div>
        <div>Moons</div><div>${planet.moons.length}</div>
        <div>Life Detected</div><div>${planet.life.has ? planet.life.description : 'None'}</div>
    `;
    
    // Set up and render canvas (with appropriate delay if panel was just shown)
    const renderCanvas = () => {
        const planetCtx = planetCanvas.getContext('2d');
        const rect = planetCanvas.getBoundingClientRect();
        console.log('Canvas rect:', rect);
        
        planetCanvas.width = rect.width * window.devicePixelRatio;
        planetCanvas.height = rect.height * window.devicePixelRatio;
        planetCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Render planet detail
        drawPlanetDetail(planet, planetCanvas, planetCtx);
        console.log('Planet detail rendered for:', planet.name);
    };
    
    if (wasHidden) {
        // Panel was just shown, wait for layout
        setTimeout(renderCanvas, 50);
    } else {
        // Panel already open, render immediately
        renderCanvas();
    }
}

function closePlanetDetail() {
    document.getElementById('planetDetail').style.display = 'none';
}

// Close button handler
document.getElementById('closePlanetDetail').addEventListener('click', closePlanetDetail);

// Close on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePlanetDetail();
    }
});

resize();
const hashSeed = decodeURIComponent((location.hash || '').slice(1));
applySeed(hashSeed || Math.random().toString(36).slice(2));
document.getElementById('seedInput').value = state.system.seed;
requestAnimationFrame(tick);
