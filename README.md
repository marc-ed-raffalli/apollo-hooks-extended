# Apollo Hooks Extended

[![Build Status](https://travis-ci.org/marc-ed-raffalli/apollo-hooks-extended.svg?branch=master)](https://travis-ci.org/marc-ed-raffalli/apollo-hooks-extended)
[![Coverage Status](https://coveralls.io/repos/github/marc-ed-raffalli/apollo-hooks-extended/badge.svg?branch=master)](https://coveralls.io/github/marc-ed-raffalli/apollo-hooks-extended?branch=master)
[![NPM version](https://img.shields.io/npm/v/apollo-hooks-extended.svg)](https://www.npmjs.com/package/apollo-hooks-extended)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/marc-ed-raffalli/apollo-hooks-extended/blob/master/LICENSE)

Let's start with big kudos for the authors and maintainers of Apollo, fantastic work :)

This package is a complementary library providing additional features for
[@apollo/client](https://www.apollographql.com/docs/react/).

## Installation

**Using Yarn**:

```bash
$ yarn add apollo-hooks-extended

# or
$ yarn add apollo-hooks-extended
```

**Using Npm**:

```bash
$ npm install apollo-hooks-extended

# or
$ npm i apollo-hooks-extended
```

## Features

### Resettable Hook

It is not currently possible to reset the state returned by the
[useMutation](https://www.apollographql.com/docs/react/data/mutations/#usemutation-api) hook.

`useResettableMutation` is a swap in replacement which wraps `useMutation` and provides a `reset` function.

```typescript
import {useResettableMutation} from 'apollo-hooks-extended';
// ...
const [performMutation, {data, loading, error, reset}] = useResettableMutation(query);
```
