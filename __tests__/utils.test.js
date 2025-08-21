const { 
    xmur3, 
    mulberry32, 
    makeRng, 
    randRange, 
    choice, 
    clamp, 
    TAU 
} = require('../src/utils');

describe('Utility Functions', () => {
    describe('Random Number Generation', () => {
        test('xmur3 should return a function', () => {
            const seedFn = xmur3('test-seed');
            expect(typeof seedFn).toBe('function');
        });

        test('xmur3 function should return a number', () => {
            const seedFn = xmur3('test-seed');
            expect(typeof seedFn()).toBe('number');
        });

        test('mulberry32 should return a function', () => {
            const randFn = mulberry32(12345);
            expect(typeof randFn).toBe('function');
        });

        test('mulberry32 function should return a number between 0 and 1', () => {
            const randFn = mulberry32(12345);
            const result = randFn();
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(1);
        });

        test('makeRng should return an object with seed and rand properties', () => {
            const rng = makeRng('test-seed');
            expect(rng).toHaveProperty('seed', 'test-seed');
            expect(typeof rng.rand).toBe('function');
        });

        test('makeRng should generate a seed if none is provided', () => {
            const rng = makeRng('');
            expect(typeof rng.seed).toBe('string');
            expect(rng.seed.length).toBeGreaterThan(0);
        });

        test('randRange should return a number within the specified range', () => {
            const mockRng = { rand: () => 0.5 };
            expect(randRange(mockRng, 0, 10)).toBe(5);
            expect(randRange(mockRng, -10, 10)).toBe(0);
            expect(randRange(mockRng, 100, 200)).toBe(150);
        });

        test('choice should return an item from the array', () => {
            const mockRng = { rand: () => 0.5 };
            const arr = [1, 2, 3, 4, 5];
            // With rand = 0.5, index = 0.5 * 5 = 2.5, floor(2.5) = 2
            expect(choice(mockRng, arr)).toBe(3);
        });

        test('same seed in makeRng produces the same sequence', () => {
            const rng1 = makeRng('fixed-seed');
            const rng2 = makeRng('fixed-seed');
            
            // Should produce the same sequence of 5 numbers
            for (let i = 0; i < 5; i++) {
                expect(rng1.rand()).toBe(rng2.rand());
            }
        });
    });

    describe('Math Helpers', () => {
        test('clamp should constrain values to specified range', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-5, 0, 10)).toBe(0);
            expect(clamp(15, 0, 10)).toBe(10);
        });

        test('TAU should equal 2π', () => {
            expect(TAU).toBe(Math.PI * 2);
        });
    });
});