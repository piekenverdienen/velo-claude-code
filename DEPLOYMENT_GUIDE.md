# 📦 PRODUCTIE UPDATE CHECKLIST

## 🎯 BESTANDEN VOOR PRODUCTIE

### ✅ **ESSENTIËLE BESTANDEN** (MOET geüpdatet worden)

#### 1️⃣ **Hoofdapplicatie Bestanden**
```
public_html/app/
├── intake.html                                    ← GEWIJZIGD
└── assets/js/
    ├── app.js                                     ← GEWIJZIGD (KRITIEK!)
    ├── config/
    │   └── workouts-db.js                         ← GEWIJZIGD (KRITIEK!)
    └── modules/
        └── zwift-export.js                        ← GEWIJZIGD (KRITIEK!)
```

**Waarom kritiek:**
- `app.js`: Intake loading fix - zonder deze fix laadt de intake form niet!
- `workouts-db.js`: 42 workout variants gefixt, duplicate verwijderd
- `intake.html`: Goals gefixt (3 goals: ftp, granfondo, climbing)
- `zwift-export.js`: Parser gefixt voor pyramid patterns en Main section extraction

**⚠️ ZONDER app.js FIX:**
- Intake form laadt niet (blijft leeg/header only)
- Race condition tussen modules
- UIModule niet beschikbaar bij init

**⚠️ ZONDER zwift-export.js FIX:**
- Pyramid workouts genereren lege .zwo files
- Warmup intervals overschrijven Main intervals
- Variable Pace Training genereert alleen 25 min (ipv 65 min)

---

#### 2️⃣ **Bestaande Bestanden (Onveranderd maar nodig)**
```
public_html/app/
├── assets/
│   ├── js/
│   │   └── modules/
│   │       ├── workout.js                         ← Onveranderd
│   │       ├── schedule.js                        ← Onveranderd
│   │       └── ui.js                              ← Onveranderd
│   └── css/                                       ← Onveranderd
└── index.html                                     ← Onveranderd
```

---

### 🧪 **OPTIONELE BESTANDEN** (Test tools - NIET nodig voor productie)

#### Test Suite (Optioneel - alleen als je wilt testen)
```
public_html/app/
├── test-comprehensive.html                        ← NIEUW (optioneel)
└── test-zwift-export.html                         ← NIEUW (optioneel)

Root directory:
├── test-workouts.py                               ← NIEUW (optioneel)
├── test-workouts.js                               ← NIEUW (optioneel)
├── run-comprehensive-tests.py                     ← NIEUW (optioneel)
├── run-comprehensive-tests.js                     ← NIEUW (optioneel)
├── simulate-browser-tests.py                      ← NIEUW (optioneel)
├── FINAL_REVIEW.md                                ← NIEUW (documentatie)
└── WORKOUT_FIX_PLAN.md                            ← NIEUW (documentatie)
```

---

## 📂 MAPPEN STRUCTUUR VOOR PRODUCTIE

### **MINIMALE PRODUCTIE SETUP:**

```
public_html/
└── app/
    ├── intake.html                    ← UPDATE DIT
    ├── index.html
    ├── assets/
    │   ├── js/
    │   │   ├── app.js                 ← UPDATE DIT (KRITIEK!)
    │   │   ├── config/
    │   │   │   └── workouts-db.js     ← UPDATE DIT (KRITIEK!)
    │   │   └── modules/
    │   │       ├── zwift-export.js    ← UPDATE DIT (KRITIEK!)
    │   │       ├── workout.js
    │   │       ├── schedule.js
    │   │       └── ui.js
    │   └── css/
    │       └── (alle bestaande CSS)
    └── (andere bestaande bestanden)
```

---

## 🚀 DEPLOYMENT INSTRUCTIES

### **Stap 1: Backup huidige productie**
```bash
# Maak backup van huidige versie
cp public_html/app/intake.html public_html/app/intake.html.backup
cp public_html/app/assets/js/app.js public_html/app/assets/js/app.js.backup
cp public_html/app/assets/js/config/workouts-db.js public_html/app/assets/js/config/workouts-db.js.backup
cp public_html/app/assets/js/modules/zwift-export.js public_html/app/assets/js/modules/zwift-export.js.backup
```

### **Stap 2: Update de 4 kritieke bestanden**
```bash
# Upload deze 4 bestanden naar productie:
public_html/app/intake.html
public_html/app/assets/js/config/workouts-db.js
public_html/app/assets/js/modules/zwift-export.js  ← KRITIEK VOOR ZWIFT EXPORT!
public_html/app/assets/js/app.js                   ← KRITIEK VOOR INTAKE LOADING!
```

### **Stap 3: Verificatie (optioneel)**
Als je de test tools wilt meenemen:
```bash
# Upload ook deze test bestanden (optioneel):
public_html/app/test-comprehensive.html
public_html/app/test-zwift-export.html
```

---

## ✅ VERIFICATIE CHECKLIST

Na deployment, test dit:

### **Basis Functionaliteit:**
- [ ] Intake pagina laadt correct
- [ ] 3 goals zichtbaar (FTP, Gran Fondo, Climbing)
- [ ] Workouts laden per goal
- [ ] Alle 3 variants zichtbaar (short/medium/long)
- [ ] Workout details tonen Warm-up/Main/Cool-down
- [ ] Zwift export werkt (.zwo download)

### **Test met Browser:**
```
https://jouw-domein.nl/app/intake.html
```

### **Optionele Test Pages:**
```
https://jouw-domein.nl/app/test-comprehensive.html
https://jouw-domein.nl/app/test-zwift-export.html
```

---

## 📊 WAT IS GEWIJZIGD

### **intake.html:**
- ✅ Goals gefixt: 4 → 3 (ftp, granfondo, climbing)
- ✅ "endurance" → "granfondo" key
- ✅ "speed" goal verwijderd
- ✅ Goal selectie buttons aangepast

### **workouts-db.js:**
- ✅ 42 workout variants gefixt met correcte structuur
- ✅ Alle details hebben "Warm-up: X. Main: Y. Cool-down: Z."
- ✅ Duration validatie: warmup + main + cooldown = totaal
- ✅ Duplicate granfondo definitie verwijderd
- ✅ Gran Fondo goal volledig toegevoegd (12 workouts)

---

## 🎯 MINIMALE UPDATE (SNELSTE OPTIE)

**Als je alleen de core functionaliteit wilt:**

### Update deze 4 bestanden:
1. `public_html/app/intake.html`
2. `public_html/app/assets/js/app.js` ← **KRITIEK!**
3. `public_html/app/assets/js/config/workouts-db.js`
4. `public_html/app/assets/js/modules/zwift-export.js` ← **KRITIEK!**

**⚠️ ZONDER deze bestanden:**
- **app.js**: Intake form laadt niet (blijft leeg/header only)
- **zwift-export.js**: Zwift exports werken NIET correct!

---

## 💡 AANBEVELING

### **Voor Productie:**
✅ Update de 4 essentiële bestanden (intake.html + app.js + workouts-db.js + zwift-export.js)
⚠️ Test tools zijn optioneel (handig voor debugging)
❌ Documentatie bestanden (FINAL_REVIEW.md, etc.) niet nodig

### **Deployment grootte:**
- **Minimaal:** 4 bestanden (~140KB totaal)
  - intake.html: 41 KB
  - app.js: 51 KB
  - workouts-db.js: 34 KB
  - zwift-export.js: 14 KB
- **Met test tools:** 2 extra bestanden (~39KB)
- **Totaal:** < 180KB

---

## 🔥 SNEL COMMANDO VOOR PRODUCTIE

```bash
# Kopieer de 4 essentiële bestanden naar productie:
scp public_html/app/intake.html user@server:/pad/naar/productie/app/
scp public_html/app/assets/js/app.js user@server:/pad/naar/productie/app/assets/js/
scp public_html/app/assets/js/config/workouts-db.js user@server:/pad/naar/productie/app/assets/js/config/
scp public_html/app/assets/js/modules/zwift-export.js user@server:/pad/naar/productie/app/assets/js/modules/
```

Of via FTP/Git:
```bash
# Sync alleen de app map:
rsync -av public_html/app/ user@server:/pad/naar/productie/app/ \
  --exclude='test-*.html'
```

Of via Git (als je de branch hebt):
```bash
git pull origin claude/incomplete-description-011CUdqk1uCyqPtDHPGnbbrR
# Dan kopieer de 4 bestanden naar productie
```

---

**Klaar! Na update zijn:**
- ✅ Alle 87 workout variants correct en volledig functioneel
- ✅ Zwift export werkt voor alle workouts (pyramid patterns, Main sections, intervals)
- ✅ 3 goals (FTP, Gran Fondo, Climbing) compleet
