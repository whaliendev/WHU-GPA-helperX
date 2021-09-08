
$('#searchForm .chosen-select').first().val(0);
$('#searchForm .chosen-select').last().val(0);
$('.chosen-single span').text('全部');

/**
 * How to change the row num of jGrid
 * Ref: https://stackoverflow.com/questions/2224070/setting-jqgrid-rownum-dynamically
 */
$('#tabGrid').setGridParam({rowNum: 150});
$('select.ui-pg-selbox').val(150);

$('#search_go').trigger('click');








