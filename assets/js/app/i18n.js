const I18N = {
  currentLang: "id",
  translations: {
    id: {
      hud: {
        brandSub: "TOKYO EXP-WAY",
        driveMode: "🎮 MODE KEMUDI",
        cruiseMode: "✨ MODE SINEMATIK",
        openMap: "🗺️ PETA KOTA",
        audioOn: "🔊 AUDIO: ON",
        audioOff: "🔇 AUDIO: OFF",
        reset: "↺ RESET",
        headingUp: "🧭 HEADING-UP",
        northUp: "🧭 NORTH-UP",
        controlsHint: "<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Kemudi &bull; <kbd>SPASI</kbd> Drift &bull; <kbd>V</kbd> Kamera &bull; <kbd>M</kbd> Peta &bull; <kbd>Drag</kbd> Kamera",
        cameraView: {
          CHASE: "📷 CHASE",
          HOOD: "📷 HOOD",
          TOPDOWN: "📷 TOP"
        },
        respawnToast: "↺ JATUH KE AIR! KEMBALI KE TITIK AWAL"
      },
      hub: {
        options: "Opsi",
        controls: "Panduan Kontrol",
        projects: "Karya & Proyek",
        weather: "Suasana Cuaca",
        about: "Tentang",
        lblAudio: "Audio",
        lblQuality: "Kualitas",
        lblCamera: "Mode Kamera",
        lblUnstuck: "Saya buntu!",
        btnUnstuck: "Muncul kembali",
        lblReset: "Mengatur ulang",
        btnReset: "Mengatur ulang",
        lblMode: "Mode Kemudi",
        btnDrive: "🎮 Manual",
        btnCruise: "✨ Sinematik",
        lblFps: "Indikator FPS",
        qualityAuto: "Auto (Adaptif)",
        qualityHigh: "Tinggi",
        qualityMed: "Sedang",
        qualityLow: "Hemat Daya",
        toastQualityAutoDowngrade: "⚡ Mode Sedang diaktifkan otomatis agar 60 FPS tetap mulus!",
        toastQualityLowDowngrade: "⚡ Mode Hemat Daya diaktifkan otomatis agar bebas lag!"
      },
      pill: {
        openBtn: "Buka Detail (ENTER) →",
        sector: "DISTRIK SEKTOR"
      },
      mapModal: {
        title: "TOKYO EXP-WAY // TACTICAL GPS RADAR",
        zoomIn: "➕ PERBESAR",
        zoomOut: "➖ PERKECIL",
        center: "🎯 PUSATKAN",
        close: "✕ TUTUP",
        footer1: "💡 Klik & geser untuk melihat peta &bull; Scroll untuk zoom",
        footer2: "⚡ Klik pada stasiun manapun untuk meluncur ke lokasi"
      },
      drawer: {
        highlightsTitle: "SOROTAN TEKNIK & ARSITEKTUR",
        repoBtn: "LIHAT DOKUMENTASI / REPO →",
        emailBtn: "KIRIM EMAIL LANGSUNG →"
      },
      projects: {
        "auto-absen": {
          title: "Auto-Absen Bot",
          district: "AKIHABARA TECH VALLEY",
          category: "Sistem Otomasi & Python",
          tagline: "Sistem Presensi Mahasiswa Otomatis dengan Headless Selenium Antideteksi",
          summary: "Sistem automasi cerdas yang mengeksekusi login dan konfirmasi kehadiran harian pada portal kampus secara terjadwal, efisien, dan bebas hambatan.",
          features: [
            "Manajemen sesi otomatis & caching cookie",
            "Explicit Wait pattern untuk toleransi jaringan lambat",
            "Anti-bot detection flags & rotasi user-agent",
            "Eksekusi headless di background dengan konsumsi resource rendah"
          ]
        },
        "music-app": {
          title: "Aplikasi Musik",
          district: "ROPPONGI AUDIO DISTRICT",
          category: "Flutter & Mobile Engineering",
          tagline: "Pemutar Musik Cross-Platform Berperforma Tinggi dengan Clean Architecture",
          summary: "Aplikasi pemutar musik mobile modern berarsitektur Feature-First (Clean Architecture) dengan pemrosesan audio berlatensi rendah, visualisasi spektrum gelombang, dan caching database lokal SQLite.",
          features: [
            "Pemisahan layer Presentation, Domain, dan Data yang ketat",
            "Penyimpanan offline lagu dan playlist via SQLite",
            "Animasi visualizer audio dinamis yang responsif",
            "Manajemen state reaktif dengan performa 60 FPS"
          ]
        },
        "open-webui": {
          title: "Open WebUI AI Extension",
          district: "OASIS AI DISTRICT",
          category: "Rekayasa Pipeline & AI",
          tagline: "Gemini API Gateway & Local LLM Orchestrator untuk Open WebUI",
          summary: "Pipeline integrasi model AI generasi terbaru (Gemini 3.6 Flash, Gemini 3.1 Pro) ke dalam antarmuka Open WebUI dengan sinkronisasi database runtime dan sanitasi otomatis.",
          features: [
            "Sinkronisasi model dinamis ke database SQLite tanpa restart",
            "Dual-engine routing: OpenAI-compatible & Gemini Native",
            "Penanganan error token dan model sanitization script",
            "Optimasi latency untuk interaksi obrolan multi-turn"
          ]
        },
        "whatsapp-bot": {
          title: "Bot WhatsApp AI",
          district: "GINZA COMMERCIAL BOULEVARD",
          category: "Layanan Backend & NLP",
          tagline: "Infrastruktur Pesan Otomatis dengan Pemahaman Bahasa Alami (NLP)",
          summary: "Infrastruktur bot WhatsApp otomatis dengan integrasi pemrosesan bahasa alami (NLP) untuk respons otomatis, pemrosesan transaksi, dan asisten interaktif 24/7.",
          features: [
            "Manajemen multi-sesi koneksi WhatsApp yang stabil",
            "Intent recognition untuk memahami maksud pesan pengguna",
            "Antrean pesan (queueing) dengan rate-limiting aman",
            "Logging aktivitas real-time dan dashboard status"
          ]
        },
        "ghost-solver": {
          title: "Ghost Solver Terminal",
          district: "SHINJUKU UNDERGROUND",
          category: "Sistem & Game CLI",
          tagline: "Simulasi Terminal Linux Imersif dengan AI Problem Solver Adaptif",
          summary: "Simulasi terminal retro Linux dengan sistem pemecahan teka-teki adaptif berbantuan AI. Menggabungkan sensasi command-line klasik dengan logika permainan modern.",
          features: [
            "Emulasi perintah Unix inti (ls, cd, cat, grep, ssh)",
            "Generator teka-teki prosedural dengan tingkat kesulitan dinamis",
            "Tampilan visual scanlines CRT hijau fosfor retro",
            "Eksekusi ringan tanpa dependensi eksternal"
          ]
        },
        "about-stelle": {
          title: "Tentang Stelle",
          district: "SHIBUYA CROSSING // CENTRAL PLAZA",
          category: "Creative Engineer & Designer",
          tagline: "Membangun Produk Digital Berkualitas Tinggi dari Kode hingga Pengalaman",
          summary: "Saya adalah seorang Full-Stack Developer dan UI/UX Designer dari Indonesia. Berkomitmen menerapkan standar Clean Code, modularitas arsitektur, dan estetika visual tingkat tinggi di setiap baris kode yang ditulis.",
          features: [
            "Penerapan prinsip SOLID, Loose Coupling, dan High Cohesion",
            "Pengalaman menyeluruh: Mobile, Otomasi Backend, dan Web 3D",
            "Berorientasi pada kepuasan pengguna dan kemudahan maintenance",
            "Terbuka untuk kolaborasi proyek inovatif di seluruh dunia"
          ]
        },
        "contact-stelle": {
          title: "Pusat Transmisi Kontak",
          district: "ODAIBA BAY TRANSMISSION",
          category: "Jalur Komunikasi Langsung",
          tagline: "Siap Mewujudkan Sesuatu yang Luar Biasa Bersama",
          summary: "Mempunyai ide proyek, kebutuhan automasi, atau aplikasi mobile yang ingin direalisasikan? Hubungi saya secara langsung melalui email atau media sosial di bawah.",
          features: [
            "Konsultasi awal arsitektur software & desain antarmuka",
            "Pengerjaan proyek freelance & kemitraan engineering",
            "Waktu respon cepat (< 24 jam)",
            "Berbasis di Indonesia 🇮🇩"
          ]
        },
        "flappie": {
          title: "Flappie Media Downloader",
          district: "SHIBUYA STREAM // MEDIA HUB",
          category: "Aplikasi Downloader Video & Audio",
          tagline: "Universal Media Harvester dengan Dukungan Penuh YouTube 4K & Multi-Thread",
          summary: "Aplikasi all-in-one downloader berkecepatan tinggi yang mendukung konversi video dan audio langsung dari YouTube, TikTok (tanpa watermark), Instagram Reels/Stories, Twitter/X, dan Facebook. Ditenagai engine yt-dlp teroptimasi dan antarmuka responsif.",
          features: [
            "Unduh video hingga resolusi 4K 60FPS dengan penggabungan stream audio otomatis",
            "Ekstraksi audio kualitas tinggi MP3 320kbps & lossless FLAC",
            "Penghapusan otomatis watermark pada platform TikTok dan Shorts",
            "Manajemen antrean download paralel (multi-threaded queue) hemat daya",
            "Pencarian metadata terintegrasi & pembuatan playlist instan"
          ]
        }
      }
    },
    en: {
      hud: {
        brandSub: "TOKYO EXP-WAY",
        driveMode: "🎮 DRIVE MODE",
        cruiseMode: "✨ CRUISE MODE",
        openMap: "🗺️ CITY MAP",
        audioOn: "🔊 AUDIO: ON",
        audioOff: "🔇 AUDIO: OFF",
        reset: "↺ RESET",
        headingUp: "🧭 HEADING-UP",
        northUp: "🧭 NORTH-UP",
        controlsHint: "<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Drive &bull; <kbd>SPACE</kbd> Drift &bull; <kbd>V</kbd> Camera &bull; <kbd>M</kbd> Full Map &bull; <kbd>Drag</kbd> Orbit Look",
        cameraView: {
          CHASE: "📷 CHASE",
          HOOD: "📷 HOOD",
          TOPDOWN: "📷 TOP"
        },
        respawnToast: "↺ PLUNGED INTO WATER! RESPAWNED AT PLAZA"
      },
      hub: {
        options: "Options",
        controls: "Controls Guide",
        projects: "Projects",
        weather: "Weather Presets",
        about: "About",
        lblAudio: "Audio",
        lblQuality: "Quality",
        lblCamera: "Camera Mode",
        lblUnstuck: "I'm stuck!",
        btnUnstuck: "Respawn",
        lblReset: "Reset position",
        btnReset: "Reset",
        lblMode: "Drive Mode",
        btnDrive: "🎮 Manual",
        btnCruise: "✨ Cruise",
        lblFps: "FPS Indicator",
        qualityAuto: "Auto (Adaptive)",
        qualityHigh: "High",
        qualityMed: "Medium",
        qualityLow: "Battery Saver",
        toastQualityAutoDowngrade: "⚡ Auto-switched to Medium quality for smooth 60 FPS!",
        toastQualityLowDowngrade: "⚡ Auto-switched to Battery Saver mode to eliminate lag!"
      },
      pill: {
        openBtn: "View Details (ENTER) →",
        sector: "DISTRICT SECTOR"
      },
      mapModal: {
        title: "TOKYO EXP-WAY // TACTICAL GPS RADAR",
        zoomIn: "➕ ZOOM IN",
        zoomOut: "➖ ZOOM OUT",
        center: "🎯 CENTER",
        close: "✕ CLOSE",
        footer1: "💡 Click & drag to explore map &bull; Scroll to zoom",
        footer2: "⚡ Click any station to cruise directly to location"
      },
      drawer: {
        highlightsTitle: "ENGINEERING & ARCHITECTURE HIGHLIGHTS",
        repoBtn: "VIEW REPO / CODEBASE →",
        emailBtn: "SEND DIRECT EMAIL →"
      },
      projects: {
        "auto-absen": {
          title: "Auto-Absen Bot",
          district: "AKIHABARA TECH VALLEY",
          category: "Python & Automation Systems",
          tagline: "Headless Student Attendance Automation with Antidetect Selenium Engine",
          summary: "An intelligent automation system executing scheduled logins and daily attendance verifications on university portals with zero friction and high reliability.",
          features: [
            "Automated session management & cookie caching",
            "Explicit Wait pattern for resilience on slow connections",
            "Anti-bot detection flags & user-agent rotation",
            "Lightweight background execution with minimal footprint"
          ]
        },
        "music-app": {
          title: "Music Player App",
          district: "ROPPONGI AUDIO DISTRICT",
          category: "Flutter & Mobile Engineering",
          tagline: "High-Performance Cross-Platform Music Player with Clean Architecture",
          summary: "A modern mobile music player built with Feature-First Clean Architecture, dynamic waveform audio visualizers, and offline SQLite local caching.",
          features: [
            "Strict separation of Presentation, Domain, and Data layers",
            "Offline audio caching and local playlist SQLite storage",
            "Dynamic, responsive audio waveform spectrum visualization",
            "Reactive state management running at solid 60 FPS"
          ]
        },
        "open-webui": {
          title: "Open WebUI AI Extension",
          district: "OASIS AI DISTRICT",
          category: "AI & Pipeline Engineering",
          tagline: "Gemini API Gateway & Local LLM Orchestrator for Open WebUI",
          summary: "Next-gen AI integration pipeline connecting Google Gemini API models (3.6 Flash, 3.1 Pro) with Open WebUI, featuring automated database synchronization.",
          features: [
            "Dynamic runtime SQLite model sync without server restart",
            "Dual-pipeline gateway: OpenAI-compatible & Native Gemini",
            "Automated token error handling and sanitization scripts",
            "Optimized latency for multi-turn conversational agents"
          ]
        },
        "whatsapp-bot": {
          title: "WhatsApp AI Bot",
          district: "GINZA COMMERCIAL BOULEVARD",
          category: "Backend & NLP Services",
          tagline: "Automated Messaging Infrastructure with Natural Language Understanding",
          summary: "Autonomous WhatsApp bot infrastructure with integrated NLP for contextual automated customer service, workflow triggers, and 24/7 assistance.",
          features: [
            "Resilient multi-device WhatsApp connection handling",
            "Intent recognition for natural conversational auto-replies",
            "Message queuing system with rate-limit safety guards",
            "Real-time event logging and monitoring dashboard"
          ]
        },
        "ghost-solver": {
          title: "Ghost Solver Terminal",
          district: "SHINJUKU UNDERGROUND",
          category: "Systems & CLI Games",
          tagline: "Immersive Linux Terminal Simulator with Adaptive AI Puzzle Solver",
          summary: "A retro Linux terminal simulator featuring an adaptive AI puzzle-solving engine, bridging classic command-line nostalgia with modern game logic.",
          features: [
            "Unix command emulation (ls, cd, cat, grep, ssh)",
            "Procedural puzzle generation with dynamic difficulty scaling",
            "Retro phosphor green CRT scanlines visual aesthetic",
            "Ultra-lightweight execution with zero external dependencies"
          ]
        },
        "about-stelle": {
          title: "About Stelle",
          district: "SHIBUYA CROSSING // CENTRAL PLAZA",
          category: "Creative Engineer & Designer",
          tagline: "Crafting High-Performance Digital Products from Code to Experience",
          summary: "I am a Full-Stack Developer and UI/UX Designer based in Indonesia, committed to Clean Code principles, architectural modularity, and high visual craft.",
          features: [
            "Strict adherence to SOLID, Loose Coupling, and High Cohesion",
            "Comprehensive expertise across Mobile, Automation, and 3D Web",
            "User-centric design paired with maintainable codebases",
            "Open to innovative project collaborations worldwide"
          ]
        },
        "contact-stelle": {
          title: "Transmission Hub",
          district: "ODAIBA BAY TRANSMISSION",
          category: "Direct Communication Line",
          tagline: "Ready to Build Something Extraordinary Together",
          summary: "Have an innovative product idea, automation requirement, or mobile project? Reach out directly via email or social channels below.",
          features: [
            "Initial architecture & UI/UX consultation",
            "Freelance engineering & full product development",
            "Prompt response time (< 24 hours)",
            "Based in Indonesia 🇮🇩"
          ]
        },
        "flappie": {
          title: "Flappie Media Downloader",
          district: "SHIBUYA STREAM // MEDIA HUB",
          category: "Universal Media Harvester & Video Engine",
          tagline: "High-Speed All-In-One Video & Audio Downloader with Full YouTube 4K & MP3 Support",
          summary: "A next-generation all-in-one downloader app supporting instant video and audio conversion from YouTube, TikTok (watermark-free), Instagram Reels/Stories, Twitter/X, and Facebook. Powered by optimized yt-dlp and a sleek responsive UI.",
          features: [
            "Download video up to 4K 60FPS with automatic audio/video stream multiplexing",
            "High-fidelity MP3 320kbps & lossless FLAC audio extraction",
            "Automatic watermark stripping for TikTok and YouTube Shorts",
            "Multi-threaded concurrent download queue manager",
            "Integrated metadata tagging & instant playlist compilation"
          ]
        }
      }
    },
    ja: {
      hud: {
        brandSub: "首都高速道路",
        driveMode: "🎮 ドライブモード",
        cruiseMode: "✨ クルーズモード",
        openMap: "🗺️ 全体マップ",
        audioOn: "🔊 音声: ON",
        audioOff: "🔇 音声: OFF",
        reset: "↺ リセット",
        headingUp: "🧭 ヘディングアップ",
        northUp: "🧭 ノースアップ",
        controlsHint: "<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 走行 &bull; <kbd>SPACE</kbd> ドリフト &bull; <kbd>V</kbd> 視点 &bull; <kbd>M</kbd> マップ &bull; <kbd>ドラッグ</kbd> 視点移動",
        cameraView: {
          CHASE: "📷 追尾",
          HOOD: "📷 ボンネット",
          TOPDOWN: "📷 見下ろし"
        },
        respawnToast: "↺ 海に落下！スタート地点に復帰"
      },
      hub: {
        options: "設定 (Opsi)",
        controls: "操作ガイド",
        projects: "プロジェクト",
        weather: "天気・雰囲気",
        about: "開発者について",
        lblAudio: "音声",
        lblQuality: "品質",
        lblCamera: "カメラ視点",
        lblUnstuck: "動けない！",
        btnUnstuck: "リスポーン",
        lblReset: "初期化",
        btnReset: "リセット",
        lblMode: "走行モード",
        btnDrive: "🎮 手動運転",
        btnCruise: "✨ 自動クルーズ",
        lblFps: "FPS表示",
        qualityAuto: "自動 (適応型)",
        qualityHigh: "高画質",
        qualityMed: "標準",
        qualityLow: "省電力",
        toastQualityAutoDowngrade: "⚡ 60FPSを維持するため標準モードに自動最適化しました！",
        toastQualityLowDowngrade: "⚡ カクつき防止のため省電力モードに自動最適化しました！"
      },
      pill: {
        openBtn: "詳細を見る (ENTER) →",
        sector: "地区セクター"
      },
      mapModal: {
        title: "首都高速道路 // タクティカルGPSレーダー",
        zoomIn: "➕ 拡大",
        zoomOut: "➖ 縮小",
        center: "🎯 中央",
        close: "✕ 閉じる",
        footer1: "💡 マップをドラッグして移動 &bull; スクロールでズーム",
        footer2: "⚡ チェックポイントをクリックして自動走行"
      },
      drawer: {
        highlightsTitle: "エンジニアリング＆アーキテクチャの特長",
        repoBtn: "リポジトリを見る →",
        emailBtn: "直接メールを送る →"
      },
      projects: {
        "auto-absen": {
          title: "自動出席ボット",
          district: "秋葉原テックバレー",
          category: "Python ＆ 自動化システム",
          tagline: "アンチディテクトSeleniumエンジンによる学生自動出席システム",
          summary: "大学ポータルの毎日の出席確認とログインを自動化し、低遅延かつ高信頼性で実行するインテリジェント自動化システム。",
          features: [
            "自動セッション管理およびCookieキャッシュ",
            "低速接続に耐えるExplicit Waitパターン",
            "ボット検出回避フラグとユーザーエージェント循環",
            "バックグラウンドで動作する軽量ヘッドレス実行"
          ]
        },
        "music-app": {
          title: "音楽プレイヤーアプリ",
          district: "六本木オーディオ地区",
          category: "Flutter ＆ モバイル開発",
          tagline: "クリーンアーキテクチャによる高性能クロスプラットフォーム音楽アプリ",
          summary: "Feature-Firstクリーンアーキテクチャを採用し、動的な音声波形ビジュアライザーとSQLiteローカルキャッシュを備えたモバイル音楽プレイヤー。",
          features: [
            "プレゼンテーション、ドメイン、データ層の厳密な分離",
            "SQLiteによるオフライン楽曲およびプレイリスト保存",
            "動的でレスポンシブなオーディオ波形スペクトラム表示",
            "60FPSで滑らかに動作するリアクティブステート管理"
          ]
        },
        "open-webui": {
          title: "Open WebUI AI拡張機能",
          district: "オアシスAI特区",
          category: "AI ＆ パイプライン工学",
          tagline: "Open WebUI向けGemini APIゲートウェイ＆ローカルLLM統合",
          summary: "最新世代AIモデル（Gemini 3.6 Flash、Gemini 3.1 Pro）をOpen WebUIに接続し、ランタイムデータベース同期と自動サニタイズを実行するパイプライン。",
          features: [
            "サーバー再起動なしの動的SQLiteモデル同期",
            "デュアルエンジンルーティング：OpenAI互換＆ネイティブGemini",
            "自動トークンエラーハンドリングとサニタイズスクリプト",
            "マルチターン対話エージェント向けのレイテンシ最適化"
          ]
        },
        "whatsapp-bot": {
          title: "WhatsApp AIボット",
          district: "銀座商業大通り",
          category: "バックエンド ＆ NLPサービス",
          tagline: "自然言語理解（NLP）を備えた自動メッセージング基盤",
          summary: "自然言語処理（NLP）を統合し、自動カスタマーサポートやトランザクション処理を24時間年中無休で提供する自律型ボット基盤。",
          features: [
            "安定したマルチデバイス接続ハンドラー",
            "文脈に応じた自動返信のためのインテント認識",
            "レート制限ガードを備えたメッセージキューイングシステム",
            "リアルタイムのアクティビティログと監視ダッシュボード"
          ]
        },
        "ghost-solver": {
          title: "Ghost Solver ターミナル",
          district: "新宿アンダーグラウンド",
          category: "システム ＆ CLIゲーム",
          tagline: "適応型AIパズルソルバー搭載の没入型Linuxターミナルシミュレータ",
          summary: "レトロなLinuxコマンドライン環境とAIパズル解決ロジックを融合させた、没入感の高いシミュレーションアプリケーション。",
          features: [
            "基本Unixコマンドのエミュレーション（ls, cd, cat, grep, ssh）",
            "難易度が動的に変化する手続き型パズル生成",
            "レトロな緑色蛍光体CRTスキャンライン表示",
            "外部依存関係のない超軽量単一ファイル実行"
          ]
        },
        "about-stelle": {
          title: "Stelle について",
          district: "渋谷交差点 // セントラルプラザ",
          category: "クリエイティブエンジニア ＆ デザイナー",
          tagline: "コードから体験へ、最高品質のデジタルプロダクトを創造する",
          summary: "インドネシアを拠点とするフルスタック開発者兼UI/UXデザイナー。クリーンコード、モジュール構造、高水準のビジュアル表現を追求しています。",
          features: [
            "SOLID原則、疎結合、高凝集の徹底した実践",
            "モバイル、自動化バックエンド、3D WebGLにわたる総合開発力",
            "保守性とユーザー体験を両立したシステム設計",
            "世界中の革新的プロジェクトとのコラボレーションを歓迎"
          ]
        },
        "contact-stelle": {
          title: "コンタクト通信タワー",
          district: "お台場ベイ通信基地",
          category: "ダイレクト通信ライン",
          tagline: "ともに素晴らしいプロダクトを創り上げましょう",
          summary: "モバイルアプリ開発、自動化システム、インタラクティブWebに関するご相談は、メールまたは下記SNSからお気軽にお問い合わせください。",
          features: [
            "ソフトウェアアーキテクチャおよびUI/UXの初期相談",
            "フリーランス開発および受託エンジニアリング",
            "迅速な返答対応（24時間以内）",
            "インドネシア拠点 🇮🇩"
          ]
        }
      }
    }
  },
  setLanguage(langKey) {
    if (!this.translations[langKey]) return;
    this.currentLang = langKey;
    this.updateDOM();
    if (window.onLanguageChange) {
      window.onLanguageChange(langKey);
    }
    return langKey;
  },
  cycleLanguage() {
    const langs = ["id", "en", "ja"];
    const nextIdx = (langs.indexOf(this.currentLang) + 1) % langs.length;
    return this.setLanguage(langs[nextIdx]);
  },
  getText(path) {
    const keys = path.split(".");
    let current = this.translations[this.currentLang];
    for (let k of keys) {
      if (!current || current[k] === undefined) return path;
      current = current[k];
    }
    return current;
  },
  getProject(id) {
    const proj = this.translations[this.currentLang].projects[id];
    if (!proj) return window.APP_CONFIG.PROJECTS.find(p => p.id === id);
    const base = window.APP_CONFIG.PROJECTS.find(p => p.id === id) || {};
    return { ...base, ...proj };
  },
  updateDOM() {
    const t = this.translations[this.currentLang];
    const modeBtn = document.getElementById("btn-mode");
    if (modeBtn) {
      const isCruise = modeBtn.classList.contains("cruise-active");
      modeBtn.innerHTML = isCruise ? t.hud.cruiseMode : t.hud.driveMode;
    }
    const openMapBtn = document.getElementById("btn-open-map");
    if (openMapBtn) openMapBtn.innerHTML = t.hud.openMap;
    const radarModeBtn = document.getElementById("btn-radar-mode");
    if (radarModeBtn) {
      const isHeading = radarModeBtn.textContent.includes("HEADING");
      radarModeBtn.textContent = isHeading ? t.hud.headingUp : t.hud.northUp;
    }
    const controlsHint = document.querySelector(".controls-subtle-hint");
    if (controlsHint) controlsHint.innerHTML = t.hud.controlsHint;
    const pillOpenBtn = document.getElementById("pill-open-btn");
    if (pillOpenBtn) pillOpenBtn.textContent = t.pill.openBtn;
    const pillDistrict = document.getElementById("pill-district");
    if (pillDistrict && window._activeStationId) {
      const p = this.getProject(window._activeStationId);
      if (p) pillDistrict.textContent = p.district;
    }
    const camBtn = document.getElementById("btn-camera-view");
    if (camBtn && window._currentCameraMode && t.hud.cameraView) {
      camBtn.textContent = t.hud.cameraView[window._currentCameraMode] || `📷 VIEW: ${window._currentCameraMode}`;
    }
    const langBtn = document.getElementById("btn-lang");
    if (langBtn) {
      const flags = { id: "🇮🇩 ID", en: "🇬🇧 EN", ja: "🇯🇵 日本語" };
      langBtn.textContent = flags[this.currentLang] || "🌐 LANG";
    }
    if (t.hub) {
      const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el && txt) el.textContent = txt;
      };
      setTxt("lbl-opt-audio", t.hub.lblAudio);
      setTxt("lbl-opt-quality", t.hub.lblQuality);
      setTxt("lbl-opt-camera", t.hub.lblCamera);
      setTxt("lbl-opt-unstuck", t.hub.lblUnstuck);
      setTxt("opt-unstuck-btn", t.hub.btnUnstuck);
      setTxt("lbl-opt-reset", t.hub.lblReset);
      setTxt("opt-reset-btn", t.hub.btnReset);
      setTxt("lbl-opt-mode", t.hub.lblMode);
      setTxt("lbl-opt-fps", t.hub.lblFps);
      if (typeof window.updateQualityButtonLabel === "function") {
        window.updateQualityButtonLabel();
      }
      const modeToggle = document.getElementById("opt-mode-toggle");
      if (modeToggle) {
        const isCruise = modeToggle.classList.contains("cruise-active");
        modeToggle.textContent = isCruise ? t.hub.btnCruise : t.hub.btnDrive;
      }
    }
  }
};
window.I18N = I18N;