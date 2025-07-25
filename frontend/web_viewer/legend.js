// legend.js
// Renders the dynamic legend for entity types and colors

export function renderLegend(entityTypes, colorMap) {
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';
    entityTypes.forEach(type => {
        const color = colorMap && colorMap[type] ? colorMap[type] : '#888';
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <span class="legend-color" style="background:${color};display:inline-block;width:16px;height:16px;border-radius:50%;margin-right:10px;vertical-align:middle;"></span>
            <span>${type}</span>
        `;
        legendContainer.appendChild(item);
    });
}
