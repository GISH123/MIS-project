var baseurl = "http://140.119.19.14:8182/graphs/";

function getGraphList(graph_list_id) {
	$.ajax({
		url : baseurl,
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		success : function(response) {
			$.each(response["graphs"], function(key, value) {
				$(graph_list_id).append("<option value='" + value + "'>" + value + "</option>");
			});
		},
		error : function(xhr) {
			$(graph_list_id).append("<option>Cannot load graphs.</option>");
		}
	});
}


$(document).ready(function() {
	$("#information").html("搜尋目前無法多重欄位");
});

$(document).on("click", "#search_proerty", function() {
	$("#information").hide();
	$("#tab3").load("html/search.html");
});

$.ajaxSetup({
	cache : false
});
