const { makeMoons } = require('../src/moons');

describe('Moon Generation', () => {
    test('makeMoons should generate moons for gas giants', () => {
        // Forcing RNG to produce several moons
        const mockRng = { 
            rand: () => 0.5,
            seed: 'test-seed'
        };
        
        const moons = makeMoons(mockRng, 'gas giant', 10);
        
        expect(Array.isArray(moons)).toBe(true);
        expect(moons.length).toBeGreaterThan(1);
        
        // Check individual moon properties
        const firstMoon = moons[0];
        expect(firstMoon).toHaveProperty('kind', 'moon');
        expect(firstMoon).toHaveProperty('name');
        expect(firstMoon).toHaveProperty('size');
        expect(firstMoon).toHaveProperty('aRel');
        expect(firstMoon).toHaveProperty('periodD');
        expect(firstMoon).toHaveProperty('color');
        
        // Check that moon orbital distances increase
        for (let i = 1; i < moons.length; i++) {
            expect(moons[i].aRel).toBeGreaterThan(moons[i-1].aRel);
        }
    });
    
    test('makeMoons should generate fewer moons for rocky planets', () => {
        // Mock RNG to generate some moons for rocky planets
        const mockRng = {
            rand: () => 0.3, // Value less than 0.6 to generate some moons
            seed: 'test-seed'
        };
        
        const moons = makeMoons(mockRng, 'rocky', 1);
        
        expect(Array.isArray(moons)).toBe(true);
        // For rocky planets, n is calculated differently, should be fewer
        expect(moons.length).toBeLessThanOrEqual(2);
    });
    
    test('makeMoons should handle zero moons case', () => {
        // Mock RNG to generate no moons
        const mockRng = {
            // First value > 0.6, second value > 0.9 for rocky planets to have 0 moons
            rand: jest.fn()
                .mockReturnValueOnce(0.7) 
                .mockReturnValueOnce(0.95),
            seed: 'test-seed'
        };
        
        const moons = makeMoons(mockRng, 'rocky', 1);
        
        expect(Array.isArray(moons)).toBe(true);
        expect(moons.length).toBe(0);
    });
    
    test('makeMoons should respect maximum moon limit', () => {
        // Force RNG to generate many moons
        const mockRng = {
            rand: () => 0.1,
            seed: 'test-seed'
        };
        
        const moons = makeMoons(mockRng, 'gas giant', 12);
        
        expect(moons.length).toBeLessThanOrEqual(12); // The max limit in the function
    });
});