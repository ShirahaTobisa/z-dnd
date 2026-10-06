// D&D 5e 2014 版数据（SRD 5.1）。种族给属性加值。
(function (root) {
    root.DND.editions['2014'] = {
        id: '2014',
        name: '5e 2014 版',
        raceLabel: '种族',
        abilityBonusFrom: 'race',
        halfCasterStart: 2,
        subclassLevel: { cleric: 1, sorcerer: 1, warlock: 1, druid: 2, wizard: 2 },
        defaultSubclassLevel: 3,
        // bonuses：固定加值；bonusChoice：自选加值；skills：赠送技能熟练；skillChoice：自选技能数量
        races: {
            dwarf: { name: '矮人', size: '中型', speed: 25, darkvision: 60, bonuses: { CON: 2 }, traits: ['矮人韧性', '战斗训练', '石工知识'], weapons: ['战斧', '手斧', '轻锤', '战锤'],
                subraces: { hill: { name: '丘陵矮人', bonuses: { WIS: 1 }, traits: ['矮人坚韧'], hpPerLevel: 1 } } },
            elf: { name: '精灵', size: '中型', speed: 30, darkvision: 60, bonuses: { DEX: 2 }, skills: ['perception'], traits: ['敏锐感官', '精类血统', '出神'],
                subraces: { high: { name: '高等精灵', bonuses: { INT: 1 }, traits: ['精灵武器训练', '戏法', '额外语言'], weapons: ['长剑', '短剑', '短弓', '长弓'] } } },
            halfling: { name: '半身人', size: '小型', speed: 25, bonuses: { DEX: 2 }, traits: ['幸运', '勇敢', '半身人灵巧'],
                subraces: { lightfoot: { name: '轻足半身人', bonuses: { CHA: 1 }, traits: ['天生隐匿'] } } },
            human: { name: '人类', size: '中型', speed: 30, bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 }, traits: ['额外语言'] },
            dragonborn: { name: '龙裔', size: '中型', speed: 30, bonuses: { STR: 2, CHA: 1 }, traits: ['龙族血统', '吐息武器', '伤害抗性'] },
            gnome: { name: '侏儒', size: '小型', speed: 25, darkvision: 60, bonuses: { INT: 2 }, traits: ['侏儒狡黠'],
                subraces: { rock: { name: '岩侏儒', bonuses: { CON: 1 }, traits: ['工匠知识', '工匠'] } } },
            halfElf: { name: '半精灵', size: '中型', speed: 30, darkvision: 60, bonuses: { CHA: 2 }, bonusChoice: { count: 2, amount: 1, exclude: ['CHA'] }, skillChoice: 2, traits: ['精类血统', '多才多艺'] },
            halfOrc: { name: '半兽人', size: '中型', speed: 30, darkvision: 60, bonuses: { STR: 2, CON: 1 }, skills: ['intimidation'], traits: ['坚韧不屈', '凶蛮攻击'] },
            tiefling: { name: '提夫林', size: '中型', speed: 30, darkvision: 60, bonuses: { CHA: 2, INT: 1 }, traits: ['地狱抗性', '炼狱传承'] },
        },
        // custom：自定义背景，玩家自选技能
        backgrounds: {
            acolyte: { name: '侍僧', skills: ['insight', 'religion'], feature: '信仰庇护' },
            custom: { name: '自定义背景', skillChoice: 2 },
        },
        exhaustion: ['属性检定劣势', '速度减半', '攻击检定和豁免检定劣势', '生命值上限减半', '速度降为 0', '死亡'],
        longRestHitDice: 'half',
        // 各职业特性：{ 等级: '特性、特性' }，说明见 features.js
        classFeatures: {
            barbarian: { 1: '狂暴、无甲防御', 2: '鲁莽攻击、危险感知', 3: '选择子职业', 4: '属性值提升', 5: '额外攻击、快速移动', 7: '野性直觉', 8: '属性值提升', 9: '凶蛮重击', 11: '坚韧狂暴', 12: '属性值提升', 13: '凶蛮重击（两枚骰）', 15: '持久狂暴', 16: '属性值提升', 17: '凶蛮重击（三枚骰）', 18: '不屈之力', 19: '属性值提升', 20: '原初斗士' },
            bard: { 1: '施法、诗人激励', 2: '万事通、休憩之歌', 3: '选择子职业、专精', 4: '属性值提升', 5: '激励之源', 6: '反迷惑', 8: '属性值提升', 10: '专精、魔法奥秘', 12: '属性值提升', 14: '魔法奥秘', 16: '属性值提升', 18: '魔法奥秘', 19: '属性值提升', 20: '卓越激励' },
            cleric: { 1: '施法、选择子职业', 2: '引导神力、驱散不死', 4: '属性值提升', 5: '摧毁不死', 8: '属性值提升', 10: '神圣干预', 12: '属性值提升', 16: '属性值提升', 19: '属性值提升', 20: '神圣干预改进' },
            druid: { 1: '德鲁伊语、施法', 2: '野性变身、选择子职业', 4: '野性变身改进、属性值提升', 8: '野性变身改进、属性值提升', 12: '属性值提升', 16: '属性值提升', 18: '永恒躯体、野兽法术', 19: '属性值提升', 20: '大德鲁伊' },
            fighter: { 1: '战斗风格、回气', 2: '动作如潮', 3: '选择子职业', 4: '属性值提升', 5: '额外攻击', 6: '属性值提升', 8: '属性值提升', 9: '不屈', 11: '额外攻击（三次攻击）', 12: '属性值提升', 13: '不屈（两次）', 14: '属性值提升', 16: '属性值提升', 17: '动作如潮（两次）、不屈（三次）', 19: '属性值提升', 20: '额外攻击（四次攻击）' },
            monk: { 1: '无甲防御、武艺', 2: '气、无甲移动', 3: '选择子职业、拨挡飞矢', 4: '属性值提升、轻身坠', 5: '额外攻击、震慑拳', 6: '气化拳', 7: '反射闪避、心如止水', 8: '属性值提升', 10: '净体', 12: '属性值提升', 13: '日月同辉之语', 14: '金刚之魂', 15: '永恒之躯', 16: '属性值提升', 18: '空明之躯', 19: '属性值提升', 20: '完美自我' },
            paladin: { 1: '神圣感知、圣疗', 2: '战斗风格、施法、至圣斩', 3: '神圣健康、选择子职业', 4: '属性值提升', 5: '额外攻击', 6: '守护灵光', 8: '属性值提升', 10: '勇气灵光', 11: '至圣斩改进', 12: '属性值提升', 14: '净化之触', 16: '属性值提升', 18: '灵光改进', 19: '属性值提升' },
            ranger: { 1: '宿敌、自然探索者', 2: '战斗风格、施法', 3: '选择子职业、原始感知', 4: '属性值提升', 5: '额外攻击', 6: '宿敌改进、自然探索者改进', 8: '属性值提升、大地行者', 10: '自然探索者改进、隐于平地', 12: '属性值提升', 14: '宿敌改进、消失', 16: '属性值提升', 18: '野性感官', 19: '属性值提升', 20: '灭敌者' },
            rogue: { 1: '专精、偷袭、盗贼黑话', 2: '灵巧动作', 3: '选择子职业', 4: '属性值提升', 5: '直觉闪避', 6: '专精', 7: '反射闪避', 8: '属性值提升', 10: '属性值提升', 11: '可靠才能', 12: '属性值提升', 14: '盲视感知', 15: '圆滑心智', 16: '属性值提升', 18: '飘忽不定', 19: '属性值提升', 20: '好运' },
            sorcerer: { 1: '施法、选择子职业', 2: '魔力泉源', 3: '超魔法', 4: '属性值提升', 8: '属性值提升', 10: '超魔法', 12: '属性值提升', 16: '属性值提升', 17: '超魔法', 19: '属性值提升', 20: '魔力回复' },
            warlock: { 1: '选择子职业、契约魔法', 2: '魔能祈唤', 3: '契约恩赐', 4: '属性值提升', 8: '属性值提升', 11: '秘法玄奥（6 环）', 12: '属性值提升', 13: '秘法玄奥（7 环）', 15: '秘法玄奥（8 环）', 16: '属性值提升', 17: '秘法玄奥（9 环）', 19: '属性值提升', 20: '秘法大师' },
            wizard: { 1: '施法、奥术回想', 2: '选择子职业', 4: '属性值提升', 8: '属性值提升', 12: '属性值提升', 16: '属性值提升', 18: '法术精通', 19: '属性值提升', 20: '招牌法术' },
        },
        subclassFeatures: {
            '狂战士道途': { 3: '狂乱', 6: '无念狂暴', 10: '威慑', 14: '报复' },
            '逸闻学院': { 3: '额外熟练、刻薄言语', 6: '额外魔法奥秘', 14: '无双技艺' },
            '生命领域': { 1: '重甲熟练、生命门徒', 2: '保全生命', 6: '神佑治疗者', 8: '神圣打击', 17: '至高治疗' },
            '大地结社': { 2: '额外戏法、自然恢复', 3: '结社法术', 6: '大地行者', 10: '自然守护', 14: '自然庇护' },
            '勇士': { 3: '精通重击', 7: '卓越运动员', 10: '额外战斗风格', 15: '高等重击', 18: '幸存者' },
            '散打宗': { 3: '散打技', 6: '全身之体', 11: '宁静', 17: '颤动掌' },
            '奉献之誓': { 3: '神圣武器、驱逐亵渎者', 7: '奉献灵光', 15: '纯洁之灵', 20: '神圣光环' },
            '猎人': { 3: '猎人猎物', 7: '防御战术', 11: '多重攻击', 15: '高等猎人防御' },
            '盗贼': { 3: '快手、攀爬者', 9: '至高潜行', 13: '使用魔法装置', 17: '盗贼反射' },
            '龙族血脉': { 1: '龙族祖先、龙族韧性', 6: '元素亲和', 14: '龙翼', 18: '龙威' },
            '邪魔宗主': { 1: '黑暗祝福', 6: '黑暗者之运', 10: '邪魔抗性', 14: '投入地狱' },
            '塑能学派': { 2: '塑能学者、塑造法术', 6: '强效戏法', 10: '强化塑能', 14: '超限施法' },
        },
        // 职业资源：max 可为数字或 (等级, 角色) => 次数；recharge 为 short 短休或 long 长休恢复
        resources: (() => {
            const { steps, abilityMod } = root.DND;
            const chaMod = (lv, c) => Math.max(1, abilityMod(c.abilities?.CHA));
            return {
                barbarian: [{ id: 'rage', name: '狂暴', max: steps([[1, 2], [3, 3], [6, 4], [12, 5], [17, 6], [20, 99]]), recharge: 'long' }],
                bard: [{ id: 'inspiration', name: '诗人激励', max: chaMod, recharge: (lv) => (lv >= 5 ? 'short' : 'long') }],
                cleric: [{ id: 'channel', name: '引导神力', max: steps([[2, 1], [6, 2], [18, 3]]), recharge: 'short' }],
                druid: [{ id: 'wildShape', name: '野性变身', max: steps([[2, 2], [20, 99]]), recharge: 'short' }],
                fighter: [
                    { id: 'secondWind', name: '回气', max: 1, recharge: 'short' },
                    { id: 'actionSurge', name: '动作如潮', max: steps([[2, 1], [17, 2]]), recharge: 'short' },
                    { id: 'indomitable', name: '不屈', max: steps([[9, 1], [13, 2], [17, 3]]), recharge: 'long' },
                ],
                monk: [{ id: 'ki', name: '气', max: (lv) => (lv >= 2 ? lv : 0), recharge: 'short' }],
                paladin: [
                    { id: 'layOnHands', name: '圣疗池', max: (lv) => lv * 5, recharge: 'long' },
                    { id: 'divineSense', name: '神圣感知', max: (lv, c) => 1 + Math.max(0, abilityMod(c.abilities?.CHA)), recharge: 'long' },
                    { id: 'channel', name: '引导神力', max: steps([[3, 1]]), recharge: 'short' },
                ],
                rogue: [{ id: 'strokeOfLuck', name: '好运', max: steps([[20, 1]]), recharge: 'short' }],
                sorcerer: [{ id: 'sorceryPoints', name: '术法点', max: (lv) => (lv >= 2 ? lv : 0), recharge: 'long' }],
                warlock: [{ id: 'arcanum', name: '秘法玄奥', max: steps([[11, 1], [13, 2], [15, 3], [17, 4]]), recharge: 'long' }],
                wizard: [{ id: 'arcaneRecovery', name: '奥术回想', max: 1, recharge: 'long' }],
            };
        })(),
        featureDesc: {
            '宿敌': '选择一类宿敌，追踪和回想相关知识时具有优势，并学会其语言。',
            '神圣干预': '向神祈求直接干预，成功率为牧师等级百分比。',
            '魔法奥秘': '从任意职业的法术表中学习两个额外法术。',
        },
        attribution: 'This work includes material from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.',
    };
})(typeof window !== 'undefined' ? window : globalThis);
