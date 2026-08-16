# QR Generator

A production-ready client-side QR generator for website links and fixed-amount UPI payments.

## Features

- Link QR generation
- Automatic `https://` normalization
- Real UPI payment deep-link QR generation
- Fixed INR amount with two-decimal formatting
- Four actual QR module styles: Square, Rounded, Dots, Extra Rounded
- Black QR on white background
- PNG download
- Web Share API support with file sharing where supported
- Fullscreen QR modal with ESC/outside-click close
- Responsive mobile/tablet/desktop UI
- Accessibility labels, tab roles, and pressed states
- Graceful QR library CDN failure handling

## Folder structure

```text
QR/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── README.md
```

## Run

No build step is required.

1. Extract the `QR` folder.
2. Open `index.html` in a browser, or serve the folder with a local web server.
3. Internet access is required for the QRCodeStyling CDN unless the library is self-hosted.

Example with VS Code Live Server:
- Open the `QR` folder.
- Start Live Server.
- Open `index.html`.

## Link QR usage

1. Select **Link QR**.
2. Enter a URL such as `example.com` or `https://example.com`.
3. Choose Square, Rounded, Dots, or Extra Rounded.
4. Click **Generate QR**.
5. The QR contains the website URL directly.
6. Download or share the PNG.

A missing protocol is normalized internally to `https://`.

## UPI QR usage

1. Select **UPI Payment QR**.
2. Enter UPI ID, name, and amount.
3. Select a QR style.
4. Click **Generate Payment QR**.
5. The QR directly contains a UPI payment URI.
6. Download or share the generated PNG.

The amount is always formatted to two decimal places. For example, `100` becomes `100.00`.

## UPI URI explanation

The generated QR payload follows the UPI payment URI format:

`upi://pay?pa=...&pn=...&am=...&cu=INR`

Parameter values are encoded individually. The final URI itself is not wrapped inside another URL or redirect.

The raw UPI URI is intentionally not displayed in the visible result UI.

## QR style explanation

The four style choices change actual QR modules through QRCodeStyling's `dotsOptions`, `cornersSquareOptions`, and `cornersDotOptions`:

- Square
- Rounded
- Dots
- Extra Rounded

The QR remains strictly black and white regardless of the selected style.

## Download and share

Downloads are PNG files generated from the QR itself:

- Link QR: `Link-QR.png`
- UPI Payment QR: `UPI-Payment-QR.png`

When supported, the Web Share API is used. If file sharing is supported, the PNG is shared directly. If the browser cannot share files, a relevant text share is attempted.

If sharing is unavailable, the app displays:

`Sharing is not supported in this browser. Please use Download.`

## Browser compatibility

The app uses modern browser APIs including:

- `URL`
- `URLSearchParams`
- `File`
- `Blob`
- Web Share API (optional)
- Canvas/image rendering from QRCodeStyling

The core QR generation works in modern desktop and mobile browsers. Web Share and file sharing availability varies by browser and operating system.

## UPI deep-link limitation

The QR payload is a real `upi://pay` deep link and does not use an intermediate website or redirect. However, whether scanning the QR opens a UPI payment screen depends on the scanning device, operating system, camera/scanner, installed UPI applications, and their support for UPI deep links.

The web app cannot guarantee that every scanner will launch a particular UPI application.

## Validation

Link QR:
- Empty link: `Please enter a link.`
- Invalid link: `Please enter a valid link.`

UPI QR:
- Empty UPI ID: `Please enter UPI ID.`
- Missing/invalid `@`: `Please enter a valid UPI ID.`
- Empty name: `Please enter Name.`
- Empty, zero, negative, or invalid amount: `Please enter a valid amount.`

## CDN failure

QRCodeStyling 1.9.2 is loaded before the application script. If it cannot be loaded, the application displays a clear error instead of crashing.
