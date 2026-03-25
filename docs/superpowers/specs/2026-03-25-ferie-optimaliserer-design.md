# Ferie-optimaliserer – Design Spec

_Dato: 2026-03-25_

## Oversikt

En norsk ferieplanlegger-webapp som viser hvor mange sammenhengende fridager man kan få ved å legge feriedager strategisk rundt norske helligdager. Appen er ikke en kalender – den er en deal-finder som viser effektiviteten av ulike ferievalg.

---

## Mål og suksesskriterier

- Bruker ser umiddelbart: "Ta X feriedager → Få Y dager sammenhengende fri"
- Beste deal er prominent synlig uten scrolling (hero-kort)
- Alle alternativer er rangert etter effektivitet (dager fri / feriedager brukt)
- Appen fungerer godt på mobil
- Ingen backend – statisk deploy til Vercel

---

## Stack

- **Framework:** Angular 18, standalone components
- **Styling:** TailwindCSS
- **State:** Angular Signals
- **Data:** Hardkodet TypeScript (ingen API)
- **Deploy:** Vercel (statisk build via `ng build`)

---

## Filstruktur

```
src/
  app/
    data/
      holidays.data.ts              ← norske helligdager 2026 + 2027
    services/
      vacation-optimizer.service.ts ← beregningslogikk
    components/
      period-selector/              ← pill-knapper + år-switch
        period-selector.component.ts
        period-selector.component.html
      hero-deal/                    ← stort deal-kort
        hero-deal.component.ts
        hero-deal.component.html
      day-strip/                    ← fargestipe tidslinje
        day-strip.component.ts
        day-strip.component.html
      alternatives-list/            ← rangert liste
        alternatives-list.component.ts
        alternatives-list.component.html
    app.component.ts
    app.component.html
```

---

## Data: Norske helligdager

Hardkodes i `holidays.data.ts` som en liste av `{ date: string, names: string[] }`. En dato kan ha flere navn (f.eks. 17. mai 2027 er både Grunnlovsdagen og 2. pinsedag) – bruk `names[0]` som visningsnavn. En dato kan forekomme i flere periodevindu – dette er forventet og hvert vindu beregnes uavhengig.

### 2026
| Dato | Navn |
|---|---|
| 1. jan | Nyttårsdag |
| 2. apr | Skjærtorsdag |
| 3. apr | Langfredag |
| 5. apr | 1. påskedag |
| 6. apr | 2. påskedag |
| 1. mai | Arbeidernes dag |
| 14. mai | Kristi Himmelfartsdag |
| 17. mai | Grunnlovsdagen |
| 24. mai | 1. pinsedag |
| 25. mai | 2. pinsedag |
| 25. des | 1. juledag |
| 26. des | 2. juledag |

### 2027
| Dato | Navn |
|---|---|
| 1. jan | Nyttårsdag |
| 25. mar | Skjærtorsdag |
| 26. mar | Langfredag |
| 28. mar | 1. påskedag |
| 29. mar | 2. påskedag |
| 1. mai | Arbeidernes dag |
| 6. mai | Kristi Himmelfartsdag |
| 16. mai | 1. pinsedag |
| 17. mai | Grunnlovsdagen + 2. pinsedag |
| 25. des | 1. juledag |
| 26. des | 2. juledag |

### Perioder (windows)
Hvert period-alternativ har et definert vindu av dager som analyseres:

| Periode | Vindu 2026 | Vindu 2027 |
|---|---|---|
| Påske | 28. mar – 12. apr | 22. mar – 4. apr |
| 1. mai | 27. apr – 4. mai | 27. apr – 4. mai |
| 17. mai | 14. mai – 21. mai | 14. mai – 21. mai |
| Pinse | 21. mai – 28. mai | 13. mai – 20. mai |
| Kristi Himmelfartsdag | 11. mai – 17. mai | 3. mai – 9. mai |
| Jul | 23. des – 28. des | 23. des – 28. des |
| Nyttår | 29. des – 2. jan | 29. des – 2. jan |

---

## Beregningsalgoritme (`vacation-optimizer.service.ts`)

**Input:** Et periodevindu (startdato, sluttdato) og listen av helligdager.

**Fremgangsmåte:**
1. Generer alle dager i vinduet, merk hver dag:
   - `red` = helligdag eller lørdag/søndag
   - `green` = feriedag (foreslått av appen)
   - `white` = arbeidsdag
2. Beregn **baseline**: lengste naturlige strekk uten noen feriedager (kun `red`-dager). Vis dette som informasjonsrad øverst i listen uten effektivitetsberegning (f.eks. "Uten feriedager: 4 dager fri"). Inkluder ikke i rangeringen.
3. Finn alle arbeidsdager i vinduet (kandidater for feriedager)
4. Generer alle kombinasjoner av 1–10 feriedager blant arbeidsdagene
5. For hver kombinasjon:
   - **Strekk-definisjon:** Lengste sammenhengende strekk er den lengste ubrutte rekken av dager i vinduet der hver dag er enten `red` eller `green`. En `white`-dag bryter strekket.
   - Beregn effektivitet = `sammenhengende dager / antall feriedager brukt`
6. Ranger etter effektivitet (høyest først). **Tiebreaker:** ved lik effektivitet, ranger etter `consecutiveDays` (flest dager vinner), deretter etter `vacationDaysUsed` (færrest dager brukt vinner).
7. Grupper/dedupliser: behold bare beste kombinasjon per antall feriedager. For kombinasjoner med likt feriedagsantall og lik effektivitet: behold den med flest `consecutiveDays`. **Utfør deduplisering før global rangering.**
8. Ranger den dedupliserte listen etter effektivitet (tiebreaker fra steg 6 gjelder fortsatt).
9. Returner `{ baseline: BaselinePeriod, deals: DealOption[] }` (deals ekskl. baseline)

**Output-type:**
```typescript
interface DealOption {
  vacationDaysUsed: number;
  consecutiveDays: number;
  efficiency: number;          // consecutiveDays / vacationDaysUsed, avrundet til 1 desimal
  days: DayEntry[];            // ALLE dager i periodevinduet (inkl. white-dager)
  streakStart: number;         // indeks i days[] der det lengste strekket starter
  streakEnd: number;           // indeks i days[] der det lengste strekket slutter (inklusiv)
}

interface BaselinePeriod {
  consecutiveDays: number;
  days: DayEntry[];
  streakStart: number;   // indeks i days[] der det naturlige strekket starter
  streakEnd: number;     // indeks i days[] der det naturlige strekket slutter (inklusiv)
}

interface DayEntry {
  date: string;                // ISO-format, f.eks. "2026-04-02"
  type: 'red' | 'green' | 'white';
  label: string;               // "28", "29" osv.
  weekday: string;             // "Ma", "Ti" osv.
  holidayName?: string;        // navn på helligdag om red og helligdag (ikke helg)
}
```

`DayStripComponent` aksepterer kun `DealOption` og bruker `streakStart`/`streakEnd` for å rendere kun dagene i strekket. Hvite arbeidsdager utenfor strekket vises ikke i stripen. Baseline renderes som tekstrad inne i `AlternativesListComponent`, ikke via `DayStripComponent`.

---

## UI-design

### Visuell stil
- **Bakgrunn:** Hvit / lys grå (`#f0fdf4` for hero-seksjon)
- **Primærfarge:** Grønn (`#22c55e` / `#16a34a`)
- **Røde dager:** `#fca5a5` (bakgrunn) / `#991b1b` (tekst)
- **Feriedager:** `#86efac` (bakgrunn) / `#166534` (tekst)
- **Font:** System-font stack (Inter om tilgjengelig)

### Side-layout (én side, ingen routing)
```
Header: "🌴 Ferieoptimaliserer" + år-switch (2026 / 2027)
Period pills: [Påske] [1. mai] [17. mai] [Pinse] [Kristi H.] [Jul] [Nyttår]
─────────────────────────────────────────────────
Hero-deal kort (grønn):
  Beste deal – [Periode] [År]
  "Ta X feriedager → Få Y dager sammenhengende fri"
  Effektivitet: Z×
─────────────────────────────────────────────────
Fargestipe (day-strip):
  [farge][farge][farge]...[farge]
   28     29     30  ...   dato
  ← Y sammenhengende fridager →
  Forklaring: 🔴 fri uansett  🟢 feriedag du tar
─────────────────────────────────────────────────
Andre alternativer:
  ├ 3 dager → 12 dager (4.0×)
  ├ 5 dager → 16 dager (3.2×)
  └ 1 dag  → 4 dager  (4.0×)
```

### Mobil
- Period pills: horisontal scroll (`overflow-x: auto`, `snap-x`)
- Hero-kort: full bredde
- Day-strip: horisontal scroll om nødvendig
- Alternatives-liste: stablede rader

---

## Komponenter

### `PeriodSelectorComponent`
- Input: liste av perioder, valgt periode (signal), valgt år (signal)
- Emits: valgt periode, valgt år
- UI: pill-knapper + år-toggle (2026 / 2027)

### `HeroDealComponent`
- Input: beste `DealOption`
- UI: grønt kort med stor tekst "Ta X dager → Y dager fri", effektivitet

### `DayStripComponent`
- Input: `DealOption` (beste deal). Brukes kun for hero-deal – baseline renderes ikke via denne komponenten.
- UI: sammenhengende fargestipe, datoer under, pil-label med total strekk, forklaring

### `AlternativesListComponent`
- Input: `deals: DealOption[]` (ekskl. beste deal som vises i hero), `baseline: BaselinePeriod`
- UI: baselineinfo øverst ("Uten feriedager: X dager fri"), deretter rangert liste med "X dager → Y dager (Z×)" per rad

### `AppComponent`
- Holder Signals: `selectedPeriod`, `selectedYear`
- Injiserer `VacationOptimizerService`
- Computed signal: `result = optimizer.calculate(selectedPeriod, selectedYear)` returnerer `{ baseline: BaselinePeriod, deals: DealOption[] }`
- Passer `result.deals[0]` til HeroDeal og DayStrip, `result.deals.slice(1)` og `result.baseline` til AlternativesList

---

## Vercel-deploy

- `vercel.json` med `outputDirectory: dist/ferie-optimaliserer/browser`
- `ng build --configuration production` som build-kommando
- Ingen server-side rendering (statisk)

---

## Verifisering

1. `ng serve` – appen starter lokalt
2. Velg "Påske 2026" – hero-kort viser "Ta 1 feriedag → Få 6 dager fri" (6.0×)
   - Forklaring: Tirsdag 7. april (dagen etter 2. påskedag) er eneste feriedag. Strekket er torsdag 2. apr (Skjærtorsdag) til tirsdag 7. apr = 6 dager.
3. Alternativer viser bl.a. "3 dager → 10 dager (3.3×)" (30+31 mar + 1 apr bruer inn i påsken)
4. Fargestipe viser sammenhengende rød-grønn stipe korrekt
4. Bytt til "2027" – innholdet oppdateres reaktivt
5. Bytt periode til "Jul 2026" – nytt hero-kort og tidslinje
6. Mobil-test: period pills scroller horisontalt, alt er lesbart
7. `ng build` – bygger uten feil, output i `dist/`
8. Deploy til Vercel – appen er tilgjengelig på Vercel-URL
