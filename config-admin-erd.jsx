import { useState, useRef, useEffect, useMemo, useCallback } from "react";

// ============================================================
// Config Admin App — Interaktives Dataverse ERD
// Wirtschaftlichkeitsrechner V2 | Warsteiner ELA
// ============================================================

const B = {
  p900: "#00283A", p800: "#083245", p700: "#104961", p600: "#1A6582",
  p500: "#2682A6", p400: "#4D9EB8", p300: "#6EB2C7", p200: "#99CAD9",
  p100: "#C2E0EB", p50: "#E5F2F7",
  t600: "#0D7C66", t500: "#10997E", t400: "#14A88C", t300: "#3CC4A8",
  t200: "#73D9C4", t100: "#B0EADD", t50: "#E0F7F2",
  n900: "#1C1C1E", n700: "#48484A", n600: "#6C6C70", n500: "#8E8E93",
  n400: "#AFAFB3", n300: "#D1D1D4", n200: "#E4E4E6", n100: "#F1F1F2",
  n50: "#F9F9FA", w: "#FFFFFF",
  sBg: "#EDF7ED", sB: "#508246", wBg: "#FFFBEA", wB: "#FFB400",
  eBg: "#FFF0EB", eB: "#BD3D02",
};

const CATEGORIES = {
  version: { label: "Versionsmanagement", color: "#8B5CF6", bg: "#F5F3FF", border: "#C4B5FD" },
  config: { label: "Konfiguration (versioniert)", color: B.p500, bg: B.p50, border: B.p200 },
  stammdaten: { label: "Stammdaten", color: B.t600, bg: B.t50, border: B.t200 },
};

const TABLES = [
  {
    id: "configversion", name: "Config Version", logicalName: "cos_configversion",
    description: "Zentrale Steuertabelle für alle versionierten Konfigurationsdaten. Jeder Datensatz repräsentiert eine Konfigurationsversion eines bestimmten Typs (PK/RP/MARKT/SORT/WKZ). Status-Workflow: Draft → Active → Archived.",
    category: "version", rows: "~10",
    columns: [
      { name: "Config Type Name", logical: "cos_name", type: "Text (200)", key: true, required: true },
      { name: "Config Type", logical: "cos_configtype", type: "Choice", required: true, note: "PK / RP / MARKT / SORT / WKZ" },
      { name: "Status", logical: "cos_status", type: "Choice", required: true, note: "Draft / Active / Archived" },
      { name: "Valid From", logical: "cos_validfrom", type: "Date" },
      { name: "Valid To", logical: "cos_validto", type: "Date" },
      { name: "Notes", logical: "cos_notes", type: "Multiline (500)" },
      { name: "Created On", logical: "createdon", type: "Date (System)", system: true },
      { name: "Created By", logical: "createdby", type: "Lookup User", system: true },
    ],
    x: 420, y: 20,
  },
  {
    id: "productcost", name: "Product Cost (PK)", logicalName: "cos_productcost",
    description: "Variable und fixe Produktkosten je Artikel und Version. Excel-Quelle: Sheet 'PK 26' — ca. 493 Artikel. Lookup-Schlüssel im Kalkulator: MaterialNumber + Active Version (Type=PK).",
    category: "config", rows: "493",
    columns: [
      { name: "Material Name", logical: "cos_materialname", type: "Text (200)", key: true, required: true },
      { name: "Version", logical: "cos_configversion", type: "Lookup", ref: "configversion", required: true },
      { name: "Material Number", logical: "cos_materialnumber", type: "Text (10)", required: true },
      { name: "Brand", logical: "cos_brand", type: "Text (50)", required: true },
      { name: "Container Type", logical: "cos_containertype", type: "Text (30)", required: true },
      { name: "Beer Type", logical: "cos_beertype", type: "Text (30)", required: true },
      { name: "Variable Cost", logical: "cos_variablecost", type: "Currency", required: true },
      { name: "Fixed Cost", logical: "cos_fixedcost", type: "Currency", required: true },
      { name: "Beer Tax", logical: "cos_beertax", type: "Currency", required: true },
      { name: "Refund", logical: "cos_refund", type: "Currency" },
      { name: "GFGH", logical: "cos_gfgh", type: "Currency" },
      { name: "Liters Per Sales Unit", logical: "cos_literspersalesunit", type: "Decimal", required: true },
    ],
    x: 30, y: 140,
  },
  {
    id: "ramppricing", name: "Ramp Pricing (RP)", logicalName: "cos_ramppricing",
    description: "Rampenpreise je Artikel, Rampe und Logistikzuschlag. Excel-Quelle: Sheet 'RP 26' — ca. 720 Zeilen. cos_articlerampkey ist der Kombischlüssel (Artikel + Rampe).",
    category: "config", rows: "720",
    columns: [
      { name: "Article Name", logical: "cos_articlename", type: "Text (200)", key: true, required: true },
      { name: "Version", logical: "cos_configversion", type: "Lookup", ref: "configversion", required: true },
      { name: "Ramp", logical: "cos_ramp", type: "Text (50)", required: true },
      { name: "Brand", logical: "cos_brand", type: "Text (50)", required: true },
      { name: "Container Type", logical: "cos_containertype", type: "Text (30)", required: true },
      { name: "Article Number", logical: "cos_articlenumber", type: "Text (10)", required: true },
      { name: "Article Ramp Key", logical: "cos_articlerampkey", type: "Text (20)", required: true },
      { name: "Ramp Price", logical: "cos_rampprice", type: "Currency", required: true },
      { name: "Surcharge Warstein", logical: "cos_surchargewarstein", type: "Currency" },
      { name: "Surcharge Paderborn", logical: "cos_surchargepaderborn", type: "Currency" },
      { name: "Surcharge Herford", logical: "cos_surchargeherford", type: "Currency" },
      { name: "Surcharge FFB", logical: "cos_surchargeffb", type: "Currency" },
      { name: "Surcharge Holzkirchen", logical: "cos_surchargeholzkirchen", type: "Currency" },
      { name: "Liters Per Sales Unit", logical: "cos_literspersalesunit", type: "Decimal", required: true },
      { name: "Ramp Price Per HL", logical: "cos_ramppriceperhl", type: "Currency", required: true },
    ],
    x: 280, y: 300,
  },
  {
    id: "marketdata", name: "Market Data", logicalName: "cos_marketdata",
    description: "Durchschnitts-HL-Werte und Marktanteile je Bundesland und Biersorte. Excel-Quelle: Sheet 'Bundesländer' — ca. 256 Zeilen. cos_avghlperobject wird als Vorschlagswert im Kalkulator verwendet.",
    category: "config", rows: "~256",
    columns: [
      { name: "State", logical: "cos_state", type: "Text (50)", key: true, required: true },
      { name: "Version", logical: "cos_configversion", type: "Lookup", ref: "configversion", required: true },
      { name: "Beer Type", logical: "cos_beertype", type: "Text (30)", required: true },
      { name: "Total HL", logical: "cos_totalhl", type: "Decimal" },
      { name: "Total Objects", logical: "cos_totalobjects", type: "Whole Number" },
      { name: "Avg HL Per Object", logical: "cos_avghlperobject", type: "Decimal", required: true },
      { name: "Priority", logical: "cos_priority", type: "Whole Number" },
      { name: "HL Share Percent", logical: "cos_hlsharepercent", type: "Decimal" },
      { name: "Data Year", logical: "cos_datayear", type: "Text (10)" },
    ],
    x: 560, y: 140,
  },
  {
    id: "assortmentdefault", name: "Assortment Default", logicalName: "cos_assortmentdefault",
    description: "Standardsortimentsverteilung je Bundesland, Betriebstyp und Kategorie ('Perfekte Getränkekarte'). Excel-Quelle: Sheet 'Perfekte Getränkekarte' — ca. 1.060 Kombinationen.",
    category: "config", rows: "~1.060",
    columns: [
      { name: "Concat Key", logical: "cos_concatkey", type: "Text (100)", key: true, required: true },
      { name: "Version", logical: "cos_configversion", type: "Lookup", ref: "configversion", required: true },
      { name: "State", logical: "cos_state", type: "Text (50)", required: true },
      { name: "Operating Type", logical: "cos_operatingtype", type: "Text (50)", required: true },
      { name: "Category", logical: "cos_category", type: "Text (50)", required: true },
      { name: "Percent Share", logical: "cos_percentshare", type: "Decimal", required: true },
      { name: "HL", logical: "cos_hl", type: "Decimal" },
      { name: "Pils Percent", logical: "cos_pilspercent", type: "Decimal" },
      { name: "Wheat Beer %", logical: "cos_wheatbeerpercent", type: "Decimal" },
      { name: "Lager Percent", logical: "cos_lagerpercent", type: "Decimal" },
      { name: "Top 1–5", logical: "cos_top1..5", type: "Text (50)" },
    ],
    x: 560, y: 430,
  },
  {
    id: "advertisingcost", name: "Advertising Cost", logicalName: "cos_advertisingcost",
    description: "Werbeaufwand und Strukturkosten je Dachmarke. Excel-Quelle: Sheet 'Sonstige 25' — ca. 30 Dachmarken. Verwendet für DB4 (Werbeaufwand) und DB5 (Strukturkosten).",
    category: "config", rows: "~30",
    columns: [
      { name: "Brand", logical: "cos_brand", type: "Text (50)", key: true, required: true },
      { name: "Version", logical: "cos_configversion", type: "Lookup", ref: "configversion", required: true },
      { name: "Advertising Cost/HL", logical: "cos_advertisingcostperhl", type: "Currency", required: true },
      { name: "Structural Cost/HL", logical: "cos_structuralcostperhl", type: "Currency", required: true },
      { name: "Total HL", logical: "cos_totalhl", type: "Decimal" },
    ],
    x: 30, y: 430,
  },
  {
    id: "industrytype", name: "Industry Type", logicalName: "cos_industrytype",
    description: "Klassifizierung von Gastronomiebetrieben nach Branchen. Excel-Quelle: Sheet 'Branchen HL' — 30 Einträge. Keine Versionierung.",
    category: "stammdaten", rows: "30",
    columns: [
      { name: "Industry Name", logical: "cos_industryname", type: "Text (100)", key: true, required: true },
      { name: "Industry Code", logical: "cos_industrycode", type: "Text (5)", required: true },
      { name: "Operating Type", logical: "cos_operatingtype", type: "Text (50)", required: true },
    ],
    x: 830, y: 20,
  },
  {
    id: "postalcode", name: "Postal Code", logicalName: "cos_postalcode",
    description: "Zuordnung von Postleitzahlen zu Bundesland, Nielsen-Region und Strategiefläche. 8.184 Einträge. Import via CSV empfohlen.",
    category: "stammdaten", rows: "8.184",
    columns: [
      { name: "City", logical: "cos_city", type: "Text (100)", key: true, required: true },
      { name: "Postal Code", logical: "cos_postalcode", type: "Text (10)", required: true },
      { name: "State", logical: "cos_state", type: "Text (50)", required: true },
      { name: "District", logical: "cos_district", type: "Text (100)" },
      { name: "Metro Area", logical: "cos_metroarea", type: "Text (100)" },
      { name: "Nielsen Region", logical: "cos_nielsenregion", type: "Text (5)" },
      { name: "Strategy Area", logical: "cos_strategyarea", type: "Text (5)" },
      { name: "Sales Org", logical: "cos_vkorg", type: "Text (10)" },
      { name: "Country", logical: "cos_country", type: "Text (5)" },
    ],
    x: 830, y: 190,
  },
  {
    id: "articlemaster", name: "Article Master", logicalName: "cos_articlemaster",
    description: "Stammdaten aller verkaufsrelevanten Artikel. Ca. 150 Artikel. Keine Versionierung — Preise/Kosten sind in PK/RP versioniert. Parental-Beziehung zu VKORG-Verfügbarkeit.",
    category: "stammdaten", rows: "~150",
    columns: [
      { name: "Material Name", logical: "cos_materialname", type: "Text (200)", key: true, required: true },
      { name: "Material Number", logical: "cos_materialnumber", type: "Text (10)", required: true },
      { name: "Brand Group", logical: "cos_brandgroup", type: "Text (50)" },
      { name: "Brand", logical: "cos_brand", type: "Text (50)", required: true },
      { name: "Container Type", logical: "cos_containertype", type: "Text (20)", required: true },
      { name: "Beer Type", logical: "cos_beertype", type: "Text (30)", required: true },
      { name: "Sort Order", logical: "cos_sortorder", type: "Whole Number" },
      { name: "Is Active", logical: "cos_isactive", type: "Yes/No", required: true },
    ],
    x: 830, y: 430,
  },
  {
    id: "articlevkorg", name: "Article VKORG Availability", logicalName: "cos_articlevkorgavailability",
    description: "Definiert welche Artikel in welchen Verkaufsorganisationen verfügbar oder gesperrt sind. Ca. 130 Regeln. Parental-Beziehung: Artikel gelöscht → Regeln werden cascade-gelöscht.",
    category: "stammdaten", rows: "~130",
    columns: [
      { name: "Availability Key", logical: "cos_availabilitykey", type: "Text (100)", key: true, required: true },
      { name: "Article", logical: "cos_articlemaster", type: "Lookup", ref: "articlemaster", required: true },
      { name: "VKORG", logical: "cos_vkorg", type: "Text (50)", required: true },
      { name: "Is Blocked", logical: "cos_isblocked", type: "Yes/No", required: true },
    ],
    x: 1060, y: 430,
  },
  {
    id: "calculatorconfig", name: "Calculator Config", logicalName: "cos_calculatorconfig",
    description: "Systemweite Konstanten und Schwellenwerte für die Berechnungslogik (DB-Schwellenwerte, Zinssatz, Tilgungsdauer etc.). Direkt editierbar, keine Versionierung.",
    category: "stammdaten", rows: "~15",
    columns: [
      { name: "Parameter Name", logical: "cos_parametername", type: "Text (100)", key: true, required: true },
      { name: "Parameter Key", logical: "cos_parameterkey", type: "Text (50)", required: true },
      { name: "Value", logical: "cos_value", type: "Decimal", required: true },
      { name: "Unit", logical: "cos_unit", type: "Text (20)" },
      { name: "Description", logical: "cos_description", type: "Multiline (500)" },
    ],
    x: 1060, y: 190,
  },
];

const RELATIONS = [
  { from: "productcost", to: "configversion", label: "N:1", field: "Version", behavior: "Referential", delete: "Restrict" },
  { from: "ramppricing", to: "configversion", label: "N:1", field: "Version", behavior: "Referential", delete: "Restrict" },
  { from: "marketdata", to: "configversion", label: "N:1", field: "Version", behavior: "Referential", delete: "Restrict" },
  { from: "assortmentdefault", to: "configversion", label: "N:1", field: "Version", behavior: "Referential", delete: "Restrict" },
  { from: "advertisingcost", to: "configversion", label: "N:1", field: "Version", behavior: "Referential", delete: "Restrict" },
  { from: "articlevkorg", to: "articlemaster", label: "N:1", field: "Article", behavior: "Parental", delete: "Cascade" },
];

const CARD_W = 240;
const CARD_H_BASE = 50;
const COL_H = 20;

export default function ConfigAdminERD() {
  const [selected, setSelected] = useState(null);
  const [hoveredRel, setHoveredRel] = useState(null);
  const [positions, setPositions] = useState(() => {
    const m = {};
    TABLES.forEach((t) => { m[t.id] = { x: t.x, y: t.y }; });
    return m;
  });
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState("all");
  const [showCols, setShowCols] = useState(true);
  const [detailTab, setDetailTab] = useState("columns");
  const svgRef = useRef(null);

  const cardH = useCallback(
    (t) => CARD_H_BASE + (showCols ? Math.min(t.columns.length, 8) * COL_H + 10 : 0) + (showCols && t.columns.length > 8 ? 18 : 0),
    [showCols]
  );

  const handleMouseDown = (e, id) => {
    if (e.button !== 0) return;
    const r = svgRef.current.getBoundingClientRect();
    const s = 1320 / r.width;
    setDragging(id);
    setDragOffset({ x: e.clientX * s - positions[id].x, y: e.clientY * s - positions[id].y });
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const r = svgRef.current.getBoundingClientRect();
    const s = 1320 / r.width;
    setPositions((p) => ({ ...p, [dragging]: { x: Math.max(0, e.clientX * s - dragOffset.x), y: Math.max(0, e.clientY * s - dragOffset.y) } }));
  }, [dragging, dragOffset]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const filteredTables = useMemo(() => filter === "all" ? TABLES : TABLES.filter((t) => t.category === filter), [filter]);
  const filteredIds = useMemo(() => new Set(filteredTables.map((t) => t.id)), [filteredTables]);
  const filteredRels = useMemo(() => RELATIONS.filter((r) => filteredIds.has(r.from) && filteredIds.has(r.to)), [filteredIds]);

  const selectedTable = TABLES.find((t) => t.id === selected);
  const highlightedRels = useMemo(() => {
    if (!selected) return new Set();
    return new Set(filteredRels.map((r, i) => (r.from === selected || r.to === selected) ? i : -1).filter((i) => i >= 0));
  }, [selected, filteredRels]);

  const connectedIds = useMemo(() => {
    if (!selected) return new Set();
    const ids = new Set([selected]);
    filteredRels.forEach((r) => { if (r.from === selected) ids.add(r.to); if (r.to === selected) ids.add(r.from); });
    return ids;
  }, [selected, filteredRels]);

  const computePath = (rel) => {
    const fT = TABLES.find((t) => t.id === rel.from);
    const tT = TABLES.find((t) => t.id === rel.to);
    const fP = positions[rel.from], tP = positions[rel.to];
    const fH = cardH(fT), tH = cardH(tT);
    const fCx = fP.x + CARD_W / 2, fCy = fP.y + fH / 2;
    const tCx = tP.x + CARD_W / 2, tCy = tP.y + tH / 2;
    const dx = tCx - fCx, dy = tCy - fCy;
    let fX, fY, tX, tY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) { fX = fP.x + CARD_W; fY = fCy; tX = tP.x; tY = tCy; }
      else { fX = fP.x; fY = fCy; tX = tP.x + CARD_W; tY = tCy; }
    } else {
      if (dy > 0) { fX = fCx; fY = fP.y + fH; tX = tCx; tY = tP.y; }
      else { fX = fCx; fY = fP.y; tX = tCx; tY = tP.y + tH; }
    }
    const mX = (fX + tX) / 2, mY = (fY + tY) / 2;
    const horiz = Math.abs(dx) > Math.abs(dy);
    return {
      path: `M${fX},${fY} C${horiz ? mX : fX},${horiz ? fY : mY} ${horiz ? mX : tX},${horiz ? tY : mY} ${tX},${tY}`,
      labelPos: { x: mX, y: mY },
    };
  };

  const behaviorColor = (b) => b === "Parental" ? "#8B5CF6" : B.p500;
  const deleteColor = (d) => d === "Cascade" ? B.eB : B.wB;

  // SVG viewBox height
  const maxY = useMemo(() => {
    let m = 0;
    filteredTables.forEach((t) => { const p = positions[t.id]; m = Math.max(m, p.y + cardH(t)); });
    return Math.max(650, m + 40);
  }, [filteredTables, positions, cardH]);

  return (
    <div style={{ fontFamily: "'Roboto', -apple-system, sans-serif", background: B.w, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: B.p900, color: B.w, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Config Admin App — Dataverse ERD</div>
          <div style={{ fontSize: 11, opacity: 0.55, marginTop: 1 }}>Wirtschaftlichkeitsrechner V2 · Warsteiner ELA · 11 Tabellen · 6 Beziehungen</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {[{ key: "all", label: "Alle" }, ...Object.entries(CATEGORIES).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
            <button key={f.key} onClick={() => { setFilter(f.key); setSelected(null); }}
              style={{ padding: "3px 11px", borderRadius: 999, border: "1px solid", borderColor: filter === f.key ? B.t300 : "rgba(255,255,255,0.2)", background: filter === f.key ? B.t600 : "transparent", color: B.w, fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all .15s" }}>
              {f.label}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />
          <button onClick={() => setShowCols((v) => !v)}
            style={{ padding: "3px 11px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)", background: showCols ? "rgba(255,255,255,0.1)" : "transparent", color: B.w, fontSize: 11, cursor: "pointer" }}>
            {showCols ? "▾ Spalten" : "▸ Spalten"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* SVG Canvas */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <svg ref={svgRef} viewBox={`0 0 1320 ${maxY}`} style={{ width: "100%", height: "auto", minHeight: 500, cursor: dragging ? "grabbing" : "default" }}>
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10z" fill={B.p300} />
              </marker>
              <marker id="arrH" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10z" fill={B.t600} />
              </marker>
              <marker id="dia" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="8" markerHeight="8" orient="auto">
                <path d="M6 0 L12 6 L6 12 L0 6Z" fill={B.p300} />
              </marker>
              <marker id="diaH" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="8" markerHeight="8" orient="auto">
                <path d="M6 0 L12 6 L6 12 L0 6Z" fill={B.t600} />
              </marker>
              <filter id="sh" x="-4%" y="-4%" width="108%" height="112%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={B.p900} floodOpacity="0.07" />
              </filter>
              <filter id="shA" x="-4%" y="-4%" width="108%" height="116%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={B.t600} floodOpacity="0.18" />
              </filter>
            </defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.4" fill={B.n300} />
            </pattern>
            <rect width="1320" height={maxY} fill="url(#grid)" />

            {/* Relations */}
            {filteredRels.map((rel, i) => {
              const { path, labelPos } = computePath(rel);
              const hl = highlightedRels.has(i) || hoveredRel === i;
              const dim = selected && !highlightedRels.has(i);
              const isParental = rel.behavior === "Parental";
              return (
                <g key={i} onMouseEnter={() => setHoveredRel(i)} onMouseLeave={() => setHoveredRel(null)} style={{ cursor: "pointer" }}
                  onClick={() => setSelected(rel.from === selected ? rel.to : rel.from)}>
                  <path d={path} fill="none"
                    stroke={hl ? (isParental ? "#8B5CF6" : B.t600) : B.p300}
                    strokeWidth={hl ? 2.5 : 1.5}
                    strokeDasharray={isParental ? "6 3" : dim ? "4 4" : "none"}
                    opacity={dim ? 0.15 : 1}
                    markerEnd={hl ? "url(#arrH)" : "url(#arr)"}
                    markerStart={hl ? "url(#diaH)" : "url(#dia)"} />
                  {!dim && (
                    <g transform={`translate(${labelPos.x},${labelPos.y})`}>
                      <rect x="-28" y="-10" width="56" height="20" rx="4" fill={hl ? (isParental ? "#8B5CF6" : B.t600) : B.p700} />
                      <text textAnchor="middle" dy="4" fill={B.w} fontSize="8" fontWeight="600" fontFamily="Roboto,sans-serif">
                        {rel.label} {rel.delete === "Restrict" ? "🔒" : "⚡"}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Cards */}
            {filteredTables.map((table) => {
              const pos = positions[table.id];
              const cat = CATEGORIES[table.category];
              const isSel = selected === table.id;
              const isConn = !selected || connectedIds.has(table.id);
              const h = cardH(table);
              const visibleCols = showCols ? table.columns.slice(0, 8) : [];
              const hasMore = showCols && table.columns.length > 8;

              return (
                <g key={table.id} transform={`translate(${pos.x},${pos.y})`}
                  onMouseDown={(e) => handleMouseDown(e, table.id)}
                  onClick={() => { setSelected(isSel ? null : table.id); setDetailTab("columns"); }}
                  style={{ cursor: dragging === table.id ? "grabbing" : "pointer" }}
                  opacity={isConn ? 1 : 0.2}>
                  <rect width={CARD_W} height={h} rx="8" fill={B.w} stroke={isSel ? B.t600 : cat.border} strokeWidth={isSel ? 2.5 : 1} filter={isSel ? "url(#shA)" : "url(#sh)"} />
                  {/* Header */}
                  <rect width={CARD_W} height="38" rx="8" fill={isSel ? B.t600 : cat.color} />
                  <rect x="0" y="30" width={CARD_W} height="8" fill={isSel ? B.t600 : cat.color} />
                  <text x="10" y="15" fill={B.w} fontSize="11" fontWeight="700" fontFamily="Roboto,sans-serif" dominantBaseline="middle">
                    {table.name}
                  </text>
                  <text x="10" y="29" fill="rgba(255,255,255,0.55)" fontSize="7.5" fontFamily="Roboto,sans-serif" dominantBaseline="middle">
                    {table.logicalName}
                  </text>
                  {/* Row count badge */}
                  <rect x={CARD_W - 42} y="5" width="34" height="14" rx="7" fill="rgba(255,255,255,0.2)" />
                  <text x={CARD_W - 25} y="14" fill={B.w} fontSize="7.5" fontWeight="600" fontFamily="Roboto,sans-serif" textAnchor="middle" dominantBaseline="middle">
                    {table.rows}
                  </text>
                  {/* Columns */}
                  {visibleCols.map((col, ci) => {
                    const cy = 46 + ci * COL_H;
                    const isLookup = col.type === "Lookup";
                    return (
                      <g key={ci}>
                        {ci > 0 && <line x1="8" y1={cy - 3} x2={CARD_W - 8} y2={cy - 3} stroke={B.n200} strokeWidth="0.5" />}
                        {col.key && <text x="9" y={cy + 6} fontSize="7.5" fill={B.wB}>🔑</text>}
                        <text x={col.key ? 21 : 9} y={cy + 6} fontSize="9" fontFamily="Roboto,sans-serif"
                          fill={isLookup ? B.t600 : col.system ? B.n400 : B.n700}
                          fontWeight={isLookup ? 500 : 400}
                          fontStyle={col.system ? "italic" : "normal"}>
                          {col.name}
                        </text>
                        <text x={CARD_W - 9} y={cy + 6} fontSize="7.5" fontFamily="Roboto,sans-serif" fill={B.n500} textAnchor="end">
                          {col.type}
                        </text>
                        {col.required && !col.system && <circle cx={CARD_W - 5} cy={cy + 4} r="2" fill={B.eB} />}
                      </g>
                    );
                  })}
                  {hasMore && (
                    <text x={CARD_W / 2} y={46 + 8 * COL_H + 8} textAnchor="middle" fontSize="8" fill={B.n500} fontFamily="Roboto,sans-serif">
                      +{table.columns.length - 8} weitere Spalten
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail Sidebar */}
        {selectedTable && (
          <div style={{ width: 320, borderLeft: `1px solid ${B.n200}`, background: B.n50, overflowY: "auto", fontSize: 13 }}>
            {/* Sidebar Header */}
            <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${B.n200}`, background: B.w }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: B.p900 }}>{selectedTable.name}</div>
                  <div style={{ fontSize: 10, color: B.n500, fontFamily: "monospace", marginTop: 2 }}>{selectedTable.logicalName}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: B.n500, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: CATEGORIES[selectedTable.category].bg, color: CATEGORIES[selectedTable.category].color, fontWeight: 600 }}>
                  {CATEGORIES[selectedTable.category].label}
                </span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: B.n100, color: B.n600, fontWeight: 500 }}>
                  ~{selectedTable.rows} Zeilen
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${B.n200}` }}>
              <div style={{ padding: "8px 12px", background: CATEGORIES[selectedTable.category].bg, borderLeft: `3px solid ${CATEGORIES[selectedTable.category].color}`, borderRadius: 4, fontSize: 11.5, color: B.n700, lineHeight: 1.55 }}>
                {selectedTable.description}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${B.n200}`, background: B.w }}>
              {[{ key: "columns", label: `Spalten (${selectedTable.columns.length})` }, { key: "relations", label: "Beziehungen" }].map((tab) => (
                <button key={tab.key} onClick={() => setDetailTab(tab.key)}
                  style={{ flex: 1, padding: "8px 0", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                    background: "transparent", color: detailTab === tab.key ? B.t600 : B.n500,
                    borderBottom: detailTab === tab.key ? `2px solid ${B.t600}` : "2px solid transparent" }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: "12px 16px" }}>
              {detailTab === "columns" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {selectedTable.columns.map((col, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "5px 10px", borderRadius: 6,
                      background: col.type === "Lookup" ? B.t50 : col.system ? B.n50 : B.w,
                      border: `1px solid ${col.type === "Lookup" ? B.t200 : B.n200}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
                        {col.key && <span style={{ fontSize: 9 }}>🔑</span>}
                        {col.required && !col.system && <span style={{ width: 5, height: 5, borderRadius: 999, background: B.eB, flexShrink: 0 }} />}
                        <span style={{ fontSize: 11.5, fontWeight: col.key ? 600 : 400, color: col.type === "Lookup" ? B.t600 : col.system ? B.n400 : B.n900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {col.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 9.5, padding: "1px 6px", borderRadius: 4, background: col.type === "Lookup" ? B.t100 : B.n100, color: col.type === "Lookup" ? B.t600 : B.n600, fontWeight: 500, flexShrink: 0, marginLeft: 6 }}>
                        {col.type}
                      </span>
                    </div>
                  ))}
                  {/* Legend */}
                  <div style={{ marginTop: 10, padding: "8px 10px", background: B.n100, borderRadius: 6, fontSize: 10, color: B.n600, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>🔑 Primary</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: 999, background: B.eB }} /> Pflicht</span>
                    <span style={{ color: B.t600, fontWeight: 500 }}>Lookup</span>
                    <span style={{ fontStyle: "italic", color: B.n400 }}>System</span>
                  </div>
                </div>
              )}

              {detailTab === "relations" && (() => {
                const rels = RELATIONS.filter((r) => r.from === selectedTable.id || r.to === selectedTable.id);
                if (rels.length === 0) return (
                  <div style={{ padding: 16, textAlign: "center", color: B.n500, fontSize: 12 }}>
                    Keine direkten Lookup-Beziehungen
                  </div>
                );
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {rels.map((rel, i) => {
                      const isFrom = rel.from === selectedTable.id;
                      const other = TABLES.find((t) => t.id === (isFrom ? rel.to : rel.from));
                      return (
                        <div key={i} onClick={(e) => { e.stopPropagation(); setSelected(other.id); setDetailTab("columns"); }}
                          style={{ padding: "10px 12px", borderRadius: 8, background: B.w, border: `1px solid ${B.p100}`, cursor: "pointer", transition: "all .15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = B.t300}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = B.p100}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: B.p600, background: B.p50, padding: "2px 6px", borderRadius: 4 }}>
                              {isFrom ? "→" : "←"} {rel.label}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: B.p900 }}>{other.name}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: behaviorColor(rel.behavior) + "18", color: behaviorColor(rel.behavior), fontWeight: 600 }}>
                              {rel.behavior}
                            </span>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: deleteColor(rel.delete) + "20", color: deleteColor(rel.delete), fontWeight: 600 }}>
                              Delete: {rel.delete}
                            </span>
                            <span style={{ fontSize: 9, color: B.n500 }}>Feld: {rel.field}</span>
                          </div>
                        </div>
                      );
                    })}
                    {/* Behavior Legend */}
                    <div style={{ marginTop: 8, padding: "10px 12px", background: B.p50, borderRadius: 8, fontSize: 10, color: B.p700, lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Behavior-Typen:</div>
                      <div>🔒 <strong>Restrict</strong> — Parent nicht löschbar solange Kinder existieren</div>
                      <div>⚡ <strong>Cascade</strong> — Kinder werden automatisch mitgelöscht</div>
                      <div style={{ marginTop: 4 }}>
                        <strong>Referential</strong> = Lose Referenz · <strong>Parental</strong> = Echte Eltern-Kind-Beziehung
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: B.n50, borderTop: `1px solid ${B.n200}`, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: B.n500 }}>
        <span>{filteredTables.length} Tabellen · {filteredRels.length} Beziehungen · Drag & Drop zum Verschieben · Klick für Details</span>
        <span>Warsteiner ELA · Config Admin · Datenmodell v1.0</span>
      </div>
    </div>
  );
}
