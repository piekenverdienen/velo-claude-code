// ========================================
// VOORBEELDEN VAN NIEUWE WORKOUTS
// ========================================
// Kopieer deze workouts naar workouts-db.js onder de juiste intensiteit

// ========================================
// 1. UNDER/OVERS (Moderate - Hard)
// ========================================
{
    name: "Under/Overs",
    description: "Intervals alternating just below and above FTP. Teaches pacing control.",
    intensity: "90-105% FTP",
    tips: "Focus on smooth transitions. Don't surge into the 'overs'. This builds lactate tolerance.",
    variants: {
        short: {
            duration: 50,
            displayName: "Under/Overs (Quick)",
            details: "Warm-up: 12 min. Main: 3x(2 min @ 90% FTP + 1 min @ 105% FTP), 3 min recovery. Cool-down: 10 min."
        },
        medium: {
            duration: 65,
            displayName: "Under/Overs",
            details: "Warm-up: 15 min. Main: 4x(2 min @ 90% FTP + 1 min @ 105% FTP), 3 min recovery. Cool-down: 10 min."
        },
        long: {
            duration: 80,
            displayName: "Under/Overs (Extended)",
            details: "Warm-up: 15 min. Main: 6x(2 min @ 90% FTP + 1 min @ 105% FTP), 3 min recovery. Cool-down: 10 min."
        }
    }
},

// ========================================
// 2. ZONE 2 COFFEE RIDE (Easy)
// ========================================
{
    name: "Zone 2 Coffee Ride",
    description: "Classic endurance ride. Conversational pace. Build your aerobic engine.",
    intensity: "65-75% FTP",
    tips: "You should be able to hold a conversation the entire time. If you can't talk, slow down.",
    variants: {
        short: {
            duration: 60,
            displayName: "Zone 2 Coffee Ride (Quick)",
            details: "Warm-up: 10 min easy. Main: 45 min steady Zone 2 @ 65-75% FTP. Cool-down: 5 min."
        },
        medium: {
            duration: 90,
            displayName: "Zone 2 Coffee Ride",
            details: "Warm-up: 15 min easy. Main: 70 min steady Zone 2 @ 65-75% FTP. Cool-down: 5 min."
        },
        long: {
            duration: 150,
            displayName: "Zone 2 Coffee Ride (Extended)",
            details: "Warm-up: 15 min easy. Main: 130 min steady Zone 2 @ 65-75% FTP. Simulate a real coffee ride. Cool-down: 5 min."
        }
    }
},

// ========================================
// 3. STEIGERUNGS (Hard)
// ========================================
{
    name: "Steigerungs",
    description: "Progressive efforts building to maximum. German training method for explosive power.",
    intensity: "70-110% FTP",
    tips: "Each interval starts easy and finishes hard. Final 30 seconds should be near-maximal.",
    variants: {
        short: {
            duration: 45,
            displayName: "Steigerungs (Quick)",
            details: "Warm-up: 15 min with 2x1 min builds. Main: 4x3 min (start @ 70% FTP, finish @ 110% FTP), 3 min recovery. Cool-down: 10 min."
        },
        medium: {
            duration: 60,
            displayName: "Steigerungs",
            details: "Warm-up: 15 min with 3x1 min builds. Main: 6x3 min (start @ 70% FTP, finish @ 110% FTP), 3 min recovery. Cool-down: 10 min."
        },
        long: {
            duration: 75,
            displayName: "Steigerungs (Extended)",
            details: "Warm-up: 15 min with 3x1 min builds. Main: 8x3 min (start @ 70% FTP, finish @ 110% FTP), 3 min recovery. Cool-down: 10 min."
        }
    }
},

// ========================================
// 4. INTENSIEVE DUURINTERVALLEN (Hard)
// ========================================
{
    name: "Intensieve Duurintervallen",
    description: "Long threshold intervals. Maximum aerobic power development.",
    intensity: "90-95% FTP",
    tips: "These are brutally effective. Hold steady power. Don't start too hard.",
    variants: {
        short: {
            duration: 60,
            displayName: "Intensieve Duurintervallen (Quick)",
            details: "Warm-up: 15 min with 2x2 min builds. Main: 2x12 min @ 90-95% FTP, 5 min recovery. Cool-down: 10 min."
        },
        medium: {
            duration: 80,
            displayName: "Intensieve Duurintervallen",
            details: "Warm-up: 15 min with 3x2 min builds. Main: 3x12 min @ 90-95% FTP, 5 min recovery. Cool-down: 10 min."
        },
        long: {
            duration: 100,
            displayName: "Intensieve Duurintervallen (Extended)",
            details: "Warm-up: 15 min with 3x2 min builds. Main: 4x12 min @ 90-95% FTP, 6 min recovery. Cool-down: 15 min."
        }
    }
},

// ========================================
// 5. MICRO INTERVALS (Hard) - Bonus!
// ========================================
{
    name: "Micro Intervals",
    description: "Short/short VO2max work. 30s on, 30s off. Maximum impact, minimal time.",
    intensity: "120% FTP",
    tips: "These are brutal but efficient. Every 'on' should be maximal. Use the 30s rest.",
    variants: {
        short: {
            duration: 45,
            displayName: "Micro Intervals (Quick)",
            details: "Warm-up: 15 min with builds. Main: 10x30 seconds @ 120% FTP, 30 seconds easy. Cool-down: 10 min."
        },
        medium: {
            duration: 55,
            displayName: "Micro Intervals",
            details: "Warm-up: 15 min with builds. Main: 15x30 seconds @ 120% FTP, 30 seconds easy. Cool-down: 10 min."
        },
        long: {
            duration: 65,
            displayName: "Micro Intervals (Extended)",
            details: "Warm-up: 15 min with builds. Main: 20x30 seconds @ 120% FTP, 30 seconds easy. Cool-down: 10 min."
        }
    }
},

// ========================================
// 6. OVER/UNDERS (Alternative naam) (Moderate)
// ========================================
{
    name: "Over/Unders",
    description: "Classic lactate tolerance builder. Surge above FTP, recover below.",
    intensity: "88-105% FTP",
    tips: "The 'unders' are NOT rest. Keep pressure on. Builds mental toughness.",
    variants: {
        short: {
            duration: 55,
            displayName: "Over/Unders (Quick)",
            details: "Warm-up: 12 min. Main: 2x(3 min @ 88% FTP + 2 min @ 105% FTP + 3 min @ 88% FTP), 4 min recovery. Cool-down: 10 min."
        },
        medium: {
            duration: 70,
            displayName: "Over/Unders",
            details: "Warm-up: 15 min. Main: 3x(3 min @ 88% FTP + 2 min @ 105% FTP + 3 min @ 88% FTP), 4 min recovery. Cool-down: 10 min."
        },
        long: {
            duration: 90,
            displayName: "Over/Unders (Extended)",
            details: "Warm-up: 15 min. Main: 4x(3 min @ 88% FTP + 2 min @ 105% FTP + 3 min @ 88% FTP), 4 min recovery. Cool-down: 15 min."
        }
    }
}

// ========================================
// HOE TE GEBRUIKEN:
// ========================================
// 1. Kopieer het workout object dat je wilt
// 2. Plak het in workouts-db.js onder de juiste categorie:
//    - Easy workouts → WORKOUTS_DB.ftp.easy array
//    - Moderate workouts → WORKOUTS_DB.ftp.moderate array
//    - Hard workouts → WORKOUTS_DB.ftp.hard array
// 3. Zet een komma na het vorige workout object
// 4. Sla het bestand op
// 5. Refresh de browser - de nieuwe workouts verschijnen automatisch!
