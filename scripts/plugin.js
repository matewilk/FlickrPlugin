/*
 * author: Mateusz Wilk
 * name: Flickr Plugin
 */

(function($){

    var methods = {

        init: function(options){

            var self = this;

            var options = $.extend({
                start: 1,
                perPage: 15,
                pages: 1,
                currentPage: 1,
	            visible: 5,
                onClick: function(pageNumber){}
            }, options);

            options.initVisible = options.visible;

            self.data('data', options);

            methods.draw.call(this);

            return this;
        },

        draw: function(){

	        var self = this;
            var opt = this.data('data');

            methods.destroy.call(this);

            var paginationUl = $('<ul>');

	        var visibility = methods.calculateVisibility.call(this);

	        methods.appendItem(methods.selectPage.bind(this, 1), paginationUl, 'first');
            methods.appendItem(methods.prevPage.bind(this), paginationUl, '<<');
            for(var i = visibility.start - 1; i < visibility.end; i++)
            {
	            var li = $('<li>').attr('value', i).appendTo(paginationUl);
	            //and my favorite part - closure in loop - I'm loving it :)
	            li.click((function(index) {
		            return function() {
			            methods.selectPage.call(self, index+1);
		            }
	            })(i));
	            i == opt.currentPage - 1 ? li.addClass('active') : undefined;
	            $('<a>', {css:{href: '#'}}).text(i+1).appendTo(li);

            }
            methods.appendItem(methods.nextPage.bind(this), paginationUl, '>>');
	        methods.appendItem(methods.selectPage.bind(this, opt.pages), paginationUl, 'last');

            this.append(paginationUl);

            return this;

        },

	    calculateVisibility: function(){
		    var opt = this.data('data');

		    if (opt.currentPage < 1 || opt.currentPage > opt.pages) { console.log('paging error!');}

            var beginning = Math.ceil(opt.currentPage/Math.ceil(opt.visible/2))
            var start = opt.currentPage < opt.visible ? beginning : (opt.currentPage + Math.floor(opt.visible/2) > opt.pages ? opt.pages + 1 - opt.visible : opt.currentPage - Math.floor(opt.visible/2));
            var end = start + opt.visible - 1;

		    return {
			    start: start,
			    end: end
		    }
        },

        appendItem: function(func, parentEl, text){
            var item = $('<li>').appendTo(parentEl);
            item.click(func);
            $('<a>', {css:{href: '#'}}).text(text).appendTo(item);
        },

        setPages: function(pages){
            var opt = this.data('data');
            opt.pages = pages;
            opt.visible = pages < opt.initVisible ? pages : opt.initVisible;
            methods.draw.call(this);
        },

        destroy: function(){
            this.empty();
            return this;
        },

        nextPage: function(){
            var opt = this.data('data');
            if(opt.currentPage < opt.pages){
                methods.selectPage.call(this, opt.currentPage+1);
            }
        },

        prevPage: function(){
            var opt = this.data('data');
            if(opt.currentPage - 1 > 0){
                methods.selectPage.call(this, opt.currentPage-1);
            }
        },

        selectPage: function(pageIndex){
            var opt = this.data('data');
            opt.currentPage = pageIndex;
            methods.draw.call(this);
            opt.onClick.call(this, pageIndex);
        }


    }

    $.fn.pagination = function(method){
        if(methods[method])
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        else
            return methods.init.apply(this, arguments);
    };

})(jQuery);

(function($){

    $.fn.filter = function(options){
        var defaults = {
            filter: "",
            isFiltering: false,
            onClick: function(){}
        }

        var options = $.extend(defaults, options);

        var init = function(){
            $('#search_form').submit(function(e){
                e.preventDefault();
                options.filter = $("#search_input").val();
                options.isFiltering = options.filter !== "";
                options.onClick();
            })
        }

        init();

        return options;

    }

    $.fn.preloader = function(options){

        var defaults = {
            delay:300,
            parentEl:"li",
            timer:400,
            fadein:500,
            root: $('main')
        };

        var options = $.extend(defaults, options),
            root = options.root,
            images = root.find("img").css( {"visibility":"hidden", opacity:0} )


        var init = function(){
	        images.each(function(){
		        $(this).parent().addClass("preloader");
		        $(this).load(function(){
			        $(this).css("visibility","visible")
				        .delay(options.delay)
				        .animate({opacity:1}, options.fadein, function(){
					        $(this).parent().removeClass("preloader");
				        });
		        })
	        });
        }

        init();
    }

    $.extend($.fn, {
        FlickrPlugin: function(options){

            flickrPlg = this;

            options = $.extend({
                width: 910,
                url: '',
                apiKey: '481ae5794f067ad7b56db24b3ac1ee79',
                user_id: '10179375@N07', //akochanowski
                secret: '',
                perpage: 15,
                page: 1,
                totalPages: 5
            }, options);


            var currentPosition = 1;
            var slidesCount = 0;
            var sliderCollection = [];
            var sliderCaptions = [];
            var totalPages = 0;

            var ul = $('<ul>', {
                css: {
                    width: options.width * slidesCount,
                    height: 500
                }
            });

            var sliderLi = $('<li>', {
                css: {
                    width: options.width
                }
            });

            var slide = function(e, slideNumber){
                e.preventDefault();
                if(slideNumber < 1 || slideNumber > slidesCount){
                    return false;
                }

                var li = ul.children().eq(slideNumber-1);

                if(li.children().length == 0){
                    var img = $('<img>', {css: {width:options.width}}).appendTo(li);
	                $.fn.preloader({root: li});//, timer: 1})
	                img.attr('src', sliderCollection[slideNumber-1]);
                }

                ul.animate({left:-(slideNumber-1)*options.width},{
                    duration: 300
                });

                var caption = $('.caption span');
                caption.fadeOut(150,function(){
                    caption.html(sliderCaptions[slideNumber-1]);
                }).fadeIn(150);

                currentPosition = slideNumber;
            }

            flickrPlg.bind('slide', slide);

            //add handlers to prev/next
            var buttonNext = $('.next');
            buttonNext.on('click', function(){
                var next = currentPosition + 1;
                if(next > slidesCount){
                    next = 1;
                }
                flickrPlg.trigger('slide', [next]);
                return false;
            });

            var buttonPrev = $('.prev');
            buttonPrev.on('click', function(){
                var prev = currentPosition - 1;
                if(prev < 1){
                    prev = slidesCount;
                }
                flickrPlg.trigger('slide', [prev]);
                return false;
            });

            //add handlers to photos in gallery
            $('.photos ul').on('click', 'li', function(e){
                e = e || window.event;
                var ul = $(this).parent();
                var index = ul.children().index(this);
                flickrPlg.trigger('slide', [index+1]);
            });

            var success = function(data){

                slidesCount = options.perpage > data.photos.photo.length ? data.photos.photo.length : options.perpage;
                totalPages = data.photos.pages;//options.totalPages;

                pagination.pagination('setPages',totalPages);

                ul.css('width', options.width * slidesCount);
                var galleryUl = $('.gallery');
                ul.empty();
                galleryUl.empty();

                sliderCollection = [];
                sliderCaptions = [];

                $.each(data.photos.photo, function(index, item){

                    //http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg

                    var photoUrl = 'http://farm'+item.farm+'.staticflickr.com/'+item.server+'/'+item.id+'_'+item.secret;

                    //-----slider-------
                    var newli = sliderLi.clone();
                    newli.appendTo(ul);
                    sliderCollection.push(photoUrl+"_c.jpg");
                    sliderCaptions.push(item.title);

                    //-----galery-------
                    //galleryCollection.push(photoUrl+"_m.jpg");
                    var li = $('<li>').appendTo(galleryUl);
                    var src = photoUrl+'_m.jpg';
                    var img = $('<img>').attr('src', src).appendTo(li);

                });

                flickrPlg.addClass('slider').width(options.width).height(500).append(ul);

                flickrPlg.trigger('slide', [1]);

                $.fn.preloader();
            }

            var filter = $.fn.filter({
                onClick: function(){
                    flickrPlg.trigger('fetch',[1])
                }
            });

            var fetch = function(obj, page){

                var filterParam = "";
                if(filter.isFiltering){
                    filterParam = "&tags="+filter.filter;
                }

                var flickrUrl = "http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key="+options.apiKey+filterParam+"&user_id="+options.user_id+"&per_page="+options.perpage+"&page="+page+"&format=json&jsoncallback=?";

                $.ajax({
                    url: flickrUrl,
                    type: "GET",
                    cache: true,
                    dataType: 'jsonp',
                    success: success,
                    error: function(){
                        console.log('error');
                    }
                });
            }

            flickrPlg.bind('fetch', fetch);

            var pagination = $('.pagination').pagination({
                onClick: function(pageNumber){
                    flickrPlg.trigger('fetch',[pageNumber])
                }
            });

            pagination.pagination('selectPage', 1);

            return flickrPlg;

        }
    })

})(jQuery);
