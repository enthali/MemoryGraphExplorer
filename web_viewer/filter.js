// filter.js
// Handles dynamic filter UI for entity types in the knowledge graph

export function renderEntityTypeFilter(entityTypes, onChange) {
    const filterDropdown = document.getElementById('filter-dropdown');
    const filterOptions = filterDropdown.querySelector('.filter-options');
    filterOptions.innerHTML = '';

    entityTypes.forEach(type => {
        const label = document.createElement('label');
        label.className = 'filter-option';
        label.innerHTML = `
            <input type="checkbox" value="${type}" checked>
            <span class="checkmark"></span>
            ${type}
        `;
        const checkbox = label.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', onChange);
        filterOptions.appendChild(label);
    });
}
