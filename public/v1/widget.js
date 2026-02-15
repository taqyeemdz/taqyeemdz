(function () {
    // 1. Identification du script et du businessId
    const scriptTag = document.currentScript || (function () {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();
    const businessId = scriptTag.getAttribute('data-business-id');
    const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:3000' : 'https://taqyeemdz.com'; // À adapter selon l'environnement

    if (!businessId) {
        console.error('Taqyeem Widget: Missing data-business-id attribute.');
        return;
    }

    // 2. Fetch des réglages
    fetch(`${baseUrl}/api/v1/widget/settings/${businessId}`)
        .then(res => res.json())
        .then(settings => {
            if (!settings.is_enabled) return;
            initWidget(settings);
        })
        .catch(err => console.error('Taqyeem Widget error:', err));

    function initWidget(settings) {
        const { button_color, button_text, position, api_key } = settings;

        // Inject Styles
        const style = document.createElement('style');
        style.innerHTML = `
            #taqyeem-widget-container {
                position: fixed;
                ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            #taqyeem-trigger {
                background: ${button_color};
                color: white;
                padding: 12px 24px;
                border-radius: 50px;
                border: none;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: transform 0.2s ease;
            }
            #taqyeem-trigger:hover {
                transform: scale(1.05);
            }
            #taqyeem-modal-overlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                z-index: 1000000;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            #taqyeem-modal {
                background: white;
                width: 100%;
                max-width: 450px;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                animation: taqyeem-slide-up 0.3s ease-out;
            }
            @keyframes taqyeem-slide-up {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            #taqyeem-iframe {
                width: 100%;
                height: 600px;
                border: none;
            }
            .taqyeem-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: white;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);

        // Container
        const container = document.createElement('div');
        container.id = 'taqyeem-widget-container';
        container.innerHTML = `
            <button id="taqyeem-trigger">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                ${button_text}
            </button>
        `;
        document.body.appendChild(container);

        // Overlay & Modal
        const overlay = document.createElement('div');
        overlay.id = 'taqyeem-modal-overlay';
        overlay.innerHTML = `
            <div style="position: relative; width: 100%; max-width: 450px;">
                <button class="taqyeem-close" onclick="document.getElementById('taqyeem-modal-overlay').style.display='none'">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div id="taqyeem-modal">
                    <iframe id="taqyeem-iframe" src="${baseUrl}/widget/form?business_id=${businessId}&api_key=${api_key}"></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Events
        document.getElementById('taqyeem-trigger').onclick = () => {
            overlay.style.display = 'flex';
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.style.display = 'none';
        };
    }
})();
