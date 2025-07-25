// infoPanel.js
// Handles rendering and updating the info panel for the selected/center node

export function renderInfoPanel(entity, getEntityTypeClass, getEntityConnections) {
    const panel = document.getElementById('info-panel');
    const entityName = document.getElementById('entity-name');
    const entityType = document.getElementById('entity-type');
    const observationsList = document.getElementById('observations-list');
    const connectionsList = document.getElementById('connections-list');

    if (!entity) {
        entityName.textContent = '';
        entityType.textContent = '';
        observationsList.innerHTML = '';
        connectionsList.innerHTML = '';
        return;
    }

    // Set entity name and type
    entityName.textContent = entity.name;
    entityType.textContent = entity.entityType;
    entityType.className = `entity-type ${getEntityTypeClass(entity.entityType)}`;

    // Show observations
    observationsList.innerHTML = '';
    (entity.observations || []).forEach(obs => {
        const li = document.createElement('li');
        li.textContent = obs;
        observationsList.appendChild(li);
    });

    // Show connections
    const connections = getEntityConnections(entity.name);
    connectionsList.innerHTML = '';
    connections.forEach(conn => {
        const div = document.createElement('div');
        div.className = 'connection-item';
        div.innerHTML = `
            <span class="connection-type">${conn.relationType}</span>
            <span class="connection-target">${conn.target}</span>
        `;
        div.addEventListener('click', () => conn.onClick && conn.onClick(conn.target));
        connectionsList.appendChild(div);
    });
}
