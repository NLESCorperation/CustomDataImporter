// ==================== Modal Helpers ====================
import { elements } from './dom.js';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(modal, e) {
    const focusable = modal.querySelectorAll(FOCUSABLE);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

function openModal(overlay) {
    overlay._previousFocus = document.activeElement;
    overlay.style.display = 'flex';
    const modal = overlay.querySelector('.modal');
    const firstFocusable = modal?.querySelector(FOCUSABLE);
    if (firstFocusable) firstFocusable.focus();

    overlay._trapHandler = (e) => trapFocus(modal, e);
    overlay._escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay._closeAction?.();
        }
    };
    overlay.addEventListener('keydown', overlay._trapHandler);
    overlay.addEventListener('keydown', overlay._escHandler);
}

function closeModal(overlay) {
    overlay.style.display = 'none';
    if (overlay._trapHandler) overlay.removeEventListener('keydown', overlay._trapHandler);
    if (overlay._escHandler) overlay.removeEventListener('keydown', overlay._escHandler);
    if (overlay._previousFocus && overlay._previousFocus.focus) {
        overlay._previousFocus.focus();
    }
}

export function showConfirmDialog(title, message, confirmLabel = 'Confirm', isDanger = true) {
    return new Promise((resolve) => {
        elements.confirmDialogTitle.textContent = title;
        elements.confirmDialogMessage.textContent = message;
        elements.confirmDialogOk.classList.toggle('btn-danger', isDanger);
        elements.confirmDialogOk.classList.toggle('btn-primary', !isDanger);
        // Update confirm button label (keep the SVG icon)
        const svg = elements.confirmDialogOk.querySelector('svg');
        elements.confirmDialogOk.textContent = '';
        if (svg) elements.confirmDialogOk.appendChild(svg);
        elements.confirmDialogOk.append(` ${confirmLabel}`);

        function cleanup(result) {
            closeModal(elements.confirmDialogModal);
            elements.confirmDialogOk.removeEventListener('click', onConfirm);
            elements.confirmDialogCancel.removeEventListener('click', onCancel);
            elements.confirmDialogModal.removeEventListener('click', onOverlay);
            resolve(result);
        }
        function onConfirm() { cleanup(true); }
        function onCancel() { cleanup(false); }
        function onOverlay(e) { if (e.target === elements.confirmDialogModal) cleanup(false); }

        elements.confirmDialogModal._closeAction = onCancel;
        elements.confirmDialogOk.addEventListener('click', onConfirm);
        elements.confirmDialogCancel.addEventListener('click', onCancel);
        elements.confirmDialogModal.addEventListener('click', onOverlay);

        openModal(elements.confirmDialogModal);
    });
}

export { openModal, closeModal };
