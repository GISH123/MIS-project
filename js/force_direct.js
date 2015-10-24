var width = window.innerWidth - 10,
	height = window.innerHeight - 20,
	color = d3.scale.category10();
nodeFocus = false;
currentBrush = [0, 0];
docHash = {};
allLinks = [];
currentScale = 0;

var highlight_nodes = [];
var highlight_edges = [];
var filtered_nodes = [],
	filtered_edges = [];

var gD3;
var nodes_ori = [],
	links_trade = [],
	links_branch = [];

console.log('慶昌葯房 正法明藥行');


function activate() {
	// define arrow markers for graph links
    d3.select("svg")
		.append("defs").append("marker")
		.attr("id", "arrow-branch")
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 15)
		.attr("refY", 0)
		.attr("markerWidth", 5)
		.attr("markerHeight", 5)
		.attr("orient", "auto")
		.append("path")
		.attr("fill", "#0FF")
		.attr("stroke", "#0FF")
		.attr("stroke-width", "0.1px")
		.attr("d", "M0,-5L10,0L0,5Z");

    d3.select("defs").append("marker")
		.attr("id", "arrow-trade")
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 15)
		.attr("refY", 0)
		.attr("markerWidth", 5)
		.attr("markerHeight", 5)
		.attr("orient", "auto")
		.append("path")
		.attr("fill", "#000")
		.attr("stroke", "#000")
		.attr("stroke-width", "0.1px")
		.attr("d", "M0,-5L10,0L0,5Z");

    d3.select("defs").append("marker")
		.attr("id", "tail-crossed")
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", -35)
		.attr("refY", 0)
		.attr("markerWidth", 8)
		.attr("markerHeight", 8)
		.attr("orient", "auto")
		.append("path")
		.attr("class", "link")
		.attr("d", "M0,-5L0,5");


	d3.json("./data/5000.json", function (error, graph) {
		if (error) return;

		var types = [],
			nodeHash = {};
		// assign vertices to nodes array
		graph.vertices.forEach(function (vertex, i) {
			nodeHash[vertex._id] = i;

			nodes_ori.push({
				id: i.toString(),
				name: vertex.公司名稱,
				label: vertex.公司名稱,
				attributes: vertex,
				viz: {
					color: "rgb(255,0,0)",
					size: 5,
					position: {
						x: Math.random() % 100,
						y: Math.random() % 100,
						z: 0
					}
				}
			});

			if (types.indexOf(vertex.type) === -1) {
				types.push(vertex.type);
			}
		});

		// assign edges to links array
		graph.edges.forEach(function (edge, i) {
			if (edge._label === '分支機構 ') {
				links_branch.push({
					id: i.toString(),
					attributes: edge,
					source: nodeHash[edge._outV].toString(),
					target: nodeHash[edge._inV].toString(),
					label: edge._label,
					weight: 1.0
				});
			} else {
				links_trade.push({
					id: i.toString(),
					attributes: edge,
					source: nodeHash[edge._outV].toString(),
					target: nodeHash[edge._inV].toString(),
					label: edge._label,
					weight: 1.0
				});
			}
		});

		loadGraph(nodes_ori, links_branch.concat(links_trade));
		createControls();

		force = d3.layout.force()
			.charge(-1)
			.linkDistance(1)
			.size([1, 1])
			.gravity(0.1)
			.on("tick", redrawGraph);
	});
}

function loadGraph(nodes, edges) {
	var newGEXF = GexfParser.fetch('./data/lm.gexf');

	d3.selectAll("svg > g > *").remove();

	newGEXF.nodes = nodes;
	newGEXF.edges = edges;

	gD3 = gexfD3().graph(newGEXF).size([1000, 1000]).nodeScale([5, 20]);
}

function highlightNeighbors(d, i) {
	var nodeNeighbors = findNeighbors(d, i);

	d3.selectAll("g.node").each(function (p) {
		var isNeighbor = nodeNeighbors.nodes.indexOf(p);
		d3.select(this).select("circle")
			.style("opacity", isNeighbor > -1 ? 1 : 0.25)
			.style("stroke-width", isNeighbor > -1 ? 3 : 1)
			.style("stroke", isNeighbor > -1 ? "blue" : "white");
	});

	d3.selectAll("line.link")
		.style("opacity", function (d) {
			return nodeNeighbors.links.indexOf(d) > -1 ? 1 : 0.25;
		});
}

function findNeighbors(d, i) {
	neighborArray = [d];
	var linkArray = [];
	var linksArray = d3
		.selectAll("line.link")
		.filter(function (p) {
			return p.source == d || p.target == d;
		})
		.each(function (p) {
			neighborArray.indexOf(p.source) == -1 ? neighborArray.push(p.source) : null;
			neighborArray.indexOf(p.target) == -1 ? neighborArray.push(p.target) : null;
			linkArray.push(p);
		});
	//        neighborArray = d3.set(neighborArray).keys();
	return {
		nodes: neighborArray,
		links: linkArray
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
	d3.select("#controls").append("button").attr("class", "origButton").html("Force On").on("click", function () {
		force.start();
	});
	d3.select("#controls").append("button").attr("class", "origButton").html("Force Off").on("click", function () {
		force.stop();
	});
	d3.select("#controls").append("button").attr("class", "origButton").html("Reset Layout").on("click", function () {
		force.stop();
		gD3.nodes().forEach(function (el) {
			el.x = el.originalX;
			el.px = el.originalX;
			el.y = el.originalY;
			el.py = el.originalY;
		});
		currentBrush = [0, 0];
		draw();
		redrawGraph();
	});
	d3.select("#controls").append("button").attr("class", "origButton").html("顯示分支機構關係").on("click", function () {
		force.stop();

		var n = filtered_nodes.length === 0 ? nodes_ori : filtered_nodes;
		var e = filtered_edges.length === 0 ? links_branch : filtered_edges;

		e = e.filter(function(edge) { return edge.label === '分支機構 '; });
		//console.log(n,e);

		loadGraph(n, e);

		reloadForce();
	});
	d3.select("#controls").append("button").attr("class", "origButton").html("顯示交易關係").on("click", function () {
		force.stop();

		var n = filtered_nodes.length === 0 ? nodes_ori : filtered_nodes;
		var e = filtered_edges.length === 0 ? links_trade : filtered_edges;

		e = e.filter(function(edge) { return edge.label === '交易關係'; });

		loadGraph(n, e);
		reloadForce();
	});
	d3.select("#controls").append("button").attr("class", "origButton").html("顯示全部").on("click", function () {
		force.stop();

		var n = filtered_nodes.length === 0 ? nodes_ori : filtered_nodes;
		var e = filtered_edges.length === 0 ? links_trade : filtered_edges;

		loadGraph(n, e);
		reloadForce();
	});
}

function nodeButtonClick(d, i) {
	var nodeAttExtent = d3.extent(gD3.nodes(), function (p) {
		return parseFloat(p.properties[d]);
	});
	var colorScale = d3.scale.quantize().domain(nodeAttExtent).range(colorbrewer.YlGnBu[6]);
	d3.selectAll("circle")
		.style("fill", function (p) { return colorScale(p.properties[d]); })
		.style("opacity", 1);
}

function linkButtonClick(d, i) {
	var linkAttExtent = d3.extent(gD3.links(), function (p) {
		return parseFloat(p.properties[d]);
	});
	var colorScale = d3.scale.quantize().domain(linkAttExtent).range(colorbrewer.YlGnBu[6]);
	d3.selectAll("line")
		.style("stroke", function (p) { return colorScale(p.properties[d]); })
		.style("opacity", 1);
}

function redrawGraph() {
	var xScale = gD3.xScale();
	var yScale = gD3.yScale();

	d3.selectAll("line.link")
		.attr("x1", function (d) { return xScale(d.source.x); })
		.attr("y1", function (d) { return yScale(d.source.y); })
		.attr("x2", function (d) { return xScale(d.target.x); })
		.attr("y2", function (d) { return yScale(d.target.y); })
		.style("marker-end", function (d) { return d.label === "分支機構 " ? "url(#arrow-branch)" : "url(#arrow-trade)"; });

	d3.selectAll("g.node")
		.attr("transform", function (d) {
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

	d3.select("#graphG")
		.selectAll("line.link")
		.data(gD3.links(), function (d) {
			return d.id;
		})
		.enter()
		.insert("line", "g.node")
		.attr("class", "link")
		.attr("x1", function (d) { return xScale(d.source.x); })
		.attr("x2", function (d) { return xScale(d.target.x); })
		.attr("y1", function (d) { return yScale(d.source.y); })
		.attr("y2", function (d) { return yScale(d.target.y); })
		.on("click", linkClick)
		.style("stroke", function (d) {
			if (d.label === '分支機構 ') { return 'cyan'; }
			else { return 'black'; }
		})
		.style("stroke-width", "2px")
		.style("opacity", 0.5);

	d3.select("#graphG")
		.selectAll("g.node")
		.data(gD3.nodes(), function (d) { return d.id; })
		.enter()
		.append("g")
		.attr("class", "node")
		.attr("transform", function (d) {
			return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
		})
		.on("mouseover", nodeOver)
		.on("mouseout", nodeOut)
		.on("click", nodeClick)
		.append("circle")
		.attr("r", function (d) {
			return findNeighbors(d, 0).nodes.length + 3;
		})
		.style("fill", function (d) {
			//console.log(d);
			var highlight = false;
			for(var i=0; i<highlight_nodes.length; i++) {
				if(d.properties._id === highlight_nodes[i].attributes._id) {
					return 'rgb(0, 255, 0)';
				}
			}
			return d.rgbColor;
		})
		.style("stroke", "black")
		.style("stroke-width", "1px")
		.style("stroke-opacity", 1);

	force
		.nodes(gD3.nodes())
		.links(gD3.links());

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

		d3.select(el)
			.append("text")
			.attr("class", "hoverLabel")
			.attr("stroke", "white")
			.style("opacity", 0.9)
			.style("pointer-events", "none")
			.text(d.label);

		d3.select(el)
			.append("text")
			.attr("class", "hoverLabel")
			.style("pointer-events", "none")
			.text(d.label);

		highlightNeighbors(d, i);
	}

	function nodeClick(d, i) {
		nodeFocus = false;
		nodeOut();
		nodeOver(d, i, this);
		nodeFocus = true;

		var newContent = "<p>" + d.label + "</p>";
		newContent += "<p>Attributes: </p><p><ul>";
		for (x in gD3.nodeAttributes()) {
			newContent += "<li>" + gD3.nodeAttributes()[x] + ": " + d.properties[gD3.nodeAttributes()[x]] + "</li>";
		}
		newContent += "</ul></p><p>Connections:</p><ul>";
		var neighbors = findNeighbors(d, i);
		for (x in neighbors.nodes) {
			if (neighbors.nodes[x] != d) {
				newContent += "<li>" + neighbors.nodes[x].label + "</li>";
			}
		}
		newContent += "</ul></p>";

		d3.select("#modal").style("display", "block").select("#content").html(newContent);
	}

	function linkClick(d, i) {
		nodeFocus = false;
		nodeOut();
		nodeFocus = true;

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
	d3.selectAll("line").style("opacity", 0.8);
}

function linkArrow(d) {
    return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
}

function reloadForce() {
	currentBrush = [0, 0];
	force = d3.layout.force()
		.charge(-1)
		.linkDistance(1)
		.size([1, 1])
		.gravity(0.1)
		.on("tick", redrawGraph);

	zoom = d3.behavior.zoom()
		.scaleExtent([0.01, 3])
		.on("zoom", zoomed).scale(0.02);

	allLinks = gD3.links();

	d3.select("svg").call(zoom).attr("transform", "scale(.02,.02)");
	zoomed();
	draw();

	force.start();
}

//////////////////////////////////////////////////////////////////////////////////////

function query(type) {
	filtered_nodes = nodes_ori;
	filtered_edges = links_branch.concat(links_trade);

	var v, p, l;
	if(type === 'node') {
		v = $('#query_node').val();
		p = $('#node_property').val();
		l = $('#searchLevel').val();

		highlight_nodes = filtered_nodes.filter(function (n) {
			return n.attributes[p] === v;
		});
		var r = findAllRelations(highlight_nodes, l);
		filtered_edges = r.edges;
		filtered_nodes = r.nodes;
	} else {
		v = parseInt($('#query_edge').val(), 10);
		p = $('#edge_property').val();
		t = $('#searchType').val();
		l = 1;

		highlight_edges = filtered_edges.filter(function (e) {
			if(t === 'eq') { return e.attributes[p] === v; }
			if(t === 'gt') { return e.attributes[p] > v; }
			if(t === 'lt') { return e.attributes[p] < v; }
		});
		var n = findNodes(highlight_edges);
		
		filtered_edges = highlight_edges;
		filtered_nodes = n;
	}

	console.log(filtered_nodes.length, filtered_edges.length);
	
	//////////////////////////////
	
	if(filtered_nodes.length > 0) {
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
		//console.log(e, n);
		search_level++;
		if (search_level > level) break;
		
		var e = findEdges(r_nodes);
		var n = findNodes(e);

		if (JSON.stringify(e) === JSON.stringify(r_edges) &&
			JSON.stringify(n) === JSON.stringify(r_nodes)) {
			break;
		}
		else {
			r_edges = e;
			r_nodes = n;
		}
	}

	return {
		nodes: r_nodes,
		edges: r_edges
	};
}

function findEdges(nodes) {
	var edges = links_branch.concat(links_trade)
		.filter(function (e) {
			var ans = false;
			for (var i = 0; i < nodes.length; i++) {
				ans = (nodes[i].attributes._id === e.attributes._inV || nodes[i].attributes._id === e.attributes._outV);
				if (ans) return ans;
			}
			return ans;
		});

	return edges;
}

function findNodes(edges) {
	var nodes = nodes_ori
		.filter(function (n) {
			var ans = false;
			for (var i = 0; i < edges.length; i++) {
				ans = (n.attributes._id === edges[i].attributes._inV || n.attributes._id === edges[i].attributes._outV);
				if (ans) return ans;
			}
			return ans;
		});

	return nodes;
}