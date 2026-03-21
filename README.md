# lightWeightBaby

Легкое офлайн-приложение для учета домашних тренировок, инвентаря и прогресса.

## Что уже есть

- вход по логину без пароля;
- локальное хранение данных в IndexedDB;
- каталог инвентаря и компонентов;
- сборка разборных гантелей с учетом веса, толщины и посадки;
- сохраненные снаряды;
- упражнения с привязкой инвентаря и количества;
- тренировки, замеры и спринты;
- календарь тренировочной активности.

## Стек

- React
- TypeScript
- Vite
- Ant Design
- Zustand
- IndexedDB

## Локальный запуск

```bash
npm install
npm run dev
```

Сборка production:

```bash
npm run build
```

Проверка линтером:

```bash
npm run lint
```

## GitHub Pages

Проект настроен на деплой через GitHub Actions в GitHub Pages.

После пуша в `main` workflow соберет приложение и опубликует его по адресу:

`https://mistersviter.github.io/lightWeightBaby/`

Если сайт не откроется сразу, проверь в репозитории:

1. `Settings -> Pages`
2. `Build and deployment -> Source`
3. Должно быть выбрано `GitHub Actions`

## CI/CD

В репозитории добавлены workflows:

- `CI` — запускает `npm ci`, `npm run lint`, `npm run build`
- `Deploy to GitHub Pages` — публикует приложение из ветки `main`

## Статус

Сейчас это офлайн-MVP без бэкенда. Все пользовательские данные живут только в браузере на текущем устройстве.
