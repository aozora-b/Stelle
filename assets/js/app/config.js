const APP_CONFIG = {
  WORLD: {
    SIZE: 1600,
    ROAD_WIDTH: 24,
    BUILDING_COUNT: 260,
    DEFAULT_WEATHER: "SPRING_DAY"
  },
  CAMERA: {
    DEFAULT_MODE: "CHASE",
    MODES: ["CHASE", "HOOD", "TOPDOWN"]
  },
  WEATHER: {
    SPRING_DAY: {
      name: "🌸 SPRING DAY",
      skyColor: 0x64b5f6,
      fogColor: 0x90caf9,
      fogDensity: 0.0011,
      hemiSky: 0xffffff,
      hemiGround: 0x3d5a45,
      sunColor: 0xfffae8,
      sunIntensity: 2.3,
      roadRoughness: 0.8,
      streetlightsOn: false,
      headlightsIntensity: 0.3,
      underglowIntensity: 0.4,
      rain: false,
      sakuraPetals: true
    },
    GOLDEN_SUNSET: {
      name: "🌇 SUNSET",
      skyColor: 0x2b1b3d,
      fogColor: 0x3d274c,
      fogDensity: 0.0016,
      hemiSky: 0xffa057,
      hemiGround: 0x1d2233,
      sunColor: 0xffb84d,
      sunIntensity: 1.8,
      roadRoughness: 0.65,
      streetlightsOn: true,
      headlightsIntensity: 1.8,
      underglowIntensity: 1.2,
      rain: false,
      sakuraPetals: true
    },
    SUMMER_RAIN: {
      name: "🌧️ RAIN",
      skyColor: 0x1b2738,
      fogColor: 0x223145,
      fogDensity: 0.0024,
      hemiSky: 0x486581,
      hemiGround: 0x101a24,
      sunColor: 0x9fb3c8,
      sunIntensity: 0.95,
      roadRoughness: 0.18,
      streetlightsOn: true,
      headlightsIntensity: 3.6,
      underglowIntensity: 2.2,
      rain: true,
      sakuraPetals: false
    },
    TOKYO_NIGHT: {
      name: "🌙 NIGHT",
      skyColor: 0x090d16,
      fogColor: 0x0c121e,
      fogDensity: 0.002,
      hemiSky: 0x273b5c,
      hemiGround: 0x090e17,
      sunColor: 0x7694ba,
      sunIntensity: 0.75,
      roadRoughness: 0.65,
      streetlightsOn: true,
      headlightsIntensity: 3.5,
      underglowIntensity: 2.4,
      rain: false,
      sakuraPetals: false
    }
  },
  CAR: {
    NAME: "Bugatti Chiron",
    ENGINE: "8.0L Quad-Turbo W16 (1,500 HP)",
    MAX_SPEED: 65.0,
    MAX_REVERSE_SPEED: -16.0,
    ACCELERATION: 44.0,
    BRAKE_FORCE: 58.0,
    FRICTION: 2.6,
    MAX_STEER_ANGLE: 0.46,
    STEER_SPEED: 6.5,
    STEER_RETURN_SPEED: 8.5,
    WHEEL_BASE: 2.71,
    DRIFT_FACTOR: 0.94,
    MASS: 1995,
    COLORS: {
      BODY: 0x0341ff,
      ACCENT: 0x000208,
      RIMS: 0xe0e6ed,
      CALIPERS: 0x0341ff,
      GLASS: 0x0b111e,
      UNDERGLOW: 0x00f0ff,
      HEADLIGHTS: 0xfffaed,
      TAILLIGHTS: 0xff1e2d
    }
  },
  RADAR: {
    CANVAS_SIZE: 190,
    DEFAULT_HEADING_MODE: true,
    FULLSCREEN_SCALE: 0.65
  },
  PROJECTS: [
    {
      id: "auto-absen",
      title: "Auto-Absen Bot",
      district: "AKIHABARA TECH VALLEY",
      category: "Python & Automation Systems",
      tagline: "Headless Student Attendance Automation with Antidetect Selenium Engine",
      summary: "Sistem automasi presensi cerdas yang mengeksekusi login dan konfirmasi kehadiran harian pada portal kampus secara terjadwal, efisien, dan bebas hambatan.",
      stack: ["Python 3.14", "Selenium 4", "Headless Chrome", "Windows Scheduler"],
      features: [
        "Automated session management & cookie caching",
        "Explicit Wait pattern untuk toleransi jaringan lambat",
        "Anti-bot detection flags & user-agent rotation",
        "Eksekusi headless di background dengan konsumsi resource rendah"
      ],
      github: "https://github.com",
      color: 0x00f0ff,
      pos: { x: 190, z: -140 },
      radius: 20.0
    },
    {
      id: "music-app",
      title: "Aplikasi Musik",
      district: "ROPPONGI AUDIO DISTRICT",
      category: "Flutter & Mobile Engineering",
      tagline: "Cross-Platform High-Fidelity Music Player with Clean Architecture",
      summary: "Aplikasi pemutar musik mobile modern berarsitektur Feature-First (Clean Architecture) dengan pemrosesan audio berlatensi rendah, visualisasi spektrum gelombang, dan caching database lokal SQLite.",
      stack: ["Flutter", "Dart", "SQLite", "BLoC Pattern", "Audio Visualizer"],
      features: [
        "Pemisahan layer Presentation, Domain, dan Data yang ketat",
        "Penyimpanan offline lagu dan playlist via SQLite",
        "Animasi visualizer audio dinamis yang responsif",
        "Manajemen state reaktif dengan performa 60 FPS"
      ],
      github: "https://github.com",
      color: 0xff3366,
      pos: { x: 380, z: 0 },
      radius: 20.0
    },
    {
      id: "open-webui",
      title: "Open WebUI AI Extension",
      district: "OASIS AI DISTRICT",
      category: "AI & Pipeline Engineering",
      tagline: "Gemini API Gateway & Local LLM Orchestrator for Open WebUI",
      summary: "Pipeline integrasi model AI generasi terbaru (Gemini 3.6 Flash, Gemini 3.1 Pro) ke dalam antarmuka Open WebUI dengan sinkronisasi database runtime dan sanitasi otomatis.",
      stack: ["Python", "FastAPI", "Gemini API", "Docker", "SQLite"],
      features: [
        "Sinkronisasi model dinamis ke database SQLite tanpa restart",
        "Dual-engine routing: OpenAI-compatible & Gemini Native",
        "Penanganan error token dan model sanitization script",
        "Optimasi latency untuk interaksi obrolan multi-turn"
      ],
      github: "https://github.com",
      color: 0x9945ff,
      pos: { x: 0, z: -260 },
      radius: 20.0
    },
    {
      id: "whatsapp-bot",
      title: "Bot WhatsApp AI",
      district: "GINZA COMMERCIAL BOULEVARD",
      category: "Backend & NLP Services",
      tagline: "Automated Messaging Infrastructure with Natural Language Understanding",
      summary: "Infrastruktur bot WhatsApp otomatis dengan integrasi pemrosesan bahasa alami (NLP) untuk respons otomatis, pemrosesan transaksi, dan asisten interaktif 24/7.",
      stack: ["Node.js", "Baileys API", "NLP Engine", "SQLite"],
      features: [
        "Manajemen multi-sesi koneksi WhatsApp yang stabil",
        "Intent recognition untuk memahami maksud pesan pengguna",
        "Antrean pesan (queueing) dengan rate-limiting aman",
        "Logging aktivitas real-time dan dashboard status"
      ],
      github: "https://github.com",
      color: 0x25d366,
      pos: { x: -190, z: 140 },
      radius: 20.0
    },
    {
      id: "ghost-solver",
      title: "Ghost Solver Terminal",
      district: "SHINJUKU UNDERGROUND",
      category: "Systems & CLI Games",
      tagline: "Immersive Linux Terminal Simulator with Adaptive AI Puzzle Solver",
      summary: "Simulasi terminal retro Linux dengan sistem pemecahan teka-teki adaptif berbantuan AI. Menggabungkan sensasi command-line klasik dengan logika permainan modern.",
      stack: ["Python", "CLI / Curses", "Linux Emulation", "AI Logic"],
      features: [
        "Emulasi perintah Unix inti (ls, cd, cat, grep, ssh)",
        "Generator teka-teki prosedural dengan tingkat kesulitan dinamis",
        "Tampilan visual scanlines CRT hijau fosfor retro",
        "Eksekusi ringan tanpa dependensi eksternal"
      ],
      github: "https://github.com",
      color: 0xf5a623,
      pos: { x: -380, z: -100 },
      radius: 20.0
    },
    {
      id: "about-stelle",
      title: "About Stelle",
      district: "SHIBUYA CROSSING // CENTRAL PLAZA",
      category: "Creative Engineer & Designer",
      tagline: "Crafting High-Performance Digital Products from Code to Experience",
      summary: "Saya adalah seorang Full-Stack Developer dan UI/UX Designer dari Indonesia. Berkomitmen menerapkan standar Clean Code, modularitas arsitektur, dan estetika visual tingkat tinggi di setiap baris kode yang ditulis.",
      stack: ["Flutter", "Python", "JavaScript", "Selenium", "Three.js", "UI/UX"],
      features: [
        "Penerapan prinsip SOLID, Loose Coupling, dan High Cohesion",
        "Pengalaman menyeluruh: Mobile, Otomasi Backend, dan Web 3D",
        "Berorientasi pada kepuasan pengguna dan kemudahan maintenance",
        "Terbuka untuk kolaborasi proyek inovatif di seluruh dunia"
      ],
      github: "https://github.com",
      color: 0xf5a623,
      pos: { x: 0, z: 0 },
      radius: 18.0
    },
    {
      id: "contact-stelle",
      title: "Transmission Hub",
      district: "ODAIBA BAY TRANSMISSION",
      category: "Direct Communication Line",
      tagline: "Ready to Build Something Extraordinary Together",
      summary: "Mempunyai ide proyek, kebutuhan automasi, atau aplikasi mobile yang ingin direalisasikan? Hubungi saya secara langsung melalui email atau media sosial di bawah.",
      stack: ["Email: hello@stelle.dev", "GitHub", "LinkedIn", "Instagram"],
      features: [
        "Konsultasi awal arsitektur software & desain antarmuka",
        "Pengerjaan proyek freelance & kemitraan engineering",
        "Waktu respon cepat (< 24 jam)",
        "Berbasis di Indonesia 🇮🇩"
      ],
      github: "mailto:hello@stelle.dev",
      color: 0x00f0ff,
      pos: { x: 0, z: 460 },
      radius: 22.0
    },
    {
      id: "flappie",
      title: "Flappie Media Downloader",
      district: "SHIBUYA STREAM // MEDIA HUB",
      category: "Cross-Platform Video & Audio Downloader",
      tagline: "Universal Media Harvester with Native YouTube 4K & Multi-Threaded Engine",
      summary: "Aplikasi all-in-one downloader berkecepatan tinggi yang mendukung konversi video dan audio langsung dari YouTube, TikTok (tanpa watermark), Instagram Reels/Stories, Twitter/X, dan Facebook. Ditenagai engine yt-dlp teroptimasi dan antarmuka responsif.",
      stack: ["Flutter", "Python 3.14", "yt-dlp Engine", "FFmpeg", "Concurrent Streams"],
      features: [
        "Unduh video hingga resolusi 4K 60FPS dengan penggabungan stream audio otomatis",
        "Ekstraksi audio kualitas tinggi MP3 320kbps & lossless FLAC",
        "Penghapusan otomatis watermark pada platform TikTok dan Shorts",
        "Manajemen antrean download paralel (multi-threaded queue) hemat daya",
        "Pencarian metadata terintegrasi & pembuatan playlist instan"
      ],
      github: "https://github.com",
      color: 0xff0055,
      pos: { x: 0, z: 260 },
      radius: 22.0
    }
  ]
};
Object.freeze(APP_CONFIG);
window.APP_CONFIG = APP_CONFIG;