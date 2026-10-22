const productsList = Array.isArray(window.products) ? window.products : [];
const config = window.businessConfig || {};

/**
 * Approximate display colours used for the small swatch shown next to each
 * written colour name. These are visual guides only - they are not official
 * colour codes and no colour values were supplied by the product report.
 * The written colour name always stays visible so colour is never the only
 * way to identify a product.
 */
const COLOUR_SWATCHES = {
  "ASH GREEN": "#8d9c86",
  "BABY PINK": "#f3c3ce",
  "BEIGE": "#ddc9a5",
  "BLACK": "#1f1d1b",
  "BLUE": "#2f5f9e",
  "BROWN": "#6b4a31",
  "C BROWN": "#8b5a3c",
  "C.BEIGE": "#d8c3a6",
  "CAMEL": "#c19a6b",
  "COFEE BEIGE": "#c5a37e",
  "COPPER": "#b06f3a",
  "CREAM": "#f3ead8",
  "D / PINK": "#d1769a",
  "D/GRAY": "#5a5e63",
  "FEROZI": "#7c1e4b",
  "GOLDEN": "#d3a63c",
  "L / MAROON": "#9a5560",
  "L Peach": "#f6d2b9",
  "L/BEIGE": "#ead6b4",
  "L/BROWN": "#b08b6b",
  "L/GOLDEN": "#e2c672",
  "L/GRAY": "#bcbcbc",
  "MAROON": "#6e2130",
  "MEHNDI": "#6c6f3f",
  "MUSTERD": "#a5772c",
  "N/BLUE": "#24406f",
  "New Beige": "#e2cfae",
  "New Golden": "#d8b154",
  "New Peach": "#f3c5a5",
  "OFF WHITE": "#f1efe7",
  "olive green": "#6f7a42",
  "ORANGE": "#e0701c",
  "PEACH": "#f1b48d",
  "PINK": "#e79cb6",
  "PURPLE": "#6a3fa0",
  "RED": "#b02a22",
  "Rose White": "#f6e4e6",
  "S / PINK": "#e9a9c2",
  "s grey": "#9ba1a7",
  "SEA GREEN": "#2f8b74",
  "SILVER": "#c8ced6",
  "sky blue": "#8cc5e0",
  "T/ PINK": "#d98cab",
  "TAN BROWN": "#b07a3e",
  "VESPA BLUE": "#2c6ea3",
  "WHITE": "#faf8f4",
  "YELLOW": "#e6c33a"
};

const MIXED_COLOUR_LABEL = "MIX COLOR";

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
let searchTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
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

/**
 * Turns the unit label recorded in the source report into a customer friendly
 * label. The source label itself is kept in the product data; only the way it
 * is written for customers is expanded here.
 */
function formatUnit(unit) {
  const raw = String(unit ?? "").trim();
  if (!raw) {
    return "";
  }

  const key = raw.toUpperCase();

  if (key === "MTR") {
    return "Metre (MTR)";
  }

  if (key === "KG") {
    return "Kilogram (KG)";
  }

  return raw;
}

function getColourSwatchMarkup(colour) {
  if (colour === MIXED_COLOUR_LABEL) {
    return `<span class="colour-swatch colour-swatch--mixed" aria-hidden="true"></span>`;
  }

  const swatchColour = COLOUR_SWATCHES[colour];

  if (swatchColour) {
    return `<span class="colour-swatch" style="--swatch-colour: ${swatchColour}" aria-hidden="true"></span>`;
  }

  return `<span class="colour-swatch colour-swatch--unmapped" aria-hidden="true"></span>`;
}

function getVisibleProducts() {
  const term = state.search.trim().toLowerCase();

  const filtered = productsList.filter((product) => {
    const searchSource = [product.code, product.name, product.colour]
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
        return String(a.code).localeCompare(String(b.code), undefined, { numeric: true, sensitivity: "base" });
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
}

function createProductCardMarkup(product) {
  const imageMarkup = getProductImageMarkup(product);
  const unit = formatUnit(product.unit);
  const unitMarkup = unit ? `<span class="product-card__chip">${escapeHtml(unit)}</span>` : "";
  const colourMarkup = `
    <span class="product-card__chip product-card__chip--colour">
      ${getColourSwatchMarkup(product.colour)}
      <span>${escapeHtml(product.colour)}</span>
    </span>`;
  const actionsMarkup = getCardActionsMarkup(product);

  return `
    <article class="product-card" aria-label="${escapeHtml(product.name)} product card">
      <div class="product-card__media">${imageMarkup}</div>
      <div class="product-card__content">
        <h3 class="product-card__name">${escapeHtml(product.name)}</h3>
        <p class="product-card__code">Code ${escapeHtml(product.code)}</p>
        <div class="product-card__meta">${colourMarkup}${unitMarkup}</div>
        <div class="product-card__actions">${actionsMarkup}</div>
      </div>
    </article>
  `;
}

function getCardActionsMarkup(product) {
  const detailButton = `<button type="button" class="product-card__cta" data-product-code="${escapeHtml(product.code)}">View Details</button>`;

  if (!isWhatsAppConfigured()) {
    return `${detailButton}<span class="button button-primary product-card__whatsapp is-disabled" aria-disabled="true">Enquire on WhatsApp</span>`;
  }

  const whatsappLabel = `Enquire on WhatsApp about ${product.name}, code ${product.code}`;

  return `${detailButton}<a class="button button-primary product-card__whatsapp" href="${escapeHtml(buildWhatsAppLink(product))}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(whatsappLabel)}">Enquire on WhatsApp</a>`;
}

function getProductImageMarkup(product) {
  if (product.image && product.imageStatus === "verified") {
    return `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)} in ${escapeHtml(product.colour)}" loading="lazy" />`;
  }

  return `
    <div class="product-placeholder" role="img" aria-label="Image Coming Soon">
      <span class="product-placeholder__label">Image Coming Soon</span>
      <small>Product photograph not yet added</small>
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
  const productGrid = document.getElementById("productGrid");

  gridViewButton.addEventListener("click", () => setCatalogueView("grid"));
  listViewButton.addEventListener("click", () => setCatalogueView("list"));

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(renderCatalogue, 120);
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

  productGrid.addEventListener("click", (event) => {
    const trigger = event.target.closest(".product-card__cta");
    if (!trigger) {
      return;
    }

    openProductModal(trigger.dataset.productCode);
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
  const footerContact = document.getElementById("footerContact");

  const entries = [];

  if (config.city || config.address) {
    const locationParts = [config.city, config.address].filter(Boolean);
    entries.push({ label: "Location", value: locationParts.join(" - ") || "", href: "" });
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

  if (!whatsappLink) {
    return;
  }

  if (isWhatsAppConfigured()) {
    whatsappLink.href = getDirectWhatsAppLink("Hello, I would like to enquire about a product from Atif Leather Store. Please share further details. Thank you.");
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

function isWhatsAppConfigured() {
  return cleanWhatsAppNumber(config.whatsappNumber).length > 0;
}

function getDirectWhatsAppLink(message) {
  const whatsappNumber = cleanWhatsAppNumber(config.whatsappNumber);
  if (!whatsappNumber) {
    return "#";
  }

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a WhatsApp click-to-chat link for one product using only the values
 * recorded in the product data: product name, product code, colour and unit.
 */
function buildWhatsAppLink(product) {
  const lines = [
    "Hello, I would like to enquire about this artificial leather product.",
    "",
    `Product Name: ${product.name}`,
    `Product Code: ${product.code}`,
    `Colour: ${product.colour}`
  ];

  const unit = formatUnit(product.unit);
  if (unit) {
    lines.push(`Unit: ${unit}`);
  }

  lines.push("", "Please share further details. Thank you.");

  return getDirectWhatsAppLink(lines.join("\n"));
}

function openProductModal(productCode) {
  const product = productsList.find((item) => String(item.code) === String(productCode));
  if (!product) {
    return;
  }

  lastFocusedElement = document.activeElement;

  const modal = document.getElementById("productModal");
  const modalContent = document.getElementById("modalContent");
  const unit = formatUnit(product.unit);
  const unitRow = unit ? `<div class="detail-row"><dt>Unit</dt><dd>${escapeHtml(unit)}</dd></div>` : "";

  modalContent.innerHTML = `
    <div class="modal-body">
      <div class="modal-media">${getProductImageMarkup(product)}</div>
      <div class="modal-content">
        <p class="modal-kicker">Catalogue item</p>
        <h3 id="modalTitle">${escapeHtml(product.name)}</h3>
        <dl class="detail-list">
          <div class="detail-row"><dt>Inventory code</dt><dd>${escapeHtml(product.code)}</dd></div>
          <div class="detail-row">
            <dt>Colour</dt>
            <dd class="detail-colour">${getColourSwatchMarkup(product.colour)}<span>${escapeHtml(product.colour)}</span></dd>
          </div>
          ${unitRow}
        </dl>

        <div class="modal-actions">
          <button type="button" class="button button-secondary" data-close-modal="true">Back to catalogue</button>
          ${getModalWhatsAppMarkup(product)}
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

function getModalWhatsAppMarkup(product) {
  if (!isWhatsAppConfigured()) {
    return `<span class="button button-primary is-disabled" aria-disabled="true">Enquire on WhatsApp</span>`;
  }

  return `
    <a
      href="${escapeHtml(buildWhatsAppLink(product))}"
      class="button button-primary"
      target="_blank"
      rel="noopener noreferrer"
    >
      Enquire on WhatsApp
    </a>
  `;
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

  if (!isWhatsAppConfigured()) {
    heroWhatsApp.href = "#";
    heroWhatsApp.classList.add("is-disabled");
    heroWhatsApp.setAttribute("aria-disabled", "true");
    return;
  }

  heroWhatsApp.href = getDirectWhatsAppLink("Hello, I would like to enquire about a product from Atif Leather Store. Please share further details. Thank you.");
  heroWhatsApp.classList.remove("is-disabled");
  heroWhatsApp.setAttribute("aria-disabled", "false");
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
