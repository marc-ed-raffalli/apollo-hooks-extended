import {FetchResult, MutationResult, MutationTuple, useMutation} from '@apollo/client';
import {MutationHookOptions} from '@apollo/client/react/types/types';
import {DocumentNode} from 'graphql';
import {useState} from 'react';

type IResettableMutationState<TData = any> = Pick<
  MutationResult<TData>,
  'data' | 'called' | 'loading' | 'error'
>;

export function useResettableMutation<TData = any, TVariables = any>(
  query: DocumentNode,
  options: MutationHookOptions<TData, TVariables> = {}
): [MutationTuple<TData, TVariables>[0], MutationResult<TData> & {reset: () => void}] {
  const [{loading, data, error, called}, setState] = useState<IResettableMutationState>({
      called: false,
      loading: false
    }),
    reset = () => {
      setState({data: undefined, loading: false, called: false, error: undefined});
    };

  const [mutate, {client}] = useMutation<TData, TVariables>(query, {
      ...options,
      onCompleted: undefined,
      onError: undefined
    }),
    mutateWrapper = async (
      opts: Parameters<MutationTuple<TData, TVariables>[0]>[0]
    ): Promise<FetchResult<TData>> => {
      try {
        setState({data: undefined, loading: true, called: true, error: undefined});

        const response = await mutate(opts);

        setState({data: response.data, loading: false, called: true, error: undefined});
        options.onCompleted && options.onCompleted(response.data as TData);
        return response;
      } catch (err) {
        setState({data: undefined, loading: false, called: true, error: err});
        options.onError && options.onError(err);

        // returned value contains the errors
        return err;
      }
    };

  return [mutateWrapper, {data, loading, error, called, client, reset}];
}
