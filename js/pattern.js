$(document).ready(function() {
	addGraphList($("#pattern_graph_list"));
	newElementTable($("#company_vertex_table"), vertex_list);
	newElementTable($("#transaction_edge_table"), edge_list);
});

function newElementTable(table_id, property_list) {
	$(table_id).append("<thead><tr></tr></thead><tbody><tr></tr></tbody>");
	$.each(property_list, function(key, value) {
		$(table_id).find("thead tr").append("<th>" + value + "</th>");
		$(table_id).find("tbody tr").append("<td class='ui form'><input type='text' class='field'></td>");
	});
}


$("#show_create_company_vertex").on("click", function() {
	$("#g").hide();
	$(".new_company_vertex").toggle();
});

$("#show_create_transaction_edge").on("click", function() {
	$("#g").hide();
	$(".new_transaction_edge").toggle();
});

$("#show_delete_by_id").on("click", function() {
	$("#g").hide();
	$(".delete_element").toggle();
});

function getTableResult(table_id) {
	var key_list = [];
	var value_list = [];

	$(table_id).find("thead th").each(function() {
		key_list.push($(this).text());
	});

	$(table_id).find("tbody input").each(function() {
		value_list.push($(this).val());
	});

	var obj = {};
	for ( i = 0; i < key_list.length; i++) {
		if (value_list[i].trim() != "") {
			obj[key_list[i].trim()] = value_list[i].trim();
		}
	}
	return obj;
}

function createElementRequest(table_id, graph_name, element_type, edge_label) {

	var obj = getTableResult(table_id);
	console.log(obj);

	if (!$.isEmptyObject(obj)) {
		if (element_type == "vertices") {
			$.when(createVertex(graph_name, element_type, obj)).done(function() {
				showAllElement();
			});

		} else if (element_type == "edges") {
			var outV = obj["賣家(統編)"];
			var inV = obj["買家(統編)"];

			var func1 = getElementValue("target_graph", "vertices", "公司統一編號", outV);
			var func2 = getElementValue("target_graph", "vertices", "公司統一編號", inV);

			$.when(func1, func2).done(function(response1, response2) {
				var inV_ID, outV_ID;
				$.each(response1[0]["results"], function(key, value) {
					outV_ID = value["_id"];
				});
				$.each(response2[0]["results"], function(key, value) {
					inV_ID = value["_id"];
				});
				$.when(createEdge("target_graph", "edges", outV_ID, edge_label, inV_ID, obj)).done(function() {
					showAllElement();
				});
			});
		}
	}

}


$("#create_company_vertex").on("click", function() {
	$("#g").hide();
	createElementRequest($("#company_vertex_table"), "target_graph", "vertices", "");
});

$("#create_transaction_edge").on("click", function() {
	$("#g").hide();
	createElementRequest($("#transaction_edge_table"), "target_graph", "edges", "交易關係");
});

function insertAllElement(graph_name, element_type) {
	var func = getAllElement(graph_name, element_type);
	return $.when(func).then(function(response) {
		$.each(response["results"], function(key, value) {
			$("#result").append(element_type + key + ":" + JSON.stringify(value) + "<br>");
		});
	});
}


$("#delete_company_vertex").on("click", function() {
	var obj = getTableResult($("#company_vertex_table"));
	var func = getElementValue("input_graph", "vertices", "公司統一編號", obj["公司統一編號"]);

	$("#g").hide();
	$.when(func).then(function(response) {
		return deleteElement("input_graph", "vertices", response["results"][0]["_id"]);
	}).then(function() {
		showAllElement();
	})
});

$("#gish_delete_company_vertex").on("click", function() {
	var obj = getTableResult($("#company_vertex_table"));
	var func = getElementValue("target_graph", "vertices", "公司統一編號", obj["公司統一編號"]);

	$("#g").hide();
	$.when(func).then(function(response) {
		return deleteElement("target_graph", "vertices", response["results"][0]["_id"]);
	}).then(function() {
		showAllElement();
	})
});

$("#gish_delete_by_id").on("click", function() {
	$("#g").hide();
	var obj = getTableResult($("#delete_table"));
	$.when(deleteElement("target_graph", "vertices", obj["ID"])).then(function() {
		showAllElement();
	});
});

$("#delete_by_id").on("click", function() {
	$("#g").hide();
	var obj = getTableResult($("#delete_table"));
	$.when(deleteElement("input_graph", "vertices", obj["ID"])).then(function() {
		showAllElement();
	});
});

$("#show_pattern").on("click", function() {
	$("#result").empty();
	$("#g").show();

	readFromDB();
});

$("#gishshow_pattern").on("click", function() {
	$("#result").empty();
	$("#g").show();
	readFromGISHDB();
});

$("#match_graph").on("click", function() {
	$("#result").empty();
	$("#g").show();
	readGraph("match_graph");
});

function readFromDB() {

	$(".pattern").hide();

	$('#g').attr('db_name', 'input_graph');
	var r = {
		'vertices' : [],
		'edges' : []
	};
	var func1 = getAllElement('input_graph', 'vertices');
	var func2 = getAllElement('input_graph', 'edges');
	$.when(func1, func2).done(function(response1, response2) {
		$.each(response1[0]["results"], function(key, value) {
			r['vertices'].push(value);
		});
		$.each(response2[0]["results"], function(key, value) {
			r['edges'].push(value);
		});
		$("#result").append(JSON.stringify(r));
		importJSON();
	});
}

function readFromGISHDB() {
	$('#g').attr('db_name', 'target_graph');
	var r = {
		'vertices' : [],
		'edges' : []
	};
	var func1 = getAllElement('target_graph', 'vertices');
	var func2 = getAllElement('target_graph', 'edges');
	$.when(func1, func2).done(function(response1, response2) {
		$.each(response1[0]["results"], function(key, value) {
			r['vertices'].push(value);
		});
		$.each(response2[0]["results"], function(key, value) {
			r['edges'].push(value);
		});
		$("#result").append(JSON.stringify(r));
		importJSON();
	});

	$(".pattern").show();
}

function readGraph(graph_name) {

	$('#g').attr('db_name', graph_name);
	var r = {
		'vertices' : [],
		'edges' : []
	};
	var func1 = getAllElement(graph_name, 'vertices');
	var func2 = getAllElement(graph_name, 'edges');
	$.when(func1, func2).done(function(response1, response2) {
		$.each(response1[0]["results"], function(key, value) {
			r['vertices'].push(value);
		});
		$.each(response2[0]["results"], function(key, value) {
			r['edges'].push(value);
		});
		$("#result").append(JSON.stringify(r));
		importJSON();
	});

	$(".pattern").show();
}


$("#delete_vertex").on("click", function() {
	var confirm_delete = confirm("確認是否清除所有Vertex");
	if (confirm_delete) {
		var func = executeGremlinScript("target_graph", "g.V.remove()");
		$.when(func).then(function() {
			$("#result").empty();
			$("#g").show();
			readFromGISHDB();
		});
	}
});

$("#delete_edge").on("click", function() {
	var confirm_delete = confirm("確認是否清除所有Edge");
	if (confirm_delete) {
		var func = executeGremlinScript("target_graph", "g.E.remove()");
		$.when(func).then(function() {
			$("#result").empty();
			$("#g").show();
			readFromGISHDB();
		});
	}
});

$("#match").on("click", function() {
	$("#match_graph").attr("disabled", true);
	var func = executeGremlinScript("match_graph", "g.V.remove()");
	$.when(func).then(function() {
		$("#match_loading").show();
		return executeGremlinScript("match_graph", "matchGraph(graph('cht_5000'),graph('target_graph'),g)");
	}).then(function() {
		$("#match_loading").hide();
		$("#match_graph").attr("disabled", false);
	});
});

function showAllElement() {
	$("#result").empty();
	insertAllElement("target_graph", "vertices");
	insertAllElement("target_graph", "edges");
}
