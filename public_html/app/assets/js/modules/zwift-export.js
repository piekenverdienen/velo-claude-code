// Zwift Export Module - Exports workouts to .zwo format for Zwift
const ZwiftExport = (function () {
    'use strict';

    // Zwift-compatible power zones
    const POWER_ZONES = {
        recovery: { low: 0.50, high: 0.60 },
        easy: { low: 0.60, high: 0.75 },
        moderate: { low: 0.76, high: 0.87 },
        sweetspot: { low: 0.88, high: 0.94 },
        threshold: { low: 0.95, high: 1.05 },
        vo2max: { low: 1.06, high: 1.20 },
        anaerobic: { low: 1.21, high: 1.50 }
    };

    // Parse workout name/details to detect workout type
    function detectWorkoutType(workout) {
        const name = (workout.name || '').toLowerCase();
        const details = (workout.details || '').toLowerCase();
        const combined = name + ' ' + details;

        // Detection patterns
        if (combined.includes('vo2') || combined.includes('v02')) {
            return 'vo2max';
        }
        if (combined.includes('threshold') || combined.includes('ftp test')) {
            return 'threshold';
        }
        if (combined.includes('sweet spot') || combined.includes('sweetspot')) {
            return 'sweetspot';
        }
        if (combined.includes('sprint') || combined.includes('30s') || combined.includes('30 s')) {
            return 'sprint';
        }
        if (combined.includes('pyramid')) {
            return 'pyramid';
        }
        if (combined.includes('tempo')) {
            return 'tempo';
        }

        return 'default';
    }

    /**
     * Parse interval structure from workout details
     * Supports: minutes, seconds, various time formats
     * @param {Object} workout - Workout object with details
     * @returns {Object} Parsed interval structure with type, repeat, durations
     */
    function parseIntervalStructure(workout) {
        const details = workout.details || '';
        const type = detectWorkoutType(workout);

        // Helper: Convert time to seconds
        const parseTimeToSeconds = (value, unit) => {
            const num = parseFloat(value);
            if (unit.match(/^s(ec)?(ond)?s?$/i)) {
                return num; // Already seconds
            }
            return num * 60; // Convert minutes to seconds
        };

        // Match patterns: "10x30 seconds", "5x3 min", "4x4min at 90%", "3x8 min"
        const intervalMatch = details.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(s(?:ec)?(?:ond)?s?|min(?:ute)?s?)/i);

        if (intervalMatch) {
            const repeat = parseInt(intervalMatch[1]);
            const workValue = intervalMatch[2];
            const workUnit = intervalMatch[3];
            const duration = parseTimeToSeconds(workValue, workUnit);

            // Match recovery: "3 min recovery", "30s rest", "4min easy", "2 minute recovery"
            const recoveryMatch = details.match(/(\d+(?:\.\d+)?)\s*(s(?:ec)?(?:ond)?s?|min(?:ute)?s?)\s*(?:recovery|easy|rest)/i);

            let recoveryDuration;
            if (recoveryMatch) {
                recoveryDuration = parseTimeToSeconds(recoveryMatch[1], recoveryMatch[2]);
            } else {
                // Default: 50% of work duration or min 3 min (whichever is less for short intervals)
                recoveryDuration = Math.min(180, Math.max(30, duration * 0.5));
            }

            return {
                type: 'intervals',
                repeat,
                onDuration: duration,
                offDuration: recoveryDuration,
                workoutType: type
            };
        }

        // Check for pyramid (5-10-15-10-5)
        if (type === 'pyramid') {
            return {
                type: 'pyramid',
                workoutType: type
            };
        }

        return {
            type: 'steady',
            workoutType: type
        };
    }

    /**
     * Parse percentage from intensity string
     * Supports: "65% FTP", "80-85% FTP", "55%", etc.
     * @param {string} intensity - Intensity string
     * @returns {number|null} Average percentage as decimal (e.g., 0.65 for 65%) or null
     */
    function parseIntensityPercentage(intensity) {
        if (!intensity || typeof intensity !== 'string' || !intensity.includes('%')) {
            return null;
        }

        // Match patterns: "65%", "65% FTP", "80-85%", "80-85% FTP"
        const match = intensity.match(/(\d+)(?:-(\d+))?%/);
        if (!match) return null;

        const low = parseInt(match[1]);
        const high = match[2] ? parseInt(match[2]) : low;
        const avg = (low + high) / 2;

        return avg / 100; // Convert to decimal (65% → 0.65)
    }

    /**
     * Map percentage or intensity string to category (easy/moderate/hard)
     * Used for warmup duration, cooldown duration, and tag generation
     * @param {string} intensity - Intensity string ("65% FTP", "easy", "80-85% FTP", etc.)
     * @returns {string} Category: 'easy', 'moderate', or 'hard'
     */
    function mapIntensityToCategory(intensity) {
        if (!intensity) return 'easy';

        // If already a category, return it
        if (intensity === 'easy' || intensity === 'moderate' || intensity === 'hard' || intensity === 'rest') {
            return intensity;
        }

        // If percentage string, convert to category
        const percentage = parseIntensityPercentage(intensity);
        if (percentage !== null) {
            const avg = percentage * 100; // Convert back to percentage for comparison

            // Map percentage ranges to categories (same logic as WorkoutModule)
            if (avg < 70) return 'easy';       // Recovery/Zone 1
            if (avg < 85) return 'moderate';   // Tempo/Sweet Spot
            return 'hard';                      // Threshold/VO2max/Sprints
        }

        // Fallback for unknown formats
        return 'easy';
    }

    // Determine power for workout type
    function getPowerForWorkout(workoutType, intensity) {
        const mapping = {
            'vo2max': { on: POWER_ZONES.vo2max.low + 0.08, off: 0.55 }, // Recovery at 55%
            'threshold': { on: 0.875, off: 0.55 }, // 87.5% = middle of 85-90% range, recovery 55%
            'sweetspot': { on: 0.90, off: 0.55 }, // Recovery at 55%
            'tempo': { on: POWER_ZONES.moderate.low + 0.05, off: 0.55 }, // Recovery at 55%
            'sprint': { on: POWER_ZONES.anaerobic.low, off: 0.50 }, // Very low recovery for sprints
            'default': { on: POWER_ZONES.threshold.high, off: 0.55 }
        };

        return mapping[workoutType] || mapping.default;
    }

    /**
     * Generate structured warmup protocol
     * Uses parsed warmup duration from workout details, or category-based default
     * @param {number} warmupDuration - Warmup duration in seconds
     * @param {string} intensityCategory - Intensity category (easy/moderate/hard)
     * @returns {string} XML warmup segments
     */
    function generateStructuredWarmup(warmupDuration, intensityCategory) {
        const warmupMinutes = warmupDuration / 60;

        if (intensityCategory === 'hard' && warmupDuration >= 600) {
            // 10-minute structured warmup for intense workouts
            return `        <!-- Structured Warmup: ${warmupMinutes} minutes -->
        <SteadyState Duration="120" Power="0.50" pace="0"/>
        <SteadyState Duration="120" Power="0.60" pace="0"/>
        <SteadyState Duration="120" Power="0.70" pace="0"/>
        <SteadyState Duration="60" Power="0.80" pace="0"/>
        <SteadyState Duration="60" Power="0.50" pace="0"/>
        <SteadyState Duration="120" Power="0.75" pace="0"/>
`;
        } else {
            // Simple ramp warmup (duration from workout details or default)
            return `        <Warmup Duration="${warmupDuration}" PowerLow="0.50" PowerHigh="0.70" pace="0"/>\n`;
        }
    }

    /**
     * Parse warmup and cooldown durations from workout details
     * Matches patterns like "Warm-up: 10 min", "Cool-down: 5 min"
     * @param {string} details - Workout details string
     * @param {string} intensityCategory - Intensity category (easy/moderate/hard)
     * @returns {Object} {warmupDuration: seconds, cooldownDuration: seconds}
     */
    function parseWarmupCooldownDurations(details, intensityCategory) {
        let warmupDuration, cooldownDuration;

        // Try parsing from details first
        if (details) {
            const warmupMatch = details.match(/Warm-up:\s*(\d+)\s*min/i);
            const cooldownMatch = details.match(/Cool-down:\s*(\d+)\s*min/i);

            if (warmupMatch) {
                warmupDuration = parseInt(warmupMatch[1]) * 60; // Convert to seconds
            }
            if (cooldownMatch) {
                cooldownDuration = parseInt(cooldownMatch[1]) * 60; // Convert to seconds
            }
        }

        // Fallback to category-based durations if not found in details
        if (!warmupDuration) {
            warmupDuration = intensityCategory === 'hard' ? 600 : 300; // 10 min or 5 min
        }
        if (!cooldownDuration) {
            cooldownDuration = intensityCategory === 'hard' ? 600 : 300; // 10 min or 5 min
        }

        return { warmupDuration, cooldownDuration };
    }

    /**
     * Generate workout segments using WorkoutParser (centralized parsing)
     * Ensures visual display matches export exactly
     * @param {Object} workout - Workout object from database
     * @returns {string} XML segments for Zwift workout
     */
    function generateWorkoutSegments(workout) {
        let segments = '';

        // Use WorkoutParser for canonical structure
        let parsed;
        try {
            if (typeof WorkoutParser === 'undefined') {
                console.warn('WorkoutParser not loaded, using fallback');
                return generateWorkoutSegmentsFallback(workout);
            }

            parsed = WorkoutParser.parseWorkout(workout);
        } catch (err) {
            console.error('Error parsing workout for export:', err);
            return generateWorkoutSegmentsFallback(workout);
        }

        // 1. Generate Warmup
        if (parsed.phases.warmup) {
            const warmupSeconds = Math.round(parsed.phases.warmup.duration * 60);
            const category = parsed.intensity.category;

            if (category === 'hard' && warmupSeconds >= 600) {
                // 10-minute structured warmup for intense workouts
                segments += `        <!-- Structured Warmup: ${parsed.phases.warmup.duration.toFixed(0)} minutes -->\n`;
                segments += `        <SteadyState Duration="120" Power="0.50" pace="0"/>\n`;
                segments += `        <SteadyState Duration="120" Power="0.60" pace="0"/>\n`;
                segments += `        <SteadyState Duration="120" Power="0.70" pace="0"/>\n`;
                segments += `        <SteadyState Duration="60" Power="0.80" pace="0"/>\n`;
                segments += `        <SteadyState Duration="60" Power="0.50" pace="0"/>\n`;
                segments += `        <SteadyState Duration="120" Power="0.75" pace="0"/>\n`;
            } else {
                // Simple ramp warmup
                segments += `        <Warmup Duration="${warmupSeconds}" PowerLow="0.50" PowerHigh="0.70" pace="0"/>\n`;
            }
        }

        // 2. Generate Main Set
        if (parsed.hasIntervals) {
            // Intervals workout - separate work/recovery
            segments += generateIntervalsSegments(parsed.phases.main);
        } else {
            // Steady state or mixed workout
            parsed.phases.main.forEach(phase => {
                const duration = Math.round(phase.duration * 60);
                const power = phase.intensity.toFixed(2);
                segments += `        <SteadyState Duration="${duration}" Power="${power}" pace="0"/>\n`;
            });
        }

        // 3. Generate Cooldown
        if (parsed.phases.cooldown) {
            const cooldownSeconds = Math.round(parsed.phases.cooldown.duration * 60);
            segments += `        <Cooldown Duration="${cooldownSeconds}" PowerLow="0.50" PowerHigh="0.40" pace="0"/>\n`;
        }

        return segments;
    }

    /**
     * Generate intervals segments from parsed main phases
     * @param {Array} mainPhases - Array of main phase objects
     * @returns {string} XML intervals segments
     */
    function generateIntervalsSegments(mainPhases) {
        let segments = '';
        let currentInterval = null;
        let intervalCount = 0;

        mainPhases.forEach((phase, index) => {
            if (phase.type === 'work') {
                // Start of interval or standalone work phase
                if (!currentInterval) {
                    currentInterval = {
                        onDuration: Math.round(phase.duration * 60),
                        onPower: phase.intensity.toFixed(2),
                        offDuration: 0,
                        offPower: 0.55,
                        repeat: 1
                    };
                    intervalCount = 1;
                }
            } else if (phase.type === 'recovery' && currentInterval) {
                // Recovery after work phase
                currentInterval.offDuration = Math.round(phase.duration * 60);
                currentInterval.offPower = phase.intensity.toFixed(2);

                // Check if next phase is same type of work (for repeat counting)
                const nextWork = mainPhases[index + 2]; // Skip recovery, look at next work
                if (nextWork && nextWork.type === 'work' &&
                    Math.abs(nextWork.duration - (currentInterval.onDuration / 60)) < 0.1 &&
                    Math.abs(nextWork.intensity - parseFloat(currentInterval.onPower)) < 0.01) {
                    // Same interval repeating
                    intervalCount++;
                } else {
                    // End of interval set, output it
                    currentInterval.repeat = intervalCount;
                    segments += `        <IntervalsT Repeat="${currentInterval.repeat}" OnDuration="${currentInterval.onDuration}" OffDuration="${currentInterval.offDuration}" OnPower="${currentInterval.onPower}" OffPower="${currentInterval.offPower}" pace="0"/>\n`;
                    currentInterval = null;
                    intervalCount = 0;
                }
            } else {
                // Filler or other phase type
                if (currentInterval) {
                    // Output pending interval
                    currentInterval.repeat = intervalCount;
                    segments += `        <IntervalsT Repeat="${currentInterval.repeat}" OnDuration="${currentInterval.onDuration}" OffDuration="${currentInterval.offDuration}" OnPower="${currentInterval.onPower}" OffPower="${currentInterval.offPower}" pace="0"/>\n`;
                    currentInterval = null;
                    intervalCount = 0;
                }

                // Output this phase as steady state
                const duration = Math.round(phase.duration * 60);
                const power = phase.intensity.toFixed(2);
                segments += `        <SteadyState Duration="${duration}" Power="${power}" pace="0"/>\n`;
            }
        });

        // Output any remaining interval
        if (currentInterval) {
            currentInterval.repeat = intervalCount;
            segments += `        <IntervalsT Repeat="${currentInterval.repeat}" OnDuration="${currentInterval.onDuration}" OffDuration="${currentInterval.offDuration}" OnPower="${currentInterval.onPower}" OffPower="${currentInterval.offPower}" pace="0"/>\n`;
        }

        return segments;
    }

    /**
     * Fallback segment generation if WorkoutParser not available
     * @param {Object} workout - Workout object
     * @returns {string} XML segments
     */
    function generateWorkoutSegmentsFallback(workout) {
        let segments = '';
        const intensity = workout.intensity || 'easy';
        const duration = workout.duration || 60;
        const details = workout.details || '';
        const structure = parseIntervalStructure(workout);
        const powers = getPowerForWorkout(structure.workoutType, intensity);

        // Check if intensity is a percentage string (e.g., "65% FTP")
        const intensityPercentage = parseIntensityPercentage(intensity);

        // Map intensity to category for warmup/cooldown duration
        const intensityCategory = mapIntensityToCategory(intensity);

        // 1. Parse warmup/cooldown from details (matches visual display logic)
        const { warmupDuration, cooldownDuration } = parseWarmupCooldownDurations(details, intensityCategory);

        // Calculate main duration
        const totalDuration = duration * 60; // Convert to seconds
        const mainDuration = totalDuration - warmupDuration - cooldownDuration;

        // 2. Structured Warmup (using parsed duration)
        segments += generateStructuredWarmup(warmupDuration, intensityCategory);

        // 3. Main workout - FIXED to respect total duration
        if (structure.type === 'intervals' && mainDuration > 0) {
            // Calculate how many intervals fit in the available time
            const singleIntervalDuration = structure.onDuration + structure.offDuration;
            const totalParsedTime = structure.repeat * singleIntervalDuration;

            // Check if parsed intervals fit in available time
            if (totalParsedTime <= mainDuration) {
                // Parsed intervals fit - use them and fill remaining time with easy spinning
                segments += `        <IntervalsT Repeat="${structure.repeat}" OnDuration="${structure.onDuration}" OffDuration="${structure.offDuration}" OnPower="${powers.on}" OffPower="${powers.off}" pace="0"/>\n`;

                const remainingTime = mainDuration - totalParsedTime;
                if (remainingTime > 120) { // If more than 2 minutes left, add easy spinning
                    segments += `        <SteadyState Duration="${remainingTime}" Power="${POWER_ZONES.easy.high}" pace="0"/>\n`;
                }
            } else {
                // Parsed intervals don't fit - adjust to fit available time
                // Keep the same ON duration, adjust recovery to fit
                const availableTimePerInterval = Math.floor(mainDuration / structure.repeat);
                const adjustedOffDuration = Math.max(120, availableTimePerInterval - structure.onDuration); // Min 2 min recovery

                segments += `        <IntervalsT Repeat="${structure.repeat}" OnDuration="${structure.onDuration}" OffDuration="${adjustedOffDuration}" OnPower="${powers.on}" OffPower="${powers.off}" pace="0"/>\n`;
            }

        } else if (structure.type === 'pyramid') {
            // Pyramid workout (5-10-15-10-5 min)
            const pyramidPower = powers.on;
            const recoveryPower = powers.off;
            const segments_pyramid = [300, 600, 900, 600, 300]; // 5,10,15,10,5 min in seconds
            const recovery = 180; // 3 min recovery

            segments_pyramid.forEach((seg, index) => {
                segments += `        <SteadyState Duration="${seg}" Power="${pyramidPower}" pace="0"/>\n`;
                if (index < segments_pyramid.length - 1) {
                    segments += `        <SteadyState Duration="${recovery}" Power="${recoveryPower}" pace="0"/>\n`;
                }
            });

        } else if (intensityPercentage !== null) {
            // Intensity is a percentage string (e.g., "65% FTP")
            // Use the exact percentage specified
            segments += `        <SteadyState Duration="${mainDuration}" Power="${intensityPercentage.toFixed(2)}" pace="0"/>\n`;

        } else if (intensity === 'easy') {
            // Easy endurance ride - only if NO intervals detected
            segments += `        <SteadyState Duration="${mainDuration}" Power="${POWER_ZONES.easy.high}" pace="0"/>\n`;

        } else if (intensity === 'moderate' && structure.type !== 'intervals') {
            // Tempo/Sweet Spot blocks - ONLY if no intervals detected
            const blockCount = Math.floor(mainDuration / 1200); // 20-min blocks
            const blockDuration = Math.floor(mainDuration / Math.max(1, blockCount));

            for (let i = 0; i < blockCount; i++) {
                segments += `        <SteadyState Duration="${blockDuration}" Power="${powers.on}" pace="0"/>\n`;
            }

        } else if (intensity === 'hard') {
            // Fallback: generic hard intervals
            segments += `        <IntervalsT Repeat="5" OnDuration="300" OffDuration="180" OnPower="${powers.on}" OffPower="${powers.off}" pace="0"/>\n`;
        
        } else {
            // Final fallback: steady state at threshold
            segments += `        <SteadyState Duration="${mainDuration}" Power="${powers.on}" pace="0"/>\n`;
        }

        // 3. Cooldown
        segments += `        <Cooldown Duration="${cooldownDuration}" PowerLow="0.50" PowerHigh="0.40" pace="0"/>\n`;

        return segments;
    }

    // Escape XML special characters
    function escapeXML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // Convert workout to Zwift .zwo XML format
    function generateZwoXML(workout, ftp, day, week) {
        const name = `Polarized_W${week}_${day}_${workout.name.replace(/\s+/g, '_')}`;
        const author = 'Polarized.cc';
        const segments = generateWorkoutSegments(workout);

        // Use WorkoutParser for intensity info if available
        let intensityInfo;
        if (typeof WorkoutParser !== 'undefined') {
            try {
                const parsed = WorkoutParser.parseWorkout(workout);
                intensityInfo = {
                    category: parsed.intensity.category,
                    raw: parsed.intensity.raw,
                    hasPercentage: parsed.intensity.raw && parsed.intensity.raw.includes('%')
                };
            } catch (err) {
                console.warn('Using fallback for intensity tags');
                intensityInfo = null;
            }
        }

        // Fallback to old logic if WorkoutParser not available
        if (!intensityInfo) {
            const intensity = workout.intensity || 'easy';
            const intensityPercentage = parseIntensityPercentage(intensity);
            const intensityCategory = mapIntensityToCategory(intensity);
            intensityInfo = {
                category: intensityCategory,
                raw: intensity,
                hasPercentage: intensityPercentage !== null
            };
        }

        // Build intensity tags
        let intensityTags = '';

        // Always add category tag (Easy/Moderate/Hard)
        const categoryLabel = intensityInfo.category.charAt(0).toUpperCase() + intensityInfo.category.slice(1);
        intensityTags += `        <tag name="${categoryLabel}"/>\n`;

        // If we have a percentage string, add it as additional tag
        if (intensityInfo.hasPercentage && intensityInfo.raw) {
            intensityTags += `        <tag name="${intensityInfo.raw}"/>\n`;
        }

        // Generate complete XML
        const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workout_file>
    <author>${author}</author>
    <name>${name}</name>
    <description>${escapeXML(workout.description || 'Polarized training workout')}</description>
    <sportType>bike</sportType>
    <tags>
        <tag name="Polarized"/>
${intensityTags}        <tag name="Week${week}"/>
    </tags>
    <workout>
${segments}    </workout>
</workout_file>`;

        return xml;
    }

    // Download the workout file
    function downloadWorkout(workout, ftp, day, week) {
        try {
            // Generate the XML content
            const xmlContent = generateZwoXML(workout, ftp, day, week);

            // Create blob and download
            const blob = new Blob([xmlContent], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            // Generate filename
            const filename = `Polarized_W${week}_${day}_${workout.name.replace(/[^a-z0-9]/gi, '_')}.zwo`;

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success message
            if (typeof UIModule !== 'undefined') {
                UIModule.showNotification(`Zwift workout downloaded: ${filename}`);
            }

            return true;
        } catch (error) {
            console.error('Error generating Zwift workout:', error);
            if (typeof UIModule !== 'undefined') {
                UIModule.showNotification('Error creating Zwift workout file');
            }
            return false;
        }
    }

    // Public API
    return {
        downloadWorkout: downloadWorkout,
        generateZwoXML: generateZwoXML // Exposed for testing
    };
})();

// Make globally available
window.ZwiftExport = ZwiftExport;

console.log('Zwift Export module loaded successfully');