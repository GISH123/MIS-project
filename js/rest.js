/**
 * ### 提供與 Titan 溝通的一些方法
 *
 * @class Restful-API-method
 */

var baseurl = "http://140.119.19.14:8182/graphs/";

/**
 * 取得 Titan Graph DataBase 列表
 *
 * @method getGraphList
 * @return {Object} 
 * @example
 ```json
 {
	version: "2.6.0",
	name: "Rexster: A Graph Server",
	graphs: [
		"cht_5000",
		"target_graph",
		"match_graph"
	],
	queryTime: 0.231863,
	upTime: "0[d]:10[h]:35[m]:20[s]"
 }
 ```
 */
function getGraphList() {
	return $.ajax({
		url: baseurl,
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	});
}

/**
 * 取得某 Titan Graph DataBase 全部的元素 
 *
 * @method getAllElement
 * @param  {String} graph_name Name of graph
 * @param  {String} element_type Can only be "vertices" or "edges"
 * @return {Object} 
 * @example getAllElement(graph_name, "edges")
 ```json
{
  "version": "2.6.0",
  "results": [
    {
      "賣家(統編)": "!1",
      "買家(統編)": "!2",
      "_id": "syjgg-iagao-abdh-iaghs",
      "_type": "edge",
      "_outV": 30720768,
      "_inV": 30721024,
      "_label": "交易關係"
    }
  ],
  "totalSize": 1,
  "queryTime": 5.19161
}
 ``` 
 * @example getAllElement(graph_name, "vertices")
 ```json
{
  "version": "2.6.0",
  "results": [
    {
      "公司統一編號": "!2",
      "_id": 30721024,
      "_type": "vertex"
    },
    {
      "公司統一編號": "!1",
      "_id": 30720768,
      "_type": "vertex"
    }
  ],
  "totalSize": 2,
  "queryTime": 5.239591
}
 ```
 */
function getAllElement(graph_name, element_type) {
	return $.ajax({
		url: baseurl + graph_name + "/" + element_type,
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	});
}

/**
 * 用特定 key-value 取得某 Graph DataBase 的元素 
 *
 * @method getElementValue
 * @param  {String} graph_name Name of graph
 * @param  {String} element_type Can only be "vertices" or "edges"
 * @param  {String} key key of element
 * @param  {String} value value of element
 * @return {Object} 
 * @example getElementValue(graph_name, "vertices", "公司統一編號", "!2")
 ```json
{
    "version": "2.6.0",
    "results": [{
        "公司統一編號": "!2",
        "_id": 30721024,
        "_type": "vertex"
    }],
    "totalSize": 1,
    "queryTime": 1.879381
}
 ``` 
 */
function getElementValue(graph_name, element_type, key, value) {
	return $.ajax({
		url: baseurl + graph_name + "/" + element_type + "?key=" + key + "&value=" + value,
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	});
}

/**
 * 在特定 Graph DataBase 執行 GremlinScript
 *
 * @method executeGremlinScript
 * @param  {String} graph_name Name of graph
 * @param  {String} GremlinScript 
 * @return {Object} 
 * @example executeGremlinScript(graph_name, "g.V")
 ```json
{
    "version": "2.6.0",
    "results": [{
		// 以這例子而言，執行 g.V 會列出這個 graph 的所有 vertices
    }],
    "totalSize": 1,
    "queryTime": 1.879381
}
 ``` 
 */
function executeGremlinScript(graph_name, script) {
	return $.ajax({
		url: baseurl + graph_name + "/tp/gremlin?script=" + script,
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	});
}

/**
 * 在特定 Graph DataBase 執行 GremlinScript, 包含 results 的個數
 *
 * @method executeGremlinScriptAndTotal
 * @param  {String} graph_name Name of graph
 * @param  {String} GremlinScript 
 * @return {Object} 
 * @example executeGremlinScriptAndTotal(graph_name, "g.V")
 ```json
{
    "version": "2.6.0",
	"count": 10,
    "results": [{
		// 以這例子而言，執行 g.V 會列出這個 graph 的所有 vertices
    }],
    "totalSize": 1,
    "queryTime": 1.879381
}
 ``` 
 */
function executeGremlinScriptAndTotal(graph_name, script) {
	return $.ajax({
		url: baseurl + graph_name + "/tp/gremlin?returnTotal=true&script=" + script,
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	});
}

/**
 * 在特定 Graph DataBase 新增 vertices
 *
 * @method createVertex
 * @param  {String} graph_name Name of graph
 * @param  {String} element_type should be "vertices" 
 * @param  {Object} new_vertex A key-value pairs json that contain all infomations of new vertiex
 * @return {Object} 
 * @example createVertex(graph_name, "vertices", {new_vertex})
 ```json
{
    "version": "2.6.0",
    "results": {
        "公司統一編號": "14789632",
        "公司名稱": "123",
        "_id": 30721792,
        "_type": "vertex"
    },
    "queryTime": 171.914932
}
 ``` 
 */
function createVertex(graph_name, element_type, key_value_list) {
	var script = "";
	$.each(key_value_list, function (key, value) {
		script += (key + "=" + value + "&");
	});
	script = script.substring(0, script.length - 1).trim();

	return $.ajax({
		url: baseurl + graph_name + "/" + element_type + "/10000?" + script,
		contentType: "text/html; charset=utf-8",
		type: "POST",
		success: function (response) {
			console.log("新增資料成功", response);
		},
		error: function (xhr) {
			alert("新增資料失敗", xhr);
		}
	});
}

/**
 * 在特定 Graph DataBase 新增 edge
 *
 * @method createEdge
 * @param  {String} graph_name Name of graph
 * @param  {String} element_type should be "edges" 
 * @param  {Object} new_edge A key-value pairs json that contain all infomations of new edge
 * @return {Object} 
 * @example createEdge(graph_name, "edges", {new_edge})
 ```json
{
    "version": "2.6.0",
    "results": {
        "發票統編": "ban1412",
        "單價": "10",
        "商品名稱": "123",
        "總金額": "1000",
        "發票細項序號": "1",
        "賣家(統編)": "14789632",
        "數量": "100",
        "買家(統編)": "!2",
        "_id": "syjpc-iah34-abdh-iaghs",
        "_type": "edge",
        "_outV": 30721792,
        "_inV": 30721024,
        "_label": "交易關係"
    },
    "queryTime": 71.084928
}
 ``` 
 */
function createEdge(graph_name, element_type, outV, edge_label, inV, key_value_list) {
	var script = "_outV=" + outV + "&_label=" + edge_label + "&_inV=" + inV + "&";
	$.each(key_value_list, function (key, value) {
		script += (key + "=" + value + "&");
	});
	script = script.substring(0, script.length - 1).trim();

	return $.ajax({
		url: baseurl + graph_name + "/" + element_type + "/10000?" + script,
		contentType: "text/html; charset=utf-8",
		type: "POST",
		success: function (response) {
			console.log("新增資料成功", response);
		},
		error: function (xhr) {
			alert("新增資料失敗", xhr);
		}
	});
}

/**
 * 在特定 Graph DataBase 新增 vertex/edge
 *
 * @method deleteElement
 * @param  {String} graph_name Name of graph
 * @param  {String} element_type should be "edges"/"vertices"
 * @param  {Object} id element id
 * @return {Object} 
 * @example deleteElement(graph_name, "vertices", "30721792")
 ```json
{
    "version": "2.6.0",
    "queryTime": 118.707009
}
 ``` 
 */
function deleteElement(graph_name, element_type, id) {
	return $.ajax({
		url: baseurl + graph_name + "/" + element_type + "/" + id,
		contentType: "text/html; charset=utf-8",
		type: "DELETE",
		success: function (response) {
			console.log("刪除資料成功");
		},
		error: function (xhr) {
			alert("刪除資料失敗", xhr);
		}
	});
}

/**
 * 在特定 Graph DataBase 更新 vertex/edge
 *
 * @method replaceElementValue
 * @param  {String} graph_name Name of graph
 * @param  {String} element_type should be "edges"/"vertices"
 * @param  {Object} id element id
 * @param  {Object} new_element A key-value pairs json that contain all infomations of new element
 * @return {Object} 
 * @example replaceElementValue(graph_name, "vertices", "30721280", {new_value})
 ```json
{
    "version": "2.6.0",
    "results": {
        "公司統一編號": "22",
        "公司名稱": "123456",
        "_id": 30721280,
        "_type": "vertex"
    },
    "queryTime": 143.11009
}
 ``` 
 */
function replaceElementValue(graph_name, element_type, id, key_value_list) {
	var script = "";
	$.each(key_value_list, function (key, value) {
		script += (key + "=" + value + "&");
	});
	script = script.substring(0, script.length - 1).trim();

	return $.ajax({
		url: baseurl + graph_name + "/" + element_type + "/" + id + "?" + script,
		contentType: "text/html; charset=utf-8",
		type: "PUT",
		success: function (response) {
			console.log("修改資料成功");
		},
		error: function (xhr) {
			alert("修改資料失敗", xhr);
		}
	});
}
