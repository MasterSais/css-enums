# `Css Enums`

Typescript library aimed to provide enumerables for CSS properties mostly for CSSInJS utilities.
Based on type definitions from [csstype][css-type-link] (v3.0.5) lib.

[css-type-link]: https://github.com/frenic/csstype

### `Installation`

Install with npm:
```sh
npm install css-enums
```

Install with yarn:
```sh
yarn add css-enums
```

### `Usage`

CSS in JS example (with [JSS][jss-link] lib):
```js
import { Border, Cursor, Color, BoxSizing, Width, Height, TextTransform } from 'css-enums';

...

yourClassName: {
  width: Width.Inherit,
  height: Height.Inherit,
  border: [1, Border.Solid, Color.Red],
  borderWidth: [0, 0, 1, 0],
  boxSizing: BoxSizing.BorderBox,
  padding: [4, 8],
  textTransform: TextTransform.Capitalize,
  cursor: Cursor.Pointer
}

...
```

Styles assignment in JS:
```js
import { Display } from 'css-enums';

...

htmlElement.style.display = Display.None;

...
```

[jss-link]: https://cssinjs.org