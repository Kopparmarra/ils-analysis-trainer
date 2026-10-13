# ILS Analysis Trainer

En fristående lärapp för att utforska grundläggande LORA- och ILS-resonemang med fiktiva komponentdata. Appen kombinerar en stegvis kurs med ett interaktivt analyslabb.

## Lärflöde

1. **Börja i kursen.** Kursen innehåller 40 frågor i fem kapitel. En fråga visas åt gången, fel svar ger återkoppling och du behöver svara rätt för att gå vidare.
2. **Tillämpa i labbet.** Öppna analyslabbet från kursen för att ändra antaganden, jämföra underhållsstrategier och se hur resultaten påverkas.
3. **Använd labbets vägledning.** Uppdragen i högerspalten ger praktiska steg. LORA-miniguiden i labbet är en kompletterande fördjupning som leder genom ett förenklat beslut steg för steg.
4. **Gå tillbaka till kursen.** Kursen återupptas på den senast visade frågan. Kursframsteg sparas lokalt i webbläsaren.

## Kom igång

Öppna `index.html` i en modern webbläsare eller publicera samtliga filer i samma katalog via GitHub Pages. `course.js` behövs för kursen; utan den fungerar inte kursflödet.

## Filer

- `index.html` – gränssnitt och struktur
- `styles.css` – layout, komponentstilar och gemensamma designvariabler
- `data.js` – exempeldata och modellantaganden
- `app.js` – analyslabb, uppdrag och LORA-miniguide
- `course.js` – kursfrågor, kapitel, återkoppling och sparat kursframsteg
- `CHANGELOG.md` – kort versionshistorik
- `LICENSE` – licens

## Modellens omfattning och begränsningar

Appen är en pedagogisk demonstration, inte en validerad LORA/LSA-analys eller en godkänd teknisk rekommendation. Exempeldata är fiktiva och beräkningarna är förenklade heuristiker. Resultat beror på antaganden och ska inte användas som verkliga projektbeslut utan oberoende verifiering.

Var särskilt uppmärksam på skillnaden mellan:
- **MTTR** – aktiv tid för reparation/återställning enligt modellens definition
- **TAT** – genomloppstid genom reparationsflödet
- **Ao** – operativ tillgänglighet enligt modellens antaganden
- **Livscykelkostnad** – direkta kostnader och eventuella modellerade stilleståndskostnader

Kontrollera alltid vilken kostnad som ingår i en jämförelse, vilken analysperiod som används och om en vald strategi faktiskt är tillgänglig i det aktuella scenariot.

## Publicering

Publicera hela paketet tillsammans. Kontrollera att `index.html`, `styles.css`, `data.js`, `app.js` och `course.js` ligger på samma nivå och att filnamn och versaler stämmer exakt.
