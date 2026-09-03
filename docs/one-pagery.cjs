/**
 * Kalkulator Rezyliencji FNP — 3 warianty one-pagera do wyboru przez Emilię.
 * Styl: Editoria (krem, czerń, akcent). Palette from finance editorial template.
 */
const pptxgen = require("pptxgenjs");
const path = require("path");

const C = {
  ink: "0F0F0E",
  cream: "F1EDE2",
  creamSoft: "E8E2D2",
  creamLine: "C9C2AF",
  textDark: "1A1A18",
  textMute: "6B6657",
  textOnDark: "E8E2D2",
  textMuteDk: "8A8470",
  gold: "B8923B",
  rust: "B81A1A",
  rustDark: "6B2415",
  hairline: "B8B2A0",
  white: "FCFCFA",
};

const F = {
  serif: "Georgia",
  mono: "Courier New",
  sans: "Arial",
};

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const MX = 0.6;
const QR = path.join(__dirname, "qr-fnp.png");
const URL = "fnp.silence-tax.com";
const FOOT = "FUNDACJA NOWE PRZESTRZENIE  ×  PAWEŁ MAMCARZ  ·  IPSOS × FNP 2026 (n=1000)  ·  BETA";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Paweł Mamcarz";
pres.title = "Kalkulator Rezyliencji FNP — one-pagery, 3 warianty";
pres.subject = "Do wyboru przez Emilię Brzóskę. Action item ze spotkania 10.08.2026.";

function addHeader(slide, kicker, right, opts = {}) {
  const dark = !!opts.dark;
  slide.addText(kicker, {
    x: MX, y: 0.32, w: 7.6, h: 0.28,
    fontFace: F.mono, fontSize: 11, bold: true,
    color: dark ? C.textOnDark : C.textDark, charSpacing: 3, margin: 0,
  });
  slide.addText(right, {
    x: 8.5, y: 0.32, w: SLIDE_W - 8.5 - MX, h: 0.28,
    fontFace: F.mono, fontSize: 10,
    color: dark ? C.textMuteDk : C.textMute, charSpacing: 2, align: "right", margin: 0,
  });
  slide.addShape(pres.shapes.LINE, {
    x: MX, y: 0.68, w: SLIDE_W - MX * 2, h: 0,
    line: { color: dark ? C.textMuteDk : C.hairline, width: 0.75 },
  });
}

function addFooter(slide, page, opts = {}) {
  const dark = !!opts.dark;
  slide.addShape(pres.shapes.LINE, {
    x: MX, y: 7.05, w: SLIDE_W - MX * 2, h: 0,
    line: { color: dark ? C.textMuteDk : C.hairline, width: 0.75 },
  });
  slide.addText(FOOT, {
    x: MX, y: 7.12, w: 10.4, h: 0.26,
    fontFace: F.mono, fontSize: 9,
    color: dark ? C.textMuteDk : C.textMute, charSpacing: 1.5, margin: 0,
  });
  slide.addText(page, {
    x: SLIDE_W - 1.5 - MX, y: 7.12, w: 1.5, h: 0.26,
    fontFace: F.mono, fontSize: 9,
    color: dark ? C.textMuteDk : C.textMute, align: "right", margin: 0,
  });
}

const CTA_URL = "https://fnp.silence-tax.com/?utm_source=onepager&utm_medium=print&utm_campaign=fnp_beta";

function addCta(slide, x, y, w, label) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 0.42,
    fill: { color: C.ink },
    hyperlink: { url: CTA_URL },
  });
  slide.addText(label, {
    x, y, w, h: 0.42,
    fontFace: F.mono, fontSize: 11, bold: true,
    color: C.cream, align: "center", valign: "middle",
    margin: 0, charSpacing: 1,
  });
}

// =============================================================================
// 01  Chooser for Emilia
// =============================================================================
function slideChooser() {
  const s = pres.addSlide();
  s.background = { color: C.ink };
  addHeader(s, "KALKULATOR REZYLIENCJI FNP", "DO WYBORU  ·  WRZESIEŃ 2026", { dark: true });

  s.addText("Trzy one-pagery.", {
    x: MX, y: 1.05, w: 12, h: 0.7,
    fontFace: F.serif, fontSize: 36, color: C.cream, margin: 0,
  });
  s.addText("Każdy jest kompletny: nagłówek, lead, treść, dowód, CTA. Wybierz jeden do druku i do maila.", {
    x: MX, y: 1.78, w: 11.2, h: 0.5,
    fontFace: F.serif, fontSize: 16, italic: true, color: C.gold, margin: 0,
  });

  const cards = [
    { n: "A", title: "CFO", use: "Zarządy i finanse", line: "Ile Twoja firma traci na milczeniu?" },
    { n: "B", title: "Narracyjny", use: "Media i publiczność", line: "Najdroższe słowa to te, które nigdy nie padły." },
    { n: "C", title: "Trójkąt", use: "Partnerzy i sprzedaż", line: "Od liczby do planu w trzech krokach." },
  ];
  cards.forEach((c, i) => {
    const x = MX + i * 4.05;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.55, w: 3.85, h: 3.15,
      fill: { color: "1C1C1A" },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.55, w: 0.1, h: 3.15,
      fill: { color: C.rust },
    });
    s.addText("WARIANT " + c.n, {
      x: x + 0.28, y: 2.72, w: 3.4, h: 0.28,
      fontFace: F.mono, fontSize: 11, color: C.gold, charSpacing: 3, margin: 0,
    });
    s.addText(c.title, {
      x: x + 0.28, y: 3.08, w: 3.4, h: 0.5,
      fontFace: F.serif, fontSize: 26, color: C.cream, margin: 0,
    });
    s.addText(c.use, {
      x: x + 0.28, y: 3.62, w: 3.4, h: 0.32,
      fontFace: F.sans, fontSize: 13, color: C.textMuteDk, margin: 0,
    });
    s.addText(c.line, {
      x: x + 0.28, y: 4.15, w: 3.4, h: 1.2,
      fontFace: F.serif, fontSize: 16, italic: true, color: C.textOnDark, margin: 0,
    });
  });

  addFooter(s, "01 / 04", { dark: true });
}

// =============================================================================
// 02  Variant A — CFO
// =============================================================================
function slideCfo() {
  const s = pres.addSlide();
  s.background = { color: C.cream };
  addHeader(s, "WARIANT A  ·  CFO", "DO ZARZĄDÓW");

  s.addText("Ile Twoja firma traci na milczeniu?", {
    x: MX, y: 0.85, w: 9.4, h: 0.85,
    fontFace: F.serif, fontSize: 32, color: C.ink, margin: 0,
  });
  s.addText("Kiedy ludzie nie mówią o problemach, firma płaci. Kalkulator Rezyliencji FNP przelicza deficyt bezpieczeństwa psychologicznego na roczny koszt w PLN. W 5 minut, na danych, które znasz z głowy.", {
    x: MX, y: 1.72, w: 9.2, h: 0.78,
    fontFace: F.serif, fontSize: 14, color: C.textDark, margin: 0,
  });

  // Left: inputs
  s.addShape(pres.shapes.RECTANGLE, {
    x: MX, y: 2.62, w: 4.35, h: 2.55,
    fill: { color: C.white },
    line: { color: C.creamLine, width: 1 },
  });
  s.addText("CO WPISUJESZ", {
    x: MX + 0.22, y: 2.74, w: 3.9, h: 0.26,
    fontFace: F.mono, fontSize: 10, color: C.rust, charSpacing: 2, margin: 0,
  });
  s.addText("Przychody, koszty, zatrudnienie, przeciętne wynagrodzenie, rotacja. Plus suwak klimatu. Żadnych ankiet, żadnych danych osobowych.", {
    x: MX + 0.22, y: 3.08, w: 3.9, h: 1.85,
    fontFace: F.serif, fontSize: 14, color: C.textDark, margin: 0,
  });

  // Right: five areas
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.15, y: 2.62, w: 4.85, h: 2.55,
    fill: { color: C.white },
    line: { color: C.creamLine, width: 1 },
  });
  s.addText("CO DOSTAJESZ", {
    x: 5.37, y: 2.74, w: 4.45, h: 0.26,
    fontFace: F.mono, fontSize: 10, color: C.rust, charSpacing: 2, margin: 0,
  });
  const areas = [
    "01  Rotacja i utrata wiedzy",
    "02  Błędy i compliance",
    "03  Wypalenie i pasywność",
    "04  Utracone innowacje",
    "05  Koordynacja i hierarchia",
  ];
  s.addText(
    areas.map((t, i) => ({
      text: t,
      options: { breakLine: i < areas.length - 1 },
    })),
    {
      x: 5.37, y: 3.08, w: 4.45, h: 1.9,
      fontFace: F.serif, fontSize: 14, color: C.textDark, paraSpaceAfter: 4, margin: 0,
    }
  );

  // Stat rail
  s.addShape(pres.shapes.RECTANGLE, {
    x: 10.2, y: 0.85, w: 2.53, h: 4.32,
    fill: { color: C.ink },
  });
  s.addText("DO", {
    x: 10.35, y: 1.05, w: 2.23, h: 0.28,
    fontFace: F.mono, fontSize: 11, color: C.gold, charSpacing: 3, margin: 0,
  });
  s.addText("5%", {
    x: 10.28, y: 1.32, w: 2.35, h: 1.15,
    fontFace: F.serif, fontSize: 54, color: C.cream, margin: 0,
  });
  s.addText("przychodów. Dla wielu firm to cała marża. Mówimy „do”, nigdy „dokładnie”.", {
    x: 10.35, y: 2.55, w: 2.23, h: 1.35,
    fontFace: F.serif, fontSize: 13, color: C.textOnDark, margin: 0,
  });
  s.addText("Scenariusz skali, nie wycena księgowa.", {
    x: 10.35, y: 4.05, w: 2.23, h: 0.85,
    fontFace: F.serif, fontSize: 12, italic: true, color: C.gold, margin: 0,
  });

  s.addText("Dowód: model na publicznych badaniach naukowych, kalibracja Ipsos × Fundacja Nowe Przestrzenie 2026 (n=1000).", {
    x: MX, y: 5.32, w: 8.4, h: 0.4,
    fontFace: F.sans, fontSize: 12, color: C.textMute, margin: 0,
  });

  addCta(s, MX, 5.82, 3.6, "POLICZ SWOJĄ FIRMĘ  →");
  s.addText("Chcesz realny pomiar zamiast scenariusza? Diagnoza FNP: pawel@mamcarz.com", {
    x: 4.4, y: 5.88, w: 5.6, h: 0.35,
    fontFace: F.serif, fontSize: 12, color: C.textDark, valign: "middle", margin: 0,
  });
  s.addImage({ path: QR, x: 10.7, y: 5.32, w: 1.55, h: 1.55 });

  addFooter(s, "02 / 04");
}

// =============================================================================
// 03  Variant B — Narrative
// =============================================================================
function slideNarrative() {
  const s = pres.addSlide();
  s.background = { color: C.cream };
  addHeader(s, "WARIANT B  ·  NARRACYJNY", "DO MEDIÓW I PUBLICZNOŚCI");

  s.addText("Najdroższe słowa to te, które nigdy nie padły.", {
    x: MX, y: 0.82, w: 10.4, h: 0.72,
    fontFace: F.serif, fontSize: 28, color: C.ink, margin: 0,
  });
  s.addText("W polskich firmach ludzie milczą: o błędach, o pomysłach, o tym, że odchodzą. Milczenie wygląda jak spokój, a działa jak podatek, którego nikt nie uchwalił, ale wszyscy płacą. Fundacja Nowe Przestrzenie policzyła, ile wynosi.", {
    x: MX, y: 1.55, w: 10.5, h: 0.7,
    fontFace: F.serif, fontSize: 14, color: C.textDark, margin: 0,
  });

  const rows = [
    { n: "01", quote: "Najdroższe exit interview to to, które nigdy się nie odbyło.", tag: "rotacja i wiedza" },
    { n: "02", quote: "Każdy kryzys ma w raporcie zdanie „pracownicy wiedzieli wcześniej”.", tag: "błędy i compliance" },
    { n: "03", quote: "Pensja płacona w 100%, obecność w 60%.", tag: "wypalenie i pasywność" },
    { n: "04", quote: "Najdroższy pomysł w firmie to ten, który został w czyjejś głowie.", tag: "innowacje" },
    { n: "05", quote: "Głuchy telefon, w którym każdy szczebel mówi „jest dobrze”.", tag: "koordynacja" },
  ];
  rows.forEach((r, i) => {
    const y = 2.38 + i * 0.62;
    s.addText(r.n, {
      x: MX, y, w: 0.55, h: 0.52,
      fontFace: F.mono, fontSize: 12, color: C.rust, valign: "middle", margin: 0,
    });
    s.addText(r.quote, {
      x: 1.25, y, w: 8.3, h: 0.52,
      fontFace: F.serif, fontSize: 15, italic: true, color: C.ink, valign: "middle", margin: 0,
    });
    s.addText(r.tag, {
      x: 9.65, y, w: 3.05, h: 0.52,
      fontFace: F.mono, fontSize: 10, color: C.textMute, valign: "middle", align: "right", margin: 0,
    });
    if (i < rows.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: 1.25, y: y + 0.54, w: 11.45, h: 0,
        line: { color: C.creamLine, width: 0.75 },
      });
    }
  });

  s.addText("Dowód: Ipsos × FNP 2026, 1000 pracujących Polaków, plus publiczne badania z 50 lat ekonomii i psychologii organizacji.", {
    x: MX, y: 5.55, w: 8.5, h: 0.38,
    fontFace: F.sans, fontSize: 12, color: C.textMute, margin: 0,
  });
  addCta(s, MX, 6.0, 4.3, "SPRAWDŹ KOSZT MILCZENIA  →");
  s.addText("Rezyliencja zaczyna się od głosu.", {
    x: 5.1, y: 6.05, w: 4.8, h: 0.35,
    fontFace: F.serif, fontSize: 13, italic: true, color: C.textDark, valign: "middle", margin: 0,
  });
  s.addImage({ path: QR, x: 11.35, y: 5.38, w: 1.38, h: 1.38 });

  addFooter(s, "03 / 04");
}

// =============================================================================
// 04  Variant C — Triangle
// =============================================================================
function slideTriangle() {
  const s = pres.addSlide();
  s.background = { color: C.cream };
  addHeader(s, "WARIANT C  ·  TRÓJKĄT", "DO ROZMÓW HANDLOWYCH I PARTNERÓW");

  s.addText("Od liczby do planu w trzech krokach.", {
    x: MX, y: 0.82, w: 12, h: 0.58,
    fontFace: F.serif, fontSize: 28, color: C.ink, margin: 0,
  });
  s.addText("Kalkulator Rezyliencji FNP to pierwszy krok procesu, który zamienia niewygodną liczbę w konkretny plan wzmocnienia organizacji.", {
    x: MX, y: 1.42, w: 12.1, h: 0.48,
    fontFace: F.serif, fontSize: 14, color: C.textDark, margin: 0,
  });

  const steps = [
    { n: "01", title: "Kalkulator", role: "prolog", body: "Scenariusz rocznych strat z milczenia w PLN, w 5 minut, na pięciu danych finansowych. Otwiera rozmowę." },
    { n: "02", title: "Diagnoza FNP", role: "badanie", body: "Realny pomiar Twojej organizacji zamiast średniej krajowej. Diagnoza zawsze poprzedza działania." },
    { n: "03", title: "Interwencje", role: "terapia", body: "Warsztaty komunikacyjne, informacyjne i behawioralne, dobrane do wyniku diagnozy, z budżetem i oczekiwanym zwrotem." },
  ];
  steps.forEach((st, i) => {
    const x = MX + i * 4.05;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.05, w: 3.85, h: 2.55,
      fill: { color: C.white },
      line: { color: C.creamLine, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.05, w: 3.85, h: 0.08,
      fill: { color: C.rust },
    });
    s.addText(st.n + "  ·  " + st.role.toUpperCase(), {
      x: x + 0.22, y: 2.28, w: 3.4, h: 0.26,
      fontFace: F.mono, fontSize: 10, color: C.rust, charSpacing: 1.5, margin: 0,
    });
    s.addText(st.title, {
      x: x + 0.22, y: 2.58, w: 3.4, h: 0.4,
      fontFace: F.serif, fontSize: 20, color: C.ink, margin: 0,
    });
    s.addText(st.body, {
      x: x + 0.22, y: 3.08, w: 3.4, h: 1.3,
      fontFace: F.serif, fontSize: 13, color: C.textDark, margin: 0,
    });
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: MX, y: 4.78, w: 8.55, h: 1.95,
    fill: { color: C.ink },
  });
  s.addText("ZASADA", {
    x: MX + 0.28, y: 4.92, w: 8, h: 0.24,
    fontFace: F.mono, fontSize: 10, color: C.gold, charSpacing: 3, margin: 0,
  });
  s.addText("Nie sprzedajemy narzędzia. Sprzedajemy przejście: ile tracisz → dlaczego → ile zainwestować, żeby tracić mniej. Interwencje wychodzą z diagnozy, nie z katalogu.", {
    x: MX + 0.28, y: 5.22, w: 8, h: 0.85,
    fontFace: F.serif, fontSize: 15, color: C.cream, margin: 0,
  });
  s.addText("Dowód: metodologia jawna, badania publiczne, kalibracja Ipsos × FNP 2026 (n=1000), kod otwarty.", {
    x: MX + 0.28, y: 6.12, w: 8, h: 0.4,
    fontFace: F.sans, fontSize: 12, color: C.textMuteDk, margin: 0,
  });

  s.addImage({ path: QR, x: 10.45, y: 4.78, w: 1.35, h: 1.35 });
  addCta(s, 9.55, 6.22, 3.18, "ZACZNIJ OD LICZBY  →");
  s.addText("Umów diagnozę: pawel@mamcarz.com", {
    x: 9.55, y: 6.7, w: 3.18, h: 0.24,
    fontFace: F.sans, fontSize: 11, color: C.textMute, margin: 0,
  });

  addFooter(s, "04 / 04");
}

slideChooser();
slideCfo();
slideNarrative();
slideTriangle();

pres.writeFile({ fileName: path.join(__dirname, "Kalkulator-Rezyliencji-FNP-one-pagery.pptx") })
  .then(() => console.log("wrote docs/Kalkulator-Rezyliencji-FNP-one-pagery.pptx"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
