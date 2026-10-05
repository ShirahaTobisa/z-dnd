// D&D 5e 共用规则：两个版本通用的数据表与计算。版本差异写在 edition-2014.js / edition-2024.js。
// 角色数据结构见 newCharacter()。
(function (root) {
    const ABILITIES = { STR: '力量', DEX: '敏捷', CON: '体质', INT: '智力', WIS: '感知', CHA: '魅力' };

    const SKILLS = {
        athletics: { name: '运动', ability: 'STR' },
        acrobatics: { name: '体操', ability: 'DEX' },
        sleightOfHand: { name: '巧手', ability: 'DEX' },
        stealth: { name: '隐匿', ability: 'DEX' },
        arcana: { name: '奥秘', ability: 'INT' },
        history: { name: '历史', ability: 'INT' },
        investigation: { name: '调查', ability: 'INT' },
        nature: { name: '自然', ability: 'INT' },
        religion: { name: '宗教', ability: 'INT' },
        animalHandling: { name: '驯兽', ability: 'WIS' },
        insight: { name: '洞悉', ability: 'WIS' },
        medicine: { name: '医药', ability: 'WIS' },
        perception: { name: '察觉', ability: 'WIS' },
        survival: { name: '求生', ability: 'WIS' },
        deception: { name: '欺瞒', ability: 'CHA' },
        intimidation: { name: '威吓', ability: 'CHA' },
        performance: { name: '表演', ability: 'CHA' },
        persuasion: { name: '游说', ability: 'CHA' },
    };
    const ALL_SKILLS = Object.keys(SKILLS);

    // caster: full 全施法者 / half 半施法者 / pact 契约魔法 / null 不施法
    // features / subclasses[].features 格式：{ 等级: [{ name, description }] }，暂时留空，以后补内容。
    // 子职业 srd: false 表示非 SRD 内容，只能写自己的概括，不能照搬书中原文。
    const CLASSES = {
        barbarian: { name: '野蛮人', description: '凭怒火战斗的原始勇士，血厚、抗打，适合冲在最前面。', hitDie: 12, saves: ['STR', 'CON'], skillCount: 2, skills: ['animalHandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], armor: ['轻甲', '中甲', '盾牌'], weapons: ['简易武器', '军用武器'], caster: null, unarmored: ['DEX', 'CON'], features: {}, subclasses: [{ name: '狂战士道途', srd: true, description: '', features: {} }] },
        bard: { name: '吟游诗人', description: '用音乐和话语施展魔法的多面手，擅长社交、辅助和各种技能。', hitDie: 8, saves: ['DEX', 'CHA'], skillCount: 3, skills: ALL_SKILLS, armor: ['轻甲'], weapons: ['简易武器'], caster: 'full', spellAbility: 'CHA', features: {}, subclasses: [{ name: '逸闻学院', srd: true, description: '', features: {} }] },
        cleric: { name: '牧师', description: '侍奉神祇的神术施法者，能治疗、守护队友，也能惩戒敌人。', hitDie: 8, saves: ['WIS', 'CHA'], skillCount: 2, skills: ['history', 'insight', 'medicine', 'persuasion', 'religion'], armor: ['轻甲', '中甲', '盾牌'], weapons: ['简易武器'], caster: 'full', spellAbility: 'WIS', features: {}, subclasses: [{ name: '生命领域', srd: true, description: '', features: {} }] },
        druid: { name: '德鲁伊', description: '守护自然的施法者，能调用自然之力，还能变成野兽。', hitDie: 8, saves: ['INT', 'WIS'], skillCount: 2, skills: ['arcana', 'animalHandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'], armor: ['轻甲', '中甲', '盾牌'], weapons: ['简易武器'], caster: 'full', spellAbility: 'WIS', features: {}, subclasses: [{ name: '大地结社', srd: true, description: '', features: {} }] },
        fighter: { name: '战士', description: '精通各种武器和护甲的战斗专家，稳定可靠，上手最容易。', hitDie: 10, saves: ['STR', 'CON'], skillCount: 2, skills: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'], armor: ['全部护甲', '盾牌'], weapons: ['简易武器', '军用武器'], caster: null, features: {}, subclasses: [{ name: '勇士', srd: true, description: '', features: {} }] },
        monk: { name: '武僧', description: '修炼身心的武者，不穿甲也很灵活，用拳脚和内气战斗。', hitDie: 8, saves: ['STR', 'DEX'], skillCount: 2, skills: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'], armor: [], weapons: ['简易武器', '短剑'], caster: null, unarmored: ['DEX', 'WIS'], features: {}, subclasses: [{ name: '散打宗', srd: true, description: '', features: {} }] },
        paladin: { name: '圣武士', description: '立下神圣誓言的战士，近战强悍，还能治疗和施展神圣斩击。', hitDie: 10, saves: ['WIS', 'CHA'], skillCount: 2, skills: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], armor: ['全部护甲', '盾牌'], weapons: ['简易武器', '军用武器'], caster: 'half', spellAbility: 'CHA', features: {}, subclasses: [{ name: '奉献之誓', srd: true, description: '', features: {} }] },
        ranger: { name: '游侠', description: '荒野中的猎手和追踪者，擅长远程攻击、侦察和野外生存。', hitDie: 10, saves: ['STR', 'DEX'], skillCount: 3, skills: ['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], armor: ['轻甲', '中甲', '盾牌'], weapons: ['简易武器', '军用武器'], caster: 'half', spellAbility: 'WIS', features: {}, subclasses: [{ name: '猎人', srd: true, description: '', features: {} }] },
        rogue: { name: '游荡者', description: '靠技巧和偷袭取胜的专家，擅长潜行、开锁和找准要害。', hitDie: 8, saves: ['DEX', 'INT'], skillCount: 4, skills: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'], armor: ['轻甲'], weapons: ['简易武器', '手弩', '长剑', '刺剑', '短剑'], caster: null, features: {}, subclasses: [{ name: '盗贼', srd: true, description: '', features: {} }] },
        sorcerer: { name: '术士', description: '天生拥有魔力的施法者，法术不多但能用超魔改变法术效果。', hitDie: 6, saves: ['CON', 'CHA'], skillCount: 2, skills: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], armor: [], weapons: ['匕首', '飞镖', '投石索', '木棍', '轻弩'], caster: 'full', spellAbility: 'CHA', features: {}, subclasses: [{ name: '龙族血脉', srd: true, description: '', features: {} }] },
        warlock: { name: '邪术师', description: '与强大存在订下契约换取力量的施法者，法术位少但短休就能恢复。', hitDie: 8, saves: ['WIS', 'CHA'], skillCount: 2, skills: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], armor: ['轻甲'], weapons: ['简易武器'], caster: 'pact', spellAbility: 'CHA', features: {}, subclasses: [{ name: '邪魔宗主', srd: true, description: '', features: {} }] },
        wizard: { name: '法师', description: '靠钻研学会魔法的学者，法术种类最多，变化最丰富。', hitDie: 6, saves: ['INT', 'WIS'], skillCount: 2, skills: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'], armor: [], weapons: ['匕首', '飞镖', '投石索', '木棍', '轻弩'], caster: 'full', spellAbility: 'INT', features: {}, subclasses: [{ name: '塑能学派', srd: true, description: '', features: {} }] },
    };

    // type: light 轻甲 / medium 中甲（敏捷最多 +2）/ heavy 重甲（不加敏捷）
    const ARMOR = {
        padded: { name: '布甲', base: 11, type: 'light' },
        leather: { name: '皮甲', base: 11, type: 'light' },
        studdedLeather: { name: '镶钉皮甲', base: 12, type: 'light' },
        hide: { name: '兽皮甲', base: 12, type: 'medium' },
        chainShirt: { name: '链甲衫', base: 13, type: 'medium' },
        scaleMail: { name: '鳞甲', base: 14, type: 'medium' },
        breastplate: { name: '胸甲', base: 14, type: 'medium' },
        halfPlate: { name: '半身板甲', base: 15, type: 'medium' },
        ringMail: { name: '环甲', base: 14, type: 'heavy' },
        chainMail: { name: '链甲', base: 16, type: 'heavy' },
        splint: { name: '板条甲', base: 17, type: 'heavy' },
        plate: { name: '板甲', base: 18, type: 'heavy' },
    };

    // props: finesse 灵巧 / light 轻型 / thrown 投掷 / ranged 远程 / heavy 重型 / twoHanded 双手；versatile 为双手伤害
    const WEAPONS = {
        club: { name: '木棍', damage: '1d4', type: '钝击', props: ['light'] },
        dagger: { name: '匕首', damage: '1d4', type: '穿刺', props: ['finesse', 'light', 'thrown'] },
        handaxe: { name: '手斧', damage: '1d6', type: '挥砍', props: ['light', 'thrown'] },
        javelin: { name: '标枪', damage: '1d6', type: '穿刺', props: ['thrown'] },
        mace: { name: '硬头锤', damage: '1d6', type: '钝击', props: [] },
        quarterstaff: { name: '长棍', damage: '1d6', type: '钝击', props: [], versatile: '1d8' },
        spear: { name: '矛', damage: '1d6', type: '穿刺', props: ['thrown'], versatile: '1d8' },
        lightCrossbow: { name: '轻弩', damage: '1d8', type: '穿刺', props: ['ranged', 'twoHanded'] },
        shortbow: { name: '短弓', damage: '1d6', type: '穿刺', props: ['ranged', 'twoHanded'] },
        sling: { name: '投石索', damage: '1d4', type: '钝击', props: ['ranged'] },
        battleaxe: { name: '战斧', damage: '1d8', type: '挥砍', props: [], versatile: '1d10' },
        greataxe: { name: '巨斧', damage: '1d12', type: '挥砍', props: ['heavy', 'twoHanded'] },
        greatsword: { name: '巨剑', damage: '2d6', type: '挥砍', props: ['heavy', 'twoHanded'] },
        longsword: { name: '长剑', damage: '1d8', type: '挥砍', props: [], versatile: '1d10' },
        rapier: { name: '刺剑', damage: '1d8', type: '穿刺', props: ['finesse'] },
        scimitar: { name: '弯刀', damage: '1d6', type: '挥砍', props: ['finesse', 'light'] },
        shortsword: { name: '短剑', damage: '1d6', type: '穿刺', props: ['finesse', 'light'] },
        warhammer: { name: '战锤', damage: '1d8', type: '钝击', props: [], versatile: '1d10' },
        longbow: { name: '长弓', damage: '1d8', type: '穿刺', props: ['ranged', 'heavy', 'twoHanded'] },
    };

    const CONDITIONS = ['目盲', '魅惑', '耳聋', '力竭', '恐慌', '擒抱', '失能', '隐形', '麻痹', '石化', '中毒', '倒地', '束缚', '震慑', '昏迷'];

    const XP_TABLE = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

    // 全施法者法术位：下标 = 角色等级 - 1，每项为 1~9 环的数量
    const FULL_SLOTS = [
        [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
        [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
        [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
    ];
    // 邪术师契约魔法：[法术位数量, 法术位环阶]
    const PACT_SLOTS = [[1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5]];

    // 属性生成
    const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
    const POINT_BUY = { budget: 27, cost: { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 } };

    const editions = {};
    const clampLevel = (level) => Math.min(20, Math.max(1, parseInt(level) || 1));
    const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);

    const abilityMod = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
    const profBonus = (level) => 2 + Math.floor((clampLevel(level) - 1) / 4);
    const levelFromXp = (xp) => XP_TABLE.filter(t => (parseInt(xp) || 0) >= t).length || 1;

    const randInt = (sides) => Math.floor(Math.random() * sides) + 1;

    // 支持 "2d6+3"、"1d20-1"、"4d6kh3"（取高 3 个）、"2d20kl1"（取低）、纯数字
    const rollDice = (expr) => {
        const clean = String(expr || '').replace(/\s+/g, '').toLowerCase();
        const terms = clean.match(/[+-]?[^+-]+/g);
        if (!terms) return null;
        let total = 0; const parts = [];
        for (const term of terms) {
            const sign = term.startsWith('-') ? -1 : 1;
            const body = term.replace(/^[+-]/, '');
            const m = body.match(/^(\d*)d(\d+)(?:(kh|kl)(\d+))?$/);
            if (m) {
                const count = Math.min(100, parseInt(m[1] || '1')); const sides = parseInt(m[2]);
                if (!sides) return null;
                const rolls = Array.from({ length: count }, () => randInt(sides));
                let kept = rolls;
                if (m[3]) {
                    const sorted = [...rolls].sort((a, b) => (m[3] === 'kh' ? b - a : a - b));
                    kept = sorted.slice(0, parseInt(m[4]));
                }
                const sum = kept.reduce((a, b) => a + b, 0) * sign;
                total += sum; parts.push({ term, rolls, kept, sum });
            } else if (/^\d+$/.test(body)) {
                total += sign * parseInt(body); parts.push({ term, sum: sign * parseInt(body) });
            } else return null;
        }
        return { expr: clean, total, parts };
    };

    // d20 检定：优势和劣势同时存在时互相抵消
    const d20Test = ({ mod = 0, adv = false, dis = false, dc = null } = {}) => {
        const mode = adv && !dis ? 'adv' : dis && !adv ? 'dis' : 'normal';
        const rolls = mode === 'normal' ? [randInt(20)] : [randInt(20), randInt(20)];
        const roll = mode === 'adv' ? Math.max(...rolls) : mode === 'dis' ? Math.min(...rolls) : rolls[0];
        const total = roll + mod;
        return { rolls, roll, mod, total, mode, crit: roll === 20, fumble: roll === 1, success: dc == null ? null : total >= dc, dc };
    };

    const edition = (id) => editions[id] || editions['2014'];
    // 职业数据 = 共用数据 + 版本覆盖
    const classInfo = (char) => CLASSES[char.classId] && { ...CLASSES[char.classId], ...(edition(char.edition).classOverrides?.[char.classId] || {}) };

    const saveMod = (char, ability) => {
        const prof = classInfo(char)?.saves.includes(ability) ? profBonus(char.level) : 0;
        return abilityMod(char.abilities?.[ability]) + prof;
    };

    const skillMod = (char, skillId) => {
        const skill = SKILLS[skillId]; if (!skill) return 0;
        const pb = profBonus(char.level);
        const prof = char.expertise?.includes(skillId) ? pb * 2 : char.skillProfs?.includes(skillId) ? pb : 0;
        return abilityMod(char.abilities?.[skill.ability]) + prof;
    };

    const passivePerception = (char) => 10 + skillMod(char, 'perception');

    const armorClass = (char) => {
        if (char.acOverride) return parseInt(char.acOverride);
        const dex = abilityMod(char.abilities?.DEX);
        const armor = ARMOR[char.armor];
        let ac;
        if (armor) ac = armor.base + (armor.type === 'light' ? dex : armor.type === 'medium' ? Math.min(dex, 2) : 0);
        else {
            const unarmored = classInfo(char)?.unarmored;
            // 武僧无甲防御不能持盾
            ac = unarmored && !(char.classId === 'monk' && char.shield)
                ? 10 + unarmored.reduce((sum, ab) => sum + abilityMod(char.abilities?.[ab]), 0)
                : 10 + dex;
        }
        return ac + (char.shield ? 2 : 0);
    };

    // 1 级取生命骰最大值，之后每级取平均值（向上取整）
    const maxHp = (char) => {
        const cls = classInfo(char); if (!cls) return 0;
        const level = clampLevel(char.level); const con = abilityMod(char.abilities?.CON);
        return Math.max(level, cls.hitDie + con + (level - 1) * (cls.hitDie / 2 + 1 + con));
    };

    // 返回 { 环阶: 数量 }
    const spellSlots = (char) => {
        const cls = classInfo(char); const level = clampLevel(char.level);
        if (!cls?.caster) return {};
        if (cls.caster === 'pact') { const [count, slotLevel] = PACT_SLOTS[level - 1]; return { [slotLevel]: count }; }
        let row;
        if (cls.caster === 'full') row = FULL_SLOTS[level - 1];
        else row = level < edition(char.edition).halfCasterStart ? [] : FULL_SLOTS[Math.ceil(level / 2) - 1];
        return Object.fromEntries(row.map((n, i) => [i + 1, n]));
    };

    const spellSaveDc = (char) => {
        const ab = classInfo(char)?.spellAbility;
        return ab ? 8 + profBonus(char.level) + abilityMod(char.abilities?.[ab]) : null;
    };
    const spellAttack = (char) => {
        const ab = classInfo(char)?.spellAbility;
        return ab ? profBonus(char.level) + abilityMod(char.abilities?.[ab]) : null;
    };

    // 武器攻击：灵巧武器取力量和敏捷中较高的，远程用敏捷
    const weaponAttack = (char, weaponId) => {
        const w = WEAPONS[weaponId]; if (!w) return null;
        const str = abilityMod(char.abilities?.STR); const dex = abilityMod(char.abilities?.DEX);
        const mod = w.props.includes('ranged') ? dex : w.props.includes('finesse') ? Math.max(str, dex) : str;
        return { name: w.name, toHit: mod + profBonus(char.level), damage: `${w.damage}${mod ? signed(mod) : ''}`, type: w.type, mastery: edition(char.edition).weaponMastery?.[weaponId] || null };
    };

    const initiativeMod = (char) => abilityMod(char.abilities?.DEX);

    // —— 建角色 ——
    const raceOf = (char) => edition(char.edition).races[char.race];
    const subraceOf = (char) => raceOf(char)?.subraces?.[char.subrace];
    const backgroundOf = (char) => edition(char.edition).backgrounds[char.background];
    const subclassLevel = (char) => { const ed = edition(char.edition); return ed.subclassLevel[char.classId] || ed.defaultSubclassLevel; };
    const pointBuyCost = (base) => Object.values(base).reduce((sum, v) => sum + (POINT_BUY.cost[v] ?? Infinity), 0);

    // 最终属性 = 基础值 + 种族/子种族固定加值 + 自选加值（2014 半精灵、2024 背景），上限 20
    const finalAbilities = (char) => {
        const out = {};
        for (const ab of Object.keys(ABILITIES)) {
            const v = (parseInt(char.baseAbilities?.[ab]) || 0) + (raceOf(char)?.bonuses?.[ab] || 0) + (subraceOf(char)?.bonuses?.[ab] || 0) + (parseInt(char.bonusPicks?.[ab]) || 0);
            out[ab] = Math.min(20, v);
        }
        return out;
    };

    // 种族、子种族、背景自带的技能熟练
    const grantedSkills = (char) => [...new Set([...(raceOf(char)?.skills || []), ...(subraceOf(char)?.skills || []), ...(backgroundOf(char)?.skills || [])])];

    // 各来源还能自选几项技能
    const skillChoices = (char) => {
        const cls = classInfo(char); const race = raceOf(char); const bg = backgroundOf(char);
        return [
            cls && { source: cls.name, count: cls.skillCount, options: cls.skills },
            race?.skillChoice && { source: race.name, count: race.skillChoice, options: race.skillOptions || ALL_SKILLS },
            bg?.skillChoice && { source: bg.name, count: bg.skillChoice, options: ALL_SKILLS },
        ].filter(Boolean);
    };

    const newCharacter = (editionId = '2024') => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        edition: editionId, name: '', gender: '', age: '', alignment: '', avatar: null, avatar_prompt: '',
        race: '', subrace: '', size: '', classId: '', subclass: '', background: '', level: 1, xp: 0,
        genMethod: 'standard', baseAbilities: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 }, bonusPicks: {},
        abilities: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
        skillProfs: [], expertise: [],
        hp: 0, maxHp: 0, tempHp: 0, hitDiceUsed: 0, armor: '', shield: false, acOverride: null,
        weapons: [], slotsUsed: {}, spells: '', features: '', inventory: '', gold: 0,
        conditions: [], exhaustion: 0, deathSaves: { success: 0, fail: 0 },
        backstory: { appearance: '', personality: '', ideals: '', bonds: '', flaws: '', story: '' },
        history: [], badges: [],
    });

    // 补齐缺失字段，并重算由选项决定的数值（最终属性、生命值上限）
    const normalizeCharacter = (data) => {
        const base = newCharacter(data?.edition);
        const char = { ...base, ...data, backstory: { ...base.backstory, ...(data?.backstory || {}) }, deathSaves: { ...base.deathSaves, ...(data?.deathSaves || {}) } };
        if (!editions[char.edition]) char.edition = '2024';
        char.level = clampLevel(char.level);
        if (char.baseAbilities) char.abilities = finalAbilities(char);
        char.skillProfs = [...new Set([...(char.skillProfs || []), ...grantedSkills(char)])].filter(id => SKILLS[id]);
        char.weapons = (char.weapons || []).filter(id => WEAPONS[id]);
        const hp = maxHp(char);
        if (hp && !data?.maxHp) char.hp = hp;
        char.maxHp = hp || parseInt(char.maxHp) || 0;
        return char;
    };

    root.DND = { ABILITIES, SKILLS, ALL_SKILLS, CLASSES, ARMOR, WEAPONS, CONDITIONS, XP_TABLE, STANDARD_ARRAY, POINT_BUY, editions, edition, classInfo, signed, abilityMod, profBonus, levelFromXp, rollDice, d20Test, saveMod, skillMod, passivePerception, armorClass, maxHp, spellSlots, spellSaveDc, spellAttack, weaponAttack, initiativeMod, raceOf, subraceOf, backgroundOf, subclassLevel, pointBuyCost, finalAbilities, grantedSkills, skillChoices, newCharacter, normalizeCharacter };
})(typeof window !== 'undefined' ? window : globalThis);
