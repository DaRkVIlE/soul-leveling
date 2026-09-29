// js/companions.js
// Version: v1.1.1 - Manages Companions/Shadow Soldiers (Complete Implementation)

console.log("Loading Companions Module...");

const companionTypes = [
    { type: 'Mentor', description: 'Wisdom Guide: Enhances overall EXP acquisition by 5% (+0.5% per level).' },
    { type: 'Child', description: 'Innocent Spark: 15% chance (+1% per level) to grant bonus burst EXP.' },
    { type: 'Trickster', description: 'Unpredictable Jester: Gambles on gate clears - 20% chance to double currency, 10% to halve.' },
    { type: 'Guardian', description: 'Shield of Resolve: Fortifies internal resolve and will in dire trials.' },
    { type: 'Shadow', description: 'Shadow Soldier: Silent combat resonance aiding in trials.' }
];

const companionNames = [
    'Igris', 'Iron', 'Tank', 'Beru', 'Bellion', 'Kaisel', 'Jima', 'Greed', 'Tusk',
    'Shadow', 'Echo', 'Orion', 'Zephyr', 'Nocturne', 'Astra', 'Sol', 'Luna', 'Vortex', 'Cipher', 'Kairox'
];

// --- Companion Leveling ---
function getCompanionExpNeeded(currentLevel) {
    return Math.floor(50 * Math.pow(1.25, currentLevel));
}

function addCompanionExp(companionId, amount) {
    const companion = (gameState.companions || []).find(c => c.id == companionId);
    const maxLevel = typeof COMPANION_MAX_LEVEL !== 'undefined' ? COMPANION_MAX_LEVEL : 10;
    const currentLevel = Number(companion?.level) || 0;
    if (!companion || currentLevel >= maxLevel) return 0;
    const actualAmount = Math.max(1, Math.floor(amount));
    companion.exp = (Number(companion.exp) || 0) + actualAmount;
    console.log(`Companion ${companion.name} gained ${actualAmount} EXP.`);
    checkCompanionLevelUp(companion);
    return actualAmount;
}

function grantExpToAllCompanions(basePlayerExpGain) {
    if (!gameState.companions || gameState.companions.length === 0) return;
    const expPerCompanion = Math.max(1, Math.floor(basePlayerExpGain * 0.1));
    console.log(`Granting ${expPerCompanion} EXP to each active companion.`);
    let stateChangedByLevelUp = false;
    gameState.companions.forEach(comp => {
        const added = addCompanionExp(comp.id, expPerCompanion);
        if (added > 0) stateChangedByLevelUp = true;
    });
    if (stateChangedByLevelUp) {
        if (typeof saveState === 'function') saveState();
        if (typeof updateCompanionList === 'function') updateCompanionList();
    }
}

function checkCompanionLevelUp(companion) {
    let leveledUp = false;
    let currentLevel = Number(companion.level) || 0;
    let currentExp = Number(companion.exp) || 0;
    let expNext = Number(companion.expNext) || getCompanionExpNeeded(currentLevel);
    const maxLevel = typeof COMPANION_MAX_LEVEL !== 'undefined' ? COMPANION_MAX_LEVEL : 10;

    while (currentLevel < maxLevel && currentExp >= expNext) {
        currentExp -= expNext;
        currentLevel++;
        leveledUp = true;
        expNext = getCompanionExpNeeded(currentLevel);
        console.log(`Companion ${companion.name} Leveled Up to Level ${currentLevel}!`);
        if (typeof notifySuccess === 'function') notifySuccess(`${companion.name} reached Level ${currentLevel}!`);
        if (typeof playSfx === 'function') playSfx('levelup');
    }
    companion.level = currentLevel;
    companion.exp = currentExp;
    companion.expNext = (currentLevel < maxLevel) ? expNext : 0;
    if (leveledUp) {
        if (typeof updateUI === 'function') updateUI();
    }
}

// --- Companion Management ---
function summonCompanion() {
    const maxCompanions = 3;
    if ((gameState.companions || []).length >= maxCompanions) {
        if (typeof showErrorModal === 'function') showErrorModal(`Cannot guide more than ${maxCompanions} companions.`);
        return;
    }
    const summonCost = typeof SUMMON_COMPANION_COST !== 'undefined' ? SUMMON_COMPANION_COST : 10;
    if (typeof spendCurrency === 'function' && !spendCurrency('fragments', summonCost)) {
        return;
    }

    const randomTypeData = companionTypes[Math.floor(Math.random() * companionTypes.length)];
    let randomName;
    let attempts = 0;
    do {
        randomName = companionNames[Math.floor(Math.random() * companionNames.length)];
        attempts++;
    } while ((gameState.companions || []).some(c => c.name === randomName) && attempts < 50);

    const newCompanion = {
        id: Date.now() + Math.random(),
        name: randomName,
        type: randomTypeData.type,
        summonedAt: Date.now(),
        level: 0,
        exp: 0,
        expNext: getCompanionExpNeeded(0)
    };

    if (!gameState.companions) gameState.companions = [];
    gameState.companions.push(newCompanion);
    console.log(`Summoned Companion: ${newCompanion.name} (Lvl ${newCompanion.level}) (${newCompanion.type})`);

    if (typeof playSfx === 'function') playSfx('summon');
    if (typeof showSuccessModal === 'function') {
        showSuccessModal(`A presence joins you: ${newCompanion.name}, the ${newCompanion.type}.\n${randomTypeData.description}`, "Summoning Successful");
    }

    if (typeof saveState === 'function') saveState();
    if (typeof updateCompanionList === 'function') updateCompanionList();
    if (typeof updateUI === 'function') updateUI();
}

function renameCompanion(companionId, newName) {
    const comp = (gameState.companions || []).find(c => c.id == companionId);
    if (!comp) return;
    const cleanName = (newName || '').trim();
    if (!cleanName) {
        if (typeof showErrorModal === 'function') showErrorModal("Name cannot be empty.");
        return;
    }
    comp.name = cleanName;
    console.log(`Companion renamed to ${cleanName}`);
    if (typeof saveState === 'function') saveState();
    if (typeof updateCompanionList === 'function') updateCompanionList();
    if (typeof notifySuccess === 'function') notifySuccess(`Companion is now known as ${cleanName}`);
}

function dismissCompanion(companionId) {
    const idx = (gameState.companions || []).findIndex(c => c.id == companionId);
    if (idx === -1) return;
    const comp = gameState.companions[idx];
    if (typeof showModal === 'function') {
        showModal('prompt');
        setModalContent(
            'Dismiss Companion',
            `Are you sure you want to dismiss ${comp.name}? This will return them to the astral void.`,
            `<button id="confirm-dismiss-yes" style="background-color: var(--error-color, #ff3366); color: #fff;">Dismiss</button> <button class="modal-close">Cancel</button>`
        );
        document.getElementById('confirm-dismiss-yes')?.addEventListener('click', () => {
            gameState.companions.splice(idx, 1);
            if (typeof saveState === 'function') saveState();
            if (typeof updateCompanionList === 'function') updateCompanionList();
            if (typeof updateUI === 'function') updateUI();
            if (typeof hideModal === 'function') hideModal();
            if (typeof notifyInfo === 'function') notifyInfo(`${comp.name} has returned to the void.`);
        }, { once: true });
    }
}

// Spend fragments to level up a companion
function levelUpCompanionWithFragments(companionId, levels = 1) {
    const companion = (gameState.companions || []).find(c => c.id == companionId);
    if (!companion) {
        if (typeof showErrorModal === 'function') showErrorModal("Companion not found.");
        return;
    }
    const maxLevel = typeof COMPANION_MAX_LEVEL !== 'undefined' ? COMPANION_MAX_LEVEL : 10;
    const currentLevel = companion.level || 0;
    if (currentLevel >= maxLevel) {
        if (typeof showErrorModal === 'function') showErrorModal(`${companion.name} is at Max Level.`);
        return;
    }

    const baseCost = typeof COMPANION_LEVEL_UP_BASE_COST !== 'undefined' ? COMPANION_LEVEL_UP_BASE_COST : 5;
    const scalingCost = typeof COMPANION_LEVEL_UP_SCALING_COST !== 'undefined' ? COMPANION_LEVEL_UP_SCALING_COST : 2;
    const costPerLevel = baseCost + currentLevel * scalingCost;
    const totalCost = costPerLevel * levels;

    if (typeof spendCurrency === 'function' && !spendCurrency('fragments', totalCost)) {
        return;
    }

    companion.exp = companion.expNext || getCompanionExpNeeded(currentLevel);
    checkCompanionLevelUp(companion);
    if (typeof saveState === 'function') saveState();
    if (typeof updateCompanionList === 'function') updateCompanionList();
}

console.log("Companions Module Loaded OK.");