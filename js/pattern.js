$(document).ready(function() {
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

	$(table_id).find("thead td").each(function() {
		key_list.push($(this).text());
	});

	$(table_id).find("tbody input").each(function() {
		value_list.push($(this).val());
	});

	var obj = { };
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

			var func1 = getElementValue("gishPattern", "vertices", "公司統一編號", outV);
			var func2 = getElementValue("gishPattern", "vertices", "公司統一編號", inV);

			$.when(func1, func2).done(function(response1, response2) {
				var inV_ID, outV_ID;
				$.each(response1[0]["results"], function(key, value) {
					outV_ID = value["_id"];
				});
				$.each(response2[0]["results"], function(key, value) {
					inV_ID = value["_id"];
				});
				$.when(createEdge("gishPattern", "edges", outV_ID, edge_label, inV_ID, obj)).done(function() {
					showAllElement();
				});
			});
		}
	}

}


$("#create_company_vertex").on("click", function() {
	$("#g").hide();
	createElementRequest($("#company_vertex_table"), "gishPattern", "vertices", "");
});

$("#create_transaction_edge").on("click", function() {
	$("#g").hide();
	createElementRequest($("#transaction_edge_table"), "gishPattern", "edges", "交易關係");
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
	var func = getElementValue("test", "vertices", "公司統一編號", obj["公司統一編號"]);

	$("#g").hide();
	$.when(func).then(function(response) {
		return deleteElement("test", "vertices", response["results"][0]["_id"]);
	}).then(function() {
		showAllElement();
	})
});

$("#delete_company_vertex").on("click", function() {
        var obj = getTableResult($("#company_vertex_table"));
        var func = getElementValue("gishPattern", "vertices", "公司統一編號", obj["公司統一編號"]);

        $("#g").hide();
        $.when(func).then(function(response) {
                return deleteElement("gishPattern", "vertices", response["results"][0]["_id"]);
        }).then(function() {
                showAllElement();
        })
});



$("#delete_by_id").on("click", function() {
	$("#g").hide();
	var obj = getTableResult($("#delete_table"));
	$.when(deleteElement("gishPattern", "vertices", obj["id"])).then(function() {
		showAllElement();
	});
});


$("#delete_by_id").on("click", function() {
        $("#g").hide();
        var obj = getTableResult($("#delete_table"));
        $.when(deleteElement("test", "vertices", obj["id"])).then(function() {
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


function readFromDB(){
	var r = {'vertices':[], 'edges':[]};
	['vertices', 'edges'].forEach(function(element_type) {
		var func = getAllElement('test', element_type);
		$.when(func).then(function(response) {
			$.each(response["results"], function(key, value) {
				r[element_type].push(value);
				//console.log(value);
			});
		});
	});
	
	setTimeout(function() {
		$("#result").append(JSON.stringify(r));
		importJSON();		
	}, 100);	
}

function readFromGISHDB(){
        var r = {'vertices':[], 'edges':[]};
        ['vertices', 'edges'].forEach(function(element_type) {
                var func = getAllElement('gishPattern', element_type);
                $.when(func).then(function(response) {
                        $.each(response["results"], function(key, value) {
                                r[element_type].push(value);
                                //console.log(value);
                        });
                });
        });

        setTimeout(function() {
                $("#result").append(JSON.stringify(r));
                importJSON();
        }, 100);
}









function showAllElement() {
	$("#result").empty();
	insertAllElement("gishPattern", "vertices");
	insertAllElement("gishPattern", "edges");
}
