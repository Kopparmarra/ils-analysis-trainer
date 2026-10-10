# ILS Analysis Trainer v37 – Central repair trade-offs

En svensk, fristående lärapp för grundläggande LORA-resonemang med fiktiva data och förenklade beräkningar.

## Starta

Öppna `index.html` i en modern webbläsare. Alla fyra appfiler (`index.html`, `styles.css`, `data.js`, `app.js`) ska ligga i samma mapp.

## Innehåll

- `index.html` – gränssnitt och metodnoter
- `styles.css` – layout och styling
- `data.js` – fiktiv systemstruktur och modellantaganden
- `app.js` – logik, uppdragsflöde och LORA-guide (Claude-versionen som användaren tillhandahöll)
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
