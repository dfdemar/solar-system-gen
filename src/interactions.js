function updateTooltip(tooltipElement, target, clientX, clientY) {
    if (!target) {
        tooltipElement.style.display = 'none';
        return;
    }

    tooltipElement.innerHTML = renderTooltipHTML(target);
    tooltipElement.style.display = 'block';
    const rect = tooltipElement.getBoundingClientRect();
    let x = clientX + 14, y = clientY + 14;
    if (x + rect.width > window.innerWidth - 8) x = clientX - rect.width - 12;
    if (y + rect.height > window.innerHeight - 8) y = clientY - rect.height - 12;
    tooltipElement.style.left = x + 'px';
    tooltipElement.style.top = y + 'px';
}

function renderTooltipHTML(t) {
    if (t.kind === 'star') {
        const s = t.ref;
        return `<h4>${s.name} <span class="sub">(${s.spectral}-type)</span></h4>
      <div class="kv">
        <div>Mass</div><div>${s.mass} M☉</div>
        <div>Radius</div><div>${s.radiusSolar} R☉</div>
        <div>Temp</div><div>${s.temp} K</div>
        <div>Luminosity</div><div>${s.luminosity.toFixed(2)} L☉</div>
        <div>HZ</div><div>${s.hz[0]}-${s.hz[1]} AU</div>
      </div>`;
    }

    if (t.kind === 'planet') {
        const p = t.ref;
        const lifePill = p.life.has
            ? `<span class="pill">Life: ${p.life.description}</span>`
            : '<span class="pill" style="background:#2d1220;border-color:#5a2a3e;color:#ff9db8">No Life</span>';
        return `<h4>${p.name} <span class="sub">${p.type}</span></h4>
      ${lifePill}
      <div class="kv">
        <div>Orbit</div><div>${p.aAU} AU</div>
        <div>Period</div><div>${p.periodY} years</div>
        <div>Radius</div><div>${p.radiusE} R⊕</div>
        <div>Mass</div><div>${p.massE} M⊕</div>
        <div>Teq</div><div>${p.Teq} K</div>
        <div>Albedo</div><div>${p.albedo}</div>
        <div>Atmos.</div><div>${p.atmosphere.desc}</div>
        <div>Moons</div><div>${p.moons.length}</div>
        ${p.life.has ? `<div>Life class</div><div>${p.life.complexity}</div>
                       <div>Water</div><div>${p.life.water}%</div>
                       <div>O₂</div><div>${p.life.o2}%</div>
                       <div>CH₄</div><div>${p.life.ch4ppm} ppm</div>
                       <div>Biosignature</div><div>${(p.life.biosignature * 100).toFixed(0)}%</div>` : ''}
      </div>`;
    }

    if (t.kind === 'moon') {
        const m = t.ref, p = t.parent;
        return `<h4>${p.name} · ${m.name} <span class="sub">moon</span></h4>
      <div class="kv">
        <div>Size</div><div>${m.size} R⊕</div>
        <div>Orbital period</div><div>${m.periodD} days</div>
        <div>Host</div><div>${p.name}</div>
      </div>`;
    }

    return '';
}

function pickTargetAt(x, y, starHit, hitCache) {
    for (let i = hitCache.length - 1; i >= 0; i--) {
        const h = hitCache[i];
        const dx = x - h.x, dy = y - h.y;
        if (dx * dx + dy * dy <= (h.r + 3) ** 2) return h;
    }

    const dx = x - starHit.x, dy = y - starHit.y;
    if (dx * dx + dy * dy <= (starHit.r + 6) ** 2) {
        return {
            kind: 'star',
            ref: starHit.ref,
            x: starHit.x,
            y: starHit.y,
            r: starHit.r
        };
    }

    return null;
}

function showInInspector(target, cardsElement, selectionTypeElement) {
    cardsElement.innerHTML = '';
    if (!target) {
        selectionTypeElement.textContent = '(none)';
        return;
    }

    selectionTypeElement.textContent = target.kind;

    function addCard(title, html) {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${title}</h3>${html}`;
        cardsElement.appendChild(div);
    }

    if (target.kind === 'star') {
        const s = target.ref;
        addCard(`${s.name} (${s.spectral}-type)`, `
      <div class="kv">
        <div>Mass</div><div>${s.mass} M☉</div>
        <div>Radius</div><div>${s.radiusSolar} R☉</div>
        <div>Temperature</div><div>${s.temp} K</div>
        <div>Luminosity</div><div>${s.luminosity} L☉</div>
        <div>Habitable Zone</div><div>${s.hz[0]}-${s.hz[1]} AU</div>
      </div>
    `);
    }

    if (target.kind === 'planet') {
        const p = target.ref;
        addCard(`${p.name} · ${p.type}`, `
      <div class="kv">
        <div>Orbit (a)</div><div>${p.aAU} AU</div>
        <div>Period</div><div>${p.periodY} years</div>
        <div>Eccentricity</div><div>${p.ecc}</div>
        <div>Radius</div><div>${p.radiusE} R⊕</div>
        <div>Mass</div><div>${p.massE} M⊕</div>
        <div>Albedo</div><div>${p.albedo}</div>
        <div>Teq</div><div>${p.Teq} K</div>
        <div>Atmosphere</div><div>${p.atmosphere.desc} · ${p.atmosphere.pressure.toFixed(2)} bar ${p.atmosphere.breathable ? "· breathable" : ""}</div>
        <div>Rings</div><div>${p.hasRings ? "yes" : "no"}</div>
        <div>Moons</div><div>${p.moons.length}</div>
        <div>Life</div><div>${p.life.has ? p.life.description : 'none detected'}</div>
      </div>
    `);
    }

    if (target.kind === 'moon') {
        const m = target.ref, p = target.parent;
        addCard(`${p.name} · ${m.name}`, `
      <div class="kv">
        <div>Size</div><div>${m.size} R⊕</div>
        <div>Period</div><div>${m.periodD} days</div>
        <div>Host</div><div>${p.name}</div>
      </div>
    `);
    }
}

module.exports = {
    updateTooltip,
    renderTooltipHTML,
    pickTargetAt,
    showInInspector
};
