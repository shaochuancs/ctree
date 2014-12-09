/*
 * cTree v0.1
 * http://lifelaf.com/ctree
 *
 * Copyright (c) 2012-2013 Chuan Shao (lifelaf.com)
 *
 * Licensed same as jQuery - under the terms of either MIT License or GPL v2 License
 *
 * Components:
 *   General, Model, Parser, CSS Builder, Canvas Builder
 */

(function($) {

    "use strict";

    /*
     * cTree Core and Enter Point
     */
    $.fn.ctree = function(config) {
        return this.each(function(){
            var container = $(this);
            container.html('Loading...');

            var tree = new CTree(container, config);
            tree.init();
    
            container.empty().append(tree.getTreeHTML());
        });
    };

    /*
     * cTree static variable
     */
    $.ctree = {
        isCanvasSupported : false,
        line_center_canvasURL : "",
        line_bottom_canvasURL : "",
        plus_center_canvasURL : "",
        minus_center_canvasURL : "",
        plus_bottom_canvasURL : "",
        minus_bottom_canvasURL : "",
        plus_top_canvasURL : "",
        minus_top_canvasURL : "",
        plus_single_canvasURL : "",
        minus_single_canvasURL : "",
        line_conn_canvasURL : "",
        rgbGray : [192, 192, 192],
        rgbBlue : [112, 146, 190],
        rgbBlack : [0, 0, 0],
        treeNum : 0,
        //EVENTDATAKEY_SELECT_NODE : "selectNode",
        //EVENTDATAKEY_DESELECT_NODE : "deSelectNode",
        //EVENTDATAKEY_ALL_SELECTED_NODES : "allSelectedNodes",
        //EVENTDATAKEY_ALL_DESELECTED_NODES : "allDeSelectedNodes",
        EVENT_SELECT : "CTREE_EVENT_SELECT",
        EVENT_DESELECT : "CTREE_EVENT_DESELECT"
    };

    /*
     * cTree Component: Model
     * cTree mode: select_mode, singleSelect_mode, noCancelSelect_mode
     * cTree config: cTreeImgs, forceUseImgs
     */
    function CTree(container, config) {
        this.id = $.ctree.treeNum;
        $.ctree.treeNum++;
        
        this.container = container;
        this.config = config;
        this.treeHTML = $(config.json_data ? buildHTML(config, this.id) : '');
        
        this.lastSelectedArray = [];
    }
    CTree.prototype = {
        init : function() {
            this.treeHTML.children().first().addClass('ctree_top');
            this.treeHTML.find('ul').andSelf().each(function(i, ul) {
                $(ul).children().last().addClass('ctree_last');
            });

            if ($('#ctree_defaultCSS').length === 0) {
                buildCSS();
            }
            
            if ($('#cTreeCanvasImgs').length===0) {
                buildCanvas();
                buildCanvasNodeIconCSS();
            }
            
            if (this.config.cTreeImgs && (!$.ctree.isCanvasSupported || this.config.forceUseImgs===true)) {
                buildCtreeImgsNodeIconCSS(this.config.cTreeImgs, this.id);
            }
  
            this.container.delegate('.ctree_toggleNode', 'click', $.proxy(this._toggleNode, this));
            
            if (this.config.select_mode || this.config.singleSelect_mode) {
                this.container.delegate('ul.ctree_root li>a', 'click', $.proxy(this._clickNode, this));
                this.container.delegate('ul.ctree_root', 'click', $.proxy(this._clickVoidArea, this));
            }
        },
        getTreeHTML : function() {
            return this.treeHTML;
        },
        _toggleNode : function(e) {
            var toggle = $(e.currentTarget);
            if (toggle.hasClass('ctree_nodeClose')) {
                this._openNode(toggle);
            } else if (toggle.hasClass('ctree_nodeOpen')) {
                this._closeNode(toggle);
            }
        },
        _openNode : function(toggle) {
            toggle.removeClass('ctree_nodeClose').addClass('ctree_nodeOpen');
            this._getUL(toggle).slideDown();
        },
        _closeNode : function(toggle) {
            toggle.removeClass('ctree_nodeOpen').addClass('ctree_nodeClose');
            this._getUL(toggle).slideUp();
            
            var selectedChildren = toggle.parent().children().find('.ctree_selected');
            selectedChildren.removeClass('ctree_selected');
            for (var i=0; i<selectedChildren.length; i++) {
                this.lastSelectedArray.splice($(this.lastSelectedArray).index(selectedChildren[i]), 1);
            }
        },
        _getUL : function(toggle) {
            return toggle.parent().children('ul');
        },
        _clickNode : function(e) {
            var target = $(e.target);
            
            if (this.config.singleSelect_mode) {
                this._simpleClickNode(target);
                return;
            }
            
            if (e.ctrlKey==true || e.metaKey==true) {
                this._ctrlClickNode(target);
            } else if (e.shiftKey==true) {
                this._shiftClickNode(target);
            } else {
                this._simpleClickNode(target);
            }
        },
        _ctrlClickNode : function(target) {
            if (target.hasClass('ctree_selected')) {
                target.removeClass('ctree_selected');
                this.lastSelectedArray.splice($(this.lastSelectedArray).index(target[0]), 1);
                
                this.container.trigger($.ctree.EVENT_DESELECT, {"deSelectNode":target.attr('cTreeNodeID'), "allSelectedNodes":this._getSelectedNodesIDs()});
            } else {
                target.addClass('ctree_selected');
                this.lastSelectedArray.push(target[0]);
                
                this.container.trigger($.ctree.EVENT_SELECT, {"selectNode":target.attr('cTreeNodeID'), "allSelectedNodes":this._getSelectedNodesIDs()});
            }
        },
        _shiftClickNode : function(target) {
            var visibleNodes = target.closest('.ctree_root').find('li>a').filter(function() {
                    return $(this).closest('.ctree_children').css('display') !== 'none'
                });
            var lastSelectedNode = this.lastSelectedArray[this.lastSelectedArray.length - 1];

            var lastIndex;
            if (!lastSelectedNode) {
                lastIndex = 0;
            } else {
                lastIndex = visibleNodes.index(lastSelectedNode);
            }

            var currentIndex = visibleNodes.index(target[0]);

            var reverse = lastIndex > currentIndex;
            for (var i=0; i<=Math.abs(currentIndex-lastIndex); i++) {
                var node;
                if (reverse) {
                    node = $(visibleNodes[lastIndex - i]);
                } else {
                    node = $(visibleNodes[lastIndex + i]);
                }

                if (node.hasClass('ctree_selected')) {
                    node.removeClass('ctree_selected');
                    this.lastSelectedArray.splice($(this.lastSelectedArray).index(node[0]), 1);
                }

                node.addClass('ctree_selected');
                this.lastSelectedArray.push(node[0]);
            }
            
            this.container.trigger($.ctree.EVENT_SELECT, {"selectNode":target.attr('cTreeNodeID'), "allSelectedNodes":this._getSelectedNodesIDs()});
        },
        _simpleClickNode : function(target) {
            target.closest('.ctree_root').find('.ctree_selected').removeClass('ctree_selected');
            target.addClass('ctree_selected');
            this.lastSelectedArray = [target[0]];

            this.container.trigger($.ctree.EVENT_SELECT, {"selectNode":target.attr('cTreeNodeID')});
        },
        _clickVoidArea : function(e) {
            if (this.config.noCancelSelect_mode) {
                return;
            }
            
            if (e.target.tagName!="A" && e.target.tagName!="BUTTON" && this.lastSelectedArray.length>0) {
                $(e.target).closest('.ctree_root').find('.ctree_selected').removeClass('ctree_selected');
                this.container.trigger($.ctree.EVENT_DESELECT, {'allDeSelectedNodes':this._getSelectedNodesIDs()});
                
                this.lastSelectedArray = [];
            }
        },
        _getSelectedNodesIDs : function() {
            var selectedNodesIDs = [];
            for (var i=0; i<this.lastSelectedArray.length; i++) {
                selectedNodesIDs.push($(this.lastSelectedArray[i]).attr('cTreeNodeID'));
            }
            return selectedNodesIDs;
        }
    };

    /*
     * cTree Component: Parser
     */
    //Build Tree HTML from source data.
    function buildHTML(config, treeId) {
        var html = '<ul id="cTree_' + treeId + '" class="ctree_root';
        if (config.select_mode || config.singleSelect_mode) {
            html = html.concat(' ctree_selectMode');
        }
        html = html.concat('">');

        var json = config.json_data;
        if (json.name) {
            html = html.concat(parseJSON(json, config.types));
        } else if (hasChildren(json)) {
            html = html.concat(parseArray(json.children, config.types));
        }
        return html.concat('</ul>');
    }

    //Convert JSON object to Tree HTML String.
    function parseJSON(json, types) {
        var html = '<li unselectable="on">';
        if (hasChildren(json)) {
            html = html.concat('<button class="ctree_toggleNode ctree_nodeClose"></button>' + wrapAnchor(json, types));
            html = html.concat('<ul class="ctree_children">');
            html = html.concat(parseArray(json.children, types));
            html = html.concat('</ul>');
        } else {
            html = html.concat('<button class="ctree_leaf"></button>' + wrapAnchor(json, types));
        }
        return html.concat('</li>');
    }

    function appendString(string) {
        return '<li unselectable="on"><button class="ctree_leaf"></button><a>' + escapeHTML(string) + '</a></li>';
    }
    
    //Convert Array object to Tree HTML String.
    function parseArray(array, types) {
        var html = '';
        $.each(array, function(i) {
            if ($.type(array[i]) == "string") {
                html = html.concat(appendString(array[i]));
            } else {
                html = html.concat(parseJSON(array[i], types));
            }
        });
        return html;
    }

    function hasChildren(json) {
        return json.children && $.isArray(json.children);
    }

    function wrapAnchor(json, types) {
        if (!json.name) {
            json.name = json.id;
        }
        
        var escapedName = escapeHTML(json.name);
        if (!json.id) {
            json.id = '_cTreeNode_'+escapedName;
        }
        
        if (json.type && types && types[json.type]) {
            return '<a cTreeNodeID="' + json.id + '"><img src="' + types[json.type].icon + '" width="10" height="10" />' + escapedName + '</a>';
        }
        return '<a cTreeNodeID="' + json.id + '">' + escapedName + '</a>';
    }
    
    function escapeHTML(name) {
        return name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /*
     * cTree Component: CSS Builder
     */
    function buildCSS() {
        var defaultCSS = $('<style type="text/css" id="ctree_defaultCSS">' +
                    'ul.ctree_root,ul.ctree_children{list-style-type:none;padding:0px;text-align:left}' +
                    'ul.ctree_children{display:none}' +
                    'ul.ctree_root button{width:18px;height:18px;border:0;outline:none;vertical-align:middle;margin-top:-2px}' +
                    'ul.ctree_root li{line-height:16px;font-size:12px;margin-left:18px;white-space:nowrap;user-select:none;-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none}' +
                    'button.ctree_toggleNode{cursor:pointer}' +
                    '.ctree_leaf,.ctree_toggleNode{background-repeat:no-repeat}' +
                    'li.ctree_last>ul.ctree_children{background:transparent}</style>');
        var selectModeCSS = $('<style type="text/css" id="ctree_selectModeCSS">ul.ctree_root.ctree_selectMode li>a{cursor:pointer;border-radius:2px;-moz-border-radius:2px}' +
                    'ul.ctree_root.ctree_selectMode li>a:hover{background-color:#c0c0c0}' +
                    'ul.ctree_root.ctree_selectMode li>a.ctree_selected{background-color:#4171ef;color:white}</style>');            
        
        defaultCSS.appendTo('head');
        selectModeCSS.appendTo('head');
    }
    
    function buildCanvasNodeIconCSS() {
        var canvasNodeIconCSS = $('<style type="text/css" id="ctree_canvasNodeIconCSS">' +
                    'button.ctree_leaf{background:url("' + $.ctree.line_center_canvasURL + '")}' +
                    'li.ctree_last>button.ctree_leaf{background:url("' + $.ctree.line_bottom_canvasURL + '")}' +
                    'button.ctree_toggleNode.ctree_nodeClose{background:url("' + $.ctree.plus_center_canvasURL + '")}' +
                    'button.ctree_toggleNode.ctree_nodeOpen{background:url("' + $.ctree.minus_center_canvasURL + '")}' +
                    'li.ctree_last>button.ctree_toggleNode.ctree_nodeClose{background:url("' + $.ctree.plus_bottom_canvasURL + '")}' +
                    'li.ctree_last>button.ctree_toggleNode.ctree_nodeOpen{background:url("' + $.ctree.minus_bottom_canvasURL + '")}' +
                    'li.ctree_top>button.ctree_toggleNode.ctree_nodeClose{background:url("' + $.ctree.plus_top_canvasURL + '")}' +
                    'li.ctree_top>button.ctree_toggleNode.ctree_nodeOpen{background:url("' + $.ctree.minus_top_canvasURL + '")}' +
                    'li.ctree_top.ctree_last>button.ctree_toggleNode.ctree_nodeClose{background:url("' + $.ctree.plus_single_canvasURL + '")}' +
                    'li.ctree_top.ctree_last>button.ctree_toggleNode.ctree_nodeOpen{background:url("' + $.ctree.minus_single_canvasURL + '")}' +
                    'ul.ctree_children{background: url("' + $.ctree.line_conn_canvasURL + '") repeat-y}</style>');
        canvasNodeIconCSS.appendTo('head');
    }

    function buildCtreeImgsNodeIconCSS(cTreeImgs, cTreeId) {
        var cTreeImgsNodeIconCSS = $('<style type="text/css" id="ctree_' + cTreeId + '_imageNodeIconCSS">' +
            '#cTree_' + cTreeId + ' button.ctree_leaf{background:url("' + cTreeImgs + '");background-position:0 -36px}' +
            '#cTree_' + cTreeId + ' li.ctree_last>button.ctree_leaf{background:url("' + cTreeImgs + '");background-position:0 -54px}' +
            '#cTree_' + cTreeId + ' button.ctree_toggleNode.ctree_nodeClose{background:url("' + cTreeImgs + '");background-position:0 -18px}' +
            '#cTree_' + cTreeId + ' button.ctree_toggleNode.ctree_nodeOpen{background:url("' + cTreeImgs + '");background-position:-18px -18px}' +
            '#cTree_' + cTreeId + ' li.ctree_last>button.ctree_toggleNode.ctree_nodeClose{background:url("' + cTreeImgs + '");background-position:-36px 0}' +
            '#cTree_' + cTreeId + ' li.ctree_last>button.ctree_toggleNode.ctree_nodeOpen{background:url("' + cTreeImgs + '");background-position:-18px -36px}' +
            '#cTree_' + cTreeId + ' li.ctree_top>button.ctree_toggleNode.ctree_nodeClose{background:url("' + cTreeImgs + '");background-position:0 0}' +
            '#cTree_' + cTreeId + ' li.ctree_top>button.ctree_toggleNode.ctree_nodeOpen{background:url("' + cTreeImgs + '");background-position:-18px 0}' +
            '#cTree_' + cTreeId + ' li.ctree_top.ctree_last>button.ctree_toggleNode.ctree_nodeClose{background:url("' + cTreeImgs + '");background-position:-36px -18px}' +
            '#cTree_' + cTreeId + ' li.ctree_top.ctree_last>button.ctree_toggleNode.ctree_nodeOpen{background:url("' + cTreeImgs + '");background-position:-36px -36px}' +
            '#cTree_' + cTreeId + ' ul.ctree_children{background: url("' + cTreeImgs + '");background-position:-54px 0;background-repeat:repeat-y}' +
            '#cTree_' + cTreeId + ' li.ctree_last>ul.ctree_children{background:transparent}</style>');
        cTreeImgsNodeIconCSS.appendTo('head');
    }
    
    /*
     * cTree Component: Canvas Builder
     */
    function buildCanvas() {
        var cTreeCanvasImgsCtner = $('<div id="cTreeCanvasImgs" style="display:none;"></div>');
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_lineCenterCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_lineBottomCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_plusCenterCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_minusCenterCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_plusBottomCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_minusBottomCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_plusTopCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_minusTopCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_plusSingleCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_minusSingleCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.append($('<canvas id="cTree_lineConnCanvas" width="18" height="18"></canvas>'));
        cTreeCanvasImgsCtner.appendTo('body');

        if (!getLineCenterCanvas().getContext) {
            $.ctree.isCanvasSupported = false;
        } else {
            $.ctree.isCanvasSupported = true;
            buildLineCenterCanvas();
            buildPlusCenterCanvas();
            buildLineBottomCanvas();
            buildLineConnCanvas();
            buildMinusCenterCanvas();
            buildPlusBottomCanvas();
            buildMinusBottomCanvas();
            buildPlusTopCanvas();
            buildMinusTopCanvas();
            buildPlusSingleCanvas();
            buildMinusSingleCanvas();
        }
    }

    function getLineCenterCanvas() {
        return document.getElementById("cTree_lineCenterCanvas");
    }

    function buildLineCenterCanvas() {
        var canvas = getLineCenterCanvas();
        var context = canvas.getContext("2d");

        var imgData = context.createImageData(18, 18);
        for (var i=1; i<10; i++) {
            renderGrayDot(imgData, 9, 2*i);
        }
        for (var i=11; i<18; i=i+2) {
            renderGrayDot(imgData, i, 10);
        }
        context.putImageData(imgData, 0, 0);
        
        $.ctree.line_center_canvasURL = canvas.toDataURL();
    }

    function getPlusCenterCanvas() {
        return document.getElementById("cTree_plusCenterCanvas");
    }

    function buildPlusCenterCanvas() {
        var canvas = getPlusCenterCanvas();
        var context = canvas.getContext("2d");
        
        var imgData = context.createImageData(18, 18);
        //renderUpperTwoDot
        renderGrayDot(imgData, 9, 2);
        renderGrayDot(imgData, 9, 4);
        //renderBottomTwoDot
        renderGrayDot(imgData, 9, 16);
        renderGrayDot(imgData, 9, 18);
        //renderRightTwoDot
        renderGrayDot(imgData, 15, 10);
        renderGrayDot(imgData, 17, 10);
        //renderBlueRectangle
        for (var i=6; i<14; i++) {
            renderBlueDot(imgData, i-1, 6);
            renderBlueDot(imgData, 13, i);
            renderBlueDot(imgData, 5, i+1);
            renderBlueDot(imgData, i, 14);
        }
        //renderPlusSign
        for (var i=7; i<12; i++) {
            renderBlackDot(imgData, i, 10);
            renderBlackDot(imgData, 9, i+1);
        }
        context.putImageData(imgData, 0, 0);
        
        $.ctree.plus_center_canvasURL = canvas.toDataURL();
    }

    function buildLineBottomCanvas() {
        var canvas = document.getElementById("cTree_lineBottomCanvas");
        var context = canvas.getContext("2d");
        
        context.drawImage(getLineCenterCanvas(), 0, 0);
        var imgData = context.getImageData(0, 0, 18, 18);
        for (var i=6; i<10; i++) {
            removeDot(imgData, 9, 2*i);
        }
        context.putImageData(imgData, 0, 0);
        
        $.ctree.line_bottom_canvasURL = canvas.toDataURL();
    }

    function buildLineConnCanvas() {
        var canvas = document.getElementById("cTree_lineConnCanvas");
        var context = canvas.getContext("2d");
        
        context.drawImage(getLineCenterCanvas(), 0, 0);
        var imgData = context.getImageData(0, 0, 18, 18);
        for (var i=5; i<9; i++) {
            removeDot(imgData, 2*i+1, 10);
        }
        context.putImageData(imgData, 0, 0);
        
        $.ctree.line_conn_canvasURL = canvas.toDataURL();
    }

    function buildMinusCenterCanvas() {
        buildCustomCanvas("cTree_minusCenterCanvas", [removePlus], "minus_center_canvasURL");
    }

    function buildPlusBottomCanvas() {
        buildCustomCanvas("cTree_plusBottomCanvas", [removeBottomTwoDot], "plus_bottom_canvasURL");
    }
    
    function buildMinusBottomCanvas() {
        buildCustomCanvas("cTree_minusBottomCanvas", [removeBottomTwoDot, removePlus], "minus_bottom_canvasURL");
    }
    
    function buildPlusTopCanvas() {
        buildCustomCanvas("cTree_plusTopCanvas", [removeUpperTwoDot], "plus_top_canvasURL");
    }
    
    function buildMinusTopCanvas() {
        buildCustomCanvas("cTree_minusTopCanvas", [removeUpperTwoDot, removePlus], "minus_top_canvasURL");
    }
    
    function buildPlusSingleCanvas() {
        buildCustomCanvas("cTree_plusSingleCanvas", [removeUpperTwoDot, removeBottomTwoDot], "plus_single_canvasURL");
    }

    function buildMinusSingleCanvas() {
        buildCustomCanvas("cTree_minusSingleCanvas", [removeUpperTwoDot, removeBottomTwoDot, removePlus], "minus_single_canvasURL");
    }
    
    function buildCustomCanvas(elementId, removeFnArray, cTreeCanvasVar) {
        var canvas = document.getElementById(elementId);
        var context = canvas.getContext("2d");
        context.drawImage(getPlusCenterCanvas(), 0, 0);
        var imgData = context.getImageData(0, 0, 18, 18);
        for (var i=0; i<removeFnArray.length; i++) {
            removeFnArray[i](imgData);
        }
        context.putImageData(imgData, 0, 0);
        
        $.ctree[cTreeCanvasVar] = canvas.toDataURL();
    }

    function renderGrayDot(imgData, x, y) {
        renderDot(imgData, x, y, $.ctree.rgbGray);
    }

    function renderBlueDot(imgData, x, y) {
        renderDot(imgData, x, y, $.ctree.rgbBlue);
    }

    function renderBlackDot(imgData, x, y) {
        renderDot(imgData, x, y, $.ctree.rgbBlack);
    }

    function renderDot(imgData, x, y, rgbArray) {
        var offset = getOffset(imgData, x, y);
        imgData.data[offset] = rgbArray[0];
        imgData.data[offset+1] = rgbArray[1];
        imgData.data[offset+2] = rgbArray[2];
        imgData.data[offset+3] = 255;
    }

    function removeDot(imgData, x, y) {
        var offset = getOffset(imgData, x, y);
        imgData.data[offset+3] = 0;
    }

    function getOffset(imgData, x, y) {
        return (y-1)*4*imgData.width + (x-1)*4;
    }

    function removePlus(imgData) {
        removeDot(imgData, 9, 8);
        removeDot(imgData, 9, 9);
        removeDot(imgData, 9, 11);
        removeDot(imgData, 9, 12);
    }

    function removeBottomTwoDot(imgData) {
        removeDot(imgData, 9, 16);
        removeDot(imgData, 9, 18);
    }

    function removeUpperTwoDot(imgData) {
        removeDot(imgData, 9, 2);
        removeDot(imgData, 9, 4);
    }

})(jQuery);