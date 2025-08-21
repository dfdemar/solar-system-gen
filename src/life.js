const { makeRng, randRange, choice, clamp } = require('./utils');

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

module.exports = {
    evaluateLife,
    makeAtmosphere
};