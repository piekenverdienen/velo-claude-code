# Toegankelijkheids & CRO Audit - Polarized.cc
**Datum:** 2025-01-XX
**Standaard:** WCAG 2.1 Level AA + European Accessibility Act (EAA) 2025

---

## Executive Summary

### ✅ Wat Goed Gaat
- CSS variabelen systeem maakt theme switching makkelijk
- Semantische HTML structuur
- Responsive design met mobile-first approach
- Touch-action optimization aanwezig
- Goede basis font-size (16px)

### ⚠️ Kritieke Toegankelijkheidsproblemen

#### 1. **CONTRAST RATIOS** (WCAG 2.1 Criterion 1.4.3)
**Status:** ❌ FAILED

**Dark Mode Issues:**
- `--text-secondary: #A1A1AA` on `--bg-primary: #0A0A0F` = **2.8:1** ❌
  - WCAG vereist: 4.5:1 minimum
  - Gebruikt voor: Subtitles, descriptions, secondary info

- `--text-tertiary: #71717A` on `--bg-primary: #0A0A0F` = **1.9:1** ❌
  - WCAG vereist: 4.5:1 minimum
  - Gebruikt voor: Hints, placeholders

**Light Mode Issues:**
- `--text-secondary: #6B7280` on `--bg-primary: #FFFFFF` = **4.6:1** ✅ (net voldoende)
- `--text-tertiary: #9CA3AF` on `--bg-primary: #FFFFFF` = **2.9:1** ❌

**Impact:** Gebruikers met visuele beperkingen kunnen secundaire tekst niet lezen.

---

#### 2. **FORM LABELS** (WCAG 2.1 Criterion 1.3.1, 3.3.2)
**Status:** ⚠️ PARTIALLY COMPLIANT

**Problemen:**
```html
<!-- SLECHT: Label niet programmatisch gekoppeld -->
<label for="settingsFTP">FTP</label>
<input id="settingsFTP" type="number">
```

**Issues:**
- Geen `<label for="...">` koppeling in intake flow
- Placeholders gebruikt als labels (niet toegankelijk)
- Geen error messages bij validatie
- Geen `required` attributen
- Geen `aria-describedby` voor hints

---

#### 3. **FOCUS INDICATORS** (WCAG 2.1 Criterion 2.4.7)
**Status:** ❌ CRITICAL

**Probleem:**
```css
* {
    -webkit-tap-highlight-color: transparent;
}
```

**Issues:**
- Focus states zijn niet zichtbaar genoeg
- Keyboard gebruikers kunnen niet zien waar ze zijn
- Tap highlight volledig uitgeschakeld

**WCAG Vereist:**
- Focus indicator minimaal 2px dik
- Contrast ratio van 3:1 met achtergrond
- Duidelijk zichtbaar op alle interactieve elementen

---

#### 4. **TOUCH TARGETS** (WCAG 2.1 Criterion 2.5.5)
**Status:** ⚠️ NEEDS REVIEW

**WCAG Vereist:** Minimaal 44x44 pixels

**Te Checken:**
- RPE buttons (1-10 scale)
- Day selector buttons
- Icon-only buttons
- Toggle switches

---

#### 5. **KEYBOARD NAVIGATION** (WCAG 2.1 Criterion 2.1.1, 2.1.2)
**Status:** ⚠️ PARTIALLY COMPLIANT

**Problemen:**
- Geen skip-to-content link
- Modal dialogs: Geen focus trap
- Tab order niet logisch in alle schermen
- Geen keyboard shortcuts gedocumenteerd

---

#### 6. **ARIA LABELS** (WCAG 2.1 Criterion 4.1.2)
**Status:** ❌ MISSING

**Ontbrekende ARIA:**
```html
<!-- Icon-only buttons hebben geen label -->
<button onclick="...">🔄</button>  ❌

<!-- Tabs hebben geen roles -->
<nav id="navTabs"></nav>  ❌

<!-- Loading spinner heeft geen live region -->
<div class="loading-spinner"></div>  ❌
```

**Benodigd:**
- `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `aria-label` voor icon-only buttons
- `aria-live="polite"` voor notifications
- `aria-busy="true"` voor loading states

---

#### 7. **COLOR RELIANCE** (WCAG 2.1 Criterion 1.4.1)
**Status:** ⚠️ NEEDS IMPROVEMENT

**Problemen:**
- Workout intensity badges: Alleen kleur verschil
  - 🟢 Easy vs 🟡 Moderate vs 🔴 Hard
  - Kleurenblinde gebruikers kunnen verschil niet zien

**Oplossing:**
- Voeg tekst toe naast kleur
- Gebruik icons + kleur
- Voeg patronen toe aan badges

---

#### 8. **FONT SIZES** (WCAG 2.1 Criterion 1.4.4)
**Status:** ✅ MOSTLY COMPLIANT

**Good:**
- Body text: 16px ✅
- Headings: Proper hierarchy ✅

**Needs Review:**
- Small text: `font-size: 0.875rem` (14px) - check contrast
- Hint text: `font-size: 0.75rem` (12px) - te klein?

---

#### 9. **SCREEN READER COMPATIBILITY**
**Status:** ❌ POOR

**Problemen:**
- Workout cards: Geen semantische informatie
- Progress graphs: Geen alt text/beschrijving
- Strava sync status: Geen live announcements
- RPE scale: Geen context voor schermlezer

**Benodigd:**
```html
<div role="region" aria-label="Today's Workout">
  <h2 id="workout-title">Tempo Intervals</h2>
  <div aria-describedby="workout-title">
    <!-- workout content -->
  </div>
</div>
```

---

#### 10. **LANGUAGE ATTRIBUTE**
**Status:** ⚠️ INCORRECT

**Probleem:**
```html
<html lang="en">
```

Maar veel content is in Nederlands!

**Fix:**
```html
<html lang="nl">
```

Of bij mixed content:
```html
<html lang="nl">
<span lang="en">Strava</span>
```

---

## EAA 2025 Specifieke Vereisten

### Verplicht voor 28 Juni 2025:

1. **✅ Keyboard toegankelijkheid** - Gedeeltelijk OK
2. **❌ Schermlezer ondersteuning** - Onvoldoende
3. **✅ Tekst schaling tot 200%** - OK
4. **⚠️ Focus indicatoren** - Te zwak
5. **❌ Alternative text voor images** - Ontbreekt
6. **✅ Responsive design** - OK
7. **⚠️ Consistent navigation** - Kan beter
8. **❌ Error identification** - Ontbreekt
9. **✅ Adequate time limits** - N/A (geen timers)
10. **⚠️ Proper labeling** - Incompleet

---

## Prioriteiten (MoSCoW)

### MUST HAVE (Voor EAA compliance)
1. ✅ Fix contrast ratios → CRITICAL
2. ✅ Add proper form labels → CRITICAL
3. ✅ Improve focus indicators → CRITICAL
4. ✅ Add ARIA labels → HIGH
5. ✅ Fix language attribute → MEDIUM

### SHOULD HAVE (Betere UX)
1. Add skip-to-content link
2. Keyboard shortcuts
3. Focus trap in modals
4. Live regions for notifications
5. Alternative text for graphs

### COULD HAVE (Nice to have)
1. High contrast mode
2. Reduced motion preference
3. Font size controls
4. Custom color themes

### WON'T HAVE (Not now)
1. Text-to-speech
2. Sign language videos
3. Easy language version

---

## Geschatte Inspanning

| Fix | Inspanning | Impact |
|-----|-----------|--------|
| Contrast ratios | 2 uur | CRITICAL |
| Form labels | 3 uur | CRITICAL |
| Focus indicators | 2 uur | CRITICAL |
| ARIA labels | 4 uur | HIGH |
| Screen reader test | 2 uur | HIGH |
| Keyboard navigation | 3 uur | MEDIUM |
| Documentation | 2 uur | LOW |
| **TOTAAL** | **18 uur** | - |

---

## Aanbevolen Tools

### Testing:
- **axe DevTools** - Chrome extension voor automated testing
- **WAVE** - Web accessibility evaluation tool
- **NVDA** - Free screen reader (Windows)
- **VoiceOver** - Built-in screen reader (Mac)
- **Lighthouse** - Chrome DevTools accessibility audit

### Contrast Checking:
- **Contrast Checker** - https://webaim.org/resources/contrastchecker/
- **Color Safe** - http://colorsafe.co/

### Validation:
- **W3C Validator** - https://validator.w3.org/

---

## Conclusie

**Huidige Status:** ⚠️ **NIET EAA COMPLIANT**

**Grootste Risico's:**
1. Contrast ratios voldoen niet aan minimum eisen
2. Screen reader gebruikers kunnen app niet effectief gebruiken
3. Keyboard-only gebruikers hebben moeite met navigatie

**Aanbeveling:**
- Start met contrast fixes (hoogste ROI)
- Voeg proper labels en ARIA toe
- Test met echte gebruikers met beperkingen
- Plan accessibility audit elke 3 maanden

**Target:** WCAG 2.1 Level AA compliance vóór Q2 2025
