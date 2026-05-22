// ==================== Tab Navigation ====================

function activateTab(tab) {
    const tablist = tab.closest('[role="tablist"]');
    const tabs = tablist.querySelectorAll('[role="tab"]');

    tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
    });

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.focus();

    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(tab.dataset.tab).classList.add('active');
}

export function initTabs() {
    const tabs = document.querySelectorAll('[role="tab"]');

    tabs.forEach((tab, index) => {
        // Only the active tab is in the tab order
        tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');

        tab.addEventListener('click', () => activateTab(tab));

        tab.addEventListener('keydown', (e) => {
            const tabsArray = Array.from(tabs);
            let targetIndex = index;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                targetIndex = (index + 1) % tabsArray.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                targetIndex = (index - 1 + tabsArray.length) % tabsArray.length;
            } else if (e.key === 'Home') {
                e.preventDefault();
                targetIndex = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                targetIndex = tabsArray.length - 1;
            } else {
                return;
            }

            activateTab(tabsArray[targetIndex]);
        });
    });
}
