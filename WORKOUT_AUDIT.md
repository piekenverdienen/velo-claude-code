# COMPLETE WORKOUT AUDIT - Visual vs Export Consistency

## DOEL
Verifiëren dat ALLE workouts in de database:
1. Correct visueel worden weergegeven
2. Correct worden geëxporteerd naar .zwo
3. Visual en export 100% matchen

---

## WORKOUT CATEGORIEËN

### Categorie 1: STEADY STATE (Geen Intervals)

#### 1.1 Zone 1 Base Builder
**Database:**
```javascript
name: "Zone 1 Base Builder"
intensity: "65% FTP"
duration: 75
details: "Warm-up: 10 min easy spin. Main: 60 min steady Zone 1. Cool-down: 5 min spin."
```

**Visual Rendering (ui.js):**
- parseWorkoutPhasesAdvanced() parseert details
- Vindt: "Warm-up: 10 min" → 10 min warmup
- Vindt: "Cool-down: 5 min" → 5 min cooldown
- Berekent: Main = 75 - 10 - 5 = 60 min
- Intensity: getIntensityValue() → "65% FTP" → 0.65
- **Graph: 10 min warmup (0.55) | 60 min main (0.65) | 5 min cooldown (0.50)**

**Export Logic (zwift-export.js):**
- parseWarmupCooldownDurations() parseert "Warm-up: 10 min" → 600s
- parseWarmupCooldownDurations() parseert "Cool-down: 5 min" → 300s
- Main = 75*60 - 600 - 300 = 3600s (60 min)
- parseIntensityPercentage() → "65% FTP" → 0.65
- Steady state (geen intervals)
- **XML: <Warmup Duration="600"/> | <SteadyState Duration="3600" Power="0.65"/> | <Cooldown Duration="300"/>**

**STATUS:** ✅ MATCH (na laatste fix)

---

#### 1.2 Active Recovery
**Database:**
```javascript
name: "Active Recovery"
intensity: "55% FTP"
duration: 50
details: "Easy spin for 50 min. High cadence, minimal resistance throughout."
```

**Visual Rendering:**
- GEEN "Warm-up:" of "Cool-down:" in details
- createSimpleWorkoutGraph() fallback
- duration >= 60? NO → warmup=10, cooldown=5
- Main = 50 - 10 - 5 = 35 min
- Intensity: "55% FTP" → 0.55
- **Graph: 10 min warmup | 35 min main (0.55) | 5 min cooldown**

**Export Logic:**
- parseWarmupCooldownDurations() vindt GEEN "Warm-up:" of "Cool-down:"
- Fallback naar category: "55% FTP" → easy → 300s warmup, 300s cooldown
- Main = 50*60 - 300 - 300 = 2400s (40 min)
- Power: 0.55
- **XML: <Warmup Duration="300"/> | <SteadyState Duration="2400" Power="0.55"/> | <Cooldown Duration="300"/>**

**STATUS:** ❌ MISMATCH!
- Visual: 10 min warmup, 35 min main, 5 min cooldown
- Export: 5 min warmup, 40 min main, 5 min cooldown
- **PROBLEEM:** Visual gebruikt hardcoded 10/5 min voor <60 min workouts

---

### Categorie 2: EENVOUDIGE INTERVALS

#### 2.1 Tempo Intervals
**Database:**
```javascript
name: "Tempo Intervals"
intensity: "80-85% FTP"
duration: 70
details: "Warm-up: 15 min. Main: 3x8 min @ 80-85% FTP, 4 min easy. Cool-down: 10 min."
```

**Visual Rendering:**
- Parseert: "Warm-up: 15 min" → 15 min
- Parseert: "Cool-down: 10 min" → 10 min
- Interval match: "3x8 min"
- Intensity match: "80-85%" → avg 82.5%
- Recovery match: "4 min easy" → 4 min
- **Graph: 15 min warmup | (8 min @ 0.825 + 4 min recovery) x 3 | 10 min cooldown**
- Total intervals: 3 * (8 + 4) = 36 min
- Total: 15 + 36 + 10 = 61 min (but workout is 70 min!)
- Available: 70 - 15 - 10 = 45 min
- **Moet passen of filler toevoegen**

**Export Logic:**
- Parseert warmup/cooldown: 15 min, 10 min
- Main available: 70 - 15 - 10 = 45 min (2700s)
- parseIntervalStructure() vindt: 3x8 min
- Recovery: "4 min easy" → 240s
- Total parsed: 3 * (8*60 + 240) = 3 * 720 = 2160s (36 min)
- Fits in 45 min? YES
- Remaining: 2700 - 2160 = 540s (9 min)
- **XML: Warmup 900s | IntervalsT 3x480s on/240s off | SteadyState 540s | Cooldown 600s**

**STATUS:** ⚠️ MOGELIJK MISMATCH
- Visual: laat alleen intervals zien?
- Export: voegt 9 min filler toe
- **PROBLEEM:** Details specificeren niet de volledige 70 min

---

#### 2.2 VO2 Max Destroyer
**Database:**
```javascript
name: "VO2 Max Destroyer"
intensity: "110-120% FTP"
duration: 60
details: "Warm-up: 15 min. Main: 5x3 min @ 110-120% FTP, 3 min recovery. Cool-down: 10 min."
```

**Visual Rendering:**
- Warmup: 15 min
- Cooldown: 10 min
- Intervals: 5x3 min @ 110-120% FTP
- Recovery: 3 min
- Intensity: (110+120)/2 = 115% = 1.15
- **Graph: 15 min warmup | (3 min @ 1.15 + 3 min @ 0.55) x 5 | 10 min cooldown**
- Intervals total: 5 * 6 = 30 min
- Total: 15 + 30 + 10 = 55 min (but workout is 60 min!)

**Export Logic:**
- Warmup: 900s (15 min)
- Cooldown: 600s (10 min)
- Available: 60*60 - 900 - 600 = 2100s (35 min)
- Intervals: 5x3 min (180s), recovery 3 min (180s)
- Total: 5 * 360 = 1800s (30 min)
- Remaining: 2100 - 1800 = 300s (5 min)
- **XML: Warmup 900s | IntervalsT 5x180s on/180s off | SteadyState 300s | Cooldown 600s**

**STATUS:** ⚠️ MISMATCH
- Details: 15 + 30 + 10 = 55 min, maar duration = 60 min
- Export voegt 5 min filler toe
- **PROBLEEM:** Database details kloppen niet met duration field

---

### Categorie 3: COMPLEXE PATTERNS

#### 3.1 Sweet Spot Pyramid
**Database:**
```javascript
name: "Sweet Spot Pyramid"
intensity: "88-92% FTP"
duration: 75
details: "Warm-up: 15 min. Main: 5-10-15-10-5 min @ 88-92% FTP, 3 min easy. Cool-down: 10 min."
```

**Visual Rendering:**
- ui.js heeft GEEN pyramid parsing!
- Valt terug naar steady state
- **Graph: 15 min warmup | 50 min steady @ 0.90 | 10 min cooldown**

**Export Logic:**
- detectWorkoutType() → "pyramid" (vindt "pyramid" in name)
- parseIntervalStructure() → type: 'pyramid'
- generateWorkoutSegments() → pyramid case:
  ```javascript
  const segments_pyramid = [300, 600, 900, 600, 300]; // 5,10,15,10,5 min
  const recovery = 180; // 3 min
  ```
- **XML: Warmup | 5min + 3min + 10min + 3min + 15min + 3min + 10min + 3min + 5min | Cooldown**
- Pyramid + recovery = 45 + 12 = 57 min?
- Maar available = 75 - 15 - 10 = 50 min

**STATUS:** ❌ CRITICAL MISMATCH!
- Visual: Toont steady state (FOUT!)
- Export: Probeert pyramid maar past niet in tijd
- **PROBLEEM:** Pyramid pattern niet goed geïmplementeerd in BEIDE

---

### Categorie 4: SPECIAL CASES

#### 4.1 Sprint Power Repeats
**Database:**
```javascript
name: "Sprint Power Repeats"
intensity: "150%+ FTP"
duration: 55
details: "Warm-up: 15 min. Main: 8x30 seconds all-out, 3 min recovery. Cool-down: 10 min."
```

**Visual Rendering:**
- Intervals: 8x30 seconds
- parseTime converts: 30 seconds → 0.5 min
- Recovery: 3 min
- Intensity: "150%+ FTP" → string match fails → falls back to 'hard' → 0.95?
- **Graph: 15 min warmup | (0.5 min @ ??? + 3 min recovery) x 8 | 10 min cooldown**

**Export Logic:**
- Intervals: 8x30 seconds → 8x30s
- Recovery: 3 min → 180s
- detectWorkoutType() → "sprint" (finds "sprint" in name)
- getPowerForWorkout('sprint') → 1.21 (anaerobic.low)
- **XML: Warmup | IntervalsT 8x30s on/180s off OnPower="1.21" | Cooldown**

**STATUS:** ⚠️ POSSIBLE MISMATCH
- Visual intensity: unclear (150%+ doesn't parse well)
- Export: 121% power (maar 150%+ is gevraagd!)
- **PROBLEEM:** 150%+ FTP intensity niet correct geparsed

---

#### 4.2 Polarized Power Test
**Database:**
```javascript
name: "Polarized Power Test"
intensity: "Variable"
duration: 70
details: "Warm-up: 20 min progressive. Test: 2x8 min @ 100% FTP, 10 min recovery. Cool-down: easy spin."
```

**Visual Rendering:**
- "Warm-up: 20 min" → 20 min warmup
- "Cool-down: easy spin" → NO MATCH (geen tijd)
- Interval: "2x8 min @ 100% FTP"
- Intensity: "Variable" → geen percentage → fallback?
- Recovery: "10 min recovery" → 10 min
- **Graph: ???**

**Export Logic:**
- "Warm-up: 20 min" → 600s? NO! 20*60 = 1200s
- "Cool-down: easy spin" → NO MATCH → fallback (300 of 600s?)
- Intervals: 2x8 min @ 100% FTP
- intensity "Variable" → mapIntensityToCategory() → 'easy' (fallback)
- **XML: ???**

**STATUS:** ❌ CRITICAL ISSUES
- "Cool-down: easy spin" heeft geen tijd specificatie
- "Variable" intensity niet gehandeld
- "progressive" warmup niet geïmplementeerd

---

## SAMENVATTING PROBLEMEN

### KRITIEKE ISSUES:
1. ❌ **Pyramid workouts:** Visual toont steady, export heeft buggy pyramid logic
2. ❌ **"Variable" intensity:** Niet gehandeld, valt door naar fallback
3. ❌ **"150%+ FTP":** Wordt niet correct geparsed als percentage
4. ❌ **"Cool-down: easy spin":** Geen tijd → parseert niet
5. ❌ **Database inconsistenties:** Duration != sum(warmup + main + cooldown)

### MEDIUM ISSUES:
6. ⚠️ **Visual vs Export warmup defaults:** Verschillen voor workouts zonder details
7. ⚠️ **Filler time:** Export voegt automatisch filler toe, visual niet
8. ⚠️ **Progressive warmup:** "15 min progressive" wordt niet anders behandeld

### DESIGN ISSUES:
9. ⚠️ **Details quality:** Veel workouts hebben incomplete details
10. ⚠️ **No validation:** Geen check of duration klopt met sum(phases)

---

## AANBEVELINGEN

### PRIORITEIT 1 (Must Fix):
1. Fix pyramid workout logic in BEIDE visual en export
2. Add proper handling voor "Variable" intensity
3. Fix "150%+ FTP" parsing
4. Add fallback voor cooldowns zonder tijd

### PRIORITEIT 2 (Should Fix):
5. Consistent warmup/cooldown defaults tussen visual en export
6. Document/fix duration inconsistencies in database
7. Add validation: check total time matches

### PRIORITEIT 3 (Nice to Have):
8. Implement progressive warmup rendering
9. Better handling voor complex patterns
10. Add workout validation tool
