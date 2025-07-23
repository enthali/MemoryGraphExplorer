// filter.js
// Handles dynamic filter UI for entity types in the knowledge graph

export function renderEntityTypeFilter(entityTypes, onChange, colorMap) {
    const filterDropdown = document.getElementById('filter-dropdown');
    const filterOptions = filterDropdown.querySelector('.filter-options');
    filterOptions.innerHTML = '';

    entityTypes.forEach(type => {
        const label = document.createElement('label');
        label.className = 'filter-option';
        const color = colorMap && colorMap[type] ? colorMap[type] : '#888';
        label.innerHTML = `
            <input type="checkbox" value="${type}" checked style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">
            <span class="checkmark"></span>
            <span class="color-dot" style="background:${color};display:inline-block;width:16px;height:16px;border-radius:50%;margin-right:10px;vertical-align:middle;"></span>
            <span>${type}</span>
        `;
        const checkbox = label.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', onChange);
        filterOptions.appendChild(label);
    });
}
