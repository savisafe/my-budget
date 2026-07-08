import type { Category } from "@/lib/types";

/** Справочник категорий. id используется в Transaction.category. */
export const CATEGORIES: Category[] = [
  { id: "groceries", label: "Продукты", icon: "🛒", color: "#10B981" },
  { id: "cafe", label: "Кафе и рестораны", icon: "🍽️", color: "#F59E0B" },
  { id: "transport", label: "Транспорт", icon: "🚗", color: "#3B82F6" },
  { id: "fuel", label: "Топливо", icon: "⛽", color: "#6366F1" },
  { id: "shopping", label: "Покупки и одежда", icon: "🛍️", color: "#EC4899" },
  { id: "health", label: "Здоровье и аптеки", icon: "💊", color: "#EF4444" },
  { id: "entertainment", label: "Развлечения", icon: "🎬", color: "#8B5CF6" },
  { id: "utilities", label: "ЖКХ и связь", icon: "💡", color: "#0EA5E9" },
  { id: "housing", label: "Жильё и аренда", icon: "🏠", color: "#14B8A6" },
  { id: "education", label: "Образование", icon: "📚", color: "#0891B2" },
  { id: "travel", label: "Путешествия", icon: "✈️", color: "#22D3EE" },
  { id: "subscriptions", label: "Подписки и сервисы", icon: "📱", color: "#A855F7" },
  { id: "kids", label: "Дети", icon: "🧸", color: "#F472B6" },
  { id: "beauty", label: "Красота", icon: "💅", color: "#FB7185" },
  { id: "atm", label: "Снятие наличных", icon: "🏧", color: "#64748B" },
  { id: "fees", label: "Комиссии и банк", icon: "🏦", color: "#94A3B8" },
  { id: "taxes", label: "Налоги и штрафы", icon: "📄", color: "#78716C" },
  // Доходные
  { id: "salary", label: "Зарплата", icon: "💰", color: "#16A34A", income: true },
  { id: "income_other", label: "Прочий доход", icon: "📈", color: "#65A30D", income: true },
  // Служебные
  { id: "transfer", label: "Перевод между счетами", icon: "🔁", color: "#CBD5E1" },
  { id: "other", label: "Другое", icon: "❓", color: "#9CA3AF" },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export function getCategory(id: string | undefined): Category {
  return (id && CATEGORY_MAP[id]) || CATEGORY_MAP.other;
}

/** Список id категорий, передаётся ИИ как допустимый набор. */
export const CATEGORY_IDS = CATEGORIES.filter((c) => c.id !== "transfer").map((c) => c.id);
