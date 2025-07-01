/**
 * 构建排序配置
 * 排序优先级：学年 > 学期 > 用户点击列 > 课程性质
 * @returns {{sortModes: Object, sortOrder: number[]}} 返回排序配置和优先级数组
 */
function buildSortConfig() {
    const sortModes = { ..._config.sorts };

    // 构建排序优先级：学年 > 学期 > 用户点击列 > 课程性质
    const sortOrder = [COL_INDEX.COURSE_YEAR, COL_INDEX.COURSE_SEMESTER];
    if (
        _config.lastClickedColumn !== undefined &&
        _config.lastClickedColumnSort !== undefined
    ) {
        sortModes[_config.lastClickedColumn] = _config.lastClickedColumnSort;
        sortOrder.push(_config.lastClickedColumn);
    }
    sortOrder.push(COL_INDEX.COURSE_CATEGORY);

    return { sortModes, sortOrder };
}

/**
 * 获取某个单元格的文本
 * @param {number} row 行下标
 * @param {number} index 列下标
 * @returns {string} 单元格文本
 */
function getCellValue(row, index) {
    return $(row).children('td:visible').eq(index).text();
}

/**
 * 根据排序配置生成比较器函数
 * @param {Object} sortModes - 排序方向配置，格式为 {columnIndex: isAscending}
 * @param {number[]} sortOrder - 排序优先级数组，按优先级从高到低排列
 * @returns {Function} 排序比较器函数
 */
function comparator(sortModes, sortOrder) {
    const compare = (valA, valB) => {
        if ($.isNumeric(valA) && $.isNumeric(valB)) {
            return valA - valB;
        }
        return valA.localeCompare(valB);
    };

    return function (a, b) {
        let result = 0;

        for (const columnIndex of sortOrder) {
            const isAscending = sortModes[columnIndex];

            // 跳过未定义的排序方向
            if (isAscending === undefined) continue;

            const valA = getCellValue(a, columnIndex);
            const valB = getCellValue(b, columnIndex);

            const compareResult = compare(valA, valB);
            result = result || (isAscending ? 1 : -1) * compareResult;
            if (result) break;
        }
        return result;
    };
}

/**
 * 绑定排序模式选择的事件，改善了左上角箭头调出Modal的显示方式
 *
 * @param {object} sorts 排序模式对象
 * @param {number} sortId 在表格中列号， 0-based
 * @param {number} elementIndex 在sort_table_body中排序选项所在行号（sort_table_body属于左上角小
 * 箭头调出的modal）
 */
function bindSortModeEvent(sorts, sortId, elementIndex) {
    const prefix = `#sort_table_body tr:eq(${elementIndex}) td:eq(2) label`;
    const modes = {
        0: '升序',
        1: '降序',
    };

    for (const x in modes) {
        const label = $(`${prefix}:eq(${x})`).first();

        label.off('click');
        label.on('click', function () {
            sorts[sortId] = parseInt(x) === 0;
        });
    }

    // 选中目前激活的模式
    $(`${prefix}:eq(${sorts[sortId] ? 0 : 1})`)
        .first()
        .click();
}

/**
 * 确定排序是正序还是反序
 */
function bindAllSortsModeEvent() {
    // 箭头排序模态框：只控制基础排序列（学年、学期、课程性质）
    // 表头点击排序：基础列直接修改 _config.sorts，额外列使用 _config.lastClickedColumnSort
    // 排序优先级：学年 > 学期 > 用户点击列 > 课程性质
    bindSortModeEvent(_config.sorts, COL_INDEX.COURSE_YEAR, 0);
    bindSortModeEvent(_config.sorts, COL_INDEX.COURSE_SEMESTER, 1);
    bindSortModeEvent(_config.sorts, COL_INDEX.COURSE_CATEGORY, 2);

    $('#sort_table_body tr:eq(2) td:eq(1)').first().text('课程性质');
}

/**
 * 绑定表头单击事件实现排序功能
 * 基础排序列（学年、学期、课程性质）：二态切换（升序 <-> 降序），不能删除
 * 额外排序列：三态切换（未排序 -> 升序 -> 降序 -> 未排序），且最多只能有一列
 */
function bindHeaderClickEvent() {
    /**
     * 更新表头排序图标的显示状态
     * @param {jQuery} span - 包含排序图标的span元素
     * @param {boolean|undefined} isAscending - 排序方向：true(升序)/false(降序)/undefined(不排序)
     */
    const updateSortIcon = (span, isAscending) => {
        if (isAscending === undefined) {
            span.css('display', 'none');
            return;
        }
        span.css('display', 'inline');

        const ascElement = span.find(`span[sort=asc]`);
        const descElement = span.find(`span[sort=desc]`);

        ascElement.removeClass('ui-state-disabled');
        descElement.removeClass('ui-state-disabled');

        if (isAscending) {
            descElement.addClass('ui-state-disabled');
        } else {
            ascElement.addClass('ui-state-disabled');
        }
    };

    $('.ui-jqgrid-htable tr th:visible').each(function (index, th) {
        if (index === COL_INDEX.COURSE_CODE) return;

        const $th = $(th);
        const $div = $th.find('div');
        const $sortIcon = $div.find('span.s-ico');

        const isDefaultSortColumn = _config.sortOrder.includes(index);
        if (isDefaultSortColumn && _config.sorts[index] !== undefined) {
            updateSortIcon($sortIcon, _config.sorts[index]);
        } else if (
            !isDefaultSortColumn &&
            _config.lastClickedColumn === index &&
            _config.lastClickedColumnSort !== undefined
        ) {
            updateSortIcon($sortIcon, _config.lastClickedColumnSort);
        }

        $th.unbind('click');

        $div.on('click', function () {
            if (isDefaultSortColumn) {
                _config.sorts[index] = !_config.sorts[index];
                updateSortIcon($sortIcon, _config.sorts[index]);
            } else {
                // 非基础排序列：三态切换，且只能有一个额外列
                if (_config.lastClickedColumn === index) {
                    if (_config.lastClickedColumnSort === true) {
                        _config.lastClickedColumnSort = false; // 升序 -> 降序
                    } else {
                        // 降序 -> 删除
                        _config.lastClickedColumnSort = undefined;
                        _config.lastClickedColumn = undefined;
                    }
                } else {
                    // 设置新的额外排序列（覆盖）
                    if (_config.lastClickedColumn !== undefined) {
                        // 清除之前的额外排序列图标
                        const prevSortIcon = $(
                            `.ui-jqgrid-htable tr th:eq(${_config.lastClickedColumn}) div span.s-ico`
                        );
                        updateSortIcon(prevSortIcon, undefined);
                    }
                    _config.lastClickedColumnSort = true; // 新列从升序开始
                    _config.lastClickedColumn = index;
                }
                updateSortIcon($sortIcon, _config.lastClickedColumnSort);
            }

            sortScores();
        });
    });
}

/**
 * 同步表头排序图标显示状态
 */
function syncHeaderIcons() {
    $('.ui-jqgrid-htable tr th:visible').each(function (index, th) {
        if (index === COL_INDEX.COURSE_CODE) return;

        const $sortIcon = $(th).find('div span.s-ico');
        const isDefaultSortColumn = _config.sortOrder.includes(index);

        if (isDefaultSortColumn) {
            // 显示基础排序列的图标
            $sortIcon.css('display', 'inline');

            const ascElement = $sortIcon.find(`span[sort=asc]`);
            const descElement = $sortIcon.find(`span[sort=desc]`);

            ascElement.removeClass('ui-state-disabled');
            descElement.removeClass('ui-state-disabled');

            if (_config.sorts[index]) {
                descElement.addClass('ui-state-disabled');
            } else {
                ascElement.addClass('ui-state-disabled');
            }
        } else if (
            !isDefaultSortColumn &&
            _config.lastClickedColumn === index &&
            _config.lastClickedColumnSort !== undefined
        ) {
            // 显示额外排序列的图标
            $sortIcon.css('display', 'inline');

            const ascElement = $sortIcon.find(`span[sort=asc]`);
            const descElement = $sortIcon.find(`span[sort=desc]`);

            ascElement.removeClass('ui-state-disabled');
            descElement.removeClass('ui-state-disabled');

            if (_config.lastClickedColumnSort) {
                descElement.addClass('ui-state-disabled');
            } else {
                ascElement.addClass('ui-state-disabled');
            }
        } else {
            // 隐藏其他列的图标
            $sortIcon.css('display', 'none');
        }
    });
}
