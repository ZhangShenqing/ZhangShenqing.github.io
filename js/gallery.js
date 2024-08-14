// gallery.js

// 常量和配置
const ITEMS_PER_LOAD = 12;
const COLUMN_WIDTH = 200;
const GUTTER = 20;

// 状态管理
let currentAlbum = null;
let loadedItems = 0;
let isLoading = false;

// 工具函数
const debounce = (func, wait) => {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

// Masonry 布局
class MasonryLayout {
    constructor($container, itemSelector, columnWidth, gutter) {
        this.$container = $container;
        this.itemSelector = itemSelector;
        this.columnWidth = columnWidth;
        this.gutter = gutter;
    }

    layout() {
        const containerWidth = this.$container.clientWidth;
        const columns = Math.floor((containerWidth + this.gutter) / (this.columnWidth + this.gutter));
        const actualColumnWidth = (containerWidth - (columns - 1) * this.gutter) / columns;
        const columnsHeights = new Array(columns).fill(0);

        const placeItem = ($item) => {
            const columnIndex = columnsHeights.indexOf(Math.min(...columnsHeights));
            const x = columnIndex * (actualColumnWidth + this.gutter);
            const y = columnsHeights[columnIndex];

            $item.style.transform = `translate(${x}px, ${y}px)`;
            $item.style.width = `${actualColumnWidth}px`;
            columnsHeights[columnIndex] += $item.offsetHeight + this.gutter;
        };

        requestAnimationFrame(() => {
            const $items = this.$container.querySelectorAll(this.itemSelector);
            $items.forEach(placeItem);
            this.$container.style.height = `${Math.max(...columnsHeights)}px`;
        });
    }
}

// 图片加载器
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

// Load More 按钮
const loadMoreItems = async ($waterfall, albumData) => {
    if (isLoading || loadedItems >= albumData.photos.length) return;
    isLoading = true;

    const $loadingIndicator = $waterfall.parentNode.querySelector('.loading-indicator');
    const $loadMoreBtn = $waterfall.parentNode.querySelector('.load-more-btn');
    $loadingIndicator.style.display = 'block';
    $loadMoreBtn.style.display = 'none';

    const itemsToLoad = Math.min(ITEMS_PER_LOAD, albumData.photos.length - loadedItems);
    const fragment = document.createDocumentFragment();

    const loadPromises = [];

    for (let i = loadedItems; i < loadedItems + itemsToLoad; i++) {
        const photo = albumData.photos[i];
        const $item = document.createElement('div');
        $item.className = 'gallery-item';
        $item.innerHTML = `<img src="${photo.src}" alt="${photo.alt}" loading="lazy">`;
        fragment.appendChild($item);

        loadPromises.push(loadImage(photo.src));
    }

    $waterfall.appendChild(fragment);
    loadedItems += itemsToLoad;

    const masonry = new MasonryLayout($waterfall, '.gallery-item', COLUMN_WIDTH, GUTTER);

    try {
        await Promise.all(loadPromises);
        masonry.layout();
        $waterfall.querySelectorAll('.gallery-item:not(.loaded)').forEach($item => {
            $item.classList.add('loaded');
        });
    } catch (error) {
        console.error('Error loading images:', error);
    } finally {
        isLoading = false;
        $loadingIndicator.style.display = 'none';
        if (loadedItems < albumData.photos.length) {
            $loadMoreBtn.style.display = 'block';
        }
    }
};

// 初始化相册
const initializeGallery = () => {
    document.querySelectorAll('.gallery-album').forEach($album => {
        $album.addEventListener('click', function () {
            const albumIndex = this.getAttribute('data-album');
            document.querySelectorAll('.gallery-content').forEach($content => {
                $content.style.display = 'none';
            });
            const $content = document.getElementById(`album-${albumIndex}`);
            $content.style.display = 'block';

            window.scrollTo({
                top: $content.offsetTop - 50,
                behavior: 'smooth'
            });

            const $waterfall = $content.querySelector('.gallery-waterfall');
            const albumData = galleryData[albumIndex];

            $waterfall.innerHTML = '';
            loadedItems = 0;
            currentAlbum = albumIndex;

            loadMoreItems($waterfall, albumData);
        });
    });

    document.querySelectorAll('.load-more-btn').forEach($btn => {
        $btn.addEventListener('click', function () {
            const $waterfall = this.parentNode.querySelector('.gallery-waterfall');
            const albumData = galleryData[currentAlbum];
            loadMoreItems($waterfall, albumData);
        });
    });

    window.addEventListener('resize', debounce(() => {
        if (currentAlbum !== null) {
            const $waterfall = document.querySelector(`#album-${currentAlbum} .gallery-waterfall`);
            const masonry = new MasonryLayout($waterfall, '.gallery-item', COLUMN_WIDTH, GUTTER);
            masonry.layout();
        }
        distributeAlbums();
    }, 250));

    initializeLightbox();
    distributeAlbums();
};

// 初始化灯箱
const initializeLightbox = () => {
    const lightbox = document.querySelector('.gallery-lightbox');
    const lightboxImg = lightbox.querySelector('img');
    const closeLightbox = lightbox.querySelector('.close-lightbox');

    document.addEventListener('click', (e) => {
        const img = e.target.closest('.gallery-item img');
        if (img) {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.style.display = 'block';
        }
    });

    closeLightbox.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
        }
    });
};

// 分布相册
const distributeAlbums = () => {
    const container = document.querySelector('.gallery-albums');
    const albums = Array.from(container.children);
    const containerWidth = container.offsetWidth;
    const albumWidth = albums[0].offsetWidth;
    const maxAlbumsPerRow = Math.floor(containerWidth / albumWidth);

    if (albums.length <= maxAlbumsPerRow) return;

    const optimalRows = Math.ceil(albums.length / maxAlbumsPerRow);
    const optimalAlbumsPerRow = Math.ceil(albums.length / optimalRows);

    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.justifyContent = 'center';

    const albumWidthPercent = `${100 / optimalAlbumsPerRow}%`;

    albums.forEach((album) => {
        album.style.width = albumWidthPercent;
        album.style.maxWidth = '300px';
        album.style.transform = 'none';
    });
};

// 初始化
document.addEventListener('DOMContentLoaded', initializeGallery);