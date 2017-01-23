
function freightadress(){
    
}
freightadress.prototype ={
    _province: function(date){
        var provincesInformationArray = [];
        var $provinceContent = $(".float-region .bd");
        $.each(date, function(index, el) {
            provincesInformationArray.push('<div class="box"><label for="'+this.id+'" date-id="'+this.id+'" class="ss"><input type="checkbox" id="'+this.id+'"><span class="cityname">'+this.name+'</span><span class="provincennum">(<b>0</b>)</span></label><span class="sanjiao"></span><div class="market"></div></div>');
        });
        $provinceContent.append(provincesInformationArray.join(""));
    },
    _triabgle: function(){
        // var provinceTriabgleBtn = $(".box1>.sanjiao");
        $(document).on('click', '.box>.sanjiao', function() {
            if($(this).siblings('.market').hasClass('cur')){
                $(this).siblings('.market').removeClass('cur');
                $(this).parents(".box").find('.sanjiao').css({
                    "margin-top": '4px',
                    "border-color": 'transparent transparent transparent #B9B9B9'
                });
                $(this).parents(".box").find('.county').removeClass('cur');
            }else{
                $(this).siblings('.market').addClass('cur');
                $(this).css({
                    "margin-top": "6px",
                    "border-color": "#B9B9B9 transparent transparent transparent"
                });
            };
            $(this).parents('.box').siblings().children('.market').removeClass('cur').children('.box2').children('.county').removeClass('cur').parent(".box2").children('.sanjiao').css({
                "margin-top": '4px',
                "border-color": 'transparent transparent transparent #B9B9B9'
            });
            $(this).parents('.box').siblings().children('.sanjiao').css({
                "margin-top": '4px',
                "border-color": 'transparent transparent transparent #B9B9B9'
            });
        });
        $(document).on('click', '.box .box2>.sanjiao', function() {
            if($(this).siblings('.county').hasClass('cur')){
                $(this).siblings('.county').removeClass('cur');
                $(this).css({
                    "margin-top": "4px",
                    "border-color": "transparent transparent transparent #B9B9B9"
                });
            }else{
                $(this).siblings('.county').addClass('cur');
                $(this).css({
                    "margin-top": "6px",
                    "border-color": "#B9B9B9 transparent transparent transparent"
                });
                $(this).parents(".box2").siblings().find('.county').removeClass('cur');
            };
        });
    },
    _city: function(date){
        var $box = $(".float-region .bd .box");
        // alert(currentProvinceIdArray.join(""));
        for(var i = 0; i < date.length; i++) {
            var cityInformationArray =[];
            for(var j = 0; j < date[i].childs.length; j++){
                cityInformationArray.push('<div class="box2"><label for="'+date[i].childs[j].id+'" date-id="'+date[i].childs[j].id+'" class="aa"><input type="checkbox" id="'+date[i].childs[j].id+'"><span class="cityname">'+date[i].childs[j].name+'</span><span class="provincennum blue">(<b>0</b>)</span></label><span class="sanjiao"></span><div class="county"></div></div>');
            }
            $box.eq(i).find('.market').html(cityInformationArray.join(""));
        };       
    },
    _district: function(date){
        var i = 0;
        $(".float-region").find('.box').each(function(index, el) {
            var currentProvincesId = $(this).children('label').attr("date-id");
            var currentprovinceInformation = $.grep(date,function(n, i){
                return n.id == currentProvincesId;
            })
            $(this).children('.market').find('.box2>label').each(function(index, el) {
                // currentAllCityId.push($(this).attr("date-id"));
                var currentCityId = $(this).attr("date-id");
                var currentCityInformation = $.grep(currentprovinceInformation[0].childs,function(n, i){
                    return n.id == currentCityId;
                })
                // console.log(currentCityInformation[0].childs[0].name)
                var districtInformationArray = [];     
                if(currentCityInformation[0].childs){
                    $.each(currentCityInformation[0].childs,function(index, el) {
                        // console.log(this.name);
                        districtInformationArray.push('<div class="box3"><label for="'+this.id+'" date-id="'+this.id+'"><input type="checkbox" id="'+this.id+'"><span class="cityname">'+this.name+'</span></label></div>')
                    });
                }else{
                    districtInformationArray.push("");
                };
                $(this).siblings('.county').html(districtInformationArray.join(""));
            });
        });
    },
    _input: function(){
        $(".region-box .bd").on('change', '.box>label>input', function() {
            var n = 0;//统计被选市的数量
            var currentchecked = $(this).prop("checked");
            if(currentchecked == true){
                $(this).parent("label").siblings('.market').find('input').prop('checked', true);
            }else{
                $(this).parent("label").siblings('.market').find('input').prop('checked', false);
            };
            $(this).parent("label").siblings(".market").children('.box2').each(function(index, el) {
                if($(this).children('label').children('input').prop("checked") == true){
                    n++;
                };
            });
            $(this).siblings(".provincennum").children('b').html(n);
            $(this).parent("label").siblings('.market').children('.box2').each(function(index, el) {
                var q = 0;//统计被选区的数量
                $(this).find('.box3').each(function(index, el) {
                    if ($(this).find('input').prop('checked') == true) {
                        q++;
                    };
                });
                $(this).find('b').html(q);
            });
            $(this).parents(".box").siblings().find('.market').removeClass('cur');
            $(this).parents(".box").siblings().find('.county').removeClass('cur');
            $(this).parents(".box").siblings().find('.sanjiao').css({
                "margin-top": '4px',
                "border-color": 'transparent transparent transparent #B9B9B9'
            });
        });

        $(".region-box .bd").on("change",".box .market .box2>label>input",function() {
            var i = 0;
            var q = 0;
            if($(this).prop("checked") == true){
                $(this).parents(".box2").children('.county').children('.box3').children('label').children('input').prop("checked",true);
                $(this).parents(".box").children('label').children('input').prop('checked',true);
            }else{
                $(this).parents(".box2").children('.county').children('.box3').children('label').children('input').prop("checked",false);
            };
            $(this).parents(".market").children('.box2').children('label').children('input').each(function(index, el) {
                if ($(this).prop("checked") == true) {
                    i++;
                };   
            });
            $(this).parents(".box").children('label').children(".provincennum").children('b').html(i);
            $(this).parent("label").siblings('.county').find('input').each(function(index, el) {
                if ($(this).prop('checked') == true) {
                    q++;
                };
            });
            $(this).siblings('.provincennum').children('b').html(q);
            $(this).parents(".box2").siblings().children('.county').removeClass('cur').siblings('.sanjiao').css({
                "margin-top": '4px',
                "border-color": 'transparent transparent transparent #B9B9B9'
            });;
        });

        $(".region-box .bd").on("change",".box .market .box2 .county .box3>label>input",function(){
            var i = 0;
            $(this).parents(".county").children('.box3').children('label').children('input').each(function(index, el) {
                var checkedtrue = $(this).prop("checked");
                if(checkedtrue == true){
                    i++;
                    $(this).parents(".box2").children('label').children('input').prop('checked',true);
                    $(this).parents(".box").children('label').children('input').prop('checked',true);
                };
            });
            $(this).parents(".box2").children('label').children(".provincennum").children('b').html(i);
            var t = 0;
            $(this).parents(".box").find('.box2').each(function(index, el) {
                if ($(this).find('input').prop("checked") == true) {
                    t++;
                };
            });
            $(this).parents('.box').children('label').children(".provincennum").children('b').html(t);
        });
    }
}
function initializationaddress (){
    var $cover = $(".float-region-cover");
    $cover.css("display","none")
    $cover.find('.market').removeClass('cur');
    $cover.find('.county').removeClass('cur');
    $cover.find('.sanjiao').css({
                "margin-top": '4px',
                "border-color": 'transparent transparent transparent #B9B9B9'
            });
    $cover.find('input').prop('checked', false);
    $cover.find('b').each(function(index, el) {
        $(this).html("0");
    });
}
function addInformation(checkedId,checkedaddress,dateList,noRepeatId){
    $(".float-region-cover").find('.box>label>input').each(function(index, el) {
        if ($(this).prop('checked') == true) {
            var cityListArry = [];
            $(this).parents(".box").find('.market>.box2>label>input').each(function(index, el) {
                if ($(this).prop('checked') == true) {
                    var arealistArry = [];
                    $(this).parents(".box2").find('.box3>label>input').each(function(index, el) {
                        if ($(this).prop('checked') == true) {
                            arealistArry.push('{"areaID":"'+$(this).attr("id")+'"}');
                        };
                    });
                    cityListArry.push('{"areaList":['+arealistArry+'],"cityID":"'+$(this).attr("id")+'"}');
                };
            });
            var data = '{"ProvinceID":"'+$(this).attr("id")+'","cityList":['+cityListArry+']}';
            // alert(data);
            // console.log(data);
            dateList.push(eval("("+data+")"));
        };
    });
    $(".float-region-cover").find('input').each(function(index, el) {
        if ($(this).prop('checked') == true) {
            checkedId.push($(this).attr("id"));
        };
    });
    $(".float-region-cover").find('.box').each(function(index, el) {
        // console.log($(this).find('input').length);
        var inputProvinceChecked = 0;
        $(this).find('input').each(function(index, el) {
            if ($(this).prop('checked') == true) {
                inputProvinceChecked++;
            };
        });
        if (inputProvinceChecked == $(this).find('input').length) {
            checkedaddress.push($(this).children('label').children('.cityname').html());
            $(this).find('input').each(function(index, el) {
                noRepeatId.push($(this).attr("id"));//-----------------------
            }); 
        }else{
            $(this).find('.box2').each(function(index, el) {
                // console.log($(this).find('input').length);
                var inputCityChecked = 0;
                $(this).find('input').each(function(index, el) {
                    if ($(this).prop('checked') == true) {
                        inputCityChecked++;
                    };
                });
                if (inputCityChecked == $(this).find('input').length) {
                    checkedaddress.push($(this).children('label').children('.cityname').html());
                    $(this).find('input').each(function(index, el) {
                        noRepeatId.push($(this).attr("id"))//-----------------------
                    }); 
                }else{
                    var inputDistrictChecked = 0;
                    $(this).find('.box3').each(function(index, el) {
                        if ($(this).find('input').prop('checked') == false) {
                            inputDistrictChecked++;
                        };
                    });
                    if (inputDistrictChecked != $(this).find('.box3').length) {
                        checkedaddress.push($(this).children('label').children('.cityname').html()+"(");
                        $(this).find('.box3').each(function(index, el) {
                            if ($(this).find('input').prop('checked') == true) {
                                checkedaddress.push($(this).children('label').children('.cityname').html());
                                noRepeatId.push($(this).children('label').children('input').attr("id"))//-----------------------
                            };   
                        });
                        checkedaddress.push(")");
                    };
                };
            });
        }
    });
}
function cacheNum(){
    $(".float-region-cover").find('.box').each(function(index, el) {
        var cacheNumCity = 0;
        $(this).children("label").siblings(".market").children('.box2').each(function(index, el) {
            if($(this).children('label').children('input').prop("checked") == true){
                cacheNumCity++;
            };
        });
        $(this).children('label').children(".provincennum").children('b').html(cacheNumCity);
        $(this).find('.box2').each(function(index, el) {
            var cacheNumDistrict = 0;
            $(this).find('.box3').each(function(index, el) {
                if($(this).children('label').children('input').prop("checked") == true){
                    cacheNumDistrict++;
                };             
            });
            $(this).children('label').children(".provincennum").children('b').html(cacheNumDistrict);
        });
    });
}
// var a = new freightadress();
// a._province();
// a._triabgle();
// a._city();
// a._district();
// a._input();

function regionDate(date){
    $(".float-region .region-box .bd").html('');
    var a = new freightadress();
    a._province(date);
    a._triabgle();
    a._city(date);
    a._district(date);
    a._input();
}