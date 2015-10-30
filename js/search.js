var vertex_list = ["公司統一編號", "公司名稱", "營業人姓名", "行業代碼", "組織別", "時間戳記", "分支機構", "總機構統一編號"];
var edge_list = ["買家(統編)", "賣家(統編)", "發票統編", "商品名稱", "時間", "總金額", "數量", "單價", "發票細項序號"];

$(document).ready(function() {
	getGraphList($("#search_graph_list"));
	makeTable("vertex", vertex_list);
	makeTable("edge", edge_list);
});

addSelectProperty("#select_property1");

function addSelectProperty(tag) {
	$(tag).append("<option disabled>公司</option>");
	$.each(vertex_list, function(key, value) {
		$(tag).append("<option class='vertex' value='" + value + "'>&nbsp&nbsp&nbsp&nbsp" + value + "</option>");
	});
	$(tag).append("<option disabled>交易關係</option>");
	$.each(edge_list, function(key, value) {
		$(tag).append("<option class='edge' value='" + value + "'>&nbsp&nbsp&nbsp&nbsp" + value + "</option>");
	});
}

var row = 1;

$("#add_row").on("click", function() {
	row++;
	$("#row" + row).html("<td class='text-center' style='vertical-align: middle'>" + row + "</td><td><select class='form-control' id='select_property" + row + "'></select></td><td><input type='text' class='form-control' id='property" + row + "'></td>");
	addSelectProperty("#select_property" + row);
	$("#table_property").append("<tr id='row" + (row + 1) + "'></tr>");
});

$("#delete_row").on("click", function() {
	if (row > 1) {
		$("#row" + row).empty();
		row--;
	}
});

$("#clear_search_text").on("click", function() {
	$("input[type=text]").val("");
});

$("#search_submit").on("click", function() {
	var i = 1;
	if ($("#text_property" + i).val().trim() == "") {
		alert("請重新輸入");
	} else {
		var select_property = $("#select_property" + i + " :selected");
		while (i <= row) {
			if (select_property.hasClass("vertex")) {
				search($("#search_graph_list :selected").val(), "vertices", select_property.val(), $("#text_property" + i).val().trim());
			} else {
				search($("#search_graph_list :selected").val(), "edges", select_property.val(), $("#text_property" + i).val().trim());
			}
			i++;
		}
	}
});

function makeTable(type, list) {
	var id;
	if (type == "vertex") {
		id = $("#vertex_result");
	} else if (type == "edge") {
		id = $("#edge_result");
	}
	$(id).append("<thead><tr></tr></thead>");
	$.each(list, function(key, value) {
		$(id).find("thead tr").append("<th class='text-center'>" + value + "</th>");
	});
}

function getColumn(list) {
	var columns = [];
	$.each(list, function(key, value) {
		if (value == "總機構統一編號") {
			columns.push({
				"data" : value,
				"defaultContent" : ""
			});
		} else {
			columns.push({
				"data" : value
			});
		}
	});
	return columns;
};

function addTableResult(table, data, columns) {
	$(table).DataTable({
		destroy : true,
		data : data,
		columns : columns
	});
}

function search(graph_name, type, key, value) {
	$.ajax({
		url : baseurl + graph_name + "/" + type + "?key=" + key + "&value=" + value,
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		success : function(response) {
			if (type == "vertices") {
				$(".vertex_result").show();
				addTableResult($("#vertex_result"), response["results"], getColumn(vertex_list));
			} else if (type == "edges") {
				$(".edge_result").show();
				addTableResult($("#edge_result"), response["results"], getColumn(edge_list));
			}
		},
		beforeSend : function() {
			$(".search_result").hide();
			$("#search_submit").attr("disabled", true);
			$("#search_loadingIMG").show();
		},
		complete : function() {
			//$(".search_result").show();
			$("#search_submit").attr("disabled", false);
			$("#search_loadingIMG").hide();
		},
		error : function(xhr) {
			alert("Wrong");
		}
	});
}