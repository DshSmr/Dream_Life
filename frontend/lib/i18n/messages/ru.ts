/** Russian — shared UI; page copy may still fall back to English until translated. */

import { commonExtraMessages } from "@/lib/i18n/messages/sections/ru/common-extra";

import { dashboardMessages } from "@/lib/i18n/messages/sections/ru/dashboard";

import { financeMessages } from "@/lib/i18n/messages/sections/ru/finance";

import { insightsMessages } from "@/lib/i18n/messages/sections/ru/insights";

import { lifeMessages } from "@/lib/i18n/messages/sections/ru/life";

import { settingsExtraMessages } from "@/lib/i18n/messages/sections/ru/settings-extra";

import { workMessages } from "@/lib/i18n/messages/sections/ru/work";



export const messages = {

  nav: {

    primary: {

      dashboard: "Панель",

      work: "Работа",

      life: "Дом",

      finance: "Финансы",

      insights: "Обзор",

      settings: "Настройки"

    },

    menu: "Меню",

    closeMenu: "Закрыть меню",

    openMenu: "Открыть меню",

    accountSettings: "Аккаунт и настройки",

    breadcrumbDashboard: "Панель",

    dashboardTabs: {

      overview: "Обзор",

      goals: "Цели",

      commandCenter: "Фокус",

      dailyPlan: "Сегодня",

      recommendations: "Подсказки",

      notifications: "Уведомления"

    },

    workTabs: {

      tasks: "Задачи",

      focus: "Фокус",

      pomodoro: "Помодоро"

    },

    lifeTabs: {

      cleaning: "Уборка",

      homeHealth: "Дом",

      consistency: "Ритм"

    },

    financeTabs: {

      dashboard: "Сводка",

      transactions: "Операции"

    },

    insightsTabs: {

      activity: "Активность",

      patterns: "Паттерны",

      lifeFlow: "Поток дня",

      review: "Обзор",

      monthlyReview: "Месячный обзор",

      today: "Сегодня",

      reviewHistory: "История"

    },

    aria: {

      primary: "Основная навигация",

      mobilePrimary: "Мобильная навигация",

      dashboard: "Разделы панели",

      work: "Разделы работы",

      life: "Разделы дома",

      finance: "Разделы финансов",

      insights: "Разделы обзора"

    }

  },

  common: {

    open: "Открыть",

    openCleaning: "Открыть уборку",

    openFinance: "Открыть финансы",

    save: "Сохранить",

    cancel: "Отмена",

    add: "Добавить",

    viewAll: "Смотреть все",

    tryAgain: "Повторить",

    loading: "Загрузка…",

    markDone: "Готово",

    addZone: "Добавить зону",

    close: "Закрыть",

    ...commonExtraMessages

  },

  settings: {

    pageTitle: "Настройки",

    language: {

      title: "Язык",

      description: "Язык интерфейса в этом браузере.",

      displayLanguage: "Язык отображения",

      note: "Остальной текст постепенно появится на выбранном языке."

    },

    appearance: {
      title: "Оформление",
      description: "Выберите, как Dream Life выглядит на этом устройстве.",
      themeLabel: "Тема",
      themeDark: "Тёмная",
      themeLight: "Светлая",
      themeSystem: "Как на устройстве",
      themeMidnight: "Полночь",
      themeSoftDark: "Мягкая тёмная",
      themeWarmLight: "Тёплая светлая"
    },

    preferences: {

      title: "Предпочтения"

    },

    automation: {

      title: "Автоматизация"

    },

    developer: {

      title: "Инструменты разработчика",

      link: "Инструменты разработчика",

      pageDescription: "Управление сохранённой активностью на этом устройстве, когда нужен чистый старт."

    },

    ...settingsExtraMessages

  },

  empty: {

    homeHealth: {

      title: "Начните с одной зоны",

      description: "Добавьте первую зону дома, чтобы отслеживать пространство."

    },

    patterns: {

      title: "Паттерны появятся здесь",

      description: "Когда вы отмечаете фокус, задачи, уборку и траты, ритмы станут видны."

    },

    lifeFlow: {

      title: "Ваш поток появится здесь",

      description: "По мере задач, фокуса, трат и заботы о доме моменты соберутся по дням."

    },

    tasks: {

      title: "Задач пока нет",

      description: "Добавьте задачу, когда что-то важно."

    },

    cleaning: {

      title: "Дом спокоен сегодня",

      description: "Добавьте зону, если хотите мягкие напоминания об уходе."

    }

  },

  form: {

    zoneName: "Название зоны",

    everyDays: "Каждые (дней)",

    taskTitle: "Название задачи",

    priority: "Приоритет",

    amount: "Сумма",

    category: "Категория",

    note: "Заметка",

    type: "Тип"

  },

  dashboard: dashboardMessages,

  work: workMessages,

  life: lifeMessages,

  finance: financeMessages,

  insights: insightsMessages

} satisfies import("@/lib/i18n/types").Messages;


