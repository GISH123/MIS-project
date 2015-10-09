var width = window.innerWidth - 10,
	height = window.innerHeight - 20,
	color = d3.scale.category10();
nodeFocus = false;
currentBrush = [0, 0];
docHash = {};
allLinks = [];
currentScale = 0;

var nodes_ori = [],
	links_trade = [],
	links_branch = [];

function activate() {
	d3.json("./data/5000.json", function(error, graph) {
		if (error) return;

		var types = [],
			nodeHash = {};
		// assign vertices to nodes array
		graph.vertices.forEach(function(vertex, i) {
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
		graph.edges.forEach(function(edge, i) {
			if(edge._label === '分支機構 ') {
				links_branch.push({
					id: i.toString(),
					source: nodeHash[edge._outV].toString(),
					target: nodeHash[edge._inV].toString(),
					label: edge._label,
					weight: 1.0
				});
			} else {
				links_trade.push({
					id: i.toString(),
					source: nodeHash[edge._outV].toString(),
					target: nodeHash[edge._inV].toString(),
					label: edge._label,
					weight: 1.0
				});
			}
		});

		loadGraph('branch');
		createControls();
	});
}

function loadGraph(show) {
	var newGEXF = GexfParser.fetch('./data/lm.gexf');
	
	d3.selectAll("svg > g > *").remove();

	newGEXF.edges = show === 'branch' ? links_branch : links_trade;
	newGEXF.nodes = nodes_ori;
	//console.log(nodes_ori);
	gD3 = gexfD3().graph(newGEXF).size([1000, 1000]).nodeScale([5, 20]);

	force = d3.layout.force()
		.charge(-1)
		.linkDistance(1)
		.size([1, 1])
		.gravity(0.1)
		.on("tick", redrawGraph);

	zoom = d3.behavior.zoom()
		.scaleExtent([0.001, 1])
		.on("zoom", zoomed).scale(0.02);

	allLinks = gD3.links();

	d3.select("svg").call(zoom).attr("transform","scale(.02,.02)");
	zoomed();
	draw();
}

function highlightNeighbors(d, i) {
	var nodeNeighbors = findNeighbors(d, i);
	
	d3.selectAll("g.node").each(function(p) {
		var isNeighbor = nodeNeighbors.nodes.indexOf(p);
		d3.select(this).select("circle")
			.style("opacity", isNeighbor > -1 ? 1 : 0.25)
			.style("stroke-width", isNeighbor > -1 ? 3 : 1)
			.style("stroke", isNeighbor > -1 ? "blue" : "white");
	});

	d3.selectAll("line.link")
		.style("stroke-width", function(d) {
			return nodeNeighbors.links.indexOf(d) > -1 ? 2 : 1;
		})
		.style("opacity", function(d) {
			return nodeNeighbors.links.indexOf(d) > -1 ? 1 : 0.25;
		});
}

function findNeighbors(d, i) {
	neighborArray = [d];
	var linkArray = [];
	var linksArray = d3.selectAll("line.link").filter(function(p) {
			return p.source == d || p.target == d;
		}).each(function(p) {
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
	if (currentScale != zoom.scale()) {
		currentScale = zoom.scale();
		var halfCanvas = canvHeight / 2;
		var zoomLevel = halfCanvas * currentScale;

		// console.log(zoomLevel);
		gD3.xScale().range([halfCanvas - zoomLevel, halfCanvas + zoomLevel]);
		gD3.yScale().range([halfCanvas + zoomLevel, halfCanvas - zoomLevel]);
		redrawGraph();
	}
	var canvasTranslate = zoom.translate();
	d3.select("#graphG").attr("transform", "translate(" + canvasTranslate[0] + "," + canvasTranslate[1] + ")");
		// force.start();
}

function createControls() {
	d3.select("#controls").append("button").attr("class", "origButton").html("Force On").on("click", function() {
		force.start();
	});
	d3.select("#controls").append("button").attr("class", "origButton").html("Force Off").on("click", function() {
		force.stop();
	});
	d3.select("#controls").append("button").attr("class", "origButton").html("Reset Layout").on("click", function() {
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
	d3.select("#controls").append("button").attr("class", "origButton").html("顯示分支機構關係").on("click", function() {
		force.stop();
		loadGraph('branch');
	});
	d3.select("#controls").append("button").attr("class", "origButton").html("顯示交易關係").on("click", function() {
		force.stop();
		loadGraph('trade');
	});

	// d3.select("#controls").append("button").attr("class", "origButton").html("Reset Colors").on("click", function() {
	// 	var sizeScale = gD3.nodeScale();
	// 	d3.selectAll("circle")
	// 		.attr("r", function(d) {
	// 			return sizeScale(d.size)
	// 		})
	// 		.style("fill", function(d) {
	// 			return d.rgbColor
	// 		})
	// 		.style("opacity", 1);
	// 	d3.selectAll("line.link").style("stroke", "black");
	// })

	// d3.select("#controls").selectAll("button.nodeButtons").data(gD3.nodeAttributes())
	// 	.enter()
	// 	.append("button")
	// 	.attr("class", "nodeButtons")
	// 	.on("click", nodeButtonClick)
	// 	.html(function(d) {
	// 		return d
	// 	});

	// d3.select("#controls").selectAll("button.linkButtons").data(gD3.linkAttributes())
	// 	.enter()
	// 	.append("button")
	// 	.attr("class", "linkButtons")
	// 	.on("click", linkButtonClick)
	// 	.html(function(d) {
	// 		return d
	// 	});
}

function nodeButtonClick(d, i) {
	var nodeAttExtent = d3.extent(gD3.nodes(), function(p) {
		return parseFloat(p.properties[d]);
	});
	var colorScale = d3.scale.quantize().domain(nodeAttExtent).range(colorbrewer.YlGnBu[6]);
	d3.selectAll("circle")
		.style("fill", function(p) { return colorScale(p.properties[d]); })
		.style("opacity", 1);
}

function linkButtonClick(d, i) {
	var linkAttExtent = d3.extent(gD3.links(), function(p) {
		return parseFloat(p.properties[d]);
	});
	var colorScale = d3.scale.quantize().domain(linkAttExtent).range(colorbrewer.YlGnBu[6]);
	d3.selectAll("line")
		.style("stroke", function(p) { return colorScale(p.properties[d]); })
		.style("opacity", 1);
}

function redrawGraph() {
	var xScale = gD3.xScale();
	var yScale = gD3.yScale();

	d3.selectAll("line.link")
		.attr("x1", function(d) { return xScale(d.source.x); })
		.attr("y1", function(d) { return yScale(d.source.y); })
		.attr("x2", function(d) { return xScale(d.target.x); })
		.attr("y2", function(d) { return yScale(d.target.y); });

	d3.selectAll("g.node")
		.attr("transform", function(d) {
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

	d3.select("#graphG").selectAll("line.link")
		.data(gD3.links(), function(d) {
			return d.id;
		})
		.enter()
		.insert("line", "g.node")
		.attr("class", "link")
		.attr("x1", function(d) { return xScale(d.source.x); })
		.attr("x2", function(d) { return xScale(d.target.x); })
		.attr("y1", function(d) { return yScale(d.source.y); })
		.attr("y2", function(d) { return yScale(d.target.y); })
		.style("stroke", function(d) {
			if(d.label === '分支機構 ') { return 'cyan'; }
			else { return 'black'; }
		})
		.style("stroke-width", "1px")
		.style("opacity", 0.5);

	d3.select("#graphG")
		.selectAll("g.node")
		.data(gD3.nodes(), function(d) { return d.id; })
		.enter()
		.append("g")
		.attr("class", "node")
		.attr("transform", function(d) {
			return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
		})
		.on("mouseover", nodeOver)
		.on("mouseout", nodeOut)
		.on("click", nodeClick)
		.append("circle")
		.attr("r", function(d) {
			return findNeighbors(d, 0).nodes.length + 1;
		})
		.style("fill", function(d) {
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
		//console.log(d,i,e);
		
		//Only do the element stuff if this came from mouseover
		el.parentNode.appendChild(el);
		
		d3.select(el)
			.append("text")
			.attr("class", "hoverLabel")
			.attr("stroke", "white")
			.attr("stroke-width", "5px")
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
}

function nodeOut() {
	if (nodeFocus) {
		return;
	}

	d3.selectAll(".hoverLabel").remove();
	d3.selectAll("circle").style("opacity", 1).style("stroke", "black").style("stroke-width", "1px");
	d3.selectAll("line").style("opacity", 0.25);
}