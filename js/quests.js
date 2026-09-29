// js/quests.js
// Version: v1.1.1 - Manages quests and rewards (Complete Implementation)

console.log("Loading Quests Module...");

// --- Quest Database ---
const questDatabase = [
    { id: 'd001', title: 'Moment of Stillness', type: 'daily', description: 'Meditate or sit in silence for 5 minutes.', goal: 1, rewards: { exp: { amount: 15, rarity: RARITY.COMMON }, stats: [{ name: 'resonance', amount: 1, rarity: RARITY.COMMON }] }, alignment: ALIGNMENT_CHANGE.LIGHT_SMALL, repeatable: true },
    { id: 'd002', title: 'Morning Intent', type: 'daily', description: 'Set a clear, positive intention for the day.', goal: 1, rewards: { exp: { amount: 10, rarity: RARITY.COMMON }, stats: [{ name: 'willpower', amount: 1, rarity: RARITY.COMMON }] }, alignment: ALIGNMENT_CHANGE.LIGHT_SMALL, repeatable: true },
    { id: 'd003', title: 'Gratitude Reflection', type: 'daily', description: 'Write down or acknowledge 3 things you are grateful for.', goal: 1, rewards: { exp: { amount: 10, rarity: RARITY.COMMON }, stats: [{ name: 'awakening', amount: 1, rarity: RARITY.COMMON }] }, alignment: ALIGNMENT_CHANGE.LIGHT_MEDIUM, repeatable: true },
    { id: 'm001', title: 'Inner Doubt', description: 'Confront a lingering self-doubt through journaling.', goal: 1, rewards: { exp: { amount: 50, rarity: RARITY.COMMON }, stats: [{ name: 'willpower', amount: 2, rarity: RARITY.UNCOMMON }] }, alignment: ALIGNMENT_CHANGE.DARK_SMALL, trigger: { stat: 'willpower', threshold: 15, condition: 'less' } },
    { id: 'm002', title: 'Intuitive Guidance', description: 'Follow a gut feeling or intuition about a small decision today.', goal: 1, rewards: { exp: { amount: 40, rarity: RARITY.COMMON }, stats: [{ name: 'intuition', amount: 2, rarity: RARITY.UNCOMMON }] }, alignment: ALIGNMENT_CHANGE.LIGHT_SMALL, trigger: { stat: 'intuition', threshold: 20, condition: 'greater' } },
    { id: 'm003', title: 'Act of Service', description: 'Perform a small, selfless act for someone without expectation.', goal: 1, rewards: { exp: { amount: 60, rarity: RARITY.UNCOMMON }, currency: [{ type: 'karma', amount: 5, rarity: RARITY.UNCOMMON }], stats: [{ name: 'awakening', amount: 1, rarity: RARITY.COMMON }] }, alignment: ALIGNMENT_CHANGE.LIGHT_MEDIUM, trigger: 'random' },
    { id: 'm004', title: 'Face the Shadow', description: 'Acknowledge and sit with a difficult emotion without judgment.', goal: 1, rewards: { exp: { amount: 75, rarity: RARITY.UNCOMMON }, currency: [{ type: 'tokens', amount: 1, rarity: RARITY.RARE }], stats: [{ name: 'resonance', amount: 2, rarity: RARITY.UNCOMMON }] }, alignment: ALIGNMENT_CHANGE.DARK_MEDIUM, trigger: { context: 'recentEmotion', value: 'turbulent' } },
    { id: 'm005', title: 'Echoes in the Rift', description: 'Survive and clear a challenging Red Gate.', goal: 1, rewards: { exp: { amount: 200, rarity: RARITY.RARE }, currency: [{ type: 'fragments', amount: 10, rarity: RARITY.RARE }], items: [{ id: 'item_instant_dungeon_01', rarity: RARITY.LEGENDARY }] }, alignment: ALIGNMENT_CHANGE.DARK_SMALL, trigger: { event: 'red_gate_clear' } },
    { id: 'm006', title: 'Path of the Seeker', description: 'Reach Level 10 and demonstrate understanding of core stats.', goal: 1, rewards: { skills: [{ id: 'skill_mana_infusion', rarity: RARITY.UNCOMMON }], exp: { amount: 100, rarity: RARITY.UNCOMMON } }, alignment: ALIGNMENT_CHANGE.LIGHT_SMALL, trigger: { level: 10 } },
    { id: 'm007', title: 'The Weight of Choice', description: 'Make a difficult decision that aligns with either Light or Dark alignment.', goal: 1, rewards: { exp: { amount: 100, rarity: RARITY.UNCOMMON } }, trigger: null },
    { id: 's111', title: 'Synchronicity: Alignment', type: 'synchronicity', description: 'You noticed 111. Reflect on your current path.', goal: 1, rewards: { exp: { amount: 25, rarity: RARITY.COMMON }, stats: [{ name: 'intuition', amount: 1, rarity: RARITY.COMMON }] }, alignment: ALIGNMENT_CHANGE.LIGHT_SMALL, trigger: { synchronicity: '111' } },
    { id: 's444', title: 'Synchronicity: Protection', type: 'synchronicity', description: 'The pattern 444 appeared. Trust your support.', goal: 1, rewards: { exp: { amount: 25, rarity: RARITY.COMMON }, stats: [{ name: 'willpower', amount: 1, rarity: RARITY.COMMON }] }, alignment: ALIGNMENT_CHANGE.LIGHT_SMALL, trigger: { synchronicity: '444' } },
    { id: AWAKENING_QUEST_ID, title: 'Threshold: The Awakening', type: 'main', description: 'To Ascend to Rank S, overcome a manifestation of your limitations in a specialized Gate simulation.', goal: 1, rewards: { exp: { amount: 1000, rarity: RARITY.EPIC }, currency: [{ type: 'fragments', amount: 50, rarity: RARITY.EPIC }], skills: [{id: 'skill_shadow_step', rarity: RARITY.EPIC}] }, alignment: 0, trigger: null, isAwakeningQuest: true, targetRank: 'S' }
];

// --- Quest Management Functions ---
function initializeQuests() {
    if (!gameState.activeQuests) gameState.activeQuests = [];
    if (!gameState.completedQuests) gameState.completedQuests = [];
    checkDailyQuests();
    checkTriggeredQuests();
    if (typeof updateQuestList === 'function') updateQuestList();
}

function checkDailyQuests() {
    const now = new Date();
    const todayDate = now.toDateString();
    const lastReset = gameState.lastDailyReset ? new Date(gameState.lastDailyReset).toDateString() : null;

    if (todayDate !== lastReset) {
        console.log("Daily reset triggered. Refreshing daily rituals...");
        gameState.activeQuests = (gameState.activeQuests || []).filter(q => q.type !== 'daily');
        const dailyQuests = questDatabase.filter(q => q.type === 'daily');
        dailyQuests.forEach(q => {
            addQuest(q, false);
        });
        gameState.lastDailyReset = Date.now();
        if (typeof saveState === 'function') saveState();
    } else {
        const activeDaily = (gameState.activeQuests || []).filter(q => q.type === 'daily');
        if (activeDaily.length === 0) {
            const dailyQuests = questDatabase.filter(q => q.type === 'daily');
            dailyQuests.forEach(q => {
                addQuest(q, false);
            });
        }
    }
}

function checkTriggeredQuests() {
    questDatabase.forEach(q => {
        if (q.type === 'daily' || q.isAwakeningQuest) return;
        if (isActiveOrCompleted(q.id)) return;

        let shouldTrigger = false;
        if (q.trigger) {
            if (q.trigger === 'random' && Math.random() < 0.05) {
                shouldTrigger = true;
            } else if (q.trigger.stat) {
                const effStat = typeof calculateEffectiveStat === 'function' ? calculateEffectiveStat(q.trigger.stat) : (gameState.stats?.[q.trigger.stat] || 10);
                if (q.trigger.condition === 'less' && effStat <= q.trigger.threshold) shouldTrigger = true;
                if (q.trigger.condition === 'greater' && effStat >= q.trigger.threshold) shouldTrigger = true;
            } else if (q.trigger.level && (gameState.level || 1) >= q.trigger.level) {
                shouldTrigger = true;
            } else if (q.trigger.context && gameState.context?.[q.trigger.context] === q.trigger.value) {
                shouldTrigger = true;
            }
        }

        if (shouldTrigger) {
            addQuest(q);
        }
    });
}

function addQuestById(questId, doSaveAndUpdate = true) {
    const qData = questDatabase.find(q => q.id === questId);
    if (qData) {
        return addQuest(qData, doSaveAndUpdate);
    }
    return false;
}

function addQuest(questData, doSaveAndUpdate = true) {
    if (!gameState.activeQuests) gameState.activeQuests = [];
    if (isActiveOrCompleted(questData.id, questData.repeatable)) return false;

    const newQuest = {
        ...questData,
        progress: 0
    };
    gameState.activeQuests.push(newQuest);
    console.log(`New Quest added: ${newQuest.title}`);

    if (typeof notifyInfo === 'function') notifyInfo(`New Directive: ${newQuest.title}`);
    if (typeof playSfx === 'function') playSfx('prompt');

    if (doSaveAndUpdate) {
        if (typeof saveState === 'function') saveState();
        if (typeof updateQuestList === 'function') updateQuestList();
        if (typeof updateUI === 'function') updateUI();
    }
    return true;
}

function updateQuestProgress(questId, progressAmount = 1) {
    if (!gameState.activeQuests) return;
    const quest = gameState.activeQuests.find(q => q.id === questId);
    if (!quest) return;

    quest.progress = Math.min((quest.progress || 0) + progressAmount, quest.goal || 1);
    console.log(`Quest ${quest.title} progress: ${quest.progress}/${quest.goal}`);

    if (quest.progress >= quest.goal) {
        if (typeof notifySuccess === 'function') notifySuccess(`Quest Ready: ${quest.title}`);
        if (typeof playSfx === 'function') playSfx('quest-complete');
    }

    if (typeof saveState === 'function') saveState();
    if (typeof updateQuestList === 'function') updateQuestList();
}

function completeQuest(questId) {
    const questIndex = (gameState.activeQuests || []).findIndex(q => q.id === questId);
    if (questIndex === -1) return;
    const quest = gameState.activeQuests[questIndex];
    if (quest.isAwakeningQuest) {
        if (typeof showErrorModal === 'function') showErrorModal("The Awakening quest must be completed through its unique trial.");
        return;
    }
    if ((quest.progress || 0) < (quest.goal || 1)) {
        if (typeof showErrorModal === 'function') showErrorModal("Progress insufficient.");
        return;
    }

    console.log(`Completing quest: ${quest.title}`);
    const baseQuestData = typeof getQuestData === 'function' ? getQuestData(quest.id) : null;
    let originalRewards = baseQuestData?.rewards || quest.rewards || {};
    let finalRewards = JSON.parse(JSON.stringify(originalRewards));
    let baseExpReward = finalRewards.exp?.amount || 0;

    if (typeof applyCurrencyModifiers === 'function') applyCurrencyModifiers(finalRewards);
    let childBonusExp = typeof calculateChildBonusExp === 'function' ? calculateChildBonusExp(baseExpReward) : 0;

    let actualExpObject = null;
    let actualStatsAwarded = [];
    let actualCurrenciesAwarded = [];
    let actualItemsAwarded = [];
    let actualSkillsAwarded = [];

    if (finalRewards.exp?.amount > 0) {
        if (typeof addExp === 'function') addExp(finalRewards.exp.amount);
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
    if (finalRewards.currency?.length > 0) {
        finalRewards.currency.forEach(cr => {
            if (cr.amount > 0 && typeof addCurrency === 'function') {
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

    if (baseQuestData?.alignment && typeof updateAlignment === 'function') {
        updateAlignment(baseQuestData.alignment);
    }

    let rewardMsgString = typeof formatRewardsForMessage === 'function'
        ? formatRewardsForMessage({ exp: actualExpObject, stats: actualStatsAwarded, currency: actualCurrenciesAwarded, items: actualItemsAwarded, skills: actualSkillsAwarded }, childBonusExp, true)
        : 'Rewards received!';

    if (typeof showSuccessModal === 'function') showSuccessModal(`Quest Completed: ${quest.title}\nRewards: ${rewardMsgString}`);
    if (typeof playSfx === 'function') playSfx('quest-complete');

    if (!quest.repeatable) {
        if (!gameState.completedQuests) gameState.completedQuests = [];
        gameState.completedQuests.push(quest.id);
    }
    if (typeof addMemoryEcho === 'function') addMemoryEcho('quest_complete', `Completed quest: ${quest.title}`);
    if (typeof addTimelineEvent === 'function') addTimelineEvent('Quest Completed', quest.title, 'quest_complete');

    gameState.activeQuests.splice(questIndex, 1);
    checkTriggeredQuests();
    if (typeof updateAIContext === 'function') updateAIContext({ action: 'questing', questOutcome: 'success' });
    if (typeof saveState === 'function') saveState();
    if (typeof updateQuestList === 'function') updateQuestList();
    if (typeof updateUI === 'function') updateUI();
}

function abandonQuest(questId) {
    const questIndex = (gameState.activeQuests || []).findIndex(q => q.id === questId);
    if (questIndex === -1) return;
    const quest = gameState.activeQuests[questIndex];
    if (quest.type === 'daily') {
        if (typeof showModalMessage === 'function') showModalMessage("Daily rituals cannot be abandoned.");
        return;
    }
    if (quest.isAwakeningQuest) {
        if (typeof showErrorModal === 'function') showErrorModal("The Awakening quest cannot be abandoned.");
        return;
    }
    console.log(`Abandoning quest: ${quest.title}`);
    gameState.activeQuests.splice(questIndex, 1);
    if (typeof showModalMessage === 'function') showModalMessage(`Quest Abandoned: ${quest.title}`);
    if (typeof playSfx === 'function') playSfx('click');
    if (typeof saveState === 'function') saveState();
    if (typeof updateQuestList === 'function') updateQuestList();
}

function isActiveOrCompleted(questId, checkOnlyActive = false) {
    const isActive = (gameState.activeQuests || []).some(q => q.id === questId);
    if (checkOnlyActive || isActive) return isActive;
    return (gameState.completedQuests || []).includes(questId);
}

function logSynchronicity(pattern) {
    console.log(`Logging synchronicity: ${pattern}`);
    const syncQuestId = `s${pattern}`;
    const quest = (gameState.activeQuests || []).find(q => q.id === syncQuestId);

    if (typeof addTimelineEvent === 'function') addTimelineEvent('Synchronicity Observed', `Pattern ${pattern} acknowledged.`, 'milestone');
    if (typeof addMemoryEcho === 'function') addMemoryEcho('synchronicity', `Observed numerical pattern ${pattern}`);
    if (typeof playSfx === 'function') playSfx('divine-sync');

    if (quest) {
        updateQuestProgress(syncQuestId, 1);
    } else {
        addQuestById(syncQuestId);
    }

    if (typeof notifyInfo === 'function') notifyInfo(`Synchronicity Logged: ${pattern}`);
    if (typeof saveState === 'function') saveState();
    if (typeof updateUI === 'function') updateUI();
}

console.log("Quests Module Loaded OK.");