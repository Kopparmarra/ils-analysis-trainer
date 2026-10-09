/* ===== Domändata (separerad från UI-logik) =====
 * Alla belopp i SEK. MTBF i timmar per enhet, MTTR i minuter.
 * Siffrorna är fiktiva och valda så att olika komponenter ger olika LORA-utfall.
 */

const DEFAULT_ASSUMPTIONS = {
  fleetSize: 20,          // antal DroneX-system
  hoursPerYear: 400,      // drifttimmar per system och år
  years: 10,              // analysperiod
  downtimeCostPerH: 800,  // värdering av en timmes stillestånd (kr), skalas med kritikalitet
  tatI: 5,                // turn-around-time I-level (dygn)
  tatD: 30,               // turn-around-time D-level inkl. transport (dygn)
  leadTime: 60,           // återanskaffningstid för ny enhet (dygn)
  transport: 1500         // transportkostnad per enhet till/från depå (kr)
};

const MODEL_IDENT_CODE = "DRONEX";
const SYSTEM_DIFF_CODE = "AAA";

const CRIT_FACTOR = { high: 2, medium: 1, low: 0.5 };          // vikt på stillestånd
const CRIT_SERVICE_LEVEL = { high: 99, medium: 95, low: 90 };  // standardvärde för reservservicegrad (%)
const CRIT_LABEL = { high: "Hög", medium: "Medel", low: "Låg" };
const CRIT_LETTER = { high: "H", medium: "M", low: "L" };

const NON_FIELD_PENALTY_H = 48;   // extra nertid om enheten inte kan bytas i fält
const BASE_LOGISTICS_DELAY_H = 2; // administrativ/hämtningstid även när reserv finns

const systemData = {
  id: "root",
  lcn: "",
  name: "DroneX Tactical System",
  children: [
    {
      id: "01", lcn: "01", name: "DroneX Plattform", criticality: "high",
      children: [
        {
          id: "01A", lcn: "01A", name: "Drivlina", criticality: "high",
          children: [
            {
              id: "01A01", lcn: "01A01", name: "Elmotor", isComponent: true, criticality: "high",
              qty: 4, fieldReplaceable: true,
              rams: { mtbf: 500, mttr: 45, failureMode: "Lagerskärning på grund av överhettning", complexity: "low" },
              cost: { unitPrice: 4200, repairI: 900, repairD: 700, berPct: 20, testI: 40000, testD: 120000 },
              sns: { system: "61", sub: "1", subsub: "0", assy: "01" },
              support: { pn: "99-123-A", spareDesc: "Elmotor komplett", tools: "Kalibrerad momentnyckel (Torque Tool 4B)", training: { course: "Drivlina", level: 1 } }
            },
            {
              id: "01A02", lcn: "01A02", name: "Batteripack", isComponent: true, criticality: "high",
              qty: 1, fieldReplaceable: true,
              rams: { mtbf: 800, mttr: 30, failureMode: "Kapacitetsförlust / cellfel", complexity: "low" },
              cost: { unitPrice: 9500, repairI: 5500, repairD: 4800, berPct: 50, testI: 60000, testD: 150000 },
              sns: { system: "24", sub: "2", subsub: "0", assy: "01" },
              support: { pn: "99-145-B", spareDesc: "Batteripack 6S", tools: "Isolerad batterihandske + spänningsprovare", training: { course: "Batterihantering", level: 1 } }
            }
          ]
        },
        {
          id: "01B", lcn: "01B", name: "Sensorer & Kamera", criticality: "medium",
          children: [
            {
              id: "01B01", lcn: "01B01", name: "EO/IR-kamera", isComponent: true, criticality: "medium",
              qty: 1, fieldReplaceable: false,
              rams: { mtbf: 1200, mttr: 90, failureMode: "Sensordegradering / fokusförlust", complexity: "high" },
              cost: { unitPrice: 180000, repairI: 90000, repairD: 40000, berPct: 15, testI: 400000, testD: 500000 },
              sns: { system: "34", sub: "3", subsub: "0", assy: "01" },
              support: { pn: "88-210-C", spareDesc: "EO/IR-kameramodul", tools: "Optisk renrumsmiljö + kalibreringsrigg", training: { course: "Sensorunderhåll", level: 2 } }
            },
            {
              id: "01B02", lcn: "01B02", name: "Laseravståndsmätare", isComponent: true, criticality: "low",
              qty: 1, fieldReplaceable: true,
              rams: { mtbf: 2000, mttr: 60, failureMode: "Optisk missanpassning", complexity: "medium" },
              cost: { unitPrice: 22000, repairI: 8000, repairD: 6500, berPct: 30, testI: 50000, testD: 100000 },
              sns: { system: "34", sub: "4", subsub: "0", assy: "01" },
              support: { pn: "88-220-D", spareDesc: "Laseravståndsmätare", tools: "Optisk justeringsnyckel", training: { course: "Sensorunderhåll", level: 1 } }
            }
          ]
        }
      ]
    },
    {
      id: "02", lcn: "02", name: "Markstation (GCS)", criticality: "high",
      children: [
        {
          id: "02A", lcn: "02A", name: "Kontrollenhet", criticality: "high",
          children: [
            {
              id: "02A01", lcn: "02A01", name: "Huvudprocessor", isComponent: true, criticality: "high",
              qty: 1, fieldReplaceable: false,
              rams: { mtbf: 3000, mttr: 120, failureMode: "Överhettning / minnesfel", complexity: "high" },
              cost: { unitPrice: 60000, repairI: 30000, repairD: 25000, berPct: 30, testI: 300000, testD: 400000 },
              sns: { system: "46", sub: "1", subsub: "0", assy: "01" },
              support: { pn: "77-301-E", spareDesc: "Huvudprocessor board", tools: "ESD-säker arbetsplats + diagnostikdator", training: { course: "GCS Avancerad", level: 2 } }
            }
          ]
        },
        {
          id: "02B", lcn: "02B", name: "Kommunikationslänk", criticality: "high",
          children: [
            {
              id: "02B01", lcn: "02B01", name: "Radiomodul", isComponent: true, criticality: "high",
              qty: 1, fieldReplaceable: true,
              rams: { mtbf: 1500, mttr: 40, failureMode: "Signalbortfall / antennfel", complexity: "low" },
              cost: { unitPrice: 6500, repairI: 5500, repairD: 4500, berPct: 40, testI: 80000, testD: 150000 },
              sns: { system: "23", sub: "1", subsub: "0", assy: "01" },
              support: { pn: "77-410-F", spareDesc: "Radiomodul VHF/UHF", tools: "RF-analysator (portabel)", training: { course: "Kommunikationslänk", level: 1 } }
            }
          ]
        }
      ]
    }
  ]
};
