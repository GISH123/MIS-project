$(document).ready(function() {
	addGraphList($("#search_graph_list"));
	addSelectProperty("#select_property1");
	buildTable("vertices", vertex_list);
	buildTable("edges", edge_list);
});

function addSelectProperty(selector) {
	$(selector).append("<option disabled>公司資料</option>");
	$.each(vertex_list, function(key, value) {
		$(selector).append("<option class='vertex' value='" + value + "'>&nbsp&nbsp&nbsp&nbsp" + value + "</option>");
	});
	$(selector).append("<option disabled>交易關係</option>");
	$.each(edge_list, function(key, value) {
		$(selector).append("<option class='edge' value='" + value + "'>&nbsp&nbsp&nbsp&nbsp" + value + "</option>");
	});
}

/*
 var row = 1;

 $("#add_row").on("click", function() {
 row++;
 $("#row" + row).html("<td><select id='select_property" + row + "'></select></td><td><input type='text' id='property" + row + "'></td>");
 addSelectProperty("#select_property" + row);
 $("#table_property").append("<tr id='row" + (row + 1) + "'></tr>");
 });

 $("#delete_row").on("click", function() {
 if (row > 1) {
 $("#row" + row).empty();
 row--;
 }
 });
 */

$(".search_submit").on("click", function() {
	if ($("#text_property1").val().trim() != "") {
		var element_type, search_type;
		if ($("#select_property1 :selected").hasClass("vertex")) {
			element_type = "vertices";
		} else {
			element_type = "edges";
		}
		if ($(this).text().trim() == "Search") {
			search_type = "equal";
		} else {
			search_type = "similar";
		}
		searchResult($("#search_graph_list :selected").val(), element_type, $("#select_property1 :selected").val(), $("#text_property1").val().trim(), search_type);
	}
});

function buildTable(element_type, list) {
	var selector;
	if (element_type == "vertices") {
		selector = $("#vertex_result");
	} else {
		selector = $("#edge_result");
	}
	$(selector).append("<thead><tr></tr></thead>").append("<tfoot><tr></tr></tfoot>");
	$.each(list, function(key, value) {
		$(selector).find("thead tr").append("<th>" + value + "</th>");
		$(selector).find("tfoot tr").append("<th>" + value + "</th>");
	});
}

function setColumn(list) {
	var columns = [];
	$.each(list, function(key, value) {
		columns.push({
			"data" : value,
			"defaultContent" : ""
		});
	});
	return columns;
};

function addTableResult(selector, data, columns) {
	$(selector).DataTable({
		destroy : true,
		data : data,
		columns : columns,
		initComplete : function() {
			this.api().columns().every(function() {
				var column = this;
				var select = $('<select><option value=""></option></select>').appendTo($(column.footer()).empty()).on('change', function() {
					var val = $.fn.dataTable.util.escapeRegex($(this).val());
					column.search( val ? '^' + val + '$' : '', true, false).draw();
				});
				column.data().unique().sort().each(function(d, j) {
					select.append('<option value="' + d + '">' + d + '</option>')
				});
			});
		}
	});
}

function searchResult(graph_name, element_type, key, value, search_type) {

	$("button").attr("disabled", true);
	$(".search_result").hide();
	$("#search_loading").show();

	var func;
	if (search_type == "equal") {
		var func = getElementValue(graph_name, element_type, key, value);
	} else {
		if (element_type == "vertices") {
			func = executeGremlinScript(graph_name, "g.V.has('" + key + "', REGEX , '.*(" + value + ").*' )");
		} else {
			func = executeGremlinScript(graph_name, "g.E.has('" + key + "', REGEX , '.*(" + value + ").*' )");
		}
	}
	func.done(function(response) {
		if (element_type == "vertices") {
			$(".vertex_result").show();
			addTableResult($("#vertex_result"), response["results"], setColumn(vertex_list));
		} else if (element_type == "edges") {
			$(".edge_result").show();
			addTableResult($("#edge_result"), response["results"], setColumn(edge_list));
		}
	}).always(function() {
		$("button").attr("disabled", false);
		$("#search_loading").hide();
	});

}
