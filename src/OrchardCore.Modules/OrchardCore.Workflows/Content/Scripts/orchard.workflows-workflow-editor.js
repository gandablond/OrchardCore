/*
** NOTE: This file is generated by Gulp and should not be edited directly!
** Any changes made directly to this file will be overwritten next time its asset group is processed by Gulp.
*/

///<reference path='../Lib/jquery/typings.d.ts' />
///<reference path='../Lib/jsplumb/typings.d.ts' />
///<reference path='./workflow-models.ts' />
var WorkflowEditor = /** @class */ (function () {
    function WorkflowEditor(container, workflowDefinitionData, deleteActivityPrompt) {
        var _this = this;
        this.container = container;
        this.serialize = function () {
            var allActivityElements = $(this.container).find('.activity');
            var workflow = {
                activities: [],
                transitions: []
            };
            // Collect activity positions.
            for (var i = 0; i < allActivityElements.length; i++) {
                var activityElementQuery = $(allActivityElements[i]);
                var activityId = activityElementQuery.data('activity-id');
                var activityIsStart = activityElementQuery.data('activity-start');
                var activityPosition = activityElementQuery.position();
                workflow.activities.push({
                    id: activityId,
                    isStart: activityIsStart,
                    x: activityPosition.left,
                    y: activityPosition.top
                });
            }
            // Collect activity connections.
            var allConnections = this.jsPlumbInstance.getConnections();
            for (var i = 0; i < allConnections.length; i++) {
                var connection = allConnections[i];
                var sourceEndpoint = connection.endpoints[0];
                var sourceOutcomeName = sourceEndpoint.getParameters().outcome.name;
                var sourceActivityId = $(connection.source).data('activity-id');
                var destinationActivityId = $(connection.target).data('activity-id');
                workflow.transitions.push({
                    sourceActivityId: sourceActivityId,
                    destinationActivityId: destinationActivityId,
                    sourceOutcomeName: sourceOutcomeName
                });
            }
            return JSON.stringify(workflow);
        };
        jsPlumb.ready(function () {
            var plumber = jsPlumb.getInstance({
                DragOptions: { cursor: 'pointer', zIndex: 2000 },
                ConnectionOverlays: [
                    ['Arrow', {
                            location: 1,
                            visible: true,
                            width: 11,
                            length: 11
                        }],
                    ['Label', {
                            location: 0.5,
                            id: 'label',
                            cssClass: 'connection-label'
                        }]
                ],
                Container: container
            });
            var getSourceEndpointOptions = function (activity, outcome) {
                // The definition of source endpoints.
                return {
                    endpoint: 'Dot',
                    anchor: 'Continuous',
                    paintStyle: {
                        stroke: '#7AB02C',
                        fill: '#7AB02C',
                        radius: 7,
                        strokeWidth: 1
                    },
                    isSource: true,
                    connector: ['Flowchart', { stub: [40, 60], gap: 0, cornerRadius: 5, alwaysRespectStubs: true }],
                    connectorStyle: {
                        strokeWidth: 2,
                        stroke: '#999999',
                        joinstyle: 'round',
                        outlineStroke: 'white',
                        outlineWidth: 2
                    },
                    hoverPaintStyle: {
                        fill: '#216477',
                        stroke: '#216477'
                    },
                    connectorHoverStyle: {
                        strokeWidth: 3,
                        stroke: '#216477',
                        outlineWidth: 5,
                        outlineStroke: 'white'
                    },
                    dragOptions: {},
                    overlays: [
                        ['Label', {
                                location: [0.5, 1.5],
                                //label: outcome.displayName,
                                cssClass: 'endpointSourceLabel',
                                visible: true
                            }]
                    ],
                    uuid: activity.id + "-" + outcome.name,
                    parameters: {
                        outcome: outcome
                    }
                };
            };
            // Listen for new connections.
            plumber.bind('connection', function (connInfo, originalEvent) {
                var connection = connInfo.connection;
                var outcome = connection.getParameters().outcome;
                var label = connection.getOverlay('label');
                label.setLabel(outcome.displayName);
            });
            var activityElements = $(container).find('.activity');
            // Suspend drawing and initialize.
            plumber.batch(function () {
                var workflowModel = workflowDefinitionData;
                var workflowId = workflowModel.id;
                activityElements.each(function (index, activityElement) {
                    var activityElementQuery = $(activityElement);
                    var activityId = activityElementQuery.data('activity-id');
                    // Make the activity draggable.
                    plumber.draggable(activityElement, { grid: [10, 10], });
                    // Configure the activity as a target.
                    plumber.makeTarget(activityElement, {
                        dropOptions: { hoverClass: 'hover' },
                        anchor: 'Continuous',
                        endpoint: ['Blank', { radius: 8 }]
                    });
                    // Add source endpoints.
                    var activity = $.grep(workflowModel.activities, function (x) { return x.id == activityId; })[0];
                    var hasMultipleOutcomes = activity.outcomes.length > 1;
                    for (var _i = 0, _a = activity.outcomes; _i < _a.length; _i++) {
                        var outcome = _a[_i];
                        var sourceEndpointOptions = getSourceEndpointOptions(activity, outcome);
                        plumber.addEndpoint(activityElement, sourceEndpointOptions);
                    }
                });
                // Connect activities.
                for (var _i = 0, _a = workflowModel.transitions; _i < _a.length; _i++) {
                    var transitionModel = _a[_i];
                    var sourceEndpointUuid = transitionModel.sourceActivityId + "-" + transitionModel.sourceOutcomeName;
                    var sourceEndpoint = plumber.getEndpoint(sourceEndpointUuid);
                    var destinationElementId = "activity-" + workflowId + "-" + transitionModel.destinationActivityId;
                    plumber.connect({
                        source: sourceEndpoint,
                        target: destinationElementId
                    });
                }
                plumber.bind('contextmenu', function (component, originalEvent) {
                });
                plumber.bind('connectionDrag', function (connection) {
                    console.log('connection ' + connection.id + ' is being dragged. suspendedElement is ', connection.suspendedElement, ' of type ', connection.suspendedElementType);
                });
                plumber.bind('connectionDragStop', function (connection) {
                    console.log('connection ' + connection.id + ' was dragged');
                });
                plumber.bind('connectionMoved', function (params) {
                    console.log('connection ' + params.connection.id + ' was moved');
                });
            });
            // Initialize popovers.
            activityElements.popover({
                trigger: 'manual',
                html: true,
                content: function () {
                    var activityElement = $(this);
                    var content = activityElement.find('.activity-commands').clone().show();
                    var startButton = content.find('.activity-start-action');
                    var isStart = activityElement.data('activity-start') === true;
                    startButton.attr('aria-pressed', activityElement.data('activity-start'));
                    startButton.toggleClass('active', isStart);
                    content.on('click', '.activity-start-action', function (e) {
                        e.preventDefault();
                        var button = $(e.currentTarget);
                        button.button('toggle');
                        var isStart = button.is('.active');
                        activityElement.data('activity-start', isStart);
                        activityElement.toggleClass('activity-start', isStart);
                    });
                    content.on('click', '.activity-delete-action', function (e) {
                        e.preventDefault();
                        if (!confirm(deleteActivityPrompt)) {
                            return;
                        }
                        plumber.remove(activityElement);
                        activityElement.popover('dispose');
                    });
                    return content.get(0);
                }
            });
            $(container).on('click', '.activity', function (e) {
                if (_this.isDragging) {
                    return;
                }
                // if any other popovers are visible, hide them
                if (_this.isPopoverVisible) {
                    activityElements.popover('hide');
                }
                var sender = $(e.currentTarget);
                sender.popover('show');
                // handle clicking on the popover itself.
                $('.popover').off('click').on('click', function (e2) {
                    e2.stopPropagation();
                });
                e.stopPropagation();
                _this.isPopoverVisible = true;
            });
            $(container).on('dblclick', '.activity', function (e) {
                var sender = $(e.currentTarget);
                sender.find('.activity-edit-action').get(0).click();
            });
            // Hide all popovers when clicking anywhere but on an activity.
            $('body').on('click', function (e) {
                activityElements.popover('hide');
                _this.isPopoverVisible = false;
            });
            _this.jsPlumbInstance = plumber;
        });
    }
    return WorkflowEditor;
}());
$.fn.workflowEditor = function () {
    this.each(function (index, element) {
        var $element = $(element);
        var workflowDefinitionData = $element.data('workflow-definition');
        var deleteActivityPrompt = $element.data('workflow-delete-activity-prompt');
        $element.data('workflowEditor', new WorkflowEditor(element, workflowDefinitionData, deleteActivityPrompt));
    });
    return this;
};
$(document).ready(function () {
    var workflowEditor = $('.workflow-editor-canvas').workflowEditor().data('workflowEditor');
    $('#workflowEditorForm').on('submit', function (s, e) {
        var state = workflowEditor.serialize();
        $('#workflowStateInput').val(state);
    });
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndvcmtmbG93LWVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUFrRDtBQUNsRCxtREFBbUQ7QUFDbkQsNENBQTRDO0FBRTVDO0lBSUksd0JBQW9CLFNBQXNCLEVBQUUsc0JBQTBDLEVBQUUsb0JBQTRCO1FBQXBILGlCQWlOQztRQWpObUIsY0FBUyxHQUFULFNBQVMsQ0FBYTtRQXFObkMsY0FBUyxHQUFHO1lBQ2YsSUFBTSxtQkFBbUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNoRSxJQUFNLFFBQVEsR0FBUTtnQkFDbEIsVUFBVSxFQUFFLEVBQUU7Z0JBQ2QsV0FBVyxFQUFFLEVBQUU7YUFDbEIsQ0FBQztZQUVGLDhCQUE4QjtZQUM5QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxJQUFJLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLFVBQVUsR0FBVyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2xFLElBQUksZUFBZSxHQUFHLG9CQUFvQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLGdCQUFnQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUV2RCxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztvQkFDckIsRUFBRSxFQUFFLFVBQVU7b0JBQ2QsT0FBTyxFQUFFLGVBQWU7b0JBQ3hCLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJO29CQUN4QixDQUFDLEVBQUUsZ0JBQWdCLENBQUMsR0FBRztpQkFDMUIsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUVELGdDQUFnQztZQUNoQyxJQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzdELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxJQUFJLFVBQVUsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLElBQUksY0FBYyxHQUFhLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELElBQUksaUJBQWlCLEdBQUcsY0FBYyxDQUFDLGFBQWEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ3BFLElBQUksZ0JBQWdCLEdBQVcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3hFLElBQUkscUJBQXFCLEdBQVcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBRTdFLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO29CQUN0QixnQkFBZ0IsRUFBRSxnQkFBZ0I7b0JBQ2xDLHFCQUFxQixFQUFFLHFCQUFxQjtvQkFDNUMsaUJBQWlCLEVBQUUsaUJBQWlCO2lCQUN2QyxDQUFDLENBQUM7WUFDUCxDQUFDO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFBO1FBelBHLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDVixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDO2dCQUM5QixXQUFXLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7Z0JBQ2hELGtCQUFrQixFQUFFO29CQUNoQixDQUFDLE9BQU8sRUFBRTs0QkFDTixRQUFRLEVBQUUsQ0FBQzs0QkFDWCxPQUFPLEVBQUUsSUFBSTs0QkFDYixLQUFLLEVBQUUsRUFBRTs0QkFDVCxNQUFNLEVBQUUsRUFBRTt5QkFDYixDQUFDO29CQUNGLENBQUMsT0FBTyxFQUFFOzRCQUNOLFFBQVEsRUFBRSxHQUFHOzRCQUNiLEVBQUUsRUFBRSxPQUFPOzRCQUNYLFFBQVEsRUFBRSxrQkFBa0I7eUJBQy9CLENBQUM7aUJBQ0w7Z0JBQ0QsU0FBUyxFQUFFLFNBQVM7YUFDdkIsQ0FBQyxDQUFDO1lBRUgsSUFBSSx3QkFBd0IsR0FBRyxVQUFVLFFBQTRCLEVBQUUsT0FBMEI7Z0JBQzdGLHNDQUFzQztnQkFDdEMsTUFBTSxDQUFDO29CQUNILFFBQVEsRUFBRSxLQUFLO29CQUNmLE1BQU0sRUFBRSxZQUFZO29CQUNwQixVQUFVLEVBQUU7d0JBQ1IsTUFBTSxFQUFFLFNBQVM7d0JBQ2pCLElBQUksRUFBRSxTQUFTO3dCQUNmLE1BQU0sRUFBRSxDQUFDO3dCQUNULFdBQVcsRUFBRSxDQUFDO3FCQUNqQjtvQkFDRCxRQUFRLEVBQUUsSUFBSTtvQkFDZCxTQUFTLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDO29CQUMvRixjQUFjLEVBQUU7d0JBQ1osV0FBVyxFQUFFLENBQUM7d0JBQ2QsTUFBTSxFQUFFLFNBQVM7d0JBQ2pCLFNBQVMsRUFBRSxPQUFPO3dCQUNsQixhQUFhLEVBQUUsT0FBTzt3QkFDdEIsWUFBWSxFQUFFLENBQUM7cUJBQ2xCO29CQUNELGVBQWUsRUFBRTt3QkFDYixJQUFJLEVBQUUsU0FBUzt3QkFDZixNQUFNLEVBQUUsU0FBUztxQkFDcEI7b0JBQ0QsbUJBQW1CLEVBQUU7d0JBQ2pCLFdBQVcsRUFBRSxDQUFDO3dCQUNkLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixZQUFZLEVBQUUsQ0FBQzt3QkFDZixhQUFhLEVBQUUsT0FBTztxQkFDekI7b0JBQ0QsV0FBVyxFQUFFLEVBQUU7b0JBQ2YsUUFBUSxFQUFFO3dCQUNOLENBQUMsT0FBTyxFQUFFO2dDQUNOLFFBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0NBQ3BCLDZCQUE2QjtnQ0FDN0IsUUFBUSxFQUFFLHFCQUFxQjtnQ0FDL0IsT0FBTyxFQUFFLElBQUk7NkJBQ2hCLENBQUM7cUJBQ0w7b0JBQ0QsSUFBSSxFQUFLLFFBQVEsQ0FBQyxFQUFFLFNBQUksT0FBTyxDQUFDLElBQU07b0JBQ3RDLFVBQVUsRUFBRTt3QkFDUixPQUFPLEVBQUUsT0FBTztxQkFDbkI7aUJBQ0osQ0FBQztZQUNOLENBQUMsQ0FBQztZQUVGLDhCQUE4QjtZQUM5QixPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxVQUFVLFFBQVEsRUFBRSxhQUFhO2dCQUN4RCxJQUFNLFVBQVUsR0FBZSxRQUFRLENBQUMsVUFBVSxDQUFDO2dCQUNuRCxJQUFNLE9BQU8sR0FBc0IsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDLE9BQU8sQ0FBQztnQkFFdEUsSUFBTSxLQUFLLEdBQVEsVUFBVSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFeEQsa0NBQWtDO1lBQ2xDLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQ1YsSUFBSSxhQUFhLEdBQXVCLHNCQUFzQixDQUFDO2dCQUMvRCxJQUFJLFVBQVUsR0FBRyxhQUFhLENBQUMsRUFBRSxDQUFDO2dCQUVsQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBQyxLQUFLLEVBQUUsZUFBZTtvQkFDekMsSUFBTSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ2hELElBQU0sVUFBVSxHQUFHLG9CQUFvQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFFNUQsK0JBQStCO29CQUMvQixPQUFPLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRXhELHNDQUFzQztvQkFDdEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUU7d0JBQ2hDLFdBQVcsRUFBRSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUU7d0JBQ3BDLE1BQU0sRUFBRSxZQUFZO3dCQUNwQixRQUFRLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7cUJBQ3JDLENBQUMsQ0FBQztvQkFFSCx3QkFBd0I7b0JBQ3hCLElBQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxVQUFDLENBQXFCLElBQUssT0FBQSxDQUFDLENBQUMsRUFBRSxJQUFJLFVBQVUsRUFBbEIsQ0FBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNwRyxJQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFFekQsR0FBRyxDQUFDLENBQWdCLFVBQWlCLEVBQWpCLEtBQUEsUUFBUSxDQUFDLFFBQVEsRUFBakIsY0FBaUIsRUFBakIsSUFBaUI7d0JBQWhDLElBQUksT0FBTyxTQUFBO3dCQUNaLElBQU0scUJBQXFCLEdBQUcsd0JBQXdCLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO3dCQUMxRSxPQUFPLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO3FCQUMvRDtnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFFSCxzQkFBc0I7Z0JBQ3RCLEdBQUcsQ0FBQyxDQUF3QixVQUF5QixFQUF6QixLQUFBLGFBQWEsQ0FBQyxXQUFXLEVBQXpCLGNBQXlCLEVBQXpCLElBQXlCO29CQUFoRCxJQUFJLGVBQWUsU0FBQTtvQkFDcEIsSUFBTSxrQkFBa0IsR0FBYyxlQUFlLENBQUMsZ0JBQWdCLFNBQUksZUFBZSxDQUFDLGlCQUFtQixDQUFDO29CQUM5RyxJQUFNLGNBQWMsR0FBYSxPQUFPLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0JBQ3pFLElBQU0sb0JBQW9CLEdBQVcsY0FBWSxVQUFVLFNBQUksZUFBZSxDQUFDLHFCQUF1QixDQUFDO29CQUV2RyxPQUFPLENBQUMsT0FBTyxDQUFDO3dCQUNaLE1BQU0sRUFBRSxjQUFjO3dCQUN0QixNQUFNLEVBQUUsb0JBQW9CO3FCQUMvQixDQUFDLENBQUM7aUJBQ047Z0JBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsVUFBVSxTQUFTLEVBQUUsYUFBYTtnQkFDOUQsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLFVBQVU7b0JBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxFQUFFLEdBQUcseUNBQXlDLEVBQUUsVUFBVSxDQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDdEssQ0FBQyxDQUFDLENBQUM7Z0JBRUgsT0FBTyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxVQUFVLFVBQVU7b0JBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxFQUFFLEdBQUcsY0FBYyxDQUFDLENBQUM7Z0JBQ2hFLENBQUMsQ0FBQyxDQUFDO2dCQUVILE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxNQUFNO29CQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsR0FBRyxZQUFZLENBQUMsQ0FBQztnQkFDckUsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztZQUVILHVCQUF1QjtZQUN2QixnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxRQUFRO2dCQUNqQixJQUFJLEVBQUUsSUFBSTtnQkFDVixPQUFPLEVBQUU7b0JBQ0wsSUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNoQyxJQUFNLE9BQU8sR0FBVyxlQUFlLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2xGLElBQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztvQkFDM0QsSUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLElBQUksQ0FBQztvQkFFaEUsV0FBVyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7b0JBQ3pFLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUUzQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxVQUFBLENBQUM7d0JBQzNDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQzt3QkFDbkIsSUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFFbEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFFeEIsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDckMsZUFBZSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDaEQsZUFBZSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDM0QsQ0FBQyxDQUFDLENBQUM7b0JBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUseUJBQXlCLEVBQUUsVUFBQSxDQUFDO3dCQUM1QyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7d0JBQ25CLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNqQyxNQUFNLENBQUM7d0JBQ1gsQ0FBQzt3QkFFRCxPQUFPLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO3dCQUNoQyxlQUFlLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUN2QyxDQUFDLENBQUMsQ0FBQztvQkFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsQ0FBQzthQUNKLENBQUMsQ0FBQztZQUVILENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxVQUFBLENBQUM7Z0JBRW5DLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUNsQixNQUFNLENBQUM7Z0JBQ1gsQ0FBQztnQkFFRCwrQ0FBK0M7Z0JBQy9DLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7b0JBQ3hCLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckMsQ0FBQztnQkFFRCxJQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNsQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUV2Qix5Q0FBeUM7Z0JBQ3pDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFBLEVBQUU7b0JBQ3JDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLENBQUE7Z0JBRUYsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNwQixLQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1lBRUgsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFVBQUEsQ0FBQztnQkFDdEMsSUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN4RCxDQUFDLENBQUMsQ0FBQztZQUVILCtEQUErRDtZQUMvRCxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFBLENBQUM7Z0JBQ25CLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDakMsS0FBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztZQUVILEtBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQTJDTCxxQkFBQztBQUFELENBaFFBLEFBZ1FDLElBQUE7QUFFRCxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsR0FBRztJQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQUMsS0FBSyxFQUFFLE9BQU87UUFDckIsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFCLElBQUksc0JBQXNCLEdBQXVCLFFBQVEsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUN0RixJQUFJLG9CQUFvQixHQUFXLFFBQVEsQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUVwRixRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksY0FBYyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDL0csQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQUVGLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDZCxJQUFNLGNBQWMsR0FBbUIsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFFNUcsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3ZDLElBQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN6QyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEMsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJvcmNoYXJkLndvcmtmbG93cy13b3JrZmxvdy1lZGl0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy88cmVmZXJlbmNlIHBhdGg9Jy4uL0xpYi9qcXVlcnkvdHlwaW5ncy5kLnRzJyAvPlxyXG4vLy88cmVmZXJlbmNlIHBhdGg9Jy4uL0xpYi9qc3BsdW1iL3R5cGluZ3MuZC50cycgLz5cclxuLy8vPHJlZmVyZW5jZSBwYXRoPScuL3dvcmtmbG93LW1vZGVscy50cycgLz5cclxuXHJcbmNsYXNzIFdvcmtmbG93RWRpdG9yIHtcclxuICAgIHByaXZhdGUgaXNQb3BvdmVyVmlzaWJsZTogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgaXNEcmFnZ2luZzogYm9vbGVhbjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHdvcmtmbG93RGVmaW5pdGlvbkRhdGE6IFdvcmtmbG93cy5Xb3JrZmxvdywgZGVsZXRlQWN0aXZpdHlQcm9tcHQ6IHN0cmluZykge1xyXG5cclxuICAgICAgICBqc1BsdW1iLnJlYWR5KCgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHBsdW1iZXIgPSBqc1BsdW1iLmdldEluc3RhbmNlKHtcclxuICAgICAgICAgICAgICAgIERyYWdPcHRpb25zOiB7IGN1cnNvcjogJ3BvaW50ZXInLCB6SW5kZXg6IDIwMDAgfSxcclxuICAgICAgICAgICAgICAgIENvbm5lY3Rpb25PdmVybGF5czogW1xyXG4gICAgICAgICAgICAgICAgICAgIFsnQXJyb3cnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMTEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbmd0aDogMTFcclxuICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICBbJ0xhYmVsJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogMC41LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogJ2xhYmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NzQ2xhc3M6ICdjb25uZWN0aW9uLWxhYmVsJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgQ29udGFpbmVyOiBjb250YWluZXJcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZ2V0U291cmNlRW5kcG9pbnRPcHRpb25zID0gZnVuY3Rpb24gKGFjdGl2aXR5OiBXb3JrZmxvd3MuQWN0aXZpdHksIG91dGNvbWU6IFdvcmtmbG93cy5PdXRjb21lKTogRW5kcG9pbnRPcHRpb25zIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZSBkZWZpbml0aW9uIG9mIHNvdXJjZSBlbmRwb2ludHMuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZHBvaW50OiAnRG90JyxcclxuICAgICAgICAgICAgICAgICAgICBhbmNob3I6ICdDb250aW51b3VzJyxcclxuICAgICAgICAgICAgICAgICAgICBwYWludFN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZTogJyM3QUIwMkMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsOiAnIzdBQjAyQycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogNyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IDFcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGlzU291cmNlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3RvcjogWydGbG93Y2hhcnQnLCB7IHN0dWI6IFs0MCwgNjBdLCBnYXA6IDAsIGNvcm5lclJhZGl1czogNSwgYWx3YXlzUmVzcGVjdFN0dWJzOiB0cnVlIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3RvclN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiAyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJva2U6ICcjOTk5OTk5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgam9pbnN0eWxlOiAncm91bmQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lU3Ryb2tlOiAnd2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lV2lkdGg6IDJcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGhvdmVyUGFpbnRTdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsOiAnIzIxNjQ3NycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZTogJyMyMTY0NzcnXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0b3JIb3ZlclN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiAzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJva2U6ICcjMjE2NDc3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0bGluZVdpZHRoOiA1LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lU3Ryb2tlOiAnd2hpdGUnXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBkcmFnT3B0aW9uczoge30sXHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmxheXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgWydMYWJlbCcsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBbMC41LCAxLjVdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYWJlbDogb3V0Y29tZS5kaXNwbGF5TmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNzc0NsYXNzOiAnZW5kcG9pbnRTb3VyY2VMYWJlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBgJHthY3Rpdml0eS5pZH0tJHtvdXRjb21lLm5hbWV9YCxcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGNvbWU6IG91dGNvbWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gTGlzdGVuIGZvciBuZXcgY29ubmVjdGlvbnMuXHJcbiAgICAgICAgICAgIHBsdW1iZXIuYmluZCgnY29ubmVjdGlvbicsIGZ1bmN0aW9uIChjb25uSW5mbywgb3JpZ2luYWxFdmVudCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29ubmVjdGlvbjogQ29ubmVjdGlvbiA9IGNvbm5JbmZvLmNvbm5lY3Rpb247XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvdXRjb21lOiBXb3JrZmxvd3MuT3V0Y29tZSA9IGNvbm5lY3Rpb24uZ2V0UGFyYW1ldGVycygpLm91dGNvbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGFiZWw6IGFueSA9IGNvbm5lY3Rpb24uZ2V0T3ZlcmxheSgnbGFiZWwnKTtcclxuICAgICAgICAgICAgICAgIGxhYmVsLnNldExhYmVsKG91dGNvbWUuZGlzcGxheU5hbWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2aXR5RWxlbWVudHMgPSAkKGNvbnRhaW5lcikuZmluZCgnLmFjdGl2aXR5Jyk7XHJcblxyXG4gICAgICAgICAgICAvLyBTdXNwZW5kIGRyYXdpbmcgYW5kIGluaXRpYWxpemUuXHJcbiAgICAgICAgICAgIHBsdW1iZXIuYmF0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHdvcmtmbG93TW9kZWw6IFdvcmtmbG93cy5Xb3JrZmxvdyA9IHdvcmtmbG93RGVmaW5pdGlvbkRhdGE7XHJcbiAgICAgICAgICAgICAgICB2YXIgd29ya2Zsb3dJZCA9IHdvcmtmbG93TW9kZWwuaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgYWN0aXZpdHlFbGVtZW50cy5lYWNoKChpbmRleCwgYWN0aXZpdHlFbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZpdHlFbGVtZW50UXVlcnkgPSAkKGFjdGl2aXR5RWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZpdHlJZCA9IGFjdGl2aXR5RWxlbWVudFF1ZXJ5LmRhdGEoJ2FjdGl2aXR5LWlkJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE1ha2UgdGhlIGFjdGl2aXR5IGRyYWdnYWJsZS5cclxuICAgICAgICAgICAgICAgICAgICBwbHVtYmVyLmRyYWdnYWJsZShhY3Rpdml0eUVsZW1lbnQsIHsgZ3JpZDogWzEwLCAxMF0sIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDb25maWd1cmUgdGhlIGFjdGl2aXR5IGFzIGEgdGFyZ2V0LlxyXG4gICAgICAgICAgICAgICAgICAgIHBsdW1iZXIubWFrZVRhcmdldChhY3Rpdml0eUVsZW1lbnQsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHJvcE9wdGlvbnM6IHsgaG92ZXJDbGFzczogJ2hvdmVyJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbmNob3I6ICdDb250aW51b3VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnQ6IFsnQmxhbmsnLCB7IHJhZGl1czogOCB9XVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgc291cmNlIGVuZHBvaW50cy5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpdml0eSA9ICQuZ3JlcCh3b3JrZmxvd01vZGVsLmFjdGl2aXRpZXMsICh4OiBXb3JrZmxvd3MuQWN0aXZpdHkpID0+IHguaWQgPT0gYWN0aXZpdHlJZClbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFzTXVsdGlwbGVPdXRjb21lcyA9IGFjdGl2aXR5Lm91dGNvbWVzLmxlbmd0aCA+IDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG91dGNvbWUgb2YgYWN0aXZpdHkub3V0Y29tZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc291cmNlRW5kcG9pbnRPcHRpb25zID0gZ2V0U291cmNlRW5kcG9pbnRPcHRpb25zKGFjdGl2aXR5LCBvdXRjb21lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGx1bWJlci5hZGRFbmRwb2ludChhY3Rpdml0eUVsZW1lbnQsIHNvdXJjZUVuZHBvaW50T3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29ubmVjdCBhY3Rpdml0aWVzLlxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgdHJhbnNpdGlvbk1vZGVsIG9mIHdvcmtmbG93TW9kZWwudHJhbnNpdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb3VyY2VFbmRwb2ludFV1aWQ6IHN0cmluZyA9IGAke3RyYW5zaXRpb25Nb2RlbC5zb3VyY2VBY3Rpdml0eUlkfS0ke3RyYW5zaXRpb25Nb2RlbC5zb3VyY2VPdXRjb21lTmFtZX1gO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZUVuZHBvaW50OiBFbmRwb2ludCA9IHBsdW1iZXIuZ2V0RW5kcG9pbnQoc291cmNlRW5kcG9pbnRVdWlkKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXN0aW5hdGlvbkVsZW1lbnRJZDogc3RyaW5nID0gYGFjdGl2aXR5LSR7d29ya2Zsb3dJZH0tJHt0cmFuc2l0aW9uTW9kZWwuZGVzdGluYXRpb25BY3Rpdml0eUlkfWA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHBsdW1iZXIuY29ubmVjdCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlRW5kcG9pbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogZGVzdGluYXRpb25FbGVtZW50SWRcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwbHVtYmVyLmJpbmQoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGNvbXBvbmVudCwgb3JpZ2luYWxFdmVudCkge1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcGx1bWJlci5iaW5kKCdjb25uZWN0aW9uRHJhZycsIGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gJyArIGNvbm5lY3Rpb24uaWQgKyAnIGlzIGJlaW5nIGRyYWdnZWQuIHN1c3BlbmRlZEVsZW1lbnQgaXMgJywgY29ubmVjdGlvbi5zdXNwZW5kZWRFbGVtZW50LCAnIG9mIHR5cGUgJywgY29ubmVjdGlvbi5zdXNwZW5kZWRFbGVtZW50VHlwZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBwbHVtYmVyLmJpbmQoJ2Nvbm5lY3Rpb25EcmFnU3RvcCcsIGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3Rpb24gJyArIGNvbm5lY3Rpb24uaWQgKyAnIHdhcyBkcmFnZ2VkJyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBwbHVtYmVyLmJpbmQoJ2Nvbm5lY3Rpb25Nb3ZlZCcsIGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGlvbiAnICsgcGFyYW1zLmNvbm5lY3Rpb24uaWQgKyAnIHdhcyBtb3ZlZCcpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBwb3BvdmVycy5cclxuICAgICAgICAgICAgYWN0aXZpdHlFbGVtZW50cy5wb3BvdmVyKHtcclxuICAgICAgICAgICAgICAgIHRyaWdnZXI6ICdtYW51YWwnLFxyXG4gICAgICAgICAgICAgICAgaHRtbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3Rpdml0eUVsZW1lbnQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQ6IEpRdWVyeSA9IGFjdGl2aXR5RWxlbWVudC5maW5kKCcuYWN0aXZpdHktY29tbWFuZHMnKS5jbG9uZSgpLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydEJ1dHRvbiA9IGNvbnRlbnQuZmluZCgnLmFjdGl2aXR5LXN0YXJ0LWFjdGlvbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzU3RhcnQgPSBhY3Rpdml0eUVsZW1lbnQuZGF0YSgnYWN0aXZpdHktc3RhcnQnKSA9PT0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRCdXR0b24uYXR0cignYXJpYS1wcmVzc2VkJywgYWN0aXZpdHlFbGVtZW50LmRhdGEoJ2FjdGl2aXR5LXN0YXJ0JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QnV0dG9uLnRvZ2dsZUNsYXNzKCdhY3RpdmUnLCBpc1N0YXJ0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5vbignY2xpY2snLCAnLmFjdGl2aXR5LXN0YXJ0LWFjdGlvbicsIGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5idXR0b24oJ3RvZ2dsZScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNTdGFydCA9IGJ1dHRvbi5pcygnLmFjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eUVsZW1lbnQuZGF0YSgnYWN0aXZpdHktc3RhcnQnLCBpc1N0YXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlFbGVtZW50LnRvZ2dsZUNsYXNzKCdhY3Rpdml0eS1zdGFydCcsIGlzU3RhcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50Lm9uKCdjbGljaycsICcuYWN0aXZpdHktZGVsZXRlLWFjdGlvbicsIGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY29uZmlybShkZWxldGVBY3Rpdml0eVByb21wdCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcGx1bWJlci5yZW1vdmUoYWN0aXZpdHlFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlFbGVtZW50LnBvcG92ZXIoJ2Rpc3Bvc2UnKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQuZ2V0KDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICQoY29udGFpbmVyKS5vbignY2xpY2snLCAnLmFjdGl2aXR5JywgZSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBpZiBhbnkgb3RoZXIgcG9wb3ZlcnMgYXJlIHZpc2libGUsIGhpZGUgdGhlbVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNQb3BvdmVyVmlzaWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5RWxlbWVudHMucG9wb3ZlcignaGlkZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIHNlbmRlci5wb3BvdmVyKCdzaG93Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIGNsaWNraW5nIG9uIHRoZSBwb3BvdmVyIGl0c2VsZi5cclxuICAgICAgICAgICAgICAgICQoJy5wb3BvdmVyJykub2ZmKCdjbGljaycpLm9uKCdjbGljaycsIGUyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBlMi5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNQb3BvdmVyVmlzaWJsZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgJChjb250YWluZXIpLm9uKCdkYmxjbGljaycsICcuYWN0aXZpdHknLCBlID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNlbmRlciA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIHNlbmRlci5maW5kKCcuYWN0aXZpdHktZWRpdC1hY3Rpb24nKS5nZXQoMCkuY2xpY2soKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBIaWRlIGFsbCBwb3BvdmVycyB3aGVuIGNsaWNraW5nIGFueXdoZXJlIGJ1dCBvbiBhbiBhY3Rpdml0eS5cclxuICAgICAgICAgICAgJCgnYm9keScpLm9uKCdjbGljaycsIGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgYWN0aXZpdHlFbGVtZW50cy5wb3BvdmVyKCdoaWRlJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzUG9wb3ZlclZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmpzUGx1bWJJbnN0YW5jZSA9IHBsdW1iZXI7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBqc1BsdW1iSW5zdGFuY2U6IGpzUGx1bWJJbnN0YW5jZTtcclxuXHJcbiAgICBwdWJsaWMgc2VyaWFsaXplID0gZnVuY3Rpb24gKCk6IHN0cmluZyB7XHJcbiAgICAgICAgY29uc3QgYWxsQWN0aXZpdHlFbGVtZW50cyA9ICQodGhpcy5jb250YWluZXIpLmZpbmQoJy5hY3Rpdml0eScpO1xyXG4gICAgICAgIGNvbnN0IHdvcmtmbG93OiBhbnkgPSB7XHJcbiAgICAgICAgICAgIGFjdGl2aXRpZXM6IFtdLFxyXG4gICAgICAgICAgICB0cmFuc2l0aW9uczogW11cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBDb2xsZWN0IGFjdGl2aXR5IHBvc2l0aW9ucy5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbEFjdGl2aXR5RWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGFjdGl2aXR5RWxlbWVudFF1ZXJ5ID0gJChhbGxBY3Rpdml0eUVsZW1lbnRzW2ldKTtcclxuICAgICAgICAgICAgdmFyIGFjdGl2aXR5SWQ6IG51bWJlciA9IGFjdGl2aXR5RWxlbWVudFF1ZXJ5LmRhdGEoJ2FjdGl2aXR5LWlkJyk7XHJcbiAgICAgICAgICAgIHZhciBhY3Rpdml0eUlzU3RhcnQgPSBhY3Rpdml0eUVsZW1lbnRRdWVyeS5kYXRhKCdhY3Rpdml0eS1zdGFydCcpO1xyXG4gICAgICAgICAgICB2YXIgYWN0aXZpdHlQb3NpdGlvbiA9IGFjdGl2aXR5RWxlbWVudFF1ZXJ5LnBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICB3b3JrZmxvdy5hY3Rpdml0aWVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgaWQ6IGFjdGl2aXR5SWQsXHJcbiAgICAgICAgICAgICAgICBpc1N0YXJ0OiBhY3Rpdml0eUlzU3RhcnQsXHJcbiAgICAgICAgICAgICAgICB4OiBhY3Rpdml0eVBvc2l0aW9uLmxlZnQsXHJcbiAgICAgICAgICAgICAgICB5OiBhY3Rpdml0eVBvc2l0aW9uLnRvcFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvbGxlY3QgYWN0aXZpdHkgY29ubmVjdGlvbnMuXHJcbiAgICAgICAgY29uc3QgYWxsQ29ubmVjdGlvbnMgPSB0aGlzLmpzUGx1bWJJbnN0YW5jZS5nZXRDb25uZWN0aW9ucygpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWxsQ29ubmVjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSBhbGxDb25uZWN0aW9uc1tpXTtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZUVuZHBvaW50OiBFbmRwb2ludCA9IGNvbm5lY3Rpb24uZW5kcG9pbnRzWzBdO1xyXG4gICAgICAgICAgICB2YXIgc291cmNlT3V0Y29tZU5hbWUgPSBzb3VyY2VFbmRwb2ludC5nZXRQYXJhbWV0ZXJzKCkub3V0Y29tZS5uYW1lO1xyXG4gICAgICAgICAgICB2YXIgc291cmNlQWN0aXZpdHlJZDogbnVtYmVyID0gJChjb25uZWN0aW9uLnNvdXJjZSkuZGF0YSgnYWN0aXZpdHktaWQnKTtcclxuICAgICAgICAgICAgdmFyIGRlc3RpbmF0aW9uQWN0aXZpdHlJZDogbnVtYmVyID0gJChjb25uZWN0aW9uLnRhcmdldCkuZGF0YSgnYWN0aXZpdHktaWQnKTtcclxuXHJcbiAgICAgICAgICAgIHdvcmtmbG93LnRyYW5zaXRpb25zLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgc291cmNlQWN0aXZpdHlJZDogc291cmNlQWN0aXZpdHlJZCxcclxuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uQWN0aXZpdHlJZDogZGVzdGluYXRpb25BY3Rpdml0eUlkLFxyXG4gICAgICAgICAgICAgICAgc291cmNlT3V0Y29tZU5hbWU6IHNvdXJjZU91dGNvbWVOYW1lXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkod29ya2Zsb3cpO1xyXG4gICAgfVxyXG59XHJcblxyXG4kLmZuLndvcmtmbG93RWRpdG9yID0gZnVuY3Rpb24gKHRoaXM6IEpRdWVyeSk6IEpRdWVyeSB7XHJcbiAgICB0aGlzLmVhY2goKGluZGV4LCBlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcclxuICAgICAgICB2YXIgd29ya2Zsb3dEZWZpbml0aW9uRGF0YTogV29ya2Zsb3dzLldvcmtmbG93ID0gJGVsZW1lbnQuZGF0YSgnd29ya2Zsb3ctZGVmaW5pdGlvbicpO1xyXG4gICAgICAgIHZhciBkZWxldGVBY3Rpdml0eVByb21wdDogc3RyaW5nID0gJGVsZW1lbnQuZGF0YSgnd29ya2Zsb3ctZGVsZXRlLWFjdGl2aXR5LXByb21wdCcpO1xyXG5cclxuICAgICAgICAkZWxlbWVudC5kYXRhKCd3b3JrZmxvd0VkaXRvcicsIG5ldyBXb3JrZmxvd0VkaXRvcihlbGVtZW50LCB3b3JrZmxvd0RlZmluaXRpb25EYXRhLCBkZWxldGVBY3Rpdml0eVByb21wdCkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCB3b3JrZmxvd0VkaXRvcjogV29ya2Zsb3dFZGl0b3IgPSAkKCcud29ya2Zsb3ctZWRpdG9yLWNhbnZhcycpLndvcmtmbG93RWRpdG9yKCkuZGF0YSgnd29ya2Zsb3dFZGl0b3InKTtcclxuXHJcbiAgICAkKCcjd29ya2Zsb3dFZGl0b3JGb3JtJykub24oJ3N1Ym1pdCcsIChzLCBlKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB3b3JrZmxvd0VkaXRvci5zZXJpYWxpemUoKTtcclxuICAgICAgICAkKCcjd29ya2Zsb3dTdGF0ZUlucHV0JykudmFsKHN0YXRlKTtcclxuICAgIH0pO1xyXG59KTsiXX0=