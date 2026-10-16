# Atif Leather Store

Atif Leather Store is a lightweight static catalogue website for browsing the available artificial leather collection. It is designed to be easy to maintain in Visual Studio Code and can be deployed as a static site when the owner approves the final public content.

## Technologies used

- HTML5
- CSS3
- Vanilla JavaScript
- No framework or build step required

This keeps the site simple, fast, and beginner-friendly.

## Project structure

- `index.html` – page structure and content sections
- `style.css` – design system, layout, responsive styling, and accessibility styles
- `config.js` – configurable business details and SEO defaults
- `products.js` – the complete 32-product inventory
- `script.js` – filtering, sorting, search, modal behaviour, and contact rendering
- `assets/leather main.png` – approved homepage material photograph
- `images/brand/` – brand artwork and favicon placeholders
- `images/products/` – future image storage location for verified product photos
- `robots.txt` – crawler instructions for deployment
- `sitemap.xml` – sitemap placeholder for deployment

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
  sourceRow: 33,
  code: "1041",
  name: "Example Product",
  unit: "MTR",
  colour: "BLACK",
  associatedText: "Example reference",
  fieldA: 100,
  fieldB: 120,
  image: null,
  imageStatus: "missing",
  publicSpecifications: [],
  description: "",
  enquiryEnabled: true
}
```

Important rules:

- Keep the `code` as a string.
- Keep `sourceRow` separate from the inventory code.
- Do not display `fieldA` or `fieldB` publicly.
- Leave `image` as `null` until a verified image exists.

## How to change an existing product name or code

Edit the matching object in `products.js`.

For example, if a product name changes from `MISMA 144` to a new official name, update only that object’s `name` field. The catalogue, search, and detail modal will use the same data source automatically.

## How to add a genuine product image

1. Put the image in `images/products/`.
2. Name it using the inventory code where possible, for example `1002.jpg`.
3. Update the matching product object in `products.js`:

```js
image: "images/products/1002.jpg",
imageStatus: "verified"
```

Keep the image files organised by product code. Do not use an unverified photo or a random supplier image.

## How to add the homepage hero photograph

Place the approved photograph at `assets/leather main.png`. The hero image in `index.html` uses this project-relative path, which resolves correctly under GitHub Pages `/leather/`. If the image is missing, the page shows a labelled neutral fallback; do not use an external image URL.

## How to configure business details

Open `config.js` and update the values that the business owner approves.

Example:

```js
window.businessConfig = {
  businessName: "Atif Leather Store",
  phone: "0300 4203395",
  whatsappNumber: "923004203395",
  email: "",
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

## How to configure WhatsApp enquiries

1. Add the business WhatsApp number in `config.js`.
2. Keep only the digits in the number.
3. The site will build a valid WhatsApp click-to-chat link automatically.

Example:

```js
whatsappNumber: "YOUR_INTERNATIONAL_NUMBER"
```

Replace the placeholder with the configured business WhatsApp number before using it.

If the value is empty, the public WhatsApp button remains disabled and shows a helpful note.

## How to test search and filters

Open the page in the browser and try:

- searching `1002`
- searching `MISMA`
- searching `411`
- filtering by colour
- filtering by product family
- sorting by product name or code
- resetting the filters
- switching between Grid and List view

The search and filters update the catalogue without reloading the page.

## How to prepare for deployment

Before deployment, review and confirm:

- business name and public identity
- approved contact details
- final product names, codes and any apparent spelling inconsistencies
- genuine product images if available
- any privacy or legal pages required by the owner

The project is set up as a static website so it can be hosted on a standard static hosting service.

## Information still needing approval

The following details should be reviewed by the business owner before launch:

- product names and possible spelling inconsistencies, including `MEGENTA`
- final approved product photographs
- final public product specifications

This project intentionally avoids making unsupported claims or exposing internal supplier or pricing information.
