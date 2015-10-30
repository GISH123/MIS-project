$(document).ready(function() {
	getGraphList($("#gremlin_graph_list"));
});

$("#gremlin_code_submit").on("click", function() {
	$.ajax({
		url : baseurl + $("#gremlin_graph_list").val() + "/tp/gremlin?script=" + $("#gremlin_code_text").val(),
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		success : function(response) {
			$("#gremlin_result").append(JSON.stringify(response["results"]));
		},
		beforeSend : function() {
			$("#gremlin_result").empty();
			$("#gremlin_code_submit").attr("disabled", true);
			$("#gremlin_result_loadingIMG").show();
		},
		complete : function() {
			$("#gremlin_result").parent().css({
				"border" : "solid 1px #EDEDED",
				"border-radius" : "5px",
				"margin-top" : "10px"
			});
			$("#gremlin_code_submit").attr("disabled", false);
			$("#gremlin_result_loadingIMG").hide();
		},
		error : function(xhr) {
			$("#gremlin_result").append(JSON.stringify(xhr));
		}
	});
});
