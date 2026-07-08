// Единая модель данных приложения.

/** Нормализованная транзакция — общий формат для всех банков. */
export interface Transaction {
  /** Стабильный id = хэш(дата+сумма+описание+файл). */
  id: string;
  /** Дата в ISO-формате (YYYY-MM-DD). */
  date: string;
  /** Сумма: положительная — доход, отрицательная — расход. */
  amount: number;
  /** Код валюты, по умолчанию KZT. */
  currency: string;
  /** Мерчант / назначение платежа. */
  description: string;
  /** Оригинальный тип операции из выписки ("Покупка", "Пополнение", ...). */
  rawType?: string;
  /** Счёт/карта (маска), если удалось извлечь. */
  account?: string;
  /** Название банка/источника. */
  bank?: string;
  /** Имя исходного файла. */
  sourceFile: string;
  /** Назначенная категория (id из CATEGORIES). */
  category?: string;
  /** Источник категории. */
  categorySource?: CategorySource;
  /** Помечена как перевод между своими счетами (исключается из аналитики). */
  isTransfer?: boolean;
  /** Id пары перевода. */
  transferPairId?: string;
}

export type CategorySource = "rule" | "manual";

export interface Category {
  id: string;
  label: string;
  /** Emoji-иконка. */
  icon: string;
  /** HEX-цвет для графиков. */
  color: string;
  /** true — доходная категория. */
  income?: boolean;
}

/** Сопоставление колонок при импорте CSV/Excel. */
export interface ColumnMapping {
  /** Имя пресета (обычно название банка). */
  name: string;
  /** Индекс/имя колонки с датой. */
  date: string;
  /** Формат даты, напр. "DD.MM.YYYY", "YYYY-MM-DD". */
  dateFormat?: string;
  /** Колонка с описанием. */
  description: string;
  /** Режим суммы: одна колонка со знаком, либо раздельные дебет/кредит. */
  amountMode: "single" | "debitCredit";
  /** Колонка суммы (для single). */
  amount?: string;
  /** Колонка расхода (для debitCredit). */
  debit?: string;
  /** Колонка прихода (для debitCredit). */
  credit?: string;
  /** Колонка счёта/карты. */
  account?: string;
  /** Разделитель дробной части: "," ".", либо "auto" — определить автоматически. */
  decimalSeparator?: "," | "." | "auto";
  /** Инвертировать знак (если расход в выписке положительный). */
  invertSign?: boolean;
  /** Валюта по умолчанию. */
  currency?: string;
  /** Сколько строк заголовка пропустить сверху. */
  skipRows?: number;
}

/** Сырой результат парсинга файла до нормализации. */
export interface ParsedFile {
  fileName: string;
  /** Заголовки колонок (если определены). */
  headers: string[];
  /** Строки как массив ячеек. */
  rows: string[][];
  /** Предполагаемый банк/формат. */
  detectedBank?: string;
  /** Уже нормализованные транзакции (для парсеров, которые знают формат — напр. Kaspi PDF). */
  preNormalized?: Transaction[];
}

/** Кандидат/подтверждённая пара перевода между своими счетами. */
export interface TransferPair {
  id: string;
  /** Транзакция-списание (отрицательная). */
  outId: string;
  /** Транзакция-зачисление (положительная). */
  inId: string;
  amount: number;
  /** Разница в днях между операциями. */
  daysApart: number;
  /** Статус подтверждения пользователем. */
  status: "candidate" | "confirmed" | "rejected";
}

export type BillingTier = "free" | "pro";
