$(document).ready(function() {
	addGraphList($("#gremlin_graph_list"));
});

$("#gremlin_code_text").keydown(function(e) {
	if (e.keyCode == "13") {
		e.preventDefault();
	}
});

$("#gremlin_code_submit").on("click", function(e) {
	if ($("#gremlin_code_text").val().trim() != "") {
		
		$("#gremlin_result").empty();
		$("#gremlin_code_submit").attr("disabled", true);
		$("#gremlin_result_loadingIMG").show();

		var func = getGremlinScript($("#gremlin_graph_list").val(), $("#gremlin_code_text").val());
		func.done(function(response) {
			$("#gremlin_result").append(JSON.stringify(response["results"]));
		}).fail(function() {
			$("#gremlin_result").append("Input wrong.");
		}).always(function() {
			$("#gremlin_result").parent().css({
				"border" : "solid 1px #EDEDED",
				"border-radius" : "5px",
				"margin-top" : "10px"
			});
			$("#gremlin_code_submit").attr("disabled", false);
			$("#gremlin_result_loadingIMG").hide();
		});
	}
});
