// RPE Adaptation Module - Rate of Perceived Exertion tracking
const RPEAdaptationModule = (function () {
    'use strict';

    return {
        // Initialize RPE system
        init: function (appState) {
            if (!appState.rpeHistory) {
                appState.rpeHistory = {};
            }
            if (!appState.adaptations) {
                appState.adaptations = {};
            }
            return appState;
        },

        // Save workout RPE
        saveWorkoutRPE: function (day, week, rpe, appState) {
            const key = `${week}-${day}`;

            // Initialize if needed
            if (!appState.rpeHistory) {
                appState.rpeHistory = {};
            }

            // Store RPE data
            appState.rpeHistory[key] = {
                rpe: parseInt(rpe),
                date: new Date().toISOString(),
                workout: appState.schedule[week][day]
            };

            // Calculate if adaptation needed
            const adaptation = this.calculateAdaptation(rpe, appState.schedule[week][day]);

            if (adaptation) {
                if (!appState.adaptations) {
                    appState.adaptations = {};
                }
                appState.adaptations[key] = adaptation;
            }

            return appState;
        },

        // Calculate adaptation based on RPE
        calculateAdaptation: function (rpe, workout) {
            rpe = parseInt(rpe);

            if (!workout || !workout.intensity) return null;

            // Adaptation logic per intensity type
            const targetRPE = {
                'easy': { min: 3, max: 5 },      // Easy should feel 3-5
                'moderate': { min: 5, max: 7 },   // Moderate should feel 5-7
                'hard': { min: 7, max: 9 }        // Hard should feel 7-9
            };

            const target = targetRPE[workout.intensity];
            if (!target) return null;

            let adaptation = null;

            if (rpe < target.min) {
                // Too easy
                adaptation = {
                    type: 'increase',
                    percentage: Math.min(10, (target.min - rpe) * 5),
                    message: `This ${workout.intensity} workout felt too easy (RPE ${rpe}). Consider increasing intensity by ${Math.min(10, (target.min - rpe) * 5)}%`
                };
            } else if (rpe > target.max) {
                // Too hard
                adaptation = {
                    type: 'decrease',
                    percentage: Math.min(15, (rpe - target.max) * 5),
                    message: `This ${workout.intensity} workout felt too hard (RPE ${rpe}). Consider decreasing intensity by ${Math.min(15, (rpe - target.max) * 5)}%`
                };
            } else {
                // Just right
                adaptation = {
                    type: 'maintain',
                    percentage: 0,
                    message: `Perfect intensity! This ${workout.intensity} workout felt just right (RPE ${rpe}).`
                };
            }

            return adaptation;
        },

        // Get RPE history for a week
        getWeekRPE: function (week, appState) {
            const weekData = [];
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            days.forEach(day => {
                const key = `${week}-${day}`;
                if (appState.rpeHistory && appState.rpeHistory[key]) {
                    weekData.push({
                        day: day,
                        rpe: appState.rpeHistory[key].rpe,
                        date: appState.rpeHistory[key].date
                    });
                }
            });

            return weekData;
        },

        // Get average RPE
        getAverageRPE: function (appState) {
            if (!appState.rpeHistory) return 0;

            const values = Object.values(appState.rpeHistory);
            if (values.length === 0) return 0;

            const sum = values.reduce((acc, curr) => acc + curr.rpe, 0);
            return Math.round(sum / values.length * 10) / 10;
        },

        // Get adaptation suggestions
        getAdaptationSummary: function (appState) {
            if (!appState.adaptations) return null;

            const recent = Object.entries(appState.adaptations)
                .slice(-5)  // Last 5 adaptations
                .map(([key, adapt]) => ({
                    workout: key,
                    ...adapt
                }));

            return recent;
        },

        // Generate RPE input HTML
        generateRPEInput: function (day, week) {
            return `
                <div class="rpe-input-section" style="margin-top: 20px; padding: 20px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.3);">
                    <h4 style="margin-bottom: 16px; color: white;">How hard was this workout?</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="color: var(--success);">Very Easy</span>
                        <span style="color: var(--warning);">Moderate</span>
                        <span style="color: var(--danger);">Maximum</span>
                    </div>
                    <input type="range" id="rpeSlider" min="1" max="10" value="5" 
                           style="width: 100%; margin-bottom: 16px;"
                           oninput="document.getElementById('rpeValue').textContent = this.value">
                    <div style="text-align: center; margin-bottom: 16px;">
                        <span style="font-size: 2rem; font-weight: bold; color: var(--primary-light);">
                            RPE: <span id="rpeValue">5</span>/10
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; font-size: 0.85rem; color: var(--accent);">
                        <div style="text-align: center;">1-2<br>Very Light</div>
                        <div style="text-align: center;">3-4<br>Light</div>
                        <div style="text-align: center;">5-6<br>Moderate</div>
                        <div style="text-align: center;">7-8<br>Hard</div>
                        <div style="text-align: center;">9-10<br>Max Effort</div>
                    </div>
                    <button class="btn btn-primary" onclick="submitRPE('${day}', ${week})" style="width: 100%;">
                        Save RPE Feedback
                    </button>
                </div>
            `;
        }
    };
})();

// Global function voor button onclick
window.submitRPE = function (day, week) {
    const rpe = document.getElementById('rpeSlider').value;

    // Get current state
    let appState = StorageModule.loadState();

    // Save RPE
    appState = RPEAdaptationModule.saveWorkoutRPE(day, week, rpe, appState);

    // Get adaptation message
    const adaptation = appState.adaptations[`${week}-${day}`];

    // Save state
    StorageModule.saveState(appState);

    // Show feedback
    if (adaptation) {
        UIModule.showNotification(adaptation.message);
    } else {
        UIModule.showNotification(`RPE ${rpe} saved! Great work!`);
    }

    // Hide RPE input
    document.querySelector('.rpe-input-section').style.display = 'none';
};