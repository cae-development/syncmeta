define([
    'require',
    'operations/ot/EntityOperation',
    'operations/ot/OTOperation'
],/** @lends NodeResizeOperation */function(require,EntityOperation,OTOperation) {

    NodeResizeOperation.prototype = new EntityOperation();
	NodeResizeOperation.prototype.constructor = NodeResizeOperation;
    /**
     * NodeResizeOperation
     * @class operations.ot.NodeResizeOperation
     * @memberof operations.ot
     * @extends operations.ot.EntityOperation
     * @param {String} entityId Entity id of the entity this activity works on
     * @param {number} offsetX Offset in x-direction
     * @param {number} offsetY Offset in y-direction
     * @constructor
     */
    function NodeResizeOperation(entityId,offsetX,offsetY){
        var that = this;

        EntityOperation.call(this,EntityOperation.TYPES.NodeResizeOperation,entityId,CONFIG.ENTITY.NODE);

        /**
         * Offset in x-direction
         * @type {number}
         * @private
         */
        var _offsetX = offsetX;

        /**
         * Offset in y-direction
         * @type {number}
         * @private
         */
        var _offsetY = offsetY;

        /**
         * Create OTOperation for operation
         * @returns {operations.ot.OTOperation}
         */
        var createOTOperation = function(){
            return new OTOperation(
                CONFIG.ENTITY.NODE+":"+that.getEntityId(),
                JSON.stringify({
                    offsetX: _offsetX,
                    offsetY: _offsetY
                }),
                CONFIG.OPERATION.TYPE.UPDATE,
                CONFIG.IWC.POSITION.NODE.DIM
            );
        };

        /**
         * Get offset in x-direction
         * @returns {number}
         */
        this.getOffsetX = function(){
            return _offsetX;
        };

        /**
         * Get offset in y-direction
         * @returns {number}
         */
        this.getOffsetY = function(){
            return _offsetY;
        };

        /**
         * Get corresponding ot operation
         * @returns {operations.ot.OTOperation}
         * @private
         */
        this.getOTOperation = function(){
            var otOperation = EntityOperation.prototype.getOTOperation.call(this);
            if(otOperation === null){
                otOperation = createOTOperation();
                this.setOTOperation(otOperation);
            }
            return otOperation;
        };

        /**
         * Adjust the passed operation in the history of operation
         * when this operation is applied remotely after the passed operation
         * on an graph instance stored in the passed EntityManager
         * @param {canvas_widget.EntityManager} EntityManager
         * @param {EntityOperation} operation Remote operation
         * @returns {EntityOperation}
         */
        this.adjust = function(EntityManager,operation){
            return operation;
        };

        /**
         * Compute the inverse of the operation
         * @returns {NodeResizeOperation}
         */
        this.inverse = function(){
            var NodeResizeOperation = require('operations/ot/NodeResizeOperation');

            return new NodeResizeOperation(
                this.getEntityId(),
                -this.getOffsetX(),
                -this.getOffsetY()
            );
        };
    }

    NodeResizeOperation.getOperationDescription = function(nodeType,nodeLabel, viewId){
        if(!nodeLabel && !viewId){
            return "..resized " + nodeType;
        } else if(!viewId) {
            return "..resized " + nodeType + " " + nodeLabel;
        }else{
            return "..resized " + nodeType + " " + nodeLabel + " in View " + viewId;
        }
    };

    return NodeResizeOperation;

});