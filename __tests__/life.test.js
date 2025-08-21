const { evaluateLife, makeAtmosphere } = require('../src/life');

describe('Life and Atmosphere Systems', () => {
    describe('Atmosphere Generation', () => {
        test('makeAtmosphere should generate atmosphere for rocky planets', () => {
            const mockRng = { rand: () => 0.5, seed: 'test-seed' };
            const atm = makeAtmosphere(mockRng, 'rocky');
            
            expect(atm).toHaveProperty('desc');
            expect(atm).toHaveProperty('pressure');
            expect(atm).toHaveProperty('breathable');
        });

        test('makeAtmosphere should generate atmosphere for gas giants', () => {
            const mockRng = { rand: () => 0.5, seed: 'test-seed' };
            const atm = makeAtmosphere(mockRng, 'gas giant');
            
            expect(atm).toHaveProperty('desc');
            expect(atm.desc).toContain('H₂-He');
            expect(atm.pressure).toBeGreaterThan(40);
            expect(atm.breathable).toBe(false);
        });

        test('makeAtmosphere should generate atmosphere for ice giants', () => {
            const mockRng = { rand: () => 0.5, seed: 'test-seed' };
            const atm = makeAtmosphere(mockRng, 'ice giant');
            
            expect(atm).toHaveProperty('desc');
            expect(atm.desc).toContain('H₂-He-CH₄');
            expect(atm.pressure).toBeGreaterThan(10);
            expect(atm.breathable).toBe(false);
        });
    });

    describe('Life Evaluation', () => {
        test('evaluateLife should produce life data structure', () => {
            const mockRng = { rand: () => 0.2, seed: 'test-seed' };
            const mockHz = [0.95, 1.37];
            const mockAtm = { desc: "N₂-O₂ (Earthlike)", pressure: 1.0, breathable: true };
            
            // Ideal conditions for life
            const life = evaluateLife(mockRng, 'rocky', 1.0, mockHz, mockAtm, 290);
            
            expect(life).toHaveProperty('has');
            expect(life).toHaveProperty('description');
            expect(life).toHaveProperty('complexity');
            expect(life).toHaveProperty('water');
            expect(life).toHaveProperty('o2');
            expect(life).toHaveProperty('biosignature');
        });
        
        test('evaluateLife should detect habitable conditions', () => {
            // Low RNG value to ensure life is detected with good conditions
            const mockRng = { rand: () => 0.2, seed: 'test-seed' }; 
            const mockHz = [0.95, 1.37];
            const mockAtm = { desc: "N₂-O₂ (Earthlike)", pressure: 1.0, breathable: true };
            
            // Ideal conditions for life
            const life = evaluateLife(mockRng, 'rocky', 1.0, mockHz, mockAtm, 290);
            
            expect(life.has).toBe(true);
            expect(life.description).not.toBe("none detected");
            expect(life.complexity).toBe('complex multicellular');
            expect(life.water).toBeGreaterThan(0);
            expect(life.o2).toBeGreaterThan(0);
        });
        
        test('evaluateLife should reject unfavorable conditions', () => {
            // High RNG value to ensure life isn't detected with bad conditions
            const mockRng = { rand: () => 0.9, seed: 'test-seed' }; 
            const mockHz = [0.95, 1.37];
            const mockAtm = { desc: "No significant atmosphere", pressure: 0.01, breathable: false };
            
            // Bad conditions for life (too far from habitable zone, no atmosphere)
            const life = evaluateLife(mockRng, 'rocky', 3.0, mockHz, mockAtm, 180);
            
            expect(life.has).toBe(false);
            expect(life.description).toBe("none detected");
            expect(life.complexity).toBe('none');
            expect(life.water).toBe(0);
            expect(life.o2).toBe(0);
        });
    });
});