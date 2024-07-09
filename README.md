
# Arcs Campaign Archive Tool
Arcs Campaign Archive Tool (or Arcs-CAT for short) is an in-development utility webapp for Leder Games' board game campaign expansion [**Arcs: The Blighted Reach**](https://ledergames.com/collections/games/products/arcs-the-blighted-reach-campaign-expansion)

It aims to provide a digital alternative and/or backup for packing up and resuming Blighted Reach games between Acts.
In Archive Mode, navigate an interface resembling the board in front of you and easily log all pieces and cards in play with drag and drop and search functionality before saving them to a file.
In Retrieval Mode, load an Archived file and all the info needed to resume the next Act will be available either via a Board view or a list.


## Stuff for devs

Most of this is from the tools used to create this app and comes stock with Vue 3 and Vite. Can clean it up down the line.

#### Publish updates to Github Pages (after build)
```sh
git subtree push --prefix dist origin gh-pages
```

### Project setup

This template should help get you started developing with Vue 3 in Vite.

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

### Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

### Project Setup

```sh
npm install
```

#### Compile and Hot-Reload for Development

```sh
npm run dev
```

#### Type-Check, Compile and Minify for Production

```sh
npm run build
```

#### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

#### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

#### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
