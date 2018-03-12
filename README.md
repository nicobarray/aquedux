# <img src='https://user-images.githubusercontent.com/4137761/37289440-f7a26b68-2609-11e8-8c23-fb8b49c53c90.png' height='60'>
> Aquedux over the wire


[![CI Status](https://circleci.com/gh/Winamax/aquedux.svg?style=shield)](https://circleci.com/gh/Winamax/aquedux)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

To synchronise a React app, you would either use a REST or GraphQL API. It means that you have to handle the hassle to transform your Redux action into understandable payloads for the server API to comprehend. Moreover, when the server API sends its response back, you have to translate the payload into a Redux action and dispatch it. No one should
have to do that.

With Aquedux, you simply share the reducer code across the client and
the server app, describe how Redux actions are listening to and "Voila!".

It makes writing client(s)/server applications easy without adding another layer by leveraging the elegant design of Redux.

# Installation

```sh
// node server side
yarn add aquedux-server
// or browser side
yarn add aquedux-client
```

You are good to go!

# Usage

TODO: Coming soon.

# Todo

* [ ] Complete this readme with a `Usage` section
* [ ] Add examples to the examples/ folder

# Authors

* Nicolas Barray ([@nek0las](https://github.com/nbarray)) -
[Winamax](https://www.winamax.fr/)
* CHaBou ([@chabou](https://github.com/chabou)) -
[Winamax](https://www.wiamax.fr/)
