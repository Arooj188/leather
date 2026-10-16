const productsList = Array.isArray(window.products) ? window.products : [];
const config = window.businessConfig || {};

function getSavedCatalogueView() {
  try {
    return window.localStorage.getItem("atifLeatherCatalogueView") === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

const state = {
  search: "",
  colour: "all",
  family: "all",
  sort: "name-asc",
  view: getSavedCatalogueView()
};

let lastFocusedElement = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getUniqueColours() {
  return [...new Set(productsList.map((product) => product.colour))].sort((a, b) => a.localeCompare(b));
}

function getUniqueFamilies() {
  return [...new Set(productsList.map((product) => product.name))].sort((a, b) => a.localeCompare(b));
}

function populateColourFilter() {
  const colourFilter = document.getElementById("colourFilter");
  const options = getUniqueColours()
    .map((colour) => `<option value="${escapeHtml(colour)}">${escapeHtml(colour)}</option>`)
    .join("");

  colourFilter.innerHTML = `<option value="all">All colours</option>${options}`;
}

function populateFamilyFilter() {
  const familyFilter = document.getElementById("familyFilter");
  const options = getUniqueFamilies()
    .map((family) => `<option value="${escapeHtml(family)}">${escapeHtml(family)}</option>`)
    .join("");

  familyFilter.innerHTML = `<option value="all">All products</option>${options}`;
}

function getVisibleProducts() {
  const term = state.search.trim().toLowerCase();

  const filtered = productsList.filter((product) => {
    const searchSource = [product.code, product.name, product.colour, product.associatedText]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !term || searchSource.includes(term);
    const matchesColour = state.colour === "all" || product.colour === state.colour;
    const matchesFamily = state.family === "all" || product.name === state.family;

    return matchesSearch && matchesColour && matchesFamily;
  });

  const sorted = [...filtered];

  sorted.sort((a, b) => {
    switch (state.sort) {
      case "code-asc":
        return String(a.code).localeCompare(String(b.code), undefined, { numeric: true });
      case "colour-asc":
        return a.colour.localeCompare(b.colour) || String(a.name).localeCompare(String(b.name));
      case "name-asc":
      default:
        return String(a.name).localeCompare(String(b.name)) || String(a.code).localeCompare(String(b.code), undefined, { numeric: true });
    }
  });

  return sorted;
}

function renderCatalogue() {
  const productGrid = document.getElementById("productGrid");
  const emptyState = document.getElementById("emptyState");
  const countElement = document.getElementById("resultsCount");
  const visibleProducts = getVisibleProducts();
  productGrid.dataset.view = state.view;

  countElement.textContent =
    visibleProducts.length === productsList.length
      ? `${productsList.length} products available`
      : `Showing ${visibleProducts.length} of ${productsList.length} products`;

  if (!visibleProducts.length) {
    productGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  productGrid.innerHTML = visibleProducts.map((product) => createProductCardMarkup(product)).join("");

  productGrid.querySelectorAll(".product-card__cta").forEach((button) => {
    button.addEventListener("click", () => {
      openProductModal(button.dataset.productCode);
    });
  });
}

function createProductCardMarkup(product) {
  const imageMarkup = getProductImageMarkup(product);
  const unitMarkup = product.unit ? `<span>${escapeHtml(product.unit)}</span>` : "";
  const noteText = product.publicSpecifications && product.publicSpecifications.length
    ? `<li>${escapeHtml(product.publicSpecifications[0])}</li>`
    : "<li>Product details available on request.</li>";

  return `
    <article class="product-card" aria-label="${escapeHtml(product.name)} product card">
      <div class="product-card__media">${imageMarkup}</div>
      <div class="product-card__content">
        <h3 class="product-card__name">${escapeHtml(product.name)}</h3>
        <p class="product-card__code">Code ${escapeHtml(product.code)}</p>
        <div class="product-card__meta">
          <span>${escapeHtml(product.colour)}</span>
          ${unitMarkup}
        </div>
        <ul class="product-card__specs">${noteText}</ul>
        <button type="button" class="product-card__cta" data-product-code="${escapeHtml(product.code)}">View Details</button>
      </div>
    </article>
  `;
}

function getProductImageMarkup(product) {
  if (product.image && product.imageStatus === "verified") {
    return `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)} in ${escapeHtml(product.colour)}" />`;
  }

  return `
    <div class="product-placeholder" role="img" aria-label="Neutral placeholder only; not a photograph of ${escapeHtml(product.name)}">
      <span class="product-placeholder__label">Product photo not supplied</span>
      <small>Neutral placeholder, not an item photo</small>
    </div>
  `;
}

function bindEvents() {
  const searchInput = document.getElementById("searchInput");
  const colourFilter = document.getElementById("colourFilter");
  const familyFilter = document.getElementById("familyFilter");
  const sortSelect = document.getElementById("sortSelect");
  const resetButton = document.getElementById("resetFilters");
  const gridViewButton = document.getElementById("gridViewButton");
  const listViewButton = document.getElementById("listViewButton");

  gridViewButton.addEventListener("click", () => setCatalogueView("grid"));
  listViewButton.addEventListener("click", () => setCatalogueView("list"));

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderCatalogue();
  });

  colourFilter.addEventListener("change", (event) => {
    state.colour = event.target.value;
    renderCatalogue();
  });

  familyFilter.addEventListener("change", (event) => {
    state.family = event.target.value;
    renderCatalogue();
  });

  sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderCatalogue();
  });

  resetButton.addEventListener("click", () => {
    state.search = "";
    state.colour = "all";
    state.family = "all";
    state.sort = "name-asc";

    searchInput.value = "";
    colourFilter.value = "all";
    familyFilter.value = "all";
    sortSelect.value = "name-asc";

    renderCatalogue();
  });
}

function setCatalogueView(view) {
  state.view = view === "list" ? "list" : "grid";
  const productGrid = document.getElementById("productGrid");
  const gridViewButton = document.getElementById("gridViewButton");
  const listViewButton = document.getElementById("listViewButton");

  productGrid.dataset.view = state.view;
  gridViewButton.setAttribute("aria-pressed", String(state.view === "grid"));
  listViewButton.setAttribute("aria-pressed", String(state.view === "list"));
  gridViewButton.classList.toggle("is-selected", state.view === "grid");
  listViewButton.classList.toggle("is-selected", state.view === "list");

  try {
    window.localStorage.setItem("atifLeatherCatalogueView", state.view);
  } catch {
    return;
  }
}

function renderContactDetails() {
  const whatsappLink = document.getElementById("whatsappLink");
  const phoneLink = document.getElementById("phoneLink");
  const footerContact = document.getElementById("footerContact");

  const entries = [];

  if (config.email) {
    entries.push({ label: "Email", value: config.email, href: `mailto:${config.email}` });
  }

  if (config.city || config.address) {
    const locationParts = [config.city, config.address].filter(Boolean);
    entries.push({ label: "Location", value: locationParts.join(" — ") || "", href: "" });
  }

  if (config.socialLinks) {
    Object.entries(config.socialLinks).forEach(([network, value]) => {
      if (value) {
        entries.push({ label: network.charAt(0).toUpperCase() + network.slice(1), value: value, href: value });
      }
    });
  }

  if (footerContact) {
    footerContact.innerHTML = entries
    .slice(0, 3)
    .map((entry) => {
      if (!entry.value) return "";
      if (entry.href) {
        return `<a href="${escapeHtml(entry.href)}">${escapeHtml(entry.label)}</a>`;
      }
      return `<span>${escapeHtml(entry.label)}</span>`;
    })
    .join("");
  }

  if (phoneLink) {
    const telephoneNumber = String(config.phone || "").replace(/[^\d+]/g, "");
    if (telephoneNumber) {
      phoneLink.href = `tel:${telephoneNumber}`;
      phoneLink.textContent = "Call Atif Leather Store";
      phoneLink.setAttribute("aria-disabled", "false");
      phoneLink.hidden = false;
    } else {
      phoneLink.removeAttribute("href");
      phoneLink.setAttribute("aria-disabled", "true");
      phoneLink.hidden = true;
    }
  }

  if (config.whatsappNumber) {
    whatsappLink.href = getDirectWhatsAppLink("Hello, I would like to enquire about a product from Atif Leather Store. Please share the available details and pricing information.");
    whatsappLink.setAttribute("aria-disabled", "false");
    whatsappLink.classList.remove("is-disabled");
    whatsappLink.textContent = "Send enquiry on WhatsApp";
    whatsappLink.removeAttribute("tabindex");
    whatsappLink.setAttribute("target", "_blank");
    whatsappLink.setAttribute("rel", "noopener noreferrer");
  } else {
    whatsappLink.href = "#";
    whatsappLink.setAttribute("aria-disabled", "true");
    whatsappLink.classList.add("is-disabled");
    whatsappLink.textContent = "WhatsApp enquiry unavailable";
    whatsappLink.setAttribute("tabindex", "-1");
    whatsappLink.removeAttribute("target");
    whatsappLink.removeAttribute("rel");
  }
}

function cleanWhatsAppNumber(rawValue) {
  return String(rawValue || "").replace(/[^\d]/g, "");
}

function getDirectWhatsAppLink(message) {
  const whatsappNumber = config.whatsappNumber ? cleanWhatsAppNumber(config.whatsappNumber) : "";
  if (!whatsappNumber) {
    return "#";
  }

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function buildWhatsAppLink(product) {
  const message = `Hello, I am interested in ${product.name}, product code ${product.code}. Please share further details.`;
  return getDirectWhatsAppLink(message);
}

function openProductModal(productCode) {
  const product = productsList.find((item) => String(item.code) === String(productCode));
  if (!product) {
    return;
  }

  lastFocusedElement = document.activeElement;

  const modal = document.getElementById("productModal");
  const modalContent = document.getElementById("modalContent");
  const hasPublicSpecifications = product.publicSpecifications && product.publicSpecifications.length;
  const specItems = hasPublicSpecifications
    ? product.publicSpecifications.map((spec) => `<li>${escapeHtml(spec)}</li>`).join("")
    : "<li>Contact us for product details.</li>";
  const specificationsHeading = hasPublicSpecifications ? "Product specifications" : "Product information";

  const associatedText = product.associatedText ? `<div class="detail-row"><dt>Associated text</dt><dd>${escapeHtml(product.associatedText)}</dd></div>` : "";

  modalContent.innerHTML = `
    <div class="modal-body">
      <div class="modal-media">${getProductImageMarkup(product)}</div>
      <div class="modal-content">
        <p class="modal-kicker">Inventory item</p>
        <h3 id="modalTitle">${escapeHtml(product.name)}</h3>
        <dl class="detail-list">
          <div class="detail-row"><dt>Inventory code</dt><dd>${escapeHtml(product.code)}</dd></div>
          <div class="detail-row"><dt>Colour</dt><dd>${escapeHtml(product.colour)}</dd></div>
          ${product.unit ? `<div class="detail-row"><dt>Unit</dt><dd>${escapeHtml(product.unit)}</dd></div>` : ""}
          ${associatedText}
        </dl>

        <h4>${specificationsHeading}</h4>
        <ul class="spec-list">${specItems}</ul>

        <div class="modal-actions">
          <button type="button" class="button button-secondary" data-close-modal="true">Back to catalogue</button>
          <a
            href="${escapeHtml(buildWhatsAppLink(product))}"
            class="button button-primary ${config.whatsappNumber ? "" : "is-disabled"}"
            aria-disabled="${config.whatsappNumber ? "false" : "true"}"
            ${config.whatsappNumber ? 'target="_blank" rel="noopener noreferrer"' : ""}
            ${config.whatsappNumber ? "" : 'tabindex="-1"'}
          >
            Enquire on WhatsApp
          </a>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const closeButton = document.getElementById("modalCloseButton");
  closeButton.focus();
}

function closeProductModal() {
  const modal = document.getElementById("productModal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function setCopyrightYear() {
  const currentYear = new Date().getFullYear();
  const yearTarget = document.getElementById("currentYear");
  if (yearTarget) {
    yearTarget.textContent = currentYear;
  }
}

function setActiveNav() {
  const sections = ["home", "catalogue", "about", "contact"];
  const navLinks = [...document.querySelectorAll(".main-nav a")];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${entry.target.id}`;
            link.classList.toggle("active", isActive);
          });
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach((id) => {
    const section = document.getElementById(id);
    if (section) {
      observer.observe(section);
    }
  });
}

function initMobileNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (!toggle || !mobileMenu) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    const nextState = !isExpanded;

    toggle.setAttribute("aria-expanded", String(nextState));
    mobileMenu.hidden = !nextState;
    toggle.classList.toggle("is-open", nextState);
    toggle.setAttribute("aria-label", nextState ? "Close navigation menu" : "Open navigation menu");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-label", "Open navigation menu");
      mobileMenu.hidden = true;
    });
  });
}

function initHeroImage() {
  const image = document.querySelector(".hero-visual__image");
  const panel = document.querySelector(".hero-visual__panel");
  const fallback = document.querySelector(".hero-image-fallback");

  if (!image || !panel || !fallback) {
    return;
  }

  const showImage = () => {
    image.hidden = false;
    fallback.hidden = true;
    panel.classList.add("has-image");
  };

  const showFallback = () => {
    image.hidden = true;
    fallback.hidden = false;
    panel.classList.remove("has-image");
  };

  image.addEventListener("load", showImage, { once: true });
  image.addEventListener("error", showFallback, { once: true });

  if (image.complete) {
    image.naturalWidth ? showImage() : showFallback();
  }
}

function setHeroWhatsAppLink() {
  const heroWhatsApp = document.getElementById("heroWhatsApp");
  if (!heroWhatsApp) {
    return;
  }

  heroWhatsApp.href = getDirectWhatsAppLink("Hello, I would like to enquire about a product from Atif Leather Store.");
  heroWhatsApp.setAttribute("target", "_blank");
  heroWhatsApp.setAttribute("rel", "noopener noreferrer");
}

function init() {
  populateColourFilter();
  populateFamilyFilter();
  bindEvents();
  setCatalogueView(state.view);
  renderContactDetails();
  setHeroWhatsAppLink();
  initHeroImage();
  renderCatalogue();
  setCopyrightYear();
  setActiveNav();
  initMobileNavigation();

  document.addEventListener("keydown", (event) => {
    const modal = document.getElementById("productModal");

    if (event.key === "Escape") {
      if (!modal.classList.contains("hidden")) {
        closeProductModal();
        return;
      }

      const toggle = document.querySelector(".menu-toggle");
      const mobileMenu = document.getElementById("mobileMenu");
      if (toggle && mobileMenu && !mobileMenu.hidden) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
        toggle.classList.remove("is-open");
        mobileMenu.hidden = true;
        toggle.focus();
      }
      return;
    }

    if (event.key === "Tab" && !modal.classList.contains("hidden")) {
      const focusable = [...modal.querySelectorAll("a[href]:not([tabindex='-1']), button:not([disabled])")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const modal = document.getElementById("productModal");
  document.getElementById("modalCloseButton").addEventListener("click", closeProductModal);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal='true']") || event.target.classList.contains("modal-backdrop")) {
      closeProductModal();
    }
  });
}

window.addEventListener("DOMContentLoaded", init);
