let faculty = '';

$.ajaxSetup({
  dataFilter: function (data, type) {
    const response = JSON.parse(data);
    if (
      response['items'] &&
      response['items'][0] &&
      response['items'][0]['jgmc']
    )
      faculty = response['items'][0]['jgmc'];
    return data;
  }
});

$(document).ajaxComplete(customDynamicUI);

/**
 * 触发查询按钮，获取全部成绩
 */
(function fetchScores() {
  $('#searchForm .chosen-select').first().val('');
  $('#searchForm .chosen-select').last().val('');
  $('.chosen-single span').text('全部');

  /**
   * How to change the row num of jGrid
   * Ref: https://stackoverflow.com/questions/2224070/setting-jqgrid-rownum-dynamically
   */
  $('#tabGrid').setGridParam({ rowNum: 150 });
  $('select.ui-pg-selbox').val(150);

  $('#search_go').trigger('click');
})();

/**
 * 配置成绩表格选项框
 */
function customDynamicUI() {
  $('#jqgh_tabGrid_kch')
    .contents()
    .filter(function () {
      return this.nodeType === 3;
    })
    .replaceWith('选择');

  const catsList = [];

  $('table:eq(1) tr:gt(0)').each(function () {
    const score = parseFloat($(this).find('td:eq(7)').text());
    if (score >= 60.0) {
      $(this)
        .find('td:eq(3)')
        .html(
          `<input type="checkbox" name="course-select" checked="checked" />`
        );

      const courseCat = $.trim($(this).find('td:eq(5)').text());
      const courseIns = $.trim($(this).find('td:eq(12)').text());
      //   console.log(courseCat, courseIns);
      if (faculty && courseCat.startsWith('专业') && courseIns !== faculty) {
        $(this)
          .find('td:eq(5)')
          .text('跨院' + courseCat);
      }
      catsList.push($.trim($(this).find('td:eq(5)').text()));
    } else {
      $(this)
        .find('td:eq(3)')
        .html(`<input type="checkbox" name="course-select" />`);
    }
  });
  if ($('#x-sel-all').length === 0) {
    customStaticUI(catsList);
  }
  sortScores();
}

/**
 * 配置选项按钮，选项多选框等静态控件
 * @param {Array} catsList 未去重课程类别列表。因为配置动态UI可能会执行多次，所以不在配置动态UI进行去重
 */
function customStaticUI(catsList) {
  $('#topButton')[0].onclick = null;
  $('#search_go').before(`
        <button class="x-button btn btn-primary btn-sm" id="x-sel-all">全选</button>
        <button class="x-button btn btn-primary btn-sm" id="x-sel-rev">反选</button>
        <button class="x-button btn btn-primary btn-sm" id="x-sel-revert">复原</button>
        <button class="x-button btn btn-primary btn-sm" id="x-show-graph">图表</button>
    `);

  const unique = [...new Set(catsList)].sort((a, b) => a.localeCompare(b));
  //   console.log(unique);
  let catContent = '';
  for (let i = 0; i < unique.length; i++) {
    catContent += `
            <div class="x-check-wrapper">
                <label for="cat${i}">${unique[i]}</label>
                <input type="checkbox" name="selbox" value="${unique[i]}" id="cat${i}" checked>
            </div>
        `;
  }
  //   console.log(catContent);
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
                    <strong>总学分数：</strong><span class="x-info" id="credits">0.0</span>
                </div>
                <div class="x-info-wrapper">
                    <strong>平均GPA：</strong><span class="x-info" id="gpa">0.000</span>
                </div>
                <div class="x-info-wrapper">
                    <strong>平均成绩：</strong><span class="x-info" id="average-score">0.00</span>
                </div>
            </div>
        </div>
    `);
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

function comparator(indexes) {
  return function (a, b) {
    let ans = 0;
    // console.log(indexes);
    for (let i = 0; i < indexes.length; i++) {
      let valA = getCellValue(a, indexes[i]),
        valB = getCellValue(b, indexes[i]);
      //   console.log($.isNumeric(valA), valB);
      if ($.isNumeric(valA) && $.isNumeric(valB)) {
        ans = ans || valA - valB;
      } else {
        ans = ans || valA.localeCompare(valB);
      }
      if (ans) break;
    }
    return ans;
  };
}

function calcGPA(scores) {
  let totalScore = 0,
    totalCredits = 0,
    totalGPA = 0;
  $(scores).each(function () {
    let credit = parseFloat($(this)[0]);
    let score = parseFloat($(this)[1]);
    let GPA = parseFloat($(this)[2]);
    // if not NaN
    if (score) {
      totalScore += score * credit;
      totalGPA += GPA * credit;
    }
    totalCredits += credit;
  });
  //   console.log([totalCredits, totalGPA / totalCredits, totalScore / totalCredits]);
  return [
    totalCredits.toFixed(1),
    (totalGPA / totalCredits).toFixed(3),
    (totalScore / totalCredits).toFixed(2)
  ];
}

function calcSemGPA(year, sem) {
  let scores = [];
  $('table:eq(1) tr:gt(0)').each(function () {
    // console.log($(this).find('td:eq(1)').text(), year);
    // console.log(parseInt($(this).find('td:eq(2)').text()), sem);
    if (
      $(this).find('td:eq(1)').text() === year &&
      parseInt($(this).find('td:eq(2)').text()) === sem
    ) {
      //   console.log('enter');
      // 学分，成绩，GPA
      let row = [];
      if ($(this).find('input[name="course-select"]').is(':checked')) {
        // console.log($(this[0]));
        $(this)
          .find('td:eq(6), td:eq(7), td:eq(9)')
          .each(function () {
            row.push($.trim($(this).text()));
          });
        scores.push(row);
      }
    }
  });

  return calcGPA(scores);
}

function updateHeaderScores() {
  let scores = [];
  $('table tr:gt(0)').each(function () {
    let row = [];
    if ($(this).find('input[name="course-select"]').is(':checked')) {
      $(this)
        .find('td:eq(6), td:eq(7), td:eq(9)')
        .each(function () {
          row.push($.trim($(this).text()));
        });
      scores.push(row);
    }
  });

  let info = calcGPA(scores);

  $('#credits').text(info[0]);
  $('#gpa').text(info[1]);
  $('#average-score').text(info[2]);
}

function updateSemScores() {
  let semCount = $('tr.x-sem-row').length;
  for (let i = 0; i < semCount; i++) {
    let scores = [];
    $('tr.x-sem-row')
      .eq(i)
      .nextUntil('tr.x-sem-row')
      .each(function () {
        let row = [];
        if ($(this).find('input[name="course-select"]').is(':checked')) {
          $(this)
            .find('td:eq(6), td:eq(7), td:eq(9)')
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

function updateAllScores() {
  updateHeaderScores();
  updateSemScores();
}

function sortScores() {
  let rows = $('table:eq(1)')
    .find('tr:gt(0)')
    .toArray()
    .sort(comparator([1, 2, 5]));
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
                ${year}学年&nbsp;&nbsp;第 ${sem} 学期&nbsp;&nbsp;&nbsp;&nbsp;
                学分数：<span>${semGPA[0]}</span>&nbsp;&nbsp;&nbsp;&nbsp;
                平均GPA：<span color>${semGPA[1]}</span>&nbsp;&nbsp;&nbsp;&nbsp;
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

function bindEvents() {
    $('input[name="course-select"]').change(()=> updateAllScores());
}
