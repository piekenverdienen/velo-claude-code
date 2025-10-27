// Strava Configuration & API Handler - PRODUCTION VERSION
const StravaConfig = {
    clientId: '168543',
    clientSecret: 'eb9621f5bb582ffdf6299ccdcb4da3815000a0ad',

    // Production mode - API is approved!
    isDevelopment: false,

    redirectUri: window.location.origin + '/app/strava-callback.html',
    scope: 'read,activity:read_all',
    authUrl: 'https://www.strava.com/oauth/authorize',

    // Zone configurations for power analysis
    powerZones: {
        zone1: { min: 0, max: 0.55 },
        zone2: { min: 0.56, max: 0.75 },
        zone3: { min: 0.76, max: 0.90 },
        zone4: { min: 0.91, max: 1.05 },
        zone5: { min: 1.06, max: 2.00 }
    },

    // Helper function to calculate days since program start
    getDaysSinceStart(date) {
        const appState = StorageModule.loadState();
        if (!appState.programStartDate) return null;

        const checkDate = new Date(date || new Date());
        checkDate.setHours(0, 0, 0, 0);

        const startDate = new Date(appState.programStartDate);
        startDate.setHours(0, 0, 0, 0);

        return Math.floor((checkDate - startDate) / (1000 * 60 * 60 * 24));
    },

    // Initialize Strava connection
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

    // Auto-sync function (runs on init and can be called manually)
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

    // Check if user has active Strava connection
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

    // Start OAuth flow
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

    // Disconnect Strava
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

    // Refresh access token
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

    // Fetch recent activities
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

    // UPDATED: Find best matching workout for ROLLING WEEK
    findBestWorkoutMatchRolling(activity, appState) {
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

        // Check if already completed using ISO date format
        const historyKey = `${activityWeek}-${activityDate.toISOString().split('T')[0]}`;
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

        return {
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
            }
        };
    },

    // Sync Activities - Manual trigger
    async syncActivities() {
        const connection = await this.checkConnection();
        if (!connection) {
            UIModule.showNotification('⚠️ No Strava connection found', 'warning');
            return null;
        }

        try {
            UIModule.showNotification('🔄 Fetching activities from Strava...');

            // Get activities
            const activities = await this.getRecentActivities(30);

            if (!activities || activities.length === 0) {
                UIModule.showNotification('No activities found');
                return [];
            }

            // Get current app state
            const appState = StorageModule.loadState();

            if (!appState.programStartDate) {
                UIModule.showNotification('⚠️ Please start your training program first', 'warning');
                return [];
            }

            // Analyze and match activities
            const matches = [];
            const unmatchedActivities = [];

            activities.forEach(activity => {
                // Include virtual rides too
                if (activity.type !== 'Ride' && activity.type !== 'VirtualRide') return;

                const match = this.findBestWorkoutMatchRolling(activity, appState);

                if (match) {
                    matches.push(match);
                } else {
                    // Only show unmatched if within program dates
                    const daysSince = this.getDaysSinceStart(new Date(activity.start_date));
                    if (daysSince >= 0) {
                        unmatchedActivities.push(activity);
                    }
                }
            });

            console.log(`📊 Sync Results:`, {
                total: activities.length,
                matched: matches.length,
                unmatched: unmatchedActivities.length
            });

            // Show sync results modal
            if (matches.length > 0 || unmatchedActivities.length > 0) {
                this.showSyncResultsModal(matches, unmatchedActivities);
            } else {
                UIModule.showNotification('No activities found within your training program dates');
            }

            return activities;

        } catch (error) {
            console.error('❌ Sync failed:', error);
            UIModule.showNotification('Failed to sync activities', 'error');
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
                                        <span style="background: ${match.confidence > 70 ? '#10b981' : match.confidence > 50 ? '#f59e0b' : '#ef4444'}; 
                                                     color: white; 
                                                     padding: 4px 12px; 
                                                     border-radius: 12px; 
                                                     font-size: 0.75rem; 
                                                     font-weight: 600;">
                                            ${match.confidence}% match
                                        </span>
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

        // Mark workouts as complete
        let completedCount = 0;

        checkboxes.forEach(checkbox => {
            const historyKey = checkbox.dataset.historyKey;
            appState.history[historyKey] = true;
            completedCount++;
        });

        // Save state
        StorageModule.saveState(appState);

        // Close modal
        modal.remove();

        // Show success
        UIModule.showNotification(`✅ ${completedCount} workout${completedCount > 1 ? 's' : ''} marked complete!`);

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
    }
};

window.StravaConfig = StravaConfig;
console.log('✅ Strava Config loaded - Production mode with rolling week support');