$(document).ready(function() {
    const ITEMS_PER_LOAD = 12;
    let currentAlbum = null;
    let loadedItems = 0;

    function loadMoreItems($waterfall, albumData) {
        const remainingItems = albumData.photos.length - loadedItems;
        const itemsToLoad = Math.min(ITEMS_PER_LOAD, remainingItems);

        for (let i = loadedItems; i < loadedItems + itemsToLoad; i++) {
            const photo = albumData.photos[i];
            const $item = $('<div class="gallery-item"><img src="' + photo.src + '" alt="' + photo.alt + '"></div>');
            $waterfall.append($item).masonry('appended', $item);
        }

        loadedItems += itemsToLoad;

        if (loadedItems >= albumData.photos.length) {
            $('#load-more').hide();
        } else {
            $('#load-more').show();
        }

        $waterfall.imagesLoaded().progress(function() {
            $waterfall.masonry('layout');
        });
    }

    $('.gallery-album').click(function() {
        const albumIndex = $(this).data('album');
        $('.gallery-content').hide();
        const $content = $('#album-' + albumIndex);
        $content.fadeIn();

        $('html, body').animate({
            scrollTop: $content.offset().top - 50
        }, 600);

        const $waterfall = $content.find('.gallery-waterfall');
        const albumData = galleryData[albumIndex];

        $waterfall.empty();
        loadedItems = 0;
        currentAlbum = albumIndex;

        $waterfall.masonry({
            itemSelector: '.gallery-item',
            columnWidth: '.gallery-item',
            percentPosition: true,
            gutter: 20
        });

        loadMoreItems($waterfall, albumData);
    });

    $('#load-more').click(function() {
        if (currentAlbum !== null) {
            const $waterfall = $('#album-' + currentAlbum).find('.gallery-waterfall');
            const albumData = galleryData[currentAlbum];
            loadMoreItems($waterfall, albumData);
        }
    });

    // 灯箱功能实现
    $(document).on('click', '.gallery-item img', function() {
        const src = $(this).attr('src');
        if (src) {
            openLightbox(src);
        }
    });

    function openLightbox(src) {
        if (src) {
            const $lightboxImg = $('#lightbox-img');
            $lightboxImg.attr('src', src);

            // 等待图片加载完成再显示灯箱
            $lightboxImg.on('load', function() {
                $('#lightbox').css('display', 'flex').fadeIn(); // 切换为 display: flex 并使用 fadeIn 避免闪烁
            }).on('error', function() {
                console.error("图片加载失败");
            });
        }
    }

    $('#lightbox').click(function() {
        $(this).fadeOut();
    });

    // 初始化时确保灯箱隐藏
    $('#lightbox').hide();
});
