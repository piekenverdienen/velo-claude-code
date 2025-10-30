# WORKOUT DEFINITION GUIDELINES

Dit document beschrijft hoe je nieuwe workouts toevoegt aan de Polarized Training App.
Na de fundamentele refactor is dit proces veel eenvoudiger - nieuwe workouts werken automatisch!

---

## QUICK START

### Minimaal Vereiste Fields:

```javascript
{
    name: "Mijn Nieuwe Workout",
    description: "Beschrijving voor gebruiker",
    intensity: "80-85% FTP",  // Of "65% FTP", "110-120% FTP", etc.
    duration: 60,              // Totaal in minuten
    details: "Warm-up: 10 min. Main: 3x8 min @ 80-85% FTP, 4 min easy. Cool-down: 10 min.",
    tips: "Tips voor de gebruiker"
}
```

**Dat's het!** WorkoutParser zorgt voor de rest.

---

## INTENSITY FORMATS

### Supported Formats:

| Format | Voorbeeld | Output | Category |
|--------|-----------|--------|----------|
| Single % | `"65% FTP"` | 0.65 | Easy |
| Range % | `"80-85% FTP"` | 0.825 (avg) | Moderate |
| High % | `"110-120% FTP"` | 1.15 (avg) | Hard |
| Plus % | `"150%+ FTP"` | 1.50 | Hard |
| Variable | `"Variable"` | 1.0 (default) | Hard |
| Category | `"easy"`, `"moderate"`, `"hard"` | Mapped | Category |

### Polarized Zones:

```
Easy:     <75% FTP  → 🟢 Green → 80% van training
Moderate: 75-90% FTP → 🟡 Yellow → Minimize (gray zone)
Hard:     >90% FTP  → 🔴 Red → 20% van training
```

**Belangrijk:** Kies intensity die past bij polarized principe!

---

## DETAILS STRING PATTERNS

WorkoutParser herkent deze patronen in `details`:

### 1. Warmup/Cooldown

```javascript
details: "Warm-up: 10 min. ..."  // Parseert als 10 min warmup
details: "... Cool-down: 5 min." // Parseert als 5 min cooldown
```

**Fallback:** Als niet gespecificeerd:
- Easy workout: 5 min warmup, 5 min cooldown
- Moderate: 10 min warmup, 10 min cooldown
- Hard: 10 min warmup, 10 min cooldown

### 2. Interval Pattern

**Format:** `NxM time @ intensity, recovery time`

**Voorbeelden:**
```javascript
"3x8 min @ 80-85% FTP, 4 min recovery"
"5x3 min @ 110-120% FTP, 3 min easy"
"8x30 seconds all-out, 3 min recovery"
"4x4 min @ FTP, 2 min rest"
```

**Herkend:**
- `NxM` = N repetities van M tijd
- Tijd: `min`, `minutes`, `sec`, `seconds`, `s`
- Recovery: `recovery`, `easy`, `rest`
- Intensity override: `@ XX% FTP` (optioneel)

### 3. Pyramid Pattern

**Format:** Durations separated by dashes

**Voorbeeld:**
```javascript
"5-10-15-10-5 min @ 88-92% FTP, 3 min easy"
```

Parseert als:
- 5 min work + 3 min recovery
- 10 min work + 3 min recovery
- 15 min work + 3 min recovery
- 10 min work + 3 min recovery
- 5 min work (no recovery after last)

### 4. Steady State

**Format:** Alles zonder interval/pyramid pattern

**Voorbeelden:**
```javascript
"Main: 45 min steady Zone 1"
"Just spin easy for 60 min"
"Increase resistance for climbing simulation"
```

Parseert als:
- Warmup (default of parsed)
- Main work (calculated: duration - warmup - cooldown)
- Cooldown (default of parsed)

---

## COMPLETE VOORBEELDEN

### Voorbeeld 1: Easy Steady State

```javascript
{
    name: "Zone 1 Easy Ride",
    description: "Building aerobic base",
    intensity: "65% FTP",
    duration: 60,
    details: "Warm-up: 10 min. Main: 45 min steady Zone 1. Cool-down: 5 min.",
    tips: "Keep it conversational. You should be able to talk easily."
}
```

**Wat gebeurt:**
- Warmup: 10 min @ 0.55
- Main: 45 min @ 0.65
- Cooldown: 5 min @ 0.50
- Total: 60 min ✅

**Visual:** 10-45-5 breakdown in graph
**Export:** Exact 10-45-5 in .zwo file

---

### Voorbeeld 2: Interval Workout

```javascript
{
    name: "Tempo Intervals",
    description: "Building lactate tolerance",
    intensity: "80-85% FTP",
    duration: 60,
    details: "Warm-up: 15 min. Main: 3x8 min @ 80-85% FTP, 4 min easy. Cool-down: 10 min.",
    tips: "Comfortably hard. Should feel sustainable for 8 minutes."
}
```

**Wat gebeurt:**
- Warmup: 15 min
- Intervals: (8 min @ 0.825 + 4 min @ 0.55) × 3 = 36 min
- Filler: 60 - 15 - 36 - 10 = -1 min → no filler needed
- Cooldown: 10 min
- Total: 61 min (close enough, no filler)

**Visual:** Shows 3 work bars + 3 recovery bars
**Export:** `<IntervalsT Repeat="3" OnDuration="480" OffDuration="240" .../>`

---

### Voorbeeld 3: VO2max with Duration Mismatch

```javascript
{
    name: "VO2 Max Destroyer",
    description: "Maximum aerobic capacity",
    intensity: "110-120% FTP",
    duration: 60,
    details: "Warm-up: 15 min. Main: 5x3 min @ 110-120% FTP, 3 min recovery. Cool-down: 10 min.",
    tips: "All-out effort! 3 minutes of pain."
}
```

**Wat gebeurt:**
- Warmup: 15 min
- Intervals: (3 + 3) × 5 = 30 min
- Cooldown: 10 min
- Subtotal: 55 min
- Duration field: 60 min
- **Mismatch:** 5 min verschil
- **Solution:** WorkoutParser voegt 5 min filler toe (easy spinning)

**Console Warning:** "Duration mismatch: 60 min specified, 55 min calculated"

**Fix:** Update duration naar 55, of add filler in details

---

### Voorbeeld 4: Sprint Workout

```javascript
{
    name: "Sprint Power Repeats",
    description: "Neuromuscular power development",
    intensity: "150%+ FTP",
    duration: 50,
    details: "Warm-up: 15 min. Main: 8x30 seconds all-out, 3 min recovery. Cool-down: 10 min.",
    tips: "Maximum power! Go ALL OUT for 30 seconds."
}
```

**Wat gebeurt:**
- Warmup: 15 min (structured for hard workout)
- Intervals: (0.5 min + 3 min) × 8 = 28 min
- Cooldown: 10 min
- Total: 53 min (mismatch!)
- Filler: Need -3 min → **ERROR**

**Fix Options:**
1. Reduce warmup: `"Warm-up: 12 min"`
2. Reduce cooldown: `"Cool-down: 7 min"`
3. Increase duration: `duration: 53`

---

## VALIDATION

WorkoutParser valideert automatisch:

### Valid Check:
```javascript
const result = WorkoutParser.validateWorkout(workout);
// Returns: {valid: true/false, errors: [], warnings: []}
```

### Errors (Blokkeren):
- Missing name
- Missing intensity
- Invalid duration (<= 0)
- Parse errors

### Warnings (Niet blokkeren):
- Duration mismatch (>2 min verschil)
- Unusual intensity (<30% of >200% FTP)
- Missing details (gebruikt defaults)

---

## BEST PRACTICES

### ✅ DO:

1. **Match duration met details:**
   ```javascript
   duration: 60  // Moet kloppen met sum(warmup + main + cooldown)
   ```

2. **Specificeer warmup/cooldown:**
   ```javascript
   details: "Warm-up: 10 min. ... Cool-down: 10 min."
   ```

3. **Use clear interval notation:**
   ```javascript
   "3x8 min @ 80-85% FTP, 4 min recovery"  // Clear!
   ```

4. **Align met polarized zones:**
   - Easy: <75% FTP
   - Hard: >90% FTP
   - Minimize moderate!

5. **Test je workout:**
   ```javascript
   const parsed = WorkoutParser.parseWorkout(myWorkout);
   console.log(parsed);
   ```

### ❌ DON'T:

1. **Vague details:**
   ```javascript
   details: "Do some intervals"  // Parser kan dit niet parsen!
   ```

2. **Duration mismatches:**
   ```javascript
   duration: 60  // Maar warmup+main+cooldown = 45 min
   ```

3. **Missing tijd units:**
   ```javascript
   "3x8 @ 80%"  // Is dit 8 min of 8 sec?
   ```

4. **Complexe nested patterns:**
   ```javascript
   "Do 3 sets of (2x4 min + 1x8 min)"  // Te complex!
   ```

---

## VARIANTS

Workouts kunnen variants hebben voor verschillende durations:

```javascript
{
    name: "Zone 1 Base Builder",
    intensity: "65% FTP",
    variants: {
        short: {
            duration: 45,
            displayName: "Zone 1 Base Builder (Quick)",
            details: "Warm-up: 5 min. Main: 35 min steady. Cool-down: 5 min."
        },
        medium: {
            duration: 75,
            displayName: "Zone 1 Base Builder",
            details: "Warm-up: 10 min. Main: 60 min steady. Cool-down: 5 min."
        },
        long: {
            duration: 105,
            displayName: "Zone 1 Base Builder (Extended)",
            details: "Warm-up: 15 min. Main: 80 min steady. Cool-down: 10 min."
        }
    }
}
```

**Belangrijk:** Elke variant moet valid zijn (duration matches details)!

---

## TESTING WORKFLOW

### 1. Voeg Workout Toe

Edit `workouts-db.js`:
```javascript
{
    name: "Mijn Nieuwe Workout",
    intensity: "85-90% FTP",
    duration: 60,
    details: "Warm-up: 10 min. Main: 2x15 min @ 85-90% FTP, 5 min easy. Cool-down: 10 min.",
    ...
}
```

### 2. Validate in Console

```javascript
const workout = WORKOUTS_DB.moderate[0]; // Jouw workout
const result = WorkoutParser.validateWorkout(workout);
console.log('Valid:', result.valid);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
```

### 3. Test Parsing

```javascript
const parsed = WorkoutParser.parseWorkout(workout);
console.log('Parsed:', parsed);
// Check: phases, totalDuration, intensity
```

### 4. Test Visual

- Open app
- Navigate naar workout
- Check workout graph
- Duration klopt? Bars kloppen?

### 5. Test Export

- Klik "Export .ZWO"
- Open .zwo file
- Check XML structure
- Duration matches? Power zones correct?

### 6. Compare Visual vs Export

- Visual toont 10-40-10 breakdown?
- Export heeft 600-2400-600 seconds?
- ✅ Match!

---

## TROUBLESHOOTING

### Problem: "Duration mismatch" warning

**Cause:** Sum of phases != duration field

**Fix:**
```javascript
// Calculate: warmup + main + cooldown
// Example: 10 + 40 + 10 = 60
duration: 60  // Update to match
```

### Problem: Workout not parsing intervals

**Cause:** Details format not recognized

**Fix:** Use exact pattern:
```javascript
"3x8 min @ 80-85% FTP, 4 min recovery"
// Not: "3 x 8min at 80-85%"
```

### Problem: Visual shows different than export

**Cause:** WorkoutParser not loaded?

**Fix:** Check browser console:
- Should see: "✅ WorkoutParser module loaded"
- If not: check index.html script order

### Problem: Intensity not recognized

**Cause:** Format not supported

**Fix:** Use supported formats:
```javascript
"65% FTP"        // ✅
"80-85% FTP"     // ✅
"110-120% FTP"   // ✅
"65%"            // ✅ (wordt 65% FTP)
"FTP"            // ❌ (geen percentage)
```

---

## ADVANCED: Custom Patterns

Voor speciale gevallen, extend WorkoutParser:

```javascript
// In workout-parser.js, add to parseMainSet():

// Custom pattern: "Build 5-10 min"
const buildMatch = details.match(/Build\s+(\d+)-(\d+)\s*min/i);
if (buildMatch) {
    const startMin = parseInt(buildMatch[1]);
    const endMin = parseInt(buildMatch[2]);
    // Generate progressive build...
}
```

Maar dit is meestal niet nodig - standard patterns dekken 95% van use cases!

---

## SUMMARY

**Nieuwe workout toevoegen = 3 stappen:**

1. Definieer workout in `workouts-db.js`
2. Gebruik clear details format
3. Test in app + export

**WorkoutParser zorgt voor:**
- ✅ Parsing (intensity, details, phases)
- ✅ Validation (errors, warnings)
- ✅ Consistency (visual = export)
- ✅ Fallbacks (defaults if missing)

**Result:** Nieuwe workouts werken automatisch in zowel display als Zwift export!

---

## CONTACT

Vragen of issues? Check:
- WORKOUT_AUDIT.md (known issues)
- Console warnings (browser F12)
- WorkoutParser.validateWorkout() output
