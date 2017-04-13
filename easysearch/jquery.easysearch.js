(function($){

    $.fn.searchbox = function(op){
        var obj=this.data('ui-search');
        if(!obj){
            new EasySearch(this,op);
        }else{
            if (typeof op == "string") {
                var value=null,args = arguments;
                $.each(['enable','disable','getText','setValue','setText','getFormattedData','getJSONData','setData'],function(i,m){
                    if(op==m){
                        args = Array.prototype.slice.call(args, 1);
                        value=obj[m].apply(obj,args);
                        return false;
                    }
                });
                return value;
            }else{
                obj.set(op);
            }
        }
        return this;
    };

    $.isBlank = function(obj) {
        if(typeof obj =='undefined'){
            return true;
        }
        if(obj==null){
            return true;
        }
        if(obj===''){
            return true;
        }
        return false;
    };

    $.closeSearchbox = function(){
        var div=$('#easysearch_droplist_wrapper').hide();
        if(!div.length) return;
        var obj=div.data("searchbox-object");
        if(!obj) return;
        obj=$(obj.input);
        var fn=obj.data('searchbox-close');
        if($.isFunction(fn)){
            fn.call(window);
        }
        obj.removeData('searchbox-object');
        obj.removeData('searchbox-close');
        obj.removeData("searchbox-data");
        obj.blur();//
    }


    $(document).bind('click',function(event){
        if($('#easysearch_droplist_wrapper').is(':visible')){
            $.closeSearchbox();
        }
    });

    $(window).on('resize', function(){
        var div=$('#easysearch_droplist_wrapper');
        if(div.is(':visible')){
            var obj=div.data("searchbox-object");
            if(!obj) return;
            obj.setListPosition();
        }
    });

    function EasySearch(el,op){
        this.input = el;
        this.options={};
        this.set(op);
        this.init(el);
        $(el).data('ui-search',this);
    }

    $.extend(EasySearch.prototype, {
        set: function (op) {
            this.options = $.extend({
                param: {},//AJAX访问参数
                getParam: null,//参数取值函数
                width: 'auto',//显示宽度
                loading   : '<dl class="loading">加载中 . . .</dl>',//AJAX访问提示内容
                height: 'auto',//显示高度
                display: 'name',
                enableClear: false, //如果用户未选择选项，是否清除输入框的值
                url: "easySearch/search.action",
                sqlId: "",
                text: "",//显示字段名称
                value: "",//值
                queryDelay: 500,
                afterShow: function(){},
                beforeChange: null,//数据改变前执行
                onChange: null,//数据改变后执行
                onClear: function(){ //清空数据后执行回调方法

                },
                onClick: function () {
                }
            }, this.options, op || {});
        },
        init: function (el) {
            var opts = this.options,$el=$(el);
            this.createSearch($el);
            this.bindEvent($el);
        },
        createSearch: function($el){
            //创建下拉对话框
            var droplistWrapper=this.getDroplistWrap();
            if(!droplistWrapper.length){
                var droplist_wraper_html = '<div id="easysearch_droplist_wrapper" class="search-dropwraper" ></div>';
                droplistWrapper = $(droplist_wraper_html).appendTo("body");
                var droplist = $('<div class="droplist"></div>').appendTo(droplistWrapper);
                this.options.droplist = droplist;
                droplistWrapper.hide();
            }else{
                this.options.droplist = this.getDroplistWrap().find(".droplist");
            }
        },
        triggerShow:function(){
            this.expend();
            this.show();
        },
        show: function(){
            var _self = this;
            this.isExpanded=true;
            this.getDroplistWrap().show();
            setTimeout(function(){_self.setListLayout();},0);
            this.setListPosition();
            this.options.afterShow.call(window,this.options.droplist);//显示后回调

        },
        onDropListClick:function(el){
            //下拉框点击事件。
            if(el.is("dl.droplist-item")){
                var index = $(el).attr("item-index");
                var data = this.input.data("searchbox-data");
                $(this.input).val(data[index][this.options.text]);
                if($.isFunction(this.options.onClick)){//点击触发方法
                    try{
                        this.options.onClick.call(this,data[index]);
                    }catch(e){alert('onClik:'+e.message);}
                }
                $.closeSearchbox();
            }

        },
        expend: function(){
            //绑定选择项点击事件
            var _self = this;
            var droplist_wrap=this.getDroplistWrap(),droplist=$('div.droplist',droplist_wrap);
            droplist_wrap.unbind('click').click(function(e){
                var $clicked = $(e.target || e.srcElement);
                _self.onDropListClick.call(_self,$clicked);//点击触发事件
                e.preventDefault();
                e.stopPropagation();
                return false;
            }).data("searchbox-object", this);
           var k = $(this.input).val();
            _self.doQuery(k);
        },

        setListLayout: function(){
          //设置显示宽高
            var droplist_wrap=this.getDroplistWrap(),droplist=this.options.droplist;
            var opts = this.options,height = parseInt(opts.height),width=opts.width,originListH,maxHeight=parseInt(opts.maxHeight);
            var isVisible=droplist_wrap.is(':visible'),diffHeight=0;
            if($.isFunction(opts.getViewWidth)){
                width=opts.getViewWidth.call(this);
            }
            droplist.css('overflow','hidden');
            //重置显示高度
            droplist_wrap.width('auto');
            droplist.height('auto');
            if(!isVisible){
                droplist_wrap.css({top:100,left:100}).show();//为了获取list高度显示一下
                this.isExpanded = true;
            }

            //显示宽度
            if(isNaN(parseInt(width))){
                width=this.input.outerWidth();
            }//alert(this.input.outerWidth());
            droplist.css({width:width});
            droplist_wrap.css({width:width+2,zIndex:'100001'});
            originListH = droplist.height()+diffHeight;
            //设高
            if(!isNaN(height) && height >= 0){
                height = Math.min(height, originListH);
            }else{
                height=originListH;
            }
            if(!isNaN(maxHeight)&&height>maxHeight){
                height=maxHeight;
            }
            droplist.css({overflow:'auto',height:height});
            if(!isVisible){
                droplist_wrap.hide();
                this.isExpanded = false;
            }
        },
        setListPosition: function(){
            //设置显示位置
            var droplist_wrap=this.getDroplistWrap();
            var opts = this.options,width=opts.width;
            var scrollTop=$(document).scrollTop();
            if($.isFunction(opts.getViewWidth)){
                width=opts.getViewWidth.call(this);
            }
            if($.isFunction(opts.getOffset)){
                try{opts.offset=opts.getOffset.call(window);}catch(e){alert('显示位置读取函数调用错误!'+e.message);}
            }else{
                var of=this.input.offset(),_height=this.input.outerHeight();
                opts['offset']={top:of.top+_height+1,left:of.left};
            }
            if(isNaN(parseInt(width))){
                width=this.input.outerWidth();
            }
            //若下拉框大小超过当前document边框
            var tw=opts.offset.left+width+2,dw=$(window).width();
            //下拉内容向左展现
            if(tw > dw){
                opts.offset.left=dw-width-10;
            }
            //下拉内容向上展现
            var th=opts.offset.top+droplist_wrap.height()+2,dh = $(window).height()+scrollTop;
            if(th > (dh+10)){
                if(opts.offset.top-droplist_wrap.height()-_height-10>scrollTop){//判读不操作上边框
                    opts.offset.top=opts.offset.top-droplist_wrap.height()-_height-10;
                }
            }
            droplist_wrap.css({top:opts.offset.top,left:opts.offset.left});
        },
        clearControls: function(){
            //清空控件的值；
        },
        bindEvent: function(){//绑定事件
            var opts = this.options,_self=this;
            //显示触发执行方法
            var _triggerShow=function(){
                if($.isFunction(_self.options.getParam)){//执行参数取值函数
                    try{
                        var tmp=_self.options.getParam.call(_self);
                        if(tmp===false) return;
                        _self.options.param=$.extend(_self.options.param,tmp);
                    }catch(e){alert('参数取值函数执行错误:'+e.message);}
                }
                delete _self.options.param['intPage'];//默认分页查询条件为1
                _self.triggerShow();
            };
            _self.input.data("searchbox-close",function(){
                //关闭下拉框时，做一些后续清理工作。
                _self.isExpanded= false;
                if(_self.queryTimer){
                    window.clearTimeout(_self.queryTimer);
                }
            });
            //注册显示出发方法
            this.input.on('click',function(event){
                event.preventDefault();
                event.stopPropagation();
                if(_self.disabled){return;}
                if(_self.getDroplistWrap().is(':visible')){//对话框存在
                    if(_self.getDroplistWrap().data("searchbox-object") == _self){
                        return false;
                    }
                   /*
                    //和上面的if判断是一个效果。
                    if($.data(_self.getDroplistWrap()[0], "searchbox-object")==_self){//且由当前控件触发
                        return false;
                    }*/
                }
                _triggerShow();
                return false;
            });
            //绑定按键事件
            var KEY = {
                backSpace: 8,
                esc: 27,
                up: 38,
                down: 40,
                tab: 9,
                enter: 13,
                home: 36,
                end: 35,
                pageUp: 33,
                pageDown: 34,
                space: 32,
                deteleKey: 46
            };
            //按键事件
            this.input.on('keydown', function(e){
                if(_self.disabled){return;}
                if(opts.readOnly){
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                var k =e.charCode||e.keyCode||e.which;
                switch (k) {
                    case KEY.esc:
                        _self.clearControls(true);//true 不关闭下拉框
                        break ;
                    case KEY.down:
                    case KEY.up:
                        if(_self.isExpanded){
                            _self.setItemFocus(e.keyCode == KEY.down);
                        } else {
                            _triggerShow();
                        }
                        e.preventDefault();
                        break ;

                    case KEY.enter:
                        if(_self.isExpanded){
                            var item = _self.getDroplistWrap().find('.droplist-item-select');
                            if(item.length > 0){
                                _self.selectByItem(item);
                                return;
                            }
                        }
                        break ;
                }
                if(!_self.isExpanded){//为打开选择框阻止输入 xx add 2014-08-08
                    e.preventDefault();
                    return false;
                }
            }).on('keyup',function(e){
                if(_self.disabled){return;}
                if(opts.readOnly){
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                var k =e.charCode||e.keyCode||e.which;
                //是否功能键
                var isFuncKey = k == 8 || k == 9 || k == 13 || k == 27 || (k >= 16 && k <= 20) ||(k >= 33 && k <= 40) ||
                    (k >= 44 && k <= 46) || (k >= 112 && k <= 123) || k == 144 || k == 145;
                var q = _self.input.val();
                if(q==''&&k!=KEY.backSpace&&k!=KEY.deteleKey){//Safari 浏览器存在自动触发keyup，这里处理存在按键事件但没有数据的情况
                    return;
                }
                if (!isFuncKey || k == KEY.deteleKey || k == KEY.backSpace) {
                    _self.isSelected=false;
                    if(_self.isExpanded){
                        _self.doDelayQuery(q);
                    }else{
                        _triggerShow();
                    }
                };
            });
        },
        doDelayQuery:function(value){
            var _self = this, opts = _self.options, delay = parseInt(opts.queryDelay);
            if(isNaN(delay)){
                delay = 0;
            }
            if(_self.queryTimer){
                window.clearTimeout(_self.queryTimer);
            }
            _self.queryTimer = window.setTimeout(function(){
                _self.doQuery(value);
            },delay);
            this.isKeyQuery=true;
        },
        doQuery: function(value){
            //执行后台查询；
            var _self = this,opts= _self.options,keyname = $(_self.input).attr("name"), loading = $(_self.options.loading);
            opts.droplist.empty().append(loading);
            setTimeout(function(){_self.setListLayout();},0);
            opts.param[keyname] = value;
            this.loadAjaxData(function(data){
                if($.isFunction(opts.onSuccessed)){
                    data = opts.onSuccessed.call(_self,data);
                    if(data===false) return false;
                }
                loading.remove();
                _self.setData(data);
                _self.isKeyQuery = false;
                //_self.setSelectedClass();
                setTimeout(function(){_self.setListLayout();},0);
                //_self.autoComplete();
            });
        },
        setData:function(data){
            var opts = this.options;
            if(data.Rows.length && data.Rows.length > 0){
                var droplist_item = [];
                var droplist_item_html = '<dl class="droplist-item" item-index=":index" item-value=":value">:name</dl>';
                $(data.Rows).each(function(i,item){
                    droplist_item.push(droplist_item_html.replace(":name",item[opts.text]).replace(":value",item[opts.value]).replace(":index",i));
                });
                opts.droplist.empty().append(droplist_item);
                this.input.data("searchbox-data",data.Rows);
            }else{
                opts.droplist.empty().append('<dl class="droplist-nothing">没有匹配的选项</dl>');
                this.input.removeData("searchbox-data");
            }
        },
        loadAjaxData:function(callBack){
            var opts = this.options,_self = this;
            if($.isBlank(opts.url)){
                callBack.call(_self,{});return ;
            }
            if($.isBlank(opts.sqlId)){
                opts.droplist.empty().append('<dl class="droplist-nothing">sqlId不能为空</dl>');
                this.isKeyQuery = false;
                return ;
            }
            opts.param['sqlId'] = opts.sqlId;
            $.ajax({
                type: "POST",
                dataType: "JSON",
                async: true,
                url:opts.url,
                data: opts.param,
                success:function(data){
                    if($.isFunction(callBack)){
                        if(data.status == "0"){
                            opts.droplist.empty().append('<dl class="droplist-nothing">数据查询异常</dl>');
                            setTimeout(function(){_self.setListLayout();},0);
                            this.isKeyQuery = false;
                        }
                        callBack.call(_self,data);
                    }
                },
                error:function(){
                    callBack.call(_self,{});
                }
            })
        },
        getDroplistWrap: function(){
            return $("#easysearch_droplist_wrapper");
        },
        selectByItem: function(){

        }
    });

})(jQuery);
