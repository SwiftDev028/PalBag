(function () {
  "use strict";

  const products = window.PALBAG_PRODUCTS;
  const productMap = new Map(products.map((product) => [product.id, product]));
  const page = document.body.dataset.page || "home";
  const pageBrand = document.body.dataset.brand || "BALENCIAGA";
  const money = new Intl.NumberFormat("ru-RU");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const colorNames = {
    "#1c1b1a": "Чёрный",
    "#8a5a3c": "Коньяк",
    "#d2c7b6": "Песочный",
    "#6d6a58": "Оливковый",
    "#5a2a2e": "Бордо"
  };
  const categoryNames = {
    "тоуты": "Тоуты",
    "кросс-боди": "Кросс-боди",
    "на плечо": "На плечо",
    "мини-сумки": "Мини-сумки"
  };
  const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))].sort();
  const state = {
    catalog: {
      categories: new Set(new URLSearchParams(location.search).getAll("category")),
      brands: new Set(new URLSearchParams(location.search).getAll("brand")),
      colors: new Set(),
      min: "",
      max: "",
      search: new URLSearchParams(location.search).get("search") || "",
      sort: new URLSearchParams(location.search).get("sort") || "popular",
      columns: 3
    },
    drawerOpen: false,
    selectedColor: null,
    selectedSize: null,
    toastTimer: null,
    heroTimer: null
  };
  let headerScrollHandler = null;

  const icons = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10.1-8.8 10.1S3.2 14 3.2 8.8a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 8.5h15.6l1 12H3.2l1-12Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5m6 6-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/></svg>',
    return: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4m0 5h5"/><path d="M5 8a8 8 0 1 1-1 6"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    gift: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18v11H3zM2 6h20v4H2zM12 6v15"/><path d="M12 6H8.5a2.5 2.5 0 1 1 2.5-2.5V6Zm0 0h3.5a2.5 2.5 0 1 0-2.5-2.5V6Z"/></svg>',
    filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 12h10m-7 5h4"/><circle cx="8" cy="7" r="1.5" fill="#fff"/><circle cx="15" cy="12" r="1.5" fill="#fff"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13L19 12 8 5.5Z"/></svg>'
  };

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function observeProductVideos() {
    const videos = document.querySelectorAll("[data-product-video-player]");
    if (!videos.length) return;
    if (!("IntersectionObserver" in window)) {
      videos.forEach((video) => video.closest(".product-gallery__video-frame")?.classList.add("is-fallback"));
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        const video = entry.target;
        const frame = video.closest(".product-gallery__video-frame");
        if (!entry.isIntersecting) {
          video.pause();
          return;
        }
        if (!video.dataset.sourceLoaded) {
          if (!video.canPlayType("video/mp4")) {
            frame?.classList.add("is-fallback");
            currentObserver.unobserve(video);
            return;
          }
          video.dataset.sourceLoaded = "true";
          video.src = video.dataset.videoSrc;
          video.load();
        }
        const playback = video.play();
        if (playback) playback.catch(() => {
          frame?.classList.add("is-fallback");
          currentObserver.unobserve(video);
        });
      });
    }, { rootMargin: "0px", threshold: 0.15 });

    videos.forEach((video) => {
      const frame = video.closest(".product-gallery__video-frame");
      video.muted = true;
      video.playsInline = true;
      video.addEventListener("playing", () => frame?.classList.add("is-playing"), { once: true });
      video.addEventListener("error", () => {
        video.pause();
        frame?.classList.add("is-fallback");
        observer.unobserve(video);
      }, { once: true });
      observer.observe(video);
    });
  }

  function formatPrice(value) {
    if (value == null) return "Цена не указана";
    return `${money.format(value)} ₽`;
  }

  function getSizeOptions(product) {
    if (Array.isArray(product.sizes) && product.sizes.length) return product.sizes;
    if (product.type === "tote") {
      return [
        { name: "Medium", price: product.price },
        { name: "Large", price: product.price }
      ];
    }
    return [{ name: "One size", price: product.price }];
  }

  function getDefaultSize(product) {
    return getSizeOptions(product)[0].name;
  }

  function getProductPrice(product, size) {
    return getSizeOptions(product).find((option) => option.name === size)?.price ?? product.price;
  }

  function getPriceLabel(product) {
    const prices = getSizeOptions(product).map((option) => option.price);
    if (prices.every((price) => price == null)) return "Цена не указана";
    const lowestPrice = Math.min(...prices);
    return prices.some((price) => price !== lowestPrice) ? `от ${formatPrice(lowestPrice)}` : formatPrice(lowestPrice);
  }

  function pluralRu(count, forms) {
    const lastTwo = Math.abs(count) % 100;
    const last = lastTwo % 10;
    if (lastTwo > 10 && lastTwo < 20) return forms[2];
    if (last > 1 && last < 5) return forms[1];
    return last === 1 ? forms[0] : forms[2];
  }

  function readStorage(key, fallback, isValid) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      const parsed = JSON.parse(raw);
      if (isValid(parsed)) return parsed;
      console.error(`Некорректные данные в localStorage (${key}); используется пустое состояние.`);
    } catch (error) {
      console.error(`Не удалось прочитать данные PalBag (${key}).`, error);
    }
    return fallback;
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getCart() {
    return readStorage("palbag-cart", [], (value) => Array.isArray(value))
      .filter((entry) => entry && productMap.has(entry.id) && Number.isInteger(entry.quantity) && entry.quantity > 0)
      .map((entry) => {
        const product = productMap.get(entry.id);
        const size = getSizeOptions(product).some((option) => option.name === entry.size)
          ? entry.size
          : getDefaultSize(product);
        return {
          id: entry.id,
          quantity: entry.quantity,
          color: typeof entry.color === "string" && entry.color.startsWith("#")
            ? entry.color
            : product.color || "",
          size
        };
      });
  }

  function getFavorites() {
    return readStorage("palbag-favorites", [], (value) => Array.isArray(value))
      .filter((id) => productMap.has(id));
  }

  function setCart(cart) {
    writeStorage("palbag-cart", cart);
    updateHeaderCounts();
  }

  function setFavorites(favorites) {
    writeStorage("palbag-favorites", [...new Set(favorites)]);
    updateHeaderCounts();
  }

  function cartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateHeaderCounts() {
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      const count = cartCount();
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
      const link = badge.closest("a");
      if (link) link.setAttribute("aria-label", `Корзина, товаров: ${count}`);
    });
    document.querySelectorAll("[data-favorites-count]").forEach((badge) => {
      const count = getFavorites().length;
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
      const link = badge.closest("a");
      if (link) link.setAttribute("aria-label", `Избранное, товаров: ${count}`);
    });
  }

  function bagArt(type, color, background, extraClass) {
    return `<div class="bag-scene ${extraClass || ""}" style="--bag-color:${escapeHTML(color)};--bag-bg:${escapeHTML(background)}" aria-hidden="true">
      <svg class="bag-art" viewBox="0 0 420 520" focusable="false"><use href="assets/bags.svg#${escapeHTML(type)}"></use></svg>
    </div>`;
  }

  function productVisual(product, index = 0, alt = "") {
    if (!Array.isArray(product.images) || !product.images.length) {
      return bagArt(product.type, product.color, product.background);
    }
    const source = product.images[Math.min(index, product.images.length - 1)];
    return `<img class="product-photo" src="${escapeHTML(source)}" alt="${escapeHTML(alt)}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async">`;
  }

  function productCard(product) {
    const favorite = getFavorites().includes(product.id);
    const sizeOptions = getSizeOptions(product);
    const hasVariantPrices = new Set(sizeOptions.map((option) => option.price)).size > 1;
    const productLabel = product.variantLabel ? `${product.name} — ${product.variantLabel}` : product.name;
    return `<article class="product-card">
      <div class="product-card__visual">
        <a class="product-card__image" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="Открыть товар «${escapeHTML(productLabel)}»">
          ${productVisual(product, 0, productLabel)}
          <span class="product-card__alternate">${product.images?.length > 1 ? productVisual(product, 1, `${productLabel} — дополнительный вид`) : bagArt(product.type, product.color, "#e4ddd2")}</span>
        </a>
        ${product.badge ? `<span class="product-card__badge">${escapeHTML(product.badge)}</span>` : ""}
        <button class="icon-button product-card__favorite ${favorite ? "is-active" : ""}" type="button" data-favorite-toggle="${product.id}" aria-label="${favorite ? "Убрать из" : "Добавить в"} избранное" aria-pressed="${favorite}">
          ${icons.heart}
        </button>
        <div class="product-card__actions">
          <button type="button" ${product.price != null ? `data-add-cart="${product.id}" data-add-color="${escapeHTML(product.color || "")}" data-add-size="${getDefaultSize(product)}"` : `data-price-inquiry="${product.id}"`}>В корзину</button>
          <button class="product-card__quick-view" type="button" data-quick-view="${product.id}" aria-label="Быстрый просмотр «${escapeHTML(productLabel)}»">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
      <div class="product-card__info">
        <div class="product-card__title-row">
          <a class="product-card__name" href="product.html?id=${encodeURIComponent(product.id)}">${escapeHTML(product.name)}</a>
          ${product.swatches?.length ? `<div class="product-card__meta" aria-label="Доступные цвета">${product.swatches.map((color) => `<span class="swatch" style="--swatch:${color}" title="${colorNames[color] || "Цвет"}"></span>`).join("")}</div>` : ""}
        </div>
        <span class="product-card__price">${getPriceLabel(product)}${product.oldPrice ? ` <span class="sale-price">${formatPrice(product.oldPrice)}</span>` : ""}</span>
        ${product.variantLabel ? `<span class="product-card__note">${escapeHTML(product.variantLabel)}</span>` : ""}
        ${hasVariantPrices ? `<span class="product-card__note">${sizeOptions.map((option) => `${escapeHTML(option.name)} — ${formatPrice(option.price)}`).join(" · ")}</span>` : ""}
      </div>
    </article>`;
  }

  function quickViewMarkup(product) {
    const sizes = getSizeOptions(product);
    const hasVariantPrices = new Set(sizes.map((option) => option.price)).size > 1;
    return `<div class="quick-view-backdrop" data-quick-view-backdrop>
      <section class="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        <button class="icon-button quick-view__close" type="button" data-quick-view-close aria-label="Закрыть">${icons.close}</button>
        <div class="quick-view__image">${productVisual(product, 0, product.name)}</div>
        <div class="quick-view__content">
          <span class="eyebrow">${product.brand ? `${escapeHTML(product.brand)}${product.variantLabel ? ` · ${escapeHTML(product.variantLabel)}` : ""}` : `${escapeHTML(categoryNames[product.category] || product.category)} · натуральная кожа`}</span>
          <h2 id="quick-view-title">${escapeHTML(product.name)}</h2>
          ${product.description ? `<p>${escapeHTML(product.description)}</p>` : ""}
          ${product.packageContents ? `<p>Материал: ${escapeHTML(product.material)} · Комплектация: ${escapeHTML(product.packageContents)}</p>` : ""}
          <strong>${getPriceLabel(product)}${product.oldPrice ? ` <del>${formatPrice(product.oldPrice)}</del>` : ""}</strong>
          ${hasVariantPrices ? `<p class="quick-view__variant-note">Добавится размер ${escapeHTML(getDefaultSize(product))}. Другой размер можно выбрать на странице товара.</p>` : ""}
          <button class="button" type="button" ${product.price != null ? `data-quick-view-add="${product.id}" data-add-color="${product.color}" data-add-size="${getDefaultSize(product)}"` : `data-price-inquiry="${product.id}"`}>Добавить в корзину</button>
          <a class="text-link" href="product.html?id=${encodeURIComponent(product.id)}">Подробнее о модели ${icons.arrow}</a>
        </div>
      </section>
    </div>`;
  }

  function openQuickView(id) {
    const product = productMap.get(id);
    if (!product) return;
    let layer = document.getElementById("quick-view-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "quick-view-layer";
      document.body.append(layer);
    }
    layer.innerHTML = quickViewMarkup(product);
    layer.querySelector(".quick-view-backdrop").classList.add("is-open");
    document.body.classList.add("is-locked");
    layer.querySelector("[data-quick-view-close]").focus();
  }

  function closeQuickView() {
    const layer = document.getElementById("quick-view-layer");
    if (layer) layer.innerHTML = "";
    if (!document.querySelector("#site-menu.is-open, [data-modal-backdrop].is-open")) {
      document.body.classList.remove("is-locked");
    }
  }

  function headerMarkup() {
    const home = page === "home";
    return `${home ? `<div class="announcement">Бесплатная доставка от 20 000 ₽ · Возврат в течение 14 дней</div>` : ""}
      <div class="site-header ${home ? "site-header--overlay" : ""}" id="sticky-header">
        <div class="header-main">
          <nav class="header-left" aria-label="Основная навигация">
            <button class="menu-trigger" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-menu" aria-label="Открыть меню">
              <span class="menu-trigger__lines" aria-hidden="true"><span></span><span></span></span>
              <span class="menu-trigger__label">Меню</span>
            </button>
            <a href="catalog.html">Каталог</a>
            <a href="catalog.html?sort=new">Новинки</a>
            <a href="catalog.html?sort=popular">Бестселлеры</a>
            <a href="balenciaga.html">BALENCIAGA</a>
            <a href="chanel.html">CHANEL</a>
            <a href="moschino.html">MOSCHINO</a>
          </nav>
          <a class="brand" href="index.html" aria-label="PalBag — на главную"><span>PAL</span><strong>BAG</strong></a>
          <div class="header-right">
            <nav class="header-secondary" aria-label="Информация">
              <a href="about.html">О бренде</a>
              <a href="contacts.html">Контакты</a>
            </nav>
            <div class="header-actions">
            <button class="icon-button header-mobile-search" type="button" data-mobile-search aria-label="Поиск">${icons.search}</button>
            <a class="icon-button desktop-only" href="favorites.html" aria-label="Избранное">
              ${icons.heart}<span class="count-badge" data-favorites-count hidden></span>
            </a>
            <a class="icon-button" href="cart.html" aria-label="Корзина">
              ${icons.bag}<span class="count-badge" data-cart-count hidden></span>
            </a>
            </div>
          </div>
        </div>
        <div class="mobile-search-panel" id="mobile-search-panel" hidden>
          <form class="search-field wrap" role="search" action="catalog.html">
            <input type="search" name="search" placeholder="Название или тип сумки" aria-label="Поиск по каталогу">
            <button type="submit" aria-label="Искать">${icons.search}</button>
          </form>
        </div>
      </div>
      <nav class="header-menu" id="site-menu" aria-label="Главное меню" aria-hidden="true">
        <div class="menu-main">
          <button class="icon-button menu-close" type="button" data-menu-close aria-label="Закрыть меню">${icons.close}</button>
          <span class="eyebrow">PalBag · коллекция 2026</span>
          <div class="menu-links">
            <a href="catalog.html">Каталог</a>
            <a href="balenciaga.html">BALENCIAGA</a>
            <a href="chanel.html">CHANEL</a>
            <a href="moschino.html">MOSCHINO</a>
            <a href="about.html">О бренде</a>
            <a href="delivery.html">Доставка и оплата</a>
            <a href="contacts.html">Контакты</a>
            <a href="favorites.html">Избранное</a>
          </div>
        </div>
        <div class="menu-aside">
          <div class="menu-aside__art">${bagArt("shoulder", "#8a5a3c", "#e9e3da")}</div>
          <div class="menu-aside__copy">
            <span class="eyebrow">Вещи на каждый день</span>
            <p>Форма, которая остаётся актуальной.</p>
            <a class="text-link" href="catalog.html">Смотреть коллекцию ${icons.arrow}</a>
          </div>
        </div>
      </nav>`;
  }

  function footerMarkup() {
    return `<div class="footer">
      <div class="wrap footer-top">
        <div class="footer-brand">
          <a class="brand brand--small" href="index.html" aria-label="PalBag — на главную"><span>PAL</span><strong>BAG</strong></a>
          <p>Женские сумки из натуральных материалов. Чистые линии и внимание к деталям.</p>
        </div>
        <nav class="footer-column" aria-label="Каталог">
          <h2>Каталог</h2>
          <a href="catalog.html">Все сумки</a>
          <a href="catalog.html?sort=new">Новинки</a>
          <a href="catalog.html?sort=popular">Бестселлеры</a>
          <a href="catalog.html?category=кросс-боди">Кросс-боди</a>
          <a href="catalog.html?category=тоуты">Тоуты</a>
          <a href="balenciaga.html">BALENCIAGA</a>
          <a href="chanel.html">CHANEL</a>
          <a href="moschino.html">MOSCHINO</a>
        </nav>
        <nav class="footer-column" aria-label="Покупателям">
          <h2>Покупателям</h2>
          <a href="delivery.html">Доставка и оплата</a>
          <a href="delivery.html#returns">Возврат</a>
          <a href="about.html">О бренде</a>
          <a href="contacts.html">Контакты</a>
        </nav>
        <nav class="footer-column" aria-label="Социальные сети">
          <h2>Социальные сети</h2>
          <a href="https://t.me/">Telegram</a>
          <a href="https://vk.com/">VK</a>
          <a href="https://pinterest.com/">Pinterest</a>
        </nav>
      </div>
      <div class="wrap footer-bottom">
        <span>© 2026 PalBag, palbag.ru · Демонстрационный прототип</span>
        <div><a href="#privacy">Политика конфиденциальности</a><a href="#terms">Пользовательское соглашение</a></div>
      </div>
    </div>`;
  }

  function heroMarkup() {
    const slides = [
      {
        eyebrow: "Новая коллекция · Зима 2026",
        title: "Сумки,<br>которые остаются",
        description: "Натуральная кожа, чистые линии и продуманные детали.",
        type: "tote",
        color: "#8a5a3c",
        background: "#d9cebf",
        backdrop: "#efe9e0",
        link: "catalog.html?category=тоуты",
        action: "Смотреть коллекцию"
      },
      {
        eyebrow: "Мини-сумки",
        title: "Малый формат,<br>большой характер",
        description: "Всё необходимое — и ничего лишнего.",
        type: "mini",
        color: "#1c1b1a",
        background: "#cfd2cb",
        backdrop: "#ebede8",
        link: "catalog.html?category=мини-сумки",
        action: "Смотреть коллекцию"
      },
      {
        eyebrow: "Кросс-боди",
        title: "Лёгкость<br>на каждый день",
        description: "Руки свободны, образ завершён.",
        type: "cross",
        color: "#5a2a2e",
        background: "#dfcfc9",
        backdrop: "#f2e9e5",
        link: "catalog.html?category=кросс-боди",
        action: "Смотреть коллекцию"
      }
    ];
    const slidesMarkup = slides.map((slide, index) => `<article class="hero-slide ${index === 0 ? "is-active" : ""}" data-hero-slide="${index}" aria-hidden="${index !== 0}" style="background:${slide.backdrop}">
      <div class="hero-copy">
        <span class="eyebrow">${slide.eyebrow}</span>
        <h1 class="display">${slide.title}</h1>
        <p class="lead">${slide.description}</p>
        <a class="button" href="${slide.link}">${slide.action}</a>
      </div>
      <div class="hero-art">${bagArt(slide.type, slide.color, slide.background)}</div>
    </article>`).join("");
    const progress = slides.map((slide, index) => `<button type="button" data-hero-go="${index}" aria-label="Баннер ${index + 1}" aria-current="${index === 0}"><span></span></button>`).join("");
    return `<section class="hero" aria-label="Рекламные баннеры">
      <div class="hero-track" id="hero-track">${slidesMarkup}</div>
      <div class="hero-controls">
        <div class="hero-control-group">
          <span class="hero-counter" id="hero-counter">01 / 03</span>
          <div class="hero-progress" aria-label="Выбрать баннер">${progress}</div>
        </div>
        <div class="hero-arrows">
          <button class="hero-arrow" type="button" data-hero-prev aria-label="Предыдущий баннер">${icons.left}</button>
          <button class="hero-arrow" type="button" data-hero-next aria-label="Следующий баннер">${icons.right}</button>
        </div>
      </div>
    </section>`;
  }

  function homeMarkup() {
    const categoryTypes = [
      { title: "Женские сумки", category: "", type: "tote", color: "#1c1b1a", background: "#e9e3da" },
      { title: "Кросс-боди", category: "кросс-боди", type: "cross", color: "#8a5a3c", background: "#dcd3c6" },
      { title: "Сумки на плечо", category: "на плечо", type: "shoulder", color: "#6d6a58", background: "#e4e3dc" },
      { title: "Тоуты", category: "тоуты", type: "tote", color: "#d2c7b6", background: "#ece7e0" },
      { title: "Мини-сумки", category: "мини-сумки", type: "mini", color: "#5a2a2e", background: "#e2d6d0" },
      { title: "Новинки", category: "", type: "cross", color: "#1c1b1a", background: "#d8d9d3" }
    ];
    return `${heroMarkup()}
      <section class="home-section wrap reveal">
        <div class="section-head">
          <div class="section-head__copy"><span class="eyebrow">Каталог</span><h2 class="section-title">Популярные категории</h2></div>
          <a class="text-link" href="catalog.html">Все сумки ${icons.arrow}</a>
        </div>
        <div class="category-grid">${categoryTypes.map((category, index) => `<a class="category-card ${index === 1 || index === 4 ? "category-card--offset" : ""}" href="${category.title === "Новинки" ? "catalog.html?sort=new" : category.category ? `catalog.html?category=${encodeURIComponent(category.category)}` : "catalog.html"}">
          ${bagArt(category.type, category.color, category.background)}
          <span class="category-card__label"><span>${category.title}</span><span>${String(index + 1).padStart(2, "0")}</span></span>
        </a>`).join("")}</div>
      </section>
      <section class="brand-editorial brand-editorial--home wrap reveal">
        <div class="brand-editorial__media"><img src="assets/balenciaga/lookbook-carry-all-01.jpg" alt="Модель с сумкой BALENCIAGA Bel Air Carry All Bag" loading="lazy"></div>
        <div class="brand-editorial__copy">
          <span class="eyebrow">Дизайнерские марки · BALENCIAGA</span>
          <h2 class="section-title">BALENCIAGA</h2>
          <p>Bel Air Carry All Bag — выразительный силуэт, продуманные детали и два размера на выбор.</p>
          <a class="button" href="balenciaga.html">Открыть коллекцию ${icons.arrow}</a>
        </div>
      </section>
      <section class="brand-editorial brand-editorial--home wrap reveal">
        <div class="brand-editorial__media"><img src="assets/chanel/chanel-maxi-flap-01-front.jpeg" alt="Chanel Maxi Flap Bag" loading="lazy"></div>
        <div class="brand-editorial__copy">
          <span class="eyebrow">Дизайнерские марки · CHANEL</span>
          <h2 class="section-title">CHANEL</h2>
          <p>Chanel Maxi Flap Bag — изучите модель, фотографии и видео товара.</p>
          <a class="button" href="chanel.html">Открыть коллекцию ${icons.arrow}</a>
        </div>
      </section>
      <section class="brand-editorial brand-editorial--home wrap reveal">
        <div class="brand-editorial__media"><img src="assets/moschino/moschino-tie-me-01-front.jpeg" alt="Moschino Tie Me Bag" loading="lazy"></div>
        <div class="brand-editorial__copy">
          <span class="eyebrow">Дизайнерские марки · MOSCHINO</span>
          <h2 class="section-title">MOSCHINO</h2>
          <p>Moschino Tie Me Bag — натуральная замша и выразительная форма.</p>
          <a class="button" href="moschino.html">Открыть коллекцию ${icons.arrow}</a>
        </div>
      </section>
      <section class="home-section wrap reveal">
        <div class="section-head">
          <div class="section-head__copy"><span class="eyebrow">Выбор покупателей</span><h2 class="section-title">Бестселлеры PalBag</h2></div>
          <a class="text-link" href="catalog.html">Смотреть все ${icons.arrow}</a>
        </div>
        <div class="product-grid">${products.slice(0, 4).map(productCard).join("")}</div>
      </section>
      <section class="editorial-band reveal">
        <div class="editorial-band__art">${bagArt("cross", "#8a5a3c", "#dcd2c4")}</div>
        <div class="editorial-band__copy">
          <span class="eyebrow">Editorial · Материал</span>
          <h2 class="section-title">Кожа, которая красиво стареет</h2>
          <p>Мы выбираем плотные натуральные материалы, сдержанную фурнитуру и швы, которые видны только вблизи. Сумка, которая становится лучше с годами.</p>
          <a class="text-link" href="about.html">О материалах ${icons.arrow}</a>
        </div>
      </section>
      <section class="home-section wrap reveal">
        <div class="section-head">
          <div class="section-head__copy"><span class="eyebrow">Зима 2026</span><h2 class="section-title">Новинки</h2></div>
          <a class="text-link" href="catalog.html?sort=new">Смотреть все ${icons.arrow}</a>
        </div>
        <div class="product-grid">${products.slice(4).map(productCard).join("")}</div>
      </section>
      <section class="home-statement reveal">
        <span class="eyebrow">О PalBag</span>
        <p>PalBag — это сумки без лишнего. Мы выбираем материалы, которые служат годами, и формы, которые не выходят из моды.</p>
        <a class="text-link" href="about.html">О бренде ${icons.arrow}</a>
      </section>
      <section class="home-promises wrap reveal" aria-label="Преимущества PalBag">
        <div class="home-promise">${icons.truck}<h3>Доставка по России</h3><p>Курьером и в пункты выдачи.</p></div>
        <div class="home-promise">${icons.return}<h3>Возврат 14 дней</h3><p>Если сумка не подошла — вернём деньги.</p></div>
        <div class="home-promise">${icons.lock}<h3>Безопасная оплата</h3><p>Картой, через СБП или при получении.</p></div>
        <div class="home-promise">${icons.gift}<h3>Фирменная упаковка</h3><p>Коробка и пыльник в комплекте.</p></div>
      </section>
      <section class="home-section wrap reveal">
        <div class="section-head"><div class="section-head__copy"><span class="eyebrow">Отзывы</span><h2 class="section-title">Говорят покупатели</h2></div></div>
        <div class="reviews-grid">
          <article class="quote-card"><span class="quote-stars" aria-label="Оценка 5 из 5">★★★★★</span><blockquote>«Качество чувствуется в каждой детали. Сумка выглядит сдержанно и дорого»</blockquote><cite>Анна · Тоут Lune</cite></article>
          <article class="quote-card"><span class="quote-stars" aria-label="Оценка 5 из 5">★★★★★</span><blockquote>«Очень приятная упаковка и быстрая доставка. Ношу каждый день»</blockquote><cite>Мария · Кросс-боди Aria</cite></article>
          <article class="quote-card"><span class="quote-stars" aria-label="Оценка 5 из 5">★★★★★</span><blockquote>«Наконец нашла идеальный размер — всё нужное помещается»</blockquote><cite>Елена · Мини Nota</cite></article>
        </div>
      </section>
      <section class="newsletter-section reveal">
        <div class="newsletter">
          <span class="eyebrow">Подписка</span>
          <h2>Новое — первыми</h2>
          <p>Новые коллекции и специальные предложения. Без лишних писем.</p>
          <form class="newsletter-form" data-newsletter>
            <label class="sr-only" for="newsletter-email">Ваш e-mail</label>
            <input id="newsletter-email" type="email" name="email" placeholder="Ваш e-mail" required>
            <button type="submit">Подписаться</button>
          </form>
          <small>Нажимая «Подписаться», вы соглашаетесь с политикой конфиденциальности.</small>
        </div>
      </section>
      <section class="home-section home-social wrap reveal">
        <div class="section-head">
          <div class="section-head__copy"><span class="eyebrow">Социальные сети</span><h2 class="section-title">PalBag в Telegram и VK</h2></div>
          <div class="home-social__links"><a class="text-link" href="https://t.me/">Telegram</a><a class="text-link" href="https://vk.com/">VK</a></div>
        </div>
        <div class="social-grid" aria-label="Коллекция PalBag">
          ${[
            ["tote", "#1c1b1a", "#e9e3da"], ["mini", "#8a5a3c", "#ddd4c8"], ["cross", "#5a2a2e", "#e4d9d3"],
            ["shoulder", "#6d6a58", "#e2e2da"], ["tote", "#d2c7b6", "#ede8e1"], ["cross", "#1c1b1a", "#d8d9d3"]
          ].map(([type, color, background]) => bagArt(type, color, background)).join("")}
        </div>
      </section>`;
  }

  function filterMarkup() {
    const selectedCategories = state.catalog.categories;
    const selectedBrands = state.catalog.brands;
    const selectedColors = state.catalog.colors;
    return `<div class="filter-groups">
      ${brands.length ? `<details class="filter-group" open>
        <summary>Бренд</summary>
        <div class="filter-options">${brands.map((brand) => `<label class="filter-check"><input class="filter-input" type="checkbox" data-filter-brand="${escapeHTML(brand)}" ${selectedBrands.has(brand) ? "checked" : ""}>${escapeHTML(brand)}</label>`).join("")}</div>
      </details>` : ""}
      <details class="filter-group" open>
        <summary>Категория</summary>
        <div class="filter-options">${Object.entries(categoryNames).map(([key, label]) => `<label class="filter-check"><input class="filter-input" type="checkbox" data-filter-category="${key}" ${selectedCategories.has(key) ? "checked" : ""}>${label}</label>`).join("")}</div>
      </details>
      <details class="filter-group" open>
        <summary>Цвет</summary>
        <div class="filter-options">
          <div class="filter-color-list">${Object.entries(colorNames).map(([color, label]) => `<button class="filter-color" type="button" data-filter-color="${color}" aria-label="${label}" aria-pressed="${selectedColors.has(color)}" style="--swatch:${color}"></button>`).join("")}</div>
          <span class="muted" style="font-size:11px">${selectedColors.size ? `${selectedColors.size} выбрано` : "Выберите один или несколько"}</span>
        </div>
      </details>
      <details class="filter-group" open>
        <summary>Цена, ₽</summary>
        <div class="filter-options">
          <div class="price-range">
            <label>От<input class="filter-input" type="number" min="0" step="500" data-filter-min value="${escapeHTML(state.catalog.min)}" placeholder="8 000"></label>
            <label>До<input class="filter-input" type="number" min="0" step="500" data-filter-max value="${escapeHTML(state.catalog.max)}" placeholder="20 000"></label>
          </div>
          <button class="text-link" type="button" data-filter-apply>Показать товары ${icons.arrow}</button>
        </div>
      </details>
      <div class="filter-actions"><button class="button button--outline button--small" type="button" data-filter-reset>Сбросить</button></div>
    </div>`;
  }

  function catalogMarkup() {
    const filtered = products.filter((product) => {
      const matchesCategory = !state.catalog.categories.size || state.catalog.categories.has(product.category);
      const matchesBrand = !state.catalog.brands.size || state.catalog.brands.has(product.brand);
      const matchesColor = !state.catalog.colors.size || product.swatches.some((color) => state.catalog.colors.has(color));
      const matchesPrice = getSizeOptions(product).some((option) =>
        (!state.catalog.min || option.price >= Number(state.catalog.min))
        && (!state.catalog.max || option.price <= Number(state.catalog.max))
      );
      const term = state.catalog.search.trim().toLocaleLowerCase("ru");
      const searchableText = [product.name, product.brand, categoryNames[product.category] || product.category, product.colorName, product.material]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ru");
      const matchesSearch = !term || searchableText.includes(term);
      return matchesCategory && matchesBrand && matchesColor && matchesPrice && matchesSearch;
    });
    const sorted = [...filtered];
    if (state.catalog.sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (state.catalog.sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (state.catalog.sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    if (state.catalog.sort === "new") sorted.sort((a, b) => Number(b.badge === "Новинка") - Number(a.badge === "Новинка"));
    const selectedBrand = state.catalog.brands.size === 1 ? [...state.catalog.brands][0] : "";
    const intro = state.catalog.search
      ? `<span class="eyebrow">Результаты поиска</span><h1 class="page-title">«${escapeHTML(state.catalog.search)}»</h1><p class="lead">Найдено: ${sorted.length}</p>`
      : selectedBrand
        ? `<span class="eyebrow">Коллекция бренда</span><h1 class="page-title">${escapeHTML(selectedBrand)}</h1><p class="lead">Модели бренда в каталоге PalBag.</p>`
        : `<span class="eyebrow">Коллекция PalBag</span><h1 class="page-title">Все сумки</h1><p class="lead">Натуральная кожа, чистые линии и формы для каждого дня.</p>`;
    const activeFilters = state.catalog.categories.size + state.catalog.brands.size + state.catalog.colors.size;
    return `<div class="wrap">
      <nav class="breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Каталог</span></nav>
      <header class="catalog-intro"><div class="catalog-intro__copy">${intro}</div><span class="eyebrow">${sorted.length} ${pluralRu(sorted.length, ["модель", "модели", "моделей"])}</span></header>
      <div class="catalog-layout">
        <aside class="filters" aria-label="Фильтры каталога">${filterMarkup()}</aside>
        <section aria-label="Товары каталога">
          <div class="catalog-toolbar">
            <button class="filter-mobile-trigger" type="button" data-filter-open>${icons.filter} Фильтры${activeFilters ? ` · ${activeFilters}` : ""}</button>
            <span class="catalog-count">${sorted.length} ${pluralRu(sorted.length, ["модель", "модели", "моделей"])}</span>
            <label class="catalog-sort">Сортировка
              <select data-sort>
                <option value="popular" ${state.catalog.sort === "popular" ? "selected" : ""}>По популярности</option>
                <option value="new" ${state.catalog.sort === "new" ? "selected" : ""}>Сначала новинки</option>
                <option value="price-asc" ${state.catalog.sort === "price-asc" ? "selected" : ""}>Сначала дешевле</option>
                <option value="price-desc" ${state.catalog.sort === "price-desc" ? "selected" : ""}>Сначала дороже</option>
                <option value="name" ${state.catalog.sort === "name" ? "selected" : ""}>По названию</option>
              </select>
            </label>
            <div class="catalog-grid-options" role="group" aria-label="Количество колонок">
              <button type="button" data-grid-columns="3" aria-label="3 колонки" aria-pressed="${state.catalog.columns === 3}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="5" height="16"/><rect x="9.5" y="4" width="5" height="16"/><rect x="16" y="4" width="5" height="16"/></svg>
              </button>
              <button type="button" data-grid-columns="4" aria-label="4 колонки" aria-pressed="${state.catalog.columns === 4}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="3.5" height="16"/><rect x="8" y="4" width="3.5" height="16"/><rect x="13" y="4" width="3.5" height="16"/><rect x="18" y="4" width="3.5" height="16"/></svg>
              </button>
            </div>
          </div>
          <div class="catalog-products ${state.catalog.columns === 4 ? "is-four-columns" : ""}">${sorted.length ? sorted.map(productCard).join("") : `<div class="empty-state"><h2>Ничего не найдено</h2><p>Попробуйте изменить запрос или сбросить фильтры.</p><button class="button button--outline button--small" type="button" data-filter-reset>Сбросить фильтры</button></div>`}</div>
          <div class="brand-catalog-promo">
            <img src="assets/balenciaga/lookbook-carry-all-02.jpg" alt="" loading="lazy">
            <div><span class="eyebrow">BALENCIAGA</span><p>Откройте отдельную коллекцию бренда.</p></div>
            <a class="text-link" href="balenciaga.html">Перейти в BALENCIAGA ${icons.arrow}</a>
          </div>
          <div class="brand-catalog-promo">
            <img src="assets/chanel/chanel-maxi-flap-01-front.jpeg" alt="" loading="lazy">
            <div><span class="eyebrow">CHANEL</span><p>Откройте отдельную коллекцию бренда.</p></div>
            <a class="text-link" href="chanel.html">Перейти в CHANEL ${icons.arrow}</a>
          </div>
          <div class="brand-catalog-promo">
            <img src="assets/moschino/moschino-tie-me-01-front.jpeg" alt="" loading="lazy">
            <div><span class="eyebrow">MOSCHINO</span><p>Откройте отдельную коллекцию бренда.</p></div>
            <a class="text-link" href="moschino.html">Перейти в MOSCHINO ${icons.arrow}</a>
          </div>
          <div class="promo-card"><div><span class="eyebrow">Внимание к каждой детали</span><h2>Выберите сумку для своего ритма</h2></div><a class="text-link" href="about.html">О PalBag ${icons.arrow}</a></div>
        </section>
      </div>
    </div>`;
  }

  function renderFilterDrawer() {
    const root = document.getElementById("overlay-root");
    if (!root || page !== "catalog") return;
    root.innerHTML = `<div class="drawer-backdrop ${state.drawerOpen ? "is-open" : ""}" data-filter-close></div>
      <aside class="filter-drawer ${state.drawerOpen ? "is-open" : ""}" aria-label="Фильтры каталога" aria-hidden="${!state.drawerOpen}">
        <div class="drawer-head"><h2>Фильтры</h2><button class="icon-button" type="button" data-filter-close aria-label="Закрыть фильтры">${icons.close}</button></div>
        ${filterMarkup()}
      </aside>`;
  }

  function productGalleryMarkup(product, color) {
    if (product.videoUrl) {
      const fallbackImage = product.videoFallbackImage || product.images[0];
      return `<div class="product-gallery" aria-label="Фото и видео товара">
        <div class="product-gallery__main">
          <div class="product-gallery__video-frame">
            <img class="product-gallery__video-fallback" src="${escapeHTML(fallbackImage)}" alt="${escapeHTML(product.name)}" decoding="async">
            <video class="product-gallery__video-player" data-product-video-player data-video-src="${escapeHTML(product.videoUrl)}" muted loop playsinline preload="none" poster="${escapeHTML(fallbackImage)}" aria-label="${escapeHTML(product.name)} — видео"></video>
          </div>
          <span class="product-gallery__count">1 / ${product.images.length + 1}</span>
        </div>
        ${product.images.map((image, index) => `<div class="product-gallery__tile">${productVisual(product, index, `${product.name} — фото ${index + 1}`)}</div>`).join("")}
      </div>`;
    }
    if (Array.isArray(product.images) && product.images.length) {
      return `<div class="product-gallery" aria-label="Изображения товара">
        <div class="product-gallery__main">
          ${productVisual(product, 0, `${product.name} — вид спереди`)}
          ${product.badge ? `<span class="product-gallery__badge">${escapeHTML(product.badge)}</span>` : ""}
          <button class="product-gallery__zoom" type="button" data-gallery-zoom aria-label="Увеличить изображение">${icons.search}</button>
          <span class="product-gallery__count">1 / ${product.images.length}</span>
        </div>
        ${product.images.slice(1).map((image, index) => `<div class="product-gallery__tile">${productVisual(product, index + 1, `${product.name} — вид ${index + 2}`)}</div>`).join("")}
      </div>`;
    }
    return `<div class="product-gallery" aria-label="Изображения товара">
      <div class="product-gallery__main">
        ${bagArt(product.type, color, product.background)}
        ${product.badge ? `<span class="product-gallery__badge">${escapeHTML(product.badge)}</span>` : ""}
        <button class="product-gallery__zoom" type="button" data-gallery-zoom aria-label="Увеличить изображение">${icons.search}</button>
        <span class="product-gallery__count">1 / 5</span>
      </div>
      <div class="product-gallery__tile">${bagArt(product.type, color, "#e4ddd2")}</div>
      <div class="product-gallery__tile">${bagArt(product.type, color, "#ded6ca")}</div>
      <div class="product-gallery__tile product-gallery__video">${bagArt(product.type, color, "#e8e2d8")}<button type="button" data-product-video aria-label="Запустить видеообзор">${icons.play}</button></div>
      <div class="product-gallery__tile">${bagArt(product.type, color, "#e1dad0")}</div>
    </div>`;
  }

  function productMarkup(product) {
    const color = state.selectedColor || product.color || "";
    const size = state.selectedSize || getDefaultSize(product);
    const price = getProductPrice(product, size);
    const sizeOptions = getSizeOptions(product);
    const colorOptions = product.swatches || [];
    const categoryLabel = product.category !== product.brand
      ? categoryNames[product.category] || product.category
      : "";
    const specifications = product.specifications
      ? product.specifications
      : product.minimalDetails
      ? [["Материал", product.material], ["Комплектация", product.packageContents]]
      : [
          ["Материал", product.material],
          ["Подкладка", "Текстиль"],
          ["Фурнитура", product.hardware || "Металл золотистого оттенка"],
          ["Размер", product.dimensions],
          ["Длина ремня", product.strap],
          ["Комплектация", product.packageContents],
          ["Артикул", `PB-${product.id.toUpperCase()}`]
        ];
    const descriptionMarkup = product.description ? `<div>
      <h2 class="section-title">Описание</h2>
      <p>${escapeHTML(product.description)} Форма, материал и аккуратная отделка продуманы для ежедневного использования.</p>
      <h3>Уход за изделием</h3>
      <p>Протирать мягкой тканью, хранить в пыльнике, избегать воды и прямого солнца.</p>
    </div>` : "";
    const relatedProducts = products
      .filter((item) => item.id !== product.id)
      .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
      .slice(0, 4);
    const favorite = getFavorites().includes(product.id);
    return `<div class="wrap">
      <nav class="breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><a href="catalog.html">Каталог</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHTML(product.name)}</span></nav>
      <div class="product-detail">
        ${productGalleryMarkup(product, color)}
        <section class="product-info">
          <span class="eyebrow">${product.brand ? escapeHTML(product.brand) : ""}${categoryLabel ? `${product.brand ? " · " : ""}${escapeHTML(categoryLabel)}` : ""}${product.variantLabel ? ` · ${escapeHTML(product.variantLabel)}` : ""}</span>
          <h1>${escapeHTML(product.name)}</h1>
          ${product.showDemoRating === false ? "" : `<div class="product-rating"><span class="product-rating__stars">★★★★★</span><span>4,9 · 18 отзывов</span></div>`}
          <div class="product-detail__price"><strong>${formatPrice(price)}</strong>${product.oldPrice ? `<del>${formatPrice(product.oldPrice)}</del>` : ""}</div>
          ${product.description ? `<p class="product-description">${escapeHTML(product.description)}</p>` : ""}
          ${colorOptions.length ? `<div class="product-option">
            <div class="product-option__head"><strong>Цвет</strong><span data-color-name>${colorNames[color] || product.colorName}</span></div>
            <div class="product-swatches">${colorOptions.map((swatch) => `<button class="swatch swatch--large ${swatch === color ? "swatch--selected" : ""}" type="button" data-select-color="${swatch}" aria-label="${colorNames[swatch] || "Цвет"}" aria-pressed="${swatch === color}" style="--swatch:${swatch}"></button>`).join("")}</div>
          </div>` : ""}
          ${product.hideSizeOption ? "" : `<div class="product-option">
            <div class="product-option__head"><strong>Размер</strong><a href="#product-specifications">Размеры</a></div>
            <div class="product-sizes">${sizeOptions.map((option) => `<button class="product-size ${option.name === size ? "is-selected" : ""}" type="button" data-select-size="${escapeHTML(option.name)}" aria-pressed="${option.name === size}">${option.name === "One size" ? "Универсальный" : escapeHTML(option.name)}</button>`).join("")}</div>
          </div>`}
          ${product.showStockInfo === false ? "" : `<div class="product-stock"><span></span>В наличии · доставим за 2–5 дней</div>`}
          ${product.price != null ? `<div class="product-actions">
            <button class="button" type="button" data-add-cart="${product.id}" data-add-color="${escapeHTML(color)}" data-add-size="${escapeHTML(size)}">Добавить в корзину</button>
            <button class="icon-button ${favorite ? "is-active" : ""}" type="button" data-favorite-toggle="${product.id}" aria-label="${favorite ? "Убрать из" : "Добавить в"} избранное" aria-pressed="${favorite}">${icons.heart}</button>
            <button class="product-buy-now" type="button" data-buy-now="${product.id}" data-add-color="${escapeHTML(color)}" data-add-size="${escapeHTML(size)}">Купить сейчас</button>
          </div>` : `<div class="product-actions">
            <button class="button" type="button" data-price-inquiry="${product.id}">Добавить в корзину</button>
            <button class="icon-button ${favorite ? "is-active" : ""}" type="button" data-favorite-toggle="${product.id}" aria-label="${favorite ? "Убрать из" : "Добавить в"} избранное" aria-pressed="${favorite}">${icons.heart}</button>
            <button class="product-buy-now" type="button" data-price-inquiry="${product.id}">Купить сейчас</button>
          </div>`}
          <div class="product-accordion">
            <details open><summary>Доставка</summary><p>Доставляем по России курьером и в пункты выдачи. Срок — 2–5 дней, бесплатно от 20 000 ₽.</p></details>
            <details><summary>Возврат</summary><p>Возврат в течение 14 дней при сохранении товарного вида.</p></details>
            <details><summary>Оплата</summary><p>Картой, через СБП или при получении. Оплата в этом прототипе демонстрационная.</p></details>
          </div>
        </section>
      </div>
    </div>
    <section class="product-description-grid wrap ${descriptionMarkup ? "" : "product-description-grid--single"}" id="product-specifications">
      ${descriptionMarkup}
      <div><h2 class="section-title">Характеристики</h2><dl>${specifications.filter(([, value]) => value).map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`).join("")}</dl></div>
    </section>
    ${product.showDemoReviews === false ? "" : `<section class="home-section wrap reveal"><div class="section-head"><h2 class="section-title">Отзывы</h2><a class="text-link" href="#product-specifications">Написать отзыв ${icons.arrow}</a></div><div class="reviews-grid"><article class="quote-card"><span class="quote-stars">★★★★★</span><blockquote>«Сумка выглядит ещё лучше, чем на фото. Кожа мягкая, фурнитура аккуратная»</blockquote><cite>Ольга · покупательница PalBag</cite></article><article class="quote-card"><span class="quote-stars">★★★★★</span><blockquote>«Очень удобный размер и продуманная организация внутри»</blockquote><cite>Мария · покупательница PalBag</cite></article></div></section>`}
    <section class="section wrap reveal"><div class="section-head"><div class="section-head__copy"><span class="eyebrow">В том же настроении</span><h2 class="section-title">Похожие модели</h2></div></div><div class="product-grid">${relatedProducts.map(productCard).join("")}</div></section>
    <div class="mobile-buybar"><span class="mobile-buybar__price"><strong>${formatPrice(price)}</strong><span class="muted">${escapeHTML(product.name)}${product.variantLabel ? ` · ${escapeHTML(product.variantLabel)}` : ""}</span></span><button class="button" type="button" ${product.price != null ? `data-buy-now="${product.id}" data-add-color="${color}" data-add-size="${escapeHTML(size)}"` : `data-price-inquiry="${product.id}"`}>Купить сейчас</button></div>`;
  }

  function productNotFoundMarkup() {
    return `<div class="wrap">
      <nav class="breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Товар не найден</span></nav>
      <section class="empty-page"><div class="empty-page__inner"><h1 class="page-title">Товар не найден</h1><p>Проверьте ссылку или вернитесь в каталог, чтобы выбрать другую модель.</p><a class="button" href="catalog.html">Перейти в каталог ${icons.arrow}</a></div></section>
    </div>`;
  }

  function brandCategoryMarkup(brand) {
    const brandProducts = products.filter((product) => product.brand === brand);
    const featuredProduct = brandProducts[0];
    const description = brand === "CHANEL"
      ? "Модель Chanel Maxi Flap Bag представлена в каталоге PalBag вместе с фотографиями и видео товара."
      : brand === "MOSCHINO"
        ? "Модель Moschino Tie Me Bag представлена в каталоге PalBag с фотографиями и указанными характеристиками."
        : "Выбранные модели BALENCIAGA в PalBag. Изучите фотографии, характеристики и доступные размеры в карточке товара.";
    return `<div class="wrap">
      <nav class="breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><a href="catalog.html">Каталог</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHTML(brand)}</span></nav>
      <section class="brand-editorial brand-category-hero reveal">
        <div class="brand-editorial__media">${featuredProduct?.campaignImage ? `<img src="${escapeHTML(featuredProduct.campaignImage)}" alt="${escapeHTML(featuredProduct.name)}">` : ""}</div>
        <div class="brand-editorial__copy">
          <span class="eyebrow">Дизайнерская коллекция</span>
          <h1 class="page-title">${escapeHTML(brand)}</h1>
          <p>${escapeHTML(description)}</p>
          ${featuredProduct ? `<a class="text-link" href="product.html?id=${encodeURIComponent(featuredProduct.id)}">Познакомиться с моделью ${icons.arrow}</a>` : ""}
        </div>
      </section>
      <section class="brand-products">
        <div class="section-head">
          <div class="section-head__copy"><span class="eyebrow">${escapeHTML(brand)} · Коллекция</span><h2 class="section-title">Модели бренда</h2></div>
          <span class="eyebrow">${brandProducts.length} ${pluralRu(brandProducts.length, ["модель", "модели", "моделей"])}</span>
        </div>
        <div class="product-grid">${brandProducts.length ? brandProducts.map(productCard).join("") : `<div class="empty-state"><h2>Коллекция скоро обновится</h2><p>Новые модели ${escapeHTML(brand)} появятся в этом разделе.</p><a class="button button--outline" href="catalog.html">Вернуться в каталог ${icons.arrow}</a></div>`}</div>
      </section>
    </div>`;
  }

  function emptyStateMarkup(kind) {
    const isCart = kind === "cart";
    return `<div class="empty-page"><div class="empty-page__inner"><div class="empty-page__symbol">${isCart ? icons.bag : icons.heart}</div>
      <h2>${isCart ? "Корзина пока пуста" : "Пока ничего нет"}</h2>
      <p>${isCart ? "Выберите сумку, которая станет частью ваших планов." : "Сохраняйте понравившиеся модели, чтобы вернуться к ним позже."}</p>
      <a class="button" href="catalog.html">Перейти в каталог ${icons.arrow}</a>
    </div></div>`;
  }

  function cartMarkup() {
    const cart = getCart();
    const items = cart.map((entry) => ({ ...entry, product: productMap.get(entry.id) }));
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + getProductPrice(item.product, item.size) * item.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= 20000 ? 0 : 500;
    return `<div class="wrap">
      <nav class="breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Корзина</span></nav>
      <header class="page-heading"><div class="page-heading__copy"><span class="eyebrow">Ваш выбор</span><h1 class="page-title">Корзина</h1><p>${itemCount} ${pluralRu(itemCount, ["товар", "товара", "товаров"])}</p></div><a class="text-link" href="catalog.html">Продолжить покупки ${icons.arrow}</a></header>
      ${items.length ? `<div class="cart-layout">
        <div class="cart-list">${items.map(({ product, quantity, color, size }) => {
          const itemDetails = [
            color && product.colorName ? `Цвет: ${colorNames[color] || product.colorName}` : "",
            size !== "One size" ? `Размер: ${size}` : "",
            product.packageContents ? `Комплектация: ${product.packageContents}` : ""
          ].filter(Boolean);
          return `<article class="cart-row">
          <a class="cart-row__image" href="product.html?id=${encodeURIComponent(product.id)}">${productVisual(product, 0, product.name)}</a>
          <div class="cart-row__info">
            <a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHTML(product.name)}</a>
            ${itemDetails.length ? `<span>${itemDetails.map(escapeHTML).join(" · ")}</span>` : ""}
            <button class="cart-row__remove" type="button" data-remove-cart="${product.id}" data-remove-color="${color}" data-remove-size="${size}">Удалить</button>
          </div>
          <div class="cart-row__amount">
            <span>${formatPrice(getProductPrice(product, size) * quantity)}</span>
            <div class="quantity" aria-label="Количество">
              <button type="button" data-quantity="${product.id}" data-quantity-color="${color}" data-quantity-size="${size}" data-delta="-1" aria-label="Уменьшить количество">−</button>
              <span>${quantity}</span>
              <button type="button" data-quantity="${product.id}" data-quantity-color="${color}" data-quantity-size="${size}" data-delta="1" aria-label="Увеличить количество">+</button>
            </div>
          </div>
        </article>`;
        }).join("")}</div>
        <aside class="order-summary">
          <h2>Ваш заказ</h2>
          <div class="summary-line"><span>Товары</span><span>${formatPrice(subtotal)}</span></div>
          <div class="summary-line"><span>Доставка</span><span>${shipping === 0 ? "Бесплатно" : formatPrice(shipping)}</span></div>
          ${subtotal > 0 && subtotal < 20000 ? `<div class="summary-line"><span>До бесплатной доставки</span><span>${formatPrice(20000 - subtotal)}</span></div>` : ""}
          <div class="summary-line summary-line--total"><strong>Итого</strong><strong>${formatPrice(subtotal + shipping)}</strong></div>
          <button class="button" type="button" data-checkout>Перейти к оформлению ${icons.arrow}</button>
          <p class="summary-note">Нажимая «Перейти к оформлению», вы подтверждаете согласие с условиями покупки. Это демонстрационный прототип — оплата не производится.</p>
        </aside>
      </div>` : emptyStateMarkup("cart")}
    </div>`;
  }

  function favoritesMarkup() {
    const saved = getFavorites().map((id) => productMap.get(id));
    return `<div class="wrap">
      <nav class="breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Избранное</span></nav>
      <header class="page-heading"><div class="page-heading__copy"><span class="eyebrow">Сохранённые модели</span><h1 class="page-title">Избранное</h1><p>${saved.length} ${pluralRu(saved.length, ["модель", "модели", "моделей"])}</p></div><a class="text-link" href="catalog.html">К коллекции ${icons.arrow}</a></header>
      ${saved.length ? `<section class="favorites-grid"><div class="product-grid">${saved.map(productCard).join("")}</div></section>` : emptyStateMarkup("favorites")}
    </div>`;
  }

  function aboutMarkup() {
    return `<div class="wrap"><nav class="breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">О бренде</span></nav>
      <section class="editorial-hero reveal">
        <div class="editorial-hero__copy"><span class="eyebrow">История PalBag</span><h1>Сумки без лишнего</h1><p>Мы создаём вещи, которым не нужно громко заявлять о себе. Достаточно хорошей формы, честного материала и внимания к деталям.</p></div>
        <div class="editorial-hero__art">${bagArt("tote", "#1c1b1a", "#e9e3da")}</div>
      </section>
      <section class="section reveal"><div class="wrap editorial-statement"><span class="eyebrow">Наша идея</span><p>Мы делаем вещи, которые остаются. В гардеробе, в памяти, в повседневной жизни.</p></div></section>
      <section class="section--compact wrap reveal"><span class="eyebrow">Во всём есть смысл</span><h2 class="section-title" style="margin-top:12px">Наши принципы</h2>
        <div class="principles-grid">
          <article class="principle"><h3>Материалы</h3><p>Натуральная кожа с выразительной фактурой. Она живёт вместе с вами и со временем становится только интереснее.</p></article>
          <article class="principle"><h3>Форма</h3><p>Чистая геометрия без декоративного шума. Силуэты, которые легко вписываются в привычный ритм.</p></article>
          <article class="principle"><h3>Забота</h3><p>Продумываем посадку, вес и каждую мелочь внутри. Чтобы красивой сумкой было удобно пользоваться.</p></article>
        </div>
      </section>
      <section class="section wrap reveal"><div class="story-band"><div class="story-band__art">${bagArt("shoulder", "#6d6a58", "#e4e3dc")}</div><div class="story-band__copy"><span class="eyebrow">Создано на каждый день</span><h2 class="section-title">Познакомьтесь с коллекцией</h2><p class="lead">Найдите форму, которая подходит именно вам.</p><a class="button" href="catalog.html">Открыть каталог ${icons.arrow}</a></div></div></section>
    </div>`;
  }

  function deliveryMarkup() {
    return `<div class="wrap">
      <nav class="breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Доставка и оплата</span></nav>
      <header class="page-heading"><div class="page-heading__copy"><span class="eyebrow">Всё просто и прозрачно</span><h1 class="page-title">Доставка<br>и оплата</h1></div></header>
      <div class="info-layout">
        <aside class="info-aside"><h2 class="section-title">Спокойно выбирайте</h2><p>Мы бережно упакуем заказ и поможем на каждом этапе.</p></aside>
        <div class="info-content">
          <div class="delivery-cards">
            <article class="delivery-card">${icons.truck}<h3>Курьерская доставка</h3><p>По России от 2 до 7 рабочих дней. Стоимость рассчитывается при оформлении заказа.</p></article>
            <article class="delivery-card">${icons.pin}<h3>Пункты выдачи</h3><p>Выберите удобный пункт выдачи при оформлении. Срок хранения уточняется в сообщении о доставке.</p></article>
            <article class="delivery-card">${icons.gift}<h3>Бесплатная доставка</h3><p>При заказе от 20 000 ₽ доставим бесплатно. Каждый заказ — в фирменной упаковке.</p></article>
          </div>
          <h2>Способы оплаты</h2>
          <p>В демонстрационной версии оплата не производится. В готовом интернет-магазине на этом этапе подключаются доступные способы оплаты: банковская карта и другие методы, выбранные владельцем магазина.</p>
          <ul><li>Безопасная онлайн-оплата после подтверждения заказа.</li><li>Итоговая стоимость доставки отображается до оформления.</li><li>Подтверждение заказа приходит на указанную электронную почту.</li></ul>
          <h2 id="returns">Возврат и обмен</h2>
          <p>Если сумка не подошла, вы можете оформить возврат в течение 14 календарных дней после получения. Товар должен сохранить первоначальный вид, ярлыки и комплектность.</p>
          <p>Чтобы уточнить детали, напишите нам на <a class="text-link" href="mailto:hello@palbag.ru">hello@palbag.ru</a> или позвоните по номеру <a href="tel:+78005553535">8 800 555-35-35</a>.</p>
        </div>
      </div>
    </div>`;
  }

  function contactsMarkup() {
    return `<div class="wrap">
      <nav class="breadcrumb" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Контакты</span></nav>
      <header class="page-heading"><div class="page-heading__copy"><span class="eyebrow">Мы на связи</span><h1 class="page-title">Контакты</h1><p>Поможем с выбором и ответим на вопросы о заказе.</p></div></header>
      <div class="contact-layout">
        <div class="contact-list">
          <div class="contact-item"><span>Телефон</span><a href="tel:+78005553535">8 800 555-35-35</a></div>
          <div class="contact-item"><span>Электронная почта</span><a href="mailto:hello@palbag.ru">hello@palbag.ru</a></div>
          <div class="contact-item"><span>Время работы</span><strong>Ежедневно, 10:00–20:00 МСК</strong></div>
          <div class="contact-item"><span>Социальные сети</span><strong>Telegram · VK</strong></div>
        </div>
        <form class="contact-form" data-contact-form>
          <span class="eyebrow">Напишите нам</span><h2>Чем помочь?</h2>
          <div class="field"><label for="contact-name">Ваше имя</label><input id="contact-name" name="name" autocomplete="name" required></div>
          <div class="field"><label for="contact-email">E-mail</label><input id="contact-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="contact-message">Сообщение</label><textarea id="contact-message" name="message" required></textarea></div>
          <button class="button" type="submit">Отправить сообщение ${icons.arrow}</button>
          <p class="form-note" data-contact-note aria-live="polite"></p>
          <span class="muted" style="font-size:10px;line-height:1.6">Демо-форма показывает подтверждение в браузере и не отправляет данные на сервер.</span>
        </form>
      </div>
    </div>`;
  }

  function checkoutModalMarkup() {
    return `<div class="modal-backdrop" data-modal-backdrop>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button class="icon-button modal__close" type="button" data-modal-close aria-label="Закрыть">${icons.close}</button>
        <span class="eyebrow">Последний шаг</span><h2 id="checkout-title">Оформление заказа</h2>
        <p>Заполните данные для демонстрации оформления. Оплата не производится.</p>
        <form class="checkout-form" data-checkout-form>
          <div class="checkout-form__row">
            <div class="field"><label for="checkout-name">Имя</label><input id="checkout-name" name="name" autocomplete="name" required></div>
            <div class="field"><label for="checkout-phone">Телефон</label><input id="checkout-phone" name="phone" type="tel" autocomplete="tel" placeholder="+7 ___ ___-__-__" required></div>
          </div>
          <div class="field"><label for="checkout-email">E-mail</label><input id="checkout-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="checkout-address">Адрес доставки</label><input id="checkout-address" name="address" autocomplete="street-address" required></div>
          <button class="button" type="submit">Подтвердить заказ ${icons.arrow}</button>
        </form>
      </section>
    </div>`;
  }

  function render() {
    document.getElementById("site-header").innerHTML = headerMarkup();
    document.getElementById("site-footer").innerHTML = footerMarkup();
    const main = document.getElementById("main-content");
    if (page === "home") {
      main.innerHTML = homeMarkup();
      initHero();
    } else if (page === "catalog") {
      main.innerHTML = catalogMarkup();
      renderFilterDrawer();
    } else if (page === "brand") {
      document.title = `${pageBrand} — PalBag`;
      main.innerHTML = brandCategoryMarkup(pageBrand);
      document.getElementById("overlay-root").innerHTML = "";
    } else if (page === "product") {
      const id = new URLSearchParams(location.search).get("id");
      const product = productMap.get(id);
      if (product) {
        document.title = `${product.name} — PalBag`;
        main.innerHTML = productMarkup(product);
      } else {
        document.title = "Товар не найден — PalBag";
        main.innerHTML = productNotFoundMarkup();
      }
      document.getElementById("overlay-root").innerHTML = "";
    } else if (page === "cart") {
      main.innerHTML = cartMarkup();
      document.getElementById("overlay-root").innerHTML = checkoutModalMarkup();
    } else if (page === "favorites") {
      main.innerHTML = favoritesMarkup();
      document.getElementById("overlay-root").innerHTML = "";
    } else if (page === "about") {
      main.innerHTML = aboutMarkup();
      document.getElementById("overlay-root").innerHTML = "";
    } else if (page === "delivery") {
      main.innerHTML = deliveryMarkup();
      document.getElementById("overlay-root").innerHTML = "";
    } else if (page === "contacts") {
      main.innerHTML = contactsMarkup();
      document.getElementById("overlay-root").innerHTML = "";
    }
    if (page === "product") observeProductVideos();
    updateHeaderCounts();
    observeReveals();
    initHeader();
  }

  function initHeader() {
    const menu = document.getElementById("site-menu");
    const sticky = document.getElementById("sticky-header");
    if (!menu || !sticky) return;
    if (headerScrollHandler) window.removeEventListener("scroll", headerScrollHandler);
    headerScrollHandler = () => {
      const currentHeader = document.getElementById("sticky-header");
      currentHeader?.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", headerScrollHandler, { passive: true });
    headerScrollHandler();
  }

  function toggleMenu(open) {
    const menu = document.getElementById("site-menu");
    const trigger = document.querySelector("[data-menu-toggle]");
    if (!menu || !trigger) return;
    const isOpen = typeof open === "boolean" ? open : !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", isOpen);
    menu.setAttribute("aria-hidden", String(!isOpen));
    trigger.setAttribute("aria-expanded", String(isOpen));
    trigger.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    document.body.classList.toggle("is-locked", isOpen);
    if (isOpen) menu.querySelector(".menu-close").focus();
    else trigger.focus();
  }

  function setHeroSlide(index) {
    const slides = [...document.querySelectorAll("[data-hero-slide]")];
    if (!slides.length) return;
    const next = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === next;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    document.querySelectorAll("[data-hero-go]").forEach((button, buttonIndex) => {
      button.setAttribute("aria-current", String(buttonIndex === next));
    });
    const counter = document.getElementById("hero-counter");
    if (counter) counter.textContent = `0${next + 1} / 03`;
    document.querySelectorAll("[data-hero-slide] a").forEach((link) => {
      link.tabIndex = link.closest(".hero-slide").classList.contains("is-active") ? 0 : -1;
    });
    document.querySelectorAll("[data-hero-slide]").forEach((slide) => {
      slide.inert = !slide.classList.contains("is-active");
    });
    document.querySelector("[data-hero-slide].is-active")?.classList.add("is-active");
    document.body.dataset.heroIndex = String(next);
  }

  function initHero() {
    const track = document.getElementById("hero-track");
    if (!track) return;
    setHeroSlide(0);
    const startTimer = () => {
      window.clearInterval(state.heroTimer);
      if (!reduceMotion) state.heroTimer = window.setInterval(() => {
        if (!track.matches(":hover") && !track.contains(document.activeElement)) {
          setHeroSlide(Number(document.body.dataset.heroIndex || "0") + 1);
        }
      }, 4500);
    };
    startTimer();
    track.addEventListener("mouseenter", () => window.clearInterval(state.heroTimer));
    track.addEventListener("mouseleave", startTimer);
    track.addEventListener("focusin", () => window.clearInterval(state.heroTimer));
    track.addEventListener("focusout", startTimer);
    let touchStart = 0;
    track.addEventListener("touchstart", (event) => {
      touchStart = event.changedTouches[0].clientX;
      window.clearInterval(state.heroTimer);
    }, { passive: true });
    track.addEventListener("touchend", (event) => {
      const delta = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(delta) > 45) setHeroSlide(Number(document.body.dataset.heroIndex || "0") + (delta < 0 ? 1 : -1));
      startTimer();
    }, { passive: true });
  }

  function addToCart(id, color, size) {
    const product = productMap.get(id);
    if (!product) return;
    if (product.price == null) {
      showToast("Цена товара уточняется");
      return;
    }
    const cart = getCart();
    const selected = color || product.color || "";
    const selectedSize = getSizeOptions(product).some((option) => option.name === size)
      ? size
      : getDefaultSize(product);
    const existing = cart.find((entry) => entry.id === id && entry.color === selected && entry.size === selectedSize);
    if (existing) existing.quantity += 1;
    else cart.push({ id, quantity: 1, color: selected, size: selectedSize });
    setCart(cart);
    showToast(`${product.name} добавлена в корзину`);
  }

  function toggleFavorite(id) {
    const product = productMap.get(id);
    if (!product) return;
    const favorites = getFavorites();
    const exists = favorites.includes(id);
    setFavorites(exists ? favorites.filter((favorite) => favorite !== id) : [...favorites, id]);
    showToast(exists ? `${product.name} удалена из избранного` : `${product.name} добавлена в избранное`);
    if (page === "favorites") render();
    else document.querySelectorAll(`[data-favorite-toggle="${id}"]`).forEach((button) => {
      const active = !exists;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `${active ? "Убрать из" : "Добавить в"} избранное`);
    });
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerHTML = `<span class="toast__icon">${icons.check}</span><span>${escapeHTML(message)}</span>`;
    toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function updateCatalogFilters() {
    const activeFilters = document.querySelector(".filter-drawer.is-open") || document.querySelector(".filters");
    if (!activeFilters) return;
    const categories = [...activeFilters.querySelectorAll("[data-filter-category]:checked")].map((input) => input.dataset.filterCategory);
    const selectedBrands = [...activeFilters.querySelectorAll("[data-filter-brand]:checked")].map((input) => input.dataset.filterBrand);
    const minInput = activeFilters.querySelector("[data-filter-min]");
    const maxInput = activeFilters.querySelector("[data-filter-max]");
    state.catalog.categories = new Set(categories);
    state.catalog.brands = new Set(selectedBrands);
    state.catalog.min = minInput ? minInput.value.trim() : "";
    state.catalog.max = maxInput ? maxInput.value.trim() : "";
  }

  function closeFilterDrawer() {
    state.drawerOpen = false;
    renderFilterDrawer();
    document.body.classList.remove("is-locked");
  }

  function resetFilters() {
    state.catalog.categories.clear();
    state.catalog.brands.clear();
    state.catalog.colors.clear();
    state.catalog.min = "";
    state.catalog.max = "";
    state.catalog.search = "";
    state.drawerOpen = false;
    history.replaceState(null, "", "catalog.html");
    render();
  }

  function changeQuantity(id, color, size, delta) {
    const cart = getCart();
    const entry = cart.find((item) => item.id === id && item.color === color && item.size === size);
    if (!entry) return;
    entry.quantity += delta;
    setCart(cart.filter((item) => item.quantity > 0));
    render();
  }

  function removeCartItem(id, color, size) {
    setCart(getCart().filter((item) => !(item.id === id && item.color === color && item.size === size)));
    render();
    showToast("Товар удалён из корзины");
  }

  function showCheckout() {
    if (!getCart().length) return;
    const backdrop = document.querySelector("[data-modal-backdrop]");
    backdrop?.classList.add("is-open");
    document.body.classList.add("is-locked");
    window.setTimeout(() => document.getElementById("checkout-name")?.focus(), 150);
  }

  function closeCheckout() {
    document.querySelector("[data-modal-backdrop]")?.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }

  function openMobileSearch() {
    const panel = document.getElementById("mobile-search-panel");
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) panel.querySelector("input").focus();
  }

  function observeReveals() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .15 });
    items.forEach((item) => observer.observe(item));
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const menuToggle = target.closest("[data-menu-toggle]");
    if (menuToggle) return toggleMenu();
    if (target.closest("[data-menu-close]")) return toggleMenu(false);
    if (target.closest("[data-mobile-search]")) return openMobileSearch();

    const favorite = target.closest("[data-favorite-toggle]");
    if (favorite) return toggleFavorite(favorite.dataset.favoriteToggle);
    const quickView = target.closest("[data-quick-view]");
    if (quickView) return openQuickView(quickView.dataset.quickView);
    if (target.closest("[data-quick-view-close]") || target.matches("[data-quick-view-backdrop]")) return closeQuickView();
    const quickViewAdd = target.closest("[data-quick-view-add]");
    if (quickViewAdd) {
      addToCart(quickViewAdd.dataset.quickViewAdd, quickViewAdd.dataset.addColor, quickViewAdd.dataset.addSize);
      closeQuickView();
      return;
    }
    const priceInquiry = target.closest("[data-price-inquiry]");
    if (priceInquiry) {
      showToast("Цена товара уточняется");
      return;
    }
    const addButton = target.closest("[data-add-cart]");
    if (addButton) return addToCart(addButton.dataset.addCart, addButton.dataset.addColor, addButton.dataset.addSize);
    const buyButton = target.closest("[data-buy-now]");
    if (buyButton) {
      const product = productMap.get(buyButton.dataset.buyNow);
      if (product?.price != null) {
        addToCart(buyButton.dataset.buyNow, buyButton.dataset.addColor, buyButton.dataset.addSize);
        location.href = "cart.html";
      } else {
        showToast("Цена товара уточняется");
      }
      return;
    }
    const heroGo = target.closest("[data-hero-go]");
    if (heroGo) return setHeroSlide(Number(heroGo.dataset.heroGo));
    if (target.closest("[data-hero-next]")) return setHeroSlide(Number(document.body.dataset.heroIndex || "0") + 1);
    if (target.closest("[data-hero-prev]")) return setHeroSlide(Number(document.body.dataset.heroIndex || "0") - 1);
    const zoom = target.closest("[data-gallery-zoom]");
    if (zoom) {
      const enlarged = zoom.closest(".product-gallery__main").classList.toggle("is-zoomed");
      zoom.setAttribute("aria-pressed", String(enlarged));
      return;
    }
    if (target.closest("[data-product-video]")) {
      showToast("Видеообзор появится в полной версии магазина.");
      return;
    }

    const size = target.closest("[data-select-size]");
    if (size && page === "product") {
      state.selectedSize = size.dataset.selectSize;
      const product = productMap.get(new URLSearchParams(location.search).get("id"));
      if (product) {
        const price = formatPrice(getProductPrice(product, state.selectedSize));
        const desktopPrice = document.querySelector(".product-detail__price strong");
        const mobilePrice = document.querySelector(".mobile-buybar__price strong");
        if (desktopPrice) desktopPrice.textContent = price;
        if (mobilePrice) mobilePrice.textContent = price;
      }
      document.querySelectorAll("[data-select-size]").forEach((button) => {
        const selected = button === size;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      document.querySelectorAll(".product-info [data-add-cart], .product-info [data-buy-now], .mobile-buybar [data-buy-now]").forEach((button) => {
        button.dataset.addSize = state.selectedSize;
      });
      return;
    }

    const color = target.closest("[data-select-color]");
    if (color && page === "product") {
      state.selectedColor = color.dataset.selectColor;
      const id = new URLSearchParams(location.search).get("id");
      const product = productMap.get(id) || products[0];
      document.querySelectorAll(".product-gallery .bag-scene").forEach((scene) => {
        scene.style.setProperty("--bag-color", state.selectedColor);
      });
      document.querySelectorAll("[data-select-color]").forEach((button) => {
        const selected = button === color;
        button.classList.toggle("swatch--selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      document.querySelector("[data-color-name]").textContent = colorNames[state.selectedColor] || product.colorName;
      document.querySelectorAll(".product-info [data-add-color], .mobile-buybar [data-add-color]").forEach((button) => button.dataset.addColor = state.selectedColor);
      document.querySelector(".mobile-buybar__price .muted").textContent = product.variantLabel ? `${product.name} · ${product.variantLabel}` : product.name;
      return;
    }

    const filterColor = target.closest("[data-filter-color]");
    if (filterColor) {
      const value = filterColor.dataset.filterColor;
      if (state.catalog.colors.has(value)) state.catalog.colors.delete(value);
      else state.catalog.colors.add(value);
      render();
      state.drawerOpen = document.querySelector(".filter-drawer")?.classList.contains("is-open") || false;
      renderFilterDrawer();
      if (state.drawerOpen) {
        document.querySelector(".drawer-backdrop")?.classList.add("is-open");
        document.querySelector(".filter-drawer")?.classList.add("is-open");
      }
      return;
    }
    if (target.closest("[data-filter-open]")) {
      state.drawerOpen = true;
      renderFilterDrawer();
      document.body.classList.add("is-locked");
      return;
    }
    if (target.closest("[data-filter-close]")) return closeFilterDrawer();
    if (target.closest("[data-filter-reset]")) return resetFilters();
    const gridColumns = target.closest("[data-grid-columns]");
    if (gridColumns) {
      state.catalog.columns = Number(gridColumns.dataset.gridColumns) === 4 ? 4 : 3;
      render();
      return;
    }
    if (target.closest("[data-filter-apply]")) {
      updateCatalogFilters();
      state.drawerOpen = false;
      render();
      return;
    }

    const quantity = target.closest("[data-quantity]");
    if (quantity) return changeQuantity(quantity.dataset.quantity, quantity.dataset.quantityColor, quantity.dataset.quantitySize, Number(quantity.dataset.delta));
    const remove = target.closest("[data-remove-cart]");
    if (remove) return removeCartItem(remove.dataset.removeCart, remove.dataset.removeColor, remove.dataset.removeSize);
    if (target.closest("[data-checkout]")) return showCheckout();
    if (target.closest("[data-modal-close]")) return closeCheckout();
    if (target.matches("[data-modal-backdrop]")) return closeCheckout();
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-filter-category], [data-filter-brand], [data-filter-min], [data-filter-max]")) {
      updateCatalogFilters();
      render();
    } else if (target.matches("[data-sort]")) {
      state.catalog.sort = target.value;
      render();
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.matches("[data-newsletter]")) {
      event.preventDefault();
      showToast("Спасибо за подписку на PalBag");
      form.reset();
    } else if (form.matches("[data-contact-form]")) {
      event.preventDefault();
      form.querySelector("[data-contact-note]").textContent = "Спасибо! Сообщение подготовлено. В демо-версии отправка отключена.";
      form.reset();
    } else if (form.matches("[data-checkout-form]")) {
      event.preventDefault();
      setCart([]);
      closeCheckout();
      render();
      showToast("Заказ оформлен. Спасибо, что выбрали PalBag!");
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (document.getElementById("site-menu")?.classList.contains("is-open")) toggleMenu(false);
      if (state.drawerOpen) closeFilterDrawer();
      if (document.querySelector("[data-modal-backdrop].is-open")) closeCheckout();
      if (document.querySelector("[data-quick-view-backdrop].is-open")) closeQuickView();
    }
  });

  render();
})();
