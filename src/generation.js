const { makeRng, randRange, choice, clamp } = require('./utils');

// Star spectral classes with properties
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

const ICE_COLORS = ["#bfe3ff", "#cfeaff", "#d9f3ff", "#f0fbff", "#a3d6ff"];

function randomAnalogousColors(r, count = 7, baseHue = null) {
    if (baseHue === null) baseHue = Math.floor(randRange(r, 180, 360));
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i - (count / 2)) * 18 + randRange(r, -6, 6)) % 360;
        const sat = randRange(r, 65, 90);
        const light = randRange(r, 55, 70);
        colors.push(`hsl(${Math.round(hue)},${Math.round(sat)}%,${Math.round(light)}%)`);
    }
    return colors;
}

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

module.exports = {
    SPEC_CLASSES,
    ROCKY_COLORS,
    ICE_COLORS,
    randomAnalogousColors,
    pickSpec,
    computeLuminosity,
    hzFromLum,
    nameSystem
};