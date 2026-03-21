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

// ── Translation keys ──
const translations: Record<string, Record<Lang, string>> = {
  // Hero
  'hero.title.1': {
    en: 'Every trade has a',       zh: '每笔交易都有一个',        ja: 'すべての取引には',           ko: '모든 거래에는',
    es: 'Cada operación tiene una', fr: 'Chaque trade a des',     de: 'Jeder Trade hat eine',      pt: 'Cada trade tem uma',
    ru: 'Каждая сделка имеет',     tr: 'Her işlemin gizli bir',
  },
  'hero.title.2': {
    en: 'hidden fee.',  zh: '隐藏费用。',   ja: '隠れた手数料があります。', ko: '숨겨진 수수료가 있습니다.',
    es: 'comisión oculta.', fr: 'frais cachés.', de: 'versteckte Gebühr.', pt: 'taxa oculta.',
    ru: 'скрытую комиссию.', tr: 'ücreti var.',
  },
  'hero.title.cta': {
    en: 'See yours.', zh: '查看你的。', ja: 'あなたのを確認。', ko: '내 수수료 확인.',
    es: 'Mira la tuya.', fr: 'Voir les vôtres.', de: 'Deine anzeigen.', pt: 'Veja a sua.',
    ru: 'Посмотри свою.', tr: 'Kendininkini gör.',
  },
  'hero.subtitle': {
    en: "Wallets add builder fees on top of Hyperliquid's exchange rate. Some charge 0.10% per trade. Some charge nothing.",
    zh: '钱包会在 Hyperliquid 交易所费率之上收取 Builder 费用。有些收 0.10%，有些完全免费。',
    ja: 'ウォレットはHyperliquidの取引手数料の上にビルダー手数料を加算します。0.10%のものもあれば無料のものもあります。',
    ko: '지갑은 Hyperliquid 거래 수수료 위에 빌더 수수료를 추가합니다. 0.10%를 부과하는 곳도, 무료인 곳도 있습니다.',
    es: 'Las billeteras agregan tarifas de builder sobre la comisión de Hyperliquid. Algunas cobran 0.10%, otras nada.',
    fr: "Les wallets ajoutent des frais de builder en plus des frais d'échange Hyperliquid. Certains facturent 0.10%, d'autres rien.",
    de: 'Wallets erheben Builder-Gebühren zusätzlich zu den Hyperliquid-Börsengebühren. Manche verlangen 0,10%, andere nichts.',
    pt: 'Carteiras adicionam taxas de builder além das taxas da Hyperliquid. Algumas cobram 0,10%, outras nada.',
    ru: 'Кошельки добавляют сборы билдера поверх комиссии Hyperliquid. Некоторые берут 0.10%, другие — ничего.',
    tr: "Cüzdanlar, Hyperliquid'in komisyonuna ek olarak builder ücreti alır. Bazıları %0,10, bazıları hiç almaz.",
  },
  'hero.input.placeholder': {
    en: 'Enter your ETH address (0x...)', zh: '输入你的 ETH 地址 (0x...)', ja: 'ETHアドレスを入力 (0x...)', ko: 'ETH 주소 입력 (0x...)',
    es: 'Ingresa tu dirección ETH (0x...)', fr: 'Entrez votre adresse ETH (0x...)', de: 'ETH-Adresse eingeben (0x...)', pt: 'Insira seu endereço ETH (0x...)',
    ru: 'Введите ваш ETH-адрес (0x...)', tr: 'ETH adresinizi girin (0x...)',
  },
  'hero.btn.lookup': {
    en: 'Look Up', zh: '查询', ja: '検索', ko: '조회',
    es: 'Buscar', fr: 'Rechercher', de: 'Suchen', pt: 'Consultar',
    ru: 'Поиск', tr: 'Ara',
  },
  'hero.btn.loading': {
    en: 'Loading...', zh: '加载中...', ja: '読み込み中...', ko: '로딩 중...',
    es: 'Cargando...', fr: 'Chargement...', de: 'Laden...', pt: 'Carregando...',
    ru: 'Загрузка...', tr: 'Yükleniyor...',
  },
  // Results
  'result.totalVolume': {
    en: 'Total Volume', zh: '总交易量', ja: '総取引量', ko: '총 거래량',
    es: 'Volumen Total', fr: 'Volume Total', de: 'Gesamtvolumen', pt: 'Volume Total',
    ru: 'Общий Объём', tr: 'Toplam Hacim',
  },
  'result.totalFees': {
    en: 'Total Fees', zh: '总费用', ja: '総手数料', ko: '총 수수료',
    es: 'Comisiones Totales', fr: 'Frais Totaux', de: 'Gesamtgebühren', pt: 'Taxas Totais',
    ru: 'Всего Комиссий', tr: 'Toplam Ücret',
  },
  'result.exchangeFees': {
    en: 'Exchange Fees', zh: '交易所费用', ja: '取引所手数料', ko: '거래소 수수료',
    es: 'Comisión Exchange', fr: "Frais d'Exchange", de: 'Börsengebühren', pt: 'Taxas da Exchange',
    ru: 'Комиссия Биржи', tr: 'Borsa Ücreti',
  },
  'result.builderFees': {
    en: 'Builder Fees', zh: 'Builder 费用', ja: 'ビルダー手数料', ko: '빌더 수수료',
    es: 'Comisión Builder', fr: 'Frais Builder', de: 'Builder-Gebühren', pt: 'Taxa Builder',
    ru: 'Комиссия Билдера', tr: 'Builder Ücreti',
  },
  'result.trades': {
    en: 'trades', zh: '笔交易', ja: '取引', ko: '건',
    es: 'operaciones', fr: 'trades', de: 'Trades', pt: 'trades',
    ru: 'сделок', tr: 'işlem',
  },
  'result.toHyperliquid': {
    en: 'To Hyperliquid', zh: '支付给 Hyperliquid', ja: 'Hyperliquidへ', ko: 'Hyperliquid에',
    es: 'A Hyperliquid', fr: 'À Hyperliquid', de: 'An Hyperliquid', pt: 'Para Hyperliquid',
    ru: 'Для Hyperliquid', tr: "Hyperliquid'e",
  },
  'result.noBuilderFee': {
    en: 'No builder fee paid', zh: '无 Builder 费用', ja: 'ビルダー手数料なし', ko: '빌더 수수료 없음',
    es: 'Sin comisión builder', fr: 'Pas de frais builder', de: 'Keine Builder-Gebühr', pt: 'Sem taxa builder',
    ru: 'Без комиссии билдера', tr: 'Builder ücreti yok',
  },
  'result.ofTotalFees': {
    en: 'of total fees', zh: '占总费用', ja: '総手数料の', ko: '총 수수료의',
    es: 'de comisiones totales', fr: 'des frais totaux', de: 'der Gesamtgebühren', pt: 'das taxas totais',
    ru: 'от общей комиссии', tr: 'toplam ücretin',
  },
  'result.feeBreakdown': {
    en: 'Fee Breakdown', zh: '费用明细', ja: '手数料内訳', ko: '수수료 내역',
    es: 'Desglose', fr: 'Détail', de: 'Aufschlüsselung', pt: 'Detalhamento',
    ru: 'Разбивка', tr: 'Ücret Dağılımı',
  },
  'result.exchange': {
    en: 'Exchange', zh: '交易所', ja: '取引所', ko: '거래소',
    es: 'Exchange', fr: 'Exchange', de: 'Börse', pt: 'Exchange',
    ru: 'Биржа', tr: 'Borsa',
  },
  'result.builder': {
    en: 'Builder', zh: 'Builder', ja: 'ビルダー', ko: '빌더',
    es: 'Builder', fr: 'Builder', de: 'Builder', pt: 'Builder',
    ru: 'Билдер', tr: 'Builder',
  },
  'result.saveBanner': {
    en: 'You could have saved {amount} with a 0% fee builder',
    zh: '使用 0% 费率的 Builder 可节省 {amount}',
    ja: '0%手数料のビルダーなら {amount} 節約できました',
    ko: '0% 수수료 빌더로 {amount} 절약 가능',
    es: 'Podrías haber ahorrado {amount} con un builder sin comisión',
    fr: 'Vous auriez pu économiser {amount} avec un builder à 0%',
    de: 'Sie hätten {amount} mit einem 0%-Builder sparen können',
    pt: 'Você poderia ter economizado {amount} com um builder 0%',
    ru: 'Вы могли сэкономить {amount} с билдером без комиссии',
    tr: '%0 ücretli bir builder ile {amount} tasarruf edebilirdiniz',
  },
  'result.saveBannerSub': {
    en: 'Switch to a builder with 0% fees to keep more of your profits on future trades.',
    zh: '切换到 0% 费率的 Builder，在未来交易中保留更多利润。',
    ja: '0%手数料のビルダーに切り替えて、将来の取引でより多くの利益を確保しましょう。',
    ko: '0% 수수료 빌더로 전환하여 향후 거래에서 더 많은 수익을 확보하세요.',
    es: 'Cambia a un builder con 0% de comisión para conservar más ganancias.',
    fr: 'Passez à un builder à 0% pour garder plus de profits sur vos futurs trades.',
    de: 'Wechseln Sie zu einem 0%-Builder, um bei zukünftigen Trades mehr zu verdienen.',
    pt: 'Mude para um builder 0% para manter mais lucros em trades futuros.',
    ru: 'Переключитесь на билдера с 0% комиссии, чтобы сохранить больше прибыли.',
    tr: 'Gelecekteki işlemlerde daha fazla kâr için %0 ücretli bir builder\'a geçin.',
  },
  'result.alreadyZero': {
    en: "You're already on a 0% fee builder — nicely done!",
    zh: '你已经在用 0% 费率的 Builder 了——做得好！',
    ja: 'すでに0%手数料のビルダーを使用中——すばらしい！',
    ko: '이미 0% 수수료 빌더를 사용 중입니다 — 잘하셨어요!',
    es: 'Ya estás con un builder sin comisión — ¡bien hecho!',
    fr: 'Vous êtes déjà sur un builder à 0% — bien joué !',
    de: 'Sie nutzen bereits einen 0%-Builder — gut gemacht!',
    pt: 'Você já está em um builder 0% — muito bem!',
    ru: 'Вы уже используете билдера с 0% комиссией — отлично!',
    tr: 'Zaten %0 ücretli bir builder kullanıyorsunuz — harika!',
  },
  'result.noHistory': {
    en: 'No trading history found for this address on Hyperliquid',
    zh: '该地址在 Hyperliquid 上无交易记录',
    ja: 'このアドレスのHyperliquidでの取引履歴が見つかりません',
    ko: '이 주소의 Hyperliquid 거래 내역을 찾을 수 없습니다',
    es: 'No se encontró historial de trading para esta dirección en Hyperliquid',
    fr: "Aucun historique de trading trouvé pour cette adresse sur Hyperliquid",
    de: 'Kein Handelshistorie für diese Adresse auf Hyperliquid gefunden',
    pt: 'Nenhum histórico de trading encontrado para este endereço na Hyperliquid',
    ru: 'История торговли не найдена для этого адреса на Hyperliquid',
    tr: "Bu adres için Hyperliquid'de işlem geçmişi bulunamadı",
  },
  'result.invalidAddress': {
    en: 'Please enter a valid Ethereum address (0x...)',
    zh: '请输入有效的以太坊地址 (0x...)',
    ja: '有効なイーサリアムアドレスを入力してください (0x...)',
    ko: '유효한 이더리움 주소를 입력하세요 (0x...)',
    es: 'Ingrese una dirección Ethereum válida (0x...)',
    fr: 'Veuillez entrer une adresse Ethereum valide (0x...)',
    de: 'Bitte geben Sie eine gültige Ethereum-Adresse ein (0x...)',
    pt: 'Insira um endereço Ethereum válido (0x...)',
    ru: 'Введите корректный Ethereum-адрес (0x...)',
    tr: 'Geçerli bir Ethereum adresi girin (0x...)',
  },
  // Fee Simulator
  'sim.volume': {
    en: 'Simulated Trading Volume', zh: '模拟交易量', ja: 'シミュレーション取引量', ko: '시뮬레이션 거래량',
    es: 'Volumen Simulado', fr: 'Volume Simulé', de: 'Simuliertes Volumen', pt: 'Volume Simulado',
    ru: 'Моделируемый Объём', tr: 'Simüle Hacim',
  },
  'sim.directHL': {
    en: 'Direct HL', zh: '直连 HL', ja: '直接 HL', ko: '직접 HL',
    es: 'Directo HL', fr: 'Direct HL', de: 'Direkt HL', pt: 'Direto HL',
    ru: 'Прямой HL', tr: 'Doğrudan HL',
  },
  'sim.baseline': {
    en: 'Baseline', zh: '基准', ja: '基準', ko: '기준',
    es: 'Base', fr: 'Base', de: 'Basis', pt: 'Base',
    ru: 'Базис', tr: 'Taban',
  },
  'sim.best': {
    en: 'Best', zh: '最优', ja: '最良', ko: '최적',
    es: 'Mejor', fr: 'Meilleur', de: 'Beste', pt: 'Melhor',
    ru: 'Лучший', tr: 'En İyi',
  },
  // Builder Table
  'table.topWallets': {
    en: 'Top Wallets', zh: '精选钱包', ja: 'おすすめウォレット', ko: '추천 지갑',
    es: 'Top Billeteras', fr: 'Meilleurs Wallets', de: 'Top Wallets', pt: 'Top Carteiras',
    ru: 'Лучшие Кошельки', tr: 'En İyi Cüzdanlar',
  },
  'table.allBuilders': {
    en: 'All Builders', zh: '所有 Builders', ja: 'すべてのビルダー', ko: '모든 빌더',
    es: 'Todos los Builders', fr: 'Tous les Builders', de: 'Alle Builder', pt: 'Todos os Builders',
    ru: 'Все Билдеры', tr: 'Tüm Builderlar',
  },
  // Sections
  'section.whatAre': {
    en: 'What Are Hyperliquid Builder Fees?', zh: '什么是 Hyperliquid Builder 费用？', ja: 'Hyperliquid ビルダー手数料とは？', ko: 'Hyperliquid 빌더 수수료란?',
    es: '¿Qué son las comisiones de Builder?', fr: "Que sont les frais Builder d'Hyperliquid ?", de: 'Was sind Hyperliquid Builder-Gebühren?', pt: 'O que são taxas Builder da Hyperliquid?',
    ru: 'Что такое комиссии билдеров Hyperliquid?', tr: 'Hyperliquid Builder Ücretleri Nedir?',
  },
  'section.comparison': {
    en: 'Builder Fee Comparison', zh: 'Builder 费用对比', ja: 'ビルダー手数料比較', ko: '빌더 수수료 비교',
    es: 'Comparación de Comisiones', fr: 'Comparaison des Frais', de: 'Gebührenvergleich', pt: 'Comparação de Taxas',
    ru: 'Сравнение Комиссий', tr: 'Ücret Karşılaştırması',
  },
  'section.calculator': {
    en: 'Fee Calculator', zh: '费用计算器', ja: '手数料カリキュレーター', ko: '수수료 계산기',
    es: 'Calculadora de Comisiones', fr: 'Calculateur de Frais', de: 'Gebührenrechner', pt: 'Calculadora de Taxas',
    ru: 'Калькулятор Комиссий', tr: 'Ücret Hesaplayıcı',
  },
  'section.howItWorks': {
    en: 'How Builder Fees Work', zh: 'Builder 费用如何运作', ja: 'ビルダー手数料の仕組み', ko: '빌더 수수료 작동 방식',
    es: 'Cómo Funcionan las Comisiones', fr: 'Comment Fonctionnent les Frais', de: 'Wie Builder-Gebühren Funktionieren', pt: 'Como as Taxas Funcionam',
    ru: 'Как Работают Комиссии', tr: 'Builder Ücretleri Nasıl Çalışır',
  },
  'section.faq': {
    en: 'Frequently Asked Questions', zh: '常见问题', ja: 'よくある質問', ko: '자주 묻는 질문',
    es: 'Preguntas Frecuentes', fr: 'Questions Fréquentes', de: 'Häufige Fragen', pt: 'Perguntas Frequentes',
    ru: 'Часто Задаваемые Вопросы', tr: 'Sıkça Sorulan Sorular',
  },
  // Share card
  'share.title': {
    en: 'Your Hyperliquid Wrapped', zh: '你的 Hyperliquid 年度报告', ja: 'Hyperliquid ラップド', ko: '나의 Hyperliquid 래핑',
    es: 'Tu Hyperliquid Wrapped', fr: 'Votre Hyperliquid Wrapped', de: 'Dein Hyperliquid Wrapped', pt: 'Seu Hyperliquid Wrapped',
    ru: 'Ваш Hyperliquid Wrapped', tr: 'Hyperliquid Wrapped\'ınız',
  },
  'share.viewCard': {
    en: 'View card →', zh: '查看卡片 →', ja: 'カードを見る →', ko: '카드 보기 →',
    es: 'Ver tarjeta →', fr: 'Voir la carte →', de: 'Karte ansehen →', pt: 'Ver cartão →',
    ru: 'Посмотреть →', tr: 'Kartı gör →',
  },
  'share.download': {
    en: 'Download Card', zh: '下载卡片', ja: 'カードをダウンロード', ko: '카드 다운로드',
    es: 'Descargar Tarjeta', fr: 'Télécharger', de: 'Karte Herunterladen', pt: 'Baixar Cartão',
    ru: 'Скачать Карту', tr: 'Kartı İndir',
  },
  // Switch builder
  'switch.title': {
    en: 'Switch to 0% builder fees', zh: '切换到 0% Builder 费用', ja: '0% ビルダー手数料に切替', ko: '0% 빌더 수수료로 전환',
    es: 'Cambia a 0% de comisión', fr: 'Passez à 0% de frais builder', de: 'Zu 0% Builder-Gebühren wechseln', pt: 'Mude para 0% de taxa builder',
    ru: 'Переключиться на 0% комиссию', tr: '%0 builder ücretine geç',
  },
  'switch.connectWallet': {
    en: 'Connect Wallet', zh: '连接钱包', ja: 'ウォレット接続', ko: '지갑 연결',
    es: 'Conectar Billetera', fr: 'Connecter Wallet', de: 'Wallet Verbinden', pt: 'Conectar Carteira',
    ru: 'Подключить Кошелёк', tr: 'Cüzdan Bağla',
  },
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
