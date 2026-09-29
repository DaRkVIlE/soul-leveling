// js/gates.js
// Version: v1.1.1 - Manages Gate entry, conditions, and completion (Complete Implementation)

console.log("Loading Gates Module...");

// --- Gate Definitions ---
const gateTypes = [
    { type: "Fear", challenge: "Acknowledge a current fear through journaling...", clearCondition: { action: 'journal', tag: 'fear' }, rewards: { exp: { amount: 70, rarity: RARITY.COMMON }, stats: [{ name: 'willpower', amount: 2, rarity: RARITY.UNCOMMON }] }, alignment: ALIGNMENT_CHANGE.DARK_SMALL, redGateChallenge: "Confront the embodiment of dread in depth...", redGateClearCondition: { action: 'journal', tag: 'fear', minLength: 75 }, redGateRewards: { exp: { amount: 150, rarity: RARITY.UNCOMMON }, stats: [{ name: 'willpower', amount: 4, rarity: RARITY.RARE }], currency: [{ type: 'tokens', amount: 1, rarity: RARITY.RARE }] } },
    { type: "Doubt", challenge: "Identify a self-limiting belief...", clearCondition: { action: 'journal', tag: 'doubt' }, rewards: { exp: { amount: 60, rarity: RARITY.COMMON }, stats: [{ name: 'awakening', amount: 1, rarity: RARITY.COMMON }] }, alignment: ALIGNMENT_CHANGE.DARK_SMALL, redGateChallenge: "Dissect a core doubt down to its origin...", redGateClearCondition: { action: 'journal', tag: 'doubt', minLength: 75 }, redGateRewards: { exp: { amount: 130, rarity: RARITY.UNCOMMON }, stats: [{ name: 'awakening', amount: 3, rarity: RARITY.RARE }, { name: 'intuition', amount: 2, rarity: RARITY.UNCOMMON }], items: [{ id: 'item_minor_wisdom_orb', rarity: RARITY.RARE }] } },
    { type: "Anger", challenge: "Observe the sensation of anger with mindful breathwork (120s)...", clearCondition: { action: 'breathwork', duration: 120 }, rewards: { exp: { amount: 80, rarity: RARITY.UNCOMMON }, stats: [{ name: 'resonance', amount: 2, rarity: RARITY.UNCOMMON }], currency: [{ type: 'tokens', amount: 1, rarity: RARITY.RARE }] }, alignment: ALIGNMENT_CHANGE.DARK_MEDIUM, redGateChallenge: "Channel the raw energy with extended breathwork (300s)...", redGateClearCondition: { action: 'breathwork', duration: 300 }, redGateRewards: { exp: { amount: 180, rarity: RARITY.RARE }, stats: [{ name: 'resonance', amount: 4, rarity: RARITY.RARE }, { name: 'willpower', amount: 2, rarity: RARITY.UNCOMMON }], currency: [{ type: 'tokens', amount: 3, rarity: RARITY.EPIC }] } },
    { type: "Anxiety", challenge: "Ground yourself in the present reality...", clearCondition: { action: 'grounding' }, rewards: { exp: { amount: 50, rarity: RARITY.COMMON }, stats: [{ name: 'intuition', amount: 1, rarity: RARITY.COMMON }] }, alignment: ALIGNMENT_CHANGE.DARK_SMALL, redGateRewards: { exp: { amount: 110, rarity: RARITY.UNCOMMON }, stats: [{ name: 'intuition', amount: 3, rarity: RARITY.RARE }, { name: 'resonance', amount: 1, rarity: RARITY.COMMON }] } },
    { type: "Resilience", challenge: "Recall a past challenge and reflect on your strength...", clearCondition: { action: 'journal', tag: 'resilience' }, rewards: { exp: { amount: 100, rarity: RARITY.UNCOMMON }, stats: [{ name: 'willpower', amount: 1, rarity: RARITY.COMMON }, { name: 'awakening', amount: 1, rarity: RARITY.COMMON }] }, alignment: ALIGNMENT_CHANGE.LIGHT_SMALL, redGateRewards: { exp: { amount: 220, rarity: RARITY.RARE }, stats: [{ name: 'willpower', amount: 3, rarity: RARITY.RARE }, { name: 'awakening', amount: 2, rarity: RARITY.UNCOMMON }], currency: [{ type: 'fragments', amount: 5, rarity: RARITY.RARE }], items: [{ id: 'item_instant_dungeon_01', rarity: RARITY.LEGENDARY }] } },
    { type: "Awakening Trial", isAwakeningGate: true, challenge: "Face a reflection of your potential in combat...", clearCondition: { action: 'awakening_gate_clear' }, rewards: {}, alignment: 0 }
];

function triggerRandomGate(forceRed = false) {
    if (gameState.currentGate) {
        if (typeof showErrorModal === 'function') showErrorModal("You are already within a gate!");
        return;
    }
    const availableGates = gateTypes.filter(g => !g.isAwakeningGate);
    if (availableGates.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableGates.length);
    let gateData = { ...availableGates[randomIndex] };
    let isRed = forceRed || (Math.random() < (typeof RED_GATE_CHANCE !== 'undefined' ? RED_GATE_CHANCE : 0.15));
    let gateEntryMessage = "You have entered a shadow gate. Face what lies within.";
    let gateTitle = `Gate of ${gateData.type}`;
    let activeClearCondition = gateData.clearCondition;

    if (isRed) {
        console.log(`!!! RED GATE TRIGGERED: ${gateData.type} !!!`);
        let redMsgKey = `redGateEntry_${gateData.type}`;
        let redWarn = (typeof messages !== 'undefined' && messages[redMsgKey]) ? messages[redMsgKey][Math.floor(Math.random() * messages[redMsgKey].length)] : "Alert: Red Gate Sector Entered. Extreme Caution Advised.";
        gateEntryMessage = `${redWarn}\n${gateEntryMessage}\n<span class="rarity-rare">This Gate resonates with heightened intensity.</span>`;
        gateTitle = `<span class="rarity-epic">Red Gate</span> of ${gateData.type}`;
        gateData.challenge = gateData.redGateChallenge || gateData.challenge;
        activeClearCondition = gateData.redGateClearCondition || gateData.clearCondition;
    }

    gameState.currentGate = {
        type: gateData.type,
        challenge: gateData.challenge,
        clearCondition: activeClearCondition,
        rewards: gateData.rewards,
        redGateRewards: gateData.redGateRewards,
        startTime: Date.now(),
        isRed: isRed,
        isAwakeningGate: false
    };

    console.log(`Entering ${isRed ? 'Red ' : ''}Gate: ${gateData.type}`);
    if (typeof playSfx === 'function') playSfx(isRed ? 'red-gate-alert' : 'gate-open');
    if (typeof playMusic === 'function') playMusic(isRed ? 'red-gate' : 'gate');
    if (typeof triggerGateOpenAnimation === 'function') triggerGateOpenAnimation();
    if (isRed) document.body.classList.add('red-gate-active');

    if (typeof showModal === 'function') {
        showModal('gateEntry');
        setModalContent(
            gateTitle,
            `${gateEntryMessage}\n\n<strong>Challenge:</strong> ${gateData.challenge}`,
            '<button id="accept-gate-challenge" class="modal-close">Accept Challenge</button> <button id="flee-gate">Attempt to Flee</button>'
        );
    }

    if (typeof updateAIContext === 'function') updateAIContext({ action: 'in_gate', gateType: gateData.type, isRed: isRed, recentEmotion: 'turbulent' });
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function triggerAwakeningGate() {
    if (gameState.currentGate) {
        if (typeof showErrorModal === 'function') showErrorModal("You are already within a gate!");
        return;
    }

    const awakeningGate = gateTypes.find(g => g.isAwakeningGate) || {
        type: "Awakening Trial",
        challenge: "Overcome your limits in combat simulation...",
        clearCondition: { action: 'awakening_gate_clear' }
    };

    gameState.currentGate = {
        type: awakeningGate.type,
        challenge: awakeningGate.challenge,
        clearCondition: awakeningGate.clearCondition,
        isRed: false,
        isAwakeningGate: true,
        startTime: Date.now()
    };

    console.log("Entering Awakening Trial Gate!");
    if (typeof playSfx === 'function') playSfx('gate-open');
    if (typeof playMusic === 'function') playMusic('awakening-trial');
    if (typeof triggerGateOpenAnimation === 'function') triggerGateOpenAnimation();

    if (typeof showModal === 'function') {
        showModal('gateEntry');
        setModalContent(
            '<span class="rarity-legendary">Awakening Trial</span>',
            "The system presents the trial of Ascension. Prepare yourself for combat against the threshold guardian.",
            '<button id="start-awakening-combat">Commence Battle</button>'
        );
        document.getElementById('start-awakening-combat')?.addEventListener('click', () => {
            if (typeof startCombatSimulation === 'function') {
                startCombatSimulation(gameState.currentGate);
            }
        }, { once: true });
    }

    if (typeof updateAIContext === 'function') updateAIContext({ action: 'in_gate', gateType: 'Awakening Trial', recentEmotion: 'focused' });
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function attemptGateClear(actionData) {
    if (!gameState.currentGate) return false;
    const cond = gameState.currentGate.clearCondition;
    if (!cond) return false;

    let cleared = false;
    if (cond.action === 'journal' && actionData.type === 'journal') {
        const hasTag = !cond.tag || (actionData.tags && actionData.tags.includes(cond.tag));
        const meetsLength = !cond.minLength || (actionData.text && actionData.text.length >= cond.minLength);
        if (hasTag && meetsLength) {
            cleared = true;
        }
    } else if (cond.action === 'breathwork' && actionData.type === 'breathwork') {
        if (!cond.duration || (actionData.duration && actionData.duration >= cond.duration)) {
            cleared = true;
        }
    } else if (cond.action === 'grounding' && actionData.type === 'grounding') {
        cleared = true;
    } else if (cond.action === 'awakening_gate_clear' && actionData.type === 'awakening_gate_clear') {
        cleared = true;
    }

    if (cleared) {
        completeGate();
        return true;
    } else {
        if (typeof notifyWarning === 'function') notifyWarning("Gate condition unmet. Strengthen your effort.");
        return false;
    }
}

function completeGate() {
    if (!gameState.currentGate) return;
    const gateData = gameState.currentGate;
    const wasRed = gateData.isRed;
    const wasAwakening = gateData.isAwakeningGate;
    console.log(`Clearing ${wasRed ? 'Red ' : ''}${wasAwakening ? 'Awakening ' : ''}Gate: ${gateData.type}`);

    // --- Handle Awakening Gate Completion ---
    if (wasAwakening) {
        const awakeningQuest = (gameState.activeQuests || []).find(q => q.id === (typeof AWAKENING_QUEST_ID !== 'undefined' ? AWAKENING_QUEST_ID : 'awakening_001'));
        if (awakeningQuest) {
            console.log("Marking Awakening Quest as complete.");
            let originalRewards = (typeof getQuestData === 'function' ? getQuestData(awakeningQuest.id) : null)?.rewards || awakeningQuest.rewards || {};
            let finalRewards = JSON.parse(JSON.stringify(originalRewards));

            if (finalRewards.exp?.amount > 0 && typeof addExp === 'function') addExp(finalRewards.exp.amount);
            if (finalRewards.currency?.length > 0 && typeof addCurrency === 'function') {
                finalRewards.currency.forEach(cr => addCurrency(cr.type, cr.amount));
            }
            if (finalRewards.skills?.length > 0 && typeof updateSkillDisplay === 'function') {
                finalRewards.skills.forEach(sd => {
                    if (!gameState.unlockedSkills.includes(sd.id)) {
                        gameState.unlockedSkills.push(sd.id);
                    }
                });
            }

            if (typeof grantAwakeningRank === 'function') {
                grantAwakeningRank(awakeningQuest.targetRank || 'S');
            }

            const qIdx = gameState.activeQuests.findIndex(q => q.id === awakeningQuest.id);
            if (qIdx !== -1) gameState.activeQuests.splice(qIdx, 1);
            if (!gameState.completedQuests) gameState.completedQuests = [];
            if (!gameState.completedQuests.includes(awakeningQuest.id)) gameState.completedQuests.push(awakeningQuest.id);

            if (typeof updateQuestList === 'function') updateQuestList();
            if (typeof updateSkillDisplay === 'function') updateSkillDisplay();
        }

        gameState.currentGate = null;
        if (typeof updateAIContext === 'function') updateAIContext({ action: 'idle', recentEmotion: 'triumphant' });
        if (typeof determineAndPlayCurrentMusic === 'function') determineAndPlayCurrentMusic();
        if (typeof triggerGateClearAnimation === 'function') triggerGateClearAnimation();
        if (typeof saveState === 'function') saveState();
        if (typeof updateUI === 'function') updateUI();
        return;
    }

    // --- Standard & Red Gate Completion Logic ---
    const baseGateData = gateTypes.find(g => g.type === gateData.type);
    let rewardsToGrant = wasRed ? gateData.redGateRewards : gateData.rewards;
    if (!rewardsToGrant) rewardsToGrant = baseGateData?.rewards || {};
    let finalRewards = JSON.parse(JSON.stringify(rewardsToGrant));
    let baseExpReward = finalRewards.exp?.amount || 0;

    if (typeof applyCurrencyModifiers === 'function') applyCurrencyModifiers(finalRewards);
    let childBonusExp = typeof calculateChildBonusExp === 'function' ? calculateChildBonusExp(baseExpReward) : 0;

    let actualExpObject = null;
    let actualStatsAwarded = [];
    let actualCurrenciesAwarded = [];
    let actualItemsAwarded = [];
    let actualSkillsAwarded = [];

    if (finalRewards.exp?.amount > 0 && typeof addExp === 'function') {
        addExp(finalRewards.exp.amount);
        actualExpObject = finalRewards.exp;
    }
    if (childBonusExp > 0 && typeof addExp === 'function') {
        addExp(childBonusExp);
    }
    if (finalRewards.stats?.length > 0) {
        finalRewards.stats.forEach(sr => {
            if (sr.amount > 0) {
                const mult = typeof calculateStatGainMultiplier === 'function' ? calculateStatGainMultiplier(sr.name) : 1.0;
                const amt = Math.ceil(sr.amount * mult);
                if (amt > 0 && typeof increaseStatBase === 'function') {
                    increaseStatBase(sr.name, amt);
                    actualStatsAwarded.push({ ...sr, amount: amt });
                    if (mult !== 1.0 && typeof notifyInfo === 'function') notifyInfo(`${sr.name} gain boosted! (+${amt - sr.amount})`);
                }
            }
        });
    }
    if (finalRewards.currency?.length > 0 && typeof addCurrency === 'function') {
        finalRewards.currency.forEach(cr => {
            if (cr.amount > 0) {
                addCurrency(cr.type, cr.amount);
                actualCurrenciesAwarded.push(cr);
            }
        });
    }
    if (finalRewards.items?.length > 0) {
        finalRewards.items.forEach(i => {
            const itemData = typeof getItemData === 'function' ? getItemData(i.id) : null;
            if (itemData && typeof addInventoryItem === 'function') {
                addInventoryItem({ ...itemData, rarity: i.rarity || itemData.rarity });
                actualItemsAwarded.push({ ...itemData, rarity: i.rarity || itemData.rarity });
            }
        });
    }
    if (finalRewards.skills?.length > 0) {
        finalRewards.skills.forEach(sd => {
            const skillData = typeof getSkillData === 'function' ? getSkillData(sd.id) : null;
            if (skillData && !gameState.unlockedSkills?.includes(sd.id)) {
                if (!gameState.unlockedSkills) gameState.unlockedSkills = [];
                gameState.unlockedSkills.push(sd.id);
                actualSkillsAwarded.push({ ...skillData, rarity: sd.rarity || skillData.rarity });
                console.log(`Skill Unlocked: ${skillData.name}`);
                if (typeof updateSkillDisplay === 'function') updateSkillDisplay();
            }
        });
    }

    if (baseGateData?.alignment && typeof updateAlignment === 'function') {
        updateAlignment(baseGateData.alignment);
    }

    if (typeof grantExpToAllCompanions === 'function') {
        grantExpToAllCompanions(baseExpReward);
    }

    let rewardMsgString = typeof formatRewardsForMessage === 'function'
        ? formatRewardsForMessage({ exp: actualExpObject, stats: actualStatsAwarded, currency: actualCurrenciesAwarded, items: actualItemsAwarded, skills: actualSkillsAwarded }, childBonusExp, true)
        : 'Rewards received!';

    if (typeof showSuccessModal === 'function') {
        showSuccessModal(`${wasRed ? '<span class="rarity-epic">Red Gate</span> ' : ''}Gate Cleared: ${gateData.type}\nRewards: ${rewardMsgString}`);
    }
    if (typeof playSfx === 'function') playSfx(wasRed ? 'ascend' : 'gate-clear');
    if (typeof determineAndPlayCurrentMusic === 'function') determineAndPlayCurrentMusic();
    if (typeof triggerGateClearAnimation === 'function') triggerGateClearAnimation();
    if (wasRed) document.body.classList.remove('red-gate-active');

    if (!gameState.achievements) gameState.achievements = {};
    gameState.achievements.gatesCleared = (gameState.achievements.gatesCleared || 0) + 1;
    if (typeof checkTitles === 'function') checkTitles();

    const memType = wasRed ? 'red_gate_clear' : 'gate_clear';
    if (typeof addMemoryEcho === 'function') addMemoryEcho(memType, `Cleared ${wasRed ? 'Red ' : ''}Gate of ${gateData.type}.`);
    if (typeof addTimelineEvent === 'function') addTimelineEvent(`${wasRed ? 'Red ' : ''}Gate Cleared`, `Overcame the Gate of ${gateData.type}.`, wasRed ? 'ascension' : 'gate_cleared');
    if (typeof checkTriggeredQuests === 'function') checkTriggeredQuests();

    const shadowGateTypes = ['Fear', 'Doubt', 'Anger'];
    if (shadowGateTypes.includes(gateData.type)) {
        checkShadowIntegrationProgress();
    }

    gameState.currentGate = null;
    if (typeof updateAIContext === 'function') updateAIContext({ action: 'idle', recentEmotion: 'calm' });
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function fleeGate() {
    if (!gameState.currentGate) return;
    if (gameState.currentGate.isAwakeningGate) {
        if (typeof showErrorModal === 'function') showErrorModal("The Awakening Trial demands resolution. You cannot flee.");
        return;
    }
    console.log("Fleeing Gate:", gameState.currentGate.type);
    if (gameState.currentGate.isRed) document.body.classList.remove('red-gate-active');
    gameState.currentGate = null;
    if (typeof triggerGateClearAnimation === 'function') triggerGateClearAnimation();
    if (typeof determineAndPlayCurrentMusic === 'function') determineAndPlayCurrentMusic();
    if (typeof showModalMessage === 'function') showModalMessage("You retreated from the rift. The shadow recedes.");
    if (typeof updateAIContext === 'function') updateAIContext({ action: 'idle', recentEmotion: 'turbulent' });
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

function checkShadowIntegrationProgress() {
    const echoes = gameState.memoryEchoes || [];
    const clearedFear = echoes.some(e => e.description?.includes("Fear"));
    const clearedDoubt = echoes.some(e => e.description?.includes("Doubt"));
    const clearedAnger = echoes.some(e => e.description?.includes("Anger"));

    if (clearedFear && clearedDoubt && clearedAnger) {
        completeShadowIntegration();
    }
}

function completeShadowIntegration() {
    if (gameState.achievements?.shadowIntegrated) return;
    if (!gameState.achievements) gameState.achievements = {};
    gameState.achievements.shadowIntegrated = true;

    if (typeof showSuccessModal === 'function') {
        showSuccessModal(
            '<span class="rarity-legendary">Shadow Integration Complete!</span>\nYou have confronted Fear, Doubt, and Anger. The shadow army kneels before you.',
            "Mastery Attained"
        );
    }
    if (typeof playSfx === 'function') playSfx('ascend');
    if (typeof addTimelineEvent === 'function') {
        addTimelineEvent("Shadow Integration", "Mastered the triad of internal gates.", "shadow_integration");
    }
    if (typeof earnTitle === 'function') earnTitle('shadowMonarch');
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

console.log("Gates Module Loaded OK.");