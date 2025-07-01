/**
 * 获取学院名
 */
$.ajaxSetup({
    dataFilter: function (data, type) {
        fromUpdateGrades = false;

        try {
            // 响应数据不一定是JSON
            const response = JSON.parse(data);
            if (
                response['items'] &&
                response['items'][0] &&
                response['items'][0]['jgmc']
            ) {
                faculty = response['items'][0]['jgmc'];
                fromUpdateGrades = true;
            }
        } catch (error) {}
        return data;
    },
});

/**
 * 文档加载完成后，触发查询按钮click事件，获取全部成绩
 */
$(window).on('load', function () {
    loadConfig();

    // only bind once
    bindHeaderClickEvent();

    hookDialog();

    fetchScores();
});

/**
 * 拦截 dialog 函数，使 sortModal 正常工作
 */
function hookDialog() {
    hook($, 'dialog', function (originalDialog, options) {
        const hookedForSort = options && options['modalName'] === 'sortModal';
        const result = originalDialog(
            hookedForSort
                ? {
                      ...options,
                      buttons: {
                          ...options.buttons,
                          success: {
                              ...options.buttons.success,
                              callback: sortScores,
                          },
                      },
                  }
                : options
        );
        if (hookedForSort) bindAllSortsModeEvent();

        return result;
    });
}

function fetchScores() {
    $('#searchForm .chosen-select').first().val('');
    $('#searchForm .chosen-select').eq(1).val('');
    $('#searchForm .chosen-select').last().val('');
    $('.chosen-single span').text('全部');

    /**
     * How to change the row num of jGrid
     * Ref: https://stackoverflow.com/questions/2224070/setting-jqgrid-rownum-dynamically
     */
    $('#tabGrid').setGridParam({ rowNum: 150 });
    $('select.ui-pg-selbox').val(150);

    $('#search_go').trigger('click');
}

/**
 * Ajax请求完成后，触发配置动态UI
 */
$(document).ajaxComplete(function () {
    if (fromUpdateGrades) customDynamicUI();
});

/**
 * 配置成绩表格选项框
 */
function customDynamicUI() {
    // 过滤不是获取成绩的请求
    if ($('table:eq(1) tr:gt(0)').length <= 2) return;

    // 替换课程代码列为课程选择框
    $('#jqgh_tabGrid_kch')
        .contents()
        .filter(function () {
            return this.nodeType === 3;
        })
        .replaceWith('选择');

    const catsList = []; // 获取课程类别的数组，未去重
    $('table:eq(1) tr:gt(0)').each(function () {
        const scoreText = $.trim(
            $(this).find(`td:eq(${COL_INDEX.COURSE_SCORE})`).text()
        );

        // 撤销课程（成绩为'W'）默认不选中，且不加入课程类别列表
        if (scoreText === 'W') {
            $(this)
                .find(`td:eq(${COL_INDEX.COURSE_CODE})`)
                .html(`<input type="checkbox" name="x-course-select" />`);
        } else {
            const score = parseFloat(scoreText);
            if (score >= 60.0) {
                $(this)
                    .find(`td:eq(${COL_INDEX.COURSE_CODE})`)
                    .html(
                        `<input type="checkbox" name="x-course-select" checked="checked" />`
                    );

                const courseCat = $.trim(
                    $(this).find(`td:eq(${COL_INDEX.COURSE_CATEGORY})`).text()
                );
                const courseIns = $.trim(
                    $(this)
                        .find(`td:eq(${COL_INDEX.COURSE_INSTITUTION})`)
                        .text()
                );
                if (
                    faculty &&
                    courseCat.startsWith('专业') &&
                    courseIns !== faculty
                ) {
                    $(this)
                        .find(`td:eq(${COL_INDEX.COURSE_CATEGORY})`)
                        .text('跨院' + courseCat);
                }
                catsList.push(
                    $.trim(
                        $(this)
                            .find(`td:eq(${COL_INDEX.COURSE_CATEGORY})`)
                            .text()
                    )
                );
            } else {
                $(this)
                    .find(`td:eq(${COL_INDEX.COURSE_CODE})`)
                    .html(`<input type="checkbox" name="x-course-select" />`);
            }
        }
    });
    customStaticUI(catsList);
    sortScores();
}

/**
 * 对返回成绩进行重新排序，添加每学期的信息显示栏
 */
function sortScores() {
    // 构建完整的排序配置
    const { sortModes, sortOrder } = buildSortConfig();

    // 移除之前生成的学期信息行，避免重复累积
    $('table:eq(1) tr.x-sem-row').remove();

    let rows = $('table:eq(1)')
        .find('tr:gt(0)')
        .toArray()
        .sort(comparator(sortModes, sortOrder));
    rows.splice(0, 0, $('table:eq(1)').find('tr:eq(0)'));
    $('table:eq(1)').children('tbody').empty().html(rows);

    let time = ['', 0];
    $('table:eq(1)')
        .find('tr:gt(0)')
        .each(function () {
            let year = $(this).find(`td:eq(${COL_INDEX.COURSE_YEAR})`).text();
            let sem = parseInt(
                $(this).find(`td:eq(${COL_INDEX.COURSE_SEMESTER})`).text()
            );
            if (time[0] !== year || time[1] !== sem) {
                let semGPA = calcSemGPA(year, sem);
                $(this).before(`
              <tr class="x-sem-row">
                  <td colspan="${COL_SPAN}" class="x-sem-info">
                  <strong class="x-info-block">
                  <em>${year}</em>&nbsp;学年&nbsp;&nbsp;第&nbsp;<em>${sem}</em>&nbsp;学期&nbsp;&nbsp;&nbsp;&nbsp;
                  学分数：<span>${semGPA[0]}</span>&nbsp;&nbsp;&nbsp;&nbsp;
                  平均GPA：<span>${semGPA[1]}</span>&nbsp;&nbsp;&nbsp;&nbsp;
                  平均成绩：<span>${semGPA[2]}</span>
                  </strong>
                  </td>
              </tr>
          `);
            }
            time = [year, sem];
        });

    updateAllScores();
    bindEvents();

    // 同步表头图标显示
    syncHeaderIcons();
}
