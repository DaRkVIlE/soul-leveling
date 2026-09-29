// js/state.js
// Version: v1.1.1 - Core Game State Management (Restored & Functional)

console.log("Loading State Module (Restored)...");

let gameState = {}; // Populated by initializeState

function getDefaultGameState() {
    return {
        playerName: "Player Gabriel",
        title: "Seeker",
        systemName: "The System",
        level: 1,
        currentClassRank: 'C',
        currentClass: 'Seeker (Rank C) | Soul Traveler',
        spiritualClass: 'Seeker (Rank C) | Soul Traveler',
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        exp: 0,
        expNext: 100,
        statPoints: 5,
        stats: {
            awakening: 10,
            intuition: 10,
            energy: 10,
            willpower: 10,
            resonance: 10
        },
        baseStats: {
            awakening: 10,
            intuition: 10,
            energy: 10,
            willpower: 10,
            resonance: 10
        },
        currency: {
            karma: 150,
            fragments: 25,
            tokens: 5
        },
        inventory: [
            { id: 'wpn_seeker_dagger', quantity: 1 },
            { id: 'boost002', quantity: 3 },
            { id: 'item_hp_potion_small', quantity: 2 },
            { id: 'item_instant_dungeon_01', quantity: 1 }
        ],
        equipment: {
            mainHand: 'wpn_seeker_dagger',
            offHand: null,
            armor: null,
            accessory1: null,
            accessory2: null
        },
        unlockedSkills: ['skill_mana_infusion', 'skill_quick_learner'],
        activeSkillCooldowns: {},
        companions: [],
        activeQuests: [],
        completedQuests: [],
        journalEntries: [],
        timeline: [],
        titles: ['lightwalker'],
        alignment: 10,
        unlockedAbilities: ['statBoostMinor'],
        activeEffects: [],
        activeBlessing: null,
        achievements: {
            currentTitleKey: 'lightwalker'
        },
        context: {},
        lastLogin: Date.now(),
        settings: {
            userNameSet: true,
            animatedText: true,
            nightMode: true,
            systemPrompts: true,
            musicEnabled: false,
            sfxEnabled: true,
            theme: 'default'
        }
    };
}

function initializeState() {
    try {
        const loaded = typeof loadState === 'function' ? loadState() : null;
        if (loaded && loaded.level !== undefined) {
            gameState = deepMerge(getDefaultGameState(), loaded);
        } else {
            gameState = getDefaultGameState();
        }
    } catch {
        gameState = getDefaultGameState();
    }
    updateMaxStats();
    updateExpNeeded();
    console.log("State initialized successfully for:", gameState.playerName);
}

function updateExpNeeded() {
    const lvl = gameState.level || 1;
    gameState.expNext = Math.floor(100 * Math.pow(1.22, lvl - 1));
}

function updateMaxStats() {
    try {
        if (typeof calculateMaxHp === 'function') {
            gameState.maxHp = calculateMaxHp();
        } else {
            gameState.maxHp = 100 + ((gameState.stats?.willpower || 10) - 10) * 10;
        }
        if (typeof calculateMaxMp === 'function') {
            gameState.maxMp = calculateMaxMp();
        } else {
            gameState.maxMp = 50 + ((gameState.stats?.resonance || 10) - 10) * 5;
        }
        gameState.hp = Math.min(gameState.hp || gameState.maxHp, gameState.maxHp);
        gameState.mp = Math.min(gameState.mp || gameState.maxMp, gameState.maxMp);
    } catch (e) {
        console.warn("Could not calculate dynamic max stats:", e);
    }
}

function addExp(amount) {
    if (amount <= 0) return;
    const mult = typeof calculateExpMultiplier === 'function' ? calculateExpMultiplier() : 1.0;
    const finalAmount = Math.round(amount * mult);
    gameState.exp = (gameState.exp || 0) + finalAmount;
    if (typeof playSfx === 'function') playSfx('expGain');
    if (typeof notifyInfo === 'function') notifyInfo(`+${finalAmount} EXP gained!`);
    checkLevelUp();
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function checkLevelUp() {
    let leveledUp = false;
    while (gameState.exp >= gameState.expNext && (gameState.level || 1) < (typeof MAX_LEVEL !== 'undefined' ? MAX_LEVEL : 100)) {
        gameState.exp -= gameState.expNext;
        gameState.level = (gameState.level || 1) + 1;
        gameState.statPoints = (gameState.statPoints || 0) + (typeof STAT_POINTS_PER_LEVEL !== 'undefined' ? STAT_POINTS_PER_LEVEL : 2);
        updateExpNeeded();
        updateMaxStats();
        gameState.hp = gameState.maxHp;
        gameState.mp = gameState.maxMp;
        leveledUp = true;
    }
    if (leveledUp) {
        if (typeof playSfx === 'function') { playSfx('levelup'); playSfx('levelup-whoosh'); }
        if (typeof showSuccessModal === 'function') {
            showSuccessModal(`Level Up! You have reached Level ${gameState.level}!\nStat Points Granted: +${STAT_POINTS_PER_LEVEL}`, "LEVEL UP");
        } else if (typeof notifySuccess === 'function') {
            notifySuccess(`LEVEL UP! You are now Level ${gameState.level}!`);
        }
        checkRankAscension();
        checkSoulClassTransformation();
    }
}

function checkRankAscension() {
    if (typeof CLASSES === 'undefined') return;
    const lvl = gameState.level || 1;
    let highestClass = null;
    Object.keys(CLASSES).map(Number).sort((a,b) => a - b).forEach(reqLvl => {
        if (lvl >= reqLvl) highestClass = CLASSES[reqLvl];
    });
    if (highestClass && highestClass.rank !== gameState.currentClassRank) {
        gameState.currentClassRank = highestClass.rank;
        gameState.currentClass = `${highestClass.name} (Rank ${highestClass.rank})`;
        if (highestClass.unlocks) {
            gameState.unlockedAbilities = Array.from(new Set([...(gameState.unlockedAbilities || []), ...highestClass.unlocks]));
        }
        if (typeof notifySuccess === 'function') {
            notifySuccess(`Rank Ascension! Promoted to Rank ${highestClass.rank} (${highestClass.name})`);
        }
    }
}

function grantAwakeningRank(targetRank) {
    gameState.currentClassRank = targetRank;
    gameState.currentClass = `Monarch (Rank ${targetRank})`;
    increaseStatBase('awakening', 10);
    increaseStatBase('resonance', 10);
}

function checkSoulClassTransformation() {
    const s = gameState.stats || {};
    if (s.resonance >= 30 && s.intuition >= 30) {
        gameState.spiritualClass = "Void Walker";
    } else if (s.willpower >= 30 && s.energy >= 30) {
        gameState.spiritualClass = "Shadow Sovereign";
    }
}

function increaseStat(statName, amount = 1) {
    if ((gameState.statPoints || 0) < amount) {
        if (typeof showErrorModal === 'function') showErrorModal("Not enough stat points available.");
        return;
    }
    gameState.statPoints -= amount;
    increaseStatBase(statName, amount);
    if (typeof playSfx === 'function') playSfx('stat-allocate');
}

function increaseStatBase(statName, amount) {
    if (!gameState.stats) gameState.stats = {};
    gameState.stats[statName] = (gameState.stats[statName] || 10) + amount;
    updateMaxStats();
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function addCurrency(type, amount) {
    if (!gameState.currency) gameState.currency = { karma: 0, fragments: 0, tokens: 0 };
    gameState.currency[type] = (gameState.currency[type] || 0) + amount;
    if (typeof playSfx === 'function') playSfx('currencyGain');
    if (typeof notifyInfo === 'function') notifyInfo(`+${amount} ${type.toUpperCase()}`);
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function spendCurrency(type, amount) {
    if (!gameState.currency) return false;
    if ((gameState.currency[type] || 0) < amount) {
        if (typeof showErrorModal === 'function') showErrorModal(`Not enough ${type} (Need: ${amount}, Have: ${gameState.currency[type] || 0})`);
        return false;
    }
    gameState.currency[type] -= amount;
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
    return true;
}

function addInventoryItem(itemData) {
    if (!itemData || !itemData.id) return;
    if (!gameState.inventory) gameState.inventory = [];
    const existing = gameState.inventory.find(i => i.id === itemData.id);
    if (existing && itemData.stackable !== false) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        gameState.inventory.push({ id: itemData.id, quantity: 1 });
    }
    if (typeof notifySuccess === 'function') notifySuccess(`Acquired: ${itemData.name || itemData.id}`);
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function removeInventoryItem(itemId, quantity = 1) {
    if (!gameState.inventory) return;
    const idx = gameState.inventory.findIndex(i => i.id === itemId);
    if (idx !== -1) {
        gameState.inventory[idx].quantity -= quantity;
        if (gameState.inventory[idx].quantity <= 0) {
            gameState.inventory.splice(idx, 1);
        }
        if (typeof saveState === 'function') saveState();
        if (typeof updateUI === 'function') updateUI();
    }
}

function equipItem(itemId) {
    const itemData = typeof getItemData === 'function' ? getItemData(itemId) : null;
    if (!itemData || !itemData.slot) return;
    const slot = itemData.slot;
    if (gameState.equipment?.[slot]) {
        unequipItem(slot);
    }
    removeInventoryItem(itemId, 1);
    if (!gameState.equipment) gameState.equipment = {};
    gameState.equipment[slot] = itemId;
    updateMaxStats();
    if (typeof playSfx === 'function') playSfx('click');
    if (typeof notifySuccess === 'function') notifySuccess(`Equipped ${itemData.name}`);
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function unequipItem(slot) {
    if (!gameState.equipment || !gameState.equipment[slot]) return;
    const itemId = gameState.equipment[slot];
    const itemData = typeof getItemData === 'function' ? getItemData(itemId) : null;
    gameState.equipment[slot] = null;
    if (itemData) addInventoryItem(itemData);
    updateMaxStats();
    if (typeof playSfx === 'function') playSfx('click');
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function useInventoryItem(itemId) {
    const itemData = typeof getItemData === 'function' ? getItemData(itemId) : null;
    if (!itemData) return;

    if (itemData.effects?.target === 'hp') {
        gameState.hp = Math.min(gameState.maxHp, (gameState.hp || 0) + itemData.effects.amount);
        if (typeof notifySuccess === 'function') notifySuccess(`Restored ${itemData.effects.amount} HP!`);
    } else if (itemData.effects?.target === 'mp') {
        gameState.mp = Math.min(gameState.maxMp, (gameState.mp || 0) + itemData.effects.amount);
        if (typeof notifySuccess === 'function') notifySuccess(`Restored ${itemData.effects.amount} MP!`);
    } else if (itemData.effects?.target === 'exp') {
        addExp(itemData.effects.amount);
    } else if (itemData.effects?.action === 'triggerGate') {
        if (typeof triggerRandomGate === 'function') triggerRandomGate();
    } else if (itemData.effect?.unlocksSkill) {
        if (!gameState.unlockedSkills.includes(itemData.effect.unlocksSkill)) {
            gameState.unlockedSkills.push(itemData.effect.unlocksSkill);
            if (typeof notifySuccess === 'function') notifySuccess(`Learned new skill!`);
        }
    }

    removeInventoryItem(itemId, 1);
    if (typeof playSfx === 'function') playSfx('item-use');
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function updateAlignment(change) {
    gameState.alignment = (gameState.alignment || 0) + change;
    checkBlessings();
    if (typeof saveState === 'function') saveState();
}

function checkBlessings() {
    const align = gameState.alignment || 0;
    if (align >= 50 && !gameState.activeBlessing) {
        gameState.activeBlessing = { type: 'Light', expires: Date.now() + 1000 * 60 * 30 };
        if (typeof notifySuccess === 'function') notifySuccess("Light Blessing Received!");
    } else if (align <= -50 && !gameState.activeBlessing) {
        gameState.activeBlessing = { type: 'Shadow', expires: Date.now() + 1000 * 60 * 30 };
        if (typeof notifyWarning === 'function') notifyWarning("Shadow Awakening Active!");
    }
}

function activateSkill(skillId) {
    const skillData = typeof getSkillData === 'function' ? getSkillData(skillId) : null;
    if (!skillData) return;
    if (skillData.passive) return;

    const now = Date.now();
    const cdEnd = gameState.activeSkillCooldowns?.[skillId] || 0;
    if (now < cdEnd) {
        if (typeof showErrorModal === 'function') showErrorModal("Skill is still on cooldown!");
        return;
    }

    if ((gameState.mp || 0) < (skillData.manaCost || 0)) {
        if (typeof showErrorModal === 'function') showErrorModal("Not enough MP!");
        return;
    }

    gameState.mp -= (skillData.manaCost || 0);
    if (!gameState.activeSkillCooldowns) gameState.activeSkillCooldowns = {};
    gameState.activeSkillCooldowns[skillId] = now + (skillData.cooldown || 10) * 1000;

    if (skillData.effects?.mpRestore) {
        gameState.mp = Math.min(gameState.maxMp, gameState.mp + skillData.effects.mpRestore);
    }
    if (skillData.effects?.tempBoost) {
        addTemporaryEffect(skillId, skillData.effects.tempBoost);
    }

    if (typeof playSfx === 'function') playSfx(skillData.sfx || 'item-use');
    if (typeof notifySuccess === 'function') notifySuccess(`Activated: ${skillData.name}`);
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function checkTitles() {
    // Basic unlock checks
}

function earnTitle(titleKey) {
    if (!gameState.titles) gameState.titles = [];
    if (!gameState.titles.includes(titleKey)) {
        gameState.titles.push(titleKey);
        gameState.achievements.currentTitleKey = titleKey;
        if (typeof notifySuccess === 'function') notifySuccess(`Title Earned: ${titleKey}!`);
    }
}

function addTemporaryEffect(sourceId, effectData) {
    if (!gameState.activeEffects) gameState.activeEffects = [];
    const effect = {
        id: sourceId,
        expires: Date.now() + (effectData.duration || 60) * 1000,
        ...effectData
    };
    gameState.activeEffects.push(effect);
}

function cleanupExpiredEffects() {
    if (!gameState.activeEffects) return;
    const now = Date.now();
    gameState.activeEffects = gameState.activeEffects.filter(e => !e.expires || now < e.expires);
}

function getStat(statName) { return gameState.stats?.[statName] || 10; }
function getLevel() { return gameState.level || 1; }

console.log("State Module (Restored) Loaded OK.");