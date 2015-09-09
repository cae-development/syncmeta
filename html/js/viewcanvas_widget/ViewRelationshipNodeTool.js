define([
    'jqueryui',
    'jsplumb',
    'viewcanvas_widget/NodeTool',
    'viewcanvas_widget/ViewRelationshipNode'
],/** @lends ViewRelationshipNodeTool */function($,jsPlumb,NodeTool,ViewRelationshipNode) {

    ViewRelationshipNodeTool.prototype = new NodeTool();
    ViewRelationshipNodeTool.prototype.constructor = ViewRelationshipNodeTool;
    /**
     * ViewRelationshipNodeTool
     * @class viewcanvas_widget.ViewRelationshipNodeTool
     * @extends canvas_widget.NodeTool
     * @memberof canvas_widget
     * @constructor
     */
    function ViewRelationshipNodeTool(){
        NodeTool.call(this,ViewRelationshipNode.TYPE,null,null,ViewRelationshipNode.DEFAULT_WIDTH,ViewRelationshipNode.DEFAULT_HEIGHT);
    }

    return ViewRelationshipNodeTool;

});