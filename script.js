// --- LOADER LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    // Sequence Timing Configuration
    const TIMING = {
        startTransition: 2500, // 2.5s - Start wiping screen black
        showLogo: 3200,        // 3.2s - Reveal the logo elements
        exitLoader: 5800       // 5.8s - Fade out loader & enable scroll
    };

    const body = document.body;
    const loaderWrapper = document.getElementById('intro-loader');

    // --- AUDIO LOGIC ---
    const audio = document.getElementById('intro-bgm');
    // Mencoba memutar audio saat halaman dimuat
    // Catatan: Sebagian besar browser memblokir autoplay jika belum ada interaksi pengguna
    if(audio) {
        audio.volume = 0.5; // Set volume 50%
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay Audio diblokir oleh browser (Wajar, kebijakan keamanan browser).");
                // Opsional: Anda bisa menambahkan tombol "Unmute" di sini jika perlu
            });
        }
    }

    // Step 1: Trigger Transition (Yellow -> Black Wipe)
    setTimeout(() => {
        body.classList.add('start-wipe');
    }, TIMING.startTransition);

    // Step 2: Reveal Logo Elements
    setTimeout(() => {
        body.classList.add('reveal-logo');
    }, TIMING.showLogo);

    // Step 3: Finish Loader, Fade Out Audio & Reveal Site
    setTimeout(() => {
        loaderWrapper.classList.add('loader-finished');
        body.classList.remove('loading-active'); // Enable scrolling
        
        // Fade out audio effect
        if(audio) {
            const fadeAudio = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume -= 0.05;
                } else {
                    clearInterval(fadeAudio);
                    audio.pause();
                }
            }, 200); // Turunkan volume setiap 200ms
        }

        // Optional: Remove from DOM after transition
        setTimeout(() => {
            loaderWrapper.style.display = 'none';
        }, 1000);
    }, TIMING.exitLoader);

    // Inisialisasi Widget Hitung Mundur Jadwal
    setInterval(updateClassCountdown, 1000);
    updateClassCountdown();
});

// --- 0. AGRONEWS LOGIC (UPDATED TO CNN API STRUCTURE) ---

// Data Fallback jika API Localhost tidak aktif
const FALLBACK_CNN_DATA = [
    {
        judul: "Cara Membayar Fidiah, Tebusan Bagi yang Tak Bisa Berpuasa",
        link: "https://www.cnnindonesia.com/gaya-hidup/20200506182707-284-500842/cara-membayar-fidiah-tebusan-bagi-yang-tak-bisa-berpuasa",
        poster: "https://akcdn.detik.net.id/visual/2020/04/17/a4d493fd-90d3-4d05-8e7d-487a30fe2eea_169.jpeg?w=650",
        tipe: "Gaya Hidup",
        waktu: "12 menit yang lalu"
    },
    {
        judul: "Arus Modal Keluar Diprediksi Tekan Laju IHSG",
        link: "https://www.cnnindonesia.com/ekonomi/20200514052227-92-503138/arus-modal-keluar-diprediksi-tekan-laju-ihsg",
        poster: "https://akcdn.detik.net.id/visual/2019/02/27/5757e3f9-223f-497e-90cd-e2b47fcf6779_169.jpeg?w=650",
        tipe: "Ekonomi",
        waktu: "47 detik yang lalu"
    },
    {
        judul: "Wagub DKI: Banyak Warga Mampu Ambil Bansos Corona",
        link: "https://www.cnnindonesia.com/nasional/20200513204056-32-503103/wagub-dki-banyak-warga-mampu-ambil-bansos-corona",
        poster: "https://akcdn.detik.net.id/visual/2020/03/06/6f269c56-d2b9-48ee-a544-9e5c396000ce_169.jpeg?w=650",
        tipe: "Nasional",
        waktu: "5 menit yang lalu"
    },
    {
        judul: "Turis Jatuh usai Nekat Kunjungi Yellowstone saat Pandemi",
        link: "#",
        poster: "https://akcdn.detik.net.id/visual/2019/02/06/29f223cf-d5e8-44da-b1a4-e48e31d8c239_169.jpeg?w=650",
        tipe: "Internasional",
        waktu: "1 jam yang lalu"
    },
    {
        judul: "Startup Agrotech Indonesia Mulai Dilirik Investor Global",
        link: "#",
        poster: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1000&auto=format&fit=crop",
        tipe: "Teknologi",
        waktu: "2 jam yang lalu"
    }
];

async function getNews() {
    try {
        // 1. Coba Fetch dari Public Mirror (Struktur SAMA dengan Localhost Python Anda)
        // Ini agar web tetap jalan tanpa harus menyalakan server python local
        const response = await fetch(`https://api-berita-indonesia.vercel.app/cnn/ekonomi/`);
        const json = await response.json();

        if (json.data && json.data.posts.length > 0) {
            // Mapping data Vercel ke Format Localhost Anda (sedikit beda di key 'posts' vs 'data')
            const mappedData = json.data.posts.map(item => ({
                judul: item.title,
                poster: item.thumbnail,
                link: item.link,
                tipe: "Ekonomi",
                waktu: new Date(item.pubDate).toLocaleDateString()
            }));
            renderNews(mappedData);
        } else {
            renderNews(FALLBACK_CNN_DATA);
        }
    } catch (error) {
        // 2. Jika Fetch Gagal (misal offline/cors), Gunakan Data Fallback Local
        console.log("Menggunakan Data Berita Fallback (Mode Offline/Local)");
        renderNews(FALLBACK_CNN_DATA);
    }
}

function renderNews(articles) {
    const hero = articles[0];
    const subs = articles.slice(1, 3);
    const sidebars = articles.slice(3, 7);

    // 1. Render Hero
    document.getElementById('hero-img').src = hero.poster;
    document.getElementById('hero-title').innerText = hero.judul;
    document.getElementById('hero-type').innerText = hero.tipe || "TERBARU";
    document.getElementById('hero-date').innerText = hero.waktu;
    document.getElementById('hero-news').onclick = () => window.open(hero.link, '_blank');

    // 2. Render Sub News
    const subContainer = document.getElementById('sub-news-container');
    subContainer.innerHTML = '';
    subs.forEach(article => {
        const html = `
            <div onclick="window.open('${article.link}', '_blank')" class="glass-panel rounded-xl overflow-hidden flex flex-col hover:border-newsRed transition-colors cursor-pointer h-full">
                <img src="${article.poster}" class="h-40 w-full object-cover" alt="News">
                <div class="p-4 flex flex-col flex-1">
                    <span class="text-newsRed text-xs font-bold mb-1 uppercase">${article.tipe || 'Berita'}</span>
                    <h3 class="font-news-headline font-bold text-white text-lg leading-snug mb-2 line-clamp-3">${article.judul}</h3>
                    <div class="mt-auto pt-2 border-t border-gray-700 flex justify-between items-center">
                        <span class="text-xs text-gray-500">${article.waktu}</span>
                        <i class="fa-solid fa-chevron-right text-gray-500 text-xs"></i>
                    </div>
                </div>
            </div>
        `;
        subContainer.innerHTML += html;
    });

    // 3. Render Sidebar
    const sideContainer = document.getElementById('sidebar-news-container');
    sideContainer.innerHTML = '';
    sidebars.forEach(article => {
        const html = `
            <div onclick="window.open('${article.link}', '_blank')" class="flex gap-4 items-start border-b border-gray-700 pb-4 last:border-0 last:pb-0 hover:bg-white/5 p-2 rounded transition-colors cursor-pointer">
                <img src="${article.poster}" class="w-16 h-16 object-cover rounded bg-gray-800 shrink-0">
                <div>
                    <h4 class="font-bold text-gray-200 text-sm leading-snug hover:text-tipYellow transition-colors line-clamp-2">${article.judul}</h4>
                    <p class="text-[10px] text-gray-500 mt-1 uppercase text-newsRed font-bold">${article.tipe || 'Info'}</p>
                </div>
            </div>
        `;
        sideContainer.innerHTML += html;
    });

    // 4. Update Ticker
    const tickers = articles.map(a => a.judul).slice(0, 5);
    document.getElementById('news-ticker-content').innerText = tickers.join("  |  ") + "  |  " + tickers.join("  |  ");
}

// --- 0. APRESIASI LOGIC (EXISTING) ---
const achievers = {
    khairul: {
        name: "Khairul Hidayatullah",
        category: "Olahraga - Drumband",
        quote: "“Prestasi tidak lahir dari sekali langkah, tapi dari irama disiplin yang terus dijaga.”",
        achievements: [
            { title: "LUG", medal: "Perak" },
            { title: "LBB", medal: "Perunggu" },
            { title: "LBJP Putra 400m", medal: "Perunggu" },
            { title: "LBJP Mix 600m", medal: "Perunggu" },
            { title: "LBJP Mix 800m", medal: "Perak" },
            { title: "LKKB Putra 8000m", medal: "Perak" },
            { title: "LKKB Mix 8000m", medal: "Perunggu" },
            { title: "Etape 2", medal: "Emas" }
        ],
        gradient: "from-orange-500 to-red-500",
        image: "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=800&auto=format&fit=crop"
    },
    amelia: {
        name: "Amelia Qalsyum J.",
        category: "Olahraga - Badminton",
        quote: "“Setiap pukulan adalah keputusan, dan setiap keputusan menentukan kemenangan.”",
        achievements: [
            { title: "Kejuaraan Provinsi PBSI Kalsel 2025", medal: "Partisipan" },
            { title: "Semi Finalis Beregu Campuran Pra Porprov", medal: "Semi Finalis" }
        ],
        gradient: "from-cyan-500 to-blue-600",
        image: "https://images.unsplash.com/photo-1626224583764-8476496238b8?q=80&w=800&auto=format&fit=crop"
    },
    azwar: {
        name: "M. Azwar Faisal",
        category: "Debat - NUDC",
        quote: "“Speak your mind, even if your voice shakes.”",
        achievements: [
            { title: "Lolos Seleksi Fakultas", medal: "Lolos" },
            { title: "Seleksi NUDC Tingkat Universitas", medal: "Peserta" }
        ],
        gradient: "from-purple-600 to-pink-600",
        image: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=800&auto=format&fit=crop"
    },
    fauzia: {
        name: "Fauzia Nazwa Ramadhina",
        category: "Riset - PKM RE",
        quote: "“Meneliti hari ini untuk melestarikan esok.”",
        achievements: [
            { title: "Lolos Seleksi PKM RE Tahap 2", medal: "Nasional" },
            { title: "Judul: Optimalisasi Pengolahan Air Limbah Industri Tahu Skala Kecil...", medal: "Riset" },
            { title: "Teknik: Kombinasi Filtrasi Berlapis Arang Tempurung Kelapa & Fitoremediasi Kayu Api", medal: "Inovasi" },
            { title: "Ketua Tim: Marsya Aulia Khusnul Khatimah", medal: "Anggota" }
        ],
        gradient: "from-green-500 to-emerald-500",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop"
    },
    faris: {
        name: "Ahmad Faris Alzabar",
        category: "Debat - KDMI",
        quote: "“Kata-kata adalah senjata paling tajam dalam perubahan.”",
        achievements: [
            { title: "Lolos Seleksi Fakultas", medal: "Lolos" },
            { title: "Seleksi KDMI Tingkat Universitas", medal: "Peserta" }
        ],
        gradient: "from-green-600 to-teal-600",
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"
    }
};

function openApresiasiModal(id) {
    const modal = document.getElementById('apresiasi-modal');
    const body = document.getElementById('modal-body');
    const data = achievers[id];

    if(!data) return;

    const listHtml = data.achievements.map(a => `
        <li class="flex items-start justify-between bg-white/5 p-3 rounded-lg mb-2 gap-4">
            <span class="text-gray-200 text-sm">${a.title}</span>
            <span class="font-bold text-xs shrink-0 px-2 py-1 rounded bg-white/10 ${a.medal === 'Emas' ? 'text-yellow-400' : a.medal === 'Perak' ? 'text-gray-300' : 'text-orange-300'}">${a.medal}</span>
        </li>
    `).join('');

    body.innerHTML = `
        <div class="text-center mb-6">
            <div class="relative w-28 h-28 mx-auto mb-4">
                 <div class="w-full h-full rounded-full border-4 border-tipYellow p-1 shadow-[0_0_20px_rgba(234,179,8,0.5)] overflow-hidden bg-black">
                    <img src="${data.image}" class="w-full h-full object-cover rounded-full">
                 </div>
                 <div class="absolute bottom-0 right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-4 border-tipDark text-sm">
                    <i class="fa-solid fa-check"></i>
                 </div>
            </div>
            
            <h3 class="text-2xl font-bold text-white">${data.name}</h3>
            <p class="text-tipYellow font-medium uppercase tracking-widest text-xs mt-1 bg-white/5 inline-block px-3 py-1 rounded-full">${data.category}</p>
        </div>

        <div class="bg-black/30 p-4 rounded-xl mb-6 border-l-4 border-tipYellow">
            <p class="text-gray-300 italic text-center text-sm">"${data.quote}"</p>
        </div>

        <h4 class="text-white font-bold mb-3 flex items-center gap-2 text-sm"><i class="fa-solid fa-list-check text-tipYellow"></i> Detail Prestasi</h4>
        <ul class="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            ${listHtml}
        </ul>
    `;

    modal.classList.remove('hidden');
}

function closeApresiasiModal() {
    document.getElementById('apresiasi-modal').classList.add('hidden');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('apresiasi-modal');
    if (event.target == modal) {
        closeApresiasiModal();
    }
}


// --- 1. DATA MAHASISWA (DATABASE) ---
const students = [
    { name: "Muhammad Nabil Rafif Firdaus", dob: "2006-04-11", pob: "Sampit" },
    { name: "Ahmad Faris Alzabar", dob: "2007-01-23", pob: "Tanjung selor" },
    { name: "AHMAD YUSUF DANDY", dob: "2007-09-08", pob: "Palangka Raya" },
    { name: "Munawwarah", dob: "2006-08-16", pob: "Banjarmasin" },
    { name: "FAUZIA NAZWA RAMADHINA", dob: "2006-10-03", pob: "Bogor" },
    { name: "Abed Richardo Simaremare", dob: "2007-05-14", pob: "TANAH LAUT" },
    { name: "Fajar dama yusron", dob: "2006-03-20", pob: "Tanah laut, Pelaihari" },
    { name: "Aulia desmitha winney", dob: "2006-12-26", pob: "Sampit" },
    { name: "CATUR INDAH APRIANI", dob: "2006-04-27", pob: "JELAPAT 1" },
    { name: "Muhammad Fathan Maulana", dob: "2007-03-18", pob: "Kuaro, kab. Paser" },
    { name: "Muhammad Balya Isroie", dob: "2007-08-11", pob: "Martapura" },
    { name: "Ahmad Rifky Jailani", dob: "2007-03-27", pob: "SAMPIT" },
    { name: "Suaidi Azmi Bintang Pamungkas", dob: "2007-09-28", pob: "Hulu Sungai Tengah" },
    { name: "Muhammad Azwar Faisal", dob: "2006-06-08", pob: "Tanah Bumbu" },
    { name: "Finda Risma Nurdiana", dob: "2007-02-27", pob: "Kotabaru" },
    { name: "Muhammad Faisal Adjka Pratama", dob: "2006-07-17", pob: "Martapura" },
    { name: "Awfa Azkia", dob: "2007-11-06", pob: "Banjarmasin" },
    { name: "Fasha Reza Saputra", dob: "2007-01-17", pob: "Banjarmasin" },
    { name: "Nayla Cynthia Renanata", dob: "2007-03-30", pob: "Landasan Ulin" },
    { name: "Gwen Arla Sabryna", dob: "2007-11-16", pob: "Banjarmasin" },
    { name: "Maulidya Sari", dob: "2007-04-07", pob: "Palangka Raya" },
    { name: "Khairul Hidayatullah", dob: "2007-06-06", pob: "Banjarmasin" },
    { name: "Hidayatul Munawaroh", dob: "2007-12-17", pob: "Rantau Bujur" },
    { name: "Nur Agrisa Yundari", dob: "2007-08-21", pob: "Pendang" },
    { name: "Muhammad iqbal fauzan", dob: "2007-01-03", pob: "Paringin" },
    { name: "Nur'Aisyah", dob: "2007-07-13", pob: "Binuang" },
    { name: "Siti Kamalia", dob: "2007-06-09", pob: "Martapura" },
    { name: "Muhammad Risqi", dob: "2007-05-27", pob: "Tabalong" },
    { name: "EVA KUSUMA SARI", dob: "2008-02-29", pob: "Sungai langsat" },
    { name: "May Ardhita Sari", dob: "2007-05-13", pob: "Banjarbaru" },
    { name: "arfiana resfa julia", dob: "2007-07-16", pob: "tanah laut" },
    { name: "Nite Sa Kurueh", dob: "2007-01-31", pob: "Nanga tebidah" },
    { name: "Halimatus Sa'adiah", dob: "2007-01-23", pob: "Bontang" },
    { name: "Muhammad Chandra iriawan", dob: "2006-10-30", pob: "jakarta" },
    { name: "Sorta Romauli Silitonga", dob: "2006-09-21", pob: "Kotabaru" },
    { name: "Rizki Juanda Yudistira", dob: "2006-12-15", pob: "Barito Kuala" },
    { name: "Rizqizia Marsha Nafanda", dob: "2007-03-02", pob: "Banjarmasin" },
    { name: "Eka Nabila Rahmawati", dob: "2006-11-09", pob: "Banjarbaru" },
    { name: "Muhammad Reygan", dob: "2007-07-16", pob: "Muara Teweh" },
    { name: "Aditya Ramadhani", dob: "2006-10-12", pob: "Banjarmasin" },
    { name: "Ratna", dob: "2006-03-23", pob: "Sejahtera" },
    { name: "Muhammad Taufikur Rahman", dob: "2007-12-18", pob: "Banjarbaru" },
    { name: "Muhammad Iqbal Muharram Alfarisy", dob: "2007-01-20", pob: "banjarmasin" },
    { name: "Dini octavia az zahra", dob: "2007-10-26", pob: "Kotabaru" },
    { name: "Nur Ramadhani", dob: "2007-09-23", pob: "Kuala Kapuas" },
    { name: "Farah Iqrima Mutia Rahmah", dob: "2006-07-25", pob: "Barabai" },
    { name: "anita rahmatiyah", dob: "2006-03-25", pob: "banjarbaru" },
    { name: "Amelia Qalsyum.J", dob: "2006-12-18", pob: "Kotabaru" },
    { name: "Naufal Muzakkie", dob: "2006-07-18", pob: "Semarang" },
    { name: "Billa Salsa Az-zahra Akbar", dob: "2007-01-04", pob: "Cirebon" },
    { name: "Muhammad Rezki Rahim", dob: "2006-05-23", pob: "Kandangan" },
    { name: "CAHAYA ZUHROH", dob: "2007-01-24", pob: "BANJARMASIN" },
    { name: "Muhammad Risky Aulia", dob: "2006-11-30", pob: "Banjarmasin" },
    { name: "Muhammad Luqman al Khanza", dob: "2007-09-22", pob: "Barabai" },
    { name: "Hanim Amani Rahman", dob: "2007-07-09", pob: "Banjarmasin" },
    { name: "Nadhifa Dzahwa Nur Rizqa", dob: "2006-10-27", pob: "Tabalong" },
    { name: "Nadia Zahra", dob: "2007-05-28", pob: "Hulu Sungai Tengah" }
];

// --- 2. NAVIGATION SYSTEM ---
function switchTab(tabId) {
    // Hide all sections
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(el => {
        el.classList.remove('active');
        setTimeout(() => {
            if(!el.classList.contains('active')) el.style.display = 'none';
        }, 500); // Wait for fade out
    });

    // Show selected section
    const selected = document.getElementById(tabId);
    if(selected) {
        selected.style.display = 'block';
        // Small timeout to allow display:block to render before adding opacity class
        setTimeout(() => selected.classList.add('active'), 10);

        // Specific Action for News
        if(tabId === 'agronews') {
            getNews();
        }
    }
    
    // Close mobile menu if open (Legacy)
    const menu = document.getElementById('mobile-menu');
    if(menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
    }

    // Update Active State for Mobile Bottom Nav
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        // Reset State
        btn.classList.remove('active-nav', 'text-tipYellow', 'scale-105');
        btn.classList.add('text-gray-400');
        
        // Set Active if matches
        if(btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active-nav', 'text-tipYellow', 'scale-105');
            btn.classList.remove('text-gray-400');
            
            // Optional: Smooth scroll the nav to center the active item if needed
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    });
}

// Initialize Home
switchTab('beranda');

// --- 3. LOGIN SYSTEM ---
function handleLogin(e) {
    e.preventDefault();
    const inputName = document.getElementById('username').value.trim().toLowerCase();
    const inputDob = document.getElementById('password').value; // yyyy-mm-dd
    const errorMsg = document.getElementById('login-error');

    const user = students.find(s => s.name.toLowerCase() === inputName && s.dob === inputDob);

    if (user) {
        // Success
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('profile-card').classList.remove('hidden');
        
        // Populate Data
        document.getElementById('profile-name').innerText = user.name;
        document.getElementById('profile-pob').innerText = user.pob;
        document.getElementById('profile-dob').innerText = user.dob;
        
        errorMsg.classList.add('hidden');

        // UNLOCK DOKUMENTASI PAGE
        document.getElementById('doc-locked').classList.add('hidden');
        document.getElementById('doc-content').classList.remove('hidden');

    } else {
        // Fail
        errorMsg.classList.remove('hidden');
        // Shake effect
        const container = document.getElementById('login-container');
        container.classList.add('animate-pulse');
        setTimeout(() => container.classList.remove('animate-pulse'), 500);
    }
}

function handleLogout() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('profile-card').classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';

    // LOCK DOKUMENTASI PAGE AGAIN
    document.getElementById('doc-locked').classList.remove('hidden');
    document.getElementById('doc-content').classList.add('hidden');
}

// --- 4. SCHEDULE SYSTEM ---
const schedules = {
    1: {
        title: "Semester 1 (Ganjil 2025/2026)",
        days: [
            {
                day: "Senin",
                color: "blue",
                courses: [
                    { time: "08:50 - 10:30", name: "Kimia Dasar", room: "R. Kalalayu" },
                    { time: "10:30 - 11:20", name: "Pengantar Teknologi", room: "R. Hambawang" }
                ]
            },
            {
                day: "Selasa",
                color: "purple",
                courses: [
                    { time: "07:10 - 08:50", name: "Matematika Dasar", room: "R. Kalalayu" },
                    { time: "10:30 - 12:10", name: "Praktikum Kimia", room: "Lab. Dasar" },
                    { time: "13:00 - 14:40", name: "Ekonomi Teknik", room: "R. Hambawang" }
                ]
            },
            {
                day: "Rabu",
                color: "green",
                courses: [
                    { time: "08:50 - 10:30", name: "Rekayasa Bioproses", room: "R. Kenanga" },
                    { time: "10:30 - 12:10", name: "Agama", room: "R. Pampaken" },
                    { time: "14:40 - 16:20", name: "Bahasa Indonesia", room: "R. Kemuning" }
                ]
            },
            {
                day: "Kamis",
                color: "yellow",
                courses: [
                    { time: "08:50 - 10:30", name: "Matematika Lanjut", room: "R. Kenanga" },
                    { time: "13:00 - 14:40", name: "Pancasila", room: "R. Pampaken" }
                ]
            }
        ]
    },
    2: {
        title: "Semester 2 (Genap 2025/2026)",
        days: [
            {
                day: "Senin",
                color: "blue",
                courses: [
                    { time: "09.40 - 11.20", name: "Bahasa Inggris", room: "Ruang Pampaken" },
                    { time: "13.00 - 14.40", name: "Manajemen Sumber Daya Manusia", room: "Ruang Kenanga" },
                    { time: "14.40 - 16.20", name: "Metode Statistika", room: "Ruang Kemuning" }
                ]
            },
            {
                day: "Selasa",
                color: "purple",
                courses: [
                    { time: "08.00 - 09.40", name: "Manajemen Lingkungan Industri", room: "Ruang Kalalayu" },
                    { time: "09.40 - 11.20", name: "Bahasa Inggris", room: "Ruang Pampaken" },
                    { time: "13.00 - 14.40", name: "Dasar Teknik Proses", room: "Ruang Kenanga" }
                ]
            },
            {
                day: "Rabu",
                color: "green",
                courses: [
                    { time: "14.40 - 16.20", name: "Pengantar Lingkungan Lahan Basah", room: "Ruang Culan" },
                    { time: "16.20 - 18.00", name: "Metode Statistika", room: "Ruang Pampaken" }
                ]
            },
            {
                day: "Kamis",
                color: "yellow",
                courses: [
                    { time: "08.00 - 09.40", name: "Kewarganegaraan", room: "Ruang Pampaken" },
                    { time: "13.00 - 14.40", name: "Pengetahuan Bahan Agroindustri", room: "Ruang Kemuning" },
                    { time: "16.20 - 18.00", name: "Kalkulus", room: "Ruang Kemuning" }
                ]
            }
        ]
    },
    'uts2': {
        title: "JADWAL UJIAN TENGAH SEMESTER (UTS) - SEMESTER 2",
        isUts: true,
        days: [
            {
                date: "Senin, 06 April 2026",
                courses: [
                    { time: "09.50 - 11.30", name: "Bahasa Inggris", code: "EFB1209", lecturer: "Alia Rahmi, S.T.P., M.EngSc., Ph.D.", room: "Pampaken" },
                    { time: "13.00 - 14.40", name: "Manajemen Sumber Daya Manusia", code: "EFBGHFH", lecturer: "Tim Dosen", room: "Kenanga" },
                    { time: "14.50 - 16.30", name: "Metode Statistika", code: "EFB2202", lecturer: "Novianti Adi Rohmanna, S.T.P., M.T., dkk.", room: "Kemuning" }
                ]
            },
            {
                date: "Selasa, 07 April 2026",
                courses: [
                    { time: "08.00 - 09.40", name: "Manajemen Lingkungan Industri", code: "EFB2207", lecturer: "Prof. Agung Nugroho, S.T.P., M.Sc., Ph.D.", room: "Kalalayu" },
                    { time: "13.00 - 14.40", name: "Dasar Teknik Proses", code: "EFB2201", lecturer: "Prof. Agung Nugroho, S.T.P., M.Sc., Ph.D., dkk.", room: "Kenanga" }
                ]
            },
            {
                date: "Rabu, 08 April 2026",
                courses: [
                    { time: "14.50 - 16.30", name: "Pengantar Lingkungan Lahan Basah", code: "EFB1208", lecturer: "Ismi Nuari Puspitaningrum, S.P., M.Sc.", room: "Culan" }
                ]
            },
            {
                date: "Kamis, 09 April 2026",
                courses: [
                    { time: "08.00 - 09.40", name: "Kewarganegaraan", code: "EFB1203", lecturer: "Habibah Pidi Rohmatu, M.Pd.", room: "Pampaken" },
                    { time: "13.00 - 14.40", name: "Pengetahuan Bahan Agroindustri", code: "EFB2205", lecturer: "Nurul Azizah, S.T.P., M.T.", room: "Kemuning" },
                    { time: "16.40 - 18.20", name: "Kalkulus", code: "EFB2204", lecturer: "Oni Susanto, S.Si., M.Si.", room: "Kemuning" }
                ]
            }
        ]
    }
};

function showSchedule(sem) {
    if(sem === 1 || sem === 2 || sem === 'uts2') {
        const data = schedules[sem];
        const display = document.getElementById('schedule-display');
        
        let html = '';

        if (data.isUts) {
            // --- TAMPILAN KHUSUS JADWAL UTS (WARNING RED THEME) ---
            html = `
                <div class="glass-panel rounded-2xl overflow-hidden animate-pop-in border border-red-500/50 shadow-[0_0_40px_rgba(220,38,38,0.2)] relative">
                    <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: repeating-linear-gradient(45deg, #000 0, #000 10px, #ef4444 10px, #ef4444 20px);"></div>
                    
                    <div class="bg-gradient-to-r from-red-900 to-red-600 p-4 flex justify-between items-center text-white relative z-10 border-b-4 border-black/30">
                        <div>
                            <button onclick="showSchedule(2)" class="mb-2 text-[10px] font-bold bg-black/40 hover:bg-black/80 text-white px-3 py-1 rounded-full flex items-center gap-1 transition-colors border border-white/20"><i class="fa-solid fa-arrow-left"></i> KEMBALI KE JADWAL REGULER</button>
                            <h3 class="font-black text-lg md:text-xl tracking-wider uppercase drop-shadow-md flex items-center gap-2">
                                <i class="fa-solid fa-triangle-exclamation text-yellow-400 animate-pulse"></i> ${data.title}
                            </h3>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] text-red-200 font-bold tracking-widest leading-none">SELAMAT</p>
                            <p class="text-sm font-black text-white leading-none">BERJUANG!</p>
                        </div>
                    </div>
                    
                    <div class="p-4 md:p-6 grid gap-6 md:grid-cols-2 relative z-10 bg-black/60 backdrop-blur-sm">
            `;

            data.days.forEach(d => {
                html += `
                    <div class="rounded-xl p-4 md:p-5 border border-red-900 bg-black/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-red-500 transition-colors">
                        <div class="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                        
                        <h4 class="font-black text-lg mb-4 text-red-400 border-b border-red-500/30 pb-2 flex items-center gap-2">
                            <i class="fa-regular fa-calendar-xmark text-red-500"></i> ${d.date}
                        </h4>
                        <ul class="space-y-4">
                `;
                d.courses.forEach(c => {
                    html += `
                        <li class="flex flex-col bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-red-900/20 transition-colors">
                            <div class="flex justify-between items-start mb-2 border-b border-gray-700/50 pb-2">
                                <span class="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded shadow-sm flex items-center gap-1"><i class="fa-regular fa-clock"></i> ${c.time}</span>
                                <span class="text-[10px] font-mono font-bold text-red-300 bg-red-900/50 px-2 py-0.5 rounded-full border border-red-800">${c.code}</span>
                            </div>
                            <span class="font-black text-lg text-white leading-tight mb-2">${c.name}</span>
                            <div class="text-[11px] text-gray-400 flex flex-col gap-1.5">
                                <span class="flex items-start gap-2"><i class="fa-solid fa-user-pen text-red-500 mt-0.5 w-3"></i> <span>${c.lecturer}</span></span>
                                <span class="flex items-start gap-2"><i class="fa-solid fa-door-open text-red-500 mt-0.5 w-3"></i> <span class="font-bold text-gray-300">Ruang ${c.room}</span></span>
                            </div>
                        </li>
                    `;
                });
                html += `</ul></div>`;
            });

            html += `</div></div>`;

        } else {
            // --- TAMPILAN JADWAL REGULER (HARI-HARI) ---
            const todayIndex = new Date().getDay(); // 0 = Minggu, 1 = Senin, dst
            const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            const currentDayName = dayNames[todayIndex];
            
            html = `
                <div class="glass-panel rounded-2xl overflow-hidden animate-pop-in">
                    <div class="bg-tipYellow p-4 flex justify-between items-center text-black">
                        <h3 class="font-bold text-xl">${data.title}</h3>
                        <i class="fa-regular fa-calendar-days text-xl"></i>
                    </div>
            `;

            // Tambahkan tombol UTS khusus jika membuka Semester 2
            if (sem === 2) {
                html += `
                    <div class="p-4 md:p-6 bg-black/40 border-b border-white/5 flex justify-center">
                        <button onclick="showSchedule('uts2')" class="w-full md:w-auto px-6 py-3 rounded-xl border border-red-600 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white hover:shadow-[0_0_30px_rgba(220,38,38,0.8)] transition-all font-bold group relative overflow-hidden animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.4)] backdrop-blur-sm">
                            <span class="relative z-10 flex items-center justify-center gap-2">
                                <i class="fa-solid fa-fire text-lg"></i> KLIK DI SINI UNTUK MELIHAT JADWAL UTS <i class="fa-solid fa-skull group-hover:scale-125 transition-transform"></i>
                            </span>
                            <div class="absolute inset-0 bg-red-500/10 w-full h-full animate-[shimmer-bg_2s_infinite] pointer-events-none"></div>
                        </button>
                    </div>
                `;
            }

            html += `<div class="p-6 grid gap-6 md:grid-cols-2">`;

            data.days.forEach(d => {
                const isToday = d.day === currentDayName;
                const highlightClass = isToday ? 'day-highlight' : `bg-white/5 border-${d.color}-500`;
                const titleColor = isToday ? 'text-tipYellow text-glow' : `text-${d.color}-400`;
                
                html += `
                    <div class="rounded-xl p-4 border-l-4 ${highlightClass} transition-all duration-300">
                        <h4 class="font-bold text-lg mb-3 ${titleColor}">${d.day}</h4>
                        <ul class="space-y-3">
                `;
                d.courses.forEach(c => {
                    html += `
                        <li class="flex justify-between border-b border-gray-700 pb-2">
                            <span class="text-sm font-medium text-gray-300">${c.time}</span>
                            <span class="text-right text-sm">
                                <span class="font-bold text-white">${c.name}</span><br>
                                <small class="text-gray-400">${c.room}</small>
                            </span>
                        </li>
                    `;
                });
                html += `</ul></div>`;
            });

            html += `</div></div>`;
        }
        
        display.innerHTML = html;
        display.classList.remove('hidden');
        display.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert("Jadwal Semester " + sem + " belum tersedia / Anda belum memiliki akses.");
    }
}

// --- WIDGET COUNTDOWN LOGIC ---
function parseTimeMins(timeStr) {
    let parts = timeStr.includes('.') ? timeStr.split('.') : timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function updateClassCountdown() {
    const now = new Date();
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const currentDayStr = dayNames[now.getDay()];
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const totalCurrentSecs = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();

    // Update Tanggal
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', dateOptions);
    const widgetDate = document.getElementById('widget-date');
    if(widgetDate) widgetDate.innerText = `${currentDayStr}, ${dateStr}`;

    // Element DOM WIdget
    const wStatus = document.getElementById('widget-status');
    const wCourse = document.getElementById('widget-course');
    const wCountdown = document.getElementById('widget-countdown');
    const wTimeLabel = document.getElementById('widget-time-label');
    const wProgBar = document.getElementById('widget-progress-bar');
    const wOngoing = document.getElementById('widget-ongoing-text');

    if(!wStatus) return; // Guard agar tidak error di tab lain

    // Ambil data jadwal Semester 2 hari ini
    const sem2 = schedules[2].days.find(d => d.day === currentDayStr);

    let ongoingClass = null;
    let nextClass = null;
    let nextClassDayOffset = 0; // 0 artinya hari ini
    let nextClassDayName = currentDayStr;

    // 1. Cek jadwal HARI INI
    if (sem2 && sem2.courses) {
        for (let i = 0; i < sem2.courses.length; i++) {
            let c = sem2.courses[i];
            let times = c.time.split(' - ');
            let startMins = parseTimeMins(times[0]);
            let endMins = parseTimeMins(times[1]);

            if (currentMins >= startMins && currentMins < endMins) {
                ongoingClass = c;
                // Cek apakah ada matkul selanjutnya hari ini
                if (i + 1 < sem2.courses.length) {
                    nextClass = sem2.courses[i + 1];
                    nextClassDayOffset = 0;
                }
                break; 
            } else if (startMins > currentMins) {
                if (!nextClass) {
                    nextClass = c;
                    nextClassDayOffset = 0;
                }
                break; 
            }
        }
    }

    // 2. Jika TIDAK ADA kelas berikutnya HARI INI, cari di hari-hari kedepan (Maks 7 hari)
    if (!nextClass) {
        for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
            let checkDayIndex = (now.getDay() + daysAhead) % 7;
            let checkDayStr = dayNames[checkDayIndex];
            let checkSem2 = schedules[2].days.find(d => d.day === checkDayStr);

            if (checkSem2 && checkSem2.courses && checkSem2.courses.length > 0) {
                nextClass = checkSem2.courses[0]; // Ambil matkul paling pertama di hari tsb
                nextClassDayOffset = daysAhead;
                nextClassDayName = checkDayStr;
                break;
            }
        }
    }

    if (ongoingClass && !nextClass) {
        // Sangat jarang terjadi jika lookahead 7 hari aktif, tapi sbg fallback
        wStatus.innerText = "KELAS SEDANG BERLANGSUNG";
        wCourse.innerText = ongoingClass.name;
        wOngoing.innerHTML = `<i class="fa-solid fa-chalkboard-user mr-1"></i> Sedang di: ${ongoingClass.room} (Berakhir ${ongoingClass.time.split(' - ')[1]})`;
        wCountdown.innerHTML = `00:00:00 <span class="text-base text-gray-800 font-bold">selesai</span>`;
        wTimeLabel.innerText = "Sisa waktu perkuliahan";
        
        // Progress Bar: Ikuti progress kelas yang sedang berlangsung
        let startMins = parseTimeMins(ongoingClass.time.split(' - ')[0]);
        let endMins = parseTimeMins(ongoingClass.time.split(' - ')[1]);
        let percent = Math.max(2, Math.min(100, ((currentMins - startMins) / (endMins - startMins)) * 100));
        wProgBar.style.width = `${percent}%`;

    } else if (ongoingClass && nextClass) {
        // Ada kelas jalan, dan ada kelas selanjutnya
        wStatus.innerText = "MATA KULIAH BERIKUTNYA";
        wCourse.innerText = nextClass.name;
        wOngoing.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Sedang Berlangsung: ${ongoingClass.name} (${ongoingClass.room})`;

        let startNextMins = parseTimeMins(nextClass.time.split(' - ')[0]);
        let diffTotalSecs = 0;
        
        if (nextClassDayOffset === 0) {
            diffTotalSecs = (startNextMins * 60) - totalCurrentSecs;
            wTimeLabel.innerHTML = `Pukul ${nextClass.time.split(' - ')[0]} &bull; ${nextClass.room}`;
        } else {
            diffTotalSecs = (86400 - totalCurrentSecs) + ((nextClassDayOffset - 1) * 86400) + (startNextMins * 60);
            let dayText = nextClassDayOffset === 1 ? "Besok" : nextClassDayName;
            wTimeLabel.innerHTML = `${dayText}, Pukul ${nextClass.time.split(' - ')[0]} &bull; ${nextClass.room}`;
        }

        let h = Math.floor(diffTotalSecs / 3600);
        let m = Math.floor((diffTotalSecs % 3600) / 60);
        let s = diffTotalSecs % 60;

        wCountdown.innerHTML = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} <span class="text-base text-gray-900 font-extrabold">lagi</span>`;
        
        // Progress Bar: Ikuti progress kelas yang sedang berlangsung
        let startMins = parseTimeMins(ongoingClass.time.split(' - ')[0]);
        let endMins = parseTimeMins(ongoingClass.time.split(' - ')[1]);
        let percent = Math.max(2, Math.min(100, ((currentMins - startMins) / (endMins - startMins)) * 100));
        wProgBar.style.width = `${percent}%`;

    } else if (!ongoingClass && nextClass) {
        // Tidak ada kelas saat ini, menunggu kelas selanjutnya
        wStatus.innerText = "MATA KULIAH BERIKUTNYA";
        wCourse.innerText = nextClass.name;

        let startMins = parseTimeMins(nextClass.time.split(' - ')[0]);
        let diffTotalSecs = 0;

        if (nextClassDayOffset === 0) {
            // Kelasnya di hari yang sama
            wOngoing.innerHTML = `<i class="fa-solid fa-mug-hot mr-1"></i> Waktu istirahat. Bersiap untuk kelas berikutnya.`;
            wTimeLabel.innerHTML = `Pukul ${nextClass.time.split(' - ')[0]} &bull; ${nextClass.room}`;
            diffTotalSecs = (startMins * 60) - totalCurrentSecs;
        } else {
            // Kelasnya di hari esok atau beberapa hari kedepan
            let dayText = nextClassDayOffset === 1 ? "Besok" : `Hari ${nextClassDayName}`;
            wOngoing.innerHTML = `<i class="fa-solid fa-bed mr-1"></i> Tidak ada kelas. Santai dulu sampai ${dayText}.`;
            wTimeLabel.innerHTML = `${dayText}, Pukul ${nextClass.time.split(' - ')[0]} &bull; ${nextClass.room}`;
            diffTotalSecs = (86400 - totalCurrentSecs) + ((nextClassDayOffset - 1) * 86400) + (startMins * 60);
        }
        
        let h = Math.floor(diffTotalSecs / 3600);
        let m = Math.floor((diffTotalSecs % 3600) / 60);
        let s = diffTotalSecs % 60;

        // Format jam (h bisa melebihi 24 jam)
        wCountdown.innerHTML = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} <span class="text-base text-gray-900 font-extrabold">lagi</span>`;

        // Logika Garis Animasi Baru (Max 12 Jam Mundur)
        // Garis berjalan dari kiri (pendek) maju ke kanan seiring mendekati waktu mulai kelas (hitungan 12 jam sisa)
        let maxWaitSecs = 12 * 3600; 
        let percent = 100 - ((diffTotalSecs / maxWaitSecs) * 100);
        percent = Math.max(2, Math.min(100, percent)); // Min 2% agar bulatan percikan tetap terlihat
        wProgBar.style.width = `${percent}%`;

    } else {
        // Jika jadwal kosong melompong secara permanen
        wStatus.innerText = "INFO AKADEMIK";
        wCourse.innerText = "Jadwal Belum Dibuat";
        wOngoing.innerHTML = `<i class="fa-solid fa-house-chimney mr-1"></i> Tunggu update sistem untuk jadwal semester ini.`;
        wCountdown.innerHTML = `--:--:-- <span class="text-base text-gray-800 font-bold">jam</span>`;
        wTimeLabel.innerText = "Sampai Jumpa";
        wProgBar.style.width = `2%`; // Set 2% agar percikan ngumpet manis di awal
    }
}


// --- 5. IPK CALCULATOR ---
let courses = [];

function addCourse() {
    const name = document.getElementById('courseName').value;
    const sks = parseFloat(document.getElementById('courseSks').value);
    const grade = parseFloat(document.getElementById('courseGrade').value);

    if (!name || isNaN(sks)) {
        alert("Isi nama matkul dan SKS dengan benar!");
        return;
    }

    courses.push({ name, sks, grade });
    renderCourses();
    
    // Clear inputs
    document.getElementById('courseName').value = '';
    document.getElementById('courseSks').value = '';
}

function renderCourses() {
    const tbody = document.getElementById('courseTableBody');
    tbody.innerHTML = '';
    courses.forEach((c, index) => {
        const row = `
            <tr class="border-b border-gray-700 hover:bg-white/5">
                <td class="px-3 py-2 text-white">${c.name}</td>
                <td class="px-3 py-2">${c.sks}</td>
                <td class="px-3 py-2 font-bold text-tipYellow">${c.grade}</td>
                <td class="px-3 py-2">
                    <button onclick="removeCourse(${index})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function removeCourse(index) {
    courses.splice(index, 1);
    renderCourses();
}

function calculateIPK() {
    if (courses.length === 0) return;

    let totalSks = 0;
    let totalPoints = 0;

    courses.forEach(c => {
        totalSks += c.sks;
        totalPoints += (c.sks * c.grade);
    });

    const ipk = (totalPoints / totalSks).toFixed(2);
    const resultArea = document.getElementById('resultArea');
    const finalIpk = document.getElementById('finalIpk');
    const roastMsg = document.getElementById('roastMessage');

    resultArea.classList.remove('hidden');
    finalIpk.innerText = ipk;

    // Roast Logic
    if (ipk >= 4.00) {
        roastMsg.innerText = "Dewa turun ke bumi! IPK Sempurna. Jangan lupa injak tanah ya.";
    } else if (ipk >= 3.75) {
        roastMsg.innerText = "Nyaris sempurna. Calon Menteri Pertanian masa depan!";
    } else if (ipk >= 3.50) {
        roastMsg.innerText = "Cumlaude di depan mata. Pertahankan atau nangis di pojokan semester depan.";
    } else if (ipk >= 3.00) {
        roastMsg.innerText = "Aman. Masih manusia biasa. Belum jadi beban keluarga, tapi jangan lengah.";
    } else if (ipk >= 2.50) {
        roastMsg.innerText = "Lampu kuning bro. Kurangi nongkrong, perbanyak doa dan belajar.";
    } else if (ipk >= 2.00) {
        roastMsg.innerText = "Hati-hati pinggir jurang! Dikit lagi DO melambai-lambai.";
    } else {
        roastMsg.innerText = "BEBAN KELUARGA DETECTED. Silakan login ulang kehidupan atau pindah jurusan.";
    }
}

// --- 6. FIRE CLICK EFFECT ---
document.addEventListener('click', (e) => {
    const container = document.getElementById('particles-container');
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 8 + 4; // 4px to 12px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${e.clientX}px`;
        particle.style.top = `${e.clientY}px`;
        
        // Random direction
        const xDir = (Math.random() - 0.5) * 100;
        const yDir = (Math.random() - 0.5) * 100;
        
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${xDir}px, ${yDir}px) scale(0)`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        });

        container.appendChild(particle);

        // Cleanup
        setTimeout(() => particle.remove(), 600);
    }
});

// --- 7. WHO BIRTH TODAY LOGIC ---
function triggerBirthdayCheck() {
    // 1. Activate Glow
    const glow = document.getElementById('ai-glow');
    glow.classList.remove('ai-glow-active');
    void glow.offsetWidth; // trigger reflow
    glow.classList.add('ai-glow-active');

    // 2. Logic
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const matchStr = `-${mm}-${dd}`; // Matches "-MM-DD" in "YYYY-MM-DD"

    // Menggunakan data 'students' yang sudah ada di scope global
    const birthdayStudents = students.filter(s => s.dob.endsWith(matchStr));
    
    const resultBox = document.getElementById('birthday-result');
    const contentBox = document.getElementById('birthday-content');
    
    if(birthdayStudents.length > 0) {
        let names = birthdayStudents.map(s => s.name).join('<br>');
        contentBox.innerHTML = `
            <i class="fa-solid fa-cake-candles text-5xl text-pink-500 mb-4 animate-bounce"></i>
            <h3 class="text-2xl font-bold text-white mb-2">Happy Birthday!</h3>
            <p class="text-lg text-tipYellow font-bold leading-relaxed">${names}</p>
        `;
    } else {
        contentBox.innerHTML = `
            <i class="fa-regular fa-calendar-xmark text-5xl text-gray-400 mb-4"></i>
            <h3 class="text-2xl font-bold text-white mb-2">Tidak ada yang ultah</h3>
            <p class="text-sm text-gray-400">Hari ini (${dd}-${mm}) sepi pesta.</p>
        `;
    }

    // 3. Show Result
    resultBox.classList.add('birthday-result-active');

    // 4. Hide after 5 seconds
    setTimeout(() => {
        resultBox.classList.remove('birthday-result-active');
    }, 5000);
}
