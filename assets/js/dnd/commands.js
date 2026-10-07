// 跑团指令：检定、掷骰、状态变更、资源、休息、战斗，以及发给 AI 的角色资料。依赖 rules.js。
// 检定结果格式 { label, roll, target, level, success, extra, change? }，与聊天界面的骰子卡片一致；
// change = { log, rollback } 表示这次掷骰改动了角色（如死亡豁免），由调用方记录以便撤销。
(function (root) {
    const D = root.DND;
    const ABILITY_BY_NAME = Object.fromEntries(Object.entries(D.ABILITIES).flatMap(([k, v]) => [[k, k], [k.toLowerCase(), k], [v, k]]));
    const SKILL_BY_NAME = Object.fromEntries(Object.entries(D.SKILLS).flatMap(([id, s]) => [[id, id], [s.name, id]]));

    // 徒手攻击人人都能用，不必列在武器栏里
    const findWeapon = (char, name) => (['徒手', '徒手攻击', 'unarmed'].includes(name) ? 'unarmed'
        : (char.weapons || []).find(id => id === name || D.WEAPONS[id]?.name === name) || (char.items || []).find(i => i.equipped && D.WEAPONS[i.ref] && i.name === name)?.ref);
    // 骰子取最大值，如 "2d8+3" → 19（至高治疗）
    const maxDice = (expr) => D.rollDice(String(expr).replace(/(\d*)d(\d+)/g, (m, n, d) => String((parseInt(n) || 1) * d))).total;
    const critDamage = (expr) => expr.replace(/(\d*)d(\d+)/g, (m, n, d) => `${(parseInt(n) || 1) * 2}d${d}`);
    const snapshot = (char, keys) => JSON.parse(JSON.stringify(Object.fromEntries(keys.map(k => [k, char[k]]))));
    const removeCondition = (char, name) => { char.conditions = (char.conditions || []).filter(c => c !== name); };

    // 检定目标：豁免 / 先攻 / 死亡豁免 / 属性 / 技能 / 武器攻击。ability 为该检定所用属性
    const resolveCheck = (char, target) => {
        const t = target.replace(/检定$/, '');
        if (t === '死亡豁免') return { kind: 'death', label: '死亡豁免', mod: 0 };
        const save = t.match(/^(.+?)豁免$/) || t.match(/^豁免(.+)$/);
        if (save && ABILITY_BY_NAME[save[1]]) { const ab = ABILITY_BY_NAME[save[1]]; return { kind: 'save', ability: ab, label: `${D.ABILITIES[ab]}豁免`, mod: D.saveMod(char, ab) }; }
        if (t === '先攻') return { kind: 'init', ability: 'DEX', label: '先攻', mod: D.initiativeMod(char) };
        if (ABILITY_BY_NAME[t]) { const ab = ABILITY_BY_NAME[t]; return { kind: 'ability', ability: ab, label: `${D.ABILITIES[ab]}检定`, mod: D.abilityMod(char.abilities?.[ab]) + D.halfProficiency(char, ab, 'ability') }; }
        if (SKILL_BY_NAME[t]) { const id = SKILL_BY_NAME[t]; return { kind: 'skill', skill: id, ability: D.SKILLS[id].ability, label: `${D.SKILLS[id].name}检定`, mod: D.skillMod(char, id) }; }
        const weaponId = findWeapon(char, t);
        if (weaponId) { const w = D.weaponAttack(char, weaponId); return { kind: 'attack', ability: w.usesStr ? 'STR' : 'DEX', label: `${w.name}攻击`, mod: w.toHit, weapon: w }; }
        return null;
    };

    // 角色状态带来的优势、劣势、减值和自动失败
    const rollModifiers = (char, info) => {
        const conds = char.conditions || []; const has = (c) => conds.includes(c);
        const isCheck = ['ability', 'skill', 'init'].includes(info.kind); const isAttack = info.kind === 'attack'; const isSave = info.kind === 'save' || info.kind === 'death';
        const adv = []; const dis = []; let penalty = 0; let autoFail = '';
        const ex = parseInt(char.exhaustion) || 0;
        for (const c of ['中毒', '恐慌']) if (has(c) && (isAttack || isCheck)) dis.push(c);
        for (const c of ['目盲', '倒地', '束缚']) if (has(c) && isAttack) dis.push(c);
        if (has('束缚') && info.kind === 'save' && info.ability === 'DEX') dis.push('束缚');
        if (has('隐形') && isAttack) adv.push('隐形');
        if (info.kind === 'save' && ['STR', 'DEX'].includes(info.ability)) autoFail = ['麻痹', '震慑', '昏迷', '石化'].find(has) || '';
        if (ex) {
            if (char.edition === '2024') penalty = -2 * ex;
            else { if (isCheck && ex >= 1) dis.push(`力竭${ex}级`); if ((isAttack || isSave) && ex >= 3) dis.push(`力竭${ex}级`); }
        }
        if (char.raging && info.ability === 'STR' && (isCheck || info.kind === 'save')) adv.push('狂暴');
        if (D.armorIssue(char) && (isAttack || ((isCheck || isSave) && ['STR', 'DEX'].includes(info.ability)))) dis.push('护甲不熟练');
        if (D.encumbrance(char).status === 'heavy' && (isAttack || ((isCheck || isSave) && ['STR', 'DEX', 'CON'].includes(info.ability)))) dis.push('重度负重');
        if (info.skill === 'stealth' && D.ARMOR[char.armor]?.stealth) dis.push('护甲');
        if (char.edition === '2024' && (D.subclassEntry(char, '勇士')?.level || 0) >= 3 && (info.kind === 'init' || info.skill === 'athletics')) adv.push('卓越运动员');
        const barbarian = D.classLevel(char, 'barbarian');
        if (barbarian >= 2 && info.kind === 'save' && info.ability === 'DEX' && !['目盲', '耳聋', '失能'].some(has)) adv.push('危险感知');
        if (barbarian >= 7 && info.kind === 'init') adv.push('野性直觉');
        if (info.kind === 'death' && char.edition === '2024' && (D.subclassEntry(char, '勇士')?.level || 0) >= 18) adv.push('幸存者');
        return { adv, dis, penalty, autoFail };
    };

    // 死亡豁免：只在生命为 0 且未死亡时计数
    const applyDeathSave = (char, roll) => {
        if ((parseInt(char.hp) || 0) > 0 || char.dead) return null;
        const rollback = snapshot(char, ['hp', 'deathSaves', 'conditions', 'dead']);
        const ds = { success: 0, fail: 0, ...(char.deathSaves || {}) };
        const natTwenty = roll === 20 || (char.edition === '2024' && (D.subclassEntry(char, '勇士')?.level || 0) >= 18 && roll >= 18);
        let log;
        if (natTwenty) {
            char.hp = 1; char.deathSaves = { success: 0, fail: 0 }; removeCondition(char, '昏迷');
            return { log: `${char.name} 的死亡豁免掷出 ${roll}，恢复 1 点生命并苏醒`, rollback };
        }
        if (roll === 1) ds.fail += 2; else if (roll >= 10) ds.success += 1; else ds.fail += 1;
        if (ds.fail >= 3) { char.dead = true; log = `${char.name} 的死亡豁免失败满 3 次，死亡`; }
        else if (ds.success >= 3) { ds.success = 0; ds.fail = 0; log = `${char.name} 的死亡豁免成功满 3 次，伤势稳定（仍昏迷，1d4 小时后恢复 1 点生命）`; }
        else log = `${char.name} 的死亡豁免：成功 ${ds.success} / 失败 ${ds.fail}`;
        char.deathSaves = ds;
        return { log, rollback };
    };

    // .ra 名称 [优势|劣势] [dc15]
    const rollCheck = (char, text) => {
        const m = String(text || '').trim().match(/^[.。](?:ra|rc|check)\s*(.+)$/i);
        if (!m || !char) return null;
        // 第一个词是检定项目，后面可以跟优势/劣势/难度和玩家想说的话
        const [target, ...more] = m[1].trim().split(/\s+/);
        const rest = more.join(' ');
        const dc = parseInt(rest.match(/(?:dc|难度)\s*(\d+)/i)?.[1]) || null;
        const info = resolveCheck(char, target);
        if (!info) return { label: `${target} 检定`, roll: '-', level: '未找到该项', success: null };

        const mods = rollModifiers(char, info);
        if (mods.autoFail) return { label: info.label, roll: '-', target: dc, level: `自动失败（${mods.autoFail}）`, success: false, extra: '' };
        if (/优势|\badv\b/i.test(rest)) mods.adv.push('指定');
        if (/劣势|\bdis\b/i.test(rest)) mods.dis.push('指定');
        const mod = info.mod + mods.penalty;
        const t = D.d20Test({ mod, adv: mods.adv.length > 0, dis: mods.dis.length > 0, dc, lucky: D.isLucky(char) });
        // 游荡者 11 级可靠才能：熟练的技能检定 d20 低于 10 按 10 算
        const reliable = info.kind === 'skill' && D.classLevel(char, 'rogue') >= 11 && char.skillProfs?.includes(info.skill) && t.roll < 10;
        if (reliable) { t.total += 10 - t.roll; t.success = dc == null ? null : t.total >= dc; }
        let level = ''; let success = t.success; let change = null;

        if (info.kind === 'attack') {
            const crit = t.roll >= D.critRange(char);
            if (crit || t.fumble) { level = crit ? '重击' : '大失手'; success = crit; }
        }
        if (info.kind === 'death') {
            success = t.roll >= 10;
            change = applyDeathSave(char, t.roll);
            level = t.roll === 20 || change?.log.includes('苏醒') ? '苏醒' : t.roll === 1 ? '记两次失败' : success ? '成功' : '失败';
        }
        if (!level && dc) level = success ? '成功' : '失败';

        const reasons = [...mods.adv.map(r => `优势:${r}`), ...mods.dis.map(r => `劣势:${r}`)].filter(r => !r.endsWith(':指定'));
        let extra = `d20${t.mode === 'normal' ? '' : `（${t.mode === 'adv' ? '优势' : '劣势'} ${t.rolls.join('/')}）`}=${t.roll} ${D.signed(mod)}`;
        if (mods.penalty) extra += `（力竭 ${mods.penalty}）`;
        if (reliable) extra += ' · 可靠才能按 10 算';
        if (reasons.length) extra += ` · ${reasons.join(' ')}`;
        if (info.kind === 'attack') {
            const w = info.weapon;
            // 投掷武器扔出去算远程攻击，不加狂暴伤害
            const thrown = /投掷|\bthrow/i.test(rest);
            const rage = char.raging && w.melee && w.usesStr && !thrown ? D.rageDamage(char) : 0;
            if (thrown) extra += ' · 投掷';
            // 巨武器战斗：2024 伤害骰 1、2 当 3；2014 掷出 1、2 重骰一次
            const gwf = w.greatWeapon ? (char.edition === '2024' ? 'min3' : 'ro2') : '';
            // 近战重击额外武器骰：2014 野蛮人残暴重击（9/13/17 级 1/2/3 颗）、2014 半兽人凶蛮攻击（1 颗）
            const crit = level === '重击';
            const brutal = crit && w.melee && char.edition === '2014' ? D.steps([[9, 1], [13, 2], [17, 3]])(D.classLevel(char, 'barbarian')) + (char.race === 'halfOrc' ? 1 : 0) : 0;
            const die = String(w.damage).match(/d(\d+)/)?.[1];
            const dmgExpr = `${crit ? critDamage(w.damage) : w.damage}${brutal && die ? `+${brutal}d${die}` : ''}${rage ? `+${rage}` : ''}`.replace(/(\d*d\d+)/g, `$1${gwf}`);
            extra += ` · 伤害 ${D.rollDice(dmgExpr).total} ${w.type}${rage ? `（含狂暴 +${rage}）` : ''}${brutal ? `（含重击额外 ${brutal} 骰）` : ''}${gwf ? '（巨武器战斗）' : ''}`;
            // 圣武士 11 级：近战武器命中另加 1d8 光耀（2014 精通至圣斩 / 2024 光耀打击）
            if (w.melee && !thrown && D.classLevel(char, 'paladin') >= 11) extra += ` · 命中另加 ${D.rollDice(crit ? '2d8' : '1d8').total} 光耀`;
            if (w.magicExtra) extra += ` · 魔法武器额外 ${w.magicExtra}（按物品说明的条件）`;
            const strikeDice = D.chose(char, 'blessedStrikes', 'divineStrike') ? (D.classLevel(char, 'cleric') >= 14 ? '2d8' : '1d8') : D.chose(char, 'elementalFury', 'primalStrike') ? (D.classLevel(char, 'druid') >= 15 ? '2d8' : '1d8') : '';
            if (strikeDice) extra += ` · 每回合首次命中可另加 ${D.rollDice(crit ? critDamage(strikeDice) : strikeDice).total}（${D.chose(char, 'blessedStrikes', 'divineStrike') ? '光耀或黯蚀' : '冷冻、火焰、闪电或雷鸣'}）`;
            if (!w.proficient) extra += ' · 未熟练';
            const sneak = D.sneakAttackDice(char);
            if (sneak && w.finesseOrRanged) extra += ` · 满足条件可加偷袭 ${level === '重击' ? sneak * 2 : sneak}d6`;
        }
        return { label: info.label, roll: t.total, target: dc, level, success: level ? success : null, extra, change };
    };

    // .r 表达式
    const rollExpr = (text) => {
        const m = String(text || '').trim().match(/^[.。]r(?![a-z])\s*(\S+)/i);
        if (!m) return null;
        const r = D.rollDice(m[1]);
        if (!r) return null;
        const detail = r.parts.filter(p => p.rolls).map(p => `[${p.rolls.join(',')}]`).join(' ');
        return { label: `投骰 ${r.expr}`, roll: r.total, success: null, extra: detail };
    };

    // .st 可修改的项目：key 为角色字段，name 为显示名
    const STAT_KEYS = {
        hp: 'hp', 生命: 'hp', 生命值: 'hp', 血量: 'hp',
        temp: 'tempHp', 临时: 'tempHp', 临时生命: 'tempHp',
        xp: 'xp', 经验: 'xp', gold: 'gold', 金币: 'gold',
        力竭: 'exhaustion', exhaustion: 'exhaustion', 生命骰: 'hitDiceUsed',
        状态: 'conditions', condition: 'conditions',
    };
    const STAT_NAMES = { hp: '生命值', tempHp: '临时生命', xp: '经验', gold: '金币', exhaustion: '力竭', hitDiceUsed: '已用生命骰', conditions: '状态' };
    const HP_KEYS = ['hp', 'tempHp', 'deathSaves', 'conditions', 'dead', 'raging', 'concentration'];

    // 带符号表示增减，不带符号表示直接设为该值；支持骰子表达式
    const evalChange = (current, expr) => {
        const op = /^[+-]/.test(expr) ? expr[0] : '=';
        const r = D.rollDice(op === '=' ? expr : expr.slice(1));
        if (!r) return null;
        return op === '+' ? current + r.total : op === '-' ? current - r.total : r.total;
    };

    // 生命变化：临时生命先抵伤害；降到 0 进入濒死，伤害溢出达到上限直接死亡；濒死时受伤记失败；受伤提示专注豁免
    const changeHp = (char, expr) => {
        const current = parseInt(char.hp) || 0; let next = evalChange(current, expr);
        if (next == null) return { ok: false };
        const rollback = snapshot(char, HP_KEYS);
        const max = char.maxHp || Infinity; const notes = [];
        if (char.dead && next > current) return { ok: true, log: `${char.name} 已经死亡，普通治疗无效，需要复活类法术`, rollback };
        if (next < current && char.tempHp > 0) {
            const absorbed = Math.min(char.tempHp, current - next);
            char.tempHp -= absorbed; next += absorbed; notes.push(`临时生命抵消 ${absorbed}`);
        }
        const damage = Math.max(0, current - next);
        if (damage && current > 0 && next <= 0) {
            if (-next >= (char.maxHp || Infinity)) { char.dead = true; notes.push('伤害溢出达到生命上限，当场死亡'); }
            else { notes.push('倒地濒死，需要进行死亡豁免'); char.deathSaves = { success: 0, fail: 0 }; }
            char.conditions = [...new Set([...(char.conditions || []), '昏迷'])];
            char.raging = false; char.concentration = '';
        } else if (damage && current === 0 && !char.dead) {
            const ds = { success: 0, fail: 0, ...(char.deathSaves || {}) }; ds.fail += 1; char.deathSaves = ds;
            if (ds.fail >= 3 || damage >= (char.maxHp || Infinity)) { char.dead = true; notes.push('濒死时受到伤害，死亡'); }
            else notes.push(`濒死时受到伤害，死亡豁免失败 ${ds.fail}/3`);
        } else if (current === 0 && next > 0) {
            char.deathSaves = { success: 0, fail: 0 }; removeCondition(char, '昏迷'); notes.push('恢复意识');
        }
        if (damage && next > 0 && char.concentration) {
            const dc = Math.min(30, Math.max(10, Math.floor(damage / 2)));
            notes.push(`维持专注「${char.concentration}」需体质豁免 DC ${dc}`);
        }
        char.hp = Math.max(0, Math.min(max, next));
        return { ok: true, log: `${char.name} 的生命值：${current} ➔ ${char.hp}${notes.length ? `（${notes.join('；')}）` : ''}`, rollback };
    };

    // 返回 { ok, log, rollback } ；rollback 用于撤销
    const COINS = { 铜币: 'cp', cp: 'cp', 银币: 'sp', sp: 'sp', 银金币: 'ep', ep: 'ep', 白金币: 'pp', pp: 'pp' };
    const COIN_NAMES = { cp: '铜币', sp: '银币', ep: '银金币', pp: '白金币' };
    const applyStat = (char, prop, expr) => {
        if (!char || !prop || !expr) return { ok: false };
        const p = String(prop).trim(); const e = String(expr).trim();
        const ending = /^(-|结束|end|无)$/i.test(e);

        if (COINS[p]) {
            const k = COINS[p]; const rollback = snapshot(char, ['coins']);
            const current = parseInt(char.coins?.[k]) || 0; const next = Math.max(0, evalChange(current, e) ?? current);
            char.coins = { ...(char.coins || {}), [k]: next };
            return { ok: true, log: `${char.name} 的${COIN_NAMES[k]}：${current} ➔ ${next}`, rollback };
        }
        // .st 物品 +治疗药水*2 / -治疗药水：增减背包里的物品数量
        if (p === '物品' || p === 'item') {
            const m = e.match(/^([+-])(.+?)(?:[*×x](\d+))?$/); if (!m) return { ok: false };
            const rollback = snapshot(char, ['items']); const n = parseInt(m[3]) || 1; const name = m[2].trim();
            const items = [...(char.items || [])]; const it = items.find(i => i.name === name);
            if (m[1] === '+') {
                if (it) it.qty = (parseInt(it.qty) || 0) + n;
                else items.push({ uid: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name, cat: 'gear', qty: n, w: 0, equipped: false, attuned: false, slot: '' });
            } else {
                if (!it) return { ok: true, log: `${char.name} 的背包里没有「${name}」`, rollback: null };
                it.qty = Math.max(0, (parseInt(it.qty) || 0) - n);
                if (!it.qty) items.splice(items.indexOf(it), 1);
            }
            char.items = items; D.syncEquipment(char);
            return { ok: true, log: `${char.name} ${m[1] === '+' ? '获得' : '失去'}「${name}」×${n}${it?.qty ? `（现有 ${it.qty}）` : ''}`, rollback };
        }

        if (p === '专注') {
            const rollback = snapshot(char, ['concentration']);
            const old = char.concentration || '无'; char.concentration = ending ? '' : e;
            return { ok: true, log: `${char.name} 的专注：${old} ➔ ${char.concentration || '无'}`, rollback };
        }
        if (p === '狂暴' && ending) {
            const rollback = snapshot(char, ['raging']); char.raging = false;
            return { ok: true, log: `${char.name} 的狂暴结束`, rollback };
        }
        const key = STAT_KEYS[p] || STAT_KEYS[p.toLowerCase()];
        if (key === 'hp') return changeHp(char, e);
        if (key === 'conditions') {
            const name = e.replace(/^[+-]/, '');
            if (!D.CONDITIONS.includes(name)) return { ok: false };
            const old = [...(char.conditions || [])];
            char.conditions = e.startsWith('-') ? old.filter(c => c !== name) : [...new Set([...old, name])];
            return { ok: true, log: `${char.name} 的状态：${old.join('、') || '无'} ➔ ${char.conditions.join('、') || '无'}`, rollback: { conditions: old } };
        }

        const slot = p.match(/^(?:法术位|slot)(\d)$/i);
        const ability = ABILITY_BY_NAME[p];
        if (slot) {
            const slots = D.spellSlots(char); const lv = slots[slot[1]] ? slot[1] : `p${slot[1]}`; const max = slots[lv] || 0;
            if (!max) return { ok: false };
            char.slotsUsed = char.slotsUsed || {};
            const current = parseInt(char.slotsUsed[lv]) || 0;
            const next = Math.max(0, Math.min(max, evalChange(current, e) ?? current));
            const old = { ...char.slotsUsed }; char.slotsUsed[lv] = next;
            // 指令按“已用数量”计，日志显示剩余数量更直观
            return { ok: true, log: `${char.name} 的${D.slotLabel(lv)}法术位：${max - current} ➔ ${max - next}`, rollback: { slotsUsed: old } };
        }
        if (ability) {
            const current = parseInt(char.abilities?.[ability]) || 10;
            const next = Math.max(1, Math.min(30, evalChange(current, e) ?? current));
            const old = { abilities: { ...char.abilities }, baseAbilities: { ...char.baseAbilities } };
            char.abilities[ability] = next;
            if (char.baseAbilities) char.baseAbilities[ability] = (parseInt(char.baseAbilities[ability]) || 0) + next - current;
            return { ok: true, log: `${char.name} 的${D.ABILITIES[ability]}：${current} ➔ ${next}`, rollback: old };
        }
        if (!key) return { ok: false };

        const current = parseInt(char[key]) || 0;
        const next = evalChange(current, e);
        if (next == null) return { ok: false };
        const old = { [key]: char[key] };
        const max = key === 'exhaustion' ? 6 : key === 'hitDiceUsed' ? (parseInt(char.level) || 1) : Infinity;
        char[key] = Math.max(0, Math.min(max, next));
        let note = '';
        if (key === 'exhaustion' && char[key] >= 6) { old.dead = char.dead; char.dead = true; note = '（力竭 6 级，死亡）'; }
        return { ok: true, log: `${char.name} 的${STAT_NAMES[key]}：${current} ➔ ${char[key]}${note}`, rollback: old };
    };

    const undoStat = (char, rollback) => { if (char && rollback) Object.assign(char, JSON.parse(JSON.stringify(rollback))); };

    // .use 资源名 [数量]：消耗职业资源。狂暴会进入狂暴状态，回气会自动回复生命
    const useResource = (char, name, amount) => {
        const n = Math.max(1, parseInt(amount) || 1);
        const r = D.classResources(char).find(x => x.name === name || x.id === name) || D.classResources(char).find(x => x.name.includes(name));
        if (!r) return { ok: false };
        if (r.max !== 99 && r.left < n) return { ok: true, log: `${char.name} 的${r.name}次数不足（剩余 ${r.left}/${r.max}）`, rollback: null };
        const rollback = snapshot(char, ['resourcesUsed', ...HP_KEYS]);
        char.resourcesUsed = { ...(char.resourcesUsed || {}), [r.id]: r.used + n };
        const left = r.max === 99 ? '不限' : `${r.left - n}/${r.max}`;
        let log = `${char.name} 使用${r.name}${n > 1 ? ` ${n} 点` : ''}（剩余 ${left}）`;
        if (r.id === 'rage') {
            char.raging = true;
            log += `，进入狂暴：力量伤害 +${D.rageDamage(char)}，力量检定和豁免优势，抵抗钝击、穿刺、挥砍伤害`;
        }
        if (r.id === 'secondWind') {
            const heal = D.rollDice(`1d10+${D.classLevel(char, 'fighter')}`).total;
            const before = parseInt(char.hp) || 0; char.hp = Math.min(char.maxHp || Infinity, before + heal);
            if (before === 0) { char.deathSaves = { success: 0, fail: 0 }; removeCondition(char, '昏迷'); }
            log += `，回复 ${heal} 点生命（${before} ➔ ${char.hp}）`;
        }
        return { ok: true, log, rollback };
    };

    // .hd 数量：短休时花费生命骰回复生命（每枚 = 生命骰 + 体质调整值，最少 0）；兼职有多种生命骰时先用大的
    const spendHitDice = (char, amount) => {
        const pool = D.hitDicePool(char); if (!pool.length) return { ok: false };
        const usedBefore = parseInt(char.hitDiceUsed) || 0;
        const available = pool.length - usedBefore;
        const n = Math.min(available, Math.max(1, parseInt(amount) || 1));
        if (n <= 0 || char.dead) return { ok: true, log: `${char.name} 没有可用的生命骰`, rollback: null };
        const rollback = snapshot(char, ['hp', 'hitDiceUsed', 'deathSaves', 'conditions']);
        const con = D.abilityMod(char.abilities?.CON);
        const dice = pool.slice(usedBefore, usedBefore + n);
        const die = [...new Set(dice)].map(d => `d${d}`).join('/');
        const rolls = dice.map(d => Math.max(0, D.rollDice(`1d${d}`).total + con));
        const heal = rolls.reduce((a, b) => a + b, 0);
        const before = parseInt(char.hp) || 0;
        char.hp = Math.min(char.maxHp || Infinity, before + heal);
        char.hitDiceUsed = (parseInt(char.hitDiceUsed) || 0) + n;
        if (before === 0 && char.hp > 0) { char.deathSaves = { success: 0, fail: 0 }; removeCondition(char, '昏迷'); }
        return { ok: true, log: `${char.name} 花费 ${n} 枚生命骰（${die}${D.signed(con)}：${rolls.join('+')}），回复 ${heal} 点生命（${before} ➔ ${char.hp}，剩余生命骰 ${available - n}）`, rollback };
    };

    // 长休：回满生命与法术位，恢复全部职业资源与生命骰（2014 版恢复一半），力竭 -1
    // 短休：恢复短休资源、契约法术位，长休资源中注明 shortRegain 的恢复对应次数
    const rest = (char, type) => {
        const rollback = snapshot(char, ['slotsUsed', 'hitDiceUsed', 'exhaustion', 'resourcesUsed', 'mageArmor', ...HP_KEYS]);
        const resources = D.classResources(char);
        char.raging = false;
        if (/长|long/i.test(type)) {
            if (char.dead) return { ok: true, log: `${char.name} 已经死亡，无法休息恢复`, rollback };
            Object.assign(char, { hp: char.maxHp, tempHp: 0, slotsUsed: {}, deathSaves: { success: 0, fail: 0 }, resourcesUsed: {}, mageArmor: false, concentration: '' });
            removeCondition(char, '昏迷');
            const level = parseInt(char.level) || 1;
            char.hitDiceUsed = D.edition(char.edition).longRestHitDice === 'all' ? 0 : Math.max(0, (parseInt(char.hitDiceUsed) || 0) - Math.max(1, Math.floor(level / 2)));
            char.exhaustion = Math.max(0, (parseInt(char.exhaustion) || 0) - 1);
            return { ok: true, log: `${char.name} 完成长休：生命值、法术位、职业资源全部恢复，剩余生命骰 ${level - char.hitDiceUsed}/${level}`, rollback };
        }
        const restored = [];
        const used = { ...(char.resourcesUsed || {}) };
        for (const r of resources) {
            if (!r.used) continue;
            if (r.recharge === 'short') { used[r.id] = 0; restored.push(r.name); }
            else if (r.shortRegain) { used[r.id] = Math.max(0, r.used - r.shortRegain); restored.push(`${r.name} ${r.shortRegain} 次`); }
        }
        char.resourcesUsed = used;
        if (D.classLevel(char, 'warlock')) {
            char.slotsUsed = Object.fromEntries(Object.entries(char.slotsUsed || {}).filter(([k]) => !k.startsWith('p')));
            restored.push('契约法术位');
        }
        const left = (parseInt(char.level) || 1) - (parseInt(char.hitDiceUsed) || 0);
        return { ok: true, log: `${char.name} 完成短休${restored.length ? `，恢复：${restored.join('、')}` : ''}；可用 .hd 花费生命骰回复生命（剩余 ${left} 枚）`, rollback };
    };

    // —— 施法 ——
    // 骰子表达式乘以倍数，用于戏法随等级增强："1d10" × 2 → "2d10"
    const scaleDice = (expr, times) => expr.replace(/(\d*)d(\d+)/g, (m, n, d) => `${(parseInt(n) || 1) * times}d${d}`);
    const findSpell = (char, name) => Object.values(D.spellBook(char.edition)).find(s => s.name === name || s.id === name || s.name.split('/').includes(name));

    // .cast 法术名 [N环] [仪式] [@目标]：消耗法术位、处理专注，并结算攻击、豁免、治疗等
    // 返回检定卡片，changes = [{ char, log, rollback }] 记录对施法者和目标的改动
    const castSpell = (char, text, party = []) => {
        const m = String(text || '').trim().match(/^[.。]cast\s*(\S+)(.*)$/i);
        if (!m || !char) return null;
        const spell = findSpell(char, m[1]); const rest = m[2] || '';
        const card = (level, extra = '', roll = '-') => ({ label: `施放 ${spell?.name || m[1]}`, roll, level, success: null, extra });
        if (!spell) return card('没有这个法术');
        if (char.raging) return card('狂暴中无法施法');
        if (D.armorIssue(char)) return card(`穿着不熟练的护甲无法施法（${D.armorIssue(char)}）`);

        // 施法职业：法术表里有这个法术的职业（兼职时取第一个），决定施法属性
        const castClass = D.spellCastingClass(char, spell);
        const cls = D.CLASSES[castClass]; const level = parseInt(char.level) || 1;
        const ritual = spell.ritual && /仪式|ritual/i.test(rest);
        const slots = D.spellSlots(char);
        const rollback = snapshot(char, ['slotsUsed', 'concentration', 'tempHp', 'mageArmor', 'resourcesUsed']);
        const notes = []; let slotLevel = spell.level;
        if (![...(char.spellIds || []), ...D.alwaysPreparedSpells(char)].includes(spell.id)) notes.push('不在已准备的法术中');

        if (spell.level > 0 && !ritual) {
            if (castClass === 'warlock' && spell.level >= 6) {
                const arcanum = D.classResources(char).find(r => r.id === 'arcanum');
                if (!arcanum?.left) return card('秘法玄奥已用完，需长休恢复');
                char.resourcesUsed = { ...(char.resourcesUsed || {}), arcanum: arcanum.used + 1 };
                notes.push('使用秘法玄奥');
            } else {
                // 契约法术位固定环阶；邪术师法术优先用契约位，其他法术优先用普通位，没有时可以互相借用
                const wanted = parseInt(rest.match(/(\d)\s*环/)?.[1]) || spell.level;
                const left = (key) => (slots[key] || 0) - (parseInt(char.slotsUsed?.[key]) || 0);
                const pactKey = Object.keys(slots).find(k => k.startsWith('p') && D.slotLevel(k) >= spell.level && left(k) > 0);
                const normalKey = Object.keys(slots).filter(k => !k.startsWith('p') && +k >= Math.max(spell.level, wanted) && left(k) > 0).sort((a, b) => a - b)[0];
                const key = castClass === 'warlock' ? pactKey || normalKey : normalKey || pactKey;
                if (!key) return card(`没有可用的 ${Math.max(spell.level, wanted)} 环或更高的法术位`);
                slotLevel = D.slotLevel(key);
                char.slotsUsed = { ...(char.slotsUsed || {}), [key]: (parseInt(char.slotsUsed?.[key]) || 0) + 1 };
                notes.push(`消耗${D.slotLabel(key)}法术位（剩余 ${left(key)}/${slots[key]}）`);
            }
        }
        if (ritual) notes.push('仪式施法，不消耗法术位，施法时间 +10 分钟');
        if (spell.concentration) {
            if (char.concentration && char.concentration !== spell.name) notes.push(`结束对「${char.concentration}」的专注`);
            char.concentration = spell.name; notes.push('开始专注');
        }
        if (spell.id === 'mageArmor' && !/@/.test(rest)) char.mageArmor = true;

        // 升环加骰与戏法增强
        const extraLevels = Math.max(0, slotLevel - spell.level);
        const upTimes = spell.upcast && spell.upcast !== 'r' ? Math.floor(extraLevels / (spell.upcastEvery || 1)) : 0;
        const tier = level >= 17 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
        const mod = D.abilityMod(char.abilities?.[cls?.spellAbility]);
        const withUpcast = (dice) => [dice, ...Array(upTimes).fill(spell.upcast)].join('+').replace(/m/g, String(mod));
        const scaled = (dice) => withUpcast(spell.level === 0 ? scaleDice(dice, tier) : dice);
        // 塑能学派 10 级强化塑能：法师的塑能法术伤害加智力调整值（一次）
        // 2024 牧师受祝打击、德鲁伊元素之怒选了强效施法：本职业戏法伤害加感知
        const potent = spell.level === 0 && ((castClass === 'cleric' && D.chose(char, 'blessedStrikes', 'potentSpellcasting')) || (castClass === 'druid' && D.chose(char, 'elementalFury', 'potentSpellcasting'))) ? Math.max(0, D.abilityMod(char.abilities?.WIS)) : 0;
        // 苦痛冲击：魔能爆每道光束加魅力
        const agonizing = spell.id === 'eldritchBlast' && D.chose(char, 'invocations', 'agonizingBlast') ? Math.max(0, D.abilityMod(char.abilities?.CHA)) : 0;
        const empowered = castClass === 'wizard' && spell.school === '塑能' && (D.subclassEntry(char, '塑能学派')?.level || 0) >= 10 ? Math.max(0, D.abilityMod(char.abilities?.INT)) : 0;
        const dmgRoll = (dice) => D.rollDice(scaled(dice)).total + empowered + potent;

        const details = []; let main = '-';
        const changes = [];
        if (spell.attack) {
            const a = spell.attack;
            const rays = a.rays === 'cantrip' ? tier : (a.rays || 1) + (spell.upcast === 'r' ? extraLevels : 0);
            const dice = a.rays === 'cantrip' ? withUpcast(a.dice) : scaled(a.dice);
            const mods = rollModifiers(char, { kind: 'attack' });
            for (let i = 0; i < rays; i++) {
                const t = D.d20Test({ mod: D.spellAttack(char, castClass) + mods.penalty, adv: mods.adv.length > 0, dis: mods.dis.length > 0, lucky: D.isLucky(char) });
                const dmg = D.rollDice(t.crit ? critDamage(dice) : dice).total + (i === 0 ? empowered + potent : 0) + agonizing;
                if (i === 0) main = t.total;
                details.push(`${rays > 1 ? `第${i + 1}道 ` : ''}攻击 ${t.total}（d20=${t.roll}${t.mode !== 'normal' ? ` ${t.mode === 'adv' ? '优势' : '劣势'}` : ''}）${t.crit ? ' 重击' : t.fumble ? ' 大失手' : ''}，命中则 ${dmg} ${a.type}`);
            }
        }
        if (spell.save) {
            const sv = spell.save;
            const dmg = dmgRoll(sv.dice); main = dmg;
            details.push(`${D.ABILITIES[sv.ability]}豁免 DC ${D.spellSaveDc(char, castClass)}，失败受 ${dmg} ${sv.type} 伤害${sv.half ? '，成功减半' : ''}`);
        }
        if (spell.damage) { const dmg = dmgRoll(spell.damage.dice); main = dmg; details.push(`造成 ${dmg} ${spell.damage.type} 伤害`); }
        if (spell.temp) {
            const amount = D.rollDice(scaled(spell.temp)).total; main = amount;
            char.tempHp = Math.max(parseInt(char.tempHp) || 0, amount); details.push(`获得 ${amount} 点临时生命`);
        }
        if (spell.heal) {
            // 生命领域：1 环以上治疗法术多回复 2 + 法术环阶；17 级至高治疗时治疗骰取最大值
            const life = D.subclassEntry(char, '生命领域');
            const amount = (life?.level >= 17 ? maxDice(scaled(spell.heal)) : D.rollDice(scaled(spell.heal)).total) + (life && spell.level > 0 ? 2 + slotLevel : 0); main = amount;
            const targetName = rest.match(/@(\S+)/)?.[1];
            const target = targetName ? party.find(p => p.name === targetName || p.name?.includes(targetName)) : char;
            if (target) {
                const r = changeHp(target, `+${amount}`);
                if (r.ok) changes.push({ char: target, log: r.log, rollback: r.rollback });
            } else details.push(`回复 ${amount} 点生命（未找到 ${targetName}，请手动结算）`);
        }
        const header = `${spell.level ? `${slotLevel || spell.level}环` : '戏法'} · ${spell.time} · ${spell.range}`;
        changes.unshift({ char, log: `${char.name} 施放${spell.name}：${notes.join('，') || '无消耗'}`, rollback });
        return { label: `施放 ${spell.name}`, roll: main, level: '', success: null, extra: [header, ...details].join(' · '), changes };
    };

    // —— 战斗 ——
    // state: { active, round, turn, order: [{ name, pc, index?, init, hp?, maxHp?, ac, monster?, xp? }] }
    const combat = {
        create: () => ({ active: false, round: 0, turn: 0, order: [] }),
        sort(state) {
            const current = state.order[state.turn];
            state.order.sort((a, b) => b.init - a.init);
            if (current) state.turn = state.order.indexOf(current);
        },
        start(state, chars) {
            Object.assign(state, { active: true, round: 1, turn: 0 });
            state.order = chars.map(({ char, index }) => {
                const mods = rollModifiers(char, { kind: 'init', ability: 'DEX' });
                const init = D.d20Test({ mod: D.initiativeMod(char) + mods.penalty, adv: mods.adv.length > 0, dis: mods.dis.length > 0, lucky: D.isLucky(char) }).total;
                return { name: char.name, pc: true, index, init, ac: D.armorClass(char) };
            });
            state.order.push(...state.pending || []); delete state.pending;
            state.order.sort((a, b) => b.init - a.init);
        },
        // 怪物库里有的生物，没写的数值自动补上；edition 决定用哪版数据
        add(state, { name, hp, ac, init, xp }, edition) {
            const lib = D.findMonster?.(name, edition);
            const val = (v, fallback) => (v != null && v !== '' ? parseInt(v) || 0 : fallback);
            const maxHp = val(hp, lib?.hp) || 1;
            const entry = { name, pc: false, hp: maxHp, maxHp, ac: val(ac, lib?.ac) || 10, init: D.d20Test({ mod: val(init, lib?.init) || 0 }).total, monster: lib?.id, edition, xp: val(xp, lib?.xp) || 0 };
            if (!state.active) { (state.pending ||= []).push(entry); return entry; }
            state.order.push(entry); combat.sort(state);
            return entry;
        },
        damage(state, name, amount) {
            const m = state.order.find(e => !e.pc && e.name === name);
            if (!m) return null;
            m.hp = Math.max(0, Math.min(m.maxHp, m.hp - amount));
            return m;
        },
        // 轮到下一位，跳过已倒下的怪物
        next(state) {
            if (!state.order.length) return;
            for (let i = 0; i < state.order.length; i++) {
                state.turn += 1;
                if (state.turn >= state.order.length) { state.turn = 0; state.round += 1; }
                const e = state.order[state.turn];
                if (e.pc || e.hp > 0) break;
            }
        },
        // 结束战斗：被击倒怪物的经验平均分给参战角色。返回 { log, changes }
        end(state, chars = []) {
            const total = state.order.filter(e => !e.pc && e.hp === 0).reduce((sum, e) => sum + (e.xp || 0), 0);
            Object.assign(state, combat.create());
            const each = chars.length ? Math.floor(total / chars.length) : 0;
            const changes = each ? chars.map(({ char, index }) => {
                const r = applyStat(char, 'xp', `+${each}`);
                const up = D.levelFromXp(char.xp) > char.level ? `，可以升到 ${D.levelFromXp(char.xp)} 级` : '';
                return { char, index, log: r.log + up, rollback: r.rollback };
            }) : [];
            return { log: `🏳️ 战斗结束${total ? `，击败敌人共 ${total} 经验${each ? `，每人 +${each}` : ''}` : ''}`, changes };
        },
    };

    // 解析 DM 回复中的战斗指令，按出现顺序执行。chars: [{ char, index }] 参战的玩家角色
    const COMBAT_RE = /[.。](combat)\s+(start|end|开始|结束)|[.。](monster)\s+(\S+)((?:\s+(?:hp|ac|init|xp)=[+-]?\d+)*)|[.。](dmg|heal)\s+(\S+)\s+(\S+)|[.。](next)\b/gi;
    // 返回 { logs, changes }，changes 是结算经验时对角色的改动（可撤回）
    const runCombatCommands = (state, content, chars) => {
        const logs = []; const changes = [];
        for (const m of String(content || '').matchAll(COMBAT_RE)) {
            if (m[1]) {
                if (/start|开始/i.test(m[2])) { combat.start(state, chars); logs.push(`⚔️ 战斗开始！先攻顺序：${state.order.map(e => `${e.name}(${e.init})`).join(' → ')}`); }
                else { const r = combat.end(state, chars); logs.push(r.log); changes.push(...r.changes); }
            } else if (m[3]) {
                const spec = Object.fromEntries([...m[5].matchAll(/(hp|ac|init|xp)=([+-]?\d+)/gi)].map(x => [x[1].toLowerCase(), x[2]]));
                // 怪物数据跟着参战角色的规则版本走
                const e = combat.add(state, { name: m[4], ...spec }, chars[0]?.char.edition);
                const cr = e.monster ? `，CR ${D.monsterBook(e.edition)[e.monster].cr}` : '';
                logs.push(`👹 ${e.name} 加入战斗（AC ${e.ac}，生命 ${e.hp}${cr}${state.active ? `，先攻 ${e.init}` : ''}）`);
            } else if (m[6]) {
                const r = D.rollDice(m[8]);
                const e = r && combat.damage(state, m[7], m[6].toLowerCase() === 'heal' ? -r.total : r.total);
                if (e) logs.push(`${m[6].toLowerCase() === 'heal' ? '💚' : '💥'} ${e.name} ${m[6].toLowerCase() === 'heal' ? '回复' : '受到'} ${r.total} 点，剩余 ${e.hp}/${e.maxHp}${e.hp === 0 ? '，倒下了' : ''}`);
            } else if (m[9] && state.active) {
                combat.next(state);
                logs.push(`➡️ 第 ${state.round} 轮，轮到 ${state.order[state.turn]?.name}`);
            }
        }
        return { logs, changes };
    };

    // 已准备法术按环阶列出：戏法 火焰箭、法师之手；1环 魔法飞弹
    const spellList = (char) => {
        const groups = {};
        [...new Set([...(char.spellIds || []), ...D.alwaysPreparedSpells(char)])].map(id => D.spellBook(char.edition)[id]).filter(Boolean).forEach(sp => (groups[sp.level] ||= []).push(sp.name + (sp.concentration ? '(专注)' : '')));
        return Object.keys(groups).sort((a, b) => a - b).map(lv => `${+lv ? `${lv}环` : '戏法'} ${groups[lv].join('、')}`).join('；');
    };

    // .conflict 物品名：智能物品与持有者冲突，物品的魅力检定对抗持有者的魅力检定
    const itemConflict = (char, text) => {
        const m = String(text || '').trim().match(/^[.。](?:conflict|冲突)\s*(.*)$/i);
        if (!m || !char) return null;
        const q = m[1].trim(); const item = (char.items || []).find(i => i.sentient && (!q || i.name === q || i.name.includes(q)));
        if (!item) return { label: '智能物品冲突', roll: '-', level: '没有找到智能物品', success: null };
        const it = D.d20Test({ mod: D.sentientCheckMod(item) });
        const me = D.d20Test({ mod: D.abilityMod(char.abilities?.CHA) + D.halfProficiency(char, 'CHA', 'ability'), lucky: D.isLucky(char) });
        const level = me.total > it.total ? '持有者占上风' : me.total === it.total ? '平手，维持现状' : '物品胜出，会提出要求';
        return { label: `与「${item.name}」的意志冲突`, roll: me.total, target: it.total, level, success: me.total > it.total ? true : me.total < it.total ? false : null,
            extra: `你 d20=${me.roll} ${D.signed(me.mod)} = ${me.total}；物品 d20=${it.roll} ${D.signed(it.mod)} = ${it.total}` };
    };

    // 物品栏摘要：装备中、同调、背包、钱、负重、智能物品
    const inventoryText = (char) => {
        const items = char.items || [];
        const desc = (i) => `${i.name}${(parseInt(i.qty) || 1) > 1 ? `×${i.qty}` : ''}${i.attuned ? '(已同调)' : i.attune ? '(未同调)' : ''}`;
        const eq = items.filter(i => i.equipped).map(desc); const bag = items.filter(i => !i.equipped).map(desc);
        const coins = [['pp', '白金'], ['gp', '金'], ['ep', '银金'], ['sp', '银'], ['cp', '铜']].map(([k, n]) => [n, k === 'gp' ? char.gold : char.coins?.[k]]).filter(([, v]) => parseInt(v)).map(([n, v]) => `${n}${v}`).join(' ');
        const load = D.encumbrance(char);
        const sentient = items.filter(i => i.sentient).map(i => `${i.name}（智力${i.sentient.int} 感知${i.sentient.wis} 魅力${i.sentient.cha}，${i.sentient.alignment}，${i.sentient.communication}，${i.sentient.senses}，目标：${i.sentient.purpose}${i.sentient.personality ? `，性格：${i.sentient.personality}` : ''}）`);
        return [
            eq.length && `装备中：${eq.join('、')}`,
            bag.length && `背包：${bag.slice(0, 40).join('、')}${bag.length > 40 ? ` 等 ${bag.length} 件` : ''}`,
            (coins || char.inventory) && `${coins ? `钱：${coins}` : ''}${char.inventory ? `${coins ? ' | ' : ''}其他：${char.inventory}` : ''}`,
            `负重 ${load.weight}/${load.capacity} 磅${load.status !== 'ok' ? `（${D.ENCUMBRANCE_TEXT[load.status]}）` : ''}`,
            sentient.length && `智能物品：${sentient.join('；')}。冲突时让玩家用 .conflict 物品名 掷对抗`,
        ].filter(Boolean).join('\n');
    };

    // 职业、物种、专长上的选择（武器专精、魔能祈唤、超魔等）
    const choiceText = (char) => (D.choiceDefs ? D.choiceDefs(char) : []).map(d => {
        const names = D.choicePicks(char, d.id).map(v => d.options.find(o => o.id === v)?.name || v);
        return names.length ? `${d.label}：${names.join('、')}` : '';
    }).filter(Boolean).join('；');

    // 发给 AI 的角色资料
    const profile = (char) => {
        const race = D.raceOf(char); const sub = D.subraceOf(char); const bg = D.backgroundOf(char); const ed = D.edition(char.edition);
        const abilities = Object.entries(D.ABILITIES).map(([k, v]) => `${v}${char.abilities?.[k]}(${D.signed(D.abilityMod(char.abilities?.[k]))})`).join(' ');
        const skills = (char.skillProfs || []).map(id => `${D.SKILLS[id]?.name}${D.signed(D.skillMod(char, id))}${char.expertise?.includes(id) ? '(专精)' : ''}`).join('、');
        const slots = Object.entries(D.spellSlots(char)).map(([lv, n]) => `${D.slotLabel(lv)} ${n - (parseInt(char.slotsUsed?.[lv]) || 0)}/${n}`).join(' ');
        const subclasses = D.classEntries(char).filter(e => e.subclass).map(e => e.subclass).join('、');
        const weapons = (char.weapons || []).map(id => D.weaponAttack(char, id)).filter(Boolean).map(w => `${w.name}(命中${D.signed(w.toHit)}, ${w.damage}${w.type}${w.range ? `, 射程${w.range}` : ''}${w.mastery ? `, 专精:${w.mastery}` : ''}${w.magicExtra ? `, 额外${w.magicExtra}` : ''}${w.greatWeapon ? ', 巨武器战斗' : ''}${w.proficient ? '' : ', 未熟练'})`).join('、');
        const feats = D.characterFeats(char).map(id => D.FEATS[id]?.name).filter(Boolean);
        const style = D.FIGHTING_STYLES[char.fightingStyle];
        const features = D.classFeatures(char).filter(f => f.name !== '选择子职业' && f.name !== '属性值提升').map(f => f.name).join('、');
        const resources = D.classResources(char).map(r => `${r.name} ${r.max === 99 ? '不限' : `${r.left}/${r.max}`}（${r.recharge === 'short' ? '短休' : '长休'}恢复）`).join('、');
        const crit = D.critRange(char); const sneak = D.sneakAttackDice(char);
        const status = [
            ...(char.conditions || []), char.exhaustion ? `力竭${char.exhaustion}级${char.edition === '2014' && char.exhaustion >= 4 ? '(生命上限减半)' : ''}` : '',
            char.raging ? `狂暴中(力量近战伤害+${D.rageDamage(char)}，抵抗钝击/穿刺/挥砍伤害)` : '', char.concentration ? `专注:${char.concentration}` : '',
            char.dead ? '已死亡' : (parseInt(char.hp) || 0) === 0 ? `濒死(死亡豁免 成功${char.deathSaves?.success || 0}/失败${char.deathSaves?.fail || 0})` : '',
        ].filter(Boolean).join('、');
        const story = Object.values(char.backstory || {}).filter(Boolean).join(' / ');
        const pool = D.hitDicePool(char); const hdLeft = pool.length - (parseInt(char.hitDiceUsed) || 0);
        return [
            `姓名：${char.name} | ${ed.name}`,
            `${sub?.name || race?.name || '未知种族'} ${D.classSummary(char) || '未知职业'}${subclasses ? `（${subclasses}）` : ''} | 总等级 ${char.level} | 背景：${bg?.name || '无'} | 阵营：${char.alignment || '未定'}`,
            `属性：${abilities}`,
            `生命 ${char.hp}/${char.maxHp}${char.tempHp ? ` +临时${char.tempHp}` : ''} | AC ${D.armorClass(char)} | 速度 ${D.speed(char)} 尺 | 熟练加值 ${D.signed(D.profBonus(char.level))} | 被动察觉 ${D.passivePerception(char)} | 生命骰 ${hdLeft}/${pool.length} (${D.hitDiceText(pool) || '?'})`,
            `豁免熟练：${Object.keys(D.ABILITIES).filter(a => D.saveProficient(char, a)).map(a => D.ABILITIES[a]).join('、') || '无'}${D.auraOfProtection(char) ? `（守护灵光：所有豁免 +${D.auraOfProtection(char)}，10 尺内盟友同享）` : ''} | 技能熟练：${skills || '无'}`,
            weapons && `武器：${weapons}${crit < 20 ? ` | 暴击范围 ${crit}-20` : ''}${sneak ? ` | 偷袭 ${sneak}d6` : ''}`,
            features && `职业能力：${features}`,
            resources && `职业资源：${resources}`,
            (feats.length || style) && `专长：${feats.join('、') || '无'}${style ? ` | 战斗风格：${style.name}（${style.desc}）` : ''}`,
            slots && `法术位：${slots} | ${D.casterSummary(char)}`,
            spellList(char) && `已准备法术：${spellList(char)}`,
            char.spells && `法术备注：${char.spells}`,
            char.features && `专长与其他：${char.features}`,
            status && `当前状态：${status}`,
            inventoryText(char),
            choiceText(char),
            (char.languages || char.tools) && `语言：${char.languages || '未填'} | 工具：${char.tools || '未填'}`,
            D.armorIssue(char) && `护甲（${D.armorIssue(char)}）：力量、敏捷的检定、豁免和攻击具有劣势，不能施法`,
            story && `背景故事：${story}`,
        ].filter(Boolean).join('\n');
    };

    Object.assign(D, { rollCheck, rollExpr, castSpell, itemConflict, inventoryText, spellList, applyStat, undoStat, useResource, spendHitDice, rest, combat, runCombatCommands, profile });
})(typeof window !== 'undefined' ? window : globalThis);
