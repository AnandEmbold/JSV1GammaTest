"use strict";
/*jshint sub:true*/
(function (g) {
    g.complexMethodList = function () {

        //---------- PRIVATE VARS -----------
        var PATH_COMPLEX_METHOD_LIST = '/repositories/' + historyManager.get('currentSubSystemUid') + '/testhungrymethods';
        var componentList, list_current_count, list_current_page, records_per_page, hasError, total_list_results, total_list_pages, componentlistStepper;

        var settings = {};
        var plugin_options = {};
        var panel_holder;
        //------------ PLUGIN SUBSCRIPTIONS ------------------
        e.subscribe('LOAD_LIST_PAGE', onStepperClick);

        //---------- PRIVATE METHODS ------------

        //---------- INITIALIZE -------------  
        function init(holder) {
            panel_holder = holder;
            list_current_count = 0;
            list_current_page = 1;
            records_per_page = 20;
            hasError = false;

            $(".plugin_container.plugin_complexMethodList").remove();
            var plugin_container = $('<div/>', {
                class: 'plugin_container plugin_complexMethodList float_left unselectable'
            });
            panel_holder.append(plugin_container);
            panel_holder.css('overflow', 'auto');
            getComplexMethodListData();
        }

        function clearMemory() {
            /*-------- REMOVING EVENTS ------*/
            if ($('.dropDown_list').length > 0) {
                $('.dropDown_list').remove();
            }
            $(window).off('resize.plugin_complexMethodList');
            $('.componenlist_dropdown').off('click');
            $('.dropDown_list .list_data').off('click hover');
            $('.list_header').off('click');
            $(document).off('click.plugin_complexMethodList');
            $('.list_row').off('click hover');
            if (panel_holder !== null && panel_holder !== undefined) {
                panel_holder.off('scroll.plugin_complexMethodList');
            }
            $('.componentlist_pagination').remove();

            $(".parameter_wrapper").off('scroll.plugin_complexMethodList');
            e.unSubscribe('LOAD_LIST_PAGE');
        }

        //----------GET componentLIST DATA
        function getComplexMethodListData() {
            if ($('.popup_container').length > 0) {
                $('.popup_container').remove();
            }

            if (g.loadFromHistory) // if browser back button or refresh is clicked, get data from history
            {
                var currentHistoryState = g.decodeURL(window.location.hash);
                if (!($.isEmptyObject(currentHistoryState))) {
                    settings = currentHistoryState.request_data;
                    //setting localstorage history values as per browser parameters 

                    list_current_count = parseInt(settings.start_index);
                    list_current_page = parseInt(list_current_count / records_per_page) + 1;
                    g.loadFromHistory = false;
                }

            } else // else push data to history
            {
                list_current_count = (list_current_page - 1) * records_per_page;
                //these are the parameters that are sent along with request
                settings = {
                    projectId: historyManager.get('currentSubSystem'),
                    snapshotId: historyManager.get('selectedSnapshots')[0].id,
                    nodeId: historyManager.get('currentBreadcrumb').id,
                    offset: list_current_count,
                    limit: records_per_page
                };
                let historySettings = {
                    project_id: historyManager.get('currentSubSystem'),
                    snapshot_id: historyManager.get('selectedSnapshots')[0].id,
                    node_id: historyManager.get('currentBreadcrumb').id,
                    start_index: list_current_count,
                    count: records_per_page
                };
                //these are the parameters used for client side manipulations
                plugin_options = {};
                g.pushHistory('complex_method_list', historyManager.get('currentContext'), plugin_options, historySettings);
            }
            e.loadJSON(PATH_COMPLEX_METHOD_LIST, listRenderer, settings, true);
        }

        function listRenderer(data, status) {
            if (status == 'success') {
                componentList = data;
                if (data.hasOwnProperty("message")) {
                    hasError = true;
                    if ($('.componentlist_pagination').length > 0) {
                        $('.componentlist_pagination').remove();
                    }
                    g.sendErrorNotification(data, PATH_COMPLEX_METHOD_LIST, $('.plugin_complexMethodList'));
                } else {
                    hasError = false;
                    renderPluginData();
                }
            } else if (status == 'error') {
                hasError = true;
                if ($('.componentlist_pagination').length > 0) {
                    $('.componentlist_pagination').remove();
                }
                g.sendErrorNotification(data, PATH_COMPLEX_METHOD_LIST, $('.plugin_complexMethodList'));
            }
        }

        //--------CREATE componentLIST-----------
        function renderPluginData() {
            var function_list = $('.plugin_complexMethodList');
            function_list.html('');
            function_list.removeClass('plugin_not_available_error_parent');

            if (parseInt(componentList.totalComponents.value) === 0 || ((parseInt(componentList.totalComponents.value) == 1) && (componentList.complexMethod[0].id === null))) {
                hasError = true;
                // var data = {status:'info',message:'No data to display',details:'No content'};
                if ($('.componentlist_pagination').length > 0) {
                    $('.componentlist_pagination').remove();
                }
                // g.sendErrorNotification(data,PATH_COVERAGE_COMPONENTLIST,$('.plugin_componentList'));

                var data = {
                    status: 'info',
                    type: 'warning',
                    is_info: false,
                    message: i18next.t('common.info_title.info_title_complex_methods'),
                    details: i18next.t('common.info_description.no_content'),
                    is_add_button: false,
                    button_text: '',
                    is_task_management_button: false,
                    task_management_text: ''
                };
                g.error_message_view(data, $('.plugin_complexMethodList'));

                handleEvents();
                if (historyManager.get('currentBreadcrumb').id != $('#breadcrumb .header_item:last').attr('nodeid')) {
                    e.notify(g.notifications.PLUGIN_LOADED);
                }
            } else {
                if (!hasError) {
                    total_list_results = componentList.totalComponents.value;
                    addPagination();
                    addRows();
                    handleEvents();
                    if (historyManager.get('currentBreadcrumb').id != $('#breadcrumb .header_item:last').attr('nodeid')) {
                        e.notify(g.notifications.PLUGIN_LOADED);
                    }
                }
            }
        }

        //-----------ADD PAGINATION CONTROL FOR componentLIST-------------
        function addPagination() {
            $('.componentlist_pagination').remove();
            if (parseInt(componentList.totalComponents.value) === 0 || ((parseInt(componentList.totalComponents.value) == 1) && (componentList.complexMethod[0].id === null))) {} else {
                var componentlist_pagination = $('<div/>', {
                    class: 'componentlist_pagination float_left clear fill_light'
                });
                var pagination_title = $('<div/>', {
                    class: 'pagination_title language_text float_left p text_transform_capitalize'
                }).html(g.print('pages'));
                pagination_title.attr('data-language_id', 'pages');
                var colon = $('<div/>', {
                    class: 'colon p'
                }).html(':');
                var componentlist_stepper = $('<div/>', {
                    class: 'componentlist_stepper float_left'
                });
                var page_number = $('<div/>', {
                    class: 'page_number p'
                });
                var showing_div = $('<div/>', {
                    class: 'showing_div p color_medium fill_base'
                });
                var showing_text = $('<div/>', {
                    class: 'showing_text language_text float_left text_transform_capitalize'
                }).html(g.print('showing'));
                showing_text.attr('data-language_id', 'showing');
                var showing_value = $('<div/>', {
                    class: 'showing_value'
                });
                showing_div.append(showing_text, showing_value);
                componentlist_pagination.append(pagination_title, colon, page_number, componentlist_stepper, showing_div);
                panel_holder.append(componentlist_pagination);
                e.enablePlugin('numericStepper', addListNumericStepper);
            }
        }

        function addListNumericStepper() {
            componentlistStepper = new e.numericStepper({
                holder: '.componentlist_stepper',
                stepperType: 'componentlist',
                callback: {
                    onTextChange: ''
                },
                notify: {
                    onTextChange: 'LOAD_LIST_PAGE'
                }
            });
            total_list_pages = Math.ceil(total_list_results / records_per_page);
            componentlistStepper.setValue(list_current_page);
            componentlistStepper.setMaxValue(total_list_pages);
            $('.page_number').html(componentlistStepper.getValue() + '/' + total_list_pages);
            $('.showing_value').html((list_current_count + 1) + " - " + (list_current_count + componentList.complexMethod.length) + " / " + total_list_results);

            if (total_list_pages <= 1) {
                $('.componentlist_pagination').css('position', 'unset');
                $('.componentlist_pagination').css('margin-left', '3.75em');
                $('.componentlist_pagination .pagination_title').hide();
                $('.componentlist_pagination .colon').hide();
                $('.componentlist_pagination .page_number').hide();
                $('.componentlist_pagination .componentlist_stepper').hide();
            }
        }

        // --------- CREATE componentLIST TABLE & ADD ROWS ---------------------------------
        function addRows() {
            var noOfColumns = 4;
            var noOfRows = componentList.complexMethod.length;
            var plugin_holder = $('.plugin_complexMethodList');
            var list_holder = $('<div/>', {
                class: 'method_list_holder'
            });
            plugin_holder.html('').append(list_holder);

            var availbale_list_height = $('.emulsion_panel .content_holder  ').outerHeight(true) - $('.componentlist_pagination').outerHeight(true) - 5;
            list_holder.css('max-height', availbale_list_height);
            var columnWidthArray = [4, 32, 32, 32];
            var columnClassArray = ['float_left serial_no p',
                'float_left ellipsis list_width p method_name',
                'float_left component_name p',
                'float_left p test_worthiness'
            ];
            var column_data = [];
            var i = 0;

            if (componentList.complexMethod.length > 0) {
                $.each(componentList.complexMethod[0], function (key, value) {
                    var obj = {
                        'column_name': '',
                        'width': '',
                        'class': ''
                    };
                    obj.column_name = key;
                    obj.width = columnWidthArray[i];
                    obj.class = columnClassArray[i];
                    column_data.push(obj);
                    i++;
                });
            }
            new e.list({
                holder: list_holder,
                no_of_columns: noOfColumns,
                no_of_rows: noOfRows,
                hasMargin: false,
                data: componentList.complexMethod,
                listOwner: 'System',
                column_data: column_data,
                notify: {
                    onListItemClick: ''
                }
            });
            i = 0;
            $('.method_list_holder .list_container .list_item').each(function () {
                var list_item = $(this);
                list_item.attr({
                    'data-formed_issue_id': 'DI' + componentList.complexMethod[i].id,
                    'data-id': componentList.complexMethod[i].nodeId,
                    'data-name': componentList.complexMethod[i].displayName,
                    'data-component_id': componentList.complexMethod[i].parentId,
                    'data-component_name': componentList.complexMethod[i].parentDisplay
                });
                for (var j = 0; j < noOfColumns; j++) {
                    var list_column = $('<div/>', {
                        class: columnClassArray[j]
                    });
                    //var formatted_rating = g.formatRating(componentList[i].overall_rating);
                    //if (componentList[i].sub_systems > 0)
                    list_column.css('width', columnWidthArray[j] + '%');
                    list_item.append(list_column);
                    switch (j) {
                        case 0:
                            list_column.html((i + 1) + '.');
                            break;
                        case 1:
                            var method_icon = $('<div/>', {
                                class: 'list_icon ic-sq-method'
                            });
                            var text_content = $('<div/>', {
                                class: 'text_content ellipsis'
                            }).html(componentList.complexMethod[i].displayName);
                            list_column.append(method_icon, text_content).attr("title", componentList.complexMethod[i].signature);
                            break;
                        case 2:
                            var method_icon = $('<div/>', {
                                class: 'list_icon ic-sq-component'
                            });
                            var text_content = $('<div/>', {
                                class: 'text_content ellipsis'
                            }).html(componentList.complexMethod[i].parentDisplay);
                            list_column.append(method_icon, text_content).attr("title", componentList.complexMethod[i].parentSignature);
                            break;
                        case 3:
                            list_column.html(i18next.t('complex_method.test_worthiness') + " : " + componentList.complexMethod[i].severity);
                            break;
                        default:
                            break;
                    }
                }
                i++;
                $('[title]').tooltipster();
            });
        }

        // ------------ RENDER PLUGIN OPTIONS---------
        function renderOptionData() {

        }

        //------------updating plugin data on click of update button in plugin option list----------------------
        function updatePluginData() {
            $('.dropDown_list').remove();
            $('.component_table').removeClass('no_mouse_events');
            list_current_page = 1;
            e.notify(g.notifications.DATA_REQUESTED);
            getComplexMethodListData();
        }
        //---------- HANDLE EVENTS ------------		
        function handleEvents() {


            $(window).on("resize.plugin_complexMethodList", function () {
                if (!hasError) {
                    let availbale_list_height = $('.emulsion_panel .content_holder').outerHeight(true) - $('.componentlist_pagination').outerHeight(true) - 5;
                    $('.method_list_holder').css('max-height', availbale_list_height);
                } else {
                    let availbale_list_height = g.contentHeight() - 200;
                    $('.plugin_complexMethodList').width(panel_holder.width() - 15);
                    $('.plugin_complexMethodList').height(availbale_list_height);

                }
            });


            $('.list_item').on('click.plugin_complexMethodList', function () {
                g.issue_type_id = 1;
                g.issue_id = $(this).attr('data-formed_issue_id');
                historyManager.set('currentContext', 'components');
                g.setPluginHistory('component_explorer');
                historyManager.set('currentBreadcrumb', {
                    "id": $(this).attr('data-component_id'),
                    "name": $(this).attr('data-component_name')
                });
                e.notify(g.notifications.PLUGIN_UPDATE);
            });
        }

        //-------------------- called on pagination click ----------------------
        function onStepperClick() {
            list_current_page = componentlistStepper.getValue();
            e.notify(g.notifications.DATA_REQUESTED);
            getComplexMethodListData();
        }



        //---------- PUBLIC METHODS ------------
        return {
            initPlugin: function (holder) {
                init(holder);
            },
            enableOptionPlugins: function () {
                renderOptionData();
            },
            renderOptionData: function () {
                renderOptionData();
            },
            updatePluginData: function () {
                updatePluginData();
            },
            clearMemory: function () {
                clearMemory();
            }
        };
    };
    return g;
})(g);