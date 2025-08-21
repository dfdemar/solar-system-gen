const {
    SPEC_CLASSES,
    ROCKY_COLORS,
    ICE_COLORS,
    randomAnalogousColors,
    pickSpec,
    computeLuminosity,
    hzFromLum,
    nameSystem
} = require('../src/generation');

describe('Generation Systems', () => {
    describe('Star Properties', () => {
        test('SPEC_CLASSES should contain spectral classes', () => {
            expect(SPEC_CLASSES).toBeInstanceOf(Array);
            expect(SPEC_CLASSES.length).toBeGreaterThan(0);
            
            // Check a specific class (G-type star like our Sun)
            const gClass = SPEC_CLASSES.find(spec => spec.c === 'G');
            expect(gClass).toBeDefined();
            expect(gClass.temp[0]).toBeLessThan(gClass.temp[1]);
            expect(gClass.mass[0]).toBeLessThan(gClass.mass[1]);
            expect(gClass.color).toMatch(/#[0-9a-f]{6}/i);
        });
        
        test('ROCKY_COLORS should contain color values', () => {
            expect(ROCKY_COLORS).toBeInstanceOf(Array);
            expect(ROCKY_COLORS.length).toBeGreaterThan(0);
            ROCKY_COLORS.forEach(color => {
                expect(color).toMatch(/#[0-9a-f]{6}/i);
            });
        });
        
        test('ICE_COLORS should contain color values', () => {
            expect(ICE_COLORS).toBeInstanceOf(Array);
            expect(ICE_COLORS.length).toBeGreaterThan(0);
            ICE_COLORS.forEach(color => {
                expect(color).toMatch(/#[0-9a-f]{6}/i);
            });
        });
    });

    describe('Color Generation', () => {
        test('randomAnalogousColors should generate correct number of colors', () => {
            const mockRng = { rand: () => 0.5 };
            const colors = randomAnalogousColors(mockRng, 5);
            expect(colors).toHaveLength(5);
            colors.forEach(color => {
                expect(color).toMatch(/hsl\(\d+,\d+%,\d+%\)/);
            });
        });
        
        test('randomAnalogousColors should use provided baseHue', () => {
            const mockRng = { rand: () => 0 };
            const colors = randomAnalogousColors(mockRng, 3, 180);
            expect(colors[0]).toMatch(/hsl\(\d+,\d+%,\d+%\)/);
        });
    });
    
    describe('Star Generation', () => {
        test('pickSpec should return a spectral class', () => {
            // Mock RNG to always pick the middle of distribution
            const mockRng = { rand: () => 0.5 };
            const spec = pickSpec(mockRng);
            expect(spec).toHaveProperty('c');
            expect(spec).toHaveProperty('temp');
            expect(spec).toHaveProperty('mass');
            expect(spec).toHaveProperty('color');
        });
        
        test('computeLuminosity should calculate correct star luminosity', () => {
            // For Sun-like star (1.0 solar mass)
            expect(computeLuminosity(1.0)).toBeCloseTo(1.0, 1);
            
            // For more massive star (2.0 solar masses)
            expect(computeLuminosity(2.0)).toBeCloseTo(11.3, 1);
        });
        
        test('hzFromLum should calculate habitable zone boundaries', () => {
            // For Sun-like star (1.0 luminosity)
            const [inner, outer] = hzFromLum(1.0);
            expect(inner).toBeCloseTo(0.95, 1);
            expect(outer).toBeCloseTo(1.37, 1);
        });
        
        test('nameSystem should generate plausible star system names', () => {
            const mockRng = { rand: () => 0.5 };
            const name = nameSystem(mockRng);
            expect(typeof name).toBe('string');
            expect(name).toMatch(/^[A-Z][a-z]+\-\d{3}$/);
        });
    });
});
