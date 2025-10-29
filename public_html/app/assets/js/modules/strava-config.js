// Strava Configuration & API Handler - PRODUCTION VERSION WITH ADVANCED SCORING
const StravaConfig = {
    clientId: '168543',
    clientSecret: 'eb9621f5bb582ffdf6299ccdcb4da3815000a0ad',

    // Production mode - API is approved!
    isDevelopment: false,

    redirectUri: window.location.origin + '/app/strava-callback.html',
    scope: 'read,activity:read_all',
    authUrl: 'https://www.strava.com/oauth/authorize',

    // Zone configurations for power analysis (% of FTP)
    powerZones: {
        zone1: { min: 0, max: 0.55, name: 'Recovery' },
        zone2: { min: 0.56, max: 0.75, name: 'Endurance' },
        zone3: { min: 0.76, max: 0.90, name: 'Tempo' },
        zone4: { min: 0.91, max: 1.05, name: 'Threshold' },
        zone5: { min: 1.06, max: 1.20, name: 'VO2max' },
        zone6: { min: 1.21, max: 2.50, name: 'Anaerobic' }
    },

    /**
     * Calculate days since program start
     * @param {Date|string} [date] - Date to check, defaults to today
     * @returns {number|null} Number of days since program start, or null if no start date
     */
    getDaysSinceStart(date) {
        const appState = StorageModule.loadState();
        if (!appState.programStartDate) return null;

        const checkDate = new Date(date || new Date());
        checkDate.setHours(0, 0, 0, 0);

        const startDate = new Date(appState.programStartDate);
        startDate.setHours(0, 0, 0, 0);

        return Math.floor((checkDate - startDate) / (1000 * 60 * 60 * 24));
    },

    /**
     * Initialize Strava connection and trigger auto-sync
     * @returns {Promise<boolean>} True if connection exists, false otherwise
     */
    async init() {
        console.log('🔧 Initializing Strava integration...');

        if (!AuthModule.currentUser) {
            console.log('⚠️ No user logged in - Strava integration disabled');
            return false;
        }

        const connection = await this.checkConnection();

        if (connection) {
            console.log('✅ Strava connected:', connection.athlete_name);
            // Auto-sync on init if connected
            setTimeout(() => {
                this.autoSync();
            }, 2000);
            return true;
        }

        console.log('📱 No Strava connection found');
        return false;
    },

    /**
     * Auto-sync recent Strava activities with scheduled workouts
     * Runs on init and can be called manually. Only auto-applies high confidence matches (>60%)
     * @returns {Promise<void>}
     */
    async autoSync() {
        const connection = await this.checkConnection();
        if (!connection) return;

        console.log('🔄 Starting auto-sync...');

        // Get activities from last 14 days
        const activities = await this.getRecentActivities(20);

        if (!activities || activities.length === 0) {
            console.log('No new activities to sync');
            return;
        }

        // Get app state
        const appState = StorageModule.loadState();

        // Only match activities that are not already completed
        const newMatches = [];

        activities.forEach(activity => {
            if (activity.type !== 'Ride' && activity.type !== 'VirtualRide') return;

            const match = this.findBestWorkoutMatchRolling(activity, appState);
            if (match && match.confidence > 60) { // Auto-match only high confidence
                newMatches.push(match);
            }
        });

        if (newMatches.length > 0) {
            console.log(`🎯 Found ${newMatches.length} new matches`);
            // Auto-apply high confidence matches
            this.applyMatches(newMatches, appState);
        }
    },

    /**
     * Check if user has active Strava connection
     * @returns {Promise<Object|null>} Connection data with athlete info, or null if not connected
     */
    async checkConnection() {
        if (!SupabaseConfig.client || !AuthModule.currentUser) {
            return null;
        }

        try {
            const { data, error } = await SupabaseConfig.client
                .from('strava_connections')
                .select('*')
                .eq('user_id', AuthModule.currentUser.id)
                .maybeSingle();

            if (error) {
                console.error('Error checking Strava connection:', error);
                return null;
            }

            if (data && data.expires_at) {
                const expiresAt = new Date(data.expires_at * 1000);
                const now = new Date();

                if (expiresAt <= now) {
                    console.log('🔄 Token expired, refreshing...');
                    return await this.refreshToken(data.refresh_token);
                }
            }

            return data;
        } catch (error) {
            console.error('Error checking connection:', error);
            return null;
        }
    },

    /**
     * Start Strava OAuth authorization flow
     * Redirects user to Strava for authorization
     */
    connect() {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: this.scope,
            approval_prompt: 'auto'
        });

        window.location.href = `${this.authUrl}?${params.toString()}`;
    },

    /**
     * Disconnect Strava account from user profile
     * @returns {Promise<boolean>} True if disconnected successfully
     */
    async disconnect() {
        if (!confirm('Disconnect your Strava account? Your training data will remain saved.')) {
            return false;
        }

        try {
            const { error } = await SupabaseConfig.client
                .from('strava_connections')
                .delete()
                .eq('user_id', AuthModule.currentUser.id);

            if (error) throw error;

            UIModule.showNotification('Strava disconnected successfully');

            if (window.App?.refreshUI) {
                window.App.refreshUI();
            }

            return true;
        } catch (error) {
            console.error('Error disconnecting Strava:', error);
            UIModule.showNotification('Failed to disconnect Strava', 'error');
            return false;
        }
    },

    /**
     * Refresh expired Strava access token
     * @param {string} refreshToken - Strava refresh token
     * @returns {Promise<Object|null>} Updated connection data or null on error
     */
    async refreshToken(refreshToken) {
        try {
            const response = await fetch('https://www.strava.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();

            const { error } = await SupabaseConfig.client
                .from('strava_connections')
                .update({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    expires_at: data.expires_at
                })
                .eq('user_id', AuthModule.currentUser.id);

            if (error) throw error;

            console.log('✅ Token refreshed successfully');
            return await this.checkConnection();

        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            return null;
        }
    },

    /**
     * Fetch recent activities from Strava API
     * @param {number} [limit=30] - Maximum number of activities to fetch
     * @returns {Promise<Array>} Array of Strava activities
     */
    async getRecentActivities(limit = 30) {
        const connection = await this.checkConnection();
        if (!connection) {
            console.log('No Strava connection');
            return [];
        }

        try {
            const response = await fetch(
                `https://www.strava.com/api/v3/athlete/activities?per_page=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${connection.access_token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch activities');
            }

            const activities = await response.json();
            console.log(`✅ Fetched ${activities.length} activities from Strava`);

            return activities;
        } catch (error) {
            console.error('Error fetching activities:', error);
            return [];
        }
    },

    /**
     * Fetch detailed activity streams for power/HR analysis
     * @param {number} activityId - Strava activity ID
     * @returns {Promise<Object|null>} Activity streams (watts, HR, time, etc.) or null on error
     */
    async getActivityStreams(activityId) {
        const connection = await this.checkConnection();
        if (!connection) {
            console.log('No Strava connection for streams');
            return null;
        }

        try {
            const streamTypes = ['watts', 'heartrate', 'time', 'cadence', 'moving', 'altitude'];
            const response = await fetch(
                `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=${streamTypes.join(',')}&key_by_type=true`,
                {
                    headers: {
                        'Authorization': `Bearer ${connection.access_token}`
                    }
                }
            );

            if (!response.ok) {
                console.warn(`Failed to fetch streams for activity ${activityId}`);
                return null;
            }

            const streams = await response.json();
            console.log(`✅ Fetched streams for activity ${activityId}`);
            return streams;

        } catch (error) {
            console.error('Error fetching activity streams:', error);
            return null;
        }
    },

    /**
     * Calculate time spent in each power zone
     * @param {Array<number>} wattsArray - Array of power values in watts
     * @param {number} ftp - Functional Threshold Power
     * @returns {Object|null} Time distribution across zones (zone1-zone6) or null if invalid data
     */
    calculateTimeInZones(wattsArray, ftp) {
        if (!wattsArray || !ftp || wattsArray.length === 0) {
            return null;
        }

        const zones = {
            zone1: 0,
            zone2: 0,
            zone3: 0,
            zone4: 0,
            zone5: 0,
            zone6: 0
        };

        wattsArray.forEach(watts => {
            const normalized = watts / ftp;

            if (normalized <= this.powerZones.zone1.max) zones.zone1++;
            else if (normalized <= this.powerZones.zone2.max) zones.zone2++;
            else if (normalized <= this.powerZones.zone3.max) zones.zone3++;
            else if (normalized <= this.powerZones.zone4.max) zones.zone4++;
            else if (normalized <= this.powerZones.zone5.max) zones.zone5++;
            else zones.zone6++;
        });

        // Convert counts to percentages
        const total = wattsArray.length;
        Object.keys(zones).forEach(zone => {
            zones[zone] = (zones[zone] / total) * 100;
        });

        return zones;
    },

    /**
     * Detect high-intensity intervals in power data
     * @param {Array<number>} wattsArray - Array of power values
     * @param {number} ftp - Functional Threshold Power
     * @param {number} [minIntervalSeconds=60] - Minimum duration to count as interval
     * @returns {Array<Object>} Detected intervals with start, end, duration, avgWatts
     */
    detectIntervals(wattsArray, ftp, minIntervalSeconds = 60) {
        if (!wattsArray || !ftp || wattsArray.length === 0) {
            return [];
        }

        const threshold = ftp * 1.05; // Zone 4+ = interval
        const intervals = [];
        let inInterval = false;
        let intervalStart = 0;
        let intervalWatts = [];

        wattsArray.forEach((watts, index) => {
            if (!inInterval && watts > threshold) {
                // Interval starts
                inInterval = true;
                intervalStart = index;
                intervalWatts = [watts];
            } else if (inInterval && watts > threshold) {
                // Still in interval
                intervalWatts.push(watts);
            } else if (inInterval && watts <= threshold) {
                // Interval ends - but only count if long enough
                const duration = index - intervalStart;
                if (duration >= minIntervalSeconds) {
                    intervals.push({
                        start: intervalStart,
                        end: index,
                        duration: duration,
                        avgWatts: intervalWatts.reduce((a, b) => a + b, 0) / intervalWatts.length,
                        normalizedPower: intervalWatts.reduce((a, b) => a + b, 0) / intervalWatts.length / ftp
                    });
                }
                inInterval = false;
                intervalWatts = [];
            }
        });

        return intervals;
    },

    /**
     * Score power zone accuracy based on workout intensity
     * @param {Object} timeInZones - Time distribution across zones (% in each zone)
     * @param {string} workoutIntensity - Workout intensity ('easy', 'moderate', 'hard')
     * @returns {number} Score from 0-10 based on zone compliance
     */
    scorePowerZoneAccuracy(timeInZones, workoutIntensity) {
        if (!timeInZones) return 5; // Default middle score

        let score = 0;

        switch (workoutIntensity) {
            case 'easy':
                // Easy = mainly Zone 2 (56-75% FTP)
                const easyZoneTime = timeInZones.zone2;
                if (easyZoneTime >= 80) score = 10;
                else if (easyZoneTime >= 70) score = 9;
                else if (easyZoneTime >= 60) score = 8;
                else if (easyZoneTime >= 50) score = 6;
                else score = 4;
                break;

            case 'moderate':
                // Moderate = mix of Zone 2-3 (tempo/sweet spot)
                const moderateZoneTime = timeInZones.zone2 + timeInZones.zone3;
                if (moderateZoneTime >= 75) score = 10;
                else if (moderateZoneTime >= 65) score = 9;
                else if (moderateZoneTime >= 55) score = 7;
                else score = 5;
                break;

            case 'hard':
                // Hard = significant time in Zone 4-5 (threshold/VO2max)
                const hardZoneTime = timeInZones.zone4 + timeInZones.zone5 + timeInZones.zone6;
                if (hardZoneTime >= 25) score = 10;
                else if (hardZoneTime >= 20) score = 9;
                else if (hardZoneTime >= 15) score = 8;
                else if (hardZoneTime >= 10) score = 6;
                else score = 4;
                break;

            default:
                score = 5;
        }

        return score;
    },

    /**
     * Analyze workout quality using power data and scheduled workout
     * Calculates 3 component scores: duration (30%), power zones (40%), completion (30%)
     * @param {Object} activity - Strava activity object
     * @param {Object} scheduledWorkout - Scheduled workout object with duration and intensity
     * @param {number} ftp - Functional Threshold Power
     * @returns {Promise<Object>} Quality score object with total, duration, powerZones, completion, details
     */
    async analyzeWorkoutQuality(activity, scheduledWorkout, ftp) {
        console.log(`🔬 Analyzing workout quality for: ${activity.name}`);

        // Initialize score components
        const score = {
            duration: 0,      // 30% weight
            powerZones: 0,    // 40% weight
            completion: 0,    // 30% weight
            total: 0,
            details: {}
        };

        // 1️⃣ DURATION SCORE (30%)
        const activityMinutes = Math.round(activity.moving_time / 60);
        const scheduledMinutes = scheduledWorkout.duration || 60;
        const durationRatio = activityMinutes / scheduledMinutes;

        if (durationRatio >= 0.95 && durationRatio <= 1.05) {
            score.duration = 10; // Perfect!
        } else if (durationRatio >= 0.90 && durationRatio <= 1.10) {
            score.duration = 8;  // Good
        } else if (durationRatio >= 0.85 && durationRatio <= 1.15) {
            score.duration = 6;  // Acceptable
        } else {
            score.duration = Math.max(2, 10 - Math.abs(durationRatio - 1) * 20);
        }

        score.details.duration = {
            actual: activityMinutes,
            scheduled: scheduledMinutes,
            ratio: Math.round(durationRatio * 100)
        };

        // 2️⃣ POWER ZONE ACCURACY (40%) - If power data available
        // Check both has_power (outdoor) and device_watts (Zwift/virtual)
        const hasPowerData = activity.has_power || activity.device_watts || activity.average_watts;

        if (hasPowerData && ftp) {
            const streams = await this.getActivityStreams(activity.id);

            if (streams && streams.watts && streams.watts.data) {
                const wattsData = streams.watts.data;
                const timeInZones = this.calculateTimeInZones(wattsData, ftp);

                score.powerZones = this.scorePowerZoneAccuracy(timeInZones, scheduledWorkout.intensity);
                score.details.timeInZones = timeInZones;

                // 3️⃣ INTERVAL COMPLETION (30%) - For hard workouts
                if (scheduledWorkout.intensity === 'hard') {
                    const intervals = this.detectIntervals(wattsData, ftp);

                    // Expected 4-6 intervals for most hard workouts
                    const expectedIntervals = 5;
                    const intervalScore = Math.min(10, (intervals.length / expectedIntervals) * 10);

                    score.completion = intervalScore;
                    score.details.intervals = {
                        detected: intervals.length,
                        expected: expectedIntervals,
                        details: intervals
                    };
                } else {
                    // For easy/moderate, completion = duration compliance
                    score.completion = score.duration;
                }
            } else {
                console.warn('No power streams available, using defaults');
                score.powerZones = 5;
                score.completion = score.duration;
            }
        } else {
            // No power data - use simpler scoring
            console.log('No power data available for this activity');
            score.powerZones = activity.average_watts ?
                this.estimateIntensityScore(activity.average_watts, ftp, scheduledWorkout.intensity) : 5;
            score.completion = score.duration;
            score.details.noPowerData = true;
        }

        // 📊 CALCULATE WEIGHTED TOTAL (1-10 scale)
        score.total = Math.round(
            (score.duration * 0.30) +
            (score.powerZones * 0.40) +
            (score.completion * 0.30)
        );

        score.details.breakdown = {
            duration: `${score.duration}/10 (30% weight)`,
            powerZones: `${score.powerZones}/10 (40% weight)`,
            completion: `${score.completion}/10 (30% weight)`
        };

        console.log(`📊 Workout Score: ${score.total}/10`, score.details);

        return score;
    },

    // Helper: Estimate intensity score from average watts (fallback)
    estimateIntensityScore(avgWatts, ftp, scheduledIntensity) {
        if (!ftp) return 5;

        const intensity = avgWatts / ftp;

        if (scheduledIntensity === 'easy' && intensity >= 0.56 && intensity <= 0.75) return 9;
        if (scheduledIntensity === 'moderate' && intensity >= 0.76 && intensity <= 0.90) return 9;
        if (scheduledIntensity === 'hard' && intensity >= 0.91) return 9;

        return 5; // Mismatch
    },

    // UPDATED: Find best matching workout for ROLLING WEEK WITH QUALITY SCORING
    async findBestWorkoutMatchRolling(activity, appState) {
        if (!appState.programStartDate) return null;

        const activityDate = new Date(activity.start_date);
        const daysSinceStart = this.getDaysSinceStart(activityDate);

        if (daysSinceStart === null || daysSinceStart < 0) {
            // Activity before program start
            return null;
        }

        // Calculate which week and day this activity belongs to
        const activityWeek = Math.floor(daysSinceStart / 7) + 1;
        const dayInWeek = daysSinceStart % 7; // 0-6

        // Check if activity is within program range
        if (activityWeek > (appState.schedule ? Object.keys(appState.schedule).length : 6)) {
            return null;
        }

        // Get the scheduled workout for this day
        const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const scheduleDay = allDays[dayInWeek];
        const scheduledWorkout = appState.schedule?.[activityWeek]?.[scheduleDay];

        if (!scheduledWorkout) {
            return null; // Rest day or no workout scheduled
        }

        // Use dayIndex for history key consistency
        const historyKey = `${activityWeek}-${dayInWeek}`;
        if (appState.history[historyKey]) {
            return null; // Already marked as complete
        }

        // Calculate match score
        const activityDuration = Math.round(activity.moving_time / 60);
        const scheduledDuration = scheduledWorkout.duration || 60;
        const durationDiff = Math.abs(activityDuration - scheduledDuration);

        // Duration score (0-100)
        let durationScore = 100;
        if (durationDiff <= 5) durationScore = 100;
        else if (durationDiff <= 10) durationScore = 90;
        else if (durationDiff <= 15) durationScore = 75;
        else if (durationDiff <= 20) durationScore = 60;
        else if (durationDiff <= 30) durationScore = 40;
        else durationScore = Math.max(0, 100 - (durationDiff * 2));

        // Intensity matching (if we have power data)
        let intensityScore = 50; // Default if no power data
        if (activity.average_watts && appState.ftp) {
            const activityIntensity = (activity.average_watts / appState.ftp) * 100;

            // Map to zones
            let activityZone = 'easy';
            if (activityIntensity > 90) activityZone = 'hard';
            else if (activityIntensity > 75) activityZone = 'moderate';

            if (activityZone === scheduledWorkout.intensity) {
                intensityScore = 100;
            } else if (
                (activityZone === 'moderate' && scheduledWorkout.intensity === 'easy') ||
                (activityZone === 'moderate' && scheduledWorkout.intensity === 'hard')
            ) {
                intensityScore = 70;
            } else {
                intensityScore = 30;
            }
        }

        // Date match bonus (activity on the exact scheduled day)
        const dateBonus = 20; // Always give bonus since it's on the right day

        // Calculate total confidence
        const confidence = Math.round(
            (durationScore * 0.5) +
            (intensityScore * 0.3) +
            dateBonus
        );

        if (confidence < 40) {
            return null; // Too low confidence
        }

        // 🆕 Calculate quality score asynchronously if possible (note: sync version for compatibility)
        const match = {
            activity: activity,
            workout: scheduledWorkout,
            week: activityWeek,
            dayInWeek: dayInWeek + 1, // 1-7 for display
            actualDate: activityDate,
            historyKey: historyKey,
            confidence: confidence,
            details: {
                activityDuration: activityDuration,
                scheduledDuration: scheduledDuration,
                durationDiff: durationDiff,
                activityName: activity.name,
                workoutName: scheduledWorkout.name
            },
            qualityScore: null // Will be calculated later in sync flow
        };

        return match;
    },

    /**
     * Sync Activities - Manual trigger
     * Fetches recent Strava activities and matches them with planned workouts
     * @returns {Promise<Array|null>} Array of activities or null on error
     */
    async syncActivities() {
        const connection = await this.checkConnection();
        if (!connection) {
            UIModule.showNotification('⚠️ No Strava connection found', 'warning');
            return null;
        }

        try {
            // Show loading spinner
            UIModule.showLoading('Connecting to Strava...', 'Fetching your recent activities');

            // Get activities
            const activities = await this.getRecentActivities(30);

            if (!activities || activities.length === 0) {
                UIModule.hideLoading();
                UIModule.showNotification('No activities found');
                return [];
            }

            // Get current app state
            const appState = StorageModule.loadState();

            if (!appState.programStartDate) {
                UIModule.hideLoading();
                UIModule.showNotification('⚠️ Please start your training program first', 'warning');
                return [];
            }

            UIModule.updateLoading('Analyzing workouts...', `Found ${activities.length} activities`);

            // Analyze and match activities
            const matches = [];
            const unmatchedActivities = [];
            let processedCount = 0;
            const totalRides = activities.filter(a => a.type === 'Ride' || a.type === 'VirtualRide').length;

            for (const activity of activities) {
                // Include virtual rides too
                if (activity.type !== 'Ride' && activity.type !== 'VirtualRide') continue;

                processedCount++;
                UIModule.updateLoading(
                    'Matching activities to workouts...',
                    `Processing activity ${processedCount}/${totalRides}`
                );

                const match = await this.findBestWorkoutMatchRolling(activity, appState);

                if (match) {
                    // Calculate quality score if power data available
                    // Check both has_power (outdoor rides) and device_watts (Zwift/virtual)
                    const hasPowerData = activity.has_power || activity.device_watts || activity.average_watts;

                    if (hasPowerData && appState.ftp) {
                        UIModule.updateLoading(
                            'Calculating quality scores...',
                            `Analyzing ${match.activity.name.substring(0, 30)}...`
                        );

                        try {
                            const qualityScore = await this.analyzeWorkoutQuality(
                                match.activity,
                                match.workout,
                                appState.ftp
                            );
                            match.qualityScore = qualityScore;
                            console.log(`✅ Quality score for ${match.activity.name}: ${qualityScore.total}/10`);
                        } catch (error) {
                            console.warn(`⚠️ Failed to calculate quality score:`, error);
                            match.qualityScore = null;
                        }
                    }
                    matches.push(match);
                } else {
                    // Only show unmatched if within program dates
                    const daysSince = this.getDaysSinceStart(new Date(activity.start_date));
                    if (daysSince >= 0) {
                        unmatchedActivities.push(activity);
                    }
                }
            }

            console.log(`📊 Sync Results:`, {
                total: activities.length,
                matched: matches.length,
                unmatched: unmatchedActivities.length
            });

            // Store matches for confirmSyncMatches to access
            this.currentSyncMatches = matches;

            // Hide loading spinner before showing modal
            UIModule.hideLoading();

            // Show sync results modal
            if (matches.length > 0 || unmatchedActivities.length > 0) {
                this.showSyncResultsModal(matches, unmatchedActivities);
            } else {
                UIModule.showNotification('No activities found within your training program dates');
            }

            return activities;

        } catch (error) {
            UIModule.hideLoading();
            console.error('❌ Sync failed:', error);
            UIModule.showNotification('Failed to sync with Strava. Check your connection and try again.', 'error');
            return null;
        }
    },

    // UPDATED: Show sync results modal for rolling weeks
    showSyncResultsModal(matches, unmatchedActivities) {
        // Remove existing modal if present
        const existing = document.getElementById('strava-sync-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'strava-sync-modal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content" style="max-width: 700px;">
                <div class="auth-modal-header">
                    <h3>🔄 Strava Sync Results</h3>
                    <button class="close-modal" onclick="document.getElementById('strava-sync-modal').remove()">&times;</button>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                        <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${matches.length}</div>
                            <div style="color: #9ca3af; font-size: 0.875rem;">Matched</div>
                        </div>
                        <div style="background: rgba(99, 102, 241, 0.1); padding: 16px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: #6366f1;">${unmatchedActivities.length}</div>
                            <div style="color: #9ca3af; font-size: 0.875rem;">Unmatched</div>
                        </div>
                        <div style="background: rgba(139, 92, 246, 0.1); padding: 16px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6;">${matches.length + unmatchedActivities.length}</div>
                            <div style="color: #9ca3af; font-size: 0.875rem;">Total</div>
                        </div>
                    </div>
                    
                    ${matches.length > 0 ? `
                        <h4 style="margin-bottom: 12px; color: #374151;">✅ Matched Workouts (${matches.length})</h4>
                        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 16px;">
                            These activities match your scheduled workouts:
                        </p>
                        
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${matches.map((match, index) => `
                                <div class="match-item" style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 2px solid #e5e7eb;">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                                                ${match.activity.name}
                                            </div>
                                            <div style="font-size: 0.875rem; color: #6b7280;">
                                                📅 ${match.actualDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })} •
                                                ⏱️ ${match.details.activityDuration} min
                                                ${match.activity.average_watts ? ` • ⚡ ${Math.round(match.activity.average_watts)}W` : ''}
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 8px; flex-direction: column; align-items: flex-end;">
                                            <span style="background: ${match.confidence > 70 ? '#10b981' : match.confidence > 50 ? '#f59e0b' : '#ef4444'};
                                                         color: white;
                                                         padding: 4px 12px;
                                                         border-radius: 12px;
                                                         font-size: 0.75rem;
                                                         font-weight: 600;">
                                                ${match.confidence}% match
                                            </span>
                                            ${match.qualityScore ? `
                                                <span style="background: ${
                                                    match.qualityScore.total >= 8 ? '#10b981' :
                                                    match.qualityScore.total >= 6 ? '#f59e0b' :
                                                    '#ef4444'
                                                };
                                                             color: white;
                                                             padding: 4px 12px;
                                                             border-radius: 12px;
                                                             font-size: 0.75rem;
                                                             font-weight: 600;
                                                             display: flex;
                                                             align-items: center;
                                                             gap: 4px;">
                                                    <span style="font-size: 0.9rem;">⭐</span>
                                                    ${match.qualityScore.total}/10 quality
                                                </span>
                                            ` : ''}
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; align-items: center; gap: 8px; padding: 12px; background: white; border-radius: 6px;">
                                        <span style="font-size: 1.2rem;">→</span>
                                        <div style="flex: 1;">
                                            <div style="font-size: 0.875rem; color: #6b7280;">Matches:</div>
                                            <div style="font-weight: 600; color: #8b5cf6;">
                                                Week ${match.week}, Day ${match.dayInWeek}: ${match.workout.name}
                                            </div>
                                            <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 2px;">
                                                Scheduled: ${match.details.scheduledDuration} min
                                            </div>
                                        </div>
                                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                            <input type="checkbox" 
                                                   class="match-checkbox" 
                                                   data-index="${index}" 
                                                   data-history-key="${match.historyKey}"
                                                   data-activity-id="${match.activity.id}"
                                                   ${match.confidence > 70 ? 'checked' : ''}
                                                   style="width: 20px; height: 20px; cursor: pointer;">
                                            <span style="font-size: 0.875rem; color: #6b7280;">Confirm</span>
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="color: #6b7280; text-align: center;">No matched workouts found</p>'}
                    
                    ${unmatchedActivities.length > 0 ? `
                        <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
                            <h4 style="margin-bottom: 12px; color: #374151;">ℹ️ Unmatched Activities (${unmatchedActivities.length})</h4>
                            <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 12px;">
                                These rides don't match any scheduled workouts:
                            </p>
                            <div style="max-height: 150px; overflow-y: auto;">
                                ${unmatchedActivities.slice(0, 5).map(activity => `
                                    <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 8px; font-size: 0.875rem;">
                                        <div style="font-weight: 500; color: #374151;">${activity.name}</div>
                                        <div style="color: #6b7280;">
                                            ${new Date(activity.start_date).toLocaleDateString()} • 
                                            ${Math.round(activity.moving_time / 60)} min
                                            ${activity.average_watts ? ` • ${Math.round(activity.average_watts)}W` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                                ${unmatchedActivities.length > 5 ? `
                                    <div style="color: #6b7280; font-size: 0.875rem; text-align: center; padding: 8px;">
                                        + ${unmatchedActivities.length - 5} more unmatched activities
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-secondary" 
                            onclick="document.getElementById('strava-sync-modal').remove()"
                            style="padding: 12px 24px;">
                        Cancel
                    </button>
                    ${matches.length > 0 ? `
                        <button class="btn btn-primary" 
                                onclick="StravaConfig.confirmSyncMatches()"
                                style="padding: 12px 24px;">
                            ✅ Confirm Selected
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Update button text when checkboxes change
        if (matches.length > 0) {
            const checkboxes = modal.querySelectorAll('.match-checkbox');
            const confirmBtn = modal.querySelector('.btn-primary');

            const updateCount = () => {
                const checkedCount = modal.querySelectorAll('.match-checkbox:checked').length;
                if (confirmBtn) {
                    confirmBtn.textContent = checkedCount > 0 ?
                        `✅ Confirm Selected (${checkedCount})` :
                        '✅ Confirm Selected';
                }
            };

            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', updateCount);
            });

            updateCount();
        }
    },

    // UPDATED: Confirm and apply selected matches for rolling weeks
    confirmSyncMatches() {
        const modal = document.getElementById('strava-sync-modal');
        const checkboxes = modal.querySelectorAll('.match-checkbox:checked');

        if (checkboxes.length === 0) {
            UIModule.showNotification('No workouts selected');
            return;
        }

        // Get app state
        const appState = StorageModule.loadState();

        // Initialize workoutScores if not exists
        if (!appState.workoutScores) {
            appState.workoutScores = {};
        }

        // Mark workouts as complete and save quality scores
        let completedCount = 0;

        checkboxes.forEach(checkbox => {
            const historyKey = checkbox.dataset.historyKey;
            const activityId = checkbox.dataset.activityId;

            // Mark as complete
            appState.history[historyKey] = true;

            // Save quality score if available
            const match = this.currentSyncMatches?.find(m => m.activity.id === activityId);
            if (match && match.qualityScore) {
                appState.workoutScores[historyKey] = {
                    total: match.qualityScore.total,
                    duration: match.qualityScore.duration,
                    powerZones: match.qualityScore.powerZones,
                    completion: match.qualityScore.completion,
                    activityId: activityId,
                    syncedAt: new Date().toISOString()
                };
                console.log(`💾 Saved quality score for ${historyKey}: ${match.qualityScore.total}/10`);
            }

            completedCount++;
        });

        // Save state
        StorageModule.saveState(appState);

        // Sync workout scores to Supabase (async, non-blocking)
        if (Object.keys(appState.workoutScores).length > 0) {
            this.syncWorkoutScoresToSupabase(appState.workoutScores).then(result => {
                if (result.success && result.synced > 0) {
                    console.log(`✅ Synced ${result.synced} workout scores to Supabase`);
                }
            }).catch(error => {
                console.error('❌ Failed to sync scores to Supabase:', error);
            });
        }

        // Close modal
        modal.remove();

        // Show success with quality score info
        const avgScore = Object.values(appState.workoutScores)
            .filter(s => s.total)
            .reduce((sum, s, i, arr) => sum + s.total / arr.length, 0);

        const message = avgScore > 0
            ? `✅ ${completedCount} workout${completedCount > 1 ? 's' : ''} marked complete! Avg quality: ${avgScore.toFixed(1)}/10`
            : `✅ ${completedCount} workout${completedCount > 1 ? 's' : ''} marked complete!`;

        UIModule.showNotification(message);

        // Refresh UI
        if (window.App?.refreshUI) {
            setTimeout(() => {
                window.App.refreshUI();
            }, 500);
        }
    },

    // Apply matches automatically (for auto-sync)
    applyMatches(matches, appState) {
        let applied = 0;

        matches.forEach(match => {
            if (!appState.history[match.historyKey]) {
                appState.history[match.historyKey] = true;
                applied++;
            }
        });

        if (applied > 0) {
            StorageModule.saveState(appState);
            UIModule.showNotification(`✅ Auto-synced ${applied} workout${applied > 1 ? 's' : ''}!`);

            if (window.App?.refreshUI) {
                setTimeout(() => {
                    window.App.refreshUI();
                }, 500);
            }
        }
    },

    // === SUPABASE SYNC FUNCTIONS ===

    // Save workout score to Supabase
    async saveWorkoutScoreToSupabase(historyKey, scoreData) {
        const client = SupabaseConfig?.getClient();
        if (!client) {
            console.warn('⚠️ Supabase not initialized, skipping score sync');
            return false;
        }

        try {
            const { data: { user } } = await client.auth.getUser();
            if (!user) {
                console.warn('⚠️ No user logged in, skipping score sync');
                return false;
            }

            const { error } = await client
                .from('workout_scores')
                .upsert({
                    user_id: user.id,
                    history_key: historyKey,
                    activity_id: scoreData.activityId,
                    total_score: scoreData.total,
                    duration_score: scoreData.duration,
                    power_zones_score: scoreData.powerZones,
                    completion_score: scoreData.completion,
                    synced_at: scoreData.syncedAt || new Date().toISOString()
                }, {
                    onConflict: 'user_id,history_key'
                });

            if (error) {
                console.error('❌ Failed to save workout score to Supabase:', error);
                return false;
            }

            console.log(`✅ Workout score saved to Supabase: ${historyKey}`);
            return true;

        } catch (error) {
            console.error('❌ Error saving workout score to Supabase:', error);
            return false;
        }
    },

    // Batch sync all workout scores to Supabase
    async syncWorkoutScoresToSupabase(workoutScores) {
        const client = SupabaseConfig?.getClient();
        if (!client) {
            console.warn('⚠️ Supabase not initialized, skipping scores sync');
            return { success: false, synced: 0 };
        }

        try {
            const { data: { user } } = await client.auth.getUser();
            if (!user) {
                console.warn('⚠️ No user logged in, skipping scores sync');
                return { success: false, synced: 0 };
            }

            const records = Object.entries(workoutScores).map(([historyKey, scoreData]) => ({
                user_id: user.id,
                history_key: historyKey,
                activity_id: scoreData.activityId,
                total_score: scoreData.total,
                duration_score: scoreData.duration,
                power_zones_score: scoreData.powerZones,
                completion_score: scoreData.completion,
                synced_at: scoreData.syncedAt || new Date().toISOString()
            }));

            if (records.length === 0) {
                return { success: true, synced: 0 };
            }

            const { error } = await client
                .from('workout_scores')
                .upsert(records, {
                    onConflict: 'user_id,history_key'
                });

            if (error) {
                console.error('❌ Failed to sync workout scores to Supabase:', error);
                return { success: false, synced: 0 };
            }

            console.log(`✅ Synced ${records.length} workout scores to Supabase`);
            return { success: true, synced: records.length };

        } catch (error) {
            console.error('❌ Error syncing workout scores to Supabase:', error);
            return { success: false, synced: 0 };
        }
    },

    // Fetch workout scores from Supabase
    async fetchWorkoutScoresFromSupabase() {
        const client = SupabaseConfig?.getClient();
        if (!client) {
            console.warn('⚠️ Supabase not initialized, skipping scores fetch');
            return null;
        }

        try {
            const { data: { user } } = await client.auth.getUser();
            if (!user) {
                console.warn('⚠️ No user logged in, skipping scores fetch');
                return null;
            }

            const { data, error } = await client
                .from('workout_scores')
                .select('*')
                .eq('user_id', user.id)
                .order('synced_at', { ascending: false });

            if (error) {
                console.error('❌ Failed to fetch workout scores from Supabase:', error);
                return null;
            }

            // Convert to the same format as localStorage
            const workoutScores = {};
            data.forEach(record => {
                workoutScores[record.history_key] = {
                    total: record.total_score,
                    duration: record.duration_score,
                    powerZones: record.power_zones_score,
                    completion: record.completion_score,
                    activityId: record.activity_id,
                    syncedAt: record.synced_at
                };
            });

            console.log(`✅ Fetched ${data.length} workout scores from Supabase`);
            return workoutScores;

        } catch (error) {
            console.error('❌ Error fetching workout scores from Supabase:', error);
            return null;
        }
    }
};

window.StravaConfig = StravaConfig;
console.log('✅ Strava Config loaded - Production mode with rolling week support');