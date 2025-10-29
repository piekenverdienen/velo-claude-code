// Schedule Module - Genereert trainingsschema's met adaptive variant selection
const ScheduleModule = (function () {
    'use strict';

    // Week configuratie per commitment level (aantal workouts per week)
    const weeklyWorkouts = {
        starter: [3, 3, 4, 3, 3, 3],
        regular: [4, 4, 5, 4, 4, 4],
        serious: [5, 5, 6, 5, 5, 4]
    };

    // Intensiteit verdeling per week (80/20 principe)
    const intensityPlans = {
        starter: [
            { easy: 2, moderate: 1, hard: 0 },
            { easy: 2, moderate: 0, hard: 1 },
            { easy: 3, moderate: 0, hard: 1 },
            { easy: 3, moderate: 0, hard: 0 },  // Recovery week
            { easy: 2, moderate: 0, hard: 1 },
            { easy: 2, moderate: 1, hard: 0 }
        ],
        regular: [
            { easy: 3, moderate: 1, hard: 0 },
            { easy: 3, moderate: 0, hard: 1 },
            { easy: 3, moderate: 1, hard: 1 },
            { easy: 4, moderate: 0, hard: 0 },  // Recovery week
            { easy: 3, moderate: 0, hard: 1 },
            { easy: 3, moderate: 1, hard: 0 }
        ],
        serious: [
            { easy: 4, moderate: 1, hard: 0 },
            { easy: 4, moderate: 0, hard: 1 },
            { easy: 4, moderate: 1, hard: 1 },
            { easy: 5, moderate: 0, hard: 0 },  // Recovery week
            { easy: 3, moderate: 1, hard: 1 },
            { easy: 3, moderate: 1, hard: 0 }
        ]
    };

    // Target duration per commitment level (gebruikt als guide voor variant selectie)
    const targetDurations = {
        starter: {
            easy: 60,      // Medium variant voor easy
            moderate: 55,  // Short-medium voor moderate
            hard: 50       // Short variant voor hard
        },
        regular: {
            easy: 90,      // Medium-long voor easy
            moderate: 70,  // Medium variant voor moderate
            hard: 60       // Medium variant voor hard
        },
        serious: {
            easy: 120,     // Long variant voor easy
            moderate: 80,  // Medium-long voor moderate
            hard: 65       // Medium variant voor hard
        }
    };

    /**
     * Select best workout variant based on target duration and week
     * Adjusts target for peak week (3) and recovery week (4)
     * @param {Object} workout - Workout object with variants
     * @param {number} targetDuration - Target duration in minutes
     * @param {number} week - Week number (1-6)
     * @returns {Object|null} Best matching variant or null if no variants
     */
    function selectBestVariant(workout, targetDuration, week) {
        if (!workout.variants) {
            console.error('Workout heeft geen variants:', workout);
            return null;
        }

        // Week 3 = peak (langere variants), Week 4 = recovery (kortere variants)
        let adjustedTarget = targetDuration;
        if (week === 3) {
            adjustedTarget = targetDuration * 1.1;  // 10% langer
        } else if (week === 4) {
            adjustedTarget = targetDuration * 0.7;  // 30% korter (recovery)
        }

        // Vind variant die het dichtst bij target zit
        const variants = workout.variants;
        let bestVariant = null;
        let smallestDiff = Infinity;

        for (const [variantType, variantData] of Object.entries(variants)) {
            const diff = Math.abs(variantData.duration - adjustedTarget);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                bestVariant = { type: variantType, ...variantData };
            }
        }

        return bestVariant;
    }

    /**
     * Calculate day score for smart workout placement
     * Considers user preferences, rest days, and workout intensity
     * @param {string} day - Day name ('Mon'-'Sun')
     * @param {Array<string>} scheduledDays - Days already scheduled
     * @param {Array<string>} preferredDays - User's preferred workout days
     * @param {string} nextWorkoutIntensity - Intensity of next workout ('easy', 'moderate', 'hard')
     * @returns {number} Score for day suitability (higher = better)
     */
    function calculateDayScore(day, scheduledDays, preferredDays, nextWorkoutIntensity) {
        const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayIndex = allDays.indexOf(day);
        let score = 0;

        // Voorkeursdagen krijgen bonus
        if (preferredDays.includes(day)) score += 10;

        // Weekend bonus voor lange workouts (easy)
        if ((day === 'Sat' || day === 'Sun') && nextWorkoutIntensity === 'easy') {
            score += 5;
        }

        // Check voor opeenvolgende dagen
        let consecutive = 1;
        for (let j = dayIndex - 1; j >= 0 && j >= dayIndex - 3; j--) {
            if (scheduledDays.includes(allDays[j])) {
                consecutive++;
            } else {
                break;
            }
        }

        // Te veel opeenvolgende dagen = penalty
        if (consecutive >= 4) score -= 20;

        // Hard/moderate workouts niet naast elkaar (recovery tussen hard efforts)
        if (nextWorkoutIntensity === 'hard' || nextWorkoutIntensity === 'moderate') {
            // Check dag ervoor en erna
            const prevDay = allDays[dayIndex - 1];
            const nextDay = allDays[dayIndex + 1];

            if (scheduledDays.includes(prevDay) || scheduledDays.includes(nextDay)) {
                score -= 15;
            }
        }

        return score;
    }

    // Helper: Selecteer random workout uit lijst
    function selectRandomWorkout(workoutList) {
        if (!workoutList || workoutList.length === 0) return null;
        return workoutList[Math.floor(Math.random() * workoutList.length)];
    }

    // Helper: Bouw resolved workout object
    function buildResolvedWorkout(baseWorkout, variant, intensity) {
        return {
            // Base workout info
            name: variant.displayName || baseWorkout.name,
            baseName: baseWorkout.name,  // Bewaar originele naam
            intensity: intensity,
            description: baseWorkout.description,
            tips: baseWorkout.tips,
            powerZone: baseWorkout.intensity,  // FTP percentage

            // Variant specifics
            duration: variant.duration,
            details: variant.details,
            variantType: variant.type,  // 'short', 'medium', 'long'

            // Metadata voor UI
            adapted: false,  // Wordt true als weekly-adapter dit aanpast
            originalDuration: variant.duration
        };
    }

    return {
        /**
         * Generate complete 6-week training schedule
         * Uses smart day scoring, variant selection, and 80/20 polarized training principle
         * @param {string} goal - Training goal ('endurance', 'power', 'climbing', 'century')
         * @param {string} timeCommitment - Time commitment level ('starter', 'regular', 'serious')
         * @param {Array<string>} preferredDays - User's preferred workout days
         * @returns {Object} 6-week schedule object keyed by week number and day name
         */
        generateSchedule: function (goal, timeCommitment, preferredDays) {
            const schedule = {};
            const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            // Validatie
            if (!WORKOUTS_DB[goal]) {
                console.error('Invalid goal:', goal);
                return schedule;
            }

            console.log(`🏗️ Generating schedule for ${goal} / ${timeCommitment}`);

            // Loop door alle 6 weken
            for (let week = 1; week <= APP_CONFIG.weeks.total; week++) {
                schedule[week] = {};

                // Initialize alle dagen als null
                allDays.forEach(day => {
                    schedule[week][day] = null;
                });

                // Bepaal aantal workouts en intensiteiten voor deze week
                const workoutCount = weeklyWorkouts[timeCommitment][week - 1];
                const intensityPlan = intensityPlans[timeCommitment][week - 1];

                console.log(`📅 Week ${week}: ${workoutCount} workouts (${intensityPlan.easy} easy, ${intensityPlan.moderate} moderate, ${intensityPlan.hard} hard)`);

                // Maak workout pool met resolved variants
                let workoutPool = [];

                // Voeg HARD workouts toe
                for (let i = 0; i < intensityPlan.hard; i++) {
                    const baseWorkout = selectRandomWorkout(WORKOUTS_DB[goal].hard);
                    if (baseWorkout) {
                        const targetDuration = targetDurations[timeCommitment].hard;
                        const variant = selectBestVariant(baseWorkout, targetDuration, week);

                        if (variant) {
                            const resolvedWorkout = buildResolvedWorkout(baseWorkout, variant, 'hard');
                            workoutPool.push(resolvedWorkout);
                            console.log(`  ➕ Hard: ${resolvedWorkout.name} (${resolvedWorkout.duration} min)`);
                        }
                    }
                }

                // Voeg MODERATE workouts toe
                for (let i = 0; i < intensityPlan.moderate; i++) {
                    const baseWorkout = selectRandomWorkout(WORKOUTS_DB[goal].moderate);
                    if (baseWorkout) {
                        const targetDuration = targetDurations[timeCommitment].moderate;
                        const variant = selectBestVariant(baseWorkout, targetDuration, week);

                        if (variant) {
                            const resolvedWorkout = buildResolvedWorkout(baseWorkout, variant, 'moderate');
                            workoutPool.push(resolvedWorkout);
                            console.log(`  ➕ Moderate: ${resolvedWorkout.name} (${resolvedWorkout.duration} min)`);
                        }
                    }
                }

                // Voeg EASY workouts toe
                for (let i = 0; i < intensityPlan.easy; i++) {
                    const baseWorkout = selectRandomWorkout(WORKOUTS_DB[goal].easy);
                    if (baseWorkout) {
                        const targetDuration = targetDurations[timeCommitment].easy;
                        const variant = selectBestVariant(baseWorkout, targetDuration, week);

                        if (variant) {
                            const resolvedWorkout = buildResolvedWorkout(baseWorkout, variant, 'easy');
                            workoutPool.push(resolvedWorkout);
                            console.log(`  ➕ Easy: ${resolvedWorkout.name} (${resolvedWorkout.duration} min)`);
                        }
                    }
                }

                // Shuffle workout pool voor variatie
                workoutPool = workoutPool.sort(() => Math.random() - 0.5);

                // Plan workouts op dagen (smart scheduling)
                const scheduledDays = [];
                const sortedDays = [...allDays].sort((a, b) => {
                    const aPreferred = preferredDays.includes(a) ? 0 : 1;
                    const bPreferred = preferredDays.includes(b) ? 0 : 1;
                    return aPreferred - bPreferred;
                });

                // Assign workouts to days
                for (let i = 0; i < workoutCount && i < workoutPool.length; i++) {
                    let bestDay = null;
                    let bestScore = -Infinity;

                    // Vind beste dag voor deze workout
                    for (const day of sortedDays) {
                        if (scheduledDays.includes(day)) continue;

                        const score = calculateDayScore(
                            day,
                            scheduledDays,
                            preferredDays,
                            workoutPool[i].intensity
                        );

                        if (score > bestScore) {
                            bestScore = score;
                            bestDay = day;
                        }
                    }

                    // Assign workout to best day
                    if (bestDay && workoutPool[i]) {
                        schedule[week][bestDay] = workoutPool[i];
                        scheduledDays.push(bestDay);
                        console.log(`  📍 ${bestDay}: ${workoutPool[i].name}`);
                    }
                }
            }

            console.log('✅ Schedule generation complete');
            return schedule;
        },

        // Pas week volume aan (gebruikt door UI)
        adjustWeekVolume: function (schedule, week, level) {
            const weekSchedule = schedule[week];
            if (!weekSchedule) return;

            const days = Object.keys(weekSchedule);

            if (level === 'minimal') {
                // Houd alleen belangrijkste workouts (max 3)
                let keptWorkouts = 0;
                const maxWorkouts = 3;

                // Prioriteit: hard > moderate > easy
                ['hard', 'moderate', 'easy'].forEach(intensity => {
                    days.forEach(day => {
                        const workout = weekSchedule[day];
                        if (workout && workout.intensity === intensity && keptWorkouts < maxWorkouts) {
                            keptWorkouts++;
                        } else if (workout && workout.intensity === intensity) {
                            weekSchedule[day] = null;
                        }
                    });
                });

            } else if (level === 'reduced') {
                // Verminder alle workouts met 30% door kortere variant te selecteren
                days.forEach(day => {
                    const workout = weekSchedule[day];
                    if (workout && workout.duration) {
                        // Simpele reducting: verminder duration met 30%
                        workout.duration = Math.round(workout.duration * 0.7);
                        workout.description = workout.description + ' (⏱️ -30%)';
                        workout.reducedVolume = true;
                        workout.adapted = true;
                    }
                });
            }

            return weekSchedule;
        },

        // Helper functie: Selecteer variant op basis van beschikbare tijd
        // Deze wordt gebruikt door weekly-adapter
        selectVariantByTime: function (baseWorkout, availableMinutes) {
            if (!baseWorkout.variants) {
                console.error('Workout heeft geen variants');
                return null;
            }

            const variants = baseWorkout.variants;

            // Selecteer variant die past bij beschikbare tijd
            if (availableMinutes < 60) {
                return { type: 'short', ...variants.short };
            } else if (availableMinutes < 100) {
                return { type: 'medium', ...variants.medium };
            } else {
                return { type: 'long', ...variants.long };
            }
        }
    };
})();