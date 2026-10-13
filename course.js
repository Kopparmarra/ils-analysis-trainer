/* v51: guided 40-question course. Fictional data and simplified model. */
(() => {
  const chapters = [
    {title:'Förstå analysen', range:[0,7], desc:'Data, RAMS och analysperiod'},
    {title:'Underhållsalternativ', range:[8,15], desc:'Kassera, I-level och D-level'},
    {title:'Logistik och tillgänglighet', range:[16,23], desc:'TAT, reservdelar och stillestånd'},
    {title:'Kostnad och osäkerhet', range:[24,31], desc:'Livscykelkostnad och känslighet'},
    {title:'Från analys till beslut', range:[32,39], desc:'Krav, kvalitet och rekommendation'}
  ];
  const Q = (chapter, title, prompt, opts, takeaway) => ({chapter,title,prompt,opts:opts.map(o=>({text:o[0],correct:o[1],feedback:o[2]})),takeaway});
  const questions = [
    Q(0,'Vad säger MTBF?','Du ska uppskatta hur ofta en komponent förväntas fallera under drift. Vilket värde hjälper dig främst?',[
      ['Genomsnittlig drifttid mellan fel.',true,'MTBF beskriver den genomsnittliga drifttiden mellan fel i den använda modellen.'],
      ['Genomsnittlig tid mellan registrerade serviceärenden.',false,'Serviceärenden kan omfatta annat än tekniska fel. MTBF bygger på drifttid och definierade felhändelser.'],
      ['Genomsnittlig kalendertid mellan två fel.',false,'Kalendertid omfattar även stillestånd och obrukad tid. Här avses drifttid mellan fel.']
    ],'MTBF påverkar hur många fel modellen förväntar sig, inte hur länge varje reparation tar.'),
    Q(0,'Vad betyder MTTR i den här modellen?','En motor behöver i genomsnitt 90 minuters aktivt arbete för byte eller reparation. Vilket begrepp passar?',[
      ['Tiden från felupptäckt till återställd funktion.',false,'Den tiden kan även omfatta felsökning, logistik och väntan. Frågan avser 90 minuter aktivt arbete.'],
      ['Den aktiva tiden för byte eller reparation.',true,'Rätt. Logistisk väntan kan tillkomma och ska inte automatiskt bakas in i MTTR.'],
      ['Den genomsnittliga verkstadstiden inklusive väntan.',false,'Verkstadens totala genomloppstid kan innehålla köer. MTTR avser här den aktiva tiden.']
    ],'Håll aktiv reparationstid åtskild från väntan på delar, transport och reparationsflöde.'),
    Q(0,'Vad säger TAT?','En felaktig enhet skickas till depå och blir tillgänglig igen efter 30 dagar. Vad beskriver TAT bäst?',[
      ['Tiden från felupptäckt till fältbyte.',false,'Tiden till fältbyte kan vara kortare än den tid den felaktiga enheten är borta.'],
      ['Tiden för transport till och från verkstaden.',false,'Transport är en del av flödet, men TAT inkluderar också hantering och reparation.'],
      ['Genomloppstiden tills enheten åter är tillgänglig.',true,'Rätt. Den felaktiga enheten kan vara borta länge även om systemet återställs tidigare med en reserv.']
    ],'TAT beskriver reparationsflödet; systemets stillestånd beror även på reservdelar och logistik.'),
    Q(0,'Vad påverkar förväntat antal fel?','Modellen har fler drifttimmar och oförändrad MTBF. Vad händer normalt med förväntat antal fel?',[
      ['Det ökar när den totala drifttiden ökar.',true,'Rätt. Fler drifttimmar ger fler möjligheter för fel att inträffa när MTBF är oförändrad.'],
      ['Det ökar först när reservlagret behöver fyllas på.',false,'Reservpåfyllning är en följd av fel, inte villkoret för att fel ska inträffa.'],
      ['Det ökar bara om antalet system samtidigt ökar.',false,'Antalet system kan vara oförändrat; fler drifttimmar per system ger ändå fler förväntade fel.']
    ],'Förväntade fel bygger bland annat på antal enheter, drifttimmar och MTBF.'),
    Q(0,'Hur tolkar du ett modellvärde?','MTBF är satt till 500 timmar i indata, men ingen har kontrollerat driftstatistiken. Hur ska värdet beskrivas?',[
      ['Som ett preliminärt riktvärde med normal säkerhetsmarginal.',false,'En säkerhetsmarginal gör inte en obekräftad uppgift till ett validerat riktvärde.'],
      ['Som ett indataantagande tills det verifierats.',true,'Rätt. Modellen använder värdet, men dess verklighetsförankring är en separat fråga.'],
      ['Som ett representativt medelvärde om modellen är konsekvent.',false,'Konsekvent beräkning säger inget om huruvida det använda MTBF-värdet motsvarar verklig drift.']
    ],'Skilj mellan indata, verifierade fakta och förenklingar i modellen.'),
    Q(0,'Vad betyder Ai?','Ai beräknas här med MTBF och MTTR. Vilken fördröjning efter ett fel ligger uttryckligen utanför formeln?',[
      ['Planerade servicefönster och tillhörande stillestånd.',false,'Planerat underhåll kan vara relevant för andra tillgänglighetsmått, men frågan gäller fördröjningar utöver MTTR.'],
      ['Transporttid för reservdelar, men inte lagerbrist.',false,'Även lagerbrist och andra logistiska förseningar faller utanför den enkla Ai-formeln.'],
      ['Logistisk väntan och annan fördröjning.',true,'Rätt. Ai är därför normalt mer optimistiskt än ett mått som även tar hänsyn till logistik.']
    ],'Ai och Ao är förenklade mått och ska tolkas enligt modellens definitioner.'),
    Q(0,'Vad betyder analysperioden?','En engångsinvestering jämförs med reparationsbesparingar. Varför spelar analysperioden roll?',[
      ['Den avgör hur länge återkommande kostnader räknas.',true,'Rätt. En längre period kan ge fler reparationer och fler möjligheter att återvinna en investering.'],
      ['Den avgör vilken reparationskostnad som används per fel.',false,'Reparationskostnaden per fel kan antas konstant; periodens längd påverkar hur många fel som summeras.'],
      ['Den styr främst vilken avskrivningstakt som ska väljas.',false,'Avskrivning kan påverka ekonomisk redovisning, men här handlar det om ackumulerade kostnader och besparingar.']
    ],'Alla alternativ måste jämföras över samma analysperiod.'),
    Q(0,'Vad är en modellbegränsning?','Modellen antar oberoende fel men fångar inte gemensamma orsaker till flera fel. Hur bör du hantera det?',[
      ['Kompensera med ett generellt påslag på felantalet.',false,'Ett generellt påslag kan missa just den samvariation mellan fel som begränsningen gäller.'],
      ['Dokumentera den och bedöma beslutspåverkan.',true,'Rätt. Undersök om samtidiga eller gemensamma fel kan ändra reservbehov eller slutsats.'],
      ['Bygga in samtidiga fel som normalfall i huvudscenariot.',false,'Samtidiga fel bör analyseras som ett motiverat scenario, inte införas som normalfall utan underlag.']
    ],'En förenklad modell kan vara användbar om dess begränsningar är synliga och hanterade.'),

    Q(1,'Vad är LORA-frågan?','En LRU kan bytas i fält. Analysen ska avgöra vad som händer med den felaktiga enheten. Vad jämför du?',[
      ['Hur många reservdelar som krävs på respektive nivå.',false,'Reservbehovet påverkas av LORA-valet men är inte själva valet av reparationsnivå eller kassering.'],
      ['Om bytet ska göras i fält eller på depå.',false,'I uppgiften är fältbytet redan möjligt; beslutet gäller den borttagna enhetens fortsatta hantering.'],
      ['Kassering eller reparation på vald nivå.',true,'Rätt. LORA jämför exempelvis kassering, I-level och D-level för den utbytta enheten.']
    ],'O-level-byte och reparation av den utbytta enheten är två skilda delar av flödet.'),
    Q(1,'Vad betyder BER?','En andel enheter bedöms inte ekonomiskt rimliga att reparera. Vilken tolkning är bäst?',[
      ['En antagen andel enheter som kan bli BER.',true,'Rätt. BER står för Beyond Economic Repair och behöver kriterier eller underlag i en verklig analys.'],
      ['Andelen fel som leder till utbyte av hela LRU:n.',false,'Utbyte av LRU i fält kan ske även när den borttagna enheten senare repareras.'],
      ['Andelen reparerade enheter som fallerar igen.',false,'Återfall efter reparation är en kvalitets- eller tillförlitlighetsfråga, inte definitionen av BER.']
    ],'BER ska inte tolkas som en universell kassationsregel utan som ett kriteriebaserat antagande.'),
    Q(1,'Lägre reparationskostnad – räcker det?','D-level kostar 700 kr per reparation och I-level 900 kr. Vad saknas för en rättvis jämförelse?',[
      ['Verifierade timkostnader och kapacitet per reparationsnivå.',false,'Timkostnad och kapacitet är viktiga delposter men fångar inte hela kostnaden för alternativen.'],
      ['En jämförelse av hela livscykelkostnaden.',true,'Rätt. Kostnader per fel måste vägas mot övriga kostnader och konsekvenser under samma period.'],
      ['Reparationskostnad plus transportkostnad per enhet.',false,'Transport per enhet är relevant men missar bland annat investering, reservbehov och stillestånd.']
    ],'Lägst kostnad per reparation betyder inte automatiskt lägst livscykelkostnad.'),
    Q(1,'Vad kan testutrustning ändra?','D-level kräver dyrare testutrustning men sparar 200 kr per reparation. Vad behöver du undersöka?',[
      ['Hur mycket lägre styckkostnaden blir vid högre volym.',false,'Styckkostnad vid volym är intressant men svarar inte direkt på när extrainvesteringen tjänas in.'],
      ['Om testutrustningen kan delas med andra komponenter.',false,'Delad utrustning kan minska investeringen, men frågan efterfrågar brytpunkten för angivna belopp.'],
      ['Hur många reparationer som krävs för brytpunkt.',true,'Rätt. Extra investering delat med besparing per reparation ger en förenklad brytpunkt före övriga effekter.']
    ],'Brytpunkten är ett första test, inte hela LORA-kalkylen.'),
    Q(1,'När kan kassering vara rimlig?','En ny komponent är billig, men väntan på leverans kan bli lång. Vad behöver vägas mot varandra?',[
      ['Inköpskostnad och konsekvensen av leveranstiden.',true,'Rätt. Lågt inköpspris kan vägas upp av många inköp eller dyrt stillestånd under väntan.'],
      ['Nypris jämfört med kostnaden för fältbyte.',false,'Fältbyteskostnaden är bara en del av konsekvensen; den långa leveranstiden kan dominera.'],
      ['Leveranstid jämfört med depåns reparationsledtid.',false,'Att jämföra ledtider räcker inte utan att också värdera kostnad och påverkan på driften.']
    ],'Kassering kan vara rimlig, men leveransledtid och reservtillgång kan ändra konsekvensen.'),
    Q(1,'Vad skiljer I-level och D-level?','I-level reparerar närmare användaren; D-level sker mer centraliserat. Vilken avvägning är rimlig?',[
      ['Närhet och kortare TAT vägs mot lägre reservbehov.',false,'Kortare TAT kan minska reservbehovet, men avvägningen inkluderar även utrustning, kompetens och skalfördelar.'],
      ['Närhet och kortare flöde vägs mot resurser och skala.',true,'Rätt. Reparationsnivå påverkar bland annat resurser, transport, genomloppstid och möjlig skalfördel.'],
      ['Centralisering vägs mot enklare krav på kompetens.',false,'Centralisering kan samla specialistkompetens, men behöver inte ge enklare kompetenskrav totalt.']
    ],'Underhållsnivåer har olika resurs- och logistikprofil; ingen är alltid bäst.'),
    Q(1,'Vad gör O-level?','Fältpersonal byter en felaktig LRU mot en fungerande reserv. Vad beskriver det främst?',[
      ['Återställning av LRU:n genom byte och funktionsprov.',false,'Det beskriver en möjlig återställning, men alternativet blandar ihop utbytt LRU och dess senare reparation.'],
      ['Felsökning av LRU:n och reparation på plats.',false,'Felsökning och reparation på plats kan förekomma, men situationen beskriver ett byte med reserv.'],
      ['Fältbyte av LRU:n, inte nödvändigtvis reparationen.',true,'Rätt. Den borttagna enheten kan sedan kasseras eller skickas för reparation.']
    ],'Skilj mellan att återställa systemet genom byte och att reparera den borttagna enheten.'),
    Q(1,'Hur hanterar du en BER-enhet?','En felande enhet bedöms vara Beyond Economic Repair enligt fastställda kriterier. Vad bör modellen spegla?',[
      ['Att enheten ersätts enligt det definierade scenariot.',true,'Rätt. Modellen behöver räkna konsekvensen av ersättning och relevant väntan eller inköp.'],
      ['Att BER-enheten får en högre genomsnittlig reparationskostnad.',false,'En BER-enhet ska inte schablonmässigt ges en dyrare reparation om beslutet är att inte reparera den.'],
      ['Att BER-enheten räknas bort från reparationsvolymen.',false,'Ett konstaterat BER-utfall innebär normalt ersättning snarare än återföring efter ordinarie reparation.']
    ],'BER kan öka behovet av nya enheter och påverka kostnad och väntetid.'),

    Q(2,'Vad händer om reserv finns?','En motor har 30 dagars TAT men en fungerande reserv finns lokalt. Vad är rimligast?',[
      ['Systemet kan återställas först när den trasiga enheten skickats.',false,'Depåns TAT behöver inte bli systemets stillestånd om reserv kan installeras.'],
      ['Systemets stillestånd blir lika långt som hela depåns TAT.',false,'Om en fungerande reserv finns lokalt kan systemet återställas innan den felaktiga enheten är färdigreparerad.'],
      ['Systemet kan återställas innan reparationen är klar.',true,'Rätt. En reserv kan minska omedelbart stillestånd, men TAT påverkar hur länge enheter är bundna.']
    ],'Reservtillgång skiljer systemets återställningstid från den felaktiga enhetens TAT.'),
    Q(2,'Vad betyder längre TAT för lagret?','Felfrekvensen är oförändrad men TAT ökar från 5 till 30 dagar. Vad kan hända?',[
      ['Fler enheter kan vara bundna i reparationsflödet samtidigt.',true,'Rätt. Längre genomloppstid kan öka antalet enheter som samtidigt är borta från den användbara poolen.'],
      ['Reservbehovet minskar om verkstaden får längre planeringstid.',false,'En oförändrad felfrekvens innebär inte färre fel bara för att reparationsflödet tar längre tid.'],
      ['Felfrekvensen måste ha ökat.',false,'Scenariot anger oförändrad felfrekvens. Lagerbristen visar att reservpoolen inte täckte just detta utfall, inte att MTBF nödvändigtvis ändrats.']
    ],'Genomsnittligt antal i reparationsflödet är en signal, inte exakt reservdimensionering.'),
    Q(2,'Vad säger 5,25 enheter i flödet?','En grov beräkning visar 5,25 motorer i D-level-flödet i genomsnitt. Hur tolkar du det?',[
      ['Som minsta reservlager avrundat uppåt till sex.',false,'Att avrunda genomsnittet uppåt ger inte automatiskt önskad servicenivå vid variation i felutfall.'],
      ['Som en signal att utreda reservbehovet vidare.',true,'Rätt. Det visar belastningen på flödet, men reservpoolen kräver en separat dimensionering.'],
      ['Som högsta samtidiga behov under normal drift.',false,'Flödesmedelvärdet är inte ensamt ett dimensionerande kapacitetskrav; toppar och variation spelar roll.']
    ],'Ett medelvärde säger inte hur många reservdelar som krävs för en viss servicenivå.'),
    Q(2,'Vad krävs för 95 % servicenivå?','Du vill ha 95 % sannolikhet att en reserv finns när den behövs. Vad gör du?',[
      ['Dimensionerar lagret efter medelefterfrågan med marginal.',false,'En fast buffert kan vara för liten eller stor; 95 % kräver en beräkning av variation och ledtider.'],
      ['Använder den längsta observerade TAT som lagerregel.',false,'Högsta observerade samtidiga fel kan vara slumpmässigt och säger inte direkt vilken framtida risk som accepteras.'],
      ['Gör en separat reservpooldimensionering.',true,'Rätt. Den bör ta hänsyn till felutfall, ledtid, variation och önskad servicenivå.']
    ],'Reservpoolens storlek är en separat fråga från valet av reparationsnivå.'),
    Q(2,'Vad om lagret tar slut?','Två fel inträffar innan reparerade enheter kommer tillbaka, och inga reservmotorer finns kvar. Vad visar det?',[
      ['Lagret garanterar inte reserv vid alla felutfall.',true,'Rätt. Ett lager minskar risken för väntan men garanterar inte tillgång vid flera samtidiga behov.'],
      ['Att reservpoolen måste ökas med två enheter.',false,'Lagerbrist visar inte nödvändigtvis att den förväntade efterfrågan var fel; variation kan ge toppar.'],
      ['Att reparationsflödet behöver högre kapacitet.',false,'MTTR för aktivt arbete ska inte automatiskt ersättas med hela depåns genomloppstid.']
    ],'Reservlager, felfrekvens och TAT samverkar när flera fel inträffar.'),
    Q(2,'Vad påverkar lagerbrist mest direkt?','Du vill förstå varför stilleståndet blev längre än väntat. Vilken kombination undersöker du?',[
      ['Antal enheter i drift, medelfelintervall och TAT.',false,'Pris och felkostnad kan värdera konsekvensen, men förklarar inte direkt varför reserven saknas.'],
      ['Felutfall, TAT, ledtider och lagernivå.',true,'Rätt. De påverkar efterfrågan på reserv och hur snabbt enheter återkommer eller levereras.'],
      ['Historiskt medelantal fel och genomsnittligt inköpspris.',false,'Felvolym och MTBF är viktiga men utan TAT och lagerstorlek går det inte att bedöma tillgången.']
    ],'Analysera både efterfrågan på reserv och tiden tills ny tillgång uppstår.'),
    Q(2,'Vad är skillnaden mellan LORA och lager?','Du väljer D-level som reparationsnivå. Vad återstår fortfarande att besluta?',[
      ['Hur många reservdelar som ska finnas på central depå.',false,'TAT är bara en inparameter; den bestämmer inte ensam reservpoolen eller önskad servicenivå.'],
      ['Vilka transportavtal och servicetider som behövs.',false,'Utrustningens kostnadsfördelning hör till LORA-ekonomin, inte direkt till frågan om reservantal och placering.'],
      ['Hur många reservdelar och var de ska finnas.',true,'Rätt. Underhållsnivå och reservförsörjning hänger ihop men är separata beslut.']
    ],'LORA avgör var underhåll sker; reservdelsdimensionering avgör hur reservförsörjningen stödjer det.'),
    Q(2,'Hur värderar du snabbare transport?','Snabbare transport kostar mer och kan minska väntan på reservmotor. Vad jämför du?',[
      ['Merkostnad mot förväntad minskning av stillestånd och lagerbrist.',true,'Rätt. Jämför kostnaden för åtgärden med dess effekt under samma krav och period.'],
      ['Transportens merkostnad mot kortare genomsnittlig TAT.',false,'Kortare TAT är en möjlig effekt, men nyttan behöver värderas i pengar och tillgänglighet.'],
      ['Tidsvinsten jämfört med kortare aktiv reparationstid.',false,'Aktiv reparationstid och transporttid är olika flaskhalsar; jämför kostnaden med faktisk effekt på systemet.']
    ],'Identifiera flaskhalsen, kvantifiera tidsvinsten och kontrollera att nyttan inte dubbelräknas.'),

    Q(3,'Vad ingår i livscykelkostnad?','Du jämför kassering med reparation. Vilket underlag är mest komplett?',[
      ['Samtliga bokförda utgifter för senaste driftåret.',false,'Köp och kassering per fel är viktiga men utelämnar exempelvis investering och stillestånd.'],
      ['Relevanta återkommande och engångskostnader över samma period.',true,'Rätt. Jämförelsen ska fånga relevanta kostnader och konsekvenser på konsekventa villkor.'],
      ['Alla direkta underhållskostnader för respektive fel.',false,'Reparation och lagerhållning är relevanta men inte hela livscykelbilden.']
    ],'Jämför relevanta kostnader över samma period och med konsekventa antaganden.'),
    Q(3,'Hur räknar du brytpunkt?','D-level kräver 80 000 kr mer i testutrustning men sparar 200 kr per reparation. Vad visar 400 reparationer?',[
      ['En förenklad punkt där reparationsbesparingen motsvarar investeringen.',true,'Rätt. 80 000 / 200 = 400 reparationer, före transport, reservpool, stillestånd och andra effekter.'],
      ['Att investeringen betalar sig efter 400 fel i alla scenarier.',false,'400 är antal reparationer vid angiven besparing, inte antal drifttimmar.'],
      ['Att den årliga besparingen blir 80 000 kronor.',false,'Brytpunkten täcker bara investeringen mot styckbesparingen; andra kostnader kan flytta den.']
    ],'Brytpunkten isolerar investeringen och besparingen; hela livscykelkostnaden kan ge annan bild.'),
    Q(3,'Vad händer vid kortare analysperiod?','En dyr testutrustning ger små besparingar per reparation. Vad händer normalt om analysperioden blir kortare?',[
      ['Den årliga kostnaden för utrustningen minskar snabbare.',false,'Färre drifttimmar kan göra kostnaden per timme högre, men det förklarar inte återbetalningen lika direkt.'],
      ['Färre fel ger också lägre totalt reservbehov.',false,'Kortare analysperiod ger normalt färre, inte fler, reparationshändelser och besparingar.'],
      ['Det blir svårare att tjäna in extrainvesteringen.',true,'Rätt. Färre reparationer kan hinna ge besparing under en kortare period.']
    ],'Analysperioden påverkar hur mycket nytta en återkommande besparing hinner ge.'),
    Q(3,'Hur skiljer du direkta kostnader från stillestånd?','Alternativ A kostar 350 000 kr direkt och 700 000 kr i modellerat stillestånd. Alternativ B kostar 420 000 kr direkt och 300 000 kr i stillestånd. Vad visar summan?',[
      ['A kan vara bättre om tillgänglighetskravet är uppfyllt.',false,'Direkta utgifter är bara ena delen av jämförelsen; uppgiften ber uttryckligen om summan inklusive stillestånd.'],
      ['B har lägre sammanlagd modellerad kostnad.',true,'Rätt. A summerar till 1 050 000 kr och B till 720 000 kr, med dessa antaganden.'],
      ['B är billigare enbart om stillestånd är en faktisk utgift.',false,'En annan viktning skulle ge en annan analys; med de angivna kostnaderna är totalsumman entydig.']
    ],'Redovisa gärna direkta kostnader och modellerat stillestånd var för sig och tillsammans.'),
    Q(3,'Vad är känslighetsanalys?','Du ändrar MTBF från 500 till 350 timmar för att se hur slutsatsen påverkas. Vad testar du?',[
      ['Om resultatet förändras när ett antagande ändras.',true,'Rätt. Det visar hur känslig kostnad och rangordning är för den valda parametern.'],
      ['Om 350 timmar är ett mer representativt MTBF-värde.',false,'Det testar snarare modellens träffsäkerhet mot data; här ändras ett antagande för att se resultatets känslighet.'],
      ['Om modellen är korrekt kalibrerad mot felstatistiken.',false,'Reparationskostnaden kan också känslighetstestas, men exemplet ändrar uttryckligen MTBF.']
    ],'Ändra en faktor i taget för att förstå effekten, och testa sedan relevanta kombinationer.'),
    Q(3,'Vad om rangordningen ändras?','Ett alternativ är billigast i grundscenariot men ett annat vinner vid rimlig MTBF. Hur tolkar du det?',[
      ['Grundscenariot prioriteras om det har bäst datakvalitet.',false,'Referensfallet är inte tillräckligt om en rimlig förändring ger ett annat beslut.'],
      ['Det billigaste utfallet väljs efter sannolikaste scenario.',false,'En skiftande rangordning är ett fynd att analysera, inte något som måste kalibreras bort.'],
      ['Slutsatsen är känslig och orsaken behöver utredas.',true,'Rätt. Bedöm vilka parametrar som driver skiftet och hur rimliga scenarierna är.']
    ],'Känslighetsanalys visar robusthet inom testade scenarier, inte absolut sanning.'),
    Q(3,'Hur hanterar du saknade data?','Tillförlitlig felstatistik saknas inför en preliminär analys. Vad är bäst?',[
      ['Härleda ett uppskattat värde från liknande utrustning.',false,'Leverantörens uppgift kan vara användbar men är inte verifierad driftstatistik från den aktuella miljön.'],
      ['Använda tydliga antaganden och testa rimliga scenarier.',true,'Rätt. En preliminär analys kan vara användbar om antaganden och osäkerhet redovisas.'],
      ['Använda ett konservativt standardvärde som huvudresultat.',false,'En schablonmässig säkerhetsfaktor ersätter inte tydlig redovisning av dataluckan och känsligheten.']
    ],'Märk antaganden tydligt och undersök om de kan ändra beslutet.'),
    Q(3,'Vad är värdet av bättre data?','Bättre MTBF-data tar tre månader att samla in och kan ändra rekommendationen. Vad väger du?',[
      ['Hur mycket säkrare rekommendationen blir efter mätningen.',false,'Tre månaders väntan kan vara motiverad, men beslutets tidskritikalitet måste vägas in.'],
      ['Om beslutsdatum kan skjutas fram utan merkostnad.',false,'En stor kostnadsfördel i grundfallet räcker inte om osäkra MTBF-data kan vända beslutet.'],
      ['Nyttan av information mot väntetid och beslutsrisk.',true,'Rätt. Bedöm om bättre information kan ändra beslutet och vad ett felaktigt beslut skulle innebära.']
    ],'Datainsamling är motiverad när dess förväntade beslutsnytta väger upp kostnaden.'),

    Q(4,'Vad är en beslutsdrivare?','Reservdelstillgång påverkar både kostnad och tillgänglighet. Varför kan den vara viktig?',[
      ['Den kan ändra vilket alternativ som är lämpligast.',true,'Rätt. En beslutsdrivare kan påverka val av strategi, inte bara en enskild kostnadspost.'],
      ['Den påverkar om kravet uppfylls i grundscenariot.',false,'En faktor kan påverka rangordningen även om den inte är största kostnadsposten.'],
      ['Den är den faktor som varierar mest mellan scenarier.',false,'Reservtillgång påverkar också stillestånd och tillgänglighet, inte bara investeringar.']
    ],'Prioritera faktorer som kan ändra valet, kravuppfyllelsen eller riskbilden.'),
    Q(4,'Vad frågar du verksamheten om?','Driftansvarig säger att systemet behöver hög tillgänglighet men anger inget mätbart krav. Vad frågar du?',[
      ['Vilket högsta genomsnittliga stillestånd som accepteras.',false,'Normal lagernivå är nyttig information men specificerar inte vilket tillgänglighetskrav som måste uppfyllas.'],
      ['Vilken tillgänglighet och återställningstid som krävs.',true,'Rätt. Konkreta krav behövs för att bedöma om strategierna är operativt acceptabla.'],
      ['Vilken minsta reparationskapacitet som måste finnas.',false,'Kapacitet är en möjlig lösningsparameter. Först behöver verksamheten ange ett mätbart tillgänglighets- eller återställningskrav.']
    ],'Översätt allmänna önskemål till krav som kan analyseras och verifieras.'),
    Q(4,'Vad om kraven står i konflikt?','Verksamheten vill både minimera stillestånd och hålla kostnaden låg. Vad gör du?',[
      ['Väljer lägsta kostnad bland alternativ med rimlig TAT.',false,'Att nästan uppfylla ett bindande krav räcker inte utan formellt accepterad avvikelse.'],
      ['Låter driftansvarig rangordna de tre alternativen.',false,'En liten kostnadsskillnad avgör inte om tillgänglighetskravet uppfylls.'],
      ['Klargör krav och redovisar avvägningen.',true,'Rätt. Bedöm först bindande krav och jämför sedan kostnad och effekt bland godtagbara alternativ.']
    ],'Ekonomisk optimering sker inom de krav verksamheten måste uppfylla.'),
    Q(4,'Vad om inget alternativ uppfyller kravet?','Ingen strategi når återställningskravet med nuvarande reservlösning. Vad är nästa steg?',[
      ['Väljer alternativet som ligger närmast kravet.',false,'En noterad avvikelse löser inte det operativa problemet om kravet är bindande.'],
      ['Gör en känslighetsanalys på den billigaste strategin.',false,'MTTR är inte en justeringsknapp för att uppnå ett krav; stödåtgärder måste prövas.'],
      ['Utreda stödåtgärder och deras effekt på kravet.',true,'Rätt. Lagerplacering, reservpool eller logistik kan behöva ändras och analyseras.']
    ],'När inget alternativ klarar kravet ska du synliggöra gapet och undersöka lösningar.'),
    Q(4,'Vad är en professionell rekommendation?','Grundscenariot visar ett alternativ som billigast, men en kritisk osäkerhet återstår. Hur formulerar du dig?',[
      ['Ge en tydlig rekommendation med villkor och osäkerhet.',true,'Rätt. Du kan ange vad underlaget stöder och vad som måste verifieras innan beslutet låses.'],
      ['Rekommenderar grundscenariots vinnare och begär uppföljning.',false,'Ett tydligt kostnadsutfall kan ändå vara osäkert när kritiska antaganden inte är verifierade.'],
      ['Redovisar alternativen utan att rangordna dem ännu.',false,'Ett intervall utan slutsats kan undvika ansvar; ett villkorat förslag ger bättre beslutsstöd.']
    ],'Skilj på modellresultat, tolkning och rekommendation.'),
    Q(4,'Vad visar en bra sammanfattning?','Du har en sida för beslutsfattaren. Vilket innehåll är mest användbart?',[
      ['Resultat och kostnad per alternativ samt känslighet.',false,'Detaljerna hör hemma i bilaga eller analysunderlag; beslutsfattaren behöver också konsekvenser och rekommendation.'],
      ['Syfte, resultat, krav, osäkerheter och nästa steg.',true,'Rätt. Beslutsfattaren behöver förstå vad som analyserats, vad det visar och vad som återstår.'],
      ['Kravuppfyllelse, beräkningsmetod och rekommendation.',false,'Diagram och rangordning är användbara men bör kopplas till krav, osäkerheter och nästa steg.']
    ],'En bra sammanfattning är kort men visar både resultat och gränserna för det.'),
    Q(4,'Hur validerar du modellen?','Formlerna fungerar men verkliga driftdata har inte jämförts. Vad kan du säga?',[
      ['Beräkningen kan fungera men verklighetsvaliditet återstår.',true,'Rätt. Teknisk beräkningskontroll visar inte ensam att modellen beskriver verkliga utfall väl.'],
      ['Att modellen är validerad inom testade indataområden.',false,'Stabila beräkningar verifierar metodens konsekvens men inte om den beskriver verkliga driftutfall.'],
      ['Att den kan användas om resultaten verkar rimliga.',false,'Konsekvent definierade indata räcker inte för att bedöma modellens verklighetsvaliditet.']
    ],'Beräkningskontroll och validering mot verkligheten är olika aktiviteter.'),
    Q(4,'Vad gör du vid motstridiga data?','En äldre rapport anger MTBF 500 timmar; en liten ny mätning antyder 350. Vad gör du?',[
      ['Väger ihop värdena efter respektive rapports ålder.',false,'Nyare data är inte alltid mer representativa; urval och driftförhållanden måste jämföras.'],
      ['Granskar kvalitet, representativitet och påverkan.',true,'Rätt. Dokumentera källorna och testa om värdevalet påverkar slutsatsen.'],
      ['Använder det lägre värdet som konservativt antagande utan vidare granskning.',false,'Ett lägre värde kan vara konservativt, men du behöver först kontrollera urval, mätmetod och representativitet och sedan dokumentera varför värdet väljs.']
    ],'Bedöm hur data samlats in och om de representerar den drift som analyseras.'),

  ];

  const storageKey = 'ilsCourseV50Progress';
  let state = {started:false, index:0, completed:[], attempts:{}};
  try { const saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (saved && Array.isArray(saved.completed)) state = {...state,...saved}; } catch (_) {}
  const $ = id => document.getElementById(id);
  const courseShell = $('courseShell'), lab = $('analysisLab');
  const ids = ['courseModeBtn','labModeBtn','startCourseBtn','resumeCourseBtn','resetCourseBtn','courseChapterNav','courseDoneCount','courseProgressFill','courseWelcome','questionPage','courseComplete','questionChapter','questionCount','questionProgressFill','questionKicker','questionTitle','questionPrompt','questionForm','answerOptions','answerFeedback','checkAnswerBtn','retryAnswerBtn','nextQuestionBtn','previousQuestionBtn','backToCourseHomeBtn','openLabFromCourseBtn','openLabFromSideBtn','openLabAtEndBtn','reviewCourseBtn','chapterLabBridgeBtn'];
  const el = Object.fromEntries(ids.map(id=>[id,$(id)]));
  const chapterNames = ['Förstå analysen','Underhållsalternativ','Logistik och tillgänglighet','Kostnad och osäkerhet','Från analys till beslut'];
  function persist(){ try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(_){} }
  function mode(which){ const isCourse=which==='course'; courseShell.hidden=!isCourse; lab.hidden=isCourse; document.body.classList.toggle('course-mode',isCourse);document.body.classList.toggle('lab-mode',!isCourse); el.courseModeBtn.setAttribute('aria-pressed',String(isCourse));el.courseModeBtn.hidden=!isCourse;['summaryBtn','resetBtn'].forEach(id=>{const node=document.getElementById(id);if(node)node.hidden=isCourse;});el.labModeBtn.setAttribute('aria-pressed',String(!isCourse));el.labModeBtn.textContent=isCourse?'Öppna labb':'Tillbaka till kurs'; }
  function renderChapters(){
    el.courseChapterNav.innerHTML='';
    const firstIncomplete = questions.findIndex((_,n)=>!state.completed.includes(n));
    const furthestChapter = firstIncomplete < 0 ? chapters.length-1 : Math.floor(firstIncomplete/8);
    chapters.forEach((ch,i)=>{
      const done=ch.range.every(n=>state.completed.includes(n)); const locked=i>furthestChapter; const btn=document.createElement('button');btn.type='button';btn.disabled=locked;btn.className='chapter-nav-item'+(Math.floor(state.index/8)===i?' active':'')+(locked?' locked':'');
      btn.innerHTML=`<span class="chapter-number">${i+1}</span><span>${ch.title}<small>${locked?'Slutför föregående kapitel':ch.desc}</small></span><span class="chapter-tick">${done?'✓':''}</span>`;
      btn.addEventListener('click',()=>{if(locked)return;state.index=ch.range[0];state.started=true;persist();renderQuestion();});el.courseChapterNav.appendChild(btn);
    });
    el.courseDoneCount.textContent=state.completed.length;el.courseProgressFill.style.width=(state.completed.length/questions.length*100)+'%';
  }
  function showHome(){el.courseWelcome.hidden=false;el.questionPage.hidden=true;el.courseComplete.hidden=true;renderChapters();}
  function renderQuestion(){
    if(!state.started){showHome();return;}
    if(state.index>=questions.length){el.courseWelcome.hidden=true;el.questionPage.hidden=true;el.courseComplete.hidden=false;renderChapters();persist();return;}
    const q=questions[state.index];el.courseWelcome.hidden=true;el.courseComplete.hidden=true;el.questionPage.hidden=false;
    el.chapterLabBridgeBtn.hidden = !(state.completed.filter(n => n >= 8 && n <= 15).length === 8 && (q.chapter >= 2 || (q.chapter === 1 && state.index === 15)));  el.questionChapter.textContent=`Kapitel ${q.chapter+1} · ${chapterNames[q.chapter]}`;el.questionCount.textContent=`Fråga ${state.index+1} av ${questions.length}`;el.questionProgressFill.style.width=((state.index+1)/questions.length*100)+'%';el.questionKicker.textContent=['GRUNDBEGREPP','UNDERHÅLLSSTRATEGI','LOGISTIK OCH TILLGÄNGLIGHET','KOSTNAD OCH OSÄKERHET','BESLUT OCH DOKUMENTATION'][q.chapter];el.questionTitle.textContent=q.title;el.questionPrompt.textContent=q.prompt;
    el.answerOptions.innerHTML='';el.answerFeedback.hidden=true;el.answerFeedback.className='answer-feedback';el.checkAnswerBtn.hidden=false;el.checkAnswerBtn.disabled=true;el.retryAnswerBtn.hidden=true;el.nextQuestionBtn.hidden=true;
    q.opts.forEach((o,i)=>{const label=document.createElement('label');label.className='answer-option';label.innerHTML=`<input type="radio" name="courseAnswer" value="${i}"><span class="answer-letter">${String.fromCharCode(65+i)}</span><span class="answer-text"></span>`;label.querySelector('.answer-text').textContent=o.text;label.querySelector('input').addEventListener('change',()=>{el.answerOptions.querySelectorAll('.answer-option').forEach(n=>n.classList.remove('selected'));label.classList.add('selected');el.checkAnswerBtn.disabled=false;if(!el.answerFeedback.hidden){el.answerFeedback.hidden=true;}el.checkAnswerBtn.hidden=false;el.retryAnswerBtn.hidden=true;});el.answerOptions.appendChild(label);});
    el.previousQuestionBtn.disabled=state.index===0;renderChapters();persist();
  }
  function checkAnswer(event){event.preventDefault();const chosen=el.answerOptions.querySelector('input:checked');if(!chosen)return;const q=questions[state.index],o=q.opts[Number(chosen.value)],feedback=el.answerFeedback;feedback.hidden=false;
    if(o.correct){state.completed=[...new Set([...state.completed,state.index])];if(state.index===15)el.chapterLabBridgeBtn.hidden=false;feedback.className='answer-feedback is-correct';feedback.innerHTML='<h3>Rätt svar</h3><p></p><p class="feedback-takeaway"></p>';feedback.querySelector('p').textContent=o.feedback;feedback.querySelector('.feedback-takeaway').textContent=q.takeaway;el.checkAnswerBtn.hidden=true;el.retryAnswerBtn.hidden=true;el.nextQuestionBtn.hidden=false;el.nextQuestionBtn.textContent=state.index===questions.length-1?'Avsluta kursen':'Nästa fråga >';}
    else {state.attempts[state.index]=(state.attempts[state.index]||0)+1;feedback.className='answer-feedback is-wrong';feedback.innerHTML='<h3>Inte riktigt – försök igen</h3><p></p><p class="feedback-hint"></p>';feedback.querySelector('p').textContent=o.feedback;feedback.querySelector('.feedback-hint').textContent='Läs förklaringen och fundera på vilken skillnad den pekar på. Välj sedan ett nytt svar på samma fråga.';el.checkAnswerBtn.hidden=false;el.checkAnswerBtn.disabled=true;el.retryAnswerBtn.hidden=true;el.nextQuestionBtn.hidden=true;}
    persist();renderChapters();
  }
  el.questionForm.addEventListener('submit',checkAnswer);
  el.nextQuestionBtn.addEventListener('click',()=>{state.index++;state.started=true;persist();renderQuestion();});
  el.previousQuestionBtn.addEventListener('click',()=>{if(state.index>0){state.index--;persist();renderQuestion();}});
  el.startCourseBtn.addEventListener('click',()=>{state.started=true;persist();renderQuestion();});
  el.resumeCourseBtn.addEventListener('click',()=>{state.started=true;persist();renderQuestion();});
  el.resetCourseBtn.addEventListener('click',()=>{if(confirm('Börja om kursen? Dina kursframsteg för de 40 frågorna tas bort. Analysdata i labben påverkas inte.')){state={started:false,index:0,completed:[],attempts:{}};persist();showHome();}});
  el.backToCourseHomeBtn.addEventListener('click',showHome);
  el.reviewCourseBtn.addEventListener('click',()=>{state.index=0;state.started=true;renderQuestion();});
  // The shared header button toggles between lab and course; course-specific buttons only open the lab.
  el.labModeBtn.addEventListener('click',()=>{
    if(!lab.hidden){
      // Return to the exact question the learner left, not the course welcome page.
      // Refresh persisted state first in case another view updated it.
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved && Array.isArray(saved.completed)) {
          const currentIndex = state.index;
          state = {...state, ...saved};
          // Keep the in-memory question position if it is valid; it is the position
          // the learner was viewing immediately before entering the lab.
          if (Number.isInteger(currentIndex) && currentIndex >= 0 && currentIndex < questions.length) {
            state.index = currentIndex;
          }
        }
      } catch (_) {}
      if (state.started && state.index >= 0 && state.index < questions.length) {
        state.started = true;
        persist();
        mode('course');
        renderQuestion();
      } else {
        mode('course');
        showHome();
      }
    } else {
      // Persist the current question before leaving the course for the lab.
      persist();
      mode('lab');
    }
  });
  ['openLabFromCourseBtn','openLabFromSideBtn','openLabAtEndBtn','chapterLabBridgeBtn'].forEach(id=>el[id].addEventListener('click',()=>{
    persist();
    mode('lab');
    if(id==='chapterLabBridgeBtn'){
      const note=document.getElementById('freeExploreNote');
      if(note){note.hidden=false;note.textContent='Elmotor är vald. Jämför MTTR, logistisk fördröjning och LORA-beslut med resonemanget i kursen.';}
      if(typeof selectComponent==='function' && typeof components!=='undefined'){const motor=components.find(c=>c.id==='01A01');if(motor)selectComponent(motor);}
    }
  }));
  el.courseModeBtn.addEventListener('click',()=>{mode('course');if(state.started)renderQuestion();else showHome();});
  mode('course');showHome();
})();

