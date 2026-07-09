import type { Transaction, TransferPair } from "@/lib/types";

export interface TransferOptions {
  /** Максимальная разница дат в днях. */
  maxDaysApart?: number;
  /** Абсолютный допуск по сумме (в валюте). */
  amountTolerance?: number;
}

const DEFAULTS: Required<TransferOptions> = {
  maxDaysApart: 3,
  amountTolerance: 0.5,
};

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.abs(a - b) / 86_400_000;
}

/** Стабильный id пары (не зависит от порядка). */
export function transferPairId(id1: string, id2: string): string {
  return [id1, id2].sort().join("__");
}

/**
 * Находит кандидатов на переводы между своими счетами: встречные операции
 * (списание + зачисление) одинаковой суммы, близкие по дате, из разных
 * счетов/файлов. Жадное сопоставление один-к-одному.
 *
 * TODO(scale/accuracy): алгоритм O(outgoing×incoming). Для больших историй
 * (десятки тысяч операций) стоит индексировать incoming по (сумма) в Map и брать
 * ближайшую по дате — это уберёт квадратичность. Также жадное сопоставление по
 * сумме может ошибиться при множестве одинаковых сумм; поэтому итог всегда
 * подтверждается пользователем в UI (см. TransferReview).
 */
export function detectTransfers(txs: Transaction[], opts: TransferOptions = {}): TransferPair[] {
  const { maxDaysApart, amountTolerance } = { ...DEFAULTS, ...opts };

  const outgoing = txs.filter((t) => t.amount < 0).sort((a, b) => a.date.localeCompare(b.date));
  const incoming = txs.filter((t) => t.amount > 0).sort((a, b) => a.date.localeCompare(b.date));

  const usedIn = new Set<string>();
  const pairs: TransferPair[] = [];

  for (const out of outgoing) {
    let best: { tx: Transaction; days: number } | null = null;

    for (const inc of incoming) {
      if (usedIn.has(inc.id)) continue;
      if (Math.abs(Math.abs(out.amount) - inc.amount) > amountTolerance) continue;

      const days = daysBetween(out.date, inc.date);
      if (days > maxDaysApart) continue;

      // Разные счета или хотя бы разные файлы — иначе это не перевод «между своими».
      const differentAccount =
        (out.account && inc.account && out.account !== inc.account) ||
        out.sourceFile !== inc.sourceFile ||
        out.bank !== inc.bank;
      if (!differentAccount) continue;

      if (!best || days < best.days) best = { tx: inc, days };
    }

    if (best) {
      usedIn.add(best.tx.id);
      pairs.push({
        id: transferPairId(out.id, best.tx.id),
        outId: out.id,
        inId: best.tx.id,
        amount: Math.abs(out.amount),
        daysApart: Math.round(best.days),
        status: "candidate",
      });
    }
  }

  return pairs;
}
