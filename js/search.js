$(document).ready(function() {
	addGraphList($("#search_graph_list"));
	makeTable("vertex", vertex_list);
	makeTable("edge", edge_list);
});

function addSelectProperty(select_id) {
	$(select_id).append("<option disabled>公司</option>");
	$.each(vertex_list, function(key, value) {
		$(select_id).append("<option class='vertex' value='" + value + "'>&nbsp&nbsp&nbsp&nbsp" + value + "</option>");
	});
	$(select_id).append("<option disabled>交易關係</option>");
	$.each(edge_list, function(key, value) {
		$(select_id).append("<option class='edge' value='" + value + "'>&nbsp&nbsp&nbsp&nbsp" + value + "</option>");
	});
}

addSelectProperty("#select_property1");

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
	if ($("#text_property" + i).val().trim() != "") {
		var select_property = $("#select_property" + i + " :selected");
		while (i <= row) {
			if (select_property.hasClass("vertex")) {
				searchResult($("#search_graph_list :selected").val(), "vertices", select_property.val(), $("#text_property" + i).val().trim(), "equality");
			} else {
				searchResult($("#search_graph_list :selected").val(), "edges", select_property.val(), $("#text_property" + i).val().trim(), "equality");
			}
			i++;
		}
	}
});

$("#fuzzy_search_submit").on("click", function() {
	var i = 1;
	if ($("#text_property" + i).val().trim() != "") {
		var select_property = $("#select_property" + i + " :selected");
		while (i <= row) {
			if (select_property.hasClass("vertex")) {
				searchResult($("#search_graph_list :selected").val(), "vertices", select_property.val(), $("#text_property" + i).val().trim(), "fuzzy");
			} else {
				searchResult($("#search_graph_list :selected").val(), "edges", select_property.val(), $("#text_property" + i).val().trim(), "fuzzy");
			}
			i++;
		}
	}
});

function makeTable(element_type, list) {
	var id;
	if (element_type == "vertex") {
		id = $("#vertex_result");
	} else if (element_type == "edge") {
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
		columns.push({
			"data" : value,
			"defaultContent" : ""
		});
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

function searchResult(graph_name, element_type, key, value, search_type) {

	$(".search_result").hide();
	$(".search_submit").attr("disabled", true);
	$("#search_loadingIMG").show();
	
	var func;
	if (search_type == "equality") {
		var func = getElementValue(graph_name, element_type, key, value);
	} else {
		if (element_type == "vertices") {
			func = getGremlinScript(graph_name, "g.V.has('" + key + "', REGEX , '.*" + value + ".*' )");
		} else {
			func = getGremlinScript(graph_name, "g.E.has('" + key + "', REGEX , '.*" + value + ".*' )");
		}
	}
	func.done(function(response) {
		if (element_type == "vertices") {
			$(".vertex_result").show();
			addTableResult($("#vertex_result"), response["results"], getColumn(vertex_list));
		} else if (element_type == "edges") {
			$(".edge_result").show();
			addTableResult($("#edge_result"), response["results"], getColumn(edge_list));
		}
	}).fail(function() {
	}).always(function() {
		$(".search_submit").attr("disabled", false);
		$("#search_loadingIMG").hide();
	});

}
