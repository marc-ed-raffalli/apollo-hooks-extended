import * as apollo from '@apollo/client';

module.exports = {
  ...apollo,
  useApolloClient: jest.fn(),
  useLazyQuery: jest.fn(),
  useMutation: jest.fn()
};
