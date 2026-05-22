// ==================== Group Management ====================
import { state } from './state.js';
import { elements } from './dom.js';
import { showToast } from './toast.js';
import { getSotiGroups } from './api.js';
import { updateApplyButton } from './data-grid.js';
import { fetchAndDisplayGroupData } from './group-info.js';

export async function refreshGroups() {
    if (!state.isConnected) return;

    try {
        state.groups = await getSotiGroups(state.serverUrl, state.token);
        renderGroups(state.groups);
    } catch (error) {
        showToast(`Failed to load groups: ${error.message}`, 'error');
    }
}

function setGroupSelection(group, isSelected) {
    const id = group.ReferenceId || group.referenceId || group.DeviceGroupId || group.Id;
    const path = group.Path || group.Name;
    const div = document.querySelector(`.group-item[data-id="${id}"]`);

    if (div) {
        const checkbox = div.querySelector('.group-checkbox');

        if (isSelected) {
            div.classList.add('selected');
            if (checkbox) {
                checkbox.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd" />
                    </svg>`;
            }
        } else {
            div.classList.remove('selected');
            if (checkbox) {
                checkbox.innerHTML = '';
            }
        }
    }

    if (isSelected) {
        if (!state.selectedGroups.some(g => g.path === path)) {
            state.selectedGroups.push({ id, path });
        }
    } else {
        state.selectedGroups = state.selectedGroups.filter(g => g.path !== path);
        if (state.currentlyViewedGroup === path) {
            state.currentlyViewedGroup = null;
            const titleElement = document.getElementById('group-info-title');
            if (titleElement) {
                titleElement.textContent = 'Current Group Data';
            }
            updateCurrentlyViewedGroupIndicator();
        }
    }
}

function buildGroupTree(groups) {
    const pathToNode = {};
    const rootNodes = [];

    groups.forEach(group => {
        const path = group.Path || group.Name || 'Unknown';
        const id = group.ReferenceId || group.referenceId || group.DeviceGroupId || group.Id;
        const name = path.split('\\').pop() || group.Name || '?';

        pathToNode[path] = {
            group,
            path,
            id,
            name,
            children: [],
            depth: 0
        };
    });

    const sortedNodes = Object.values(pathToNode).sort((a, b) => {
        return a.path.split('\\').length - b.path.split('\\').length;
    });

    sortedNodes.forEach(node => {
        const pathParts = node.path.split('\\');
        node.depth = pathParts.length - 1;

        if (pathParts.length > 1) {
            const parentPath = pathParts.slice(0, -1).join('\\');
            const parentNode = pathToNode[parentPath];
            if (parentNode) {
                parentNode.children.push(node);
            } else {
                rootNodes.push(node);
            }
        } else {
            rootNodes.push(node);
        }
    });

    const tree = {};
    rootNodes.forEach(rootNode => {
        tree[rootNode.path] = rootNode;
    });

    function sortChildren(node) {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        node.children.forEach(sortChildren);
    }
    Object.values(tree).forEach(sortChildren);

    return tree;
}

function getVisibleNodes(tree, expandedGroups) {
    const visible = [];

    function traverse(node) {
        visible.push(node);
        if (expandedGroups.has(node.path) && node.children.length > 0) {
            node.children.forEach(child => traverse(child));
        }
    }

    Object.values(tree).forEach(rootNode => traverse(rootNode));
    return visible;
}

function renderGroups(groups) {
    elements.groupList.innerHTML = '';

    if (!groups || groups.length === 0) {
        elements.groupList.innerHTML = `
            <div class="placeholder-message">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488a4.5 4.5 0 0 1-4.178 0l-6.478-3.488A2.25 2.25 0 0 1 2.25 9.906V9m19.5 0A2.25 2.25 0 0 0 19.5 6.75h-15A2.25 2.25 0 0 0 2.25 9m19.5 0v5.25A2.25 2.25 0 0 1 19.5 16.5h-15a2.25 2.25 0 0 1-2.25-2.25V9" />
                </svg>
                <p>No groups found</p>
            </div>
        `;
        return;
    }

    const tree = buildGroupTree(groups);
    const visibleNodes = getVisibleNodes(tree, state.expandedGroups);

    visibleNodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'group-item';

        const path = node.path;
        const id = node.id;
        const name = node.name;
        const hasChildren = node.children.length > 0;
        const isExpanded = state.expandedGroups.has(path);

        div.style.paddingLeft = `${14 + node.depth * 16}px`;
        div.dataset.path = path;
        div.dataset.id = id;

        if (hasChildren) {
            const chevron = document.createElement('div');
            chevron.className = 'group-chevron';
            chevron.innerHTML = isExpanded
                ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="m6 9 6 6 6-6"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="m9 6 6 6-6 6"/></svg>`;

            chevron.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleGroupExpansion(path);
            });

            div.appendChild(chevron);
        } else {
            const spacer = document.createElement('div');
            spacer.className = 'group-chevron-spacer';
            div.appendChild(spacer);
        }

        const checkbox = document.createElement('div');
        checkbox.className = 'group-checkbox';
        div.appendChild(checkbox);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'group-name';
        nameSpan.textContent = name;
        div.appendChild(nameSpan);

        const isSelected = state.selectedGroups.some(g => g.path === path);
        if (isSelected) {
            div.classList.add('selected');
            checkbox.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd" />
                </svg>`;
        }

        if (state.currentlyViewedGroup === path) {
            div.classList.add('viewing');
        }

        elements.groupList.appendChild(div);

        div.addEventListener('click', (e) => {
            if (e.target.closest('.group-chevron')) return;
            e.stopPropagation();

            const isCurrentlySelected = div.classList.contains('selected');
            const isSelected = !isCurrentlySelected;
            const clickedPath = div.dataset.path;
            const clickedId = div.dataset.id;

            const groupObj = state.groups.find(g => {
                const gPath = g.Path || g.Name;
                return gPath === clickedPath;
            }) || {
                Path: clickedPath,
                ReferenceId: clickedId,
                DeviceGroupId: clickedId,
                Id: clickedId
            };

            setGroupSelection(groupObj, isSelected);
            updateSelectionUI();

            if (isSelected) {
                fetchAndDisplayGroupData(clickedPath);
            }
        });
    });

    updateSelectionUI();
    updateCurrentlyViewedGroupIndicator();
}

function toggleGroupExpansion(path) {
    if (state.expandedGroups.has(path)) {
        state.expandedGroups.delete(path);
    } else {
        state.expandedGroups.add(path);
    }
    renderGroups(state.groups);
}

function updateSelectionUI() {
    elements.selectionCount.textContent = `${state.selectedGroups.length} selected`;
    updateApplyButton();
}

function updateCurrentlyViewedGroupIndicator() {
    document.querySelectorAll('.group-item').forEach(item => {
        item.classList.remove('viewing');
    });

    if (state.currentlyViewedGroup) {
        const viewedGroup = document.querySelector(`.group-item[data-path="${CSS.escape(state.currentlyViewedGroup)}"]`);
        if (viewedGroup) {
            viewedGroup.classList.add('viewing');
        }
    }
}

export function initGroups() {
    // Search
    elements.groupSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.group-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? '' : 'none';
        });
    });

    // Refresh groups
    elements.refreshGroupsBtn.addEventListener('click', refreshGroups);

    // Refresh currently viewed group data
    elements.refreshGroupBtn.addEventListener('click', async () => {
        if (!state.isConnected) {
            showToast('Not connected to server. Please connect first.', 'error');
            return;
        }

        if (!state.currentlyViewedGroup) {
            showToast('No group selected. Please select a group to view its data.', 'info');
            return;
        }

        await fetchAndDisplayGroupData(state.currentlyViewedGroup);
        showToast('Group data refreshed', 'success');
    });

    // Select all
    elements.selectAllBtn.addEventListener('click', () => {
        const visibleGroups = Array.from(document.querySelectorAll('.group-item'))
            .filter(item => item.style.display !== 'none');

        visibleGroups.forEach(div => {
            if (!div.classList.contains('selected')) {
                div.classList.add('selected');
                const checkbox = div.querySelector('.group-checkbox');
                if (checkbox) {
                    checkbox.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd" />
                        </svg>`;
                }
                const path = div.dataset.path;
                const id = div.dataset.id;
                if (!state.selectedGroups.some(g => g.path === path)) {
                    state.selectedGroups.push({ id, path });
                }
            }
        });

        updateSelectionUI();
    });

    // Deselect all
    elements.deselectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.group-item').forEach(div => {
            div.classList.remove('selected');
            const checkbox = div.querySelector('.group-checkbox');
            if (checkbox) {
                checkbox.innerHTML = '';
            }
        });
        state.selectedGroups = [];
        state.currentlyViewedGroup = null;
        const titleElement = document.getElementById('group-info-title');
        if (titleElement) {
            titleElement.textContent = 'Current Group Data';
        }
        updateSelectionUI();
        updateCurrentlyViewedGroupIndicator();
    });
}
