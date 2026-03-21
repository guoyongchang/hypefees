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
  'hero.title.1': e('Every trade has a','每笔交易都有一个','すべての取引には','모든 거래에는','Cada operación tiene una','Chaque trade a des','Jeder Trade hat eine','Cada trade tem uma','Каждая сделка имеет','Her işlemin gizli bir'),
  'hero.title.2': e('hidden fee.','隐藏费用。','隠れた手数料があります。','숨겨진 수수료가 있습니다.','comisión oculta.','frais cachés.','versteckte Gebühr.','taxa oculta.','скрытую комиссию.','ücreti var.'),
  'hero.title.cta': e('See yours.','查看你的。','あなたのを確認。','내 수수료 확인.','Mira la tuya.','Voir les vôtres.','Deine anzeigen.','Veja a sua.','Посмотри свою.','Kendininkini gör.'),
  'hero.subtitle': e(
    "Wallets add builder fees on top of Hyperliquid's exchange rate. Some charge 0.10% per trade. Some charge nothing.",
    '钱包会在 Hyperliquid 交易所费率之上收取 Builder 费用。有些收 0.10%，有些完全免费。',
    'ウォレットはHyperliquidの取引手数料の上にビルダー手数料を加算します。0.10%のものもあれば無料のものもあります。',
    '지갑은 Hyperliquid 거래 수수료 위에 빌더 수수료를 추가합니다. 0.10%를 부과하는 곳도, 무료인 곳도 있습니다.',
    'Las billeteras agregan tarifas de builder sobre la comisión de Hyperliquid. Algunas cobran 0.10%, otras nada.',
    "Les wallets ajoutent des frais de builder en plus des frais d'échange Hyperliquid. Certains facturent 0.10%, d'autres rien.",
    'Wallets erheben Builder-Gebühren zusätzlich zu den Hyperliquid-Börsengebühren. Manche verlangen 0,10%, andere nichts.',
    'Carteiras adicionam taxas de builder além das taxas da Hyperliquid. Algumas cobram 0,10%, outras nada.',
    'Кошельки добавляют сборы билдера поверх комиссии Hyperliquid. Некоторые берут 0.10%, другие — ничего.',
    "Cüzdanlar, Hyperliquid'in komisyonuna ek olarak builder ücreti alır. Bazıları %0,10, bazıları hiç almaz.",
  ),
  'hero.input.placeholder': e('Enter your ETH address (0x...)','输入你的 ETH 地址 (0x...)','ETHアドレスを入力 (0x...)','ETH 주소 입력 (0x...)','Ingresa tu dirección ETH (0x...)','Entrez votre adresse ETH (0x...)','ETH-Adresse eingeben (0x...)','Insira seu endereço ETH (0x...)','Введите ваш ETH-адрес (0x...)','ETH adresinizi girin (0x...)'),
  'hero.btn.lookup': e('Look Up','查询','検索','조회','Buscar','Rechercher','Suchen','Consultar','Поиск','Ara'),
  'hero.btn.loading': e('Loading...','加载中...','読み込み中...','로딩 중...','Cargando...','Chargement...','Laden...','Carregando...','Загрузка...','Yükleniyor...'),

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
  'result.saveBanner': e('You could have saved {amount} with a 0% fee builder','使用 0% 费率的 Builder 可节省 {amount}','0%手数料のビルダーなら {amount} 節約できました','0% 수수료 빌더로 {amount} 절약 가능','Podrías haber ahorrado {amount} con un builder sin comisión','Vous auriez pu économiser {amount} avec un builder à 0%','Sie hätten {amount} mit einem 0%-Builder sparen können','Você poderia ter economizado {amount} com um builder 0%','Вы могли сэкономить {amount} с билдером без комиссии','%0 ücretli bir builder ile {amount} tasarruf edebilirdiniz'),
  'result.saveBannerSub': e('Switch to a builder with 0% fees to keep more of your profits on future trades.','切换到 0% 费率的 Builder，在未来交易中保留更多利润。','0%手数料のビルダーに切り替えて、将来の取引でより多くの利益を確保しましょう。','0% 수수료 빌더로 전환하여 향후 거래에서 더 많은 수익을 확보하세요.','Cambia a un builder con 0% de comisión para conservar más ganancias.','Passez à un builder à 0% pour garder plus de profits sur vos futurs trades.','Wechseln Sie zu einem 0%-Builder, um bei zukünftigen Trades mehr zu verdienen.','Mude para um builder 0% para manter mais lucros em trades futuros.','Переключитесь на билдера с 0% комиссии, чтобы сохранить больше прибыли.','Gelecekteki işlemlerde daha fazla kâr için %0 ücretli bir builder\'a geçin.'),
  'result.alreadyZero': e("You're already on a 0% fee builder — nicely done!",'你已经在用 0% 费率的 Builder 了——做得好！','すでに0%手数料のビルダーを使用中——すばらしい！','이미 0% 수수료 빌더를 사용 중입니다 — 잘하셨어요!','Ya estás con un builder sin comisión — ¡bien hecho!','Vous êtes déjà sur un builder à 0% — bien joué !','Sie nutzen bereits einen 0%-Builder — gut gemacht!','Você já está em um builder 0% — muito bem!','Вы уже используете билдера с 0% комиссией — отлично!','Zaten %0 ücretli bir builder kullanıyorsunuz — harika!'),
  'result.noHistory': e('No trading history found for this address on Hyperliquid','该地址在 Hyperliquid 上无交易记录','このアドレスのHyperliquidでの取引履歴が見つかりません','이 주소의 Hyperliquid 거래 내역을 찾을 수 없습니다','No se encontró historial de trading para esta dirección','Aucun historique de trading trouvé pour cette adresse','Keine Handelshistorie für diese Adresse gefunden','Nenhum histórico encontrado para este endereço','История торговли не найдена для этого адреса','Bu adres için işlem geçmişi bulunamadı'),
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
  'table.showing': e('Showing {n} top wallets and frontends. Switch to "All Builders" to see all {total}.','正在显示 {n} 个精选钱包和前端。切换到"所有 Builders"查看全部 {total} 个。','上位 {n} のウォレットとフロントエンドを表示中。「すべてのビルダー」に切り替えると全 {total} を表示。','{n}개의 추천 지갑 표시 중. "모든 빌더"로 전환하면 전체 {total}개를 볼 수 있습니다.','Mostrando {n} billeteras principales. Cambia a "Todos" para ver los {total}.','Affichage de {n} wallets. Passez à "Tous" pour voir les {total}.','Zeige {n} Top-Wallets. Wechsle zu "Alle" um alle {total} zu sehen.','{n} carteiras exibidas. Mude para "Todos" para ver todos os {total}.','Показано {n} лучших кошельков. Переключитесь на "Все" для просмотра {total}.','En iyi {n} cüzdan gösteriliyor. Tümünü görmek için "Tüm Builderlar"a geçin ({total}).'),
  'table.trackingInfo': e('{n} builders tracked. Data from HyperTracker.','已追踪 {n} 个 builders。数据来自 HyperTracker。','{n} ビルダーを追跡中。データ出典：HyperTracker。','{n}개 빌더 추적 중. 데이터 출처: HyperTracker.','{n} builders rastreados. Datos de HyperTracker.','{n} builders suivis. Données de HyperTracker.','{n} Builder verfolgt. Daten von HyperTracker.','{n} builders monitorados. Dados do HyperTracker.','Отслеживается {n} билдеров. Данные из HyperTracker.','{n} builder izleniyor. Veriler HyperTracker\'dan.'),
  'table.failedToLoad': e('Failed to load:','加载失败：','読み込み失敗：','로드 실패:','Error al cargar:','Échec du chargement :','Laden fehlgeschlagen:','Falha ao carregar:','Ошибка загрузки:','Yükleme hatası:'),
  'table.iOSApp': e('iOS App','iOS 应用','iOSアプリ','iOS 앱','App iOS','App iOS','iOS App','App iOS','iOS App','iOS Uygulama'),
  'table.androidApp': e('Android App','Android 应用','Androidアプリ','Android 앱','App Android','App Android','Android App','App Android','Android App','Android Uygulama'),
  'table.desktopApp': e('Desktop App','桌面应用','デスクトップアプリ','데스크톱 앱','App Escritorio','App Bureau','Desktop App','App Desktop','Desktop App','Masaüstü Uygulama'),
  'table.browserExt': e('Browser Extension','浏览器扩展','ブラウザ拡張','브라우저 확장','Extensión','Extension','Erweiterung','Extensão','Расширение','Tarayıcı Eklentisi'),
  'table.webApp': e('Web App','网页应用','Webアプリ','웹 앱','App Web','App Web','Web App','App Web','Веб-приложение','Web Uygulama'),

  // ── Switch Builder ──
  'switch.title': e('Switch to 0% builder fees','切换到 0% Builder 费用','0% ビルダー手数料に切替','0% 빌더 수수료로 전환','Cambia a 0% de comisión','Passez à 0% de frais builder','Zu 0% Builder-Gebühren wechseln','Mude para 0% de taxa builder','Переключиться на 0% комиссию','%0 builder ücretine geç'),
  'switch.subtitle': e('0.10% per trade = $1,000 on every $1M volume. Connect your wallet to switch.','0.10% 每笔 = 每百万美金交易量多付 $1,000。连接钱包即可切换。','0.10%/取引 = 100万ドルの取引量で1,000ドル。ウォレットを接続して切り替え。','0.10%/거래 = $1M 거래량당 $1,000. 지갑을 연결하여 전환하세요.','0.10% por trade = $1,000 por cada $1M. Conecta tu billetera.','0.10% par trade = 1 000 $ par million. Connectez votre wallet.','0.10% pro Trade = 1.000 $ pro 1M Volumen. Wallet verbinden.','0.10% por trade = $1.000 a cada $1M. Conecte sua carteira.','0.10% за сделку = $1,000 за каждый $1M объёма. Подключите кошелёк.','İşlem başına %0,10 = her 1M$ hacimde 1.000$. Cüzdanınızı bağlayın.'),
  'switch.connectWallet': e('Connect Wallet','连接钱包','ウォレット接続','지갑 연결','Conectar Billetera','Connecter Wallet','Wallet Verbinden','Conectar Carteira','Подключить Кошелёк','Cüzdan Bağla'),
  'switch.approve': e('Approve 0% builder fee','确认 0% Builder 费率','0% ビルダー手数料を承認','0% 빌더 수수료 승인','Aprobar comisión 0%','Approuver frais 0%','0%-Gebühr genehmigen','Aprovar taxa 0%','Одобрить 0% комиссию','%0 ücreti onayla'),
  'switch.referral': e('Apply referral discount (optional)','应用推荐折扣（可选）','紹介割引を適用（任意）','추천 할인 적용 (선택)','Aplicar descuento (opcional)','Appliquer parrainage (optionnel)','Empfehlungsrabatt (optional)','Aplicar desconto (opcional)','Применить реферальную скидку','Referans indirimi uygula (opsiyonel)'),
  'switch.waitingSignature': e('Waiting for signature...','等待签名...','署名待ち...','서명 대기 중...','Esperando firma...','En attente de signature...','Warte auf Signatur...','Aguardando assinatura...','Ожидание подписи...','İmza bekleniyor...'),
  'switch.settingReferral': e('Setting referral...','设置推荐码...','紹介コード設定中...','추천 코드 설정 중...','Configurando referido...','Configuration parrainage...','Empfehlung einrichten...','Configurando referência...','Установка реферала...','Referans ayarlanıyor...'),
  'switch.switchBtn': e('Switch to 0% Fee','切换到 0% 费率','0%手数料に切替','0% 수수료로 전환','Cambiar a 0%','Passer à 0%','Zu 0% wechseln','Mudar para 0%','Переключить на 0%','%0\'a Geç'),
  'switch.twoSignatures': e('Two signatures required — no gas fees, no funds transferred.','需要两次签名 — 无 gas 费用，无资金转移。','2つの署名が必要 — ガス代なし、資金移動なし。','서명 2회 필요 — 가스비 없음, 자금 이동 없음.','Dos firmas — sin gas, sin transferencias.','Deux signatures — sans gas, sans transfert.','Zwei Signaturen — keine Gasgebühren, keine Transfers.','Duas assinaturas — sem gas, sem transferências.','Две подписи — без газа, без переводов.','İki imza gerekli — gas ücreti yok, fon transferi yok.'),
  'switch.success': e("You're set — 0% builder fees",'已设置 — 0% Builder 费用','設定完了 — 0% ビルダー手数料','설정 완료 — 0% 빌더 수수료','Listo — 0% comisión','C\'est fait — 0% frais','Fertig — 0% Gebühren','Pronto — 0% taxa','Готово — 0% комиссии','Hazır — %0 builder ücreti'),
  'switch.approvalConfirmed': e('Builder approval confirmed','Builder 授权已确认','ビルダー承認完了','빌더 승인 완료','Aprobación confirmada','Approbation confirmée','Genehmigung bestätigt','Aprovação confirmada','Одобрение подтверждено','Builder onayı alındı'),
  'switch.referralApplied': e(' and referral code applied',' 并已应用推荐码','、紹介コード適用済み',' 및 추천 코드 적용됨',' y código de referido aplicado',' et code de parrainage appliqué',' und Empfehlungscode angewendet',' e código de referência aplicado',' и реферальный код применён',' ve referans kodu uygulandı'),
  'switch.futureTradesSub': e('Your future trades will use 0% builder fees.','你未来的交易将使用 0% Builder 费率。','今後の取引は0%ビルダー手数料を使用します。','향후 거래에 0% 빌더 수수료가 적용됩니다.','Tus futuras operaciones usarán 0% de comisión.','Vos futurs trades utiliseront 0% de frais.','Ihre zukünftigen Trades verwenden 0% Gebühren.','Seus futuros trades usarão 0% de taxa.','Ваши будущие сделки будут с 0% комиссией.','Gelecek işlemleriniz %0 builder ücreti kullanacak.'),
  'switch.disconnect': e('Disconnect wallet','断开钱包','ウォレットを切断','지갑 연결 해제','Desconectar billetera','Déconnecter le wallet','Wallet trennen','Desconectar carteira','Отключить кошелёк','Cüzdanı ayır'),

  // ── Fee Counter ──
  'counter.avoidableFees': e('in avoidable fees','可避免的费用','回避可能な手数料','절약 가능한 수수료','en comisiones evitables','en frais évitables','an vermeidbaren Gebühren','em taxas evitáveis','избежимых комиссий','önlenebilir ücretlerde'),

  // ── Section Headings ──
  'section.whatAre': e('What Are Hyperliquid Builder Fees?','什么是 Hyperliquid Builder 费用？','Hyperliquid ビルダー手数料とは？','Hyperliquid 빌더 수수료란?','¿Qué son las comisiones de Builder?','Que sont les frais Builder ?','Was sind Builder-Gebühren?','O que são taxas Builder?','Что такое комиссии билдеров?','Builder Ücretleri Nedir?'),
  'section.comparison': e('Builder Fee Comparison','Builder 费用对比','ビルダー手数料比較','빌더 수수료 비교','Comparación de Comisiones','Comparaison des Frais','Gebührenvergleich','Comparação de Taxas','Сравнение Комиссий','Ücret Karşılaştırması'),
  'section.calculator': e('Fee Calculator','费用计算器','手数料カリキュレーター','수수료 계산기','Calculadora','Calculateur','Gebührenrechner','Calculadora','Калькулятор','Ücret Hesaplayıcı'),
  'section.howItWorks': e('How Builder Fees Work','Builder 费用如何运作','ビルダー手数料の仕組み','빌더 수수료 작동 방식','Cómo Funcionan','Comment ça Marche','Wie es Funktioniert','Como Funciona','Как Это Работает','Nasıl Çalışır'),
  'section.faq': e('Frequently Asked Questions','常见问题','よくある質問','자주 묻는 질문','Preguntas Frecuentes','Questions Fréquentes','Häufige Fragen','Perguntas Frequentes','Часто Задаваемые Вопросы','Sıkça Sorulan Sorular'),

  // ── About Section paragraphs ──
  'about.p1': e(
    'Third-party wallets like Phantom, MetaMask, and Rabby attach a <b>builder fee</b> to every trade you execute on Hyperliquid. This is charged on top of the exchange\'s base fees (0.035% taker / 0.01% maker at VIP 0).',
    '第三方钱包如 Phantom、MetaMask 和 Rabby 会在你在 Hyperliquid 执行的每笔交易上附加一笔 <b>Builder 费用</b>。这是在交易所基础费率（VIP 0 时 Taker 0.035% / Maker 0.01%）之上额外收取的。',
    'Phantom、MetaMask、Rabbyなどのサードパーティウォレットは、Hyperliquidで実行するすべての取引に<b>ビルダー手数料</b>を追加します。これは取引所の基本手数料（VIP 0でテイカー0.035%/メイカー0.01%）の上に課金されます。',
    'Phantom, MetaMask, Rabby 같은 서드파티 지갑은 Hyperliquid에서 실행하는 모든 거래에 <b>빌더 수수료</b>를 부과합니다. 이는 거래소 기본 수수료(VIP 0 기준 Taker 0.035% / Maker 0.01%) 위에 추가로 부과됩니다.',
    'Billeteras como Phantom, MetaMask y Rabby agregan una <b>comisión de builder</b> a cada operación en Hyperliquid, además de las comisiones base del exchange (0.035% taker / 0.01% maker en VIP 0).',
    'Les wallets comme Phantom, MetaMask et Rabby ajoutent des <b>frais de builder</b> à chaque trade sur Hyperliquid, en plus des frais de base (0.035% taker / 0.01% maker au VIP 0).',
    'Drittanbieter-Wallets wie Phantom, MetaMask und Rabby erheben eine <b>Builder-Gebühr</b> auf jeden Trade auf Hyperliquid, zusätzlich zu den Basis-Börsengebühren (0,035% Taker / 0,01% Maker bei VIP 0).',
    'Carteiras como Phantom, MetaMask e Rabby adicionam uma <b>taxa de builder</b> a cada trade na Hyperliquid, além das taxas base da exchange (0,035% taker / 0,01% maker no VIP 0).',
    'Сторонние кошельки, такие как Phantom, MetaMask и Rabby, добавляют <b>комиссию билдера</b> к каждой сделке на Hyperliquid поверх базовых комиссий (0,035% тейкер / 0,01% мейкер на VIP 0).',
    'Phantom, MetaMask ve Rabby gibi üçüncü taraf cüzdanlar, Hyperliquid\'deki her işleme <b>builder ücreti</b> ekler. Bu, borsanın temel ücretlerine (VIP 0\'da %0,035 taker / %0,01 maker) ek olarak alınır.',
  ),
  'about.p2': e(
    'Builder fees range from <b>0% to 0.10%</b>. At the maximum rate, $1M in monthly volume costs you an extra <b>$1,000</b> — paid to the wallet provider, not Hyperliquid.',
    'Builder 费率范围为 <b>0% 到 0.10%</b>。按最高费率计算，每月 100 万美元交易量将额外支付 <b>$1,000</b> —— 这笔钱支付给钱包提供商，而非 Hyperliquid。',
    'ビルダー手数料は<b>0%〜0.10%</b>です。最大レートで月間100万ドルの取引量の場合、追加で<b>$1,000</b>が発生し、Hyperliquidではなくウォレットプロバイダーに支払われます。',
    '빌더 수수료는 <b>0%에서 0.10%</b>까지입니다. 최대 요율로 월 $1M 거래 시 추가로 <b>$1,000</b>이 발생하며, 이는 Hyperliquid가 아닌 지갑 제공업체에 지급됩니다.',
    'Las comisiones van de <b>0% a 0.10%</b>. Con la tarifa máxima, $1M de volumen mensual te cuesta <b>$1,000</b> extra — pagado al proveedor de la billetera.',
    'Les frais vont de <b>0% à 0.10%</b>. Au taux maximum, 1M$ de volume mensuel coûte <b>1 000 $</b> supplémentaires — payés au fournisseur du wallet.',
    'Die Gebühren reichen von <b>0% bis 0,10%</b>. Beim Höchstsatz kosten 1M$ monatliches Volumen zusätzlich <b>1.000 $</b> — gezahlt an den Wallet-Anbieter.',
    'As taxas variam de <b>0% a 0,10%</b>. Na taxa máxima, $1M de volume mensal custa <b>$1.000</b> extras — pagos ao provedor da carteira.',
    'Комиссии варьируются от <b>0% до 0,10%</b>. При максимальной ставке $1M месячного объёма обходится в дополнительные <b>$1,000</b> — оплачиваемые провайдеру кошелька.',
    'Builder ücretleri <b>%0 ile %0,10</b> arasındadır. Maksimum oranda aylık 1M$ hacim, cüzdan sağlayıcısına ödenen <b>1.000 $</b> ekstra maliyet demektir.',
  ),
  'about.p3': e(
    'Some wallets charge nothing. OneKey has a 0% builder fee. HypeFees exists to make this visible and help you choose.',
    '有些钱包完全免费。OneKey 的 Builder 费率为 0%。HypeFees 的使命就是让这些信息透明，帮助你做出选择。',
    '手数料がかからないウォレットもあります。OneKeyのビルダー手数料は0%です。HypeFeesはこの情報を可視化し、選択を支援します。',
    '수수료를 부과하지 않는 지갑도 있습니다. OneKey의 빌더 수수료는 0%입니다. HypeFees는 이 정보를 투명하게 공개하여 선택을 돕습니다.',
    'Algunas billeteras no cobran nada. OneKey tiene 0% de comisión. HypeFees existe para hacer visible esta información.',
    'Certains wallets ne facturent rien. OneKey a des frais à 0%. HypeFees rend ces informations visibles pour vous aider à choisir.',
    'Manche Wallets verlangen nichts. OneKey hat 0% Builder-Gebühr. HypeFees macht diese Informationen sichtbar.',
    'Algumas carteiras não cobram nada. A OneKey tem 0% de taxa. O HypeFees torna isso visível para ajudar na sua escolha.',
    'Некоторые кошельки не берут ничего. У OneKey комиссия 0%. HypeFees делает эту информацию прозрачной.',
    'Bazı cüzdanlar hiç ücret almaz. OneKey\'in builder ücreti %0\'dır. HypeFees bu bilgiyi şeffaf hale getirir.',
  ),

  // ── Comparison subtitle ──
  'comparison.subtitle': e('240+ wallets and frontends compared. Your total cost = Hyperliquid base fee + builder fee.','240+ 钱包和前端对比。你的总成本 = Hyperliquid 基础费用 + Builder 费用。','240以上のウォレットとフロントエンドを比較。総コスト = Hyperliquid基本手数料 + ビルダー手数料。','240개 이상의 지갑과 프론트엔드 비교. 총 비용 = Hyperliquid 기본 수수료 + 빌더 수수료.','240+ billeteras comparadas. Costo total = comisión base + comisión builder.','240+ wallets comparés. Coût total = frais de base + frais builder.','240+ Wallets verglichen. Gesamtkosten = Basisgebühr + Builder-Gebühr.','240+ carteiras comparadas. Custo total = taxa base + taxa builder.','240+ кошельков сравнено. Общая стоимость = базовая комиссия + комиссия билдера.','240+ cüzdan karşılaştırıldı. Toplam maliyet = temel ücret + builder ücreti.'),
  'calculator.subtitle': e('How builder fees compound across different volumes.','不同交易量下 Builder 费用的复合效应。','取引量別のビルダー手数料の累積効果。','거래량별 빌더 수수료의 복합 효과.','Cómo se acumulan las comisiones con diferentes volúmenes.','Comment les frais se cumulent selon les volumes.','Wie sich Builder-Gebühren bei verschiedenen Volumina summieren.','Como as taxas se acumulam em diferentes volumes.','Как комиссии билдера накапливаются при разных объёмах.','Farklı hacimlerde builder ücretlerinin bileşik etkisi.'),

  // ── How It Works section ──
  'how.p1': e(
    'Wallets register as "builders" on Hyperliquid and set a fee rate. Every order placed through that wallet includes the builder fee automatically. The maximum is 0.10% (10 basis points) on perpetual contracts.',
    '钱包在 Hyperliquid 上注册为"Builder"并设定费率。通过该钱包下的每笔订单会自动包含 Builder 费用。永续合约的最高费率为 0.10%（10 个基点）。',
    'ウォレットはHyperliquidで「ビルダー」として登録し、手数料率を設定します。そのウォレットを通じたすべての注文にビルダー手数料が自動的に含まれます。永久契約の上限は0.10%（10ベーシスポイント）です。',
    '지갑은 Hyperliquid에 "빌더"로 등록하고 수수료율을 설정합니다. 해당 지갑을 통한 모든 주문에 빌더 수수료가 자동 포함됩니다. 무기한 계약 최대 수수료는 0.10%(10bp)입니다.',
    'Las billeteras se registran como "builders" en Hyperliquid y establecen una tarifa. Cada orden incluye la comisión automáticamente. El máximo es 0.10% en perpetuos.',
    'Les wallets s\'inscrivent comme "builders" sur Hyperliquid et définissent un taux. Chaque ordre inclut automatiquement les frais. Le maximum est 0.10% sur les perpétuels.',
    'Wallets registrieren sich als „Builder" bei Hyperliquid und legen einen Gebührensatz fest. Jede Order enthält die Builder-Gebühr automatisch. Maximum: 0,10% bei Perpetuals.',
    'Carteiras se registram como "builders" na Hyperliquid e definem uma taxa. Cada ordem inclui a taxa automaticamente. O máximo é 0,10% em contratos perpétuos.',
    'Кошельки регистрируются как «билдеры» на Hyperliquid и устанавливают ставку. Каждый ордер автоматически включает комиссию билдера. Максимум — 0,10% на бессрочных контрактах.',
    'Cüzdanlar Hyperliquid\'de "builder" olarak kayıt olur ve ücret oranını belirler. Her emir otomatik olarak builder ücretini içerir. Perpetual sözleşmelerde maksimum %0,10\'dur.',
  ),
  'how.vipTitle': e('Base Exchange Fees by VIP Tier','各 VIP 等级的基础交易所费率','VIPティア別の基本取引所手数料','VIP 등급별 기본 거래소 수수료','Comisiones Base por Nivel VIP','Frais de Base par Niveau VIP','Basis-Börsengebühren nach VIP-Stufe','Taxas Base por Nível VIP','Базовые Комиссии по VIP-Уровням','VIP Seviyesine Göre Temel Ücretler'),
  'how.tier': e('Tier','等级','ティア','등급','Nivel','Niveau','Stufe','Nível','Уровень','Seviye'),
  'how.14dVolume': e('14-Day Volume','14 天交易量','14日間取引量','14일 거래량','Volumen 14 Días','Volume 14 Jours','14-Tage-Volumen','Volume 14 Dias','14-дн. Объём','14 Gün Hacim'),
  'how.taker': e('Taker','Taker','テイカー','테이커','Taker','Taker','Taker','Taker','Тейкер','Taker'),
  'how.maker': e('Maker','Maker','メイカー','메이커','Maker','Maker','Maker','Maker','Мейкер','Maker'),
  'how.p2': e(
    'Your effective rate = base fee + builder fee. A VIP 0 taker with a 0.05% builder pays 0.085% total. With a 0% builder, you pay only 0.035%.',
    '你的有效费率 = 基础费用 + Builder 费用。VIP 0 的 Taker 使用 0.05% Builder 费率时总费率为 0.085%。使用 0% Builder 时，你只需支付 0.035%。',
    '実効レート = 基本手数料 + ビルダー手数料。VIP 0のテイカーで0.05%ビルダーの場合、合計0.085%。0%ビルダーなら0.035%のみ。',
    '유효 수수료율 = 기본 수수료 + 빌더 수수료. VIP 0 테이커가 0.05% 빌더를 사용하면 총 0.085%. 0% 빌더를 사용하면 0.035%만 지불.',
    'Tu tasa efectiva = comisión base + builder. Un taker VIP 0 con 0.05% builder paga 0.085% total. Con 0%, pagas solo 0.035%.',
    'Votre taux effectif = frais de base + builder. Un taker VIP 0 avec 0.05% builder paie 0.085% au total. Avec 0%, seulement 0.035%.',
    'Ihr effektiver Satz = Basisgebühr + Builder. Ein VIP 0 Taker mit 0,05% Builder zahlt 0,085%. Mit 0% Builder nur 0,035%.',
    'Sua taxa efetiva = taxa base + builder. Um taker VIP 0 com builder 0,05% paga 0,085% no total. Com 0%, paga apenas 0,035%.',
    'Эффективная ставка = базовая + билдер. Тейкер VIP 0 с билдером 0,05% платит 0,085%. С билдером 0% — только 0,035%.',
    'Efektif oranınız = temel ücret + builder. %0,05 builder\'lı VIP 0 taker toplamda %0,085 öder. %0 builder ile sadece %0,035.',
  ),
  'how.switchTitle': e('Switching Builders','切换 Builder','ビルダーの切り替え','빌더 전환','Cambiar de Builder','Changer de Builder','Builder Wechseln','Trocar de Builder','Переключение Билдеров','Builder Değiştirme'),
  'how.switchP': e(
    'Sign an EIP-712 message called <code>approveBuilderFee</code> — no gas, no fund transfers. Up to 10 active builder approvals. Switch back anytime.',
    '签署一条名为 <code>approveBuilderFee</code> 的 EIP-712 消息 — 无 gas 费用，无资金转移。最多可有 10 个活跃的 Builder 授权。随时可以切换回来。',
    '<code>approveBuilderFee</code>というEIP-712メッセージに署名します — ガス代なし、資金移動なし。最大10のアクティブなビルダー承認。いつでも元に戻せます。',
    '<code>approveBuilderFee</code>라는 EIP-712 메시지에 서명합니다 — 가스비 없음, 자금 이동 없음. 최대 10개의 활성 빌더 승인. 언제든 전환 가능.',
    'Firma un mensaje EIP-712 llamado <code>approveBuilderFee</code> — sin gas, sin transferencias. Hasta 10 aprobaciones activas. Cambia cuando quieras.',
    'Signez un message EIP-712 appelé <code>approveBuilderFee</code> — sans gas, sans transfert. Jusqu\'à 10 approbations actives. Revenez quand vous voulez.',
    'Unterzeichnen Sie eine EIP-712-Nachricht <code>approveBuilderFee</code> — kein Gas, keine Transfers. Bis zu 10 aktive Genehmigungen. Jederzeit wechselbar.',
    'Assine uma mensagem EIP-712 chamada <code>approveBuilderFee</code> — sem gas, sem transferências. Até 10 aprovações ativas. Troque a qualquer momento.',
    'Подпишите EIP-712 сообщение <code>approveBuilderFee</code> — без газа, без переводов. До 10 активных одобрений. Переключайтесь в любое время.',
    '<code>approveBuilderFee</code> adlı EIP-712 mesajını imzalayın — gas yok, fon transferi yok. 10\'a kadar aktif onay. İstediğiniz zaman geri dönün.',
  ),

  // ── FAQ ──
  'faq.q1': e('What is a Hyperliquid builder fee?','什么是 Hyperliquid Builder 费用？','Hyperliquid ビルダー手数料とは？','Hyperliquid 빌더 수수료란?','¿Qué es una comisión de builder?','Qu\'est-ce que les frais builder ?','Was ist eine Builder-Gebühr?','O que é uma taxa builder?','Что такое комиссия билдера?','Builder ücreti nedir?'),
  'faq.a1': e('An additional fee your wallet charges on top of Hyperliquid\'s exchange fees. Rates are set by each wallet independently and range from 0% to 0.10%. The fee goes to the wallet provider.','你的钱包在 Hyperliquid 交易所费用之上收取的额外费用。费率由每个钱包独立设定，范围为 0% 到 0.10%。费用支付给钱包提供商。','Hyperliquidの取引所手数料に加えてウォレットが課す追加手数料。各ウォレットが独自に設定し、0%〜0.10%の範囲です。手数料はウォレットプロバイダーに支払われます。','Hyperliquid 거래소 수수료 위에 지갑이 부과하는 추가 수수료입니다. 각 지갑이 독립적으로 설정하며 0%~0.10% 범위입니다.','Comisión adicional que tu billetera cobra sobre las comisiones del exchange. Van del 0% al 0.10% y se pagan al proveedor.','Frais supplémentaires que votre wallet facture en plus des frais d\'échange. De 0% à 0.10%, payés au fournisseur du wallet.','Zusätzliche Gebühr Ihres Wallets über den Börsengebühren. 0% bis 0,10%, gezahlt an den Wallet-Anbieter.','Taxa adicional que sua carteira cobra além das taxas da exchange. De 0% a 0,10%, paga ao provedor.','Дополнительная комиссия кошелька сверх комиссий биржи. От 0% до 0,10%, уплачивается провайдеру кошелька.','Cüzdanınızın borsa ücretlerine ek olarak aldığı ücret. %0-%0,10 arasında olup cüzdan sağlayıcısına ödenir.'),
  'faq.q2': e('Which wallets have the lowest fees?','哪些钱包费率最低？','最も手数料が低いウォレットは？','수수료가 가장 낮은 지갑은?','¿Qué billeteras tienen las comisiones más bajas?','Quels wallets ont les frais les plus bas ?','Welche Wallets haben die niedrigsten Gebühren?','Quais carteiras têm as menores taxas?','Какие кошельки имеют самые низкие комиссии?','En düşük ücretli cüzdanlar hangileri?'),
  'faq.a2': e('OneKey charges 0%. Several others also offer 0% builder fees. See the comparison table above.','OneKey 收费 0%。其他几个钱包也提供 0% 的 Builder 费率。请查看上方对比表。','OneKeyは0%です。他にも0%のビルダー手数料を提供するウォレットがあります。上の比較表をご覧ください。','OneKey는 0%입니다. 다른 여러 지갑도 0% 빌더 수수료를 제공합니다. 위의 비교표를 참조하세요.','OneKey cobra 0%. Otras también ofrecen 0%. Consulta la tabla de comparación.','OneKey facture 0%. D\'autres offrent aussi 0%. Voir le tableau comparatif ci-dessus.','OneKey berechnet 0%. Weitere bieten ebenfalls 0%. Siehe Vergleichstabelle oben.','OneKey cobra 0%. Outras também oferecem 0%. Veja a tabela de comparação.','OneKey берёт 0%. Другие тоже предлагают 0%. См. таблицу сравнения выше.','OneKey %0 alır. Diğerleri de %0 sunar. Yukarıdaki karşılaştırma tablosuna bakın.'),
  'faq.q3': e('How much can builder fees cost per year?','Builder 费用每年能花多少钱？','ビルダー手数料の年間コストは？','빌더 수수료는 연간 얼마나 드나요?','¿Cuánto pueden costar al año?','Combien coûtent-ils par an ?','Was kosten sie pro Jahr?','Quanto custam por ano?','Сколько стоят в год?','Yıllık ne kadara mal olur?'),
  'faq.a3': e('At $1M/month volume: Phantom (0.05%) costs $6,000/year. MetaMask (0.10%) costs $12,000/year. A 0% builder costs $0.','以每月 100 万美元交易量计算：Phantom (0.05%) 每年花费 $6,000。MetaMask (0.10%) 每年花费 $12,000。0% Builder 花费 $0。','月間100万ドルの取引量の場合：Phantom（0.05%）は年間6,000ドル。MetaMask（0.10%）は年間12,000ドル。0%ビルダーは0ドル。','월 $1M 거래량 기준: Phantom(0.05%)은 연 $6,000. MetaMask(0.10%)은 연 $12,000. 0% 빌더는 $0.','Con $1M/mes: Phantom (0.05%) cuesta $6,000/año. MetaMask (0.10%) cuesta $12,000/año. Un builder al 0% cuesta $0.','Avec 1M$/mois : Phantom (0.05%) coûte 6 000 $/an. MetaMask (0.10%) coûte 12 000 $/an. Un builder à 0% = 0 $.','Bei 1M$/Monat: Phantom (0,05%) kostet 6.000 $/Jahr. MetaMask (0,10%) kostet 12.000 $/Jahr. 0%-Builder = 0 $.','Com $1M/mês: Phantom (0,05%) custa $6.000/ano. MetaMask (0,10%) custa $12.000/ano. Builder 0% = $0.','При $1M/мес.: Phantom (0,05%) — $6,000/год. MetaMask (0,10%) — $12,000/год. Билдер 0% — $0.','Aylık 1M$ hacimde: Phantom (%0,05) yılda 6.000$. MetaMask (%0,10) yılda 12.000$. %0 builder = 0$.'),
  'faq.q4': e('How do I switch builders?','如何切换 Builder？','ビルダーの切り替え方法は？','빌더를 어떻게 전환하나요?','¿Cómo cambio de builder?','Comment changer de builder ?','Wie wechsle ich den Builder?','Como trocar de builder?','Как переключить билдера?','Builder nasıl değiştirilir?'),
  'faq.a4': e('Connect your wallet and sign an EIP-712 message. No gas fees, no fund transfers. Takes effect immediately. Your positions and history are not affected.','连接你的钱包并签署一条 EIP-712 消息。无 gas 费用，无资金转移。立即生效。你的持仓和历史不受影响。','ウォレットを接続してEIP-712メッセージに署名します。ガス代なし、資金移動なし。即座に有効。ポジションと履歴には影響しません。','지갑을 연결하고 EIP-712 메시지에 서명하세요. 가스비 없음, 자금 이동 없음. 즉시 적용. 포지션과 내역에 영향 없음.','Conecta tu billetera y firma un mensaje EIP-712. Sin gas, sin transferencias. Efecto inmediato.','Connectez votre wallet et signez un message EIP-712. Sans gas, sans transfert. Effet immédiat.','Verbinden Sie Ihr Wallet und unterschreiben Sie eine EIP-712-Nachricht. Kein Gas, keine Transfers. Sofortige Wirkung.','Conecte sua carteira e assine uma mensagem EIP-712. Sem gas, sem transferências. Efeito imediato.','Подключите кошелёк и подпишите EIP-712 сообщение. Без газа, без переводов. Вступает в силу немедленно.','Cüzdanınızı bağlayın ve EIP-712 mesajını imzalayın. Gas yok, transfer yok. Hemen geçerli.'),
  'faq.q5': e('Is switching safe?','切换安全吗？','切り替えは安全ですか？','전환은 안전한가요?','¿Es seguro cambiar?','Le changement est-il sûr ?','Ist der Wechsel sicher?','A troca é segura?','Безопасно ли переключение?','Değiştirmek güvenli mi?'),
  'faq.a5': e("Yes. You're only signing a message — no tokens approved, no smart contract calls, no funds moved. You can have up to 10 active builder approvals and switch back anytime.",'是的。你只是签署一条消息 — 不批准任何代币，不调用智能合约，不移动资金。你最多可以有 10 个活跃的 Builder 授权，随时可以切换回来。','はい。メッセージに署名するだけです — トークンの承認なし、スマートコントラクト呼び出しなし、資金移動なし。最大10のアクティブな承認を持て、いつでも戻せます。','네. 메시지에 서명하는 것뿐입니다 — 토큰 승인 없음, 스마트 계약 호출 없음, 자금 이동 없음. 최대 10개의 활성 승인을 가질 수 있으며 언제든 전환 가능합니다.','Sí. Solo firmas un mensaje — sin tokens aprobados, sin llamadas a contratos, sin movimiento de fondos. Hasta 10 aprobaciones activas.','Oui. Vous ne signez qu\'un message — pas de tokens approuvés, pas d\'appels de contrats, pas de fonds déplacés. Jusqu\'à 10 approbations actives.','Ja. Sie unterzeichnen nur eine Nachricht — keine Token-Genehmigungen, keine Smart-Contract-Aufrufe, keine Fondsbewegungen. Bis zu 10 aktive Genehmigungen.','Sim. Você apenas assina uma mensagem — sem aprovação de tokens, sem chamadas de contrato, sem movimentação de fundos. Até 10 aprovações ativas.','Да. Вы только подписываете сообщение — без одобрения токенов, без вызовов контрактов, без перемещения средств. До 10 активных одобрений.','Evet. Sadece mesaj imzalıyorsunuz — token onayı yok, akıllı sözleşme çağrısı yok, fon hareketi yok. 10\'a kadar aktif onay.'),
  'faq.q6': e('Does Phantom charge a builder fee?','Phantom 收取 Builder 费用吗？','Phantomはビルダー手数料を課しますか？','Phantom은 빌더 수수료를 부과하나요?','¿Phantom cobra comisión de builder?','Phantom facture-t-il des frais builder ?','Erhebt Phantom eine Builder-Gebühr?','A Phantom cobra taxa builder?','Phantom взимает комиссию билдера?','Phantom builder ücreti alıyor mu?'),
  'faq.a6': e("Yes — 0.05%. On $1M volume, that's $500 extra. Effective VIP 0 taker rate: 0.085%.",'是的 — 0.05%。100 万美元交易量下，这意味着额外 $500。VIP 0 Taker 有效费率：0.085%。','はい — 0.05%。100万ドルの取引量で500ドル追加。VIP 0テイカーの実効レート：0.085%。','네 — 0.05%. $1M 거래량에서 $500 추가. VIP 0 테이커 유효 수수료율: 0.085%.','Sí — 0.05%. Con $1M, $500 extra. Tasa taker VIP 0 efectiva: 0.085%.','Oui — 0.05%. Sur 1M$, 500 $ de plus. Taux taker VIP 0 effectif : 0.085%.','Ja — 0,05%. Bei 1M$ Volumen sind das 500 $ extra. Effektiver VIP 0 Taker-Satz: 0,085%.','Sim — 0,05%. Em $1M, $500 extra. Taxa taker VIP 0 efetiva: 0,085%.','Да — 0,05%. При $1M объёма — $500 дополнительно. Эффективная ставка тейкера VIP 0: 0,085%.','Evet — %0,05. 1M$ hacimde 500$ ekstra. Efektif VIP 0 taker oranı: %0,085.'),
  'faq.q7': e('Does MetaMask charge a builder fee?','MetaMask 收取 Builder 费用吗？','MetaMaskはビルダー手数料を課しますか？','MetaMask은 빌더 수수료를 부과하나요?','¿MetaMask cobra comisión?','MetaMask facture-t-il des frais ?','Erhebt MetaMask eine Gebühr?','A MetaMask cobra taxa?','MetaMask взимает комиссию?','MetaMask ücret alıyor mu?'),
  'faq.a7': e("Yes — 0.10%, the maximum allowed. On $1M volume, that's $1,000.",'是的 — 0.10%，这是允许的最高费率。100 万美元交易量下需额外支付 $1,000。','はい — 0.10%、許可される最大値。100万ドルの取引量で1,000ドル。','네 — 0.10%, 허용 최대치. $1M 거래량에서 $1,000.','Sí — 0.10%, el máximo permitido. Con $1M, $1,000 extra.','Oui — 0.10%, le maximum autorisé. Sur 1M$, 1 000 $ de plus.','Ja — 0,10%, das erlaubte Maximum. Bei 1M$ Volumen 1.000 $.','Sim — 0,10%, o máximo permitido. Em $1M, $1.000 extra.','Да — 0,10%, максимально допустимая. При $1M объёма — $1,000.','Evet — izin verilen maksimum olan %0,10. 1M$ hacimde 1.000$.'),
  'faq.q8': e('Can I check my past builder fees?','我能查看我过去的 Builder 费用吗？','過去のビルダー手数料を確認できますか？','과거 빌더 수수료를 확인할 수 있나요?','¿Puedo verificar mis comisiones pasadas?','Puis-je vérifier mes frais passés ?','Kann ich vergangene Gebühren prüfen?','Posso verificar taxas anteriores?','Могу ли я проверить прошлые комиссии?','Geçmiş ücretlerimi kontrol edebilir miyim?'),
  'faq.a8': e("Enter your address at the top of this page. HypeFees pulls your full trade history from Hyperliquid's public API and breaks down exchange fees vs. builder fees.",'在本页顶部输入你的地址。HypeFees 会从 Hyperliquid 的公开 API 拉取你的完整交易历史，并分解交易所费用和 Builder 费用。','このページの上部にアドレスを入力してください。HypeFeesはHyperliquidの公開APIから完全な取引履歴を取得し、取引所手数料とビルダー手数料を分析します。','이 페이지 상단에 주소를 입력하세요. HypeFees는 Hyperliquid 공개 API에서 전체 거래 내역을 가져와 거래소 수수료와 빌더 수수료를 분석합니다.','Ingresa tu dirección arriba. HypeFees obtiene tu historial completo de la API pública de Hyperliquid.','Entrez votre adresse en haut. HypeFees récupère votre historique complet via l\'API publique d\'Hyperliquid.','Geben Sie Ihre Adresse oben ein. HypeFees ruft Ihre vollständige Handelshistorie über die öffentliche API ab.','Digite seu endereço acima. O HypeFees obtém seu histórico completo via API pública da Hyperliquid.','Введите адрес вверху страницы. HypeFees получает вашу полную историю торговли через публичный API Hyperliquid.','Sayfanın üstüne adresinizi girin. HypeFees, Hyperliquid\'in herkese açık API\'sinden tam işlem geçmişinizi çeker.'),
  'faq.q9': e('Where does this data come from?','数据从哪里来？','データの出典は？','데이터 출처는?','¿De dónde vienen los datos?','D\'où viennent les données ?','Woher stammen die Daten?','De onde vêm os dados?','Откуда берутся данные?','Veriler nereden geliyor?'),
  'faq.a9': e("Builder data from HyperTracker (CoinMarketMan). Fee breakdowns from Hyperliquid's public API. All on-chain and verifiable. HypeFees is independent and open-source.",'Builder 数据来自 HyperTracker (CoinMarketMan)。费用明细来自 Hyperliquid 的公开 API。所有数据都在链上，可验证。HypeFees 是独立的开源项目。','ビルダーデータはHyperTracker（CoinMarketMan）から。手数料内訳はHyperliquidの公開APIから。すべてオンチェーンで検証可能。HypeFeesは独立したオープンソースです。','빌더 데이터는 HyperTracker(CoinMarketMan)에서. 수수료 내역은 Hyperliquid 공개 API에서. 모두 온체인 검증 가능. HypeFees는 독립적인 오픈소스입니다.','Datos de HyperTracker (CoinMarketMan). Desglose de comisiones de la API pública. Todo verificable on-chain. HypeFees es independiente y open-source.','Données de HyperTracker (CoinMarketMan). Détails des frais via l\'API publique. Tout est vérifiable on-chain. HypeFees est indépendant et open-source.','Builder-Daten von HyperTracker (CoinMarketMan). Gebührendetails von der öffentlichen API. Alles on-chain verifizierbar. HypeFees ist unabhängig und Open-Source.','Dados de builders do HyperTracker (CoinMarketMan). Detalhes de taxas da API pública. Tudo verificável on-chain. HypeFees é independente e open-source.','Данные билдеров из HyperTracker (CoinMarketMan). Разбивка комиссий из публичного API. Всё on-chain и проверяемо. HypeFees — независимый open-source проект.','Builder verileri HyperTracker\'dan (CoinMarketMan). Ücret dağılımları herkese açık API\'den. Tümü zincir üzerinde ve doğrulanabilir. HypeFees bağımsız ve açık kaynaklıdır.'),

  // ── Share Card ──
  'share.title': e('Your Hyperliquid Wrapped','你的 Hyperliquid 年度报告','Hyperliquid ラップド','나의 Hyperliquid 래핑','Tu Hyperliquid Wrapped','Votre Hyperliquid Wrapped','Dein Hyperliquid Wrapped','Seu Hyperliquid Wrapped','Ваш Hyperliquid Wrapped','Hyperliquid Wrapped\'ınız'),
  'share.viewCard': e('View card →','查看卡片 →','カードを見る →','카드 보기 →','Ver tarjeta →','Voir la carte →','Karte ansehen →','Ver cartão →','Посмотреть →','Kartı gör →'),
  'share.download': e('Download Card','下载卡片','カードをダウンロード','카드 다운로드','Descargar','Télécharger','Herunterladen','Baixar','Скачать','İndir'),

  // ── Footer ──
  'footer.description': e('Independent, open-source Hyperliquid builder fee comparison tool. Compare wallet fees, check your spending, and switch to save. Not affiliated with Hyperliquid or any wallet provider.','独立的开源 Hyperliquid Builder 费用比较工具。比较钱包费用、检查你的支出、切换以节省。与 Hyperliquid 或任何钱包提供商无关。','独立したオープンソースのHyperliquidビルダー手数料比較ツール。ウォレット手数料の比較、支出の確認、節約のための切り替え。HyperliquidやウォレットプロバイダーとRは無関係です。','독립적인 오픈소스 Hyperliquid 빌더 수수료 비교 도구. 지갑 수수료 비교, 지출 확인, 절약을 위한 전환. Hyperliquid나 지갑 제공업체와 무관.','Herramienta open-source para comparar comisiones de builder en Hyperliquid. No afiliado a Hyperliquid ni a ningún proveedor.','Outil open-source de comparaison des frais builder Hyperliquid. Non affilié à Hyperliquid ou à un fournisseur de wallet.','Unabhängiges Open-Source-Tool zum Vergleich von Hyperliquid Builder-Gebühren. Nicht verbunden mit Hyperliquid oder Wallet-Anbietern.','Ferramenta open-source para comparar taxas de builder da Hyperliquid. Não afiliada à Hyperliquid ou provedores de carteira.','Независимый open-source инструмент сравнения комиссий билдеров Hyperliquid. Не связан с Hyperliquid или провайдерами кошельков.','Bağımsız, açık kaynaklı Hyperliquid builder ücreti karşılaştırma aracı. Hyperliquid veya herhangi bir cüzdan sağlayıcısıyla bağlantılı değildir.'),
  'footer.tools': e('Tools','工具','ツール','도구','Herramientas','Outils','Tools','Ferramentas','Инструменты','Araçlar'),
  'footer.feeLookup': e('Fee Lookup','费用查询','手数料検索','수수료 조회','Consulta de Comisiones','Recherche de Frais','Gebührensuche','Consulta de Taxas','Поиск Комиссий','Ücret Arama'),
  'footer.builderComparison': e('Builder Comparison','Builder 对比','ビルダー比較','빌더 비교','Comparación de Builders','Comparaison des Builders','Builder-Vergleich','Comparação de Builders','Сравнение Билдеров','Builder Karşılaştırma'),
  'footer.feeCalculator': e('Fee Calculator','费用计算器','手数料計算機','수수료 계산기','Calculadora','Calculateur','Rechner','Calculadora','Калькулятор','Hesaplayıcı'),
  'footer.oneClickSwitch': e('One-Click Switch','一键切换','ワンクリック切替','원클릭 전환','Cambio Rápido','Changement Rapide','Ein-Klick-Wechsel','Troca Rápida','Быстрое Переключение','Tek Tıkla Değiştir'),
  'footer.resources': e('Resources','资源','リソース','리소스','Recursos','Ressources','Ressourcen','Recursos','Ресурсы','Kaynaklar'),
  'footer.project': e('Project','项目','プロジェクト','프로젝트','Proyecto','Projet','Projekt','Projeto','Проект','Proje'),
  'footer.disclaimer1': e("Data sourced from Hyperliquid's public API and HyperTracker by CoinMarketMan. All fee data is on-chain and independently verifiable. Information is provided for reference only — always verify on-chain before making financial decisions.",'数据来源于 Hyperliquid 的公开 API 和 CoinMarketMan 的 HyperTracker。所有费用数据均在链上，可独立验证。信息仅供参考 — 在做出财务决策前请务必在链上验证。','データはHyperliquidの公開APIとCoinMarketManのHyperTrackerから取得。すべての手数料データはオンチェーンで独立検証可能。情報は参考用です — 金融決定前に必ずオンチェーンで確認してください。','데이터는 Hyperliquid 공개 API와 CoinMarketMan의 HyperTracker에서 제공됩니다. 모든 수수료 데이터는 온체인으로 독립적으로 검증 가능합니다. 재무 결정 전 반드시 온체인에서 확인하세요.','Datos de la API pública de Hyperliquid y HyperTracker. Todos los datos son verificables on-chain. Solo para referencia — siempre verifique antes de tomar decisiones financieras.','Données de l\'API publique d\'Hyperliquid et HyperTracker. Toutes les données sont vérifiables on-chain. À titre indicatif uniquement.','Daten aus der öffentlichen API von Hyperliquid und HyperTracker. Alle Daten sind on-chain verifizierbar. Nur zur Information — überprüfen Sie immer on-chain.','Dados da API pública da Hyperliquid e HyperTracker. Todos os dados são verificáveis on-chain. Apenas para referência — sempre verifique on-chain.','Данные из публичного API Hyperliquid и HyperTracker. Все данные on-chain и проверяемы. Только для справки — всегда проверяйте on-chain перед принятием финансовых решений.','Veriler Hyperliquid\'in herkese açık API\'sinden ve HyperTracker\'dan alınmıştır. Tüm veriler zincir üzerinde doğrulanabilir. Yalnızca referans amaçlıdır.'),
  'footer.disclaimer2': e('HypeFees is not a financial advisor. Trading perpetual futures involves substantial risk. Builder fee comparison data is updated daily.','HypeFees 不是财务顾问。永续合约交易存在重大风险。Builder 费用对比数据每日更新。','HypeFeesはファイナンシャルアドバイザーではありません。永久先物取引には大きなリスクが伴います。ビルダー手数料データは毎日更新されます。','HypeFees는 재무 자문사가 아닙니다. 무기한 선물 거래에는 상당한 위험이 따릅니다. 빌더 수수료 데이터는 매일 업데이트됩니다.','HypeFees no es asesor financiero. Operar futuros perpetuos implica riesgo sustancial. Datos actualizados diariamente.','HypeFees n\'est pas un conseiller financier. Le trading de futures perpétuels comporte des risques importants. Données mises à jour quotidiennement.','HypeFees ist kein Finanzberater. Der Handel mit Perpetuals birgt erhebliche Risiken. Gebührendaten werden täglich aktualisiert.','HypeFees não é consultor financeiro. Negociar futuros perpétuos envolve risco substancial. Dados atualizados diariamente.','HypeFees не является финансовым консультантом. Торговля бессрочными фьючерсами сопряжена с существенными рисками. Данные обновляются ежедневно.','HypeFees mali danışman değildir. Perpetual vadeli işlem ticareti önemli riskler içerir. Builder ücreti verileri günlük güncellenir.'),
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

// ── React hook — subscribes to language changes across islands ──
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored && stored in LANGUAGES) setLangState(stored);

    function onLangChange(e: Event) {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail && detail in LANGUAGES) setLangState(detail);
    }
    window.addEventListener(LANG_EVENT, onLangChange);
    return () => window.removeEventListener(LANG_EVENT, onLangChange);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
    window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: l }));
  }, []);

  return [lang, setLang];
}
