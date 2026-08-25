// Every word either version of this page shows, in one table.
//
// Kept DOM-free on purpose, like the motion and readout mappings: a unit test
// can read this directly and check the two locales against each other, which
// is the only way to catch a string added in one language and forgotten in the
// other. Inferring that from the built HTML would only find it after it shipped.
//
// What is NOT in here: the cabinet nameplate and the header wordmark. A
// nameplate is a physical plate stamped by whoever built the instrument, and a
// real one carries the maker's script wherever the instrument is played. So the
// brass keeps its Latin lettering in both versions, and everything the *document*
// says — title, heading, hint, plaque, panel, accessible names — translates.

export type Locale = "en" | "zh";

export interface Strings {
  /** The `lang` attribute on <html>. */
  readonly lang: string;
  /** og:locale, which wants underscores and a region. */
  readonly ogLocale: string;
  /** How this language names itself, for the switch link. */
  readonly endonym: string;
  /** This page's own path, relative, as the switch link and hreflang use it. */
  readonly href: string;
  /** This page's link-preview card, relative. */
  readonly card: string;
  readonly title: string;
  readonly description: string;
  readonly navLabel: string;
  readonly heading: string;
  /**
   * The stage's accessible name. For a screen reader this is the entire
   * instruction set — the visible hint is decorative by comparison — so an
   * untranslated one is a silent regression rather than a visible bug.
   */
  readonly stageLabel: string;
  readonly hint: string;
  /** Hz is Hz. The one string that is deliberately the same in both. */
  readonly meterUnit: string;
  readonly infoToggle: string;
  readonly panelLabel: string;
  readonly panel: readonly string[];
}

const en: Strings = {
  lang: "en-AU",
  ogLocale: "en_AU",
  endonym: "English",
  href: "./",
  card: "./card.png",
  title: "Theremin",
  description:
    "A browser theremin in a wood-and-brass cabinet: drag, tap, tilt your phone or press arrow keys to bend pitch and volume, with a lit meter reading the pitch you play.",
  navLabel: "Primary",
  heading: "Theremin",
  stageLabel:
    "Theremin play surface. Drag or tap to play; left and right change pitch, up and down change volume. When focused, arrow keys do the same. On a phone, rolling the device while a note sounds bends the pitch and tipping it away damps the volume.",
  hint: "touch, click, or focus and press an arrow key",
  meterUnit: "Hz",
  infoToggle: "how it works",
  panelLabel: "How this instrument works",
  panel: [
    "A theremin is played without touching it: you move your hands through the field around two antennas, and the sound follows. The vertical rod sets the pitch, the loop sets the volume.",
    "Here the whole screen is that field. Drag or tap anywhere — left to right bends the pitch, bottom to top swells the volume. Both are continuous, so there is no note to miss. Focus the surface and hold an arrow key to play it from the keyboard.",
    "On a phone, the hand holding it is your second hand. While a note is sounding, roll the device to bend the pitch and tip it away from you to damp the volume — both measured from however you were holding it when the note began, so there is no pose you have to find first.",
  ],
};

const zh: Strings = {
  lang: "zh-Hans",
  ogLocale: "zh_CN",
  endonym: "中文",
  href: "./zh.html",
  card: "./card-zh.png",
  title: "特雷门琴",
  description:
    "浏览器里的特雷门琴，装在木质与黄铜的琴箱中：拖动、点击、翻转手机或按方向键即可改变音高与音量，箱上的发光仪表显示你正在演奏的频率。",
  navLabel: "主导航",
  heading: "特雷门琴",
  stageLabel:
    "特雷门琴演奏区。拖动或点击即可演奏；左右改变音高，上下改变音量。聚焦后，方向键的作用相同。在手机上，音符响起时左右翻转设备可以弯折音高，将设备向前倾斜可以减弱音量。",
  hint: "触摸、点击，或聚焦后按方向键",
  meterUnit: "Hz",
  infoToggle: "工作原理",
  panelLabel: "这件乐器的工作原理",
  panel: [
    "特雷门琴演奏时不需要触碰琴身：双手在两根天线周围的电场中移动，声音便随之而来。竖直的杆控制音高，环形的天线控制音量。",
    "在这里，整个屏幕就是那片电场。在任意位置拖动或点击 —— 从左到右升高音高，从下到上增强音量。两者都是连续的，因此没有会错过的音符。聚焦演奏区后按住方向键，也能用键盘演奏。",
    "在手机上，握着手机的那只手就是你的第二只手。当有音符正在响时，左右翻转设备可以弯折音高，将设备向前倾斜可以减弱音量 —— 两者都以音符开始时的握持姿势为基准，所以不需要先找到某个特定的姿势。",
  ],
};

export const LOCALES: Record<Locale, Strings> = { en, zh };

/** Switch order, so the nav lists languages the same way on every page. */
export const ORDER: readonly Locale[] = ["en", "zh"];

/**
 * The keys a reader actually reads. `lang`, `ogLocale`, `href` and `card` are
 * machinery rather than copy, and `meterUnit` is deliberately identical, so the
 * translation-parity check names this list rather than walking every key.
 */
export const TRANSLATED_KEYS = [
  "title",
  "description",
  "navLabel",
  "heading",
  "stageLabel",
  "hint",
  "infoToggle",
  "panelLabel",
] as const satisfies readonly (keyof Strings)[];
