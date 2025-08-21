const { TAU } = require('./utils');

function worldToScreen(state, x, y) {
    const cx = state.canvas.width / 2 + state.pan.x * state.DPR;
    const cy = state.canvas.height / 2 + state.pan.y * state.DPR;
    return [cx + x * state.zoom, cy + y * state.zoom];
}

function drawStar(ctx, state, star) {
    const r = 28;
    const [sx, sy] = worldToScreen(state, 0, 0);
    const g = ctx.createRadialGradient(sx, sy, r * 0.1 * state.DPR, sx, sy, r * 6 * state.DPR);
    g.addColorStop(0, star.color + 'cc');
    g.addColorStop(1, '#0000');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 6 * state.DPR, 0, TAU);
    ctx.fill();
    
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(sx, sy, r * state.DPR, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx - r * 0.3 * state.DPR, sy - r * 0.3 * state.DPR, r * 0.6 * state.DPR, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    if (state.showLabels) {
        drawLabel(ctx, state, sx, sy - 36 * state.DPR, state.system.star.name);
    }
    return {x: sx, y: sy, r: r * state.DPR};
}

function drawOrbit(ctx, state, cx, cy, radius) {
    ctx.strokeStyle = 'rgba(120,145,210,0.25)';
    ctx.lineWidth = state.DPR;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.stroke();
}

function drawLabel(ctx, state, sx, sy, text) {
    ctx.font = `${12 * state.DPR}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(text, sx, sy);
}

function clear(ctx, canvas) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

module.exports = {
    worldToScreen,
    drawStar,
    drawOrbit,
    drawLabel,
    clear
};