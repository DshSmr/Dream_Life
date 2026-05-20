/** Finnish — shared UI; page copy may still fall back to English until translated. */

import { commonExtraMessages } from "@/lib/i18n/messages/sections/fi/common-extra";

import { dashboardMessages } from "@/lib/i18n/messages/sections/fi/dashboard";

import { financeMessages } from "@/lib/i18n/messages/sections/fi/finance";

import { insightsMessages } from "@/lib/i18n/messages/sections/fi/insights";

import { lifeMessages } from "@/lib/i18n/messages/sections/fi/life";

import { settingsExtraMessages } from "@/lib/i18n/messages/sections/fi/settings-extra";

import { workMessages } from "@/lib/i18n/messages/sections/fi/work";



export const messages = {

  nav: {

    primary: {

      dashboard: "Kojelauta",

      work: "Työ",

      life: "Koti",

      finance: "Talous",

      insights: "Oivallukset",

      settings: "Asetukset"

    },

    menu: "Valikko",

    closeMenu: "Sulje valikko",

    openMenu: "Avaa valikko",

    accountSettings: "Tili ja asetukset",

    breadcrumbDashboard: "Kojelauta",

    dashboardTabs: {

      overview: "Yleiskatsaus",

      goals: "Tavoitteet",

      commandCenter: "Fokus",

      dailyPlan: "Tänään",

      recommendations: "Ehdotukset",

      notifications: "Ilmoitukset"

    },

    workTabs: {

      tasks: "Tehtävät",

      focus: "Fokus",

      pomodoro: "Pomodoro"

    },

    lifeTabs: {

      cleaning: "Siivous",

      homeHealth: "Kodin hyvä",

      consistency: "Rytmi"

    },

    financeTabs: {

      dashboard: "Yhteenveto",

      transactions: "Tapahtumat"

    },

    insightsTabs: {

      activity: "Toiminta",

      patterns: "Kuviot",

      lifeFlow: "Elämän virta",

      review: "Katsaus",

      monthlyReview: "Kuukausi",

      today: "Tänään",

      reviewHistory: "Historia"

    },

    aria: {

      primary: "Päänavigaatio",

      mobilePrimary: "Mobiilinavigaatio",

      dashboard: "Kojelaudan osiot",

      work: "Työn osiot",

      life: "Kodin osiot",

      finance: "Talousosion osiot",

      insights: "Oivallusten osiot"

    }

  },

  common: {

    open: "Avaa",

    openCleaning: "Avaa siivous",

    openFinance: "Avaa talous",

    save: "Tallenna",

    cancel: "Peruuta",

    add: "Lisää",

    viewAll: "Näytä kaikki",

    tryAgain: "Yritä uudelleen",

    loading: "Ladataan…",

    markDone: "Merkitse tehdyksi",

    addZone: "Lisää alue",

    close: "Sulje",

    ...commonExtraMessages

  },

  settings: {

    pageTitle: "Asetukset",

    language: {

      title: "Kieli",

      description: "Käyttöliittymän kieli tässä selaimessa.",

      displayLanguage: "Näyttökieli",

      note: "Lisää tekstiä tulee valitulle kielelle ajan myötä."

    },

    appearance: {
      title: "Ulkoasu",
      description: "Valitse, miltä Dream Life näyttää tällä laitteella.",
      themeLabel: "Teema",
      themeDark: "Tumma",
      themeLight: "Vaalea",
      themeSystem: "Laitteen mukaan",
      themeMidnight: "Keskiyö",
      themeSoftDark: "Pehmeä tumma",
      themeWarmLight: "Lämmin vaalea"
    },

    preferences: {

      title: "Asetukset"

    },

    automation: {

      title: "Automaatio"

    },

    developer: {

      title: "Kehittäjätyökalut",

      link: "Kehittäjätyökalut",

      pageDescription: "Hallitse tallennettua toimintaa tällä laitteella, kun tarvitset puhtaan alun."

    },

    ...settingsExtraMessages

  },

  empty: {

    homeHealth: {

      title: "Aloita yhdellä alueella",

      description: "Lisää ensimmäinen kotialue aloittaaksesi tilan seurannan."

    },

    patterns: {

      title: "Kuviot ilmestyvät tähän",

      description: "Kun kirjaat fokuksen, tehtäviä, siivousta ja menoja, rytmit näkyvät."

    },

    lifeFlow: {

      title: "Virtasi ilmestyy tähän",

      description: "Tehtävien, fokuksen, menojen ja kodin hoidon myötä hetket kertyvät päivittäin."

    },

    tasks: {

      title: "Ei tehtäviä vielä",

      description: "Lisää tehtävä, kun jokin on mielessä."

    },

    cleaning: {

      title: "Koti on rauhallinen tänään",

      description: "Lisää alue, jos haluat lempeät muistutukset kodin hoidosta."

    }

  },

  form: {

    zoneName: "Alueen nimi",

    everyDays: "Väli (päivää)",

    taskTitle: "Tehtävän nimi",

    priority: "Prioriteetti",

    amount: "Summa",

    category: "Kategoria",

    note: "Muistiinpano",

    type: "Tyyppi"

  },

  dashboard: dashboardMessages,

  work: workMessages,

  life: lifeMessages,

  finance: financeMessages,

  insights: insightsMessages

} satisfies import("@/lib/i18n/types").Messages;


