// Progress Module - Berekent en toont voortgang
const ProgressModule = (function () {
    'use strict';

    return {
        // UPDATED: Bereken algemene voortgang met dayIndex-based history keys
        calculateProgress: function (appState) {
            let totalWorkouts = 0;
            let completedWorkouts = 0;
            let totalMinutes = 0;
            let weekStats = [];

            for (let week = 1; week <= APP_CONFIG.weeks.total; week++) {
                const weekSchedule = appState.schedule[week];
                let weekWorkouts = 0;
                let weekCompleted = 0;
                let weekMinutes = 0;

                if (weekSchedule) {
                    // Loop through days using dayIndex
                    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    days.forEach((day, dayIndex) => {
                        const workout = weekSchedule[day];
                        if (workout && workout.intensity !== 'rest' && workout.name !== 'Rest Day') {
                            weekWorkouts++;
                            totalWorkouts++;

                            // Use consistent history key format: week-dayIndex
                            const historyKey = `${week}-${dayIndex}`;

                            if (appState.history[historyKey]) {
                                weekCompleted++;
                                completedWorkouts++;
                                weekMinutes += workout.duration || 0;
                                totalMinutes += workout.duration || 0;
                            }
                        }
                    });
                }

                weekStats.push({
                    week: week,
                    total: weekWorkouts,
                    completed: weekCompleted,
                    minutes: weekMinutes,
                    rate: weekWorkouts > 0 ? Math.round((weekCompleted / weekWorkouts) * 100) : 0
                });
            }

            return {
                totalWorkouts,
                completedWorkouts,
                totalMinutes,
                completionRate: totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0,
                weekStats
            };
        },

        // UPDATED: Bereken week statistieken met dayIndex
        calculateWeekStats: function (appState) {
            const weekSchedule = appState.schedule[appState.currentWeek];
            let weekWorkouts = 0;
            let weekCompleted = 0;
            let weekMinutes = 0;

            if (weekSchedule) {
                // Loop through days using dayIndex
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                days.forEach((day, dayIndex) => {
                    const workout = weekSchedule[day];
                    if (workout && workout.intensity !== 'rest') {
                        weekWorkouts++;

                        // Use consistent history key format: week-dayIndex
                        const historyKey = `${appState.currentWeek}-${dayIndex}`;

                        if (appState.history[historyKey]) {
                            weekCompleted++;
                            weekMinutes += workout.duration || 0;
                        }
                    }
                });
            }

            // UPDATED: Calculate streak with rolling week logic
            let streak = 0;
            let maxStreak = 0;
            let currentStreak = 0;

            // Check last 30 days of workouts
            if (appState.programStartDate) {
                const startDate = new Date(appState.programStartDate);
                const today = new Date();
                const totalDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
                const daysToCheck = Math.min(totalDays, 30);

                for (let daysAgo = 0; daysAgo < daysToCheck; daysAgo++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(today.getDate() - daysAgo);

                    // Calculate which week and day index this date falls on
                    const daysSinceStart = Math.floor((checkDate - startDate) / (1000 * 60 * 60 * 24));
                    const weekNumber = Math.floor(daysSinceStart / 7) + 1;
                    const dayIndex = daysSinceStart % 7;

                    if (weekNumber > 0 && weekNumber <= APP_CONFIG.weeks.total) {
                        const historyKey = `${weekNumber}-${dayIndex}`;

                        if (appState.history[historyKey]) {
                            currentStreak++;
                            if (daysAgo === 0) {
                                streak = currentStreak;
                            }
                        } else if (daysAgo === 0) {
                            // Today is not completed, so current streak is 0
                            streak = 0;
                            currentStreak = 0;
                        } else {
                            // Break in streak
                            if (currentStreak > maxStreak) {
                                maxStreak = currentStreak;
                            }
                            currentStreak = 0;
                        }
                    }
                }

                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
            }

            return {
                completionRate: weekWorkouts > 0 ? Math.round((weekCompleted / weekWorkouts) * 100) : 0,
                streak: streak,
                weekMinutes: weekMinutes,
                currentStreak: streak,
                currentWeekMinutes: weekMinutes
            };
        },

        // Genereer progress HTML (blijft grotendeels hetzelfde)
        generateProgressHTML: function (progress, appState) {
            // Calculate current week stats for display
            const currentWeekStats = this.calculateWeekStats(appState);

            let html = `
                <div class="stats-grid" style="margin-bottom: 32px;">
                    <div class="stat-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-value">${progress.completionRate}%</div>
                        <div class="stat-label">Overall Progress</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🚴</div>
                        <div class="stat-value">${progress.completedWorkouts}</div>
                        <div class="stat-label">Workouts Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${Math.round(progress.totalMinutes / 60)}h</div>
                        <div class="stat-label">Total Hours</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value">${currentWeekStats.streak}</div>
                        <div class="stat-label">Current Streak</div>
                    </div>
                </div>
                
                <h3 style="font-size: 1.5rem; margin-bottom: 16px; text-align: center;">Week by Week Breakdown</h3>
                <div style="display: grid; gap: 16px; margin-top: 24px;">
            `;

            progress.weekStats.forEach(week => {
                const isCurrent = week.week === appState.currentWeek;
                const weekDesc = APP_CONFIG.weeks.descriptions[week.week] || `Week ${week.week}`;

                // Calculate actual dates for this week
                let weekDateRange = '';
                if (appState.programStartDate) {
                    const startDate = new Date(appState.programStartDate);
                    const weekStartDate = new Date(startDate);
                    weekStartDate.setDate(startDate.getDate() + ((week.week - 1) * 7));
                    const weekEndDate = new Date(weekStartDate);
                    weekEndDate.setDate(weekStartDate.getDate() + 6);

                    weekDateRange = `${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }

                // Determine progress color
                let progressColor = '#ef4444'; // red
                if (week.rate >= 80) progressColor = '#10b981'; // green
                else if (week.rate >= 60) progressColor = '#f59e0b'; // yellow
                else if (week.rate >= 40) progressColor = '#f97316'; // orange

                html += `
                    <div class="workout-card ${isCurrent ? 'current-week' : ''}">
                        <h4 style="font-size: 1.25rem; margin-bottom: 16px; color: white;">
                            Week ${week.week} - ${weekDesc} ${isCurrent ? '(Current)' : ''}
                        </h4>
                        ${weekDateRange ? `<p style="font-size: 0.875rem; color: var(--text-secondary); margin: -8px 0 16px 0;">${weekDateRange}</p>` : ''}
                        
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="color: var(--text-secondary);">Progress</span>
                                <span style="font-weight: 700; color: ${progressColor};">${week.rate}%</span>
                            </div>
                            <div style="background: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: ${progressColor}; height: 100%; width: ${week.rate}%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 16px;">
                            <div style="text-align: center;">
                                <div style="font-size: 1.75rem; font-weight: 700; color: var(--primary-light);">
                                    ${week.completed}/${week.total}
                                </div>
                                <div style="color: var(--accent); font-size: 0.875rem;">Workouts</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.75rem; font-weight: 700; color: var(--success);">
                                    ${Math.round(week.minutes / 60 * 10) / 10}h
                                </div>
                                <div style="color: var(--accent); font-size: 0.875rem;">Training Time</div>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += '</div>';

            // Add achievements based on progress
            if (progress.completionRate >= 80) {
                html += `
                    <div class="info-box" style="margin-top: 32px; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                        <h4>🏆 Outstanding Progress!</h4>
                        <p>You're crushing it with ${progress.completionRate}% completion rate! Keep up the amazing work!</p>
                    </div>
                `;
            } else if (progress.completionRate >= 60) {
                html += `
                    <div class="info-box" style="margin-top: 32px; background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3);">
                        <h4>💪 Great Progress!</h4>
                        <p>You're at ${progress.completionRate}% completion rate. You're doing great, keep pushing!</p>
                    </div>
                `;
            } else if (progress.completionRate >= 40) {
                html += `
                    <div class="info-box" style="margin-top: 32px; background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3);">
                        <h4>⚡ Building Momentum!</h4>
                        <p>You're at ${progress.completionRate}% completion rate. Every workout counts, keep going!</p>
                    </div>
                `;
            }

            // Add total stats summary
            const totalHours = Math.round(progress.totalMinutes / 60 * 10) / 10;
            const avgWorkoutsPerWeek = Math.round(progress.completedWorkouts / APP_CONFIG.weeks.total * 10) / 10;

            html += `
                <div class="info-box" style="margin-top: 32px; background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.3);">
                    <h4>📊 Training Summary</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-top: 16px;">
                        <div>
                            <strong>Total Training Time:</strong><br>
                            ${totalHours} hours
                        </div>
                        <div>
                            <strong>Average per Week:</strong><br>
                            ${avgWorkoutsPerWeek} workouts
                        </div>
                        <div>
                            <strong>Program Progress:</strong><br>
                            Week ${appState.currentWeek} of ${APP_CONFIG.weeks.total}
                        </div>
                    </div>
                </div>
            `;

            return html;
        },

        // Bereken TSS (Training Stress Score) estimate - blijft hetzelfde
        calculateTSS: function (workout, ftp) {
            if (!workout || !workout.duration || !workout.powerZone) return 0;

            // Simpele TSS schatting op basis van intensiteit
            const intensityFactors = {
                easy: 0.5,      // ~50-65% FTP
                moderate: 0.75, // ~75-85% FTP  
                hard: 0.95      // ~90-105% FTP
            };

            const IF = intensityFactors[workout.intensity] || 0.5;
            const hours = workout.duration / 60;

            // TSS = (sec × NP × IF) / (FTP × 3600) × 100
            // Simplified: TSS = hours × IF² × 100
            return Math.round(hours * IF * IF * 100);
        }
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.ProgressModule = ProgressModule;
}

console.log('✅ ProgressModule loaded successfully');