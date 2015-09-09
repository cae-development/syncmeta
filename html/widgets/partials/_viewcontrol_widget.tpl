<link rel="stylesheet" type="text/css" href="<%= grunt.config('baseUrl') %>/css/vendor/jquery-ui.css">
<link rel="stylesheet" type="text/css" href="<%= grunt.config('baseUrl') %>/css/style.css">
<script type="application/javascript">
	 requirejs(['jqueryui',
	 'lodash',
	 'iwcw',
	 'operations/non_ot/UpdateViewListOperation',
	 'viewcanvas_widget/GenerateViewpointModel'],
		function($,_,IWC,UpdateViewListOperation,GenerateViewpointModel){
				
			
				var iwc  = IWC.getInstance("VIEWCONTROL");
				iwc.disableBuffer();
				
				var _viewList = {};
				var _viewpointList = {};
				
				var GetList = function(type, appendTo, tpl){	
					var space = new openapp.oo.Resource(openapp.param.space());
					space.getSubResources({
						relation: openapp.ns.role + "data", type: type,
						onEach: function(item) {
							openapp.resource.get(item.uri,function(context){
								openapp.resource.context(context).representation().get(function (rep) {
									var $viewEntry = $(tpl({name: rep.data.id, uri: rep.uri}));
									$viewEntry.find('.json').click(function(event){
										var $this = $(this).addClass('loading_button');
										var resource_uri = $(event.target).parents('tr').find('.lblviewname').attr('uri');
										openapp.resource.get(resource_uri,function(context){
											openapp.resource.context(context).representation().get(function (rep) {
												var link = document.createElement('a');
												link.download = rep.data.id + '.json';
												link.href = 'data:,'+encodeURI(JSON.stringify(rep.data,null,4));
												link.click();
												$this.removeClass('loading_button');
											});
										});
									});
									$viewEntry.find('.del').click(function(event){
										var resource_uri = $(event.target).parents('tr').find('.lblviewname').attr('uri');
										openapp.resource.del(resource_uri);
										$('#btnRefresh').click();
										
									});
									$viewEntry.find('.ToSpace').click(function(event){
										var resource_uri = $(event.target).parents('tr').find('.lblviewname').attr('uri');
										openapp.resource.get(resource_uri,function(context){
											openapp.resource.context(context).representation().get(function (rep) {
												var viewpointmodel = GenerateViewpointModel(rep.data);
												var spaceUri = $('#space_link_input_view').text() + "spaces/"+ $('#space_label_view').val();
												addMetamodelToSpace(spaceUri, viewpointmodel, CONFIG.NS.MY.VIEWPOINT);
											})
										});
									})
									$(appendTo).append($viewEntry);	
								});
							});
						} 
					}); 
				}						
				var GetListEntryTemplate = function(){
					var templateString = '<tr><td class="lblviewname" uri=<<= uri >>><<= name >></td><td><button class="json">JSON</button></td><td><button class="del">Del</button></td><td><button class="ToSpace">Add To Space</button></td></tr>'.replace(/<</g,"<"+"%").replace(/>>/g,"%"+">");
					return tpl = _.template(templateString);
				}
				var getFileContent = function($node){
				var fileReader,
                    files = $node[0].files,
                    file,
                    deferred = $.Deferred();

                if (!files || files.length === 0) deferred.resolve([]);
                file = files[0];

                fileReader = new FileReader();
                fileReader.onload = function (e) {
                    var data = e.target.result;
                    try {
                        data = JSON.parse(data);
                    } catch (e){
                        data = [];
                    }
                    deferred.resolve(data);
                };
                fileReader.readAsText(file);
                return deferred.promise();
            };
			var LoadFileAndStoreToSpace = function(type){
				getFileContent($('#btnImport')).then(function(data){
						var space = new openapp.oo.Resource(openapp.param.space());
						 space.create({
							relation: openapp.ns.role + "data",
							type: type,
							representation: data,
							callback: function(subres){
								$('#btnRefresh').click();
								var operation = new UpdateViewListOperation();
								iwc.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.VIEWCANVAS, operation.toNonOTOperation());
							}
						}); 
					});
			}
			
		GetList(CONFIG.NS.MY.VIEW, '#viewlist', GetListEntryTemplate());
		GetList(CONFIG.NS.MY.VIEWPOINT, '#viewpointlist', GetListEntryTemplate());
			
		$('#btnRefresh').click(function(){
			var tpl = GetListEntryTemplate();
			$('#viewlist').empty();
			$('#viewpointlist').empty();
			GetList(CONFIG.NS.MY.VIEW, '#viewlist', tpl);
			GetList(CONFIG.NS.MY.VIEWPOINT, '#viewpointlist', tpl);
			var operation = new UpdateViewListOperation();
			iwc.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.VIEWCANVAS, operation.toNonOTOperation());
		});
				
		$('#btnLoadView').click(function(){
			LoadFileAndStoreToSpace(CONFIG.NS.MY.VIEW);
		});
				
		$('#btnLoadViewpoint').click(function(){
			LoadFileAndStoreToSpace(CONFIG.NS.MY.VIEWPOINT);
		});
				
		$('#btnDelAllView').click(function(){
		    var space = new openapp.oo.Resource(openapp.param.space());
            space.getSubResources({
            	relation: openapp.ns.role + "data", type: CONFIG.NS.MY.VIEW,
               	onEach: function(item) {
                   	    openapp.resource.del(item.uri);
                   	}
            });
		});
		
	  function addMetamodelToSpace(spaceURI,metamodel, type){
                var deferred = $.Deferred();
                var deferred2 = $.Deferred();
                openapp.resource.post(
                        spaceURI,
                        function(data){
                            deferred.resolve(data.uri);
                        },{
                            "http://www.w3.org/1999/02/22-rdf-syntax-ns#predicate":"http://purl.org/role/terms/data",
                            "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":type
                        });
                deferred.promise().then(function(dataURI){
                    openapp.resource.put(
                            dataURI,
                            function(resp){
                                deferred2.resolve();
                            },{
                                "http://www.w3.org/1999/02/22-rdf-syntax-ns#predicate":"http://purl.org/openapp/representation"
                            },JSON.stringify(metamodel));
                });
                return deferred2.promise();
            }
	 });
</script>
<style>
	td {
		padding: 5;
	}
</style>
<div id="viewcontrol">
<p><strong>Editor space url:</strong>
    <br/>
    <span id="space_link_input_view"><%= grunt.config('roleSandboxUrl') %>/<input size="16" type="text" id="space_label_view" /></span>
    <br/>
</p>
<button id="btnRefresh">Refresh Lists</button><button id="btnDelAllView">Delete all Views</button>
<input type="file" id="btnImport" />
<button id="btnLoadView">Load a View</button>
<button id="btnLoadViewpoint">Load a Viewpoint</button>
<p>
<strong>View List</strong>
<table id="viewlist"></table>
</p>
<p>
<strong>Viewpoint List</strong>
<table id="viewpointlist"></table>
</p>	
</div>