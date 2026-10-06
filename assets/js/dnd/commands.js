// 跑团指令：检定、掷骰、状态变更、资源、休息、战斗，以及发给 AI 的角色资料。依赖 rules.js。
// 检定结果格式 { label, roll, target, level, success, extra, change? }，与聊天界面的骰子卡片一致；
// change = { log, rollback } 表示这次掷骰改动了角色（如死亡豁免），由调用方记录以便撤销。
(function (root) {
    const D = root.DND;
    const ABILITY_BY_NAME = Object.fromEntries(Object.entries(D.ABILITIES).flatMap(([k, v]) => [[k, k], [k.toLowerCase(), k], [v, k]]));
    const SKILL_BY_NAME = Object.fromEntries(Object.entries(D.SKILLS).flatMap(([id, s]) => [[id, id], [s.name, id]]));

    const findWeapon = (char, name) => (char.weapons || []).find(id => id === name || D.WEAPONS[id]?.name === name);
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
        if (ABILITY_BY_NAME[t]) { const ab = ABILITY_BY_NAME[t]; return { kind: 'ability', ability: ab, label: `${D.ABILITIES[ab]}检定`, mod: D.abilityMod(char.abilities?.[ab]) }; }
        if (SKILL_BY_NAME[t]) { const id = SKILL_BY_NAME[t]; return { kind: 'skill', ability: D.SKILLS[id].ability, label: `${D.SKILLS[id].name}检定`, mod: D.skillMod(char, id) }; }
        const weaponId = findWeapon(char, t);
        if (weaponId) { const w = D.weaponAttack(char, weaponId); return { kind: 'attack', ability: w.usesStr ? 'STR' : 'DEX', label: `${w.name}攻击`, mod: w.toHit, weapon: w }; }
        return null;
    };

    // 角色状态带来的优势、劣势、减值和自动失败
    const rollModifiers = (char, info) => {
        const conds = char.conditions || []; const has = (c) => conds.includes(c);
        const isCheck = ['ability', 'skill', 'init'].includes(info.kind); const isAttack = info.kind === 'attack'; const isSave = info.kind === 'save' || info.kind === 'death';
        const adv = []; const dis = []; let penalty = 0; let autoFail = '';
        const level = parseInt(char.level) || 1; const ex = parseInt(char.exhaustion) || 0;
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
        if (char.classId === 'barbarian' && info.kind === 'save' && info.ability === 'DEX' && level >= 2 && !['目盲', '耳聋', '失能'].some(has)) adv.push('危险感知');
        if (char.classId === 'barbarian' && info.kind === 'init' && level >= 7) adv.push('野性直觉');
        if (info.kind === 'death' && char.edition === '2024' && char.subclass === '勇士' && level >= 18) adv.push('幸存者');
        return { adv, dis, penalty, autoFail };
    };

    // 死亡豁免：只在生命为 0 且未死亡时计数
    const applyDeathSave = (char, roll) => {
        if ((parseInt(char.hp) || 0) > 0 || char.dead) return null;
        const rollback = snapshot(char, ['hp', 'deathSaves', 'conditions', 'dead']);
        const ds = { success: 0, fail: 0, ...(char.deathSaves || {}) };
        const natTwenty = roll === 20 || (char.edition === '2024' && char.subclass === '勇士' && (parseInt(char.level) || 1) >= 18 && roll >= 18);
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
        const t = D.d20Test({ mod, adv: mods.adv.length > 0, dis: mods.dis.length > 0, dc });
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
        if (reasons.length) extra += ` · ${reasons.join(' ')}`;
        if (info.kind === 'attack') {
            const w = info.weapon;
            // 投掷武器扔出去算远程攻击，不加狂暴伤害
            const thrown = /投掷|\bthrow/i.test(rest);
            const rage = char.raging && w.melee && w.usesStr && !thrown ? D.rageDamage(char) : 0;
            if (thrown) extra += ' · 投掷';
            const dmgExpr = `${level === '重击' ? critDamage(w.damage) : w.damage}${rage ? `+${rage}` : ''}`;
            extra += ` · 伤害 ${D.rollDice(dmgExpr).total} ${w.type}${rage ? `（含狂暴 +${rage}）` : ''}`;
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
    const applyStat = (char, prop, expr) => {
        if (!char || !prop || !expr) return { ok: false };
        const p = String(prop).trim(); const e = String(expr).trim();
        const ending = /^(-|结束|end|无)$/i.test(e);

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
            const lv = slot[1]; const max = D.spellSlots(char)[lv] || 0;
            if (!max) return { ok: false };
            char.slotsUsed = char.slotsUsed || {};
            const current = parseInt(char.slotsUsed[lv]) || 0;
            const next = Math.max(0, Math.min(max, evalChange(current, e) ?? current));
            const old = { ...char.slotsUsed }; char.slotsUsed[lv] = next;
            // 指令按“已用数量”计，日志显示剩余数量更直观
            return { ok: true, log: `${char.name} 的${lv}环法术位：${max - current} ➔ ${max - next}`, rollback: { slotsUsed: old } };
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
            const heal = D.rollDice(`1d10+${parseInt(char.level) || 1}`).total;
            const before = parseInt(char.hp) || 0; char.hp = Math.min(char.maxHp || Infinity, before + heal);
            if (before === 0) { char.deathSaves = { success: 0, fail: 0 }; removeCondition(char, '昏迷'); }
            log += `，回复 ${heal} 点生命（${before} ➔ ${char.hp}）`;
        }
        return { ok: true, log, rollback };
    };

    // .hd 数量：短休时花费生命骰回复生命（每枚 = 生命骰 + 体质调整值，最少 0）
    const spendHitDice = (char, amount) => {
        const die = D.classInfo(char)?.hitDie; if (!die) return { ok: false };
        const available = (parseInt(char.level) || 1) - (parseInt(char.hitDiceUsed) || 0);
        const n = Math.min(available, Math.max(1, parseInt(amount) || 1));
        if (n <= 0 || char.dead) return { ok: true, log: `${char.name} 没有可用的生命骰`, rollback: null };
        const rollback = snapshot(char, ['hp', 'hitDiceUsed', 'deathSaves', 'conditions']);
        const con = D.abilityMod(char.abilities?.CON);
        const rolls = Array.from({ length: n }, () => Math.max(0, D.rollDice(`1d${die}`).total + con));
        const heal = rolls.reduce((a, b) => a + b, 0);
        const before = parseInt(char.hp) || 0;
        char.hp = Math.min(char.maxHp || Infinity, before + heal);
        char.hitDiceUsed = (parseInt(char.hitDiceUsed) || 0) + n;
        if (before === 0 && char.hp > 0) { char.deathSaves = { success: 0, fail: 0 }; removeCondition(char, '昏迷'); }
        return { ok: true, log: `${char.name} 花费 ${n} 枚生命骰（d${die}${D.signed(con)}：${rolls.join('+')}），回复 ${heal} 点生命（${before} ➔ ${char.hp}，剩余生命骰 ${available - n}）`, rollback };
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
        if (D.classInfo(char)?.caster === 'pact') { char.slotsUsed = {}; restored.push('契约法术位'); }
        const left = (parseInt(char.level) || 1) - (parseInt(char.hitDiceUsed) || 0);
        return { ok: true, log: `${char.name} 完成短休${restored.length ? `，恢复：${restored.join('、')}` : ''}；可用 .hd 花费生命骰回复生命（剩余 ${left} 枚）`, rollback };
    };

    // —— 施法 ——
    // 骰子表达式乘以倍数，用于戏法随等级增强："1d10" × 2 → "2d10"
    const scaleDice = (expr, times) => expr.replace(/(\d*)d(\d+)/g, (m, n, d) => `${(parseInt(n) || 1) * times}d${d}`);
    const findSpell = (name) => Object.values(D.SPELLS || {}).find(s => s.name === name || s.id === name || s.name.split('/').includes(name));

    // .cast 法术名 [N环] [仪式] [@目标]：消耗法术位、处理专注，并结算攻击、豁免、治疗等
    // 返回检定卡片，changes = [{ char, log, rollback }] 记录对施法者和目标的改动
    const castSpell = (char, text, party = []) => {
        const m = String(text || '').trim().match(/^[.。]cast\s*(\S+)(.*)$/i);
        if (!m || !char) return null;
        const spell = findSpell(m[1]); const rest = m[2] || '';
        const card = (level, extra = '', roll = '-') => ({ label: `施放 ${spell?.name || m[1]}`, roll, level, success: null, extra });
        if (!spell) return card('没有这个法术');
        if (char.raging) return card('狂暴中无法施法');

        const cls = D.classInfo(char); const level = parseInt(char.level) || 1;
        const ritual = spell.ritual && /仪式|ritual/i.test(rest);
        const slots = D.spellSlots(char);
        const rollback = snapshot(char, ['slotsUsed', 'concentration', 'tempHp', 'mageArmor', 'resourcesUsed']);
        const notes = []; let slotLevel = spell.level;
        if (!(char.spellIds || []).includes(spell.id)) notes.push('不在已准备的法术中');

        if (spell.level > 0 && !ritual) {
            if (cls?.caster === 'pact' && spell.level >= 6) {
                const arcanum = D.classResources(char).find(r => r.id === 'arcanum');
                if (!arcanum?.left) return card('秘法玄奥已用完，需长休恢复');
                char.resourcesUsed = { ...(char.resourcesUsed || {}), arcanum: arcanum.used + 1 };
                notes.push('使用秘法玄奥');
            } else {
                const wanted = parseInt(rest.match(/(\d)\s*环/)?.[1]) || spell.level;
                slotLevel = cls?.caster === 'pact' ? Math.max(0, ...Object.keys(slots).map(Number)) : Math.max(spell.level, wanted);
                const max = slots[slotLevel] || 0; const used = parseInt(char.slotsUsed?.[slotLevel]) || 0;
                if (slotLevel < spell.level || used >= max) return card(`没有可用的 ${Math.max(slotLevel, spell.level)} 环法术位`);
                char.slotsUsed = { ...(char.slotsUsed || {}), [slotLevel]: used + 1 };
                notes.push(`消耗 ${slotLevel} 环法术位（剩余 ${max - used - 1}/${max}）`);
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

        const details = []; let main = '-';
        const changes = [];
        if (spell.attack) {
            const a = spell.attack;
            const rays = a.rays === 'cantrip' ? tier : (a.rays || 1) + (spell.upcast === 'r' ? extraLevels : 0);
            const dice = a.rays === 'cantrip' ? withUpcast(a.dice) : scaled(a.dice);
            const mods = rollModifiers(char, { kind: 'attack' });
            for (let i = 0; i < rays; i++) {
                const t = D.d20Test({ mod: D.spellAttack(char) + mods.penalty, adv: mods.adv.length > 0, dis: mods.dis.length > 0 });
                const dmg = D.rollDice(t.crit ? critDamage(dice) : dice).total;
                if (i === 0) main = t.total;
                details.push(`${rays > 1 ? `第${i + 1}道 ` : ''}攻击 ${t.total}（d20=${t.roll}${t.mode !== 'normal' ? ` ${t.mode === 'adv' ? '优势' : '劣势'}` : ''}）${t.crit ? ' 重击' : t.fumble ? ' 大失手' : ''}，命中则 ${dmg} ${a.type}`);
            }
        }
        if (spell.save) {
            const sv = spell.save;
            const dmg = D.rollDice(scaled(sv.dice)).total; main = dmg;
            details.push(`${D.ABILITIES[sv.ability]}豁免 DC ${D.spellSaveDc(char)}，失败受 ${dmg} ${sv.type} 伤害${sv.half ? '，成功减半' : ''}`);
        }
        if (spell.damage) { const dmg = D.rollDice(scaled(spell.damage.dice)).total; main = dmg; details.push(`造成 ${dmg} ${spell.damage.type} 伤害`); }
        if (spell.temp) {
            const amount = D.rollDice(scaled(spell.temp)).total; main = amount;
            char.tempHp = Math.max(parseInt(char.tempHp) || 0, amount); details.push(`获得 ${amount} 点临时生命`);
        }
        if (spell.heal) {
            const amount = D.rollDice(scaled(spell.heal)).total; main = amount;
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
    // state: { active, round, turn, order: [{ name, pc, index?, init, hp?, maxHp?, ac }] }
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
                const init = D.d20Test({ mod: D.initiativeMod(char) + mods.penalty, adv: mods.adv.length > 0, dis: mods.dis.length > 0 }).total;
                return { name: char.name, pc: true, index, init, ac: D.armorClass(char) };
            });
            state.order.push(...state.pending || []); delete state.pending;
            state.order.sort((a, b) => b.init - a.init);
        },
        add(state, { name, hp, ac, init }) {
            const entry = { name, pc: false, hp: parseInt(hp) || 1, maxHp: parseInt(hp) || 1, ac: parseInt(ac) || 10, init: D.d20Test({ mod: parseInt(init) || 0 }).total };
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
        end(state) { Object.assign(state, combat.create()); },
    };

    // 解析 DM 回复中的战斗指令，按出现顺序执行。chars: [{ char, index }] 参战的玩家角色
    const COMBAT_RE = /[.。](combat)\s+(start|end|开始|结束)|[.。](monster)\s+(\S+)((?:\s+(?:hp|ac|init)=[+-]?\d+)*)|[.。](dmg|heal)\s+(\S+)\s+(\S+)|[.。](next)\b/gi;
    const runCombatCommands = (state, content, chars) => {
        const logs = [];
        for (const m of String(content || '').matchAll(COMBAT_RE)) {
            if (m[1]) {
                if (/start|开始/i.test(m[2])) { combat.start(state, chars); logs.push(`⚔️ 战斗开始！先攻顺序：${state.order.map(e => `${e.name}(${e.init})`).join(' → ')}`); }
                else { combat.end(state); logs.push('🏳️ 战斗结束'); }
            } else if (m[3]) {
                const spec = Object.fromEntries([...m[5].matchAll(/(hp|ac|init)=([+-]?\d+)/gi)].map(x => [x[1].toLowerCase(), x[2]]));
                const e = combat.add(state, { name: m[4], ...spec });
                logs.push(`👹 ${e.name} 加入战斗（AC ${e.ac}，生命 ${e.hp}${state.active ? `，先攻 ${e.init}` : ''}）`);
            } else if (m[6]) {
                const r = D.rollDice(m[8]);
                const e = r && combat.damage(state, m[7], m[6].toLowerCase() === 'heal' ? -r.total : r.total);
                if (e) logs.push(`${m[6].toLowerCase() === 'heal' ? '💚' : '💥'} ${e.name} ${m[6].toLowerCase() === 'heal' ? '回复' : '受到'} ${r.total} 点，剩余 ${e.hp}/${e.maxHp}${e.hp === 0 ? '，倒下了' : ''}`);
            } else if (m[9] && state.active) {
                combat.next(state);
                logs.push(`➡️ 第 ${state.round} 轮，轮到 ${state.order[state.turn]?.name}`);
            }
        }
        return logs;
    };

    // 已准备法术按环阶列出：戏法 火焰箭、法师之手；1环 魔法飞弹
    const spellList = (char) => {
        const groups = {};
        (char.spellIds || []).map(id => D.SPELLS?.[id]).filter(Boolean).forEach(sp => (groups[sp.level] ||= []).push(sp.name + (sp.concentration ? '(专注)' : '')));
        return Object.keys(groups).sort((a, b) => a - b).map(lv => `${+lv ? `${lv}环` : '戏法'} ${groups[lv].join('、')}`).join('；');
    };

    // 发给 AI 的角色资料
    const profile = (char) => {
        const cls = D.classInfo(char); const race = D.raceOf(char); const sub = D.subraceOf(char); const bg = D.backgroundOf(char); const ed = D.edition(char.edition);
        const abilities = Object.entries(D.ABILITIES).map(([k, v]) => `${v}${char.abilities?.[k]}(${D.signed(D.abilityMod(char.abilities?.[k]))})`).join(' ');
        const skills = (char.skillProfs || []).map(id => `${D.SKILLS[id]?.name}${D.signed(D.skillMod(char, id))}${char.expertise?.includes(id) ? '(专精)' : ''}`).join('、');
        const slots = Object.entries(D.spellSlots(char)).map(([lv, n]) => `${lv}环 ${n - (parseInt(char.slotsUsed?.[lv]) || 0)}/${n}`).join(' ');
        const weapons = (char.weapons || []).map(id => D.weaponAttack(char, id)).filter(Boolean).map(w => `${w.name}(命中${D.signed(w.toHit)}, ${w.damage}${w.type}${w.range ? `, 射程${w.range}` : ''}${w.mastery ? `, 专精:${w.mastery}` : ''}${w.proficient ? '' : ', 未熟练'})`).join('、');
        const features = D.classFeatures(char).filter(f => f.name !== '选择子职业' && f.name !== '属性值提升').map(f => f.name).join('、');
        const resources = D.classResources(char).map(r => `${r.name} ${r.max === 99 ? '不限' : `${r.left}/${r.max}`}（${r.recharge === 'short' ? '短休' : '长休'}恢复）`).join('、');
        const crit = D.critRange(char); const sneak = D.sneakAttackDice(char);
        const status = [
            ...(char.conditions || []), char.exhaustion ? `力竭${char.exhaustion}级` : '',
            char.raging ? `狂暴中(力量近战伤害+${D.rageDamage(char)}，抵抗钝击/穿刺/挥砍伤害)` : '', char.concentration ? `专注:${char.concentration}` : '',
            char.dead ? '已死亡' : (parseInt(char.hp) || 0) === 0 ? `濒死(死亡豁免 成功${char.deathSaves?.success || 0}/失败${char.deathSaves?.fail || 0})` : '',
        ].filter(Boolean).join('、');
        const story = Object.values(char.backstory || {}).filter(Boolean).join(' / ');
        const hdLeft = (parseInt(char.level) || 1) - (parseInt(char.hitDiceUsed) || 0);
        return [
            `姓名：${char.name} | ${ed.name}`,
            `${sub?.name || race?.name || '未知种族'} ${cls?.name || '未知职业'}${char.subclass ? `（${char.subclass}）` : ''} ${char.level} 级 | 背景：${bg?.name || '无'} | 阵营：${char.alignment || '未定'}`,
            `属性：${abilities}`,
            `生命 ${char.hp}/${char.maxHp}${char.tempHp ? ` +临时${char.tempHp}` : ''} | AC ${D.armorClass(char)} | 速度 ${race?.speed || 30} 尺 | 熟练加值 ${D.signed(D.profBonus(char.level))} | 被动察觉 ${D.passivePerception(char)} | 生命骰 ${hdLeft}/${char.level} (d${cls?.hitDie || '?'})`,
            `豁免熟练：${(cls?.saves || []).map(a => D.ABILITIES[a]).join('、') || '无'} | 技能熟练：${skills || '无'}`,
            weapons && `武器：${weapons}${crit < 20 ? ` | 暴击范围 ${crit}-20` : ''}${sneak ? ` | 偷袭 ${sneak}d6` : ''}`,
            features && `职业能力：${features}`,
            resources && `职业资源：${resources}`,
            slots && `法术位：${slots} | 法术豁免 DC ${D.spellSaveDc(char)}，法术攻击 ${D.signed(D.spellAttack(char))}`,
            spellList(char) && `已准备法术：${spellList(char)}`,
            char.spells && `法术备注：${char.spells}`,
            char.features && `专长与其他：${char.features}`,
            status && `当前状态：${status}`,
            char.inventory && `物品：${char.inventory}${char.gold ? ` | 金币 ${char.gold}` : ''}`,
            story && `背景故事：${story}`,
        ].filter(Boolean).join('\n');
    };

    Object.assign(D, { rollCheck, rollExpr, castSpell, spellList, applyStat, undoStat, useResource, spendHitDice, rest, combat, runCombatCommands, profile });
})(typeof window !== 'undefined' ? window : globalThis);
