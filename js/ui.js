// js/ui.js
// Version: v1.1.1 - Handles DOM Updates and UI State (Complete Implementation)

console.log("Loading UI Module...");

let soulStatChartInstance = null;
let skillTimerInterval = null;
let currentModalType = null;

// Global UI Elements Cache
let uiElements = {};

function initUIElements() {
    uiElements = {
        bodyElement: document.body,
        hudLevel: document.getElementById('hud-level'),
        hudExpBar: document.getElementById('hud-exp-bar'),
        hudPassiveStats: document.getElementById('hud-passive-stats'),
        activeBlessingDisplay: document.getElementById('active-blessing-display'),
        notificationArea: document.getElementById('notification-area'),
        modalContainer: document.getElementById('modal-container'),
        modalContent: document.getElementById('modal-content'),
        modalTitle: document.getElementById('modal-title'),
        modalMessageText: document.getElementById('modal-message-text'),
        modalActions: document.getElementById('modal-actions'),
        modalCloseButton: document.getElementById('modal-close-button'),
        monarchDomainButton: document.getElementById('monarch-domain-button'),
        monarchDomainStatus: document.getElementById('monarch-domain-status'),
        activeQuestList: document.getElementById('active-quest-list'),
        dailyQuestList: document.getElementById('daily-quest-list'),
        synchronicityList: document.getElementById('synchronicity-list'),
        shopPanel: document.getElementById('spiritual-shop'),
        shopItemsContainer: document.getElementById('shop-items'),
        journalInput: document.getElementById('journal-input'),
        journalPrompt: document.getElementById('journal-system-prompt'),
        journalActionBtn: document.getElementById('journal-action-button'),
        journalEntriesList: document.getElementById('journal-entries-list'),
        timelineMap: document.getElementById('timeline-map'),
        companionList: document.getElementById('companion-list'),
        inventoryDisplay: document.getElementById('inventory-display'),
        equipmentDisplay: document.getElementById('equipment-display'),
        skillsDisplay: document.getElementById('skills-display'),
        statsAllocationSection: document.getElementById('stats-allocation'),
        themeSelector: document.getElementById('theme-selector'),
        commandInput: document.getElementById('system-command-input'),
        systemCommandSection: document.getElementById('system-command'),
        settingsPanel: document.getElementById('settings-panel-content'),
        devModePanel: document.getElementById('dev-mode-panel-content'),
        devModeToggleButton: document.getElementById('toggle-dev-mode-button'),
        animatedTextToggle: document.getElementById('toggle-animated-text'),
        nightModeToggle: document.getElementById('toggle-night-mode'),
        systemPromptsToggle: document.getElementById('toggle-system-prompts'),
        musicToggle: document.getElementById('toggle-music'),
        sfxToggle: document.getElementById('toggle-sfx'),
        appVersionSpan: document.getElementById('app-version'),
        karmaDisplay: document.getElementById('karma-display'),
        fragmentsDisplay: document.getElementById('fragments-display'),
        tokensDisplay: document.getElementById('tokens-display'),
        userName: document.getElementById('user-name'),
        userTitle: document.getElementById('user-title'),
        systemName: document.getElementById('system-name'),
        consciousnessLevel: document.getElementById('consciousness-level'),
        spiritualClass: document.getElementById('spiritual-class'),
        hpValue: document.getElementById('hp-value'),
        hpMax: document.getElementById('hp-max'),
        mpValue: document.getElementById('mp-value'),
        mpMax: document.getElementById('mp-max'),
        expValue: document.getElementById('exp-value'),
        expNext: document.getElementById('exp-next'),
        statPointsDisplay: document.getElementById('stat-points-display'),
        statsDisplay: {
            awakening: document.getElementById('stat-awakening'),
            intuition: document.getElementById('stat-intuition'),
            energy: document.getElementById('stat-energy'),
            willpower: document.getElementById('stat-willpower'),
            resonance: document.getElementById('stat-resonance')
        },
        mirrorReflection: document.getElementById('mirror-reflection'),
        mirrorOutput: document.getElementById('mirror-output')
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUIElements);
} else {
    initUIElements();
}

// --- Main UI Update Function ---
function updateUI() {
    if (!gameState) return;
    if (!uiElements.hudLevel) initUIElements();

    requestAnimationFrame(() => {
        try {
            updateHUD();
            updateSoulWindow();
            updateStatsDisplay();
            updateMonarchDomainDisplay();
            updateStatChart();
            updateQuestList();
            updateJournalDisplay();
            updateTimelineDisplay();
            updateCompanionList();
            updateShopDisplay();
            updateSettingsPanel();
            updateInventoryDisplay();
            updateEquipmentDisplay();
            updateSkillDisplay();
        } catch (error) {
            console.error("Error during updateUI:", error);
        }
    });
}

// --- Sub-Update Functions ---
function updateHUD() {
    if (!uiElements.hudLevel) return;
    uiElements.hudLevel.textContent = `Lv. ${gameState.level || 1}`;
    const expNext = gameState.expNext || 100;
    const expPercent = expNext > 0 ? ((gameState.exp || 0) / expNext) * 100 : (gameState.level >= (typeof MAX_LEVEL !== 'undefined' ? MAX_LEVEL : 100) ? 100 : 0);
    if (uiElements.hudExpBar) {
        uiElements.hudExpBar.style.width = `${Math.min(Math.max(0, expPercent), 100)}%`;
        uiElements.hudExpBar.setAttribute('aria-valuenow', Math.round(expPercent));
    }
    const effInt = typeof calculateEffectiveStat === 'function' ? calculateEffectiveStat('intuition') : (gameState.stats?.intuition || 10);
    const effWil = typeof calculateEffectiveStat === 'function' ? calculateEffectiveStat('willpower') : (gameState.stats?.willpower || 10);
    if (uiElements.hudPassiveStats) {
        uiElements.hudPassiveStats.textContent = `Int: ${effInt} | Wil: ${effWil}`;
    }
    updateBlessingDisplay();
}

function updateBlessingDisplay() {
    if (!uiElements.activeBlessingDisplay) return;
    const blessing = typeof getActiveBlessing === 'function' ? getActiveBlessing() : null;
    if (blessing) {
        const blessingClass = `rarity-${blessing.type === 'Light' ? 'legendary' : 'epic'}`;
        const timeLeft = typeof formatTimeRemaining === 'function' ? formatTimeRemaining(blessing.expires - Date.now()) : '';
        uiElements.activeBlessingDisplay.innerHTML = `Blessing: <span class="${blessingClass}" title="Expires in approx. ${timeLeft}">${blessing.type}</span>`;
        uiElements.activeBlessingDisplay.style.display = 'inline-block';
    } else {
        uiElements.activeBlessingDisplay.style.display = 'none';
    }
}

function updateMonarchDomainDisplay() {
    if (!uiElements.monarchDomainButton) return;
    const monarchUnlocked = gameState.unlockedAbilities?.includes('monarchDomain');
    uiElements.monarchDomainButton.style.display = monarchUnlocked ? 'inline-block' : 'none';

    if (monarchUnlocked) {
        const now = Date.now();
        const onCooldown = gameState.monarchDomainCooldown && now < gameState.monarchDomainCooldown;
        const usesLeft = gameState.monarchDomainUses || 0;
        const isActive = gameState.context?.monarchDomainActive;
        const maxUses = typeof MONARCH_DOMAIN_MAX_USES !== 'undefined' ? MONARCH_DOMAIN_MAX_USES : 3;

        uiElements.monarchDomainButton.disabled = (usesLeft <= 0 || onCooldown || isActive);
        if (uiElements.monarchDomainStatus) {
            if (isActive) {
                const rem = typeof formatTimeRemaining === 'function' ? formatTimeRemaining(gameState.context.monarchDomainEndTime - now) : '';
                uiElements.monarchDomainStatus.textContent = `Domain Active! (${rem})`;
            } else if (onCooldown) {
                const rem = typeof formatTimeRemaining === 'function' ? formatTimeRemaining(gameState.monarchDomainCooldown - now) : '';
                uiElements.monarchDomainStatus.textContent = `Recharging... (${rem})`;
            } else if (usesLeft > 0) {
                uiElements.monarchDomainStatus.textContent = `Ready (${usesLeft}/${maxUses})`;
            } else {
                uiElements.monarchDomainStatus.textContent = `Depleted`;
            }
            uiElements.monarchDomainStatus.style.display = 'inline-block';
        }
    } else if (uiElements.monarchDomainStatus) {
        uiElements.monarchDomainStatus.style.display = 'none';
    }
}

function updateSoulWindow() {
    if (uiElements.userName) uiElements.userName.textContent = gameState.playerName || 'Awakened One';
    if (uiElements.userTitle) {
        const titleKey = gameState.achievements?.currentTitleKey;
        const titleData = (titleKey && typeof TITLES !== 'undefined') ? TITLES[titleKey] : null;
        uiElements.userTitle.textContent = titleData ? titleData.name : '';
    }
    if (uiElements.systemName) uiElements.systemName.textContent = gameState.systemName || '[System]';
    if (uiElements.consciousnessLevel) uiElements.consciousnessLevel.textContent = gameState.level || 1;
    if (uiElements.spiritualClass) {
        const clsName = gameState.currentClassName || 'Seeker';
        const rank = gameState.currentClassRank || 'E';
        const soulCls = gameState.soulClass || 'Soul Traveler';
        uiElements.spiritualClass.textContent = `${clsName} (Rank ${rank}) | ${soulCls}`;
    }
    if (uiElements.hpValue) uiElements.hpValue.textContent = gameState.hp ?? 100;
    if (uiElements.hpMax) uiElements.hpMax.textContent = gameState.maxHp ?? 100;
    if (uiElements.mpValue) uiElements.mpValue.textContent = gameState.mp ?? 50;
    if (uiElements.mpMax) uiElements.mpMax.textContent = gameState.maxMp ?? 50;
    if (uiElements.expValue) uiElements.expValue.textContent = gameState.exp ?? 0;
    if (uiElements.expNext) uiElements.expNext.textContent = gameState.expNext ?? 100;
    if (uiElements.statPointsDisplay) uiElements.statPointsDisplay.textContent = gameState.statPoints ?? 0;

    if (uiElements.karmaDisplay) uiElements.karmaDisplay.textContent = `Karma: ${gameState.currency?.karma || 0}`;
    if (uiElements.fragmentsDisplay) uiElements.fragmentsDisplay.textContent = `Fragments: ${gameState.currency?.fragments || 0}`;
    if (uiElements.tokensDisplay) uiElements.tokensDisplay.textContent = `Tokens: ${gameState.currency?.tokens || 0}`;
}

function updateStatsDisplay() {
    const stats = typeof STATS !== 'undefined' ? STATS : ['awakening', 'intuition', 'energy', 'willpower', 'resonance'];
    const statPoints = gameState.statPoints || 0;

    stats.forEach(stat => {
        const statEl = uiElements.statsDisplay?.[stat] || document.getElementById(`stat-${stat}`);
        if (!statEl) return;

        const effectiveVal = typeof calculateEffectiveStat === 'function' ? calculateEffectiveStat(stat) : (gameState.stats?.[stat] || 10);
        const baseVal = gameState.stats?.[stat] || 10;

        if (typeof animateNumberTick === 'function' && gameState.settings?.animatedText) {
            animateNumberTick(statEl, effectiveVal);
        } else {
            statEl.textContent = effectiveVal;
        }

        const parentP = statEl.closest('p');
        if (parentP) {
            parentP.title = `Base: ${baseVal} | Effective: ${effectiveVal}`;
            let btn = parentP.querySelector('.allocate-stat-button');
            if (statPoints > 0) {
                if (!btn) {
                    btn = document.createElement('button');
                    btn.className = 'allocate-stat-button stat-allocate-btn';
                    btn.textContent = '+';
                    btn.dataset.stat = stat;
                    btn.title = `Allocate 1 point to ${stat}`;
                    btn.style.marginLeft = '8px';
                    btn.style.padding = '2px 8px';
                    btn.style.cursor = 'pointer';
                    parentP.appendChild(btn);
                }
            } else if (btn) {
                btn.remove();
            }
        }
    });
}

function updateStatChart() {
    const canvas = document.getElementById('soul-stat-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const stats = typeof STATS !== 'undefined' ? STATS : ['awakening', 'intuition', 'energy', 'willpower', 'resonance'];
    const labels = stats.map(s => s.charAt(0).toUpperCase() + s.slice(1));
    const data = stats.map(s => typeof calculateEffectiveStat === 'function' ? calculateEffectiveStat(s) : (gameState.stats?.[s] || 10));

    const theme = gameState.settings?.currentTheme || 'default';
    let borderColor = '#00ccff';
    let backgroundColor = 'rgba(0, 204, 255, 0.2)';

    if (theme === 'shadow') {
        borderColor = '#9933ff';
        backgroundColor = 'rgba(153, 51, 255, 0.2)';
    } else if (theme === 'celestial') {
        borderColor = '#ffcc00';
        backgroundColor = 'rgba(255, 204, 0, 0.2)';
    } else if (theme === 'monarch') {
        borderColor = '#ff3366';
        backgroundColor = 'rgba(255, 51, 102, 0.2)';
    }

    if (soulStatChartInstance) {
        soulStatChartInstance.data.datasets[0].data = data;
        soulStatChartInstance.data.datasets[0].borderColor = borderColor;
        soulStatChartInstance.data.datasets[0].backgroundColor = backgroundColor;
        soulStatChartInstance.update();
    } else {
        soulStatChartInstance = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Resonance',
                    data: data,
                    borderColor: borderColor,
                    backgroundColor: backgroundColor,
                    borderWidth: 2,
                    pointBackgroundColor: borderColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { color: '#888', backdropColor: 'transparent', stepSize: 10 },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#00ccff', font: { size: 11, family: 'Orbitron, sans-serif' } }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function updateQuestList() {
    if (!uiElements.activeQuestList || !uiElements.dailyQuestList || !uiElements.synchronicityList) return;
    uiElements.activeQuestList.innerHTML = '';
    uiElements.dailyQuestList.innerHTML = '';
    uiElements.synchronicityList.innerHTML = '';

    let hasActive = false, hasDaily = false, hasSync = false;
    (gameState.activeQuests || []).forEach(quest => {
        const li = document.createElement('li');
        li.dataset.questId = quest.id;
        const baseQuestData = typeof getQuestData === 'function' ? getQuestData(quest.id) : null;
        const displayRewards = baseQuestData?.rewards || quest.rewards || {};
        const rewardString = typeof formatRewardsForMessage === 'function' ? formatRewardsForMessage(displayRewards, 0, false) : 'Rewards Available';

        li.innerHTML = `
            <strong>${quest.title} ${quest.type === 'daily' ? '(Daily)' : quest.type === 'synchronicity' ? '(Sync)' : ''}</strong>
            <p>${quest.description || ''}</p>
            ${(quest.goal || 1) > 1 ? `<p>Progress: ${quest.progress || 0} / ${quest.goal}</p>` : ''}
            <p>Reward: ${rewardString}</p>
            <div class="quest-actions">
                <button class="complete-quest-button" ${(quest.progress || 0) >= (quest.goal || 1) ? '' : 'disabled'}>Complete</button>
                ${quest.type !== 'daily' && !quest.isAwakeningQuest ? '<button class="abandon-quest-button">Abandon</button>' : ''}
            </div>`;

        if (quest.type === 'daily') {
            uiElements.dailyQuestList.appendChild(li);
            hasDaily = true;
        } else if (quest.type === 'synchronicity') {
            uiElements.synchronicityList.appendChild(li);
            hasSync = true;
        } else {
            uiElements.activeQuestList.appendChild(li);
            hasActive = true;
        }
    });

    if (!hasActive) uiElements.activeQuestList.innerHTML = '<li>No active quests. Seek guidance.</li>';
    if (!hasDaily) uiElements.dailyQuestList.innerHTML = '<li>No daily rituals active.</li>';
    if (!hasSync) uiElements.synchronicityList.innerHTML = '<li>No synchronicity quests active.</li>';
}

function updateJournalDisplay() {
    const list = uiElements.journalEntriesList || document.getElementById('journal-entries-list');
    if (!list) return;

    const entries = gameState.journalEntries || [];
    if (entries.length === 0) {
        list.innerHTML = '<li>Your chronicle awaits its first entry.</li>';
        return;
    }

    list.innerHTML = '';
    const reversed = [...entries].reverse().slice(0, 15);
    reversed.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'journal-entry-item';
        const dateStr = new Date(entry.timestamp).toLocaleString();
        const tagsHtml = (entry.tags || []).map(t => `<span class="journal-tag tag-${t}">#${t}</span>`).join(' ');
        li.innerHTML = `
            <div class="journal-entry-header">
                <span class="journal-date">${dateStr}</span>
                <span class="journal-prompt-label">${entry.prompt || 'Reflection'}</span>
            </div>
            <p class="journal-text">${entry.entry || ''}</p>
            ${tagsHtml ? `<div class="journal-tags">${tagsHtml}</div>` : ''}
        `;
        list.appendChild(li);
    });
}

function updateTimelineDisplay() {
    const map = uiElements.timelineMap || document.getElementById('timeline-map');
    if (!map) return;

    const events = gameState.timelineEvents || [];
    if (events.length === 0) {
        map.innerHTML = '<p>Your journey begins now...</p>';
        return;
    }

    map.innerHTML = '';
    const reversed = [...events].reverse().slice(0, 20);
    reversed.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'timeline-event';
        const icon = getIconForEvent(ev.icon);
        const timeStr = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        div.innerHTML = `
            <span class="timeline-icon">${icon}</span>
            <div class="timeline-content">
                <strong>${ev.title}</strong> <span class="timeline-time">${timeStr}</span>
                <p>${ev.description || ''}</p>
            </div>
        `;
        map.appendChild(div);
    });
}

function getIconForEvent(iconType) {
    const map = {
        'levelup': '⚡',
        'ascension': '👑',
        'evolution': '🌀',
        'gate_cleared': '🚪',
        'red_gate_clear': '🔴',
        'quest_complete': '📜',
        'shadow_integration': '🌑',
        'title_earned': '🎖️',
        'skill_learned': '✨',
        'item_acquired': '💎',
        'blessing_gained': '🌟',
        'domain_used': '🌌',
        'milestone': '💠'
    };
    return map[iconType] || '💠';
}

function updateCompanionList() {
    if (!uiElements.companionList) return;
    const companions = gameState.companions || [];
    if (companions.length === 0) {
        uiElements.companionList.innerHTML = '<li>The space beside you is empty.</li>';
        return;
    }

    uiElements.companionList.innerHTML = '';
    companions.forEach(comp => {
        const li = document.createElement('li');
        li.dataset.companionId = comp.id;
        li.className = 'companion-item';
        const expNeeded = typeof getCompanionExpNeeded === 'function' ? getCompanionExpNeeded(comp.level || 0) : (comp.expNext || 100);
        const maxLevel = typeof COMPANION_MAX_LEVEL !== 'undefined' ? COMPANION_MAX_LEVEL : 10;
        const isMax = (comp.level || 0) >= maxLevel;

        li.innerHTML = `
            <div class="companion-header">
                <strong class="companion-name">${comp.name}</strong>
                <span class="companion-type">(${comp.type || 'Shadow'})</span>
                <span class="companion-level">Lv. ${comp.level || 0}</span>
            </div>
            <p class="companion-exp">EXP: ${comp.exp || 0} / ${isMax ? 'MAX' : expNeeded}</p>
            <div class="companion-actions">
                <button class="level-up-companion-button level-up-companion-btn" ${isMax ? 'disabled' : ''}>Feed Fragments</button>
                <button class="rename-companion-btn">Rename</button>
                <button class="dismiss-companion-btn">Dismiss</button>
            </div>
        `;
        li.querySelector('.rename-companion-btn')?.addEventListener('click', () => {
            const newName = prompt(`Enter new name for ${comp.name}:`, comp.name);
            if (newName && typeof renameCompanion === 'function') renameCompanion(comp.id, newName);
        });
        li.querySelector('.dismiss-companion-btn')?.addEventListener('click', () => {
            if (typeof dismissCompanion === 'function') dismissCompanion(comp.id);
        });
        uiElements.companionList.appendChild(li);
    });
}

function updateShopDisplay() {
    if (uiElements.shopPanel?.style.display === 'block' && typeof displayShopItems === 'function') {
        displayShopItems();
    }
}

function updateSettingsPanel() {
    if (uiElements.animatedTextToggle) uiElements.animatedTextToggle.checked = !!gameState.settings?.animatedText;
    if (uiElements.nightModeToggle) uiElements.nightModeToggle.checked = !!gameState.settings?.nightMode;
    if (uiElements.systemPromptsToggle) uiElements.systemPromptsToggle.checked = !!gameState.settings?.systemPrompts;
    if (uiElements.musicToggle) uiElements.musicToggle.checked = !!gameState.settings?.musicEnabled;
    if (uiElements.sfxToggle) uiElements.sfxToggle.checked = !!gameState.settings?.sfxEnabled;
    if (uiElements.appVersionSpan) uiElements.appVersionSpan.textContent = typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v1.1.1';
    if (typeof updateThemeSelector === 'function') updateThemeSelector();
}

function updateInventoryDisplay() {
    if (!uiElements.inventoryDisplay) return;
    uiElements.inventoryDisplay.innerHTML = '';
    if (!gameState.inventory || gameState.inventory.length === 0) {
        uiElements.inventoryDisplay.innerHTML = '<p class="inventory-empty-message">Empty.</p>';
        return;
    }
    const ul = document.createElement('ul');
    ul.classList.add('inventory-list');
    gameState.inventory.forEach(itemEntry => {
        const itemData = typeof getItemData === 'function' ? getItemData(itemEntry.id) : null;
        if (!itemData) return;
        const li = document.createElement('li');
        li.dataset.itemId = itemEntry.id;
        li.tabIndex = 0;
        const itemRarity = itemData.rarity || (typeof RARITY !== 'undefined' ? RARITY.COMMON : 'Common');
        const eqSlots = typeof EQUIPMENT_SLOTS !== 'undefined' ? EQUIPMENT_SLOTS : ['weapon', 'armor', 'accessory'];
        const isEquippable = eqSlots.includes(itemData.slot);
        const isUsable = ['Consumable', 'Potion', 'Boost', 'Utility', 'SkillBook'].includes(itemData.type);
        const sellValueText = itemData.sellValue > 0 ? ` | Sell: ${itemData.sellValue} Karma` : '';

        li.innerHTML = `
            <span class="item-name rarity-${itemRarity.toLowerCase()}">${itemData.name}</span>
            <span class="item-quantity">(x${itemEntry.quantity || 1})</span>
            <span class="item-desc" title="${itemData.description || ''}">${itemData.type || 'Item'}${sellValueText}</span>
            <div class="item-actions">
                <button class="item-details-button" title="View Details">Info</button>
                ${isEquippable ? `<button class="equip-item-button">Equip</button>` : ''}
                ${isUsable ? `<button class="use-item-button">Use</button>` : ''}
                ${itemData.sellValue > 0 ? `<button class="sell-item-button">Sell</button>` : ''}
            </div>`;
        ul.appendChild(li);
    });
    uiElements.inventoryDisplay.appendChild(ul);
}

function updateEquipmentDisplay() {
    if (!uiElements.equipmentDisplay) return;
    uiElements.equipmentDisplay.innerHTML = '';
    let hasEquipped = false;
    const eqSlots = typeof EQUIPMENT_SLOTS !== 'undefined' ? EQUIPMENT_SLOTS : ['weapon', 'armor', 'accessory'];

    eqSlots.forEach(slot => {
        const itemId = gameState.equipment?.[slot];
        const itemData = itemId && typeof getItemData === 'function' ? getItemData(itemId) : null;
        const slotElement = document.createElement('div');
        slotElement.classList.add('equipment-slot');
        slotElement.dataset.slot = slot;
        const displayName = slot.replace(/([A-Z])/g, ' $1').replace(/(\d)/g,' $1').replace(/^./, str => str.toUpperCase());

        if (itemData) {
            hasEquipped = true;
            const itemRarity = itemData.rarity || (typeof RARITY !== 'undefined' ? RARITY.COMMON : 'Common');
            slotElement.innerHTML = `
                <span class="slot-name">${displayName}:</span>
                <span class="equipped-item rarity-${itemRarity.toLowerCase()}" title="${itemData.description || ''}">${itemData.name}</span>
                <div class="item-actions">
                    <button class="item-details-button" data-item-id="${itemId}" title="View Details">Info</button>
                    <button class="unequip-button" data-slot="${slot}">Unequip</button>
                </div>`;
        } else {
            slotElement.innerHTML = `<span class="slot-name">${displayName}:</span><span class="equipped-item empty">- Empty -</span>`;
        }
        uiElements.equipmentDisplay.appendChild(slotElement);
    });
    if (!hasEquipped) {
        uiElements.equipmentDisplay.innerHTML += '<p class="equipment-empty-message">No items equipped.</p>';
    }
}

function updateSkillDisplay() {
    if (!uiElements.skillsDisplay) return;
    uiElements.skillsDisplay.innerHTML = '';
    if (!gameState.unlockedSkills || gameState.unlockedSkills.length === 0) {
        uiElements.skillsDisplay.innerHTML = '<p class="skills-empty-message">No skills learned.</p>';
        return;
    }
    const ul = document.createElement('ul');
    ul.classList.add('skills-list');

    gameState.unlockedSkills.forEach(skillId => {
        const skillData = typeof getSkillData === 'function' ? getSkillData(skillId) : null;
        if (!skillData) return;
        const li = document.createElement('li');
        li.dataset.skillId = skillId;
        li.tabIndex = 0;
        const skillRarity = skillData.rarity || (typeof RARITY !== 'undefined' ? RARITY.UNCOMMON : 'Uncommon');
        const now = Date.now();
        const cooldownEnd = gameState.activeSkillCooldowns?.[skillId];
        const onCooldown = cooldownEnd && now < cooldownEnd;
        const remainingCooldown = onCooldown && typeof formatTimeRemaining === 'function' ? formatTimeRemaining(cooldownEnd - now) : '';
        const manaCostText = skillData.manaCost > 0 ? ` | Cost: ${skillData.manaCost} MP` : '';
        const cooldownText = skillData.cooldown > 0 ? ` | CD: ${skillData.cooldown}s` : 'None';

        li.innerHTML = `
            <div class="skill-info">
                <span class="skill-name rarity-${skillRarity.toLowerCase()}">${skillData.name}</span>
                <span class="skill-type">(${skillData.passive ? 'Passive' : `Active${manaCostText}${cooldownText}`})</span>
                <p class="skill-desc">${skillData.description || ''}</p>
            </div>
            <div class="skill-action">
                 <button class="item-details-button" title="View Details">Info</button>
                 ${!skillData.passive ? `<div class="cooldown-timer ${onCooldown ? 'active' : ''}"><button class="activate-skill-button" ${onCooldown ? 'disabled' : ''}>${onCooldown ? `${remainingCooldown}` : 'Activate'}</button></div>` : ''}
            </div>`;
        ul.appendChild(li);
    });
    uiElements.skillsDisplay.appendChild(ul);
    updateSkillCooldownTimers();
}

function updateSkillCooldownTimers() {
    const activeCooldowns = gameState.activeSkillCooldowns || {};
    const now = Date.now();
    const hasActiveCD = Object.values(activeCooldowns).some(cd => cd > now);

    if (hasActiveCD && !skillTimerInterval) {
        skillTimerInterval = setInterval(() => {
            const currentNow = Date.now();
            let anyStillActive = false;
            for (const sId in gameState.activeSkillCooldowns) {
                if (gameState.activeSkillCooldowns[sId] > currentNow) {
                    anyStillActive = true;
                } else {
                    delete gameState.activeSkillCooldowns[sId];
                }
            }
            updateSkillDisplay();
            if (!anyStillActive) {
                clearInterval(skillTimerInterval);
                skillTimerInterval = null;
            }
        }, 1000);
    }
}

// --- Modal Management ---
function showModal(type = 'prompt', title = null, modalClass = null) {
    if (!uiElements.modalContainer) initUIElements();
    currentModalType = type;
    const container = uiElements.modalContainer || document.getElementById('modal-container');
    const content = uiElements.modalContent || document.getElementById('modal-content');
    const settingsPanel = uiElements.settingsPanel || document.getElementById('settings-panel-content');
    const devModePanel = uiElements.devModePanel || document.getElementById('dev-mode-panel-content');
    const modalBody = document.getElementById('modal-body');
    const modalActions = uiElements.modalActions || document.getElementById('modal-actions');

    if (!container) return;

    if (content) {
        content.className = 'glowing-border';
        if (modalClass) content.classList.add(modalClass);
    }

    if (settingsPanel) settingsPanel.style.display = (type === 'settings') ? 'block' : 'none';
    if (devModePanel) devModePanel.style.display = (type === 'dev') ? 'block' : 'none';
    if (modalBody) modalBody.style.display = (type === 'settings' || type === 'dev') ? 'none' : 'block';
    if (modalActions) modalActions.style.display = (type === 'settings' || type === 'dev') ? 'none' : 'flex';

    if (title && uiElements.modalTitle) {
        uiElements.modalTitle.textContent = title;
    } else if (uiElements.modalTitle) {
        if (type === 'settings') uiElements.modalTitle.textContent = 'Divine Settings';
        else if (type === 'dev') uiElements.modalTitle.textContent = 'Divine Developer Mode';
        else uiElements.modalTitle.textContent = 'System Message';
    }

    container.style.display = 'flex';
}

function hideModal() {
    const container = uiElements.modalContainer || document.getElementById('modal-container');
    if (container) {
        container.style.display = 'none';
    }
    currentModalType = null;
}

function setModalContent(title, messageHtml, actionsHtml = null) {
    if (uiElements.modalTitle && title) uiElements.modalTitle.innerHTML = title;
    const msgEl = uiElements.modalMessageText || document.getElementById('modal-message-text');
    if (msgEl) {
        if (gameState?.settings?.animatedText && typeof startTypingAnimation === 'function') {
            startTypingAnimation(msgEl, messageHtml, true);
        } else {
            msgEl.innerHTML = messageHtml;
        }
    }
    const actionsEl = uiElements.modalActions || document.getElementById('modal-actions');
    if (actionsEl && actionsHtml !== null) {
        actionsEl.innerHTML = actionsHtml;
    }
}

function showModalMessage(message, title = "System Message") {
    showModal('prompt', title);
    setModalContent(title, message, '<button class="modal-close">Acknowledge</button>');
}

function showSuccessModal(message, title = "Success") {
    showModal('success', title, 'modal-success');
    setModalContent(title, message, '<button class="modal-close">Acknowledge</button>');
}

function showErrorModal(message, title = "Alert") {
    showModal('error', title, 'modal-error');
    setModalContent(title, message, '<button class="modal-close">Acknowledge</button>');
}

// --- Loading Overlay ---
function hideLoadingOverlay() {
    console.log("Hiding Loading Overlay...");
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 800);
    }
}

// --- User Interaction Helpers ---
function askForPlayerName() {
    showModal('prompt', 'Identity Verification');
    setModalContent(
        'Identity Verification',
        '<p>Awakened entity, state your name:</p><input type="text" id="player-name-input" placeholder="Enter name..." style="padding: 8px; width: 80%; background: #000; border: 1px solid #00ccff; color: #fff; margin-top: 10px;">',
        '<button id="submit-player-name">Confirm Identity</button>'
    );
}

function activateKarmaMirror() {
    const mirrorReflection = uiElements.mirrorReflection || document.getElementById('mirror-reflection');
    const mirrorOutput = uiElements.mirrorOutput || document.getElementById('mirror-output');
    if (!mirrorReflection || !mirrorOutput) return;

    if (typeof playSfx === 'function') playSfx('mirror-activate');
    mirrorReflection.style.display = 'block';

    const align = gameState.alignment || 0;
    let alignmentText = "Pure Balance";
    if (align > 50) alignmentText = "Radiant Light Sovereign";
    else if (align > 15) alignmentText = "Walking in the Light";
    else if (align < -50) alignmentText = "Monarch of Absolute Shadows";
    else if (align < -15) alignmentText = "Shrouded in Darkness";

    const quotes = [
        "The shadows obey only those who conquer themselves.",
        "Your reflection reveals neither friend nor foe, only potential.",
        "Every choice bends the fabric of your awakening.",
        "True strength is not without fear, but the mastery of it."
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    mirrorOutput.innerHTML = `
        <p><strong>Alignment:</strong> <span class="${align >= 0 ? 'rarity-legendary' : 'rarity-epic'}">${alignmentText} (${align})</span></p>
        <p><strong>Karma Resonance:</strong> ${gameState.currency?.karma || 0}</p>
        <p class="mirror-quote">"${quote}"</p>
    `;
}

function showItemDetailsModal(itemId) {
    const item = typeof getItemData === 'function' ? getItemData(itemId) : null;
    if (!item) return;

    const rarity = item.rarity || 'Common';
    let details = `<p><strong>Type:</strong> ${item.type || 'Item'}</p>`;
    details += `<p><strong>Rarity:</strong> <span class="rarity-${rarity.toLowerCase()}">${rarity}</span></p>`;
    details += `<p><strong>Description:</strong> ${item.description || ''}</p>`;
    if (item.effects) {
        details += `<p><strong>Effects:</strong> ${JSON.stringify(item.effects)}</p>`;
    }
    if (item.sellValue) {
        details += `<p><strong>Sell Value:</strong> ${item.sellValue} Karma</p>`;
    }

    showModal('prompt', item.name);
    setModalContent(item.name, details, '<button class="modal-close">Close</button>');
}

function showSkillDetailsModal(skillId) {
    const skill = typeof getSkillData === 'function' ? getSkillData(skillId) : null;
    if (!skill) return;

    const rarity = skill.rarity || 'Uncommon';
    let details = `<p><strong>Type:</strong> ${skill.passive ? 'Passive' : 'Active'}</p>`;
    details += `<p><strong>Rarity:</strong> <span class="rarity-${rarity.toLowerCase()}">${rarity}</span></p>`;
    details += `<p><strong>Mana Cost:</strong> ${skill.manaCost || 0} MP</p>`;
    details += `<p><strong>Cooldown:</strong> ${skill.cooldown || 0}s</p>`;
    details += `<p><strong>Description:</strong> ${skill.description || ''}</p>`;

    showModal('prompt', skill.name);
    setModalContent(skill.name, details, '<button class="modal-close">Close</button>');
}

function toggleCommandInput() {
    const sec = uiElements.systemCommandSection || document.getElementById('system-command');
    if (!sec) return;
    if (sec.style.display === 'none' || !sec.style.display) {
        sec.style.display = 'flex';
        uiElements.commandInput?.focus();
    } else {
        sec.style.display = 'none';
    }
}

function toggleShop() {
    const panel = uiElements.shopPanel || document.getElementById('spiritual-shop');
    if (!panel) return;
    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'block';
        if (typeof displayShopItems === 'function') displayShopItems();
    } else {
        panel.style.display = 'none';
    }
}

console.log("UI Module Loaded OK.");