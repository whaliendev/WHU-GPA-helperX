/***** 基础功能相关全局变量 *****/
let faculty = ''; // 全局变量，储存学院名
let fromUpdateGrades = false; // 标志请求是否为更新成绩表

// 学期 GPA 摘要的列数
const COL_SPAN = 23;

// 不同含义列的索引
const COL_INDEX = {
    COURSE_YEAR: 0, // 学年
    COURSE_SEMESTER: 1, // 学期
    COURSE_CODE: 2, // 课程代码/选择框
    COURSE_CATEGORY: 4, // 课程类别
    COURSE_CREDITS: 5, // 学分
    COURSE_SCORE: 6, // 成绩
    COURSE_GPA: 8, // GPA
    COURSE_INSTITUTION: 11, // 开课学院
};

/***** 图表相关的全局变量 *****/
let plots = null; // 全局变量，画图的echartsInstance实例，方便关掉 modal 时释放资源

// 学分按课程类别的数组，Array of [category, credits count]
let creditsDataset = [];

// 每学期的成绩记录数组，Array of [semester, credits count, average GPA, cumu GPA, average score, cumu score]
let recordDataset = [];

/***** 配置相关全局变量 *****/
const CONFIG_KEY = 'WHU-GPA-helperX.config'; // localstorage的配置key

// 排序字段的默认值，其中true表示升序，false表示降序
let _config = {
    sorts: {
        [COL_INDEX.COURSE_YEAR]: true, // 学年
        [COL_INDEX.COURSE_SEMESTER]: true, // 学期
        [COL_INDEX.COURSE_CATEGORY]: false, // 课程性质
    },
    // 排序优先级：学年 > 学期 > 用户点击列 > 课程性质
    sortOrder: [
        COL_INDEX.COURSE_YEAR, // 学年（优先级最高）
        COL_INDEX.COURSE_SEMESTER, // 学期
        COL_INDEX.COURSE_CATEGORY, // 课程性质（最后）
    ],
    // 表头点击排序相关配置
    lastClickedColumn: undefined, // 额外排序列的索引
    lastClickedColumnSort: undefined, // 额外排序列的方向：true(升序)/false(降序)/undefined(无额外排序)
};

/**
 * 从localStorage加载配置并进行安全迁移
 */
function loadConfig() {
    const json = localStorage.getItem(CONFIG_KEY);
    if (!json) return;

    try {
        const savedConfig = JSON.parse(json);
        if (!savedConfig || !savedConfig.sorts) return;

        const validColumnIndexes = new Set([
            COL_INDEX.COURSE_YEAR,
            COL_INDEX.COURSE_SEMESTER,
            COL_INDEX.COURSE_CATEGORY,
        ]);

        // 迁移排序配置：只保留当前有效的列设置
        const migratedSorts = {};
        for (const columnIndex of validColumnIndexes) {
            if (savedConfig.sorts.hasOwnProperty(columnIndex)) {
                migratedSorts[columnIndex] = savedConfig.sorts[columnIndex];
            } else {
                // use default value
                migratedSorts[columnIndex] = _config.sorts[columnIndex];
            }
        }
        _config.sorts = migratedSorts;

        if (
            typeof savedConfig.lastClickedColumn === 'number' ||
            savedConfig.lastClickedColumn === undefined
        ) {
            _config.lastClickedColumn = savedConfig.lastClickedColumn;
        }

        if (
            typeof savedConfig.lastClickedColumnSort === 'boolean' ||
            savedConfig.lastClickedColumnSort === undefined
        ) {
            _config.lastClickedColumnSort = savedConfig.lastClickedColumnSort;
        }

        // 兼容旧版本的 headerSorts 配置
        if (
            savedConfig.headerSorts &&
            typeof savedConfig.headerSorts === 'object'
        ) {
            // 从旧的 headerSorts 中提取第一个有效的排序设置
            for (const [columnIndex, sortDirection] of Object.entries(
                savedConfig.headerSorts
            )) {
                const colIndex = parseInt(columnIndex);
                if (
                    !isNaN(colIndex) &&
                    (sortDirection === true ||
                        sortDirection === false ||
                        sortDirection === undefined)
                ) {
                    _config.lastClickedColumn = colIndex;
                    _config.lastClickedColumnSort = sortDirection;
                    break;
                }
            }
        }
    } catch (error) {
        // if any error occurs, use default config, just fail silently
    }
}

/**
 * 保存配置到localStorage
 */
function saveConfig() {
    // sortOrder is const, so we don't need to save it
    const configToSave = {
        sorts: _config.sorts,
        lastClickedColumn: _config.lastClickedColumn,
        lastClickedColumnSort: _config.lastClickedColumnSort,
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(configToSave));
}

// 页面卸载时自动保存配置
$(window).unload(function () {
    saveConfig();
});
