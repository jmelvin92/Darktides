import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, 
  FlaskConical, 
  Layers, 
  AlertCircle,
  Syringe,
  Activity,
  Droplets,
  Info,
  ChevronDown,
  HelpCircle,
  Calculator as CalculatorIcon,
  ShieldCheck
} from 'lucide-react';

type CalcMode = 'bac_water' | 'dosage' | 'blend';
type DoseUnit = 'MCG' | 'MG';
type SyringeType = 'U100' | 'U50' | 'U40' | 'U30';

interface SyringeConfig {
  label: string;
  maxUnits: number;
  unitsPerMl: number;
  description: string;
}

const SYRINGE_MAP: Record<SyringeType, SyringeConfig> = {
  U100: { 
    label: 'U-100 (1.0mL)', 
    maxUnits: 100, 
    unitsPerMl: 100, 
    description: '100 units = 1.0mL (1u = 0.01mL)' 
  },
  U50: { 
    label: 'U-50 (0.5mL)', 
    maxUnits: 50, 
    unitsPerMl: 100, 
    description: '50 units = 0.5mL (1u = 0.01mL)' 
  },
  U40: { 
    label: 'U-40 (1.0mL)', 
    maxUnits: 40, 
    unitsPerMl: 40, 
    description: '40 units = 1.0mL (1u = 0.025mL)' 
  },
  U30: { 
    label: 'U-30 (0.3mL)', 
    maxUnits: 30, 
    unitsPerMl: 100, 
    description: '30 units = 0.3mL (1u = 0.01mL)' 
  },
};

const InfoTip: React.FC<{ content: string }> = ({ content }) => (
  <div className="group relative inline-block ml-2">
    <HelpCircle size={12} className="text-slate-600 hover:text-neon-blue cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-obsidian border border-white/10 rounded-xl text-[10px] text-slate-300 font-bold leading-relaxed shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none uppercase tracking-tight">
      <div className="text-neon-blue mb-1 font-black">EXPLANATION</div>
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-obsidian"></div>
    </div>
  </div>
);

const SyringeVisualizer: React.FC<{ units: number; config: SyringeConfig }> = ({ units, config }) => {
  const percentage = Math.min(Math.max((units / config.maxUnits) * 100, 0), 100);

  return (
    <div className="w-full bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col items-center gap-4">
      <div className="flex flex-col w-full gap-1">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Syringe size={12} className="text-neon-blue" />
          {config.label} Syringe
          <InfoTip content="Visual guide showing where to draw on your syringe. The blue fill indicates your target draw point. Always verify with actual syringe markings." />
        </div>
        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tight ml-5">
          {config.description}
        </div>
      </div>
      
      {/* Syringe Body Container */}
      <div className="relative w-full h-20 bg-slate-900/40 rounded-lg border-x-4 border-slate-700/60 overflow-hidden flex items-center shadow-inner">
        {/* Plunger Tip (Animated) */}
        <div 
          className="absolute h-full bg-neon-blue/30 border-r-4 border-neon-blue shadow-[0_0_25px_rgba(0,243,255,0.3)] transition-all duration-700 ease-out z-10"
          style={{ width: `${percentage}%` }}
        >
          {/* Liquid highlight effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20"></div>
        </div>

        {/* Measurement Marks - Enhanced Visibility */}
        <div className="absolute inset-0 flex justify-between px-0.5 pointer-events-none z-20">
          {Array.from({ length: config.maxUnits + 1 }).map((_, i) => {
            const isMajor = i % 10 === 0;
            const isMid = i % 5 === 0 && !isMajor;
            // Only render visible marks to avoid DOM bloat
            if (!isMajor && !isMid && config.maxUnits > 50 && i % 2 !== 0) return null;

            return (
              <div key={i} className="flex flex-col items-center h-full relative">
                <div 
                  className={`border-l ${isMajor ? 'h-1/2 border-slate-300 w-px mt-auto' : isMid ? 'h-1/3 border-slate-500 w-px mt-auto' : 'h-1/5 border-slate-600 w-px mt-auto'}`}
                ></div>
                {isMajor && (
                  <span className="absolute bottom-1/2 mb-2 text-[7px] font-black text-slate-500 mono leading-none transform -translate-x-1/2">
                    {i}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Plunger Handle (Shaft) */}
        <div 
          className="absolute h-6 bg-slate-800 border-y border-slate-700 transition-all duration-700 ease-out z-0"
          style={{ left: `${percentage}%`, width: '100%' }}
        >
          <div className="w-full h-px bg-slate-700 mt-3 opacity-50"></div>
        </div>
      </div>
      
      <div className="flex justify-between w-full px-2">
         <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Injection Point</span>
         <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-neon-blue animate-pulse mono">{units.toFixed(1)}</span>
              <span className="text-[10px] font-black text-neon-blue/60 uppercase">Units</span>
            </div>
            <span className="text-[8px] text-slate-600 font-black tracking-widest uppercase">Target Draw</span>
         </div>
         <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Barrel Max</span>
      </div>
    </div>
  );
};

interface PeptidePreset {
  name: string;
  vialMg: number;
  commonDoseMg: number;
  doseUnit: DoseUnit;
  category: 'catalog' | 'common';
}

const PEPTIDE_PRESETS: PeptidePreset[] = [
  // DarkTides Catalog
  { name: 'GLP-3 10mg', vialMg: 10, commonDoseMg: 0.25, doseUnit: 'MG', category: 'catalog' },
  { name: 'GLP-3 20mg', vialMg: 20, commonDoseMg: 0.5, doseUnit: 'MG', category: 'catalog' },
  { name: 'GHK-Cu 100mg', vialMg: 100, commonDoseMg: 5, doseUnit: 'MG', category: 'catalog' },
  { name: 'MOTS-C 10mg', vialMg: 10, commonDoseMg: 5, doseUnit: 'MG', category: 'catalog' },
  { name: 'TESA 10mg', vialMg: 10, commonDoseMg: 1, doseUnit: 'MG', category: 'catalog' },
  { name: 'CJC-1295/Ipamorelin 5mg', vialMg: 5, commonDoseMg: 200, doseUnit: 'MCG', category: 'catalog' },
  { name: 'KPV 10mg', vialMg: 10, commonDoseMg: 500, doseUnit: 'MCG', category: 'catalog' },
  { name: 'MT-1 10mg', vialMg: 10, commonDoseMg: 0.5, doseUnit: 'MG', category: 'catalog' },
  { name: 'NAD+ 100mg', vialMg: 100, commonDoseMg: 50, doseUnit: 'MG', category: 'catalog' },
  { name: '5-Amino-1MQ 50mg', vialMg: 50, commonDoseMg: 10, doseUnit: 'MG', category: 'catalog' },
  // Common Research Peptides
  { name: 'BPC-157 5mg', vialMg: 5, commonDoseMg: 250, doseUnit: 'MCG', category: 'common' },
  { name: 'TB-500 10mg', vialMg: 10, commonDoseMg: 2.5, doseUnit: 'MG', category: 'common' },
  { name: 'Semax 30mg', vialMg: 30, commonDoseMg: 600, doseUnit: 'MCG', category: 'common' },
  { name: 'Selank 10mg', vialMg: 10, commonDoseMg: 250, doseUnit: 'MCG', category: 'common' },
];

const PeptideCalculator: React.FC = () => {
  // --- UI State ---
  const [mode, setMode] = useState<CalcMode>('bac_water');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('MG');
  const [syringe, setSyringe] = useState<SyringeType>('U100');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  // --- Lab State ---
  const [vialPeptideMg, setVialPeptideMg] = useState<number>(5);
  const [desiredDose, setDesiredDose] = useState<number>(2.5);
  const [manualWaterMl, setManualWaterMl] = useState<number>(1.0);
  const [vialPeptideBMg, setVialPeptideBMg] = useState<number>(2); 

  // --- Calculations ---

  // MODE: RECONSTITUTION
  const recommendedBacWater = useMemo(() => {
    if (desiredDose <= 0) return 0;
    const doseInMg = doseUnit === 'MCG' ? desiredDose / 1000 : desiredDose;
    return (vialPeptideMg / doseInMg) * 0.1;
  }, [vialPeptideMg, desiredDose, doseUnit]);

  // MODE: PEPTIDE / DOSAGE
  const unitsToPull = useMemo(() => {
    if (manualWaterMl <= 0 || vialPeptideMg <= 0) return 0;
    const config = SYRINGE_MAP[syringe];
    const density = vialPeptideMg / manualWaterMl;
    const doseInMg = doseUnit === 'MCG' ? desiredDose / 1000 : desiredDose;
    const mlNeeded = doseInMg / density;
    return mlNeeded * config.unitsPerMl;
  }, [vialPeptideMg, manualWaterMl, desiredDose, doseUnit, syringe]);

  // MODE: BLEND
  const blendResults = useMemo(() => {
    if (manualWaterMl <= 0 || vialPeptideMg <= 0) return { a: 0, b: 0 };
    const densityA = vialPeptideMg / manualWaterMl;
    const densityB = vialPeptideBMg / manualWaterMl;
    const doseInMgA = doseUnit === 'MCG' ? desiredDose / 1000 : desiredDose;
    const volumePulledMl = doseInMgA / densityA;
    const yieldB = volumePulledMl * densityB;
    
    return {
      a: doseUnit === 'MG' ? desiredDose * 1000 : desiredDose,
      b: yieldB * 1000 
    };
  }, [vialPeptideMg, vialPeptideBMg, manualWaterMl, desiredDose, doseUnit]);

  const handleReset = () => {
    setVialPeptideMg(5);
    setVialPeptideBMg(2);
    setManualWaterMl(1.0);
    setDesiredDose(2.5);
    setDoseUnit('MG');
    setSyringe('U100');
    setSelectedPreset('');
  };

  const handlePresetSelect = (preset: PeptidePreset) => {
    setVialPeptideMg(preset.vialMg);
    setDesiredDose(preset.commonDoseMg);
    setDoseUnit(preset.doseUnit);
    setManualWaterMl(1.0);
    setSyringe('U100');
    setSelectedPreset(preset.name);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-20 relative">
      {/* Header */}
      <div className="text-center pt-20 pb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-black border border-neon-blue/40 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.15)]">
            <CalculatorIcon className="text-neon-blue" size={24} />
          </div>
        </div>
        <h1 className="text-5xl font-black tracking-[-0.07em] text-white mb-2">DARKTIDES CALCULATOR</h1>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md shadow-lg">
        <button
          onClick={() => setMode('bac_water')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'bac_water' ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Reconstitution
          <InfoTip content="Calculates bacteriostatic water volume needed so your target dose equals exactly 10 units (0.1mL) on a U-100 insulin syringe. This simplifies dosing." />
        </button>
        <button
          onClick={() => setMode('dosage')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'dosage' ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Peptide
          <InfoTip content="Calculates exact syringe units to draw for your dose. Enter the water volume you added and desired dose. Works with any syringe type." />
        </button>
        <button
          onClick={() => setMode('blend')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'blend' ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Blend Mode
          <InfoTip content="For vials with 2 peptides mixed together. Enter both peptide amounts. When you draw your primary dose, it calculates how much of the secondary peptide you'll also receive." />
        </button>
      </div>

      {/* Common Research Peptides Dropdown */}
      <div className="glass rounded-[2rem] p-6 border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Droplets size={14} className="text-neon-blue" />
            <span className="text-[10px] font-black text-neon-blue uppercase tracking-[0.3em]">
              Quick Presets
            </span>
            <InfoTip content="Pre-configured settings for common research peptides. Selecting a preset automatically fills in vial size and typical dose values." />
          </div>
          
          <div className="relative flex-1 group">
            <select
              value={selectedPreset}
              onChange={(e) => {
                if (e.target.value) {
                  const preset = PEPTIDE_PRESETS.find(p => p.name === e.target.value);
                  if (preset) {
                    handlePresetSelect(preset);
                  }
                }
              }}
              className="w-full bg-obsidian border-2 border-slate-900 rounded-2xl px-6 py-4 text-sm md:text-base font-bold text-white appearance-none hover:border-neon-blue/30 focus:border-neon-blue/50 outline-none transition-all cursor-pointer shadow-inner min-h-[48px]"
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            >
              <option value="" className="bg-obsidian text-slate-400">
                {selectedPreset || "Select a research peptide..."}
              </option>
              <optgroup label="DarkTides Catalog" className="bg-obsidian">
                {PEPTIDE_PRESETS.filter(p => p.category === 'catalog').map((preset) => (
                  <option key={preset.name} value={preset.name} className="bg-obsidian text-white py-2">
                    {preset.name} • {preset.commonDoseMg}{preset.doseUnit === 'MG' ? 'mg' : 'mcg'}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Common Peptides" className="bg-obsidian">
                {PEPTIDE_PRESETS.filter(p => p.category === 'common').map((preset) => (
                  <option key={preset.name} value={preset.name} className="bg-obsidian text-white py-2">
                    {preset.name} • {preset.commonDoseMg}{preset.doseUnit === 'MG' ? 'mg' : 'mcg'}
                  </option>
                ))}
              </optgroup>
            </select>
            
            <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown 
                size={20} 
                className="text-slate-500 group-hover:text-neon-blue transition-all group-focus-within:text-neon-blue group-focus-within:rotate-180" 
              />
            </div>
            
            {selectedPreset && (
              <div className="absolute -bottom-5 left-0 text-[9px] text-neon-blue/60 font-bold uppercase tracking-widest animate-in fade-in duration-300">
                PRESET LOADED: {selectedPreset}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Result Section */}
      <div className="glass rounded-[2.5rem] p-8 border-neon-blue/30 shadow-2xl relative overflow-hidden bg-gradient-to-br from-neon-blue/10 to-transparent">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-neon-blue/60 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
            {mode === 'bac_water' ? 'Recommended BAC Water' : mode === 'dosage' ? 'Syringe Draw Amount' : 'Combined Blend Result'}
          </div>
          
          <div className="flex items-baseline justify-center gap-4">
            <span className="text-8xl font-black text-white neon-glow tracking-tighter leading-none">
              {mode === 'bac_water' ? recommendedBacWater.toFixed(2) : unitsToPull.toFixed(1)}
            </span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-2xl text-neon-blue font-bold uppercase">
                {mode === 'bac_water' ? 'ML' : 'Units'}
              </span>
              <span className="text-[10px] text-slate-500 font-black mt-2 uppercase tracking-tighter">
                {mode === 'bac_water' ? 'Total Volume' : 'Tick Mark'}
              </span>
            </div>
          </div>

          {mode === 'blend' && (
            <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8">
              <div className="bg-black/40 rounded-xl p-3 border border-white/5 text-left">
                <div className="text-[8px] text-neon-blue font-black uppercase tracking-widest">Peptide A Yield</div>
                <div className="text-lg font-bold text-white mono">{blendResults.a.toFixed(0)}<span className="text-[10px] opacity-40 ml-1">mcg</span></div>
              </div>
              <div className="bg-black/40 rounded-xl p-3 border border-blue-900/30 text-left">
                <div className="text-[8px] text-blue-400 font-black uppercase tracking-widest">Peptide B Yield</div>
                <div className="text-lg font-bold text-white mono">{blendResults.b.toFixed(0)}<span className="text-[10px] opacity-40 ml-1">mcg</span></div>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-black/40 rounded-2xl border border-white/5 w-full max-w-sm">
             <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-neon-blue/5 flex items-center justify-center border border-neon-blue/20">
                  <Info className="text-neon-blue" size={18} />
                </div>
                <div>
                  <div className="text-[9px] text-neon-blue font-black uppercase tracking-widest">Research Note</div>
                  <p className="text-[10px] text-slate-400 font-bold leading-tight uppercase">
                    {mode === 'bac_water' 
                      ? "Calculation assumes 0.1mL = 10 Units. Resulting volume ensures your dose is exactly 10 Units."
                      : `Calibration: ${SYRINGE_MAP[syringe].label}. ${SYRINGE_MAP[syringe].description}`}
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Syringe Animation for Peptide and Blend modes */}
      {mode !== 'bac_water' && (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
           <SyringeVisualizer units={unitsToPull} config={SYRINGE_MAP[syringe]} />
        </div>
      )}

      {/* Main Container for Inputs */}
      <div className="space-y-6">
        
        {/* Vial Details Section */}
        <div className="glass rounded-[2rem] p-8 border-slate-800 shadow-xl">
          <div className="text-[10px] font-black text-neon-blue uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <FlaskConical size={14} />
            Vial Details
            <InfoTip content="Total amount of peptide powder in your vial before adding water. Found on the vial label (e.g., 5mg, 10mg). Enter number only." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Total Peptide (MG)</label>
              <input 
                type="number" 
                value={vialPeptideMg}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 0 && val <= 1000) setVialPeptideMg(val);
                }}
                min="0"
                max="1000"
                className="w-full bg-obsidian border-2 border-slate-900 rounded-2xl px-6 py-4 text-3xl font-black text-white focus:border-neon-blue/40 outline-none transition-all mono shadow-inner"
              />
            </div>

            {mode !== 'bac_water' && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Water Added (ML)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={manualWaterMl}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 0 && val <= 100) setManualWaterMl(val);
                  }}
                  min="0"
                  max="100"
                  className="w-full bg-obsidian border-2 border-slate-900 rounded-2xl px-6 py-4 text-3xl font-black text-white focus:border-neon-blue/40 outline-none transition-all mono shadow-inner"
                />
              </div>
            )}
            
            {mode === 'blend' && (
              <div className="space-y-4 animate-in slide-in-from-left-4 duration-500 md:col-span-2 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-blue-500" />
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secondary Peptide (MG)</label>
                  <InfoTip content="The weight of the second peptide in the same vial. Enter the total mg amount. The calculator will determine how much you receive based on the primary dose volume." />
                </div>
                <input 
                  type="number" 
                  value={vialPeptideBMg}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 0 && val <= 1000) setVialPeptideBMg(val);
                  }}
                  min="0"
                  max="1000"
                  className="w-full bg-obsidian border-2 border-slate-900 rounded-2xl px-6 py-4 text-3xl font-black text-white focus:border-blue-500/20 outline-none transition-all mono shadow-inner"
                />
              </div>
            )}
          </div>
        </div>

        {/* Dose & Syringe Section */}
        <div className="glass rounded-[2rem] p-8 border-slate-800 shadow-xl">
          <div className="text-[10px] font-black text-neon-blue uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <Activity size={14} />
            Dose Desired
            <InfoTip content="Amount you want to administer per injection. Use MG for larger doses (≥1mg) or MCG for smaller doses (<1mg). 1mg = 1000mcg." />
          </div>
          <div className={`grid grid-cols-1 ${mode === 'bac_water' ? '' : 'md:grid-cols-2'} gap-8`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dose Amount</label>
                <div className="flex bg-black/60 p-1 rounded-lg border border-white/5">
                  {(['MCG', 'MG'] as DoseUnit[]).map(u => (
                    <button
                      key={u}
                      onClick={() => {
                        if(u !== doseUnit) {
                          setDesiredDose(u === 'MG' ? desiredDose / 1000 : desiredDose * 1000);
                          setDoseUnit(u);
                        }
                      }}
                      className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${doseUnit === u ? 'bg-neon-blue text-black' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <input 
                type="number"
                step={doseUnit === 'MG' ? "0.1" : "1"}
                value={desiredDose}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const maxDose = doseUnit === 'MG' ? 100 : 10000;
                  if (val >= 0 && val <= maxDose) setDesiredDose(val);
                }}
                min="0"
                max={doseUnit === 'MG' ? "100" : "10000"}
                className="w-full bg-obsidian border-2 border-slate-900 rounded-2xl px-6 py-4 text-3xl font-black text-white focus:border-neon-blue/40 outline-none transition-all mono shadow-inner"
              />
            </div>

            {mode !== 'bac_water' && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Syringe Volume</label>
                <div className="relative group">
                  <select
                    value={syringe}
                    onChange={(e) => setSyringe(e.target.value as SyringeType)}
                    className="w-full bg-obsidian border-2 border-slate-900 rounded-2xl px-6 py-4 text-xl font-bold text-white appearance-none focus:border-neon-blue/40 outline-none transition-all cursor-pointer"
                  >
                    {Object.entries(SYRINGE_MAP).map(([key, config]) => (
                      <option key={key} value={key} className="bg-obsidian">{config.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-neon-blue transition-colors">
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 flex items-center justify-between">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 text-[10px] font-black text-slate-600 hover:text-neon-blue transition-colors uppercase tracking-[0.2em]"
          >
            <RefreshCw size={12} />
            Reset Parameters
          </button>
          
          <div className="flex items-center gap-2 text-amber-500/60">
            <AlertCircle size={14} />
            <span className="text-[9px] font-bold uppercase tracking-widest italic leading-none">Aseptic technique mandatory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Calculator: React.FC = () => {
  return (
    <div className="relative min-h-screen">
      <PeptideCalculator />
    </div>
  );
};

export default Calculator;