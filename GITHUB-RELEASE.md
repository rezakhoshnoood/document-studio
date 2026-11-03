# GitHub publication details — Document Studio 3.7.0

## Repository name

`document-studio`

## Description

A local-first bilingual document editor for creating, presenting, printing, and exporting visual documents in the browser.

## Suggested topics

`document-editor` `javascript` `html` `css` `pwa` `offline-first` `local-first` `rtl` `persian` `github-pages`

## Release title and tag

- Title: `Document Studio 3.7.0`
- Tag: `v3.7.0`

## Release notes

Document Studio 3.7.0 improves the experience for English-speaking users while retaining Persian and RTL support.

### Highlights

- English example content for all 18 built-in templates, plus language-appropriate direction and document font.
- English is the default interface and document language for new installations; prior saved preferences and documents are retained. The home header has independent controls for interface and new-document languages.
- A default language setting for new documents and a language selector during template setup.
- A three-choice prompt when changing an existing document's language: preserve content, reset an eligible built-in template, or cancel. Reset is undoable during the editing session and is disabled when the original built-in template cannot be identified.
- An install action on the home page, with instructions when a browser install prompt is unavailable.
- An animated, clickable home showcase rotates through actual built-in templates, respects reduced-motion settings, and opens the full gallery.
- A mobile-friendly print workspace with a touch-sized tools drawer, fit-to-screen paper preview, zoom and horizontal panning. Paper dimensions and browser print output remain independent of preview zoom.
- Updated service-worker cache and English README with local and GitHub Pages instructions.

### Notes

- The application is experimental. Check important content, calculations, output, and print layouts before use.
- Documents stay in local browser storage. Back up to JSON before changing browsers, devices, domains, or ports, and before clearing site data.
- Browser support and install behavior vary. Windows launchers and physical mobile devices have not been exhaustively tested.
- No license has been selected in this release. Add a license only after the project owner chooses one.

## Suggested commit message

`Release Document Studio 3.7.0 with English defaults, animated template showcase, and mobile print tools`
