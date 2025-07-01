/**
 * 绑定各控件事件
 */
function bindEvents() {
    // 响应表格中的复选框
    $('input[name="x-course-select"]').change(() => {
        updateAllScores();
    });

    // 响应课程类别复选框
    $('input[name="x-selbox"]').change(e => {
        const input = e.target;
        $('table:eq(1) tr:gt(0)').each(function () {
            if (
                $(this).find(`td:eq(${COL_INDEX.COURSE_CATEGORY})`).text() ===
                input.value
            ) {
                const score = $.trim(
                    $(this).find(`td:eq(${COL_INDEX.COURSE_SCORE})`).text()
                );
                const checkbox = $(this).find(
                    `td:eq(${COL_INDEX.COURSE_CODE}) input[name="x-course-select"]`
                );

                // 撤销课程（成绩为'W'）永远不被选中
                if (score === 'W') {
                    checkbox.prop('checked', false);
                } else {
                    checkbox.prop('checked', input.checked);
                }
            }
        });
        updateAllScores();
    });

    // 全选/全不选
    $('#x-sel-all').click(() => {
        if ($('input[name="x-course-select"]:checked').length === 0) {
            // 全选时：选中所有非撤销课程（成绩不为'W'的课程）
            $('table:eq(1) tr:gt(0)').each(function () {
                const score = $.trim(
                    $(this).find(`td:eq(${COL_INDEX.COURSE_SCORE})`).text()
                );
                const checkbox = $(this).find(
                    `td:eq(${COL_INDEX.COURSE_CODE}) input[name="x-course-select"]`
                );

                if (score !== 'W' && checkbox.length > 0) {
                    checkbox.prop('checked', true);
                }
            });
            $('input[name="x-selbox"]').prop('checked', true);
            $('#x-sel-all').text('全不选');
        } else {
            // 全不选：取消选中所有课程
            $('input[name="x-course-select"]').prop('checked', false);
            $('input[name="x-selbox"]').prop('checked', false);
            $('#x-sel-all').text('全选');
        }
        updateAllScores();
    });

    // 反选
    $('#x-sel-rev').click(() => {
        let checked = $('input[name="x-course-select"]:checked');

        // 反选时：只反选非撤销课程，撤销课程（成绩为'W'）保持不选中
        $('table:eq(1) tr:gt(0)').each(function () {
            const score = $.trim(
                $(this).find(`td:eq(${COL_INDEX.COURSE_SCORE})`).text()
            );
            const checkbox = $(this).find(
                `td:eq(${COL_INDEX.COURSE_CODE}) input[name="x-course-select"]`
            );

            if (checkbox.length > 0 && score !== 'W') {
                checkbox.prop('checked', !checkbox.is(':checked'));
            }
        });
        updateAllScores();
    });

    // 复原
    $('#x-sel-revert').click(() => {
        $('table:eq(1) tr:gt(0)').each(function () {
            const scoreText = $.trim(
                $(this).find(`td:eq(${COL_INDEX.COURSE_SCORE})`).text()
            );
            const checkbox = $(this).find(
                `td:eq(${COL_INDEX.COURSE_CODE}) input:checkbox`
            );

            // 撤销课程（成绩为'W'）永远不选中
            if (scoreText === 'W') {
                checkbox.prop('checked', false);
            } else {
                // 非撤销课程：成绩 >= 60分则选中，否则不选中
                const score = parseFloat(scoreText);
                if (score >= 60.0) {
                    checkbox.prop('checked', true);
                } else {
                    checkbox.prop('checked', false);
                }
            }
        });
        $('input[name="x-selbox"]').prop('checked', true);

        // 清理排序状态并恢复默认配置
        _config.lastClickedColumn = undefined;
        _config.lastClickedColumnSort = undefined;
        _config.sorts = {
            [COL_INDEX.COURSE_YEAR]: true,
            [COL_INDEX.COURSE_SEMESTER]: true,
            [COL_INDEX.COURSE_CATEGORY]: false,
        };

        // 重置所有表头图标显示
        $('.ui-jqgrid-htable tr th:visible').each(function (index, th) {
            if (index === COL_INDEX.COURSE_CODE) return;

            const $sortIcon = $(th).find('div span.s-ico');
            const isDefaultSortColumn = _config.sortOrder.includes(index);

            if (isDefaultSortColumn) {
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
            } else {
                $sortIcon.css('display', 'none');
            }
        });

        updateAllScores();
        sortScores();
    });

    // 图表
    $('#x-show-graph').click(() => {
        $('#x-modal-overlay').addClass('x-open');
        updateStatistics();
        plots = drawStatisticPlot();
    });
    // 点击modal不关闭overlay
    $('.x-modal').click(function (e) {
        e.stopPropagation();
    });
    // 点击exit icon关闭overlay
    $('.x-icon').click(() => {
        closeModal();
    });
    // 直接点击overlay
    $('#x-modal-overlay').click(function () {
        closeModal();
    });
    // 点击modal上的复原按钮将课程选项更新，并重新绘图
    $('#x-revert').click(() => {
        $('#x-sel-revert').trigger('click');
        updateStatistics();
        plots = drawStatisticPlot();
    });
}
