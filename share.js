/**
 * share.js
 * Floating automated social media share buttons (WhatsApp, X, Facebook)
 * Customized to fit the beautiful design of the LinkNYC & Link5G Finder application
 */
(function () {
    // 1. Initialize variables and urls
    const productionDomain = "https://wifinyc.app";
    const currentPath = window.location.pathname;
    
    // Normalize and build the absolute sharing URL on the production domain
    let shareUrl = productionDomain;
    if (currentPath && currentPath !== "/" && currentPath !== "/index.html") {
        shareUrl = productionDomain + currentPath;
    }

    // Capture the current page title (SEO page title)
    const shareText = document.title || "LinkNYC & Link5G Finder | Official 2026 NYC Public Gigabit Directory";

    // Encode text parameters for sharing APIs
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedCombined = encodeURIComponent(shareText + " " + shareUrl);

    // 2. Build the social media share URLs
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedCombined}`;
    const xTwitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    // 3. Create CSS styling block and inject into the head
    const styleId = "share-buttons-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            #share-dock {
                position: fixed;
                right: 24px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                gap: 16px;
                z-index: 10000;
            }
            .share-btn {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                text-decoration: none;
                position: relative;
                border: none;
                outline: none;
                padding: 0;
            }
            .share-btn:hover {
                transform: scale(1.12) translateY(-2px);
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
                filter: brightness(1.05);
            }
            .share-btn:active {
                transform: scale(0.95);
            }
            .share-btn.whatsapp {
                background-color: #25D366;
            }
            .share-btn.x-twitter {
                background-color: #1DA1F2; /* Vibrant custom blue to match the reference screenshot */
            }
            .share-btn.facebook {
                background-color: #1877F2;
            }
            .share-btn svg {
                width: 26px;
                height: 26px;
                fill: currentColor;
                transition: transform 0.2s ease;
            }
            .share-btn:hover svg {
                transform: rotate(3deg);
            }

            /* Premium Tooltips */
            .share-tooltip {
                position: absolute;
                right: 72px;
                background-color: #0c2340;
                color: #ffffff;
                padding: 8px 14px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s ease, transform 0.2s ease;
                transform: translateX(12px);
                box-shadow: 0 4px 12px rgba(12, 35, 64, 0.15);
                font-family: 'Inter', -apple-system, sans-serif;
            }
            .share-tooltip::after {
                content: '';
                position: absolute;
                right: -4px;
                top: 50%;
                transform: translateY(-50%) rotate(45deg);
                width: 8px;
                height: 8px;
                background-color: #0c2340;
            }
            .share-btn:hover .share-tooltip {
                opacity: 1;
                transform: translateX(0);
            }

            /* Responsive Adjustments */
            @media (max-width: 768px) {
                #share-dock {
                    right: 14px;
                    gap: 12px;
                }
                .share-btn {
                    width: 48px;
                    height: 48px;
                }
                .share-btn svg {
                    width: 22px;
                    height: 22px;
                }
                .share-tooltip {
                    display: none; /* Avoid obstructing mobile viewports */
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 4. Create floating elements structure
    const dock = document.createElement("div");
    dock.id = "share-dock";

    // helper function to generate SVGs securely
    const getSvgMarkup = (platform) => {
        if (platform === 'whatsapp') {
            return `
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.053 1.01 11.411 1.01 5.975 1.01 1.55 5.378 1.546 10.807c-.001 1.742.476 3.442 1.385 4.962L1.97 21.03l5.312-1.392h-.635zM16.92 14.1c-.287-.143-1.698-.838-1.96-.932-.262-.095-.453-.143-.644.143-.19.286-.738.932-.906 1.123-.168.19-.336.214-.622.071-.287-.143-1.21-.446-2.305-1.424-.853-.761-1.43-1.7-1.597-1.986-.168-.287-.018-.441.125-.583.13-.127.287-.334.43-.5.143-.167.19-.286.287-.476.095-.19.047-.358-.024-.5-.071-.143-.644-1.55-.882-2.122-.232-.558-.468-.482-.643-.491-.167-.008-.358-.01-.55-.01s-.501.071-.763.358c-.262.286-1.002.977-1.002 2.383 0 1.406 1.025 2.764 1.168 2.955.143.19 2.017 3.08 4.886 4.318.682.295 1.214.47 1.629.601.685.218 1.31.187 1.803.114.549-.081 1.698-.691 1.937-1.359.24-.668.24-1.241.168-1.359-.071-.118-.262-.19-.549-.333z"/>
                </svg>
            `;
        } else if (platform === 'xtwitter') {
            return `
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            `;
        } else if (platform === 'facebook') {
            return `
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            `;
        }
        return '';
    };

    // 5. Popup execution helper
    const triggerPopup = (e, url, title) => {
        e.preventDefault();
        const width = 640;
        const height = 480;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        
        // On mobile, just do standard window open or fallback
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            window.open(url, "_blank");
        } else {
            window.open(url, title, `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`);
        }
    };

    // 6. Define button items config
    const buttonsConfig = [
        {
            platform: "whatsapp",
            className: "whatsapp",
            url: whatsappUrl,
            tooltipText: "WhatsApp",
            title: "Share on WhatsApp"
        },
        {
            platform: "xtwitter",
            className: "x-twitter",
            url: xTwitterUrl,
            tooltipText: "Share on X",
            title: "Share on X"
        },
        {
            platform: "facebook",
            className: "facebook",
            url: facebookUrl,
            tooltipText: "Share on Facebook",
            title: "Share on Facebook"
        }
    ];

    // 7. Render each button
    buttonsConfig.forEach(cfg => {
        const btn = document.createElement("a");
        btn.href = cfg.url;
        btn.className = `share-btn ${cfg.className}`;
        btn.setAttribute("aria-label", cfg.title);
        btn.setAttribute("title", cfg.title);
        btn.setAttribute("target", "_blank");
        btn.setAttribute("rel", "noopener noreferrer");
        btn.id = `share-${cfg.platform}`;

        // Inject SVG Icon
        btn.innerHTML = getSvgMarkup(cfg.platform);

        // Inject tooltip
        const tooltip = document.createElement("span");
        tooltip.className = "share-tooltip";
        tooltip.textContent = cfg.tooltipText;
        btn.appendChild(tooltip);

        // Bind interactive popup behavior
        btn.addEventListener("click", function (e) {
            triggerPopup(e, cfg.url, `Share on ${cfg.platform}`);
        });

        dock.appendChild(btn);
    });

    // 8. Safely inject into the body when ready
    if (document.body) {
        document.body.appendChild(dock);
    } else {
        document.addEventListener("DOMContentLoaded", function () {
            document.body.appendChild(dock);
        });
    }
})();