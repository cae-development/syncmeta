requirejs([
    'jqueryui',
    'lodash',
    'jsplumb',
    'iwcotw',
    'operations/non_ot/ToolSelectOperation',
    'operations/non_ot/ActivityOperation',
    'operations/non_ot/JoinOperation',
    'operations/non_ot/WidgetEnterOperation',
    'operations/non_ot/InitModelTypesOperation',
    'operations/non_ot/ViewInitOperation',
    'operations/non_ot/DeleteViewOperation',
    'operations/non_ot/UpdateViewListOperation',
    'viewcanvas_widget/ViewManager',
    'viewcanvas_widget/Canvas',
    'viewcanvas_widget/EntityManager',
    'viewcanvas_widget/MoveTool',
    'viewcanvas_widget/NodeTool',
    'viewcanvas_widget/ObjectNodeTool',
    'viewcanvas_widget/AbstractClassNodeTool',
    'viewcanvas_widget/RelationshipNodeTool',
    'viewcanvas_widget/RelationshipGroupNodeTool',
    'viewcanvas_widget/EnumNodeTool',
    'viewcanvas_widget/NodeShapeNodeTool',
    'viewcanvas_widget/EdgeShapeNodeTool',
    'viewcanvas_widget/EdgeTool',
    'viewcanvas_widget/GeneralisationEdgeTool',
    'viewcanvas_widget/BiDirAssociationEdgeTool',
    'viewcanvas_widget/UniDirAssociationEdgeTool',
    'viewcanvas_widget/ObjectNode',
    'viewcanvas_widget/AbstractClassNode',
    'viewcanvas_widget/RelationshipNode',
    'viewcanvas_widget/RelationshipGroupNode',
    'viewcanvas_widget/EnumNode',
    'viewcanvas_widget/NodeShapeNode',
    'viewcanvas_widget/EdgeShapeNode',
    'viewcanvas_widget/GeneralisationEdge',
    'viewcanvas_widget/BiDirAssociationEdge',
    'viewcanvas_widget/UniDirAssociationEdge',
    'viewcanvas_widget/ViewObjectNodeTool',
    'viewcanvas_widget/ViewObjectNode',
    'viewcanvas_widget/ViewRelationshipNode',
    'viewcanvas_widget/ViewRelationshipNodeTool',
    'viewcanvas_widget/ViewGenerator',
    'promise!Metamodel'
], function ($, _, jsPlumb, IWCOT, ToolSelectOperation, ActivityOperation, JoinOperation, WidgetEnterOperation,InitModelTypesOperation,ViewInitOperation,DeleteViewOperation,UpdateViewListOperation,ViewManager, Canvas, EntityManager, MoveTool, NodeTool, ObjectNodeTool, AbstractClassNodeTool, RelationshipNodeTool, RelationshipGroupNodeTool, EnumNodeTool, NodeShapeNodeTool, EdgeShapeNodeTool, EdgeTool, GeneralisationEdgeTool, BiDirAssociationEdgeTool, UniDirAssociationEdgeTool, ObjectNode, AbstractClassNode, RelationshipNode, RelationshipGroupNode, EnumNode, NodeShapeNode, EdgeShapeNode, GeneralisationEdge, BiDirAssociationEdge, UniDirAssociationEdge, ViewObjectNodeTool, ViewObjectNode, ViewRelationshipNode, ViewRelationshipNodeTool, ViewGenerator, metamodel) {

    var iwcot;
	var canvas = new Canvas($("#canvas"), CONFIG.WIDGET.NAME.VIEWCANVAS);
    canvas.get$canvas().hide();

    var _inInstance = false;
	//Add all tool to the canvas
	if (metamodel && metamodel.hasOwnProperty("nodes")) {
		_inInstance = true;
        CONFIG.INSTANCE_FLAG = true;
        $("#btnCreateViewpoint").hide();
        $('#btnDelViewPoint').hide();

	} else {
		//add node tools for the meta-model editor
		canvas.addTool(ObjectNode.TYPE, new ObjectNodeTool());
		canvas.addTool(AbstractClassNode.TYPE, new AbstractClassNodeTool());
		canvas.addTool(RelationshipNode.TYPE, new RelationshipNodeTool());
		canvas.addTool(RelationshipGroupNode.TYPE, new RelationshipGroupNodeTool());
		canvas.addTool(EnumNode.TYPE, new EnumNodeTool());
		canvas.addTool(NodeShapeNode.TYPE, new NodeShapeNodeTool());
		canvas.addTool(EdgeShapeNode.TYPE, new EdgeShapeNodeTool());

		//Add view types to the meta-model editor
		canvas.addTool(ViewObjectNode.TYPE, new ViewObjectNodeTool());
		canvas.addTool(ViewRelationshipNode.TYPE, new ViewRelationshipNodeTool());
	}

	if (metamodel && metamodel.hasOwnProperty("edges")) {
        _inInstance = true;
	} else {
		//add edge tools for the meta-model editor
		canvas.addTool(GeneralisationEdge.TYPE, new GeneralisationEdgeTool());
		canvas.addTool(BiDirAssociationEdge.TYPE, new BiDirAssociationEdgeTool());
		canvas.addTool(UniDirAssociationEdge.TYPE, new UniDirAssociationEdgeTool());
	}

	iwcot = IWCOT.getInstance(CONFIG.WIDGET.NAME.VIEWCANVAS);

	//var space = new openapp.oo.Resource(openapp.param.space());

	var $undo = $("#undo");
	var $redo = $("#redo");
	$undo.click(function () {
		iwcot.undo();
	}).prop('disabled', true);

	$redo.click(function () {
		iwcot.redo();
	}).prop('disabled', true);

	iwcot.registerOnHistoryChangedCallback(function (operation, length, position) {
		$undo.prop('disabled', position == -1);
		$redo.prop('disabled', position == length - 1);
	});

	$("#q").draggable({
		axis : "y",
		start : function () {
			var $c = $("#canvas-frame");
			$c.css('bottom', 'inherit');
			$(this).css('height', 50);
		},
		drag : function (event, ui) {
			var height = ui.position.top - 30;
			$("#canvas-frame").css('height', height);
			gadgets.window.adjustHeight();
		},
		stop : function () {
			$(this).css('height', 3);
			gadgets.window.adjustHeight();
			$(this).css('top', '');
		}
	});

	$("#showtype").click(function () {
		canvas.get$node().removeClass("hide_type");
		$(this).hide();
		$("#hidetype").show();
	}).hide();

	$("#hidetype").click(function () {
		canvas.get$node().addClass("hide_type");
		$(this).hide();
		$("#showtype").show();
	});

	$("#zoomin").click(function () {
		canvas.setZoom(canvas.getZoom() + 0.1);
	});

	$("#zoomout").click(function () {
		canvas.setZoom(canvas.getZoom() - 0.1);
	});

    var initViewpoint = function(viewId){
        var deferred = $.Deferred();
        ViewManager.getViewpointResourceFromViewId(viewId).getRepresentation('rdfjson',function(rep){
            deferred.resolve(rep);
        });
        return deferred.promise();
    };
    var visualizeView = function(viewId, viewpointData){
        ViewManager.getViewResource(viewId).getRepresentation('rdfjson', function(viewData){
            if (canvas.get$node().is(':hidden'))
                canvas.get$canvas().show();
            resetCanvas();
            JSONtoGraph(viewData,viewpointData);

            $('#lblCurrentView').text(viewData.id);
            canvas.resetTool();
            $("#loading").hide();
        });
    };
	$('#btnShowViewPoint').click(function () {
        //ViewManager.initViewList();
        var viewId = ViewManager.getViewIdOfSelected();
        if (viewId === $('#lblCurrentView').text())
            return;
        $("#loading").show();
        if(_inInstance){
            if(ViewManager.getViewResource(viewId) != null) {
                initViewpoint(viewId).then(function (viewpointData) {
                    //$('#lblCurrentView').attr('vplink', resp.uri);
                    EntityManager.initModelTypes(viewpointData);
                    EntityManager.initViewTypeMap(viewpointData, metamodel);
                    visualizeView(viewId, viewpointData);
                    initTools(viewpointData);
                    iwcot.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.PALETTE, new InitModelTypesOperation(viewpointData).toNonOTOperation());

                })
            }
            else{
                resetCanvas();
                $('#lblCurrentView').attr('viewpointId', viewId).text(viewId);
                EntityManager.storeView(viewId, viewId).then(function (resp) {
                    ViewManager.updateView(viewId, viewId, resp);
                    ViewManager.getViewpointResource(viewId).getRepresentation('rdfjson', function (viewpointData) {
                        var viewGenerator = new ViewGenerator(viewpointData);
                        viewGenerator.apply().then(function (view) {
                            var $loading = $("#loading");
                            $loading.show();
                            canvas.get$canvas().show();
                            view['id'] = viewId;
                            EntityManager.initModelTypes(viewpointData);
                            EntityManager.initViewTypeMap(viewpointData, metamodel);
                            JSONtoGraph(view, viewpointData);
                            canvas.resetTool();
                            $loading.hide();
                            $("#save").click();
                        })
                    });
                });
            }
        }
        else {
            visualizeView(viewId);
        }

	});

    if(!_inInstance) {
        $("#btnCreateViewpoint").click(function () {
            ShowViewCreateMenu();
        });
        $('#btnCancelCreateViewpoint').click(function () {
            HideCreateMenu();
        });
        $('#btnAddViewpoint').click(function () {
            var viewId = $('#txtNameViewpoint').val();
            if (ViewManager.existsView(viewId)) {
                alert('View already exists');
                return;
            }
            var $viewpointSelected = $('#ddmViewpointSelection').find('option:selected');
            var viewpointId = null;
            if (_inInstance) {
                viewpointId = $viewpointSelected.attr('id');
            }
            resetCanvas();
            $('#lblCurrentView').attr('viewpointId', viewpointId).text(viewId);
            EntityManager.storeView(viewId, viewpointId).then(function (resp) {
                ViewManager.addView(viewId, viewpointId, resp);
                var operation = new UpdateViewListOperation();
                iwcot.sendRemoteNonOTOperation(operation.toNonOTOperation());
                canvas.get$canvas().show();
                if (_inInstance) {
                    ViewManager.getViewpointResource(viewpointId).getRepresentation('rdfjson', function (viewpointData) {
                        var viewGenerator = new ViewGenerator(viewpointData);
                        viewGenerator.apply().then(function (view) {
                            var $loading = $("#loading");
                            $loading.show();
                            EntityManager.initModelTypes(viewpointData);
                            JSONtoGraph(view, viewpointData);
                            canvas.resetTool();
                            $loading.hide();
                            $("#save").click();
                        })
                    });
                }
                HideCreateMenu();
            });
        });

        $('#btnDelViewPoint').click(function () {
            var viewId = ViewManager.getViewIdOfSelected();
            if (viewId !== $('#lblCurrentView').text()) {
                openapp.resource.del(ViewManager.getViewUri(viewId), function () {
                    ViewManager.deleteView(viewId);
                    iwcot.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.ATTRIBUTE, new DeleteViewOperation(viewId).toNonOTOperation());
                });
            }
            else {
                $('#lblCurrentView').attr('vplink', '').text('No view displayed');
                DeleteView(viewId);
            }
        });
    }
    else{
        var $refreshButton = $('#btnRefreshView');
        $refreshButton.show();
        $refreshButton.click(function() {
            var viewId = $('#lblCurrentView').text();
            var $loading = $("#loading");
            $loading.show();

            ViewManager.getViewpointResource(viewId).getRepresentation('rdfjson', function (viewpointData) {
                var viewGenerator = new ViewGenerator(viewpointData);
                $.when(viewGenerator.apply(), ViewManager.getViewData(viewId)).then(function (newView, oldView) {
                    DeleteView(viewId).then(function () {
                        EntityManager.storeView(viewId, viewId).then(function (resp) {
                            ViewManager.addView(viewId, viewId, resp);
                            canvas.get$canvas().show();
                            EntityManager.initModelTypes(viewpointData);
                            var update = viewGenerator.mergeViews(oldView, newView);
                            update['id'] = viewId;
                            JSONtoGraph(update, viewpointData);
                            canvas.resetTool();
                            $loading.hide();
                            $("#save").click();
                        });
                    });
                });
            });
        });
    }
    function DeleteView(viewId){
        var deferred = $.Deferred();
        openapp.resource.del(ViewManager.getViewUri(viewId), function () {
            ViewManager.deleteView(viewId);
            iwcot.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.ATTRIBUTE, new DeleteViewOperation(viewId).toNonOTOperation());
            resetCanvas();
            canvas.get$canvas().hide();
            deferred.resolve();
        });
        return deferred.promise();
    }

	//Start Autosave---------------------------
	var $feedback = $("#feedback");
	$("#save").click(function () {
        var $currentView = $('#lblCurrentView');
        var currentView = $currentView.text();
        var viewUri =  ViewManager.getViewUri(currentView);
      	var vpId = ViewManager.getViewpointId(currentView);
		if (viewUri) {
			$feedback.text("Saving...");
			EntityManager.updateView(currentView,vpId, ViewManager.getResource(currentView)).then(function () {
               //ViewManager.initViewList();
				$feedback.text("Saved!");
				setTimeout(function () {
					$feedback.text("");
				}, 1000);
			});
		}
	});


    var readyToSave = true;
    var saveTriggered = false;
    var saveCallback = function () {
        if (readyToSave) {
            readyToSave = false;
            setTimeout(function () {
                $("#save").click();

            }, 500);
            setTimeout(function () {
                readyToSave = true;
                if (saveTriggered) {
                    saveTriggered = false;
                    saveCallback();
                }
            }, 5000);
        } else {
            saveTriggered = true;
        }
    };

	iwcot.registerOnHistoryChangedCallback(saveCallback);
	//End Autosave------------------------------------------------------

    $(document).on('mouseenter', function(){
        var operation = new WidgetEnterOperation(CONFIG.WIDGET.NAME.VIEWCANVAS);
        iwcot.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.PALETTE,operation.toNonOTOperation());
        var viewId = $('#lblCurrentView').text();
        var resource = ViewManager.getViewpointResourceFromViewId(viewId);
        if(_inInstance && resource) {
            resource.getRepresentation('rdfjson', function (viewpointData) {
                EntityManager.initModelTypes(viewpointData);
                initTools(viewpointData);
                operation = new InitModelTypesOperation(viewpointData);
                iwcot.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.ATTRIBUTE, operation.toNonOTOperation());
                iwcot.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.PALETTE, operation.toNonOTOperation());
            });
        }
    });

    var initTools = function(viewpoint){
        //canvas.removeTools();
        //canvas.addTool(MoveTool.TYPE, new MoveTool());
        if(viewpoint && viewpoint.hasOwnProperty("nodes")){
            var nodes = viewpoint.nodes, node;
            for(var nodeId in nodes){
                if(nodes.hasOwnProperty(nodeId)){
                    node = nodes[nodeId];
                    canvas.addTool(node.label,new NodeTool(node.label,null,null,node.shape.defaultWidth,node.shape.defaultHeight));
                }
            }
        }

        if(viewpoint && viewpoint.hasOwnProperty("edges")){
            var edges = viewpoint.edges, edge;
            for(var edgeId in edges){
                if(edges.hasOwnProperty(edgeId)){
                    edge = edges[edgeId];
                    canvas.addTool(edge.label,new EdgeTool(edge.label,edge.relations));
                }
            }
        }
    };
    var ShowViewCreateMenu = function(){
        $('#btnCreateViewpoint').hide();
        $('#ddmViewSelection').hide();
        $('#btnShowViewPoint').hide();
        $('#btnDelViewPoint').hide();
        $('#txtNameViewpoint').show();
        $('#btnAddViewpoint').show();
        $('#btnCancelCreateViewpoint').show();
        if(_inInstance)
            $('#ddmViewpointSelection').show();
    };
    var HideCreateMenu = function(){
        $('#btnCreateViewpoint').show();
        $('#ddmViewSelection').show();
        $('#btnDelViewPoint').show();
        $('#btnShowViewPoint').show();
        $('#txtNameViewpoint').hide();
        $('#btnAddViewpoint').hide();
        $('#btnCancelCreateViewpoint').hide();
        if(_inInstance)
            $('#ddmViewpointSelection').hide();
    };
    function resetCanvas() {
		var edges = EntityManager.getEdges();
		for (edgeId in edges) {
			if (edges.hasOwnProperty(edgeId)) {
				var edge = EntityManager.findEdge(edgeId);
                edge.remove();
				//edge.triggerDeletion();
			}
		}
		var nodes = EntityManager.getNodes();
		for (nodeId in nodes) {
			if (nodes.hasOwnProperty(nodeId)) {
				var node = EntityManager.findNode(nodeId);
				//node.triggerDeletion();
                node.remove();
			}
		}
		//EntityManager.clearRecycleBin();
	}

	function JSONtoGraph(json, viewpoint) {
        var operation = new ViewInitOperation(json, viewpoint);
        iwcot.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.ATTRIBUTE, operation.toNonOTOperation());
        var nodeId, edgeId;
        for(nodeId in json.nodes){
            if(json.nodes.hasOwnProperty(nodeId)){
                var jNode = json.nodes[nodeId];
                var node = EntityManager.createNodeFromJSON(jNode.type,nodeId,jNode.left,jNode.top,jNode.width,jNode.height,jNode.zIndex,jNode);
                if(jNode.hasOwnProperty('origin'))
                    node.setOrigin(jNode.origin);
                node.draw();
                node.addToCanvas(canvas);
            }
        }
        for(edgeId in json.edges){
            if(json.edges.hasOwnProperty(edgeId)){
                var jEdge = json.edges[edgeId];
                var edge = EntityManager.createEdgeFromJSON(jEdge.type,edgeId,jEdge.source,jEdge.target,jEdge);
                if(jEdge.hasOwnProperty('origin'))
                    edge.setOrigin(jEdge.origin);
                edge.connect();
                edge.addToCanvas(canvas);
            }
        }
	}

    ViewManager.initViewList();
    if(_inInstance)
        ViewManager.GetViewpointList();

    $("#loading").hide();

    /*iwcot.registerOnJoinOrLeaveCallback(function (operation) {
		if (operation instanceof JoinOperation) {
			if (operation.getUser() === iwcot.getUser()[CONFIG.NS.PERSON.JABBERID]
                && operation.getComponent() === CONFIG.WIDGET.NAME.VIEWCANVAS) {
				if (operation.isDone()) {
					$("#loading").hide();

                    ViewManager.initViewList();
                    if(_inInstance)
                        ViewManager.GetViewpointList();

				}
			}
		}
	});*/
});
