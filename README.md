# ILS Analysis Trainer v44 – MTTR increase prediction

En svensk, fristående lärapp för grundläggande LORA-resonemang med fiktiva data och förenklade beräkningar.

## Starta

Öppna `index.html` i en modern webbläsare. Alla fyra appfiler (`index.html`, `styles.css`, `data.js`, `app.js`) ska ligga i samma mapp.

## Innehåll

- `index.html` – gränssnitt och metodnoter
- `styles.css` – layout och styling
- `data.js` – fiktiv systemstruktur och modellantaganden
- `app.js` – logik, uppdragsflöde och LORA-guide
- Uppdrag 1: förutsäg nu effekten av att höja MTTR. Uppgiften kräver att värdet faktiskt höjs över utgångsvärdet; sänkning eller annan ändring räknas inte som slutförd. Förklaringen efter ändringen beskriver konsekvensen för Ai och Ao.
- `LICENSE` – licens

## Viktigt

Detta är en pedagogisk demonstration, inte en godkänd LORA/ILS-analys eller en validerad prognos. Kontrollera antaganden och modellens begränsningar innan resultaten används utanför övningen.


### LORA guide refinement
The first LORA question is intentionally simplified to compare repair cost only. Transport, BER, and test-equipment investment are introduced in later steps. The first question is visually highlighted to make the starting point clearer.


## v35 – pedagogisk progression
- LORA-guiden går stegvis från direktkostnad till investering, transport, BER, brytpunkt och kassering.
- Första frågan introducerar de tre alternativen och skjuter upp transport och BER.
- Äldre sparade svar i LORA-guiden nollställs en gång eftersom frågornas ordning och innehåll har ändrats. Övriga sparade komponentdata och beslut behålls.


## v36 – Pedagogical break-even exercise
- LORA question 5 now teaches the break-even calculation even when the current baseline scenario has no positive break-even.
- If baseline assumptions support a positive break-even, the guide calculates it from those assumptions. Otherwise, it presents a clearly labeled separate illustrative scenario and explicitly preserves the baseline conclusion.
- The example is a simplified investment-payback calculation, not a complete lifecycle-cost result.


## v37 – Central repair trade-offs
- Reframes test equipment as a requirement that may exist at both I-level and D-level, rather than assuming D-level uniquely needs it.
- Teaches the possible scale advantage of shared central specialist equipment across multiple user locations.
- Replaces the abstract break-even question with an illustrative comparison of setup cost savings versus transport cost per repair. The example is explicitly limited to those cost items.
- The conclusion distinguishes economic cost from operational availability and lead time; it avoids treating peacetime or wartime as an automatic rule.
- Resets saved LORA-guide answers once so old answers do not attach to the changed questions. Other saved data and decisions are preserved.


## v38 – Guided LORA decision bridge

- Extends the LORA learning guide with five scaffolded decision steps after the introductory cost, equipment, transport, BER and break-even concepts.
- The bridge progresses through technical feasibility, total relevant cost, lead time, operational constraints and a justified recommendation.
- Each question is answered before its explanation appears, reducing the jump from single-factor exercises to an independent LORA decision.
- Migrates the LORA guide to version 4 and resets its answers/step so earlier saved answers do not map to the new sequence; other saved progress is retained.
- This remains a simplified learning model, not a validated LORA assessment.


## v41 – Uppdrag 2 med Radiomodul
- Uppdrag 2 använder nu 02B01 Radiomodul i stället för en generell övning över flera komponenter.
- Användaren läser själv komponentunderlaget i mittenkolumnen, ändrar MTBF eller MTTR, fattar LORA-beslut, motiverar valet och granskar sammanfattningen.
- Stödet är något mindre än i Uppdrag 1, men varje avklarat steg har fortfarande en förklaring.
- När Uppdrag 2 startar väljs Radiomodul automatiskt och komponentens aktuella RAMS-värden sparas som jämförelsepunkt för övningen.
- De sparade svaren i LORA-miniguiden migreras en gång eftersom versionsnumret höjs.


## v43 – tydligare analysperiod och kostnadslogik
- Analysperioden visas direkt i LORA-panelen och hämtas dynamiskt från flottans antaganden.
- Förklarar att total kostnad inkluderar direkt livscykelkostnad plus modellerad stilleståndskostnad.
- Tabellen benämner raden ”Direkt livscykelkostnad (exkl. stillestånd)” så att den inte blandas ihop med totalsumman.
- Rekommendationen anger analysperiod och beskriver vilka kostnader som ingår i totalen.
