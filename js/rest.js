var baseurl = "http://140.119.19.14:8182/graphs/";

function getGraphList() {
	return $.ajax({
		url : baseurl,
		contentType : "application/json; charset=utf-8",
		dataType : "json"
	});
}

function getAllElement(graph_name, element_type) {
	return $.ajax({
		url : baseurl + graph_name + "/" + element_type,
		contentType : "application/json; charset=utf-8",
		dataType : "json"
	});
}

function getElementValue(graph_name, element_type, key, value) {
	return $.ajax({
		url : baseurl + graph_name + "/" + element_type + "?key=" + key + "&value=" + value,
		contentType : "application/json; charset=utf-8",
		dataType : "json"
	});
}

function getGremlinScript(graph_name, script) {
	return $.ajax({
		url : baseurl + graph_name + "/tp/gremlin?script=" + script,
		contentType : "application/json; charset=utf-8",
		dataType : "json"
	});
}

function createVertex(graph_name, element_type, key_value_list) {

	var script = "";
	$.each(key_value_list, function(key, value) {
		script += (key + "=" + value + "&");
	});
	script = script.substring(0, script.length - 1).trim();

	return $.ajax({
		url : baseurl + graph_name + "/" + element_type + "/10000?" + script,
		contentType : "text/html; charset=utf-8",
		type : "POST",
		success : function(response) {
			alert("新增資料成功");
		},
		error : function(xhr) {
			alert("新增資料失敗");
		}
	});
}

function createEdge(graph_name, element_type, outV, edge_label, inV, key_value_list) {

	var script = "_outV=" + outV + "&_label=" + edge_label + "&_inV=" + inV + "&";
	$.each(key_value_list, function(key, value) {
		script += (key + "=" + value + "&");
	});
	script = script.substring(0, script.length - 1).trim();

	return $.ajax({
		url : baseurl + graph_name + "/" + element_type + "/10000?" + script,
		contentType : "text/html; charset=utf-8",
		type : "POST",
		success : function(response) {
			alert("新增資料成功");
		},
		error : function(xhr) {
			alert("新增資料失敗");
		}
	});
}

function deleteElement(graph_name, element_type, id) {
	return $.ajax({
		url : baseurl + graph_name + "/" + element_type + "/" + id,
		contentType : "text/html; charset=utf-8",
		type : "DELETE",
		success : function(response) {
			alert("刪除資料成功");
		},
		error : function(xhr) {
			alert("刪除資料失敗");
		}
	});

}
