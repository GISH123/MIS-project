var width = window.innerWidth - 10, height = window.innerHeight - 20, color = d3.scale.category10();
nodeFocus = false;
edgeFocus = false;
currentBrush = [0, 0];
docHash = {};
allLinks = [];
currentScale = 0;

var path;

var highlight_nodes = [];
var highlight_edges = [];
var filtered_nodes = [], filtered_edges = [];

var gD3;
var nodes_ori = [], links_trade = [], links_branch = [];

console.log('慶昌葯房 正法明藥行 統一');

$(document).ready(function() {
	activate("data/test.json");
});

function activate(data) {
	// define arrow markers for graph links
	d3.select("svg").append("defs").append("marker").attr("id", "branch").attr("viewBox", "0 -5 10 10").attr("refX", 25).attr("refY", 0).attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto").append("path").attr("fill", "#0FF").attr("stroke", "#0FF").attr("stroke-width", "0.1px").attr("d", "M0,-5L10,0L0,5Z");

	d3.select("defs").append("marker").attr("id", "trade").attr("viewBox", "0 -5 10 10").attr("refX", 25).attr("refY", 0).attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto").append("path").attr("fill", "#000").attr("stroke", "#000").attr("stroke-width", "0.1px").attr("d", "M0,-5L10,0L0,5Z");

	d3.json(data, function(error, graph) {
		if (error) {
			console.error(error);
			return;
		}
		var types = [], nodeHash = {};
		// assign vertices to nodes array
		graph.vertices.forEach(function(vertex, i) {
			nodeHash[vertex._id] = i;

			nodes_ori.push({
				id : i.toString(),
				name : vertex.公司名稱,
				label : vertex.公司名稱,
				attributes : vertex,
				viz : {
					color : "rgb(255,0,0)",
					size : 5,
					position : {
						x : Math.random() % 100,
						y : Math.random() % 100,
						z : 0
					}
				}
			});

			if (types.indexOf(vertex.type) === -1) {
				types.push(vertex.type);
			}
		});

		// assign edges to links array
		graph.edges.forEach(function(edge, i) {
			if (edge._label === '分支機構 ') {
				links_branch.push({
					id : i.toString(),
					attributes : edge,
					source : nodeHash[edge._outV].toString(),
					target : nodeHash[edge._inV].toString(),
					label : edge._label,
					weight : 1.0
				});
			} else {
				links_trade.push({
					id : i.toString(),
					attributes : edge,
					source : nodeHash[edge._outV].toString(),
					target : nodeHash[edge._inV].toString(),
					label : edge._label,
					weight : 1.0
				});
			}
		});

		loadGraph(nodes_ori, links_branch.concat(links_trade));
		createControls();

		force = d3.layout.force().charge(-1).linkDistance(1).size([1, 1]).gravity(0.1).on("tick", redrawGraph);
	});
}

function loadGraph(nodes, edges) {
	var newGEXF = GexfParser.fetch('data/lm.gexf');

	d3.selectAll("svg > g > *").remove();

	newGEXF.nodes = nodes;
	newGEXF.edges = edges;

	gD3 = gexfD3().graph(newGEXF).size([1000, 1000]).nodeScale([5, 20]);
}

function highlightNeighbors(d, i) {
	var nodeNeighbors = findNeighbors(d, i);

	d3.selectAll("g.node").each(function(p) {
		var isNeighbor = nodeNeighbors.nodes.indexOf(p);
		d3.select(this).select("circle").style("opacity", isNeighbor > -1 ? 1 : 0.25).style("stroke-width", isNeighbor > -1 ? 3 : 1).style("stroke", isNeighbor > -1 ? "blue" : "white");
	});

	path.style("opacity", function(d) {
		return nodeNeighbors.links.indexOf(d) > -1 ? 1 : 0.25;
	});
}

function findNeighbors(d, i) {
	neighborArray = [d];
	var linkArray = [];
	var linksArray = path.filter(function(p) {
		return p.source == d || p.target == d;
	}).each(function(p) {
		if (neighborArray.indexOf(p.source) == -1) {
			var n = p.source;
			n.type = p.label;
			neighborArray.push(p.source);
		}
		if (neighborArray.indexOf(p.target) == -1) {
			var n = p.target;
			n.type = p.label;
			neighborArray.push(p.target);
		}
		linkArray.push(p);
	});
	return {
		nodes : neighborArray,
		links : linkArray
	};
}

function zoomed() {
	force.stop();
	var canvWidth = parseInt(d3.select("#vizcontainer").style("width"));
	var canvHeight = parseInt(d3.select("#vizcontainer").style("height"));

	currentScale = zoom.scale();
	var halfCanvas = canvHeight / 2;
	var zoomLevel = halfCanvas * currentScale;

	gD3.xScale().range([halfCanvas - zoomLevel, halfCanvas + zoomLevel]);
	gD3.yScale().range([halfCanvas + zoomLevel, halfCanvas - zoomLevel]);
	redrawGraph();

	var canvasTranslate = zoom.translate();
	d3.select("#graphG").attr("transform", "translate(" + canvasTranslate[0] + "," + canvasTranslate[1] + ")");
}

function createControls() {
	d3.select("#controls").append("button").attr("class", "ui button green").html("Force On").on("click", function() {
		force.start();
	});
	d3.select("#controls").append("button").attr("class", "ui button red").html("Force Off").on("click", function() {
		force.stop();
	});
	d3.select("#controls").append("button").attr("class", "ui button blue").html("Reset Layout").on("click", function() {
		force.stop();
		gD3.nodes().forEach(function(el) {
			el.x = el.originalX;
			el.px = el.originalX;
			el.y = el.originalY;
			el.py = el.originalY;
		});
		currentBrush = [0, 0];
		draw();
		redrawGraph();
	});
	d3.select("#controls").append("button").attr("class", "ui button").html("顯示分支機構關係").on("click", function() {
		force.stop();

		var n = filtered_nodes.length === 0 ? nodes_ori : filtered_nodes;
		var e = filtered_edges.length === 0 ? links_branch : filtered_edges;

		e = e.filter(function(edge) {
			return edge.label === '分支機構 ';
		});

		loadGraph(n, e);

		reloadForce();
	});
	d3.select("#controls").append("button").attr("class", "ui button").html("顯示交易關係").on("click", function() {
		force.stop();

		var n = filtered_nodes.length === 0 ? nodes_ori : filtered_nodes;
		var e = filtered_edges.length === 0 ? links_trade : filtered_edges;

		e = e.filter(function(edge) {
			return edge.label === '交易關係';
		});

		loadGraph(n, e);
		reloadForce();
	});
	d3.select("#controls").append("button").attr("class", "ui button").html("顯示全部").on("click", function() {
		force.stop();

		var n = filtered_nodes.length === 0 ? nodes_ori : filtered_nodes;
		var e = filtered_edges.length === 0 ? links_trade : filtered_edges;

		loadGraph(n, e);
		reloadForce();
	});
}

function nodeButtonClick(d, i) {
	var nodeAttExtent = d3.extent(gD3.nodes(), function(p) {
		return parseFloat(p.properties[d]);
	});
	var colorScale = d3.scale.quantize().domain(nodeAttExtent).range(colorbrewer.YlGnBu[6]);
	d3.selectAll("circle").style("fill", function(p) {
		return colorScale(p.properties[d]);
	}).style("opacity", 1);
}

function linkButtonClick(d, i) {
	var linkAttExtent = d3.extent(gD3.links(), function(p) {
		return parseFloat(p.properties[d]);
	});
	var colorScale = d3.scale.quantize().domain(linkAttExtent).range(colorbrewer.YlGnBu[6]);
	d3.selectAll("line").style("stroke", function(p) {
		return colorScale(p.properties[d]);
	}).style("opacity", 1);
}

function redrawGraph() {
	var xScale = gD3.xScale();
	var yScale = gD3.yScale();

	path.attr("d", function(d) {
		var line;
		var dx = xScale(d.target.x) - xScale(d.source.x), dy = yScale(d.target.y) - yScale(d.source.y), dr = Math.sqrt(dx * dx + dy * dy) * 2 / d.properties._linknum;

		if (d.properties._linknum === 1) {
			line = "M" + xScale(d.source.x) + "," + yScale(d.source.y) + " l" + dx + "," + dy;
		} else {
			line = "M" + xScale(d.source.x) + "," + yScale(d.source.y) + " A" + dr + "," + dr + " 0 0,1 " + xScale(d.target.x) + "," + yScale(d.target.y);
		}
		return line;
	});
	// .style("marker-end", function (d) { return d.label === "分支機構 " ? "url(#arrow-branch)" : "url(#arrow-trade)"; });

	d3.selectAll("g.node").attr("transform", function(d) {
		return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
	});
}

function draw() {
	var xScale = gD3.xScale();
	var yScale = gD3.yScale();
	var sizeScale = gD3.nodeScale();

	var forceRunning = false;
	if (force.alpha() > 0) {
		force.stop();
		forceRunning = true;
	}

	path.attr("d", function(d) {
		var line;
		var dx = xScale(d.target.x) - xScale(d.source.x), dy = yScale(d.target.y) - yScale(d.source.y), dr = Math.sqrt(dx * dx + dy * dy) * 2 / d.properties._linknum;
		if (d.properties._linknum === 1) {
			line = "M" + xScale(d.source.x) + "," + yScale(d.source.y) + " l" + dx + "," + dy;
		} else {
			line = "M" + xScale(d.source.x) + "," + yScale(d.source.y) + " A" + dr + "," + dr + " 0 0,1 " + xScale(d.target.x) + "," + yScale(d.target.y);
		}
		return line;
	}).attr("transform", function(d) {
		return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
	}).on("mouseover", edgeOver).on("mouseout", edgeOut).on("click", linkClick).style("stroke", function(d) {
		if (d.label === '分支機構 ') {
			return 'cyan';
		} else {
			return 'black';
		}
	}).style("stroke-width", "2px").style("opacity", 0.7);

	d3.select("#graphG").selectAll("g.node").data(gD3.nodes(), function(d) {
		return d.id;
	}).enter().append("g").attr("class", "node").attr("transform", function(d) {
		return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
	}).on("mouseover", nodeOver).on("mouseout", nodeOut).on("click", nodeClick).append("circle").attr("r", function(d) {
		return findNeighbors(d, 0).nodes.length + 6;
	}).style("fill", function(d) {
		for (var i = 0; i < highlight_nodes.length; i++) {
			if (d.properties._id === highlight_nodes[i].attributes._id) {
				return 'rgb(0, 255, 0)';
			}
		}
		return d.rgbColor;
	}).style("stroke", "black").style("stroke-width", "1px").style("stroke-opacity", 1);

	force.nodes(gD3.nodes()).links(gD3.links());

	function nodeOver(d, i, e) {
		var el = this;
		if (!d3.event.fromElement) {
			el = e;
		}
		if (nodeFocus) {
			return;
		}

		//Only do the element stuff if this came from mouseover
		el.parentNode.appendChild(el);

		d3.select(el).append("text").attr("class", "hoverLabel").attr("stroke", "white").style("opacity", 0.9).style("pointer-events", "none").text(d.label);

		d3.select(el).append("text").attr("class", "hoverLabel").style("pointer-events", "none").text(d.label);

		highlightNeighbors(d, i);
	}

	function edgeOver(d, i, e) {
		var el = this;
		if (!d3.event.fromElement) {
			el = e;
		}
		if (edgeFocus) {
			return;
		}

		var neighborN = [d.source, d.target];

		path.style("opacity", function(edge) {
			return [d].indexOf(edge) > -1 ? 1 : 0.25;
		});

		d3.selectAll("g.node").each(function(p) {
			var isNeighbor = neighborN.indexOf(p);
			d3.select(this).select("circle").style("opacity", isNeighbor > -1 ? 1 : 0.25).style("stroke-width", isNeighbor > -1 ? 3 : 1).style("stroke", isNeighbor > -1 ? "blue" : "white");
		});
	}

	function nodeClick(d, i) {
		nodeFocus = false;
		nodeOut();
		nodeOver(d, i, this);
		nodeFocus = true;

		var newContent = "<h4 style='text-align:center;'>" + d.label + "</h4>";
		newContent += "<p>Attributes: </p><p><ul>";
		for (x in gD3.nodeAttributes()) {
			if (Boolean(d.properties[gD3.nodeAttributes()[x]]) && d.properties[gD3.nodeAttributes()[x]] !== 'null') {
				newContent += "<li>" + gD3.nodeAttributes()[x] + ": " + d.properties[gD3.nodeAttributes()[x]] + "</li>";
			}
		}
		newContent += "</ul></p><p>Connections:</p><ul>";
		var neighbors = findNeighbors(d, i);
		for (x in neighbors.nodes) {
			if (neighbors.nodes[x] != d) {
				newContent += "<li>" + neighbors.nodes[x].type.trim() + " ：" + neighbors.nodes[x].label + "</li>";
			}
		}
		newContent += "</ul></p>";

		d3.select("#modal").style("display", "block").select("#content").html(newContent);
	}

	function linkClick(d, i) {
		edgeFocus = false;
		edgeOut();
		edgeOver(d, i, this);
		edgeFocus = true;

		var newContent = "<p>" + d.label + "</p>";
		newContent += "<p>Attributes: </p><p><ul>";

		for (x in d.properties) {
			newContent += "<li>" + x + ": " + d.properties[x] + "</li>";
		}

		newContent += "</ul></p>";

		d3.select("#modal").style("display", "block").select("#content").html(newContent);
	}

}

function nodeOut() {
	if (nodeFocus) {
		return;
	}

	d3.selectAll(".hoverLabel").remove();
	d3.selectAll("circle").style("opacity", 1).style("stroke", "black").style("stroke-width", "2px");
	path.style("opacity", 0.7);
	//d3.selectAll("line").style("opacity", 0.8);
}

function edgeOut() {
	if (edgeFocus) {
		return;
	}
	nodeOut();
}

function reloadForce() {
	currentBrush = [0, 0];
	force = d3.layout.force().charge(-1).linkDistance(1).size([1, 1]).gravity(0.1).on("tick", redrawGraph);

	zoom = d3.behavior.zoom().scaleExtent([0.01, 3]).on("zoom", zoomed).scale(0.04);

	allLinks = gD3.links();

	// add the links and the arrows
	path = d3.select("#graphG").append("g").selectAll("path").data(allLinks).enter().append("path").attr("class", "link").style("marker-end", function(d) {
		return d.label === "分支機構 " ? "url(#branch)" : "url(#trade)";
	});

	d3.select("svg").call(zoom).attr("transform", "scale(.04,.04)");
	zoomed();
	draw();

	force.start();
}

//////////////////////////////////////////////////////////////////////////////////////

function query(type) {
	filtered_nodes = nodes_ori;
	filtered_edges = links_branch.concat(links_trade);

	var v, p, l, t;
	if (type === 'node') {
		v = $('#query_node').val();
		p = $('#node_property').val();
		l = $('#searchLevel').val();

		highlight_nodes = filtered_nodes.filter(function(n) {
			return n.attributes[p].indexOf(v) !== -1;
		});
		var r = findAllRelations(highlight_nodes, l);
		filtered_edges = r.edges;
		filtered_nodes = r.nodes;
	} else {
		v = parseInt($('#query_edge').val(), 10);
		p = $('#edge_property').val();
		t = $('#searchType').val();
		l = 1;

		if (p === '商品名稱') {
			highlight_edges = filtered_edges.filter(function(e) {
				if (e.label !== '交易關係') {
					return false;
				}
				return e.attributes[p].indexOf($('#query_edge').val()) !== -1;
			});
		} else {
			highlight_edges = filtered_edges.filter(function(e) {
				if (e.label !== '交易關係') {
					return false;
				}
				if (t === 'eq') {
					return e.attributes[p] === v;
				}
				if (t === 'gt') {
					return e.attributes[p] > v;
				}
				if (t === 'lt') {
					return e.attributes[p] < v;
				}
			});
		}
		var n = findNodes(highlight_edges);

		filtered_edges = highlight_edges;
		filtered_nodes = n;
	}

	//console.log(filtered_nodes.length, filtered_edges.length);

	//////////////////////////////

	if (filtered_nodes.length > 0) {
		//sort links by source, then target
		filtered_edges.sort(function(a, b) {
			if (a.source > b.source) {
				return 1;
			} else if (a.source < b.source) {
				return -1;
			} else {
				if (a.target > b.target) {
					return 1;
				}
				if (a.target < b.target) {
					return -1;
				} else {
					return 0;
				}
			}
		});
		//any links with duplicate source and target get an incremented '_linknum'
		for (var i = 0; i < filtered_edges.length; i++) {
			if (i !== 0 && filtered_edges[i].source == filtered_edges[i - 1].source && filtered_edges[i].target == filtered_edges[i - 1].target) {
				filtered_edges[i].attributes._linknum = filtered_edges[i - 1].attributes._linknum + 1;
			} else {
				filtered_edges[i].attributes._linknum = 1;
			}
		}
		loadGraph(filtered_nodes, filtered_edges);
		reloadForce();
	} else {
		d3.selectAll("svg > g > *").remove();
	}
}

function findAllRelations(nodes, level) {
	var r_edges = [], r_nodes = nodes;
	var search_level = 0;

	while (true) {
		search_level++;
		if (search_level > level)
			break;

		var e = findEdges(r_nodes);
		var n = findNodes(e);

		if (JSON.stringify(e) === JSON.stringify(r_edges) && JSON.stringify(n) === JSON.stringify(r_nodes)) {
			break;
		} else {
			r_edges = e;
			r_nodes = n;
		}
	}

	return {
		nodes : r_nodes,
		edges : r_edges
	};
}

function findEdges(nodes) {
	var edges = links_branch.concat(links_trade).filter(function(e) {
		var ans = false;
		for (var i = 0; i < nodes.length; i++) {
			ans = (nodes[i].attributes._id === e.attributes._inV || nodes[i].attributes._id === e.attributes._outV);
			if (ans)
				return ans;
		}
		return ans;
	});
	return edges;
}

function findNodes(edges) {
	var nodes = nodes_ori.filter(function(n) {
		var ans = false;
		for (var i = 0; i < edges.length; i++) {
			ans = (n.attributes._id === edges[i].attributes._inV || n.attributes._id === edges[i].attributes._outV);
			if (ans)
				return ans;
		}
		return ans;
	});
	return nodes;
}
