# Публикация на GitHub Pages

Сайт статический, собран так, что на GitHub Pages работает «из коробки»
(все пути относительные, canonical / og-теги / sitemap уже указаны на Pages-адрес).
## Куда публикуем

Репозиторий: **https://github.com/ploleg811-code/CHARGE3**
Итоговый адрес: **https://ploleg811-code.github.io/CHARGE3/**
(Pages в репозитории уже включён, ветка `main`, корень)

## Способ 1 — загрузка через сайт (3 клика, без токенов)

1. Открой https://github.com/ploleg811-code/CHARGE3/upload/main
2. Перетащи в зону загрузки папку `Koncord-site` целиком (GitHub сам развернёт `assets/`)
3. Внизу впиши коммит: `Concord Detailing Center — новый сайт` → **Commit changes**
4. Через 1–2 минуты сайт будет доступен: https://ploleg811-code.github.io/CHARGE3/

> Старые файлы предыдущей версии (`images/`, `fonts/`, `README.md`) останутся в репозитории —
> они не влияют на работу сайта. При желании их можно удалить через `git rm` или кнопку Delete.

## Способ 2 — я публикую сам (нужен токен с правом записи)

Текущий токен — **read-only** (GitHub отдаёт 403 на запись), поэтому залить через API им нельзя.
Нужен один из вариантов:

**А. Доработать существующий fine-grained токен**
1. https://github.com/settings/personal-access-tokens → открой свой токен
2. **Repository access** → *Only select repositories* → выбери `CHARGE3`
3. **Permissions → Repository permissions → Contents** → *Read and write*
4. (желательно) **Administration** → *Read and write* — чтобы я мог переключить Pages
5. **Save** → пришли токен сюда ещё раз

**Б. Создать classic PAT**
1. https://github.com/settings/tokens/new → *Generate token (classic)*
2. Отметь галочку **`repo`**
3. Generate → скопируй токен и пришли его сюда

После этого я залью все файлы сам (скрипт уже подготовлен), проверю, что сайт открылся,
и пришлю готовую ссылку.

## Безопасность

Токен попал в лог сессии OpenCode. После публикации **отзови его**:
https://github.com/settings/personal-access-tokens → удалить/отозвать.
