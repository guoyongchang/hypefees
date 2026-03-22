import { useState, useEffect, useCallback } from 'react';

export const LANGUAGES = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
  tr: 'Türkçe',
} as const;

export type Lang = keyof typeof LANGUAGES;
export const DEFAULT_LANG: Lang = 'en';
const LANG_EVENT = 'hypefees:lang';

// ── Helper: compact translation entry ──
type T10 = [string, string, string, string, string, string, string, string, string, string]; // en,zh,ja,ko,es,fr,de,pt,ru,tr
const LANG_ORDER: Lang[] = ['en','zh','ja','ko','es','fr','de','pt','ru','tr'];
function e(...vals: T10): Record<Lang, string> {
  const r: any = {};
  LANG_ORDER.forEach((l, i) => { r[l] = vals[i]; });
  return r;
}

// ============================================================
// ALL TRANSLATION KEYS
// ============================================================
const translations: Record<string, Record<Lang, string>> = {
  // ── Hero ──
  'hero.title.1': e('Every trade has a','每笔交易都有一笔','すべての取引には','모든 거래에는','Cada operación tiene una','Chaque trade a des','Jeder Trade hat eine','Cada trade tem uma','Каждая сделка несёт','Her işlemin bir de'),
  'hero.title.2': e('hidden fee.','隐藏费用。','隠れた手数料がある。','숨겨진 수수료가 있습니다.','comisión oculta.','frais cachés.','versteckte Gebühr.','taxa oculta.','скрытую комиссию.','gizli ücreti var.'),
  'hero.title.cta': e('Find out how much.','看看你多付了多少。','いくら取られているか確認しよう。','얼마나 내고 있는지 확인하세요.','Descubre cuánto pierdes.','Découvrez combien vous perdez.','Finde heraus, wie viel du zahlst.','Descubra quanto você paga a mais.','Узнайте, сколько вы переплачиваете.','Ne kadar fazla ödediğinizi öğrenin.'),
  'hero.subtitle': e(
    "Your wallet may be silently charging you up to 0.10% per trade. Some wallets charge nothing. Check what you're really paying.",
    '你的钱包可能在悄悄收取高达每笔 0.10% 的额外费用。有些钱包根本不收。查查你到底在付多少。',
    'あなたのウォレットは、取引ごとに最大0.10%を密かに上乗せしているかもしれません。無料のウォレットもあります。本当の支払額を確かめましょう。',
    '당신의 지갑이 매 거래마다 최대 0.10%를 몰래 빼가고 있을 수 있습니다. 전혀 안 받는 지갑도 있습니다. 실제로 얼마를 내고 있는지 확인하세요.',
    'Tu billetera puede estar cobrándote hasta 0.10% extra por operación sin que lo sepas. Algunas no cobran nada. Descubre lo que realmente pagas.',
    'Votre wallet vous prélève peut-être jusqu\'à 0.10% de plus par trade, en toute discrétion. Certains ne facturent rien. Vérifiez ce que vous payez vraiment.',
    'Dein Wallet berechnet dir möglicherweise bis zu 0,10% extra pro Trade — ohne dass du es merkst. Manche verlangen gar nichts. Prüfe, was du wirklich zahlst.',
    'Sua carteira pode estar cobrando até 0,10% a mais por trade sem você perceber. Algumas não cobram nada. Descubra quanto você realmente paga.',
    'Ваш кошелёк может тихо снимать до 0,10% с каждой сделки. Некоторые не берут ничего. Проверьте, сколько вы на самом деле платите.',
    "Cüzdanınız her işlemde fark ettirmeden %0,10'a kadar ekstra ücret alıyor olabilir. Bazı cüzdanlar hiç almaz. Gerçekte ne kadar ödediğinizi öğrenin.",
  ),
  'hero.input.placeholder': e('Enter your ETH address (0x...)','输入你的 ETH 地址 (0x...)','ETHアドレスを入力 (0x...)','ETH 주소 입력 (0x...)','Ingresa tu dirección ETH (0x...)','Entrez votre adresse ETH (0x...)','ETH-Adresse eingeben (0x...)','Insira seu endereço ETH (0x...)','Введите ваш ETH-адрес (0x...)','ETH adresinizi girin (0x...)'),
  'hero.btn.lookup': e('Check My Fees','查看我的费用','手数料をチェック','내 수수료 확인','Ver Mis Comisiones','Vérifier Mes Frais','Meine Gebühren Prüfen','Verificar Minhas Taxas','Проверить Мои Комиссии','Ücretlerimi Kontrol Et'),
  'hero.btn.loading': e('Loading...','加载中...','読み込み中...','로딩 중...','Cargando...','Chargement...','Laden...','Carregando...','Загрузка...','Yükleniyor...'),
  'hero.connectWallet': e('Connect Wallet','连接钱包','ウォレット接続','지갑 연결','Conectar Billetera','Connecter Wallet','Wallet Verbinden','Conectar Carteira','Подключить Кошелёк','Cüzdan Bağla'),
  'hero.safetyNote': e('Read-only — we only check your public address. No transactions, no approvals, 100% safe.','只读模式 — 仅查询你的公开地址。不发起交易、不需要授权，100% 安全。','読み取り専用 — 公開アドレスの確認のみ。取引なし、承認なし、100%安全。','읽기 전용 — 공개 주소만 확인합니다. 거래 없음, 승인 없음, 100% 안전.','Solo lectura — solo verificamos tu dirección pública. Sin transacciones, sin aprobaciones, 100% seguro.','Lecture seule — nous vérifions uniquement votre adresse publique. Aucune transaction, aucune approbation, 100% sûr.','Nur Lesen — wir prüfen nur Ihre öffentliche Adresse. Keine Transaktionen, keine Genehmigungen, 100% sicher.','Somente leitura — verificamos apenas seu endereço público. Sem transações, sem aprovações, 100% seguro.','Только чтение — проверяем только ваш публичный адрес. Без транзакций, без одобрений, 100% безопасно.','Salt okunur — yalnızca genel adresinizi kontrol ederiz. İşlem yok, onay yok, %100 güvenli.'),
  'wallet.title': e('Connect Wallet','连接钱包','ウォレット接続','지갑 연결','Conectar Billetera','Connecter Wallet','Wallet Verbinden','Conectar Carteira','Подключить Кошелёк','Cüzdan Bağla'),
  'wallet.mobileDesc': e('Open this page in your wallet app to connect. Tap a wallet below to open it.','在你的钱包应用中打开此页面即可连接。点击下方钱包直接跳转。','ウォレットアプリでこのページを開いて接続します。下のウォレットをタップして開きましょう。','지갑 앱에서 이 페이지를 열어 연결하세요. 아래 지갑을 탭하면 바로 이동합니다.','Abre esta página en tu app de billetera. Toca una billetera abajo para abrirla.','Ouvrez cette page dans votre wallet. Appuyez ci-dessous pour l\'ouvrir.','Öffne diese Seite in deiner Wallet-App. Tippe unten auf ein Wallet.','Abra esta página no app da carteira. Toque em uma carteira abaixo.','Откройте эту страницу в приложении кошелька. Нажмите на кошелёк ниже.','Bu sayfayı cüzdan uygulamanızda açın. Açmak için aşağıdaki cüzdana dokunun.'),
  'wallet.desktopDesc': e('Connect your browser wallet or scan QR code with a mobile wallet.','连接你的浏览器钱包，或使用手机钱包扫描二维码。','ブラウザウォレットを接続するか、モバイルウォレットでQRコードをスキャン。','브라우저 지갑을 연결하거나 모바일 지갑으로 QR 코드를 스캔하세요.','Conecta tu billetera del navegador o escanea el QR con una billetera móvil.','Connectez votre wallet navigateur ou scannez le QR avec un wallet mobile.','Verbinde dein Browser-Wallet oder scanne den QR-Code mit einem mobilen Wallet.','Conecte sua carteira do navegador ou escaneie o QR com uma carteira móvel.','Подключите браузерный кошелёк или отсканируйте QR мобильным кошельком.','Tarayıcı cüzdanınızı bağlayın veya mobil cüzdanla QR kodu tarayın.'),
  'wallet.openInApp': e('Open in app','在应用中打开','アプリで開く','앱에서 열기','Abrir en app','Ouvrir dans l\'app','In App öffnen','Abrir no app','Открыть в приложении','Uygulamada aç'),
  'wallet.connectNow': e('Connect','连接','接続','연결','Conectar','Connecter','Verbinden','Conectar','Подключить','Bağla'),
  'wallet.install': e('Install','安装','インストール','설치','Instalar','Installer','Installieren','Instalar','Установить','Yükle'),
  'wallet.desktopOnly': e('Desktop only','仅桌面版','デスクトップのみ','데스크톱 전용','Solo escritorio','Bureau uniquement','Nur Desktop','Somente desktop','Только десктоп','Yalnızca masaüstü'),
  'wallet.scanQR': e('Scan with WalletConnect','使用 WalletConnect 扫码','WalletConnect でスキャン','WalletConnect로 스캔','Escanear con WalletConnect','Scanner avec WalletConnect','Mit WalletConnect scannen','Escanear com WalletConnect','Сканировать через WalletConnect','WalletConnect ile tara'),
  'wallet.connecting': e('Connecting…','连接中…','接続中…','연결 중…','Conectando…','Connexion…','Verbinden…','Conectando…','Подключение…','Bağlanıyor…'),
  'wallet.rejected': e('Connection rejected by wallet','钱包拒绝了连接请求','ウォレットが接続を拒否しました','지갑이 연결을 거부했습니다','Conexión rechazada','Connexion refusée','Verbindung abgelehnt','Conexão recusada','Кошелёк отклонил запрос','Cüzdan bağlantıyı reddetti'),
  'wallet.connectFailed': e('Connection failed. Please try again.','连接失败，请重试','接続に失敗しました。再試行してください','연결 실패. 다시 시도해주세요','Fallo de conexión. Inténtalo de nuevo.','Échec de connexion. Réessayez.','Verbindung fehlgeschlagen. Bitte erneut versuchen.','Falha na conexão. Tente novamente.','Не удалось подключиться. Повторите попытку.','Bağlantı başarısız. Tekrar deneyin.'),

  // ── Results ──
  'result.totalVolume': e('Total Volume','总交易量','総取引量','총 거래량','Volumen Total','Volume Total','Gesamtvolumen','Volume Total','Общий Объём','Toplam Hacim'),
  'result.totalFees': e('Total Fees','总费用','総手数料','총 수수료','Comisiones Totales','Frais Totaux','Gesamtgebühren','Taxas Totais','Всего Комиссий','Toplam Ücret'),
  'result.exchangeFees': e('Exchange Fees','交易所费用','取引所手数料','거래소 수수료','Comisión Exchange','Frais d\'Exchange','Börsengebühren','Taxas da Exchange','Комиссия Биржи','Borsa Ücreti'),
  'result.builderFees': e('Builder Fees','Builder 费用','ビルダー手数料','빌더 수수료','Comisión Builder','Frais Builder','Builder-Gebühren','Taxa Builder','Комиссия Билдера','Builder Ücreti'),
  'result.trades': e('trades','笔交易','取引','건','operaciones','trades','Trades','trades','сделок','işlem'),
  'result.toHyperliquid': e('To Hyperliquid','支付给 Hyperliquid','Hyperliquidへ','Hyperliquid에','A Hyperliquid','À Hyperliquid','An Hyperliquid','Para Hyperliquid','Для Hyperliquid','Hyperliquid\'e'),
  'result.noBuilderFee': e('No builder fee paid','无 Builder 费用','ビルダー手数料なし','빌더 수수료 없음','Sin comisión builder','Pas de frais builder','Keine Builder-Gebühr','Sem taxa builder','Без комиссии билдера','Builder ücreti yok'),
  'result.ofTotalFees': e('of total fees','占总费用','総手数料の','총 수수료의','de comisiones totales','des frais totaux','der Gesamtgebühren','das taxas totais','от общей комиссии','toplam ücretin'),
  'result.feeBreakdown': e('Fee Breakdown','费用明细','手数料内訳','수수료 내역','Desglose','Détail','Aufschlüsselung','Detalhamento','Разбивка','Ücret Dağılımı'),
  'result.exchange': e('Exchange','交易所','取引所','거래소','Exchange','Exchange','Börse','Exchange','Биржа','Borsa'),
  'result.builder': e('Builder','Builder','ビルダー','빌더','Builder','Builder','Builder','Builder','Билдер','Builder'),
  'result.saveBanner': e('You overpaid {amount} — switch to 0% and keep it next time','你多付了 {amount} — 切换到 0% 费率，下次全省下来','あなたは {amount} 余分に払いました — 0% に切り替えて次から節約','이미 {amount}을 초과 지불했습니다 — 0%로 전환해서 다음부터 아끼세요','Pagaste {amount} de más — cambia a 0% y ahorra en la próxima','Vous avez payé {amount} de trop — passez à 0% et gardez tout la prochaine fois','Du hast {amount} zu viel gezahlt — wechsle zu 0% und spar dir das nächstes Mal','Você pagou {amount} a mais — mude para 0% e economize da próxima vez','Вы переплатили {amount} — переключитесь на 0% и сохраните эти деньги','Fazladan {amount} ödediniz — %0\'a geçin, bir dahaki sefere cebinizde kalsın'),
  'result.saveBannerSub': e('One free signature. No gas. Instant savings on every future trade.','一次免费签名，无需 gas。此后每笔交易自动省钱。','無料の署名1つでOK。ガス代なし。今後のすべての取引で即座に節約。','서명 한 번이면 끝. 가스비 없음. 앞으로 모든 거래에서 바로 절약.','Una firma gratis. Sin gas. Ahorro inmediato en cada operación futura.','Une simple signature gratuite. Sans gas. Des économies immédiates sur chaque trade.','Eine kostenlose Signatur. Kein Gas. Sofortige Ersparnis bei jedem Trade.','Uma assinatura gratuita. Sem gas. Economia imediata em todas as próximas trades.','Одна бесплатная подпись. Без газа. Мгновенная экономия на каждой будущей сделке.','Ücretsiz bir imza yeterli. Gas yok. Bundan sonraki her işlemde anında tasarruf.'),
  'result.alreadyZero': e("Nice — you're already paying $0 in builder fees. Smart move.",'很好 — 你的 Builder 费用已经是 $0 了。明智的选择！','すばらしい — ビルダー手数料はすでに $0 です。賢い選択ですね。','잘하셨어요 — 빌더 수수료를 이미 $0으로 쓰고 계시네요. 현명한 선택!','Perfecto — ya pagas $0 en comisiones builder. Buena jugada.','Bravo — vous payez déjà 0 $ de frais builder. Bien joué !','Top — du zahlst bereits $0 Builder-Gebühren. Clever!','Parabéns — você já paga $0 em taxas builder. Boa escolha!','Отлично — вы уже платите $0 комиссий билдера. Грамотный ход!','Harika — zaten $0 builder ücreti ödüyorsunuz. Akıllı tercih!'),
  'result.noHistory': e('No trading history found for this address on Hyperliquid','该地址在 Hyperliquid 上没有交易记录','このアドレスのHyperliquidでの取引履歴が見つかりません','이 주소의 Hyperliquid 거래 내역이 없습니다','No se encontró historial para esta dirección en Hyperliquid','Aucun historique trouvé pour cette adresse sur Hyperliquid','Keine Handelshistorie für diese Adresse auf Hyperliquid gefunden','Nenhum histórico encontrado para este endereço na Hyperliquid','История торговли не найдена для этого адреса на Hyperliquid','Bu adres için Hyperliquid\'de işlem geçmişi bulunamadı'),
  'result.invalidAddress': e('Please enter a valid Ethereum address (0x...)','请输入有效的以太坊地址 (0x...)','有効なイーサリアムアドレスを入力してください (0x...)','유효한 이더리움 주소를 입력하세요 (0x...)','Ingrese una dirección Ethereum válida (0x...)','Veuillez entrer une adresse Ethereum valide (0x...)','Bitte eine gültige Ethereum-Adresse eingeben (0x...)','Insira um endereço Ethereum válido (0x...)','Введите корректный Ethereum-адрес (0x...)','Geçerli bir Ethereum adresi girin (0x...)'),

  // ── Fee Simulator ──
  'sim.volume': e('Simulated Trading Volume','模拟交易量','シミュレーション取引量','시뮬레이션 거래량','Volumen Simulado','Volume Simulé','Simuliertes Volumen','Volume Simulado','Моделируемый Объём','Simüle Hacim'),
  'sim.directHL': e('Direct HL','直连 HL','直接 HL','직접 HL','Directo HL','Direct HL','Direkt HL','Direto HL','Прямой HL','Doğrudan HL'),
  'sim.baseline': e('Baseline','基准','基準','기준','Base','Base','Basis','Base','Базис','Taban'),
  'sim.best': e('Best','最优','最良','최적','Mejor','Meilleur','Beste','Melhor','Лучший','En İyi'),

  // ── Builder Table ──
  'table.topWallets': e('Top Wallets','精选钱包','おすすめウォレット','추천 지갑','Top Billeteras','Meilleurs Wallets','Top Wallets','Top Carteiras','Лучшие Кошельки','En İyi Cüzdanlar'),
  'table.allBuilders': e('All Builders','所有 Builders','すべてのビルダー','모든 빌더','Todos los Builders','Tous les Builders','Alle Builder','Todos os Builders','Все Билдеры','Tüm Builderlar'),
  'table.builder': e('Builder','Builder','ビルダー','빌더','Builder','Builder','Builder','Builder','Билдер','Builder'),
  'table.builderFee': e('Builder Fee','Builder 费率','ビルダー手数料','빌더 수수료','Comisión','Frais Builder','Gebühr','Taxa','Комиссия','Ücret'),
  'table.effTaker': e('Eff. Taker','有效 Taker','実効テイカー','유효 테이커','Taker Efect.','Taker Eff.','Eff. Taker','Taker Efet.','Эфф. Тейкер','Efk. Taker'),
  'table.platforms': e('Platforms','平台','プラットフォーム','플랫폼','Plataformas','Plateformes','Plattformen','Plataformas','Платформы','Platformlar'),
  'table.hardware': e('Hardware','硬件钱包','ハードウェア','하드웨어','Hardware','Hardware','Hardware','Hardware','Оборудование','Donanım'),
  'table.users': e('Users','用户','ユーザー','사용자','Usuarios','Utilisateurs','Benutzer','Usuários','Пользователи','Kullanıcılar'),
  'table.volume': e('Volume','交易量','取引量','거래량','Volumen','Volume','Volumen','Volume','Объём','Hacim'),
  'table.best': e('Best','最优','最良','최적','Mejor','Meilleur','Beste','Melhor','Лучший','En İyi'),
  'table.free': e('FREE','免费','無料','무료','GRATIS','GRATUIT','KOSTENLOS','GRÁTIS','БЕСПЛАТНО','ÜCRETSİZ'),
  'table.wallet': e('Wallet','钱包','ウォレット','지갑','Billetera','Wallet','Wallet','Carteira','Кошелёк','Cüzdan'),
  'table.terminal': e('Terminal','终端','ターミナル','터미널','Terminal','Terminal','Terminal','Terminal','Терминал','Terminal'),
  'table.platform': e('Platform','平台','プラットフォーム','플랫폼','Plataforma','Plateforme','Plattform','Plataforma','Платформа','Platform'),
  'table.frontend': e('Frontend','前端','フロントエンド','프론트엔드','Frontend','Frontend','Frontend','Frontend','Фронтенд','Ön Yüz'),
  'table.bot': e('Bot','机器人','ボット','봇','Bot','Bot','Bot','Bot','Бот','Bot'),
  'table.ownHW': e('Own HW','自研硬件','自社HW','자체 HW','HW Propio','HW Propre','Eigene HW','HW Próprio','Собств. HW','Kendi HW'),
  'table.supports': e('Supports','支持','サポート','지원','Soporta','Supporte','Unterstützt','Suporta','Поддержка','Destekler'),
  'table.showing': e('Showing {n} top wallets and frontends. Switch to "All Builders" to see all {total}.','正在显示 {n} 个精选钱包。切换到"所有 Builders"查看全部 {total} 个。','上位 {n} のウォレットとフロントエンドを表示中。「すべてのビルダー」に切り替えると全 {total} を表示。','{n}개의 추천 지갑 표시 중. "모든 빌더"로 전환하면 전체 {total}개를 볼 수 있습니다.','Mostrando {n} billeteras principales. Cambia a "Todos" para ver los {total}.','Affichage de {n} wallets. Passez à "Tous" pour voir les {total}.','Zeige {n} Top-Wallets. Wechsle zu "Alle" um alle {total} zu sehen.','{n} carteiras exibidas. Mude para "Todos" para ver todos os {total}.','Показано {n} лучших кошельков. Переключитесь на "Все" для просмотра {total}.','En iyi {n} cüzdan gösteriliyor. Tümünü görmek için "Tüm Builderlar"a geçin ({total}).'),
  'table.trackingInfo': e('{n} builders tracked. Data from HyperTracker.','{n} 个 Builder 实时追踪中。数据来自 HyperTracker。','{n} ビルダーを追跡中。データ出典：HyperTracker。','{n}개 빌더 추적 중. 데이터 출처: HyperTracker.','{n} builders rastreados. Datos de HyperTracker.','{n} builders suivis. Données de HyperTracker.','{n} Builder verfolgt. Daten von HyperTracker.','{n} builders monitorados. Dados do HyperTracker.','Отслеживается {n} билдеров. Данные из HyperTracker.','{n} builder izleniyor. Veriler HyperTracker\'dan.'),
  'table.failedToLoad': e('Failed to load:','加载失败：','読み込み失敗：','로드 실패:','Error al cargar:','Échec du chargement :','Laden fehlgeschlagen:','Falha ao carregar:','Ошибка загрузки:','Yükleme hatası:'),
  'table.search': e('Search wallets...','搜索钱包...','ウォレットを検索...','지갑 검색...','Buscar billeteras...','Rechercher un wallet...','Wallets suchen...','Buscar carteiras...','Поиск кошельков...','Cüzdan ara...'),
  'table.noResults': e('No wallets found matching "{q}"','没有找到匹配"{q}"的钱包','「{q}」に一致するウォレットが見つかりません','"{q}"와 일치하는 지갑이 없습니다','No se encontraron billeteras para "{q}"','Aucun wallet trouvé pour « {q} »','Keine Wallets gefunden für „{q}"','Nenhuma carteira encontrada para "{q}"','Кошельки не найдены для «{q}»','"{q}" için cüzdan bulunamadı'),
  'table.iOSApp': e('iOS App','iOS 应用','iOSアプリ','iOS 앱','App iOS','App iOS','iOS App','App iOS','iOS App','iOS Uygulama'),
  'table.androidApp': e('Android App','Android 应用','Androidアプリ','Android 앱','App Android','App Android','Android App','App Android','Android App','Android Uygulama'),
  'table.desktopApp': e('Desktop App','桌面应用','デスクトップアプリ','데스크톱 앱','App Escritorio','App Bureau','Desktop App','App Desktop','Desktop App','Masaüstü Uygulama'),
  'table.browserExt': e('Browser Extension','浏览器扩展','ブラウザ拡張','브라우저 확장','Extensión','Extension','Erweiterung','Extensão','Расширение','Tarayıcı Eklentisi'),
  'table.webApp': e('Web App','网页应用','Webアプリ','웹 앱','App Web','App Web','Web App','App Web','Веб-приложение','Web Uygulama'),

  // ── Switch Builder ──
  'switch.title': e('Stop overpaying. Switch to 0% now.','别再多花冤枉钱了。现在就切换到 0%。','無駄な手数料とはお別れ。今すぐ0%に切り替えよう。','더 이상 손해 보지 마세요. 지금 0%로 전환하세요.','Deja de pagar de más. Cambia a 0% ahora.','Arrêtez de surpayer. Passez à 0% maintenant.','Schluss mit Überzahlung. Jetzt auf 0% wechseln.','Pare de pagar a mais. Mude para 0% agora.','Хватит переплачивать. Переключитесь на 0% прямо сейчас.','Fazla ödemeyi bırakın. Şimdi %0\'a geçin.'),
  'switch.subtitle': e("At 0.10%, you're losing $1,000 for every $1M traded. One signature fixes that — no gas, no transfers.",'按 0.10% 费率，每交易 $1M 你就白白损失 $1,000。一次签名就能解决 — 无需 gas，无需转账。','0.10%のままだと、取引100万ドルごとに1,000ドルの損失。署名1つで解決 — ガス代なし、送金なし。','0.10%면 $1M 거래할 때마다 $1,000를 그냥 잃는 셈입니다. 서명 한 번이면 해결 — 가스비 없음, 이체 없음.','Con 0.10%, pierdes $1,000 por cada $1M operado. Una firma lo soluciona — sin gas, sin transferencias.','À 0.10%, vous perdez 1 000 $ par million tradé. Une signature suffit — sans gas, sans transfert.','Bei 0,10% verlierst du 1.000 $ pro 1M$ Handelsvolumen. Eine Signatur genügt — kein Gas, keine Transfers.','A 0,10%, você perde $1.000 a cada $1M negociado. Uma assinatura resolve — sem gas, sem transferências.','При 0,10% вы теряете $1 000 на каждый $1M объёма. Одна подпись всё исправит — без газа, без переводов.','%0,10 ile her 1M$ işlem hacminde 1.000$ kaybediyorsunuz. Tek bir imza bunu çözer — gas yok, transfer yok.'),
  'switch.connectWallet': e('Connect Wallet','连接钱包','ウォレット接続','지갑 연결','Conectar Billetera','Connecter Wallet','Wallet Verbinden','Conectar Carteira','Подключить Кошелёк','Cüzdan Bağla'),
  'switch.approve': e('Remove builder fees → save on every trade','取消 Builder 费用 → 每笔交易都省钱','ビルダー手数料を撤廃 → 毎回の取引で節約','빌더 수수료 제거 → 매 거래마다 절약','Eliminar comisiones → ahorra en cada operación','Supprimer les frais → économisez sur chaque trade','Builder-Gebühren entfernen → bei jedem Trade sparen','Remover taxas → economize em cada operação','Убрать комиссию → экономьте на каждой сделке','Ücretleri kaldır → her işlemde tasarruf et'),
  'switch.approveDesc': e('Switch to 0% builder fee. No more hidden charges.','切换到 0% Builder 费率，不再有隐藏收费。','0%ビルダー手数料に切替。隠れた課金はもうなし。','0% 빌더 수수료로 전환. 숨은 수수료 없음.','Cambia a 0% de comisión. Sin cargos ocultos.','Passez à 0% de frais. Plus de charges cachées.','Wechsle zu 0% Gebühr. Keine versteckten Kosten.','Mude para 0% de taxa. Sem cobranças ocultas.','Переключитесь на 0%. Без скрытых комиссий.','%0 ücrete geçin. Gizli masraf yok.'),
  'switch.referral': e('Unlock 4% fee discount — free, instant','解锁手续费 4% 折扣 — 免费，立即生效','手数料4%割引を解除 — 無料、即時適用','수수료 4% 할인 잠금 해제 — 무료, 즉시 적용','Desbloquea 4% descuento — gratis e instantáneo','Débloquez 4% de remise — gratuit et instantané','4% Rabatt freischalten — kostenlos, sofort','Desbloqueie 4% de desconto — grátis e instantâneo','Разблокируйте скидку 4% — бесплатно, мгновенно','%4 indirim kilidini aç — ücretsiz, anında'),
  'switch.referralDesc': e("Binds a referral code for 4% off exchange fees. If you don't bind anyone's code, you pay full price.",'绑定推荐码即可享受手续费 4% 折扣。不绑定任何推荐码的话，你只能支付全价。','紹介コードを紐付けて取引手数料4%オフ。誰のコードも紐付けないと、定価支払いになります。','추천 코드를 연결하면 거래 수수료 4% 할인. 아무 코드도 연결하지 않으면 정가를 지불하게 됩니다.','Vincula un código de referido para 4% de descuento. Sin código, pagas precio completo.','Liez un code parrainage pour 4% de réduction. Sans code, vous payez plein tarif.','Verknüpfe einen Empfehlungscode für 4% Rabatt. Ohne Code zahlst du den vollen Preis.','Vincule um código de referência para 4% de desconto. Sem código, você paga o preço cheio.','Привяжите реферальный код для скидки 4%. Без кода вы платите полную комиссию.','4% indirim için referans kodu bağlayın. Kod bağlamazsanız tam fiyat ödersiniz.'),
  'switch.waitingSignature': e('Waiting for signature...','等待签名...','署名待ち...','서명 대기 중...','Esperando firma...','En attente de signature...','Warte auf Signatur...','Aguardando assinatura...','Ожидание подписи...','İmza bekleniyor...'),
  'switch.settingReferral': e('Setting referral...','设置推荐码...','紹介コード設定中...','추천 코드 설정 중...','Configurando referido...','Configuration parrainage...','Empfehlung einrichten...','Configurando referência...','Установка реферала...','Referans ayarlanıyor...'),
  'switch.switchBtn': e('Switch Now — Free','立即切换 — 免费','今すぐ切り替え — 無料','지금 전환 — 무료','Cambiar Ahora — Gratis','Changer Maintenant — Gratuit','Jetzt Wechseln — Kostenlos','Mudar Agora — Grátis','Переключить — Бесплатно','Şimdi Geç — Ücretsiz'),
  'switch.twoSignatures': e('Two signatures required — no gas fees, no funds transferred.','需要两次签名 — 无 gas 费用，无资金转移。','2つの署名が必要 — ガス代なし、資金移動なし。','서명 2회 필요 — 가스비 없음, 자금 이동 없음.','Dos firmas — sin gas, sin transferencias.','Deux signatures — sans gas, sans transfert.','Zwei Signaturen — keine Gasgebühren, keine Transfers.','Duas assinaturas — sem gas, sem transferências.','Две подписи — без газа, без переводов.','İki imza gerekli — gas ücreti yok, fon transferi yok.'),
  'switch.success': e("Done! 0% builder fees from now on.",'搞定！从现在起 Builder 费用为 0%。','完了！これからビルダー手数料は0%です。','완료! 이제부터 빌더 수수료 0%입니다.','¡Listo! 0% de comisión desde ahora.','C\'est fait ! 0% de frais dès maintenant.','Fertig! Ab jetzt 0% Builder-Gebühren.','Pronto! 0% de taxa builder a partir de agora.','Готово! 0% комиссии билдера с этого момента.','Tamam! Artık builder ücreti %0.'),
  'switch.approvalConfirmed': e('Builder approval confirmed','Builder 授权已确认','ビルダー承認完了','빌더 승인 완료','Aprobación confirmada','Approbation confirmée','Genehmigung bestätigt','Aprovação confirmada','Одобрение подтверждено','Builder onayı alındı'),
  'switch.referralApplied': e(' and referral code applied',' 并已应用推荐码','、紹介コード適用済み',' 및 추천 코드 적용됨',' y código de referido aplicado',' et code de parrainage appliqué',' und Empfehlungscode angewendet',' e código de referência aplicado',' и реферальный код применён',' ve referans kodu uygulandı'),
  'switch.futureTradesSub': e('Every future trade saves you money. No action needed.','每笔未来交易都在帮你省钱，无需任何操作。','今後のすべての取引で自動的に節約。操作は不要です。','앞으로 매 거래마다 자동으로 절약됩니다. 추가 조치 불필요.','Cada operación futura te ahorra dinero. Sin más pasos.','Chaque trade futur vous fait économiser. Rien d\'autre à faire.','Jeder zukünftige Trade spart dir Geld. Kein weiterer Schritt nötig.','Cada trade futuro economiza dinheiro automaticamente. Nada mais a fazer.','Каждая будущая сделка экономит ваши деньги. Больше ничего делать не нужно.','Bundan sonraki her işlemde tasarruf edeceksiniz. Başka bir şey yapmanıza gerek yok.'),
  'switch.disconnect': e('Disconnect wallet','断开钱包','ウォレットを切断','지갑 연결 해제','Desconectar billetera','Déconnecter le wallet','Wallet trennen','Desconectar carteira','Отключить кошелёк','Cüzdanı ayır'),
  'switch.errDeposit': e('You need an active Hyperliquid account first. Deposit any amount on Hyperliquid, then come back to switch.','你需要先有一个激活的 Hyperliquid 账户。请先在 Hyperliquid 上存入任意金额，然后回来切换。','先にHyperliquidアカウントが必要です。Hyperliquidで入金してから戻ってきてください。','먼저 Hyperliquid 계정이 필요합니다. Hyperliquid에 입금 후 돌아와서 전환하세요.','Necesitas una cuenta activa en Hyperliquid. Deposita cualquier cantidad y vuelve para cambiar.','Vous devez d\'abord avoir un compte Hyperliquid actif. Déposez un montant, puis revenez.','Sie benötigen ein aktives Hyperliquid-Konto. Zahlen Sie einen Betrag ein und kommen Sie zurück.','Você precisa de uma conta ativa na Hyperliquid. Deposite qualquer valor e volte para trocar.','Сначала нужен активный аккаунт Hyperliquid. Внесите депозит, затем вернитесь.','Önce aktif bir Hyperliquid hesabına ihtiyacınız var. Herhangi bir miktar yatırın ve geri dönün.'),
  'switch.errAlreadySet': e('This builder is already approved for your account. You\'re good to go!','该 Builder 已经在你的账户上授权过了。一切就绪！','このビルダーはすでにあなたのアカウントで承認済みです。準備完了！','이 빌더는 이미 계정에 승인되어 있습니다. 준비 완료!','Este builder ya está aprobado en tu cuenta. ¡Todo listo!','Ce builder est déjà approuvé sur votre compte. C\'est bon !','Dieser Builder ist bereits genehmigt. Alles bereit!','Este builder já está aprovado na sua conta. Tudo pronto!','Этот билдер уже одобрен для вашего аккаунта. Всё готово!','Bu builder zaten hesabınızda onaylı. Hazırsınız!'),
  'switch.goToHL': e('Go to Hyperliquid','前往 Hyperliquid','Hyperliquidへ','Hyperliquid 이동','Ir a Hyperliquid','Aller sur Hyperliquid','Zu Hyperliquid','Ir para Hyperliquid','Перейти в Hyperliquid','Hyperliquid\'e Git'),

  // ── Fee Counter ──
  'counter.avoidableFees': e('wasted on builder fees','白白浪费在 Builder 费用上','ビルダー手数料に浪費','빌더 수수료로 낭비','desperdiciado en comisiones builder','gaspillé en frais builder','an Builder-Gebühren verschwendet','desperdiçado em taxas builder','потрачено впустую на комиссии','builder ücretlerine boşa harcandı'),

  // ── Section Headings ──
  'section.whatAre': e('Are You Paying Hidden Fees?','你在支付隐藏费用吗？','隠れた手数料を払っていませんか？','숨겨진 수수료를 내고 있진 않나요?','¿Estás pagando comisiones ocultas?','Payez-vous des frais cachés ?','Zahlst du versteckte Gebühren?','Você está pagando taxas ocultas?','Вы платите скрытые комиссии?','Gizli ücretler mi ödüyorsunuz?'),
  'section.comparison': e('Compare Every Wallet','所有钱包费率一目了然','すべてのウォレットを比較','모든 지갑 비교','Compara todas las billeteras','Comparez tous les wallets','Alle Wallets vergleichen','Compare todas as carteiras','Сравните все кошельки','Tüm cüzdanları karşılaştırın'),
  'section.calculator': e('Calculate Your Savings','算算你能省多少','あなたの節約額を計算','절약 금액 계산하기','Calcula tu ahorro','Calculez vos économies','Berechne deine Ersparnis','Calcule sua economia','Рассчитайте вашу экономию','Tasarrufunuzu hesaplayın'),
  'section.howItWorks': e('How It Works','工作原理','仕組み','작동 방식','Cómo Funciona','Comment ça Marche','So funktioniert\'s','Como Funciona','Как Это Работает','Nasıl Çalışır'),
  'section.faq': e('Common Questions','常见问题','よくある質問','자주 묻는 질문','Preguntas Frecuentes','Questions Courantes','Häufige Fragen','Perguntas Frequentes','Частые Вопросы','Sık Sorulan Sorular'),

  // ── About Section paragraphs ──
  'about.p1': e(
    'Every time you trade on Hyperliquid through a third-party wallet like Phantom, MetaMask, or Rabby, you\'re being charged an extra <b>builder fee</b> — on top of the exchange\'s base fees (0.035% taker / 0.01% maker at VIP 0). Most traders don\'t even notice it.',
    '每次通过 Phantom、MetaMask 或 Rabby 等第三方钱包在 Hyperliquid 上交易时，你都在被额外收取一笔 <b>Builder 费用</b> — 这是在交易所基础费率（VIP 0 时 Taker 0.035% / Maker 0.01%）之上的隐藏成本。大多数交易者根本没有察觉。',
    'Phantom、MetaMask、Rabbyなどのサードパーティウォレットを使ってHyperliquidで取引するたびに、取引所の基本手数料（VIP 0でテイカー0.035%/メイカー0.01%）に加えて<b>ビルダー手数料</b>が上乗せされています。ほとんどのトレーダーはこれに気づいていません。',
    'Phantom, MetaMask, Rabby 같은 서드파티 지갑으로 Hyperliquid에서 거래할 때마다, 거래소 기본 수수료(VIP 0 기준 Taker 0.035% / Maker 0.01%) 위에 <b>빌더 수수료</b>가 추가로 부과됩니다. 대부분의 트레이더는 이를 인지하지 못합니다.',
    'Cada vez que operas en Hyperliquid con billeteras como Phantom, MetaMask o Rabby, te cobran una <b>comisión de builder</b> extra — además de las comisiones base del exchange (0.035% taker / 0.01% maker en VIP 0). La mayoría de los traders ni se enteran.',
    'Chaque fois que vous tradez sur Hyperliquid via un wallet comme Phantom, MetaMask ou Rabby, on vous prélève des <b>frais de builder</b> supplémentaires — en plus des frais de base (0.035% taker / 0.01% maker au VIP 0). La plupart des traders ne s\'en rendent même pas compte.',
    'Jedes Mal, wenn du über ein Drittanbieter-Wallet wie Phantom, MetaMask oder Rabby auf Hyperliquid tradest, zahlst du eine versteckte <b>Builder-Gebühr</b> — zusätzlich zu den Basis-Börsengebühren (0,035% Taker / 0,01% Maker bei VIP 0). Die meisten Trader merken es nicht einmal.',
    'Toda vez que você negocia na Hyperliquid usando carteiras como Phantom, MetaMask ou Rabby, uma <b>taxa de builder</b> extra é cobrada — além das taxas base da exchange (0,035% taker / 0,01% maker no VIP 0). A maioria dos traders nem percebe.',
    'Каждый раз, когда вы торгуете на Hyperliquid через сторонний кошелёк вроде Phantom, MetaMask или Rabby, с вас берут дополнительную <b>комиссию билдера</b> — сверх базовой комиссии биржи (0,035% тейкер / 0,01% мейкер на VIP 0). Большинство трейдеров этого даже не замечают.',
    'Phantom, MetaMask veya Rabby gibi üçüncü taraf cüzdanlarla Hyperliquid\'de her işlem yaptığınızda, borsanın temel ücretlerine (VIP 0\'da %0,035 taker / %0,01 maker) ek olarak gizli bir <b>builder ücreti</b> ödüyorsunuz. Çoğu trader bunun farkında bile değil.',
  ),
  'about.p2': e(
    'Builder fees range from <b>0% to 0.10%</b>. That might sound small, but at $1M in monthly volume, 0.10% means <b>$1,000 extra</b> going straight to the wallet provider — not to Hyperliquid, not to you.',
    'Builder 费率范围为 <b>0% 到 0.10%</b>。听起来不多，但每月交易 $1M 的话，0.10% 就意味着有 <b>$1,000</b> 直接流进了钱包商的口袋 — 不是 Hyperliquid 的，更不是你的。',
    'ビルダー手数料は<b>0%～0.10%</b>。小さく聞こえますが、月間100万ドルの取引量だと0.10%は<b>$1,000の追加出費</b>。ウォレットプロバイダーの懐に入るだけで、Hyperliquidにもあなたにも戻りません。',
    '빌더 수수료는 <b>0%에서 0.10%</b> 사이입니다. 적어 보이지만, 월 $1M 거래 시 0.10%는 <b>$1,000 추가 비용</b>이며, Hyperliquid가 아닌 지갑 제공업체의 수익이 됩니다.',
    'Las comisiones van de <b>0% a 0.10%</b>. Parece poco, pero con $1M de volumen mensual, 0.10% son <b>$1,000 extra</b> que van directo al proveedor de la billetera — no a Hyperliquid, no a ti.',
    'Les frais vont de <b>0% à 0.10%</b>. Ça semble peu, mais avec 1M$ de volume mensuel, 0.10% représente <b>1 000 $ supplémentaires</b> qui vont directement au fournisseur du wallet — pas à Hyperliquid, pas à vous.',
    'Die Gebühren reichen von <b>0% bis 0,10%</b>. Klingt wenig, aber bei 1M$ Monatsvolumen bedeuten 0,10% satte <b>1.000 $ extra</b> — direkt an den Wallet-Anbieter, nicht an Hyperliquid, nicht an dich.',
    'As taxas variam de <b>0% a 0,10%</b>. Parece pouco, mas com $1M de volume mensal, 0,10% significa <b>$1.000 a mais</b> indo direto para o provedor da carteira — não para a Hyperliquid, não para você.',
    'Комиссии составляют от <b>0% до 0,10%</b>. Звучит мало, но при $1M месячного объёма 0,10% — это <b>$1 000 дополнительно</b>, уходящие напрямую провайдеру кошелька, а не Hyperliquid и не вам.',
    'Builder ücretleri <b>%0 ile %0,10</b> arasındadır. Az gibi görünebilir, ama aylık 1M$ hacimde %0,10 demek cüzdan sağlayıcısına giden <b>1.000$ ekstra</b> demektir — Hyperliquid\'e değil, size de değil.',
  ),
  'about.p3': e(
    'The good news: some wallets charge nothing. OneKey has a 0% builder fee. HypeFees helps you see exactly what you\'re paying — and switch to save.',
    '好消息是：有些钱包完全不收费。OneKey 的 Builder 费率为 0%。HypeFees 让你一目了然看到自己在付多少 — 然后一键切换省钱。',
    '朗報は、手数料ゼロのウォレットもあるということ。OneKeyのビルダー手数料は0%です。HypeFeesで実際の支払額を確認して、すぐに切り替えて節約しましょう。',
    '좋은 소식은, 수수료를 전혀 안 받는 지갑도 있다는 겁니다. OneKey의 빌더 수수료는 0%입니다. HypeFees로 현재 지출을 확인하고, 전환해서 절약하세요.',
    'La buena noticia: algunas billeteras no cobran nada. OneKey tiene 0% de comisión. HypeFees te muestra exactamente lo que pagas — y te ayuda a cambiar para ahorrar.',
    'Bonne nouvelle : certains wallets ne facturent rien. OneKey a des frais à 0%. HypeFees vous montre exactement ce que vous payez — et vous aide à changer pour économiser.',
    'Die gute Nachricht: Manche Wallets verlangen gar nichts. OneKey hat 0% Builder-Gebühr. HypeFees zeigt dir genau, was du zahlst — und hilft dir beim Wechsel zum Sparen.',
    'A boa notícia: algumas carteiras não cobram nada. A OneKey tem 0% de taxa builder. O HypeFees mostra exatamente quanto você paga — e ajuda a mudar para economizar.',
    'Хорошая новость: некоторые кошельки не берут ничего. У OneKey комиссия 0%. HypeFees покажет, сколько вы платите на самом деле — и поможет переключиться для экономии.',
    'İyi haber: bazı cüzdanlar hiç ücret almıyor. OneKey\'in builder ücreti %0. HypeFees tam olarak ne kadar ödediğinizi gösterir — ve tasarruf için geçiş yapmanızı sağlar.',
  ),

  // ── Comparison subtitle ──
  'comparison.subtitle': e('240+ wallets and frontends compared. Your total cost = Hyperliquid base fee + builder fee.','240+ 钱包和前端全面对比。你的总成本 = Hyperliquid 基础费用 + Builder 费用。','240以上のウォレットとフロントエンドを比較。総コスト = Hyperliquid基本手数料 + ビルダー手数料。','240개 이상의 지갑과 프론트엔드 비교. 총 비용 = Hyperliquid 기본 수수료 + 빌더 수수료.','240+ billeteras comparadas. Tu costo total = comisión base + comisión builder.','240+ wallets comparés. Votre coût total = frais de base + frais builder.','240+ Wallets im Vergleich. Deine Gesamtkosten = Basisgebühr + Builder-Gebühr.','240+ carteiras comparadas. Seu custo total = taxa base + taxa builder.','240+ кошельков в сравнении. Ваша общая стоимость = базовая комиссия + комиссия билдера.','240+ cüzdan karşılaştırıldı. Toplam maliyetiniz = temel ücret + builder ücreti.'),
  'calculator.subtitle': e('See how builder fees add up at different trading volumes.','看看不同交易量下 Builder 费用会累积到多少。','取引量が変わるとビルダー手数料がどれだけ膨らむか確認。','거래량별로 빌더 수수료가 얼마나 쌓이는지 확인하세요.','Mira cómo se acumulan las comisiones según tu volumen.','Voyez comment les frais s\'accumulent selon votre volume.','Sieh, wie sich Builder-Gebühren bei deinem Volumen summieren.','Veja como as taxas acumulam conforme seu volume.','Посмотрите, как комиссии растут с объёмом торговли.','İşlem hacminize göre builder ücretlerinin nasıl biriktiğini görün.'),

  // ── How It Works section ──
  'how.p1': e(
    'Wallets register as "builders" on Hyperliquid and set a fee rate. Every order you place through that wallet automatically includes the builder fee. The maximum allowed is 0.10% (10 basis points) on perpetual contracts.',
    '钱包在 Hyperliquid 上注册为 "Builder" 并设定费率。你通过该钱包下的每笔订单都会自动包含 Builder 费用。永续合约的最高费率为 0.10%（10 个基点）。',
    'ウォレットはHyperliquidで「ビルダー」として登録し、手数料率を設定します。そのウォレットを通じたすべての注文にビルダー手数料が自動的に含まれます。無期限契約の上限は0.10%（10ベーシスポイント）です。',
    '지갑은 Hyperliquid에 "빌더"로 등록하고 수수료율을 설정합니다. 해당 지갑을 통한 모든 주문에 빌더 수수료가 자동 포함됩니다. 무기한 계약 최대 수수료는 0.10%(10bp)입니다.',
    'Las billeteras se registran como "builders" en Hyperliquid y fijan una tarifa. Cada orden que colocas incluye la comisión automáticamente. El máximo es 0.10% en perpetuos.',
    'Les wallets s\'inscrivent comme "builders" sur Hyperliquid et définissent un taux. Chaque ordre que vous passez inclut automatiquement ces frais. Le maximum est de 0.10% sur les perpétuels.',
    'Wallets registrieren sich als "Builder" bei Hyperliquid und legen einen Gebührensatz fest. Jede Order, die du aufgibst, enthält die Builder-Gebühr automatisch. Maximum: 0,10% bei Perpetuals.',
    'Carteiras se registram como "builders" na Hyperliquid e definem uma taxa. Cada ordem que você coloca inclui a taxa automaticamente. O máximo é 0,10% em contratos perpétuos.',
    'Кошельки регистрируются как «билдеры» на Hyperliquid и устанавливают ставку комиссии. Каждый ваш ордер автоматически включает комиссию билдера. Максимум — 0,10% на бессрочных контрактах.',
    'Cüzdanlar Hyperliquid\'de "builder" olarak kayıt olur ve ücret oranını belirler. Verdiğiniz her emir otomatik olarak builder ücretini içerir. Perpetual sözleşmelerde maksimum %0,10\'dur.',
  ),
  'how.vipTitle': e('Base Exchange Fees by VIP Tier','VIP 等级基础交易所费率','VIPティア別の基本取引所手数料','VIP 등급별 기본 거래소 수수료','Comisiones Base por Nivel VIP','Frais de Base par Niveau VIP','Basis-Börsengebühren nach VIP-Stufe','Taxas Base por Nível VIP','Базовые Комиссии по VIP-Уровням','VIP Seviyesine Göre Temel Ücretler'),
  'how.tier': e('Tier','等级','ティア','등급','Nivel','Niveau','Stufe','Nível','Уровень','Seviye'),
  'how.14dVolume': e('14-Day Volume','14 天交易量','14日間取引量','14일 거래량','Volumen 14 Días','Volume 14 Jours','14-Tage-Volumen','Volume 14 Dias','14-дн. Объём','14 Gün Hacim'),
  'how.taker': e('Taker','Taker','テイカー','테이커','Taker','Taker','Taker','Taker','Тейкер','Taker'),
  'how.maker': e('Maker','Maker','メイカー','메이커','Maker','Maker','Maker','Maker','Мейкер','Maker'),
  'how.p2': e(
    'Your effective rate = base fee + builder fee. A VIP 0 taker with a 0.05% builder pays 0.085% total. With a 0% builder, you pay only 0.035% — that\'s 59% less.',
    '你的实际费率 = 基础费用 + Builder 费用。VIP 0 的 Taker 使用 0.05% Builder 时总费率为 0.085%。使用 0% Builder 时只需 0.035% — 直接省了 59%。',
    '実効レート = 基本手数料 + ビルダー手数料。VIP 0のテイカーで0.05%ビルダーなら合計0.085%。0%ビルダーなら0.035%のみ — 59%もお得。',
    '유효 수수료율 = 기본 수수료 + 빌더 수수료. VIP 0 테이커가 0.05% 빌더 사용 시 총 0.085%. 0% 빌더 사용 시 0.035%만 — 59% 절약.',
    'Tu tasa efectiva = base + builder. Un taker VIP 0 con 0.05% builder paga 0.085% en total. Con 0%, pagas solo 0.035% — un 59% menos.',
    'Votre taux effectif = base + builder. Un taker VIP 0 avec 0.05% builder paie 0.085%. Avec 0%, seulement 0.035% — soit 59% de moins.',
    'Dein effektiver Satz = Basis + Builder. Ein VIP 0 Taker mit 0,05% Builder zahlt 0,085%. Mit 0% Builder nur 0,035% — das sind 59% weniger.',
    'Sua taxa efetiva = base + builder. Um taker VIP 0 com builder 0,05% paga 0,085% no total. Com 0%, paga apenas 0,035% — 59% a menos.',
    'Ваша эффективная ставка = базовая + билдер. Тейкер VIP 0 с билдером 0,05% платит 0,085%. С билдером 0% — только 0,035%, то есть на 59% меньше.',
    'Efektif oranınız = temel + builder. %0,05 builder\'lı VIP 0 taker toplamda %0,085 öder. %0 builder ile sadece %0,035 — %59 daha az.',
  ),
  'how.switchTitle': e('Switching Builders','Builder 切换方法','ビルダーの切り替え方法','빌더 전환 방법','Cómo Cambiar de Builder','Changer de Builder','Builder Wechseln','Como Trocar de Builder','Как Переключить Билдера','Builder Nasıl Değiştirilir'),
  'how.switchP': e(
    'Sign an EIP-712 message called <code>approveBuilderFee</code> — no gas, no fund transfers. You can have up to 10 active builder approvals and switch back anytime.',
    '签署一条名为 <code>approveBuilderFee</code> 的 EIP-712 消息即可 — 无需 gas，不转移任何资金。最多可保留 10 个 Builder 授权，随时切回。',
    '<code>approveBuilderFee</code>というEIP-712メッセージに署名するだけ — ガス代ゼロ、資金移動なし。最大10のビルダー承認を持てて、いつでも戻せます。',
    '<code>approveBuilderFee</code>라는 EIP-712 메시지에 서명하기만 하면 됩니다 — 가스비 없음, 자금 이동 없음. 최대 10개의 활성 승인이 가능하며, 언제든 되돌릴 수 있습니다.',
    'Firma un mensaje EIP-712 llamado <code>approveBuilderFee</code> — sin gas, sin transferencias. Hasta 10 aprobaciones activas. Cambia cuando quieras.',
    'Signez un message EIP-712 nommé <code>approveBuilderFee</code> — sans gas, sans transfert. Jusqu\'à 10 approbations actives. Changez quand vous voulez.',
    'Unterschreibe eine EIP-712-Nachricht namens <code>approveBuilderFee</code> — kein Gas, keine Transfers. Bis zu 10 aktive Genehmigungen. Jederzeit wechselbar.',
    'Assine uma mensagem EIP-712 chamada <code>approveBuilderFee</code> — sem gas, sem transferências. Até 10 aprovações ativas. Troque quando quiser.',
    'Подпишите EIP-712 сообщение <code>approveBuilderFee</code> — без газа, без переводов. До 10 активных одобрений. Переключайтесь когда угодно.',
    '<code>approveBuilderFee</code> adlı EIP-712 mesajını imzalayın — gas yok, fon transferi yok. 10\'a kadar aktif onay. İstediğiniz zaman geri dönün.',
  ),

  // ── FAQ ──
  'faq.q1': e('What is a Hyperliquid builder fee?','什么是 Hyperliquid Builder 费用？','Hyperliquid ビルダー手数料って何？','Hyperliquid 빌더 수수료가 뭔가요?','¿Qué es una comisión de builder?','C\'est quoi les frais builder ?','Was ist eine Builder-Gebühr?','O que é uma taxa builder?','Что такое комиссия билдера?','Builder ücreti nedir?'),
  'faq.a1': e('An extra fee your wallet quietly adds on top of Hyperliquid\'s exchange fees. Each wallet sets its own rate — anywhere from 0% to 0.10%. The money goes to the wallet provider, not the exchange.','你的钱包在 Hyperliquid 交易所费用之上悄悄收取的额外费用。每个钱包自行设定费率，范围为 0% 到 0.10%。这笔钱进了钱包商的口袋，而不是交易所。','Hyperliquidの取引所手数料に加えて、ウォレットがこっそり上乗せする追加手数料。各ウォレットが0%～0.10%の範囲で独自に設定しています。手数料は取引所ではなくウォレットプロバイダーに支払われます。','Hyperliquid 거래소 수수료 위에 지갑이 몰래 추가하는 수수료입니다. 각 지갑이 독자적으로 0%~0.10% 범위에서 설정합니다. 이 돈은 거래소가 아닌 지갑 제공업체로 갑니다.','Una comisión extra que tu billetera agrega silenciosamente sobre las comisiones del exchange. Cada billetera fija su propia tarifa, de 0% a 0.10%. El dinero va al proveedor, no al exchange.','Des frais supplémentaires que votre wallet ajoute discrètement aux frais de la bourse. Chaque wallet fixe son taux, de 0% à 0.10%. L\'argent va au fournisseur du wallet, pas à l\'exchange.','Eine versteckte Zusatzgebühr, die dein Wallet auf die Börsengebühren aufschlägt. Jedes Wallet legt seinen eigenen Satz fest — von 0% bis 0,10%. Das Geld geht an den Wallet-Anbieter, nicht an die Börse.','Uma taxa extra que sua carteira adiciona discretamente sobre as taxas da exchange. Cada carteira define sua própria taxa, de 0% a 0,10%. O dinheiro vai para o provedor, não para a exchange.','Скрытая комиссия, которую ваш кошелёк тихо накидывает сверх комиссий биржи. Каждый кошелёк устанавливает свою ставку — от 0% до 0,10%. Деньги идут провайдеру кошелька, а не бирже.','Cüzdanınızın borsa ücretlerine sessizce eklediği ekstra bir ücret. Her cüzdan kendi oranını belirler — %0 ile %0,10 arasında. Para borsaya değil, cüzdan sağlayıcısına gider.'),
  'faq.q2': e('Which wallets have the lowest fees?','哪些钱包费率最低？','手数料が一番安いウォレットは？','수수료가 가장 낮은 지갑은?','¿Qué billeteras cobran menos?','Quels wallets sont les moins chers ?','Welche Wallets sind am günstigsten?','Quais carteiras cobram menos?','Какие кошельки самые дешёвые?','En ucuz cüzdanlar hangileri?'),
  'faq.a2': e('OneKey charges 0%. Several others also offer 0% builder fees. Check the comparison table above to find the best option for you.','OneKey 收费 0%。其他几个钱包也提供 0% 费率。查看上方对比表，找到最适合你的选择。','OneKeyは0%です。他にも0%のウォレットがあります。上の比較表であなたに最適な選択を見つけてください。','OneKey는 0%입니다. 다른 여러 지갑도 0%를 제공합니다. 위의 비교표에서 가장 적합한 옵션을 확인하세요.','OneKey cobra 0%. Otras también ofrecen 0%. Mira la tabla de comparación arriba para encontrar la mejor opción.','OneKey facture 0%. D\'autres offrent aussi 0%. Consultez le tableau comparatif ci-dessus pour trouver le meilleur choix.','OneKey berechnet 0%. Weitere bieten ebenfalls 0% an. Schau in die Vergleichstabelle oben, um die beste Wahl für dich zu finden.','OneKey cobra 0%. Outras também oferecem 0%. Confira a tabela de comparação acima para encontrar a melhor opção.','OneKey берёт 0%. Другие тоже предлагают 0%. Посмотрите таблицу сравнения выше, чтобы найти лучший вариант для себя.','OneKey %0 alır. Diğerleri de %0 sunar. En iyi seçeneği bulmak için yukarıdaki karşılaştırma tablosuna bakın.'),
  'faq.q3': e('How much can builder fees cost per year?','一年下来 Builder 费用能花多少？','ビルダー手数料は年間いくらになる？','빌더 수수료가 1년이면 얼마나 되나요?','¿Cuánto te cuestan al año?','Combien ça coûte par an ?','Wie viel kostet das im Jahr?','Quanto custa por ano?','Сколько это стоит в год?','Yılda ne kadara mal olur?'),
  'faq.a3': e('At $1M/month volume: Phantom (0.05%) costs $6,000/year. MetaMask (0.10%) costs $12,000/year. A 0% builder costs $0.','以每月 $1M 交易量计算：Phantom（0.05%）年费 $6,000。MetaMask（0.10%）年费 $12,000。0% Builder 费用 $0。','月間100万ドルの取引量の場合：Phantom（0.05%）は年間$6,000。MetaMask（0.10%）は年間$12,000。0%ビルダーなら$0。','월 $1M 거래량 기준: Phantom(0.05%)은 연 $6,000. MetaMask(0.10%)은 연 $12,000. 0% 빌더는 $0.','Con $1M/mes: Phantom (0.05%) cuesta $6,000/año. MetaMask (0.10%) cuesta $12,000/año. Con 0% = $0.','Avec 1M$/mois : Phantom (0.05%) coûte 6 000 $/an. MetaMask (0.10%) coûte 12 000 $/an. À 0% = 0 $.','Bei 1M$/Monat: Phantom (0,05%) kostet 6.000 $/Jahr. MetaMask (0,10%) kostet 12.000 $/Jahr. 0%-Builder = 0 $.','Com $1M/mês: Phantom (0,05%) custa $6.000/ano. MetaMask (0,10%) custa $12.000/ano. Builder 0% = $0.','При $1M/мес.: Phantom (0,05%) — $6 000/год. MetaMask (0,10%) — $12 000/год. Билдер 0% — $0.','Aylık 1M$ hacimde: Phantom (%0,05) yılda 6.000$. MetaMask (%0,10) yılda 12.000$. %0 builder = 0$.'),
  'faq.q4': e('How do I switch to a different builder?','怎么切换到其他 Builder？','他のビルダーに切り替えるには？','다른 빌더로 어떻게 전환하나요?','¿Cómo cambio de builder?','Comment changer de builder ?','Wie wechsle ich den Builder?','Como trocar de builder?','Как сменить билдера?','Builder nasıl değiştirilir?'),
  'faq.a4': e('Connect your wallet and sign an EIP-712 message — that\'s it. No gas fees, no fund transfers, takes effect instantly. Your positions and history stay exactly the same.','连接钱包，签署一条 EIP-712 消息就行了。无需 gas，不转移资金，即时生效。你的仓位和交易历史完全不受影响。','ウォレットを接続してEIP-712メッセージに署名するだけ。ガス代なし、資金移動なし、即座に有効。ポジションや取引履歴はそのままです。','지갑을 연결하고 EIP-712 메시지에 서명하면 끝입니다. 가스비 없음, 자금 이동 없음, 즉시 적용. 포지션과 거래 내역은 그대로 유지됩니다.','Conecta tu billetera y firma un mensaje EIP-712 — eso es todo. Sin gas, sin transferencias, efecto inmediato. Tus posiciones e historial no cambian.','Connectez votre wallet et signez un message EIP-712 — c\'est tout. Sans gas, sans transfert, effet immédiat. Vos positions et votre historique restent intacts.','Verbinde dein Wallet und unterschreibe eine EIP-712-Nachricht — fertig. Kein Gas, keine Transfers, sofortige Wirkung. Deine Positionen und Historie bleiben unverändert.','Conecte sua carteira e assine uma mensagem EIP-712 — pronto. Sem gas, sem transferências, efeito imediato. Suas posições e histórico permanecem iguais.','Подключите кошелёк и подпишите EIP-712 сообщение — всё. Без газа, без переводов, мгновенный эффект. Ваши позиции и история остаются нетронутыми.','Cüzdanınızı bağlayın ve EIP-712 mesajını imzalayın — hepsi bu. Gas yok, transfer yok, anında geçerli. Pozisyonlarınız ve geçmişiniz aynen kalır.'),
  'faq.q5': e('Is switching safe?','切换安全吗？','切り替えは安全？','전환은 안전한가요?','¿Es seguro cambiar?','C\'est sûr de changer ?','Ist der Wechsel sicher?','A troca é segura?','Это безопасно?','Değiştirmek güvenli mi?'),
  'faq.a5': e("Completely. You're just signing a message — no tokens approved, no smart contract calls, no funds moved. You can have up to 10 active builder approvals and switch back anytime.",'完全安全。你只是签署一条消息 — 不会批准任何代币，不会调用智能合约，不会移动任何资金。最多可有 10 个活跃授权，随时可以切回。','完全に安全です。メッセージに署名するだけ — トークンの承認なし、スマートコントラクト呼び出しなし、資金移動なし。最大10のアクティブな承認を持て、いつでも戻せます。','완전히 안전합니다. 메시지에 서명하는 것뿐 — 토큰 승인 없음, 스마트 계약 호출 없음, 자금 이동 없음. 최대 10개의 활성 승인을 가질 수 있으며 언제든 전환 가능합니다.','Totalmente. Solo firmas un mensaje — sin tokens aprobados, sin llamadas a contratos, sin movimiento de fondos. Hasta 10 aprobaciones activas. Cambia cuando quieras.','Absolument. Vous ne signez qu\'un message — pas de tokens approuvés, pas d\'appels de contrats, pas de fonds déplacés. Jusqu\'à 10 approbations actives. Changez quand vous voulez.','Absolut sicher. Du unterzeichnest nur eine Nachricht — keine Token-Genehmigungen, keine Smart-Contract-Aufrufe, keine Fondsbewegungen. Bis zu 10 aktive Genehmigungen, jederzeit wechselbar.','Totalmente seguro. Você apenas assina uma mensagem — sem aprovação de tokens, sem chamadas de contrato, sem movimentação de fundos. Até 10 aprovações ativas. Troque quando quiser.','Абсолютно. Вы только подписываете сообщение — без одобрения токенов, без вызовов контрактов, без перемещения средств. До 10 активных одобрений, переключайтесь когда угодно.','Kesinlikle güvenli. Sadece mesaj imzalıyorsunuz — token onayı yok, akıllı sözleşme çağrısı yok, fon hareketi yok. 10\'a kadar aktif onay, istediğiniz zaman geri dönün.'),
  'faq.q6': e('Does Phantom charge a builder fee?','Phantom 有 Builder 费用吗？','Phantomはビルダー手数料を取る？','Phantom도 빌더 수수료가 있나요?','¿Phantom cobra comisión de builder?','Phantom facture des frais builder ?','Erhebt Phantom eine Builder-Gebühr?','A Phantom cobra taxa builder?','Phantom берёт комиссию билдера?','Phantom builder ücreti alıyor mu?'),
  'faq.a6': e("Yes — 0.05%. On $1M volume, that's $500 extra. Your effective VIP 0 taker rate becomes 0.085%.",'是的 — 0.05%。$1M 交易量下，额外多付 $500。VIP 0 Taker 实际费率达到 0.085%。','はい — 0.05%。100万ドルの取引量で$500の追加コスト。VIP 0テイカーの実効レートは0.085%になります。','네 — 0.05%. $1M 거래 시 $500 추가 비용. VIP 0 테이커 유효 수수료율은 0.085%가 됩니다.','Sí — 0.05%. Con $1M de volumen, son $500 extra. Tu tasa taker VIP 0 efectiva: 0.085%.','Oui — 0.05%. Sur 1M$ de volume, 500 $ de plus. Taux taker VIP 0 effectif : 0.085%.','Ja — 0,05%. Bei 1M$ Volumen sind das 500 $ extra. Effektiver VIP 0 Taker-Satz: 0,085%.','Sim — 0,05%. Em $1M de volume, $500 extras. Sua taxa taker VIP 0 efetiva fica em 0,085%.','Да — 0,05%. При $1M объёма — $500 дополнительно. Эффективная ставка тейкера VIP 0 становится 0,085%.','Evet — %0,05. 1M$ hacimde 500$ ekstra. Efektif VIP 0 taker oranı: %0,085.'),
  'faq.q7': e('Does MetaMask charge a builder fee?','MetaMask 有 Builder 费用吗？','MetaMaskはビルダー手数料を取る？','MetaMask도 빌더 수수료가 있나요?','¿MetaMask cobra comisión?','MetaMask facture des frais ?','Erhebt MetaMask eine Gebühr?','A MetaMask cobra taxa?','MetaMask берёт комиссию?','MetaMask ücret alıyor mu?'),
  'faq.a7': e("Yes — 0.10%, the maximum allowed. On $1M volume, that's $1,000 extra.",'是的 — 0.10%，已经是允许的最高费率。$1M 交易量下，额外多付 $1,000。','はい — 許可される最大値の0.10%。100万ドルの取引量で$1,000の追加コストです。','네 — 허용 최대치인 0.10%. $1M 거래 시 $1,000 추가 비용입니다.','Sí — 0.10%, el máximo permitido. Con $1M, $1,000 extra.','Oui — 0.10%, le maximum autorisé. Sur 1M$, 1 000 $ de plus.','Ja — 0,10%, das erlaubte Maximum. Bei 1M$ sind das 1.000 $ extra.','Sim — 0,10%, o máximo permitido. Em $1M, $1.000 extras.','Да — 0,10%, это максимально допустимая. При $1M объёма — $1 000 дополнительно.','Evet — izin verilen maksimum olan %0,10. 1M$ hacimde 1.000$ ekstra.'),
  'faq.q8': e('Can I check my past builder fees?','能查看我过去付了多少 Builder 费用吗？','過去に払ったビルダー手数料を確認できる？','과거에 낸 빌더 수수료를 확인할 수 있나요?','¿Puedo ver mis comisiones pasadas?','Puis-je voir mes frais passés ?','Kann ich meine bisherigen Gebühren sehen?','Posso ver minhas taxas anteriores?','Могу ли я проверить прошлые комиссии?','Geçmiş ücretlerimi görebilir miyim?'),
  'faq.a8': e("Enter your address at the top of this page. HypeFees pulls your full trade history from Hyperliquid's public API and shows you exactly how much went to exchange fees vs. builder fees.",'在页面顶部输入你的地址就行。HypeFees 会从 Hyperliquid 公开 API 拉取你的完整交易历史，清晰展示交易所费用和 Builder 费用各是多少。','このページの上部にアドレスを入力するだけ。HypeFeesがHyperliquidの公開APIから取引履歴を取得し、取引所手数料とビルダー手数料の内訳を明確に表示します。','이 페이지 상단에 주소를 입력하면 됩니다. HypeFees가 Hyperliquid 공개 API에서 전체 거래 내역을 가져와 거래소 수수료와 빌더 수수료가 각각 얼마인지 정확히 보여줍니다.','Ingresa tu dirección arriba. HypeFees obtiene tu historial completo de la API pública y te muestra exactamente cuánto fue a comisiones del exchange vs. builder.','Entrez votre adresse en haut de la page. HypeFees récupère votre historique complet via l\'API publique et vous montre exactement la part des frais d\'exchange et de builder.','Gib deine Adresse oben ein. HypeFees ruft deine komplette Handelshistorie über die öffentliche API ab und zeigt dir genau, wie viel an Börsen- vs. Builder-Gebühren ging.','Digite seu endereço no topo da página. O HypeFees puxa seu histórico completo pela API pública e mostra exatamente quanto foi para taxas da exchange vs. builder.','Введите адрес вверху страницы. HypeFees получит вашу полную историю торговли из публичного API Hyperliquid и покажет, сколько именно ушло на комиссии биржи и билдера.','Sayfanın üstüne adresinizi girin. HypeFees, herkese açık API\'den tam işlem geçmişinizi çeker ve borsa ücreti ile builder ücreti dağılımını net olarak gösterir.'),
  'faq.q9': e('Where does this data come from?','数据从哪儿来？','データはどこから来てるの？','데이터 출처는 어디인가요?','¿De dónde vienen los datos?','D\'où viennent les données ?','Woher stammen die Daten?','De onde vêm os dados?','Откуда берутся данные?','Veriler nereden geliyor?'),
  'faq.a9': e("Builder data from HyperTracker (CoinMarketMan). Fee breakdowns from Hyperliquid's public API. Everything is on-chain and verifiable. HypeFees is independent and open-source.",'Builder 数据来自 HyperTracker（CoinMarketMan）。费用明细来自 Hyperliquid 公开 API。所有数据都在链上，可独立验证。HypeFees 是独立的开源项目。','ビルダーデータはHyperTracker（CoinMarketMan）から。手数料内訳はHyperliquidの公開APIから。すべてオンチェーンで検証可能。HypeFeesは独立したオープンソースプロジェクトです。','빌더 데이터는 HyperTracker(CoinMarketMan)에서, 수수료 내역은 Hyperliquid 공개 API에서 가져옵니다. 모두 온체인 검증 가능합니다. HypeFees는 독립적인 오픈소스 프로젝트입니다.','Datos de builders de HyperTracker (CoinMarketMan). Desglose de comisiones de la API pública. Todo verificable on-chain. HypeFees es independiente y open-source.','Données de builders via HyperTracker (CoinMarketMan). Détails des frais via l\'API publique. Tout est vérifiable on-chain. HypeFees est indépendant et open-source.','Builder-Daten von HyperTracker (CoinMarketMan). Gebührendetails von der öffentlichen API. Alles on-chain verifizierbar. HypeFees ist unabhängig und Open-Source.','Dados de builders do HyperTracker (CoinMarketMan). Detalhes de taxas da API pública. Tudo verificável on-chain. HypeFees é independente e open-source.','Данные билдеров из HyperTracker (CoinMarketMan). Разбивка комиссий из публичного API. Всё on-chain и проверяемо. HypeFees — независимый open-source проект.','Builder verileri HyperTracker\'dan (CoinMarketMan). Ücret dağılımları herkese açık API\'den. Her şey zincir üzerinde ve doğrulanabilir. HypeFees bağımsız ve açık kaynaklıdır.'),

  // ── Share Card ──
  'share.title': e('My Hyperliquid Fee Report','我的 Hyperliquid 费用报告','Hyperliquid 手数料レポート','나의 Hyperliquid 수수료 리포트','Mi Reporte de Comisiones','Mon Rapport de Frais','Mein Gebühren-Report','Meu Relatório de Taxas','Мой Отчёт по Комиссиям','Ücret Raporom'),
  'share.viewCard': e('See my stats →','看看我的数据 →','統計を見る →','내 통계 보기 →','Ver mis stats →','Voir mes stats →','Meine Stats →','Ver minhas stats →','Моя статистика →','İstatistiklerimi gör →'),
  'share.download': e('Save Image','保存图片','画像を保存','이미지 저장','Guardar Imagen','Enregistrer l\'Image','Bild Speichern','Salvar Imagem','Сохранить','Görseli Kaydet'),

  // ── Share Card Content ──
  'card.totalFeesPaid': e('Total fees paid to Hyperliquid','在 Hyperliquid 上支付的总费用','Hyperliquid に支払った手数料合計','Hyperliquid에 지불한 총 수수료','Total de comisiones pagadas a Hyperliquid','Total des frais payés à Hyperliquid','Gesamtgebühren an Hyperliquid','Total de taxas pagas ao Hyperliquid','Всего комиссий уплачено Hyperliquid','Hyperliquid\'e ödenen toplam ücret'),
  'card.globalRank': e('Global rank','全球排名','世界ランク','글로벌 순위','Ranking global','Classement mondial','Globaler Rang','Ranking global','Глобальный рейтинг','Küresel sıralama'),
  'card.outOf': e('out of {n} traders','共 {n} 名交易者','{n} 人のトレーダー中','{n}명의 트레이더 중','de {n} traders','sur {n} traders','von {n} Tradern','de {n} traders','из {n} трейдеров','{n} trader arasında'),
  'card.top': e('Top {n}%','前 {n}%','上位 {n}%','상위 {n}%','Top {n}%','Top {n}%','Top {n}%','Top {n}%','Топ {n}%','İlk {n}%'),
  'card.youAreHere': e('You are here','你在这里','あなたはここ','여기에 있습니다','Estás aquí','Vous êtes ici','Du bist hier','Você está aqui','Вы здесь','Buradasınız'),
  'card.cups': e('cups','杯','杯','잔','tazas','tasses','Tassen','xícaras','чашек','fincan'),
  'card.cup': e('cup','杯','杯','잔','taza','tasse','Tasse','xícara','чашка','fincan'),
  'card.units': e('units','台','台','대','unidades','unités','Stück','unidades','шт.','adet'),
  'card.unit': e('unit','台','台','대','unidad','unité','Stück','unidade','шт.','adet'),
  'card.trips': e('trips','次','回','회','viajes','voyages','Reisen','viagens','поездок','sefer'),
  'card.trip': e('trip','次','回','회','viaje','voyage','Reise','viagem','поездка','sefer'),
  'card.txns': e('txns','笔','件','건','txns','txns','Txns','txns','тр-ий','işlem'),
  'card.txn': e('txn','笔','件','건','txn','txn','Txn','txn','тр-я','işlem'),
  'card.games': e('games','款','本','개','juegos','jeux','Spiele','jogos','игр','oyun'),
  'card.game': e('game','款','本','개','juego','jeu','Spiel','jogo','игра','oyun'),
  'card.beers': e('beers','杯','杯','잔','cervezas','bières','Bier','cervejas','кружек','bira'),
  'card.beer': e('beer','杯','杯','잔','cerveza','bière','Bier','cerveja','кружка','bira'),
  'card.rides': e('rides','次','回','회','viajes','trajets','Fahrten','corridas','поездок','yolculuk'),
  'card.ride': e('ride','次','回','회','viaje','trajet','Fahrt','corrida','поездка','yolculuk'),
  'card.slices': e('slices','片','枚','조각','porciones','parts','Stücke','fatias','кусков','dilim'),
  'card.starbucks': e('Starbucks grande lattes','星巴克大杯拿铁','スタバのグランデラテ','스타벅스 그란데 라떼','Lattes grandes de Starbucks','Grands lattes Starbucks','Starbucks Grande Lattes','Lattes grandes do Starbucks','Латте гранде из Starbucks','Starbucks grande latte'),
  'card.iphone': e('iPhone 16 Pro Max','iPhone 16 Pro Max','iPhone 16 Pro Max','iPhone 16 Pro Max','iPhone 16 Pro Max','iPhone 16 Pro Max','iPhone 16 Pro Max','iPhone 16 Pro Max','iPhone 16 Pro Max','iPhone 16 Pro Max'),
  'card.iphoneMany': e('Enough to open a small Apple Store','够开一家小苹果商店了','小さなApple Storeが開けるほど','작은 애플 스토어를 열 수 있을 만큼','Suficiente para abrir una tienda Apple','De quoi ouvrir un petit Apple Store','Genug für einen kleinen Apple Store','Suficiente para abrir uma Apple Store','Хватит на маленький Apple Store','Küçük bir Apple Store açmaya yeterli'),
  'card.iphoneOne': e('A shiny new phone','一部崭新手机','ピカピカの新品スマホ','반짝이는 새 폰','Un teléfono nuevo reluciente','Un tout nouveau téléphone','Ein glänzendes neues Handy','Um celular novinho em folha','Новенький блестящий телефон','Pırıl pırıl yeni bir telefon'),
  'card.flights': e('NYC ↔ London first class','纽约↔伦敦头等舱','NY ↔ ロンドン ファーストクラス','뉴욕 ↔ 런던 퍼스트 클래스','NYC ↔ Londres primera clase','NYC ↔ Londres première classe','NYC ↔ London First Class','NYC ↔ Londres primeira classe','Нью-Йорк ↔ Лондон бизнес-класс','NYC ↔ Londra birinci sınıf'),
  'card.ethL1': e('ETH L1 transfers','ETH L1 转账','ETH L1 送金','ETH L1 전송','Transferencias ETH L1','Transferts ETH L1','ETH L1-Überweisungen','Transferências ETH L1','Переводы ETH L1','ETH L1 transferleri'),
  'card.ethL1Desc': e('At avg $10 gas per tx','按每笔 $10 Gas 费计算','平均 $10 のガス代で','건당 평균 $10 가스비 기준','A $10 de gas promedio por tx','À $10 de gas par tx en moyenne','Bei ø $10 Gas pro Tx','A $10 de gas por tx em média','При ≈$10 газа за тр-ю','Tx başına ort. $10 gas ile'),
  'card.steamGames': e('AAA Steam titles','3A 大作','AAAタイトル','AAA 스팀 타이틀','Títulos AAA de Steam','Jeux AAA Steam','AAA-Steam-Spiele','Jogos AAA da Steam','ААА-игры в Steam','AAA Steam oyunları'),
  'card.draftBeers': e('Draft beers','扎啤','生ビール','생맥주','Cervezas de barril','Bières pression','Fassbier','Chopes','Разливное пиво','Fıçı birası'),
  'card.uberRides': e('Uber rides','Uber 出行','Uber配車','Uber 탑승','Viajes en Uber','Trajets Uber','Uber-Fahrten','Corridas Uber','Поездки Uber','Uber yolculukları'),
  'card.pizzaSlices': e('Pizza slices','披萨','ピザ','피자 조각','Porciones de pizza','Parts de pizza','Pizzastücke','Fatias de pizza','Куски пиццы','Pizza dilimleri'),
  'card.thats': e("That's",'相当于',"つまり",'즉','Es decir',"C'est",'Das sind','Ou seja','Это','Yani'),
  'card.burritos': e('Chipotle burritos','Chipotle 卷饼','Chipotle ブリトー','Chipotle 부리토','Burritos de Chipotle','Burritos Chipotle','Chipotle-Burritos','Burritos Chipotle','Буррито Chipotle','Chipotle burritos'),
  'card.burrito': e('Chipotle burrito','Chipotle 卷饼','Chipotle ブリトー','Chipotle 부리토','Burrito de Chipotle','Burrito Chipotle','Chipotle-Burrito','Burrito Chipotle','Буррито Chipotle','Chipotle burrito'),
  'card.paying': e('Paying','每天支付','支払い','지불','Pagando','En payant','Du zahlst','Pagando','Платите','Ödeme'),
  'card.perDay': e('/day','/天','/日','/일','/día','/jour','/Tag','/dia','/день','/gün'),
  'card.toHL': e('to Hyperliquid','给 Hyperliquid','を Hyperliquid に','Hyperliquid에','a Hyperliquid','à Hyperliquid','an Hyperliquid','ao Hyperliquid','для Hyperliquid',"Hyperliquid'e"),
  'card.netflix': e('{n}x Netflix','Netflix 的 {n} 倍','Netflixの{n}倍','Netflix {n}배','{n}x Netflix','{n}x Netflix','{n}x Netflix','{n}x Netflix','{n}x Netflix','{n}x Netflix'),
  'card.steamPill': e('Steam AAA games','Steam 3A 大作','Steam AAAゲーム','Steam AAA 게임','Juegos AAA Steam','Jeux AAA Steam','Steam-AAA-Spiele','Jogos AAA Steam','Игры AAA Steam','Steam AAA oyunları'),
  'card.rentPill': e('mo Manhattan rent','个月曼哈顿房租','ヶ月のマンハッタン家賃','개월 맨해튼 월세','meses alquiler Manhattan','mois loyer Manhattan','Mon. Manhattan-Miete','meses aluguel Manhattan','мес. аренды Манхэттен','ay Manhattan kirası'),
  'card.beersPill': e('draft beers','杯扎啤','杯の生ビール','잔 생맥주','cervezas de barril','bières pression','Fassbier','chopes','кружек пива','fıçı birası'),
  'card.uberPill': e('Uber rides','次 Uber','回のUber','회 Uber','viajes Uber','trajets Uber','Uber-Fahrten','corridas Uber','поездок Uber','Uber yolculuğu'),
  'card.spotifyPill': e('yrs Spotify','年 Spotify','年分のSpotify','년 Spotify','años Spotify','ans Spotify','Jahre Spotify','anos Spotify','лет Spotify','yıl Spotify'),
  'card.cupADay': e('A cup a day for {t}','每天一杯，够喝 {t}','毎日1杯で {t}','매일 한 잔이면 {t}','Una taza al día durante {t}','Une tasse par jour pendant {t}','Eine Tasse pro Tag für {t}','Uma xícara por dia por {t}','По чашке в день — хватит на {t}','Günde bir fincan, {t} boyunca'),
  'card.weeksOfCoffee': e('{n} weeks of daily coffee','{n} 周的每日咖啡','{n} 週間分の日課コーヒー','{n}주간의 매일 커피','{n} semanas de café diario','{n} semaines de café quotidien','{n} Wochen täglicher Kaffee','{n} semanas de café diário','{n} недель ежедневного кофе','{n} hafta günlük kahve'),
  'card.pickMeUps': e('{n} morning pick-me-ups','{n} 次晨间提神','{n} 回の朝の目覚まし','{n}번의 모닝 커피','{n} cafés matutinos','{n} cafés du matin','{n} morgendliche Muntermacher','{n} cafés da manhã','{n} утренних бодрячков','{n} sabah kahvesi'),
  'card.noLatteYet': e('Not even one latte yet','一杯拿铁都不够','ラテ1杯にも満たない','라떼 한 잔도 안 됨','Ni para un latte','Même pas un latte','Noch kein einziger Latte','Nem para um latte','Даже на один латте не хватит','Bir latte bile değil'),
  'card.gamingBacklog': e('{t} of gaming backlog','{t} 的游戏积压','{t} 分のゲーム積みゲー','{t}만큼의 게임 백로그','{t} de juegos por jugar','{t} de jeux en retard','{t} an Spiele-Rückstand','{t} de jogos acumulados','{t} игрового бэклога','{t} oyun birikimi'),
  'card.cheers': e('Cheers to the grind','干杯致敬','乾杯！','건배','Salud por el esfuerzo','Santé au grind','Prost aufs Grinden','Saúde ao grind','За торговлю!','Çabalara şerefe'),
  'card.champagne': e('Champagne at 35,000 feet','万米高空品香槟','3万5千フィートでシャンパン','35,000피트 상공에서 샴페인','Champán a 10.000 metros','Champagne à 10 000 mètres','Champagner in 10.000 Metern','Champanhe a 10.000 metros','Шампанское на высоте 10 000 м','10.000 metrede şampanya'),
  'card.oneEvery': e('One every {n} weeks','每 {n} 周一次','{n} 週間に1回','{n}주마다 1회','Uno cada {n} semanas','Un tous les {n} semaines','Einer alle {n} Wochen','Uma a cada {n} semanas','Один раз в {n} нед.','Her {n} haftada bir'),
  'card.noWalking': e('No walking needed','再也不用走路','歩く必要なし','걸을 필요 없음','Sin caminar','Plus besoin de marcher','Kein Laufen nötig','Sem precisar andar','Ходить не нужно','Yürümeye gerek yok'),
  'card.tradingFuel': e('Trading fuel','交易燃料','トレーディング燃料','거래 연료','Combustible de trading','Carburant de trading','Trading-Treibstoff','Combustível de trading','Топливо для трейдинга','İşlem yakıtı'),
  'card.poweredBy': e('hypefees.com · powered by degen energy','hypefees.com · 由 degen 精神驱动','hypefees.com · degen エナジーで稼働中','hypefees.com · degen 에너지로 구동','hypefees.com · impulsado por energía degen','hypefees.com · propulsé par l\'énergie degen','hypefees.com · angetrieben von Degen-Energie','hypefees.com · movido por energia degen','hypefees.com · на дегенской энергии','hypefees.com · degen enerjisi ile güçlendirildi'),
  'card.optimized': e('2400×1350 · optimized for Twitter','2400×1350 · 为 Twitter 优化','2400×1350 · Twitter 向けに最適化','2400×1350 · Twitter에 최적화','2400×1350 · optimizado para Twitter','2400×1350 · optimisé pour Twitter','2400×1350 · optimiert für Twitter','2400×1350 · otimizado para o Twitter','2400×1350 · оптимизировано для Twitter','2400×1350 · Twitter için optimize edildi'),
  'card.aRideEvery': e('A ride every {n} days','每 {n} 天坐一次','{n} 日ごとに1回乗車','{n}일마다 탑승 1회','Un viaje cada {n} días','Un trajet tous les {n} jours','Eine Fahrt alle {n} Tage','Uma corrida a cada {n} dias','Поездка каждые {n} дн.','Her {n} günde bir yolculuk'),
  'card.lunchEveryDay': e('lunch every day for {t}','每天午餐吃 {t}','毎日のランチで {t}','매일 점심 {t}','almuerzo diario durante {t}','déjeuner quotidien pendant {t}','Mittagessen täglich für {t}','almoço diário por {t}','обед каждый день — {t}','her gün öğle yemeği, {t} boyunca'),
  'card.aMoment': e('a moment','一瞬','一瞬','잠깐','un momento','un instant','einen Moment','um instante','мгновение','bir an'),
  'card.years': e('years','年','年','년','años','ans','Jahre','anos','лет','yıl'),
  'card.year': e('year','年','年','년','año','an','Jahr','ano','год','yıl'),
  'card.months': e('months','个月','ヶ月','개월','meses','mois','Monate','meses','мес.','ay'),
  'card.month': e('month','个月','ヶ月','개월','mes','mois','Monat','mês','мес.','ay'),
  'card.days': e('days','天','日','일','días','jours','Tage','dias','дн.','gün'),
  'card.day': e('day','天','日','일','día','jour','Tag','dia','день','gün'),

  // ── Footer ──
  'footer.description': e('HypeFees is a free, open-source tool that helps Hyperliquid traders see hidden builder fees, compare wallets, and switch to save. Not affiliated with Hyperliquid or any wallet provider.','HypeFees 是一款免费开源工具，帮助 Hyperliquid 交易者发现隐藏的 Builder 费用、对比钱包、切换省钱。与 Hyperliquid 及任何钱包商无关。','HypeFeesは無料のオープンソースツールで、Hyperliquidトレーダーが隠れたビルダー手数料を発見し、ウォレットを比較し、切り替えて節約するのを支援します。Hyperliquidやウォレットプロバイダーとは無関係です。','HypeFees는 Hyperliquid 트레이더가 숨겨진 빌더 수수료를 확인하고, 지갑을 비교하고, 전환해서 절약할 수 있도록 돕는 무료 오픈소스 도구입니다. Hyperliquid나 지갑 제공업체와 무관합니다.','HypeFees es una herramienta gratuita y open-source que ayuda a traders de Hyperliquid a descubrir comisiones ocultas, comparar billeteras y ahorrar. No afiliado a Hyperliquid ni a ningún proveedor.','HypeFees est un outil gratuit et open-source qui aide les traders Hyperliquid à découvrir les frais cachés, comparer les wallets et économiser. Non affilié à Hyperliquid ni à aucun fournisseur.','HypeFees ist ein kostenloses Open-Source-Tool, das Hyperliquid-Tradern hilft, versteckte Builder-Gebühren zu entdecken, Wallets zu vergleichen und durch Wechsel zu sparen. Unabhängig von Hyperliquid und Wallet-Anbietern.','HypeFees é uma ferramenta gratuita e open-source que ajuda traders da Hyperliquid a descobrir taxas ocultas, comparar carteiras e economizar. Sem vínculo com Hyperliquid ou provedores de carteira.','HypeFees — бесплатный open-source инструмент, который помогает трейдерам Hyperliquid обнаруживать скрытые комиссии, сравнивать кошельки и экономить. Не связан с Hyperliquid или провайдерами кошельков.','HypeFees, Hyperliquid traderlarının gizli builder ücretlerini keşfetmesine, cüzdanları karşılaştırmasına ve tasarruf etmesine yardımcı olan ücretsiz, açık kaynaklı bir araçtır. Hyperliquid veya herhangi bir cüzdan sağlayıcısıyla bağlantısı yoktur.'),
  'footer.tools': e('Tools','工具','ツール','도구','Herramientas','Outils','Tools','Ferramentas','Инструменты','Araçlar'),
  'footer.feeLookup': e('Fee Lookup','费用查询','手数料検索','수수료 조회','Consulta de Comisiones','Recherche de Frais','Gebührensuche','Consulta de Taxas','Поиск Комиссий','Ücret Arama'),
  'footer.builderComparison': e('Builder Comparison','Builder 对比','ビルダー比較','빌더 비교','Comparación de Builders','Comparaison des Builders','Builder-Vergleich','Comparação de Builders','Сравнение Билдеров','Builder Karşılaştırma'),
  'footer.feeCalculator': e('Fee Calculator','费用计算器','手数料計算機','수수료 계산기','Calculadora','Calculateur','Rechner','Calculadora','Калькулятор','Hesaplayıcı'),
  'footer.oneClickSwitch': e('One-Click Switch','一键切换','ワンクリック切替','원클릭 전환','Cambio Rápido','Changement Rapide','Ein-Klick-Wechsel','Troca Rápida','Быстрое Переключение','Tek Tıkla Değiştir'),
  'footer.resources': e('Resources','资源','リソース','리소스','Recursos','Ressources','Ressourcen','Recursos','Ресурсы','Kaynaklar'),
  'footer.project': e('Project','项目','プロジェクト','프로젝트','Proyecto','Projet','Projekt','Projeto','Проект','Proje'),
  'footer.disclaimer1': e("Data sourced from Hyperliquid's public API and HyperTracker by CoinMarketMan. All fee data is on-chain and independently verifiable. Information is provided for reference only — always verify on-chain before making financial decisions.",'数据来源于 Hyperliquid 公开 API 和 CoinMarketMan 的 HyperTracker。所有费用数据均在链上，可独立验证。信息仅供参考 — 做出财务决策前请务必在链上确认。','データはHyperliquidの公開APIとCoinMarketManのHyperTrackerから取得。すべての手数料データはオンチェーンで独立検証可能。情報は参考用です — 金融判断前に必ずオンチェーンで確認してください。','데이터는 Hyperliquid 공개 API와 CoinMarketMan의 HyperTracker에서 제공됩니다. 모든 수수료 데이터는 온체인으로 독립적으로 검증 가능합니다. 재무 결정 전 반드시 온체인에서 확인하세요.','Datos de la API pública de Hyperliquid y HyperTracker. Todos los datos son verificables on-chain. Solo para referencia — siempre verifique on-chain antes de tomar decisiones financieras.','Données de l\'API publique d\'Hyperliquid et HyperTracker. Toutes les données sont vérifiables on-chain. À titre indicatif uniquement — vérifiez toujours on-chain avant toute décision financière.','Daten aus der öffentlichen API von Hyperliquid und HyperTracker. Alle Daten sind on-chain verifizierbar. Nur zur Information — vor Finanzentscheidungen immer on-chain prüfen.','Dados da API pública da Hyperliquid e HyperTracker. Todos os dados são verificáveis on-chain. Apenas para referência — sempre verifique on-chain antes de decisões financeiras.','Данные из публичного API Hyperliquid и HyperTracker. Все данные on-chain и проверяемы. Только для справки — всегда проверяйте on-chain перед принятием финансовых решений.','Veriler Hyperliquid\'in herkese açık API\'sinden ve HyperTracker\'dan alınmıştır. Tüm veriler zincir üzerinde doğrulanabilir. Yalnızca referans amaçlıdır — finansal kararlar öncesi daima zincir üzerinde doğrulayın.'),
  'footer.disclaimer2': e('HypeFees is not a financial advisor. Trading perpetual futures involves substantial risk. Builder fee comparison data is updated daily.','HypeFees 不是财务顾问。永续合约交易存在重大风险。Builder 费用对比数据每日更新。','HypeFeesはファイナンシャルアドバイザーではありません。無期限先物取引には大きなリスクが伴います。ビルダー手数料データは毎日更新されます。','HypeFees는 재무 자문사가 아닙니다. 무기한 선물 거래에는 상당한 위험이 따릅니다. 빌더 수수료 데이터는 매일 업데이트됩니다.','HypeFees no es asesor financiero. Operar futuros perpetuos implica riesgo sustancial. Datos actualizados diariamente.','HypeFees n\'est pas un conseiller financier. Le trading de futures perpétuels comporte des risques importants. Données mises à jour quotidiennement.','HypeFees ist kein Finanzberater. Der Handel mit Perpetuals birgt erhebliche Risiken. Gebührendaten werden täglich aktualisiert.','HypeFees não é consultor financeiro. Negociar futuros perpétuos envolve risco substancial. Dados atualizados diariamente.','HypeFees не является финансовым консультантом. Торговля бессрочными фьючерсами сопряжена с существенными рисками. Данные обновляются ежедневно.','HypeFees mali danışman değildir. Perpetual vadeli işlem ticareti önemli riskler içerir. Builder ücreti verileri günlük güncellenir.'),
};

// ── Translation function ──
export function t(key: string, lang: Lang = DEFAULT_LANG, params?: Record<string, string>): string {
  let str = translations[key]?.[lang] || translations[key]?.en || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

// ── Cookie helpers ──
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

// ── Detect browser language → best matching supported Lang ──
function detectBrowserLang(): Lang {
  const langs = navigator.languages || [navigator.language];
  for (const raw of langs) {
    const code = raw.toLowerCase().split('-')[0] as Lang;
    if (code in LANGUAGES) return code;
  }
  return DEFAULT_LANG;
}

// ── React hook — subscribes to language changes across islands ──
// Priority: URL ?lang= > cookie (user chose) > browser language > default (en)
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    let resolved: Lang = DEFAULT_LANG;

    // 1. URL ?lang= takes highest priority (shared links)
    const url = new URL(window.location.href);
    const urlLang = url.searchParams.get('lang') as Lang | null;
    if (urlLang && urlLang in LANGUAGES) {
      resolved = urlLang;
      setCookie('lang', resolved);
    } else {
      // 2. Cookie = user explicitly chose a language before
      const cookieLang = getCookie('lang') as Lang | null;
      if (cookieLang && cookieLang in LANGUAGES) {
        resolved = cookieLang;
      } else {
        // 3. First visit: detect from browser language
        resolved = detectBrowserLang();
      }
    }

    setLangState(resolved);

    function onLangChange(e: Event) {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail && detail in LANGUAGES) setLangState(detail);
    }
    window.addEventListener(LANG_EVENT, onLangChange);
    return () => window.removeEventListener(LANG_EVENT, onLangChange);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setCookie('lang', l); // persist user choice in cookie
    // Update URL
    const url = new URL(window.location.href);
    if (l === DEFAULT_LANG) {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', l);
    }
    window.history.replaceState({}, '', url.toString());
    window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: l }));
  }, []);

  return [lang, setLang];
}
