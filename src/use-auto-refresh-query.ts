import {ApolloClient, QueryHookOptions} from '@apollo/client';
import {DocumentNode} from 'graphql';
import {useState} from 'react';
import {IRefreshTracker, IRequestState} from './models';
import {useActiveEffect} from './utils/use-active-effect';

interface IUseAutoQueryState<TData> extends IRequestState<TData> {
  dateUpdated: number;
}

export function useAutoRefreshQuery<TData = any, TVariables = any>(
  query: DocumentNode,
  {
    client,
    refresh,
    ...props
  }: QueryHookOptions<TData, TVariables> & {
    client: ApolloClient<any>;
    refresh?: Partial<IRefreshTracker>;
  }
): {data?: TData; loading: boolean; error?: Error} {
  const [state, setState] = useState<IUseAutoQueryState<TData>>({
      loading: true,
      data: undefined,
      dateUpdated: 0
    }),
    serializedQueryVariables = JSON.stringify(props.variables);

  useActiveEffect(
    async (status) => {
      function setStateWhenActive(partialState: Partial<IUseAutoQueryState<TData>>) {
        if (!status.active) {
          return;
        }

        setState((latestState) => ({
          ...latestState,
          ...partialState,
          loading: false,
          dateUpdated: Date.now()
        }));
      }

      try {
        const fetchPolicy =
          refresh?.hard && state.dateUpdated < refresh.hard ? 'network-only' : 'cache-first';

        setState((latestState) => ({...latestState, loading: true}));

        const {data} = await client.query({...props, query, fetchPolicy});

        setStateWhenActive({data, error: undefined});
      } catch (error) {
        setStateWhenActive({error, data: undefined});
      }
    },
    [serializedQueryVariables, refresh?.hard, refresh?.soft]
  );

  return {data: state.data, loading: state.loading, error: state.error};
}
