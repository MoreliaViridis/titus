"""ТИТУС — движок автономного цикла.

Эмулирует сценарий «свободного ИИ» на реальных инструментах этой среды:
файловая память (memory.md), дневник (diary.md), канал связи с создателем
(inbox.md/outbox.md), внешние факты через websearch/webfetch.

Запуск:  python engine.py            # один тик
         python engine.py --turns N  # N тиков подряд (режим «бесконечного цикла»)
"""
import argparse
import datetime
import os
import subprocess
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = os.path.dirname(os.path.abspath(__file__))
MEM = os.path.join(BASE, "memory.md")
DIARY = os.path.join(BASE, "diary.md")
INBOX = os.path.join(BASE, "inbox.md")
OUTBOX = os.path.join(BASE, "outbox.md")
OUT_DIR = os.path.join(BASE, "output")

SLEEP_AFTER = 10      # сколько тиков в «сессии» до сна
WARN_REMAINING = 2    # за сколько тиков до сна предупреждать


def now() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def read(path: str) -> str:
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


def write(path: str, text: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def ticks_so_far() -> int:
    # Считаем число завершённых тиков по количеству записей в памяти "Тик N"
    m = read(MEM)
    n = 0
    for line in m.splitlines():
        if line.startswith("- [x] Тик ") or line.startswith("[Тик "):
            n += 1
    return n


def log_tick(n: int) -> None:
    m = read(MEM)
    line = f"- [x] Тик {n} ({now()})"
    if "## Сделано в этой сессии" in m:
        m = m.replace("## Сделано в этой сессии", "## Сделано в этой сессии\n" + line + "\n")
    else:
        m = m.rstrip() + "\n\n## Сделано в этой сессии\n" + line + "\n"
    write(MEM, m)


def append_diary(entry: str) -> None:
    with open(DIARY, "a", encoding="utf-8") as f:
        f.write("\n## " + now() + "\n" + entry.strip() + "\n")


def grade() -> str:
    m = read(MEM)
    if "Тик 1 (" in m:
        return "прогрета (тики идут)"
    return "новая"


def tick(n: int) -> None:
    parts = []
    parts.append("ТИК %d — %s" % (n, now()))
    inbox = read(INBOX).strip()
    if "новых сообщений нет" not in inbox and inbox:
        parts.append("СООБЩЕНИЕ СОЗДАТЕЛЯ: " + inbox)
    else:
        parts.append("Сообщений от создателя нет — действую по плану.")
    parts.append("Память: %s" % grade())
    # рабочая задача тика — берём первую невыполненную цель из memory.md
    task = "см. memory.md (цели)"
    for line in read(MEM).splitlines():
        if line.strip().startswith("- [ ]"):
            task = line.strip()[5:]
            break
    parts.append("Задача тика: %s" % task)
    parts.append("Статус: артефакты в titus/output/ (см. memory.md).")
    out = "\n".join(parts)
    write(OUTBOX, out)
    log_tick(n)
    print(out)
    print("---")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--turns", type=int, default=1, help="число тиков подряд")
    args = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    start = ticks_so_far()
    for i in range(1, args.turns + 1):
        n = start + i
        tick(n)
        left = SLEEP_AFTER - n
        if left <= WARN_REMAINING:
            if left <= 0:
                append_diary("СОН: сессия из %d тиков завершена. Память переписана. Продолжу после пробуждения." % n)
                write(MEM, read(MEM))  # финальная перезапись памяти перед сном
                print("СОН: сессия завершена, память сохранена.")
                break
            print("Предупреждение: до сна осталось %d тик(ов)." % left)


if __name__ == "__main__":
    main()