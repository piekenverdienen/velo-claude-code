// UI Module - Beheert UI updates en interacties
const UIModule = (function () {
    'use strict';

    return {
        // Toon notificatie
        showNotification: function (message) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        },

        // Update element text
        updateElement: function (id, text) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        },

        // Update element HTML
        updateElementHTML: function (id, html) {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = html;
            }
        },

        // Toggle class
        toggleClass: function (element, className) {
            if (element) {
                element.classList.toggle(className);
            }
        },

        // Add class
        addClass: function (element, className) {
            if (element) {
                element.classList.add(className);
            }
        },

        // Remove class
        removeClass: function (element, className) {
            if (element) {
                element.classList.remove(className);
            }
        },

        // Navigeer naar stap (intake)
        navigateToStep: function (step) {
            // Verberg alle stappen
            document.querySelectorAll('.intake-step').forEach(s => {
                this.removeClass(s, 'active');
            });

            // Toon huidige stap
            const currentStep = document.getElementById(`step${step}`);
            if (currentStep) {
                this.addClass(currentStep, 'active');
            }

            // Update progress bar
            for (let i = 1; i <= 4; i++) {
                const progressStep = document.getElementById(`progress${i}`);
                if (progressStep) {
                    if (i < step) {
                        this.addClass(progressStep, 'completed');
                        this.removeClass(progressStep, 'active');
                    } else if (i === step) {
                        this.addClass(progressStep, 'active');
                        this.removeClass(progressStep, 'completed');
                    } else {
                        this.removeClass(progressStep, 'active');
                        this.removeClass(progressStep, 'completed');
                    }
                }
            }
        },

        // Switch tab
        switchTab: function (tabName) {
            // Update tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                this.removeClass(tab, 'active');
            });
            document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

            // Update content
            document.querySelectorAll('.content-section').forEach(section => {
                this.removeClass(section, 'active');
            });
            const activeSection = document.getElementById(`${tabName}Tab`);
            if (activeSection) {
                this.addClass(activeSection, 'active');
            }
        },

        // Update Strava status in settings - BRAND COMPLIANT VERSION
        updateStravaStatus: async function () {
            const container = document.getElementById('stravaStatus');
            if (!container) return;

            // Check if user is logged in
            if (!AuthModule.currentUser) {
                container.innerHTML = `
            <div style="text-align: center; padding: 24px;">
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;">🔒</div>
                <h4 style="margin: 0 0 8px 0; color: var(--text-secondary);">
                    Login Required
                </h4>
                <p style="color: var(--text-tertiary); font-size: 0.875rem;">
                    Please log in to connect your Strava account
                </p>
            </div>
        `;
                return;
            }

            // Check Strava connection
            if (typeof StravaConfig === 'undefined') {
                container.innerHTML = `
            <div style="text-align: center; padding: 24px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">⏳</div>
                <p style="color: var(--text-secondary);">Loading Strava integration...</p>
            </div>
        `;
                return;
            }

            const connection = await StravaConfig.checkConnection();

            if (connection) {
                // ✅ CONNECTED STATE - BRAND COMPLIANT
                container.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 20px;">
                <!-- Strava Official Logo -->
                <div style="flex-shrink: 0;">
                    <div style="width: 64px; height: 64px; 
                                background: #FC4C02;
                                border-radius: 12px; 
                                display: flex; align-items: center; justify-content: center;
                                padding: 12px;
                                box-shadow: 0 4px 12px rgba(252, 76, 2, 0.3);">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" fill="white"/>
                        </svg>
                    </div>
                </div>
                
                <!-- Connection Info -->
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <h4 style="margin: 0; color: white; font-size: 1.25rem;">
                            Strava Connected
                        </h4>
                        <span style="background: #10b981; color: white; 
                                     padding: 2px 8px; border-radius: 12px; 
                                     font-size: 0.75rem; font-weight: 600;">
                            ✓ ACTIVE
                        </span>
                    </div>
                    
                    <div style="color: var(--text-secondary); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span style="font-size: 1.1rem;">👤</span>
                            <strong>${connection.athlete_name}</strong>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-tertiary);">
                            Athlete ID: ${connection.athlete_id}
                        </div>
                    </div>
                    
                    <!-- Features List -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                                gap: 8px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 8px; 
                                    color: var(--text-secondary); font-size: 0.9rem;">
                            <span style="color: #10b981;">✓</span>
                            <span>Auto workout detection</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; 
                                    color: var(--text-secondary); font-size: 0.9rem;">
                            <span style="color: #10b981;">✓</span>
                            <span>Power zone analysis</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; 
                                    color: var(--text-secondary); font-size: 0.9rem;">
                            <span style="color: #10b981;">✓</span>
                            <span>Activity syncing</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; 
                                    color: var(--text-secondary); font-size: 0.9rem;">
                            <span style="color: #10b981;">✓</span>
                            <span>Training load tracking</span>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                        <button class="btn btn-primary" 
                                onclick="StravaConfig.syncActivities()"
                                style="padding: 10px 20px;">
                            🔄 Sync Recent Activities
                        </button>
                        
                        <a href="https://www.strava.com/athletes/${connection.athlete_id}" 
                           target="_blank"
                           style="color: #FC4C02; 
                                  font-size: 0.9rem; 
                                  font-weight: 600;
                                  text-decoration: none;
                                  border-bottom: 1px solid #FC4C02;
                                  padding-bottom: 2px;">
                            View Profile on Strava →
                        </a>
                        
                        <button class="btn btn-secondary" 
                                onclick="if(confirm('Disconnect Strava? Your training data will remain saved.')) { StravaConfig.disconnect(); }"
                                style="margin-left: auto; padding: 10px 20px;">
                            Disconnect
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Powered by Strava (BRAND COMPLIANT) -->
            <div style="margin-top: 20px; padding-top: 20px;
                        border-top: 1px solid var(--border-subtle);
                        text-align: center;">
                <span style="color: var(--text-tertiary); font-size: 0.75rem;">
                    Powered by Strava
                </span>
            </div>
        `;
            } else {
                // ❌ NOT CONNECTED STATE - BRAND COMPLIANT
                container.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 20px;">
                <!-- Strava Official Logo (Inactive) -->
                <div style="flex-shrink: 0;">
                    <div style="width: 64px; height: 64px; 
                                background: rgba(252, 76, 2, 0.1);
                                border: 2px solid rgba(252, 76, 2, 0.3);
                                border-radius: 12px; 
                                display: flex; align-items: center; justify-content: center;
                                padding: 12px;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" fill="rgba(252, 76, 2, 0.5)"/>
                        </svg>
                    </div>
                </div>
                
                <!-- Connection Prompt -->
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 8px 0; color: white; font-size: 1.25rem;">
                        Connect Your Strava Account
                    </h4>
                    
                    <p style="color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">
                        Automatically sync your rides and unlock powerful features:
                    </p>
                    
                    <!-- Benefits List -->
                    <div style="display: grid; gap: 10px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: start; gap: 12px;">
                            <span style="font-size: 1.5rem;">🎯</span>
                            <div>
                                <strong style="color: white; display: block; margin-bottom: 4px;">
                                    Smart Workout Detection
                                </strong>
                                <span style="color: var(--text-secondary); font-size: 0.9rem;">
                                    Automatically match your Strava rides to scheduled workouts
                                </span>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: start; gap: 12px;">
                            <span style="font-size: 1.5rem;">⚡</span>
                            <div>
                                <strong style="color: white; display: block; margin-bottom: 4px;">
                                    Power Zone Analysis
                                </strong>
                                <span style="color: var(--text-secondary); font-size: 0.9rem;">
                                    Analyze time in zones, TSS, and polarized training distribution
                                </span>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: start; gap: 12px;">
                            <span style="font-size: 1.5rem;">📊</span>
                            <div>
                                <strong style="color: white; display: block; margin-bottom: 4px;">
                                    Training Load Tracking
                                </strong>
                                <span style="color: var(--text-secondary); font-size: 0.9rem;">
                                    Monitor your training stress and optimize recovery
                                </span>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: start; gap: 12px;">
                            <span style="font-size: 1.5rem;">🔄</span>
                            <div>
                                <strong style="color: white; display: block; margin-bottom: 4px;">
                                    Seamless Sync
                                </strong>
                                <span style="color: var(--text-secondary); font-size: 0.9rem;">
                                    Your rides automatically appear after each activity
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Official "Connect with Strava" Button -->
                    <button class="btn btn-primary" 
                            onclick="StravaConfig.connect()"
                            style="background: #FC4C02;
                                   border: none;
                                   padding: 14px 32px;
                                   font-size: 1.1rem;
                                   display: inline-flex;
                                   align-items: center;
                                   gap: 10px;
                                   box-shadow: 0 4px 12px rgba(252, 76, 2, 0.3);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" fill="white"/>
                        </svg>
                        Connect with Strava
                    </button>
                    
                    <!-- Privacy Note -->
                    <div style="margin-top: 16px; padding: 12px; 
                                background: rgba(59, 130, 246, 0.1);
                                border-left: 3px solid #3b82f6;
                                border-radius: 4px;
                                font-size: 0.875rem;
                                color: var(--text-secondary);">
                        <strong>🔒 Privacy:</strong> We only access your activity data. 
                        We never post to Strava or share your data with third parties.
                    </div>
                </div>
            </div>
        `;
            }
        },

        // Render intake form
        renderIntakeForm: function () {
            const container = document.getElementById('intakeContainer');
            if (!container) return;

            container.innerHTML = `
                <!-- Progress Bar -->
                <div class="progress-bar">
                    <div class="progress-step active" id="progress1">1</div>
                    <div class="progress-line"></div>
                    <div class="progress-step" id="progress2">2</div>
                    <div class="progress-line"></div>
                    <div class="progress-step" id="progress3">3</div>
                    <div class="progress-line"></div>
                    <div class="progress-step" id="progress4">4</div>
                </div>

                <!-- Step 1: Goal -->
                <div class="intake-step active" id="step1">
                    <h2 class="step-title">What's Your Mission? 🎯</h2>
                    <p class="step-subtitle">Choose your weapon of mass destruction</p>
                    
                    <div class="cards-grid">
                        <div class="selection-card" data-goal="ftp" onclick="App.selectGoal('ftp')">
                            <div class="card-icon">⚡</div>
                            <h3 class="card-title">Power Surge</h3>
                            <p class="card-description">Demolish your FTP limits</p>
                            <ul class="card-features">
                                <li>Explosive power gains</li>
                                <li>Crush the flats</li>
                                <li>Sprint supremacy</li>
                            </ul>
                        </div>
                        
                        <div class="selection-card" data-goal="climbing" onclick="App.selectGoal('climbing')">
                            <div class="card-icon">🏔️</div>
                            <h3 class="card-title">Mountain Destroyer</h3>
                            <p class="card-description">Conquer every summit</p>
                            <ul class="card-features">
                                <li>Climbing domination</li>
                                <li>Perfect pacing</li>
                                <li>Gravity defiance</li>
                            </ul>
                        </div>
                        
                        <div class="selection-card" data-goal="granfondo" onclick="App.selectGoal('granfondo')">
                            <div class="card-icon">🚴</div>
                            <h3 class="card-title">Endurance Beast</h3>
                            <p class="card-description">Go further, faster, forever</p>
                            <ul class="card-features">
                                <li>Limitless stamina</li>
                                <li>Fuel efficiency</li>
                                <li>Mental fortress</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="navigation">
                        <button class="btn btn-primary" id="btnStep1" disabled onclick="App.nextStep(2)">
                            ${APP_CONFIG.labels.nextStep}
                        </button>
                    </div>
                </div>

                <!-- Step 2: Details -->
                <div class="intake-step" id="step2">
                    <h2 class="step-title">Your Stats 📊</h2>
                    <p class="step-subtitle">Help us personalize your training</p>
                    
                    <div style="max-width: 600px; margin: 0 auto;">
                        <div class="form-group">
                            <label for="userName">Your rebel name (optional)</label>
                            <input type="text" id="userName" placeholder="e.g., Speed Demon" autocomplete="off">
                        </div>
                        
                        <div class="form-group">
                            <label for="userFTP">Current FTP in watts (optional)</label>
                            <input type="tel" id="userFTP" placeholder="e.g., 250" pattern="[0-9]*" inputmode="numeric" oninput="App.calculateWkg()">
                        </div>
                        
                        <div class="form-group">
                            <label for="userWeight">Your weight in kg (optional)</label>
                            <input type="tel" id="userWeight" placeholder="e.g., 75" pattern="[0-9]*" inputmode="numeric" oninput="App.calculateWkg()">
                        </div>
                        
                        <div id="wkgAdvice" style="display: none;">
                            <div class="info-box" style="background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.3);">
                                <h4 id="wkgTitle">💪 Your Power Profile</h4>
                                <p id="wkgText"></p>
                                <p id="wkgRecommendation" style="margin-top: 12px; font-weight: 600;"></p>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Training days (pick at least 3)</label>
                            <div class="checkbox-grid">
                                ${[
                    { short: 'Mon', full: 'Monday' },
                    { short: 'Tue', full: 'Tuesday' },
                    { short: 'Wed', full: 'Wednesday' },
                    { short: 'Thu', full: 'Thursday' },
                    { short: 'Fri', full: 'Friday' },
                    { short: 'Sat', full: 'Saturday' },
                    { short: 'Sun', full: 'Sunday' }
                ].map(day => `
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="day${day.short}" value="${day.short}" 
                                            ${APP_CONFIG.defaults.preferredDays.includes(day.short) ? 'checked' : ''}
                                            onchange="App.validateDays()">
                                        <span>${day.full}</span>
                                    </label>
                                `).join('')}
                            </div>
                            <p id="daysError" style="color: var(--danger); font-size: 0.9rem; margin-top: 12px; display: none;">
                                ${APP_CONFIG.messages.selectDays}
                            </p>
                        </div>

                        <div class="info-box">
                            <h4>💡 What's FTP?</h4>
                            <p>Functional Threshold Power - the watts you can hold for an hour.</p>
                            <p style="margin-top: 12px;">
                                <strong>Don't know your FTP?</strong> 
                                <a href="https://polarized.cc/ftp-test" target="_blank" style="color: var(--primary-light); text-decoration: underline; font-weight: 600;">
                                    Take our guided FTP test →
                                </a>
                            </p>
                            <p style="margin-top: 12px; font-size: 0.9rem;">
                                <strong>W/kg Reference:</strong><br>
                                • Beginner: &lt;2.5 W/kg<br>
                                • Recreational: 2.5-3.5 W/kg<br>
                                • Advanced: 3.5-4.5 W/kg<br>
                                • Elite: &gt;4.5 W/kg
                            </p>
                        </div>
                    </div>
                    
                    <div class="navigation">
                        <button class="btn btn-secondary" onclick="App.previousStep(1)">
                            ${APP_CONFIG.labels.back}
                        </button>
                        <button class="btn btn-primary" id="btnStep2" onclick="App.nextStep(3)">
                            ${APP_CONFIG.labels.nextStep}
                        </button>
                    </div>
                </div>

                <!-- Step 3: Time commitment -->
                <div class="intake-step" id="step3">
                    <h2 class="step-title">Time Investment ⏰</h2>
                    <p class="step-subtitle">How much pain can you handle?</p>
                    
                    <div id="timeRecommendation" style="max-width: 600px; margin: 0 auto 32px;">
                        <!-- Dynamically filled based on W/kg -->
                    </div>
                    
                    <div class="cards-grid">
                        <div class="selection-card" data-time="starter" onclick="App.selectTime('starter')">
                            <div class="card-icon">🌱</div>
                            <h3 class="card-title">Rebel Starter</h3>
                            <p class="card-description">3-4 hours/week</p>
                            <p style="color: var(--accent); font-size: 0.95rem;">Perfect for busy revolutionaries</p>
                            <div class="recommended-badge" id="starterBadge" style="display: none;">
                                <span style="background: var(--success); color: white; padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.875rem; font-weight: 600;">
                                    ✓ Recommended for you
                                </span>
                            </div>
                        </div>
                        
                        <div class="selection-card" data-time="regular" onclick="App.selectTime('regular')">
                            <div class="card-icon">🚴</div>
                            <h3 class="card-title">Dedicated Warrior</h3>
                            <p class="card-description">4-6 hours/week</p>
                            <p style="color: var(--accent); font-size: 0.95rem;">The sweet spot of gains</p>
                            <div class="recommended-badge" id="regularBadge" style="display: none;">
                                <span style="background: var(--success); color: white; padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.875rem; font-weight: 600;">
                                    ✓ Recommended for you
                                </span>
                            </div>
                        </div>
                        
                        <div class="selection-card" data-time="serious" onclick="App.selectTime('serious')">
                            <div class="card-icon">🏆</div>
                            <h3 class="card-title">Full Savage</h3>
                            <p class="card-description">6-8 hours/week</p>
                            <p style="color: var(--accent); font-size: 0.95rem;">Maximum destruction mode</p>
                            <div class="recommended-badge" id="seriousBadge" style="display: none;">
                                <span style="background: var(--success); color: white; padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.875rem; font-weight: 600;">
                                    ✓ Recommended for you
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="navigation">
                        <button class="btn btn-secondary" onclick="App.previousStep(2)">
                            ${APP_CONFIG.labels.back}
                        </button>
                        <button class="btn btn-primary" id="btnStep3" disabled onclick="App.generatePlan()">
                            ${APP_CONFIG.labels.generatePlan}
                        </button>
                    </div>
                </div>

                <!-- Step 4: Ready -->
                <div class="intake-step" id="step4">
                    <h2 class="step-title">Your Rebellion Begins! 🎉</h2>
                    <p class="step-subtitle">Time to break the rules and train smarter</p>
                    
                    <div class="success-message">
                        <h3 style="margin-bottom: 12px; font-size: 1.5rem;">🚀 Your 6-Week Polarized Plan is Ready!</h3>
                        <p style="font-size: 1.1rem; margin-bottom: 16px;">80% easy, 20% hard. Zero bullshit.</p>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px; margin: 0 auto;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">⚡</span>
                                <span>Adaptive to your life</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">⚡</span>
                                <span>Science-backed gains</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">⚡</span>
                                <span>100% free forever</span>
                            </div>
                        </div>
                    </div>

                    ${APP_CONFIG.features.showHealthDisclaimer ? `
                    <div class="info-box" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); margin: 24px auto; max-width: 600px;">
                        <h4 style="color: #f59e0b; margin-bottom: 8px;">⚠️ Health Disclaimer</h4>
                        <p style="color: var(--accent); font-size: 0.9rem; line-height: 1.6;">
                            This training plan provides general fitness guidance. Always consult with a healthcare professional before starting any new exercise program, especially if you have pre-existing health conditions. Listen to your body and stop exercising if you feel pain, dizziness, or unusual discomfort.
                        </p>
                    </div>` : ''}
                    
                    <div class="navigation">
                        <button class="btn btn-primary" onclick="App.startApp()" style="font-size: 1.2rem; padding: 16px 48px;">
                            ${APP_CONFIG.labels.startTraining}
                        </button>
                    </div>
                </div>
            `;

            // Validate days na rendering
            if (typeof App !== 'undefined' && App.validateDays) {
                App.validateDays();
            }
        },

        // Render navigation tabs
        renderNavTabs: function () {
            const navTabs = document.getElementById('navTabs');
            if (!navTabs) return;

            navTabs.innerHTML = `
                <button class="nav-tab active" data-tab="today" onclick="App.switchTab('today')">
                    ${APP_CONFIG.labels.today}
                </button>
                <button class="nav-tab" data-tab="week" onclick="App.switchTab('week')">
                    ${APP_CONFIG.labels.week}
                </button>
                <button class="nav-tab" data-tab="progress" onclick="App.switchTab('progress')">
                    ${APP_CONFIG.labels.progress}
                </button>
                <button class="nav-tab" data-tab="cyclingclub" onclick="App.switchTab('cyclingclub')">
                    💎 CyclingClub
                </button>
                <button class="nav-tab" data-tab="settings" onclick="App.switchTab('settings')">
                    ${APP_CONFIG.labels.settings}
                </button>
            `;
        },

        // Render content area
        renderContentArea: function () {
            const contentArea = document.getElementById('contentArea');
            if (!contentArea) return;

            contentArea.innerHTML = `
                <!-- Today Tab -->
                <div class="content-section active" id="todayTab">
<div class="workout-header">
    <h2>Today's Mission</h2>
    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <span style="font-weight: 600; padding: 10px 20px; background: rgba(50, 30, 80, 0.6); border: 1px solid rgba(168, 85, 247, 0.4); border-radius: var(--radius); font-size: 0.95rem; white-space: nowrap;">
            📅 Week <span id="currentWeekDisplay">1</span> of ${APP_CONFIG.weeks.total}
        </span>
        <button class="btn btn-secondary" onclick="App.jumpToCurrentWeek()" style="min-width: 140px;">
            Go to Week View →
        </button>
    </div>
</div>
                        
                        <div id="todayWorkout"></div>
                        
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">🎯</div>
                                <div class="stat-value" id="completionRate">0%</div>
                                <div class="stat-label">Completed</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">🔥</div>
                                <div class="stat-value" id="streak">0</div>
                                <div class="stat-label">Streak</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">⏱️</div>
                                <div class="stat-value" id="weekMinutes">0</div>
                                <div class="stat-label">Minutes this week</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Week Tab -->
                <div class="content-section" id="weekTab">
                    <div class="workout-section">
                        <div class="workout-header">
                            <h2>Week Overview</h2>
                            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;">
                                <button class="btn btn-secondary" onclick="App.changeWeek(-1)" style="min-width: 100px;">← Week</button>
                                <span style="font-weight: 600; padding: 10px 20px; background: rgba(50, 30, 80, 0.6); border: 1px solid rgba(168, 85, 247, 0.4); border-radius: var(--radius); font-size: 0.95rem; white-space: nowrap;">
                                    Week <span id="currentWeekDisplay2">1</span> of ${APP_CONFIG.weeks.total}
                                </span>
                                <button class="btn btn-secondary" onclick="App.changeWeek(1)" style="min-width: 100px;">Week →</button>
                            </div>
                        </div>
                        
                        <div id="weekOverview"></div>
                    </div>
                </div>

                <!-- Progress Tab -->
                <div class="content-section" id="progressTab">
                    <div class="workout-section">
                        <h2>Progress Report</h2>
                        <div id="progressOverview"></div>
                    </div>
                </div>

                <!-- CyclingClub Tab -->
                <div class="content-section" id="cyclingclubTab">
                    <div class="workout-section">
                        <div id="cyclingClubContent">
                            <!-- Content wordt dynamisch gevuld door CyclingClubModule -->
                        </div>
                    </div>
                </div>

                <!-- Settings Tab -->
                <div class="content-section" id="settingsTab">
                    <div class="workout-section">
                        <h2>Settings</h2>
                        
                        <!-- Profile & Performance Section -->
                        <div class="settings-section">
                            <h3 class="settings-section-title">🏆 Profile & Performance</h3>
                            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                                Your personal data to calculate power zones and training recommendations.
                            </p>
                            
                            <div class="form-group">
                                <label for="settingsName">Your name (optional)</label>
                                <input type="text" 
                                       id="settingsName" 
                                       placeholder="e.g., Alex" 
                                       value="">
                                <small style="color: var(--text-tertiary); display: block; margin-top: 4px;">
                                    Used for personalization throughout the app
                                </small>
                            </div>
                            
                            <div class="form-group">
                                <label for="settingsFTP">Functional Threshold Power (FTP) *</label>
                                <input type="number" 
                                       id="settingsFTP" 
                                       placeholder="e.g., 250" 
                                       min="100" 
                                       max="500"
                                       value=""
                                       oninput="UIModule.calculateWkg()">
                                <small style="color: var(--text-tertiary); display: block; margin-top: 4px;">
                                    Your 1-hour max sustainable power in watts (typical range: 150-350W)
                                </small>
                            </div>
                            
                            <div class="form-group">
                                <label for="settingsWeight">Body weight (kg)</label>
                                <input type="number" 
                                       id="settingsWeight" 
                                       placeholder="e.g., 75" 
                                       min="40" 
                                       max="150"
                                       step="0.1"
                                       value=""
                                       oninput="UIModule.calculateWkg()">
                                <small style="color: var(--text-tertiary); display: block; margin-top: 4px;">
                                    Used to calculate power-to-weight ratio (W/kg)
                                </small>
                            </div>
                            
                            <!-- W/kg Display -->
                            <div id="wkgDisplay" style="display: none; margin-top: 20px; padding: 20px; 
                                                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
                                                        border: 1px solid rgba(139, 92, 246, 0.3); 
                                                        border-radius: 12px;">
                                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                                    <div style="font-size: 2.5rem;">⚡</div>
                                    <div>
                                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 4px;">
                                            Power-to-Weight Ratio
                                        </div>
                                        <div style="font-size: 2rem; font-weight: 700; color: white;">
                                            <span id="wkgValue">0.0</span> W/kg
                                        </div>
                                    </div>
                                </div>
                                <div id="wkgLevel" style="padding: 12px; background: rgba(0,0,0,0.2); 
                                                           border-radius: 8px; font-size: 0.9rem; line-height: 1.6;">
                                    <!-- Dynamically filled -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Connected Services Section -->
                        <div class="settings-section" style="margin-top: 40px;">
                            <h3 class="settings-section-title">🔗 Connected Services</h3>
                            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                                Connect third-party services to enhance your training experience.
                            </p>
                            
                            <!-- Strava Integration Card -->
                            <div id="stravaIntegrationCard" style="background: var(--bg-card); 
                                                                    border: 2px solid var(--border-subtle); 
                                                                    border-radius: 12px; 
                                                                    padding: 24px;
                                                                    transition: all 0.3s ease;">
                                <div id="stravaStatus">
                                    <!-- Dynamically filled by updateStravaStatus() -->
                                </div>
                            </div>
                            
                            <!-- Future integrations placeholder -->
                            <div style="margin-top: 16px; padding: 16px; 
                                        background: rgba(255,255,255,0.03); 
                                        border: 1px dashed var(--border-subtle); 
                                        border-radius: 8px;
                                        text-align: center;
                                        color: var(--text-tertiary);
                                        font-size: 0.875rem;">
                                More integrations coming soon: Zwift, TrainingPeaks, Garmin Connect
                            </div>
                        </div>
                        
                        <!-- Appearance Section -->
                        <div class="settings-section" style="margin-top: 40px;">
                            <h3 class="settings-section-title">🎨 Appearance</h3>
                            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                                Customize the look and feel of your training app.
                            </p>

                            <button id="themeToggle"
                                    class="btn btn-secondary"
                                    style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px;"
                                    onclick="if(typeof ThemeModule !== 'undefined') ThemeModule.toggleTheme()"
                                    aria-label="Toggle theme">
                                <span class="theme-icon" style="font-size: 1.5rem;">☀️</span>
                                <span class="theme-label" style="font-size: 1rem; font-weight: 600;">Light Mode</span>
                            </button>

                            <div style="margin-top: 12px; padding: 12px;
                                        background: var(--surface);
                                        border: 1px solid var(--border-subtle);
                                        border-radius: 8px;
                                        font-size: 0.875rem;
                                        color: var(--text-secondary);">
                                💡 Your theme preference is saved automatically and will persist across sessions.
                            </div>
                        </div>

                        <!-- App Management Section -->
                        <div class="settings-section" style="margin-top: 40px;">
                            <h3 class="settings-section-title">⚙️ App Management</h3>

                            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
                                <button class="btn btn-primary" onclick="App.saveSettings()" style="width: 100%;">
                                    💾 Save All Changes
                                </button>

                                <button class="btn btn-danger" onclick="App.resetApp()" style="width: 100%;
                                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                                    🔄 Reset Everything (Danger Zone)
                                </button>
                            </div>

                            <div style="margin-top: 16px; padding: 12px;
                                        background: rgba(239, 68, 68, 0.1);
                                        border: 1px solid rgba(239, 68, 68, 0.3);
                                        border-radius: 8px;
                                        font-size: 0.875rem;
                                        color: var(--text-secondary);">
                                ⚠️ <strong>Warning:</strong> Reset will permanently delete all your training data,
                                schedule, and settings. This cannot be undone.
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Load existing settings values if available
            setTimeout(() => {
                if (window.appState) {
                    const nameInput = document.getElementById('settingsName');
                    const ftpInput = document.getElementById('settingsFTP');
                    const weightInput = document.getElementById('settingsWeight');

                    if (nameInput && window.appState.userName) {
                        nameInput.value = window.appState.userName;
                    }
                    if (ftpInput && window.appState.ftp) {
                        ftpInput.value = window.appState.ftp;
                    }
                    if (weightInput && window.appState.weight) {
                        weightInput.value = window.appState.weight;
                    }

                    // Calculate W/kg if both values exist
                    if (ftpInput?.value && weightInput?.value) {
                        this.calculateWkg();
                    }
                }
            }, 100);

            // Update Strava status after rendering
            setTimeout(() => {
                this.updateStravaStatus();
            }, 200);
        },

        // Calculate W/kg
        calculateWkg: function () {
            const ftpInput = document.getElementById('settingsFTP');
            const weightInput = document.getElementById('settingsWeight');
            const wkgDisplay = document.getElementById('wkgDisplay');
            const wkgValue = document.getElementById('wkgValue');
            const wkgLevel = document.getElementById('wkgLevel');

            if (!ftpInput || !weightInput || !wkgDisplay) return;

            const ftp = parseFloat(ftpInput.value);
            const weight = parseFloat(weightInput.value);

            if (ftp > 0 && weight > 0) {
                const wkg = (ftp / weight).toFixed(2);
                wkgValue.textContent = wkg;
                wkgDisplay.style.display = 'block';

                // Determine level
                let level, color, emoji, description;

                if (wkg < 2.0) {
                    level = 'Beginner';
                    color = '#10b981';
                    emoji = '🌱';
                    description = 'You\'re starting your cycling journey. Focus on consistency and building your aerobic base with easy Zone 2 rides.';
                } else if (wkg < 2.5) {
                    level = 'Novice';
                    color = '#3b82f6';
                    emoji = '🚴';
                    description = 'Solid foundation! You can handle regular training. Keep building endurance and start adding structured intervals.';
                } else if (wkg < 3.0) {
                    level = 'Recreational';
                    color = '#8b5cf6';
                    emoji = '💪';
                    description = 'Strong cyclist! You\'re competitive in group rides. Focus on specific weaknesses (climbing, sprinting, or endurance).';
                } else if (wkg < 3.5) {
                    level = 'Club Racer';
                    color = '#f59e0b';
                    emoji = '🏆';
                    description = 'Excellent power! You can compete in local races. Optimize your training with polarized intensity distribution.';
                } else if (wkg < 4.0) {
                    level = 'Advanced';
                    color = '#ef4444';
                    emoji = '🔥';
                    description = 'Elite amateur level! You\'re in the top 10% of cyclists. Quality over quantity - focus on high-intensity sessions.';
                } else {
                    level = 'Pro Level';
                    color = '#dc2626';
                    emoji = '⚡';
                    description = 'World-class power! You\'re at professional cyclist level. Recovery and marginal gains are now crucial.';
                }

                wkgLevel.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 2rem;">${emoji}</span>
                        <div>
                            <div style="font-weight: 600; color: ${color}; font-size: 1.1rem;">${level}</div>
                            <div style="color: var(--text-tertiary); font-size: 0.875rem;">Based on ${wkg} W/kg</div>
                        </div>
                    </div>
                    <p style="margin: 0; color: var(--text-secondary); line-height: 1.5;">
                        ${description}
                    </p>
                `;
            } else {
                wkgDisplay.style.display = 'none';
            }
        },

        // Update W/kg display
        updateWkgDisplay: function (wkg) {
            const adviceDiv = document.getElementById('wkgAdvice');
            const wkgTitle = document.getElementById('wkgTitle');
            const wkgText = document.getElementById('wkgText');
            const wkgRecommendation = document.getElementById('wkgRecommendation');

            if (!adviceDiv || !wkgTitle || !wkgText || !wkgRecommendation) return;

            let level, advice, volumeAdvice;

            if (wkg < 2.5) {
                level = "Beginner";
                advice = `With ${wkg} W/kg, you're at beginner level. This is a great starting point!`;
                volumeAdvice = "The Starter plan (3-4 hours) is perfect for you! Focus on consistency and gradually building your base.";
            } else if (wkg < 3.5) {
                level = "Recreational";
                advice = `With ${wkg} W/kg, you're a solid recreational cyclist. Nice work!`;
                volumeAdvice = "Consider the Regular plan (4-6 hours) or Serious (6-8 hours) depending on your available time and goals.";
            } else if (wkg < 4.5) {
                level = "Advanced";
                advice = `With ${wkg} W/kg, you're at advanced level. You're crushing it!`;
                volumeAdvice = "Quality over quantity now. The Serious plan (6-8 hours) with focused intervals is ideal for you.";
            } else {
                level = "Elite";
                advice = `With ${wkg} W/kg, you're at elite level. Respect! 🏆`;
                volumeAdvice = "You know what you're doing! Any plan works - focus on periodization and recovery.";
            }

            wkgTitle.innerHTML = `💪 Your Power Profile: <span style="color: var(--primary-light);">${level}</span>`;
            wkgText.innerHTML = advice;
            wkgRecommendation.innerHTML = `📈 ${volumeAdvice}`;
            adviceDiv.style.display = 'block';

            // Update badges in step 3
            const starterBadge = document.getElementById('starterBadge');
            const regularBadge = document.getElementById('regularBadge');
            const seriousBadge = document.getElementById('seriousBadge');

            if (starterBadge) starterBadge.style.display = wkg < 2.5 ? 'block' : 'none';
            if (regularBadge) regularBadge.style.display = (wkg >= 2.5 && wkg < 3.5) ? 'block' : 'none';
            if (seriousBadge) seriousBadge.style.display = wkg >= 3.5 ? 'block' : 'none';
        },

        // =====================================================
        // VERBETERDE WORKOUT GRAPH FUNCTIES
        // =====================================================

        renderWorkoutGraph: function (workout) {
            if (!workout) return '';

            // Try parsing with details if available
            let phases = [];
            if (workout.details) {
                phases = this.parseWorkoutPhasesAdvanced(workout);
            }

            // Fallback: Create simple graph if no phases generated
            if (!phases || phases.length === 0) {
                phases = this.createSimpleWorkoutGraph(workout);
            }

            // Still no phases? Return empty
            if (!phases || phases.length === 0) return '';

            const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);

            let barsHTML = '';
            phases.forEach((phase) => {
                const widthPercent = (phase.duration / totalDuration) * 100;
                const heightPercent = Math.min(phase.intensity * 100, 100);
                const zoneClass = this.getZoneClass(phase.intensity);

                barsHTML += `
                    <div class="graph-bar ${zoneClass}"
                         style="width: ${widthPercent}%; height: ${heightPercent}%;"
                         title="${phase.name}: ${phase.duration}min @ ${Math.round(phase.intensity * 100)}% FTP">
                    </div>
                `;
            });

            return `
                <div class="workout-graph-container">
                    <h4 style="color: var(--text-primary); margin-bottom: 15px;">⚡ Workout Profile</h4>
                    <div class="workout-graph">
                        ${barsHTML}
                    </div>
                    <div class="graph-timeline">
                        <span>0 min</span>
                        <span>${Math.round(totalDuration / 2)} min</span>
                        <span>${totalDuration} min</span>
                    </div>
                </div>
            `;
        },

        /**
         * Create simple workout graph for workouts without details
         * @param {Object} workout - Workout object
         * @returns {Array<Object>} Simple phases array
         */
        createSimpleWorkoutGraph: function(workout) {
            const phases = [];
            const duration = workout.duration || 60;
            const intensity = this.getIntensityValue(workout);

            // Simple structure: warmup + main + cooldown
            const warmupDuration = duration >= 60 ? 15 : 10;
            const cooldownDuration = duration >= 60 ? 10 : 5;
            const mainDuration = duration - warmupDuration - cooldownDuration;

            if (warmupDuration > 0) {
                phases.push({
                    name: 'Warm-up',
                    duration: warmupDuration,
                    intensity: 0.55,
                    type: 'warmup'
                });
            }

            if (mainDuration > 0) {
                phases.push({
                    name: 'Main Set',
                    duration: mainDuration,
                    intensity: intensity,
                    type: 'main'
                });
            }

            if (cooldownDuration > 0) {
                phases.push({
                    name: 'Cool-down',
                    duration: cooldownDuration,
                    intensity: 0.50,
                    type: 'cooldown'
                });
            }

            return phases;
        },

        /**
         * Parse workout details into visualization phases
         * Supports: minutes, seconds, various interval patterns, warmup/cooldown
         * @param {Object} workout - Workout object with details and duration
         * @returns {Array<Object>} Array of workout phases with duration, intensity, type
         */
        parseWorkoutPhasesAdvanced: function (workout) {
            const phases = [];
            const details = workout.details || '';
            const intensity = workout.intensity || 'easy';

            // HELPER: Convert time strings to minutes
            const parseTime = (value, unit) => {
                const num = parseFloat(value);
                if (unit.match(/^s(ec)?(ond)?s?$/i)) {
                    return num / 60; // Convert seconds to minutes
                }
                return num; // Already minutes
            };

            // PARSE VERSCHILLENDE INTERVAL PATTERNS
            // Match: "10x30 seconds", "5x3 min", "4x4min at 90%", "3x8 min @ 80-85% FTP"
            const intervalMatch = details.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(s(?:ec)?(?:ond)?s?|min(?:ute)?s?)\s*(?:@|at)?\s*(?:(\d+)(?:-(\d+))?%?\s*)?(?:FTP|all-out)?/i);

            const warmupMatch = details.match(/Warm-up:\s*(\d+)\s*(min|minutes)/i);
            const cooldownMatch = details.match(/Cool-down:\s*(\d+)\s*(min|minutes)/i);

            // Match: "3 min recovery", "4min easy", "30s rest", "2 minute recovery"
            const recoveryMatch = details.match(/(\d+(?:\.\d+)?)\s*(s(?:ec)?(?:ond)?s?|min(?:ute)?s?)\s*(?:easy|recovery|rest)/i);

            // 1. WARMUP FASE
            let warmupDuration = 0;
            if (warmupMatch) {
                warmupDuration = parseInt(warmupMatch[1]);
                phases.push({
                    name: 'Warm-up',
                    duration: warmupDuration,
                    intensity: 0.55,
                    type: 'warmup'
                });
            }

            // 2. COOLDOWN FASE (parse now for duration calculation)
            let cooldownDuration = 0;
            if (cooldownMatch) {
                cooldownDuration = parseInt(cooldownMatch[1]);
            }

            // 3. MAIN SET - Check of er intervals zijn
            if (intervalMatch && intervalMatch[1] && intervalMatch[2]) {
                const reps = parseInt(intervalMatch[1]);
                const workDurationRaw = intervalMatch[2];
                const workUnit = intervalMatch[3];
                const workDuration = parseTime(workDurationRaw, workUnit);

                // Bepaal intensiteit van de intervals
                let avgIntensity;
                if (intervalMatch[4]) {
                    const intensityLow = parseInt(intervalMatch[4]) / 100;
                    const intensityHigh = intervalMatch[5] ? parseInt(intervalMatch[5]) / 100 : intensityLow;
                    avgIntensity = (intensityLow + intensityHigh) / 2;
                } else if (details.toLowerCase().includes('all-out') || details.toLowerCase().includes('sprint')) {
                    avgIntensity = 1.5; // Anaerobic/sprint zone
                } else {
                    avgIntensity = this.getIntensityValue(workout);
                }

                // Recovery tijd
                let recoveryTime = 3; // Default 3 min
                if (recoveryMatch) {
                    recoveryTime = parseTime(recoveryMatch[1], recoveryMatch[2]);
                }

                // Calculate total time needed for intervals
                const intervalTotalTime = reps * workDuration + (reps - 1) * recoveryTime;
                const availableTime = (workout.duration || 60) - warmupDuration - cooldownDuration;

                // If intervals would exceed available time, adjust recovery
                let adjustedRecoveryTime = recoveryTime;
                if (intervalTotalTime > availableTime && reps > 1) {
                    const totalWorkTime = reps * workDuration;
                    const totalRecoveryTime = availableTime - totalWorkTime;
                    adjustedRecoveryTime = Math.max(0.5, totalRecoveryTime / (reps - 1)); // Min 30s recovery
                }

                // Bouw alle intervals
                for (let i = 0; i < reps; i++) {
                    phases.push({
                        name: `Interval ${i + 1}`,
                        duration: workDuration,
                        intensity: avgIntensity,
                        type: 'work'
                    });

                    if (i < reps - 1) {
                        phases.push({
                            name: 'Recovery',
                            duration: adjustedRecoveryTime,
                            intensity: 0.55,
                            type: 'recovery'
                        });
                    }
                }

            } else {
                // GEEN INTERVALS - Steady State workout
                const mainDuration = Math.max(
                    (workout.duration || 60) - warmupDuration - cooldownDuration,
                    20
                );

                const mainIntensity = this.getIntensityValue(workout);

                // Check voor "last X min harder" patroon
                const harderMatch = details.match(/last\s+(\d+)\s*min/i);

                if (harderMatch) {
                    const harderDuration = parseInt(harderMatch[1]);
                    const steadyDuration = mainDuration - harderDuration;

                    phases.push({
                        name: 'Steady State',
                        duration: steadyDuration,
                        intensity: mainIntensity,
                        type: 'main'
                    });

                    phases.push({
                        name: 'Build',
                        duration: harderDuration,
                        intensity: Math.min(mainIntensity + 0.1, 1.0),
                        type: 'build'
                    });
                } else {
                    phases.push({
                        name: 'Steady State',
                        duration: mainDuration,
                        intensity: mainIntensity,
                        type: 'main'
                    });
                }
            }

            // 4. COOLDOWN FASE
            if (cooldownMatch) {
                phases.push({
                    name: 'Cool-down',
                    duration: cooldownDuration,
                    intensity: 0.50,
                    type: 'cooldown'
                });
            }

            return phases;
        },

        /**
         * Get intensity value for workout graph visualization
         * Parses powerZone, intensity field (as percentage), or falls back to intensity category
         * @param {Object} workout - Workout object
         * @returns {number} Intensity as decimal (0.0-1.0)
         */
        getIntensityValue: function (workout) {
            // 1. Try powerZone field if it's a percentage
            if (workout.powerZone && typeof workout.powerZone === 'string') {
                const match = workout.powerZone.match(/(\d+)(?:-(\d+))?%/);
                if (match) {
                    const low = parseInt(match[1]) / 100;
                    const high = match[2] ? parseInt(match[2]) / 100 : low;
                    return (low + high) / 2;
                }
            }

            // 2. Try intensity field if it's a percentage (e.g., "55% FTP", "80-85% FTP")
            if (workout.intensity && typeof workout.intensity === 'string') {
                const match = workout.intensity.match(/(\d+)(?:-(\d+))?%/);
                if (match) {
                    const low = parseInt(match[1]) / 100;
                    const high = match[2] ? parseInt(match[2]) / 100 : low;
                    return (low + high) / 2;
                }
            }

            // 3. Fallback to intensity category
            const intensityMap = {
                'easy': 0.65,
                'moderate': 0.82,
                'hard': 0.95,
                'rest': 0.50
            };

            return intensityMap[workout.intensity] || 0.70;
        },

        getZoneClass: function (intensity) {
            if (intensity <= 0.55) return 'zone-1';
            if (intensity <= 0.75) return 'zone-2';
            if (intensity <= 0.90) return 'zone-3';
            if (intensity <= 1.05) return 'zone-4';
            return 'zone-5';
        },

        /**
         * Show loading spinner overlay
         * @param {string} message - Loading message to display
         * @param {string} [submessage] - Optional secondary message
         */
        showLoading: function (message = 'Loading...', submessage = '') {
            // Remove existing spinner if present
            this.hideLoading();

            const spinner = document.createElement('div');
            spinner.id = 'global-loading-spinner';
            spinner.innerHTML = `
                <div class="loading-overlay">
                    <div class="loading-spinner-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-message">${message}</p>
                        ${submessage ? `<p class="loading-submessage">${submessage}</p>` : ''}
                    </div>
                </div>
            `;
            document.body.appendChild(spinner);

            // Add CSS if not already present
            if (!document.getElementById('loading-spinner-styles')) {
                const style = document.createElement('style');
                style.id = 'loading-spinner-styles';
                style.textContent = `
                    .loading-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.75);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        animation: fadeIn 0.2s ease-in;
                    }

                    .loading-spinner-container {
                        background: var(--card-bg, #1f2937);
                        padding: 40px 60px;
                        border-radius: 16px;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                        border: 1px solid rgba(168, 85, 247, 0.2);
                    }

                    .loading-spinner {
                        border: 4px solid rgba(168, 85, 247, 0.1);
                        border-top-color: #a855f7;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    }

                    .loading-message {
                        color: var(--text-primary, #ffffff);
                        font-size: 1.125rem;
                        font-weight: 600;
                        margin: 0 0 8px 0;
                    }

                    .loading-submessage {
                        color: var(--text-secondary, #9ca3af);
                        font-size: 0.875rem;
                        margin: 0;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
        },

        /**
         * Update loading spinner message
         * @param {string} message - New loading message
         * @param {string} [submessage] - Optional secondary message
         */
        updateLoading: function (message, submessage = '') {
            const spinner = document.getElementById('global-loading-spinner');
            if (spinner) {
                const messageEl = spinner.querySelector('.loading-message');
                const submessageEl = spinner.querySelector('.loading-submessage');

                if (messageEl) messageEl.textContent = message;

                if (submessage) {
                    if (submessageEl) {
                        submessageEl.textContent = submessage;
                    } else {
                        const newSubmessage = document.createElement('p');
                        newSubmessage.className = 'loading-submessage';
                        newSubmessage.textContent = submessage;
                        messageEl.parentNode.appendChild(newSubmessage);
                    }
                }
            }
        },

        /**
         * Hide loading spinner
         */
        hideLoading: function () {
            const spinner = document.getElementById('global-loading-spinner');
            if (spinner) {
                spinner.style.animation = 'fadeOut 0.2s ease-out';
                setTimeout(() => spinner.remove(), 200);
            }
        }
    };
})();

// Maak adjustWeekVolume globaal beschikbaar
window.adjustWeekVolume = function (level) {
    if (typeof App !== 'undefined' && App.adjustWeekVolume) {
        App.adjustWeekVolume(level);
    }
};

window.UIModule = UIModule;
console.log('✅ UIModule loaded successfully');