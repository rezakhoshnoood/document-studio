# Document Studio

Access to app : https://rezakhoshnoood.github.io/document-studio/

**A bilingual, browser-based document editor for creating, presenting, and printing visual documents.**

Document Studio is a lightweight web app built with vanilla HTML, CSS, and JavaScript. It supports Persian and English, right-to-left and left-to-right documents, and a range of visual content blocks. Documents are stored in the browser, so no account or application backend is required.

> **Status:** Version 3.7.0 is experimental. Test important documents and keep backups before relying on the app for production work.

## Features

- **Bilingual interface:** Persian and English, with interface language independent of document language. New installations default to English for both; the home header has separate controls for the interface and the default language of new documents. Existing saved preferences and documents are preserved.
- **Bilingual built-in templates:** All 18 built-in templates have Persian and English example content. The selected document language controls direction, default document font, and supported number formatting.
- **Featured templates:** An animated home showcase displays four randomly selected built-in templates; the entire showcase opens the complete gallery. Automatic rotation respects reduced-motion preferences.
- **Install from Home:** Use the prominent install button where the browser supports installation, or follow the displayed browser-specific instructions.
- **Visual document editor:** Create documents using blocks such as headings, text, tables, charts, timelines, images, signatures, dividers, and more.
- **Editing workspaces:** Design documents for the web, presentation, and print, with layout and appearance controls. On mobile, print tools open in a touch-friendly drawer and the true-size paper preview can fit the screen or be zoomed and panned.
- **Tables:** Edit cells directly, select ranges, use spreadsheet-style keyboard shortcuts, insert or delete rows and columns, and merge cells.
- **Calculations:** Configure supported column types, row formulas, and aggregate operations such as sum, average, minimum, and maximum.
- **Typography and styling:** Adjust fonts, colors, alignment, highlights, spacing, and selected text formatting where supported.
- **Appearance:** Choose application color themes and document presets independently.
- **Export and sharing:** Export standalone HTML, JSON backups, plain text, and CSV tables. Print documents or save them as PDF using the browser's print dialog.
- **Local-first storage:** Documents are saved in the current browser using localStorage; undo and redo are available during editing.
- **Progressive web app support:** The application can cache its core resources for offline use after a successful initial visit, subject to browser support.

## How to use

1. Open the application in a modern browser.
2. Set the default language for new documents from the **Home** header or **Settings**, or choose a document language in the template setup dialog. The interface language can be changed independently using the globe button on Home or in Settings.
3. Create a document or start from an available template.
4. Add and edit blocks using the editor panels and canvas.
5. Use the document settings, typography controls, and workspaces to refine the result.
6. Export the document or use the print workspace when finished.
7. Download JSON backups regularly, especially before changing browsers, devices, domains, or ports.

**Changing an existing document’s language:** Use the bottom editor bar or Document settings. Choose **Keep current changes** to retain content without translation, **Reset template in new language** to replace the content and design with the built-in template, or **Cancel**. Reset preserves the document name and can be undone during the editing session. Reset is available only for documents created from built-in templates in version 3.6 or later; older documents, blank documents, and custom templates are protected. The setting in the application Settings page affects new documents only.

For Persian documents, supported table input converts typed Latin and Arabic-Indic digits to Persian digits. The document language, not the interface language, controls this behavior.

## Run locally

Python 3 is required only for the included local launcher. There are no npm packages to install and no build step.

### Windows

1. Extract the project files into a new folder.
2. Run `start.bat` and keep its window open.
3. Open <http://localhost:18798/> if the browser does not open automatically.

### macOS and Linux

From the project folder, run:

```bash
./start.sh
```

If needed, make the script executable first:

```bash
chmod +x start.sh
./start.sh
```

Open <http://localhost:18798/>. Alternatively, run `python3 serve.py`.

If port `18798` is occupied, stop the existing server or choose another port:

```bash
# Windows
start.bat 18799

# macOS / Linux
./start.sh 18799
```

Then open <http://localhost:18799/>. Browser storage is separate for each origin, including the port, so documents saved at another address will not automatically appear. Import a JSON backup to move documents.

The editor needs to be served over HTTP or HTTPS rather than opened directly as a local `file://` page. A standalone HTML document exported by the app can be opened directly in a browser.

## Publish with GitHub Pages

1. Put the project contents—not the enclosing folder—at the root of your repository. `index.html`, `sw.js`, `manifest.json`, `css/`, `js/`, and `assets/` should be at that level.
2. Keep the `.nojekyll` file at the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/(root)`, then save.
6. After deployment, open the site using the address shown in **Settings → Pages**.

A custom domain can be configured in the same Pages settings. Follow GitHub's DNS and domain-verification instructions, then enable HTTPS when it becomes available. If GitHub creates a `CNAME` file for the custom domain, keep it when updating the repository.

On GitHub Free, the repository used for Pages must be public. Review the applicable GitHub Pages terms and usage limits before deployment.

## Data and backups

Documents are stored in the current browser's localStorage, not in a shared account or a server database. Data does not automatically sync between devices, browsers, hostnames, protocols, or ports. Clearing browser site data may permanently remove local documents.

Use the application's JSON export and import options to back up and transfer documents. A document backup does not include every separate application setting, custom template, or preset. Do not upload personal backups or sensitive information to a public repository.

## Table and calculation notes

- Merging cells keeps the content selected in the merge dialog and clears the other selected cells. Unmerging does not restore the cleared contents; use undo to recover them.
- Merges must remain within one table section. Calculated cells cannot be merged, and some operations require cells to be unmerged first.
- Formulas use JavaScript floating-point numbers. Verify rounding and results independently for financial or official use.
- CSV exports contain table data, not the document layout or animations. A linked chart in standalone HTML is not automatically rebuilt when its source table is edited.

## Offline and external resources

The service worker can cache core application files after the app has been loaded successfully online. Offline behavior depends on the browser and its cache. Some optional features, external fonts, libraries, images, or user-provided URLs may still require an internet connection. Test the features and exported documents you rely on in your own environment.

If an older version appears after an update, check the site address and reload or reopen the page. Do not clear browser storage without first exporting a backup.

## Browser support and testing

Core workflows have been tested in Chromium, including table input, selection, merging, output, printing, and simulated mobile interactions. Windows launcher behavior, actual PWA installation prompts, every browser, physical mobile device, and every input method have not been exhaustively tested. Please report reproducible issues with your browser, device, and steps to reproduce.

## Project structure

```text
index.html       Application entry point
manifest.json    Web app manifest
sw.js            Service worker
css/             Stylesheets
js/              Application modules
assets/          Application assets
serve.py         Optional local Python server
start.bat        Windows local launcher
start.sh         macOS/Linux local launcher
```

## Credits and contact

Designed by **Reza Khoshnood**  
Email: [reza.khoshnoood@gmail.com](mailto:reza.khoshnoood@gmail.com)

## License

No project license has been specified yet. Contact the project owner for permission before reusing, modifying, or distributing the code. Third-party assets and libraries may have their own licenses.
