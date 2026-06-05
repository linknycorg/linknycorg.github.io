// ad-sticky.js - Dynamic Full-Box Clickable Sticky Ad Component
document.addEventListener("DOMContentLoaded", function() {
    // 1. Buat elemen kontainer pembungkus utama
    const adContainer = document.createElement('div');
    
    // 2. Gunakan kelas Tailwind CSS (Posisi Fixed Melayang)
    adContainer.className = "fixed bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto z-[2000] group max-w-full md:max-w-sm w-full";
    adContainer.id = "sticky-e-sim-ad";

    // 3. Masukkan struktur HTML Baru (Seluruh Kotak Ungu adalah Tag <a>)
    adContainer.innerHTML = `
    <div class="fixed bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto z-[2000] group max-w-full md:max-w-sm">
        <div class="bg-purple-950/95 backdrop-blur-xl border-x border-t md:border border-purple-500/30 shadow-[0_-10px_40px_rgba(88,28,135,0.2)] md:shadow-[0_20px_50px_rgba(88,28,135,0.3)] rounded-none p-1.5 md:p-1 flex items-center pr-4 md:pr-6 overflow-hidden transition-all duration-500 hover:shadow-[0_25px_60px_rgba(168,85,247,0.4)]">
        <a href="../vpn" target="_blank" rel="noopener nofollow" class="flex items-center flex-grow min-w-0 text-decoration-none" onclick="const ad = this.closest('#sticky-e-sim-ad'); setTimeout(() => { if(ad) ad.remove(); }, 300);">
            <div class="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-none flex items-center justify-center text-white mr-3 md:mr-4 shadow-inner flex-shrink-0">
                <i data-lucide="award" class="w-5 h-5 md:w-6 md:h-6"></i>
            </div>
            <div class="flex flex-col min-w-0 flex-grow">
                <span class="text-[10px] md:text-[8px] font-black uppercase tracking-[0.2em] text-purple-300 mb-0.5 truncate">Need Permanent Data in NYC ?</span>
                <span class="text-xs md:text-sm font-bold text-white leading-tight mb-1 truncate md:whitespace-normal line-clamp-2">Get Premium Mobile NORDVPN</span>
                <div class="flex items-center space-x-2">
                    <span class="text-[9px] bg-emerald-500 text-emerald-950 px-1.5 py-0.5 rounded-none font-black uppercase tracking-wider leading-none">Save 45%</span>
                    <span class="text-[10px] text-purple-200 font-bold">$2.99/mo</span>
                </div>
            </div>
        </a>
            <button class="ml-2 text-white/40 hover:text-white transition-colors flex-shrink-0" onclick="this.parentElement.parentElement.style.display='none'">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    </div>
    `;

    // 4. Suntikkan komponen langsung ke dalam tag <body>
    document.body.appendChild(adContainer);

    // 5. Inisialisasi ulang ikon Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
