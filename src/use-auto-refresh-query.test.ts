import {ApolloClient, ApolloError, gql} from '@apollo/client';
import {renderHook} from '@testing-library/react-hooks';
import {GraphQLError} from 'graphql';
import {IRefreshTracker} from './models';
import {useAutoRefreshQuery} from './use-auto-refresh-query';

const GET_TODO = gql`
  query GetTodos {
    getTodos {
      id
      type
    }
  }
`;

describe('Auto Refresh Query', function () {
  let client: ApolloClient<any>, onCompleted: jest.Mock, onError: jest.Mock;

  beforeEach(() => {
    onCompleted = jest.fn();
    onError = jest.fn();
    client = ({query: jest.fn()} as unknown) as ApolloClient<any>;
  });

  describe('Success path', function () {
    let expectedData: any;

    beforeEach(() => {
      expectedData = {todos: [{id: 123, type: 'Foo'}]};
    });

    it('sends query immediately', async () => {
      let resolve: any = undefined;

      // defer resolving the Promise to allow time to test loading state
      (client.query as jest.Mock).mockReturnValue(new Promise((res) => (resolve = res)));

      const {result, waitForNextUpdate} = renderHook(() =>
        useAutoRefreshQuery(GET_TODO, {client, onCompleted, onError})
      );

      expect(client.query).toHaveBeenCalledWith({
        query: GET_TODO,
        fetchPolicy: 'cache-first',
        onCompleted,
        onError
      });
      expect(result.current).toMatchObject({data: undefined, loading: true, error: undefined});

      resolve({data: expectedData});
      await waitForNextUpdate();

      expect(result.current).toMatchObject({data: expectedData, loading: false, error: undefined});
    });

    describe('Refresh', function () {
      let refresh: IRefreshTracker;

      beforeEach(() => {
        refresh = {hard: 0, soft: 0};
        (client.query as jest.Mock).mockResolvedValue({data: expectedData});
      });

      it('re-send query on refresh update - network', async () => {
        const {waitForNextUpdate, rerender} = renderHook(() =>
          useAutoRefreshQuery(GET_TODO, {client, refresh})
        );

        expect(client.query).toHaveBeenLastCalledWith(
          expect.objectContaining({
            query: GET_TODO,
            fetchPolicy: 'cache-first'
          })
        );

        refresh.hard = Date.now();
        rerender();

        await waitForNextUpdate();
        expect(client.query).toHaveBeenCalledTimes(2);
        expect(client.query).toHaveBeenLastCalledWith(
          expect.objectContaining({
            query: GET_TODO,
            fetchPolicy: 'network-only'
          })
        );
      });

      it('re-send query on refresh update - cache', async () => {
        const {waitForNextUpdate, rerender} = renderHook(() =>
          useAutoRefreshQuery(GET_TODO, {client, refresh})
        );

        expect(client.query).toHaveBeenLastCalledWith(
          expect.objectContaining({
            query: GET_TODO,
            fetchPolicy: 'cache-first'
          })
        );

        refresh.soft = Date.now();
        rerender();

        await waitForNextUpdate();
        expect(client.query).toHaveBeenCalledTimes(2);
        expect(client.query).toHaveBeenLastCalledWith(
          expect.objectContaining({
            query: GET_TODO,
            fetchPolicy: 'cache-first'
          })
        );
      });
    });
  });

  describe('Error path', function () {
    it('sends query immediately', async () => {
      const expectedError = new ApolloError({
        graphQLErrors: [new GraphQLError('Foo'), new GraphQLError('Bar')]
      });

      (client.query as jest.Mock).mockRejectedValue(expectedError);

      const {result, waitForNextUpdate} = renderHook(() =>
        useAutoRefreshQuery(GET_TODO, {client, onCompleted, onError})
      );

      await waitForNextUpdate();

      expect(result.current).toMatchObject({data: undefined, loading: false, error: expectedError});
    });
  });
});
