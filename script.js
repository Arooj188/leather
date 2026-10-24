
const productsList = Array.isArray(window.products) ? window.products : [];
const config = window.businessConfig || {};

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
  "Mustard": "#a5772c",
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

const productsById = {};
productsList.forEach(p => { productsById[p.id] = p; });

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PAGE_SIZE = 27;

const state = {
  search: "",
  colour: "all",
  family: "all",
  sort: "name-asc",
  view: "grid",
  page: 1
};

let lastFocusedElement = null;
let searchTimer = null;

function buildColourIndex() {
  const idx = {};
  productsList.forEach(p => {
    p.colours.forEach(c => {
      const pc = publicColour(c);
      if (!idx[pc]) idx[pc] = [];
      idx[pc].push(p.id);
    });
  });
  return idx;
}

const colourIndex = buildColourIndex();

function publicColour(c) {
  if (c === "MUSTERD") return "Mustard";
  return c;
}

function getUniqueColours(families) {
  const seen = new Set();
  families.forEach(p => p.colours.forEach(c => seen.add(publicColour(c))));
  return [...seen].sort((a, b) => a.localeCompare(b));
}

function getUniqueFamilies(families) {
  return [...new Set(families.map(p => p.name))].sort((a, b) => a.localeCompare(b));
}

function getVisibleFamilies() {
  let result = productsList;

  const term = state.search.trim().toLowerCase();
  if (term) {
    result = result.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(term);
      const colourMatch = p.colours.some(c => publicColour(c).toLowerCase().includes(term));
      return nameMatch || colourMatch;
    });
  }

  if (state.colour !== "all") {
    const target = state.colour;
    result = result.filter(p => p.colours.some(c => publicColour(c) === target));
  }

  if (state.family !== "all") {
    result = result.filter(p => p.name === state.family);
  }

  result = result.slice().sort((a, b) => {
    if (state.sort === "name-asc") return a.name.localeCompare(b.name);
    if (state.sort === "colour-asc") {
      const ca = a.colours.map(publicColour).sort().join(", ");
      const cb = b.colours.map(publicColour).sort().join(", ");
      return ca.localeCompare(cb);
    }
    return 0;
  });

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * PAGE_SIZE;
  const pageItems = result.slice(start, start + PAGE_SIZE);

  return { items: pageItems, total, totalPages };
}

function getColourSwatchMarkup(colour) {
  if (colour === MIXED_COLOUR_LABEL) {
    return "<span class=\"colour-swatch colour-swatch--mixed\" aria-hidden=\"true\"></span>";
  }
  const swatchColour = COLOUR_SWATCHES[colour];
  if (swatchColour) {
    return "<span class=\"colour-swatch\" style=\"--swatch-colour: " + swatchColour + "\" aria-hidden=\"true\"></span>";
  }
  return "<span class=\"colour-swatch colour-swatch--unmapped\" aria-hidden=\"true\"></span>";
}

function renderCatalogue() {
  const productGrid = document.getElementById("productGrid");
  const emptyState = document.getElementById("emptyState");
  const countElement = document.getElementById("resultsCount");
  const pagination = document.getElementById("pagination");
  const { items, total, totalPages } = getVisibleFamilies();

  countElement.textContent = total === productsList.length
    ? total + " products available"
    : "Showing " + items.length + " of " + total + " products";

  if (!items.length) {
    productGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    pagination.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");
  productGrid.dataset.view = state.view;
  productGrid.innerHTML = items.map(createProductCardMarkup).join("");

  pagination.innerHTML = renderPagination(totalPages);

  productGrid.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPagination(totalPages) {
  if (totalPages <= 1) return "";
  const p = state.page;
  const disabledPrev = p <= 1 ? " disabled" : "";
  const disabledNext = p >= totalPages ? " disabled" : "";
  let html = "";
  html += "<button type=\"button\" class=\"button button-ghost pagination-btn\" data-page=\"1\" aria-label=\"First page\"" + disabledPrev + ">First</button>";
  html += "<button type=\"button\" class=\"button button-ghost pagination-btn\" data-page=\"" + (p - 1) + "\" aria-label=\"Previous page\"" + disabledPrev + ">Previous</button>";
  html += "<span class=\"pagination-current\">Page " + p + " of " + totalPages + "</span>";
  html += "<button type=\"button\" class=\"button button-ghost pagination-btn\" data-page=\"" + (p + 1) + "\" aria-label=\"Next page\"" + disabledNext + ">Next</button>";
  html += "<button type=\"button\" class=\"button button-ghost pagination-btn\" data-page=\"" + totalPages + "\" aria-label=\"Last page\"" + disabledNext + ">Last</button>";
  return html;
}

function createProductCardMarkup(p) {
  const imageMarkup = getProductImageMarkup(p);
  const visibleColours = p.colours.slice(0, 3);
  const hiddenCount = p.colours.length - 3;
  const coloursHtml = visibleColours.map(c => {
    const label = publicColour(c);
    return "<span class=\"product-card__chip product-card__chip--colour\">" + getColourSwatchMarkup(c) + "<span>" + escapeHtml(label) + "</span></span>";
  }).concat(hiddenCount > 0 ? "<button type=\"button\" class=\"product-card__chip product-card__chip--more\" onclick=\"return openProductDetail(" + p.id + ");\">+" + hiddenCount + " more colours</button>" : "").join("");

  return "<article class=\"product-card\" aria-label=\"Product card: " + escapeHtml(p.name) + "\">" +
    "<div class=\"product-card__media\">" + imageMarkup + "</div>" +
    "<div class=\"product-card__content\">" +
    "<h3 class=\"product-card__name\">" + escapeHtml(p.name) + "</h3>" +
    "<div class=\"product-card__meta\">" + coloursHtml + "</div>" +
    "<div class=\"product-card__actions\">" +
    "<button type=\"button\" class=\"product-card__cta\" data-product-id=\"" + p.id + "\">View Details</button>" +
    buildCardWhatsApp(p) +
    "</div>" +
    "</div>" +
    "</article>";
}

function buildCardWhatsApp(p) {
  if (!isWhatsAppConfigured()) return "<span class=\"button button-primary product-card__whatsapp is-disabled\" aria-disabled=\"true\">Enquire on WhatsApp</span>";
  const label = "Enquire on WhatsApp about " + escapeHtml(p.name);
  return "<a class=\"button button-primary product-card__whatsapp\" href=\"#\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"" + label + "\" onclick=\"return openWhatsAppForFamily(" + p.id + ");\">Enquire on WhatsApp</a>";
}

function getProductImageMarkup(p) {
  if (p.image && p.imageStatus === "verified") {
    return "<img src=\"" + escapeHtml(p.image) + "\" alt=\"" + escapeHtml(p.name) + "\" loading=\"lazy\" />";
  }
  return "<div class=\"product-placeholder\" role=\"img\" aria-label=\"Image Coming Soon\"><span class=\"product-placeholder__label\">Image Coming Soon</span><small>Product photograph not yet added</small></div>";
}

function openWhatsAppForFamily(familyId) {
  const p = productsById[familyId];
  if (!p) return false;
  if (!isWhatsAppConfigured()) return false;
  const firstColour = p.colours.length ? publicColour(p.colours[0]) : "";
  const message = "Hello, I would like to enquire about " + escapeHtml(p.name) + " in " + escapeHtml(firstColour) + ". Please share further details.";
  window.open(getDirectWhatsAppLink(message), "_blank");
  return false;
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
  const pagination = document.getElementById("pagination");

  gridViewButton.addEventListener("click", () => setCatalogueView("grid"));
  listViewButton.addEventListener("click", () => setCatalogueView("list"));

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    state.page = 1;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(renderCatalogue, 120);
  });

  colourFilter.addEventListener("change", (event) => {
    state.colour = event.target.value;
    state.page = 1;
    renderCatalogue();
  });

  familyFilter.addEventListener("change", (event) => {
    state.family = event.target.value;
    state.page = 1;
    renderCatalogue();
  });

  sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    state.page = 1;
    renderCatalogue();
  });

  resetButton.addEventListener("click", () => {
    state.search = "";
    state.colour = "all";
    state.family = "all";
    state.sort = "name-asc";
    state.page = 1;
    searchInput.value = "";
    colourFilter.value = "all";
    familyFilter.value = "all";
    sortSelect.value = "name-asc";
    renderCatalogue();
  });

  productGrid.addEventListener("click", (event) => {
    const trigger = event.target.closest(".product-card__cta");
    if (!trigger) return;
    const familyId = Number(trigger.dataset.productId);
    openProductDetail(familyId);
  });

  pagination.addEventListener("click", (event) => {
    const btn = event.target.closest(".pagination-btn");
    if (!btn) return;
    const page = Number(btn.dataset.page);
    if (page && page >= 1) {
      state.page = page;
      renderCatalogue();
    }
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
  try { window.localStorage.setItem("atifLeatherCatalogueView", state.view); } catch { return; }
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
          return "<a href=\"" + escapeHtml(entry.href) + "\">" + escapeHtml(entry.label) + "</a>";
        }
        return "<span>" + escapeHtml(entry.label) + "</span>";
      })
      .join("");
  }

  if (!whatsappLink) return;

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
  if (!whatsappNumber) return "#";
  return "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message);
}

function openProductDetail(familyId) {
  const p = productsById[familyId];
  if (!p) return;
  lastFocusedElement = document.activeElement;

  const modal = document.getElementById("productModal");
  const modalContent = document.getElementById("modalContent");

  const imageMarkup = getProductImageMarkup(p);
  const coloursHtml = p.colours.map((c, i) => {
    const label = publicColour(c);
    return "<button type=\"button\" class=\"detail-swatch\" data-colour=\"" + c + "\">" + escapeHtml(label) + "</button>";
  }).join("");

  modalContent.innerHTML = "<div class=\"modal-body\">" +
    "<div class=\"modal-media\">" + imageMarkup + "</div>" +
    "<div class=\"modal-content\">" +
    "<p class=\"modal-kicker\">Catalogue item</p>" +
    "<h3 id=\"modalTitle\">" + escapeHtml(p.name) + "</h3>" +
    "<div class=\"detail-colours\"><strong>Available colours:</strong> " + coloursHtml + "</div>" +
    "<div class=\"modal-actions\">" +
    "<button type=\"button\" class=\"button button-secondary\" data-close-modal=\"true\">Back to catalogue</button>" +
    buildModalWhatsApp(p) +
    "</div>" +
    "</div>" +
    "</div>";

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const closeButton = document.getElementById("modalCloseButton");
  closeButton.focus();

  modalContent.addEventListener("click", (event) => {
    const btn = event.target.closest(".detail-swatch");
    if (btn) {
      modalContent.querySelectorAll(".detail-swatch").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    }
  });
}

function buildModalWhatsApp(p) {
  if (!isWhatsAppConfigured()) return "<span class=\"button button-primary is-disabled\" aria-disabled=\"true\">Enquire on WhatsApp</span>";
  const firstColour = p.colours.length ? publicColour(p.colours[0]) : "";
  const label = "Enquire on WhatsApp about " + escapeHtml(p.name);
  return "<a class=\"button button-primary\" href=\"#\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"" + label + "\" onclick=\"return openWhatsAppForFamily(" + p.id + ");\">Enquire on WhatsApp</a>";
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
            const isActive = link.getAttribute("href") === "#" + entry.target.id;
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

window.addEventListener("DOMContentLoaded", init);

function populateColourFilter() {
  const colourFilter = document.getElementById("colourFilter");
  const colours = getUniqueColours(productsList);
  colourFilter.innerHTML = "<option value=\"all\">All colours</option>" +
    colours.map(c => "<option value=\"" + c + "\">" + escapeHtml(c) + "</option>").join("");
}

function populateFamilyFilter() {
  const familyFilter = document.getElementById("familyFilter");
  const families = getUniqueFamilies(productsList);
  familyFilter.innerHTML = "<option value=\"all\">All product families</option>" +
    families.map(f => "<option value=\"" + f + "\">" + escapeHtml(f) + "</option>").join("");
}
