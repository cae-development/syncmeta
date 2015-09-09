define([
    'iwcw',
    'operations/ot/NodeAddOperation',
    'operations/ot/EdgeAddOperation',
    'operations/non_ot/EntitySelectOperation',
    'operations/non_ot/DeleteViewOperation',
    'attribute_widget/ModelAttributesNode',
    'attribute_widget/EntityManager'
],/** @lends AttributeWrapper */function (IWCW,NodeAddOperation,EdgeAddOperation,EntitySelectOperation,DeleteViewOperation,ModelAttributesNode,EntityManager) {

    /**
     * AttributeWrapper
     * @class attribute_widget.AttributeWrapper
     * @memberof attribute_widget
     * @constructor
     * @param {jQuery} $node jquery Selector of wrapper node
     */
    function AttributeWrapper($node){
        var that = this;

        /**
         * jQuery object of DOM node representing the node
         * @type {jQuery}
         * @private
         */
        var _$node = $node;

        /**
         * Entity currently selected
         * @type {attribute_widget.AbstractNode|attribute_widget/AbstractEdge}
         * @private
         */
        var _selectedEntity = null;

        /**
         * Model attributes
         * @type {attribute_widget.ModelAttributesNode}
         * @private
         */
        var _modelAttributesNode = null;

        /**
         * Inter widget communication wrapper
         * @type {Object}
         */
        var iwc = IWCW.getInstance(CONFIG.WIDGET.NAME.ATTRIBUTE);

        //var _nodes = {};

        /**
         * Callback for a Entity Select Operation
         * @param {operations.non_ot.EntitySelectOperation} operation
         */
        var entitySelectCallback = function(operation){
            if(operation instanceof EntitySelectOperation && operation.getSelectedEntityId() === null){
                that.select(_modelAttributesNode);
            }
        };

        /**
         * Callback for an Node Add Operation
         * @param {operations.ot.NodeAddOperation} operation
         */
        var nodeAddCallback = function(operation){
            if(operation instanceof NodeAddOperation){
                var node;
                var json = operation.getJSON();
                var viewId = operation.getViewId();
                if(json){
                    node = EntityManager.createNodeFromJSON(operation.getType(),operation.getEntityId(),operation.getLeft(),operation.getTop(),operation.getWidth(),operation.getHeight(),operation.getJSON(),viewId);
                    EntityManager.addToMapIfNotExists(operation.getViewId(), json.origin,operation.getEntityId())
                } else {
                    node = EntityManager.createNode(operation.getType(),operation.getEntityId(),operation.getLeft(),operation.getTop(),operation.getWidth(),operation.getHeight(),null,viewId);
                }
                node.addToWrapper(that);
            }
        };

        /**
         * Callback for an Edge Add Operation
         * @param {operations.ot.EdgeAddOperation} operation
         */
        var edgeAddCallback = function(operation){
            if(operation instanceof EdgeAddOperation){
                var edge;
                var json = operation.getJSON();
                var viewId = operation.getViewId();
                if(json){
                    edge = EntityManager.createEdgeFromJSON(operation.getType(),operation.getEntityId(),operation.getSource(),operation.getTarget(),json,viewId);
                    if(json.hasOwnProperty('origin'))
                        EntityManager.addToMapIfNotExists(operation.getViewId(), json.origin, operation.getEntityId());

                } else {
                    edge = EntityManager.createEdge(operation.getType(),operation.getEntityId(),EntityManager.findNode(operation.getSource()),EntityManager.findNode(operation.getTarget()),null,viewId);
                }
                edge.addToWrapper(that);
            }
        };

        /**
         * Get jQuery object of DOM node representing the node
         * @returns {jQuery}
         */
        this.get$node = function(){
            return _$node;
        };

        /**
         * Set model attributes
         * @param node {attribute_widget.ModelAttributesNode}
         */
        this.setModelAttributesNode = function(node){
            _modelAttributesNode = node;
        };

        /**
         * Get model Attributes
         * @returns {attribute_widget.ModelAttributesNode}
         */
        this.getModelAttributesNode = function(){
            return _modelAttributesNode;
        };

        /**
         * Select an entity
         * @param {attribute_widget.AbstractNode|attribute_widget.AbstractEdge} entity
         */
        this.select = function(entity){
            if(_selectedEntity != entity){
                if(_selectedEntity) _selectedEntity.unselect();
                if(entity) entity.select();
                _selectedEntity = entity;
            }
        };

        /**
         * Register inter widget communication callbacks
         */
        this.registerCallbacks = function(){
            iwc.registerOnDataReceivedCallback(entitySelectCallback);
            iwc.registerOnDataReceivedCallback(nodeAddCallback);
            iwc.registerOnDataReceivedCallback(edgeAddCallback);
            iwc.registerOnDataReceivedCallback(deleteViewCallback);
        };


        /**
         * Unregister inter widget communication callbacks
         */
        this.unregisterCallbacks = function(){
            iwc.unregisterOnDataReceivedCallback(entitySelectCallback);
            iwc.unregisterOnDataReceivedCallback(nodeAddCallback);
            iwc.unregisterOnDataReceivedCallback(edgeAddCallback);
            iwc.unregisterOnDataReceivedCallback(deleteViewCallback);

        };

        if(iwc){
            that.registerCallbacks();
        }

        function deleteViewCallback(operation){
            if(operation instanceof DeleteViewOperation){
                EntityManager.deleteViewFromMap(operation.getViewId());
            }
        }

        this.select(_modelAttributesNode);
    }

    return AttributeWrapper;

});