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
    contextClient: ApolloClient<any>,
    defaultHookReturn: HookReturnType[1],
    mutate: jest.Mock,
    onCompleted: jest.Mock,
    onError: jest.Mock,
    expectedData: any;

  beforeEach(() => {
    mutate = jest.fn();
    onCompleted = jest.fn();
    onError = jest.fn();

    client = new ApolloClient<any>({cache: new InMemoryCache({})});
    contextClient = new ApolloClient<any>({cache: new InMemoryCache({})});

    expectedData = {addTodo: {id: 'new-id', type}};

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

    it('optional "option"', async () => {
      (useMutation as jest.Mock).mockImplementation(() => [mutate, {client: contextClient}]);

      const {result, waitForNextUpdate} = renderHook(() => useResettableMutation(ADD_TODO));

      expect(result.current).toMatchObject([
        expect.any(Function),
        expect.objectContaining<HookReturnType[1]>({...defaultHookReturn, client: contextClient})
      ]);

      mutate.mockResolvedValue({data: expectedData});

      // call mutation to test the wrapper's callbacks are not called
      act(() => {
        result.current[0]({variables: {type}});
      });

      await waitForNextUpdate();

      expect(result.current[1]).toMatchObject({
        ...defaultHookReturn,
        client: contextClient,
        called: true,
        loading: false,
        data: expectedData,
        error: undefined
      });
    });
  });

  describe('Error path', () => {
    let expectedError: ApolloError;

    beforeEach(() => {
      expectedError = new ApolloError({
        graphQLErrors: [new GraphQLError('Foo'), new GraphQLError('Bar')]
      });
    });

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

      reject(expectedError);

      await waitForNextUpdate();

      // verify state after response
      expect(result.current[1]).toMatchObject({
        ...defaultHookReturn,
        called: true,
        loading: false,
        data: undefined,
        error: expectedError
      });

      // resolved value contains the errors
      await expect(mutationReturnedPromise).resolves.toEqual(expectedError);
      expect(onCompleted).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.objectContaining(expectedError));
    });

    it('optional "option"', async () => {
      (useMutation as jest.Mock).mockImplementation(() => [mutate, {client: contextClient}]);

      const {result, waitForNextUpdate} = renderHook(() => useResettableMutation(ADD_TODO));

      mutate.mockRejectedValue(expectedError);

      // call mutation to test the wrapper's callbacks are not called
      act(() => {
        result.current[0]({variables: {type}});
      });

      await waitForNextUpdate();

      expect(result.current[1]).toMatchObject({
        ...defaultHookReturn,
        client: contextClient,
        called: true,
        loading: false,
        data: undefined,
        error: expectedError
      });
    });
  });

  it('reset', async () => {
    const {result, waitForNextUpdate} = renderHook(() =>
      useResettableMutation(ADD_TODO, {client, onCompleted, onError})
    );

    mutate.mockResolvedValue({data: expectedData});

    act(() => {
      result.current[0]({variables: {type}});
    });

    await waitForNextUpdate();

    // sanity check, the state is already defined
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
