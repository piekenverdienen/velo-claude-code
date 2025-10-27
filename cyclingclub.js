// CyclingClub Module - Exclusive deals and content
const CyclingClubModule = (function () {
    'use strict';

    // Real deals with working affiliate links - ONLY VERIFIED DEALS
    const DEALS_BY_CATEGORY = {
        hardware: [
            {
                id: 1,
                title: "Wahoo KICKR Core 2",
                discount: "15% OFF",
                originalPrice: 549,
                dealPrice: 467,
                image: "🚴",
                description: "The smart trainer that started it all. Discount applied automatically after ~5 seconds.",
                links: {
                    EU: "https://zwiftinc.sjv.io/c/1970336/3280522/20902?subId2=PostYT&subId3=zJX8NfRl",
                    UK: "https://zwiftinc.sjv.io/c/1970336/3280524/20902?subId3=yxlPMX2T",
                    US: "https://zwiftinc.sjv.io/c/1970336/3280527/20902?subId3=ZwD4l5tO"
                },
                affiliateCode: "AUTO-APPLIED",
                featured: true,
                multiRegion: true
            },
            {
                id: 2,
                title: "Zwift Ride Bundle",
                discount: "10% OFF",
                originalPrice: 1199,
                dealPrice: 999,
                image: "🎮",
                description: "Complete indoor cycling setup with Zwift Ride bike and Wahoo KICKR Core 2. Save €200 (EU) / £100 (UK) / $300 (US).",
                links: {
                    EU: "https://zwiftinc.sjv.io/c/1970336/3258790/20902?subId3=1WqGuSfM",
                    US: "https://zwiftinc.sjv.io/c/1970336/3258787/20902?subId3=p0inUwso",
                    UK: "https://zwiftinc.sjv.io/c/1970336/3258789/20902?subId3=P9102lZs"
                },
                affiliateCode: "AUTO-APPLIED",
                featured: true,
                multiRegion: true
            }
        ],
        clothing: [
            {
                id: 3,
                title: "Zwift x RIPT ULTRA Headphones",
                discount: "20% OFF",
                originalPrice: 216.95,
                dealPrice: 173.56,
                image: "🎧",
                description: "Premium cycling headphones designed for indoor training. Crystal clear audio with perfect fit.",
                link: "https://h2oaudio.com/velo",
                affiliateCode: "VELO20",
                featured: true,
                multiRegion: false
            }
        ],
        subscriptions: []
    };

    const NEWS_ITEMS = [
        {
            id: 1,
            title: "Zwift Big Weekend 2025: KICKR CORE 2 Deals",
            date: "2025-10-01",
            excerpt: "Get 15% off the Wahoo KICKR CORE 2 plus a FREE TRACKR Heart Rate Monitor. Perfect timing for indoor season.",
            link: "https://zwiftinc.sjv.io/c/1970336/3280522/20902?subId2=PostYT&subId3=zJX8NfRl",
            category: "Deals"
        },
        {
            id: 2,
            title: "New Study: Polarized Training Beats Traditional Methods",
            date: "2025-09-25",
            excerpt: "Latest research confirms 80/20 training produces 23% better results than traditional high-volume training.",
            link: "#",
            category: "Science"
        },
        {
            id: 3,
            title: "How to Use RPE for Better Training",
            date: "2025-09-15",
            excerpt: "Rate of Perceived Exertion is more accurate than heart rate zones. Here's why.",
            link: "#",
            category: "Training"
        },
        {
            id: 4,
            title: "Winter Training: Indoor vs Outdoor",
            date: "2025-09-10",
            excerpt: "The pros and cons of training inside versus braving the elements this winter.",
            link: "#",
            category: "Training"
        }
    ];

    const CATEGORY_INFO = {
        hardware: {
            title: "Hardware",
            icon: "⚙️",
            description: "Smart trainers and bike computers"
        },
        clothing: {
            title: "Clothing & Gear",
            icon: "👕",
            description: "Premium cycling accessories"
        },
        subscriptions: {
            title: "Subscriptions",
            icon: "📱",
            description: "Training apps coming soon!"
        }
    };

    return {
        // Check if user has access
        hasAccess: function () {
            return AuthModule && AuthModule.currentUser !== null;
        },

        // Render the entire tab content
        renderContent: function () {
            const container = document.getElementById('cyclingClubContent');
            if (!container) return;

            // Check access
            if (!this.hasAccess()) {
                container.innerHTML = this.renderLockedState();
                return;
            }

            // Render full content
            container.innerHTML = `
                ${this.renderSocialCTA()}
                ${this.renderHeroSection()}
                ${this.renderFeaturedDeals()}
                ${this.renderCategoryTabs()}
                ${this.renderNews()}
            `;

            // Set default active category
            this.switchCategory('hardware');
        },

        // Social Media CTA Section
        renderSocialCTA: function () {
            return `
                <div class="social-cta-section">
                    <div class="social-cta-content">
                        <h3>🌟 Join Our Community</h3>
                        <p>Get exclusive tips, behind-the-scenes content, and early access to new deals</p>
                        <div class="social-buttons">
                            <a href="https://www.youtube.com/channel/UCVaA-jVjmGlwCoLAB0aRTNA/" 
                               target="_blank" 
                               class="social-btn youtube">
                                <span class="social-icon">▶️</span>
                                <span class="social-text">Subscribe on YouTube</span>
                            </a>
                            <a href="https://www.instagram.com/vive.levelo" 
                               target="_blank" 
                               class="social-btn instagram">
                                <span class="social-icon">📸</span>
                                <span class="social-text">Follow on Instagram</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        },

        // Locked state for non-authenticated users
        renderLockedState: function () {
            return `
                <div class="locked-content">
                    <div class="lock-icon">🔒</div>
                    <h3>CyclingClub Members Only</h3>
                    <p>Sign up for free to access exclusive deals and content!</p>
                    <ul class="lock-benefits">
                        <li>✅ Up to 20% off premium cycling gear</li>
                        <li>✅ Exclusive hardware deals</li>
                        <li>✅ Latest cycling news & training tips</li>
                        <li>✅ 100% free membership</li>
                    </ul>
                    <button class="btn btn-primary" onclick="document.getElementById('show-auth-modal').click()">
                        Sign Up Free
                    </button>
                </div>
            `;
        },

        // Hero section
        renderHeroSection: function () {
            let totalSavings = 0;
            let totalDeals = 0;

            Object.values(DEALS_BY_CATEGORY).forEach(category => {
                category.forEach(deal => {
                    totalSavings += (deal.originalPrice - deal.dealPrice);
                    totalDeals++;
                });
            });

            return `
                <div class="club-hero">
                    <h3>⭐ Welcome to CyclingClub</h3>
                    <p>Exclusive deals and content for Polarized.cc members</p>
                    <div class="hero-stats">
                        <div class="hero-stat">
                            <div class="stat-number">${totalDeals}</div>
                            <div class="stat-label">Active Deals</div>
                        </div>
                        <div class="hero-stat">
                            <div class="stat-number">€${Math.round(totalSavings)}</div>
                            <div class="stat-label">Total Savings</div>
                        </div>
                        <div class="hero-stat">
                            <div class="stat-number">20%</div>
                            <div class="stat-label">Max Discount</div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Featured deals (cross-category)
        renderFeaturedDeals: function () {
            const allDeals = Object.values(DEALS_BY_CATEGORY).flat();
            const featured = allDeals.filter(deal => deal.featured);

            if (featured.length === 0) return '';

            return `
                <div class="featured-deals-section">
                    <h3>🔥 Featured Deals This Month</h3>
                    <div class="featured-deals-grid">
                        ${featured.map(deal => this.renderDealCard(deal, true)).join('')}
                    </div>
                </div>
            `;
        },

        // Category tabs and content
        renderCategoryTabs: function () {
            return `
                <div class="category-section">
                    <h3>💎 Browse by Category</h3>
                    
                    <div class="category-tabs">
                        ${Object.keys(CATEGORY_INFO).map(categoryKey => {
                const count = DEALS_BY_CATEGORY[categoryKey].length;
                const isDisabled = count === 0;
                return `
                                <button class="category-tab ${isDisabled ? 'disabled' : ''}" 
                                        data-category="${categoryKey}"
                                        ${isDisabled ? 'disabled' : `onclick="CyclingClubModule.switchCategory('${categoryKey}')"`}>
                                    <span class="category-icon">${CATEGORY_INFO[categoryKey].icon}</span>
                                    <span class="category-name">${CATEGORY_INFO[categoryKey].title}</span>
                                    <span class="category-count">${count}</span>
                                </button>
                            `;
            }).join('')}
                    </div>

                    <div class="category-content">
                        ${Object.keys(DEALS_BY_CATEGORY).map(categoryKey => {
                const deals = DEALS_BY_CATEGORY[categoryKey];
                return `
                                <div class="category-panel" data-category="${categoryKey}">
                                    <div class="category-header">
                                        <h4>${CATEGORY_INFO[categoryKey].icon} ${CATEGORY_INFO[categoryKey].title}</h4>
                                        <p>${CATEGORY_INFO[categoryKey].description}</p>
                                    </div>
                                    ${deals.length > 0 ? `
                                        <div class="deals-grid">
                                            ${deals.map(deal => this.renderDealCard(deal, false)).join('')}
                                        </div>
                                    ` : `
                                        <div class="no-deals-message">
                                            <p>🚧 More amazing deals coming soon!</p>
                                            <p style="font-size: 0.9rem; opacity: 0.8;">Check back later for exclusive offers in this category.</p>
                                        </div>
                                    `}
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        },

        // Switch between categories
        switchCategory: function (categoryKey) {
            document.querySelectorAll('.category-tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.category === categoryKey && !tab.disabled) {
                    tab.classList.add('active');
                }
            });

            document.querySelectorAll('.category-panel').forEach(panel => {
                panel.classList.remove('active');
                if (panel.dataset.category === categoryKey) {
                    panel.classList.add('active');
                }
            });
        },

        // Individual deal card
        renderDealCard: function (deal, isFeatured) {
            const savings = deal.originalPrice - deal.dealPrice;
            const savingsPercent = Math.round((savings / deal.originalPrice) * 100);

            // Multi-region deal (different links per region)
            if (deal.multiRegion) {
                return `
                    <div class="deal-card ${isFeatured ? 'featured' : ''}" data-deal-id="${deal.id}">
                        ${isFeatured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
                        
                        <div class="deal-icon">${deal.image}</div>
                        
                        <div class="deal-header">
                            <h4>${deal.title}</h4>
                            <div class="discount-badge">${deal.discount}</div>
                        </div>
                        
                        <p class="deal-description">${deal.description}</p>
                        
                        <div class="deal-pricing">
                            <span class="original-price">€${deal.originalPrice}</span>
                            <span class="deal-price">€${deal.dealPrice}</span>
                            <span class="savings">Save €${savings} (${savingsPercent}%)</span>
                        </div>
                        
                        <div class="region-selector">
                            <strong>Select Your Region:</strong>
                            <div class="region-buttons">
                                <a href="${deal.links.EU}" target="_blank" class="region-btn">
                                    🇪🇺 EU
                                </a>
                                <a href="${deal.links.UK}" target="_blank" class="region-btn">
                                    🇬🇧 UK
                                </a>
                                <a href="${deal.links.US}" target="_blank" class="region-btn">
                                    🇺🇸 US
                                </a>
                            </div>
                            ${deal.affiliateCode === 'AUTO-APPLIED' ?
                        '<p class="auto-discount-note">💡 Discount applies automatically after ~5 seconds</p>' :
                        ''}
                        </div>
                    </div>
                `;
            }

            // Standard single-link deal
            return `
                <div class="deal-card ${isFeatured ? 'featured' : ''}" data-deal-id="${deal.id}">
                    ${isFeatured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
                    
                    <div class="deal-icon">${deal.image}</div>
                    
                    <div class="deal-header">
                        <h4>${deal.title}</h4>
                        <div class="discount-badge">${deal.discount}</div>
                    </div>
                    
                    <p class="deal-description">${deal.description}</p>
                    
                    <div class="deal-pricing">
                        <span class="original-price">€${deal.originalPrice}</span>
                        <span class="deal-price">€${deal.dealPrice}</span>
                        <span class="savings">Save €${Math.round(savings)} (${savingsPercent}%)</span>
                    </div>
                    
                    <div class="deal-code">
                        <strong>Discount Code:</strong> 
                        <span class="code-text">${deal.affiliateCode}</span>
                        <button class="copy-code-btn" onclick="CyclingClubModule.copyCode('${deal.affiliateCode}')">
                            📋
                        </button>
                    </div>
                    
                    <a href="${deal.link}" target="_blank" class="btn btn-primary deal-cta">
                        Get This Deal →
                    </a>
                </div>
            `;
        },

        // News section
        renderNews: function () {
            return `
                <div class="news-section">
                    <h3>📰 Latest Cycling News</h3>
                    <div class="news-grid">
                        ${NEWS_ITEMS.map(item => this.renderNewsCard(item)).join('')}
                    </div>
                </div>
            `;
        },

        // Individual news card
        renderNewsCard: function (item) {
            const date = new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `
                <div class="news-card">
                    <div class="news-category">${item.category}</div>
                    <h4>${item.title}</h4>
                    <p>${item.excerpt}</p>
                    <div class="news-footer">
                        <span class="news-date">📅 ${date}</span>
                        <a href="${item.link}" class="news-link">Read More →</a>
                    </div>
                </div>
            `;
        },

        // Copy discount code
        copyCode: function (code) {
            navigator.clipboard.writeText(code).then(() => {
                UIModule.showNotification(`✅ Code "${code}" copied to clipboard!`);
            }).catch(() => {
                UIModule.showNotification('❌ Failed to copy code');
            });
        }
    };
})();

// Make globally available
window.CyclingClubModule = CyclingClubModule;
console.log('✅ CyclingClub module loaded');