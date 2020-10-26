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

As noted in the `useMutation` API, the apollo `client` should be either provided in the hook options:

```typescript
import {useResettableMutation} from 'apollo-hooks-extended';
// ...
const [performMutation, {data, loading, error, reset}] = useResettableMutation(query, {
  client: clientInstance
});
```

or via the context API:

```tsx
import {useResettableMutation} from 'apollo-hooks-extended';
import {ApolloProvider} from '@apollo/client';

function App() {
  return (
    <ApolloProvider client={clientInstance}>
      <MutationComp />
    </ApolloProvider>
  );
}

function MutationComp() {
  const [login, {data, loading, error, reset}] = useResettableMutation(query);
  // ...
}
```

### Auto Refresh Query (beta)

_since 0.2.0_

This feature allows loading and triggering a refresh of the query with a simple timestamp.
Based on the parameters provided, the query will either use the `cache-first` or the `network-only` fetch policy.

```tsx
import {IRefreshTracker, useAutoRefreshQuery} from 'apollo-hooks-extended';

function GetTodos({refresh}: {refresh: IRefreshTracker}) {
  const {data, loading, error} = useAutoRefreshQuery(queryStatus, {client: authClient, refresh});

  return (
    <div>
      <div>
        Data: <pre>{JSON.stringify(data)}</pre>
      </div>
      <div>Loading: {loading}</div>
      <div>Error: {error}</div>
    </div>
  );
}

function RefreshExample() {
  // the timestamp set on hard and soft is compared to the timespamp of the last response.
  const [refresh, setRefresh] = useState({hard: 0, soft: 0}),
    triggerHardRefresh = useCallback(
      () => setRefresh((latestState) => ({...latestState, hard: Date.now()})),
      [setRefresh]
    ),
    triggerSoftRefresh = useCallback(
      () => setRefresh((latestState) => ({...latestState, soft: Date.now()})),
      [setRefresh]
    );

  return (
    <div>
      <button onClick={triggerHardRefresh}>Hard refresh</button>
      <button onClick={triggerSoftRefresh}>Soft refresh</button>
      <GetTodos refresh={refresh} />
    </div>
  );
}
```
