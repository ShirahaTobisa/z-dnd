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
            dwarf: { name: '矮人', size: '中型', speed: 25, darkvision: 60, bonuses: { CON: 2 }, traits: ['矮人韧性', '战斗训练', '石工知识'],
                subraces: { hill: { name: '丘陵矮人', bonuses: { WIS: 1 }, traits: ['矮人坚韧'] } } },
            elf: { name: '精灵', size: '中型', speed: 30, darkvision: 60, bonuses: { DEX: 2 }, skills: ['perception'], traits: ['敏锐感官', '精类血统', '出神'],
                subraces: { high: { name: '高等精灵', bonuses: { INT: 1 }, traits: ['精灵武器训练', '戏法', '额外语言'] } } },
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
        attribution: 'This work includes material from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.',
    };
})(typeof window !== 'undefined' ? window : globalThis);
