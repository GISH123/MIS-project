/**
 * ### 提供一 GUI 編輯 Graph 的工具
 * 
 * 基本操作:
 * - `ctrl + left_click`: 新增**點**
 * - Hold `ctrl` and drag line from one vertex to another one: 修改**線**
 * - `shift + left_click`: 修改**點/線**
 * - `left_click`: 選取**點/線**
 * - Select vertex/edge and `DELETE`: 刪除**點/線**
 *
 * @class Graph-Editor
 */

var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight || e.clientHeight || g.clientHeight,
	cancel = true,
	width = x * 0.8,
	height = 500,
	colors = d3.scale.category10();

var svg = d3.select('#graph')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

function updateWindow() {
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight || e.clientHeight || g.clientHeight;

    svg.attr("width", x * 0.8).attr("height", y);
}
window.onresize = updateWindow;

// Define the div for the tooltip
var tooltip = d3.select(".pusher").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = [],
	links = [];
  
// init D3 force layout
var force = d3.layout.force()
	.nodes(nodes)
	.links(links)
	.size([width, height])
	.linkDistance(150)
	.charge(-500)
	.on('tick', tick);

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
	.attr('id', 'end-arrow')
	.attr('viewBox', '0 -5 10 10')
	.attr('refX', 6)
	.attr('markerWidth', 3)
	.attr('markerHeight', 3)
	.attr('orient', 'auto')
	.append('svg:path')
	.attr('d', 'M0,-5L10,0L0,5')
	.attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
	.attr('id', 'start-arrow')
	.attr('viewBox', '0 -5 10 10')
	.attr('refX', 4)
	.attr('markerWidth', 3)
	.attr('markerHeight', 3)
	.attr('orient', 'auto')
	.append('svg:path')
	.attr('d', 'M10,-5L0,0L10,5')
	.attr('fill', '#000');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
	.attr('class', 'link dragline hidden')
	.attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
	circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node = null,
	selected_link = null,
	mousedown_link = null,
	mousedown_node = null,
	mouseup_node = null;

function resetMouseVars() {
	mousedown_node = null;
	mouseup_node = null;
	mousedown_link = null;
}

/**
 * update force layout (called automatically each iteration)
 *
 * @method tick
 */
function tick() {
	// draw directed edges with proper padding from node centers
	path.attr('d', function (d) {
		var deltaX = d.target.x - d.source.x,
			deltaY = d.target.y - d.source.y,
			dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
			normX = deltaX / dist,
			normY = deltaY / dist,
			sourcePadding = d.left ? 17 : 12,
			targetPadding = d.right ? 17 : 12,
			sourceX = d.source.x + (sourcePadding * normX),
			sourceY = d.source.y + (sourcePadding * normY),
			targetX = d.target.x - (targetPadding * normX),
			targetY = d.target.y - (targetPadding * normY);
		return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
	});

	circle.attr('transform', function (d) {
		return 'translate(' + d.x + ',' + d.y + ')';
	});
}


/**
 * Update force_graph (called when needed)
 * - Show tooltips when mouseover
 * - Handle create/edit/delete of element
 *
 * @method restart
 */
function restart() {
	// path (link) group
	path = path.data(links);

	// update existing links
	path
		.classed('selected', function (d) {	return d === selected_link;	})
		.style('marker-start', function (d) { return d.left ? 'url(#start-arrow)' : '';	})
		.style('marker-end', function (d) { return d.right ? 'url(#end-arrow)' : ''; });

	// add new links
	path
		.enter()
		.append('svg:path')
		.attr('class', 'link')
		.classed('selected', function (d) {	return d === selected_link;	})
		.style('marker-start', function (d) { return d.left ? 'url(#start-arrow)' : ''; })
		.style('marker-end', function (d) { return d.right ? 'url(#end-arrow)' : ''; })
		.on('mouseover', function (d) {
			var tmp = _.pick(d, '_inV', '_outV', '_label', '商品名稱', '單價', '數量', '發票統編', '時間', '發票細項序號', '買家(統編)', '賣家(統編)');
			var htmlText = '<table class="ui celled table" style="background: lightsteelblue;"><tbody>';
			var lines = 0;
			for (var a in tmp) {
				if (!tmp[a]) continue;
				lines++;
				htmlText += '<tr><td style="padding:5px;">' + a + '</td><td style="padding:5px;">' + tmp[a] + '</td></tr>';
			}
			htmlText += '</tbody></table>';

			tooltip.transition()
				.duration(200)
				.style("opacity", 0.9);
			tooltip.html(htmlText)
				.style("height", (lines * 29.1 + 10) + 'px')
				.style("left", (d3.event.pageX + 30) + "px")
				.style("top", (d3.event.pageY - 58) + "px");
		})
		.on('mouseout', function (d) {
			tooltip.transition()
				.duration(500)
				.style("opacity", 0);
		})
		.on('mousedown', function (d) {
			if (d3.event.ctrlKey) return;
			if (d3.event.shiftKey) {
				var db = $('#g').attr('db_name');
				editElement(d, db, 'edges', '交易關係');
			} else {
				// select link
				mousedown_link = d;
				if (mousedown_link === selected_link) selected_link = null;
				else selected_link = mousedown_link;
				selected_node = null;
				restart();
			}
		});


	// remove old links
	path.exit().remove();


	// circle (node) group
	// NB: the function arg is crucial here! nodes are known by id, not by index!
	circle = circle.data(nodes, function (d) {
		return d._id;
	});

	// update existing nodes (reflexive & selected visual states)
	circle.selectAll('circle')
		.style('fill', function (d) {
			return (d === selected_node) ? d3.rgb(colors(d._id)).brighter().toString() : colors(d._id);
		})
		.classed('reflexive', function (d) {
			return d.reflexive;
		});

	// add new nodes
	var g = circle.enter().append('svg:g');

	g.append('svg:circle')
		.attr('class', 'node')
		.attr('r', 15)
		.style('fill', function (d) {
			return (d === selected_node) ? d3.rgb(colors(d._id)).brighter().toString() : colors(d._id);
		})
		.style('stroke', function (d) {
			return d3.rgb(colors(d._id)).darker().toString();
		})
		.classed('reflexive', function (d) {
			return d.reflexive;
		})
		.on('mouseover', function (d) {
			var tmp = _.pick(d, '_id', '公司名稱', '公司統一編號', '組織別', '行業代碼', '營業人姓名', '時間戳記', '總機構統一編號');
			var htmlText = '<table class="ui celled table" style="background: lightsteelblue;"><tbody>';
			var lines = 0;
			for (var a in tmp) {
				if (!tmp[a]) continue;
				lines++;
				htmlText += '<tr><td style="padding:5px;">' + a + '</td><td style="padding:5px;">' + tmp[a] + '</td></tr>';
			}
			htmlText += '</tbody></table>';

			tooltip.transition()
				.duration(200)
				.style("opacity", 0.9);
			tooltip.html(htmlText)
				.style("height", (lines * 29.1 + 10) + 'px')
				.style("left", (d3.event.pageX + 30) + "px")
				.style("top", (d3.event.pageY - 58) + "px");

			if (!mousedown_node || d === mousedown_node) return;
			// enlarge target node
			d3.select(this).attr('transform', 'scale(1.1)');
		})
		.on('mouseout', function (d) {
			tooltip.transition()
				.duration(500)
				.style("opacity", 0);

			if (!mousedown_node || d === mousedown_node) return;
			// unenlarge target node
			d3.select(this).attr('transform', '');
		})
		.on('mousedown', function (d) {
			if (!d3.event.ctrlKey && !d3.event.shiftKey) return;

			// select node
			mousedown_node = d;
			if (mousedown_node === selected_node) selected_node = null;
			else selected_node = mousedown_node;
			selected_link = null;

			if (d3.event.ctrlKey) {
				// reposition drag line
				drag_line
					.style('marker-end', 'url(#end-arrow)')
					.classed('hidden', false)
					.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

				restart();
			} else {
				var db = $('#g').attr('db_name');
				editElement(mousedown_node, db, 'vertices', ' blabla.');
			}
		})
		.on('mouseup', function (d) {
			if (!mousedown_node) return;

			// needed by FF
			drag_line
				.classed('hidden', true)
				.style('marker-end', '');

			// check for drag-to-self
			mouseup_node = d;
			if (mouseup_node === mousedown_node) {
				resetMouseVars();
				return;
			}

			// unenlarge target node
			d3.select(this).attr('transform', '');

			// add link to graph (update if exists)
			// NB: links are strictly source < target; arrows separately specified by booleans
			var source, target, direction;
			if (mousedown_node._id < mouseup_node._id) {
				source = mousedown_node;
				target = mouseup_node;
				direction = 'right';
			} else {
				source = mouseup_node;
				target = mousedown_node;
				direction = 'left';
			}


			$('#add-edge').lightbox_me({
				centered: true,
				onLoad: function () {
					$('#add-edge').find('input:first').focus()
				},
				onClose: function () {
					if (!cancel) {
						var data = {
							gName: $('#gName').val(),
							單價: $('#單價').val(),
							q: $('#q').val(),
							ban: $('#ban').val(),
							time: $('#etime').val(),
							serialNo: $('#ser').val()
						};
						// console.log(data);
						cancel = true;

						link = {
							source: source,
							target: target,
							left: false,
							right: false,
							_label: '交易關係',
							商品名稱: data.gName,
							單價: data.單價,
							數量: data.q,
							總金額: parseFloat(data.q) * parseFloat(data.單價),
							發票統編: data.ban,
							時間: data.time,
							發票細項序號: data.serialNo,
							'買家(統編)': '',
							'賣家(統編)': ''
						};
						link[direction] = true;

						link['買家(統編)'] = link.left ? link.source.公司統一編號 : link.target.公司統一編號;
						link['賣家(統編)'] = link.right ? link.source.公司統一編號 : link.target.公司統一編號;

						createElement(link, 'input_graph', 'edges', '交易關係');
					}
				}
			});




			// select new link
			selected_link = link;
			selected_node = null;
		});

	// show node IDs
	g.append('svg:text')
		.attr('x', 0)
		.attr('y', 4)
		.attr('class', 'id')
		.text(function (d) {
			return d.公司統一編號;
		});

	// remove old nodes
	circle.exit().remove();

	// set the graph in motion
	force.start();
	exportJSON();
}

/**
 * mousedown function
 *
 * @method mousedown
 */
function mousedown() {
	// prevent I-bar on drag
	//d3.event.preventDefault();

	// because :active only works in WebKit?
	svg.classed('active', true);

	if (mousedown_node || mousedown_link) return;

	if (d3.event.ctrlKey) {
		// insert new node at point
		var point = d3.mouse(this);
		$('#comBan').show();
		$('#comBanF').show();

		$('#add-vertex').lightbox_me({
			centered: true,
			onLoad: function () {
				$('#add-vertex').find('input:first').focus()
			},
			onClose: function () {
				if (!cancel) {
					var data = {
						name: $('#name').val(),
						comBan: $('#comBan').val(),
						type: $('#type').val(),
						typeNo: $('#typeNo').val(),
						ceoName: $('#ceoName').val(),
						time: $('#vtime').val(),
						pcomBan: $('#pcomBan').val()
					};
					console.log(data);

					cancel = true;

					var node = {
						_id: nodes.length.toString(),
						reflexive: false,
						公司名稱: data.name,
						組織別: data.type,
						公司統一編號: data.comBan,
						行業代碼: data.typeNo,
						營業人姓名: data.ceoName,
						時間戳記: data.time,
						總機構統一編號: data.pcomBan
					};

					node.x = point[0];
					node.y = point[1];

					createElement(node, 'input_graph', 'vertices', '');
				}
			}
		});
	} else {
		//circle.call(force.drag);
		//svg.classed('ctrl', true);
	}

}

/**
 * mousemove function
 *
 * @method mousemove
 */
function mousemove() {
	if (!mousedown_node) return;

	// update drag line
	drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

	restart();
}

/**
 * mouseup function
 *
 * @method mouseup
 */
function mouseup() {
	if (mousedown_node) {
		// hide drag line
		drag_line
			.classed('hidden', true)
			.style('marker-end', '');

		circle
			.on('mousedown.drag', null)
			.on('touchstart.drag', null);
		svg.classed('ctrl', false);
	}

	// because :active only works in WebKit?
	svg.classed('active', false);

	// clear mouse event vars
	resetMouseVars();
}

function spliceLinksForNode(node) {
	var db = $('#g').attr('db_name');
	var toSplice = links.filter(function (l) {
		return (l.source === node || l.target === node);
	});
	toSplice.map(function (l) {
		links.splice(links.indexOf(l), 1);
		deleteElement(db, 'edges', l._id);
	});
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
	d3.event.preventDefault();

	if (lastKeyDown !== -1) return;
	lastKeyDown = d3.event.keyCode;

	if (!selected_node && !selected_link) return;
	switch (d3.event.keyCode) {
		case 8: // backspace
		case 46: // delete
			if (selected_node) {
				nodes.splice(nodes.indexOf(selected_node), 1);
				deleteElement($('#g').attr('db_name'), 'vertices', selected_node._id);
				spliceLinksForNode(selected_node);
			} else if (selected_link) {
				deleteElement($('#g').attr('db_name'), 'edges', selected_link._id);
				links.splice(links.indexOf(selected_link), 1);
			}
			selected_link = null;
			selected_node = null;
			restart();
			break;
		case 66: // B
			if (selected_link) {
				// set link direction to both left and right
				selected_link.left = true;
				selected_link.right = true;
			}
			restart();

			break;
		case 76: // L
			if (selected_link) {
				// set link direction to left only
				selected_link.left = true;
				selected_link.right = false;
			}
			restart();

			break;
		case 82: // R
			if (selected_node) {
				// toggle node reflexivity
				selected_node.reflexive = !selected_node.reflexive;
			} else if (selected_link) {
				// set link direction to right only
				selected_link.left = false;
				selected_link.right = true;
			}
			restart();

			break;
	}
}

function keyup() {
	lastKeyDown = -1;
}

// app starts here
svg.on('mousedown', mousedown)
	.on('mousemove', mousemove)
	.on('mouseup', mouseup);
d3.select('#graph')
	.on('keydown', keydown)
	.on('keyup', keyup);
restart();



/**
 * export editor graph to json
 *
 * @method exportJSON
 * @return {Object}
 * @example
```json
{
    vertices: [{
        公司統一編號: "22",
        公司名稱: "123456",
        _id: 30721280,
        _type: "vertex"
    }, {
        公司統一編號: "!2",
        _id: "30721024",
        _type: "vertex"
    }, {
        公司統一編號: "!1",
        _id: 30720768,
        _type: "vertex"
    }],
    edges: [{
        商品名稱: "11",
        賣家(統編): "22",
        買家(統編): "!2",
        _id: syjk0-iagow-abdh-iaghs,
        _type: "edge",
        _outV: 30721280,
        _inV: 30721024,
        _label: "交易關係"
    }, {
        賣家(統編): "!1",
        買家(統編): "!2",
        _id: syjgg-iagao-abdh-iaghs,
        _type: "edge",
        _outV: 30720768,
        _inV: 30721024,
        _label: "交易關係"
    }]
}
```
 */
function exportJSON() {
	var n = nodes.map(function (n) {
		var tmp = _.pick(n, '_id', '公司名稱', '公司統一編號', '組織別', '行業代碼', '營業人姓名', '時間戳記', '總機構統一編號');

		Object.keys(tmp).forEach(function (k) {
			if (!tmp[k] || tmp[k].length === 0) delete tmp[k];
		});
		return tmp;
	});
	var e = links.map(function (l) {
		l._inV = l.left ? l.source._id : l.target._id;
		l._outV = l.right ? l.source._id : l.target._id;
		l.單價 = l.單價;
		l.數量 = l.數量;
		l.總金額 = l.總金額;
		l = _.pick(l, '_inV', '_outV', '_label', '商品名稱', '單價', '數量', '總金額', '發票統編', '時間', '發票細項序號', '買家(統編)', '賣家(統編)');


		Object.keys(l).forEach(function (k) {
			if (!l[k] || l[k].length === 0) delete l[k];
		});

		return l;
	});

	var all = {
		vertex: n,
		edge: e
	};
	$('#json').empty();
	$('#json').append(JSON.stringify(all, null, '\t'));
}

function importJSON() {
	var data = JSON.parse($('#result').text());
	console.log(data);

	nodes = data.vertices;
	links = data.edges;
	links.forEach(function (l) {
		var ids = _.sortBy([l._inV, l._outV], function (n) {
			return n;
		});
		l.source = _.find(nodes, '_id', ids[0]);
		l.target = _.find(nodes, '_id', ids[1]);
		l.left = l._inV === ids[0];
		l.right = l._outV === ids[0];
	});
	console.log(nodes, links);

	force = d3.layout.force()
		.nodes(nodes)
		.links(links)
		.size([width, height])
		.linkDistance(150)
		.charge(-500)
		.on('tick', tick);

	restart();
}

function createElement(obj, graph_name, element_type, edge_label) {
	console.log(obj);
	var db = $('#g').attr('db_name');

	if (!$.isEmptyObject(obj)) {
		if (element_type == "vertices") {
			var tmp = _.pick(obj, '公司名稱', '公司統一編號', '組織別', '行業代碼', '營業人姓名', '時間戳記', '總機構統一編號');
			Object.keys(tmp).forEach(function (k) {
				if (!tmp[k] || tmp[k].length === 0) delete tmp[k];
			});
			$.when(createVertex(db, element_type, tmp)).done(function (res) {
				res.results.reflexive = false;
				nodes.push(res.results);
				restart();
			});

		} else if (element_type == "edges") {
			var tmp = _.pick(obj, '_label', '商品名稱', '單價', '數量', '總金額', '發票統編', '時間', '發票細項序號', '買家(統編)', '賣家(統編)');
			var outV = obj["賣家(統編)"];
			var inV = obj["買家(統編)"];
			Object.keys(tmp).forEach(function (k) {
				if (!tmp[k] || tmp[k].length === 0) delete tmp[k];
			});

			var func1 = getElementValue(db, "vertices", "公司統一編號", outV);
			var func2 = getElementValue(db, "vertices", "公司統一編號", inV);

			$.when(func1, func2).done(function (response1, response2) {
				var inV_ID, outV_ID;
				$.each(response1[0]["results"], function (key, value) {
					outV_ID = value["_id"];
				});
				$.each(response2[0]["results"], function (key, value) {
					inV_ID = value["_id"];
				});
				$.when(createEdge(db, "edges", outV_ID, edge_label, inV_ID, tmp)).done(function (res) {
					obj._id = res.results._id;
					links.push(obj);
					restart();
				});
			});
		}
	}

}

function editElement(obj, graph_name, element_type, edge_label) {
	if (element_type === 'vertices') {
		$('#comBan').hide();
		$('#comBanF').hide();
		$('#comBan').val('a');
		$('#add-vertex').lightbox_me({
			centered: true,
			onLoad: function () {
				$('#add-vertex').find('input:first').focus()
			},
			onClose: function () {
				if (!cancel) {
					var nn = nodes[_.findIndex(nodes, function (n) { return n._id === obj._id; })];
					var data = {
						name: $('#name').val() || nn.公司名稱,
						comBan: nn.公司統一編號,
						type: $('#type').val() || nn.組織別,
						typeNo: $('#typeNo').val() || nn.行業代碼,
						ceoName: $('#ceoName').val() || nn.營業人姓名,
						time: $('#vtime').val() || nn.時間戳記,
						pcomBan: $('#pcomBan').val() || nn.總機構統一編號
					};
					console.log(data);

					cancel = true;

					var node = {
						reflexive: false,
						公司名稱: data.name,
						組織別: data.type,
						公司統一編號: data.comBan,
						行業代碼: data.typeNo,
						營業人姓名: data.ceoName,
						時間戳記: data.time,
						總機構統一編號: data.pcomBan
					};

					var tmp = _.pick(node, '公司名稱', '公司統一編號', '組織別', '行業代碼', '營業人姓名', '時間戳記', '總機構統一編號');
					Object.keys(tmp).forEach(function (k) {
						if (!tmp[k] || tmp[k].length === 0) delete tmp[k];
					});
					$.when(replaceElementValue(graph_name, element_type, obj._id, tmp)).done(function (res) {
						var idx = _.findIndex(nodes, function (n) { return n._id === obj._id; })
						for (var attr in node) {
							if (node[attr]) {
								nodes[idx][attr] = node[attr];
							}
						}
						restart();
					});
				}
			}
		});
	} else if (element_type === 'edges') {
		$('#add-edge').lightbox_me({
			centered: true,
			onLoad: function () {
				$('#add-edge').find('input:first').focus()
			},
			onClose: function () {
				if (!cancel) {
					var data = {
						gName: $('#gName').val(),
						單價: $('#單價').val(),
						q: $('#q').val(),
						ban: $('#ban').val(),
						time: $('#etime').val(),
						serialNo: $('#ser').val()
					};
					// console.log(data);
					cancel = true;

					var link = {
						商品名稱: data.gName,
						單價: data.單價,
						數量: data.q,
						總金額: parseFloat(data.q) * parseFloat(data.單價),
						發票統編: data.ban,
						時間: data.time,
						發票細項序號: data.serialNo,
					};

					$.when(replaceElementValue(graph_name, element_type, obj._id, link)).done(function (res) {
						var idx = _.findIndex(links, function (l) { return l._id === obj._id; })
						for (var attr in link) {
							if (link[attr]) {
								links[idx][attr] = link[attr];
							}
						}
						restart();
					});
				}
			}
		});

	}


}

function closeDialog(type, dialogType) {
	cancel = (type === 'cancel');

	if (dialogType === 'e') {
		$('#add-edge').trigger('close');
	} else {
		if (!$('#comBan').val() && !cancel) {
			$('#comBanF').addClass('error');
		} else {
			$('#comBanF').removeClass('error');
			$('#add-vertex').trigger('close');
		}
	}
}
