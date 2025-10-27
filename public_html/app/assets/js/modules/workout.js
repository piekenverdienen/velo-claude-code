// Workout Module - Handles workout generation and display
const WorkoutModule = (function () {
    'use strict';

    // Intensity configurations
    function getIntensityConfig(intensity) {
        return APP_CONFIG.intensityConfig[intensity] || APP_CONFIG.intensityConfig.easy;
    }

    // Warmup/cooldown protocols
    const protocols = {
        hard: {
            warmup: [
                '5 min easy spin (50-60% FTP)',
                '3 min build from 60% to 80% FTP',
                '2 min at 90% FTP with 30s spin'
            ],
            cooldown: [
                '5 min easy spin (50% FTP)',
                '3 min gradual decrease to recovery',
                '2 min very light pedaling'
            ]
        },
        moderate: {
            warmup: [
                '5 min easy spin (50-60% FTP)',
                '3 min steady at 70% FTP',
                '2 min at target power'
            ],
            cooldown: [
                '5 min easy spin',
                '3 min recovery pace'
            ]
        },
        easy: {
            warmup: [
                '5 min gradual build',
                '2 min at target pace'
            ],
            cooldown: [
                '5 min gradual decrease',
                'Easy spin to finish'
            ]
        }
    };

    // Calculate watts from power zone
    function calculateWatts(powerZone, ftp) {
        if (!powerZone || !ftp) return '';

        const zones = {
            'Z1': { min: 0, max: 0.55 },
            'Z2': { min: 0.56, max: 0.75 },
            'Z3': { min: 0.76, max: 0.90 },
            'Z4': { min: 0.91, max: 1.05 },
            'Z5': { min: 1.06, max: 1.20 },
            'Z6': { min: 1.21, max: 1.50 }
        };

        const zone = zones[powerZone];
        if (!zone) return '';

        const minWatts = Math.round(ftp * zone.min);
        const maxWatts = Math.round(ftp * zone.max);

        return `${minWatts}-${maxWatts}W`;
    }

    // Get RPE target based on intensity
    function getRPETarget(intensity) {
        const targets = {
            'easy': { min: 2, max: 4, description: 'Conversational pace' },
            'moderate': { min: 5, max: 6, description: 'Comfortably hard' },
            'hard': { min: 7, max: 9, description: 'Very hard effort' },
            'rest': { min: 0, max: 0, description: 'Complete rest' }
        };
        return targets[intensity] || targets.easy;
    }

    // Get RPE feedback
    function getRPEFeedback(rpe, intensity) {
        const target = getRPETarget(intensity);
        
        if (rpe < target.min) {
            return "This felt easier than intended. Consider increasing intensity next time.";
        } else if (rpe > target.max) {
            return "This was harder than intended. Consider reducing intensity or getting more rest.";
        } else {
            return "Perfect effort level! You're training in the right zone.";
        }
    }

    return {
        // Public methods
        calculateWatts: calculateWatts,

        getIntensityBadge: function (intensity) {
            const config = getIntensityConfig(intensity);
            return `<span class="badge ${config.badgeClass}">${config.icon} ${config.label}</span>`;
        },

        getWarmupCooldownHtml: function (intensity) {
            if (!APP_CONFIG.features.showWarmupCooldown || intensity === 'rest') {
                return '';
            }

            const protocol = protocols[intensity];
            if (!protocol) return '';

            return `
                <div class="info-box" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                    <h4>🔥 Warm-up Protocol</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${protocol.warmup.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="info-box" style="background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3);">
                    <h4>❄️ Cool-down Protocol</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${protocol.cooldown.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
            `;
        },

        // UPDATED: generateWorkoutCard now uses dayIndex instead of day string
        generateWorkoutCard: function (workout, dayIndex, week, isCompleted, appState) {
            // dayIndex is ALWAYS a number 0-6
            if (!workout || workout.intensity === 'rest') {
                return `
                    <div class="workout-card">
                        <h3 class="workout-title">Rest Day 🌟</h3>
                        <p class="workout-description">${APP_CONFIG.intensityConfig.rest.description}</p>
                    </div>
                `;
            }

            // Check if we have RPE for this workout
            const workoutKey = `${week}-${dayIndex}`;
            const hasRPE = appState.rpeHistory?.find(r => r.workoutKey === workoutKey);
            const intensity = workout.intensity || 'easy';

            // If completed AND has RPE, show confirmation
            if (isCompleted && hasRPE) {
                const feedback = getRPEFeedback(hasRPE.rpe, intensity);
                const calculatedWatts = workout.powerZone && APP_CONFIG.features.showWattsCalculation
                    ? this.calculateWatts(workout.powerZone, appState.ftp)
                    : '';

                return `
                    <div class="workout-card">
                        <h3 class="workout-title">${workout.name} ✅</h3>
                        
                        <div class="info-box" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                            <h4>✅ Workout Complete!</h4>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0;">
                                <div>
                                    <strong>Your RPE:</strong> ${hasRPE.rpe}/10
                                </div>
                                <div style="font-size: 2em;">
                                    ${hasRPE.rpe <= 2 ? '😴' :
                                      hasRPE.rpe <= 4 ? '😊' :
                                      hasRPE.rpe <= 6 ? '😐' :
                                      hasRPE.rpe <= 8 ? '😤' : '💀'}
                                </div>
                            </div>
                            <p style="margin: 8px 0; font-style: italic; color: var(--accent-light);">${feedback}</p>
                            ${hasRPE.notes ? `<p style="margin-top: 12px;"><strong>Your notes:</strong> ${hasRPE.notes}</p>` : ''}
                            <p style="margin-top: 12px; font-size: 0.85rem; opacity: 0.8;">
                                Recorded: ${new Date(hasRPE.date).toLocaleDateString()} at ${new Date(hasRPE.date).toLocaleTimeString()}
                            </p>
                        </div>
                        
                        <div class="workout-badges">
                            ${this.getIntensityBadge(intensity)}
                            ${workout.duration > 0 ? `
                            <span class="badge" style="background: rgba(99, 102, 241, 0.9);">
                                ⏱️ ${workout.duration} min
                            </span>` : ''}
                            ${calculatedWatts ? `
                            <span class="badge" style="background: rgba(147, 51, 234, 0.9);">
                                ⚡ ${workout.powerZone} (${calculatedWatts})
                            </span>` : ''}
                            <span class="badge" style="background: #10b981;">RPE: ${hasRPE.rpe}</span>
                        </div>
                        
                        <p class="workout-description">${workout.description}</p>
                        
                        <div class="workout-actions">
                            <button class="btn btn-secondary" onclick="App.resetRPE('${dayIndex}', ${week})">Change RPE</button>
                            ${APP_CONFIG.features.enableWorkoutSwap ?
                                `<button class="btn btn-secondary" onclick="App.swapWorkout('${dayIndex}', ${week})">
                                    ${APP_CONFIG.labels.swapWorkout}
                                </button>` : ''
                            }
                            <button class="btn btn-secondary" onclick="App.downloadZwiftWorkout('${dayIndex}', ${week})">
                                🔥 Export .ZWO
                            </button>
                        </div>
                    </div>
                `;
            }

            // If completed but NO RPE yet, ask for it
            if (isCompleted && !hasRPE) {
                const rpeTarget = getRPETarget(intensity);
                const calculatedWatts = workout.powerZone && APP_CONFIG.features.showWattsCalculation
                    ? this.calculateWatts(workout.powerZone, appState.ftp)
                    : '';

                return `
                    <div class="workout-card">
                        <h3 class="workout-title">${workout.name} ✅</h3>
                        
                        <div class="workout-badges">
                            ${this.getIntensityBadge(intensity)}
                            ${workout.duration > 0 ? `
                            <span class="badge" style="background: rgba(99, 102, 241, 0.9);">
                                ⏱️ ${workout.duration} min
                            </span>` : ''}
                            ${calculatedWatts ? `
                            <span class="badge" style="background: rgba(147, 51, 234, 0.9);">
                                ⚡ ${workout.powerZone} (${calculatedWatts})
                            </span>` : ''}
                        </div>
                        
                        <div class="rpe-section" style="background: rgba(168, 85, 247, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin-top: 0;">How hard was this workout?</h4>
                            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 16px;">
                                Target RPE: ${rpeTarget.min}-${rpeTarget.max} (${rpeTarget.description})
                            </p>
                            
                            <div class="rpe-buttons" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px;">
                                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                                    let emoji = n <= 2 ? '😴' : n <= 4 ? '😊' : n <= 6 ? '😐' : n <= 8 ? '😤' : '💀';
                                    let color = n <= 4 ? '#10b981' : n <= 6 ? '#f59e0b' : n <= 8 ? '#f97316' : '#ef4444';
                                    return `
                                        <button onclick="submitRPE(${dayIndex}, ${week}, ${n})" 
                                                class="btn" 
                                                style="background: ${color}; color: white; padding: 12px; font-size: 1.1rem; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.2s;"
                                                onmouseover="this.style.transform='scale(1.1)'" 
                                                onmouseout="this.style.transform='scale(1)'">
                                            ${n}<br><span style="font-size: 1.5rem;">${emoji}</span>
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                            
                            <textarea id="rpeNotes" 
                                      placeholder="Optional: How did you feel? Any notes about the workout..." 
                                      style="width: 100%; min-height: 80px; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); resize: vertical;">
                            </textarea>
                        </div>

                        <div class="workout-actions">
                            ${APP_CONFIG.features.enableWorkoutSwap ?
                                `<button class="btn btn-secondary" onclick="App.swapWorkout('${dayIndex}', ${week})">
                                    ${APP_CONFIG.labels.swapWorkout}
                                </button>` : ''
                            }
                            <button class="btn btn-secondary" onclick="App.downloadZwiftWorkout('${dayIndex}', ${week})">
                                🔥 Export .ZWO
                            </button>
                        </div>
                    </div>
                `;
            }

            // Normal workout card (not completed)
            const calculatedWatts = workout.powerZone && APP_CONFIG.features.showWattsCalculation
                ? this.calculateWatts(workout.powerZone, appState.ftp)
                : '';

            return `
                <div class="workout-card">
                    <h3 class="workout-title">${workout.name}</h3>
                    <div class="workout-badges">
                        ${this.getIntensityBadge(intensity)}
                        ${workout.duration > 0 ? `
                        <span class="badge" style="background: rgba(99, 102, 241, 0.9);">
                            ⏱️ ${workout.duration} min
                        </span>` : ''}
                        ${calculatedWatts ? `
                        <span class="badge" style="background: rgba(147, 51, 234, 0.9);">
                            ⚡ ${workout.powerZone}
                            <span class="power-zone-watts">(${calculatedWatts})</span>
                        </span>` : ''}
                    </div>
                    <p class="workout-description">${workout.description || 'Get ready for a great workout!'}</p>
                    
                    ${workout.details ? `
                    <div class="info-box">
                        <h4>📋 Workout Details</h4>
                        <p>${workout.details}</p>
                    </div>` : ''}
                    
                    ${UIModule.renderWorkoutGraph ? UIModule.renderWorkoutGraph(workout) : ''}
                    
                    ${this.getWarmupCooldownHtml(intensity)}
                    
                    ${workout.tips ? `
                    <div class="info-box">
                        <h4>💡 Pro Tips</h4>
                        <p>${workout.tips}</p>
                    </div>` : ''}
                    
                    <div class="workout-actions">
                        <button class="btn btn-primary" onclick="App.completeWorkout('${dayIndex}', ${week})">
                            ${APP_CONFIG.labels.markComplete}
                        </button>
                        ${APP_CONFIG.features.enableWorkoutSwap && intensity !== 'rest' ?
                            `<button class="btn btn-secondary" onclick="App.swapWorkout('${dayIndex}', ${week})">
                                ${APP_CONFIG.labels.swapWorkout}
                            </button>` : ''
                        }
                        ${workout.intensity !== 'rest' ?
                            `<button class="btn btn-secondary" onclick="App.downloadZwiftWorkout('${dayIndex}', ${week})">
                                🔥 Export .ZWO
                            </button>` : ''
                        }
                    </div>
                </div>
            `;
        },

        findAlternativeWorkout: function (currentWorkout, goal) {
            const workoutList = WORKOUTS_DB[goal]?.[currentWorkout.intensity];
            if (!workoutList) return null;

            const alternatives = workoutList.filter(w => w.name !== currentWorkout.name);
            if (alternatives.length === 0) return null;

            return alternatives[Math.floor(Math.random() * alternatives.length)];
        }
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.WorkoutModule = WorkoutModule;
}

console.log('✅ WorkoutModule loaded successfully');