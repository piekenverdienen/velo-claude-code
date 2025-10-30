/**
 * WORKOUT PARSER MODULE
 *
 * Central, canonical workout parser used by BOTH visual rendering and export.
 * This is the single source of truth for workout structure parsing.
 *
 * POLARIZED TRAINING ALIGNMENT:
 * - Easy (Zone 1-2): <75% FTP  → 80% of training volume
 * - Moderate (Zone 3): 75-90% FTP → Minimize (gray zone)
 * - Hard (Zone 4-6): >90% FTP → 20% of training volume
 *
 * @module WorkoutParser
 */

const WorkoutParser = (function () {
    'use strict';

    // ============================================================================
    // CONSTANTS - Polarized Training Zones
    // ============================================================================

    const INTENSITY_ZONES = {
        recovery: { min: 0, max: 0.60, category: 'easy', label: 'Recovery' },
        zone1: { min: 0.60, max: 0.75, category: 'easy', label: 'Zone 1 (Aerobic)' },
        zone2: { min: 0.75, max: 0.85, category: 'moderate', label: 'Zone 2 (Tempo)' },
        zone3: { min: 0.85, max: 0.95, category: 'moderate', label: 'Zone 3 (Threshold)' },
        zone4: { min: 0.95, max: 1.05, category: 'hard', label: 'Zone 4 (VO2max)' },
        zone5: { min: 1.05, max: 1.20, category: 'hard', label: 'Zone 5 (Anaerobic)' },
        zone6: { min: 1.20, max: 2.00, category: 'hard', label: 'Zone 6 (Neuromuscular)' }
    };

    // Default durations for warmup/cooldown when not specified
    const DEFAULT_DURATIONS = {
        warmup: {
            easy: 300,      // 5 min for easy workouts
            moderate: 600,  // 10 min for moderate workouts
            hard: 600       // 10 min for hard workouts
        },
        cooldown: {
            easy: 300,      // 5 min
            moderate: 600,  // 10 min
            hard: 600       // 10 min
        }
    };

    // ============================================================================
    // PHASE 1: INTENSITY PARSING
    // ============================================================================

    /**
     * Parse intensity string to decimal value
     * Supports: "65% FTP", "80-85% FTP", "110-120% FTP", "150%+ FTP", "Variable"
     * @param {string} intensityStr - Intensity string from database
     * @returns {Object} {value: number, min: number, max: number, category: string}
     */
    function parseIntensity(intensityStr) {
        if (!intensityStr || typeof intensityStr !== 'string') {
            return { value: 0.65, min: 0.60, max: 0.70, category: 'easy', raw: intensityStr };
        }

        const str = intensityStr.trim();

        // Match percentage patterns: "65%", "80-85%", "110-120%", "150%+", etc.
        const percentMatch = str.match(/(\d+)\s*(-|to)?\s*(\d+)?\s*%?\s*\+?/i);

        if (percentMatch) {
            const low = parseInt(percentMatch[1]);
            const high = percentMatch[3] ? parseInt(percentMatch[3]) : low;
            const avg = (low + high) / 2;

            const value = avg / 100;
            const minVal = low / 100;
            const maxVal = high / 100;
            const category = determineCategory(value);

            return {
                value: value,
                min: minVal,
                max: maxVal,
                category: category,
                raw: intensityStr
            };
        }

        // Handle "Variable" - extract from details if possible
        if (str.toLowerCase().includes('variable')) {
            return {
                value: 1.0,  // Default to FTP for variable workouts
                min: 0.60,
                max: 1.20,
                category: 'hard',
                raw: intensityStr,
                isVariable: true
            };
        }

        // Handle category strings
        const categoryMap = {
            'rest': { value: 0.50, min: 0, max: 0.55, category: 'easy' },
            'recovery': { value: 0.55, min: 0.50, max: 0.60, category: 'easy' },
            'easy': { value: 0.65, min: 0.60, max: 0.70, category: 'easy' },
            'moderate': { value: 0.82, min: 0.75, max: 0.90, category: 'moderate' },
            'hard': { value: 1.00, min: 0.95, max: 1.10, category: 'hard' }
        };

        const lowerStr = str.toLowerCase();
        for (const [key, val] of Object.entries(categoryMap)) {
            if (lowerStr.includes(key)) {
                return { ...val, raw: intensityStr };
            }
        }

        // Fallback
        console.warn('Could not parse intensity:', intensityStr);
        return { value: 0.65, min: 0.60, max: 0.70, category: 'easy', raw: intensityStr };
    }

    /**
     * Determine polarized category from intensity value
     * @param {number} intensity - Intensity as decimal (0.0-2.0)
     * @returns {string} 'easy', 'moderate', or 'hard'
     */
    function determineCategory(intensity) {
        if (intensity < 0.75) return 'easy';      // <75% FTP - Polarized LOW
        if (intensity < 0.90) return 'moderate';  // 75-90% FTP - Gray zone
        return 'hard';                             // >90% FTP - Polarized HIGH
    }

    // ============================================================================
    // PHASE 2: DETAILS PARSING
    // ============================================================================

    /**
     * Parse workout details string into structured phases
     * @param {string} details - Details string from database
     * @param {number} totalDuration - Total workout duration in minutes
     * @param {Object} intensity - Parsed intensity object
     * @returns {Object} Structured phase object
     */
    function parseDetails(details, totalDuration, intensity) {
        if (!details) {
            return generateDefaultStructure(totalDuration, intensity);
        }

        const phases = {
            warmup: null,
            main: [],
            cooldown: null
        };

        // Parse warmup
        const warmupMatch = details.match(/Warm-up:\s*(\d+)\s*min/i);
        if (warmupMatch) {
            phases.warmup = {
                duration: parseInt(warmupMatch[1]),
                intensity: 0.55,
                type: 'warmup'
            };
        }

        // Parse cooldown
        const cooldownMatch = details.match(/Cool-down:\s*(\d+)\s*min/i);
        if (cooldownMatch) {
            phases.cooldown = {
                duration: parseInt(cooldownMatch[1]),
                intensity: 0.50,
                type: 'cooldown'
            };
        }

        // Parse main set
        const mainContent = parseMainSet(details, intensity);
        phases.main = mainContent;

        // Fill in defaults if not found
        if (!phases.warmup) {
            const warmupSeconds = DEFAULT_DURATIONS.warmup[intensity.category];
            phases.warmup = {
                duration: warmupSeconds / 60,
                intensity: 0.55,
                type: 'warmup'
            };
        }

        if (!phases.cooldown) {
            const cooldownSeconds = DEFAULT_DURATIONS.cooldown[intensity.category];
            phases.cooldown = {
                duration: cooldownSeconds / 60,
                intensity: 0.50,
                type: 'cooldown'
            };
        }

        // Validate and adjust to match total duration
        return validateAndAdjust(phases, totalDuration);
    }

    /**
     * Parse main set from details
     * Supports: intervals (NxM pattern), pyramids, steady state
     * @param {string} details - Details string
     * @param {Object} intensity - Parsed intensity
     * @returns {Array} Array of main phase objects
     */
    function parseMainSet(details, intensity) {
        // Try interval pattern: "3x8 min @ 80-85% FTP, 4 min recovery"
        const intervalMatch = details.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(s(?:ec)?(?:ond)?s?|min(?:ute)?s?)(?:\s+@\s+(\d+(?:-\d+)?)%?\s*FTP)?(?:,\s*(\d+(?:\.\d+)?)\s*(s(?:ec)?(?:ond)?s?)\s*(?:recovery|easy|rest))?/i);

        if (intervalMatch) {
            return parseIntervals(intervalMatch, intensity);
        }

        // Try pyramid pattern: "5-10-15-10-5 min"
        const pyramidMatch = details.match(/(\d+)-(\d+)-(\d+)-(\d+)-(\d+)\s*min/i);
        if (pyramidMatch) {
            return parsePyramid(pyramidMatch, intensity);
        }

        // Try steady state with duration: "45 min steady"
        const steadyMatch = details.match(/Main:\s*(\d+)\s*min\s+steady/i);
        if (steadyMatch) {
            return [{
                duration: parseInt(steadyMatch[1]),
                intensity: intensity.value,
                type: 'steady'
            }];
        }

        // Fallback: empty main (will be filled by validation)
        return [];
    }

    /**
     * Parse interval structure
     * @param {Array} match - Regex match array
     * @param {Object} intensity - Parsed intensity
     * @returns {Array} Array of interval phases
     */
    function parseIntervals(match, intensity) {
        const phases = [];
        const reps = parseInt(match[1]);
        const workValue = parseFloat(match[2]);
        const workUnit = match[3];
        const intensityOverride = match[4];
        const recoveryValue = match[5] ? parseFloat(match[5]) : null;
        const recoveryUnit = match[6];

        // Convert to minutes
        const workMinutes = workUnit.match(/^s/i) ? workValue / 60 : workValue;
        const recoveryMinutes = recoveryValue
            ? (recoveryUnit && recoveryUnit.match(/^s/i) ? recoveryValue / 60 : recoveryValue)
            : Math.max(3, workMinutes * 0.5); // Default: 3 min or 50% of work

        // Determine work intensity
        let workIntensity = intensity.value;
        if (intensityOverride) {
            const overrideMatch = intensityOverride.match(/(\d+)(?:-(\d+))?/);
            if (overrideMatch) {
                const low = parseInt(overrideMatch[1]) / 100;
                const high = overrideMatch[2] ? parseInt(overrideMatch[2]) / 100 : low;
                workIntensity = (low + high) / 2;
            }
        }

        // Build interval array
        for (let i = 0; i < reps; i++) {
            phases.push({
                duration: workMinutes,
                intensity: workIntensity,
                type: 'work',
                intervalNumber: i + 1
            });

            if (i < reps - 1) {  // No recovery after last interval
                phases.push({
                    duration: recoveryMinutes,
                    intensity: 0.55,
                    type: 'recovery'
                });
            }
        }

        return phases;
    }

    /**
     * Parse pyramid structure
     * @param {Array} match - Regex match array
     * @param {Object} intensity - Parsed intensity
     * @returns {Array} Array of pyramid phases
     */
    function parsePyramid(match, intensity) {
        const phases = [];
        const durations = [
            parseInt(match[1]),
            parseInt(match[2]),
            parseInt(match[3]),
            parseInt(match[4]),
            parseInt(match[5])
        ];

        const recoveryMinutes = 3; // Default 3 min recovery between pyramid steps

        durations.forEach((dur, index) => {
            phases.push({
                duration: dur,
                intensity: intensity.value,
                type: 'work',
                pyramidStep: index + 1
            });

            if (index < durations.length - 1) {
                phases.push({
                    duration: recoveryMinutes,
                    intensity: 0.55,
                    type: 'recovery'
                });
            }
        });

        return phases;
    }

    /**
     * Generate default structure for workouts without details
     * @param {number} totalDuration - Total duration in minutes
     * @param {Object} intensity - Parsed intensity
     * @returns {Object} Default phase structure
     */
    function generateDefaultStructure(totalDuration, intensity) {
        const warmupMin = DEFAULT_DURATIONS.warmup[intensity.category] / 60;
        const cooldownMin = DEFAULT_DURATIONS.cooldown[intensity.category] / 60;
        const mainMin = Math.max(10, totalDuration - warmupMin - cooldownMin);

        return {
            warmup: {
                duration: warmupMin,
                intensity: 0.55,
                type: 'warmup'
            },
            main: [{
                duration: mainMin,
                intensity: intensity.value,
                type: 'steady'
            }],
            cooldown: {
                duration: cooldownMin,
                intensity: 0.50,
                type: 'cooldown'
            }
        };
    }

    /**
     * Validate phases and adjust to match total duration
     * @param {Object} phases - Phase object
     * @param {number} totalDuration - Expected total duration in minutes
     * @returns {Object} Validated and adjusted phases
     */
    function validateAndAdjust(phases, totalDuration) {
        // Calculate current total
        let currentTotal = 0;
        if (phases.warmup) currentTotal += phases.warmup.duration;
        if (phases.cooldown) currentTotal += phases.cooldown.duration;
        phases.main.forEach(phase => currentTotal += phase.duration);

        const difference = totalDuration - currentTotal;

        // Log duration mismatch for debugging, but trust the parsed details
        // Database durations are often estimates and may not match exact workout details
        if (Math.abs(difference) > 2) {
            console.info(`Duration mismatch: Database=${totalDuration}min, Parsed=${currentTotal}min, Diff=${difference.toFixed(1)}min`);
            // We trust the parsed details from workout description over database duration
            // No filler added - export will match visual display exactly
        }

        return phases;
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    /**
     * Parse complete workout into canonical structure
     * This is the main entry point used by both visual and export
     * @param {Object} workout - Workout object from database
     * @returns {Object} Canonical workout structure
     */
    function parseWorkout(workout) {
        if (!workout) {
            throw new Error('Workout object is required');
        }

        // Parse intensity
        const intensity = parseIntensity(workout.intensity);

        // Parse details into phases
        const phases = parseDetails(
            workout.details,
            workout.duration || 60,
            intensity
        );

        // Build canonical structure
        const canonical = {
            // Original data
            name: workout.name || 'Unnamed Workout',
            description: workout.description || '',
            duration: workout.duration || 60,

            // Parsed data
            intensity: intensity,

            // Structured phases
            phases: {
                warmup: phases.warmup,
                main: phases.main,
                cooldown: phases.cooldown
            },

            // Metadata
            totalDuration: calculateTotalDuration(phases),
            polarizedCategory: intensity.category,
            hasIntervals: phases.main.some(p => p.type === 'work'),
            isPyramid: phases.main.some(p => p.pyramidStep !== undefined)
        };

        return canonical;
    }

    /**
     * Calculate total duration from phases
     * @param {Object} phases - Phase object
     * @returns {number} Total duration in minutes
     */
    function calculateTotalDuration(phases) {
        let total = 0;
        if (phases.warmup) total += phases.warmup.duration;
        if (phases.cooldown) total += phases.cooldown.duration;
        phases.main.forEach(phase => total += phase.duration);
        return total;
    }

    /**
     * Validate workout consistency
     * @param {Object} workout - Workout from database
     * @returns {Object} {valid: boolean, errors: Array, warnings: Array}
     */
    function validateWorkout(workout) {
        const errors = [];
        const warnings = [];

        if (!workout.name) errors.push('Missing workout name');
        if (!workout.intensity) errors.push('Missing intensity');
        if (!workout.duration || workout.duration <= 0) errors.push('Invalid duration');

        try {
            const parsed = parseWorkout(workout);

            // Check duration match
            const diff = Math.abs(parsed.totalDuration - parsed.duration);
            if (diff > 2) {
                warnings.push(`Duration mismatch: ${parsed.duration} min specified, ${parsed.totalDuration.toFixed(1)} min calculated`);
            }

            // Check intensity parsing
            if (parsed.intensity.value < 0.3 || parsed.intensity.value > 2.0) {
                warnings.push(`Unusual intensity value: ${(parsed.intensity.value * 100).toFixed(0)}% FTP`);
            }

        } catch (err) {
            errors.push(`Parse error: ${err.message}`);
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    // Public API
    return {
        parseWorkout: parseWorkout,
        validateWorkout: validateWorkout,
        parseIntensity: parseIntensity,
        determineCategory: determineCategory,
        INTENSITY_ZONES: INTENSITY_ZONES
    };
})();

// Make globally available
if (typeof window !== 'undefined') {
    window.WorkoutParser = WorkoutParser;
}

console.log('✅ WorkoutParser module loaded');
