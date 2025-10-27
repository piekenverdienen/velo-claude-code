// Configuratie bestand - Hier kan de eigenaar makkelijk dingen aanpassen
const APP_CONFIG = {
    // App naam en versie
    appName: "Polarized.cc",
    version: "1.0.0",
    
    // Teksten die in de app gebruikt worden
    messages: {
        welcome: "80% easy, 20% hard. Welcome to the revolution.",
        welcomeWithName: "Welcome back, {name}! Ready to break more rules?",
        noWorkout: "No workout scheduled today",
        enjoyRest: "Enjoy your rest or pick a workout from the week view!",
        workoutCompleted: "Workout completed! Great job! 🎉",
        settingsSaved: "Settings saved! Power zones updated! 💾",
        workoutSwapped: "Workout swapped! New challenge ready! 🔄",
        noAlternative: "No alternative workouts available",
        resetConfirm: "Are you sure? This will delete all your progress and you need to start over with your intake.",
        selectDays: "Select at least 3 days for effective polarized training"
    },
    
    // UI labels
    labels: {
        today: "📅 Today",
        week: "📊 Week",
        progress: "📈 Progress",
        settings: "⚙️ Settings",
        nextStep: "Next Step →",
        back: "← Back",
        generatePlan: "Generate Plan →",
        startTraining: "🚀 Start Training!",
        markComplete: "Mark Complete",
        viewDetails: "View Details",
        swapWorkout: "🔄 Swap Workout"
    },
    
    // Workout intensiteiten configuratie
    intensityConfig: {
        easy: {
            icon: "🟢",
            label: "Easy",
            badgeClass: "badge-easy",
            description: "Conversational pace - building your aerobic base"
        },
        moderate: {
            icon: "🟡",
            label: "Moderate",
            badgeClass: "badge-moderate",
            description: "Comfortably hard - building lactate tolerance"
        },
        hard: {
            icon: "🔴",
            label: "Hard",
            badgeClass: "badge-hard",
            description: "Maximum effort - where gains are made"
        },
        rest: {
            icon: "🌟",
            label: "Rest",
            badgeClass: "badge-rest",
            description: "Recovery is where gains happen"
        }
    },
    
    // Standaard waardes
    defaults: {
        ftp: 200,
        preferredDays: ['Tue', 'Thu', 'Sat'],
        userName: 'Rebel'
    },
    
    // Week configuratie
    weeks: {
        total: 6,
        descriptions: {
            1: "Base building",
            2: "Progressive overload",
            3: "Peak training",
            4: "Recovery week",
            5: "Build back",
            6: "Taper"
        }
    },
    
    // Feature flags (om features aan/uit te zetten)
    features: {
        showWattsCalculation: true,
        enableWorkoutSwap: true,
        showHealthDisclaimer: true,
        enableFatigueAdjustment: true,
        showWarmupCooldown: true
    }
    
};