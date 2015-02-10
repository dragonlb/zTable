
/**
* Author:	Lb
* Date	:	2013-07-09
* tableSetting 内容描述{
	align	:	排列 [horizontal, vertical, mix] = [横表，纵表，纵横表]
    head	:	表头	 [{value: '序', width: 30},{value: '姓名', width: 60},{value:'工作信息', subs:[{value: '单位', width: 60}, {value: '工资', width: 60}]}
		isKey: 结果集Key		value:	表头描述文字		width: 宽度		align: 排列[left, right, center]	
		render:	输出转换函数，参数为当前行(trData)		subs: 当前字段子集(跌代结构，支持多行表头)
	resultSet:	结果集	{... data: [...{}]}
		total:	数据集总数
		data:	数据集KEY，数组类型
	pageSize:	每页显示数据条数
	pageIndex:	当前页码
	height:		内容高度
	width:		表格宽度
	resizable:	可变大小
	afterLoads:	加载完数据后回调函数列表
	diy:		自定义变量{
		p1	: 'ARRAY',	//数组类型变量
		p2	: 'STRING',	//字符串类型变量
		p3	: 'OBJECT'	//对象类型变量
	}
* } 
*/

if(!_zView)	var _zView = {};
_zView.zTableData = {};

function zTable(renderId, tableSetting){
	this.UUID = zTableTool.getNextUUID();
	this.setting = tableSetting?tableSetting:{lazyBind:false};
	this.id = renderId;
	this.jRender = $("#"+renderId);
	this.heads = {};
	
	if(!zTable.initial){
		zTable.initial = true;
		if(zTableTool.browser.ie() && parseInt(zTableTool.browser.ie())<=7){
			this.setting.resizable = false;
		}
		zTable.prototype._loadData = function(){
			var self = this;
			if(self.setting.actionUrl){
				var param = {};
				if(self.setting.defaultParam){
					param = self.setting.defaultParam;
				}
				if(typeof self.setting.attachParam == 'function'){
					param = $.extend(param, self.setting.attachParam.call(this));
				}
				if(typeof self.setting.attachParam=='object'){
					param = $.extend(param, self.setting.attachParam);
				}
				param.orderBy = self.tableSet?self.tableSet.orderBy():self.setting.orderBy;
				param.order = self.tableSet?self.tableSet.order():self.setting.order;
				param.pageIndex = self.tableSet?self.tableSet.pageIndex():self.setting.pageIndex;
				param.currentPage = self.tableSet?self.tableSet.pageIndex():self.setting.pageIndex;
				param.pageSize = self.tableSet?self.tableSet.pageSize():self.setting.pageSize;
				$.ajax({
					url: self.setting.actionUrl,
					data: param,
					dataType: 'json',
					type: 'post',
					success: function(resultData, status, jqXHR){
						self.resultSet.removeAll();
						self.tableSet.total(resultData.pageListVO.pageList.length);
						var start = (self.tableSet.pageIndex()-1)*self.tableSet.pageSize();
						for(var i=start,j=0;i<self.tableSet.total() && j<self.tableSet.pageSize();i++,j++){
							self.resultSet.push(resultData.pageListVO.pageList[i]);
						}
						if(zTableTool.browser.ie() && parseInt(zTableTool.browser.ie())<=7){
							var jLockHead = $("#"+aimId).find(".zero-panel-viewport");
							jLockHead.html(jLockHead.html());
						}
						if(!self.setting.afterLoads || self.setting.afterLoads.length<=0)	return;
						$.each(self.setting.afterLoads, function(i, iFun){
							iFun.call(this, self);
						});
					}
				});
			}
			else {
				self.resultSet.removeAll();
				self.tableSet.total(self.setting.resultSet.pageListVO.pageList.length);
				var start = (self.tableSet.pageIndex()-1)*self.tableSet.pageSize();
				for(var i=start,j=0;i<self.tableSet.total() && j<self.tableSet.pageSize();i++,j++){
					self.resultSet.push(self.setting.resultSet.pageListVO.pageList[i]);
				}
				if(!self.setting.afterLoads || self.setting.afterLoads.length<=0)	return;
				$.each(self.setting.afterLoads, function(i, iFun){
					iFun.call(this, self);
				});
			}
			
		};
		zTable.prototype._viewModel = function(){
			var self = this;
			if(!self.setting.align || self.setting.align=='')
				self.headColumns = new zTableTool.headColumn.convert2horizontal(self.setting.head);
			self.resultSet = ko.observableArray([]);
			self.tableSet = self.tableSet?self.tableSet:new self._newTableSetting(self);
			self.diy = new self._newDiy(self);
			self.width = ko.observable(self.setting.width);
			self.height = ko.observable(self.setting.height);
			self.resizable = ko.observable(self.setting.resizable);
			self.refresh = function(){
				self._loadData();
			};
			return self;
		};
		zTable.prototype._newTableSetting = function(entity){
			var self = this;
			var paramSetting = entity.setting;
			var resultSet = paramSetting.resultSet?paramSetting.resultSet:[];
			self.orderBy 	= 	ko.observable(paramSetting.orderBy?paramSetting.orderBy:0);
			self.order		= 	ko.observable(paramSetting.order);
			self.total		=	ko.observable();
			self.pageSize	=	ko.observable(paramSetting.pageSize);
			self.pageIndex	=	ko.observable(paramSetting.pageIndex);
			self.pageSizeOpts = [1, 5, 10, 20, 40, 50, 100];
			self.pageCount	= 	ko.computed(function(){
				try{
					return self.total()%self.pageSize()==0?self.total()/self.pageSize():parseInt(self.total()/self.pageSize())+1;
				}catch(E){}
				return 0;
			});
			self.toPrePage = function(){
				var aimIndex = (self.pageIndex()-1)>1?(self.pageIndex()-1):1;
				aimIndex = aimIndex<self.pageCount()?aimIndex:self.pageCount();
				self.pageIndex(aimIndex);
				entity._loadData();
			};
			self.toFirstPage = function(){
				self.pageIndex(1);
				entity._loadData();
			};
			self.toPage = function(){
				try{
					if(self.pageIndex()>self.pageCount())	self.pageIndex(self.pageCount());
					else if(self.pageIndex()<1)	self.pageIndex(1);
				}catch(e){self.pageIndex(1);}
				entity._loadData();
			};
			self.changePageSize = function(){
				entity._loadData();
			};
			self.toNextPage = function(){
				var aimIndex = (self.pageIndex()+1)<=self.pageCount()?(self.pageIndex()+1):self.pageCount();
				aimIndex = aimIndex>1?aimIndex:1;
				self.pageIndex(aimIndex);
				entity._loadData();
			};
			self.toLastPage = function(){
				self.pageIndex(self.pageCount());
				entity._loadData();
			};
		};
		zTable.prototype._newDiy = function(entity){
			var self = this;
			var paramSetting = entity.setting;
			var leaves = entity.headColumns.leaves();
			$.each(leaves, function(i, col){
				if(col.zType && col.zCode && col.zType() && col.zType()=='checkbox' && col.zCode()){
					self[col.zCode()] = ko.observableArray([]);
				}
			});
		};
		zTable.prototype.loading = function(){
			var self = this;
			if(!self.jRender)	return self;
			var temp = $("<div uuid='"+self.UUID+"' data-bind=\"{template: { name: '_ztable_temp_horizontal', data: _zView.zTableData."+self.UUID+"}}\"></div>");
			self.jRender.after(temp);
			var aimId = self.jRender.attr("id");
			self.jRender.remove();
			temp.attr("id", aimId);
			$.extend(self.setting , {
				tableId: self.id,
				head:	zTableTool.headColumn.parseDom(self.jRender).subs,
				afterLoad: function(){
					self._loadData();
				}
			});
			_zView.zTableData[self.UUID] = self._viewModel();
			if(zTableTool.hasLoadTemp()){
				self._loadData();
			}
			else{
				zTableTool.loading({
					afterLoad: function(){
						self._loadData();
					}
				});
			}
		};
		zTable.prototype.refresh = function(){
			var self = this;
			self._loadData();
		};
		zTable.prototype.getCheckBoxes = function(boxName){
			var self = this;
			if(!self.diy[boxName])	return null;
			return self.diy[boxName]();
		};
		zTable.prototype.setCheckBoxes = function(boxName, array){
			var self = this;
			if(!self.diy[boxName]() || !array)	return null;
			for(var i=0;i<array.length;i++){
				self.diy[boxName]()[i] = array[i];
			}
			var items = $("#"+self.id).find("[type='checkbox'][zname='"+boxName+"']");
			$.each(items, function(i, jItem){
				$(jItem).prop("checked", self.diy[boxName]()[i]?self.diy[boxName]()[i]:false);
			});
		};
	}
	this.loading();
	return this;
}

var zTableTool;
if(zTableTool==undefined){
	zTableTool = {
		UUID: new Date().getTime(),
		web_server1: '/om/resources/common/jquery-ztable2/',
		web_server: './jquery-ztable2/',
		virtualPath: 'js/',
		constant: {
			name: {
				temp_contain : 'zTable_temp_contain',
				temp_resize: 'zero-lb-resize',
				temp_bound:	'zero-lb-bound'
			}
		},
		nextUUID: new Date().getTime(),
		UA : navigator.userAgent.toLowerCase()
	};
	zTableTool.getNextUUID = function(){return 'z'+zTableTool.nextUUID++;};
	zTableTool.tempPath = function(){return zTableTool.web_server+zTableTool.virtualPath;};
	zTableTool.getTable_horizontal1 = function(){return "http://www.google.com";};
	zTableTool.getTable_horizontal = function(){return zTableTool.tempPath()+"ztable_horizontal.html";};
	zTableTool.getTable_vertical = function(){return zTableTool.tempPath()+"ztable_vertical.html";};
	zTableTool.hasLoadTemp = function(){var tempMain = $("#"+zTableTool.constant.name.temp_contain); return (tempMain && tempMain.length==1);};
	zTableTool.browser = {
		ie: function(){return (window.ActiveXObject && zTableTool.UA.match(/msie ([\d.]+)/))?zTableTool.UA.match(/msie ([\d.]+)/)[1]:undefined;}
	};
	zTableTool.loading = function(argData){
	    var tempMain = $("#"+zTableTool.constant.name.temp_contain);
		if(zTableTool.hasLoadTemp())	return;
		tempMain = $("<div id='"+zTableTool.constant.name.temp_contain+"'></div>").hide();
		$.ajax({
			url: zTableTool.getTable_horizontal(),
			type: 'get',
			dataType: 'text',
			data: {},
			async: false,
			success: function(result, ts, xhr){
				if($("#"+zTableTool.constant.name.temp_contain).length<=0){
					tempMain.appendTo($("body"));
					var tempResize = $("."+zTableTool.constant.name.temp_resize);
					var tempBound = $("."+zTableTool.constant.name.temp_bound);
					if(tempResize && tempResize.length<=0){
						$('<div class="zero-lb-resize" style="display:none;position:absolute;z-index:99;height:0;width:0;top:-99;left:-99"></div>').appendTo(tempMain);
					}
					if(tempBound && tempBound.length<=0){
						$('<div class="zero-lb-bound" style="position:absolute;float:left;width:3px;background-color:red;top:-99;left:-99"></div>').appendTo(tempMain);
					}
					$(result).appendTo(tempMain);
				}
				if(argData && argData.afterLoad && 'function'==typeof argData.afterLoad){
					argData.afterLoad.call(this);
				}
			}
		});
	};
	zTableTool.lazyBind = function(){
		var loopFun = function(){
			if(zTableTool.hasLoadTemp()){
				clearInterval(loop);
				ko.applyBindings(_zView);
			}
			//console.log(1);
		}
		var loop = setInterval(loopFun, 10);
	};
	zTableTool.headColumn = {
		none: zTableTool.UUID+'_null',
		horizontal: zTableTool.UUID+'_horizontal',
		vertical: zTableTool.UUID+'_vertical',
		parseDom: function(jDom){
			if(!jDom)	return null;
			if(jDom[0].tagName=='DIV'){
				var retColumn = {};
				retColumn.zCode = jDom.attr("zCode")?jDom.attr("zCode"):"";
				retColumn.value = jDom.attr("header")?jDom.attr("header"):"";
				retColumn.width = jDom.attr("width")?jDom.attr("width"):"";
				retColumn.rsKey = jDom.attr("rsKey")?jDom.attr("rsKey"):"";
				retColumn.order = jDom.attr("order")?jDom.attr("order"):"";
				retColumn.align = jDom.attr("align")?jDom.attr("align"):"";
				retColumn.zType = jDom.attr("zType")?jDom.attr("zType"):"";
				retColumn.render = jDom.attr("render")?jDom.attr("render"):"";
				var subNode = jDom.children("[property='columns']");
				if(subNode){
					var subs = subNode.children();
					if(subs.length>0){
						retColumn.subs = [];
						for(var i=0;i<subs.length;i++){
							retColumn.subs.push(zTableTool.headColumn.parseDom($(subs[i])));
						}
					}
				}
				if(retColumn.value=='' && (!retColumn.subs || retColumn.subs.length<=0)){
					retColumn.value = jDom.html();
				}
				return retColumn;
			}
		},
		parse2matrix : function(oriArray, aimArray, level, preNode){
			if(!aimArray) {
				aimArray = {all:[], leaves: []}; 
				aimArray.all[0] = [];
			}
			if(!level || level<0) level = 0;
			if(!oriArray || typeof oriArray!='object' || oriArray.length<=0)	return aimArray;
			var startIndex = level==0?0:aimArray.all[0].length-1;
			if(aimArray.all[level]==undefined){
				aimArray.all[level] = [];
				for(var i=0;i<startIndex;i++){
					aimArray.all[level][i] = zTableTool.headColumn.none;
				}
			}
			var cloneC = new zTableTool.headColumn.distilColumn(oriArray[0], preNode);
			aimArray.all[level][startIndex] = cloneC;
			if(cloneC.isLeaf())	aimArray.leaves.push(cloneC);
			for(var i=1;i<oriArray.length;i++){
				if(oriArray[i]){
					if(aimArray.all.length==0)	aimArray.all[0] = [];
					for(var j=0;j<aimArray.all.length;j++){
						if( j==level ){
							cloneC = new zTableTool.headColumn.distilColumn(oriArray[i], preNode);
							aimArray.all[j].push( cloneC );
							if(cloneC.isLeaf())	aimArray.leaves.push(cloneC);
						}
						else{
							aimArray.all[j].push(zTableTool.headColumn.none);
						}
					}
					zTableTool.headColumn.parse2matrix(oriArray[i].subs, aimArray, level+1, 'L'+level+'_'+i);
				}
			}
			return aimArray;
		},
		convert2horizontal: function(oriArray){	//横表
			var retMatrix = [];
			var matrix = zTableTool.headColumn.parse2matrix(oriArray, null, null, null);
			var columnMatrix = matrix.all;
			var cell = undefined;
			for(var x=0;x<columnMatrix.length;x++){
				for(var y=0;y<columnMatrix[x].length;y++){
					cell = columnMatrix[x][y];
					if(cell==zTableTool.headColumn.none || cell==zTableTool.headColumn.horizontal || cell==zTableTool.headColumn.vertical){
						continue;
					}
					//先横向合并，设置 colspan
					for(var i=y+1;i<columnMatrix[x].length;i++){
						if(columnMatrix[x][i]!=zTableTool.headColumn.none)	break;
						columnMatrix[x][i] = zTableTool.headColumn.horizontal;
						columnMatrix[x][y].colspan()==undefined?columnMatrix[x][y].colspan(2):columnMatrix[x][y].colspan(columnMatrix[x][y].colspan()+1);
					}
					//再纵向合并，设置 rowspan
					for(var i=x+1;i<columnMatrix.length;i++){
						if(columnMatrix[i][y]!=zTableTool.headColumn.none)	break;
						columnMatrix[i][y] = zTableTool.headColumn.vertical;
						columnMatrix[x][y].rowspan()==undefined?columnMatrix[x][y].rowspan(2):columnMatrix[x][y].rowspan(columnMatrix[x][y].rowspan()+1);
					}
					if(retMatrix[x]==undefined)	retMatrix[x] = [];
					retMatrix[x].push(columnMatrix[x][y]);
				}
			}
			return new function(){
				var self = this;
				self.all = ko.observableArray([]);
				self.leaves = ko.observableArray([]);
				for(var x=0;x<retMatrix.length;x++){
					for(var y=0;y<retMatrix[x].length;y++){
						if(self.all()[x]==undefined)	self.all().push(ko.observableArray([]));
						self.all()[x].push(retMatrix[x][y]);
					}
				};
				for(var i=0;i<matrix.leaves.length;i++){
					self.leaves().push(matrix.leaves[i]);
				};
				return self;
			};
			//return {all: retMatrix, leaves: matrix.leaves};
		},
		convert2vertical: function(columnMatrix){	//纵表
		},
		distilColumn: function(columnObj, preNode){
			var retObj = this;
			retObj.preNode = ko.observable(preNode?preNode:'LbNone');
			retObj.value = ko.observable(columnObj.value);
			retObj.width = ko.observable(columnObj.width);
			retObj.rsKey = ko.observable(columnObj.rsKey);
			retObj.render = ko.observable(columnObj.render);
			if(columnObj.render){
				try{
					retObj.render.fun = eval(columnObj.render);
				}catch(E){}
			}
			retObj.align = ko.observable(columnObj.align);
			retObj.isLeaf = ko.observable((!columnObj.subs || columnObj.subs.length<=0));
			retObj.zType = ko.observable(columnObj.zType);
			retObj.zCode = ko.observable(columnObj.zCode);
			if( columnObj.zType && columnObj.zType=='checkbox' && ! columnObj.zCode){
				retObj.zCode = ko.observable('_z'+new Date().getTime());
			}
			retObj.rowspan = ko.observable(1);
			retObj.colspan = ko.observable(1);
			return retObj;
		}
	};
}