/**
 * showSessionAlert - Standalone alert for non-React utility modules
 * (e.g. API client, WebSocket handler) that need to show a message
 * before redirecting the user. This doesn't use React at all.
 *
 * Features:
 * - Dark/light mode aware (reads <html> class)
 * - Deduplication: only one alert at a time
 * - Resolves on OK click or backdrop click
 */

let activeOverlay = null; // Prevent duplicate alerts

export function showSessionAlert(message) {
    // If already showing, don't stack another one
    if (activeOverlay) {
        return new Promise(() => { }); // Never resolves — previous one handles redirect
    }

    const isDark = document.documentElement.classList.contains('dark');

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); padding: 16px;
        animation: fadeIn 200ms ease-out;
    `;

    const bg = isDark ? '#1F2937' : 'white';
    const titleColor = isDark ? '#F9FAFB' : '#111827';
    const textColor = isDark ? '#9CA3AF' : '#6B7280';
    const iconBg = isDark ? 'rgba(251,191,36,0.15)' : '#FEF3C7';

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: ${bg}; border-radius: 16px; padding: 24px;
        max-width: 400px; width: 100%;
        box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        text-align: center; font-family: system-ui, -apple-system, sans-serif;
        transform: scale(0.95); opacity: 0;
        animation: scaleIn 200ms ease-out forwards;
    `;

    dialog.innerHTML = `
        <div style="
            width: 44px; height: 44px; border-radius: 50%;
            background: ${iconBg}; display: flex; align-items: center;
            justify-content: center; margin: 0 auto 12px;
            font-size: 20px;
        ">⚠️</div>
        <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: ${titleColor};">Session Expired</h3>
        <p style="margin: 0 0 20px; font-size: 14px; color: ${textColor}; line-height: 1.5;">${message}</p>
        <button style="
            padding: 8px 24px; border-radius: 8px; border: none; cursor: pointer;
            font-size: 14px; font-weight: 600; color: white;
            background: linear-gradient(135deg, #6366F1, #9333EA);
            box-shadow: 0 4px 12px rgba(99,102,241,0.25);
            transition: opacity 150ms;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">OK</button>
    `;

    // Inject keyframes if not already present
    if (!document.getElementById('_session_alert_keyframes')) {
        const style = document.createElement('style');
        style.id = '_session_alert_keyframes';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    activeOverlay = overlay;

    return new Promise((resolve) => {
        const dismiss = () => {
            overlay.remove();
            activeOverlay = null;
            resolve();
        };
        const btn = dialog.querySelector('button');
        if (btn) btn.addEventListener('click', dismiss);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) dismiss();
        });
    });
}
