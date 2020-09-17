import {
  ApolloClient,
  ApolloError,
  DocumentNode,
  gql,
  InMemoryCache,
  useMutation
} from '@apollo/client';
import {MutationHookOptions} from '@apollo/client/react/types/types';
import {act, renderHook} from '@testing-library/react-hooks';
import {GraphQLError} from 'graphql';
import {useResettableMutation} from './use-resettable-mutation';

type HookReturnType = ReturnType<typeof useResettableMutation>;

const ADD_TODO = gql`
  mutation AddTodo($type: String!) {
    addTodo(type: $type) {
      id
      type
    }
  }
`;

describe('Resettable Mutation', () => {
  const type = 'mock todo';
  let client: ApolloClient<any>,
    defaultHookReturn: HookReturnType[1],
    mutate: jest.Mock,
    onCompleted: jest.Mock,
    onError: jest.Mock;

  beforeEach(() => {
    mutate = jest.fn();
    onCompleted = jest.fn();
    onError = jest.fn();

    client = new ApolloClient<any>({cache: new InMemoryCache({})});

    defaultHookReturn = {
      data: undefined,
      loading: false,
      called: false,
      error: undefined,
      client,
      reset: expect.any(Function)
    };

    (useMutation as jest.Mock).mockImplementation(
      (query: DocumentNode, options: MutationHookOptions<any, any>) => {
        return [mutate, {client: options.client}];
      }
    );
  });

  describe('Success path', () => {
    it('onCompleted', async () => {
      const {result, waitForNextUpdate} = renderHook(() =>
        useResettableMutation(ADD_TODO, {client, onCompleted, onError})
      );

      expect(result.current).toMatchObject([
        expect.any(Function),
        expect.objectContaining<HookReturnType[1]>(defaultHookReturn)
      ]);

      let resolve: any = undefined,
        mutationReturnedPromise: any = undefined;

      // defer resolving the Promise to allow time to test loading state
      mutate.mockReturnValue(new Promise((res) => (resolve = res)));

      act(() => {
        mutationReturnedPromise = result.current[0]({variables: {type}});
      });

      // verify loading state
      expect(result.current[1]).toMatchObject({...defaultHookReturn, called: true, loading: true});

      resolve({data: {addTodo: {id: 'new-id', type}}});

      await waitForNextUpdate();

      const expectedData = {addTodo: {id: 'new-id', type}};

      // verify state after response
      expect(result.current[1]).toMatchObject({
        ...defaultHookReturn,
        called: true,
        loading: false,
        data: expectedData,
        error: undefined
      });

      await expect(mutationReturnedPromise).resolves.toEqual({data: expectedData});
      expect(onCompleted).toHaveBeenCalledWith(expectedData);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Error path', () => {
    it('onError', async () => {
      const {result, waitForNextUpdate} = renderHook(() =>
        useResettableMutation(ADD_TODO, {client, onCompleted, onError})
      );

      expect(result.current).toMatchObject([
        expect.any(Function),
        expect.objectContaining<HookReturnType[1]>(defaultHookReturn)
      ]);

      let reject: any = undefined,
        mutationReturnedPromise: any = undefined;

      // defer rejecting the Promise to allow time to test loading state
      mutate.mockReturnValue(new Promise((_, rej) => (reject = rej)));

      act(() => {
        mutationReturnedPromise = result.current[0]({variables: {type}});
      });

      // verify loading state
      expect(result.current[1]).toMatchObject({...defaultHookReturn, called: true, loading: true});

      const error = new ApolloError({
        graphQLErrors: [new GraphQLError('Foo'), new GraphQLError('Bar')]
      });

      reject(error);

      await waitForNextUpdate();

      // verify state after response
      expect(result.current[1]).toMatchObject({
        ...defaultHookReturn,
        called: true,
        loading: false,
        data: undefined,
        error: error
      });

      // resolved value contains the errors
      await expect(mutationReturnedPromise).resolves.toEqual(error);
      expect(onCompleted).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.objectContaining(error));
    });
  });

  it('reset', async () => {
    const {result, waitForNextUpdate} = renderHook(() =>
      useResettableMutation(ADD_TODO, {client, onCompleted, onError})
    );

    mutate.mockResolvedValue({data: {addTodo: {id: 'new-id', type}}});

    act(() => {
      result.current[0]({variables: {type}});
    });

    await waitForNextUpdate();

    // sanity check, the state is already defined
    const expectedData = {addTodo: {id: 'new-id', type}};
    expect(result.current[1]).toMatchObject({
      ...defaultHookReturn,
      called: true,
      loading: false,
      data: expectedData
    });

    act(() => {
      result.current[1].reset();
    });

    expect(result.current[1]).toMatchObject(defaultHookReturn);
  });
});
