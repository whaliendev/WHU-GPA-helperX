$('#searchForm .chosen-select').first().val('');
$('#searchForm .chosen-select').last().val('');
$('.chosen-single span').text('全部');

/**
 * How to change the row num of jGrid
 * Ref: https://stackoverflow.com/questions/2224070/setting-jqgrid-rownum-dynamically
 */
$('#tabGrid').setGridParam({ rowNum: 150, autoWidth: false });
$('select.ui-pg-selbox').val(150);

$('#search_go').trigger('click');

function customDynamicUI() {
  $('#jqgh_tabGrid_xqmmc')
    .contents()
    .filter(function () {
      return this.nodeType === 3;
    })
    .replaceWith('选择');

  $('table:eq(1) tr:gt(0)').each(function () {
    if (parseFloat($(this).find('td:eq(7)').text()) >= 60.0) {
      $(this)
        .find('td:eq(2)')
        .html(`<input type="checkbox" id="course-select" checked="checked" />`);
    } else {
      $(this)
        .find('td:eq(2)')
        .html(`<input type="checkbox" id="course-select" />`);
    }
  });
}

$(document).ajaxComplete(customDynamicUI);

$('#search_go').before(`
    <button class="x-button btn btn-primary btn-sm" id="x-sel-all">全选</button>
    <button class="x-button btn btn-primary btn-sm" id="x-sel-rev">反选</button>
    <button class="x-button btn btn-primary btn-sm" id="x-show-graph">图表</button>
`);

$('#btn_sortSetting').before(`
    <div class="x-controls-container">
        <div class="x-select">
            <label for="" class="x-hint">请选择计算项：</label>
            <div class="x-container">
                <div class="x-check-container">
                    <div class="x-check-wrapper">
                        <label for="cat1">公共必修</label>
                        <input type="checkbox" name="selbox" value="公共必修" id="cat1">
                    </div>
                    <div class="x-check-wrapper">
                        <label for="cat2">公共选修</label>
                        <input type="checkbox" name="selbox" value="公共选修" id="cat2">
                    </div>
                    <div class="x-check-wrapper">
                        <label for="cat3">专业教育必修</label>
                        <input type="checkbox" name="selbox" value="专业教育必修" id="cat3">
                    </div>
                    <div class="x-check-wrapper">
                        <label for="cat4">专业教育选修</label>
                        <input type="checkbox" name="selbox" value="专业教育选修" id="cat4">
                    </div>
                    <div class="x-check-wrapper">
                        <label for="cat5">公共基础必修</label>
                        <input type="checkbox" name="selbox" value="公共基础必修" id="cat5">
                    </div>
                    <div class="x-check-wrapper">
                        <label for="cat6">通识教育选修</label>
                        <input type="checkbox" name="selbox" value="通识教育选修" id="cat6">
                    </div>
                </div>
            </div>
        </div>
        <div class="x-show-info">
            <div class="x-info-wrapper">
                <strong>总学分数：</strong><span class="x-info">140.0</span>
            </div>
            <div class="x-info-wrapper">
                <strong>总GPA：</strong><span class="x-info">3.859</span>
            </div>
            <div class="x-info-wrapper">
                <strong>选中课程GPA：</strong><span class="x-info">3.929</span>
            </div>
        </div>
    </div>
`);
