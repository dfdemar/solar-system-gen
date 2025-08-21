// RNG utilities
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

module.exports = {
    xmur3,
    mulberry32,
    makeRng,
    randRange,
    choice,
    clamp,
    TAU
};
