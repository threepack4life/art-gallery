// ===== Основной скрипт книги-галереи =====
class BookGallery {
    constructor() {
        this.paintings = window.paintingsData || [];
        this.currentPage = 0;
        this.totalPages = this.paintings.length;
        this.isAnimating = false;
        this.isMobile = window.innerWidth <= 768;
        
        this.init();
    }
    
    init() {
        this.cacheDom();
        this.bindEvents();
        this.renderBook();
        this.hidePreloader();
        this.updateNavigation();
    }
    
    cacheDom() {
        this.bookContainer = document.getElementById('book-container');
        this.pagesContainer = document.getElementById('pages-container');
        this.prevBtn = document.getElementById('prev-page');
        this.nextBtn = document.getElementById('next-page');
        this.currentPageIndicator = document.getElementById('current-page');
        this.totalPagesIndicator = document.getElementById('total-pages');
        this.preloader = document.getElementById('preloader');
        
        // Lightbox элементы
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImage = document.getElementById('lightbox-image');
        this.closeLightbox = document.getElementById('close-lightbox');
        this.lightboxOverlay = this.lightbox.querySelector('.lightbox-overlay');
        
        // Модальное окно добавления
        this.addPaintingModal = document.getElementById('add-painting-modal');
        this.closeModal = document.getElementById('close-modal');
        this.modalOverlay = this.addPaintingModal.querySelector('.modal-overlay');
        this.addPaintingForm = document.getElementById('add-painting-form');
    }
    
    bindEvents() {
        // Навигация по книге
        this.prevBtn.addEventListener('click', () => this.turnPage('prev'));
        this.nextBtn.addEventListener('click', () => this.turnPage('next'));
        
        // Поддержка свайпов на мобильных устройствах
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.bookContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        this.bookContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe(touchStartX, touchEndX);
        });
        
        // Поддержка клавиатуры
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.turnPage('prev');
            } else if (e.key === 'ArrowRight') {
                this.turnPage('next');
            } else if (e.key === 'Escape') {
                this.closeAllModals();
            } else if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.openAddPaintingModal();
            }
        });
        
        // Lightbox события
        this.closeLightbox.addEventListener('click', () => this.closeLightboxModal());
        this.lightboxOverlay.addEventListener('click', () => this.closeLightboxModal());
        
        // Модальное окно добавления
        this.closeModal.addEventListener('click', () => this.closeAddPaintingModal());
        this.modalOverlay.addEventListener('click', () => this.closeAddPaintingModal());
        
        // Форма добавления картины
        this.addPaintingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddPainting();
        });
        
        // Адаптивность
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            // Перерисовываем книгу при изменении ориентации
            if (wasMobile !== this.isMobile) {
                this.renderBook();
            }
        });
    }
    
    hidePreloader() {
        setTimeout(() => {
            this.preloader.style.opacity = '0';
            this.bookContainer.classList.remove('hidden');
            
            setTimeout(() => {
                this.preloader.classList.add('hidden');
            }, 600);
        }, 800);
    }
    
    renderBook() {
        this.pagesContainer.innerHTML = '';
        this.totalPages = this.paintings.length;
        
        if (this.totalPages === 0) {
            this.pagesContainer.innerHTML = '<div style="text-align: center; padding: 2rem;">Нет картин для отображения</div>';
            return;
        }
        
        this.paintings.forEach((painting, index) => {
            const spread = this.createSpread(painting, index);
            this.pagesContainer.appendChild(spread);
        });
        
        this.currentPage = 0;
        this.updatePageVisibility();
        this.updateNavigation();
        this.totalPagesIndicator.textContent = this.totalPages;
    }
    
    createSpread(painting, index) {
        const spread = document.createElement('div');
        spread.className = 'spread';
        spread.style.position = 'absolute';
        spread.style.width = '100%';
        spread.style.height = '100%';
        spread.style.opacity = index === 0 ? '1' : '0';
        spread.style.pointerEvents = index === 0 ? 'auto' : 'none';
        spread.style.transition = 'opacity 0.6s ease';
        
        // Левая страница - изображение
        const leftPage = document.createElement('div');
        leftPage.className = 'page page-left';
        leftPage.innerHTML = `
            <div class="page-content">
                <div class="painting-image-container">
                    <div class="paspartu">
                        <img src="${painting.image}" 
                             alt="${painting.title}" 
                             class="painting-image loading"
                             onload="this.classList.remove('loading')"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22150%22%3E%3Crect width=%22200%22 height=%22150%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EИзображение%3C/text%3E%3C/svg%3E'">
                    </div>
                </div>
            </div>
        `;
        
        // Правая страница - информация
        const rightPage = document.createElement('div');
        rightPage.className = 'page page-right';
        
        let priceHtml = '';
        if (painting.price && painting.price.trim() !== '') {
            priceHtml = `<div class="painting-price">${painting.price}</div>`;
        }
        
        rightPage.innerHTML = `
            <div class="page-content">
                <div class="painting-info">
                    <h2 class="painting-title">${painting.title}</h2>
                    <div class="painting-date">${painting.date || 'Дата не указана'}</div>
                    <p class="painting-description">${painting.description || 'Описание отсутствует'}</p>
                    ${painting.materials ? `
                        <div class="painting-materials">
                            <div class="materials-label">Материалы:</div>
                            <div class="materials-value">${painting.materials}</div>
                        </div>
                    ` : ''}
                    ${priceHtml}
                </div>
            </div>
        `;
        
        spread.appendChild(leftPage);
        spread.appendChild(rightPage);
        
        // Добавляем обработчик клика на изображение
        const imageContainer = leftPage.querySelector('.painting-image-container');
        imageContainer.addEventListener('click', () => this.openLightbox(painting));
        
        return spread;
    }
    
    updatePageVisibility() {
        const spreads = this.pagesContainer.querySelectorAll('.spread');
        spreads.forEach((spread, index) => {
            spread.style.opacity = index === this.currentPage ? '1' : '0';
            spread.style.pointerEvents = index === this.currentPage ? 'auto' : 'none';
        });
    }
    
    turnPage(direction) {
        if (this.isAnimating) return;
        
        const targetPage = direction === 'next' 
            ? Math.min(this.currentPage + 1, this.totalPages - 1)
            : Math.max(this.currentPage - 1, 0);
        
        if (targetPage === this.currentPage) return;
        
        this.isAnimating = true;
        
        const currentSpread = this.pagesContainer.querySelectorAll('.spread')[this.currentPage];
        const targetSpread = this.pagesContainer.querySelectorAll('.spread')[targetPage];
        
        if (!currentSpread || !targetSpread) {
            this.isAnimating = false;
            return;
        }
        
        // Анимация перелистывания
        const currentLeftPage = currentSpread.querySelector('.page-left');
        const currentRightPage = currentSpread.querySelector('.page-right');
        const targetLeftPage = targetSpread.querySelector('.page-left');
        const targetRightPage = targetSpread.querySelector('.page-right');
        
        if (this.isMobile) {
            // Вертикальное перелистывание
            if (direction === 'next') {
                currentSpread.style.transform = 'rotateX(-180deg)';
                currentSpread.style.transformOrigin = 'top center';
                targetSpread.style.transform = 'rotateX(0deg)';
                targetSpread.style.transformOrigin = 'bottom center';
            } else {
                currentSpread.style.transform = 'rotateX(180deg)';
                currentSpread.style.transformOrigin = 'bottom center';
                targetSpread.style.transform = 'rotateX(0deg)';
                targetSpread.style.transformOrigin = 'top center';
            }
        } else {
            // Горизонтальное перелистывание
            if (direction === 'next') {
                currentSpread.style.transform = 'rotateY(-180deg)';
                currentSpread.style.transformOrigin = 'left center';
                targetSpread.style.transform = 'rotateY(0deg)';
                targetSpread.style.transformOrigin = 'right center';
            } else {
                currentSpread.style.transform = 'rotateY(180deg)';
                currentSpread.style.transformOrigin = 'right center';
                targetSpread.style.transform = 'rotateY(0deg)';
                targetSpread.style.transformOrigin = 'left center';
            }
        }
        
        setTimeout(() => {
            this.currentPage = targetPage;
            this.updatePageVisibility();
            this.updateNavigation();
            
            // Сбрасываем трансформации
            currentSpread.style.transform = '';
            targetSpread.style.transform = '';
            
            this.isAnimating = false;
        }, 600);
    }
    
    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        const swipeDistance = endX - startX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance < 0) {
                this.turnPage('next');
            } else {
                this.turnPage('prev');
            }
        }
    }
    
    updateNavigation() {
        this.currentPageIndicator.textContent = this.currentPage + 1;
        this.prevBtn.disabled = this.currentPage === 0;
        this.nextBtn.disabled = this.currentPage === this.totalPages - 1;
    }
    
    openLightbox(painting) {
        this.lightboxImage.src = painting.image;
        this.lightboxImage.alt = painting.title;
        this.lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeLightboxModal() {
        this.lightbox.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    openAddPaintingModal() {
        this.addPaintingModal.classList.remove('hidden');
        this.addPaintingForm.reset();
        document.body.style.overflow = 'hidden';
    }
    
    closeAddPaintingModal() {
        this.addPaintingModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    closeAllModals() {
        this.closeLightboxModal();
        this.closeAddPaintingModal();
    }
    
    handleAddPainting() {
        const newPainting = {
            id: this.paintings.length + 1,
            title: document.getElementById('title').value.trim(),
            image: document.getElementById('image').value.trim(),
            date: document.getElementById('date').value.trim(),
            description: document.getElementById('description').value.trim(),
            materials: document.getElementById('materials').value.trim(),
            price: document.getElementById('price').value.trim()
        };
        
        // Добавляем картину в массив
        this.paintings.push(newPainting);
        
        // Создаем обновленный файл paintings.js
        this.downloadPaintingsFile();
        
        // Перерисовываем книгу
        this.renderBook();
        
        // Закрываем модальное окно
        this.closeAddPaintingModal();
        
        // Переходим на новую страницу
        this.currentPage = this.totalPages - 1;
        this.updatePageVisibility();
        this.updateNavigation();
    }
    
    downloadPaintingsFile() {
        const paintingsData = JSON.stringify(this.paintings, null, 4);
        const fileContent = `// ===== Данные картин для книги =====\n// Каждый объект представляет одну картину\nwindow.paintingsData = ${paintingsData};\n`;
        
        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'paintings.js';
        document.body.appendChild