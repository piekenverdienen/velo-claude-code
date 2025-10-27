// Global RPE submit function
window.submitRPE = function (day, week, rpe) {
    const notes = document.getElementById('rpeNotes')?.value || '';

    // Convert day to dayIndex if it's a day name
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let dayIndex = day;
    if (typeof day === 'string' && days.includes(day)) {
        dayIndex = days.indexOf(day);
    }

    const workoutKey = `${week}-${dayIndex}`;

    // Get current state
    let appState = StorageModule.loadState();

    // Initialize rpeHistory as array if not exists
    if (!appState.rpeHistory) {
        appState.rpeHistory = [];
    }

    // Check if we already have RPE for this workout
    const existingIndex = appState.rpeHistory.findIndex(r => r.workoutKey === workoutKey);

    const rpeData = {
        workoutKey: workoutKey,
        rpe: rpe,
        notes: notes,
        date: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        // Update existing
        appState.rpeHistory[existingIndex] = rpeData;
    } else {
        // Add new
        appState.rpeHistory.push(rpeData);
    }

    // Save state
    StorageModule.saveState(appState);

    // Show notification
    UIModule.showNotification(`RPE ${rpe} saved! Great work!`);

    // Refresh UI
    setTimeout(() => {
        if (window.App && window.App.refreshUI) {
            window.App.refreshUI();
        }
    }, 1500);
};

// Main App - Brengt alles samen
const App = (function () {
    'use strict';

    // App state
    let appState = {};

    // Initialize app
    async function init() {
        console.log('Initializing Polarized Training App...');

        // Wait for required modules to load
        let attempts = 0;
        while (!window.StorageModule && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.StorageModule) {
            console.error('StorageModule failed to load');
            return;
        }

        // Initialize Supabase Authentication
        const supabaseReady = await SupabaseConfig.init();
        if (supabaseReady) {
            await AuthModule.init();
        }

        // Initialize Strava if user is logged in
        if (AuthModule.currentUser && window.StravaConfig) {
            await StravaConfig.init();
        }

        // Load saved state
        appState = StorageModule.loadState();

        // Rest van je bestaande code...
        if (!appState.rpeHistory) {
            appState.rpeHistory = [];
        }

        // If program is started, ensure we're on the correct week
        if (appState.intakeCompleted && appState.programStartDate) {
            const actualWeek = calculateCurrentWeek();
            // Update currentWeek if it's different (user opens app days later)
            if (!appState.currentWeek || appState.currentWeek !== actualWeek) {
                appState.currentWeek = actualWeek;
                StorageModule.saveState(appState);
                console.log('📅 Updated to current week:', actualWeek);
            }
        }

        if (appState.intakeCompleted) {
            showMainApp();
        } else {
            showIntake();
        }

        setupEventListeners();
        setupWeeklyAdapterObserver();
    }

    // Add this new function right after init
    function setupWeeklyAdapterObserver() {
        const observer = new MutationObserver(function (mutations) {
            const btn = document.getElementById('adaptWeekBtn');
            if (btn && !btn.onclick) {
                btn.onclick = function () { App.openWeeklyAdapter(); };
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Calculate which week we're currently in based on program start date
    // A training week is ALWAYS 7 full days from the start date
    function calculateCurrentWeek() {
        if (!appState.programStartDate) {
            // If no start date set, default to week 1
            return 1;
        }

        const startDate = new Date(appState.programStartDate);
        // Reset to start of day for accurate calculation
        startDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate days since start (including start day as day 0)
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

        // Calculate week number
        // Days 0-6 = Week 1, Days 7-13 = Week 2, etc.
        const weekNumber = Math.floor(daysSinceStart / 7) + 1;

        // Cap at total weeks
        return Math.min(Math.max(1, weekNumber), APP_CONFIG.weeks.total);
    }

    // NEW: Map actual calendar day to training day INDEX based on start day
    function getTrainingDayIndex(calendarDay) {
        if (!appState.programStartDay) {
            // If no start day set, use Monday as day 0
            const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            return allDays.indexOf(calendarDay);
        }

        const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const startDayIndex = allDays.indexOf(appState.programStartDay);
        const currentDayIndex = allDays.indexOf(calendarDay);

        if (startDayIndex === -1 || currentDayIndex === -1) {
            return currentDayIndex; // Fallback
        }

        // Calculate training day index (0-6)
        // If started on Sat (index 5), Sat becomes training day 0, Sun becomes training day 1, etc.
        let trainingDayIndex = (currentDayIndex - startDayIndex + 7) % 7;

        return trainingDayIndex;
    }

    // NEW: Get the workout for today based on rolling week logic
    function getWorkoutForDay(calendarDay, week) {
        const trainingDayIndex = getTrainingDayIndex(calendarDay);
        const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Use training day index to get the workout from the schedule
        // Schedule is still stored as Mon-Sun, but we access it by index
        const trainingDay = allDays[trainingDayIndex];

        return appState.schedule?.[week]?.[trainingDay];
    }

    // NEW: Get actual date for a training day index in a specific week
    function getActualDateForTrainingDayIndex(trainingDayIndex, week) {
        if (!appState.programStartDate) return null;

        const startDate = new Date(appState.programStartDate);
        startDate.setHours(0, 0, 0, 0);

        // Calculate days offset from start
        // Week 1, Day 0 = start date + 0 days
        // Week 1, Day 1 = start date + 1 day
        // Week 2, Day 0 = start date + 7 days
        const daysFromStart = ((week - 1) * 7) + trainingDayIndex;

        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + daysFromStart);

        return targetDate;
    }

    // Show intake form
    function showIntake() {
        document.getElementById('intakeSection').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        UIModule.renderIntakeForm();
    }

    // Show main app
    function showMainApp() {
        document.getElementById('intakeSection').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        // Update welcome message
        const welcomeText = document.getElementById('welcomeText');
        if (appState.userName && appState.userName !== APP_CONFIG.defaults.userName) {
            welcomeText.textContent = APP_CONFIG.messages.welcomeWithName.replace('{name}', appState.userName);
        }

        // Render UI components
        UIModule.renderNavTabs();
        UIModule.renderContentArea();

        // Update current view
        updateToday();
        updateStats();

        // Show welcome banner if not logged in and not dismissed
        setTimeout(() => {
            if (!AuthModule.currentUser &&
                !sessionStorage.getItem('bannerDismissed') &&
                !sessionStorage.getItem('continueWithoutAccount')) {
                AuthModule.showWelcomeBanner();
            }
        }, 1000);

        // Load settings values including name and weight
        setTimeout(() => {
            const settingsName = document.getElementById('settingsName');
            const settingsFTP = document.getElementById('settingsFTP');
            const settingsWeight = document.getElementById('settingsWeight');

            if (settingsName && appState.userName) {
                settingsName.value = appState.userName;
            }
            if (settingsFTP && appState.ftp) {
                settingsFTP.value = appState.ftp;
            }
            if (settingsWeight && appState.weight) {
                settingsWeight.value = appState.weight;
            }
        }, 100);

        // Load CyclingClub content automatically
        setTimeout(() => {
            if (typeof CyclingClubModule !== 'undefined') {
                CyclingClubModule.renderContent();
                console.log('✅ CyclingClub content loaded');
            } else {
                console.warn('⚠️ CyclingClubModule not available yet');
            }
        }, 300);

        // Update Strava status in settings
        setTimeout(() => {
            if (typeof UIModule.updateStravaStatus === 'function') {
                UIModule.updateStravaStatus();
            }
        }, 500);
    }

    // Update today's workout view - ALWAYS shows the ACTUAL today
    function updateToday() {
        const todayWorkoutDiv = document.getElementById('todayWorkout');
        if (!todayWorkoutDiv) return;

        // Get the ACTUAL today (real calendar day)
        const calendarDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });

        // Calculate which week we're actually in based on start date
        const actualWeek = calculateCurrentWeek();

        // Get training day index (which workout in the week plan)
        const trainingDayIndex = getTrainingDayIndex(calendarDay);

        // Get today's workout using the rolling week logic
        const todayWorkout = getWorkoutForDay(calendarDay, actualWeek);

        // 🔍 DEBUG CODE - Check what's happening
        console.log('🚴 Today Workout Debug:', {
            realDay: calendarDay,
            actualWeek: actualWeek,
            trainingDayIndex: trainingDayIndex,
            todayWorkout: todayWorkout,
            fullSchedule: appState.schedule?.[actualWeek],
            programStartDay: appState.programStartDay
        });

        // Update week display in Today tab to show which week today belongs to
        UIModule.updateElement('currentWeekDisplay', actualWeek);

        // Calculate actual date for display
        const actualDate = new Date();
        const dateString = actualDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });

        if (!todayWorkout || !todayWorkout.name) {
            todayWorkoutDiv.innerHTML = `
                <div class="workout-card">
                    <div style="text-align: center; margin-bottom: 16px; color: var(--text-secondary);">
                        <strong>${dateString}</strong>
                    </div>
                    <h3 class="workout-title">${APP_CONFIG.messages.noWorkout}</h3>
                    <p class="workout-description">${APP_CONFIG.messages.enjoyRest}</p>
                    <div class="workout-actions">
                        <button class="btn btn-secondary" onclick="App.switchTab('week')">View Week →</button>
                    </div>
                </div>
            `;
            return;
        }

        // Add date header to workout card
        const dateHeader = `
            <div style="text-align: center; margin-bottom: 16px; padding: 12px; background: rgba(168, 85, 247, 0.1); border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.3);">
                <strong style="color: var(--primary-light);">${dateString}</strong>
                <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 4px;">
                    Week ${actualWeek}, Day ${trainingDayIndex + 1}
                </div>
            </div>
        `;

        // For history tracking, we use trainingDayIndex + week for consistency
        const historyKey = `${actualWeek}-${trainingDayIndex}`;
        const isCompleted = appState.history[historyKey] || false;

        todayWorkoutDiv.innerHTML = dateHeader + WorkoutModule.generateWorkoutCard(
            todayWorkout,
            trainingDayIndex,
            actualWeek,
            isCompleted,
            appState
        );
    }

    // Update week view - ENHANCED VERSION WITH REAL CALENDAR DAYS
    function updateWeekView() {
        const weekOverviewDiv = document.getElementById('weekOverview');
        if (!weekOverviewDiv) return;

        const weekSchedule = appState.schedule?.[appState.currentWeek];

        if (!weekSchedule) {
            weekOverviewDiv.innerHTML = '<p style="text-align: center; color: var(--accent);">No schedule available for this week.</p>';
            return;
        }

        // Clear and rebuild
        weekOverviewDiv.innerHTML = '';

        // Calculate week totals
        let totalMinutes = 0;
        let hardMinutes = 0;
        let moderateMinutes = 0;
        let easyMinutes = 0;
        let workoutCount = 0;

        // Count based on training schedule (still Mon-Sun internally)
        const trainingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        trainingDays.forEach(day => {
            const workout = weekSchedule[day];
            if (workout && workout.duration) {
                totalMinutes += workout.duration;
                workoutCount++;
                if (workout.intensity === 'hard') hardMinutes += workout.duration;
                else if (workout.intensity === 'moderate') moderateMinutes += workout.duration;
                else if (workout.intensity === 'easy') easyMinutes += workout.duration;
            }
        });

        // ✅ FIX 1: Update week display number in Week tab
        UIModule.updateElement('currentWeekDisplay2', appState.currentWeek);

        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        const hardPercent = totalMinutes > 0 ? Math.round(((hardMinutes + moderateMinutes) / totalMinutes) * 100) : 0;
        const easyPercent = totalMinutes > 0 ? Math.round((easyMinutes / totalMinutes) * 100) : 0;

        // Week totals display
        weekOverviewDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px;">
                <div style="background: rgba(168, 85, 247, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.3); text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Total Time</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-light);">${totalHours}h</div>
                </div>
                <div style="background: rgba(168, 85, 247, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.3); text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Workouts</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-light);">${workoutCount}</div>
                </div>
                <div style="background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3); text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Easy/Base</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${easyPercent}%</div>
                </div>
                <div style="background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Hard</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${hardPercent}%</div>
                </div>
            </div>
        `;

        // Adapter button
        const adaptBtn = document.createElement('button');
        adaptBtn.className = 'btn btn-secondary';
        adaptBtn.id = 'adaptWeekBtn';
        adaptBtn.style.cssText = 'width: 100%; margin-bottom: 20px;';
        adaptBtn.textContent = '⚡ Adjust this week - Adapt to your available time';
        adaptBtn.title = 'Adjust your training schedule';
        adaptBtn.onclick = function () { App.openWeeklyAdapter(); };
        weekOverviewDiv.appendChild(adaptBtn);

        // Show if week is adapted
        if (appState.weeklyAdaptations?.[appState.currentWeek]) {
            const indicator = document.createElement('div');
            indicator.style.cssText = 'background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: white; padding: 8px; border-radius: 8px; margin-bottom: 16px; text-align: center;';
            indicator.innerHTML = `
                ⚡ Week Adapted - 
                <button onclick="App.removeWeeklyAdaptation()" 
                        style="background: rgba(239, 68, 68, 0.5); 
                               border: none; color: white; 
                               padding: 4px 12px; border-radius: 4px; 
                               cursor: pointer; margin-left: 8px;">
                    Restore Original
                </button>
            `;
            weekOverviewDiv.appendChild(indicator);
        }

        // Build workout cards - Loop through training day indices (0-6)
        let html = `<div style="display: grid; gap: 16px;">`;

        for (let trainingDayIndex = 0; trainingDayIndex < 7; trainingDayIndex++) {
            // Get the actual calendar date for this training day
            const actualDate = getActualDateForTrainingDayIndex(trainingDayIndex, appState.currentWeek);
            const calendarDay = actualDate ? actualDate.toLocaleDateString('en-US', { weekday: 'short' }) : trainingDays[trainingDayIndex];
            const dateString = actualDate ? actualDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

            // Get the workout from schedule using training day index
            const trainingDay = trainingDays[trainingDayIndex];
            const workout = weekSchedule[trainingDay];

            // History uses trainingDayIndex for consistent tracking
            const historyKey = `${appState.currentWeek}-${trainingDayIndex}`;
            const isCompleted = appState.history[historyKey] || false;

            if (!workout) {
                html += `
                    <div class="workout-card" style="opacity: 0.7;">
                        <h4>${calendarDay} ${dateString ? '- ' + dateString : ''} - Rest Day</h4>
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">Day ${trainingDayIndex + 1} of the week</p>
                    </div>
                `;
            } else {
                const intensityConfig = APP_CONFIG.intensityConfig[workout.intensity || 'easy'];
                const rpeData = appState.rpeHistory?.find(r => r.workoutKey === historyKey);
                const qualityScore = appState.workoutScores?.[historyKey];
                const duration = workout.duration || 60;
                const hours = duration >= 60 ? Math.floor(duration / 60) : 0;
                const mins = duration % 60;
                const timeDisplay = hours > 0 ? `${hours}h ${mins > 0 ? mins + 'min' : ''}` : `${mins}min`;

                html += `
                    <div class="workout-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <div>
                                <h4 style="margin: 0;">${calendarDay} ${dateString ? '- ' + dateString : ''}</h4>
                                <p style="margin: 4px 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">Day ${trainingDayIndex + 1}: ${workout.name}</p>
                            </div>
                            <span style="color: #a855f7; font-size: 1rem; font-weight: 600;">
                                ⏱️ ${timeDisplay}
                            </span>
                        </div>
                        <div class="workout-badges" style="margin-top: 12px;">
                            ${WorkoutModule.getIntensityBadge(workout.intensity)}
                            ${isCompleted ? '<span class="badge badge-easy">✅ Done</span>' : ''}
                            ${rpeData ? `<span class="badge" style="background: #10b981;">RPE: ${rpeData.rpe}</span>` : ''}
                            ${qualityScore ? `<span class="badge" style="background: ${qualityScore.total >= 8 ? '#10b981' : qualityScore.total >= 6 ? '#f59e0b' : '#ef4444'};">⭐ ${qualityScore.total}/10</span>` : ''}
                            ${workout.adapted ? '<span class="badge" style="background: #6366f1;">⚡ Adapted</span>' : ''}
                        </div>
                        <p class="workout-description">${intensityConfig.description}</p>
                        <div class="workout-actions">
                            ${!isCompleted ? `<button class="btn btn-primary" onclick="App.completeWorkout('${trainingDay}', ${appState.currentWeek})">${APP_CONFIG.labels.markComplete}</button>` : ''}
                            <button class="btn btn-secondary" onclick="App.viewWorkoutDetails('${trainingDay}')">${APP_CONFIG.labels.viewDetails}</button>
                            ${APP_CONFIG.features.enableWorkoutSwap ? `<button class="btn btn-secondary" onclick="App.swapWorkout('${trainingDay}', ${appState.currentWeek})">${APP_CONFIG.labels.swapWorkout}</button>` : ''}
                        </div>
                    </div>
                `;
            }
        }

        html += `</div>`;
        weekOverviewDiv.innerHTML += html;
    }

    // Update stats
    function updateStats() {
        if (!appState.schedule) return;

        const progress = ProgressModule.calculateProgress(appState);

        UIModule.updateElement('completionRate', `${progress.completionRate}%`);
        UIModule.updateElement('streak', progress.currentStreak);
        UIModule.updateElement('weekMinutes', progress.currentWeekMinutes);
    }

    // Update progress tab
    function updateProgress() {
        const progressContainer = document.getElementById('progressOverview');
        if (!progressContainer) return;

        const progress = ProgressModule.calculateProgress(appState);
        progressContainer.innerHTML = ProgressModule.generateProgressHTML(progress, appState);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Add any global event listeners here
        console.log('Event listeners setup complete');
    }

    // Public API
    return {
        init: init,
        state: appState,

        // Calculate W/kg
        calculateWkg: function () {
            const ftp = document.getElementById('userFTP')?.value;
            const weight = document.getElementById('userWeight')?.value;

            if (ftp && weight && parseInt(ftp) > 0 && parseFloat(weight) > 0) {
                const wkg = (parseInt(ftp) / parseFloat(weight)).toFixed(2);
                appState.wkg = wkg;
                UIModule.updateWkgDisplay(wkg);
            }
        },

        // UI refresh methods
        updateToday: updateToday,
        refreshUI: function () {
            updateToday();
            updateWeekView();
            updateStats();

            // Also refresh Strava status in settings
            if (typeof UIModule.updateStravaStatus === 'function') {
                UIModule.updateStravaStatus();
            }
        },

        // Intake methods
        selectGoal: function (goal) {
            document.querySelectorAll('#step1 .selection-card').forEach(card => {
                UIModule.removeClass(card, 'selected');
            });
            document.querySelector(`[data-goal="${goal}"]`)?.classList.add('selected');
            appState.goal = goal;
            document.getElementById('btnStep1').disabled = false;
        },

        selectTime: function (time) {
            document.querySelectorAll('#step3 .selection-card').forEach(card => {
                UIModule.removeClass(card, 'selected');
            });
            document.querySelector(`[data-time="${time}"]`)?.classList.add('selected');
            appState.timeCommitment = time;
            document.getElementById('btnStep3').disabled = false;
        },

        validateDays: function () {
            const checkedDays = document.querySelectorAll('input[type="checkbox"][id^="day"]:checked');
            const daysError = document.getElementById('daysError');
            const btnStep2 = document.getElementById('btnStep2');

            if (checkedDays.length >= 3) {
                daysError.style.display = 'none';
                btnStep2.disabled = false;
                appState.preferredDays = Array.from(checkedDays).map(cb => cb.value);
            } else {
                daysError.style.display = 'block';
                btnStep2.disabled = true;
            }
        },

        nextStep: function (step) {
            if (step === 3) {
                // Save user data
                const userName = document.getElementById('userName')?.value.trim();
                const ftp = document.getElementById('userFTP')?.value;
                const weight = document.getElementById('userWeight')?.value;

                if (userName) {
                    appState.userName = userName;
                }
                if (ftp) {
                    appState.ftp = parseInt(ftp);
                }
                if (weight) {
                    appState.weight = parseInt(weight);
                }

                // Save immediately
                if (window.StorageModule) {
                    StorageModule.saveState(appState);
                    console.log('✅ Saved user data:', {
                        userName: appState.userName,
                        weight: appState.weight,
                        ftp: appState.ftp
                    });
                }

                // Show time recommendations based on W/kg
                if (appState.ftp && appState.weight) {
                    const wkg = (appState.ftp / appState.weight).toFixed(2);
                    appState.wkg = wkg;
                    UIModule.updateWkgDisplay(wkg);
                }
            }

            UIModule.navigateToStep(step);
        },

        previousStep: function (step) {
            UIModule.navigateToStep(step);
        },

        generatePlan: function () {
            // Generate schedule
            appState.schedule = ScheduleModule.generateSchedule(
                appState.goal,
                appState.timeCommitment,
                appState.preferredDays
            );

            UIModule.navigateToStep(4);
        },

        startApp: function () {
            // Set program start date to today if not already set
            if (!appState.programStartDate) {
                const now = new Date();
                appState.programStartDate = now.toISOString();

                // Also save which day of the week we started on
                appState.programStartDay = now.toLocaleDateString('en-US', { weekday: 'short' });

                console.log('🎯 Program started on:', appState.programStartDay, appState.programStartDate);
            }

            appState.intakeCompleted = true;
            appState.currentWeek = 1; // Start at week 1
            StorageModule.saveState(appState);
            showMainApp();
        },

        // Navigation
        switchTab: function (tabName) {
            UIModule.switchTab(tabName);

            if (tabName === 'week') {
                updateWeekView();
            } else if (tabName === 'progress') {
                updateProgress();
            } else if (tabName === 'cyclingclub') {
                if (typeof CyclingClubModule !== 'undefined') {
                    CyclingClubModule.renderContent();
                    console.log('✅ CyclingClub content loaded on tab switch');
                }
            } else if (tabName === 'settings') {
                // Update Strava status when settings tab is opened
                setTimeout(() => {
                    if (typeof UIModule.updateStravaStatus === 'function') {
                        UIModule.updateStravaStatus();
                    }
                }, 100);
            }
        },

        changeWeek: function (direction) {
            const newWeek = appState.currentWeek + direction;
            if (newWeek >= 1 && newWeek <= APP_CONFIG.weeks.total) {
                appState.currentWeek = newWeek;
                StorageModule.saveState(appState);
                // Only update Week view, NOT Today view
                updateWeekView();
                updateStats();
            }
        },

        // Jump to the current week in Week view
        jumpToCurrentWeek: function () {
            const actualWeek = calculateCurrentWeek();
            appState.currentWeek = actualWeek;
            StorageModule.saveState(appState);
            this.switchTab('week');
            updateWeekView();
            updateStats();
        },

        // Workout methods
        completeWorkout: function (day, week) {
            // Convert day to dayIndex if it's a day name (Mon, Tue, etc.)
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            let dayIndex = day;

            // If day is a string (day name), convert to index
            if (typeof day === 'string' && days.includes(day)) {
                dayIndex = days.indexOf(day);
            }

            // Use consistent key format: week-dayIndex (number)
            const key = `${week || appState.currentWeek}-${dayIndex}`;
            appState.history[key] = true;
            StorageModule.saveState(appState);

            updateToday();
            updateWeekView();
            updateStats();

            UIModule.showNotification(APP_CONFIG.messages.workoutCompleted);
        },

        swapWorkout: function (day, week) {
            // Convert dayIndex to day name if needed
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            let dayName = day;

            // If day is a number (dayIndex), convert to day name
            if (typeof day === 'number' || (!isNaN(day) && !days.includes(day))) {
                dayName = days[parseInt(day)];
            }

            const currentWorkout = appState.schedule[week || appState.currentWeek][dayName];

            if (!currentWorkout) {
                UIModule.showNotification('No workout found for this day');
                return;
            }

            const alternative = WorkoutModule.findAlternativeWorkout(currentWorkout, appState.goal);

            if (alternative) {
                // Handle duration - could be a number or an object
                let workoutDuration;
                if (typeof alternative.duration === 'object' && alternative.duration !== null) {
                    workoutDuration = alternative.duration[appState.timeCommitment] || alternative.duration.enthusiast || 60;
                } else {
                    workoutDuration = alternative.duration || currentWorkout.duration || 60;
                }

                appState.schedule[week || appState.currentWeek][dayName] = {
                    ...alternative,
                    duration: workoutDuration
                };

                StorageModule.saveState(appState);
                updateToday();
                UIModule.showNotification(APP_CONFIG.messages.workoutSwapped);
            } else {
                UIModule.showNotification(APP_CONFIG.messages.noAlternative);
            }
        },

        viewWorkoutDetails: function (day) {
            UIModule.switchTab('today');

            // Convert day to dayIndex if it's a day name
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            let dayIndex = day;
            if (typeof day === 'string' && days.includes(day)) {
                dayIndex = days.indexOf(day);
            }

            const workout = appState.schedule?.[appState.currentWeek]?.[day];
            const historyKey = `${appState.currentWeek}-${dayIndex}`;
            const isCompleted = appState.history[historyKey] || false;

            const todayWorkoutDiv = document.getElementById('todayWorkout');
            if (!todayWorkoutDiv) return;

            if (!workout) {
                todayWorkoutDiv.innerHTML = `
                    <div class="workout-card">
                        <h3 class="workout-title">No workout scheduled for ${day}</h3>
                        <p class="workout-description">This day is a rest day or no workout is planned.</p>
                        <div class="workout-actions">
                            <button class="btn btn-secondary" onclick="App.switchTab('week')">Back to Week View</button>
                        </div>
                    </div>
                `;
                return;
            }

            todayWorkoutDiv.innerHTML = `
                <div class="info-box" style="margin-bottom: 20px; background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3);">
                    <h4>📅 Viewing ${day}'s Workout - Week ${appState.currentWeek}</h4>
                    <p style="margin: 8px 0 0 0;">
                        <button class="btn btn-secondary" onclick="App.updateToday()" style="padding: 8px 16px; font-size: 0.875rem;">
                            ← Back to Today
                        </button>
                        <button class="btn btn-secondary" onclick="App.switchTab('week')" style="padding: 8px 16px; font-size: 0.875rem; margin-left: 8px;">
                            ← Back to Week View
                        </button>
                    </p>
                </div>
                ${WorkoutModule.generateWorkoutCard(workout, dayIndex, appState.currentWeek, isCompleted, appState)}
            `;
        },

        downloadZwiftWorkout: function (day, week) {
            // Convert dayIndex to day name if needed
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            let dayName = day;

            // If day is a number (dayIndex), convert to day name
            if (typeof day === 'number' || (!isNaN(day) && !days.includes(day))) {
                dayName = days[parseInt(day)];
            }

            const workout = appState.schedule[week || appState.currentWeek][dayName];

            if (!workout) {
                UIModule.showNotification('No workout found for this day');
                return;
            }

            if (typeof ZwiftExport === 'undefined') {
                UIModule.showNotification('Zwift export not available. Please refresh the page.');
                return;
            }

            const success = ZwiftExport.downloadWorkout(
                workout,
                appState.ftp,
                dayName,
                week || appState.currentWeek
            );

            if (success) {
                console.log('Zwift workout downloaded successfully');
            }
        },

        resetRPE: function (day, week) {
            // Convert day to dayIndex if it's a day name
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            let dayIndex = day;
            if (typeof day === 'string' && days.includes(day)) {
                dayIndex = days.indexOf(day);
            }

            const workoutKey = `${week}-${dayIndex}`;

            if (appState.rpeHistory) {
                const index = appState.rpeHistory.findIndex(r => r.workoutKey === workoutKey);
                if (index >= 0) {
                    appState.rpeHistory.splice(index, 1);
                    StorageModule.saveState(appState);
                    updateToday();
                    UIModule.showNotification('RPE removed - you can now enter a new value');
                }
            }
        },

        saveSettings: function () {
            const newName = document.getElementById('settingsName')?.value.trim();
            const newFTP = document.getElementById('settingsFTP')?.value;
            const newWeight = document.getElementById('settingsWeight')?.value;

            if (newName) {
                appState.userName = newName;
            }

            if (newFTP && parseInt(newFTP) > 0) {
                appState.ftp = parseInt(newFTP);
            }

            if (newWeight && parseFloat(newWeight) > 0) {
                appState.weight = parseFloat(newWeight);
            }

            if (window.StorageModule) {
                StorageModule.saveState(appState);
                console.log('✅ Settings saved:', {
                    userName: appState.userName,
                    weight: appState.weight,
                    ftp: appState.ftp
                });
            }

            updateToday();
            updateWeekView();
            UIModule.showNotification(APP_CONFIG.messages.settingsSaved || 'Settings saved!');
        },

        resetApp: function () {
            if (confirm(APP_CONFIG.messages.resetConfirm)) {
                StorageModule.resetState();
                location.reload();
            }
        },

        // Weekly Adapter Methods
        openWeeklyAdapter: function () {
            if (!document.getElementById('weeklyAdapterModal')) {
                this.createAdapterModal();
            }

            const modal = document.getElementById('weeklyAdapterModal');
            const weekNum = appState.currentWeek;

            document.getElementById('adaptWeekNumber').textContent = weekNum;

            const existingSlots = appState.weeklyAdaptations?.[weekNum]?.timeSlots || {};

            window.currentTimeSlots = Object.keys(existingSlots).length > 0 ?
                JSON.parse(JSON.stringify(existingSlots)) :
                { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

            this.renderTimeSelection(weekNum);
            modal.classList.add('active');
        },

        createAdapterModal: function () {
            const modalHTML = `
                <div id="weeklyAdapterModal" class="adapter-modal">
                    <div class="adapter-modal-content">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin: 0;">⚡ Adapt Week <span id="adaptWeekNumber">1</span></h2>
                            <button onclick="App.closeAdapterModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">×</button>
                        </div>

                        <div class="info-box" style="margin-bottom: 20px;">
                            <h4>How much time do you have this week?</h4>
                            <p>Select your available time for each day. We'll intelligently redistribute your workouts while maintaining polarized principles.</p>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h4 style="margin-bottom: 12px;">Quick Templates:</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
                                <button class="quick-action-btn" onclick="App.setWeekTemplate('minimal')">⚡ Minimal (3h)</button>
                                <button class="quick-action-btn" onclick="App.setWeekTemplate('moderate')">🚴 Moderate (5h)</button>
                                <button class="quick-action-btn" onclick="App.setWeekTemplate('full')">💪 Full Week (8h)</button>
                                <button class="quick-action-btn" onclick="App.setWeekTemplate('weekend')">🏖️ Weekend Warrior</button>
                            </div>
                        </div>

                        <div id="timeSelectionContainer"></div>

                        <div class="info-box" style="margin-top: 20px; background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.3);">
                            <h4>📊 Adaptation Preview</h4>
                            <p>Total time: <strong><span id="totalHoursPreview">0</span>h</strong> across <strong><span id="workoutsPreview">0</span> days</strong></p>
                            <p id="recommendationText" style="margin-top: 8px; color: var(--accent);"></p>
                        </div>

                        <div class="adaptation-actions">
                            <button class="btn btn-cancel" onclick="App.closeAdapterModal()">Cancel</button>
                            <button class="btn btn-primary" onclick="App.applyWeeklyAdaptation()">
                                🚀 Apply Adaptation
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        renderTimeSelection: function (weekNum) {
            const container = document.getElementById('timeSelectionContainer');
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

            let html = `<div class="time-selection-grid">`;

            days.forEach((day, index) => {
                const currentValue = window.currentTimeSlots[day] || 0;
                html += `
                    <div class="time-slot-day">
                        <label class="day-label">${dayNames[index]}</label>
                        <div class="time-options">
                            ${[0, 30, 60, 90, 120].map(minutes => `
                                <button class="time-btn ${currentValue === minutes ? 'selected' : ''}" 
                                        data-day="${day}" 
                                        data-minutes="${minutes}"
                                        onclick="App.setDayTime('${day}', ${minutes})">
                                    ${minutes === 0 ? '❌' : minutes === 30 ? '⚡' : minutes === 60 ? '🚴' : minutes === 90 ? '💪' : '🚀'}
                                    ${minutes === 0 ? 'None' : minutes >= 120 ? '2h+' : minutes + 'm'}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;
        },

        setDayTime: function (day, minutes) {
            window.currentTimeSlots[day] = minutes;

            document.querySelectorAll(`[data-day="${day}"]`).forEach(btn => {
                btn.classList.remove('selected');
                if (parseInt(btn.dataset.minutes) === minutes) {
                    btn.classList.add('selected');
                }
            });

            this.updateAdaptationPreview();
        },

        closeAdapterModal: function () {
            const modal = document.getElementById('weeklyAdapterModal');
            if (modal) modal.classList.remove('active');
        },

        updateAdaptationPreview: function () {
            if (!window.currentTimeSlots || typeof WeeklyAdapter === 'undefined') return;

            const analysis = WeeklyAdapter.analyzeWeekAvailability(window.currentTimeSlots);

            document.getElementById('totalHoursPreview').textContent = analysis.totalHours;
            document.getElementById('workoutsPreview').textContent = analysis.availableDays;

            const recText = document.getElementById('recommendationText');
            if (analysis.totalHours < 3) {
                recText.textContent = '⚠️ Limited time - key workouts only.';
            } else if (analysis.totalHours < 5) {
                recText.textContent = '⚡ Moderate - essential workouts preserved.';
            } else {
                recText.textContent = '✅ Good availability!';
            }
        },

        setWeekTemplate: function (template) {
            const templates = {
                minimal: { Mon: 0, Tue: 45, Wed: 0, Thu: 60, Fri: 0, Sat: 90, Sun: 0 },
                moderate: { Mon: 0, Tue: 60, Wed: 45, Thu: 60, Fri: 0, Sat: 90, Sun: 60 },
                full: { Mon: 60, Tue: 75, Wed: 45, Thu: 75, Fri: 0, Sat: 120, Sun: 90 },
                weekend: { Mon: 0, Tue: 30, Wed: 0, Thu: 30, Fri: 0, Sat: 150, Sun: 120 }
            };

            window.currentTimeSlots = templates[template] || {};
            this.renderTimeSelection(appState.currentWeek);
            this.updateAdaptationPreview();
        },

        applyWeeklyAdaptation: function () {
            const weekNum = appState.currentWeek;
            const timeSlots = window.currentTimeSlots;

            if (!timeSlots || Object.values(timeSlots).every(v => v === 0)) {
                UIModule.showNotification('Set your available time first');
                return;
            }

            if (typeof WeeklyAdapter === 'undefined') {
                UIModule.showNotification('Weekly Adapter not loaded. Please check weekly-adapter.js');
                return;
            }

            if (!appState.originalSchedule) {
                appState.originalSchedule = {};
            }
            if (!appState.originalSchedule[weekNum]) {
                appState.originalSchedule[weekNum] = JSON.parse(JSON.stringify(appState.schedule[weekNum]));
            }

            const result = WeeklyAdapter.adaptSchedule(
                appState.originalSchedule,
                weekNum,
                timeSlots,
                {
                    preferredDays: appState.preferredDays,
                    goal: appState.goal
                }
            );

            if (!appState.weeklyAdaptations) {
                appState.weeklyAdaptations = {};
            }

            appState.weeklyAdaptations[weekNum] = {
                timeSlots: timeSlots,
                adaptedSchedule: result.schedule,
                summary: result.summary,
                appliedAt: new Date().toISOString()
            };

            appState.schedule[weekNum] = result.schedule;

            StorageModule.saveState(appState);

            updateToday();
            updateWeekView();
            updateStats();

            UIModule.showNotification(
                `Week adapted! ${result.summary.adaptedWorkouts} workouts, ${result.summary.polarizationScore}% polarization.`
            );

            this.closeAdapterModal();
        },

        removeWeeklyAdaptation: function () {
            const weekNum = appState.currentWeek;

            if (appState.originalSchedule?.[weekNum]) {
                appState.schedule[weekNum] = JSON.parse(JSON.stringify(appState.originalSchedule[weekNum]));
                delete appState.weeklyAdaptations[weekNum];

                StorageModule.saveState(appState);

                updateToday();
                updateWeekView();
                updateStats();

                UIModule.showNotification('Week restored to original plan');
            }
        }
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
console.log('App.js loaded successfully');