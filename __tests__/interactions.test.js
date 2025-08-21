const {
    updateTooltip,
    renderTooltipHTML,
    pickTargetAt,
    showInInspector
} = require('../src/interactions');

describe('User Interactions', () => {
    describe('Tooltip Rendering', () => {
        test('renderTooltipHTML should format star info', () => {
            const mockStar = {
                kind: 'star',
                ref: {
                    name: 'TestStar-123',
                    spectral: 'G',
                    mass: 1.0,
                    radiusSolar: 1.0,
                    temp: 5800,
                    luminosity: 1.0,
                    hz: [0.95, 1.37]
                }
            };
            
            const html = renderTooltipHTML(mockStar);
            expect(html).toContain('TestStar-123');
            expect(html).toContain('G-type');
            expect(html).toContain('5800 K');
            expect(html).toContain('0.95-1.37 AU');
        });
        
        test('renderTooltipHTML should format planet info', () => {
            const mockPlanet = {
                kind: 'planet',
                ref: {
                    name: 'TestStar-123 A',
                    type: 'rocky',
                    aAU: 1.0,
                    periodY: 1.0,
                    radiusE: 1.0,
                    massE: 1.0,
                    Teq: 288,
                    albedo: 0.3,
                    atmosphere: {
                        desc: 'N₂-O₂ (Earthlike)',
                        pressure: 1.0
                    },
                    moons: [],
                    life: {
                        has: true,
                        description: 'microbial mats in shallow seas',
                        complexity: 'microbial',
                        water: 70,
                        o2: 5,
                        ch4ppm: 100,
                        biosignature: 0.5
                    }
                }
            };
            
            const html = renderTooltipHTML(mockPlanet);
            expect(html).toContain('TestStar-123 A');
            expect(html).toContain('rocky');
            expect(html).toContain('1 AU');
            expect(html).toContain('Life: microbial mats in shallow seas');
        });
        
        test('renderTooltipHTML should format moon info', () => {
            const mockMoon = {
                kind: 'moon',
                ref: {
                    name: 'm1',
                    size: 0.3,
                    periodD: 10.5
                },
                parent: {
                    name: 'TestStar-123 A'
                }
            };
            
            const html = renderTooltipHTML(mockMoon);
            expect(html).toContain('TestStar-123 A · m1');
            expect(html).toContain('0.3 R⊕');
            expect(html).toContain('10.5 days');
        });
    });
    
    describe('Target Selection', () => {
        test('pickTargetAt should find star when within radius', () => {
            const mockStarHit = {
                x: 400,
                y: 300,
                r: 28,
                ref: { name: 'TestStar-123' }
            };
            
            const hitCache = [];
            
            // Check point inside star
            const target = pickTargetAt(405, 305, mockStarHit, hitCache);
            expect(target).not.toBeNull();
            expect(target.kind).toBe('star');
        });
        
        test('pickTargetAt should find planet when within radius', () => {
            const mockStarHit = {
                x: 400,
                y: 300,
                r: 28,
                ref: { name: 'TestStar-123' }
            };
            
            const mockPlanet = {
                kind: 'planet',
                ref: { name: 'TestStar-123 A' },
                x: 500,
                y: 300,
                r: 20
            };
            
            const hitCache = [mockPlanet];
            
            // Check point inside planet
            const target = pickTargetAt(505, 305, mockStarHit, hitCache);
            expect(target).not.toBeNull();
            expect(target.kind).toBe('planet');
            expect(target.ref.name).toBe('TestStar-123 A');
        });
        
        test('pickTargetAt should return null when no hit', () => {
            const mockStarHit = {
                x: 400,
                y: 300,
                r: 28,
                ref: { name: 'TestStar-123' }
            };
            
            const mockPlanet = {
                kind: 'planet',
                ref: { name: 'TestStar-123 A' },
                x: 500,
                y: 300,
                r: 20
            };
            
            const hitCache = [mockPlanet];
            
            // Check point far from any object
            const target = pickTargetAt(600, 600, mockStarHit, hitCache);
            expect(target).toBeNull();
        });
    });
    
    describe('Inspector Updates', () => {
        let mockCardsElement, mockSelectionTypeElement;
        
        beforeEach(() => {
            mockCardsElement = {
                innerHTML: '',
                appendChild: jest.fn()
            };
            
            mockSelectionTypeElement = {
                textContent: ''
            };
            
            // Mock document.createElement
            global.document.createElement = jest.fn().mockImplementation(() => {
                return {
                    className: '',
                    innerHTML: ''
                };
            });
        });
        
        test('showInInspector should update selection type for star', () => {
            const mockStar = {
                kind: 'star',
                ref: {
                    name: 'TestStar-123',
                    spectral: 'G',
                    mass: 1.0,
                    radiusSolar: 1.0,
                    temp: 5800,
                    luminosity: 1.0,
                    hz: [0.95, 1.37]
                }
            };
            
            showInInspector(mockStar, mockCardsElement, mockSelectionTypeElement);
            expect(mockSelectionTypeElement.textContent).toBe('star');
            expect(mockCardsElement.appendChild).toHaveBeenCalled();
        });
        
        test('showInInspector should clear display when no selection', () => {
            showInInspector(null, mockCardsElement, mockSelectionTypeElement);
            expect(mockSelectionTypeElement.textContent).toBe('(none)');
            expect(mockCardsElement.innerHTML).toBe('');
            expect(mockCardsElement.appendChild).not.toHaveBeenCalled();
        });
    });
});