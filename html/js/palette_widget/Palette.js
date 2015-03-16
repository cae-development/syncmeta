define([
    'lodash',
    'iwcw',
    'operations/non_ot/ToolSelectOperation',
    'operations/non_ot/WidgetEnterOperation',
    'palette_widget/NodeTool',
    'palette_widget/EdgeTool',
    'text!templates/canvas_widget/circle_node.html',
    'text!templates/canvas_widget/diamond_node.html',
    'text!templates/canvas_widget/rectangle_node.html',
    'text!templates/canvas_widget/rounded_rectangle_node.html',
    'text!templates/canvas_widget/triangle_node.html'
],/** @lends Palette */function(_,IWCW,ToolSelectOperation,WidgetEnterOperation,NodeTool, EdgeTool, circleNodeHtml,diamondNodeHtml,rectangleNodeHtml,roundedRectangleNodeHtml,triangleNodeHtml) {

    /**
     * Palette
     * @class palette_widget.Palette
     * @memberof palette_widget
     * @constructor
     */
    function Palette($palette,$info){
        var that = this;

        /**
         * Tools added to palette
         * @type {Object}
         * @private
         */
        var _tools = {};

        /**
         * Separators added to palette
         * @type {Object}
         * @private
         */
        var _separators = [];

        /**
         * Tool currently selected
         * @type String
         * @private
         */
        var _currentToolName = null;

        /**
         * Inter widget communication wrapper
         * @type {Object}
         * @private
         */
        var _iwc = IWCW.getInstance(CONFIG.WIDGET.NAME.PALETTE);

        /**
         * Apply a tool selection
         * @param {String} name
         */
        var processToolSelection = function(name){
            var tool;
            if(_tools.hasOwnProperty(name)){
                if(_currentToolName) {
                    _tools[_currentToolName].unselect();
                    $info.text("");
                }
                tool = _tools[name];
                tool.select();
                $info.text(tool.getDescription());
                _currentToolName = name;
            }
        };

        /**
         * Callback for a local Tool Select Operation
         * @param {operations.non_ot.ToolSelectOperation} operation
         */
        var toolSelectionCallback = function (operation) {
            if (operation instanceof ToolSelectOperation) {
                processToolSelection(operation.getSelectedToolName());
            }
        };

        var enteredWidgetCallback = function(operation){
            if(operation instanceof WidgetEnterOperation) {
                if(operation.getEnteredWidgetName() === CONFIG.WIDGET.NAME.VIEWCANVAS && _tools.hasOwnProperty('ViewObject') && _tools.hasOwnProperty('ViewRelationship')){
                    _separators[1].get$node().show();
                    _tools['ViewObject'].get$node().show();
                    _tools['ViewRelationship'].get$node().show();
                }
                else if(operation.getEnteredWidgetName() === CONFIG.WIDGET.NAME.MAIN &&  _tools.hasOwnProperty('ViewObject') && _tools.hasOwnProperty('ViewRelationship')) {
                    _separators[1].get$node().hide();
                    _tools['ViewObject'].get$node().hide();
                    _tools['ViewRelationship'].get$node().hide();
                }
            }
        };

        /**
         * Add tool tool to palette
         * @param {palette_widget.AbstractTool} tool
         */
        this.addTool = function(tool){
            var name = tool.getName();
            var $node;
            if(!_tools.hasOwnProperty(name)){
                _tools[name] = tool;
                $node = tool.get$node();
                $node.on("mousedown",function(ev){
                    if (ev.which != 1) return;
                    that.selectTool(name);
                });
                $palette.append($node);
            }
        };

        /**
         * Add separator to palette
         * @param {palette_widget.Separator} separator
         */
        this.addSeparator = function(separator){
            if(!_.contains(_separators,separator)){
                _separators.push(separator);
                $palette.append(separator.get$node());
            }
        };

        //noinspection JSUnusedGlobalSymbols
        /**
         * Get tool by name
         * @param {string} name
         * @returns {palette_widget.AbstractTool}
         */
        this.getTool = function(name){
            if(_tools.hasOwnProperty(name)){
                return _tools[name];
            }
            return null;
        };

        /**
         * Select tool by name
         * @param {string} name
         */
        this.selectTool = function(name){
            if(_tools.hasOwnProperty(name)){
                processToolSelection(name);
                var operation = new ToolSelectOperation(name);
                _iwc.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.MAIN,operation.toNonOTOperation());
                //_iwc.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.VIEWCANVAS,operation.toNonOTOperation());
            }
        };

        //noinspection JSUnusedGlobalSymbols
        /**
         * Get currently selected tool
         * @returns {palette_widget.AbstractTool}
         */
        this.getCurrentToolName = function(){
            return _currentToolName;
        };

        /**
         * Register inter widget communication callbacks
         */
        this.registerCallbacks = function(){
            _iwc.registerOnDataReceivedCallback(toolSelectionCallback);
            _iwc.registerOnDataReceivedCallback(enteredWidgetCallback);
        };

        /**
         * Unregister inter widget communication callbacks
         */
        this.unregisterCallbacks = function(){
            _iwc.unregisterOnDataReceivedCallback(toolSelectionCallback);
            _iwc.unregisterOnDataReceivedCallback(enteredWidgetCallback);
        };

        if(_iwc){
            this.registerCallbacks();
        }

        this.initNodePalette = function(metamodel){
            var nodeShapeTypes = {
                "circle": circleNodeHtml,
                "diamond": diamondNodeHtml,
                "rectangle": rectangleNodeHtml,
                "rounded_rectangle": roundedRectangleNodeHtml,
                "triangle": triangleNodeHtml
            };

            /**
             * jQuery object to test for valid color
             * @type {$}
             */
            var $colorTestElement = $('<div></div>');

            var nodes = metamodel.nodes,
                node,
                shape,
                color,
                anchors,
                $shape;

            for(var nodeId in nodes) {
                if (nodes.hasOwnProperty(nodeId)) {
                    node = nodes[nodeId];
                    if (node.shape.customShape) {
                        shape = node.shape.customShape;
                    } else {
                        shape = nodeShapeTypes.hasOwnProperty(node.shape.shape) ? nodeShapeTypes[node.shape.shape] : _.keys(nodeShapeTypes)[0];
                    }
                    if (node.shape.customAnchors) {
                        anchors = node.shape.customAnchors;
                    } else {
                        switch (node.shape.shape) {
                            case "circle":
                                anchors = ["Perimeter", {shape: "Circle", anchorCount: 10}];
                                break;
                            case "diamond":
                                anchors = ["Perimeter", {shape: "Diamond", anchorCount: 10}];
                                break;
                            case "triangle":
                                anchors = ["Perimeter", {shape: "Triangle", anchorCount: 10}];
                                break;
                            default:
                            case "rectangle":
                                anchors = ["Perimeter", {shape: "Rectangle", anchorCount: 10}];
                                break;
                        }
                    }
                    color = node.shape.color ? $colorTestElement.css('color', '#FFFFFF').css('color', node.shape.color).css('color') : '#FFFFFF';
                    $shape = $('<div>').css('display', 'table-cell').css('verticalAlign', 'middle').css('width', node.shape.defaultWidth || 100).css('height', node.shape.defaultHeight || 50).append($(_.template(shape, {
                        color: color,
                        type: node.label
                    })));
                    $shape.find('.type').hide();

                    that.addTool(new NodeTool(node.label, node.label, null, $shape));
                }
            }
        };
        this.iniEdgePalette = function(metamodel){
            var edges = metamodel.edges, edge;
            for(var edgeId in edges){
                if(edges.hasOwnProperty(edgeId)){
                    edge = edges[edgeId];
                    that.addTool(new EdgeTool(edge.label,edge.label,null,edge.shape.arrow+".png",edge.shape.color));
                }
            }
        }
    }
    return Palette;
});
