# leifclaesson.github.io

The root index for https://leifclaesson.github.io/ -- who I am, and a directory
of everything published under this account.

One static page. No framework, no build step, no backend.

## Adding an entry

Everything that is published lives as one card in one of the grids in
`index.html`. To add another:

1. Copy an existing `<a class="tool">` block inside the relevant `.grid`.
2. Change the `href`, the `--ac` accent colour, the icon, the name, the
   tagline and the one-liner.
3. Drop the icon in `assets/` (PNG, square, ~256px).

The grid reflows on its own. An entry with no app icon uses a
`<div class="tool-glyph">X</div>` in place of the `<img>` -- Proverb Masher
uses `|`, the character its data format splits proverbs on.

## Layout

| Section | Holds |
|---|---|
| The tools | Free-to-use closed-source Windows utilities, one repo + Pages site each |
| Other things | Odds, ends and excavations -- things that are not utilities |
