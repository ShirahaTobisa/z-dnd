// D&D 5e 共用规则：两个版本通用的数据表与计算。版本差异写在 edition-2014.js / edition-2024.js。
// 角色数据结构见 newCharacter()。兼职：classId/subclass 是起始职业，multiclass 是之后兼的职业，level 是角色总等级。
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
        bard: { name: '吟游诗人', description: '用音乐和话语施展魔法的多面手，擅长社交、辅助和各种技能。', hitDie: 8, saves: ['DEX', 'CHA'], skillCount: 3, skills: ALL_SKILLS, armor: ['轻甲'], weapons: ['简易武器', '手弩', '长剑', '刺剑', '短剑'], caster: 'full', spellAbility: 'CHA', features: {}, subclasses: [{ name: '逸闻学院', srd: true, description: '', features: {} }] },
        cleric: { name: '牧师', description: '侍奉神祇的神术施法者，能治疗、守护队友，也能惩戒敌人。', hitDie: 8, saves: ['WIS', 'CHA'], skillCount: 2, skills: ['history', 'insight', 'medicine', 'persuasion', 'religion'], armor: ['轻甲', '中甲', '盾牌'], weapons: ['简易武器'], caster: 'full', spellAbility: 'WIS', features: {}, subclasses: [{ name: '生命领域', srd: true, description: '', features: {} }] },
        druid: { name: '德鲁伊', description: '守护自然的施法者，能调用自然之力，还能变成野兽。', hitDie: 8, saves: ['INT', 'WIS'], skillCount: 2, skills: ['arcana', 'animalHandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'], armor: ['轻甲', '中甲', '盾牌'], weapons: ['木棍', '匕首', '飞镖', '标枪', '硬头锤', '长棍', '弯刀', '镰刀', '投石索', '矛'], caster: 'full', spellAbility: 'WIS', features: {}, subclasses: [{ name: '大地结社', srd: true, description: '', features: {} }] },
        fighter: { name: '战士', description: '精通各种武器和护甲的战斗专家，稳定可靠，上手最容易。', hitDie: 10, saves: ['STR', 'CON'], skillCount: 2, skills: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'], armor: ['全部护甲', '盾牌'], weapons: ['简易武器', '军用武器'], caster: null, features: {}, subclasses: [{ name: '勇士', srd: true, description: '', features: {} }] },
        monk: { name: '武僧', description: '修炼身心的武者，不穿甲也很灵活，用拳脚和内气战斗。', hitDie: 8, saves: ['STR', 'DEX'], skillCount: 2, skills: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'], armor: [], weapons: ['简易武器', '短剑'], caster: null, unarmored: ['DEX', 'WIS'], features: {}, subclasses: [{ name: '散打宗', srd: true, description: '', features: {} }] },
        paladin: { name: '圣武士', description: '立下神圣誓言的战士，近战强悍，还能治疗和施展神圣斩击。', hitDie: 10, saves: ['WIS', 'CHA'], skillCount: 2, skills: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], armor: ['全部护甲', '盾牌'], weapons: ['简易武器', '军用武器'], caster: 'half', spellAbility: 'CHA', features: {}, subclasses: [{ name: '奉献之誓', srd: true, description: '', features: {} }] },
        ranger: { name: '游侠', description: '荒野中的猎手和追踪者，擅长远程攻击、侦察和野外生存。', hitDie: 10, saves: ['STR', 'DEX'], skillCount: 3, skills: ['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], armor: ['轻甲', '中甲', '盾牌'], weapons: ['简易武器', '军用武器'], caster: 'half', spellAbility: 'WIS', features: {}, subclasses: [{ name: '猎人', srd: true, description: '', features: {} }] },
        rogue: { name: '游荡者', description: '靠技巧和偷袭取胜的专家，擅长潜行、开锁和找准要害。', hitDie: 8, saves: ['DEX', 'INT'], skillCount: 4, skills: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'], armor: ['轻甲'], weapons: ['简易武器', '手弩', '长剑', '刺剑', '短剑'], caster: null, features: {}, subclasses: [{ name: '盗贼', srd: true, description: '', features: {} }] },
        sorcerer: { name: '术士', description: '天生拥有魔力的施法者，法术不多但能用超魔改变法术效果。', hitDie: 6, saves: ['CON', 'CHA'], skillCount: 2, skills: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], armor: [], weapons: ['匕首', '飞镖', '投石索', '长棍', '轻弩'], caster: 'full', spellAbility: 'CHA', features: {}, subclasses: [{ name: '龙族血脉', srd: true, description: '', features: {} }] },
        warlock: { name: '邪术师', description: '与强大存在订下契约换取力量的施法者，法术位少但短休就能恢复。', hitDie: 8, saves: ['WIS', 'CHA'], skillCount: 2, skills: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], armor: ['轻甲'], weapons: ['简易武器'], caster: 'pact', spellAbility: 'CHA', features: {}, subclasses: [{ name: '邪魔宗主', srd: true, description: '', features: {} }] },
        wizard: { name: '法师', description: '靠钻研学会魔法的学者，法术种类最多，变化最丰富。', hitDie: 6, saves: ['INT', 'WIS'], skillCount: 2, skills: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'], armor: [], weapons: ['匕首', '飞镖', '投石索', '长棍', '轻弩'], caster: 'full', spellAbility: 'INT', features: {}, subclasses: [{ name: '塑能学派', srd: true, description: '', features: {} }] },
    };

    // type: light 轻甲 / medium 中甲（敏捷最多 +2）/ heavy 重甲（不加敏捷）
    // stealth: 穿着时隐匿检定劣势；str: 力量不足时速度 -10 尺
    const ARMOR = {
        padded: { name: '布甲', base: 11, type: 'light', stealth: true },
        leather: { name: '皮甲', base: 11, type: 'light' },
        studdedLeather: { name: '镶钉皮甲', base: 12, type: 'light' },
        hide: { name: '兽皮甲', base: 12, type: 'medium' },
        chainShirt: { name: '链甲衫', base: 13, type: 'medium' },
        scaleMail: { name: '鳞甲', base: 14, type: 'medium', stealth: true },
        breastplate: { name: '胸甲', base: 14, type: 'medium' },
        halfPlate: { name: '半身板甲', base: 15, type: 'medium', stealth: true },
        ringMail: { name: '环甲', base: 14, type: 'heavy', stealth: true },
        chainMail: { name: '链甲', base: 16, type: 'heavy', stealth: true, str: 13 },
        splint: { name: '板条甲', base: 17, type: 'heavy', stealth: true, str: 15 },
        plate: { name: '板甲', base: 18, type: 'heavy', stealth: true, str: 15 },
    };

    // SRD 武器表。cat: simple 简易 / martial 军用；range 为“常规/最远”射程（尺）
    // props: finesse 灵巧 / light 轻型 / thrown 投掷 / ranged 远程 / heavy 重型 / twoHanded 双手 / reach 触及 / loading 装填；versatile 为双手伤害
    const WEAPONS = {
        club: { name: '木棍', cat: 'simple', damage: '1d4', type: '钝击', props: ['light'] },
        dagger: { name: '匕首', cat: 'simple', damage: '1d4', type: '穿刺', props: ['finesse', 'light', 'thrown'], range: '20/60' },
        greatclub: { name: '巨棒', cat: 'simple', damage: '1d8', type: '钝击', props: ['twoHanded'] },
        handaxe: { name: '手斧', cat: 'simple', damage: '1d6', type: '挥砍', props: ['light', 'thrown'], range: '20/60' },
        javelin: { name: '标枪', cat: 'simple', damage: '1d6', type: '穿刺', props: ['thrown'], range: '30/120' },
        lightHammer: { name: '轻锤', cat: 'simple', damage: '1d4', type: '钝击', props: ['light', 'thrown'], range: '20/60' },
        mace: { name: '硬头锤', cat: 'simple', damage: '1d6', type: '钝击', props: [] },
        quarterstaff: { name: '长棍', cat: 'simple', damage: '1d6', type: '钝击', props: [], versatile: '1d8' },
        sickle: { name: '镰刀', cat: 'simple', damage: '1d4', type: '挥砍', props: ['light'] },
        spear: { name: '矛', cat: 'simple', damage: '1d6', type: '穿刺', props: ['thrown'], range: '20/60', versatile: '1d8' },
        lightCrossbow: { name: '轻弩', cat: 'simple', damage: '1d8', type: '穿刺', props: ['ranged', 'loading', 'twoHanded'], range: '80/320' },
        dart: { name: '飞镖', cat: 'simple', damage: '1d4', type: '穿刺', props: ['finesse', 'thrown'], range: '20/60' },
        shortbow: { name: '短弓', cat: 'simple', damage: '1d6', type: '穿刺', props: ['ranged', 'twoHanded'], range: '80/320' },
        sling: { name: '投石索', cat: 'simple', damage: '1d4', type: '钝击', props: ['ranged'], range: '30/120' },
        battleaxe: { name: '战斧', cat: 'martial', damage: '1d8', type: '挥砍', props: [], versatile: '1d10' },
        flail: { name: '链枷', cat: 'martial', damage: '1d8', type: '钝击', props: [] },
        glaive: { name: '长柄刀', cat: 'martial', damage: '1d10', type: '挥砍', props: ['heavy', 'reach', 'twoHanded'] },
        greataxe: { name: '巨斧', cat: 'martial', damage: '1d12', type: '挥砍', props: ['heavy', 'twoHanded'] },
        greatsword: { name: '巨剑', cat: 'martial', damage: '2d6', type: '挥砍', props: ['heavy', 'twoHanded'] },
        halberd: { name: '戟', cat: 'martial', damage: '1d10', type: '挥砍', props: ['heavy', 'reach', 'twoHanded'] },
        lance: { name: '骑枪', cat: 'martial', damage: '1d12', type: '穿刺', props: ['reach'] },
        longsword: { name: '长剑', cat: 'martial', damage: '1d8', type: '挥砍', props: [], versatile: '1d10' },
        maul: { name: '巨锤', cat: 'martial', damage: '2d6', type: '钝击', props: ['heavy', 'twoHanded'] },
        morningstar: { name: '钉头锤', cat: 'martial', damage: '1d8', type: '穿刺', props: [] },
        pike: { name: '长矛', cat: 'martial', damage: '1d10', type: '穿刺', props: ['heavy', 'reach', 'twoHanded'] },
        rapier: { name: '刺剑', cat: 'martial', damage: '1d8', type: '穿刺', props: ['finesse'] },
        scimitar: { name: '弯刀', cat: 'martial', damage: '1d6', type: '挥砍', props: ['finesse', 'light'] },
        shortsword: { name: '短剑', cat: 'martial', damage: '1d6', type: '穿刺', props: ['finesse', 'light'] },
        trident: { name: '三叉戟', cat: 'martial', damage: '1d6', type: '穿刺', props: ['thrown'], range: '20/60', versatile: '1d8' },
        warPick: { name: '战镐', cat: 'martial', damage: '1d8', type: '穿刺', props: [] },
        warhammer: { name: '战锤', cat: 'martial', damage: '1d8', type: '钝击', props: [], versatile: '1d10' },
        whip: { name: '鞭', cat: 'martial', damage: '1d4', type: '挥砍', props: ['finesse', 'reach'] },
        blowgun: { name: '吹箭筒', cat: 'martial', damage: '1', type: '穿刺', props: ['ranged', 'loading'], range: '25/100' },
        handCrossbow: { name: '手弩', cat: 'martial', damage: '1d6', type: '穿刺', props: ['ranged', 'light', 'loading'], range: '30/120' },
        heavyCrossbow: { name: '重弩', cat: 'martial', damage: '1d10', type: '穿刺', props: ['ranged', 'heavy', 'loading', 'twoHanded'], range: '100/400' },
        longbow: { name: '长弓', cat: 'martial', damage: '1d8', type: '穿刺', props: ['ranged', 'heavy', 'twoHanded'], range: '150/600' },
        unarmed: { name: '徒手攻击', cat: 'simple', damage: '1', type: '钝击', props: ['unarmed'] },
    };

    // 武器、护甲、盾牌的重量（磅，SRD）
    const GEAR_WEIGHT = {
        battleaxe: 4, blowgun: 1, club: 2, dagger: 1, dart: 0.25, flail: 2, glaive: 6, greataxe: 7, greatclub: 10, greatsword: 6, halberd: 6, handaxe: 2, handCrossbow: 3,
        heavyCrossbow: 18, javelin: 2, lance: 6, lightCrossbow: 5, lightHammer: 2, longbow: 2, longsword: 3, mace: 4, maul: 10, morningstar: 4, pike: 18, quarterstaff: 4,
        rapier: 2, scimitar: 3, shortbow: 2, shortsword: 2, sickle: 2, sling: 0, spear: 3, trident: 4, warPick: 2, warhammer: 2, whip: 3, unarmed: 0,
        padded: 8, leather: 10, studdedLeather: 13, hide: 12, chainShirt: 20, scaleMail: 45, breastplate: 20, halfPlate: 40, ringMail: 40, chainMail: 55, splint: 60, plate: 65, shield: 6,
    };

    // 武器数据 = 通用数据 + 版本覆盖（2024 版部分武器数值有变）
    const weaponData = (char, id) => WEAPONS[id] && { ...WEAPONS[id], ...(editions[char?.edition]?.weaponOverrides?.[id] || {}) };

    // 子职业对数值的直接影响：勇士暴击范围，龙族血脉的生命与天生护甲
    const CRIT_RANGE = { '勇士': [[3, 19], [15, 18]] };
    const DRACONIC_AC = { '2014': (c) => 13 + abilityMod(c.abilities?.DEX), '2024': (c) => 10 + abilityMod(c.abilities?.DEX) + abilityMod(c.abilities?.CHA) };

    // 兼职前置：数组里每项都要 ≥13，嵌套数组表示任选其一
    const MULTICLASS_REQ = {
        barbarian: ['STR'], bard: ['CHA'], cleric: ['WIS'], druid: ['WIS'], fighter: [['STR', 'DEX']], monk: ['DEX', 'WIS'],
        paladin: ['STR', 'CHA'], ranger: ['DEX', 'WIS'], rogue: ['DEX'], sorcerer: ['CHA'], warlock: ['CHA'], wizard: ['INT'],
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

    // 支持 "2d6+3"、"1d20-1"、"4d6kh3"（取高 3 个）、"2d20kl1"（取低）、"2d6min3"（每颗至少 3）、"2d6ro2"（≤2 重骰一次）、纯数字
    const rollDice = (expr) => {
        const clean = String(expr || '').replace(/\s+/g, '').toLowerCase();
        const terms = clean.match(/[+-]?[^+-]+/g);
        if (!terms) return null;
        let total = 0; const parts = [];
        for (const term of terms) {
            const sign = term.startsWith('-') ? -1 : 1;
            const body = term.replace(/^[+-]/, '');
            const m = body.match(/^(\d*)d(\d+)(?:(kh|kl|min|ro)(\d+))?$/);
            if (m) {
                const count = Math.min(100, parseInt(m[1] || '1')); const sides = parseInt(m[2]);
                if (!sides) return null;
                const n = parseInt(m[4]);
                const rolls = Array.from({ length: count }, () => { const r = randInt(sides); return m[3] === 'min' ? Math.max(n, r) : m[3] === 'ro' && r <= n ? randInt(sides) : r; });
                let kept = rolls;
                if (m[3] === 'kh' || m[3] === 'kl') {
                    const sorted = [...rolls].sort((a, b) => (m[3] === 'kh' ? b - a : a - b));
                    kept = sorted.slice(0, n);
                }
                const sum = kept.reduce((a, b) => a + b, 0) * sign;
                total += sum; parts.push({ term, rolls, kept, sum });
            } else if (/^\d+$/.test(body)) {
                total += sign * parseInt(body); parts.push({ term, sum: sign * parseInt(body) });
            } else return null;
        }
        return { expr: clean, total, parts };
    };

    // d20 检定：优势和劣势同时存在时互相抵消；lucky（半身人幸运）掷出 1 时重骰一次
    const d20Test = ({ mod = 0, adv = false, dis = false, dc = null, lucky = false } = {}) => {
        const mode = adv && !dis ? 'adv' : dis && !adv ? 'dis' : 'normal';
        const die = () => { const r = randInt(20); return lucky && r === 1 ? randInt(20) : r; };
        const rolls = mode === 'normal' ? [die()] : [die(), die()];
        const roll = mode === 'adv' ? Math.max(...rolls) : mode === 'dis' ? Math.min(...rolls) : rolls[0];
        const total = roll + mod;
        return { rolls, roll, mod, total, mode, crit: roll === 20, fumble: roll === 1, success: dc == null ? null : total >= dc, dc };
    };

    const edition = (id) => editions[id] || editions['2014'];
    // 职业数据 = 共用数据 + 版本覆盖
    const classInfo = (char) => CLASSES[char.classId] && { ...CLASSES[char.classId], ...(edition(char.edition).classOverrides?.[char.classId] || {}) };
    // 可选子职业：SRD 的加上 subclasses.js 补的玩家手册子职业（按版本）
    const subclassesOf = (char, classId = char.classId) => [...(CLASSES[classId]?.subclasses || []), ...(edition(char.edition).extraSubclasses?.[classId] || [])];
    // 子职业附带的护甲、武器熟练
    const subclassProf = (char, kind) => classEntries(char).flatMap(e => edition(char.edition).subclassProf?.[e.subclass]?.[kind] || []);

    // —— 物品栏 ——
    // char.items：[{ uid, name, cat, ref?, qty, w, equipped, attune?, attuned, rarity?, slot?, effects?, desc?, sentient? }]
    // cat: weapon / armor / shield / magic / gear；ref 指向 WEAPONS 或 ARMOR（盾牌为 'shield'）。护甲、盾牌、武器字段由装备中的物品推出
    // effects：ac 护甲等级、save 豁免、check 属性检定、attack/damage 武器、spellAttack/spellDc 法术、set 属性设为、inc 属性加值（上限 20）、
    //          acUnarmored 无甲无盾时 AC 加值、baseAc 无甲时基础 AC、extra 额外伤害说明
    const SLOTS = {
        head: { name: '头部', max: 1 }, neck: { name: '颈部', max: 1 }, cloak: { name: '披风', max: 1 }, body: { name: '身体', max: 1 }, robe: { name: '长袍', max: 1 },
        hands: { name: '手部', max: 1 }, ring: { name: '戒指', max: 2 }, waist: { name: '腰部', max: 1 }, feet: { name: '脚部', max: 1 },
        hand: { name: '手持', max: 99 }, offhand: { name: '副手', max: 1 }, ioun: { name: '环绕', max: 99 },
    };
    const ATTUNE_MAX = 3;
    const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const itemFromRef = (ref, extra = {}) => {
        const cat = ref === 'shield' ? 'shield' : ARMOR[ref] ? 'armor' : 'weapon';
        const name = ref === 'shield' ? '盾牌' : (ARMOR[ref] || WEAPONS[ref])?.name || ref;
        return { uid: uid(), name, cat, ref, qty: 1, w: GEAR_WEIGHT[ref] ?? 0, equipped: false, attuned: false, slot: cat === 'armor' ? 'body' : cat === 'shield' ? 'offhand' : 'hand', ...extra };
    };
    // 生效的物品：需要同调的看是否同调，其余看是否装备
    const activeItems = (char) => (char.items || []).filter(i => (i.attune ? i.attuned : i.equipped));
    const itemBonus = (char, key) => activeItems(char).reduce((sum, i) => sum + (parseInt(i.effects?.[key]) || 0), 0);
    // 由物品栏推出护甲、盾牌、武器（旧代码都读这三个字段）
    const syncEquipment = (char) => {
        const eq = (char.items || []).filter(i => i.equipped);
        char.armor = eq.find(i => ARMOR[i.ref])?.ref || '';
        char.shield = eq.some(i => i.ref === 'shield');
        char.weapons = [...new Set(eq.filter(i => WEAPONS[i.ref]).map(i => i.ref))];
        return char;
    };
    // 旧角色卡没有物品栏：把护甲、盾牌、武器转成已装备的物品
    const migrateItems = (char) => (Array.isArray(char.items) ? char.items : [
        ...(ARMOR[char.armor] ? [itemFromRef(char.armor, { equipped: true })] : []),
        ...(char.shield ? [itemFromRef('shield', { equipped: true })] : []),
        ...(char.weapons || []).filter(id => WEAPONS[id]).map(id => itemFromRef(id, { equipped: true })),
    ]);
    // 负重：总重（物品 + 每 50 枚硬币 1 磅）与负重上限（力量 ×15，按体型倍乘）
    const SIZE_CARRY = { 微型: 0.5, 小型: 1, 中型: 1, 大型: 2, 巨型: 4, 超巨型: 8 };
    const encumbrance = (char) => {
        const coins = Object.values(char.coins || {}).reduce((a, b) => a + (parseInt(b) || 0), 0) + (parseInt(char.gold) || 0);
        const weight = Math.round(((char.items || []).reduce((sum, i) => sum + (parseFloat(i.w) || 0) * (parseInt(i.qty) || 0), 0) + coins / 50) * 100) / 100;
        const str = parseInt(char.abilities?.STR) || 10;
        const capacity = str * 15 * (SIZE_CARRY[char.size] || 1);
        // 超过上限只能拖拽；2014 版可选的细化负重：超过力量 ×5 负重、×10 重度负重
        const status = weight > capacity ? 'over' : char.edition === '2014' && char.variantEncumbrance ? (weight > str * 10 ? 'heavy' : weight > str * 5 ? 'encumbered' : 'ok') : 'ok';
        return { weight, capacity, status };
    };
    const ENCUMBRANCE_TEXT = { over: '超出负重上限：只能拖拽，速度 5 尺', heavy: '重度负重：速度 -20 尺，力量/敏捷/体质检定、攻击、豁免劣势', encumbered: '负重：速度 -10 尺' };
    // 装备栏位超出、同调超出的提示
    const equipmentIssues = (char) => {
        const eq = (char.items || []).filter(i => i.equipped && i.slot);
        const counts = eq.reduce((m, i) => ({ ...m, [i.slot]: (m[i.slot] || 0) + 1 }), {});
        const issues = Object.entries(counts).filter(([slot, n]) => n > (SLOTS[slot]?.max ?? 99)).map(([slot, n]) => `${SLOTS[slot].name}装备了 ${n} 件（最多 ${SLOTS[slot].max} 件）`);
        const attuned = (char.items || []).filter(i => i.attuned).length;
        if (attuned > ATTUNE_MAX) issues.push(`同调了 ${attuned} 件（最多 ${ATTUNE_MAX} 件）`);
        if (eq.filter(i => ARMOR[i.ref]).length > 1) issues.push('同时穿了两件护甲，只算第一件');
        return issues;
    };
    // 智能物品与持有者冲突：双方魅力检定对抗
    const sentientCheckMod = (item) => abilityMod(item?.sentient?.cha);

    // —— 选择（choices.js）——
    const chose = (char, id, value) => [].concat(char.choices?.[id] || []).includes(value);
    // 战斗风格：主选 + 勇士的额外战斗风格
    const hasStyle = (char, id) => char.fightingStyle === id || char.choices?.fightingStyle2 === id;
    // 护甲训练：职业（含兼职所得）、神圣秩序守护者、原初秩序守望者、2014 生命领域、2014 山地矮人
    const armorTraining = (char) => {
        const set = new Set([...(classInfo(char)?.armor || []), ...classEntries(char).slice(1).flatMap(e => edition(char.edition).multiclassGains?.[e.classId]?.armor || [])]);
        if (chose(char, 'divineOrder', 'protector')) set.add('重甲');
        if (chose(char, 'primalOrder', 'warden')) set.add('中甲');
        if (char.edition === '2014' && subclassEntry(char, '生命领域')) set.add('重甲');
        if (char.edition === '2014' && char.subrace === 'mountain') { set.add('轻甲'); set.add('中甲'); }
        subclassProf(char, 'armor').forEach(a => set.add(a));
        return set;
    };
    // 穿着不熟练的护甲或盾牌：力量、敏捷的检定、豁免和攻击劣势，不能施法
    const armorIssue = (char) => {
        const t = armorTraining(char); const all = t.has('全部护甲');
        const armor = ARMOR[char.armor]; const need = armor && { light: '轻甲', medium: '中甲', heavy: '重甲' }[armor.type];
        const bad = [need && !all && !t.has(need) && armor.name, char.shield && !t.has('盾牌') && '盾牌'].filter(Boolean);
        return bad.length ? `未熟练：${bad.join('、')}` : '';
    };

    // —— 兼职 ——
    // 所有职业条目：[{ classId, subclass, level }]，起始职业在最前，等级 = 总等级减去兼职等级
    const classEntries = (char) => {
        if (!char.classId) return [];
        const extra = (char.multiclass || []).filter(e => CLASSES[e.classId] && e.classId !== char.classId).map(e => ({ ...e, level: Math.max(1, parseInt(e.level) || 1) }));
        const primary = Math.max(1, clampLevel(char.level) - extra.reduce((sum, e) => sum + e.level, 0));
        return [{ classId: char.classId, subclass: char.subclass, level: primary, primary: true }, ...extra];
    };
    // 把某个职业当成单职业角色来算（职业能力、资源、法术表都按该职业自己的等级）
    const classView = (char, e) => ({ ...char, classId: e.classId, subclass: e.subclass, level: e.level, multiclass: [] });
    const classLevel = (char, classId) => classEntries(char).filter(e => e.classId === classId).reduce((sum, e) => sum + e.level, 0);
    const subclassEntry = (char, name) => classEntries(char).find(e => e.subclass === name);
    const isLucky = (char) => char.race === 'halfling';
    const isMulticlass = (char) => classEntries(char).length > 1;
    // 「战士 3 / 法师 2」；单职业只写职业名
    const classSummary = (char) => {
        const list = classEntries(char);
        return list.length > 1 ? list.map(e => `${CLASSES[e.classId].name} ${e.level}`).join(' / ') : (classInfo(char)?.name || '');
    };
    // 生命骰池，从大到小，如 [10, 10, 6]
    const hitDicePool = (char) => classEntries(char).flatMap(e => Array(e.level).fill(CLASSES[e.classId].hitDie)).sort((a, b) => b - a);
    const hitDiceText = (pool) => Object.entries(pool.reduce((m, d) => ({ ...m, [d]: (m[d] || 0) + 1 }), {})).sort((a, b) => b[0] - a[0]).map(([d, n]) => `d${d}×${n}`).join(' + ');
    // 没满足兼职前置的提示：起始职业和每个兼职职业都要满足
    const multiclassIssues = (char) => {
        if (!isMulticlass(char)) return [];
        return classEntries(char).flatMap(e => (MULTICLASS_REQ[e.classId] || []).filter(req => ![].concat(req).some(ab => (parseInt(char.abilities?.[ab]) || 0) >= 13))
            .map(req => `${CLASSES[e.classId].name}需要${[].concat(req).map(ab => ABILITIES[ab]).join('或')} 13`));
    };

    // 豁免熟练：起始职业自带 + 坚韧专长 + 武僧 14 级全部豁免 + 游荡者 15 级圆滑心智
    const saveProficient = (char, ability) => !!classInfo(char)?.saves.includes(ability)
        || asiRecords(char).some(r => r.mode === 'feat' && r.feat === 'resilient' && r.fa === ability)
        || classLevel(char, 'monk') >= 14
        || (classLevel(char, 'rogue') >= 15 && (ability === 'WIS' || (char.edition === '2024' && ability === 'CHA')));
    // 圣武士 6 级守护灵光：所有豁免加魅力调整值（至少 +1）
    const auraOfProtection = (char) => (classLevel(char, 'paladin') >= 6 ? Math.max(1, abilityMod(char.abilities?.CHA)) : 0);
    const saveMod = (char, ability) => abilityMod(char.abilities?.[ability]) + (saveProficient(char, ability) ? profBonus(char.level) : 0) + auraOfProtection(char) + itemBonus(char, 'save');

    // 没有熟练的属性检定加一半熟练加值：吟游诗人 2 级万事通（2024 版只限技能检定）、2014 版勇士 7 级卓越运动员（力量/敏捷/体质，向上取整）
    // kind: 'skill' 技能检定 / 'ability' 纯属性检定（含先攻）
    const halfProficiency = (char, ability, kind) => {
        const pb = profBonus(char.level);
        const jack = classLevel(char, 'bard') >= 2 && (char.edition === '2014' || kind === 'skill') ? Math.floor(pb / 2) : 0;
        const athlete = char.edition === '2014' && (subclassEntry(char, '勇士')?.level || 0) >= 7 && ['STR', 'DEX', 'CON'].includes(ability) ? Math.ceil(pb / 2) : 0;
        return Math.max(jack, athlete);
    };

    const skillMod = (char, skillId) => {
        const skill = SKILLS[skillId]; if (!skill) return 0;
        const pb = profBonus(char.level);
        const prof = char.expertise?.includes(skillId) ? pb * 2 : char.skillProfs?.includes(skillId) ? pb : halfProficiency(char, skill.ability, 'skill');
        const wisBonus = (chose(char, 'divineOrder', 'thaumaturge') && ['arcana', 'religion'].includes(skillId)) || (chose(char, 'primalOrder', 'magician') && ['arcana', 'nature'].includes(skillId)) ? Math.max(1, abilityMod(char.abilities?.WIS)) : 0;
        return abilityMod(char.abilities?.[skill.ability]) + prof + itemBonus(char, 'check') + wisBonus;
    };

    const passivePerception = (char) => 10 + skillMod(char, 'perception') + (char.edition === '2014' && hasFeat(char, 'observant') ? 5 : 0);

    const armorClass = (char) => {
        if (char.acOverride) return parseInt(char.acOverride);
        const dex = abilityMod(char.abilities?.DEX);
        const armor = ARMOR[char.armor];
        let ac;
        if (armor) ac = armor.base + (armor.type === 'light' ? dex : armor.type === 'medium' ? Math.min(dex, 2) : 0);
        else {
            // 无甲防御只取最先获得的那个（起始职业优先）；武僧的不能持盾；龙族血脉有天生护甲
            const ua = classEntries(char).find(e => CLASSES[e.classId].unarmored);
            const options = [10 + dex];
            if (ua && !(ua.classId === 'monk' && char.shield)) options.push(10 + CLASSES[ua.classId].unarmored.reduce((sum, ab) => sum + abilityMod(char.abilities?.[ab]), 0));
            if (subclassEntry(char, '龙族血脉')) options.push(DRACONIC_AC[char.edition]?.(char) || 0);
            if (char.mageArmor) options.push(13 + dex);
            activeItems(char).forEach(i => { if (i.effects?.baseAc) options.push(i.effects.baseAc + dex); });
            ac = Math.max(...options);
        }
        const unarmoredBonus = !armor && !char.shield ? itemBonus(char, 'acUnarmored') : 0;
        return ac + (char.shield ? 2 : 0) + (armor && hasStyle(char, 'defense') ? 1 : 0) + itemBonus(char, 'ac') + unarmoredBonus;
    };

    // 1 级取起始职业生命骰最大值，之后每级取掷骰记录或平均值（每级至少 1 点）；再加上种族、子职业的每级生命加值
    // 掷骰记录：起始职业记在 hpRolls[等级]，兼职职业记在该条目的 hpRolls[该职业等级]
    const maxHp = (char) => {
        const entries = classEntries(char); if (!entries.length) return 0;
        const level = clampLevel(char.level); const con = abilityMod(char.abilities?.CON);
        const perLevel = (raceOf(char)?.hpPerLevel || 0) + (subraceOf(char)?.hpPerLevel || 0);
        let total = 0;
        entries.forEach((e, i) => {
            const die = CLASSES[e.classId].hitDie; const rolls = e.primary ? char.hpRolls : e.hpRolls;
            for (let lv = 1; lv <= e.level; lv++) total += i === 0 && lv === 1 ? die + con : Math.max(1, (parseInt(rolls?.[lv]) || die / 2 + 1) + con);
        });
        const draconic = subclassEntry(char, '龙族血脉')?.level || 0;
        return Math.max(level, total + perLevel * level + draconic + (hasFeat(char, 'tough') ? 2 * level : 0));
    };

    // 按等级分段取值：steps([[1, 2], [3, 3]]) → 1~2 级为 2，3 级起为 3，低于首段为 0
    const steps = (pairs) => (level) => pairs.reduce((v, [lv, n]) => (level >= lv ? n : v), 0);
    const critRange = (char) => Math.min(20, ...classEntries(char).map(e => steps(CRIT_RANGE[e.subclass] || [])(e.level) || 20));
    const rageDamage = (char) => steps([[1, 2], [9, 3], [16, 4]])(classLevel(char, 'barbarian'));
    const sneakAttackDice = (char) => Math.ceil(classLevel(char, 'rogue') / 2);

    // 武器熟练：职业的武器类别或具体武器名，加上种族武器训练
    const weaponProficient = (char, weaponId) => {
        const w = weaponData(char, weaponId); if (!w) return false;
        if (weaponId === 'unarmed') return true;
        const gains = edition(char.edition).multiclassGains || {};
        const orders = chose(char, 'divineOrder', 'protector') || chose(char, 'primalOrder', 'warden') ? ['军用武器'] : [];
        const list = [...(classInfo(char)?.weapons || []), ...orders, ...subclassProf(char, 'weapons'), ...classEntries(char).slice(1).flatMap(e => gains[e.classId]?.weapons || []), ...(raceOf(char)?.weapons || []), ...(subraceOf(char)?.weapons || [])];
        if (list.includes(w.name) || (w.cat === 'simple' && list.includes('简易武器'))) return true;
        if (w.cat !== 'martial') return false;
        return list.includes('军用武器')
            || (list.includes('灵巧或轻型军用武器') && (w.props.includes('finesse') || w.props.includes('light')))
            || (list.includes('轻型军用武器') && w.props.includes('light'));
    };

    // 职业与子职业特性：[{ level, name, desc, source, classId }]，level 是该职业的等级，只列到当前等级
    const singleClassFeatures = (char) => {
        const ed = edition(char.edition); const cls = classInfo(char); const level = clampLevel(char.level);
        if (!cls) return [];
        const desc = (name) => { const key = name.replace(/（.*?）/g, ''); return ed.featureDesc?.[key] ?? root.DND.FEATURE_DESC?.[key] ?? ''; };
        const list = [];
        const add = (table, source) => Object.entries(table || {}).forEach(([lv, names]) => {
            if (+lv <= level) names.split('、').forEach(name => list.push({ level: +lv, name, desc: desc(name), source, classId: char.classId }));
        });
        add(ed.classFeatures?.[char.classId], cls.name);
        if (char.subclass) add(ed.subclassFeatures?.[char.subclass], char.subclass);
        return list.sort((a, b) => a.level - b.level);
    };
    const classFeatures = (char) => classEntries(char).flatMap(e => singleClassFeatures(classView(char, e)));

    // —— 法术 ——
    // 奥法骑士、奥术诡术师：用智力施展法师法术，法术位按职业等级的三分之一
    const THIRD_CASTERS = { '奥法骑士': 'fighter', '奥术诡术师': 'rogue' };
    const casterType = (e) => CLASSES[e.classId]?.caster || (THIRD_CASTERS[e.subclass] === e.classId ? 'third' : null);
    const spellAbilityOf = (char, classId) => CLASSES[classId]?.spellAbility || (classEntries(char).some(e => e.classId === classId && casterType(e) === 'third') ? 'INT' : null);
    const spellListOf = (e) => (casterType(e) === 'third' ? 'wizard' : e.classId);
    const THIRD_KNOWN = [[3, 3], [4, 4], [7, 5], [8, 6], [10, 7], [11, 8], [13, 9], [14, 10], [16, 11], [19, 12], [20, 13]];
    const CANTRIPS_KNOWN = {
        '奥法骑士': [[3, 2], [10, 3]], '奥术诡术师': [[3, 3], [10, 4]],
        bard: [[1, 2], [4, 3], [10, 4]], cleric: [[1, 3], [4, 4], [10, 5]], druid: [[1, 2], [4, 3], [10, 4]],
        sorcerer: [[1, 4], [4, 5], [10, 6]], warlock: [[1, 2], [4, 3], [10, 4]], wizard: [[1, 3], [4, 4], [10, 5]],
    };
    // 兼职时各职业分别按自己的等级算，再加起来
    const cantripsKnown = (char) => classEntries(char).reduce((sum, e) => sum + steps(CANTRIPS_KNOWN[e.classId] || (casterType(e) === 'third' && CANTRIPS_KNOWN[e.subclass]) || [])(e.level), 0)
        + (chose(char, 'divineOrder', 'thaumaturge') ? 1 : 0) + (chose(char, 'primalOrder', 'magician') ? 1 : 0);
    const spellsAllowed = (char) => {
        const list = classEntries(char).map(e => singleSpellsAllowed(classView(char, e))).filter(a => a.count);
        const labels = [...new Set(list.map(a => a.label))];
        return { count: list.reduce((sum, a) => sum + a.count, 0), label: labels.length > 1 ? '已知和已准备法术' : labels[0] || '' };
    };
    // 可准备或已知的 1 环以上法术数：{ count, label }
    const singleSpellsAllowed = (char) => {
        const ed = edition(char.edition); const level = clampLevel(char.level);
        const known = ed.spellsKnown?.[char.classId]; const prepared = ed.spellsPrepared?.[char.classId];
        if (casterType(char) === 'third') return { count: steps(THIRD_KNOWN)(level), label: char.edition === '2024' ? '已准备法术' : '已知法术' };
        if (known) return { count: known[level - 1], label: '已知法术' };
        if (Array.isArray(prepared)) return { count: prepared[level - 1], label: '已准备法术' };
        const mod = abilityMod(char.abilities?.[spellAbilityOf(char, char.classId)]);
        if (prepared === 'level') return { count: Math.max(1, mod + level), label: '已准备法术' };
        if (prepared === 'half') return { count: level < 2 ? 0 : Math.max(1, mod + Math.floor(level / 2)), label: '已准备法术' };
        return { count: 0, label: '' };
    };
    // 能学的最高环阶：按各职业自己的等级算（兼职后合并的法术位环阶更高也不能学更高环的法术），邪术师另含秘法玄奥
    const singleMaxSpellLevel = (char) => {
        const top = Math.max(0, ...Object.keys(spellSlots(char)).map(slotLevel));
        return char.classId === 'warlock' ? Math.max(top, steps([[11, 6], [13, 7], [15, 8], [17, 9]])(clampLevel(char.level))) : top;
    };
    const maxSpellLevel = (char) => Math.max(0, ...classEntries(char).map(e => singleMaxSpellLevel(classView(char, e))));
    // 子职业表里到了等级的法术：table 为 alwaysPrepared（始终准备）或 expandedSpells（加进可选表）
    const subclassSpellIds = (char, e, table) => Object.entries(edition(char.edition)[table]?.[e.subclass] || {}).filter(([lv]) => +lv <= e.level).flatMap(([, ids]) => ids);
    // 可选法术：各职业的法术表加上子职业扩展表，环阶不超过该职业能学的
    // 吟游诗人魔法奥秘：2014 版 10 级（逸闻学院 6 级）可学任何职业的法术；2024 版 10 级可准备牧师、德鲁伊、法师的法术
    const secretsLists = (char, e) => {
        if (e.classId !== 'bard') return null;
        if (char.edition === '2024') return e.level >= 10 ? ['bard', 'cleric', 'druid', 'wizard'] : null;
        return e.level >= 10 || (e.subclass === '逸闻学院' && e.level >= 6) ? Object.keys(CLASSES) : null;
    };
    const classSpells = (char) => Object.values(root.DND.spellBook?.(char.edition) || {}).filter(s => classEntries(char).some(e => (s.classes.includes(spellListOf(e)) || subclassSpellIds(char, e, 'expandedSpells').includes(s.id) || secretsLists(char, e)?.some(c => s.classes.includes(c))) && s.level <= singleMaxSpellLevel(classView(char, e))));
    // 子职业送的始终准备法术（不占准备数量）
    // 种族、子种族送的法术（按角色等级解锁）
    const speciesSpells = (char) => [raceOf(char), subraceOf(char)].flatMap(r => Object.entries(r?.spells || {}).filter(([l]) => +l <= clampLevel(char.level)).flatMap(([, ids]) => ids));
    const alwaysPreparedSpells = (char) => [...new Set([...speciesSpells(char), ...classEntries(char).flatMap(e => subclassSpellIds(char, e, 'alwaysPrepared')), ...(root.DND.landSpells?.(char) || []), ...(root.DND.magicInitiateSpells?.(char) || [])])].filter(id => root.DND.spellBook?.(char.edition)[id]);
    // 施放某个法术用的职业：法术表、子职业送的或扩展表里有它的职业，都没有就取第一个施法职业
    const spellCastingClass = (char, spell) => ((root.DND.magicInitiateSpells?.(char) || []).includes(spell.id) && !classEntries(char).some(e => spell.classes.includes(spellListOf(e))) ? char.choices.magicInitiateList : null) || (classEntries(char).find(e => spell.classes.includes(spellListOf(e)) || subclassSpellIds(char, e, 'alwaysPrepared').includes(spell.id) || subclassSpellIds(char, e, 'expandedSpells').includes(spell.id))
        || classEntries(char).find(e => spellAbilityOf(char, e.classId)))?.classId;

    // 职业资源：[{ id, name, max, used, left, recharge, shortRegain }]，max 为 99 表示不限次数
    // 兼职时各职业资源分别按职业等级算；同名资源（如牧师和圣武士的引导神力）不叠加次数，取多的那个
    const classResources = (char) => {
        const out = {};
        classEntries(char).forEach(e => (edition(char.edition).resources?.[e.classId] || []).filter(d => !d.subclass || d.subclass === e.subclass).forEach(d => {
            const max = typeof d.max === 'function' ? d.max(e.level, char) : d.max;
            const recharge = typeof d.recharge === 'function' ? d.recharge(e.level) : d.recharge;
            const name = typeof d.name === 'function' ? d.name(e.level) : d.name;
            if (max > (out[d.id]?.max || 0)) out[d.id] = { ...d, name, max, recharge };
        }));
        return Object.values(out).map(r => { const used = Math.min(r.max, parseInt(char.resourcesUsed?.[r.id]) || 0); return { ...r, used, left: r.max - used }; });
    };

    // 返回 { 环阶: 数量 }；邪术师的契约法术位单独记为 p环阶（如 p3），短休恢复
    // 兼职时：只有一个职业能施法就用它自己的表；多个施法职业按施法者等级合计（全施法者算满，半施法者 2014 版向下、2024 版向上取一半）
    const slotLevel = (key) => parseInt(String(key).replace('p', '')) || 0;
    const slotLabel = (key) => (String(key).startsWith('p') ? `契约${slotLevel(key)}环` : `${key}环`);
    const spellSlots = (char) => {
        const entries = classEntries(char); const ed = edition(char.edition);
        const out = {};
        const casters = entries.filter(e => ['full', 'half', 'third'].includes(casterType(e)));
        let row = [];
        if (casters.length === 1) {
            const e = casters[0]; const type = casterType(e);
            row = type === 'full' ? FULL_SLOTS[e.level - 1] : type === 'third' ? (e.level < 3 ? [] : FULL_SLOTS[Math.ceil(e.level / 3) - 1]) : e.level < ed.halfCasterStart ? [] : FULL_SLOTS[Math.ceil(e.level / 2) - 1];
        } else if (casters.length > 1) {
            const half = (lv) => (char.edition === '2024' ? Math.ceil(lv / 2) : Math.floor(lv / 2));
            const casterLevel = casters.reduce((sum, e) => sum + ({ full: e.level, half: half(e.level), third: Math.floor(e.level / 3) })[casterType(e)], 0);
            row = FULL_SLOTS[Math.min(20, casterLevel) - 1] || [];
        }
        row.forEach((n, i) => { out[i + 1] = n; });
        const pact = classLevel(char, 'warlock');
        if (pact) { const [count, lv] = PACT_SLOTS[Math.min(20, pact) - 1]; out[`p${lv}`] = count; }
        return out;
    };

    // 施法属性按施法的职业取；不指定时取第一个施法职业
    const casterClass = (char, classId) => spellAbilityOf(char, classId) ? classId : classEntries(char).find(e => spellAbilityOf(char, e.classId))?.classId;
    const spellSaveDc = (char, classId) => {
        const ab = spellAbilityOf(char, casterClass(char, classId));
        return ab ? 8 + profBonus(char.level) + abilityMod(char.abilities?.[ab]) + itemBonus(char, 'spellDc') : null;
    };
    const spellAttack = (char, classId) => {
        const ab = spellAbilityOf(char, casterClass(char, classId));
        return ab ? profBonus(char.level) + abilityMod(char.abilities?.[ab]) + itemBonus(char, 'spellAttack') : null;
    };
    // 「法师 DC 14 · 攻击 +6」，兼职多个施法职业时用「；」分开
    const casterSummary = (char) => [...new Set(classEntries(char).map(e => e.classId).filter(id => spellAbilityOf(char, id)))]
        .map(id => `${isMulticlass(char) ? `${CLASSES[id].name} ` : ''}DC ${spellSaveDc(char, id)} · 攻击 ${signed(spellAttack(char, id))}`).join('；');

    // 武器攻击：灵巧武器取力量和敏捷中较高的，远程用敏捷
    const weaponAttack = (char, weaponId) => {
        let w = weaponData(char, weaponId); if (!w) return null;
        const str = abilityMod(char.abilities?.STR); const dex = abilityMod(char.abilities?.DEX);
        // 武僧武器：2014 版为短剑和非双手、非重型的简易近战武器；2024 版为简易近战武器和轻型军用近战武器
        const monk = classLevel(char, 'monk');
        const monkWeapon = monk && !w.props.includes('ranged') && (weaponId === 'unarmed' || (char.edition === '2024'
            ? w.cat === 'simple' || w.props.includes('light')
            : weaponId === 'shortsword' || (w.cat === 'simple' && !w.props.includes('twoHanded') && !w.props.includes('heavy'))));
        if (monkWeapon) {
            const die = char.edition === '2024' ? steps([[1, 6], [5, 8], [11, 10], [17, 12]])(monk) : steps([[1, 4], [5, 6], [11, 8], [17, 10]])(monk);
            const own = parseInt(String(w.damage).split('d')[1]) || 0;
            w = { ...w, damage: own >= die ? w.damage : `1d${die}`, props: [...w.props, 'finesse'] };
        }
        const mod = w.props.includes('ranged') ? dex : w.props.includes('finesse') ? Math.max(str, dex) : str;
        // 魔法武器：取装备中、加值最高的同类武器（需要同调的要已同调）
        const magic = (char.items || []).filter(i => i.equipped && i.ref === weaponId && (!i.attune || i.attuned)).sort((a, b) => (b.effects?.attack || 0) - (a.effects?.attack || 0))[0];
        const magicHit = parseInt(magic?.effects?.attack) || 0; const magicDmg = parseInt(magic?.effects?.damage) || 0;
        const proficient = weaponProficient(char, weaponId);
        const ranged = w.props.includes('ranged');
        const styleHit = ranged && hasStyle(char, 'archery') ? 2 : 0;
        const dmgMod = mod + (!ranged && !w.props.includes('twoHanded') && hasStyle(char, 'dueling') ? 2 : 0);
        const totalDmg = dmgMod + magicDmg;
        return { id: weaponId, name: magic?.name || w.name, magicExtra: magic?.effects?.extra || '', toHit: mod + styleHit + magicHit + (proficient ? profBonus(char.level) : 0), proficient, damage: `${w.damage}${totalDmg ? signed(totalDmg) : ''}`, greatWeapon: hasStyle(char, 'greatWeapon') && (w.props.includes('twoHanded') || !!w.versatile) && !ranged, type: w.type, range: w.range || '', melee: !w.props.includes('ranged'), usesStr: mod === str && !w.props.includes('ranged'), finesseOrRanged: w.props.includes('finesse') || w.props.includes('ranged'), mastery: chose(char, 'weaponMastery', weaponId) ? edition(char.edition).weaponMastery?.[weaponId] || null : null };
    };

    const initiativeMod = (char) => abilityMod(char.abilities?.DEX) + (hasFeat(char, 'alert') ? (char.edition === '2024' ? profBonus(char.level) : 5) : halfProficiency(char, 'DEX', 'ability'));

    // 速度：种族基础 + 野蛮人快速移动 / 武僧无甲移动；重甲力量不足 -10；力竭（2014 2 级减半、5 级为 0；2024 每级 -5）
    const speed = (char) => {
        const armor = ARMOR[char.armor];
        let v = subraceOf(char)?.speed || raceOf(char)?.speed || 30;
        if (classLevel(char, 'barbarian') >= 5 && armor?.type !== 'heavy') v += 10;
        if (!armor && !char.shield) v += steps([[2, 10], [6, 15], [10, 20], [14, 25], [18, 30]])(classLevel(char, 'monk'));
        if (armor?.str && (parseInt(char.abilities?.STR) || 0) < armor.str && !(char.edition === '2014' && char.race === 'dwarf')) v -= 10;
        const load = encumbrance(char).status;
        if (load === 'over') return 5;
        v -= { encumbered: 10, heavy: 20 }[load] || 0;
        const ex = parseInt(char.exhaustion) || 0;
        if (char.edition === '2024') v -= 5 * ex;
        else if (ex >= 5) v = 0;
        else if (ex >= 2) v = Math.floor(v / 2);
        return Math.max(0, v);
    };

    // —— 成长：属性值提升 / 专长 ——
    // char.asi = { 键: { mode: 'asi', a1, a2 } | { mode: 'feat', feat, fa } }；起始职业的键是等级（如 "4"），兼职职业是「职业:等级」（如 "wizard:4"）
    // 可以做属性提升或选专长的位置（含 2024 版 19 级史诗恩惠）：[{ key, level, source }]
    const asiLevels = (char) => classFeatures(char).filter(f => f.name === '属性值提升' || f.name === '史诗恩惠')
        .map(f => ({ key: f.classId === char.classId ? String(f.level) : `${f.classId}:${f.level}`, level: f.level, source: CLASSES[f.classId].name }));
    // 只计入当前等级已经拿到的记录
    const asiRecords = (char) => { const keys = asiLevels(char).map(a => a.key); return Object.entries(char.asi || {}).filter(([k]) => keys.includes(k)).map(([k, r]) => ({ key: k, ...r })); };
    // 已获得的专长：成长中选的 + 2024 背景送的起源专长
    const characterFeats = (char) => [...new Set([...asiRecords(char).filter(r => r.mode === 'feat' && r.feat).map(r => r.feat), backgroundOf(char)?.featId, char.edition === '2024' && char.race === 'human' && char.choices?.humanFeat].filter(Boolean))];
    const hasFeat = (char, id) => characterFeats(char).includes(id);
    // 战斗风格：职业在当前等级是否已获得
    const hasFightingStyle = (char) => classFeatures(char).some(f => f.name === '战斗风格');

    // —— 建角色 ——
    const raceOf = (char) => edition(char.edition).races[char.race];
    const subraceOf = (char) => raceOf(char)?.subraces?.[char.subrace];
    const backgroundOf = (char) => edition(char.edition).backgrounds[char.background];
    const subclassLevel = (char, classId = char.classId) => { const ed = edition(char.edition); return ed.subclassLevel[classId] || ed.defaultSubclassLevel; };
    const pointBuyCost = (base) => Object.values(base).reduce((sum, v) => sum + (POINT_BUY.cost[v] ?? Infinity), 0);

    // 最终属性 = 基础值 + 种族/子种族固定加值 + 自选加值（2014 半精灵、2024 背景），上限 20
    const finalAbilities = (char) => {
        const out = {};
        for (const ab of Object.keys(ABILITIES)) {
            const growth = asiRecords(char).reduce((sum, r) => sum + (r.mode === 'asi' ? (r.a1 === ab) + (r.a2 === ab) : r.fa === ab ? 1 : 0), 0);
            const v = (parseInt(char.baseAbilities?.[ab]) || 0) + (raceOf(char)?.bonuses?.[ab] || 0) + (subraceOf(char)?.bonuses?.[ab] || 0) + (parseInt(char.bonusPicks?.[ab]) || 0) + growth;
            const inc = activeItems(char).reduce((sum, i) => sum + (parseInt(i.effects?.inc?.[ab]) || 0), 0);
            const set = Math.max(0, ...activeItems(char).map(i => parseInt(i.effects?.set?.[ab]) || 0));
            out[ab] = Math.max(Math.min(20, v + inc), set);
        }
        return out;
    };

    // 种族、子种族、背景自带的技能熟练
    const grantedSkills = (char) => [...new Set([...(raceOf(char)?.skills || []), ...(subraceOf(char)?.skills || []), ...(backgroundOf(char)?.skills || []), ...(root.DND.choiceSkills?.(char) || [])])];

    // 各来源还能自选几项技能
    const skillChoices = (char) => {
        const cls = classInfo(char); const race = raceOf(char); const bg = backgroundOf(char);
        return [
            cls && { source: cls.name, count: cls.skillCount, options: cls.skills },
            race?.skillChoice && { source: race.name, count: race.skillChoice, options: race.skillOptions || ALL_SKILLS },
            bg?.skillChoice && { source: bg.name, count: bg.skillChoice, options: ALL_SKILLS },
            ...classEntries(char).slice(1).filter(e => edition(char.edition).multiclassGains?.[e.classId]?.skill)
                .map(e => ({ source: `兼职${CLASSES[e.classId].name}`, count: 1, options: CLASSES[e.classId].skills })),
        ].filter(Boolean);
    };

    const newCharacter = (editionId = '2024') => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        edition: editionId, name: '', gender: '', age: '', alignment: '', avatar: null, avatar_prompt: '',
        race: '', subrace: '', size: '', classId: '', subclass: '', multiclass: [], background: '', level: 1, xp: 0,
        genMethod: 'standard', baseAbilities: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 }, bonusPicks: {},
        abilities: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
        skillProfs: [], expertise: [],
        hp: 0, maxHp: 0, tempHp: 0, hitDiceUsed: 0, armor: '', shield: false, acOverride: null,
        weapons: [], items: [], coins: { cp: 0, sp: 0, ep: 0, pp: 0 }, variantEncumbrance: false, slotsUsed: {}, spells: '', features: '', inventory: '', gold: 0,
        conditions: [], exhaustion: 0, deathSaves: { success: 0, fail: 0 }, dead: false,
        resourcesUsed: {}, raging: false, concentration: '', mageArmor: false, spellIds: [],
        asi: {}, fightingStyle: '', hpRolls: {}, choices: {}, languages: '', tools: '',
        backstory: { appearance: '', personality: '', ideals: '', bonds: '', flaws: '', story: '' },
        history: [], badges: [],
    });

    // 兼职条目：去掉无效和重复的职业；起始职业至少保留 1 级，放不下时从最后一个兼职开始减
    const fitMulticlass = (char) => {
        const seen = new Set([char.classId]);
        let room = clampLevel(char.level) - 1;
        return (char.multiclass || []).filter(e => CLASSES[e?.classId] && !seen.has(e.classId) && seen.add(e.classId))
            .map(e => ({ classId: e.classId, subclass: e.subclass || '', level: Math.max(1, parseInt(e.level) || 1), hpRolls: e.hpRolls || {} }))
            .map(e => { const level = Math.min(e.level, room); room -= level; return { ...e, level }; })
            .filter(e => e.level > 0);
    };

    // 补齐缺失字段，并重算由选项决定的数值（最终属性、生命值上限）
    const normalizeCharacter = (data) => {
        const base = newCharacter(data?.edition);
        const char = { ...base, ...data, backstory: { ...base.backstory, ...(data?.backstory || {}) }, deathSaves: { ...base.deathSaves, ...(data?.deathSaves || {}) } };
        if (!editions[char.edition]) char.edition = '2024';
        char.level = clampLevel(char.level);
        char.multiclass = fitMulticlass(char);
        if (char.baseAbilities) char.abilities = finalAbilities(char);
        char.skillProfs = [...new Set([...(char.skillProfs || []), ...grantedSkills(char)])].filter(id => SKILLS[id]);
        char.items = Array.isArray(data?.items) ? data.items : migrateItems({ ...char, items: null, weapons: (char.weapons || []).filter(id => WEAPONS[id]) });
        char.coins = { ...base.coins, ...(data?.coins || {}) };
        syncEquipment(char);
        if (root.DND.spellBook) char.spellIds = (char.spellIds || []).filter(id => root.DND.spellBook(char.edition)[id]);
        if (root.DND.FIGHTING_STYLES && !root.DND.FIGHTING_STYLES[char.fightingStyle]) char.fightingStyle = '';
        const hp = maxHp(char);
        if (hp && !data?.maxHp) char.hp = hp;
        char.maxHp = hp || parseInt(char.maxHp) || 0;
        return char;
    };

    root.DND = { ABILITIES, SKILLS, ALL_SKILLS, CLASSES, ARMOR, WEAPONS, CONDITIONS, XP_TABLE, STANDARD_ARRAY, POINT_BUY, editions, edition, classInfo, isLucky, speciesSpells, chose, subclassesOf, casterType, spellAbilityOf, hasStyle, armorTraining, armorIssue, GEAR_WEIGHT, SLOTS, ATTUNE_MAX, itemFromRef, activeItems, itemBonus, syncEquipment, encumbrance, ENCUMBRANCE_TEXT, equipmentIssues, sentientCheckMod, casterSummary, classEntries, classLevel, subclassEntry, isMulticlass, classSummary, hitDicePool, hitDiceText, multiclassIssues, fitMulticlass, MULTICLASS_REQ, slotLevel, slotLabel, weaponData, signed, abilityMod, profBonus, levelFromXp, rollDice, d20Test, saveProficient, saveMod, skillMod, passivePerception, armorClass, maxHp, spellSlots, spellSaveDc, spellAttack, weaponAttack, weaponProficient, initiativeMod, speed, halfProficiency, auraOfProtection, steps, critRange, rageDamage, sneakAttackDice, classFeatures, classResources, asiRecords, asiLevels, characterFeats, hasFeat, hasFightingStyle, cantripsKnown, spellsAllowed, maxSpellLevel, classSpells, alwaysPreparedSpells, spellCastingClass, raceOf, subraceOf, backgroundOf, subclassLevel, pointBuyCost, finalAbilities, grantedSkills, skillChoices, newCharacter, normalizeCharacter };
})(typeof window !== 'undefined' ? window : globalThis);
