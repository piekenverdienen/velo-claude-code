// Weekly Adapter Module - Intelligent workout redistribution based on availability
const WeeklyAdapter = (function () {
    'use strict';

    // Time slot categories
    const TIME_SLOTS = {
        NONE: { min: 0, max: 0, label: 'No time', icon: '❌' },
        SHORT: { min: 30, max: 45, label: '30-45 min', icon: '⚡' },
        MEDIUM: { min: 45, max: 90, label: '45-90 min', icon: '🚴' },
        LONG: { min: 90, max: 120, label: '90-120 min', icon: '💪' },
        EXTRA: { min: 120, max: 999, label: '2+ hours', icon: '🚀' }
    };

    // Workout priority matrix
    const WORKOUT_PRIORITY = {
        hard: 3,      // Highest priority - maintain training stimulus
        moderate: 2,  // Medium priority - can be adjusted
        easy: 1       // Lower priority - but needed for volume
    };

    return {
        // Get time slot category from minutes
        getTimeSlotCategory: function (minutes) {
            if (minutes === 0) return 'NONE';
            if (minutes <= 45) return 'SHORT';
            if (minutes <= 90) return 'MEDIUM';
            if (minutes <= 120) return 'LONG';
            return 'EXTRA';
        },

        // Analyze weekly time availability
        analyzeWeekAvailability: function (timeSlots) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            let totalMinutes = 0;
            let availableDays = 0;
            let longSlots = 0;
            let mediumSlots = 0;
            let shortSlots = 0;

            days.forEach(day => {
                const minutes = timeSlots[day] || 0;
                totalMinutes += minutes;

                if (minutes > 0) {
                    availableDays++;
                    const category = this.getTimeSlotCategory(minutes);
                    if (category === 'LONG' || category === 'EXTRA') longSlots++;
                    else if (category === 'MEDIUM') mediumSlots++;
                    else if (category === 'SHORT') shortSlots++;
                }
            });

            return {
                totalMinutes,
                totalHours: Math.round(totalMinutes / 60 * 10) / 10,
                availableDays,
                longSlots,
                mediumSlots,
                shortSlots,
                averageMinutesPerDay: availableDays > 0 ? Math.round(totalMinutes / availableDays) : 0
            };
        },

        // Calculate required workout distribution
        calculateRequiredDistribution: function (originalSchedule, weekNum) {
            let hardWorkouts = [];
            let moderateWorkouts = [];
            let easyWorkouts = [];
            let totalPlannedMinutes = 0;

            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            days.forEach(day => {
                const workout = originalSchedule[weekNum]?.[day];
                if (workout && workout.intensity) {
                    const workoutData = {
                        day,
                        workout,
                        duration: workout.duration || 60,
                        priority: WORKOUT_PRIORITY[workout.intensity]
                    };

                    totalPlannedMinutes += workoutData.duration;

                    switch (workout.intensity) {
                        case 'hard':
                            hardWorkouts.push(workoutData);
                            break;
                        case 'moderate':
                            moderateWorkouts.push(workoutData);
                            break;
                        case 'easy':
                            easyWorkouts.push(workoutData);
                            break;
                    }
                }
            });

            return {
                hardWorkouts,
                moderateWorkouts,
                easyWorkouts,
                totalWorkouts: hardWorkouts.length + moderateWorkouts.length + easyWorkouts.length,
                totalPlannedMinutes,
                distribution: {
                    hard: hardWorkouts.length,
                    moderate: moderateWorkouts.length,
                    easy: easyWorkouts.length
                }
            };
        },

        // Adapt schedule based on availability
        adaptSchedule: function (originalSchedule, weekNum, timeSlots, preferences = {}) {
            const analysis = this.analyzeWeekAvailability(timeSlots);
            const required = this.calculateRequiredDistribution(originalSchedule, weekNum);

            console.log(`🔄 Adapting week ${weekNum} based on time availability`);
            console.log(`Available: ${analysis.totalHours}h across ${analysis.availableDays} days`);

            // Initialize adapted schedule
            const adaptedSchedule = {};
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            // Reset all days
            days.forEach(day => {
                adaptedSchedule[day] = null;
            });

            // Strategy: Fit high-priority workouts first

            // Assign HARD workouts to medium slots (45-90 min ideal for intervals)
            required.hardWorkouts.forEach(item => {
                let bestDay = this.findBestDayForWorkout(
                    item.workout,
                    timeSlots,
                    adaptedSchedule,
                    'hard',
                    preferences.preferredDays
                );

                if (bestDay) {
                    const adaptedWorkout = this.adjustWorkoutToTime(
                        item.workout,
                        timeSlots[bestDay]
                    );
                    adaptedSchedule[bestDay] = adaptedWorkout;
                    console.log(`  ✅ Hard: ${adaptedWorkout.name} → ${bestDay} (${adaptedWorkout.duration}min)`);
                } else {
                    console.log(`  ⚠️ Could not fit hard workout: ${item.workout.name}`);
                }
            });

            // Assign MODERATE workouts
            required.moderateWorkouts.forEach(item => {
                let bestDay = this.findBestDayForWorkout(
                    item.workout,
                    timeSlots,
                    adaptedSchedule,
                    'moderate',
                    preferences.preferredDays
                );

                if (bestDay) {
                    const adaptedWorkout = this.adjustWorkoutToTime(
                        item.workout,
                        timeSlots[bestDay]
                    );
                    adaptedSchedule[bestDay] = adaptedWorkout;
                    console.log(`  ✅ Moderate: ${adaptedWorkout.name} → ${bestDay} (${adaptedWorkout.duration}min)`);
                }
            });

            // Assign EASY workouts to long slots (90+ min for endurance)
            required.easyWorkouts.forEach(item => {
                let bestDay = this.findBestDayForWorkout(
                    item.workout,
                    timeSlots,
                    adaptedSchedule,
                    'easy',
                    preferences.preferredDays
                );

                if (bestDay) {
                    const adaptedWorkout = this.adjustWorkoutToTime(
                        item.workout,
                        timeSlots[bestDay]
                    );
                    adaptedSchedule[bestDay] = adaptedWorkout;
                    console.log(`  ✅ Easy: ${adaptedWorkout.name} → ${bestDay} (${adaptedWorkout.duration}min)`);
                }
            });

            // Calculate adaptation summary
            const summary = this.generateAdaptationSummary(
                originalSchedule[weekNum],
                adaptedSchedule,
                analysis
            );

            return {
                schedule: adaptedSchedule,
                analysis: analysis,
                summary: summary,
                strategies: this.getAppliedStrategies(originalSchedule[weekNum], adaptedSchedule)
            };
        },

        // Find best day for workout based on intensity and available time
        findBestDayForWorkout: function (workout, timeSlots, currentSchedule, intensity, preferredDays = []) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            let candidates = [];

            days.forEach((day, index) => {
                const availableTime = timeSlots[day] || 0;

                // Skip if no time or already assigned
                if (availableTime === 0 || currentSchedule[day]) return;

                let score = 0;
                const category = this.getTimeSlotCategory(availableTime);

                // Score based on intensity-time match
                if (intensity === 'hard') {
                    // Hard workouts prefer 45-90 min slots
                    if (category === 'MEDIUM') score += 10;
                    else if (category === 'SHORT') score += 7;
                    else if (category === 'LONG') score += 5;
                } else if (intensity === 'moderate') {
                    // Moderate workouts flexible, prefer medium
                    if (category === 'MEDIUM') score += 8;
                    else if (category === 'LONG') score += 7;
                    else if (category === 'SHORT') score += 4;
                } else if (intensity === 'easy') {
                    // Easy workouts prefer long slots
                    if (category === 'EXTRA') score += 10;
                    else if (category === 'LONG') score += 9;
                    else if (category === 'MEDIUM') score += 5;
                    else if (category === 'SHORT') score += 2;
                }

                // Bonus for preferred days
                if (preferredDays && preferredDays.includes(day)) {
                    score += 2;
                }

                // Check for adjacent hard days (avoid back-to-back hard)
                const prevDay = days[index - 1];
                const nextDay = days[index + 1];

                if (prevDay && currentSchedule[prevDay]?.intensity === 'hard') score -= 3;
                if (nextDay && currentSchedule[nextDay]?.intensity === 'hard') score -= 3;

                // Weekend bonus for long workouts
                if ((day === 'Sat' || day === 'Sun') && intensity === 'easy') score += 2;

                candidates.push({ day, score, availableTime });
            });

            // Sort by score and return best match
            candidates.sort((a, b) => b.score - a.score);
            return candidates[0]?.score > 0 ? candidates[0].day : null;
        },

        // **NIEUWE FUNCTIE:** Adjust workout to fit available time using variants
        adjustWorkoutToTime: function (workout, availableMinutes) {
            // Als workout geen baseName heeft (dus al een resolved workout is)
            // Dan kunnen we proberen een betere variant te selecteren

            // Check of we toegang hebben tot de original workout in de DB
            // Dit is complex omdat we de base workout moeten vinden
            // Voor nu: simpele duration aanpassing

            const adapted = { ...workout };
            const originalDuration = workout.originalDuration || workout.duration || 60;

            // Determine best fit
            const timeDiff = Math.abs(availableMinutes - originalDuration);
            const timeRatio = availableMinutes / originalDuration;

            if (timeRatio < 0.8) {
                // Significantly less time - compress
                adapted.duration = availableMinutes;
                adapted.adapted = true;
                adapted.adaptationType = 'compressed';

                const compressionRatio = Math.round((availableMinutes / originalDuration) * 100);
                adapted.description = `${workout.description} (⏱️ ${compressionRatio}% duration)`;

                if (workout.intensity === 'hard') {
                    adapted.tips = (adapted.tips || '') + ' Focus on quality over quantity in this compressed session.';
                }

                console.log(`    🔽 Compressed: ${originalDuration}min → ${availableMinutes}min`);

            } else if (timeRatio > 1.3 && workout.intensity === 'easy') {
                // More time available and it's easy workout - extend
                const extendedDuration = Math.min(availableMinutes, originalDuration * 1.5);
                adapted.duration = extendedDuration;
                adapted.adapted = true;
                adapted.adaptationType = 'extended';
                adapted.description = `${workout.description} (⏱️ Extended endurance)`;

                console.log(`    🔼 Extended: ${originalDuration}min → ${extendedDuration}min`);

            } else {
                // Close enough - keep original
                adapted.duration = originalDuration;
                console.log(`    ✓ Maintained: ${originalDuration}min`);
            }

            return adapted;
        },

        // DEPRECATED: Keep for backwards compatibility but use adjustWorkoutToTime instead
        adjustWorkoutDuration: function (workout, availableMinutes) {
            console.warn('⚠️ adjustWorkoutDuration is deprecated, use adjustWorkoutToTime');
            return this.adjustWorkoutToTime(workout, availableMinutes);
        },

        // Generate summary of adaptations
        generateAdaptationSummary: function (original, adapted, analysis) {
            let originalWorkouts = 0;
            let adaptedWorkouts = 0;
            let originalMinutes = 0;
            let adaptedMinutes = 0;

            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            days.forEach(day => {
                if (original[day]) {
                    originalWorkouts++;
                    originalMinutes += original[day].duration || 60;
                }
                if (adapted[day]) {
                    adaptedWorkouts++;
                    adaptedMinutes += adapted[day].duration || 60;
                }
            });

            // Calculate intensity distribution
            let adaptedDistribution = { hard: 0, moderate: 0, easy: 0 };
            days.forEach(day => {
                if (adapted[day]?.intensity) {
                    adaptedDistribution[adapted[day].intensity]++;
                }
            });

            const polarizationScore = this.calculatePolarizationScore(adaptedDistribution);

            return {
                originalWorkouts,
                adaptedWorkouts,
                workoutRetention: originalWorkouts > 0 ? Math.round((adaptedWorkouts / originalWorkouts) * 100) : 0,
                originalMinutes,
                adaptedMinutes,
                volumeRetention: originalMinutes > 0 ? Math.round((adaptedMinutes / originalMinutes) * 100) : 0,
                polarizationScore,
                distribution: adaptedDistribution,
                recommendation: this.getRecommendation(polarizationScore, analysis)
            };
        },

        // Calculate how well the adaptation maintains 80/20 principle
        calculatePolarizationScore: function (distribution) {
            const total = distribution.hard + distribution.moderate + distribution.easy;
            if (total === 0) return 0;

            const hardPercentage = ((distribution.hard + distribution.moderate) / total) * 100;

            // Ideal is 20% hard, 80% easy
            const hardDeviation = Math.abs(20 - hardPercentage);
            const score = Math.max(0, 100 - (hardDeviation * 2));

            return Math.round(score);
        },

        // Get recommendation based on adaptation
        getRecommendation: function (polarizationScore, analysis) {
            if (analysis.totalHours < 3) {
                return "⚠️ Very limited time. Focus on quality over quantity. Prioritize hard intervals.";
            } else if (polarizationScore < 60) {
                return "⚠️ Polarization compromised. Try to add more easy volume or reduce hard sessions.";
            } else if (polarizationScore < 80) {
                return "⚡ Good adaptation! Close to ideal 80/20 distribution.";
            } else {
                return "✅ Excellent! Maintaining proper polarized distribution.";
            }
        },

        // Get list of applied strategies
        getAppliedStrategies: function (original, adapted) {
            const strategies = [];
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            let compressed = 0;
            let extended = 0;
            let maintained = 0;
            let skipped = 0;

            days.forEach(day => {
                const orig = original[day];
                const adap = adapted[day];

                if (orig && !adap) {
                    skipped++;
                } else if (adap?.adaptationType === 'compressed') {
                    compressed++;
                } else if (adap?.adaptationType === 'extended') {
                    extended++;
                } else if (adap) {
                    maintained++;
                }
            });

            if (compressed > 0) strategies.push(`${compressed} workouts compressed`);
            if (extended > 0) strategies.push(`${extended} workouts extended`);
            if (maintained > 0) strategies.push(`${maintained} workouts unchanged`);
            if (skipped > 0) strategies.push(`${skipped} workouts skipped`);

            return strategies;
        }
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.WeeklyAdapter = WeeklyAdapter;
}