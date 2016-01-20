
/**
 * SNA - Pattern Matching
 * 使用 Apache TinkerPop 2
 * Rexster Configuration <init-scripts> 載入
 * 
 */

/* 開啟 Titan Graph 相關設定*/
static TitanGraph graph(graph_name){
	BaseConfiguration conf = new BaseConfiguration()
	conf.setProperty('storage.backend', 'cassandrathrift')
	conf.setProperty('storage.hostname', '127.0.0.1')
	conf.setProperty('storage.cassandra.keyspace', graph_name)
	conf.setProperty('storage.cassandra.thrift.frame-size', '200')
	conf.setProperty('index.search.backend', 'elasticsearch')
	conf.setProperty('index.search.hostname', '127.0.0.1')
	return TitanFactory.open(conf)
}

/* 設定指定Vertex與Edge之間Vertex方向*/
static def vertexDirection(TitanGraph g, def script, def edge_id, def vertex_id){
	if(g.e(edge_id).inV.iterator().next() == vertex_id){
		return script.inV
	}else{
		return script.outV
	}
}

/* 設定指定Vertex與Edge之間Edge方向*/
static def edgeDirection(TitanGraph g, def script, def edge_id, def vertex_id){
	if(g.e(edge_id).outV.iterator().next() == vertex_id){
		return script.outE(g.e(edge_id).label.toString())
	}else{
		return script.inE(g.e(edge_id).label.toString())
	}
}

/* 設定Vertex或Edge的屬性*/
static def setProperties(TitanGraph g, def script, def element_type, def id){
	if(element_type == 'v'){
		if(g.v(id).map.iterator().next().size() > 0){
			g.v(id).map.iterator().next().each{ key, value ->
				/* 兩公司間交易關係由公司統一編號建立，使用!開頭的公司統一編號為排除公司統一編號搜尋*/
				if(key.toString() == '公司統一編號' && value.toString().take(1) == '!'){
					script = script
				}else{
					script = script.has(key.toString(), value.toString())
				}
			}
		}
		return script
	}else{
		if(g.e(id).map.iterator().next().size() > 0){
			g.e(id).map.iterator().next().each{ key, value ->
				if((key.toString() == '買家(統編)' || key.toString() == '賣家(統編)') && value.toString().take(1) == '!'){
					script = script
					/* Property key 為總金額，數量或單價，可進行屬性比較(>，=，<) */
				}else if(key.toString() == '總金額' || key.toString() == '數量' || key.toString() == '單價'){
					if(value.toString().replaceAll('\\s+','').matches('^([><!]{0,2}={0,2})[0-9]+(\\.[0-9]+)?')){
						script = setComparison(script, key.toString(), value.toString().replaceAll('\\s+',''))
					}else{
						script = script.has(key.toString(), value.toString())
					}
				}else{
					script = script.has(key.toString(), value.toString())
				}
			}
		}
		return script
	}
}

/* 設定屬性比較*/
static def setComparison(def script, def key, def value){

	if(value.matches('[0-9]+(\\.[0-9]+)?')){
		return script.has(key, value)
	}else{
		def comparison = value.replaceAll('[0-9]+(\\.[0-9]+)?','')
		def number = value.replaceAll('([><!]{0,2}={0,2})','')
		switch (comparison){
			case ['>>', '>']:
				script = script.has(key, T.gt, number.toDouble())
				break
			case ['>=']:
				script = script.has(key, T.gte, number.toDouble())
				break
			case ['=', '==']:
				script = script.has(key, T.eq, number.toDouble())
				break
			case ['!=', '!==']:
				script = script.has(key, T.neq, number.toDouble())
				break
			case ['<=']:
				script = script.has(key, T.lte, number.toDouble())
				break
			case ['<<', '<']:
				script = script.has(key, T.lt, number.toDouble())
				break
			default:
				break
		}
		return script
	}
}

/* 由指定點遍歷Graph並儲存所有遍歷路徑*/
static def traversal(TitanGraph g){
	while(g.getVertices().iterator().hasNext()){
		def result = []
		g.v(g.getVertices().iterator().next()).as('start').bothE.dedup.bothV.simplePath.except('start').loop('start'){ true }{ true }.path.store(result).iterate()
		return result
	}
}



/* Input Graph與 target graph 進行pattern matching*/
static def match(TitanGraph input_graph, TitanGraph target_graph){

	/*取得target graph遍歷後所有路徑的結果*/
	def traversal_result = traversal(target_graph)

	if(traversal_result.size() > 0){
		
		/*設定input graph的遍歷起始點*/
		def script = setProperties(target_graph, input_graph.V, 'v', traversal_result[0][0]).as('start');

		/*取得target graph遍歷後所有路徑中的vertex與edge的屬性值，
			用以進行input graph的match */
		for (int i = 0; i < traversal_result.size(); i++) {
			def gremlin_filter = 'start'._()
			for (int j = 1; j < traversal_result[i].size(); j++) {
				if((j%2) == 0){
					gremlin_filter = vertexDirection(target_graph, gremlin_filter, traversal_result[i][j-1], traversal_result[i][j])
					gremlin_filter = setProperties(target_graph, gremlin_filter, 'v', traversal_result[i][j])
				}else if((j%2) == 1){
					gremlin_filter = edgeDirection(target_graph, gremlin_filter, traversal_result[i][j], traversal_result[i][j-1])
					gremlin_filter = setProperties(target_graph, gremlin_filter, 'e', traversal_result[i][j])
				}
			}
			script = script.and(gremlin_filter)
		}

		/*Match後，所有input_graph符合的結果(只有進行input graph遍歷中的起始點)*/
		def match_vertex_result = []
		script.store(match_vertex_result).iterate()
	
		def match_result=[]
		/*由之前 match 後結果取得所有 input graph 中符合路徑*/
		for(int z = 0; z < match_vertex_result.size(); z++){
			for (int i = 0; i < traversal_result.size(); i++) {
				def script2=  input_graph.v(match_vertex_result[z]).as('start')
				for (int j = 1; j < traversal_result[i].size(); j++) {
					if((j%2) == 0){
						script2 = vertexDirection(target_graph, script2, traversal_result[i][j-1], traversal_result[i][j])
						script2 = setProperties(target_graph, script2, 'v', traversal_result[i][j])
					}
					else if((j%2) == 1){
						script2 = edgeDirection(target_graph, script2, traversal_result[i][j], traversal_result[i][j-1])
						script2 = setProperties(target_graph, script2, 'e', traversal_result[i][j])
					}
				}
				script2.path.store(match_result).iterate()
			}
		}
		return match_result
	}
}

/* get or create vertices*/
static def goc(v,g){
	def nv = g.getVertex(v.id)
	if(nv == null){
		nv = g.addVertex(v.id,ElementHelper.getProperties(v))
	}else{
		nv
	}
}

/*將Target graph與input graph進行pattern matching後結果存入match graph中*/
static def matchGraph(TitanGraph input_graph, TitanGraph target_graph, TitanGraph match_graph){
	TitanGraph ig = input_graph
	TitanGraph tg = target_graph
	TitanGraph mg = match_graph
	Graph sg = new TinkerGraph()
	def match_list = match(ig,tg)
	for (int i = 0; i < match_list.size(); i++) {
		for (int j = 1; j < match_list[i].size(); j+=2) {
			def it = match_list[i][j]
			if(sg.getEdge(it.id) == null){
				sg.addEdge(it.id, goc(it.outV.next(), sg), goc(it.inV.next(), sg), it.label, ElementHelper.getProperties(it))
			}
		}
	}
	sg.saveGraphSON('match_graph_json.json')
	mg.V.remove()
	mg.loadGraphSON('match_graph_json.json')
	ig.commit()
	tg.commit()
	mg.commit()
}

