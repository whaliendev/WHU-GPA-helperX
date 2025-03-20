let faculty = ''; // 全局变量，储存学院名
let fromUpdateGrades = false;  // 标志请求是否为更新成绩表

const KEY_CONFIG = 'WHU-GPA-helperX.config';  // localstorage的配置key

// 排序字段的默认值，其中true表示升序，false表示降序
let _config = {
    sorts: {
        1: true, // 学年
        2: true, // 学期
        5: false, // 课程性质
    }
};

/***** 图表相关的全局变量 *****/

let plots = null; // 全局变量，画图的echartsInstance实例，方便关掉modal时释放资源
// 学分按课程类别的数组
// Array[category, credits count]
let creditsDataset = [];

// 每学期的成绩记录数组
// Array of Array[semester, credits count, average GPa, cumu GPA, average score, cumu score]
let recordDataset = [];

/***** end of 图表相关的全局变量 *****/

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
        } catch (error) {
            // console.log(error);
        }
        return data;
    }
});

$(window).unload(function () {
    localStorage.setItem(KEY_CONFIG, JSON.stringify(_config));
});

function loadConfig() {
    const json = localStorage.getItem(KEY_CONFIG);
    const maybe = JSON.parse(json);
    if (maybe && maybe['sorts']) {  // 务必进行校验和对配置进行迁移
        _config = maybe;
    }
}

/**
 * 文档加载完成后，触发查询按钮click事件，获取全部成绩
 */
$(window).on('load', function () {
    loadConfig();

    fetchScores();

    const originalDialog = $.dialog;
    $.dialog = function (options) {
        const hookedForSort = options && options['modalName'] === 'sortModal';
        const result = originalDialog(
            hookedForSort
                ? {
                    ...options,
                    buttons: {
                        ...options.buttons,
                        success: {
                            ...options.buttons.success,
                            callback: fetchScores
                        }
                    }
                }
                : options
        );
        if (hookedForSort) bindAllSortsModeEvent();
        
        return result;
    }
});

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
};

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

    $('#jqgh_tabGrid_kch')
        .contents()
        .filter(function () {
            return this.nodeType === 3;
        })
        .replaceWith('选择');

    const catsList = []; // 获取课程类别的数组，未去重
    $('table:eq(1) tr:gt(0)').each(function () {
        const score = parseFloat($(this).find('td:eq(22)').text());
        if (score >= 60.0) {
            $(this)
                .find('td:eq(3)')
                .html(
                    `<input type="checkbox" name="x-course-select" checked="checked" />`
                );

            const courseCat = $.trim($(this).find('td:eq(5)').text());
            const courseIns = $.trim($(this).find('td:eq(11)').text());
            // console.log(faculty, courseCat, courseIns);
            if (faculty && courseCat.startsWith('专业') && courseIns !== faculty) {
                $(this)
                    .find('td:eq(5)')
                    .text('跨院' + courseCat);
            }
            catsList.push($.trim($(this).find('td:eq(5)').text()));
        } else {
            $(this)
                .find('td:eq(3)')
                .html(`<input type="checkbox" name="x-course-select" />`);
        }
    });
    customStaticUI(catsList);
    sortScores();
}

/**
 * 配置选项按钮，选项多选框等静态控件
 * @param {Array} catsList 未去重课程类别列表。因为配置动态UI可能会执行多次，所以不在配置动态UI进行去重
 */
function customStaticUI(catsList) {
    $('#topButton')[0].onclick = null;
    // 如果没有添加Button控件和图表Modal
    if ($('#x-sel-all').length === 0) {
        addButtons();
        addGraphModal();
    }

    /**
     * 说明：绝对不要交换当前这段代码和下段代码。
     * 因为.x-controls-container的位置变化会触发intersection observer的单向添加is-pinned类。
     * 当然这里有更好的解决办法，不过先这样fix一下。
     */
    if ($('#div-data .col-md-10.col-sm-10').length !== 0) {
        let fmBlock = $('#div-data .col-md-10.col-sm-10');
        // console.log(fmBlock[0]);
        fmBlock.before(fmBlock.contents());
        fmBlock.css('display', 'none');
        // $('#btn_sortSetting').css('display', 'none');
    }

    // 如果没有添加课程选项框
    if ($('input[name="x-selbox"]').length === 0) {
        addCourseSelectBox(catsList);
    } else {
        $('input[name="x-selbox"]').prop('checked', true);
    }
}

/**
 * 对返回成绩进行重新排序，添加每学期的信息显示栏
 */
function sortScores() {
    let rows = $('table:eq(1)')
        .find('tr:gt(0)')
        .toArray()
        .sort(comparator(_config.sorts));
    rows.splice(0, 0, $('table:eq(1)').find('tr:eq(0)'));
    $('table:eq(1)').children('tbody').empty().html(rows);

    let time = ['', 0];
    $('table:eq(1)')
        .find('tr:gt(0)')
        .each(function () {
            let year = $(this).find('td:eq(1)').text();
            let sem = parseInt($(this).find('td:eq(2)').text());
            if (time[0] !== year || time[1] !== sem) {
                let semGPA = calcSemGPA(year, sem);
                $(this).before(`
              <tr class="x-sem-row">
                  <td colspan="22" class="x-sem-info">
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
            if ($(this).index() % 2 === 0) {
                $(this).addClass('x-alt');
            }
        });
    updateAllScores();
    bindEvents();
}

/**
 * 添加控制Button
 */
function addButtons() {
    $('#search_go').before(`
          <button class="x-button btn btn-primary btn-sm" id="x-sel-all">全不选</button>
          <button class="x-button btn btn-primary btn-sm" id="x-sel-rev">反选</button>
          <button class="x-button btn btn-primary btn-sm" id="x-sel-revert">复原</button>
          <button class="x-button btn btn-primary btn-sm" id="x-show-graph">图表</button>
      `);
}

/**
 * 添加图表Modal
 */
function addGraphModal() {
    // Add graph modal
    $('header.navbar-inverse.top2').before(`
    <div class="x-overlay" id="x-modal-overlay">
      <div class="x-modal">
          <header>
              <span>统计信息</span>
              <span id="x-revert">
                  复原
              </span>
              <button class="x-icon" title="关闭">
                  <div class="x-line x-line1"></div>
                  <div class="x-line x-line2"></div>
              </button>
          </header>
          <main>
              <div id="x-graph1"></div>
              <div id="x-graph2"></div>
          </main>
      </div>
    </div>
  `);
}

/**
 * 配置课程计算选项组
 * @param {Array} catsList 课程类别列表，注意未去重
 * @returns 无返回值
 */
function addCourseSelectBox(catsList) {
    if (catsList.length === 0) return;
    const unique = [...new Set(catsList)].sort((a, b) => a.localeCompare(b));
    let catContent = '';
    for (let i = 0; i < unique.length; i++) {
        catContent += `
              <div class="x-check-wrapper">
                  <label for="cat${i}">${unique[i]}</label>
                  <input type="checkbox" name="x-selbox" value="${unique[i]}" id="x-cat${i}" checked>
              </div>
          `;
    }
    $('#btn_sortSetting').before(`
          <div class="x-controls-container">
              <div class="x-select">
                  <label for="" class="x-hint">请选择计算项：</label>
                  <div class="x-container">
                      <div class="x-check-container">
                          ${catContent}
                      </div>
                  </div>
              </div>
              <div class="x-show-info">
                  <div class="x-info-wrapper">
                      <strong>总学分数：</strong><span class="x-info" id="x-credits">0.0</span>
                  </div>
                  <div class="x-info-wrapper">
                      <strong>平均GPA：</strong><span class="x-info" id="x-gpa">0.000</span>
                  </div>
                  <div class="x-info-wrapper">
                      <strong>平均成绩：</strong><span class="x-info" id="x-average-score">0.00</span>
                  </div>
              </div>
          </div>
    `);
    addHeaderPanel();
}

/**
 * 添加控制container的悬浮显示效果
 */
function addHeaderPanel() {
    // add shadow to controls container, when controls container is positioned stuck.
    // https://css-tricks.com/how-to-detect-when-a-sticky-element-gets-pinned/
    // https://stackoverflow.com/questions/16302483/event-to-detect-when-positionsticky-is-triggered
    const headerInfo = $('.x-controls-container')[0];
    const observer = new IntersectionObserver(
        ([e]) => e.target.classList.toggle('is-pinned', e.intersectionRatio < 1), {
        rootMargin: '-28px 0px 0px',
        threshold: [1]
    }
    );
    observer.observe(headerInfo);
}

/**
 * 绑定排序模式选择的事件，改善了左上角小齿轮调出Modal的显示方式
 * 
 * @param {object} sorts 排序模式对象
 * @param {number} sortId 在表格中列号， 0-based
 * @param {number} elementIndex 在sort_table_body中排序选项所在行号（sort_table_body属于左上角小
 * 齿轮调出的modal）
 */
function bindSortModeEvent(sorts, sortId, elementIndex) {
    // Note(hwa): 暂时不考虑i18n适配
    const prefix = `#sort_table_body tr:eq(${elementIndex}) td:eq(2) label`;
    const modes = {
        0: "升序",
        1: "降序",
    };
    for (const x in modes) {
        const label = $(`${prefix}:eq(${x})`).first();
        label.html(
            label.html()
                .replace(['正序', '倒序'][x], modes[x])
        );
        label.on('click', function () {
            sorts[sortId] = parseInt(x) === 0;
        });
    }

    // 选中目前激活的模式
    $(`${prefix}:eq(${sorts[sortId] ? 0 : 1})`).first().click();
}

/**
 * 确定排序是正序还是反序
 */
function bindAllSortsModeEvent() {
    // TODO(hwa): 考虑将列上排序（上下箭头）和小齿轮排序逻辑统一起来
    bindSortModeEvent(_config.sorts, 1, 0);
    bindSortModeEvent(_config.sorts, 2, 1);
    bindSortModeEvent(_config.sorts, 5, 2);

    $('#sort_table_body tr:eq(2) td:eq(1)').first().text('课程性质');
}

/**
 * 绑定各控件事件
 */
function bindEvents() {
    // 响应表格中的复选框
    $('input[name="x-course-select"]').change(() => {
        // 根据表格中选择的课程类别更新对应课程类别复选框的状态
        // 如果存在对应课程被选中，则课程类别复选框为勾选状态；否则取消勾选
        $('input[name="x-selbox"]').each(function() {
            const category = $(this).val();
            const hasCheckedCourse = $('table:eq(1) tr:gt(0)').filter(function() {
                return $(this).find('td:eq(5)').text() === category &&
                       $(this).find('input[name="x-course-select"]').is(':checked');
            }).length > 0;
            $(this).prop('checked', hasCheckedCourse);
        });
        updateAllScores();
    });

    // 响应课程类别复选框
    $('input[name="x-selbox"]').change((e) => {
        const input = e.target;
        $('table:eq(1) tr:gt(0)').each(function () {
            if ($(this).find('td:eq(5)').text() === input.value) {
                $(this)
                    .find('td:eq(3) input[name="x-course-select"]')
                    .prop('checked', input.checked);
            }
        });
        updateAllScores();
    });

    // 全选/全不选
    $('#x-sel-all').click(() => {
        if ($('input[name="x-course-select"]:checked').length === 0) {
            $('input[name="x-course-select"]').prop('checked', true);
            $('input[name="x-selbox"]').prop('checked', true);
            $('#x-sel-all').text('全不选');
        } else {
            $('input[name="x-course-select"]').prop('checked', false);
            $('input[name="x-selbox"]').prop('checked', false);
            $('#x-sel-all').text('全选');
        }
        updateAllScores();
    });

    // 反选
    $('#x-sel-rev').click(() => {
        let checked = $('input[name="x-course-select"]:checked');
        $('input[name="x-course-select"]:not(:checked)').prop('checked', true);
        checked.prop('checked', false);
        $('input[name="x-selbox"]').each(function() {
            const category = $(this).val();
            const hasCheckedCourse = $('table:eq(1) tr:gt(0)').filter(function() {
                return $(this).find('td:eq(5)').text() === category &&
                       $(this).find('input[name="x-course-select"]').is(':checked');
            }).length > 0;
            $(this).prop('checked', hasCheckedCourse);
        });
        updateAllScores();
    });

    // 复原
    $('#x-sel-revert').click(() => {
        $('table:eq(1) tr:gt(0)').each(function () {
            const score = parseFloat($(this).find('td:eq(7)').text());
            if (score >= 60.0) {
                $(this).find('td:eq(3) input:checkbox').prop('checked', true);
            } else {
                $(this).find('td:eq(3) input:checkbox').prop('checked', false);
            }
            $('input[name="x-selbox"]').prop('checked', true);
        });
        updateAllScores();
        bindAllSortsModeEvent();
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

/**
 * 关闭modal，注意这里用到了plots全局变量来进行资源释放
 */
function closeModal() {
    plots.forEach((plot) => plot.dispose());
    $('#x-modal-overlay').removeClass('x-open');
}

/**
 * 画统计图
 * @returns {Array}  数组，存储已经绘制图像的echartInstance实例，方便进行资源释放
 */
function drawStatisticPlot() {
    let creditPlot = drawCreditsPlot();
    let trendingPlot = drawScoreTrendingPlot();
    return [creditPlot, trendingPlot];
}

/**
 * 更新统计图需要的数据
 */
function updateStatistics() {
    const creditsMap = new Map();
    const trendingArray = [];
    $('table:eq(1)')
        .find('tr:gt(0)')
        .each(function () {
            const record = $(this).find('td:eq(5), td:eq(6)');

            if (record.length === 0) {
                // x-sem-row
                const emArr = $(this).find('em').toArray();
                const scoreArr = $(this).find('span').toArray();
                trendingArray.push([
                    emArr[0].textContent + '-' + emArr[1].textContent,
                    parseFloat(scoreArr[0].textContent),
                    parseFloat(scoreArr[1].textContent),
                    parseFloat(scoreArr[2].textContent)
                ]);
            } else {
                if ($(this).find('input[name="x-course-select"]').is(':checked')) {
                    // record row
                    const cat = record[0].textContent;
                    const credits = parseFloat(record[1].textContent);
                    if (creditsMap.has(cat)) {
                        creditsMap.set(cat, creditsMap.get(cat) + credits);
                    } else {
                        creditsMap.set(cat, credits);
                    }
                }
            }
        });
    processData(creditsMap, trendingArray);
}

/**
 * 将creditsMap和trendingArray处理成合适的格式
 * @param {Map} creditsMap 学分按课程类别的map
 * @param {Array} trendingArray 每学期各种成绩信息的趋势数组
 */
function processData(creditsMap, trendingArray) {
    let cumGPA = 0,
        cumScore = 0,
        cumCredits = 0;
    // console.log(trendingArray);
    for (let i = 0; i < trendingArray.length; i++) {
        const credits = trendingArray[i][1];
        const GPA = trendingArray[i][2];
        const score = trendingArray[i][3];
        cumCredits += credits;
        cumGPA += credits * GPA;
        cumScore += credits * score;
        trendingArray[i].push(cumGPA / cumCredits);
        trendingArray[i].push(cumScore / cumCredits);
    }

    creditsDataset = Array.from(creditsMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map((cat) => [cat[0], cat[1].toFixed(1)]);
    recordDataset = trendingArray.map((sem) => [
        sem[0],
        sem[1].toFixed(1), // 学期学分数
        sem[2].toFixed(3), // 学期GPA
        sem[3].toFixed(2), // 学期平均分
        sem[4].toFixed(3), // 累积GPA
        sem[5].toFixed(2) // 累积平均分
    ]);
}

/**
 * 获取某个单元格的文本
 * @param {number} row 行下标
 * @param {number} index 列下标
 * @returns {string} 单元格文本
 */
function getCellValue(row, index) {
    return $(row).children('td').eq(index).text();
}

/**
 * 根据传入的列索引数组，返回一个依次比较各列的比较器函数
 * @param {Array} indexes 包含需要作为排序标准的列索引值，0-based, 顺序很重要
 * @returns 返回一个comparator function
 */
function comparator(indexes) {

    const compare = (valA, valB) => {
        if ($.isNumeric(valA) && $.isNumeric(valB)) {
            return valA - valB;
        }
        return valA.localeCompare(valB);
    };

    return function (a, b) {
        let ans = 0;

        for (const i in indexes) {
            let valA = getCellValue(a, i),
                valB = getCellValue(b, i);

            const r = compare(valA, valB);
            ans = ans || ((indexes[i] ? 1 : -1) * r);
            if (ans) break;
        }
        return ans;
    };
}

/**
 * 计算传入课程的总学分数，平均GPA，平均分
 * @param {number[][3]} scores 包含需要计算的每门课程的[学分，GPA，成绩]的float数组
 * @returns 返回一个含三个元素的数组，分别对应总学分数，平均GPA，平均分
 */
function calcGPA(scores) {
    let totalCredits = 0,
        totalGPA = 0;
        totalScore = 0,
    $(scores).each(function () {
        let credit = parseFloat($(this)[0]);
        let GPA = parseFloat($(this)[1]);
        let score = parseFloat($(this)[2]);

        if (score) {
            // if not NaN
            totalGPA += GPA * credit;
            totalScore += score * credit;
        }
        totalCredits += credit;
    });

    let GPAMean = 0,
        scoreMean = 0;

    if (totalCredits !== 0) {
        GPAMean = totalGPA / totalCredits;
        scoreMean = totalScore / totalCredits;
    }

    return [totalCredits.toFixed(1), GPAMean.toFixed(3), scoreMean.toFixed(3)];
}

/**
 * 计算某学年某学期的总学分数，平均GPA，平均分
 * @param {string} year 学年
 * @param {number} sem 整型数据，范围为[1, 3]，对应第几个学期
 * @returns 返回一个含三个元素的数组，分别对应学年学期总学分数，平均GPA，平均分
 */
function calcSemGPA(year, sem) {
    let scores = [];
    $('table:eq(1) tr:gt(0)').each(function () {
        if (
            $(this).find('td:eq(1)').text() === year &&
            parseInt($(this).find('td:eq(2)').text()) === sem
        ) {
            // 学分，GPA，成绩
            let row = [];
            if ($(this).find('input[name="x-course-select"]').is(':checked')) {
                $(this)
                    .find('td:eq(6), td:eq(8), td:eq(22)')
                    .each(function () {
                        row.push($.trim($(this).text()));
                    });
                scores.push(row);
            }
        }
    });

    return calcGPA(scores);
}

/**
 * 更新头部（总）成绩信息
 */
function updateHeaderScores() {
    let scores = [];
    $('table tr:gt(0)').each(function () {
        let row = [];
        if ($(this).find('input[name="x-course-select"]').is(':checked')) {
            $(this)
                .find('td:eq(6), td:eq(8), td:eq(22)')
                .each(function () {
                    row.push($.trim($(this).text()));
                });
            scores.push(row);
        }
    });

    let info = calcGPA(scores);

    $('#x-credits').text(info[0]);
    $('#x-gpa').text(info[1]);
    $('#x-average-score').text(info[2]);
}

/**
 * 更新每学期的成绩信息
 */
function updateSemScores() {
    let semCount = $('tr.x-sem-row').length;
    for (let i = 0; i < semCount; i++) {
        let scores = [];
        $('tr.x-sem-row')
            .eq(i)
            .nextUntil('tr.x-sem-row')
            .each(function () {
                let row = [];
                if ($(this).find('input[name="x-course-select"]').is(':checked')) {
                    $(this)
                        .find('td:eq(6), td:eq(8), td:eq(22)')
                        .each(function () {
                            row.push($.trim($(this).text()));
                        });
                    scores.push(row);
                }
            });
        let info = calcGPA(scores);
        $(`tr.x-sem-row:eq(${i}) span`).each(function (idx, _) {
            $(this).text(info[idx]);
        });
    }
}

/**
 * 更新界面上的所有成绩信息
 */
function updateAllScores() {
    if ($('input[name="x-course-select"]:checked').length > 0) {
        $('#x-sel-all').text('全不选');
    } else {
        $('#x-sel-all').text('全选');
    }
    updateHeaderScores();
    updateSemScores();
}

/********************************  图表  ************************************* */

/**
 * 绘制学分按课程类别分类的bar图，方便选课的时候用
 * @returns {echartInstance} 当前图像的示例对象
 */
function drawCreditsPlot() {
    // console.log(creditsDataset);
    var creditChart = echarts.init(document.getElementById('x-graph1'));

    let option = {
        animationDuration: 1000,
        title: {
            text: 'Credits by Category'
        },
        tooltip: {
            show: true
        },
        toolbox: {
            show: true,
            feature: {
                saveAsImage: {
                    title: 'Save'
                }
            },
            right: '8px'
        },
        dataset: [{
            dimensions: ['category', 'credits'],
            sourceHeader: false,
            source: creditsDataset /* .sort((a, b)=> a[0].length - b[0].length) */
        }],
        xAxis: {
            type: 'category',
            axisLabel: {
                show: true,
                rotate: 30
            }
        },
        yAxis: {
            type: 'value',
            name: 'credits'
        },
        series: [{
            name: 'Credits',
            type: 'bar',
            label: {
                show: true,
                position: 'top'
            }
        }]
    };

    creditChart.setOption(option);
    return creditChart;
}

/**
 * 绘制成绩随semester的趋势line图，娱乐用
 * @returns {echartInstance} 当前图像的实例
 */
function drawScoreTrendingPlot() {
    // console.log(recordDataset);
    var scoreChart = echarts.init(document.getElementById('x-graph2'));
    option = {
        animationDuration: 1000,
        title: { text: 'Scores Trending Plot' },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
        },
        toolbox: {
            show: true,
            feature: {
                saveAsImage: {
                    title: 'Save'
                }
            },
            right: '8px'
        },
        legend: {
            // orient: 'vertical',
            bottom: '80px',
            left: 'center'
        },
        dataset: {
            dimensions: [
                'sem',
                'semCredits',
                'semGPA',
                'semScore',
                'cumGPA',
                'cumScore'
            ],
            sourceHeader: false,
            source: recordDataset
        },
        xAxis: [{
            type: 'category',
            axisLabel: {
                show: true,
                rotate: 30
            },
            axisTick: {
                alignWithLabel: true
            }
        }],
        yAxis: [{
            type: 'value',
            name: 'GPA',
            min: 0,
            max: 4.0,
            position: 'left'
        },
        {
            type: 'value',
            name: 'Score',
            min: 55,
            max: 100,
            position: 'right'
        }
        ],
        series: [{
            name: '学期GPA',
            type: 'line',
            yAxisIndex: 0,
            encode: {
                x: 'sem',
                y: 'semGPA'
            }
        },
        {
            name: '累积GPA',
            type: 'line',
            yAxisIndex: 0,
            encode: {
                x: 'sem',
                y: 'cumGPA'
            }
        },
        {
            name: '学期平均分',
            type: 'line',
            yAxisIndex: 1,
            encode: {
                x: 'sem',
                y: 'semScore'
            }
        },
        {
            name: '累积平均分',
            type: 'line',
            yAxisIndex: 1,
            encode: {
                x: 'sem',
                y: 'cumScore'
            }
        }
        ]
    };
    scoreChart.setOption(option);
    scoreChart.on('legendselectchanged', function (params) {
        let cnt = 0,
            onlyKey = '';
        for (const [key, value] of Object.entries(params.selected)) {
            if (value) {
                cnt++;
                onlyKey = key;
            }
        }
        // there may be a more elegant way
        if (cnt !== 1) {
            scoreChart.setOption({
                series: [{
                    name: '学期GPA',
                    label: {
                        show: false
                    }
                },
                {
                    name: '累积GPA',
                    label: {
                        show: false
                    }
                },
                {
                    name: '学期平均分',
                    label: {
                        show: false
                    }
                },
                {
                    name: '累积平均分',
                    label: {
                        show: false
                    }
                }
                ]
            });
            return;
        }
        scoreChart.setOption({
            series: [{
                name: onlyKey,
                label: {
                    show: true
                }
            }]
        });
    });
    return scoreChart;
}