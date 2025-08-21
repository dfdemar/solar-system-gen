const { randRange } = require('./utils');

function makeMoons(r, type, radiusE) {
    let n = 0;
    // For testing determinism
    let rand1 = r.rand();
    let rand2 = r.rand();
    
    if (type === 'rocky') {
        // Use the pre-generated random values
        n = rand1 > 0.6 ? Math.floor(randRange(r, 1, 2.6)) : (rand2 > 0.9 ? 1 : 0);
    }
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

module.exports = {
    makeMoons
};