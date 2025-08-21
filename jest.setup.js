// Mock for HTML Canvas
class MockCanvas {
  constructor() {
    this.width = 800;
    this.height = 600;
  }

  getContext() {
    return {
      clearRect: jest.fn(),
      setTransform: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      clip: jest.fn(),
      fillRect: jest.fn(),
      ellipse: jest.fn(),
      fillText: jest.fn(),
      createRadialGradient: () => ({
        addColorStop: jest.fn()
      }),
      setLineDash: jest.fn(),
      measureText: () => ({ width: 100 })
    };
  }
}

// Mock for DOM elements
Object.defineProperty(global.document, 'getElementById', {
  value: (id) => {
    switch (id) {
      case 'canvas':
        return new MockCanvas();
      case 'viewport':
        return {
          getBoundingClientRect: () => ({ width: 800, height: 600 }),
          addEventListener: jest.fn()
        };
      case 'seedInput':
      case 'systemName':
      case 'selectionType':
      case 'cards':
      case 'tooltip':
        return {
          value: '',
          textContent: '',
          style: {},
          focus: jest.fn(),
          innerHTML: '',
          appendChild: jest.fn(),
          addEventListener: jest.fn()
        };
      case 'btnRandom':
      case 'btnPause':
      case 'btnReset':
      case 'applySeed':
      case 'chkOrbits':
      case 'chkLabels':
      case 'btnExportJson':
      case 'btnLink':
        return {
          addEventListener: jest.fn(),
          onclick: null,
          onchange: null,
          checked: true
        };
      default:
        return null;
    }
  },
  writable: true
});

// Mock performance.now
global.performance = {
  now: () => Date.now()
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock the URL class
global.URL = {
  createObjectURL: jest.fn(() => 'blob://mock-url'),
  revokeObjectURL: jest.fn()
};

// Mock navigator clipboard
global.navigator.clipboard = {
  writeText: jest.fn().mockResolvedValue(undefined)
};

// Mock alert and prompt
global.alert = jest.fn();
global.prompt = jest.fn();

// Mock history
global.history = {
  replaceState: jest.fn()
};
