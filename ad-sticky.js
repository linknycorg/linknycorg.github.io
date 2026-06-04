// ad-sticky.js - Dynamic Full-Box Clickable Sticky Ad Component
document.addEventListener("DOMContentLoaded", function() {
    // 1. Buat elemen kontainer pembungkus utama
    const adContainer = document.createElement('div');
    
    // 2. Gunakan kelas Tailwind CSS (Posisi Fixed Melayang)
    adContainer.className = "fixed bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto z-[2000] group max-w-full md:max-w-sm w-full";
    adContainer.id = "sticky-e-sim-ad";

    // 3. Masukkan struktur HTML Baru (Seluruh Kotak Ungu adalah Tag <a>)
    adContainer.innerHTML = `
        <div class="relative overflow-hidden border-x border-t md:border border-purple-500/30 shadow-[0_-10px_40px_rgba(88,28,135,0.2)] md:shadow-[0_20px_50px_rgba(88,28,135,0.3)] transition-all duration-500 hover:shadow-[0_25px_60px_rgba(168,85,247,0.4)] bg-purple-950/95 backdrop-blur-xl group flex items-center pr-12 md:pr-14">
            
            <!-- LINK UTAMA: Membungkus seluruh area visual dari ujung kiri hingga batas tombol close -->
            <a href="out" target="_blank" rel="nofollow noopener noreferrer" class="flex items-center p-1.5 md:p-1 w-full min-w-0" aria-label="Purchase cheap New York E-SIM for 5 dollars instantly">
                <div class="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-none flex items-center justify-center text-white mr-3 md:mr-4 shadow-inner flex-shrink-0 group-hover:bg-purple-500 transition-colors duration-300">
                    <i data-lucide="award" class="w-5 h-5 md:w-6 md:h-6"></i>
                </div>
                <div class="flex flex-col min-w-0 flex-grow text-left">
                    <span class="text-[10px] md:text-[8px] font-black uppercase italic tracking-[0.2em] text-purple-300 mb-0.5 truncate">Need Permanent Data in NYC?</span>
                    <span class="text-[10px] md:text-[9px] font-black text-white uppercase truncate group-hover:text-purple-200 transition-colors duration-300">Get cheap NEW YORK E-SIM instantly for $5</span>
                </div>
            </a>

            <!-- TOMBOL CLOSE: Dipisah di luar tag <a>, diposisikan secara absolut di ujung kanan -->
            <button class="absolute right-4 md:right-5 text-white/30 hover:text-red-400 transition-colors flex-shrink-0 z-30 p-2 -mr-2" onclick="document.getElementById('sticky-e-sim-ad').remove()" aria-label="Close Advertisement">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
            
        </div>
    `;

    // 4. Suntikkan komponen langsung ke dalam tag <body>
    document.body.appendChild(adContainer);

    // 5. Inisialisasi ulang ikon Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
