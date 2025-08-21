const { worldToScreen, drawStar, drawOrbit, drawLabel, clear } = require('../src/rendering');

describe('Rendering Functions', () => {
    // Setup mock state and context
    let mockState;
    let mockCtx;
    let mockCanvas;
    
    beforeEach(() => {
        mockCanvas = {
            width: 800,
            height: 600
        };
        
        mockCtx = {
            clearRect: jest.fn(),
            setTransform: jest.fn(),
            beginPath: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            fillText: jest.fn(),
            setLineDash: jest.fn(),
            createRadialGradient: jest.fn().mockReturnValue({
                addColorStop: jest.fn()
            })
        };
        
        mockState = {
            canvas: mockCanvas,
            DPR: 1,
            zoom: 1,
            pan: { x: 0, y: 0 },
            showLabels: true,
            system: {
                star: {
                    name: 'TestStar-123',
                    color: '#ffd15c'
                }
            }
        };
    });
    
    describe('Coordinate Transformations', () => {
        test('worldToScreen should convert world coordinates to screen coordinates', () => {
            // Test center point
            let [sx, sy] = worldToScreen(mockState, 0, 0);
            expect(sx).toBe(400); // Canvas width / 2
            expect(sy).toBe(300); // Canvas height / 2
            
            // Test with panning
            mockState.pan = { x: 50, y: -30 };
            [sx, sy] = worldToScreen(mockState, 0, 0);
            expect(sx).toBe(450); // (Canvas width / 2) + pan.x
            expect(sy).toBe(270); // (Canvas height / 2) + pan.y
            
            // Test with zooming
            mockState.zoom = 2;
            mockState.pan = { x: 0, y: 0 };
            [sx, sy] = worldToScreen(mockState, 100, 50);
            expect(sx).toBe(600); // Canvas width / 2 + (x * zoom)
            expect(sy).toBe(400); // Canvas height / 2 + (y * zoom)
        });
    });
    
    describe('Drawing Functions', () => {
        test('clear should reset transform and clear canvas', () => {
            clear(mockCtx, mockCanvas);
            expect(mockCtx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
            expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, mockCanvas.width, mockCanvas.height);
        });
        
        test('drawStar should create proper star visualization', () => {
            drawStar(mockCtx, mockState, mockState.system.star);
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.arc).toHaveBeenCalled();
            expect(mockCtx.fill).toHaveBeenCalled();
            expect(mockCtx.fillText).toHaveBeenCalledWith('TestStar-123', expect.any(Number), expect.any(Number));
        });
        
        test('drawOrbit should render orbital path', () => {
            drawOrbit(mockCtx, mockState, 400, 300, 100);
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.arc).toHaveBeenCalledWith(400, 300, 100, 0, expect.any(Number));
            expect(mockCtx.stroke).toHaveBeenCalled();
        });
        
        test('drawLabel should render text label', () => {
            drawLabel(mockCtx, mockState, 400, 300, 'Test Label');
            expect(mockCtx.fillText).toHaveBeenCalledWith('Test Label', 400, 300);
        });
        
        test('drawStar should not draw label when labels disabled', () => {
            mockState.showLabels = false;
            drawStar(mockCtx, mockState, mockState.system.star);
            // Verify fillText wasn't called for the label
            expect(mockCtx.fillText).not.toHaveBeenCalled();
        });
    });
});
