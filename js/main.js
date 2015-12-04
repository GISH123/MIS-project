var vertex_list = ["公司統一編號", "公司名稱", "營業人姓名", "行業代碼", "組織別", "時間戳記", "分支機構", "總機構統一編號"];
var edge_list = ["買家(統編)", "賣家(統編)", "發票統編", "商品名稱", "時間", "總金額", "數量", "單價", "發票細項序號"];

$(document).on("click", function () {
	$('.menu .item').tab();
});
$(document).on("click", '.menu .item', function () {
	$('.ui.labeled.icon.sidebar')
		.sidebar('setting', 'transition', 'overlay')
		.sidebar('toggle');
});

$(document).ready(function () {
	$("#t1").load("html/home.html");
});

$(document).on("click", "#menu a", function () {
	switch ($(this).attr("id")) {
		case "home":
			$("#t1").load("html/home.html");
			break;
		case "pattern":
			$("#t2").load("html/pattern.html");
			$.getScript("js/pattern.js");
			break;
		case "search_property":
			$("#t3").load("html/search.html");
			$.getScript("js/search.js");
			break;
		case "gremlin_code":
			$("#t4").load("html/gremlin.html");
			$.getScript("js/gremlin.js");
			break;
		case "vis":
			$("#t5").load("html/vis.html");
			$.getScript("js/parser.js");
			$.getScript("js/gexfd3.js");
			$.getScript("js/force_direct.js");
			break;
	}
});

$.ajaxSetup({
	cache: false
});

function addGraphList(id) {
	var func = getGraphList();
	func.done(function (response) {
		$.each(response["graphs"], function (key, value) {
			$(id).append("<option value='" + value + "'>" + value + "</option>");
		});
	}).fail(function () {
		$(id).append("<option>Cannot load graph.</option>");
	});
}

