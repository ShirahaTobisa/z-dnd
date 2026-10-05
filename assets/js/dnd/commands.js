// 跑团指令：检定、掷骰、状态变更、休息、战斗，以及发给 AI 的角色资料。依赖 rules.js。
// 检定结果格式 { label, roll, target, level, success, extra }，与聊天界面的骰子卡片一致。
(function (root) {
    const D = root.DND;
    const ABILITY_BY_NAME = Object.fromEntries(Object.entries(D.ABILITIES).flatMap(([k, v]) => [[k, k], [k.toLowerCase(), k], [v, k]]));
    const SKILL_BY_NAME = Object.fromEntries(Object.entries(D.SKILLS).flatMap(([id, s]) => [[id, id], [s.name, id]]));

    const findWeapon = (char, name) => (char.weapons || []).find(id => id === name || D.WEAPONS[id]?.name === name);
    const critDamage = (expr) => expr.replace(/(\d*)d(\d+)/g, (m, n, d) => `${(parseInt(n) || 1) * 2}d${d}`);

    // 检定目标：豁免 / 先攻 / 死亡豁免 / 属性 / 技能 / 武器攻击
    const resolveCheck = (char, target) => {
        const t = target.replace(/检定$/, '');
        if (t === '死亡豁免') return { kind: 'death', label: '死亡豁免', mod: 0 };
        const save = t.match(/^(.+?)豁免$/) || t.match(/^豁免(.+)$/);
        if (save && ABILITY_BY_NAME[save[1]]) { const ab = ABILITY_BY_NAME[save[1]]; return { kind: 'save', label: `${D.ABILITIES[ab]}豁免`, mod: D.saveMod(char, ab) }; }
        if (t === '先攻') return { kind: 'init', label: '先攻', mod: D.initiativeMod(char) };
        if (ABILITY_BY_NAME[t]) { const ab = ABILITY_BY_NAME[t]; return { kind: 'ability', label: `${D.ABILITIES[ab]}检定`, mod: D.abilityMod(char.abilities?.[ab]) }; }
        if (SKILL_BY_NAME[t]) { const id = SKILL_BY_NAME[t]; return { kind: 'skill', label: `${D.SKILLS[id].name}检定`, mod: D.skillMod(char, id) }; }
        const weaponId = findWeapon(char, t);
        if (weaponId) { const w = D.weaponAttack(char, weaponId); return { kind: 'attack', label: `${w.name}攻击`, mod: w.toHit, damage: w.damage, damageType: w.type }; }
        return null;
    };

    // .ra 名称 [优势|劣势] [dc15]
    const rollCheck = (char, text) => {
        const m = String(text || '').trim().match(/^[.。](?:ra|rc|check)\s*(.+)$/i);
        if (!m || !char) return null;
        // 第一个词是检定项目，后面可以跟优势/劣势/难度和玩家想说的话
        const [target, ...more] = m[1].trim().split(/\s+/);
        const rest = more.join(' ');
        const adv = /优势|\badv\b/i.test(rest); const dis = /劣势|\bdis\b/i.test(rest);
        const dc = parseInt(rest.match(/(?:dc|难度)\s*(\d+)/i)?.[1]) || null;
        const info = resolveCheck(char, target);
        if (!info) return { label: `${target} 检定`, roll: '-', level: '未找到该项', success: null };

        const t = D.d20Test({ mod: info.mod, adv, dis, dc });
        let level = ''; let success = t.success;
        if (info.kind === 'attack' && (t.crit || t.fumble)) { level = t.crit ? '重击' : '大失手'; success = t.crit; }
        if (info.kind === 'death') { success = t.roll >= 10; level = t.crit ? '恢复 1 点生命' : t.fumble ? '记两次失败' : success ? '成功' : '失败'; }
        if (!level && dc) level = success ? '成功' : '失败';

        let extra = `d20${t.mode === 'normal' ? '' : `（${t.mode === 'adv' ? '优势' : '劣势'} ${t.rolls.join('/')}）`}=${t.roll} ${D.signed(info.mod)}`;
        if (info.kind === 'attack') extra += ` · 伤害 ${D.rollDice(t.crit ? critDamage(info.damage) : info.damage).total} ${info.damageType}`;
        return { label: info.label, roll: t.total, target: dc, level, success: level ? success : null, extra };
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

    // 带符号表示增减，不带符号表示直接设为该值；支持骰子表达式
    const evalChange = (current, expr) => {
        const op = /^[+-]/.test(expr) ? expr[0] : '=';
        const r = D.rollDice(op === '=' ? expr : expr.slice(1));
        if (!r) return null;
        return op === '+' ? current + r.total : op === '-' ? current - r.total : r.total;
    };

    // 返回 { ok, log, rollback } ；rollback 用于撤销
    const applyStat = (char, prop, expr) => {
        if (!char || !prop || !expr) return { ok: false };
        const p = String(prop).trim(); const e = String(expr).trim();

        const key = STAT_KEYS[p] || STAT_KEYS[p.toLowerCase()];
        if (key === 'conditions') {
            const name = e.replace(/^[+-]/, '');
            if (!D.CONDITIONS.includes(name)) return { ok: false };
            const old = [...(char.conditions || [])];
            char.conditions = e.startsWith('-') ? old.filter(c => c !== name) : [...new Set([...old, name])];
            return { ok: true, log: `${char.name} 的状态：${old.join('、') || '无'} ➔ ${char.conditions.join('、') || '无'}`, rollback: { conditions: old } };
        }

        const slot = p.match(/^(?:法术位|slot)(\d)$/i);
        const ability = ABILITY_BY_NAME[p];
        let field; let current; let max = Infinity; let name;
        if (slot) {
            const lv = slot[1]; max = D.spellSlots(char)[lv] || 0;
            if (!max) return { ok: false };
            char.slotsUsed = char.slotsUsed || {};
            current = parseInt(char.slotsUsed[lv]) || 0; name = `${lv}环法术位`;
            const next = Math.max(0, Math.min(max, evalChange(current, e) ?? current));
            const old = { ...char.slotsUsed }; char.slotsUsed[lv] = next;
            // 指令按“已用数量”计，日志显示剩余数量更直观
            return { ok: true, log: `${char.name} 的${name}：${max - current} ➔ ${max - next}`, rollback: { slotsUsed: old } };
        }
        if (ability) {
            current = parseInt(char.abilities?.[ability]) || 10;
            const next = Math.max(1, Math.min(30, evalChange(current, e) ?? current));
            const old = { abilities: { ...char.abilities }, baseAbilities: { ...char.baseAbilities } };
            char.abilities[ability] = next;
            if (char.baseAbilities) char.baseAbilities[ability] = (parseInt(char.baseAbilities[ability]) || 0) + next - current;
            return { ok: true, log: `${char.name} 的${D.ABILITIES[ability]}：${current} ➔ ${next}`, rollback: old };
        }
        if (!key) return { ok: false };

        field = key; name = STAT_NAMES[key]; current = parseInt(char[field]) || 0;
        let next = evalChange(current, e);
        if (next == null) return { ok: false };
        const old = { [field]: char[field] };
        let note = '';
        if (field === 'hp') {
            max = char.maxHp || Infinity;
            // 受到伤害时先扣临时生命
            if (next < current && char.tempHp > 0) {
                const absorbed = Math.min(char.tempHp, current - next);
                old.tempHp = char.tempHp; char.tempHp -= absorbed; next += absorbed;
                note = `（临时生命抵消 ${absorbed}）`;
            }
        }
        if (field === 'exhaustion') max = 6;
        char[field] = Math.max(0, Math.min(max, next));
        return { ok: true, log: `${char.name} 的${name}：${current} ➔ ${char[field]}${note}`, rollback: old };
    };

    const undoStat = (char, rollback) => { if (char && rollback) Object.assign(char, JSON.parse(JSON.stringify(rollback))); };

    // 长休：回满生命和法术位，恢复一半生命骰，力竭 -1；短休：邪术师恢复契约法术位
    const rest = (char, type) => {
        const old = JSON.parse(JSON.stringify({ hp: char.hp, tempHp: char.tempHp, slotsUsed: char.slotsUsed, hitDiceUsed: char.hitDiceUsed, exhaustion: char.exhaustion, deathSaves: char.deathSaves }));
        if (/长|long/i.test(type)) {
            Object.assign(char, { hp: char.maxHp, tempHp: 0, slotsUsed: {}, deathSaves: { success: 0, fail: 0 } });
            char.hitDiceUsed = Math.max(0, (parseInt(char.hitDiceUsed) || 0) - Math.max(1, Math.floor(char.level / 2)));
            char.exhaustion = Math.max(0, (parseInt(char.exhaustion) || 0) - 1);
            return { ok: true, log: `${char.name} 完成长休：生命值回满，法术位恢复`, rollback: old };
        }
        if (D.classInfo(char)?.caster === 'pact') char.slotsUsed = {};
        return { ok: true, log: `${char.name} 完成短休，可以花费生命骰回复生命`, rollback: old };
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
            state.order = chars.map(({ char, index }) => ({ name: char.name, pc: true, index, init: D.d20Test({ mod: D.initiativeMod(char) }).total, ac: D.armorClass(char) }));
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

    // 发给 AI 的角色资料
    const profile = (char) => {
        const cls = D.classInfo(char); const race = D.raceOf(char); const sub = D.subraceOf(char); const bg = D.backgroundOf(char); const ed = D.edition(char.edition);
        const abilities = Object.entries(D.ABILITIES).map(([k, v]) => `${v}${char.abilities?.[k]}(${D.signed(D.abilityMod(char.abilities?.[k]))})`).join(' ');
        const skills = (char.skillProfs || []).map(id => `${D.SKILLS[id]?.name}${D.signed(D.skillMod(char, id))}${char.expertise?.includes(id) ? '(专精)' : ''}`).join('、');
        const slots = Object.entries(D.spellSlots(char)).map(([lv, n]) => `${lv}环 ${n - (parseInt(char.slotsUsed?.[lv]) || 0)}/${n}`).join(' ');
        const weapons = (char.weapons || []).map(id => D.weaponAttack(char, id)).filter(Boolean).map(w => `${w.name}(命中${D.signed(w.toHit)}, ${w.damage}${w.type})`).join('、');
        const story = Object.values(char.backstory || {}).filter(Boolean).join(' / ');
        return [
            `姓名：${char.name} | ${ed.name}`,
            `${sub?.name || race?.name || '未知种族'} ${cls?.name || '未知职业'}${char.subclass ? `（${char.subclass}）` : ''} ${char.level} 级 | 背景：${bg?.name || '无'} | 阵营：${char.alignment || '未定'}`,
            `属性：${abilities}`,
            `生命 ${char.hp}/${char.maxHp}${char.tempHp ? ` +临时${char.tempHp}` : ''} | AC ${D.armorClass(char)} | 速度 ${race?.speed || 30} 尺 | 熟练加值 ${D.signed(D.profBonus(char.level))} | 被动察觉 ${D.passivePerception(char)}`,
            `豁免熟练：${(cls?.saves || []).map(a => D.ABILITIES[a]).join('、') || '无'} | 技能熟练：${skills || '无'}`,
            weapons && `武器：${weapons}`,
            slots && `法术位：${slots} | 法术豁免 DC ${D.spellSaveDc(char)}，法术攻击 ${D.signed(D.spellAttack(char))}`,
            char.spells && `法术：${char.spells}`,
            char.features && `能力与专长：${char.features}`,
            (char.conditions?.length || char.exhaustion) && `当前状态：${[...(char.conditions || []), char.exhaustion ? `力竭${char.exhaustion}级` : ''].filter(Boolean).join('、')}`,
            char.inventory && `物品：${char.inventory}${char.gold ? ` | 金币 ${char.gold}` : ''}`,
            story && `背景故事：${story}`,
        ].filter(Boolean).join('\n');
    };

    Object.assign(D, { rollCheck, rollExpr, applyStat, undoStat, rest, combat, runCombatCommands, profile });
})(typeof window !== 'undefined' ? window : globalThis);
