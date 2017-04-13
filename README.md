# jquery.easysearch
基于jQuery的远程框架匹配控件
调用方法：



```javascript
/**
*
* sqlId: 数据库查询sql语句的id,不同的业务场景需要自己实现后面查询语句。
* 我的后端使用了ibatis，所以JAVA部分的代码进行封装，各自业务只需要实现SQL语句即可。
*text: 指返回数据，作为显示的字段名
*value:返回数据中，作为主键值的字段名。
*另外还有一些这里未用到的可选参数，如onChange
**/
$("#account_name").searchbox({
        sqlId:"searchAccount",
        text: "accountName",
        value: "accountId"
    });
    
```
该控件，参数列表，有些正在完善中
```javascript
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
```
