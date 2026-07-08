import type { Transaction } from "@/lib/types";

/**
 * Словарь правил: ключевые слова в описании -> id категории.
 * Проверка регистронезависимая, по подстроке. Первый матч выигрывает,
 * поэтому более специфичные термины идут раньше общих.
 */
interface Rule {
  category: string;
  keywords: string[];
}

const RULES: Rule[] = [
  {
    category: "groceries",
    keywords: [
      "magnum", "магнум", "small", "смолл", "galmart", "галмарт", "arbuz",
      "арбуз", "spar", "спар", "metro", "метро", "clever", "клевер",
      "супермаркет", "market", "маркет", "продукты", "grocery", "food city",
      "рахмет", "anvar", "анвар", "dina", "дина",
    ],
  },
  {
    category: "cafe",
    keywords: [
      "кафе", "cafe", "coffee", "кофе", "starbucks", "kfc", "kofc", "burger",
      "бургер", "mcdonald", "макдон", "pizza", "пицца", "sushi", "суши",
      "restaurant", "ресторан", "bar ", "бар", "coffeeboom", "chocolife",
      "glovo", "wolt", "яндекс еда", "yandex eda", "choco", "food",
    ],
  },
  {
    category: "fuel",
    keywords: [
      "азс", "азк", "gas", "petrol", "fuel", "топливо", "helios", "гелиос",
      "sinooil", "казмунай", "kmg", "compass", "нефть", "qazaq oil",
    ],
  },
  {
    category: "transport",
    keywords: [
      "яндекс такси", "yandex", "indriver", "indrive", "uber", "такси", "taxi",
      "bolt", "болт", "метрополитен", "автобус", "onay", "онай", "поезд",
      "ktzh", "ктж", "парковк", "parking", "каршеринг", "aviata", "chocotravel",
    ],
  },
  {
    category: "travel",
    keywords: [
      "air astana", "scat", "flyarystan", "fly arystan", "aeroflot", "turkish",
      "booking", "букинг", "hotel", "отель", "hostel", "avia", "авиа",
      "trip", "трип", "aliexpress travel",
    ],
  },
  {
    category: "health",
    keywords: [
      "аптека", "pharmacy", "europharma", "еврофарма", "садыхан", "sadykhan",
      "медиц", "clinic", "клиник", "больниц", "стоматол", "dent", "лаборатор",
      "invitro", "инвитро", "olymp", "sos medical", "здоров",
    ],
  },
  {
    category: "beauty",
    keywords: [
      "салон", "барбер", "barber", "парикмахер", "маникюр", "beauty", "spa",
      "spadar", "cosmetic", "letu", "лэтуаль", "sephora", "gold apple",
    ],
  },
  {
    category: "shopping",
    keywords: [
      "sulpak", "сулпак", "technodom", "технодом", "mechta", "мечта", "белый",
      "kaspi магазин", "kaspi shop", "wildberries", "wildberry", "ozon",
      "aliexpress", "ali express", "lc waikiki", "waikiki", "zara", "h&m",
      "gloria jeans", "детский мир", "sneaker", "магазин", "shop", "store",
      "marwin", "меломан", "meloman", " decathlon", "sportmaster", "спортмастер",
    ],
  },
  {
    category: "utilities",
    keywords: [
      "beeline", "билайн", "kcell", "кселл", "activ", "актив", "tele2", "теле2",
      "altel", "алтел", "kazakhtelecom", "казахтелеком", "интернет", "internet",
      "коммунал", "энергосбыт", "жкх", "kazpost", "казпочта", "газ", "свет",
      "водоканал", "теплокоммун", "электроэнерг",
    ],
  },
  {
    category: "housing",
    keywords: [
      "аренда", "rent", "квартплата", "кск", "оспи", "кооператив", "домофон",
      "недвиж",
    ],
  },
  {
    category: "subscriptions",
    keywords: [
      "netflix", "нетфликс", "spotify", "yandex plus", "яндекс плюс", "apple.com",
      "apple com", "google", "youtube", "icloud", "megogo", "ivi", "kinopoisk",
      "кинопоиск", "chatgpt", "openai", "microsoft", "amediateka", "subscription",
      "подписк", "steam", "psn", "playstation", "xbox",
    ],
  },
  {
    category: "entertainment",
    keywords: [
      "кино", "cinema", "kinopark", "chaplin", "театр", "концерт", "concert",
      "боулинг", "bowling", "аквапарк", "развлеч", "game", "игр", "gym",
      "фитнес", "fitness", "invictus", "worldclass",
    ],
  },
  {
    category: "education",
    keywords: [
      "школ", "school", "универ", "univer", "колледж", "курс", "course",
      "skillbox", "coursera", "udemy", "образован", "детский сад", "садик",
      "kindergarten", "репетитор",
    ],
  },
  {
    category: "kids",
    keywords: [
      "детский мир", "toys", "игрушк", "lego", "mothercare", "смышлен",
    ],
  },
  {
    category: "atm",
    keywords: [
      "снятие", "выдача наличных", "atm", "банкомат", "cash withdrawal", "нал.",
      "обналич",
    ],
  },
  {
    category: "fees",
    keywords: [
      "комисси", "commission", "fee", "обслуживан", "плата за", "штраф банк",
    ],
  },
  {
    category: "taxes",
    keywords: [
      "налог", "tax", "штраф", "гувд", "административн", "госуслуг", "egov",
      "егов", "пошлина", "cnc", "кнп",
    ],
  },
  {
    category: "salary",
    keywords: [
      "зарплат", "salary", "заработн", "оплата труда", "аванс",
    ],
  },
];

/** Нормализация строки для сравнения. */
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Пытается определить категорию по правилам.
 * Возвращает id категории или undefined, если правило не сработало.
 */
export function categorizeByRules(tx: Pick<Transaction, "description" | "amount" | "rawType">): string | undefined {
  const text = norm(tx.description);
  if (!text) return undefined;

  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(norm(kw))) {
        return rule.category;
      }
    }
  }

  // Доход без явного правила -> прочий доход.
  if (tx.amount > 0) return "income_other";

  return undefined;
}
