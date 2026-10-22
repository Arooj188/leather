# Atif Leather Store

Atif Leather Store is a lightweight static catalogue website for browsing the artificial
leather collection. It is easy to maintain in Visual Studio Code and is deployed as a
static site on GitHub Pages.

## Technologies used

- HTML5
- CSS3
- Vanilla JavaScript
- No framework, build step or external dependency

## Project structure

- `index.html` – page structure and content sections
- `style.css` – design system, layout, responsive styling, and accessibility styles
- `config.js` – configurable business details and SEO defaults
- `products.js` – the complete catalogue data (971 products)
- `script.js` – search, filters, sorting, view switch, modal behaviour, colour swatches and contact links
- `assets/leather main.png` – approved homepage material photograph
- `images/brand/` – brand artwork and the favicon
- `images/products/` – storage location for verified product photos
- `robots.txt` – crawler instructions for deployment
- `sitemap.xml` – sitemap for deployment
- `.gitignore` – keeps the private source document and the private validation report out of the published site

Files that are **not** published: `product.pdf` (the private source report) and
`PRODUCT_DATA_VALIDATION.md` (the private data validation report). Both are ignored by
Git, so they stay on this computer only.

## How to open in VS Code

1. Open the project folder in VS Code.
2. Open the file explorer and select `index.html`.
3. Use the Live Server extension if installed, or run the project with a local static server.

## How to run the website locally

From the project folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## How to add a new product

Open `products.js` and add a new object to the `products` array.

Use the existing structure:

```js
{
  sourceRow: 972,
  sourcePage: 45,
  code: "PP2722",
  name: "EXAMPLE FAMILY",
  colour: "BLACK",
  unit: "MTR",
  image: null,
  imageStatus: "missing"
}
```

Important rules:

- Keep `code` as a **string**, exactly as it is written in the source.
- Keep `name` and `colour` exactly as written in the source, including spelling.
- Keep `unit` exactly as written. `MTR` is shown to customers as `Metre (MTR)`.
- Leave `image` as `null` until a verified photograph exists.
- `sourceRow` and `sourcePage` are simple position references so any row can be checked
  back against the source report.

## How to change an existing product name or code

Edit the matching object in `products.js`. The catalogue, the search box, the filters and
the detail modal all read from the same data, so one edit updates everything.

## How to add a genuine product image

1. Put the image in `images/products/`.
2. Name it using the inventory code where possible, for example `PP2722.jpg`.
3. Update the matching product object in `products.js`:

```js
image: "images/products/PP2722.jpg",
imageStatus: "verified"
```

Until then the card, the list view and the detail modal show **Image Coming Soon**. Keep
image files organised by product code. Do not use an unverified photo, a stock image or an
AI-generated picture.

## How to add the homepage hero photograph

Place the approved photograph at `assets/leather main.png`. The hero image in `index.html`
uses this project-relative path, which resolves correctly under GitHub Pages `/leather/`.
If the image is missing, the page shows a labelled neutral fallback; do not use an
external image URL.

## How to configure business details

Open `config.js` and update the values the business owner approves.

```js
window.businessConfig = {
  businessName: "Atif Leather Store",
  whatsappNumber: "923004203395",
  city: "",
  address: "",
  socialLinks: {
    instagram: "",
    facebook: "",
    linkedin: ""
  }
};
```

Leave empty values until approved details are supplied.

## Customer contact

**WhatsApp is the only customer contact method.** There is no telephone-call button, no
call link and no email link anywhere on the site.

- The business WhatsApp number lives in `config.js` as `whatsappNumber`. Keep only the
  digits, including the country code.
- If the value is empty, every WhatsApp button is disabled and shows a clear
  "unavailable" state instead of a broken link.
- Each product card, the list view and the product detail modal open WhatsApp with a
  message that already contains that product's name, code, colour and unit.

## Colour swatches

Colour names always stay visible next to the swatch. The swatch colours are approximate
display guides written in `script.js` — the source report contains no colour values, so
never describe a swatch as an exact match.

- `MIX COLOR` uses a multi-tone swatch so it is not shown as one misleading solid colour.
- A colour that is not in the swatch map (for example `M15`) falls back to a neutral
  hatched swatch and still shows the written name.
- Filter options are generated from the finished dataset, so every colour and every
  family name is available.

## How to test search and filters

Open the page in the browser and try:

- searching a product code, for example `P1O222`
- searching a family name, for example `MISMA`
- searching a colour, for example `MIX COLOR`
- filtering by colour
- filtering by product family
- sorting by product name, inventory code or colour
- resetting the filters
- switching between Grid and List view
- opening **View Details** on a product and then **Enquire on WhatsApp**

Search is case-insensitive and works on product code, family name and colour. The search
box and the filters can be used together, and switching between Grid and List keeps the
current search and filters.

## How to prepare for deployment

Before deployment, review and confirm:

- business name and public identity
- the approved WhatsApp number
- final product names, codes and any apparent spelling inconsistencies in the source
- genuine product photographs, if available
- any privacy or legal pages required by the owner

The project is a static website hosted on GitHub Pages at
`https://arooj188.github.io/leather/`.

## Information still needing approval

- the unit for the one product that has no unit recorded
- the unit label recorded as `MTT` on one product
- a few family names that are printed short in the source report
- the `M15` colour label on two products
- final approved product photographs

This project intentionally avoids making unsupported claims and excludes private business
information such as internal purchase and sale pricing from every public file.
