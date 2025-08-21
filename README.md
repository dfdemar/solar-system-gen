# Procedural Solar System Generator

An interactive web-based procedural solar system generator that creates scientifically plausible star systems with planets, moons, and potential life.

![Solar System Generator](https://placeholder-for-screenshot.png)

## Features

- **Procedural Generation**: Create unlimited unique star systems based on random seeds
- **Scientific Realism**: Generates stars, planets, and moons with plausible parameters
- **Interactive Exploration**:
  - Pan and zoom the system view
  - Hover over objects for quick info
  - Click objects for detailed information
  - Toggle orbit lines and labels
- **Sharing & Export**:
  - Export system data as JSON
  - Share systems via URL (seed is stored in the URL hash)
- **Clean Visual Style**: Modern, space-themed UI for an immersive experience
- **Life Simulation**: Procedurally generates potential life forms with varying complexity

## Try It Out

You can try the generator by simply opening `index.html` in a web browser or serving it with a local development server:

```bash
# Using Python
python -m http.server

# Using Node.js
npx serve

# Or simply open the file directly
open index.html
```

## How It Works

The generator uses a seeded random number generator to ensure the same seed always produces the same system. The generation process follows these steps:

1. **Star Creation**: Generates a star with realistic spectral class, mass, radius, temperature, and luminosity
2. **Planet Generation**: Creates planets at varying distances with appropriate types (rocky, gas giant, ice giant)
3. **Moon Generation**: Adds moons to planets based on their type and size
4. **Life Evaluation**: Determines the probability and type of life based on planet conditions

The entire system is rendered on HTML5 Canvas with interactive controls for exploration.

## Technical Details

- **Pure Client-Side**: No server required, everything runs in the browser
- **Vanilla JavaScript**: No external dependencies
- **Responsive Design**: Works on various screen sizes
- **Deterministic Generation**: Same seed always produces the same system

## Scientific Parameters

The generator simulates various astronomical parameters:

- **Stars**: Spectral classes (O, B, A, F, G, K, M) with appropriate temperature and mass ranges
- **Planets**: Distance from star, mass, radius, orbital period, eccentricity
- **Atmospheres**: Composition, pressure, breathability
- **Habitability**: Temperature, water presence, biosignatures
- **Life**: Various forms from microbial to complex multicellular, with different metabolisms

## Testing

The project includes comprehensive test coverage using Jest:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

The test suite covers:
- Utility functions (RNG, math helpers)
- Generation systems (stars, planets, moons, atmospheres)
- Rendering functions with canvas mocking
- User interactions

Continuous integration is set up with GitHub Actions to run tests on every push and pull request.

## Contributing

Contributions are welcome! Feel free to submit pull requests or open issues for bugs and feature requests. All contributions should include appropriate tests.

## License

[MIT](LICENSE)
